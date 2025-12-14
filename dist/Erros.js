// [~] coded by roberto-xz
export class BlogFsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.stack = undefined;
    }
}
export class BlockNotFound extends BlogFsError {
    constructor(label) {
        super(`Oops!: The block ${label} was not found.`);
    }
}
export class isRemotePath extends BlogFsError {
    constructor() {
        super('Oops!: This operation is not supported for remote paths.');
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
        super("Opps!: You cannot save more records than the capacity allocated in: MAX_REGISTERS_PER_BLOCK");
    }
}
export class DataLimitReached extends BlogFsError {
    constructor() {
        super("Opps!: It is not possible to save data larger than the value defined in: MAX_PAGE_SIZE");
    }
}
export class CategoryAlreadyExistsError extends BlogFsError {
    constructor(category) {
        super(`Oops: Category '${category}' is already in use.`);
    }
}
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
    constructor(limit, index) {
        super(`Index:${index} outside the limit: ${limit}`);
    }
}
export class CategoryNotFoundError extends BlogFsError {
    constructor(category) {
        super(`Oops: Category '${category}' was not found.`);
    }
}
