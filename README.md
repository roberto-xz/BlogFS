# BlogFS

BlogFS é um driver de armazenamento simples e compacto pensado para servir como um VFS (Virtual File System) destinado a blogs e sites que precisam rodar em ambientes que só hospedam sites estáticos (ex.: GitHub Pages, Netlify, Render). A proposta é fornecer uma biblioteca pequena e fácil de usar que apresenta uma API de alto nível para gerenciar "categorias" (blocos) e posts (registros) sobre um formato binário de metadados + páginas de dados, sem necessidade de um servidor dinâmico.

**Objetivo**

- Oferecer um sistema de persistência local leve que permita salvar e recuperar posts organizados por categorias.
- Permitir que projetos estáticos armazenem e atualizem conteúdo estruturado (meta + corpo) usando apenas arquivos estáticos no repositório.
- Ser simples de integrar como biblioteca em ambientes onde não há backend dinâmico.

Por que usar BlogFS?
- Pequeno e sem dependências pesadas.
- Armazenamento binário eficiente usando metadados pré-alocados e páginas de dados.
- API de alto nível para operações comuns (CRUD de categorias e posts, paginação, busca por metadados).

Principais características
- Camada pública `BlogFS` com métodos para abrir projeto, gerenciar categorias e posts.
- Camada baixa `BlogFsCore` que gerencia leitura/escrita dos arquivos binários: `*_mt.fs` (metadados) e `*_dt.fs` (dados por página).
- Tipos (`DTOs`), constantes de layout (`Limits`) e erros customizados (`Erros`) para tratamento claro de falhas.

Arquivos gerados
- `<prefix>_mt.fs` — arquivo de metadados (meta area): cabeçalho + blocos + registros.
- `<prefix>_dt.fs` — arquivo de dados: blocos de páginas de tamanho fixo para armazenar o conteúdo (meta + body concatenados).

Instalação / configuração

Este repositório fornece os fontes TypeScript e configuração mínima. Para usar localmente:

1. Instale dependências (ex.: com Bun, npm ou pnpm conforme preferência):

```bash
# exemplo com bun
bun install

# ou com npm
npm install
```

2. Importar e usar `BlogFS` em seu projeto (ex.: TypeScript/ESM):

```ts
import { BlogFS } from './BlogFS';

const fs = new BlogFS();
await fs.open('meuprojeto', true); // cria arquivos se não existirem
```

API de alto nível (classe `BlogFS`)

- open(path: string, createIfNotExists = true): Promise<Boolean>
  - Abre os arquivos de projeto (`<path>_mt.fs` e `<path>_dt.fs`). Se `createIfNotExists` for `true`, cria os arquivos caso não existam.

- createCategorie(categorie: string): void
  - Cria um novo bloco (categoria). Lança `CategoryAlreadyExistsError` se o nome já existir.

- listAllCategories(): string[]
  - Retorna todas as categorias ativas.

- renameCategorie(oldName: string, newName: string)
  - Renomeia uma categoria existente. Lança `CategoryNotFoundError` ou `CategoryAlreadyExistsError` conforme apropriado.

- deleteCategorie(categorie: string): boolean
  - Marca a categoria como removida (soft delete).

- createPost(categorie: string, post: Post): void
  - Cria um post na categoria especificada. `Post` contém `meta_data` e `body_data` (strings). Os dados são normalizados e concatenados em uma única página. Lança `CategoryNotFoundError` ou `DataLimitReached` se ultrapassar limites.

- getPost(categorie: string, postId: number): Promise<Post | null>
  - Recupera um post pelo índice; retorna `null` se o post estiver deletado.

- listPostIds(categorie: string): number[]
  - Lista IDs (índices) de posts ativos na categoria.

- listAllPost(categorie: string): Post[]
  - Retorna uma lista básica de posts (IDs, sem conteúdo detalhado).

- listAllPostOnlyMetaData(categorie: string): Promise<Post[]>
  - Lê apenas os metadados (meta_data) de cada post — útil para listagens rápidas.

- listPostsByPage(categorie: string, page: number, limit: number): Promise<Post[]>
  - Pagina resultados de metadados.

- findPostByMeta(categorie: string, predicate: (meta: string) => boolean): Promise<Post[]>
  - Busca posts cujo `meta` satisfaz o predicado fornecido.

- countPosts(categorie: string): number
  - Conta posts ativos na categoria.

- updatePost(categorie: string, post: Post, postId: number)
  - Atualiza conteúdo do post. Respeita limites de tamanho de página.

- deletePost(categorie: string, postId: number): boolean
  - Marca um post como removido (soft delete).

Tipos relevantes
- `Post` — { id: number; meta_data: string; body_data: string }
- Estruturas internas de `block_session`, `register_session` e `data_head` em `src/Dtos.ts`.

Erros e limites
- O projeto define erros customizados (ex.: `BlockNotFound`, `DataLimitReached`, `CategoryAlreadyExistsError`, etc.) em `src/Erros.ts`.
- Parâmetros importantes em `src/Limits.ts`:
  - `MAX_PAGE_SIZE`: tamanho máximo (em bytes) de uma página de dados (meta+body concatenados).
  - `MAX_BLOCKS` e `MAX_REGISTERS_PER_BLOCK`: configuram capacidade do espaço de metadados.

Exemplo rápido

```ts
import { BlogFS } from './BlogFS';

(async () => {
  const blog = new BlogFS();
  await blog.open('meuprojeto', true);

  blog.createCategorie('tech');
  blog.createPost('tech', { id: 0, meta_data: 'title: Hello', body_data: 'Meu primeiro post' });

  const posts = await blog.listAllPostOnlyMetaData('tech');
  console.log(posts);
})();
```

Boas práticas e limitações
- O formato é otimizado para projetos estáticos e edição esporádica; não é um banco de dados transacional.
- Alterações concorrentes em ambientes remotos não são contempladas — o projeto funciona melhor quando o repositório/arquivos são atualizados por um único processo de escrita.
- Há suporte planejado/placeholder para modo remoto (requests HTTP Range), mas a implementação principal é local (arquivos no disco).

Contribuindo
- Abra issues para sugestões, erros ou pedidos de recursos.
- PRs são bem-vindos — prefira mudanças pequenas, testes e documentação.

