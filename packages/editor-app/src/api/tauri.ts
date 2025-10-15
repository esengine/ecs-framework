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

  static async openProjectDialog(): Promise<string | null> {
    return await invoke<string | null>('open_project_dialog');
  }

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

  /**
   * 扫描目录查找匹配模式的文件
   */
  static async scanDirectory(path: string, pattern: string): Promise<string[]> {
    return await invoke<string[]>('scan_directory', { path, pattern });
  }

  /**
   * 读取文件内容
   */
  static async readFileContent(path: string): Promise<string> {
    return await invoke<string>('read_file_content', { path });
  }

  /**
   * 列出目录内容
   */
  static async listDirectory(path: string): Promise<DirectoryEntry[]> {
    return await invoke<DirectoryEntry[]>('list_directory', { path });
  }
}

export interface DirectoryEntry {
  name: string;
  path: string;
  is_dir: boolean;
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
