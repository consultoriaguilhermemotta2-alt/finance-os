import type { Parcela } from "./types";

// ── Formatação ──────────────────────────────────────────────────────────────
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

export function formatMonthLabel(monthKey: string): string {
  // "2026-06" -> "junho de 2026"
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function formatMonthShort(monthKey: string): string {
  // "2026-06" -> "jun"
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

// ── Datas / meses ────────────────────────────────────────────────────────────
/** Retorna "yyyy-mm" para uma data ISO yyyy-mm-dd */
export function getMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Soma (ou subtrai) `n` meses a um monthKey "yyyy-mm", retornando "yyyy-mm" */
export function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Soma (ou subtrai) `n` meses a uma data ISO yyyy-mm-dd, preservando o dia (com clamp no fim do mês) */
export function addMonthsToDate(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(ny, nm, 0).getDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

/** monthKey do mês atual */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Compara dois monthKeys; retorna -1, 0, 1 */
export function compareMonthKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ── Parcelas ─────────────────────────────────────────────────────────────────
/**
 * Gera o array de parcelas de uma compra.
 * Ex: gerarParcelas(1200, 6, "2026-04") -> 6 parcelas de R$200.
 * A última parcela absorve a diferença de arredondamento, garantindo que
 * a soma das parcelas seja sempre exatamente igual a `valorTotal`.
 */
export function gerarParcelas(
  valorTotal: number,
  numeroParcelas: number,
  mesInicial: string,
  parcelasPagas = 0
): Parcela[] {
  const valorParcela = Math.round((valorTotal / numeroParcelas) * 100) / 100;
  const somaPrimeiras = Math.round(valorParcela * (numeroParcelas - 1) * 100) / 100;
  const valorUltima = Math.round((valorTotal - somaPrimeiras) * 100) / 100;
  return Array.from({ length: numeroParcelas }, (_, i) => ({
    numero: i + 1,
    mesReferencia: addMonths(mesInicial, i),
    valor: i === numeroParcelas - 1 ? valorUltima : valorParcela,
    status: i < parcelasPagas ? "paga" : "pendente",
  }));
}

// ── Helpers numéricos ────────────────────────────────────────────────────────
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
