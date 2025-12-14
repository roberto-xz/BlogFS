

# BlogFS

**BlogFS** é um driver de armazenamento leve e compacto, projetado para funcionar como um VFS (Virtual File System) voltado para blogs e sites de conteúdo que precisam rodar em ambientes **sem backend dinâmico**, como GitHub Pages, Netlify ou Render.

A proposta é oferecer uma biblioteca simples, com uma API de alto nível, capaz de gerenciar **categorias** e **posts** utilizando apenas arquivos binários versionáveis no repositório. O conteúdo é organizado em metadados estruturados e páginas de dados de tamanho fixo, dispensando qualquer banco de dados tradicional.

---

## Objetivo

O BlogFS foi criado para:

Permitir persistência local de posts organizados por categorias, sem necessidade de servidor dinâmico.
Viabilizar a criação e atualização de conteúdo estruturado (metadados + corpo) em projetos estáticos.
Fornecer uma base simples, previsível e eficiente para blogs, documentações e pequenos CMS baseados em arquivos.

---

## Por que usar o BlogFS?

O BlogFS não tenta substituir um banco de dados completo. Ele resolve um problema específico: **conteúdo estruturado em ambientes estáticos**.

Principais vantagens:

Sistema pequeno, direto e sem dependências pesadas.
Armazenamento binário eficiente com layout fixo e previsível.
Separação clara entre metadados e dados reais.
API de alto nível para operações comuns como CRUD, paginação e busca por metadados.
Arquivos totalmente versionáveis via Git.

---

## Visão geral da arquitetura

O BlogFS é dividido em duas camadas principais.

A camada pública `BlogFS` expõe uma API de alto nível para gerenciamento de categorias e posts, abstraindo totalmente o layout binário.

A camada interna `BlogFsCore` é responsável pela leitura e escrita direta nos arquivos binários, controle de offsets, páginas, limites e consistência dos dados.

O armazenamento é feito em dois arquivos:

`<prefix>_mt.fs` — Arquivo de metadados, contendo cabeçalho, blocos (categorias) e registros (posts).
`<prefix>_dt.fs` — Arquivo de dados, organizado em páginas de tamanho fixo, onde ficam armazenados os conteúdos reais (meta + body concatenados).

---

## Instalação e uso básico

Este repositório fornece os fontes em TypeScript e uma configuração mínima.

Instale as dependências com o gerenciador de sua preferência:

```bash
bun install
# ou
npm install
```

Uso básico:

```ts
import { BlogFS } from './BlogFS';

const blog = new BlogFS();
await blog.open('meuprojeto', true);
```

Isso cria (ou abre) os arquivos `meuprojeto_mt.fs` e `meuprojeto_dt.fs`.

---

## API de alto nível (`BlogFS`)

A classe `BlogFS` fornece métodos prontos para uso em aplicações reais.

Abertura e categorias:

`open(path: string, createIfNotExists = true)`
Abre ou cria o projeto.

`createCategorie(categorie: string)`
Cria uma nova categoria.

`listAllCategories()`
Lista todas as categorias ativas.

`renameCategorie(oldName, newName)`
Renomeia uma categoria existente.

`deleteCategorie(categorie)`
Remove uma categoria via soft delete.

---

Posts e conteúdo:

`createPost(categorie, post)`
Cria um post dentro de uma categoria. O conteúdo é normalizado, convertido para bytes e armazenado em uma única página.

`getPost(categorie, postId)`
Retorna um post completo (meta + corpo) ou `null` se estiver removido.

`updatePost(categorie, post, postId)`
Atualiza um post existente, respeitando os limites de página.

`deletePost(categorie, postId)`
Remove um post via soft delete.

---

Leitura otimizada e paginação:

`listPostIds(categorie)`
Retorna apenas os IDs dos posts ativos.

`listAllPost(categorie)`
Lista posts sem carregar conteúdo.

`listAllPostOnlyMetaData(categorie)`
Carrega apenas os metadados, ideal para listagens.

`listPostsByPage(categorie, page, limit)`
Paginação baseada em metadados.

`findPostByMeta(categorie, predicate)`
Busca posts filtrando pelo conteúdo dos metadados.

`countPosts(categorie)`
Conta posts ativos da categoria.

---

## Tipos principais

```ts
type Post = {
  id: number;
  meta_data: string;
  body_data: string;
}
```

Outras estruturas internas como `block_session`, `register_session` e `data_head` estão definidas em `src/Dtos.ts`.

---

## Limites e validações

Os limites estruturais ficam centralizados em `src/Limits.ts`.

`MAX_PAGE_SIZE` define o tamanho máximo de uma página de dados.
Cada post deve caber inteiramente dentro de uma página.
Isso simplifica a lógica e evita fragmentação entre páginas.

Erros customizados são definidos em `src/Erros.ts`, cobrindo casos como categorias duplicadas, limites atingidos e tentativas de escrita inválidas.

---

## Exemplo rápido (uso local)

```ts
import { BlogFS } from './BlogFS';

(async () => {
  const blog = new BlogFS();
  await blog.open('meuprojeto', true);

  blog.createCategorie('tech');
  blog.createPost('tech', {
    id: 0,
    meta_data: 'title: Hello World',
    body_data: 'Meu primeiro post'
  });

  const posts = await blog.listAllPostOnlyMetaData('tech');
  console.log(posts);
})();
```

---

## Acesso remoto (leitura)

O projeto já considera suporte a leitura remota via HTTP Range (modo estático).

```ts
import { BlogFS } from './BlogFS';

(async () => {
  const blog = new BlogFS();
  await blog.open('http://127.0.0.1:3000/meuprojeto', true);

  const posts = await blog.listAllPostOnlyMetaData('tech');
  console.log(posts);

  console.log(await blog.getPost('tech', 0));
})();
```

---

## Boas práticas e limitações

O BlogFS é ideal para leitura frequente e escrita controlada.
Não é um banco transacional e não lida com escrita concorrente.
Atualizações devem ser feitas por um único processo.
O foco é simplicidade, previsibilidade e versionamento fácil.

---

## Contribuindo

Issues são bem-vindas para bugs, ideias e melhorias.
Pull requests são encorajados, especialmente com testes e documentação.
