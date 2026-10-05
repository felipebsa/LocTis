'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Archive, ChevronDown, ChevronLeft, ChevronRight, Eye, FilePenLine, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { api, type Note, type NoteEntityType, type Page } from '@/lib/api'
import {
  brl,
  fmtDateTime,
  fmtDay,
  maskCep,
  maskCpf,
  maskDecimal,
  maskMoney,
  maskPhone,
  moneyToInput,
  onlyDigits,
  parseMoney,
} from '@/lib/format'

// ======================================================================
// Tipos e helpers
// ======================================================================
export type ResourcePageKey = 'Imóveis' | 'Clientes' | 'Contratos' | 'Serviços'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
type Option = { value: string; label: string }
type Values = Record<string, string>
type Lookups = { properties: Row[]; clients: Row[] }

type FieldDef = {
  key: string
  label: string
  type: 'text' | 'email' | 'money' | 'int' | 'decimal' | 'date' | 'select' | 'relation'
  required?: boolean
  optional?: boolean // select que aceita ficar "Não definido"
  options?: Option[]
  relation?: 'property' | 'client'
  wide?: boolean
  hint?: string
  placeholder?: string
  maxLength?: number
  mask?: 'cpf' | 'cep' | 'phone'
  min?: number // int: valor mínimo
  max?: number // int: valor máximo
  minFrom?: string // date: não pode ser antes do campo indicado
}

// Campos extras: o usuário preenche inputs normais e nós montamos o JSON de extra_data.
type ExtrasCfg = {
  title: string
  advanced: boolean // true = fica escondido atrás do botão "Opções avançadas"
  defsFor: (values: Values) => FieldDef[] // quais campos aparecem (ex.: depende do tipo do imóvel)
  allDefs: FieldDef[] // todas as chaves que conhecemos (para não apagar chaves desconhecidas ao salvar)
}

type ResourceDef = {
  path: NoteEntityType
  title: string
  subtitle: string
  newLabel: string
  fields: FieldDef[]
  extras?: ExtrasCfg
  statusOptions?: Option[] // habilita o filtro por status (?status=)
  searchParam?: string // habilita a busca por texto (?address= / ?name=)
  searchPlaceholder?: string
  card: (row: Row, lk: Lookups) => { title: string; subtitle: string; badge?: string; meta: [string, string][] }
  details: (row: Row, lk: Lookups) => [string, string][]
  toForm: (row: Row) => Values
  toPayload: (values: Values, original?: Row | null) => Record<string, unknown> // lança Error com a mensagem de validação
}

const PAGE_SIZE = 12

export const labelOf = (opts: Option[], value: string) => opts.find(o => o.value === value)?.label ?? value
const hideCpf = (cpf: string) => {
  const d = onlyDigits(cpf)
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado')
const fail = (message: string): never => {
  throw new Error(message)
}

export const KIND: Option[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'commercial_unit', label: 'Sala comercial' },
  { value: 'warehouse', label: 'Galpão' },
]
export const PROPERTY_STATUS: Option[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'rented', label: 'Alugado' },
  { value: 'maintenance', label: 'Em manutenção' },
  { value: 'inactive', label: 'Inativo' },
]
const CONTRACT_STATUS: Option[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'pending', label: 'Pendente' },
  { value: 'expired', label: 'Vencido' },
  { value: 'terminated', label: 'Encerrado' },
]
const SERVICE_STATUS: Option[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
]
export const ENTITY_LABEL: Record<NoteEntityType, string> = { property: 'Imóvel', client: 'Cliente', contract: 'Contrato', service: 'Serviço' }

const propLabel = (lk: Lookups, id: number) => lk.properties.find(p => p.id === id)?.address ?? `Imóvel #${id}`
const clientLabel = (lk: Lookups, id: number) => lk.clients.find(c => c.id === id)?.name ?? `Cliente #${id}`

// ----------------------------------------------------------------------
// Máscaras e conversões de campo
// ----------------------------------------------------------------------
function applyMask(f: FieldDef, value: string) {
  if (f.type === 'money') return maskMoney(value)
  if (f.type === 'int') return onlyDigits(value).slice(0, f.maxLength ?? 4)
  if (f.type === 'decimal') return maskDecimal(value)
  if (f.mask === 'cpf') return maskCpf(value)
  if (f.mask === 'cep') return maskCep(value)
  if (f.mask === 'phone') return maskPhone(value)
  return value
}

