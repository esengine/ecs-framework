import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface BuildProgress {
    step: 'install' | 'build' | 'package' | 'complete';
    message: string;
    output?: string;
}

interface RustBuildProgress {
    step: string;
    output: string | null;
}

export class PluginBuildService {
    private onProgress?: (progress: BuildProgress) => void;

    setProgressCallback(callback: (progress: BuildProgress) => void) {
        this.onProgress = callback;
    }

    async buildPlugin(pluginFolder: string): Promise<string> {
        const unlisten = await listen<RustBuildProgress>('plugin-build-progress', (event) => {
            const { step } = event.payload;

            let message = '';
            let progressStep: BuildProgress['step'] = 'install';

            switch (step) {
                case 'install':
                    message = '正在安装依赖...';
                    progressStep = 'install';
                    break;
                case 'build':
                    message = '正在构建项目...';
                    progressStep = 'build';
                    break;
                case 'package':
                    message = '正在打包 ZIP...';
                    progressStep = 'package';
                    break;
                case 'complete':
                    message = '构建完成！';
                    progressStep = 'complete';
                    break;
            }

            this.onProgress?.({
                step: progressStep,
                message
            });
        });

        try {
            const zipPath = await invoke<string>('build_plugin', {
                pluginFolder
            });

            return zipPath;
        } catch (error) {
            console.error('[PluginBuildService] Build failed:', error);
            throw error;
        } finally {
            unlisten();
        }
    }
}
