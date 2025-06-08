const { Scene } = require('./bin/ECS/Scene.js');

const { Component } = require('./bin/ECS/Component.js');

// 简单的组件类
class TestComponent extends Component {
    constructor(value) {
        super();
        this.value = value;
    }
}

console.log('🔬 组件添加性能分析');

// 创建场景和实体
const scene = new Scene();
console.log('✅ 创建场景完成');

const startCreate = performance.now();
const entities = scene.createEntities(5000, 'TestEntity');
const endCreate = performance.now();

console.log(`✅ 创建了 ${entities.length} 个实体，耗时: ${(endCreate - startCreate).toFixed(2)}ms`);

// 测试单个组件添加性能
console.log('\n📊 测试组件添加性能:');

const startAdd = performance.now();
for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    entity.addComponent(new TestComponent(i));
}
const endAdd = performance.now();

const addTime = endAdd - startAdd;
console.log(`添加 ${entities.length} 个组件耗时: ${addTime.toFixed(2)}ms`);
console.log(`平均每个组件: ${(addTime / entities.length).toFixed(4)}ms`);
console.log(`添加速度: ${(entities.length / (addTime / 1000)).toFixed(0)} 组件/秒`);

// 测试组件获取性能
console.log('\n📊 测试组件获取性能:');

const startGet = performance.now();
for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const component = entity.getComponent(TestComponent);
}
const endGet = performance.now();

const getTime = endGet - startGet;
console.log(`获取 ${entities.length} 个组件耗时: ${getTime.toFixed(2)}ms`);
console.log(`平均每个组件: ${(getTime / entities.length).toFixed(4)}ms`);
console.log(`获取速度: ${(entities.length / (getTime / 1000)).toFixed(0)} 组件/秒`); 