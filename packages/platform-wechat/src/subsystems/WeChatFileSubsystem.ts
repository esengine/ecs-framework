/**
 * 微信小游戏文件系统子系统
 */

import type {
    IPlatformFileSubsystem,
    FileInfo
} from '@esengine/platform-common';
import { getWx } from '../utils';

/**
 * 微信小游戏文件系统子系统实现
 */
export class WeChatFileSubsystem implements IPlatformFileSubsystem {
    private _fs: WechatMinigame.FileSystemManager;

    constructor() {
        this._fs = getWx().getFileSystemManager();
    }

    async readFile(options: {
        filePath: string;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
        position?: number;
        length?: number;
    }): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._fs.readFile({
                filePath: options.filePath,
                encoding: options.encoding as any,
                position: options.position,
                length: options.length,
                success: (res) => resolve(res.data),
                fail: reject
            });
        });
    }

    readFileSync(
        filePath: string,
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8',
        position?: number,
        length?: number
    ): string | ArrayBuffer {
        return this._fs.readFileSync(filePath, encoding as any, position, length);
    }

    async writeFile(options: {
        filePath: string;
        data: string | ArrayBuffer;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.writeFile({
                filePath: options.filePath,
                data: options.data,
                encoding: options.encoding as any,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    writeFileSync(
        filePath: string,
        data: string | ArrayBuffer,
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8'
    ): void {
        this._fs.writeFileSync(filePath, data, encoding as any);
    }

    async appendFile(options: {
        filePath: string;
        data: string | ArrayBuffer;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.appendFile({
                filePath: options.filePath,
                data: options.data,
                encoding: options.encoding as any,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async unlink(filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.unlink({
                filePath,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async mkdir(options: {
        dirPath: string;
        recursive?: boolean;
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.mkdir({
                dirPath: options.dirPath,
                recursive: options.recursive,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async rmdir(options: {
        dirPath: string;
        recursive?: boolean;
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.rmdir({
                dirPath: options.dirPath,
                recursive: options.recursive,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async readdir(dirPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this._fs.readdir({
                dirPath,
                success: (res) => resolve(res.files),
                fail: reject
            });
        });
    }

    async stat(path: string): Promise<FileInfo> {
        return new Promise((resolve, reject) => {
            this._fs.stat({
                path,
                success: (res) => {
                    const stats = res.stats as WechatMinigame.Stats;
                    resolve({
                        size: stats.size,
                        createTime: stats.lastAccessedTime,
                        modifyTime: stats.lastModifiedTime,
                        isDirectory: stats.isDirectory(),
                        isFile: stats.isFile()
                    });
                },
                fail: reject
            });
        });
    }

    async access(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.access({
                path,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.rename({
                oldPath,
                newPath,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    async copyFile(srcPath: string, destPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.copyFile({
                srcPath,
                destPath,
                success: () => resolve(),
                fail: reject
            });
        });
    }

    getUserDataPath(): string {
        return `${getWx().env.USER_DATA_PATH}`;
    }

    async unzip(options: {
        zipFilePath: string;
        targetPath: string;
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            this._fs.unzip({
                zipFilePath: options.zipFilePath,
                targetPath: options.targetPath,
                success: () => resolve(),
                fail: reject
            });
        });
    }
}
