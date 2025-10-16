import { check } from '@tauri-apps/plugin-updater';

export interface UpdateCheckResult {
    available: boolean;
    version?: string;
    currentVersion?: string;
    error?: string;
}

/**
 * 检查应用更新
 *
 * 自动检查 GitHub Releases 是否有新版本
 * 如果有更新，提示用户并可选择安装
 */
export async function checkForUpdates(silent: boolean = false): Promise<UpdateCheckResult> {
    try {
        const update = await check();

        if (update?.available) {
            console.log(`发现新版本: ${update.version}`);
            console.log(`当前版本: ${update.currentVersion}`);
            console.log(`更新日期: ${update.date}`);
            console.log(`更新说明:\n${update.body}`);

            if (!silent) {
                // Tauri 会自动显示更新对话框（因为配置了 dialog: true）
                // 用户点击确认后会自动下载并安装，安装完成后会自动重启
                await update.downloadAndInstall();
            }

            return {
                available: true,
                version: update.version,
                currentVersion: update.currentVersion
            };
        } else {
            if (!silent) {
                console.log('当前已是最新版本');
            }
            return { available: false };
        }
    } catch (error) {
        console.error('检查更新失败:', error);
        return {
            available: false,
            error: error instanceof Error ? error.message : '检查更新失败'
        };
    }
}

/**
 * 应用启动时静默检查更新
 */
export async function checkForUpdatesOnStartup(): Promise<void> {
    // 延迟 3 秒后检查，避免影响启动速度
    setTimeout(() => {
        checkForUpdates(true);
    }, 3000);
}
