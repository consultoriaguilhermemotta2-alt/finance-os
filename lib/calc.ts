import type { Entrada, Saida, CompraCartao, Divida, Parcela } from "./types";
import { sum } from "./utils";

// ── Filtros por mês ──────────────────────────────────────────────────────────
export function entradasDoMes(entradas: Entrada[], mes: string): Entrada[] {
  return entradas.filter((e) => e.data.startsWith(mes));
}

export function saidasDoMes(saidas: Saida[], mes: string): Saida[] {
  return saidas.filter((s) => s.data.startsWith(mes));
}

export function parcelasDoMes(
  compras: CompraCartao[],
  mes: string
): { compra: CompraCartao; parcela: Parcela }[] {
  const out: { compra: CompraCartao; parcela: Parcela }[] = [];
  for (const c of compras) {
    for (const p of c.parcelas) {
      if (p.mesReferencia === mes) out.push({ compra: c, parcela: p });
    }
  }
  return out;
}

// ── Totais ────────────────────────────────────────────────────────────────────
export function totalEntradasMes(entradas: Entrada[], mes: string): number {
  return sum(entradasDoMes(entradas, mes).map((e) => e.valor));
}

export function totalSaidasMes(saidas: Saida[], mes: string): number {
  return sum(saidasDoMes(saidas, mes).map((s) => s.valor));
}

export function totalCartoesMes(compras: CompraCartao[], mes: string): number {
  return sum(parcelasDoMes(compras, mes).map((x) => x.parcela.valor));
}

export function totalDividasPendentes(dividas: Divida[]): number {
  return sum(
    dividas.filter((d) => d.status !== "quitada").map((d) => d.valorTotal - d.valorPago)
  );
}

// ── Saldos ────────────────────────────────────────────────────────────────────
/** Saldo real: apenas o que já entrou/saiu efetivamente (recebido / pago) */
export function saldoReal(entradas: Entrada[], saidas: Saida[], mes: string): number {
  const recebido = sum(
    entradasDoMes(entradas, mes).filter((e) => e.status === "recebido").map((e) => e.valor)
  );
  const pago = sum(
    saidasDoMes(saidas, mes).filter((s) => s.status === "pago").map((s) => s.valor)
  );
  return recebido - pago;
}

/** Saldo previsto: tudo que está programado para o mês, recebido ou não */
export function saldoPrevisto(
  entradas: Entrada[], saidas: Saida[], compras: CompraCartao[], mes: string
): number {
  return totalEntradasMes(entradas, mes) - totalSaidasMes(saidas, mes) - totalCartoesMes(compras, mes);
}

// ── Agrupamento por categoria genérico ──────────────────────────────────────
export function porCategoria<T>(
  items: T[],
  getCategoria: (item: T) => string,
  getValor: (item: T) => number
): { categoria: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const cat = getCategoria(item);
    map.set(cat, (map.get(cat) ?? 0) + getValor(item));
  }
  return Array.from(map.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
}
