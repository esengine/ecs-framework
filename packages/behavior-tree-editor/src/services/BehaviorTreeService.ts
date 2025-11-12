import { singleton } from 'tsyringe';
import { Core, IService } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';
import { useTreeStore } from '../stores';
import type { BehaviorTree } from '../domain/models/BehaviorTree';

@singleton()
export class BehaviorTreeService implements IService {
    async createNew(): Promise<void> {
        useTreeStore.getState().reset();
        useBehaviorTreeDataStore.getState().reset();
    }

    async loadFromFile(filePath: string): Promise<void> {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const content = await invoke<string>('read_behavior_tree_file', { filePath });

            useTreeStore.getState().importFromJSON(content);
            useTreeStore.getState().setIsOpen(true);
            useTreeStore.getState().setPendingFilePath(filePath);

            const messageHub = Core.services.resolve(MessageHub);
            if (messageHub) {
                // 发布 dynamic-panel:open 消息来打开行为树编辑器面板
                messageHub.publish('dynamic-panel:open', {
                    panelId: 'behavior-tree-editor',
                    title: `Behavior Tree - ${filePath.split(/[\\/]/).pop()}`  // 使用文件名作为标题
                });
            }
        } catch (error) {
            console.error('[BehaviorTreeService] Failed to load tree:', error);
            throw error;
        }
    }

    async saveToFile(filePath: string): Promise<void> {
        // TODO: 实现保存功能
    }

    getCurrentTree(): BehaviorTree {
        return useBehaviorTreeDataStore.getState().tree;
    }

    setTree(tree: BehaviorTree): void {
        useBehaviorTreeDataStore.getState().setTree(tree);
    }

    dispose(): void {
        // 清理资源
    }
}
