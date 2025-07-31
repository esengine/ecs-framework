/**
 * 简化后的Matcher使用示例
 * 展示框架自动处理QuerySystem的优雅设计
 */

import { Scene } from '../src/ECS/Scene';
import { Component } from '../src/ECS/Component';
import { Matcher } from '../src/ECS/Utils/Matcher';

// 示例组件
class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class Velocity extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class Health extends Component {
    constructor(public hp: number = 100) {
        super();
    }
}

class Dead extends Component {}

function demonstrateSimplifiedMatcher() {
    console.log('=== 简化的Matcher API示例 ===\n');

    // 创建场景 - QuerySystem自动创建
    const scene = new Scene();
    scene.begin();

    // 创建测试实体
    const player = scene.createEntity('Player');
    player.addComponent(new Position(100, 200));
    player.addComponent(new Velocity(5, 0));
    player.addComponent(new Health(100));

    const enemy = scene.createEntity('Enemy');
    enemy.addComponent(new Position(300, 200));
    enemy.addComponent(new Health(50));

    const corpse = scene.createEntity('Corpse');
    corpse.addComponent(new Position(150, 150));
    corpse.addComponent(new Dead());

    // ===== 推荐的新API =====
    
    // 1. 直接使用scene.querySystem创建Matcher
    const movingEntities = Matcher.create(scene.querySystem)
        .all(Position, Velocity)
        .query();
    
    console.log('移动实体:', movingEntities.map(e => e.name));
    
    // 2. 复合查询 - 活着的实体
    const aliveEntities = Matcher.create(scene.querySystem)
        .all(Health)
        .none(Dead)
        .query();
    
    console.log('活着的实体:', aliveEntities.map(e => e.name));
    
    // 3. 实用方法
    const healthMatcher = Matcher.create(scene.querySystem).all(Health);
    console.log(`有血量的实体数量: ${healthMatcher.count()}`);
    console.log(`玩家是否有血量: ${healthMatcher.matches(player)}`);
    
    // 4. 系统中使用Matcher的典型模式
    class MovementSystem {
        private movementMatcher: Matcher;
        
        constructor(scene: Scene) {
            // 在系统初始化时创建Matcher
            this.movementMatcher = Matcher.create(scene.querySystem)
                .all(Position, Velocity);
        }
        
        update() {
            // 高效的批量查询
            const movableEntities = this.movementMatcher.query();
            
            for (const entity of movableEntities) {
                const pos = entity.getComponent(Position)!;
                const vel = entity.getComponent(Velocity)!;
                
                pos.x += vel.vx;
                pos.y += vel.vy;
            }
        }
    }
    
    // 5. 创建并使用系统
    const movementSystem = new MovementSystem(scene);
    movementSystem.update();
    
    console.log('玩家更新后位置:', player.getComponent(Position));
    
    scene.end();
}

// ===== 展示设计哲学 =====
function designPhilosophy() {
    console.log('\n=== 设计哲学 ===');
    console.log('✅ QuerySystem是框架核心，总是存在');
    console.log('✅ Matcher强制要求QuerySystem，避免回退复杂性');
    console.log('✅ 清晰的错误提示，引导正确使用');
    console.log('✅ 旧API保持兼容，但明确标记deprecated');
    console.log('✅ 新API简洁明了，符合现代设计原则');
}

// 运行示例
if (require.main === module) {
    demonstrateSimplifiedMatcher();
    designPhilosophy();
}