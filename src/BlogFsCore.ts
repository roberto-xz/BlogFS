// [~] coded by roberto-xz
import fs from "fs";
import { calculate_meta_size, DATA_FILE_HEAD_SIZE, MAX_BLOCKS, MAX_REGISTERS_PER_BLOCK } from "./Limits";

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
            this.data_view.setBigUint64(3,BigInt(DATA_FILE_HEAD_SIZE));
            try {
                fs.writeFileSync(`${this.file_path}_dt.fs`,new Uint8Array(this.data_buff));
            }catch(Error){throw Error;}

            return true;
        }else {
            console.log('modo remoto ainda não implementado')
            return false;
        }
    }

    private isRemotePath(path: string): boolean {
        try {
            const url = new URL(path);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch { return false;}
    }
}