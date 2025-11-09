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
        console.log('[BehaviorTreeService] Loading tree from:', filePath);

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const content = await invoke<string>('read_behavior_tree_file', { filePath });

            useTreeStore.getState().importFromJSON(content);
            useTreeStore.getState().setIsOpen(true);
            useTreeStore.getState().setPendingFilePath(filePath);

            const messageHub = Core.services.resolve(MessageHub);
            if (messageHub) {
                messageHub.publish('behavior-tree:open', { filePath, tree: JSON.parse(content) });
            }

            console.log('[BehaviorTreeService] Tree loaded successfully');
        } catch (error) {
            console.error('[BehaviorTreeService] Failed to load tree:', error);
            throw error;
        }
    }

    async saveToFile(filePath: string): Promise<void> {
        console.log('[BehaviorTreeService] Saving tree to:', filePath);
    }

    getCurrentTree(): BehaviorTree {
        return useBehaviorTreeDataStore.getState().tree;
    }

    setTree(tree: BehaviorTree): void {
        useBehaviorTreeDataStore.getState().setTree(tree);
    }

    dispose(): void {
        console.log('[BehaviorTreeService] Disposing service');
    }
}
