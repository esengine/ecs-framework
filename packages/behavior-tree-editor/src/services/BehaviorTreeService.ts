import { singleton } from 'tsyringe';
import { IService } from '@esengine/ecs-framework';
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
