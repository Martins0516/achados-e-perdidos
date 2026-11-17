// =====================================================
// PÁGINA INICIAL: lista, filtros e botão "É meu!"
// =====================================================

let todosOsItens = [];      // guarda os itens que vieram do banco
let itemSelecionado = null; // item aberto na janela "É meu!"

// Elementos da lista e dos filtros
const listaItens         = document.getElementById('listaItens');
const carregando         = document.getElementById('carregando');
const resumoBusca        = document.getElementById('resumoBusca');
const semResultados      = document.getElementById('semResultados');
const textoSemResultados = document.getElementById('textoSemResultados');
const btnLimparFiltros   = document.getElementById('btnLimparFiltros');
const linkCadastrarVazio = document.getElementById('linkCadastrarVazio');
const filtroBusca        = document.getElementById('filtroBusca');
const filtroCategoria    = document.getElementById('filtroCategoria');
const filtroStatus       = document.getElementById('filtroStatus');

// Elementos da janela "É meu!"
const modal            = new bootstrap.Modal(document.getElementById('modalEhMeu'));
const checkConfirmacao = document.getElementById('checkConfirmacao');
const btnConfirmar     = document.getElementById('btnConfirmarDevolucao');
const erroModal        = document.getElementById('erroModal');

// Aviso que aparece no canto da tela
const toast = new bootstrap.Toast(document.getElementById('toastAviso'));


// 1) Preenche o <select> de categorias
CATEGORIAS.forEach(cat => {
  filtroCategoria.innerHTML += `<option value="${cat.nome}">${cat.nome}</option>`;
});


// 2) Mostra aviso de sucesso se veio do cadastro (index.html?cadastrado=1)
if (new URLSearchParams(window.location.search).get('cadastrado')) {
  document.getElementById('alertaSucesso').classList.remove('d-none');
  // Tira o "?cadastrado=1" do endereço para o aviso não voltar ao atualizar a página
  history.replaceState(null, '', window.location.pathname);
}


