import type { Post } from "./Dtos";
export declare class BlogFS {
    private blogfsCore;
    open(path: string, createIfNotExists?: boolean): Promise<Boolean>;
    createCategorie(categorie: string): void;
    listAllCategories(): string[];
    renameCategorie(oldName: string, newName: string): boolean;
    deleteCategorie(categorie: string): boolean;
    createPost(categorie: string, post: Post): void;
    getPost(categorie: string, postId: number): Promise<Post | null>;
    listPostIds(categorie: string): number[];
    listAllPost(categorie: string): Post[];
    listAllPostOnlyMetaData(categorie: string): Promise<Post[]>;
    listPostsByPage(categorie: string, page: number, limit: number): Promise<Post[]>;
    findPostByMeta(categorie: string, predicate: (meta: string) => boolean): Promise<Post[]>;
    countPosts(categorie: string): number;
    updatePost(categorie: string, post: Post, postId: number): void;
    deletePost(categorie: string, postId: number): boolean;
}
