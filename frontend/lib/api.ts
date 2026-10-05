// lib/api.ts — única porta de entrada para falar com o backend FastAPI.
// Configure a URL em .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'loctis_token'

// ---------- token ----------
export const token = {
  get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (value: string) => window.localStorage.setItem(TOKEN_KEY, value),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
}

let unauthorizedHandler: (() => void) | null = null
export function onUnauthorized(fn: (() => void) | null) {
  unauthorizedHandler = fn
}

// ---------- erros ----------
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// O backend responde `detail` em inglês; traduzimos as mensagens conhecidas.
const TRANSLATIONS: Record<string, string> = {
  'Invalid credentials': 'E-mail ou senha incorretos',
  'Email already registered': 'Este e-mail já está cadastrado',
  'CPF already registered for this landlord': 'Já existe um cliente com este CPF',
  'Property not found': 'Imóvel não encontrado',
  'Client not found': 'Cliente não encontrado',
  'Contract not found': 'Contrato não encontrado',
  'Service not found': 'Serviço não encontrado',
  'Note not found': 'Nota não encontrada',
  'not exist this property id': 'Imóvel inválido',
  'not exist this client id': 'Cliente inválido',
  'Property has contracts or services linked to it': 'Este imóvel tem contratos ou serviços vinculados. Remova-os antes de excluir.',
  'Client has contracts linked to it': 'Este cliente tem contratos vinculados. Remova-os antes de excluir.',
  'Invalid data: end_date must be greater than start_date and value must be greater than zero.':
    'A data de término deve ser depois do início e o valor deve ser maior que zero.',
}

function errorMessage(detail: unknown): string {
  if (typeof detail === 'string') return TRANSLATIONS[detail] ?? detail
  if (Array.isArray(detail)) {
    // 422 do FastAPI: [{ loc: ['body','cpf'], msg: '...' }]
    return detail
      .map((d: { loc?: (string | number)[]; msg?: string }) => `${(d.loc ?? []).slice(1).join('.')}: ${d.msg ?? 'inválido'}`)
      .join('; ')
  }
  return 'Erro inesperado'
}

// ---------- request ----------
type Query = Record<string, string | number | undefined | null>
type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  json?: unknown
  form?: Record<string, string> // o /auth/login do FastAPI exige form-urlencoded, não JSON
  query?: Query
  auth?: boolean
}

export async function api<T>(path: string, { method = 'GET', json, form, query, auth = true }: Options = {}): Promise<T> {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = {}
  const jwt = token.get()
  if (auth && jwt) headers.Authorization = `Bearer ${jwt}`

  let body: BodyInit | undefined
  if (form) {
    body = new URLSearchParams(form)
  } else if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }

  let res: Response
  try {
    res = await fetch(url, { method, headers, body })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Ela está rodando?')
  }

  if (res.status === 401 && auth) {
    token.clear()
    unauthorizedHandler?.()
    throw new ApiError(401, 'Sessão expirada. Entre novamente.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, errorMessage(data?.detail))
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// ---------- tipos (espelham os schemas Pydantic do backend) ----------
export type Page<T> = { items: T[]; page_atual: number; page_max: number; total: number }

export type User = { id: number; name: string; email: string; created_at: string }

export type NoteEntityType = 'property' | 'client' | 'contract' | 'service'

export type Note = {
  id: number
  landlord_id: number
  entity_type: NoteEntityType
  entity_id: number
  content: string
  created_at: string
}

export type Contract = {
  id: number
  property_id: number
  client_id: number
  value: number
  start_date: string
  end_date: string
  status: 'active' | 'pending' | 'expired' | 'terminated'
  extra_data: Record<string, unknown> | null
  created_at: string
}
