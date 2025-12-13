// [~] coded by roberto-xz

export class BlogFsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.stack = undefined; 
    }
}

export class BlockNotFound extends BlogFsError {
    constructor(label:string) {
        super(`Oops!: The block ${label} was not found.`);
    }
}

export class LimitedBlockReached extends BlogFsError {
    constructor() {
        super('Oops!: The block limit has been reached.');
    }
}

export class BlockWritingRemoved extends BlogFsError {
    constructor() {
        super("Oops!: It looks like you're trying to save a record in a block that has been removed..");
    }
}

export class RecordLimitReached extends BlogFsError {
    constructor() {
        super("You cannot save more records than the capacity allocated in: MAX_REGISTERS_PER_BLOCK");
    }
}


//

export class ErrorUpdatingRecords extends BlogFsError {
    constructor() {
        super('Cannot update data: new data size exceeds the originally allocated space.');
    }
}

export class ErrorCreatingRecord extends BlogFsError {
    constructor() {
        super('There was an error creating a record.');
    }
}

export class IndexOutOfRange extends BlogFsError {
    constructor(limit:number, index:number) {
        super(`Index:${index} outside the limit: ${limit}`);
    }
}