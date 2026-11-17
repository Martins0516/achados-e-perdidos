-- =====================================================
-- ACHADOS E PERDIDOS DO CAMPUS - Script do banco
-- Cole tudo no Supabase em: SQL Editor > New query > Run
-- Rode uma vez só, num projeto novo.
-- =====================================================

-- 1) Tabela principal: cada linha é um item encontrado
-- Os "check" garantem os mesmos limites do formulário,
-- mesmo que alguém tente mandar dados direto pela API
create table itens (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  nome             text not null check (char_length(nome) between 1 and 80),   -- ex: "Garrafa azul Stanley"
  categoria        text not null,                                              -- ex: "Garrafas e copos"
  descricao        text check (char_length(descricao) <= 300),                 -- detalhes que ajudam o dono a reconhecer
  local_encontrado text not null check (char_length(local_encontrado) between 1 and 120), -- ex: "Bloco B, sala 204"
  data_encontrado  date not null,
  local_retirada   text not null check (char_length(local_retirada) between 1 and 120),   -- onde o item ficou guardado
  contato          text check (char_length(contato) <= 100),                   -- opcional: quem achou (WhatsApp/e-mail)
  foto_url         text check (foto_url like 'https://%'),                     -- link público da foto no Storage
  status           text not null default 'disponivel'
                   check (status in ('disponivel', 'devolvido')),
  devolvido_em     timestamptz
);

-- 2) Permissões das colunas
-- O Supabase libera tudo para a chave pública por padrão.
-- Aqui tiramos tudo e devolvemos só o que o site usa:
--   - ver todas as colunas
--   - cadastrar preenchendo só os campos do formulário
--   - atualizar só o status e a data de devolução
revoke all on itens from anon, authenticated;

grant select on itens to anon, authenticated;

grant insert (nome, categoria, descricao, local_encontrado, data_encontrado, local_retirada, contato, foto_url)
  on itens to anon, authenticated;

grant update (status, devolvido_em)
  on itens to anon, authenticated;

-- 3) Segurança (RLS): define quais linhas o site pode ver e mudar
alter table itens enable row level security;

-- Qualquer pessoa pode ver os itens
create policy "Todos podem ver os itens"
  on itens for select
  to anon, authenticated
  using (true);

-- Qualquer pessoa pode cadastrar um item encontrado
create policy "Todos podem cadastrar itens"
  on itens for insert
  to anon, authenticated
  with check (status = 'disponivel');

-- Só é permitido atualizar para marcar como devolvido
-- (e só itens que ainda estão disponíveis)
create policy "Todos podem marcar como devolvido"
  on itens for update
  to anon, authenticated
  using (status = 'disponivel')
  with check (status = 'devolvido' and devolvido_em is not null);

-- 4) Storage: pasta pública para as fotos dos itens
-- Limite de 5 MB por foto e só formatos de imagem
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Todos podem enviar fotos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'fotos');

create policy "Todos podem ver fotos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos');

-- 5) Dados de exemplo (opcional - apague se não quiser)
insert into itens (nome, categoria, descricao, local_encontrado, data_encontrado, local_retirada, contato) values
  ('Garrafa térmica azul', 'Garrafas e copos', 'Tem um adesivo de planeta na lateral', 'Biblioteca, 2º andar', current_date - 1, 'Balcão da biblioteca', null),
  ('Carregador de celular USB-C', 'Eletrônicos', 'Fonte branca com cabo de 1 metro', 'Laboratório de Informática 3', current_date - 2, 'Secretaria do Bloco A', null),
  ('Carteirinha de estudante', 'Documentos', 'Nome começa com "Ana"', 'Cantina', current_date - 3, 'Secretaria acadêmica', null),
  ('Moletom cinza', 'Roupas e acessórios', 'Tamanho M, com capuz', 'Quadra de esportes', current_date - 5, 'Portaria principal', '(81) 99999-0000');
