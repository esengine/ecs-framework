import { EntityList } from '../../../src/ECS/Utils/EntityList';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';

class TestComponent extends Component {
    public value: number = 0;

    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

// Mock scene with identifier pool
function createMockScene() {
    const recycledIds: number[] = [];
    return {
        identifierPool: {
            checkIn: (id: number) => {
                recycledIds.push(id);
            },
            getRecycledIds: () => recycledIds
        }
    };
}

// Mock entity
function createMockEntity(id: number, name: string = '', tag: number = 0, options?: { enabled?: boolean; isDestroyed?: boolean }): Entity {
    const entity = {
        id,
        name,
        tag,
        enabled: options?.enabled ?? true,
        isDestroyed: options?.isDestroyed ?? false,
        destroy: jest.fn(),
        hasComponent: jest.fn().mockReturnValue(false)
    } as unknown as Entity;
    return entity;
}

describe('EntityList', () => {
    let entityList: EntityList;
    let mockScene: ReturnType<typeof createMockScene>;

    beforeEach(() => {
        mockScene = createMockScene();
        entityList = new EntityList(mockScene);
    });

    describe('add and remove', () => {
        it('should add entity to list', () => {
            const entity = createMockEntity(1, 'test');
            entityList.add(entity);

            expect(entityList.count).toBe(1);
            expect(entityList.buffer[0]).toBe(entity);
        });

        it('should not add duplicate entity', () => {
            const entity = createMockEntity(1, 'test');
            entityList.add(entity);
            entityList.add(entity);

            expect(entityList.count).toBe(1);
        });

        it('should remove entity from list', () => {
            const entity = createMockEntity(1, 'test');
            entityList.add(entity);
            entityList.remove(entity);

            expect(entityList.count).toBe(0);
        });

        it('should recycle entity id on remove', () => {
            const entity = createMockEntity(1, 'test');
            entityList.add(entity);
            entityList.remove(entity);

            expect(mockScene.identifierPool.getRecycledIds()).toContain(1);
        });
    });

    describe('findEntity methods', () => {
        it('should find entity by name', () => {
            const entity = createMockEntity(1, 'player');
            entityList.add(entity);

            const found = entityList.findEntity('player');
            expect(found).toBe(entity);
        });

        it('should return null for non-existent name', () => {
            const found = entityList.findEntity('nonexistent');
            expect(found).toBeNull();
        });

        it('should find entity by id', () => {
            const entity = createMockEntity(42, 'test');
            entityList.add(entity);

            const found = entityList.findEntityById(42);
            expect(found).toBe(entity);
        });

        it('should return null for non-existent id', () => {
            const found = entityList.findEntityById(999);
            expect(found).toBeNull();
        });

        it('should find all entities by name', () => {
            const entity1 = createMockEntity(1, 'enemy');
            const entity2 = createMockEntity(2, 'enemy');
            const entity3 = createMockEntity(3, 'player');
            entityList.add(entity1);
            entityList.add(entity2);
            entityList.add(entity3);

            const enemies = entityList.findEntitiesByName('enemy');
            expect(enemies).toHaveLength(2);
            expect(enemies).toContain(entity1);
            expect(enemies).toContain(entity2);
        });

        it('should find entities by tag', () => {
            const entity1 = createMockEntity(1, 'e1', 1);
            const entity2 = createMockEntity(2, 'e2', 2);
            const entity3 = createMockEntity(3, 'e3', 1);
            entityList.add(entity1);
            entityList.add(entity2);
            entityList.add(entity3);

            const tagged = entityList.findEntitiesByTag(1);
            expect(tagged).toHaveLength(2);
            expect(tagged).toContain(entity1);
            expect(tagged).toContain(entity3);
        });

        it('should find entities with component', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            (entity1.hasComponent as jest.Mock).mockReturnValue(true);
            (entity2.hasComponent as jest.Mock).mockReturnValue(false);

            entityList.add(entity1);
            entityList.add(entity2);

            const withComponent = entityList.findEntitiesWithComponent(TestComponent);
            expect(withComponent).toHaveLength(1);
            expect(withComponent[0]).toBe(entity1);
        });
    });

    describe('removeAllEntities', () => {
        it('should remove all entities and clear indices', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.removeAllEntities();

            expect(entityList.count).toBe(0);
            expect(entityList.findEntityById(1)).toBeNull();
            expect(entityList.findEntityById(2)).toBeNull();
        });

        it('should call destroy on all entities', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.removeAllEntities();

            expect(entity1.destroy).toHaveBeenCalled();
            expect(entity2.destroy).toHaveBeenCalled();
        });

        it('should recycle all entity ids', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.removeAllEntities();

            const recycled = mockScene.identifierPool.getRecycledIds();
            expect(recycled).toContain(1);
            expect(recycled).toContain(2);
        });
    });

    describe('reorderEntity', () => {
        it('should reorder entity to new position', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            const entity3 = createMockEntity(3, 'e3');
            entityList.add(entity1);
            entityList.add(entity2);
            entityList.add(entity3);

            entityList.reorderEntity(3, 0);

            expect(entityList.buffer[0]).toBe(entity3);
            expect(entityList.buffer[1]).toBe(entity1);
            expect(entityList.buffer[2]).toBe(entity2);
        });

        it('should clamp index to valid range', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.reorderEntity(1, 100);

            expect(entityList.buffer[1]).toBe(entity1);
        });

        it('should do nothing for non-existent entity', () => {
            const entity1 = createMockEntity(1, 'e1');
            entityList.add(entity1);

            entityList.reorderEntity(999, 0);

            expect(entityList.buffer[0]).toBe(entity1);
        });

        it('should do nothing if already at target position', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.reorderEntity(1, 0);

            expect(entityList.buffer[0]).toBe(entity1);
            expect(entityList.buffer[1]).toBe(entity2);
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2', 0, { enabled: false });
            const entity3 = createMockEntity(3, 'e3', 0, { isDestroyed: true });

            entityList.add(entity1);
            entityList.add(entity2);
            entityList.add(entity3);

            const stats = entityList.getStats();

            expect(stats.totalEntities).toBe(3);
            expect(stats.activeEntities).toBe(1);
            expect(stats.pendingAdd).toBe(0);
            expect(stats.pendingRemove).toBe(0);
            expect(stats.nameIndexSize).toBe(3);
        });
    });

    describe('forEach methods', () => {
        it('should iterate all entities with forEach', () => {
            const entity1 = createMockEntity(1, 'e1');
            const entity2 = createMockEntity(2, 'e2');
            entityList.add(entity1);
            entityList.add(entity2);

            const visited: number[] = [];
            entityList.forEach((entity) => {
                visited.push(entity.id);
            });

            expect(visited).toEqual([1, 2]);
        });

        it('should iterate filtered entities with forEachWhere', () => {
            const entity1 = createMockEntity(1, 'e1', 1);
            const entity2 = createMockEntity(2, 'e2', 2);
            const entity3 = createMockEntity(3, 'e3', 1);
            entityList.add(entity1);
            entityList.add(entity2);
            entityList.add(entity3);

            const visited: number[] = [];
            entityList.forEachWhere(
                (entity) => entity.tag === 1,
                (entity) => visited.push(entity.id)
            );

            expect(visited).toEqual([1, 3]);
        });
    });

    describe('name index management', () => {
        it('should update name index when entity is removed', () => {
            const entity1 = createMockEntity(1, 'shared');
            const entity2 = createMockEntity(2, 'shared');
            entityList.add(entity1);
            entityList.add(entity2);

            entityList.remove(entity1);

            const found = entityList.findEntitiesByName('shared');
            expect(found).toHaveLength(1);
            expect(found[0]).toBe(entity2);
        });

        it('should handle entities without names', () => {
            const entity = createMockEntity(1, '');
            entityList.add(entity);

            expect(entityList.count).toBe(1);
            expect(entityList.findEntity('')).toBeNull();
        });
    });

    describe('updateLists', () => {
        it('should process pending operations via update', () => {
            const entity = createMockEntity(1, 'test');
            entityList.add(entity);

            entityList.update();

            expect(entityList.count).toBe(1);
        });
    });
});
