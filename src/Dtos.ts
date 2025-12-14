
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
    data: Uint8Array | null;         
    data_page: number;
    meta_end: number;
}

export type data_head = {
    page: number;
    length: number; 
}

// Dtos da api

export type Post = {
    id: number;
    meta_data: string;
    body_data: string;
}