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
    data_address: bigint;
}

export type data_head = {
    data_address: bigint;
    length: number; 
}