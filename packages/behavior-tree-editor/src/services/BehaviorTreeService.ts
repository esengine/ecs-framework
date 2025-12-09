import {
    singleton,
    createLogger,
    MessageHub,
    IMessageHub,
} from '@esengine/editor-runtime';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';
import type { BehaviorTree } from '../domain/models/BehaviorTree';
import { FileSystemService } from './FileSystemService';
import { PluginContext } from '../PluginContext';
import type { IBehaviorTreeService } from '../tokens';

const logger = createLogger('BehaviorTreeService');

@singleton()
export class BehaviorTreeService implements IBehaviorTreeService {
    async createNew(): Promise<void> {
        useBehaviorTreeDataStore.getState().reset();
    }

    async loadFromFile(filePath: string): Promise<void> {
        try {
            const services = PluginContext.getServices();

            // 运行时解析 FileSystemService
            const fileSystem = services.resolve(FileSystemService);
            if (!fileSystem) {
                throw new Error('FileSystemService not found. Please ensure the BehaviorTreePlugin is properly installed.');
            }

            const content = await fileSystem.readBehaviorTreeFile(filePath);
            const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || 'Untitled';

            const store = useBehaviorTreeDataStore.getState();
            store.importFromJSON(content);
            // 在 store 中保存文件信息，Panel 挂载时读取
            store.setCurrentFile(filePath, fileName);

            const messageHub = services.resolve<MessageHub>(IMessageHub);
            if (messageHub) {
                messageHub.publish('dynamic-panel:open', {
                    panelId: 'behavior-tree-editor',
                    title: `Behavior Tree - ${filePath.split(/[\\/]/).pop()}`
                });

                // 保留事件发布，以防 Panel 已挂载
                messageHub.publish('behavior-tree:file-opened', {
                    filePath,
                    fileName
                });
            }
        } catch (error) {
            logger.error('Failed to load tree:', error);
            throw error;
        }
    }

    async saveToFile(filePath: string, metadata?: { name: string; description: string }): Promise<void> {
        try {
            const services = PluginContext.getServices();

            // 运行时解析 FileSystemService
            const fileSystem = services.resolve(FileSystemService);
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

            logger.info('Tree saved successfully:', filePath);
        } catch (error) {
            logger.error('Failed to save tree:', error);
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
