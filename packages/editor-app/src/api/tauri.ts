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

  /**
   * 设置项目基础路径，用于 Custom Protocol
   */
  static async setProjectBasePath(path: string): Promise<void> {
    return await invoke<void>('set_project_base_path', { path });
  }

  /**
   * 切换开发者工具（仅在debug模式下可用）
   */
  static async toggleDevtools(): Promise<void> {
    return await invoke<void>('toggle_devtools');
  }

  /**
   * 打开保存场景对话框
   * @param defaultName 默认文件名（可选）
   * @returns 用户选择的文件路径，取消则返回 null
   */
  static async saveSceneDialog(defaultName?: string): Promise<string | null> {
    return await invoke<string | null>('save_scene_dialog', { defaultName });
  }

  /**
   * 打开场景文件选择对话框
   * @returns 用户选择的文件路径，取消则返回 null
   */
  static async openSceneDialog(): Promise<string | null> {
    return await invoke<string | null>('open_scene_dialog');
  }

  /**
   * 创建目录
   * @param path 目录路径
   */
  static async createDirectory(path: string): Promise<void> {
    return await invoke<void>('create_directory', { path });
  }

  /**
   * 写入文件内容
   * @param path 文件路径
   * @param content 文件内容
   */
  static async writeFileContent(path: string, content: string): Promise<void> {
    return await invoke<void>('write_file_content', { path, content });
  }

  /**
   * 检查路径是否存在
   * @param path 文件或目录路径
   * @returns 路径是否存在
   */
  static async pathExists(path: string): Promise<boolean> {
    return await invoke<boolean>('path_exists', { path });
  }

  /**
   * 使用系统默认程序打开文件
   * @param path 文件路径
   */
  static async openFileWithSystemApp(path: string): Promise<void> {
    await invoke('open_file_with_default_app', { filePath: path });
  }

  /**
   * 在文件管理器中显示文件
   * @param path 文件路径
   */
  static async showInFolder(path: string): Promise<void> {
    await invoke('show_in_folder', { filePath: path });
  }
}

export interface DirectoryEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  modified?: number;
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
