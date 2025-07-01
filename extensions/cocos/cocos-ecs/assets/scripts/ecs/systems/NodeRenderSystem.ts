import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { NodeComponent, Transform, Renderer } from '../components';
import { Node, Vec3, Color } from 'cc';

/**
 * 节点渲染系统 - 处理NodeComponent和Cocos Creator节点的同步
 */
export class NodeRenderSystem extends EntitySystem {
    
    /** 渲染统计 */
    private renderStats = {
        totalNodes: 0,
        visibleNodes: 0,
        renderCalls: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
        frameCount: 0
    };
    
    /** 节点池 */
    private nodePool: Node[] = [];
    
    /** 性能监控 */
    private performanceMonitor = {
        frameStartTime: 0,
        renderTimeHistory: [] as number[],
        cullCount: 0,
        frustumCullCount: 0
    };
    
    constructor() {
        // 处理具有NodeComponent的实体
        super(Matcher.empty().all(NodeComponent));
    }
    
    /**
     * 处理所有实体
     */
    protected process(entities: Entity[]): void {
        this.performanceMonitor.frameStartTime = performance.now();
        
        this.renderStats.totalNodes = entities.length;
        this.renderStats.visibleNodes = 0;
        this.renderStats.renderCalls = 0;
        
        for (const entity of entities) {
            this.processEntity(entity);
        }
        
        // 处理节点层次结构
        this.updateNodeHierarchy(entities);
        
        // 更新性能统计
        this.updatePerformanceStats();
        
        // 清理过期的性能缓存
        this.cleanupPerformanceCache(entities);
    }
    
    /**
     * 处理单个实体
     */
    private processEntity(entity: Entity): void {
        const nodeComponent = entity.getComponent(NodeComponent);
        const transform = entity.getComponent(Transform);
        const renderer = entity.getComponent(Renderer);
        
        if (!nodeComponent) return;
        
        const renderStartTime = performance.now();
        
        // 确保有对应的Cocos Creator节点
        this.ensureNode(nodeComponent, entity);
        
        // 同步Transform数据
        if (transform && nodeComponent.node) {
            this.syncTransform(nodeComponent, transform);
        }
        
        // 同步渲染数据
        if (renderer && nodeComponent.node) {
            this.syncRenderer(nodeComponent, renderer);
        }
        
        // 更新节点配置
        this.updateNodeConfig(nodeComponent);
        
        // 执行视锥体剔除
        const isVisible = this.performCulling(nodeComponent);
        if (isVisible) {
            this.renderStats.visibleNodes++;
            this.performRender(nodeComponent);
        }
        
        // 更新性能统计
        const renderTime = performance.now() - renderStartTime;
        nodeComponent.updatePerformance(renderTime);
        
        this.renderStats.renderCalls++;
        this.renderStats.totalRenderTime += renderTime;
    }
    
    /**
     * 确保节点存在
     */
    private ensureNode(nodeComponent: NodeComponent, entity: Entity): void {
        if (!nodeComponent.node) {
            // 从对象池中获取节点或创建新节点
            nodeComponent.node = this.getNodeFromPool() || new Node(nodeComponent.nodeConfig.name);
            
            // 初始化节点
            this.initializeNode(nodeComponent.node, nodeComponent, entity);
        }
    }
    
    /**
     * 从对象池获取节点
     */
    private getNodeFromPool(): Node | null {
        return this.nodePool.pop() || null;
    }
    
    /**
     * 初始化节点
     */
    private initializeNode(node: Node, nodeComponent: NodeComponent, entity: Entity): void {
        const config = nodeComponent.nodeConfig;
        
        // 设置基本属性
        node.name = config.name;
        node.layer = config.layer;
        node.active = config.renderData.visible;
        
        // 设置变换
        node.setPosition(config.transformData.position);
        node.setRotationFromEuler(config.transformData.rotation);
        node.setScale(config.transformData.scale);
        
        // 设置渲染属性
        const opacity = Math.floor(config.renderData.opacity * 255);
        // 这里可以设置更多Cocos Creator特定的属性
        
        // 添加用户数据
        config.userData.entityId = entity.id;
        config.userData.componentId = nodeComponent.id;
    }
    
    /**
     * 同步Transform数据
     */
    private syncTransform(nodeComponent: NodeComponent, transform: Transform): void {
        const node = nodeComponent.node!;
        const config = nodeComponent.nodeConfig;
        
        // 更新配置中的变换数据
        config.transformData.position.set(transform.position);
        config.transformData.rotation.set(transform.rotation);
        config.transformData.scale.set(transform.scale);
        
        // 同步到Cocos Creator节点
        node.setPosition(transform.position);
        node.setRotationFromEuler(transform.rotation);
        node.setScale(transform.scale);
        
        // 更新缓存数据
        nodeComponent.complexData.cache.textureCache.set('lastPosition', transform.position.clone());
    }
    
