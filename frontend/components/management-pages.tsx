'use client'

import { useMemo, useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { ChartLegend, FinanceChart } from '@/components/finance-chart'
import { NotesPage, PROPERTY_STATUS, ResourcePage } from '@/components/resources'
import { useAuth } from '@/lib/auth'
import { monthlySeries, useAppData } from '@/lib/dashboard'
import { brl } from '@/lib/format'

type PageKey = 'Imóveis' | 'Clientes' | 'Contratos' | 'Serviços' | 'Notas' | 'Relatórios' | 'Configurações'

const pageMeta: Record<PageKey, { subtitle: string; action: string }> = {
  Imóveis: { subtitle: 'Gerencie os imóveis cadastrados no seu portfólio.', action: 'Novo imóvel' },
  Clientes: { subtitle: 'Acompanhe seus clientes, contatos e vínculos ativos.', action: 'Novo cliente' },
  Contratos: { subtitle: 'Controle contratos, vencimentos e valores recorrentes.', action: 'Novo contrato' },
  Serviços: { subtitle: 'Organize manutenções e solicitações dos seus imóveis.', action: 'Novo serviço' },
  Notas: { subtitle: 'Registre observações importantes da sua operação.', action: 'Nova nota' },
  Relatórios: { subtitle: 'Receitas e despesas calculadas a partir dos seus contratos e serviços.', action: 'Exportar relatório' },
  Configurações: { subtitle: 'Informações da sua conta.', action: '' },
}

function PageHeading({ page }: { page: PageKey }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">LocTis <span>/</span> {page}</div>
      <h1 className="font-serif text-3xl tracking-tight text-white sm:text-[34px]">{page}</h1>
      <p className="mt-2 text-sm text-slate-500">{pageMeta[page].subtitle}</p>
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = { available: '#635bff', rented: '#63b6a4', maintenance: '#d4a72c', inactive: '#686f83' }

type PeriodKey = '6' | '12' | 'year'
const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Últimos 12 meses' },
  { value: 'year', label: 'Este ano' },
]

const selectClass = 'h-9 rounded-lg border border-white/10 bg-[#10132a] px-3 text-xs text-slate-300 outline-none focus:border-[#d4a72c]'

// Relatórios: tudo calculado dos seus contratos e serviços (o backend ainda não tem pagamentos).
// Receita = valor mensal dos contratos (ativos, vencidos ou encerrados) que cobrem o mês.
// Despesas = serviços (exceto cancelados) lançados no mês.
function ReportsPage() {
  const { data, error } = useAppData(true)
  const [period, setPeriod] = useState<PeriodKey>('6')
  const [propertyId, setPropertyId] = useState('')

  const pid = propertyId ? Number(propertyId) : undefined
  const months = period === 'year' ? new Date().getMonth() + 1 : Number(period)
  const series = useMemo(() => monthlySeries(data, months, pid), [data, months, pid])

  const revenue = series.reduce((sum, p) => sum + p.revenue, 0)
  const expenses = series.reduce((sum, p) => sum + p.expenses, 0)
  const activeContracts = data?.contracts.filter(c => c.status === 'active' && (!pid || c.property_id === pid)).length ?? 0
  const openServicesValue =
    data?.services.filter(s => (s.status === 'pending' || s.status === 'in_progress') && (!pid || s.property_id === pid)).reduce((sum, s) => sum + s.value, 0) ?? 0

  const statusCounts = PROPERTY_STATUS.map(s => ({ ...s, count: data?.properties.filter(p => p.status === s.value).length ?? 0 }))
  const totalProps = statusCounts.reduce((sum, s) => sum + s.count, 0)
  let acc = 0
  const donut = statusCounts
    .filter(s => s.count > 0)
    .map(s => {
      const from = (acc / totalProps) * 100
      acc += s.count
      return `${STATUS_COLOR[s.value]} ${from}% ${(acc / totalProps) * 100}%`
    })
    .join(', ')

  const exportCsv = () => {
    const money = (n: number) => n.toFixed(2).replace('.', ',')
    const rows = [['Mês', 'Receita contratada', 'Despesas com serviços', 'Resultado'], ...series.map(p => [p.label, money(p.revenue), money(p.expenses), money(p.revenue - p.expenses)])]
    const csv = '﻿' + rows.map(r => r.join(';')).join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'relatorio-loctis.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const cards: [string, string][] = [
    ['Receita contratada', brl(revenue)],
    ['Despesas com serviços', brl(expenses)],
    ['Resultado estimado', brl(revenue - expenses)],
    ['Serviços em aberto', brl(openServicesValue)],
    ['Contratos ativos', String(activeContracts)],
  ]

  return (
    <>
      <PageHeading page="Relatórios" />
      {error && <p role="alert" className="mb-4 rounded-lg border border-[#bd6870]/30 bg-[#bd6870]/10 px-4 py-3 text-xs text-[#e29aa1]">{error}</p>}
      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-white/[0.07] bg-[#0b0e22] p-4">
        <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className={selectClass} aria-label="Período">
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className={`${selectClass} max-w-64`} aria-label="Imóvel">
          <option value="">Todos os imóveis</option>
          {data?.properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
        </select>
        <button onClick={exportCsv} disabled={!data} className="ml-auto flex items-center gap-2 rounded-lg border border-[#d4a72c]/30 px-3 text-xs text-[#e5be55] hover:bg-[#d4a72c]/10 disabled:opacity-40">
          <ArrowDownToLine className="size-3.5" />Exportar CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="loctis-card rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5">
            <p className="text-xs text-[#d4a72c]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{data ? value : '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-white/[0.07] bg-[#0b0e22] p-6">
          <h2 className="text-sm font-medium text-[#d4a72c]">Receitas x despesas</h2>
          <p className="mt-1 text-xs text-slate-600">Receita contratada por mês e serviços lançados no mês</p>
          <FinanceChart series={series} />
          <ChartLegend />
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#0b0e22] p-6">
          <h2 className="text-sm font-medium text-[#d4a72c]">Imóveis por status</h2>
          {totalProps === 0 ? (
            <p className="mt-8 text-center text-xs text-slate-600">Você ainda não tem imóveis cadastrados.</p>
          ) : (
            <>
              <div className="mx-auto mt-6 flex size-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(${donut})` }}>
                <div className="flex size-24 flex-col items-center justify-center rounded-full bg-[#0b0e22] text-center">
                  <span className="text-xl font-semibold text-white">{totalProps}</span>
                  <span className="text-[10px] text-slate-500">{totalProps === 1 ? 'imóvel' : 'imóveis'}</span>
                </div>
              </div>
              <ul className="mt-6 grid gap-2 text-xs text-slate-400">
                {statusCounts.map(s => (
                  <li key={s.value} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><i className="size-2 rounded-full" style={{ background: STATUS_COLOR[s.value] }} />{s.label}</span>
                    <span>{s.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Configurações: nome e e-mail vêm da conta (somente leitura: o backend não tem rota de edição).
function SettingsPage() {
  const { user } = useAuth()
  const field = 'h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#d4a72c] focus:ring-2 focus:ring-[#d4a72c]/10'
  return (
    <>
      <PageHeading page="Configurações" />
      <div className="max-w-3xl rounded-xl border border-white/[0.07] bg-[#0b0e22] p-6">
        <div className="border-b border-white/[0.07] pb-5">
          <h2 className="text-sm font-medium text-[#d4a72c]">Perfil</h2>
          <p className="mt-1 text-xs text-slate-600">Informações da sua conta LocTis. A edição ainda não está disponível.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-slate-400">Nome<input readOnly value={user?.name ?? ''} className={field} /></label>
          <label className="flex flex-col gap-2 text-xs text-slate-400">E-mail<input readOnly value={user?.email ?? ''} className={field} /></label>
        </div>
      </div>
    </>
  )
}

export function ManagementPage({ page, initialStatus, resetKey = 0 }: { page: PageKey; initialStatus?: string; resetKey?: number }) {
  if (page === 'Notas') return <NotesPage />
  if (page === 'Relatórios') return <ReportsPage />
  if (page === 'Configurações') return <SettingsPage />
  return <ResourcePage key={`${page}-${initialStatus ?? ''}-${resetKey}`} page={page} initialStatus={initialStatus} />
}

export type { PageKey }
