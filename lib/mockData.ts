import type { Entrada, Saida, Cartao, CompraCartao, Divida, Meta } from "./types";
import { gerarParcelas } from "./utils";

// Placeholder até a sessão real ser carregada — ver lib/store.tsx, que
// re-associa (ou substitui) estes registros ao `user_id` autenticado.
export const SEED_USER_ID = "seed";

// ============================================================================
// ENTRADAS
// ----------------------------------------------------------------------------
// Mock de receitas da consultoria Team Motta + serviços avulsos, abril a
// junho de 2026. Junho (mês atual) mistura "recebido" e "previsto" para
// alimentar o cálculo de saldo real vs. previsto no Dashboard.
// ============================================================================
const rawEntradas: Omit<Entrada, "userId">[] = [
  // ── Abril 2026 ──
  { id: "e-abr-1", data: "2026-04-01", categoria: "Consultoria", descricao: "Mensalidades consultoria — abril", valor: 1800, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-abr-2", data: "2026-04-05", categoria: "Treino individualizado", descricao: "Treinos individuais — abril", valor: 390, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-abr-3", data: "2026-04-10", categoria: "Planilha", descricao: "Venda de planilha pronta", valor: 97, status: "recebido", formaRecebimento: "Cartão" },
  { id: "e-abr-4", data: "2026-04-18", categoria: "Bicos", descricao: "Aula avulsa", valor: 120, status: "recebido", formaRecebimento: "Dinheiro" },
  { id: "e-abr-5", data: "2026-04-22", categoria: "Extras", descricao: "Consultoria pontual — avaliação física", valor: 250, status: "recebido", formaRecebimento: "Pix" },

  // ── Maio 2026 ──
  { id: "e-mai-1", data: "2026-05-01", categoria: "Consultoria", descricao: "Mensalidades consultoria — maio", valor: 2100, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-mai-2", data: "2026-05-05", categoria: "Treino individualizado", descricao: "Treinos individuais — maio", valor: 520, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-mai-3", data: "2026-05-12", categoria: "Reembolsos", descricao: "Reembolso de material para cliente", valor: 80, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-mai-4", data: "2026-05-18", categoria: "Planilha", descricao: "Venda planilha + e-book de receitas", valor: 194, status: "recebido", formaRecebimento: "Cartão" },
  { id: "e-mai-5", data: "2026-05-27", categoria: "Outros", descricao: "Cashback cartão", valor: 15.4, status: "recebido", formaRecebimento: "Pix" },

  // ── Junho 2026 (mês atual) ──
  { id: "e-jun-1", data: "2026-06-01", categoria: "Consultoria", descricao: "Mensalidades consultoria — junho", valor: 2200, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-jun-2", data: "2026-06-03", categoria: "Treino individualizado", descricao: "Treinos individuais — junho", valor: 480, status: "recebido", formaRecebimento: "Pix" },
  { id: "e-jun-3", data: "2026-06-08", categoria: "Planilha", descricao: "Venda planilha pronta", valor: 97, status: "recebido", formaRecebimento: "Cartão" },
  { id: "e-jun-4", data: "2026-06-15", categoria: "Bicos", descricao: "Aula experimental", valor: 80, status: "previsto", formaRecebimento: "Dinheiro" },
  { id: "e-jun-5", data: "2026-06-20", categoria: "Extras", descricao: "Indicação de parceria", valor: 150, status: "previsto", formaRecebimento: "Pix" },
  { id: "e-jun-6", data: "2026-06-28", categoria: "Consultoria", descricao: "Fechamento novo cliente", valor: 510, status: "previsto", formaRecebimento: "Pix" },
];

export const entradas: Entrada[] = rawEntradas.map((e) => ({ ...e, userId: SEED_USER_ID }));

// ============================================================================
// SAÍDAS
// ----------------------------------------------------------------------------
// Gastos fixos importados da planilha (total R$960,21), aplicados em
// abril/maio (já liquidados) e junho (status reais da planilha).
// ============================================================================
const gastosFixos: Omit<Saida, "id" | "userId" | "data" | "status">[] = [
  { categoria: "Moradia",          descricao: "Conta condomínio",       valor: 82.00,  formaPagamento: "Pix/Débito" },
  { categoria: "Assinaturas",      descricao: "Telefone Vivo",          valor: 61.71,  formaPagamento: "Pix/Débito" },
  { categoria: "Pet",              descricao: "Remédio do cachorro",    valor: 80.00,  formaPagamento: "Dinheiro" },
  { categoria: "Assinaturas",      descricao: "IPTV",                   valor: 44.10,  formaPagamento: "Cartão de crédito" },
  { categoria: "Moradia",          descricao: "Conta de luz",           valor: 327.00, formaPagamento: "Pix/Débito" },
  { categoria: "Pet",              descricao: "Ração",                  valor: 86.00,  formaPagamento: "Dinheiro" },
  { categoria: "Cuidados pessoais",descricao: "Barbeiro",               valor: 120.00, formaPagamento: "Pix/Débito" },
  { categoria: "Saúde",            descricao: "Academia",               valor: 137.50, formaPagamento: "Cartão de crédito" },
  { categoria: "Assinaturas",      descricao: "YouTube Music",          valor: 21.90,  formaPagamento: "Cartão de crédito" },
];

const diasVencimento = [15, 25, 10, 3, 12, 10, 10, 25, 25];

function gerarGastosFixosDoMes(mes: "04" | "05" | "06", statuses: Saida["status"][]): Saida[] {
  return gastosFixos.map((g, i) => ({
    ...g,
    id: `s-${mes}-${i + 1}`,
    userId: SEED_USER_ID,
    data: `2026-${mes}-${String(diasVencimento[i]).padStart(2, "0")}`,
    status: statuses[i],
  }));
}

export const saidas: Saida[] = [
  // Abril — tudo liquidado
  ...gerarGastosFixosDoMes("04", ["pago","pago","pago","pago","pago","pago","pago","pago","pago"]),
  // Maio — tudo liquidado
  ...gerarGastosFixosDoMes("05", ["pago","pago","pago","pago","pago","pago","pago","pago","pago"]),
  // Junho — status reais da planilha (mês atual)
  ...gerarGastosFixosDoMes("06", ["pendente","atrasado","pendente","pago","pago","pendente","pago","pago","pago"]),
];

// ============================================================================
// CARTÕES
// ----------------------------------------------------------------------------
// Um cartão por responsável + os 3 cartões pessoais do Guilherme
// identificados na planilha como "(Mo)" = Motta.
// ============================================================================
const rawCartoes: Omit<Cartao, "userId">[] = [
  { id: "cartao-nubank",      nome: "Nubank",        responsavel: "Guilherme", cor: "#B89AE0", diaFechamento: 20, diaVencimento: 28 },
  { id: "cartao-mercadopago", nome: "Mercado Pago",  responsavel: "Guilherme", cor: "#6FAEDB", diaFechamento: 18, diaVencimento: 25 },
  { id: "cartao-picpay",      nome: "PicPay",        responsavel: "Guilherme", cor: "#6FCF97", diaFechamento: 15, diaVencimento: 25 },
  { id: "cartao-pai",         nome: "Cartão do Pai", responsavel: "Pai",       cor: "#D9A94F", diaFechamento: 5,  diaVencimento: 10 },
  { id: "cartao-namorada",    nome: "Cartão pessoal",responsavel: "Namorada",  cor: "#E0825C" },
  { id: "cartao-outros",      nome: "Outros",        responsavel: "Outros",    cor: "#5E7972" },
];

export const cartoes: Cartao[] = rawCartoes.map((c) => ({ ...c, userId: SEED_USER_ID }));

// ============================================================================
// COMPRAS NO CARTÃO (parceladas)
// ----------------------------------------------------------------------------
// Recalculadas a partir da planilha: valorTotal = valorParcela × numeroParcelas,
// parcelasPagas conforme a diferença entre o total e as parcelas restantes
// informadas. mesInicial derivado da data de vencimento da próxima parcela.
// ============================================================================
function compra(
  id: string, cartaoId: string, descricao: string,
  valorParcela: number, numeroParcelas: number, mesInicial: string, parcelasPagas: number,
  dataCompra: string
): CompraCartao {
  const valorTotal = Math.round(valorParcela * numeroParcelas * 100) / 100;
  return {
    id, userId: SEED_USER_ID, cartaoId, descricao, valorTotal, numeroParcelas, valorParcela, dataCompra, mesInicial,
    parcelas: gerarParcelas(valorTotal, numeroParcelas, mesInicial, parcelasPagas),
  };
}

export const comprasCartao: CompraCartao[] = [
  compra("c-elitepass",  "cartao-nubank",      "Elitepass — assinatura anual",     93.81, 7, "2026-03", 1, "2026-03-12"),
  compra("c-icloud",     "cartao-nubank",      "iCloud — armazenamento",            5.90, 7, "2026-03", 1, "2026-03-12"),
  compra("c-onedrive",   "cartao-nubank",      "OneDrive — armazenamento",         50.90, 7, "2026-03", 1, "2026-03-12"),
  compra("c-platforma",  "cartao-nubank",      "Plataforma Elite — software",      39.90, 5, "2026-03", 1, "2026-03-12"),
  compra("c-personal10k","cartao-nubank",      "Personal 10k — curso",             60.16, 7, "2026-03", 1, "2026-03-12"),
  compra("c-telefone",   "cartao-nubank",      "Celular novo — parcelado",        121.05, 7, "2026-02", 2, "2026-02-12"),
  compra("c-hormonios",  "cartao-nubank",      "Formação em Hormônios",           245.96, 8, "2026-03", 1, "2026-03-12"),
  compra("c-treinoio",   "cartao-nubank",      "Treino.io — assinatura plataforma", 75.63, 11, "2026-06", 0, "2026-06-12"),

  compra("c-rotativo",   "cartao-mercadopago", "Saldo rotativo refinanciado",     276.00, 9, "2026-05", 0, "2026-05-25"),
  compra("c-escada",     "cartao-mercadopago", "Método Escada — mentoria",        206.84, 9, "2026-05", 0, "2026-05-25"),

  compra("c-monitor",    "cartao-pai",         "Monitor para home office",         72.50, 9, "2025-11", 5, "2025-11-10"),

  compra("c-picpay-1",   "cartao-picpay",      "Compra avulsa",                   420.00, 1, "2026-05", 0, "2026-05-25"),
];

// ============================================================================
// DÍVIDAS
// ----------------------------------------------------------------------------
// Compromissos maiores, fora do ciclo de cartão — mock representativo
// cobrindo os 3 status possíveis.
// ============================================================================
const rawDividas: Omit<Divida, "userId">[] = [
  {
    id: "d-consignado",
    nome: "Empréstimo pessoal",
    credor: "Banco Pan",
    valorTotal: 5000,
    valorPago: 1500,
    numeroParcelas: 24,
    parcelasPagas: 7,
    vencimento: "2026-06-10",
    status: "em aberto",
  },
  {
    id: "d-notebook",
    nome: "Financiamento notebook",
    credor: "Magalu",
    valorTotal: 2400,
    valorPago: 2400,
    numeroParcelas: 12,
    parcelasPagas: 12,
    vencimento: "2026-03-05",
    status: "quitada",
  },
  {
    id: "d-acordo-itau",
    nome: "Acordo cartão antigo",
    credor: "Itaú",
    valorTotal: 1200,
    valorPago: 400,
    numeroParcelas: 6,
    parcelasPagas: 2,
    vencimento: "2026-06-05",
    status: "atrasada",
  },
];

export const dividas: Divida[] = rawDividas.map((d) => ({ ...d, userId: SEED_USER_ID }));

// ============================================================================
// METAS
// ============================================================================
const rawMetas: Omit<Meta, "userId">[] = [
  { id: "m-reserva",  nome: "Reserva de emergência",  valorAlvo: 10000, valorAtual: 3200, prazo: "2026-12-31", status: "em andamento" },
  { id: "m-nubank",   nome: "Quitar saldo Nubank",     valorAlvo: 2484,  valorAtual: 0,    prazo: "2027-01-25", status: "em andamento" },
  { id: "m-viagem",   nome: "Viagem fim de ano",       valorAlvo: 4000,  valorAtual: 4000, prazo: "2026-11-30", status: "concluída" },
  { id: "m-notebook", nome: "Trocar notebook",         valorAlvo: 6000,  valorAtual: 1200, prazo: "2027-06-30", status: "pausada" },
];

export const metas: Meta[] = rawMetas.map((m) => ({ ...m, userId: SEED_USER_ID }));
