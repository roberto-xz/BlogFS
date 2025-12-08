// [~] coded by roberto-xz

export interface meta_file_head_session {
    a_byte: Uint8Array; //versão do arquivo + flag
    b_byte: Uint8Array; //quantidade total de blocos"   
}

export interface meta_block_session {
   label: string;     // (15 bytes UTF-8): identificação do bloco
   stats: Uint8Array; // status (soft delete)
   r_count: Uint32Array;             // quantidade de registros
   r_session_address:Uint32Array; // endereço inicial da sessão de registros"
}

export interface meta_register_session {
    index: Uint32Array;  //índice
    stats: Uint8Array;   //status para soft delete
    length: Uint32Array; // tamanho do dado
    r_data_address: BigUint64Array; //endereço onde o dado começa"
}

export interface data_file_head_session {
    a_byte: Uint32Array;   // quantidade de blocks de dados registrados
    b_byte: BigUint64Array; // próximo endereço disponível para escrita
}