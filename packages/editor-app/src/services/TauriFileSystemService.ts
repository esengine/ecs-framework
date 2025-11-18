import { singleton } from 'tsyringe';
import { invoke } from '@tauri-apps/api/core';
import type { IFileSystem, FileEntry } from '@esengine/editor-core';

@singleton()
export class TauriFileSystemService implements IFileSystem {
    async readFile(path: string): Promise<string> {
        return await invoke<string>('read_file_content', { path });
    }

    async writeFile(path: string, content: string): Promise<void> {
        await invoke('write_file_content', { path, content });
    }

    async writeBinary(path: string, data: Uint8Array): Promise<void> {
        await invoke('write_binary_file', { filePath: path, content: Array.from(data) });
    }

    async exists(path: string): Promise<boolean> {
        try {
            await invoke('read_file_content', { path });
            return true;
        } catch {
            return false;
        }
    }

    async createDirectory(path: string): Promise<void> {
        await invoke('create_directory', { path });
    }

    async listDirectory(path: string): Promise<FileEntry[]> {
        const entries = await invoke<Array<{ name: string; isDir: boolean }>>('list_directory', { path });
        return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDir,
            path: `${path}/${entry.name}`
        }));
    }

    async deleteFile(path: string): Promise<void> {
        await invoke('delete_file', { path });
    }

    async deleteDirectory(path: string): Promise<void> {
        await invoke('delete_directory', { path });
    }

    async scanFiles(basePath: string, pattern: string): Promise<string[]> {
        return await invoke<string[]>('scan_files', { basePath, pattern });
    }
}
