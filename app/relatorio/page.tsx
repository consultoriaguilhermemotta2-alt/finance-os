"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useFinance } from "@/lib/store";
import {
  currentMonthKey, addMonths, formatMonthLabel, formatMonthShort, formatBRL, sum,
} from "@/lib/utils";
import {
  entradasDoMes, saidasDoMes, totalEntradasMes, totalSaidasMes, totalCartoesMes,
  saldoPrevisto, parcelasDoMes, porCategoria,
} from "@/lib/calc";
import { Money, EmptyState, Badge } from "@/components/ui";
import {
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Landmark, CreditCard,
} from "lucide-react";

// ── Comparação vs. mês anterior ─────────────────────────────────────────────
function ComparisonCard({
  label, atual, anterior, invert = false,
}: {
  label: string; atual: number; anterior: number; invert?: boolean;
}) {
  const delta = atual - anterior;
  const pct = anterior !== 0 ? Math.round((delta / Math.abs(anterior)) * 100) : (atual > 0 ? 100 : 0);
  const isUp = delta > 0;
  const isFlat = delta === 0;
  // invert=true: aumento é "ruim" (saídas/cartões) -> vermelho. invert=false: aumento é "bom" -> verde
  const good = isFlat ? "mute" : (invert ? !isUp : isUp);
  const color = isFlat ? "text-ink-mute" : good === true || good === "mute" ? (isFlat ? "text-ink-mute" : "text-income") : "text-expense";
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <div className="card stub stub-mute">
      <p className="section-title mb-2">{label}</p>
      <p className="text-2xl font-semibold tabular text-ink">{formatBRL(atual)}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
          <Icon size={11} />
          {Math.abs(pct)}%
        </span>
        <span className="text-ink-mute text-xs">vs. {formatBRL(anterior)} mês anterior</span>
      </div>
    </div>
  );
}

// ── Lista com barras — breakdown por categoria ──────────────────────────────
function CategoryBars({ data, color }: { data: { categoria: string; total: number }[]; color: "income" | "expense" }) {
  if (data.length === 0) return <EmptyState icon={<Minus size={24} />} title="Sem dados neste mês" />;
  const max = Math.max(...data.map((d) => d.total));
  const barClass = color === "income" ? "bg-income/60" : "bg-expense/60";
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.categoria}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-ink-soft text-sm">{d.categoria}</span>
            <Money value={d.total} />
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RelatorioPage() {
  const { entradas, saidas, comprasCartao, dividas, cartoes } = useFinance();
  const [mes, setMes] = useState(currentMonthKey());
  const mesAnterior = addMonths(mes, -1);

  // ── Totais mês atual vs anterior ──
  const entradasAtual = totalEntradasMes(entradas, mes);
  const entradasAnt = totalEntradasMes(entradas, mesAnterior);
  const saidasAtual = totalSaidasMes(saidas, mes);
  const saidasAnt = totalSaidasMes(saidas, mesAnterior);
  const cartoesAtual = totalCartoesMes(comprasCartao, mes);
  const cartoesAnt = totalCartoesMes(comprasCartao, mesAnterior);
  const saldoAtual = saldoPrevisto(entradas, saidas, comprasCartao, mes);
  const saldoAnt = saldoPrevisto(entradas, saidas, comprasCartao, mesAnterior);

  // ── Categorias ──
  const entradasPorCategoria = porCategoria(entradasDoMes(entradas, mes), (e) => e.categoria, (e) => e.valor);
  const saidasPorCategoria = porCategoria(saidasDoMes(saidas, mes), (s) => s.categoria, (s) => s.valor);

  // ── Gastos por cartão ──
  const parcelasMes = parcelasDoMes(comprasCartao, mes);
  const gastosPorCartao = cartoes
    .map((cartao) => {
      const items = parcelasMes.filter((x) => x.compra.cartaoId === cartao.id);
      return { cartao, total: sum(items.map((x) => x.parcela.valor)), count: items.length };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  // ── Dívidas quitadas (acumulado) ──
  const dividasQuitadas = dividas.filter((d) => d.status === "quitada");

  // ── Tendência 6 meses ──
  const tendencia = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = addMonths(mes, i - 5);
      return {
        mes: formatMonthShort(m),
        Entradas: Math.round(totalEntradasMes(entradas, m)),
        Saídas: Math.round(totalSaidasMes(saidas, m) + totalCartoesMes(comprasCartao, m)),
      };
    });
  }, [mes, entradas, saidas, comprasCartao]);

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Relatório mensal</p>
          <h1 className="font-display text-2xl text-ink capitalize">{formatMonthLabel(mes)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMes((m) => addMonths(m, -1))} className="btn-icon"><ChevronLeft size={16} /></button>
          <button onClick={() => setMes((m) => addMonths(m, 1))} className="btn-icon"><ChevronRight size={16} /></button>
        </div>
      </header>

      {/* Comparação vs mês anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <ComparisonCard label="Entradas do mês" atual={entradasAtual} anterior={entradasAnt} />
        <ComparisonCard label="Saídas do mês" atual={saidasAtual} anterior={saidasAnt} invert />
        <ComparisonCard label="Em cartões" atual={cartoesAtual} anterior={cartoesAnt} invert />
        <ComparisonCard label="Saldo final" atual={saldoAtual} anterior={saldoAnt} />
      </div>

      {/* Tendência 6 meses */}
      <div className="card mb-6">
        <p className="section-title mb-4">Entradas vs. saídas — últimos 6 meses</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tendencia} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#223D36" vertical={false} />
              <XAxis dataKey="mes" stroke="#5E7972" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#5E7972" fontSize={12} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{ background: "#16302A", border: "1px solid #223D36", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#F3EFE6" }}
                formatter={(value) => formatBRL(Number(value ?? 0))}
              />
              <Bar dataKey="Entradas" fill="#6FCF97" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saídas" fill="#E0825C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="section-title mb-3">Entradas por categoria</p>
          <CategoryBars data={entradasPorCategoria} color="income" />
        </div>
        <div className="card">
          <p className="section-title mb-3">Saídas por categoria</p>
          <CategoryBars data={saidasPorCategoria} color="expense" />
        </div>
      </div>

      {/* Gastos por cartão + Dívidas quitadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="section-title mb-3">Gastos por cartão — {formatMonthLabel(mes)}</p>
          {gastosPorCartao.length === 0 ? (
            <EmptyState icon={<CreditCard size={24} />} title="Nenhuma parcela neste mês" />
          ) : (
            <div className="space-y-2">
              {gastosPorCartao.map(({ cartao, total, count }) => (
                <div key={cartao.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cartao.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-ink text-sm font-medium truncate">{cartao.nome}</p>
                    <p className="text-ink-mute text-xs">{cartao.responsavel} · {count} parcela{count > 1 ? "s" : ""}</p>
                  </div>
                  <Money value={total} />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-ink-mute text-xs">Total em cartões</span>
                <Money value={sum(gastosPorCartao.map((g) => g.total))} />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <p className="section-title mb-3">Dívidas quitadas (acumulado)</p>
          {dividasQuitadas.length === 0 ? (
            <EmptyState icon={<Landmark size={24} />} title="Nenhuma dívida quitada ainda" />
          ) : (
            <div className="space-y-2">
              {dividasQuitadas.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-border">
                  <div>
                    <p className="text-ink text-sm font-medium">{d.nome}</p>
                    <p className="text-ink-mute text-xs">{d.credor}</p>
                  </div>
                  <div className="text-right">
                    <Money value={d.valorTotal} />
                    <Badge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
