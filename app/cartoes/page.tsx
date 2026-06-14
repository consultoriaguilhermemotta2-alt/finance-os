"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/lib/store";
import type { CompraCartao, Responsavel } from "@/lib/types";
import {
  currentMonthKey, formatBRL, formatDate, formatMonthShort, sum,
} from "@/lib/utils";
import { totalCartoesMes } from "@/lib/calc";
import { StatCard, Modal, Field, Money, EmptyState } from "@/components/ui";
import {
  Plus, CreditCard, ChevronDown, ChevronRight, Trash2, Check, Circle,
} from "lucide-react";

const RESPONSAVEIS: Responsavel[] = ["Guilherme", "Namorada", "Pai", "Outros"];

const CORES = [
  { hex: "#B89AE0", nome: "Roxo" },
  { hex: "#6FAEDB", nome: "Azul" },
  { hex: "#6FCF97", nome: "Verde" },
  { hex: "#D9A94F", nome: "Dourado" },
  { hex: "#E0825C", nome: "Terracota" },
  { hex: "#5E7972", nome: "Verde-acinzentado" },
];

const emptyCompraForm = {
  cartaoId: "",
  descricao: "",
  valorTotal: "",
  numeroParcelas: "1",
  dataCompra: new Date().toISOString().slice(0, 10),
  mesInicial: currentMonthKey(),
};

const emptyCartaoForm = { nome: "", responsavel: "Guilherme" as Responsavel, cor: CORES[0].hex };

