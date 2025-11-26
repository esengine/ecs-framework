import { check, Update } from '@tauri-apps/plugin-updater';

export interface UpdateCheckResult {
    available: boolean;
    version?: string;
    currentVersion?: string;
    error?: string;
}

// 全局存储更新对象，以便后续安装
let pendingUpdate: Update | null = null;

/**
 * 检查应用更新（仅检查，不安装）
 *
 * 自动检查 GitHub Releases 是否有新版本
 * 返回检查结果，由调用者决定是否安装
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
    try {
        const update = await check();

        if (update?.available) {
            pendingUpdate = update;
            return {
                available: true,
                version: update.version,
                currentVersion: update.currentVersion
            };
        } else {
            pendingUpdate = null;
            return { available: false };
        }
    } catch (error) {
        console.error('检查更新失败:', error);
        pendingUpdate = null;
        return {
            available: false,
            error: error instanceof Error ? error.message : '检查更新失败'
        };
    }
}

/**
 * 安装待处理的更新
 * 需要先调用 checkForUpdates 检测到更新
 */
export async function installUpdate(): Promise<boolean> {
    if (!pendingUpdate) {
        console.error('没有待安装的更新');
        return false;
    }

    try {
        await pendingUpdate.downloadAndInstall();
        return true;
    } catch (error) {
        console.error('安装更新失败:', error);
        return false;
    }
}

/**
 * 应用启动时静默检查更新
 * 返回 Promise 以便调用者可以获取结果
 */
export async function checkForUpdatesOnStartup(): Promise<UpdateCheckResult> {
    // 延迟 2 秒后检查，避免影响启动速度
    return new Promise((resolve) => {
        setTimeout(async () => {
            const result = await checkForUpdates();
            resolve(result);
        }, 2000);
    });
}
