import { InstallStatus } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 检查行为树AI系统是否已安装
 * 通过主进程检查项目中是否安装了@esengine/ai包
 */
export async function checkBehaviorTreeInstalled(projectPath: string): Promise<InstallStatus> {
    try {
        // 通过Editor.Message请求主进程检查安装状态
        const isInstalled = await Editor.Message.request('cocos-ecs-extension', 'check-behavior-tree-installed');
        
        if (isInstalled) {
            // 如果已安装，读取版本信息
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                const aiPackage = dependencies['@esengine/ai'];
                
                return {
                    installed: true,
                    version: aiPackage || null,
                    packageExists: true
                };
            }
        }
        
        return {
            installed: false,
            version: null,
            packageExists: fs.existsSync(path.join(projectPath, 'package.json'))
        };
    } catch (error) {
        console.error('检查行为树安装状态失败:', error);
        return {
            installed: false,
            version: null,
            packageExists: false
        };
    }
}

/**
 * 格式化安装状态文本
 */
export function getInstallStatusText(
    isChecking: boolean,
    isInstalling: boolean,
    isInstalled: boolean,
    version: string | null
): string {
    if (isChecking) return '检查中...';
    if (isInstalling) return '安装中...';
    return isInstalled ? `✅ AI系统已安装 (v${version})` : '❌ AI系统未安装';
}

/**
 * 获取安装状态CSS类
 */
export function getInstallStatusClass(
    isInstalling: boolean,
    isInstalled: boolean
): string {
    if (isInstalling) return 'installing';
    return isInstalled ? 'installed' : 'not-installed';
}

/**
 * 安装行为树AI系统
 * 通过发送消息到主进程来执行真实的npm安装命令
 */
export async function installBehaviorTreeAI(projectPath: string): Promise<void> {
    try {
        // 通过Editor.Message发送安装消息到主进程
        // 主进程会执行实际的npm install @esengine/ai命令
        const result = await Editor.Message.request('cocos-ecs-extension', 'install-behavior-tree');
        
        if (!result) {
            throw new Error('安装请求失败，未收到主进程响应');
        }
        
        console.log('行为树AI系统安装完成');
    } catch (error) {
        console.error('行为树AI系统安装失败:', error);
        throw error;
    }
}

/**
 * 更新行为树AI系统
 * 通过发送消息到主进程来执行真实的npm更新命令
 */
export async function updateBehaviorTreeAI(projectPath: string): Promise<void> {
    try {
        // 通过Editor.Message发送更新消息到主进程
        // 主进程会执行实际的npm update @esengine/ai命令
        const result = await Editor.Message.request('cocos-ecs-extension', 'update-behavior-tree');
        
        if (!result) {
            throw new Error('更新请求失败，未收到主进程响应');
        }
        
        console.log('行为树AI系统更新完成');
    } catch (error) {
        console.error('行为树AI系统更新失败:', error);
        throw error;
    }
} 