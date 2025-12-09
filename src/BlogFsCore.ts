// [~] coded by roberto-xz
import fs from "fs";
import { BLOCK_SESSION_LABEL_SIZE, BLOCK_SESSION_SIZE, calculate_meta_size, DATA_FILE_HEAD_SIZE, FILE_HEAD_SIZE, MAX_BLOCKS, MAX_REGISTERS_PER_BLOCK, REGISTER_SESSION_SIZE } from "./Limits";
import { LimitedBlockReached } from "./Erros";
import type { block_session } from "./Dtos";

export class BlogFsCore {
    private meta_buff!:ArrayBuffer;
    private data_buff!:ArrayBuffer;

    private meta_view!:DataView;
    private data_view!:DataView;
    
    private file_path:string = 'none';
    private is_remote:Boolean = false;

    public async open(file_path:string): Promise<void>{
        this.is_remote = this.isRemotePath(file_path);
        if ( this.is_remote == false ) { 
             this.file_path = file_path;
             try {
                //lendo arquivo de metadados
                const meta_file = fs.readFileSync(`${file_path}_mt.fs`);
                this.meta_buff = meta_file.buffer.slice(meta_file.byteOffset, meta_file.byteOffset + meta_file.byteLength);
                this.meta_view = new DataView(this.meta_buff);
             }catch(Error) {throw Error;}
             
             // lendo head do arquivo de dados
             try {
                const data_file = fs.openSync(`${file_path}_dt.fs`,'r');
                const temp_buff = Buffer.alloc(DATA_FILE_HEAD_SIZE);
                fs.readSync(data_file,temp_buff,0,DATA_FILE_HEAD_SIZE,0);
                fs.closeSync(data_file);

                this.data_buff = temp_buff.buffer.slice(temp_buff.byteOffset,temp_buff.byteOffset + temp_buff.byteLength);
                this.data_view = new DataView(this.data_buff);
             }
             catch(Error) {throw Error}
        }else {
            console.log('modo remoto ainda não implementado')
        }
    }

    public createProjeto(file_path:string):boolean {
        this.is_remote = this.isRemotePath(file_path);
        if (this.is_remote == false) {
            this.file_path = file_path;

            // configurando o arquivo de meta dados
            const pre_alloc_size = calculate_meta_size(MAX_BLOCKS,MAX_REGISTERS_PER_BLOCK)
            
            this.meta_buff = new ArrayBuffer(pre_alloc_size);
            this.meta_view = new DataView(this.meta_buff);

            for (let byte=0; byte<pre_alloc_size; byte++)
                this.meta_view.setUint8(byte,0x00);
            
            this.meta_view.setUint8(0,0xf1);
            this.meta_view.setUint8(1,0x00);
            try {
                fs.writeFileSync(`${this.file_path}_mt.fs`,new Uint8Array(this.meta_buff));
            }catch(Error){throw Error}

            // configurando head do arquivo de dados
            this.data_buff = new ArrayBuffer(DATA_FILE_HEAD_SIZE);
            this.data_view = new DataView(this.data_buff);

            this.data_view.setUint32(0,0x00);
            this.data_view.setBigUint64(4,BigInt(DATA_FILE_HEAD_SIZE));
            try {
                fs.writeFileSync(`${this.file_path}_dt.fs`,new Uint8Array(this.data_buff));
            }catch(Error){throw Error;}

            return true;
        }else {
            console.log('modo remoto ainda não implementado')
            return false;
        }
    }
    public createBlock(label:string):any {
        let block_count = this.meta_view.getUint8(1);
        
        if (block_count > MAX_BLOCKS )
            throw new LimitedBlockReached()
        
        // calcula o proximo ploco livre
        let block_free_addres = FILE_HEAD_SIZE + (block_count*BLOCK_SESSION_SIZE);
        let block_label = this.stringToArray(label);
        
        // escrevendo o label
        for (let byte=0; byte<BLOCK_SESSION_LABEL_SIZE; byte++) {
            const char:number = block_label[byte] || 0x00;
            this.meta_view.setUint8(block_free_addres++,char)
        }
        
        //atualiza os metadados
        const register_init_prefixe:number = (BLOCK_SESSION_SIZE*MAX_BLOCKS)+FILE_HEAD_SIZE;
        const max_register_bytes:number    = (REGISTER_SESSION_SIZE*MAX_REGISTERS_PER_BLOCK);
        const register_addres:number       = register_init_prefixe+(block_count*max_register_bytes);
        
        this.meta_view.setUint8(1,block_count+1); // atualiza o contador de blocos
        this.meta_view.setUint8(block_free_addres,0x00);  block_free_addres += 1; // status
        this.meta_view.setUint32(block_free_addres,0x00); block_free_addres += 4; //quantidade de registros
        this.meta_view.setUint32(block_free_addres,register_addres) // endereço do registro register_addres
        this.save_metada_data();
    }

