// [~] coded by roberto-xz


export const FILE_HEAD_SIZE = 1 + 1; // a_byte + b_byte = 2 bytes

export const BLOCK_SESSION_LABEL_SIZE  = 15; // UTF-8
export const BLOCK_SESSION_STATS_SIZE  = 1;  // soft delete
export const BLOCK_SESSION_RCOUNT_SIZE = 4;  // Uint32
export const BLOCK_SESSION_RADDR_SIZE  = 8;  // BigUint64

export const BLOCK_SESSION_SIZE =
  BLOCK_SESSION_LABEL_SIZE +
  BLOCK_SESSION_STATS_SIZE +
  BLOCK_SESSION_RCOUNT_SIZE +
  BLOCK_SESSION_RADDR_SIZE; // total = 28 bytes

export const REGISTER_INDEX              = 4   // endereço do registro
export const REGISTER_SESSION_STATS_SIZE = 1;  // soft delete
export const REGISTER_SESSION_LEN_SIZE   = 4;  // Uint32
export const REGISTER_SESSION_RADDR_SIZE = 8;  // BigUint64

export const REGISTER_SESSION_SIZE =
  REGISTER_INDEX +
  REGISTER_SESSION_STATS_SIZE +
  REGISTER_SESSION_LEN_SIZE +
  REGISTER_SESSION_RADDR_SIZE;  // total = 13 bytes


export const MAX_BLOCKS = 50;
export const MAX_REGISTERS_PER_BLOCK = 2000;

//
// Cálculo do tamanho total da área de metadados
//
export function calculate_meta_size(blockCount: number,registerPerBlock: number): number {
    const headSize = FILE_HEAD_SIZE;
    const blocksSize = blockCount * BLOCK_SESSION_SIZE;
    const registersSize = blockCount * registerPerBlock * REGISTER_SESSION_SIZE;
    return headSize + blocksSize + registersSize;
}


