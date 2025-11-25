export interface IFileSystem {
    dispose(): void;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    writeBinary(path: string, data: Uint8Array): Promise<void>;
    exists(path: string): Promise<boolean>;
    createDirectory(path: string): Promise<void>;
    listDirectory(path: string): Promise<FileEntry[]>;
    deleteFile(path: string): Promise<void>;
    deleteDirectory(path: string): Promise<void>;
    scanFiles(basePath: string, pattern: string): Promise<string[]>;
    /**
     * Convert a local file path to an asset URL that can be used in browser contexts (img src, audio src, etc.)
     * @param filePath The local file path
     * @returns The converted asset URL
     */
    convertToAssetUrl(filePath: string): string;
}

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    modified?: Date;
}

// Service identifier for DI registration
// 使用 Symbol.for 确保跨包共享同一个 Symbol
export const IFileSystemService = Symbol.for('IFileSystemService');
