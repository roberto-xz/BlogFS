
// [~] coded by roberto-xz

export type block_session = {
    label:  string;     
    status: number;
    offset:  number;
    
    register_count: number;
    register_addres: number;
}

export type register_session = {
    addres: number;
    index: number;
    stats: number; 
    length: number;
    data: string;         
    data_page: number;
    meta_end: number;
}

export type data_head = {
    page: number;
    length: number; 
}

// Dtos da api

export type MetaPost = {
    id: number;
    title: string;
    slug: string;
    author: string;
    summary: string;
    imageUrl: string;
    viewsCounter: number;
    creationDate: string;
    modificationDate:string;
    other: string;
    visibility: number;
}

export type Post = {
    meta: MetaPost;
    body: string;
}