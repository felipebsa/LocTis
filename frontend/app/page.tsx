'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ManagementPage, type PageKey } from '@/components/management-pages'
import { ChartLegend, FinanceChart } from '@/components/finance-chart'
import { KIND, PROPERTY_STATUS, labelOf } from '@/components/resources'
import { LoginScreen } from '@/components/login-screen'
import { useAuth } from '@/lib/auth'
import { buildActivity, monthlySeries, summarize, useAppData, type Activity, type ActivityKind } from '@/lib/dashboard'
import { brl, timeAgo } from '@/lib/format'
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  StickyNote,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

type View = 'Dashboard' | PageKey

const navGroups = [
  { label: 'PRINCIPAL', items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'GESTÃO',
    items: [
      { label: 'Imóveis', icon: Building2 },
      { label: 'Clientes', icon: Users },
      { label: 'Contratos', icon: FileText },
      { label: 'Serviços', icon: Wrench },
      { label: 'Notas', icon: StickyNote },
    ],
  },
  { label: 'ANÁLISES', items: [{ label: 'Relatórios', icon: CircleDollarSign }] },
]

// Para cada tipo de atividade: ícone, cor e a página que abre ao clicar.
const ACTIVITY_META: Record<ActivityKind, { icon: LucideIcon; tone: string; page: PageKey }> = {
  property: { icon: Building2, tone: 'bg-indigo-400/10 text-[#635bff]', page: 'Imóveis' },
  client: { icon: Users, tone: 'bg-[#d6a64a]/10 text-[#d4a72c]', page: 'Clientes' },
  contract: { icon: FileText, tone: 'bg-indigo-400/10 text-[#635bff]', page: 'Contratos' },
  service: { icon: Wrench, tone: 'bg-[#63b6a4]/10 text-teal-300', page: 'Serviços' },
  note: { icon: StickyNote, tone: 'bg-white/[0.05] text-slate-400', page: 'Notas' },
}

function Logo() {
  return <img src="/loctis-logo-new.png" alt="LocTis · Gestão inteligente para locadores" className="h-auto w-[170px] max-w-full object-contain object-left" />
}

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const { icon: Icon, tone } = ACTIVITY_META[kind]
  return <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="size-3.5" /></div>
}

