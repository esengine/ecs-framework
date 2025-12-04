import { invoke, convertFileSrc } from '@tauri-apps/api/core';

/**
 * 文件过滤器定义
 */
interface FileFilter {
    name: string;
    extensions: string[];
}

/**
 * Tauri IPC 通信层
 */
export class TauriAPI {
    static async openFolderDialog(title?: string): Promise<string | null> {
        return await invoke<string | null>('open_folder_dialog', { title });
    }

    static async openFileDialog(
        title?: string,
        filters?: FileFilter[],
        multiple?: boolean
    ): Promise<string[] | null> {
        return await invoke<string[] | null>('open_file_dialog', {
            title,
            filters,
            multiple
        });
    }

    static async saveFileDialog(
        title?: string,
        defaultName?: string,
        filters?: FileFilter[]
    ): Promise<string | null> {
        return await invoke<string | null>('save_file_dialog', {
            title,
            defaultName,
            filters
        });
    }

    static async openProjectDialog(): Promise<string | null> {
        return await this.openFolderDialog('Select Project Directory');
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
        return await this.saveFileDialog(
            'Save ECS Scene',
            defaultName,
            [{ name: 'ECS Scene Files', extensions: ['ecs'] }]
        );
    }

    /**
   * 打开场景文件选择对话框
   * @returns 用户选择的文件路径，取消则返回 null
   */
    static async openSceneDialog(): Promise<string | null> {
        const result = await this.openFileDialog(
            'Open ECS Scene',
            [{ name: 'ECS Scene Files', extensions: ['ecs'] }],
            false
        );
        return result && result[0] ? result[0] : null;
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

    /**
     * 使用指定编辑器打开项目
     * Open project with specified editor
     *
     * @param projectPath 项目文件夹路径 | Project folder path
     * @param editorCommand 编辑器命令（如 "code", "cursor"）| Editor command
     * @param filePath 可选的要打开的文件路径 | Optional file path to open
     */
    static async openWithEditor(
        projectPath: string,
        editorCommand: string,
        filePath?: string
    ): Promise<void> {
        await invoke('open_with_editor', {
            projectPath,
            editorCommand,
            filePath: filePath || null
        });
    }

    /**
   * 打开行为树文件选择对话框
   * @returns 用户选择的文件路径，取消则返回 null
   */
    static async openBehaviorTreeDialog(): Promise<string | null> {
        const result = await this.openFileDialog(
            'Select Behavior Tree',
            [{ name: 'Behavior Tree Files', extensions: ['btree'] }],
            false
        );
        return result && result[0] ? result[0] : null;
    }

    /**
   * 扫描项目中的所有行为树文件
   * @param projectPath 项目路径
   * @returns 行为树资产ID列表（相对于 .ecs/behaviors 的路 径，不含扩展名）
   */
    static async scanBehaviorTrees(projectPath: string): Promise<string[]> {
        return await invoke<string[]>('scan_behavior_trees', { projectPath });
    }

    /**
   * 重命名文件或文件夹
   * @param oldPath 原路径
   * @param newPath 新路径
   */
    static async renameFileOrFolder(oldPath: string, newPath: string): Promise<void> {
        return await invoke<void>('rename_file_or_folder', { oldPath, newPath });
    }

    /**
   * 删除文件
   * @param path 文件路径
   */
    static async deleteFile(path: string): Promise<void> {
        return await invoke<void>('delete_file', { path });
    }

    /**
   * 删除文件夹
   * @param path 文件夹路径
   */
    static async deleteFolder(path: string): Promise<void> {
        return await invoke<void>('delete_folder', { path });
    }

    /**
   * 创建文件
   * @param path 文件路径
   */
    static async createFile(path: string): Promise<void> {
        return await invoke<void>('create_file', { path });
    }

    /**
   * 读取文件并转换为base64
   * @param path 文件路径
   * @returns base64编码的文件内容
   */
    static async readFileAsBase64(path: string): Promise<string> {
        return await invoke<string>('read_file_as_base64', { filePath: path });
    }

    /**
   * 复制文件
   * @param src 源文件路径
   * @param dst 目标文件路径
   */
    static async copyFile(src: string, dst: string): Promise<void> {
        return await invoke<void>('copy_file', { src, dst });
    }

    /**
   * 写入二进制文件
   * @param filePath 文件路径
   * @param content 二进制数据
   */
    static async writeBinaryFile(filePath: string, content: Uint8Array): Promise<void> {
        return await invoke<void>('write_binary_file', {
            filePath,
            content: Array.from(content)
        });
    }

    /**
   * 获取临时目录路径
   * @returns 临时目录路径
   */
    static async getTempDir(): Promise<string> {
        return await invoke<string>('get_temp_dir');
    }

    /**
   * 获取应用资源目录
   * @returns 资源目录路径
   */
    static async getAppResourceDir(): Promise<string> {
        return await invoke<string>('get_app_resource_dir');
    }

    /**
   * 获取当前工作目录
   * @returns 当前工作目录路径
   */
    static async getCurrentDir(): Promise<string> {
        return await invoke<string>('get_current_dir');
    }

    /**
   * 启动本地HTTP服务器
   * @param rootPath 服务器根目录
   * @param port 端口号
   * @returns 服务器URL
   */
    static async startLocalServer(rootPath: string, port: number): Promise<string> {
        return await invoke<string>('start_local_server', { rootPath, port });
    }

    /**
   * 停止本地HTTP服务器
   */
    static async stopLocalServer(): Promise<void> {
        return await invoke<void>('stop_local_server');
    }

    /**
   * 获取本机局域网IP地址
   * @returns 局域网IP地址
   */
    static async getLocalIp(): Promise<string> {
        return await invoke<string>('get_local_ip');
    }

    /**
   * 生成二维码
   * @param text 要编码的文本
   * @returns base64编码的PNG图片
   */
    static async generateQRCode(text: string): Promise<string> {
        return await invoke<string>('generate_qrcode', { text });
    }

    /**
     * 复制类型定义文件到项目
     * Copy type definition files to project for IDE intellisense
     *
     * @param projectPath 项目路径 | Project path
     */
    static async copyTypeDefinitions(projectPath: string): Promise<void> {
        return await invoke<void>('copy_type_definitions', { projectPath });
    }

    /**
   * 将本地文件路径转换为 Tauri 可访问的 asset URL
   * @param filePath 本地文件路径
   * @param protocol 协议类型 (默认: 'asset')
   * @returns 转换后的 URL，可用于 img src、audio src 等
   * @example
   * const url = TauriAPI.convertFileSrc('C:\\Users\\...\\image.png');
   * // 返回: 'https://asset.localhost/C:/Users/.../image.png'
   */
    static convertFileSrc(filePath: string, protocol?: string): string {
        return convertFileSrc(filePath, protocol);
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
