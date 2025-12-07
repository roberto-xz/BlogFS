// [~] coded by roberto-xz

export interface meta_file_head_session {
    a_byte: Uint8Array; //versão do arquivo + flag
    b_byte: Uint8Array; //quantidade total de blocos"   
}

export interface meta_block_session {
   label: string;     // (15 bytes UTF-8): identificação do bloco
   stats: Uint8Array; // status (soft delete)
   r_count: Uint32Array;             // quantidade de registros
   r_session_address:BigUint64Array; // endereço inicial da sessão de registros"
}