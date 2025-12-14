export interface meta_file_head_session {
    a_byte: Uint8Array;
    b_byte: Uint8Array;
}
export interface meta_block_session {
    label: string;
    stats: Uint8Array;
    r_count: Uint32Array;
    r_session_address: Uint32Array;
}
export interface meta_register_session {
    stats: Uint8Array;
    length: Uint32Array;
    data_page: Uint32Array;
    meta_end: Uint32Array;
}
export interface data_file_head_session {
    count: Uint32Array;
    page: Uint32Array;
}
