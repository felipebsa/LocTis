'use client'

// lib/dashboard.ts — carrega TODOS os dados do locador uma vez e deriva dele o dashboard,
// a atividade recente, as notificações e os relatórios. Nada aqui é de exemplo:
// o backend só guarda created_at (sem histórico de eventos nem pagamentos), então
// "atividade" = datas de criação e "receita" = valor dos contratos que cobrem aquele mês.

import { useEffect, useState } from 'react'
import { api, type Contract, type Note, type NoteEntityType, type Page } from '@/lib/api'
import { parseServerDate } from '@/lib/format'

export type Property = {
  id: number
  address: string
  cep: string
  kind: string
  status: 'available' | 'rented' | 'maintenance' | 'inactive'
  extra_data: Record<string, unknown> | null
  created_at: string
}
export type Client = { id: number; name: string; cpf: string; email: string | null; phone: string | null; created_at: string }
export type Service = {
  id: number
  property_id: number
  name: string
  description: string
  value: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
}

export type AppData = {
  properties: Property[]
  clients: Client[]
  contracts: Contract[]
  services: Service[]
  notes: Note[]
}

const PAGE_LIMIT = 100 // máximo aceito pelo backend
const MAX_PAGES = 50

async function fetchAll<T>(path: string): Promise<T[]> {
  const first = await api<Page<T>>(path, { query: { page: 1, limit: PAGE_LIMIT } })
  const items = [...first.items]
  const last = Math.min(first.page_max, MAX_PAGES)
  for (let page = 2; page <= last; page++) {
    items.push(...(await api<Page<T>>(path, { query: { page, limit: PAGE_LIMIT } })).items)
  }
  return items
}

// refreshKey: mude o valor para buscar de novo (ex.: ao trocar de página, para refletir o que foi criado)
export function useAppData(enabled: boolean, refreshKey: unknown = 0) {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let off = false
    Promise.all([
      fetchAll<Property>('/property/get/all'),
      fetchAll<Client>('/client/get/all'),
      fetchAll<Contract>('/contract/get/all'),
      fetchAll<Service>('/service/get/all'),
      fetchAll<Note>('/note/get/all'),
    ])
      .then(([properties, clients, contracts, services, notes]) => {
        if (off) return
        setData({ properties, clients, contracts, services, notes })
        setError(null)
      })
      .catch(e => !off && setError(e instanceof Error ? e.message : 'Erro inesperado'))
    return () => {
      off = true
    }
  }, [enabled, refreshKey])

  return { data, error }
}

// ---------- contagens e vencimentos ----------
const EXPIRING_WINDOW_DAYS = 60

export function summarize(data: AppData | null) {
  const activeContracts = data?.contracts.filter(c => c.status === 'active') ?? []
  const now = Date.now()
  const expiring = activeContracts
    .map(c => ({ id: c.id, end_date: c.end_date, daysLeft: Math.ceil((new Date(c.end_date).getTime() - now) / 86_400_000) }))
    .filter(c => c.daysLeft >= 0 && c.daysLeft <= EXPIRING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)
  return {
    properties: data?.properties.length ?? 0,
    clients: data?.clients.length ?? 0,
    activeContracts: activeContracts.length,
    pendingServices: data?.services.filter(s => s.status === 'pending').length ?? 0,
    monthlyRevenue: activeContracts.reduce((sum, c) => sum + c.value, 0),
    expiring,
  }
}

// ---------- atividade recente / notificações ----------
export type ActivityKind = 'property' | 'client' | 'contract' | 'service' | 'note'
export type Activity = { key: string; kind: ActivityKind; title: string; desc: string; at: Date }

const ENTITY_NAME: Record<NoteEntityType, string> = { property: 'Imóvel', client: 'Cliente', contract: 'Contrato', service: 'Serviço' }

export function buildActivity(data: AppData | null, limit = 30): Activity[] {
  if (!data) return []
  const prop = (id: number) => data.properties.find(p => p.id === id)?.address ?? `Imóvel #${id}`
  const client = (id: number) => data.clients.find(c => c.id === id)?.name ?? `Cliente #${id}`
  const items: Activity[] = [
    ...data.properties.map(p => ({ key: `p${p.id}`, kind: 'property' as const, title: 'Imóvel cadastrado', desc: p.address, at: parseServerDate(p.created_at) })),
    ...data.clients.map(c => ({ key: `c${c.id}`, kind: 'client' as const, title: 'Cliente adicionado', desc: c.name, at: parseServerDate(c.created_at) })),
    ...data.contracts.map(c => ({ key: `k${c.id}`, kind: 'contract' as const, title: `Contrato #${c.id} registrado`, desc: `${prop(c.property_id)} · ${client(c.client_id)}`, at: parseServerDate(c.created_at) })),
    ...data.services.map(s => ({ key: `s${s.id}`, kind: 'service' as const, title: 'Serviço registrado', desc: `${s.name} · ${prop(s.property_id)}`, at: parseServerDate(s.created_at) })),
    ...data.notes.map(n => ({ key: `n${n.id}`, kind: 'note' as const, title: 'Nota adicionada', desc: `${ENTITY_NAME[n.entity_type]} #${n.entity_id}`, at: parseServerDate(n.created_at) })),
  ]
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}

// ---------- financeiro ----------
export type MonthPoint = { key: string; label: string; revenue: number; expenses: number }

// Receita do mês = soma do valor mensal dos contratos (ativos, vencidos ou encerrados) cuja vigência cobre aquele mês.
// Despesa do mês = soma dos serviços (exceto cancelados) criados naquele mês.
export function monthlySeries(data: AppData | null, months: number, propertyId?: number): MonthPoint[] {
  if (!data) return []
  const today = new Date()
  const contracts = data.contracts.filter(c => c.status !== 'pending' && (!propertyId || c.property_id === propertyId))
  const services = data.services.filter(s => s.status !== 'cancelled' && (!propertyId || s.property_id === propertyId))
  const points: MonthPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
    const name = start.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
    points.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: months > 6 ? `${name}/${String(start.getFullYear()).slice(2)}` : name,
      revenue: contracts.filter(c => new Date(c.start_date) <= end && new Date(c.end_date) >= start).reduce((sum, c) => sum + c.value, 0),
      expenses: services
        .filter(s => {
          const d = parseServerDate(s.created_at)
          return d >= start && d <= end
        })
        .reduce((sum, s) => sum + s.value, 0),
    })
  }
  return points
}
