// [~] coded by roberto-xz

export class BlogFsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.stack = undefined; 
    }
}

export class LimitedBlockReached extends BlogFsError {
    constructor() {
        super('Ops!: The block limit has been reached.');
    }
}