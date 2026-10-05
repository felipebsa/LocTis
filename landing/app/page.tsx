'use client'

import { useState } from 'react'
import { ArrowRight, BarChart3, Building2, Check, ChevronDown, CircleDollarSign, FileText, Menu, Network, NotebookPen, Play, Settings2, UsersRound, Wrench, X } from 'lucide-react'

// Endereço do app (frontend/). Em produção, defina NEXT_PUBLIC_APP_URL com o domínio real.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
// "Começar" abre direto o cadastro; "Entrar" abre o login.
const SIGNUP_URL = `${APP_URL}/?modo=cadastro`

const features = [
  { icon: Building2, title: 'Imóveis', text: 'Tenha seu portfólio organizado e sempre atualizado.', size: 'feature-large' },
  { icon: UsersRound, title: 'Clientes', text: 'Centralize informações e vínculos dos seus clientes.', size: 'feature-small' },
  { icon: FileText, title: 'Contratos', text: 'Controle contratos, valores e vencimentos.', size: 'feature-small' },
  { icon: Wrench, title: 'Serviços', text: 'Acompanhe manutenções e tarefas da operação.', size: 'feature-large' },
  { icon: NotebookPen, title: 'Notas', text: 'Registre informações importantes sem perder contexto.', size: 'feature-small' },
  { icon: BarChart3, title: 'Relatórios', text: 'Entenda o desempenho financeiro do seu portfólio.', size: 'feature-small' },
]

const included = [
  'Cadastro de imóveis, clientes, contratos e serviços',
  'Notas em cada registro',
  'Dashboard e relatórios calculados dos seus dados',
  'Campos extras de acordo com o tipo do imóvel',
]

function Logo() { return <a className="brand" href="#inicio" aria-label="LocTis, início"><img src="/loctis-wordmark.png" alt="LocTis" /></a> }

