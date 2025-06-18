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
    if (isChecking) return '检查状态中...';
    if (isInstalling) return '正在安装AI系统...';
    return isInstalled ? 'AI系统已安装' : 'AI系统未安装';
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
export async function installBehaviorTreeAI(projectPath: string): Promise<boolean> {
    try {
        const result = await Editor.Message.request('cocos-ecs-extension', 'install-behavior-tree');
        return Boolean(result);
    } catch (error) {
        console.error('请求安装AI系统失败:', error);
        return false;
    }
}

/**
 * 更新行为树AI系统
 * 通过发送消息到主进程来执行真实的npm更新命令
 */
export async function updateBehaviorTreeAI(projectPath: string): Promise<boolean> {
    try {
        const result = await Editor.Message.request('cocos-ecs-extension', 'update-behavior-tree');
        return Boolean(result);
    } catch (error) {
        console.error('请求更新AI系统失败:', error);
        return false;
    }
} 