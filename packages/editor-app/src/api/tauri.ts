import { invoke } from '@tauri-apps/api/core';

/**
 * Tauri IPC 通信层
 */
export class TauriAPI {
  /**
   * 打招呼（测试命令）
   */
  static async greet(name: string): Promise<string> {
    return await invoke<string>('greet', { name });
  }

  /**
   * 打开项目
   */
  static async openProject(path: string): Promise<string> {
    return await invoke<string>('open_project', { path });
  }

  /**
   * 保存项目
   */
  static async saveProject(path: string, data: string): Promise<void> {
    return await invoke<void>('save_project', { path, data });
  }

  /**
   * 导出二进制数据
   */
  static async exportBinary(data: Uint8Array, outputPath: string): Promise<void> {
    return await invoke<void>('export_binary', {
      data: Array.from(data),
      outputPath
    });
  }
}

/**
 * 项目信息
 */
export interface ProjectInfo {
  name: string;
  path: string;
  version: string;
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
  theme: string;
  autoSave: boolean;
  recentProjects: string[];
}
