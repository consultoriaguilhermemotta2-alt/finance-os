"use client";

import { useState } from "react";
import { useFinance } from "@/lib/store";
import type { Meta, StatusMeta } from "@/lib/types";
import { formatBRL, formatDate, percent, sum } from "@/lib/utils";
import { StatCard, Badge, ProgressBar, Modal, Field, EmptyState } from "@/components/ui";
import { Plus, Pencil, Trash2, Target, PlusCircle } from "lucide-react";

function calcStatus(valorAtual: number, valorAlvo: number, manual: "em andamento" | "pausada"): StatusMeta {
  if (valorAlvo > 0 && valorAtual >= valorAlvo) return "concluída";
  return manual;
}

const emptyForm = {
  nome: "", valorAlvo: "", valorAtual: "0",
  prazo: new Date().toISOString().slice(0, 10),
  manualStatus: "em andamento" as "em andamento" | "pausada",
};

export default function MetasPage() {
  const { metas, addMeta, updateMeta, deleteMeta } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [aportes, setAportes] = useState<Record<string, string>>({});

  const valorAlvoNum = parseFloat(form.valorAlvo) || 0;
  const valorAtualNum = parseFloat(form.valorAtual) || 0;
  const pctPreview = percent(valorAtualNum, valorAlvoNum);
  const statusPreview = calcStatus(valorAtualNum, valorAlvoNum, form.manualStatus);

  // ── Stats ──
  const emAndamento = metas.filter((m) => m.status === "em andamento").length;
  const concluidas = metas.filter((m) => m.status === "concluída").length;
  const pausadas = metas.filter((m) => m.status === "pausada").length;
  const totalAcumulado = sum(metas.map((m) => m.valorAtual));

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(m: Meta) {
    setEditing(m);
    setForm({
      nome: m.nome, valorAlvo: String(m.valorAlvo), valorAtual: String(m.valorAtual),
      prazo: m.prazo, manualStatus: m.status === "pausada" ? "pausada" : "em andamento",
    });
    setModalOpen(true);
  }

  function save() {
    if (!form.nome.trim() || valorAlvoNum <= 0) return;
    const payload = {
      nome: form.nome, valorAlvo: valorAlvoNum, valorAtual: valorAtualNum, prazo: form.prazo,
      status: calcStatus(valorAtualNum, valorAlvoNum, form.manualStatus),
    };
    if (editing) updateMeta(editing.id, payload);
    else addMeta(payload);
    setModalOpen(false);
  }

  function aplicarAporte(m: Meta) {
    const valor = parseFloat(aportes[m.id] || "");
    if (!valor || valor <= 0) return;
    const novoValor = Math.min(m.valorAlvo, Math.round((m.valorAtual + valor) * 100) / 100);
    const novoStatus = calcStatus(novoValor, m.valorAlvo, m.status === "pausada" ? "pausada" : "em andamento");
    updateMeta(m.id, { valorAtual: novoValor, status: novoStatus });
    setAportes((p) => ({ ...p, [m.id]: "" }));
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Metas</p>
          <h1 className="font-display text-2xl text-ink">Objetivos financeiros</h1>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Nova meta</button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Acumulado total" value={formatBRL(totalAcumulado)} stub="gold" />
        <StatCard label="Em andamento" value={emAndamento} mono={false} stub="info" />
        <StatCard label="Concluídas" value={concluidas} mono={false} stub="income" />
        <StatCard label="Pausadas" value={pausadas} mono={false} stub="mute" />
      </div>

      {metas.length === 0 ? (
        <div className="card"><EmptyState icon={<Target size={28} />} title="Nenhuma meta cadastrada" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {metas.map((m) => {
            const pct = percent(m.valorAtual, m.valorAlvo);
            const stub = m.status === "concluída" ? "income" : m.status === "pausada" ? "mute" : "gold";
            return (
              <div key={m.id} className={`card stub stub-${stub}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-ink font-medium">{m.nome}</p>
                  <Badge status={m.status} />
                </div>

                <ProgressBar percent={pct} color={m.status === "concluída" ? "income" : "gold"} />

                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="tabular text-ink-soft">{formatBRL(m.valorAtual)} <span className="text-ink-mute">de</span> {formatBRL(m.valorAlvo)}</span>
                  <span className="tabular text-gold">{pct}%</span>
                </div>
                <p className="text-ink-mute text-xs mt-1">Prazo: {formatDate(m.prazo)}</p>

                {m.status !== "concluída" && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
                    <input
                      type="number" step="0.01" placeholder="Adicionar valor"
                      className="input text-xs flex-1"
                      value={aportes[m.id] || ""}
                      onChange={(e) => setAportes((p) => ({ ...p, [m.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && aplicarAporte(m)}
                    />
                    <button onClick={() => aplicarAporte(m)} className="btn-ghost text-xs" title="Adicionar aporte">
                      <PlusCircle size={13} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                  <button onClick={() => openEdit(m)} className="btn-ghost text-xs flex-1 justify-center"><Pencil size={13} /> Editar</button>
                  <button onClick={() => deleteMeta(m.id)} className="btn-icon hover:text-expense" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar meta" : "Nova meta"}>
        <div className="space-y-3">
          <Field label="Nome da meta">
            <input className="input" placeholder="Ex: Reserva de emergência" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor alvo (R$)">
              <input type="number" step="0.01" className="input" value={form.valorAlvo} onChange={(e) => setForm((f) => ({ ...f, valorAlvo: e.target.value }))} />
            </Field>
            <Field label="Valor atual (R$)">
              <input type="number" step="0.01" className="input" value={form.valorAtual} onChange={(e) => setForm((f) => ({ ...f, valorAtual: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prazo">
              <input type="date" className="input" value={form.prazo} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} />
            </Field>
            <Field label="Status (se não concluída)">
              <select className="input" value={form.manualStatus} onChange={(e) => setForm((f) => ({ ...f, manualStatus: e.target.value as "em andamento" | "pausada" }))}>
                <option value="em andamento">Em andamento</option>
                <option value="pausada">Pausada</option>
              </select>
            </Field>
          </div>

          {/* Preview automático */}
          <div className="stub stub-gold bg-surface-2 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-ink-soft text-sm">Progresso</span>
              <span className="tabular text-gold text-sm">{pctPreview}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft text-sm">Status calculado</span>
              <Badge status={statusPreview} />
            </div>
            {statusPreview === "concluída" && (
              <p className="text-ink-mute text-xs">Atingiu o valor alvo — marcada como concluída automaticamente.</p>
            )}
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
