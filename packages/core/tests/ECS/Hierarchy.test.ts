import { Scene, Entity, HierarchyComponent, HierarchySystem } from '../../src';

describe('HierarchySystem', () => {
    let scene: Scene;
    let hierarchySystem: HierarchySystem;

    beforeEach(() => {
        scene = new Scene();
        scene.initialize();
        hierarchySystem = new HierarchySystem();
        scene.addSystem(hierarchySystem);
    });

    afterEach(() => {
        scene.end();
    });

    describe('setParent', () => {
        it('should set parent-child relationship', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);

            expect(hierarchySystem.getParent(child)).toBe(parent);
            expect(hierarchySystem.getChildren(parent)).toContain(child);
            expect(hierarchySystem.getChildCount(parent)).toBe(1);
        });

        it('should auto-add HierarchyComponent if not present', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            expect(parent.getComponent(HierarchyComponent)).toBeNull();
            expect(child.getComponent(HierarchyComponent)).toBeNull();

            hierarchySystem.setParent(child, parent);

            expect(parent.getComponent(HierarchyComponent)).not.toBeNull();
            expect(child.getComponent(HierarchyComponent)).not.toBeNull();
        });

        it('should move child to root when parent is null', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);
            expect(hierarchySystem.getParent(child)).toBe(parent);

            hierarchySystem.setParent(child, null);
            expect(hierarchySystem.getParent(child)).toBeNull();
            expect(hierarchySystem.getChildren(parent)).not.toContain(child);
        });

        it('should transfer child to new parent', () => {
            const parent1 = scene.createEntity('Parent1');
            const parent2 = scene.createEntity('Parent2');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent1);
            expect(hierarchySystem.getParent(child)).toBe(parent1);
            expect(hierarchySystem.getChildCount(parent1)).toBe(1);

            hierarchySystem.setParent(child, parent2);
            expect(hierarchySystem.getParent(child)).toBe(parent2);
            expect(hierarchySystem.getChildCount(parent1)).toBe(0);
            expect(hierarchySystem.getChildCount(parent2)).toBe(1);
        });

        it('should throw error on circular reference', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Grandchild');

            hierarchySystem.setParent(child, parent);
            hierarchySystem.setParent(grandchild, child);

            expect(() => {
                hierarchySystem.setParent(parent, grandchild);
            }).toThrow('Cannot set parent: would create circular reference');
        });

        it('should not change if setting same parent', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);
            const hierarchy = child.getComponent(HierarchyComponent)!;
            hierarchy.bCacheDirty = false;

            hierarchySystem.setParent(child, parent);
            // Should not mark dirty since parent didn't change
            expect(hierarchy.bCacheDirty).toBe(false);
        });
    });

    describe('insertChildAt', () => {
        it('should insert child at specific position', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');
            const child3 = scene.createEntity('Child3');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.setParent(child3, parent);
            hierarchySystem.insertChildAt(parent, child2, 1);

            const children = hierarchySystem.getChildren(parent);
            expect(children[0]).toBe(child1);
            expect(children[1]).toBe(child2);
            expect(children[2]).toBe(child3);
        });

        it('should append child when index is -1', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.insertChildAt(parent, child2, -1);

            const children = hierarchySystem.getChildren(parent);
            expect(children[children.length - 1]).toBe(child2);
        });
    });

    describe('removeChild', () => {
        it('should remove child from parent', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);
            expect(hierarchySystem.getChildCount(parent)).toBe(1);

            const result = hierarchySystem.removeChild(parent, child);
            expect(result).toBe(true);
            expect(hierarchySystem.getChildCount(parent)).toBe(0);
            expect(hierarchySystem.getParent(child)).toBeNull();
        });

        it('should return false if child is not a child of parent', () => {
            const parent1 = scene.createEntity('Parent1');
            const parent2 = scene.createEntity('Parent2');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent1);

            const result = hierarchySystem.removeChild(parent2, child);
            expect(result).toBe(false);
        });
    });

    describe('removeAllChildren', () => {
        it('should remove all children from parent', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');
            const child3 = scene.createEntity('Child3');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.setParent(child2, parent);
            hierarchySystem.setParent(child3, parent);
            expect(hierarchySystem.getChildCount(parent)).toBe(3);

            hierarchySystem.removeAllChildren(parent);
            expect(hierarchySystem.getChildCount(parent)).toBe(0);
            expect(hierarchySystem.getParent(child1)).toBeNull();
            expect(hierarchySystem.getParent(child2)).toBeNull();
            expect(hierarchySystem.getParent(child3)).toBeNull();
        });
    });

    describe('hierarchy queries', () => {
        it('should check if entity has children', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            expect(hierarchySystem.hasChildren(parent)).toBe(false);

            hierarchySystem.setParent(child, parent);
            expect(hierarchySystem.hasChildren(parent)).toBe(true);
        });

        it('should check isAncestorOf', () => {
            const grandparent = scene.createEntity('Grandparent');
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(parent, grandparent);
            hierarchySystem.setParent(child, parent);

            expect(hierarchySystem.isAncestorOf(grandparent, child)).toBe(true);
            expect(hierarchySystem.isAncestorOf(parent, child)).toBe(true);
            expect(hierarchySystem.isAncestorOf(child, grandparent)).toBe(false);
        });

        it('should check isDescendantOf', () => {
            const grandparent = scene.createEntity('Grandparent');
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(parent, grandparent);
            hierarchySystem.setParent(child, parent);

            expect(hierarchySystem.isDescendantOf(child, grandparent)).toBe(true);
            expect(hierarchySystem.isDescendantOf(child, parent)).toBe(true);
            expect(hierarchySystem.isDescendantOf(grandparent, child)).toBe(false);
        });

        it('should get root entity', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Grandchild');

            hierarchySystem.setParent(child, root);
            hierarchySystem.setParent(grandchild, child);

            expect(hierarchySystem.getRoot(grandchild)).toBe(root);
            expect(hierarchySystem.getRoot(child)).toBe(root);
            expect(hierarchySystem.getRoot(root)).toBe(root);
        });

        it('should get depth correctly', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Grandchild');

            root.addComponent(new HierarchyComponent());
            hierarchySystem.setParent(child, root);
            hierarchySystem.setParent(grandchild, child);

            expect(hierarchySystem.getDepth(root)).toBe(0);
            expect(hierarchySystem.getDepth(child)).toBe(1);
            expect(hierarchySystem.getDepth(grandchild)).toBe(2);
        });
    });

    describe('findChild', () => {
        it('should find child by name', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Target');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.setParent(child2, parent);

            const found = hierarchySystem.findChild(parent, 'Target');
            expect(found).toBe(child2);
        });

        it('should find child recursively', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Target');

            hierarchySystem.setParent(child, root);
            hierarchySystem.setParent(grandchild, child);

            const found = hierarchySystem.findChild(root, 'Target', true);
            expect(found).toBe(grandchild);

            const notFound = hierarchySystem.findChild(root, 'Target', false);
            expect(notFound).toBeNull();
        });
    });

    describe('forEachChild', () => {
        it('should iterate over children', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.setParent(child2, parent);

            const visited: Entity[] = [];
            hierarchySystem.forEachChild(parent, (child) => {
                visited.push(child);
            });

            expect(visited).toContain(child1);
            expect(visited).toContain(child2);
            expect(visited.length).toBe(2);
        });

        it('should iterate recursively', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Grandchild');

            hierarchySystem.setParent(child, root);
            hierarchySystem.setParent(grandchild, child);

            const visited: Entity[] = [];
            hierarchySystem.forEachChild(root, (entity) => {
                visited.push(entity);
            }, true);

            expect(visited).toContain(child);
            expect(visited).toContain(grandchild);
            expect(visited.length).toBe(2);
        });
    });

    describe('getRootEntities', () => {
        it('should return all root entities', () => {
            const root1 = scene.createEntity('Root1');
            const root2 = scene.createEntity('Root2');
            const child = scene.createEntity('Child');

            root1.addComponent(new HierarchyComponent());
            root2.addComponent(new HierarchyComponent());
            hierarchySystem.setParent(child, root1);

            const roots = hierarchySystem.getRootEntities();
            expect(roots).toContain(root1);
            expect(roots).toContain(root2);
            expect(roots).not.toContain(child);
        });
    });

    describe('activeInHierarchy', () => {
        it('should be inactive if parent is inactive', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);

            expect(hierarchySystem.isActiveInHierarchy(child)).toBe(true);

            parent.active = false;
            // Mark cache dirty to recalculate
            const childHierarchy = child.getComponent(HierarchyComponent)!;
            childHierarchy.bCacheDirty = true;

            expect(hierarchySystem.isActiveInHierarchy(child)).toBe(false);
        });

        it('should be inactive if self is inactive', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);
            child.active = false;

            expect(hierarchySystem.isActiveInHierarchy(child)).toBe(false);
        });
    });
});

describe('HierarchyComponent', () => {
    it('should have correct default values', () => {
        const component = new HierarchyComponent();

        expect(component.parentId).toBeNull();
        expect(component.childIds).toEqual([]);
        expect(component.depth).toBe(0);
        expect(component.bActiveInHierarchy).toBe(true);
        expect(component.bCacheDirty).toBe(true);
    });
});
