/**
 * 文件 API 接口
 *
 * 定义编辑器与文件系统交互的抽象接口
 * 具体实现由上层应用提供（如 TauriFileAPI）
 */
export interface IFileAPI {
    /**
     * 打开场景文件选择对话框
     * @returns 用户选择的文件路径，取消则返回 null
     */
    openSceneDialog(): Promise<string | null>;

    /**
     * 打开保存场景对话框
     * @param defaultName 默认文件名
     * @returns 用户选择的文件路径，取消则返回 null
     */
    saveSceneDialog(defaultName?: string): Promise<string | null>;

    /**
     * 读取文件内容
     * @param path 文件路径
     * @returns 文件内容（文本格式）
     */
    readFileContent(path: string): Promise<string>;

    /**
     * 保存项目文件
     * @param path 保存路径
     * @param data 文件内容（文本格式）
     */
    saveProject(path: string, data: string): Promise<void>;

    /**
     * 导出二进制文件
     * @param data 二进制数据
     * @param path 保存路径
     */
    exportBinary(data: Uint8Array, path: string): Promise<void>;

    /**
     * 创建目录
     * @param path 目录路径
     */
    createDirectory(path: string): Promise<void>;

    /**
     * 写入文件内容
     * @param path 文件路径
     * @param content 文件内容
     */
    writeFileContent(path: string, content: string): Promise<void>;

    /**
     * 检查路径是否存在
     * @param path 文件或目录路径
     * @returns 路径是否存在
     */
    pathExists(path: string): Promise<boolean>;
}
