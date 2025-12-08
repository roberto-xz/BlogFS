// [~] coded by roberto-xz
import fs from "fs";

export class BlogFsCore {
    private meta_buffer!:ArrayBuffer;
    private data_buffer!:ArrayBuffer;

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
                this.meta_buffer = meta_file.buffer.slice(meta_file.byteOffset, meta_file.byteOffset + meta_file.byteLength);
                this.meta_view = new DataView(this.meta_buffer);
             }catch(Error) {throw Error;}
        }else {
            console.log('modo remoto ainda não implementado')
        }
    }

    public isRemotePath(path: string): boolean {
        try {
            const url = new URL(path);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch { return false;}
    }
}