// ----------------------------------------------------------------------
// Campos extras (extra_data) — um conjunto de inputs por tipo de imóvel e um bloco "avançado" no contrato
// ----------------------------------------------------------------------
const KIND_EXTRAS: Record<string, FieldDef[]> = {
  apartment: [
    { key: 'numero', label: 'Número do apartamento', type: 'text', placeholder: '101', maxLength: 10 },
    { key: 'bloco', label: 'Bloco / torre', type: 'text', placeholder: 'A', maxLength: 10 },
    { key: 'andar', label: 'Andar', type: 'int', placeholder: '10', maxLength: 3 },
    { key: 'condominio', label: 'Condomínio (R$)', type: 'money', placeholder: '450,00' },
  ],
  house: [
    { key: 'numero', label: 'Número da casa', type: 'text', placeholder: '123', maxLength: 10 },
    { key: 'complemento', label: 'Complemento', type: 'text', placeholder: 'Fundos, casa 2', maxLength: 60 },
  ],
  commercial_unit: [
    { key: 'numero', label: 'Número da sala', type: 'text', placeholder: '502', maxLength: 10 },
    { key: 'andar', label: 'Andar', type: 'int', placeholder: '5', maxLength: 3 },
  ],
  warehouse: [
    { key: 'area_m2', label: 'Área (m²)', type: 'decimal', placeholder: '850' },
    { key: 'docas', label: 'Quantidade de docas', type: 'int', placeholder: '4', maxLength: 2 },
  ],
}
const PROPERTY_EXTRAS_ALL: FieldDef[] = Object.values(KIND_EXTRAS).flat()

const CONTRACT_EXTRAS: FieldDef[] = [
  { key: 'caucao', label: 'Caução (R$)', type: 'money', placeholder: '5.000,00' },
  { key: 'iptu', label: 'IPTU mensal (R$)', type: 'money', placeholder: '180,00' },
  { key: 'condominio', label: 'Condomínio (R$)', type: 'money', placeholder: '450,00' },
  { key: 'taxa_administracao', label: 'Taxa de administração (%)', type: 'decimal', placeholder: '8' },
  { key: 'dia_vencimento', label: 'Dia de vencimento do aluguel', type: 'int', placeholder: '10', maxLength: 2, min: 1, max: 31 },
  {
    key: 'indice_reajuste',
    label: 'Índice de reajuste',
    type: 'select',
    optional: true,
    options: ['IGP-M', 'IPCA', 'INPC'].map(v => ({ value: v, label: v })),
  },
]

function extrasToForm(extra: Row | null | undefined, defs: FieldDef[]): Values {
  const out: Values = {}
  for (const d of defs) {
    const v = extra?.[d.key]
    if (v === undefined || v === null) continue
    out[`x_${d.key}`] = d.type === 'money' ? moneyToInput(Number(v)) : d.type === 'decimal' ? String(v).replace('.', ',') : String(v)
  }
  return out
}

function buildExtra(values: Values, cfg: ExtrasCfg, original?: Row | null): Record<string, unknown> | null {
  const out: Record<string, unknown> = {}
  for (const d of cfg.defsFor(values)) {
    const raw = (values[`x_${d.key}`] ?? '').trim()
    if (!raw) continue
    if (d.type === 'money') {
      const n = parseMoney(raw)
      if (!Number.isFinite(n)) fail(`${d.label}: valor inválido`)
      out[d.key] = n
    } else if (d.type === 'int') {
      const n = Number(raw)
      if (d.min !== undefined && d.max !== undefined && (n < d.min || n > d.max)) fail(`${d.label}: use um valor entre ${d.min} e ${d.max}`)
      out[d.key] = n
    } else if (d.type === 'decimal') {
      const n = Number(raw.replace(',', '.'))
      if (!Number.isFinite(n)) fail(`${d.label}: valor inválido`)
      out[d.key] = n
    } else {
      out[d.key] = raw
    }
  }
  // chaves que nenhum formulário conhece (ex.: cadastradas antes) continuam intactas
  const known = new Set(cfg.allDefs.map(d => d.key))
  for (const [k, v] of Object.entries(original ?? {})) if (!known.has(k)) out[k] = v
  return Object.keys(out).length ? out : null
}

