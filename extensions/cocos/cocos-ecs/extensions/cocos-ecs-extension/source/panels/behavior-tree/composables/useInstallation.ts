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
            await installBehaviorTreeAI(Editor.Project.path);
            await checkInstallStatus();
        } catch (error) {
            // 安装失败时静默处理
        } finally {
            isInstalling.value = false;
        }
    };

    return {
        checkInstallStatus,
        handleInstall
    };
} 