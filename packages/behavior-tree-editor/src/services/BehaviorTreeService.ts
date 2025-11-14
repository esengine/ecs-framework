import { singleton } from 'tsyringe';
import { Core, IService } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';
import type { BehaviorTree } from '../domain/models/BehaviorTree';

@singleton()
export class BehaviorTreeService implements IService {
    async createNew(): Promise<void> {
        useBehaviorTreeDataStore.getState().reset();
    }

    async loadFromFile(filePath: string): Promise<void> {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const content = await invoke<string>('read_behavior_tree_file', { filePath });

            const store = useBehaviorTreeDataStore.getState();
            store.importFromJSON(content);

            const messageHub = Core.services.resolve(MessageHub);
            if (messageHub) {
                messageHub.publish('dynamic-panel:open', {
                    panelId: 'behavior-tree-editor',
                    title: `Behavior Tree - ${filePath.split(/[\\/]/).pop()}`
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
        useBehaviorTreeDataStore.getState().reset();
    }
}