    /**
     * 同步渲染数据
     */
    private syncRenderer(nodeComponent: NodeComponent, renderer: Renderer): void {
        const node = nodeComponent.node!;
        const config = nodeComponent.nodeConfig;
        
        // 更新配置中的渲染数据
        config.renderData.color.set(renderer.color);
        config.renderData.opacity = renderer.alpha;
        config.renderData.visible = renderer.visible && renderer.alpha > 0;
        
        // 同步到Cocos Creator节点
        node.active = config.renderData.visible;
        
        // 更新材质缓存
        nodeComponent.complexData.cache.materialCache.set('currentColor', renderer.color.clone());
        nodeComponent.complexData.cache.materialCache.set('alpha', renderer.alpha);
    }
    
    /**
     * 更新节点配置
     */
    private updateNodeConfig(nodeComponent: NodeComponent): void {
        const config = nodeComponent.nodeConfig;
        const currentTime = Date.now();
        
        // 更新统计信息
        nodeComponent.complexData.statistics.frameCount++;
        nodeComponent.complexData.statistics.lastUpdateTime = currentTime;
        
        // 更新用户数据
        config.userData.lastFrameUpdate = currentTime;
        config.userData.frameCount = nodeComponent.complexData.statistics.frameCount;
        
        // 动态调整配置
        if (Math.random() < 0.01) { // 1% 概率调整
            config.renderData.opacity *= (0.95 + Math.random() * 0.1); // 轻微透明度变化
            config.renderData.opacity = Math.max(0.1, Math.min(1.0, config.renderData.opacity));
        }
    }
    
    /**
     * 执行视锥体剔除
     */
    private performCulling(nodeComponent: NodeComponent): boolean {
        if (!nodeComponent.node) {
            return false;
        }
        
        const config = nodeComponent.nodeConfig;
        
        // 简单的可见性检查
        if (!config.renderData.visible || config.renderData.opacity <= 0) {
            this.performanceMonitor.cullCount++;
            return false;
        }
        
        // 距离剔除
        const position = config.transformData.position;
        const distance = position.length();
        if (distance > 1000) { // 超过1000单位距离的对象被剔除
            this.performanceMonitor.frustumCullCount++;
            return false;
        }
        
        // 层级剔除
        if (config.layer < 0) {
            this.performanceMonitor.cullCount++;
            return false;
        }
        
        return true;
    }
    
    /**
     * 执行渲染
     */
    private performRender(nodeComponent: NodeComponent): void {
        if (!nodeComponent.node) return;
        
        const renderStartTime = performance.now();
        
        // 模拟复杂的渲染过程
        this.simulateRenderingWork(nodeComponent);
        
        // 更新子节点
        this.updateChildNodes(nodeComponent);
        
        // 更新着色器缓存
        this.updateShaderCache(nodeComponent);
        
        const renderTime = performance.now() - renderStartTime;
        
        // 更新性能统计
        const perf = nodeComponent.complexData.statistics.performance;
        perf.renderHistory.push(renderTime);
        
        if (perf.renderHistory.length > 100) {
            perf.renderHistory.shift();
        }
        
        perf.avgRenderTime = perf.renderHistory.reduce((a, b) => a + b, 0) / perf.renderHistory.length;
        perf.maxRenderTime = Math.max(perf.maxRenderTime, renderTime);
    }
    
    /**
     * 模拟渲染工作
     */
    private simulateRenderingWork(nodeComponent: NodeComponent): void {
        const complexity = nodeComponent.complexData.cache.materialCache.size + 
                          nodeComponent.complexData.cache.textureCache.size;
        
        // 模拟基于复杂度的计算工作
        let iterations = Math.min(complexity * 10, 1000);
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sin(i * 0.001) * Math.cos(i * 0.002);
        }
        