function describeExtras(extra: Row | null | undefined, cfg: ExtrasCfg | undefined, values: Values): [string, string][] {
  if (!cfg || !extra) return []
  const known = cfg.defsFor(values)
  const rows: [string, string][] = []
  for (const d of known) {
    const v = extra[d.key]
    if (v === undefined || v === null || v === '') continue
    rows.push([d.label, d.type === 'money' ? brl(Number(v)) : d.type === 'decimal' ? String(v).replace('.', ',') : String(v)])
  }
  const allKeys = new Set(cfg.allDefs.map(d => d.key))
  for (const [k, v] of Object.entries(extra)) if (!allKeys.has(k)) rows.push([k, String(v)])
  return rows
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ======================================================================
// Definição de cada recurso (o que muda entre Imóveis, Clientes etc.)
// ======================================================================
const RESOURCES: Record<ResourcePageKey, ResourceDef> = {
  Imóveis: {
    path: 'property',
    title: 'Imóveis',
    subtitle: 'Gerencie os imóveis cadastrados no seu portfólio.',
    newLabel: 'Novo imóvel',
    statusOptions: PROPERTY_STATUS,
    searchParam: 'address',
    searchPlaceholder: 'Buscar por endereço...',
    fields: [
      { key: 'address', label: 'Endereço', type: 'text', required: true, wide: true, placeholder: 'Rua das Flores, 123 - Centro, São Paulo/SP', maxLength: 200 },
      { key: 'cep', label: 'CEP', type: 'text', required: true, mask: 'cep', placeholder: '01001-000', maxLength: 9, hint: '8 dígitos' },
      { key: 'kind', label: 'Tipo', type: 'select', required: true, options: KIND },
      { key: 'status', label: 'Status', type: 'select', required: true, options: PROPERTY_STATUS },
    ],
    extras: {
      title: 'Detalhes do imóvel',
      advanced: false,
      defsFor: v => KIND_EXTRAS[v.kind] ?? [],
      allDefs: PROPERTY_EXTRAS_ALL,
    },
    card: r => ({
      title: r.address,
      subtitle: `CEP ${maskCep(r.cep)}`,
      badge: labelOf(PROPERTY_STATUS, r.status),
      meta: [['Tipo', labelOf(KIND, r.kind)], ['Cadastrado em', fmtDateTime(r.created_at).slice(0, 10)]],
    }),
    details: r => [
      ['Endereço', r.address],
      ['CEP', maskCep(r.cep)],
      ['Tipo', labelOf(KIND, r.kind)],
      ['Status', labelOf(PROPERTY_STATUS, r.status)],
    ],
    toForm: r => ({ address: r.address, cep: maskCep(r.cep), kind: r.kind, status: r.status }),
    toPayload: v => {
      const address = v.address.trim()
      if (address.length < 5) fail('Informe o endereço completo (rua, número e cidade).')
      if (onlyDigits(v.cep).length !== 8) fail('CEP deve ter 8 dígitos. Ex.: 01001-000')
      return { address, cep: onlyDigits(v.cep), kind: v.kind, status: v.status }
    },
  },

  Clientes: {
    path: 'client',
    title: 'Clientes',
    subtitle: 'Acompanhe seus clientes e contatos.',
    newLabel: 'Novo cliente',
    searchParam: 'name',
    searchPlaceholder: 'Buscar por nome...',
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true, wide: true, placeholder: 'Maria da Silva', maxLength: 120 },
      { key: 'cpf', label: 'CPF', type: 'text', required: true, mask: 'cpf', placeholder: '000.000.000-00', maxLength: 14, hint: '11 dígitos' },
      { key: 'phone', label: 'Telefone', type: 'text', mask: 'phone', placeholder: '(11) 99999-8888', maxLength: 15, hint: 'Opcional' },
      { key: 'email', label: 'E-mail', type: 'email', wide: true, placeholder: 'maria@email.com', maxLength: 120, hint: 'Opcional' },
    ],
    card: r => ({
      title: r.name,
      subtitle: r.email || (r.phone ? maskPhone(r.phone) : 'Sem contato cadastrado'),
      meta: [['CPF', hideCpf(r.cpf)], ['Telefone', r.phone ? maskPhone(r.phone) : '—']],
    }),
    details: r => [['Nome', r.name], ['CPF', hideCpf(r.cpf)], ['Telefone', r.phone ? maskPhone(r.phone) : '—'], ['E-mail', r.email || '—']],
    toForm: r => ({ name: r.name, cpf: maskCpf(r.cpf), phone: r.phone ? maskPhone(r.phone) : '', email: r.email ?? '' }),
    toPayload: v => {
      const name = v.name.trim()
      if (name.length < 2) fail('Informe o nome do cliente.')
      if (onlyDigits(v.cpf).length !== 11) fail('CPF deve ter 11 dígitos. Ex.: 123.456.789-00')
      const phone = onlyDigits(v.phone)
      if (phone && phone.length !== 10 && phone.length !== 11) fail('Telefone deve ter DDD + 8 ou 9 dígitos. Ex.: (11) 99999-8888')
      const email = v.email.trim()
      if (email && !EMAIL_RE.test(email)) fail('E-mail inválido. Ex.: maria@email.com')
      return { name, cpf: onlyDigits(v.cpf), phone: phone || null, email: email || null }
    },
  },

  Contratos: {
    path: 'contract',
    title: 'Contratos',
    subtitle: 'Controle contratos, vencimentos e valores.',
    newLabel: 'Novo contrato',
    statusOptions: CONTRACT_STATUS,
    fields: [
      { key: 'property_id', label: 'Imóvel', type: 'relation', relation: 'property', required: true, wide: true },
      { key: 'client_id', label: 'Cliente', type: 'relation', relation: 'client', required: true, wide: true },
      { key: 'value', label: 'Valor mensal (R$)', type: 'money', required: true, placeholder: '2.500,00' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: CONTRACT_STATUS },
      { key: 'start_date', label: 'Início', type: 'date', required: true },
      { key: 'end_date', label: 'Término', type: 'date', required: true, minFrom: 'start_date' },
    ],
    extras: {
      title: 'Opções avançadas',
      advanced: true,
      defsFor: () => CONTRACT_EXTRAS,
      allDefs: CONTRACT_EXTRAS,
    },
    card: (r, lk) => ({
      title: `Contrato #${r.id}`,
      subtitle: `${propLabel(lk, r.property_id)} · ${clientLabel(lk, r.client_id)}`,
      badge: labelOf(CONTRACT_STATUS, r.status),
      meta: [['Valor', brl(r.value)], ['Vigência', `${fmtDay(r.start_date)} → ${fmtDay(r.end_date)}`]],
    }),
    details: (r, lk) => [
      ['Imóvel', propLabel(lk, r.property_id)],
      ['Cliente', clientLabel(lk, r.client_id)],
      ['Valor', brl(r.value)],
      ['Status', labelOf(CONTRACT_STATUS, r.status)],
      ['Início', fmtDay(r.start_date)],
      ['Término', fmtDay(r.end_date)],
    ],
    toForm: r => ({
      property_id: String(r.property_id),
      client_id: String(r.client_id),
      value: moneyToInput(r.value),
      status: r.status,
      start_date: r.start_date.slice(0, 10),
      end_date: r.end_date.slice(0, 10),
    }),
    toPayload: v => {
      const value = parseMoney(v.value)
      if (!(value > 0)) fail('O valor mensal deve ser maior que zero.')
      if (v.end_date <= v.start_date) fail('A data de término deve ser depois da data de início.')
      return {
        property_id: Number(v.property_id),
        client_id: Number(v.client_id),
        value,
        status: v.status,
        start_date: `${v.start_date}T00:00:00`,
        end_date: `${v.end_date}T00:00:00`,
      }
    },
  },

  Serviços: {
    path: 'service',
    title: 'Serviços',
    subtitle: 'Organize manutenções e solicitações dos seus imóveis.',
    newLabel: 'Novo serviço',
    statusOptions: SERVICE_STATUS,
    fields: [
      { key: 'property_id', label: 'Imóvel', type: 'relation', relation: 'property', required: true, wide: true },
      { key: 'name', label: 'Serviço', type: 'text', required: true, wide: true, placeholder: 'Troca de fechadura', maxLength: 120 },
      { key: 'description', label: 'Descrição', type: 'text', required: true, wide: true, placeholder: 'Fechadura da porta principal com defeito', maxLength: 300 },
      { key: 'value', label: 'Valor (R$)', type: 'money', required: true, placeholder: '250,00' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: SERVICE_STATUS },
    ],
    card: (r, lk) => ({
      title: r.name,
      subtitle: propLabel(lk, r.property_id),
      badge: labelOf(SERVICE_STATUS, r.status),
      meta: [['Valor', brl(r.value)], ['Descrição', r.description]],
    }),
    details: (r, lk) => [
      ['Serviço', r.name],
      ['Imóvel', propLabel(lk, r.property_id)],
      ['Descrição', r.description],
      ['Valor', brl(r.value)],
      ['Status', labelOf(SERVICE_STATUS, r.status)],
    ],
    toForm: r => ({ property_id: String(r.property_id), name: r.name, description: r.description, value: moneyToInput(r.value), status: r.status }),
    toPayload: v => {
      const value = parseMoney(v.value)
      if (!(value > 0)) fail('O valor do serviço deve ser maior que zero.')
      return { property_id: Number(v.property_id), name: v.name.trim(), description: v.description.trim(), value, status: v.status }
    },
  },
}

