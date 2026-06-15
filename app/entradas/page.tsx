"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/lib/store";
import type { Entrada, CategoriaEntrada, StatusEntrada } from "@/lib/types";
import {
  currentMonthKey, addMonths, formatMonthLabel, formatBRL, formatDate, sum,
} from "@/lib/utils";
import { StatCard, Badge, Modal, Field, Money, EmptyState } from "@/components/ui";
import {
  Plus, ChevronLeft, ChevronRight, Pencil, Trash2, CheckCircle2,
  ArrowDownToLine, Search,
} from "lucide-react";

const CATEGORIAS: CategoriaEntrada[] = [
  "Salário", "Consultoria", "Treino individualizado", "Planilha", "Bicos", "Extras", "Reembolsos", "Outros",
];

const FORMAS = ["Pix", "Dinheiro", "Cartão", "Transferência", "Boleto"];

const CATEGORIA_COLOR: Record<string, string> = {
  "Salário": "bg-income-dim text-income",
  "Consultoria": "bg-info-dim text-info",
  "Treino individualizado": "bg-purple/15 text-purple",
  "Planilha": "bg-gold-dim/40 text-gold",
  "Bicos": "bg-surface-3 text-ink-soft",
  "Extras": "bg-surface-3 text-ink-soft",
  "Reembolsos": "bg-expense-dim text-expense",
  "Outros": "bg-surface-3 text-ink-soft",
};

const emptyForm = {
  data: new Date().toISOString().slice(0, 10),
  categoria: "Consultoria" as CategoriaEntrada,
  descricao: "",
  valor: "",
  status: "previsto" as StatusEntrada,
  formaRecebimento: "Pix",
  observacao: "",
};

export default function EntradasPage() {
  const { entradas, addEntrada, updateEntrada, deleteEntrada } = useFinance();
  const [mes, setMes] = useState(currentMonthKey());
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | CategoriaEntrada>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusEntrada>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Entrada | null>(null);
  const [form, setForm] = useState(emptyForm);

  const doMes = useMemo(() => entradas.filter((e) => e.data.startsWith(mes)), [entradas, mes]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doMes
      .filter((e) => filtroCategoria === "todas" || e.categoria === filtroCategoria)
      .filter((e) => filtroStatus === "todos" || e.status === filtroStatus)
      .filter((e) => e.descricao.toLowerCase().includes(q) || e.categoria.toLowerCase().includes(q))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [doMes, search, filtroCategoria, filtroStatus]);

  const totalRecebido = sum(doMes.filter((e) => e.status === "recebido").map((e) => e.valor));
  const totalPrevisto = sum(doMes.filter((e) => e.status === "previsto").map((e) => e.valor));
  const totalGeral = totalRecebido + totalPrevisto;

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(e: Entrada) {
    setEditing(e);
    setForm({
      data: e.data, categoria: e.categoria, descricao: e.descricao,
      valor: String(e.valor), status: e.status, formaRecebimento: e.formaRecebimento,
      observacao: e.observacao || "",
    });
    setModalOpen(true);
  }

  function save() {
    if (!form.descricao.trim() || !form.valor) return;
    const payload = {
      data: form.data, categoria: form.categoria, descricao: form.descricao,
      valor: parseFloat(form.valor), status: form.status,
      formaRecebimento: form.formaRecebimento, observacao: form.observacao || undefined,
    };
    if (editing) updateEntrada(editing.id, payload);
    else addEntrada(payload);
    setModalOpen(false);
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Entradas</p>
          <h1 className="font-display text-2xl text-ink">Receitas</h1>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Nova entrada</button>
      </header>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setMes((m) => addMonths(m, -1))} className="btn-icon"><ChevronLeft size={16} /></button>
        <span className="font-display text-ink capitalize min-w-[160px] text-center">{formatMonthLabel(mes)}</span>
        <button onClick={() => setMes((m) => addMonths(m, 1))} className="btn-icon"><ChevronRight size={16} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Recebido" value={formatBRL(totalRecebido)} stub="income" />
        <StatCard label="Previsto" value={formatBRL(totalPrevisto)} stub="info" />
        <StatCard label="Total do mês" value={formatBRL(totalGeral)} stub="gold" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-8" placeholder="Buscar descrição ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as "todas" | CategoriaEntrada)}>
          <option value="todas">Todas categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-auto" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as "todos" | StatusEntrada)}>
          <option value="todos">Todos status</option>
          <option value="recebido">Recebido</option>
          <option value="previsto">Previsto</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<ArrowDownToLine size={28} />} title="Nenhuma entrada encontrada" hint="Ajuste os filtros ou registre uma nova entrada." /></div>
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
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0 group hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 pr-3 tabular text-ink-soft whitespace-nowrap">{formatDate(e.data)}</td>
                  <td className="py-2.5 pr-3"><span className={`badge ${CATEGORIA_COLOR[e.categoria]}`}>{e.categoria}</span></td>
                  <td className="py-2.5 pr-3 text-ink">
                    {e.descricao}
                    {e.observacao && <p className="text-ink-mute text-xs mt-0.5">{e.observacao}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-soft whitespace-nowrap">{e.formaRecebimento}</td>
                  <td className="py-2.5 pr-3"><Badge status={e.status} /></td>
                  <td className="py-2.5 pr-3 text-right"><Money value={e.valor} /></td>
                  <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.status === "previsto" && (
                        <button onClick={() => updateEntrada(e.id, { status: "recebido" })} className="btn-icon" title="Marcar como recebido">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(e)} className="btn-icon" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => deleteEntrada(e.id)} className="btn-icon hover:text-expense" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={5} className="pt-3 text-ink-mute text-xs">Total filtrado</td>
                <td className="pt-3 text-right"><Money value={sum(filtered.map((e) => e.valor))} /></td>
                <td className="pt-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar entrada" : "Nova entrada"}>
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
            <select className="input" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaEntrada }))}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <input className="input" placeholder="Ex: Mensalidades consultoria" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StatusEntrada }))}>
                <option value="previsto">Previsto</option>
                <option value="recebido">Recebido</option>
              </select>
            </Field>
            <Field label="Forma de recebimento">
              <input className="input" list="formas-recebimento" value={form.formaRecebimento} onChange={(e) => setForm((f) => ({ ...f, formaRecebimento: e.target.value }))} />
              <datalist id="formas-recebimento">
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
