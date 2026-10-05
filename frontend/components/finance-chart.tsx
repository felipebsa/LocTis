'use client'

import { brl, brlCompact } from '@/lib/format'
import type { MonthPoint } from '@/lib/dashboard'

// Barras agrupadas por mês: receita contratada (roxo) x despesas com serviços (dourado).
// Altura proporcional ao maior valor da série; passe o mouse numa barra para ver o valor exato.
export function FinanceChart({ series }: { series: MonthPoint[] }) {
  const max = Math.max(0, ...series.flatMap(p => [p.revenue, p.expenses]))

  if (max === 0) {
    return (
      <div className="mt-5 flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/10 px-4 text-center">
        <p className="text-xs text-slate-400">Ainda não há receitas nem despesas neste período.</p>
        <p className="text-[11px] text-slate-600">Cadastre contratos e serviços para ver o gráfico.</p>
      </div>
    )
  }

  const heightOf = (value: number) => (value > 0 ? `${Math.max((value / max) * 100, 2)}%` : '0%')

  return (
    <div className="mt-5">
      <div className="flex h-44 gap-3">
        <div className="flex w-14 shrink-0 flex-col justify-between text-right text-[10px] text-slate-600">
          <span>{brlCompact(max)}</span>
          <span>R$ 0</span>
        </div>
        <div className="flex flex-1 items-end gap-3 border-b border-white/[0.08]" role="img" aria-label="Receita contratada e despesas com serviços por mês">
          {series.map(point => (
            <div key={point.key} className="flex h-full min-w-0 flex-1 items-end gap-1">
              <div className="w-1/2 rounded-t bg-gradient-to-t from-[#3b35a8] via-[#756bf0] to-[#b3aaff]" style={{ height: heightOf(point.revenue) }} title={`${point.label} · Receita: ${brl(point.revenue)}`} />
              <div className="w-1/2 rounded-t bg-gradient-to-t from-[#916d19] via-[#d4a72c] to-[#f3d77b]" style={{ height: heightOf(point.expenses) }} title={`${point.label} · Despesas: ${brl(point.expenses)}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-[68px] mt-2 flex gap-3 text-[10px] capitalize text-slate-600">
        {series.map(point => <span key={point.key} className="min-w-0 flex-1 truncate text-center">{point.label}</span>)}
      </div>
    </div>
  )
}

export function ChartLegend() {
  return (
    <div className="mt-3 flex gap-5 text-[11px] text-slate-500">
      <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#635bff]" />Receita contratada</span>
      <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#d6a64a]" />Despesas com serviços</span>
    </div>
  )
}