// ======================================================================
// Peças visuais pequenas
// ======================================================================
const inputClass =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#d4a72c] focus:ring-2 focus:ring-[#d4a72c]/10'

function Heading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">LocTis <span>/</span> {title}</div>
        <h1 className="font-serif text-3xl tracking-tight text-white sm:text-[34px]">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action && (
        <button onClick={onAction} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5146d8] px-4 text-xs font-semibold text-white shadow-lg shadow-[#5146d8]/30 transition hover:bg-[#635bff]">
          <Plus className="size-4" />
          {action}
        </button>
      )}
    </div>
  )
}

function Badge({ label }: { label: string }) {
  const good = ['Ativo', 'Alugado', 'Concluído'].includes(label)
  const warn = ['Pendente', 'Em manutenção', 'Vencido'].includes(label)
  const tone = good
    ? 'border-teal-400/20 bg-teal-400/10 text-teal-300'
    : warn
      ? 'border-[#d4a72c]/20 bg-[#d4a72c]/10 text-[#e5be55]'
      : 'border-[#635bff]/20 bg-[#635bff]/10 text-[#bdb8ff]'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${tone}`}>{label}</span>
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-4 rounded-lg border border-[#bd6870]/30 bg-[#bd6870]/10 px-4 py-3 text-xs text-[#e29aa1]">
      {message}
    </p>
  )
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.015] text-center">
      <Archive className="size-6 text-slate-600" />
      <p className="text-sm text-slate-300">{title}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex min-h-44 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-slate-500" />
    </div>
  )
}

function Pager({ data, onPage }: { data: Page<unknown>; onPage: (n: number) => void }) {
  return (
    <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
      <span>{data.total} {data.total === 1 ? 'registro' : 'registros'}</span>
      <div className="flex items-center gap-3">
        <button disabled={data.page_atual <= 1} onClick={() => onPage(data.page_atual - 1)} className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30" aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </button>
        <span>Página {data.page_atual} de {data.page_max}</span>
        <button disabled={data.page_atual >= data.page_max} onClick={() => onPage(data.page_atual + 1)} className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30" aria-label="Próxima página">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 pt-24 backdrop-blur-md" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0e22] shadow-[0_24px_90px_rgba(0,0,0,.55)]">
        <div className="flex items-start justify-between border-b border-white/[0.07] px-6 py-5">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Fechar"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ======================================================================
// Dados auxiliares: imóveis e clientes (para mostrar nomes e preencher selects)
// ======================================================================
function useLookups(): Lookups {
  const [lk, setLk] = useState<Lookups>({ properties: [], clients: [] })
  useEffect(() => {
    let off = false
    Promise.all([
      api<Page<Row>>('/property/get/all', { query: { limit: 100 } }),
      api<Page<Row>>('/client/get/all', { query: { limit: 100 } }),
    ])
      .then(([p, c]) => !off && setLk({ properties: p.items, clients: c.items }))
      .catch(() => {})
    return () => {
      off = true
    }
  }, [])
  return lk
}

// ======================================================================
// Notas
// ======================================================================
function NoteItem({ note, onChanged, showEntity }: { note: Note; onChanged: () => void; showEntity?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!draft.trim()) return
    try {
      await api(`/note/update/put/${note.id}`, { method: 'PUT', json: { content: draft.trim() } })
      setEditing(false)
      onChanged()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  async function remove() {
    if (!window.confirm('Excluir esta nota?')) return
    try {
      await api(`/note/delete/${note.id}`, { method: 'DELETE' })
      onChanged()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      {showEntity && <p className="mb-2 text-[10px] text-[#d4a72c]">{ENTITY_LABEL[note.entity_type]} #{note.entity_id}</p>}
      {editing ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} className="min-h-20 w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white outline-none focus:border-[#d4a72c]" />
      ) : (
        <p className="whitespace-pre-wrap text-xs leading-5 text-slate-300">{note.content}</p>
      )}
      {error && <p className="mt-2 text-[11px] text-[#e29aa1]">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">{fmtDateTime(note.created_at)}</span>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setDraft(note.content) }} className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-white/5">Cancelar</button>
              <button onClick={save} className="rounded-md px-2 py-1 text-[11px] text-[#8d87ff] hover:bg-white/5">Salvar</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 text-slate-500 hover:text-[#635bff]" aria-label="Editar nota"><FilePenLine className="size-3.5" /></button>
              <button onClick={remove} className="p-1.5 text-slate-500 hover:text-[#d86c77]" aria-label="Excluir nota"><Trash2 className="size-3.5" /></button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function RecordNotes({ type, id }: { type: NoteEntityType; id: number }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api<Page<Note>>(`/note/get/entity/${type}/${id}`, { query: { limit: 100 } })
      .then(r => setNotes(r.items))
      .catch(e => setError(errMsg(e)))
  }, [type, id])
  useEffect(load, [load])

  async function add() {
    if (!draft.trim()) return
    try {
      await api('/note/register', { method: 'POST', json: { entity_type: type, entity_id: id, content: draft.trim() } })
      setDraft('')
      setError(null)
      load()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  return (
    <div className="border-t border-white/[0.07] px-6 py-5">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d4a72c]">Notas</p>
      <div className="flex flex-col gap-3">
        {notes.length === 0 && <p className="text-xs text-slate-600">Nenhuma nota ainda.</p>}
        {notes.map(n => <NoteItem key={n.id} note={n} onChanged={load} />)}
      </div>
      {error && <p className="mt-3 text-[11px] text-[#e29aa1]">{error}</p>}
      <div className="mt-4 flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Escreva uma nota..." className={inputClass} />
        <button onClick={add} className="shrink-0 rounded-lg bg-[#5146d8] px-4 text-xs font-semibold text-white hover:bg-[#635bff]">Adicionar</button>
      </div>
    </div>
  )
}

export function NotesPage() {
  const [type, setType] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [data, setData] = useState<Page<Note> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let off = false
    api<Page<Note>>('/note/get/all', { query: { page: pageNum, limit: PAGE_SIZE, entity_type: type || undefined } })
      .then(res => {
        if (off) return
        if (res.items.length === 0 && pageNum > 1) return setPageNum(pageNum - 1)
        setData(res)
        setError(null)
      })
      .catch(e => !off && setError(errMsg(e)))
    return () => {
      off = true
    }
  }, [type, pageNum, reload])

  return (
    <>
      <Heading title="Notas" subtitle="Observações registradas nos seus imóveis, clientes, contratos e serviços." />
      <p className="mb-5 text-xs text-slate-500">Para criar uma nota, abra um imóvel, cliente, contrato ou serviço e use a seção &ldquo;Notas&rdquo;.</p>
      <div className="mb-6 flex rounded-xl border border-white/[0.07] bg-[#0b0e22] p-4">
        <select value={type} onChange={e => { setType(e.target.value); setPageNum(1) }} className="h-10 rounded-lg border border-white/10 bg-[#10132a] px-3 text-xs text-slate-300 outline-none focus:border-[#d4a72c]" aria-label="Filtrar por tipo">
          <option value="">Todos os tipos</option>
          {(Object.keys(ENTITY_LABEL) as NoteEntityType[]).map(t => <option key={t} value={t}>{ENTITY_LABEL[t]}</option>)}
        </select>
      </div>
      {error && <ErrorBanner message={error} />}
      {!data ? <Spinner /> : data.items.length === 0 ? <EmptyState title="Nenhuma nota encontrada" /> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map(n => <NoteItem key={n.id} note={n} showEntity onChanged={() => setReload(r => r + 1)} />)}
          </div>
          <Pager data={data} onPage={setPageNum} />
        </>
      )}
    </>
  )
}

// ======================================================================
// Formulário (criar / editar)
// ======================================================================
function FormField({ f, name, values, set, options }: { f: FieldDef; name: string; values: Values; set: (key: string, value: string) => void; options: Option[] }) {
  const value = values[name] ?? ''
  const isSelect = f.type === 'select' || f.type === 'relation'
  const inputMode = f.type === 'money' || f.type === 'int' || f.mask === 'cpf' || f.mask === 'cep' ? 'numeric' : f.type === 'decimal' ? 'decimal' : f.mask === 'phone' ? 'tel' : undefined
  return (
    <label className={`flex flex-col gap-2 text-xs text-slate-400 ${f.wide ? 'sm:col-span-2' : ''}`}>
      <span>{f.label}{f.required && <span className="text-[#d4a72c]"> *</span>}</span>
      {isSelect ? (
        <select required={f.required} value={value} onChange={e => set(name, e.target.value)} className={inputClass}>
          {f.type === 'relation' && <option value="">Selecione</option>}
          {f.optional && <option value="">Não definido</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          required={f.required}
          type={f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}
          inputMode={inputMode}
          placeholder={f.placeholder}
          maxLength={f.maxLength}
          min={f.type === 'date' && f.minFrom ? values[f.minFrom] || undefined : undefined}
          autoComplete="off"
          value={value}
          onChange={e => set(name, applyMask(f, e.target.value))}
          className={inputClass}
        />
      )}
      {f.hint && <span className="text-[10px] text-slate-600">{f.hint}</span>}
      {f.type === 'relation' && options.length === 0 && (
        <span className="text-[10px] text-[#e5be55]">Cadastre {f.relation === 'property' ? 'um imóvel' : 'um cliente'} primeiro.</span>
      )}
    </label>
  )
}

function FormModal({ def, row, lookups, onClose, onSaved }: { def: ResourceDef; row: Row | null; lookups: Lookups; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Values>(() => {
    if (row) return { ...def.toForm(row), ...(def.extras ? extrasToForm(row.extra_data, def.extras.allDefs) : {}) }
    return Object.fromEntries(def.fields.map(f => [f.key, f.type === 'select' ? f.options![0].value : '']))
  })
  // "Opções avançadas" começa aberto só se o registro já tiver algum extra salvo
  const [showAdvanced, setShowAdvanced] = useState(() => !!row && !!def.extras?.advanced && Object.keys(extrasToForm(row.extra_data, def.extras.allDefs)).length > 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }))

  const optionsFor = (f: FieldDef): Option[] =>
    f.type === 'select'
      ? f.options!
      : f.relation === 'property'
        ? lookups.properties.map(p => ({ value: String(p.id), label: p.address }))
        : lookups.clients.map(c => ({ value: String(c.id), label: c.name }))

  const extraDefs = def.extras?.defsFor(values) ?? []

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = def.toPayload(values, row)
      // extra_data: o contrato exige a chave no schema do backend, então sempre enviamos (null quando vazio)
      if (def.extras) payload.extra_data = buildExtra(values, def.extras, row?.extra_data)
      if (row) await api(`/${def.path}/update/put/${row.id}`, { method: 'PUT', json: payload })
      else await api(`/${def.path}/register`, { method: 'POST', json: payload })
      onSaved()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={row ? `Editar ${def.title.toLowerCase()}` : def.newLabel} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          {def.fields.map(f => <FormField key={f.key} f={f} name={f.key} values={values} set={set} options={f.type === 'select' || f.type === 'relation' ? optionsFor(f) : []} />)}
        </div>

        {def.extras && extraDefs.length > 0 && (
          <div className="border-t border-white/[0.07] px-6 py-4">
            {def.extras.advanced ? (
              <button type="button" onClick={() => setShowAdvanced(s => !s)} aria-expanded={showAdvanced} className="flex w-full items-center justify-between text-left text-xs font-medium text-[#d4a72c]">
                <span>{def.extras.title} <span className="ml-1 font-normal text-slate-600">(opcional)</span></span>
                <ChevronDown className={`size-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <p className="text-xs font-medium text-[#d4a72c]">{def.extras.title} <span className="ml-1 font-normal text-slate-600">(opcional · muda conforme o tipo)</span></p>
            )}
            {(!def.extras.advanced || showAdvanced) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {extraDefs.map(f => <FormField key={f.key} f={f} name={`x_${f.key}`} values={values} set={set} options={f.options ?? []} />)}
              </div>
            )}
          </div>
        )}

        {error && <div className="px-6"><ErrorBanner message={error} /></div>}
        <div className="flex justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs text-slate-400 hover:bg-white/5">Cancelar</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#5146d8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#635bff] disabled:opacity-60">
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================================================================
// Página genérica (lista + filtros + paginação + criar/editar/excluir + detalhes)
// ======================================================================
export function ResourcePage({ page, initialStatus = '' }: { page: ResourcePageKey; initialStatus?: string }) {
  const def = RESOURCES[page]
  const lookups = useLookups()

  const [pageNum, setPageNum] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [data, setData] = useState<Page<Row> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [form, setForm] = useState<{ row: Row | null } | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)

  // espera o usuário parar de digitar antes de chamar a API
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPageNum(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let off = false
    const query: Record<string, string | number | undefined> = { page: pageNum, limit: PAGE_SIZE, status: status || undefined }
    if (def.searchParam) query[def.searchParam] = debounced || undefined
    api<Page<Row>>(`/${def.path}/get/all`, { query })
      .then(res => {
        if (off) return
        if (res.items.length === 0 && pageNum > 1) return setPageNum(pageNum - 1) // apagou o último item da página
        setData(res)
        setError(null)
      })
      .catch(e => !off && setError(errMsg(e)))
    return () => {
      off = true
    }
  }, [def, pageNum, debounced, status, reload])

  async function remove(row: Row) {
    if (!window.confirm(`Excluir este registro? As notas ligadas a ele também serão removidas.`)) return
    try {
      await api(`/${def.path}/delete/${row.id}`, { method: 'DELETE' })
      setReload(r => r + 1)
    } catch (e) {
      setError(errMsg(e))
    }
  }

  return (
    <>
      <Heading title={def.title} subtitle={def.subtitle} action={def.newLabel} onAction={() => setForm({ row: null })} />

      {(def.searchParam || def.statusOptions) && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0b0e22] p-4 sm:flex-row">
          {def.searchParam && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={def.searchPlaceholder} className={`${inputClass} pl-10 text-xs`} />
            </div>
          )}
          {def.statusOptions && (
            <select value={status} onChange={e => { setStatus(e.target.value); setPageNum(1) }} className="h-10 rounded-lg border border-white/10 bg-[#10132a] px-3 text-xs text-slate-300 outline-none focus:border-[#d4a72c]" aria-label="Filtrar por status">
              <option value="">Todos os status</option>
              {def.statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {!data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <EmptyState title={debounced || status ? 'Nada encontrado com esses filtros' : `Nenhum registro em ${def.title.toLowerCase()} ainda`} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map(row => {
              const c = def.card(row, lookups)
              return (
                <article key={row.id} onClick={() => setDetail(row)} onKeyDown={e => e.key === 'Enter' && setDetail(row)} tabIndex={0} className="loctis-card group relative cursor-pointer rounded-2xl border border-white/[0.07] bg-[#0b0e22] p-5 shadow-[0_12px_35px_rgba(1,3,14,.18)] transition hover:border-[#d4a72c]/45 hover:bg-[#10132a]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#5146d8]/15 text-[#8d87ff]"><Eye className="size-[18px]" /></div>
                    {c.badge && <Badge label={c.badge} />}
                  </div>
                  <h2 className="text-base font-medium text-white">{c.title}</h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{c.subtitle}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                    {c.meta.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[.12em] text-slate-600">{label}</p>
                        <p className="mt-1 truncate text-xs text-slate-300">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setForm({ row })} className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-[#635bff]" aria-label="Editar"><FilePenLine className="size-3.5" /></button>
                    <button onClick={() => remove(row)} className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-[#d86c77]" aria-label="Excluir"><Trash2 className="size-3.5" /></button>
                  </div>
                </article>
              )
            })}
          </div>
          <Pager data={data} onPage={setPageNum} />
        </>
      )}

      {form && (
        <FormModal
          def={def}
          row={form.row}
          lookups={lookups}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            setDetail(null)
            setReload(r => r + 1)
          }}
        />
      )}

      {detail && (
        <Modal title={def.card(detail, lookups).title} onClose={() => setDetail(null)}>
          <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
            {[...def.details(detail, lookups), ...describeExtras(detail.extra_data, def.extras, def.toForm(detail))].map(([label, value]) => (
              <div key={label} className="bg-[#0b0e22] px-6 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">{label}</p>
                <p className="mt-1 break-words text-sm text-slate-200">{value}</p>
              </div>
            ))}
          </div>
          <RecordNotes type={def.path} id={detail.id} />
          <div className="flex justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
            <button onClick={() => setDetail(null)} className="rounded-lg px-4 py-2.5 text-xs text-slate-400 hover:bg-white/5">Fechar</button>
            <button onClick={() => { setForm({ row: detail }); setDetail(null) }} className="rounded-lg bg-[#5146d8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#635bff]">Editar</button>
          </div>
        </Modal>
      )}
    </>
  )
}