// Sino: mesma lista da "Atividade recente", com contador do que chegou depois da última vez que o sino foi aberto.
// O "visto em" fica só neste navegador (localStorage), pois o backend não guarda leitura de notificações.
function NotificationsBell({ activity, userId, onGo }: { activity: Activity[]; userId: number; onGo: (page: PageKey) => void }) {
  const storageKey = `loctis_notif_seen_${userId}`
  const [open, setOpen] = useState(false)
  const [seenAt, setSeenAt] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      setSeenAt(Number(window.localStorage.getItem(storageKey)) || 0)
    } catch {
      /* localStorage indisponível: tudo conta como novo */
    }
  }, [storageKey])

  const unread = activity.filter(a => a.at.getTime() > seenAt).length

  function close() {
    setOpen(false)
    const now = Date.now()
    setSeenAt(now)
    try {
      window.localStorage.setItem(storageKey, String(now))
    } catch {
      /* ignora */
    }
  }

  // Fecha ao clicar fora SEM cobrir a tela com uma camada: assim o mesmo clique ainda funciona no que estava embaixo.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div className="relative" ref={box}>
      <button onClick={() => (open ? close() : setOpen(true))} className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200" aria-label={unread ? `Notificações (${unread} novas)` : 'Notificações'} aria-expanded={open}>
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#d6a64a] px-1 text-[9px] font-bold leading-4 text-[#1b1520]">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="absolute right-0 top-full z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0b0e22] shadow-[0_24px_70px_rgba(0,0,0,.55)]">
            <div className="border-b border-white/[0.07] px-4 py-3 text-sm font-medium text-slate-200">Notificações</div>
            <div className="max-h-96 overflow-y-auto">
              {activity.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-600">Nenhuma notificação ainda.</p>
              ) : (
                activity.slice(0, 12).map(item => (
                  <button key={item.key} onClick={() => { close(); onGo(ACTIVITY_META[item.kind].page) }} className="flex w-full gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.04]">
                    <ActivityIcon kind={item.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-xs font-medium text-slate-300">{item.title}{item.at.getTime() > seenAt && <i className="size-1.5 rounded-full bg-[#d6a64a]" />}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-600">{item.desc}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-700">{timeAgo(item.at)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [view, setView] = useState<{ page: View; status?: string; tick: number }>({ page: 'Dashboard', tick: 0 })
  const { user, loading, logout } = useAuth()
  // busca de novo a cada troca de página, para refletir o que acabou de ser criado/removido
  const { data } = useAppData(!!user, view.page)
  const summary = useMemo(() => summarize(data), [data])
  const activity = useMemo(() => buildActivity(data), [data])
  const series = useMemo(() => monthlySeries(data, 6), [data])

  const navigate = (label: string, status?: string) => {
    // tick novo a cada clique: até clicar na aba da página atual reinicia a tela e fecha janelas abertas
    setView({ page: label as View, status, tick: Date.now() })
    setMobileOpen(false)
  }

  // (hooks sempre antes dos returns antecipados)
  if (loading) return <main className="loctis-shell min-h-screen" />
  if (!user) return <LoginScreen />

  const firstName = user.name.split(' ')[0]
  const initials = user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const stats = [
    { label: 'Imóveis', value: data ? summary.properties : '—', detail: 'no portfólio', icon: Building2, go: () => navigate('Imóveis') },
    { label: 'Contratos ativos', value: data ? summary.activeContracts : '—', detail: `${summary.expiring.length} vencem em 60 dias`, icon: FileText, go: () => navigate('Contratos', 'active') },
    { label: 'Clientes', value: data ? summary.clients : '—', detail: 'cadastrados', icon: Users, go: () => navigate('Clientes') },
    { label: 'Serviços pendentes', value: data ? summary.pendingServices : '—', detail: 'aguardando', icon: Wrench, go: () => navigate('Serviços', 'pending') },
  ]

  const upcoming = summary.expiring.slice(0, 3).map(contract => {
    const date = new Date(contract.end_date)
    return {
      id: contract.id,
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      title: `Vencimento do contrato #${contract.id}`,
      sub: contract.daysLeft === 0 ? 'Vence hoje' : `Em ${contract.daysLeft} dias`,
      tone: contract.daysLeft <= 15 ? 'gold' : 'indigo',
    }
  })

  const recentProperties = [...(data?.properties ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
    .map(p => {
      const contract = data?.contracts.find(c => c.property_id === p.id && c.status === 'active')
      return { ...p, rent: contract ? `${brl(contract.value)}/mês` : 'Sem contrato ativo' }
    })

  const current = view.page
  const navItems = navGroups.flatMap(group => group.items)

  return <main className="loctis-shell min-h-screen text-slate-100">
    <header className="sticky top-0 z-[60] border-b border-white/[0.08] bg-[#060817]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1480px] items-center gap-8 px-5 sm:px-8 lg:px-10">
        <button onClick={() => navigate('Dashboard')} className="shrink-0" aria-label="Ir para o Dashboard"><Logo /></button>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Navegação principal">
          {navItems.map(item => { const Icon = item.icon; const active = item.label === current; return <button key={item.label} onClick={() => navigate(item.label)} className={`group flex items-center gap-2 rounded-full px-3 py-2 text-[12px] transition-colors ${active ? 'bg-[#5146d8]/16 text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}><Icon className={`size-3.5 ${active ? 'text-[#635bff]' : 'text-slate-500 group-hover:text-[#635bff]'}`} />{item.label}</button> })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Abrir navegação"><Menu /></button>
          <NotificationsBell activity={activity} userId={user.id} onGo={page => navigate(page)} />
          <button onClick={() => navigate('Configurações')} className="flex items-center gap-2 rounded-full p-1.5 text-left hover:bg-white/[0.05]" aria-label="Perfil"><div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-[11px] font-bold text-[#1b1520]">{initials}</div><ChevronDown className="size-3.5 text-slate-600" /></button>
          <button onClick={() => { logout(); navigate('Dashboard') }} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200" aria-label="Sair"><LogOut className="size-4" /></button>
        </div>
      </div>
      {mobileOpen && <nav className="border-t border-white/[0.06] px-5 py-3 lg:hidden" aria-label="Navegação móvel"><div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{navItems.map(item => { const Icon = item.icon; const active = item.label === current; return <button key={item.label} onClick={() => navigate(item.label)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${active ? 'bg-[#5146d8]/16 text-white' : 'text-slate-400 hover:bg-white/[0.04]'}`}><Icon className="size-3.5 text-[#635bff]" />{item.label}</button> })}</div></nav>}
    </header>

    <section className="min-h-screen">
      {current !== 'Dashboard' ? (
        <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10"><ManagementPage page={current} initialStatus={view.status} resetKey={view.tick} /></div>
      ) : (
        <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-600"><Home className="size-3.5" /> <ChevronRight className="size-3" /> Dashboard</div>
              <h1 className="font-serif text-3xl tracking-tight text-white sm:text-[34px]">{greeting}, {firstName} <span className="text-[#d4a72c]">.</span></h1>
              <p className="mt-2 text-sm text-slate-500">Aqui está o resumo da sua operação hoje.</p>
            </div>
            <button onClick={() => navigate('Imóveis')} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5146d8] px-4 text-xs font-semibold text-white shadow-lg shadow-[#5146d8]/30 transition hover:bg-[#635bff]"><Plus className="size-4" />Ir para imóveis</button>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(stat => { const Icon = stat.icon; return (
              <button key={stat.label} onClick={stat.go} className="loctis-card group rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5 text-left transition hover:border-[#d4a72c]/40">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#625ee8]/10 text-[#635bff]"><Icon className="size-[18px]" /></div>
                  <ChevronRight className="size-4 text-slate-700 opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="text-[13px] text-[#d4a72c]">{stat.label}</p>
                <div className="mt-1 flex items-end gap-3">
                  <p className="text-2xl font-semibold tracking-tight text-[#f5f1e8]">{stat.value}</p>
                  <p className="mb-1 text-[11px] text-teal-300/75">{stat.detail}</p>
                </div>
              </button>
            ) })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="loctis-card rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#d4a72c]">Visão financeira</p>
                  <p className="mt-1 text-xs text-slate-600">Calculada a partir dos seus contratos e serviços · últimos 6 meses</p>
                </div>
                <button onClick={() => navigate('Relatórios')} className="text-[11px] text-[#635bff] hover:text-[#8d87ff]">Ver relatórios</button>
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[#f5f1e8]">{brl(summary.monthlyRevenue)}</span>
                <span className="text-xs text-slate-500">receita mensal dos contratos ativos</span>
              </div>
              <ChartLegend />
              <FinanceChart series={series} />
            </div>

            <div className="loctis-card rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#d4a72c]">Próximos compromissos</p>
                  <p className="mt-1 text-xs text-slate-600">Contratos ativos que vencem em breve</p>
                </div>
                <CalendarDays className="size-4 text-slate-600" />
              </div>
              <div className="mt-6 flex flex-col gap-5">
                {upcoming.map(item => (
                  <button key={item.id} onClick={() => navigate('Contratos', 'active')} className="flex items-center gap-3 text-left">
                    <div className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border ${item.tone === 'gold' ? 'border-[#d6a64a]/20 bg-[#d6a64a]/10' : 'border-indigo-400/20 bg-indigo-400/10'}`}>
                      <span className={`text-sm font-semibold ${item.tone === 'gold' ? 'text-[#d4a72c]' : 'text-indigo-300'}`}>{item.day}</span>
                      <span className="text-[8px] font-medium text-[#b8a66a]">{item.month}</span>
                    </div>
                    <div><p className="text-xs font-medium text-slate-300">{item.title}</p><p className="mt-1 text-[11px] text-slate-600">{item.sub}</p></div>
                  </button>
                ))}
                {upcoming.length === 0 && <p className="text-xs text-slate-600">Nenhum contrato vencendo nos próximos 60 dias.</p>}
              </div>
              <button onClick={() => navigate('Contratos', 'active')} className="mt-6 flex items-center gap-1 text-[11px] font-medium text-[#635bff] hover:text-[#8d87ff]">Ver contratos <ChevronRight className="size-3" /></button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.5fr]">
            <div className="loctis-card rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-sm font-medium text-slate-200">Atividade recente</p>
                <p className="mt-1 text-xs text-slate-600">O que você cadastrou por último</p>
              </div>
              <div className="flex flex-col gap-5">
                {activity.slice(0, 5).map(item => (
                  <button key={item.key} onClick={() => navigate(ACTIVITY_META[item.kind].page)} className="flex gap-3 text-left">
                    <ActivityIcon kind={item.kind} />
                    <div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-300">{item.title}</p><p className="mt-1 truncate text-[11px] text-slate-600">{item.desc}</p></div>
                    <span className="shrink-0 text-[10px] text-slate-700">{timeAgo(item.at)}</span>
                  </button>
                ))}
                {data && activity.length === 0 && <p className="text-xs text-slate-600">Nenhuma atividade ainda. Cadastre seu primeiro imóvel para começar.</p>}
              </div>
            </div>

            <div className="loctis-card rounded-xl border border-white/[0.07] bg-[#0b0e22] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">Imóveis recentes</p>
                  <p className="mt-1 text-xs text-slate-600">Os últimos cadastrados</p>
                </div>
                <button onClick={() => navigate('Imóveis')} className="text-[11px] text-[#635bff] hover:text-[#8d87ff]">Ver imóveis</button>
              </div>
              {data && recentProperties.length === 0 ? (
                <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 text-center">
                  <p className="text-xs text-slate-500">Você ainda não tem nenhum imóvel cadastrado.</p>
                  <button onClick={() => navigate('Imóveis')} className="rounded-lg bg-[#5146d8] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#635bff]">Cadastrar o primeiro imóvel</button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {recentProperties.map(property => (
                    <button key={property.id} onClick={() => navigate('Imóveis')} className="loctis-card group overflow-hidden rounded-lg border border-white/[0.06] bg-[#0e1128] text-left transition hover:border-indigo-400/25">
                      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-[#5146d8]/20 to-[#d4a72c]/10">
                        <Building2 className="size-8 text-[#8d87ff]/70" />
                        <span className={`absolute bottom-2 left-2 rounded-md px-2 py-1 text-[9px] font-medium ${property.status === 'rented' ? 'bg-[#63b6a4]/15 text-emerald-300' : property.status === 'available' ? 'bg-indigo-400/15 text-indigo-300' : 'bg-[#d6a64a]/15 text-amber-300'}`}>{labelOf(PROPERTY_STATUS, property.status)}</span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-medium text-slate-200">{property.address}</p>
                        <p className="mt-1 truncate text-[10px] text-slate-600">{labelOf(KIND, property.kind)}</p>
                        <p className="mt-3 text-[11px] font-medium text-slate-400">{property.rent}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[10px] text-slate-700"><span>LocTis · Gestão inteligente para locadores</span></div>
        </div>
      )}
    </section>
  </main>
}