        // 存储计算结果到缓存
        nodeComponent.complexData.cache.shaderCache.set('computeResult', result);
    }
    
    /**
     * 更新子节点
     */
    private updateChildNodes(nodeComponent: NodeComponent): void {
        if (nodeComponent.children.length === 0) return;
        
        const parentNode = nodeComponent.node!;
        
        // 同步子节点
        for (let i = 0; i < nodeComponent.children.length; i++) {
            const childNode = nodeComponent.children[i];
            if (childNode && childNode.parent !== parentNode) {
                parentNode.addChild(childNode);
            }
        }
        
        // 更新层次结构数据
        nodeComponent.complexData.hierarchy.siblingIndex = parentNode.getSiblingIndex();
        
        // 更新子组件的层次深度（需要通过实体管理器查找）
        // 这里省略了复杂的查找逻辑，避免循环引用
        if (nodeComponent.nodeConfig.childIds.length > 0) {
            // 实际项目中应该通过实体管理器查找子实体并更新深度
            // 为了示例简化，我们只更新自己的深度
            nodeComponent.complexData.hierarchy.depth = Math.max(0, nodeComponent.complexData.hierarchy.depth);
        }
    }
    
    /**
     * 更新着色器缓存
     */
    private updateShaderCache(nodeComponent: NodeComponent): void {
        const shaderCache = nodeComponent.complexData.cache.shaderCache;
        
        // 模拟着色器参数更新
        const currentTime = Date.now();
        shaderCache.set('time', currentTime);
        shaderCache.set('frameCount', nodeComponent.complexData.statistics.frameCount);
        
        // 清理过期的着色器缓存
        if (shaderCache.size > 50) {
            const keys = Array.from(shaderCache.keys());
            const oldestKey = keys[0];
            shaderCache.delete(oldestKey);
        }
    }
    
    /**
     * 更新节点层次结构
     */
    private updateNodeHierarchy(entities: Entity[]): void {
        // 构建层次结构映射
        const nodeMap = new Map<number, NodeComponent>();
        
        entities.forEach(entity => {
            const nodeComponent = entity.getComponent(NodeComponent);
            if (nodeComponent) {
                nodeMap.set(entity.id, nodeComponent);
            }
        });
        
        // 更新层次关系（使用ID避免循环引用）
        nodeMap.forEach((nodeComponent, entityId) => {
            // 更新根节点ID
            if (!nodeComponent.complexData.hierarchy.parentId) {
                nodeComponent.complexData.hierarchy.rootId = entityId;
            } else {
                // 查找根节点ID（简化版本，避免深度遍历）
                let currentParentId = nodeComponent.complexData.hierarchy.parentId;
                let depth = 0;
                
                // 限制深度以避免无限循环
                while (currentParentId && depth < 10) {
                    const parentNode = nodeMap.get(currentParentId);
                    if (parentNode && parentNode.complexData.hierarchy.parentId) {
                        currentParentId = parentNode.complexData.hierarchy.parentId;
                        depth++;
                    } else {
                        break;
                    }
                }
                
                nodeComponent.complexData.hierarchy.rootId = currentParentId || entityId;
            }
        });
    }
    
    /**
     * 更新性能统计
     */
    private updatePerformanceStats(): void {
        const frameTime = performance.now() - this.performanceMonitor.frameStartTime;
        
        this.performanceMonitor.renderTimeHistory.push(frameTime);
        if (this.performanceMonitor.renderTimeHistory.length > 60) {
            this.performanceMonitor.renderTimeHistory.shift();
        }
        
        this.renderStats.frameCount++;
        if (this.renderStats.renderCalls > 0) {
            this.renderStats.averageRenderTime = this.renderStats.totalRenderTime / this.renderStats.renderCalls;
        }
    }
    
    /**
     * 清理性能缓存
     */
    private cleanupPerformanceCache(entities: Entity[]): void {
        entities.forEach(entity => {
            const nodeComponent = entity.getComponent(NodeComponent);
            if (nodeComponent) {
                const caches = nodeComponent.complexData.cache;
                
                // 清理纹理缓存
                if (caches.textureCache.size > 100) {
                    const keys = Array.from(caches.textureCache.keys());
                    const toDelete = keys.slice(0, 20); // 删除最旧的20个
                    toDelete.forEach(key => caches.textureCache.delete(key));
                }
                
                // 清理材质缓存
                if (caches.materialCache.size > 50) {
                    const keys = Array.from(caches.materialCache.keys());
                    const toDelete = keys.slice(0, 10); // 删除最旧的10个
                    toDelete.forEach(key => caches.materialCache.delete(key));
                }
            }
        });
    }
    
    /**
     * 回收节点到对象池
     */
    public recycleNode(node: Node): void {
        if (this.nodePool.length < 100) { // 限制对象池大小
            node.removeFromParent();
            node.destroyAllChildren();
            this.nodePool.push(node);
        } else {
            node.destroy();
        }
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('🎨 节点渲染系统已启动');
        
        // 预热对象池
        for (let i = 0; i < 10; i++) {
            this.nodePool.push(new Node(`PooledNode_${i}`));
        }
    }
    
    /**
     * 当实体被移除时
     */
    protected onRemoved(entity: Entity): void {
        const nodeComponent = entity.getComponent(NodeComponent);
        if (nodeComponent && nodeComponent.node) {
            this.recycleNode(nodeComponent.node);
            nodeComponent.node = null;
        }
    }
    
    /**
     * 获取系统统计信息
     */
    public getSystemStats(): any {
        return {
            ...this.renderStats,
            cullCount: this.performanceMonitor.cullCount,
            frustumCullCount: this.performanceMonitor.frustumCullCount,
            nodePoolSize: this.nodePool.length,
            averageFrameTime: this.performanceMonitor.renderTimeHistory.length > 0 
                ? this.performanceMonitor.renderTimeHistory.reduce((a, b) => a + b, 0) / this.performanceMonitor.renderTimeHistory.length 
                : 0,
            systemName: 'NodeRenderSystem'
        };
    }
} 