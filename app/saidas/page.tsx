"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/lib/store";
import type { Saida, CategoriaSaida, StatusSaida } from "@/lib/types";
import {
  currentMonthKey, addMonths, formatMonthLabel, formatBRL, formatDate, sum,
} from "@/lib/utils";
import { StatCard, Badge, Modal, Field, Money, EmptyState } from "@/components/ui";
import {
  Plus, ChevronLeft, ChevronRight, Pencil, Trash2, CheckCircle2,
  ArrowUpFromLine, Search,
} from "lucide-react";

const CATEGORIAS: CategoriaSaida[] = [
  "Moradia", "Saúde", "Pet", "Assinaturas", "Cuidados pessoais", "Lazer", "Transporte", "Alimentação", "Outros",
];

const FORMAS = ["Pix/Débito", "Dinheiro", "Cartão de crédito", "Boleto", "Transferência"];

const CATEGORIA_COLOR: Record<string, string> = {
  "Moradia": "bg-info-dim text-info",
  "Saúde": "bg-income-dim text-income",
  "Pet": "bg-gold-dim/40 text-gold",
  "Assinaturas": "bg-purple/15 text-purple",
  "Cuidados pessoais": "bg-surface-3 text-ink-soft",
  "Lazer": "bg-purple/15 text-purple",
  "Transporte": "bg-info-dim text-info",
  "Alimentação": "bg-gold-dim/40 text-gold",
  "Outros": "bg-surface-3 text-ink-soft",
};

const emptyForm = {
  data: new Date().toISOString().slice(0, 10),
  categoria: "Moradia" as CategoriaSaida,
  descricao: "",
  valor: "",
  status: "pendente" as StatusSaida,
  formaPagamento: "Pix/Débito",
  observacao: "",
};

export default function SaidasPage() {
  const { saidas, addSaida, updateSaida, deleteSaida } = useFinance();
  const [mes, setMes] = useState(currentMonthKey());
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | CategoriaSaida>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusSaida>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Saida | null>(null);
  const [form, setForm] = useState(emptyForm);

  const doMes = useMemo(() => saidas.filter((s) => s.data.startsWith(mes)), [saidas, mes]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doMes
      .filter((s) => filtroCategoria === "todas" || s.categoria === filtroCategoria)
      .filter((s) => filtroStatus === "todos" || s.status === filtroStatus)
      .filter((s) => s.descricao.toLowerCase().includes(q) || s.categoria.toLowerCase().includes(q))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [doMes, search, filtroCategoria, filtroStatus]);

  const totalPago = sum(doMes.filter((s) => s.status === "pago").map((s) => s.valor));
  const totalPendente = sum(doMes.filter((s) => s.status === "pendente").map((s) => s.valor));
  const totalAtrasado = sum(doMes.filter((s) => s.status === "atrasado").map((s) => s.valor));
  const totalGeral = totalPago + totalPendente + totalAtrasado;

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s: Saida) {
    setEditing(s);
    setForm({
      data: s.data, categoria: s.categoria, descricao: s.descricao,
      valor: String(s.valor), status: s.status, formaPagamento: s.formaPagamento,
      observacao: s.observacao || "",
    });
    setModalOpen(true);
  }

  function save() {
    if (!form.descricao.trim() || !form.valor) return;
    const payload = {
      data: form.data, categoria: form.categoria, descricao: form.descricao,
      valor: parseFloat(form.valor), status: form.status,
      formaPagamento: form.formaPagamento, observacao: form.observacao || undefined,
    };
    if (editing) updateSaida(editing.id, payload);
    else addSaida(payload);
    setModalOpen(false);
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Saídas</p>
          <h1 className="font-display text-2xl text-ink">Despesas</h1>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Nova saída</button>
      </header>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setMes((m) => addMonths(m, -1))} className="btn-icon"><ChevronLeft size={16} /></button>
        <span className="font-display text-ink capitalize min-w-[160px] text-center">{formatMonthLabel(mes)}</span>
        <button onClick={() => setMes((m) => addMonths(m, 1))} className="btn-icon"><ChevronRight size={16} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pago" value={formatBRL(totalPago)} stub="income" />
        <StatCard label="Pendente" value={formatBRL(totalPendente)} stub="gold" />
        <StatCard label="Atrasado" value={formatBRL(totalAtrasado)} stub="expense" />
        <StatCard label="Total do mês" value={formatBRL(totalGeral)} stub="info" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-8" placeholder="Buscar descrição ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as any)}>
          <option value="todas">Todas categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-auto" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as any)}>
          <option value="todos">Todos status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<ArrowUpFromLine size={28} />} title="Nenhuma saída encontrada" hint="Ajuste os filtros ou registre uma nova saída." /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="section-title pb-2 pr-3">Data</th>
                <th className="section-title pb-2 pr-3">Categoria</th>
                <th className="section-title pb-2 pr-3">Descrição</th>
                <th className="section-title pb-2 pr-3">Forma</th>
                <th className="section-title pb-2 pr-3">Status</th>
                <th className="section-title pb-2 pr-3 text-right">Valor</th>
                <th className="section-title pb-2 pl-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0 group hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 pr-3 tabular text-ink-soft whitespace-nowrap">{formatDate(s.data)}</td>
                  <td className="py-2.5 pr-3"><span className={`badge ${CATEGORIA_COLOR[s.categoria]}`}>{s.categoria}</span></td>
                  <td className="py-2.5 pr-3 text-ink">
                    {s.descricao}
                    {s.observacao && <p className="text-ink-mute text-xs mt-0.5">{s.observacao}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-soft whitespace-nowrap">{s.formaPagamento}</td>
                  <td className="py-2.5 pr-3"><Badge status={s.status} /></td>
                  <td className="py-2.5 pr-3 text-right"><Money value={s.valor} /></td>
                  <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.status !== "pago" && (
                        <button onClick={() => updateSaida(s.id, { status: "pago" })} className="btn-icon" title="Marcar como pago">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(s)} className="btn-icon" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => deleteSaida(s.id)} className="btn-icon hover:text-expense" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={5} className="pt-3 text-ink-mute text-xs">Total filtrado</td>
                <td className="pt-3 text-right"><Money value={sum(filtered.map((s) => s.valor))} /></td>
                <td className="pt-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar saída" : "Nova saída"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <input type="date" className="input" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            </Field>
            <Field label="Valor (R$)">
              <input type="number" step="0.01" className="input" placeholder="0,00" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} />
            </Field>
          </div>
          <Field label="Categoria">
            <select className="input" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaSaida }))}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <input className="input" placeholder="Ex: Conta de luz" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusSaida }))}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </Field>
            <Field label="Forma de pagamento">
              <input className="input" list="formas-pagamento" value={form.formaPagamento} onChange={(e) => setForm((f) => ({ ...f, formaPagamento: e.target.value }))} />
              <datalist id="formas-pagamento">
                {FORMAS.map((f) => <option key={f} value={f} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Observação (opcional)">
            <textarea className="input resize-none h-16" value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button onClick={save} className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
