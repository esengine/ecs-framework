import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';

/**
 * 热更新配置接口
 */
interface HotUpdateConfig {
    serverUrl: string;
    currentVersion: string;
    updateChannel: 'stable' | 'beta' | 'dev';
    autoCheck: boolean;
    checkInterval: number; // 分钟
}

/**
 * 版本信息接口
 */
interface VersionInfo {
    version: string;
    releaseDate: string;
    description: string;
    downloadUrl: string;
    fileSize: number;
    checksum: string;
    mandatory: boolean; // 是否强制更新
    files: UpdateFile[];
}

/**
 * 更新文件接口
 */
interface UpdateFile {
    path: string;
    hash: string;
    size: number;
    action: 'add' | 'update' | 'delete';
}

/**
 * 热更新处理器
 */
export class HotUpdateHandler {
    private static readonly CONFIG_FILE = 'hot-update-config.json';
    private static readonly VERSION_FILE = 'version-info.json';
    private static readonly EXTENSION_PATH = Editor.Package.getPath('cocos-ecs-extension') || '';
    
    private static config: HotUpdateConfig;
    private static updateTimer: NodeJS.Timeout | null = null;

    /**
     * 初始化热更新系统
     */
    static async initialize(): Promise<void> {
        console.log('[HotUpdate] 初始化热更新系统...');
        
        try {
            await this.loadConfig();
            await this.startAutoCheck();
            console.log('[HotUpdate] 热更新系统初始化完成');
        } catch (error) {
            console.error('[HotUpdate] 初始化失败:', error);
        }
    }

    /**
     * 加载配置
     */
    private static async loadConfig(): Promise<void> {
        const configPath = path.join(this.EXTENSION_PATH, this.CONFIG_FILE);
        
        try {
            if (await fs.pathExists(configPath)) {
                this.config = await fs.readJSON(configPath);
            } else {
                // 创建默认配置
                this.config = {
                    serverUrl: 'https://earthonline-game.cn/api/plugin-updates',
                    currentVersion: this.getCurrentVersion(),
                    updateChannel: 'stable',
                    autoCheck: true,
                    checkInterval: 60 // 60分钟检查一次
                };
                await this.saveConfig();
            }
        } catch (error) {
            console.error('[HotUpdate] 配置加载失败:', error);
            throw error;
        }
    }

    /**
     * 保存配置
     */
    private static async saveConfig(): Promise<void> {
        const configPath = path.join(this.EXTENSION_PATH, this.CONFIG_FILE);
        await fs.writeJSON(configPath, this.config, { spaces: 2 });
    }

    /**
     * 获取当前版本
     */
    private static getCurrentVersion(): string {
        try {
            const packagePath = path.join(this.EXTENSION_PATH, 'package.json');
            const packageInfo = fs.readJSONSync(packagePath);
            return packageInfo.version;
        } catch (error) {
            console.error('[HotUpdate] 无法获取当前版本:', error);
            return '1.0.0';
        }
    }

    /**
     * 开始自动检查
     */
    private static async startAutoCheck(): Promise<void> {
        if (!this.config.autoCheck) {
            return;
        }

        // 立即检查一次
        await this.checkForUpdates(true);

        // 设置定时检查
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(async () => {
            await this.checkForUpdates(true);
        }, this.config.checkInterval * 60 * 1000);
    }

