import { invoke } from '@tauri-apps/api/core';
import { createLogger } from '@esengine/ecs-framework';
import { useBehaviorTreeDataStore } from '../stores';

const logger = createLogger('BehaviorTreeFileService');

export interface FileLoadResult {
    success: boolean;
    fileName?: string;
    error?: string;
}

export class BehaviorTreeFileService {
    private loadingFiles = new Set<string>();

    async loadFile(filePath: string): Promise<FileLoadResult> {
        try {
            if (!filePath.endsWith('.btree')) {
                return {
                    success: false,
                    error: '无效的文件类型'
                };
            }

            if (this.loadingFiles.has(filePath)) {
                logger.debug('文件正在加载中，跳过重复请求:', filePath);
                return { success: false, error: '文件正在加载中' };
            }

            this.loadingFiles.add(filePath);

            try {
                logger.info('加载行为树文件:', filePath);
                const json = await invoke<string>('read_behavior_tree_file', { filePath });

                const store = useBehaviorTreeDataStore.getState();
                store.importFromJSON(json);

                const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || '未命名';
                logger.info('行为树已加载:', fileName);

                return {
                    success: true,
                    fileName
                };
            } finally {
                this.loadingFiles.delete(filePath);
            }
        } catch (error) {
            logger.error('加载行为树失败', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

export const behaviorTreeFileService = new BehaviorTreeFileService();
