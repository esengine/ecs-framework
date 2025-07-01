import { Scene } from '@esengine/ecs-framework';
import { Color, Node } from 'cc';
import { MovementSystem, HealthSystem, RandomMovementSystem, AISystem, NetworkSystem, NodeRenderSystem } from '../systems';
import { Transform, Health, Velocity, Renderer, NodeComponent, AIComponent, NetworkComponent } from '../components';

/**
 * 游戏场景
 * 
 * 这是您的主游戏场景。在这里可以：
 * - 添加游戏系统
 * - 创建初始实体
 * - 设置场景参数
 */
export class GameScene extends Scene {
    
    /**
     * 场景初始化
     * 在场景创建时调用，用于设置基础配置
     */
    public initialize(): void {
        super.initialize();
        
        // 设置场景名称
        this.name = "MainGameScene";
        
        console.log('🎯 游戏场景已创建');
        
        // 添加游戏系统
        this.addEntityProcessor(new MovementSystem());
        this.addEntityProcessor(new HealthSystem());
        this.addEntityProcessor(new RandomMovementSystem());
        // this.addEntityProcessor(new AISystem());
        // this.addEntityProcessor(new NetworkSystem());
        // this.addEntityProcessor(new NodeRenderSystem());
        
        // 创建大量复杂的测试实体
        this.createComplexTestEntities();
    }
    
    /**
     * 创建复杂的测试实体（1000+个）
     */
    private createComplexTestEntities(): void {
        console.log('🚀 开始创建大量复杂测试实体...');
        
        // 存储创建的AI和网络组件用于建立循环引用
        const aiComponents: AIComponent[] = [];
        const networkComponents: NetworkComponent[] = [];
        const nodeComponents: NodeComponent[] = [];
        
        // 1. 创建玩家实体（具有所有组件类型）
        console.log('创建玩家实体...');
        const player = this.createComplexEntity("Player", "player", new Color(0, 255, 0, 255), 0, 0, true, true, true);
        if (player) {
            const playerAI = player.getComponent(AIComponent);
            const playerNetwork = player.getComponent(NetworkComponent);
            const playerNode = player.getComponent(NodeComponent);
            
            if (playerAI) aiComponents.push(playerAI);
            if (playerNetwork) networkComponents.push(playerNetwork);
            if (playerNode) nodeComponents.push(playerNode);
        }
        
        // 2. 创建AI智能体（500个）
        console.log('创建AI智能体...');
        for (let i = 0; i < 500; i++) {
            const entityName = `AI_Agent_${i}`;
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const color = new Color(
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255),
                255
            );
            
            const entity = this.createComplexEntity(entityName, "ai_agent", color, x, y, true, true, Math.random() > 0.5);
            
            if (entity) {
                const ai = entity.getComponent(AIComponent);
                const network = entity.getComponent(NetworkComponent);
                const node = entity.getComponent(NodeComponent);
                
                if (ai) {
                    aiComponents.push(ai);
                    // 设置随机AI个性
                    ai.config.personality.aggression = Math.random();
                    ai.config.personality.curiosity = Math.random();
                    ai.config.personality.loyalty = Math.random();
                    ai.config.personality.intelligence = Math.random();
                }
                
                if (network) {
                    networkComponents.push(network);
                    // 随机设置网络状态
                    if (Math.random() > 0.2) {
                        network.connectionState = 'connected';
                    }
                }
                
                if (node) {
                    nodeComponents.push(node);
                    // 设置随机节点属性
                    node.nodeConfig.layer = Math.floor(Math.random() * 10);
                    node.nodeConfig.tag = `layer_${node.nodeConfig.layer}`;
                }
            }
        }
        
        // 3. 创建网络节点（300个）
        console.log('创建网络节点...');
        for (let i = 0; i < 300; i++) {
            const entityName = `Network_Node_${i}`;
            const x = (Math.random() - 0.5) * 1500;
            const y = (Math.random() - 0.5) * 1500;
            const color = new Color(0, 150, 255, 200);
            
            const entity = this.createComplexEntity(entityName, "network_node", color, x, y, false, true, true);
            
            if (entity) {
                const network = entity.getComponent(NetworkComponent);
                const node = entity.getComponent(NodeComponent);
                
                if (network) {
                    networkComponents.push(network);
                    network.connectionState = 'connected';
                    network.config.syncFrequency = 30 + Math.random() * 30; // 30-60Hz
                }
                
                if (node) {
                    nodeComponents.push(node);
                    // 创建复杂的层次结构
                    node.nodeConfig.layer = Math.floor(i / 10); // 每10个一层
                }
            }
        }
        
        // 4. 创建简单移动实体（200个）
        console.log('创建简单移动实体...');
        for (let i = 0; i < 200; i++) {
            const entityName = `Simple_Mover_${i}`;
            const x = (Math.random() - 0.5) * 1000;
            const y = (Math.random() - 0.5) * 1000;
            const color = new Color(255, 255, 255, 150);
            
            this.createComplexEntity(entityName, "simple_mover", color, x, y, false, false, false);
        }
        
        // 5. 建立循环引用和复杂关系
        console.log('建立实体间的复杂关系...');
        this.establishComplexRelationships(aiComponents, networkComponents, nodeComponents);
        