function DashboardPreview() {
  return <div className="dashboard-wrap" aria-label="Prévia ilustrativa do dashboard LocTis">
    <div className="dashboard-glow" />
    <div className="dashboard-window">
      <div className="dash-sidebar"><div className="dash-mini-logo"><img src="/loc tis-logo.png" alt="" /></div><div className="dash-side-line active" /><div className="dash-side-line" /><div className="dash-side-line" /><div className="dash-side-line" /><div className="dash-side-line short" /></div>
      <div className="dash-main"><div className="dash-top"><div><span className="eyebrow">VISÃO GERAL</span><h3>Bom dia, Ana <b>•</b></h3></div><div className="dash-avatar">A</div></div><div className="dash-stats"><div><span>Imóveis</span><strong>24</strong><small>no portfólio</small></div><div><span>Contratos ativos</span><strong>18</strong><small>2 vencem em 60 dias</small></div><div><span>Clientes</span><strong>31</strong><small>cadastrados</small></div></div><div className="dash-grid"><div className="dash-chart"><div className="chart-head"><span>Visão financeira</span><strong>R$ 24.680 <i>receita mensal</i></strong></div><div className="chart-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="chart-line" /></div><div className="dash-agenda"><span>PRÓXIMOS COMPROMISSOS</span><p><b>18 JUN</b> Vencimento de contrato</p><p><b>20 JUN</b> Serviço pendente</p><p><b>24 JUN</b> Vencimento de contrato</p></div></div></div>
    </div>
    <div className="float-card float-one"><span className="float-icon purple"><Check /></span><div><b>Contrato registrado</b><small>Apartamento Horizonte</small></div></div>
    <div className="float-card float-two"><span className="float-icon gold"><Wrench /></span><div><b>Serviço concluído</b><small>Troca de fechadura</small></div></div>
    <p className="preview-note">Prévia ilustrativa do painel</p>
  </div>
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <main id="inicio">
    <nav className="navbar"><div className="nav-inner"><Logo /><div className={`nav-links ${menuOpen ? 'open' : ''}`}><a href="#produto">Produto</a><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#sobre">Sobre</a><a className="mobile-only" href={APP_URL}>Entrar</a></div><div className="nav-actions"><a className="login" href={APP_URL}>Entrar</a><a className="button button-small" href={SIGNUP_URL}>Começar agora <ArrowRight /></a></div><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X /> : <Menu />}</button></div></nav>

    <section className="hero section-shell" id="produto"><div className="hero-copy"><h1>Gestão inteligente para quem <em>administra imóveis.</em></h1><p>Organize imóveis, clientes, contratos, serviços e finanças em um único lugar.</p><div className="hero-actions"><a className="button" href={SIGNUP_URL}>Começar agora <ArrowRight /></a><a className="text-button" href="#como-funciona"><span className="play"><Play /></span> Conhecer o LocTis</a></div><div className="hero-note"><span>Feito para deixar sua operação mais clara.</span></div></div><DashboardPreview /></section>

    <section className="statement section-shell"><span className="section-kicker">A gestão mudou</span><h2>Menos planilhas.<br /><em>Mais controle.</em></h2><p>O LocTis centraliza a operação para que você não precise espalhar informações entre planilhas, mensagens e ferramentas diferentes.</p></section>

    <section className="section-shell features-section" id="recursos"><div className="section-heading"><div><span className="section-kicker">Tudo em um só lugar</span><h2>Tudo o que você precisa para <em>administrar melhor.</em></h2></div><p>Da primeira visita ao fechamento do mês, cada detalhe da sua operação no lugar certo.</p></div><div className="features-grid">{features.map(({ icon: Icon, title, text, size }) => <article className={`feature-card ${size}`} key={title}><span className="feature-icon"><Icon /></span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight className="feature-arrow" /></article>)}</div></section>

    <section className="connected section-shell" id="como-funciona"><div className="connected-copy"><span className="section-kicker">Uma visão conectada</span><h2>Informação que <em>trabalha junto.</em></h2><p>Quando tudo está conectado, as decisões ficam mais simples. Veja como cada parte da sua operação se relaciona.</p><a className="text-link" href="#recursos">Explorar a plataforma <ArrowRight /></a></div><div className="connection-map">{['IMÓVEL','CLIENTE','CONTRATO','SERVIÇOS','FINANÇAS'].map((item, i) => <div className="connection-item" key={item}><span className={i === 4 ? 'gold-dot' : ''}>{i === 0 ? <Building2 /> : i === 1 ? <UsersRound /> : i === 2 ? <FileText /> : i === 3 ? <Wrench /> : <CircleDollarSign />}</span><strong>{item}</strong></div>)}</div></section>

    <section className="benefits section-shell"><div className="section-heading centered"><span className="section-kicker">Feito para simplificar</span><h2>Uma visão mais clara <em>da sua operação.</em></h2><p>Menos tempo procurando informações. Mais tempo tomando decisões que fazem o seu portfólio avançar.</p></div><div className="benefit-grid"><article className="benefit-card"><div className="benefit-visual overview"><div className="overview-simple"><img src="/benefit-calendar.webp" alt="Calendário de gestão" /></div></div><div className="benefit-tag">Organização</div><h3>Tenha o portfólio sob controle</h3><p>Imóveis, clientes e contratos conectados em uma visão única, clara e sempre pronta para a próxima decisão.</p><a href="#recursos">Ver como funciona <ArrowRight /></a></article><article className="benefit-card"><div className="benefit-visual deadlines"><img className="benefit-art" src="/benefit-notebook.webp" alt="Notebook com painel de gestão" /></div><div className="benefit-tag">Previsibilidade</div><h3>Saiba o que precisa da sua atenção</h3><p>Antecipe vencimentos, manutenções e compromissos antes que eles virem urgência.</p><a href="#recursos">Explorar alertas <ArrowRight /></a></article><article className="benefit-card"><div className="benefit-visual money"><img className="benefit-art" src="/benefit-arrow.webp" alt="Seta indicando crescimento" /></div><div className="benefit-tag">Clareza financeira</div><h3>Transforme números em direção</h3><p>Entenda receitas, despesas e resultados para administrar com mais segurança e margem.</p><a href="#como-funciona">Conhecer a plataforma <ArrowRight /></a></article></div></section>

    <section className="pricing section-shell" id="comecar"><div className="section-heading centered"><span className="section-kicker">Comece agora</span><h2>Gratuito para <em>começar.</em></h2><p>O LocTis está em fase inicial: crie sua conta e use tudo o que já existe, sem custo.</p></div><div className="plans single"><article className="plan featured"><span className="plan-name">Acesso completo</span><p>Tudo o que o LocTis oferece hoje.</p><div className="price"><strong>R$ 0</strong></div><ul>{included.map(f => <li key={f}><Check />{f}</li>)}</ul><a className="button" href={SIGNUP_URL}>Criar minha conta <ArrowRight /></a></article></div></section>

    <section className="audience section-shell" id="sobre"><div className="section-heading"><div><span className="section-kicker">Para quem é o LocTis</span><h2>Para quem administra <em>imóveis.</em></h2></div><p>Uma plataforma feita para acompanhar o tamanho e o ritmo da sua operação.</p></div><div className="audience-list"><div><span>01</span><h3>Pequenos proprietários</h3><p>Tenha controle sem transformar sua rotina em uma planilha.</p><ArrowRight /></div><div><span>02</span><h3>Administradores de imóveis</h3><p>Centralize operações e acompanhe seu portfólio.</p><ArrowRight /></div><div><span>03</span><h3>Pequenas empresas</h3><p>Organize contratos, clientes e serviços em uma única plataforma.</p><ArrowRight /></div></div></section>

    <section className="final-cta section-shell"><div className="cta-mark"><img src="/loc tis-logo.png" alt="" /></div><span className="section-kicker">Comece hoje</span><h2>Pronto para assumir <em>o controle?</em></h2><p>Comece a organizar sua gestão com o LocTis.</p><a className="button" href={SIGNUP_URL}>Começar agora <ArrowRight /></a></section>

    <footer><div className="footer-inner"><div><a className="footer-symbol" href="#inicio" aria-label="LocTis, início"><img src="/loctis-mark.png" alt="LocTis" /></a><p>Gestão inteligente para locadores.</p></div><div className="footer-links"><div><b>Produto</b><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#sobre">Para quem é</a></div><div><b>Conta</b><a href={APP_URL}>Entrar</a><a href={SIGNUP_URL}>Criar conta</a></div></div></div><div className="footer-bottom"><span>© 2026 LocTis. Todos os direitos reservados.</span><span>Feito para uma gestão mais inteligente</span></div></footer>
  </main>
}
