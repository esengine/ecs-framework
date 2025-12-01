import { Injectable, IService, Entity, Core, HierarchyComponent } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';

export interface EntityTreeNode {
  entity: Entity;
  children: EntityTreeNode[];
  parent: EntityTreeNode | null;
}

/**
 * 管理编辑器中的实体状态和选择
 */
@Injectable()
export class EntityStoreService implements IService {
    private entities: Map<number, Entity> = new Map();
    private selectedEntity: Entity | null = null;
    private rootEntityIds: number[] = [];

    constructor(private messageHub: MessageHub) {}

    public dispose(): void {
        this.entities.clear();
        this.rootEntityIds = [];
        this.selectedEntity = null;
    }

    public addEntity(entity: Entity, parent?: Entity): void {
        this.entities.set(entity.id, entity);

        if (!parent && !this.rootEntityIds.includes(entity.id)) {
            this.rootEntityIds.push(entity.id);
        }

        this.messageHub.publish('entity:added', { entity, parent });
    }

    public removeEntity(entity: Entity): void {
        this.entities.delete(entity.id);
        const idx = this.rootEntityIds.indexOf(entity.id);
        if (idx !== -1) {
            this.rootEntityIds.splice(idx, 1);
        }

        if (this.selectedEntity?.id === entity.id) {
            this.selectedEntity = null;
            this.messageHub.publish('entity:selected', { entity: null });
        }

        this.messageHub.publish('entity:removed', { entity });
    }

    public selectEntity(entity: Entity | null): void {
        this.selectedEntity = entity;
        this.messageHub.publish('entity:selected', { entity });
    }

    public getSelectedEntity(): Entity | null {
        return this.selectedEntity;
    }

    public getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    public getRootEntities(): Entity[] {
        return this.rootEntityIds
            .map((id) => this.entities.get(id))
            .filter((e): e is Entity => e !== undefined);
    }

    public getRootEntityIds(): number[] {
        return [...this.rootEntityIds];
    }

    public getEntity(id: number): Entity | undefined {
        return this.entities.get(id);
    }

    public clear(): void {
        this.entities.clear();
        this.rootEntityIds = [];
        this.selectedEntity = null;
        this.messageHub.publish('entities:cleared', {});
    }

    public syncFromScene(): void {
        const scene = Core.scene;
        if (!scene) return;

        this.entities.clear();
        this.rootEntityIds = [];

        scene.entities.forEach((entity) => {
            this.entities.set(entity.id, entity);
            const hierarchy = entity.getComponent(HierarchyComponent);
            const bHasNoParent = hierarchy?.parentId === null || hierarchy?.parentId === undefined;
            if (bHasNoParent) {
                this.rootEntityIds.push(entity.id);
            }
        });
    }

    public reorderEntity(entityId: number, newIndex: number): void {
        const idx = this.rootEntityIds.indexOf(entityId);
        if (idx === -1 || idx === newIndex) return;

        const clampedIndex = Math.max(0, Math.min(newIndex, this.rootEntityIds.length - 1));

        this.rootEntityIds.splice(idx, 1);
        this.rootEntityIds.splice(clampedIndex, 0, entityId);

        const scene = Core.scene;
        if (scene) {
            scene.entities.reorderEntity(entityId, clampedIndex);
        }

        this.messageHub.publish('entity:reordered', { entityId, newIndex: clampedIndex });
    }
}
