/**
 * 文件系统 API
 * File System API
 *
 * 提供统一的文件读写接口，通过后端 Tauri 命令实现。
 * 所有插件应使用这些 API 而非直接调用 @tauri-apps/plugin-fs。
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 文件系统操作封装
 * 使用后端命令避免前端权限问题
 */
export const FileSystem = {
    /**
     * 读取文本文件
     * @param path 文件路径
     * @returns 文件内容
     */
    async readTextFile(path: string): Promise<string> {
        return await invoke<string>('read_file_content', { path });
    },

    /**
     * 写入文本文件
     * @param path 文件路径
     * @param content 文件内容
     */
    async writeTextFile(path: string, content: string): Promise<void> {
        await invoke('write_file_content', { path, content });
    },

    /**
     * 检查路径是否存在
     * @param path 文件或目录路径
     */
    async exists(path: string): Promise<boolean> {
        return await invoke<boolean>('path_exists', { path });
    },

    /**
     * 创建目录
     * @param path 目录路径
     */
    async createDirectory(path: string): Promise<void> {
        await invoke('create_directory', { path });
    },

    /**
     * 创建空文件
     * @param path 文件路径
     */
    async createFile(path: string): Promise<void> {
        await invoke('create_file', { path });
    },

    /**
     * 删除文件
     * @param path 文件路径
     */
    async deleteFile(path: string): Promise<void> {
        await invoke('delete_file', { path });
    },

    /**
     * 删除目录
     * @param path 目录路径
     */
    async deleteDirectory(path: string): Promise<void> {
        await invoke('delete_folder', { path });
    },

    /**
     * 重命名文件或目录
     * @param oldPath 原路径
     * @param newPath 新路径
     */
    async rename(oldPath: string, newPath: string): Promise<void> {
        await invoke('rename_file_or_folder', { oldPath, newPath });
    },

    /**
     * 读取目录内容
     * @param path 目录路径
     * @returns 目录项列表
     */
    async readDirectory(path: string): Promise<DirectoryEntry[]> {
        return await invoke<DirectoryEntry[]>('read_directory', { path });
    },

    /**
     * 读取文件为 Base64
     * @param path 文件路径
     * @returns Base64 编码的内容
     */
    async readFileAsBase64(path: string): Promise<string> {
        return await invoke<string>('read_file_as_base64', { filePath: path });
    },

    /**
     * 写入二进制文件
     * @param path 文件路径
     * @param data 二进制数据
     */
    async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
        await invoke('write_binary_file', { filePath: path, content: Array.from(data) });
    }
};

/**
 * 目录项
 */
export interface DirectoryEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
    size?: number;
    modified?: number;
}
