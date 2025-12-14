export declare class BlogFsError extends Error {
    constructor(message: string);
}
export declare class BlockNotFound extends BlogFsError {
    constructor(label: string);
}
export declare class isRemotePath extends BlogFsError {
    constructor();
}
export declare class LimitedBlockReached extends BlogFsError {
    constructor();
}
export declare class BlockWritingRemoved extends BlogFsError {
    constructor();
}
export declare class RecordLimitReached extends BlogFsError {
    constructor();
}
export declare class DataLimitReached extends BlogFsError {
    constructor();
}
export declare class CategoryAlreadyExistsError extends BlogFsError {
    constructor(category: string);
}
export declare class ErrorUpdatingRecords extends BlogFsError {
    constructor();
}
export declare class ErrorCreatingRecord extends BlogFsError {
    constructor();
}
export declare class IndexOutOfRange extends BlogFsError {
    constructor(limit: number, index: number);
}
export declare class CategoryNotFoundError extends BlogFsError {
    constructor(category: string);
}
