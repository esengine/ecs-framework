/**
 * 父子实体序列化和反序列化测试
 *
 * 测试场景序列化和反序列化时父子实体关系的正确性
 */

import { Scene } from '../../../src';

describe('父子实体序列化测试', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene({ name: 'TestScene' });
  });

  afterEach(() => {
    scene.end();
  });

  test('应该正确反序列化父子实体层次结构', () => {
    // 创建父实体
    const parent = scene.createEntity('parent');
    parent.tag = 100;

    // 创建2个子实体
    const child1 = scene.createEntity('child1');
    child1.tag = 200;
    parent.addChild(child1);

    const child2 = scene.createEntity('child2');
    child2.tag = 200;
    parent.addChild(child2);

    // 创建1个顶层实体（对照组）
    const topLevel = scene.createEntity('topLevel');
    topLevel.tag = 200;

    // 验证序列化前的状态
    expect(scene.querySystem.queryAll().entities.length).toBe(4);
    expect(scene.findEntitiesByTag(100).length).toBe(1);
    expect(scene.findEntitiesByTag(200).length).toBe(3);

    // 序列化
    const serialized = scene.serialize({ format: 'json' });

    // 创建新场景并反序列化
    const scene2 = new Scene({ name: 'LoadTestScene' });
    scene2.deserialize(serialized as string, {
      strategy: 'replace',
      preserveIds: true,
    });

    // 验证所有实体都被正确恢复
    const allEntities = scene2.querySystem.queryAll().entities;
    expect(allEntities.length).toBe(4);
    expect(scene2.findEntitiesByTag(100).length).toBe(1);
    expect(scene2.findEntitiesByTag(200).length).toBe(3);

    // 验证父子关系正确恢复
    const restoredParent = scene2.findEntity('parent');
    expect(restoredParent).not.toBeNull();
    expect(restoredParent!.children.length).toBe(2);

    const restoredChild1 = scene2.findEntity('child1');
    const restoredChild2 = scene2.findEntity('child2');
    expect(restoredChild1).not.toBeNull();
    expect(restoredChild2).not.toBeNull();
    expect(restoredChild1!.parent).toBe(restoredParent);
    expect(restoredChild2!.parent).toBe(restoredParent);

    scene2.end();
  });

  test('应该正确反序列化多层级实体层次结构', () => {
    // 创建多层级实体结构：grandparent -> parent -> child
    const grandparent = scene.createEntity('grandparent');
    grandparent.tag = 1;

    const parent = scene.createEntity('parent');
    parent.tag = 2;
    grandparent.addChild(parent);

    const child = scene.createEntity('child');
    child.tag = 3;
    parent.addChild(child);

    expect(scene.querySystem.queryAll().entities.length).toBe(3);

    // 序列化
    const serialized = scene.serialize({ format: 'json' });

    // 创建新场景并反序列化
    const scene2 = new Scene({ name: 'LoadTestScene' });
    scene2.deserialize(serialized as string, {
      strategy: 'replace',
      preserveIds: true,
    });

    // 验证多层级结构正确恢复
    expect(scene2.querySystem.queryAll().entities.length).toBe(3);

    const restoredGrandparent = scene2.findEntity('grandparent');
    const restoredParent = scene2.findEntity('parent');
    const restoredChild = scene2.findEntity('child');

    expect(restoredGrandparent).not.toBeNull();
    expect(restoredParent).not.toBeNull();
    expect(restoredChild).not.toBeNull();

    expect(restoredParent!.parent).toBe(restoredGrandparent);
    expect(restoredChild!.parent).toBe(restoredParent);
    expect(restoredGrandparent!.children.length).toBe(1);
    expect(restoredParent!.children.length).toBe(1);

    scene2.end();
  });
});
