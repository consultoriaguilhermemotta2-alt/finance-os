"use client";

import Link from "next/link";
import { useFinance } from "@/lib/store";
import {
  currentMonthKey, formatMonthLabel, formatBRL, formatDate, percent,
} from "@/lib/utils";
import {
  totalEntradasMes, totalSaidasMes, totalCartoesMes, totalDividasPendentes,
  saldoReal, saldoPrevisto, parcelasDoMes,
} from "@/lib/calc";
import { StatCard, ProgressBar, Money, EmptyState } from "@/components/ui";
import { ArrowUpFromLine, CreditCard, Target, ChevronRight, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { entradas, saidas, comprasCartao, dividas, metas, cartoes, updateSaida } = useFinance();
  const mes = currentMonthKey();

  const totalEntradas = totalEntradasMes(entradas, mes);
  const totalSaidas = totalSaidasMes(saidas, mes);
  const totalCartoes = totalCartoesMes(comprasCartao, mes);
  const dividasPend = totalDividasPendentes(dividas);
  const real = saldoReal(entradas, saidas, mes);
  const previsto = saldoPrevisto(entradas, saidas, comprasCartao, mes);
  const metasAndamento = metas.filter((m) => m.status === "em andamento");

  // Contas a pagar — saídas pendentes/atrasadas do mês, vencimento mais próximo primeiro
  const contasAPagar = saidas
    .filter((s) => s.data.startsWith(mes) && s.status !== "pago")
    .sort((a, b) => a.data.localeCompare(b.data));

  // Fatura do mês — parcelas devidas neste mês, agrupadas por cartão
  const parcelasMes = parcelasDoMes(comprasCartao, mes);
  const faturaPorCartao = cartoes
    .map((cartao) => {
      const items = parcelasMes.filter((x) => x.compra.cartaoId === cartao.id);
      const total = items.reduce((s, x) => s + x.parcela.valor, 0);
      return { cartao, total, count: items.length };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <header className="mb-6">
        <p className="section-title mb-1">Dashboard</p>
        <h1 className="font-display text-2xl text-ink capitalize">{formatMonthLabel(mes)}</h1>
      </header>

      {/* ── Hero: Saldo ──────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="section-title mb-2">Saldo previsto do mês</p>
            <p className={`font-display text-4xl sm:text-5xl tabular ${previsto >= 0 ? "text-income" : "text-expense"}`}>
              {formatBRL(previsto)}
            </p>
            <div className="mt-3 h-px w-40 bg-gradient-to-r from-gold to-transparent" />
          </div>
          <div className="text-left sm:text-right">
            <p className="section-title mb-2">Saldo real (até agora)</p>
            <p className={`font-display text-2xl tabular ${real >= 0 ? "text-income" : "text-expense"}`}>
              {formatBRL(real)}
            </p>
            <p className="text-ink-mute text-xs mt-1">Recebido − pago, sem previstos</p>
          </div>
        </div>
      </div>

      {/* ── KPI grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Entradas do mês" value={formatBRL(totalEntradas)} stub="income" />
        <StatCard label="Saídas do mês" value={formatBRL(totalSaidas)} stub="expense" />
        <StatCard label="Em cartões (mês)" value={formatBRL(totalCartoes)} stub="info" />
        <StatCard label="Dívidas pendentes" value={formatBRL(dividasPend)} stub="gold" />
        <StatCard label="Metas em andamento" value={metasAndamento.length} mono={false} stub="mute" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* ── Contas a pagar ─────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Contas a pagar — {formatMonthLabel(mes)}</p>
            <Link href="/saidas" className="text-gold text-xs hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={11} />
            </Link>
          </div>
          {contasAPagar.length === 0 ? (
            <EmptyState icon={<ArrowUpFromLine size={28} />} title="Tudo pago este mês" />
          ) : (
            <div className="space-y-1.5">
              {contasAPagar.map((s) => (
                <div key={s.id} className={`stub stub-${s.status === "atrasado" ? "expense" : "gold"} flex items-center justify-between py-1.5`}>
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium truncate">{s.descricao}</p>
                    <p className="text-ink-mute text-xs">{s.categoria} · vence {formatDate(s.data)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Money value={s.valor} />
                    <button
                      onClick={() => updateSaida(s.id, { status: "pago" })}
                      className="btn-icon"
                      title="Marcar como pago"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Metas em andamento ─────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Metas em andamento</p>
            <Link href="/metas" className="text-gold text-xs hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={11} />
            </Link>
          </div>
          {metasAndamento.length === 0 ? (
            <EmptyState icon={<Target size={28} />} title="Nenhuma meta em andamento" />
          ) : (
            <div className="space-y-3">
              {metasAndamento.map((m) => {
                const pct = percent(m.valorAtual, m.valorAlvo);
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-ink text-sm font-medium">{m.nome}</p>
                      <p className="text-ink-soft text-xs tabular">{pct}%</p>
                    </div>
                    <ProgressBar percent={pct} color="gold" />
                    <p className="text-ink-mute text-xs mt-1">
                      {formatBRL(m.valorAtual)} de {formatBRL(m.valorAlvo)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Fatura do mês por cartão ─────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title">Fatura do mês por cartão</p>
          <Link href="/cartoes" className="text-gold text-xs hover:underline flex items-center gap-1">
            Ver cartões <ChevronRight size={11} />
          </Link>
        </div>
        {faturaPorCartao.length === 0 ? (
          <EmptyState icon={<CreditCard size={28} />} title="Nenhuma parcela neste mês" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {faturaPorCartao.map(({ cartao, total, count }) => (
              <div key={cartao.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cartao.cor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-ink text-sm font-medium truncate">{cartao.nome}</p>
                  <p className="text-ink-mute text-xs">{cartao.responsavel} · {count} parcela{count > 1 ? "s" : ""}</p>
                </div>
                <Money value={total} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
