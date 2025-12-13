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
    stats: Uint8Array;   //status para soft delete
    length: Uint32Array; // tamanho do dado
    data_page: Uint32Array;  // página do dado
}

export interface data_file_head_session {
    count: Uint32Array; // quantidade de blocks de dados registrados
    page: Uint32Array; // próximo página disponível para escrita
}