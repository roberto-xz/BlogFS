
// [~] coded by roberto-xz

import { BlogFsCore } from "./src/BlogFsCore";
import type { block_session, Post, register_session } from "./src/Dtos";
import { CategoryAlreadyExistsError, CategoryNotFoundError, DataLimitReached } from "./src/Erros";
import { MAX_PAGE_SIZE } from "./src/Limits";
import { normalizeInput } from "./src/Utils";

export class BlogFS {
    private blogfsCore!: BlogFsCore;
    
    public async open(path:string, createIfNotExists:boolean = true):Promise<Boolean> {
        try {
            this.blogfsCore = new BlogFsCore();
            await this.blogfsCore.open(path); 
            return true;
        }
        catch(error) {
            if (createIfNotExists)
                this.blogfsCore.createProjeto(path);
            
            return true;
        }
    }
    
    public createCategorie(categorie:string):void { 
        if (this.listAllCategories().includes(categorie))
            throw new CategoryAlreadyExistsError(categorie);
        
        this.blogfsCore.createBlock(categorie);
    }

    public listAllCategories():string[] {
        let all_blocks:block_session[] | null = this.blogfsCore.listAllBlocks();
        let categories:string[] = [];
        
        if (all_blocks != null )
            all_blocks.forEach((block)=> {
                if (block.status == 0)
                    categories.push(block.label)
            })
        
        return categories;
    }

    public renameCategorie(oldName:string, newName: string) {
        if (!this.listAllCategories().includes(oldName))
            throw new CategoryNotFoundError(oldName);

        if (this.listAllCategories().includes(newName))
            throw new CategoryAlreadyExistsError(newName);

        return this.blogfsCore.renameBlock(oldName,newName);
    }

    public deleteCategorie(categorie:string):boolean {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        return this.blogfsCore.deleteBlock(categorie);
    }


    public createPost(categorie:string,post:Post):void {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);
        
        const encoder = new TextEncoder();
        let post_buff_body = encoder.encode(normalizeInput(post.body_data));
        let post_buff_meta = encoder.encode(normalizeInput(post.meta_data));

        const totalLength = post_buff_meta.length + post_buff_body.length;
        if ( totalLength > MAX_PAGE_SIZE-1)
            throw new DataLimitReached();
        
        const post_buffer = new Uint8Array(totalLength);
        post_buffer.set(post_buff_meta, 0);
        post_buffer.set(post_buff_body, post_buff_meta.length);

        this.blogfsCore.createRegister(categorie,post_buffer,post_buff_meta.length)
    }

    public async getPost(categorie:string, postId:number):Promise<Post | null> {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);
        
        const register:register_session = await this.blogfsCore.getRegister(categorie,postId)
        
        if (register.stats == 1) // post deletado
            return null;

        if (register.data != null ) {
            const decoder = new TextDecoder();
            const meta_data = decoder.decode(register.data.slice(0,register.meta_end));
            const body_data = decoder.decode(register.data.slice(register.meta_end,));
            return {
                id: register.index,
                meta_data,body_data 
            }
        }
        return null;
    }

    public listPostIds(categorie: string): number[] {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        return this.blogfsCore.listAllRegister(categorie).filter(r => r.stats === 0).map(r => r.index);
    }

    public listAllPost(categorie:string):Post[] {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);
        
        const registers:register_session[] = this.blogfsCore.listAllRegister(categorie);
        const posts:Post[] = [];

        registers.forEach((post)=> {
            if (post.stats == 0 )
                posts.push({
                    id: post.index,
                    meta_data: '',
                    body_data: ''
                });
        });
        return posts;
    }

    public async listAllPostOnlyMetaData(categorie: string): Promise<Post[]> {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        const registers: register_session[] = this.blogfsCore.listAllRegister(categorie);
        const posts: Post[] = [];
        const decoder = new TextDecoder();

        for (const post of registers) {
            if (post.stats !== 0) continue;
            const meta_data = await this.blogfsCore.getData(post.meta_end,post.data_page);

            posts.push({
                id: post.index,
                meta_data: decoder.decode(meta_data),
                body_data: ''
            });
        }

        return posts;
    }

    public async listPostsByPage(categorie: string, page: number,limit: number): Promise<Post[]> {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        const registers = this.blogfsCore.listAllRegister(categorie).filter(r => r.stats === 0);
        const start = page * limit;
        const end = start + limit;

        const decoder = new TextDecoder();
        const posts: Post[] = [];

        for(const reg of registers.slice(start, end)) {
            const metaBuff = await this.blogfsCore.getData(reg.meta_end,reg.data_page);
            posts.push({
                id: reg.index,
                meta_data: decoder.decode(metaBuff),
                body_data: ''
            });
        }

        return posts;
    }

    public async findPostByMeta(categorie: string, predicate: (meta: string) => boolean): Promise<Post[]> {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        const registers = this.blogfsCore.listAllRegister(categorie);
        const decoder = new TextDecoder();
        const result: Post[] = [];

        for (const reg of registers) {
            if (reg.stats !== 0) continue;
            const metaBuff = await this.blogfsCore.getData(reg.meta_end,reg.data_page);
            const meta = decoder.decode(metaBuff);

            if (predicate(meta)) {
                result.push({
                    id: reg.index,
                    meta_data: meta,
                    body_data: ''
                });
            }
        }
        return result;
    }
    
    public countPosts(categorie: string): number {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);

        return this.blogfsCore.listAllRegister(categorie).filter(r => r.stats === 0).length;
    }

    public updatePost(categorie:string, post:Post, postId:number) {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);
        
        const encoder = new TextEncoder();
        let post_buff_body = encoder.encode(normalizeInput(post.body_data));
        let post_buff_meta = encoder.encode(normalizeInput(post.meta_data));

        const totalLength = post_buff_meta.length + post_buff_body.length;
        if ( totalLength > MAX_PAGE_SIZE-1)
            throw new DataLimitReached();
        
        const post_buffer = new Uint8Array(totalLength);
        post_buffer.set(post_buff_meta, 0);
        post_buffer.set(post_buff_body, post_buff_meta.length);
        
        this.blogfsCore.updateRegister(categorie,postId,post_buffer,post_buff_meta.length);
    }

    public deletePost(categorie:string, postId: number):boolean {
        if (!this.listAllCategories().includes(categorie))
            throw new CategoryNotFoundError(categorie);
        
        return this.blogfsCore.deletRegister(categorie,postId);
    }
}