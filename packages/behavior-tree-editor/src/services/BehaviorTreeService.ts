import { singleton } from 'tsyringe';
import { Core, IService } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';
import type { BehaviorTree } from '../domain/models/BehaviorTree';
import { FileSystemService } from './FileSystemService';

@singleton()
export class BehaviorTreeService implements IService {
    async createNew(): Promise<void> {
        useBehaviorTreeDataStore.getState().reset();
    }

    async loadFromFile(filePath: string): Promise<void> {
        try {
            // 运行时解析 FileSystemService
            const fileSystem = Core.services.resolve(FileSystemService);
            if (!fileSystem) {
                throw new Error('FileSystemService not found. Please ensure the BehaviorTreePlugin is properly installed.');
            }

            const content = await fileSystem.readBehaviorTreeFile(filePath);

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

    async saveToFile(filePath: string, metadata?: { name: string; description: string }): Promise<void> {
        try {
            // 运行时解析 FileSystemService
            const fileSystem = Core.services.resolve(FileSystemService);
            if (!fileSystem) {
                throw new Error('FileSystemService not found. Please ensure the BehaviorTreePlugin is properly installed.');
            }

            const store = useBehaviorTreeDataStore.getState();

            // 如果没有提供元数据，使用文件名作为默认名称
            const defaultMetadata = {
                name: metadata?.name || filePath.split(/[\\/]/).pop()?.replace('.btree', '') || 'Untitled',
                description: metadata?.description || ''
            };

            const content = store.exportToJSON(defaultMetadata);
            await fileSystem.writeBehaviorTreeFile(filePath, content);

            console.log('[BehaviorTreeService] Tree saved successfully:', filePath);
        } catch (error) {
            console.error('[BehaviorTreeService] Failed to save tree:', error);
            throw error;
        }
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