// 3) Busca os itens no Supabase
async function carregarItens() {
  carregando.classList.remove('d-none');
  semResultados.classList.add('d-none');
  listaItens.innerHTML = '';

  const { data, error } = await db
    .from('itens')
    .select('*')
    .order('created_at', { ascending: false });

  carregando.classList.add('d-none');

  if (error) {
    listaItens.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center gap-3">
          <div class="flex-grow-1">
            Não foi possível carregar os itens. Confira sua internet ou a configuração do Supabase em <code>js/supabase.js</code>.
            <br><small>${escaparHtml(error.message)}</small>
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm" id="btnTentarDeNovo">Tentar de novo</button>
        </div>
      </div>`;
    document.getElementById('btnTentarDeNovo').addEventListener('click', carregarItens);
    resumoBusca.textContent = '';
    return;
  }

  todosOsItens = data;
  atualizarContadores();
  mostrarItens();
}


// 4) Atualiza os números do topo
function atualizarContadores() {
  const disponiveis = todosOsItens.filter(i => i.status === 'disponivel').length;
  const devolvidos  = todosOsItens.filter(i => i.status === 'devolvido').length;
  document.getElementById('totalDisponiveis').textContent = disponiveis;
  document.getElementById('totalDevolvidos').textContent  = devolvidos;
}


// 5) Aplica os filtros e desenha os cards na tela
function mostrarItens() {
  // Cada palavra digitada precisa aparecer em algum lugar do item
  // ("garrafa azul" encontra "Garrafa térmica azul")
  const palavras  = normalizarTexto(filtroBusca.value).split(/\s+/).filter(p => p !== '');
  const categoria = filtroCategoria.value;
  const status    = filtroStatus.value;

  const filtrados = todosOsItens.filter(item => {
    const texto = normalizarTexto(
      `${item.nome} ${item.descricao || ''} ${item.categoria} ${item.local_encontrado} ${item.local_retirada}`
    );
    return palavras.every(p => texto.includes(p))
        && (!categoria || item.categoria === categoria)
        && (!status    || item.status === status);
  });

  listaItens.innerHTML = filtrados.map(criarCard).join('');
  resumoBusca.textContent = filtrados.length === 1 ? '1 item' : `${filtrados.length} itens`;
  mostrarAvisoVazio(filtrados.length === 0);
}


// 6) Quando não aparece nenhum item, explica o motivo
function mostrarAvisoVazio(vazio) {
  semResultados.classList.toggle('d-none', !vazio);
  if (!vazio) return;

  const bancoVazio = todosOsItens.length === 0;
  textoSemResultados.textContent = bancoVazio
    ? 'Ainda não tem nenhum item cadastrado. Achou alguma coisa? Seja o primeiro a cadastrar.'
    : 'Nenhum item encontrado com esses filtros.';

  btnLimparFiltros.classList.toggle('d-none', bancoVazio);
  linkCadastrarVazio.classList.toggle('d-none', !bancoVazio);
}


// 7) Monta o HTML de um card
function criarCard(item) {
  const devolvido = item.status === 'devolvido';
  const icone = iconeDaCategoria(item.categoria);

  const imagem = item.foto_url
    ? `<img src="${escaparHtml(item.foto_url)}" class="foto" alt="Foto: ${escaparHtml(item.nome)}" loading="lazy">`
    : `<div class="sem-foto" aria-hidden="true"><i class="bi ${icone}"></i></div>`;

  const botao = devolvido
    ? `<div class="selo-devolvido"><i class="bi bi-check-circle-fill"></i> Devolvido ao dono</div>`
    : `<button type="button" class="btn btn-primary w-100" data-id="${item.id}">
         <i class="bi bi-hand-index-thumb"></i> É meu!
       </button>`;

  return `
    <div class="col-sm-6 col-lg-4 col-xl-3">
      <article class="card card-item h-100 ${devolvido ? 'devolvido' : ''}">
        <div class="moldura-foto">${imagem}</div>
        <div class="card-body d-flex flex-column">
          <span class="badge-categoria"><i class="bi ${icone}"></i> ${escaparHtml(item.categoria)}</span>
          <h3 class="card-title h5">${escaparHtml(item.nome)}</h3>
          ${item.descricao ? `<p class="card-text descricao">${escaparHtml(item.descricao)}</p>` : ''}
          <ul class="info-lista">
            <li><i class="bi bi-geo-alt"></i><span>${escaparHtml(item.local_encontrado)}</span></li>
            <li><i class="bi bi-calendar-event"></i><span>Achado ${tempoDesde(item.data_encontrado)}, ${formatarData(item.data_encontrado)}</span></li>
          </ul>
          <div class="mt-auto">${botao}</div>
        </div>
      </article>
    </div>`;
}


// 8) Abre a janela "É meu!" com as informações de retirada
function abrirModal(id) {
  itemSelecionado = todosOsItens.find(i => i.id === id);
  if (!itemSelecionado) return;

  const modalDescricao = document.getElementById('modalDescricao');
  modalDescricao.textContent = itemSelecionado.descricao || '';
  modalDescricao.classList.toggle('d-none', !itemSelecionado.descricao);

  document.getElementById('modalNome').textContent       = itemSelecionado.nome;
  document.getElementById('modalEncontrado').textContent = itemSelecionado.local_encontrado;
  document.getElementById('modalData').textContent       = formatarData(itemSelecionado.data_encontrado);
  document.getElementById('modalRetirada').textContent   = itemSelecionado.local_retirada;

  const temContato = Boolean(itemSelecionado.contato);
  document.getElementById('modalContatoBox').classList.toggle('d-none', !temContato);
  document.getElementById('modalContato').textContent = itemSelecionado.contato || '';

  // A janela sempre abre com a confirmação desmarcada
  checkConfirmacao.checked = false;
  btnConfirmar.disabled = true;
  erroModal.classList.add('d-none');

  modal.show();
}


// 9) Clique no "É meu!" de qualquer card
// Em vez de colocar um onclick em cada botão, a lista inteira escuta os cliques
// e descobre qual item foi escolhido pelo atributo data-id do botão
listaItens.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-id]');
  if (botao) abrirModal(Number(botao.dataset.id));
});


// 10) O botão só libera depois que a pessoa marca que já retirou o item
checkConfirmacao.addEventListener('change', () => {
  btnConfirmar.disabled = !checkConfirmacao.checked;
});


// 11) Marca o item como devolvido no banco
btnConfirmar.addEventListener('click', async () => {
  if (!itemSelecionado) return;

  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
  erroModal.classList.add('d-none');

  // O .select() devolve as linhas que foram alteradas
  const { data, error } = await db
    .from('itens')
    .update({ status: 'devolvido', devolvido_em: new Date().toISOString() })
    .eq('id', itemSelecionado.id)
    .select();

  btnConfirmar.innerHTML = '<i class="bi bi-check2-circle"></i> Já peguei meu item';

  if (error) {
    erroModal.textContent = 'Não foi possível salvar. Tente de novo. (' + error.message + ')';
    erroModal.classList.remove('d-none');
    btnConfirmar.disabled = false;
    return;
  }

  modal.hide();

  // Nenhuma linha alterada = alguém já tinha marcado esse item como devolvido
  if (data.length === 0) {
    mostrarToast('Esse item já tinha sido marcado como devolvido. A lista foi atualizada.');
    carregarItens();
    return;
  }

  itemSelecionado.status = 'devolvido';
  itemSelecionado.devolvido_em = data[0].devolvido_em;
  atualizarContadores();
  mostrarItens();
  mostrarToast('Que bom que você recuperou seu item!');
});


// 12) Mostra uma mensagem rápida no canto da tela
function mostrarToast(mensagem) {
  document.getElementById('toastTexto').textContent = mensagem;
  toast.show();
}


// 13) Filtra sempre que o usuário digita ou troca uma opção
filtroBusca.addEventListener('input', mostrarItens);
filtroCategoria.addEventListener('change', mostrarItens);
filtroStatus.addEventListener('change', mostrarItens);

// Botão "Procurar meu item" do topo: rola até a lista e já deixa o cursor na busca
document.getElementById('btnProcurar').addEventListener('click', (evento) => {
  evento.preventDefault();
  filtroBusca.scrollIntoView({ behavior: 'smooth', block: 'center' });
  filtroBusca.focus({ preventScroll: true });
});

// "Ver todos os itens" limpa os filtros e mostra tudo, inclusive os devolvidos
btnLimparFiltros.addEventListener('click', () => {
  filtroBusca.value = '';
  filtroCategoria.value = '';
  filtroStatus.value = '';
  mostrarItens();
});


carregarItens();
