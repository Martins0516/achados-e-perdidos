// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// Pegue esses dados em: Project Settings > API Keys (e Data API para a URL)
// =====================================================
const SUPABASE_URL = 'https://ysrjbchovcvwllxvrori.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2NXQDpxLMsls9gplB-ne6w_j3_eeN_L'; // chave pública (pode ficar no site)

// "supabase" vem do script carregado pelo CDN no HTML
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =====================================================
// CATEGORIAS
// Usadas no filtro da lista, no formulário e no ícone dos cards
// =====================================================
const CATEGORIAS = [
  { nome: 'Eletrônicos',         icone: 'bi-phone' },
  { nome: 'Documentos',          icone: 'bi-person-vcard' },
  { nome: 'Garrafas e copos',    icone: 'bi-cup-straw' },
  { nome: 'Roupas e acessórios', icone: 'bi-bag' },
  { nome: 'Material escolar',    icone: 'bi-pencil' },
  { nome: 'Chaves',              icone: 'bi-key' },
  { nome: 'Carteiras e bolsas',  icone: 'bi-wallet2' },
  { nome: 'Outros',              icone: 'bi-box-seam' }
];

// Retorna o ícone de uma categoria
function iconeDaCategoria(nome) {
  const cat = CATEGORIAS.find(c => c.nome === nome);
  return cat ? cat.icone : 'bi-box-seam';
}


// =====================================================
// FUNÇÕES AUXILIARES (usadas nas duas páginas)
// =====================================================

// Evita que textos digitados pelos usuários quebrem o HTML (proteção contra XSS)
function escaparHtml(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Converte "2026-11-17" em "17/11/2026"
function formatarData(dataIso) {
  if (!dataIso) return '';
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// Diz há quanto tempo foi uma data: "hoje", "ontem" ou "há 3 dias"
function tempoDesde(dataIso) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const UM_DIA = 24 * 60 * 60 * 1000;
  const dias = Math.round((hoje - data) / UM_DIA);

  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

// Deixa o texto em minúsculas e sem acentos.
// Assim a busca por "termica" encontra "Garrafa térmica".
function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
