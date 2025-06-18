import { Ref } from 'vue';
import { checkBehaviorTreeInstalled, installBehaviorTreeAI } from '../utils/installUtils';

/**
 * 安装管理
 */
export function useInstallation(
    checkingStatus: Ref<boolean>,
    isInstalled: Ref<boolean>,
    version: Ref<string | null>,
    isInstalling: Ref<boolean>
) {
    
    // 检查安装状态
    const checkInstallStatus = async () => {
        checkingStatus.value = true;
        try {
            const result = await checkBehaviorTreeInstalled(Editor.Project.path);
            isInstalled.value = result.installed;
            version.value = result.version;
        } catch (error) {
            console.error('检查AI系统安装状态失败:', error);
            isInstalled.value = false;
            version.value = null;
        } finally {
            checkingStatus.value = false;
        }
    };

    // 处理安装
    const handleInstall = async () => {
        isInstalling.value = true;
        try {
            const result = await installBehaviorTreeAI(Editor.Project.path);
            
            if (result) {
                // 等待文件系统更新
                await new Promise(resolve => setTimeout(resolve, 2000));
                await checkInstallStatus();
                
                // 如果第一次检查失败，再次尝试
                if (!isInstalled.value) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await checkInstallStatus();
                }
            } else {
                console.error('AI系统安装失败');
            }
        } catch (error) {
            console.error('安装AI系统时发生错误:', error);
        } finally {
            isInstalling.value = false;
        }
    };

    return {
        checkInstallStatus,
        handleInstall
    };
} 