    public findBlock(label:string):block_session | null {
        let block_count = this.meta_view.getUint8(1);
        if (block_count > 0 ) {
            for (let x=0; x<block_count; x++ ) {
                let block_addres = FILE_HEAD_SIZE + (x*BLOCK_SESSION_SIZE);
                let block_offset = block_addres;

                let block_found:boolean = true;
                let block_label  = this.stringToArray(label);
                
                for (let y=0; y<BLOCK_SESSION_LABEL_SIZE; y++) {
                    let char_a:number = this.meta_view.getInt8(block_addres+y);
                    let char_b:number = block_label[y] || 0x00;
                    if (char_a != char_b){block_found = false; break;}
                }

                if (block_found) {
                    block_addres += BLOCK_SESSION_LABEL_SIZE;
                    let status = this.meta_view.getUint8(block_addres);           block_addres+=1; 
                    let register_length = this.meta_view.getUint32(block_addres); block_addres+=4;
                    let register_addres = this.meta_view.getUint32(block_addres);

                    return {offset:block_offset,label,status,register_length,register_addres}
                }
            }
        }
        return null;
    }

    public deleteBlock(label:string):boolean {
        let block_addres = this.findBlock(label);
        if (block_addres != null) {
            let block_status_addr:number = block_addres.offset+BLOCK_SESSION_LABEL_SIZE;
            this.meta_view.setUint8(block_status_addr,0x01);
            
            this.save_metada_data()
            return true;
        }
        return false;
    }

    public renameBlock(old_label:string, new_label:string):boolean {
        let block = this.findBlock(old_label);
        if (block != null) {
            let label_array:number[] = this.stringToArray(new_label);
            let block_offset = block.offset;

            for (let byte=0; byte<BLOCK_SESSION_LABEL_SIZE; byte++) {
                const char:number = label_array[byte] || 0x00;
                this.meta_view.setUint8(block_offset++,char)
            }
            return true;
        }
        return false;
    }

    private stringToArray(str: string): number[] {
        let tempr_array: Uint8Array = new TextEncoder().encode(str);
        let label_array: number[] = [];
        
        for (let byte = 0; byte < BLOCK_SESSION_LABEL_SIZE; byte++) {
            let char: number = tempr_array[byte] || 0x00;
            label_array[byte] = char;
        }
        return label_array;
    }

    private arrayToString(byteArray: number[]): string {
        const uint8Array = new Uint8Array(byteArray);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
    }

    private save_metada_data(): void {
        fs.writeFileSync(`${this.file_path}_mt.fs`,new Uint8Array(this.meta_buff));
        
        const data_file = fs.openSync(`${this.file_path}_dt.fs`, "r+");
        fs.writeSync(data_file,new Uint8Array(this.data_buff),0,this.data_buff.byteLength,0);
        fs.closeSync(data_file);
    }

    private isRemotePath(path: string): boolean {
        try {
            const url = new URL(path);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch { return false;}
    }
}