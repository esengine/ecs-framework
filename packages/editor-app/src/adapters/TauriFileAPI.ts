import type { IFileAPI } from '@esengine/editor-core';
import { TauriAPI } from '../api/tauri';

/**
 * Tauri 文件 API 适配器
 *
 * 实现 IFileAPI 接口，连接 editor-core 和 Tauri 后端
 */
export class TauriFileAPI implements IFileAPI {
    public async openSceneDialog(): Promise<string | null> {
        return await TauriAPI.openSceneDialog();
    }

    public async saveSceneDialog(defaultName?: string, scenesDir?: string): Promise<string | null> {
        return await TauriAPI.saveSceneDialog(defaultName, scenesDir);
    }

    public async readFileContent(path: string): Promise<string> {
        return await TauriAPI.readFileContent(path);
    }

    public async saveProject(path: string, data: string): Promise<void> {
        return await TauriAPI.saveProject(path, data);
    }

    public async exportBinary(data: Uint8Array, path: string): Promise<void> {
        return await TauriAPI.exportBinary(data, path);
    }

    public async createDirectory(path: string): Promise<void> {
        return await TauriAPI.createDirectory(path);
    }

    public async writeFileContent(path: string, content: string): Promise<void> {
        return await TauriAPI.writeFileContent(path, content);
    }

    public async pathExists(path: string): Promise<boolean> {
        return await TauriAPI.pathExists(path);
    }
}
