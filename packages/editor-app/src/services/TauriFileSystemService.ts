import { singleton } from 'tsyringe';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import type { IFileSystem, FileEntry } from '@esengine/editor-core';

@singleton()
export class TauriFileSystemService implements IFileSystem {
    dispose(): void {
        // No cleanup needed
    }

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
            // 首先尝试作为目录列出内容
            // First try to list as directory
            await invoke('list_directory', { path });
            return true;
        } catch {
            // 如果不是目录，尝试读取文件
            // If not a directory, try reading as file
            try {
                await invoke('read_file_content', { path });
                return true;
            } catch {
                return false;
            }
        }
    }

    async createDirectory(path: string): Promise<void> {
        await invoke('create_directory', { path });
    }

    async listDirectory(path: string): Promise<FileEntry[]> {
        const entries = await invoke<Array<{
            name: string;
            path: string;
            is_dir: boolean;
            size?: number;
            modified?: number;
        }>>('list_directory', { path });
        return entries.map((entry) => ({
            name: entry.name,
            isDirectory: entry.is_dir,
            path: entry.path,
            size: entry.size,
            modified: entry.modified ? new Date(entry.modified * 1000) : undefined
        }));
    }

    async deleteFile(path: string): Promise<void> {
        await invoke('delete_file', { path });
    }

    async deleteDirectory(path: string): Promise<void> {
        await invoke('delete_directory', { path });
    }

    async scanFiles(basePath: string, pattern: string): Promise<string[]> {
        return await invoke<string[]>('scan_directory', { path: basePath, pattern });
    }

    convertToAssetUrl(filePath: string): string {
        return convertFileSrc(filePath);
    }
}