        const totalEntities = this.entities.count;
        console.log(`✅ 创建完成！总共创建了 ${totalEntities} 个实体`);
        console.log(`   - AI组件: ${aiComponents.length} 个`);
        console.log(`   - 网络组件: ${networkComponents.length} 个`);
        console.log(`   - 节点组件: ${nodeComponents.length} 个`);
    }
    
    /**
     * 创建复杂实体的辅助方法
     */
    private createComplexEntity(
        name: string,
        type: string,
        color: Color,
        x: number,
        y: number,
        hasAI: boolean,
        hasNetwork: boolean,
        hasNode: boolean
    ): any {
        const entity = this.createEntity(name);
        
        // 基础组件
        const transform = new Transform();
        transform.setPosition(x, y);
        transform.speed = 50 + Math.random() * 100;
        entity.addComponent(transform);
        
        const health = new Health(50 + Math.random() * 100);
        health.regenRate = Math.random() * 10;
        entity.addComponent(health);
        
        const velocity = new Velocity();
        velocity.maxSpeed = 80 + Math.random() * 120;
        velocity.friction = 0.95 + Math.random() * 0.04;
        entity.addComponent(velocity);
        
        const renderer = new Renderer(type, color.clone());
        renderer.alpha = 0.5 + Math.random() * 0.5;
        renderer.layer = Math.floor(Math.random() * 5);
        entity.addComponent(renderer);
        
        // 复杂组件
        if (hasAI) {
            const ai = new AIComponent();
            entity.addComponent(ai);
        }
        
        if (hasNetwork) {
            const network = new NetworkComponent(`${type}_${name}`);
            entity.addComponent(network);
        }
        
        if (hasNode) {
            const node = new NodeComponent(name);
            entity.addComponent(node);
        }
        
        return entity;
    }
    
    /**
     * 建立实体间的复杂关系
     */
    private establishComplexRelationships(
        aiComponents: AIComponent[],
        networkComponents: NetworkComponent[],
        nodeComponents: NodeComponent[]
    ): void {
        // 建立AI之间的盟友/敌人关系（避免循环引用）
        for (let i = 0; i < Math.min(aiComponents.length, 100); i++) {
            const ai = aiComponents[i];
            
            // 随机添加盟友（使用实体ID）
            const allyCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < allyCount; j++) {
                const randomIndex = Math.floor(Math.random() * aiComponents.length);
                const ally = aiComponents[randomIndex];
                if (ally !== ai && !ai.allyIds.includes(ally.entity.id)) {
                    ai.addAlly(ally.entity.id);
                }
            }
            
            // 随机设置目标（使用实体ID）
            if (Math.random() > 0.7) {
                const randomIndex = Math.floor(Math.random() * aiComponents.length);
                const target = aiComponents[randomIndex];
                if (target !== ai) {
                    ai.setTarget(target.entity.id);
                }
            }
        }
        
        // 建立网络连接（避免循环引用）
        for (let i = 0; i < Math.min(networkComponents.length, 50); i++) {
            const network = networkComponents[i];
            
            // 连接到其他网络组件（使用网络ID）
            const connectionCount = Math.floor(Math.random() * 8);
            for (let j = 0; j < connectionCount; j++) {
                const randomIndex = Math.floor(Math.random() * networkComponents.length);
                const other = networkComponents[randomIndex];
                if (other !== network) {
                    network.connectToPlayer(other.networkId);
                }
            }
            
            // 创建群组（使用网络ID）
            if (Math.random() > 0.8) {
                const groupSize = Math.floor(Math.random() * 10) + 2;
                const groupMemberIds: string[] = [network.networkId];
                
                for (let k = 0; k < groupSize - 1; k++) {
                    const randomIndex = Math.floor(Math.random() * networkComponents.length);
                    const member = networkComponents[randomIndex];
                    if (!groupMemberIds.includes(member.networkId)) {
                        groupMemberIds.push(member.networkId);
                    }
                }
                
                network.joinGroup(groupMemberIds, network.networkId);
            }
        }
        
        // 建立节点层次结构（避免循环引用）
        for (let i = 0; i < Math.min(nodeComponents.length, 30); i++) {
            const parent = nodeComponents[i];
            
            // 添加一些子节点（使用实体ID）
            const childCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < childCount; j++) {
                const childIndex = Math.floor(Math.random() * nodeComponents.length);
                const child = nodeComponents[childIndex];
                
                if (child !== parent && !parent.nodeConfig.childIds.includes(child.entity.id)) {
                    parent.addChild(child.entity.id);
                }
            }
        }
        
        console.log('🔗 复杂关系建立完成！');
    }
    
    /**
     * 场景开始运行
     * 在场景开始时调用，用于执行启动逻辑
     */
    public onStart(): void {
        super.onStart();
        
        console.log('🚀 游戏场景已启动');
        
        // TODO: 在这里添加场景启动逻辑
        // 例如：创建UI、播放音乐、初始化游戏状态等
    }
    
    /**
     * 场景卸载
     * 在场景结束时调用，用于清理资源
     */
    public unload(): void {
        console.log('🛑 游戏场景已结束');
        
        // TODO: 在这里添加清理逻辑
        // 例如：清理缓存、释放资源等
        
        super.unload();
    }
}