// ── Linha de compra com parcelas expansíveis ────────────────────────────────
function CompraRow({ compra, onToggle, onDelete }: {
  compra: CompraCartao;
  onToggle: (compraId: string, numero: number) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pagas = compra.parcelas.filter((p) => p.status === "paga").length;
  const quitada = pagas === compra.numeroParcelas;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-2/50 transition-colors cursor-pointer"
      >
        {open ? (
          <ChevronDown size={14} className="text-ink-mute shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-ink-mute shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-ink text-sm font-medium truncate">
            {compra.descricao}
          </p>

          <p className="text-ink-mute text-xs">
            {formatDate(compra.dataCompra)} ·{" "}
            {quitada
              ? "Quitada"
              : `${pagas}/${compra.numeroParcelas} parcelas pagas`}
          </p>
        </div>

        <div className="text-right shrink-0">
          <Money value={compra.valorTotal} />

          <p className="text-ink-mute text-xs tabular">
            {compra.numeroParcelas}x {formatBRL(compra.valorParcela)}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(compra.id);
          }}
          className="btn-icon hover:text-expense shrink-0"
          title="Excluir compra"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-surface-2/30">
          <p className="text-ink-mute text-xs mb-2">
            Clique numa parcela para marcar como paga / pendente
          </p>

          <div className="flex flex-wrap gap-1.5">
            {compra.parcelas.map((p) => (
              <button
                type="button"
                key={p.numero}
                onClick={() => onToggle(compra.id, p.numero)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors ${
                  p.status === "paga"
                    ? "bg-income-dim text-income border-income/30"
                    : "bg-surface text-ink-soft border-border hover:border-gold/40"
                }`}
              >
                {p.status === "paga" ? (
                  <Check size={11} />
                ) : (
                  <Circle size={11} />
                )}

                <span className="tabular">
                  {p.numero}/{compra.numeroParcelas}
                </span>

                <span className="text-ink-mute">
                  {formatMonthShort(p.mesReferencia)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartoesPage() {
  const { cartoes, comprasCartao, addCartao, addCompraCartao, toggleParcela, deleteCompraCartao } = useFinance();
  const [filtroResp, setFiltroResp] = useState<"todos" | Responsavel>("todos");
  const [compraModal, setCompraModal] = useState(false);
  const [cartaoModal, setCartaoModal] = useState(false);
  const [compraForm, setCompraForm] = useState(emptyCompraForm);
  const [cartaoForm, setCartaoForm] = useState(emptyCartaoForm);

  const mes = currentMonthKey();

  // ── Stats globais ──
  const totalEmAberto = sum(
    comprasCartao.flatMap((c) => c.parcelas.filter((p) => p.status === "pendente").map((p) => p.valor))
  );
  const emCartoesMes = totalCartoesMes(comprasCartao, mes);
  const comprasAtivas = comprasCartao.filter((c) => c.parcelas.some((p) => p.status === "pendente")).length;

  const cartoesFiltrados = useMemo(
    () => (filtroResp === "todos" ? cartoes : cartoes.filter((c) => c.responsavel === filtroResp)),
    [cartoes, filtroResp]
  );

  function comprasDoCartao(cartaoId: string) {
    return comprasCartao.filter((c) => c.cartaoId === cartaoId);
  }

  function totalEmAbertoCartao(cartaoId: string) {
    return sum(
      comprasDoCartao(cartaoId).flatMap((c) => c.parcelas.filter((p) => p.status === "pendente").map((p) => p.valor))
    );
  }

  // ── Preview da compra ──
  const valorTotalNum = parseFloat(compraForm.valorTotal) || 0;
  const numParcelasNum = Math.max(1, parseInt(compraForm.numeroParcelas) || 1);
  const valorParcelaPreview = Math.round((valorTotalNum / numParcelasNum) * 100) / 100;

  function openNovaCompra(cartaoId?: string) {
    setCompraForm({ ...emptyCompraForm, cartaoId: cartaoId || cartoes[0]?.id || "" });
    setCompraModal(true);
  }

  function salvarCompra() {
    if (!compraForm.cartaoId || !compraForm.descricao.trim() || valorTotalNum <= 0) return;
    addCompraCartao({
      cartaoId: compraForm.cartaoId,
      descricao: compraForm.descricao,
      valorTotal: valorTotalNum,
      numeroParcelas: numParcelasNum,
      dataCompra: compraForm.dataCompra,
      mesInicial: compraForm.mesInicial,
    });
    setCompraModal(false);
  }

  function salvarCartao() {
    if (!cartaoForm.nome.trim()) return;
    addCartao(cartaoForm.nome, cartaoForm.responsavel, cartaoForm.cor);
    setCartaoModal(false);
    setCartaoForm(emptyCartaoForm);
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="section-title mb-1">Cartões</p>
          <h1 className="font-display text-2xl text-ink">Cartões de crédito</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCartaoModal(true)} className="btn-ghost"><Plus size={14} /> Novo cartão</button>
          <button onClick={() => openNovaCompra()} className="btn-primary"><Plus size={14} /> Nova compra</button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total em aberto" value={formatBRL(totalEmAberto)} stub="expense" />
        <StatCard label="Em cartões este mês" value={formatBRL(emCartoesMes)} stub="info" />
        <StatCard label="Compras ativas" value={comprasAtivas} mono={false} stub="gold" />
      </div>

      {/* Resumo por responsável */}
      <div className="card mb-5">
        <p className="section-title mb-3">Resumo por responsável</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RESPONSAVEIS.map((r) => {
            const cartoesResp = cartoes.filter((c) => c.responsavel === r);
            const totalResp = sum(cartoesResp.map((c) => totalEmAbertoCartao(c.id)));
            const mesResp = sum(
              cartoesResp.flatMap((c) =>
                comprasDoCartao(c.id).flatMap((compra) =>
                  compra.parcelas.filter((p) => p.mesReferencia === mes).map((p) => p.valor)
                )
              )
            );
            return (
              <div key={r} className="stub stub-mute">
                <p className="text-ink text-sm font-medium">{r}</p>
                <p className="text-ink-mute text-xs mb-1">{cartoesResp.length} cartão{cartoesResp.length !== 1 ? "ões" : ""}</p>
                <Money value={totalResp} />
                <p className="text-ink-mute text-xs mt-0.5">{formatBRL(mesResp)} este mês</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtro responsável */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setFiltroResp("todos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            filtroResp === "todos" ? "bg-gold/12 text-gold border-gold/25" : "border-border text-ink-mute hover:text-ink-soft"
          }`}
        >
          Todos
        </button>
        {RESPONSAVEIS.map((r) => (
          <button
            key={r}
            onClick={() => setFiltroResp(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroResp === r ? "bg-gold/12 text-gold border-gold/25" : "border-border text-ink-mute hover:text-ink-soft"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {cartoesFiltrados.map((cartao) => {
          const compras = comprasDoCartao(cartao.id);
          const totalAberto = totalEmAbertoCartao(cartao.id);
          return (
            <div key={cartao.id} className="card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cartao.cor }} />
                  <div>
                    <p className="text-ink font-medium">{cartao.nome}</p>
                    <p className="text-ink-mute text-xs">{cartao.responsavel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-ink-mute text-xs">Em aberto</p>
                    <Money value={totalAberto} />
                  </div>
                  <button onClick={() => openNovaCompra(cartao.id)} className="btn-icon" title="Nova compra neste cartão">
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {compras.length === 0 ? (
                <EmptyState icon={<CreditCard size={24} />} title="Nenhuma compra registrada" />
              ) : (
                <div className="space-y-2">
                  {compras.map((compra) => (
                    <CompraRow key={compra.id} compra={compra} onToggle={toggleParcela} onDelete={deleteCompraCartao} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal — Nova compra */}
      <Modal open={compraModal} onClose={() => setCompraModal(false)} title="Nova compra parcelada">
        <div className="space-y-3">
          <Field label="Cartão">
            <select className="input" value={compraForm.cartaoId} onChange={(e) => setCompraForm((f) => ({ ...f, cartaoId: e.target.value }))}>
              {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.responsavel}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <input className="input" placeholder="Ex: Notebook em 10x" value={compraForm.descricao} onChange={(e) => setCompraForm((f) => ({ ...f, descricao: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor total (R$)">
              <input type="number" step="0.01" className="input" placeholder="1200,00" value={compraForm.valorTotal} onChange={(e) => setCompraForm((f) => ({ ...f, valorTotal: e.target.value }))} />
            </Field>
            <Field label="Número de parcelas">
              <input type="number" min="1" className="input" value={compraForm.numeroParcelas} onChange={(e) => setCompraForm((f) => ({ ...f, numeroParcelas: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data da compra">
              <input type="date" className="input" value={compraForm.dataCompra} onChange={(e) => setCompraForm((f) => ({ ...f, dataCompra: e.target.value }))} />
            </Field>
            <Field label="Mês inicial (1ª parcela)">
              <input type="month" className="input" value={compraForm.mesInicial} onChange={(e) => setCompraForm((f) => ({ ...f, mesInicial: e.target.value }))} />
            </Field>
          </div>
          {valorTotalNum > 0 && (
            <div className="stub stub-gold bg-surface-2 rounded-lg py-2">
              <p className="text-ink-soft text-sm">
                Gera <span className="text-gold font-medium">{numParcelasNum}x</span> de{" "}
                <span className="tabular text-gold">{formatBRL(valorParcelaPreview)}</span>
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setCompraModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button onClick={salvarCompra} className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Modal — Novo cartão */}
      <Modal open={cartaoModal} onClose={() => setCartaoModal(false)} title="Novo cartão">
        <div className="space-y-3">
          <Field label="Nome do cartão">
            <input className="input" placeholder="Ex: Nubank, Inter, Itaú..." value={cartaoForm.nome} onChange={(e) => setCartaoForm((f) => ({ ...f, nome: e.target.value }))} />
          </Field>
          <Field label="Responsável">
            <select className="input" value={cartaoForm.responsavel} onChange={(e) => setCartaoForm((f) => ({ ...f, responsavel: e.target.value as Responsavel }))}>
              {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Cor de identificação">
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setCartaoForm((f) => ({ ...f, cor: c.hex }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${cartaoForm.cor === c.hex ? "border-ink scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.nome}
                />
              ))}
            </div>
          </Field>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setCartaoModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button onClick={salvarCartao} className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
