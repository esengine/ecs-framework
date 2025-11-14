export interface IFileSystem {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    writeBinary(path: string, data: Uint8Array): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listDirectory(path: string): Promise<FileEntry[]>;
    deleteFile(path: string): Promise<void>;
    deleteDirectory(path: string): Promise<void>;
    scanFiles(basePath: string, pattern: string): Promise<string[]>;
}

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    modified?: Date;
}
