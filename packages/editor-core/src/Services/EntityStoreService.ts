import { Injectable, IService, Entity } from '@esengine/ecs-framework';
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
  private rootEntities: Set<number> = new Set();

  constructor(private messageHub: MessageHub) {}

  public dispose(): void {
    this.entities.clear();
    this.rootEntities.clear();
    this.selectedEntity = null;
  }

  public addEntity(entity: Entity, parent?: Entity): void {
    this.entities.set(entity.id, entity);

    if (!parent) {
      this.rootEntities.add(entity.id);
    }

    this.messageHub.publish('entity:added', { entity, parent });
  }

  public removeEntity(entity: Entity): void {
    this.entities.delete(entity.id);
    this.rootEntities.delete(entity.id);

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
    return Array.from(this.rootEntities)
      .map(id => this.entities.get(id))
      .filter((e): e is Entity => e !== undefined);
  }

  public getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  public clear(): void {
    this.entities.clear();
    this.rootEntities.clear();
    this.selectedEntity = null;
    this.messageHub.publish('entities:cleared', {});
  }
}
