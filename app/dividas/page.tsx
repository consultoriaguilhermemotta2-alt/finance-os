"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/lib/store";
import type { Divida, StatusDivida } from "@/lib/types";
import { formatBRL, formatDate, addMonthsToDate, percent, sum } from "@/lib/utils";
import { StatCard, Badge, ProgressBar, Modal, Field, Money, EmptyState } from "@/components/ui";
import { Plus, Pencil, Trash2, CheckCircle2, Landmark } from "lucide-react";

function calcStatus(valorTotal: number, valorPago: number, vencimento: string): StatusDivida {
  if (valorPago >= valorTotal) return "quitada";
  const hoje = new Date().toISOString().slice(0, 10);
  if (vencimento < hoje) return "atrasada";
  return "em aberto";
}

const emptyForm = {
  nome: "", credor: "", valorTotal: "", valorPago: "0",
  numeroParcelas: "1", parcelasPagas: "0",
  vencimento: new Date().toISOString().slice(0, 10),
};

export default function DividasPage() {
  const { dividas, addDivida, updateDivida, deleteDivida } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Divida | null>(null);
  const [form, setForm] = useState(emptyForm);

  const valorTotalNum = parseFloat(form.valorTotal) || 0;
  const valorPagoNum = parseFloat(form.valorPago) || 0;
  const statusPreview = calcStatus(valorTotalNum, valorPagoNum, form.vencimento);
  const restantePreview = Math.max(0, valorTotalNum - valorPagoNum);
  const pctPreview = percent(valorPagoNum, valorTotalNum);

  // ── Stats ──
  const totalRestante = sum(dividas.filter((d) => d.status !== "quitada").map((d) => d.valorTotal - d.valorPago));
  const emAberto = dividas.filter((d) => d.status === "em aberto").length;
  const atrasadas = dividas.filter((d) => d.status === "atrasada").length;
  const quitadas = dividas.filter((d) => d.status === "quitada").length;

  const ordenadas = useMemo(
    () => [...dividas].sort((a, b) => {
      const order: Record<StatusDivida, number> = { "atrasada": 0, "em aberto": 1, "quitada": 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.vencimento.localeCompare(b.vencimento);
    }),
    [dividas]
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(d: Divida) {
    setEditing(d);
    setForm({
      nome: d.nome, credor: d.credor, valorTotal: String(d.valorTotal), valorPago: String(d.valorPago),
      numeroParcelas: String(d.numeroParcelas), parcelasPagas: String(d.parcelasPagas), vencimento: d.vencimento,
    });
    setModalOpen(true);
  }

  function save() {
    if (!form.nome.trim() || !form.credor.trim() || valorTotalNum <= 0) return;
    const numeroParcelas = Math.max(1, parseInt(form.numeroParcelas) || 1);
    const parcelasPagas = Math.min(numeroParcelas, Math.max(0, parseInt(form.parcelasPagas) || 0));
    const payload = {
      nome: form.nome, credor: form.credor, valorTotal: valorTotalNum, valorPago: valorPagoNum,
      numeroParcelas, parcelasPagas, vencimento: form.vencimento,
      status: calcStatus(valorTotalNum, valorPagoNum, form.vencimento),
    };
    if (editing) updateDivida(editing.id, payload);
    else addDivida(payload);
    setModalOpen(false);
  }

  /** Marca a próxima parcela como paga: incrementa valorPago/parcelasPagas,
   *  recalcula status e avança o vencimento em 1 mês (se ainda restar saldo). */
  function marcarParcelaPaga(d: Divida) {
    if (d.status === "quitada") return;
    const valorParcela = d.valorTotal / d.numeroParcelas;
    const novoValorPago = Math.min(d.valorTotal, Math.round((d.valorPago + valorParcela) * 100) / 100);
    const novasParcelasPagas = Math.min(d.numeroParcelas, d.parcelasPagas + 1);
    const novoStatus = calcStatus(d.valorTotal, novoValorPago, d.vencimento);
    const novoVencimento = novoStatus === "quitada" ? d.vencimento : addMonthsToDate(d.vencimento, 1);
    updateDivida(d.id, {
      valorPago: novoValorPago, parcelasPagas: novasParcelasPagas,
      status: novoStatus, vencimento: novoVencimento,
    });
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Dívidas</p>
          <h1 className="font-display text-2xl text-ink">Compromissos</h1>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Nova dívida</button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Restante total" value={formatBRL(totalRestante)} stub="expense" />
        <StatCard label="Em aberto" value={emAberto} mono={false} stub="info" />
        <StatCard label="Atrasadas" value={atrasadas} mono={false} stub="expense" />
        <StatCard label="Quitadas" value={quitadas} mono={false} stub="income" />
      </div>

      {ordenadas.length === 0 ? (
        <div className="card"><EmptyState icon={<Landmark size={28} />} title="Nenhuma dívida cadastrada" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ordenadas.map((d) => {
            const restante = d.valorTotal - d.valorPago;
            const pct = percent(d.valorPago, d.valorTotal);
            const stub = d.status === "quitada" ? "income" : d.status === "atrasada" ? "expense" : "info";
            return (
              <div key={d.id} className={`card stub stub-${stub}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-ink font-medium">{d.nome}</p>
                    <p className="text-ink-mute text-xs">{d.credor}</p>
                  </div>
                  <Badge status={d.status} />
                </div>

                <ProgressBar percent={pct} color={d.status === "quitada" ? "income" : "gold"} />

                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <p className="text-ink-mute text-xs">Pago</p>
                    <Money value={d.valorPago} />
                  </div>
                  <div className="text-right">
                    <p className="text-ink-mute text-xs">Restante</p>
                    <Money value={restante} />
                  </div>
                  <div>
                    <p className="text-ink-mute text-xs">Parcelas</p>
                    <p className="tabular text-ink-soft">{d.parcelasPagas}/{d.numeroParcelas} · {pct}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-ink-mute text-xs">Vencimento</p>
                    <p className="tabular text-ink-soft">{formatDate(d.vencimento)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                  {d.status !== "quitada" && (
                    <button onClick={() => marcarParcelaPaga(d)} className="btn-ghost text-xs flex-1 justify-center">
                      <CheckCircle2 size={13} /> Marcar parcela paga
                    </button>
                  )}
                  <button onClick={() => openEdit(d)} className="btn-icon" title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => deleteDivida(d.id)} className="btn-icon hover:text-expense" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar dívida" : "Nova dívida"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome da dívida">
              <input className="input" placeholder="Ex: Empréstimo pessoal" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </Field>
            <Field label="Credor">
              <input className="input" placeholder="Ex: Banco Pan" value={form.credor} onChange={(e) => setForm((f) => ({ ...f, credor: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor total (R$)">
              <input type="number" step="0.01" className="input" value={form.valorTotal} onChange={(e) => setForm((f) => ({ ...f, valorTotal: e.target.value }))} />
            </Field>
            <Field label="Valor já pago (R$)">
              <input type="number" step="0.01" className="input" value={form.valorPago} onChange={(e) => setForm((f) => ({ ...f, valorPago: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número de parcelas">
              <input type="number" min="1" className="input" value={form.numeroParcelas} onChange={(e) => setForm((f) => ({ ...f, numeroParcelas: e.target.value }))} />
            </Field>
            <Field label="Parcelas pagas">
              <input type="number" min="0" className="input" value={form.parcelasPagas} onChange={(e) => setForm((f) => ({ ...f, parcelasPagas: e.target.value }))} />
            </Field>
          </div>
          <Field label="Próximo vencimento">
            <input type="date" className="input" value={form.vencimento} onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))} />
          </Field>

          {/* Preview automático */}
          <div className="stub stub-gold bg-surface-2 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-ink-soft text-sm">Saldo restante</span>
              <Money value={restantePreview} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft text-sm">Progresso</span>
              <span className="tabular text-gold text-sm">{pctPreview}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft text-sm">Status calculado</span>
              <Badge status={statusPreview} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button onClick={save} className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
