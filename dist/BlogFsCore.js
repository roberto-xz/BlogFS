// [~] coded by roberto-xz
import * as fs from "fs";
import { BLOCK_SESSION_LABEL_SIZE, BLOCK_SESSION_SIZE, calculate_meta_size, DATA_FILE_HEAD_SIZE, FILE_HEAD_SIZE, MAX_BLOCKS, MAX_PAGE_SIZE, MAX_REGISTERS_PER_BLOCK, REGISTER_SESSION_SIZE } from "./Limits";
import { BlockNotFound, BlockWritingRemoved, DataLimitReached, ErrorCreatingRecord, IndexOutOfRange, LimitedBlockReached, RecordLimitReached } from "./Erros";
export class BlogFsCore {
    constructor() {
        this.file_path = 'none';
        this.is_remote = false;
    }
    async open(file_path) {
        this.is_remote = this.isRemotePath(file_path);
        if (this.is_remote == false) {
            this.file_path = file_path;
            try {
                //lendo arquivo de metadados
                const meta_file = fs.readFileSync(`${file_path}_mt.fs`);
                this.meta_buff = meta_file.buffer.slice(meta_file.byteOffset, meta_file.byteOffset + meta_file.byteLength);
                this.meta_view = new DataView(this.meta_buff);
            }
            catch (Error) {
                throw Error;
            }
            // lendo head do arquivo de dados
            try {
                const data_file = fs.openSync(`${file_path}_dt.fs`, 'r');
                const temp_buff = Buffer.alloc(DATA_FILE_HEAD_SIZE);
                fs.readSync(data_file, temp_buff, 0, DATA_FILE_HEAD_SIZE, 0);
                fs.closeSync(data_file);
                this.data_buff = temp_buff.buffer.slice(temp_buff.byteOffset, temp_buff.byteOffset + temp_buff.byteLength);
                this.data_view = new DataView(this.data_buff);
            }
            catch (Error) {
                throw Error;
            }
        }
        else {
            this.file_path = file_path;
            try {
                //lendo arquivo de metadados
                const resp_meta = await fetch(`${file_path}_mt.fs`);
                if (resp_meta.ok && resp_meta.status == 200) {
                    this.meta_buff = await resp_meta.arrayBuffer();
                    this.meta_view = new DataView(this.meta_buff);
                }
            }
            catch (Error) {
                throw Error;
            }
        }
    }
    createProjeto(file_path) {
        this.is_remote = this.isRemotePath(file_path);
        if (this.is_remote == false) {
            this.file_path = file_path;
            // configurando o arquivo de meta dados
            const pre_alloc_size = calculate_meta_size(MAX_BLOCKS, MAX_REGISTERS_PER_BLOCK);
            this.meta_buff = new ArrayBuffer(pre_alloc_size);
            this.meta_view = new DataView(this.meta_buff);
            for (let byte = 0; byte < pre_alloc_size; byte++)
                this.meta_view.setUint8(byte, 0x00);
            this.meta_view.setUint8(0, 0xf1);
            this.meta_view.setUint8(1, 0x00);
            try {
                fs.writeFileSync(`${this.file_path}_mt.fs`, new Uint8Array(this.meta_buff));
            }
            catch (Error) {
                throw Error;
            }
            // configurando head do arquivo de dados
            this.data_buff = new ArrayBuffer(DATA_FILE_HEAD_SIZE);
            this.data_view = new DataView(this.data_buff);
            this.data_view.setUint32(0, 0x00);
            this.data_view.setUint32(4, 0x00);
            try {
                fs.writeFileSync(`${this.file_path}_dt.fs`, new Uint8Array(this.data_buff));
            }
            catch (Error) {
                throw Error;
            }
            return true;
        }
        else {
            console.log('modo remoto ainda não implementado');
            return false;
        }
    }
    createBlock(label) {
        let block_count = this.meta_view.getUint8(1);
        let block_free_addres = FILE_HEAD_SIZE + (block_count * BLOCK_SESSION_SIZE); // calcula o proximo bloco livre
        if (block_count > MAX_BLOCKS - 1) {
            let block_addres = this.findDeletedBlock();
            if (block_addres != null) {
                block_free_addres = block_addres.offset;
                block_count -= 1;
            }
            else
                throw new LimitedBlockReached();
        }
        // escrevendo o label
        const block_label = this.stringToArray(label);
        for (let byte = 0; byte < BLOCK_SESSION_LABEL_SIZE; byte++) {
            const char = block_label[byte] || 0x00;
            this.meta_view.setUint8(block_free_addres++, char);
        }
        //atualiza os metadados
        const register_init_prefixe = (BLOCK_SESSION_SIZE * MAX_BLOCKS) + FILE_HEAD_SIZE;
        const max_register_bytes = (REGISTER_SESSION_SIZE * MAX_REGISTERS_PER_BLOCK);
        const register_addres = register_init_prefixe + (block_count * max_register_bytes);
        this.meta_view.setUint8(1, block_count + 1); // atualiza o contador de blocos
        this.meta_view.setUint8(block_free_addres, 0x00);
        block_free_addres += 1; // status
        this.meta_view.setUint32(block_free_addres, 0x00);
        block_free_addres += 4; //quantidade de registros
        this.meta_view.setUint32(block_free_addres, register_addres); // endereço do registro register_addres
        this.save_metada_data();
    }
    findBlock(label) {
        let block_count = this.meta_view.getUint8(1);
        if (block_count > 0) {
            for (let x = 0; x < block_count; x++) {
                let block_addres = FILE_HEAD_SIZE + (x * BLOCK_SESSION_SIZE);
                let block_offset = block_addres;
                let block_found = true;
                let block_label = this.stringToArray(label);
                for (let y = 0; y < BLOCK_SESSION_LABEL_SIZE; y++) {
                    let char_a = this.meta_view.getInt8(block_addres + y);
                    let char_b = block_label[y] || 0x00;
                    if (char_a != char_b) {
                        block_found = false;
                        break;
                    }
                }
                if (block_found) {
                    block_addres += BLOCK_SESSION_LABEL_SIZE;
                    let status = this.meta_view.getUint8(block_addres);
                    block_addres += 1;
                    let register_count = this.meta_view.getUint32(block_addres);
                    block_addres += 4;
                    let register_addres = this.meta_view.getUint32(block_addres);
                    return { offset: block_offset, label, status, register_count, register_addres };
                }
            }
        }
        return null;
    }
    listAllBlocks() {
        let block_count = this.meta_view.getUint8(1);
        if (block_count > 0) {
            let blocks = [];
            for (let x = 0; x < block_count; x++) {
                let block_addres = FILE_HEAD_SIZE + (x * BLOCK_SESSION_SIZE);
                let block_offset = block_addres;
                let block_label = [];
                for (let y = 0; y < BLOCK_SESSION_LABEL_SIZE; y++)
                    block_label.push(this.meta_view.getInt8(block_addres + y));
                block_addres += BLOCK_SESSION_LABEL_SIZE;
                let status = this.meta_view.getUint8(block_addres);
                block_addres += 1;
                let register_count = this.meta_view.getUint32(block_addres);
                block_addres += 4;
                let register_addres = this.meta_view.getUint32(block_addres);
                blocks.push({
                    label: this.arrayToString(block_label), status,
                    offset: block_offset, register_count, register_addres
                });
            }
            return (blocks.length > 0) ? blocks : null;
        }
        return null;
    }
    deleteBlock(label) {
        let block_addres = this.findBlock(label);
        if (block_addres != null) {
            let block_status_addr = block_addres.offset + BLOCK_SESSION_LABEL_SIZE;
            this.meta_view.setUint8(block_status_addr, 0x01);
            this.save_metada_data();
            return true;
        }
        return false;
    }
    renameBlock(old_label, new_label) {
        let block = this.findBlock(old_label);
        if (block != null) {
            let label_array = this.stringToArray(new_label);
            let block_offset = block.offset;
            for (let byte = 0; byte < BLOCK_SESSION_LABEL_SIZE; byte++) {
                const char = label_array[byte] || 0x00;
                this.meta_view.setUint8(block_offset++, char);
            }
            this.save_metada_data();
            return true;
        }
        return false;
    }
    createRegister(block_label, data_buff, meta_end) {
        const block = this.findBlock(block_label);
        if (block != null) {
            if (block.status == 1)
                throw new BlockWritingRemoved();
            let offset;
            if (block.register_count <= MAX_REGISTERS_PER_BLOCK - 1) {
                offset = block.register_addres + (block.register_count * REGISTER_SESSION_SIZE);
            }
            else {
                const deleted_offset = this.findDeletedRegister(block_label);
                if (deleted_offset == null)
                    throw new RecordLimitReached();
                offset = deleted_offset;
                block.register_count -= 1;
            }
            const data_meta = this.createData(data_buff);
            if (data_meta != null) {
                this.meta_view.setUint8(offset, 0x00);
                offset += 1; // status do registro
                this.meta_view.setUint32(offset, data_meta.length);
                offset += 4; // tamanho do dado em bytes
                this.meta_view.setUint32(offset, data_meta.page);
                offset += 4; // página do dado
                this.meta_view.setUint32(offset, meta_end); // onde termina os metadados dos dados 
                let block_register_count_add = (block.offset + BLOCK_SESSION_LABEL_SIZE) + 1;
                this.meta_view.setUint32(block_register_count_add, block.register_count + 1); // atualiza quantidade de registros no block
            }
            else {
                throw new ErrorCreatingRecord();
            }
            this.save_metada_data();
            return;
        }
        throw new BlockNotFound(block_label);
    }
    listAllRegister(block_label) {
        const block = this.findBlock(block_label);
        if (block != null) {
            if (block.status == 1)
                throw new BlockWritingRemoved();
            let registers = [];
            for (let x = 0; x < block.register_count; x++) {
                let offset = block.register_addres + (x * REGISTER_SESSION_SIZE);
                let offset_copy = offset;
                let stats = this.meta_view.getUint8(offset);
                offset += 1;
                let length = this.meta_view.getUint32(offset);
                offset += 4;
                let page = this.meta_view.getUint32(offset);
                offset += 4;
                let meta_end = this.meta_view.getUint32(offset);
                registers.push({ addres: offset_copy, index: x, stats, length, data_page: page, data: null, meta_end });
            }
            return registers;
        }
        throw new BlockNotFound(block_label);
    }
    async getRegister(block_label, register_index) {
        const block = this.findBlock(block_label);
        if (block != null) {
            if (block.status == 1)
                throw new BlockWritingRemoved();
            if (register_index < 0 || register_index > block.register_count - 1)
                throw new IndexOutOfRange(block.register_count - 1, register_index);
            let offset = block.register_addres + (register_index * REGISTER_SESSION_SIZE);
            let offset_copy = offset;
            let stats = this.meta_view.getUint8(offset);
            offset += 1;
            let length = this.meta_view.getUint32(offset);
            offset += 4;
            let page = this.meta_view.getUint32(offset);
            offset += 4;
            let meta_end = this.meta_view.getUint32(offset);
            const data_buf = await this.getData(length, page);
            // let data_str:string = ''    
            // if (data_buf != null ) 
            //     data_str = new TextDecoder().decode(data_buf);
            return { addres: offset_copy, index: register_index, stats, length, data_page: page, data: data_buf, meta_end };
        }
        throw new BlockNotFound(block_label);
    }
    async updateRegister(block_label, register_id, data_buff, meta_end) {
        if (data_buff.length > MAX_PAGE_SIZE - 1)
            throw new DataLimitReached();
        const block = this.findBlock(block_label);
        if (block != null) {
            if (block.status == 1)
                throw new BlockWritingRemoved();
            if (register_id < 0 || register_id > block.register_count - 1)
                throw new IndexOutOfRange(block.register_count - 1, register_id);
            const register = await this.getRegister(block_label, register_id);
            if (register.stats == 1)
                return false;
            const data_meta = this.updateData(data_buff, register.data_page);
            let offset = register.addres + 1;
            this.meta_view.setUint32(offset, data_meta.length);
            offset += 8;
            this.meta_view.setUint32(offset, meta_end);
            this.save_metada_data();
            return true;
        }
        throw new BlockNotFound(block_label);
    }
    deletRegister(block_label, register_id) {
        const block = this.findBlock(block_label);
        if (block != null) {
            if (block.status == 1)
                throw new BlockWritingRemoved();
            if (register_id < 0 || register_id > block.register_count - 1)
                throw new IndexOutOfRange(block.register_count - 1, register_id);
            let offset = block.register_addres + (register_id * REGISTER_SESSION_SIZE);
            this.meta_view.setUint8(offset, 0x01);
            this.save_metada_data();
            return true;
        }
        throw new BlockNotFound(block_label);
    }
    createData(data_buff) {
        let data_count = this.data_view.getUint32(0);
        let data_page = this.data_view.getUint32(4);
        if (data_buff.length > MAX_PAGE_SIZE - 1)
            throw new DataLimitReached();
        const data_file = fs.openSync(`${this.file_path}_dt.fs`, 'r+');
        let offset = DATA_FILE_HEAD_SIZE + (data_page * MAX_PAGE_SIZE);
        const position = Number(offset);
        if (!Number.isSafeInteger(position))
            throw new Error("Data offset exceeds safe integer limit");
        fs.writeSync(data_file, data_buff, 0, data_buff.length, position);
        fs.closeSync(data_file);
        this.data_view.setUint32(0, data_count + 1);
        this.data_view.setUint32(4, data_page + 1);
        return {
            page: data_page,
            length: data_buff.length
        };
    }
    async getData(length, page) {
        let offset = DATA_FILE_HEAD_SIZE + (page * MAX_PAGE_SIZE);
        if (this.is_remote == false) {
            const data_file = fs.openSync(`${this.file_path}_dt.fs`, 'r');
            const position = Number(offset);
            if (!Number.isSafeInteger(position))
                throw new Error("Data offset exceeds safe integer limit");
            const buff = new Uint8Array(length);
            fs.readSync(data_file, buff, 0, length, position);
            fs.closeSync(data_file);
            return buff;
        }
        const st = offset;
        const ed = offset + length - 1;
        const res = await fetch(`${this.file_path}_dt.fs`, {
            headers: { Range: `bytes=${st.toString()}-${ed.toString()}` }
        });
        if (!res.ok && res.status !== 206)
            return null;
        const arrayBuffer = await res.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }
    updateData(data_buff, page) {
        const data_file = fs.openSync(`${this.file_path}_dt.fs`, 'r+');
        let offset = DATA_FILE_HEAD_SIZE + (page * MAX_PAGE_SIZE);
        const position = Number(offset);
        if (!Number.isSafeInteger(position))
            throw new Error("Data offset exceeds safe integer limit");
        fs.writeSync(data_file, data_buff, 0, data_buff.length, position);
        fs.closeSync(data_file);
        return {
            page: page,
            length: data_buff.length
        };
    }
    isRemote() { return this.is_remote; }
    findDeletedRegister(block_label) {
        const block = this.findBlock(block_label);
        if (block != null) {
            try {
                const registers = this.listAllRegister(block_label);
                for (let x = 0; x < registers.length; x++)
                    if (registers[x]?.stats == 1)
                        return registers[x]?.addres || null;
            }
            catch (Error) {
                throw Error;
            }
        }
        return null;
    }
    findDeletedBlock() {
        let blocks = this.listAllBlocks();
        if (blocks != null) {
            let block_size = blocks.length;
            for (let x = 0; x < block_size; x++)
                if (blocks[x]?.status == 0x01)
                    return blocks[x];
        }
        return null;
    }
    stringToArray(str) {
        let tempr_array = new TextEncoder().encode(str);
        let label_array = [];
        for (let byte = 0; byte < BLOCK_SESSION_LABEL_SIZE; byte++) {
            let char = tempr_array[byte] || 0x00;
            label_array[byte] = char;
        }
        return label_array;
    }
    arrayToString(byteArray) {
        const end = byteArray.indexOf(0x00);
        const slice = end === -1 ? byteArray : byteArray.slice(0, end);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(new Uint8Array(slice));
    }
    save_metada_data() {
        fs.writeFileSync(`${this.file_path}_mt.fs`, new Uint8Array(this.meta_buff));
        const data_file = fs.openSync(`${this.file_path}_dt.fs`, "r+");
        fs.writeSync(data_file, new Uint8Array(this.data_buff), 0, this.data_buff.byteLength, 0);
        fs.closeSync(data_file);
    }
    isRemotePath(path) {
        try {
            const url = new URL(path);
            return url.protocol === "http:" || url.protocol === "https:";
        }
        catch {
            return false;
        }
    }
}
