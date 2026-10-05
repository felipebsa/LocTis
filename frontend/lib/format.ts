// lib/format.ts — máscaras de digitação e formatação de valores/datas.
// Regra: na tela mostramos com máscara; para a API enviamos só os dígitos (CPF, CEP, telefone).

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

// As máscaras só colocam o separador quando existe um dígito depois dele.
// Assim o Backspace nunca "trava" em um "-" ou "." sobrando no fim.
export function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11)
  return d.slice(0, 3) + (d.length > 3 ? `.${d.slice(3, 6)}` : '') + (d.length > 6 ? `.${d.slice(6, 9)}` : '') + (d.length > 9 ? `-${d.slice(9, 11)}` : '')
}

export function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8)
  return d.slice(0, 5) + (d.length > 5 ? `-${d.slice(5, 8)}` : '')
}

export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Dinheiro "estilo caixa eletrônico": o usuário digita só números e os centavos aparecem sozinhos (1 → 0,01; 150000 → 1.500,00).
export function maskMoney(value: string) {
  const d = onlyDigits(value).slice(0, 12)
  if (!d) return ''
  return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const parseMoney = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'))
export const moneyToInput = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// decimal: só dígitos e uma vírgula (ex.: área 850,5)
export function maskDecimal(value: string) {
  const cleaned = value.replace(/[^\d,]/g, '')
  const [int, ...rest] = cleaned.split(',')
  return rest.length ? `${int},${rest.join('').slice(0, 2)}` : int.slice(0, 9)
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const brlCompact = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })

// datas "sem fuso" (início/fim de contrato): não passar por Date para não deslocar o dia
export const fmtDay = (s: string) => s.slice(0, 10).split('-').reverse().join('/')

// created_at vem do servidor sem fuso (UTC): marcamos como UTC antes de converter
export const parseServerDate = (s: string) => new Date(/Z$|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`)

export const fmtDateTime = (s: string) => parseServerDate(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function timeAgo(date: Date) {
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (secs < 60) return 'Agora há pouco'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `Há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`
  return date.toLocaleDateString('pt-BR')
}
