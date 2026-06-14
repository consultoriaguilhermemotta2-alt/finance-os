"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { formatBRL } from "@/lib/utils";

// ============================================================================
// StatCard — KPI card used on Dashboard / Relatório
// ============================================================================
type StubColor = "income" | "expense" | "gold" | "info" | "mute";

export function StatCard({
  label, value, sub, stub = "mute", mono = true,
}: {
  label: string;
  value: string | number;
  sub?: string;
  stub?: StubColor;
  mono?: boolean;
}) {
  return (
    <div className={`card stub stub-${stub}`}>
      <p className="section-title mb-2">{label}</p>
      <p className={`text-2xl font-semibold text-ink ${mono ? "tabular" : "font-display"}`}>
        {value}
      </p>
      {sub && <p className="text-ink-mute text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ============================================================================
// Badge — status pill
// ============================================================================
const BADGE_STYLES: Record<string, string> = {
  // Entradas
  recebido:   "bg-income-dim text-income",
  previsto:   "bg-info-dim text-info",
  // Saídas
  pago:       "bg-income-dim text-income",
  pendente:   "bg-gold-dim/40 text-gold",
  atrasado:   "bg-expense-dim text-expense",
  // Dívidas
  "em aberto":"bg-info-dim text-info",
  quitada:    "bg-income-dim text-income",
  atrasada:   "bg-expense-dim text-expense",
  // Metas
  "em andamento": "bg-info-dim text-info",
  "concluída":    "bg-income-dim text-income",
  pausada:        "bg-gold-dim/40 text-gold",
  // Parcelas
  paga: "bg-income-dim text-income",
};

export function Badge({ status }: { status: string }) {
  const cls = BADGE_STYLES[status] || "bg-surface-3 text-ink-soft";
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ============================================================================
// ProgressBar — used for metas
// ============================================================================
export function ProgressBar({ percent, color = "gold" }: { percent: number; color?: StubColor }) {
  const barColor: Record<StubColor, string> = {
    income: "bg-income", expense: "bg-expense", gold: "bg-gold", info: "bg-info", mute: "bg-ink-mute",
  };
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
      <div className={`h-full rounded-full ${barColor[color]} transition-all duration-300`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ============================================================================
// Modal — generic dialog wrapper
// ============================================================================
export function Modal({
  open, onClose, title, children, maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`card w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// EmptyState
// ============================================================================
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="text-center py-14 text-ink-mute">
      <div className="flex justify-center mb-2 opacity-40">{icon}</div>
      <p className="text-sm text-ink-soft">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

// ============================================================================
// Field — labeled form field wrapper
// ============================================================================
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-ink-mute text-xs mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// ============================================================================
// Money — formatted currency, always tabular, optional sign coloring
// ============================================================================
export function Money({ value, signed = false }: { value: number; signed?: boolean }) {
  const color = signed ? (value >= 0 ? "text-income" : "text-expense") : "text-ink";
  const sign = signed && value > 0 ? "+" : "";
  return <span className={`tabular ${color}`}>{sign}{formatBRL(value)}</span>;
}
