// =====================================================
// PÁGINA DE CADASTRO: formulário + envio da foto
// =====================================================

const form              = document.getElementById('formItem');
const selectCategoria   = document.getElementById('categoria');
const campoDescricao    = document.getElementById('descricao');
const contadorDescricao = document.getElementById('contadorDescricao');
const campoData         = document.getElementById('dataEncontrado');
const campoFoto         = document.getElementById('foto');
const boxPrevia         = document.getElementById('boxPrevia');
const previaFoto        = document.getElementById('previaFoto');
const btnRemoverFoto    = document.getElementById('btnRemoverFoto');
const erroForm          = document.getElementById('erroForm');
const btnEnviar         = document.getElementById('btnEnviar');

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB (mesmo limite do bucket no Supabase)
const LADO_MAXIMO_FOTO    = 1280;            // a foto é reduzida para no máximo 1280px de largura ou altura

let urlPrevia = null; // endereço temporário da prévia da foto


// 1) Preenche as categorias no <select>
CATEGORIAS.forEach(cat => {
  selectCategoria.innerHTML += `<option value="${cat.nome}">${cat.nome}</option>`;
});


// 2) A data começa como hoje e não pode ser no futuro
const hoje = new Date();
const hojeTexto = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
campoData.value = hojeTexto;
campoData.max = hojeTexto;


// 3) Contador de caracteres da descrição (ex: 42/300)
function atualizarContador() {
  contadorDescricao.textContent = `${campoDescricao.value.length}/${campoDescricao.maxLength}`;
}
campoDescricao.addEventListener('input', atualizarContador);
atualizarContador();


// 4) Mostra uma prévia da foto escolhida
campoFoto.addEventListener('change', () => {
  const arquivo = campoFoto.files[0];
  erroForm.classList.add('d-none');

  if (!arquivo) {
    removerFoto();
    return;
  }

  if (!arquivo.type.startsWith('image/')) {
    removerFoto();
    mostrarErro('O arquivo escolhido não é uma imagem. Escolha uma foto JPG ou PNG.');
    return;
  }

  if (urlPrevia) URL.revokeObjectURL(urlPrevia); // libera a prévia anterior da memória
  urlPrevia = URL.createObjectURL(arquivo);
  previaFoto.src = urlPrevia;
  boxPrevia.classList.remove('d-none');
});

// Botão "remover foto" da prévia
function removerFoto() {
  campoFoto.value = '';
  if (urlPrevia) URL.revokeObjectURL(urlPrevia);
  urlPrevia = null;
  previaFoto.removeAttribute('src');
  boxPrevia.classList.add('d-none');
}
btnRemoverFoto.addEventListener('click', removerFoto);


// 5) Mostra uma mensagem de erro em cima do botão de enviar
function mostrarErro(mensagem) {
  erroForm.textContent = mensagem;
  erroForm.classList.remove('d-none');
  erroForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// 6) Trava o botão enquanto envia, para não cadastrar duas vezes
function travarBotao(travar) {
  btnEnviar.disabled = travar;
  btnEnviar.innerHTML = travar
    ? '<span class="spinner-border spinner-border-sm"></span> Enviando...'
    : '<i class="bi bi-send"></i> Cadastrar item';
}


// 7) Diminui a foto antes de enviar
// Foto de celular costuma ter de 3 a 8 MB. Desenhando ela num <canvas> menor
// e salvando como JPEG, ela fica com poucas centenas de KB e carrega rápido na lista.
async function reduzirFoto(arquivo) {
  let imagem;
  try {
    imagem = await createImageBitmap(arquivo);
  } catch {
    throw new Error('não deu para abrir essa foto. Tente uma imagem JPG ou PNG.');
  }

  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);

  const contexto = canvas.getContext('2d');
  contexto.fillStyle = '#fff'; // fundo branco para imagens PNG transparentes
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

  // toBlob transforma o desenho do canvas num arquivo JPEG (qualidade 80%)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
}


// 8) Envia a foto para o Storage e devolve o link público
async function enviarFoto(arquivo) {
  const foto = await reduzirFoto(arquivo);
  if (!foto) throw new Error('não deu para preparar a foto. Tente outra imagem.');
  if (foto.size > TAMANHO_MAXIMO_FOTO) throw new Error('a foto é muito grande. Escolha uma de até 5 MB.');

  const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await db.storage
    .from('fotos')
    .upload(nomeArquivo, foto, { contentType: 'image/jpeg' });
  if (error) throw error;

  const { data } = db.storage.from('fotos').getPublicUrl(nomeArquivo);
  return data.publicUrl;
}


// 9) Tira os espaços do começo e do fim dos campos de texto
// Assim um campo preenchido só com espaços conta como vazio na validação
function limparEspacos() {
  form.querySelectorAll('input[type="text"], textarea').forEach(campo => {
    campo.value = campo.value.trim();
  });
  atualizarContador();
}


// 10) Quando o formulário é enviado
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erroForm.classList.add('d-none');
  limparEspacos();

  // Validação do Bootstrap (campos obrigatórios)
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    // Leva a pessoa até o primeiro campo com problema
    form.querySelector('input:invalid, select:invalid, textarea:invalid').focus();
    return;
  }

  travarBotao(true);

  try {
    const arquivo = campoFoto.files[0];
    const fotoUrl = arquivo ? await enviarFoto(arquivo) : null;

    const novoItem = {
      nome:             document.getElementById('nome').value,
      categoria:        selectCategoria.value,
      descricao:        campoDescricao.value || null,
      local_encontrado: document.getElementById('localEncontrado').value,
      data_encontrado:  campoData.value,
      local_retirada:   document.getElementById('localRetirada').value,
      contato:          document.getElementById('contato').value || null,
      foto_url:         fotoUrl
    };

    const { error } = await db.from('itens').insert(novoItem);
    if (error) throw error;

    // Volta para a lista mostrando a mensagem de sucesso
    window.location.href = 'index.html?cadastrado=1';

  } catch (erro) {
    mostrarErro('Não foi possível cadastrar: ' + erro.message);
    travarBotao(false);
  }
});
