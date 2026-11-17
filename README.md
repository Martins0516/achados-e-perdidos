# Achei! · Achados e Perdidos do Campus

Projeto de extensão da disciplina de Desenvolvimento Web.
Site para cadastrar objetos encontrados na universidade e ajudar os donos a recuperá-los.

**Tecnologias:** HTML, CSS, Bootstrap 5, JavaScript e Supabase (banco PostgreSQL + Storage para fotos).

---

## Estrutura dos arquivos

```
achados-e-perdidos/
├── index.html        → página inicial: lista de itens, filtros e botão "É meu!"
├── cadastrar.html    → formulário para cadastrar um item encontrado
├── sobre.html        → explica o projeto (problema, solução, público)
├── css/
│   └── style.css     → estilos próprios (além do Bootstrap)
├── img/
│   └── favicon.svg   → ícone que aparece na aba do navegador
├── js/
│   ├── supabase.js   → conexão com o Supabase + funções auxiliares
│   ├── lista.js      → lógica da página inicial
│   └── cadastrar.js  → lógica do formulário e envio da foto
└── banco/
    └── schema.sql    → script que cria a tabela, as regras de segurança e o local das fotos
```

---

## Passo a passo para rodar

### 1. Criar o projeto no Supabase
1. Acesse https://supabase.com e entre com sua conta (pode ser com o GitHub).
2. Clique em **New project**, dê um nome (ex: `achados-e-perdidos`), crie uma senha e escolha a região **South America (São Paulo)**.
3. Espere uns 2 minutos até o projeto ficar pronto.

### 2. Criar o banco de dados
1. No menu lateral, abra **SQL Editor** e clique em **New query**.
2. Copie todo o conteúdo de `banco/schema.sql`, cole lá e clique em **Run**.
3. Confira em **Table Editor**: deve aparecer a tabela `itens` com 4 itens de exemplo.
   Em **Storage** deve aparecer a pasta `fotos`.

### 3. Conectar o site ao banco
1. No Supabase, clique no botão **Connect** no topo do projeto (ou vá em **Project Settings → API Keys**).
2. Copie a **Project URL** (algo como `https://abcdefgh.supabase.co`).
3. Copie a chave **publishable** (começa com `sb_publishable_...`) ou, em projetos mais antigos, a chave **anon**.
4. Abra `js/supabase.js` e cole as duas nos lugares indicados:
   ```js
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_xxxxxxxx';
   ```
   ⚠️ Nunca use a chave **secret** / **service_role** no site.

### 4. Abrir o site
- No VS Code, instale a extensão **Live Server**, clique com o botão direito em `index.html` → **Open with Live Server**.
- Os itens de exemplo devem aparecer. Teste cadastrar um item com foto e clicar em "É meu!".

### 5. Publicar na internet (opcional, mas fica ótimo na apresentação)
- **Netlify:** acesse https://app.netlify.com/drop e arraste a pasta do projeto. Pronto, você ganha um link.
- **GitHub Pages:** suba a pasta num repositório → Settings → Pages → Branch `main` → Save.

---

## Como funciona (para explicar na apresentação)

| Funcionalidade | Onde está no código |
|---|---|
| Buscar itens no banco | `lista.js` → `carregarItens()` usa `db.from('itens').select('*')` |
| Filtro por texto, categoria e status | `lista.js` → `mostrarItens()` filtra o array com `.filter()` |
| Busca sem acento ("termica" acha "térmica") | `supabase.js` → `normalizarTexto()` |
| Criar os cards na tela | `lista.js` → `criarCard()` monta o HTML com template string |
| Clique no "É meu!" | `lista.js` → um único `addEventListener` na lista descobre o item pelo `data-id` do botão |
| Marcar como devolvido | `lista.js` → `db.from('itens').update(...).eq('id', ...).select()`; se nenhuma linha mudar, alguém já tinha devolvido |
| Diminuir a foto antes de enviar | `cadastrar.js` → `reduzirFoto()` desenha a imagem num `<canvas>` de no máximo 1280px e salva como JPEG |
| Enviar foto | `cadastrar.js` → `enviarFoto()` usa `db.storage.from('fotos').upload(...)` |
| Cadastrar item | `cadastrar.js` → `db.from('itens').insert(novoItem)` |
| Validação do formulário | atributos `required`/`maxlength` no HTML + classe `was-validated` do Bootstrap + `limparEspacos()` (campo só com espaços conta como vazio) |
| Segurança | `schema.sql` → políticas RLS: todos podem ver e cadastrar, mas só é possível mudar o status para "devolvido". As permissões por coluna (`grant update (status, devolvido_em)`) impedem mudar o nome, a foto etc. |
| Limites no banco | `schema.sql` → `check` no tamanho dos textos e bucket de fotos com limite de 5 MB, só imagens |
| Proteção contra código malicioso | `supabase.js` → `escaparHtml()` impede que alguém injete HTML/JS pelo formulário |

---

## Ideias para o relatório de extensão

- **Problema:** objetos perdidos ficam espalhados entre secretarias, portaria e grupos de WhatsApp.
- **Público:** alunos, professores e funcionários; setores que guardam os objetos.
- **Evidência:** aplique um Google Forms rápido ("Você já perdeu algo no campus? Conseguiu recuperar? Onde procurou?") e coloque os gráficos no relatório.
- **Resultado:** os contadores da página inicial ("aguardando o dono" / "já devolvidos") servem como indicador de impacto.

## Melhorias futuras (para citar como trabalhos futuros)

- Login para que só funcionários dos setores possam confirmar devoluções
- Remover automaticamente itens com mais de 60 dias
- Página para "Perdi um item", onde quem perdeu pode avisar o que está procurando
- Notificação por e-mail quando aparecer um item parecido com o que alguém perdeu