    /**
     * 检查更新
     */
    static async checkForUpdates(silent: boolean = false): Promise<VersionInfo | null> {
        console.log('[HotUpdate] 检查更新中...');
        
        try {
            const response = await fetch(`${this.config.serverUrl}/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentVersion: this.config.currentVersion,
                    pluginId: 'cocos-ecs-extension', // 当前插件ID
                    channel: this.config.updateChannel,
                    platform: process.platform,
                    editorVersion: Editor.App.version
                })
            });

            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }

            const versionInfo: VersionInfo = await response.json();
            
            if (this.isNewerVersion(versionInfo.version, this.config.currentVersion)) {
                console.log(`[HotUpdate] 发现新版本: ${versionInfo.version}`);
                
                if (!silent) {
                    await this.showUpdateDialog(versionInfo);
                }
                
                return versionInfo;
            } else {
                if (!silent) {
                    Editor.Dialog.info('检查更新', {
                        detail: '当前已是最新版本!'
                    });
                }
                return null;
            }
        } catch (error) {
            console.error('[HotUpdate] 检查更新失败:', error);
            
            if (!silent) {
                Editor.Dialog.error('检查更新失败', {
                    detail: `无法连接到更新服务器：\n\n${error instanceof Error ? error.message : String(error)}`
                });
            }
            return null;
        }
    }

    /**
     * 比较版本号
     */
    private static isNewerVersion(newVersion: string, currentVersion: string): boolean {
        const parseVersion = (version: string) => {
            return version.split('.').map(Number);
        };

        const newParts = parseVersion(newVersion);
        const currentParts = parseVersion(currentVersion);
        const maxLength = Math.max(newParts.length, currentParts.length);

        for (let i = 0; i < maxLength; i++) {
            const newPart = newParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (newPart > currentPart) return true;
            if (newPart < currentPart) return false;
        }

        return false;
    }

    /**
     * 显示更新对话框
     */
    private static async showUpdateDialog(versionInfo: VersionInfo): Promise<void> {
        const message = `发现新版本 ${versionInfo.version}!\n\n` +
                       `发布时间: ${versionInfo.releaseDate}\n\n` +
                       `更新内容:\n${versionInfo.description}\n\n` +
                       `文件大小: ${this.formatFileSize(versionInfo.fileSize)}`;

        const buttons = versionInfo.mandatory ? ['立即更新'] : ['立即更新', '稍后提醒', '跳过此版本'];

        const result = await Editor.Dialog.info('插件更新', {
            detail: message,
            buttons: buttons
        });

        switch (result.response) {
            case 0: // 立即更新
                await this.downloadAndInstallUpdate(versionInfo);
                break;
            case 1: // 稍后提醒
                if (!versionInfo.mandatory) {
                    console.log('[HotUpdate] 用户选择稍后更新');
                }
                break;
            case 2: // 跳过此版本
                if (!versionInfo.mandatory) {
                    await this.skipVersion(versionInfo.version);
                }
                break;
        }
    }

    /**
     * 下载并安装更新
     */
    private static async downloadAndInstallUpdate(versionInfo: VersionInfo): Promise<void> {
        console.log(`[HotUpdate] 开始下载更新: ${versionInfo.version}`);
        
        try {
            // 显示进度对话框
            const progressDialog = this.showProgressDialog('正在下载更新...');
            
            // 下载更新包
            const updatePath = await this.downloadUpdate(versionInfo, (progress) => {
                // 更新进度
                console.log(`[HotUpdate] 下载进度: ${progress}%`);
            });

            progressDialog.detail = '正在验证文件...';
            
            // 验证文件完整性
            const isValid = await this.verifyUpdate(updatePath, versionInfo.checksum);
            if (!isValid) {
                throw new Error('文件校验失败，更新包可能已损坏');
            }

            progressDialog.detail = '正在安装更新...';
            
            // 安装更新
            await this.installUpdate(updatePath, versionInfo);
            
            // 更新版本信息
            this.config.currentVersion = versionInfo.version;
            await this.saveConfig();
            
            // 显示安装完成对话框
            const result = await Editor.Dialog.info('更新完成', {
                detail: `插件已成功更新到版本 ${versionInfo.version}!\n\n为了使更新生效，需要重启Cocos Creator编辑器。`,
                buttons: ['立即重启', '稍后重启']
            });

            if (result.response === 0) {
                this.restartEditor();
            }
            
        } catch (error) {
            console.error('[HotUpdate] 更新失败:', error);
            Editor.Dialog.error('更新失败', {
                detail: `更新过程中发生错误：\n\n${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    /**
     * 下载更新
     */
    private static async downloadUpdate(versionInfo: VersionInfo, onProgress?: (progress: number) => void): Promise<string> {
        const response = await fetch(versionInfo.downloadUrl);
        
        if (!response.ok) {
            throw new Error(`下载失败: ${response.status}`);
        }

        const totalSize = parseInt(response.headers.get('content-length') || '0');
        let downloadedSize = 0;

        const tempPath = path.join(this.EXTENSION_PATH, 'temp', `update-${versionInfo.version}.zip`);
        await fs.ensureDir(path.dirname(tempPath));

        const writer = fs.createWriteStream(tempPath);
        const reader = response.body?.getReader();

        if (!reader) {
            throw new Error('无法创建下载流');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                writer.write(value);
                downloadedSize += value.length;
                
                if (onProgress && totalSize > 0) {
                    const progress = Math.round((downloadedSize / totalSize) * 100);
                    onProgress(progress);
                }
            }
            
            writer.end();
            return tempPath;
            
        } catch (error) {
            writer.destroy();
            await fs.remove(tempPath).catch(() => {}); // 忽略删除错误
            throw error;
        }
    }

    /**
     * 验证更新包
     */
    private static async verifyUpdate(filePath: string, expectedChecksum: string): Promise<boolean> {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            const actualChecksum = hash.digest('hex');
            
            return actualChecksum === expectedChecksum;
        } catch (error) {
            console.error('[HotUpdate] 文件校验失败:', error);
            return false;
        }
    }

    /**
     * 安装更新
     */
    private static async installUpdate(updatePath: string, versionInfo: VersionInfo): Promise<void> {
        const extractPath = path.join(this.EXTENSION_PATH, 'temp', 'extract');
        
        try {
            // 清理临时目录
            await fs.remove(extractPath);
            await fs.ensureDir(extractPath);
            
            // 解压更新包
            await this.extractZip(updatePath, extractPath);
            
            // 备份当前版本
            const backupPath = path.join(this.EXTENSION_PATH, 'backup', this.config.currentVersion);
            await this.createBackup(backupPath);
            
            // 应用更新文件
            await this.applyUpdateFiles(extractPath, versionInfo.files);
            
            // 清理临时文件
            await fs.remove(path.dirname(updatePath));
            
        } catch (error) {
            console.error('[HotUpdate] 安装更新失败:', error);
            // 尝试恢复备份
            await this.restoreBackup();
            throw error;
        }
    }

    /**
     * 解压ZIP文件
     */
    private static async extractZip(zipPath: string, extractPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 这里使用node的解压库，您可能需要安装 yauzl 或 adm-zip
            const AdmZip = require('adm-zip');
            
            try {
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(extractPath, true);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 应用更新文件
     */
    private static async applyUpdateFiles(extractPath: string, files: UpdateFile[]): Promise<void> {
        for (const file of files) {
            const sourcePath = path.join(extractPath, file.path);
            const targetPath = path.join(this.EXTENSION_PATH, file.path);
            
            try {
                switch (file.action) {
                    case 'add':
                    case 'update':
                        await fs.ensureDir(path.dirname(targetPath));
                        await fs.copy(sourcePath, targetPath, { overwrite: true });
                        break;
                    case 'delete':
                        await fs.remove(targetPath);
                        break;
                }
            } catch (error) {
                console.error(`[HotUpdate] 处理文件失败 ${file.path}:`, error);
                throw error;
            }
        }
    }

    /**
     * 创建备份
     */
    private static async createBackup(backupPath: string): Promise<void> {
        await fs.ensureDir(backupPath);
        
        const sourceFiles = [
            'source',
            'static',
            'package.json',
            'README.md'
        ];
        
        for (const file of sourceFiles) {
            const sourcePath = path.join(this.EXTENSION_PATH, file);
            const targetPath = path.join(backupPath, file);
            
            if (await fs.pathExists(sourcePath)) {
                await fs.copy(sourcePath, targetPath);
            }
        }
    }

    /**
     * 恢复备份
     */
    private static async restoreBackup(): Promise<void> {
        const backupPath = path.join(this.EXTENSION_PATH, 'backup', this.config.currentVersion);
        
        if (await fs.pathExists(backupPath)) {
            console.log('[HotUpdate] 正在恢复备份...');
            
            const backupFiles = await fs.readdir(backupPath);
            for (const file of backupFiles) {
                const sourcePath = path.join(backupPath, file);
                const targetPath = path.join(this.EXTENSION_PATH, file);
                
                await fs.copy(sourcePath, targetPath, { overwrite: true });
            }
        }
    }

    /**
     * 跳过版本
     */
    private static async skipVersion(version: string): Promise<void> {
        const skipPath = path.join(this.EXTENSION_PATH, 'skipped-versions.json');
        let skippedVersions: string[] = [];
        
        if (await fs.pathExists(skipPath)) {
            skippedVersions = await fs.readJSON(skipPath);
        }
        
        if (!skippedVersions.includes(version)) {
            skippedVersions.push(version);
            await fs.writeJSON(skipPath, skippedVersions);
        }
    }

    /**
     * 显示进度对话框
     */
    private static showProgressDialog(message: string) {
        // 这是一个简化版本，实际可能需要创建自定义进度条
        return {
            detail: message
        };
    }

    /**
     * 格式化文件大小
     */
    private static formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * 重启编辑器
     */
    private static restartEditor(): void {
        // 注意：这个功能需要特殊权限，可能需要用户手动重启
        console.log('[HotUpdate] 请求重启编辑器');
        
        try {
            // 尝试重启编辑器（可能不会成功）
            Editor.App.quit();
        } catch (error) {
            console.warn('[HotUpdate] 无法自动重启编辑器:', error);
        }
    }

    /**
     * 设置更新配置
     */
    static async setConfig(newConfig: Partial<HotUpdateConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        await this.saveConfig();
        
        // 重新启动自动检查
        if (this.config.autoCheck) {
            await this.startAutoCheck();
        } else if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * 获取配置
     */
    static getConfig(): HotUpdateConfig {
        return { ...this.config };
    }

    /**
     * 清理资源
     */
    static cleanup(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
} 