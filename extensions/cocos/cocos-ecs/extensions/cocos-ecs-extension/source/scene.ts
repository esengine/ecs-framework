import { join } from 'path';

// 添加编辑器内的模块搜索路径
module.paths.push(join(Editor.App.path, 'node_modules'));

export function load() {
    console.log('ECS Debug Scene Script loaded');
}

export function unload() {
    console.log('ECS Debug Scene Script unloaded');
}

export const methods = {
    /**
     * 获取预览状态
     * @returns {object} 预览状态信息
     */
    getPreviewState() {
        try {
            // 检查是否在游戏运行状态
            const { director } = require('cc');
            if (director && director.getScene && director.getScene()) {
                return {
                    isRunning: true,
                    engineLoaded: true
                };
            }
            return {
                isRunning: false,
                engineLoaded: false
            };
        } catch (error) {
            console.warn('Failed to get preview state:', error);
            return {
                isRunning: false,
                engineLoaded: false
            };
        }
    },

    /**
     * 检查ECS框架是否已加载
     * @returns {boolean} ECS框架加载状态
     */
    isECSFrameworkLoaded() {
        try {
            // 检查是否有ECS框架的全局对象
            return typeof window !== 'undefined' && !!(window as any).ECSFramework;
        } catch (error) {
            console.warn('Failed to check ECS framework status:', error);
            return false;
        }
    },

    /**
     * 获取场景基本信息
     * @returns {object} 场景信息
     */
    getSceneBasicInfo() {
        try {
            const { director } = require('cc');
            if (director && director.getScene) {
                const scene = director.getScene();
                return {
                    sceneName: scene ? (scene.name || '当前场景') : '未知场景',
                    nodeCount: scene ? this.countNodes(scene) : 0,
                    isValid: scene ? scene.isValid : false
                };
            }
            return {
                sceneName: '未知场景',
                nodeCount: 0,
                isValid: false
            };
        } catch (error) {
            console.warn('Failed to get scene basic info:', error);
            return {
                sceneName: '获取失败',
                nodeCount: 0,
                isValid: false
            };
        }
    },

    /**
     * 获取ECS框架的调试信息
     * @returns {object|null} ECS调试数据或null（如果框架未加载）
     */
    getECSDebugInfo() {
        try {
            // 检查是否有ECS框架的全局对象
            if (typeof window !== 'undefined' && (window as any).ECSFramework) {
                const ecs = (window as any).ECSFramework;
                
                // 获取当前场景和实体管理器
                if (ecs.Core && ecs.Core.getCurrentScene) {
                    const scene = ecs.Core.getCurrentScene();
                    if (scene && scene.entityManager) {
                        const entityManager = scene.entityManager;
                        const systemManager = scene.systemManager;
                        
                        // 收集调试信息
                        const debugInfo = {
                            timestamp: new Date().toISOString(),
                            frameworkLoaded: true,
                            currentScene: scene.name || '当前场景',
                            totalEntities: entityManager.entityCount || 0,
                            activeEntities: entityManager.activeEntityCount || 0,
                            pendingAdd: 0, // 需要具体API
                            pendingRemove: 0, // 需要具体API
                            totalSystems: systemManager ? systemManager.getSystemCount() : 0,
                            systemsInfo: [],
                            frameTime: 0, // 需要性能监控
                            memoryUsage: 0, // 需要内存监控
                            componentTypes: 0, // 需要组件统计
                            componentInstances: 0 // 需要组件实例统计
                        };
                        
                        // 获取系统信息
                        if (systemManager && systemManager.getSystems) {
                            const systems = systemManager.getSystems();
                            debugInfo.systemsInfo = systems.map((system: any, index: number) => ({
                                name: system.constructor.name || `System${index}`,
                                entityCount: system.entities ? system.entities.length : 0,
                                executionTime: system.lastExecutionTime || 0,
                                updateOrder: index + 1
                            }));
                        }
                        
                        return debugInfo;
                    }
                }
            }
            
            // 检查是否直接导入了ECS模块
            try {
                // 这里需要根据实际的ECS框架导入方式调整
                const { Core } = require('ecs-framework');
                if (Core) {
                    const scene = Core.getCurrentScene();
                    if (scene) {
                        return {
                            timestamp: new Date().toISOString(),
                            frameworkLoaded: true,
                            currentScene: scene.name || '当前场景',
                            totalEntities: scene.entityManager?.entityCount || 0,
                            activeEntities: scene.entityManager?.activeEntityCount || 0,
                            pendingAdd: 0,
                            pendingRemove: 0,
                            totalSystems: scene.systemManager?.getSystemCount() || 0,
                            systemsInfo: [],
                            frameTime: 0,
                            memoryUsage: 0,
                            componentTypes: 0,
                            componentInstances: 0
                        };
                    }
                }
            } catch (error) {
                // ECS框架未导入或未初始化
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to get ECS debug info:', error);
            return null;
        }
    },
    
    /**
     * 递归计算节点数量
     * @param {any} node 
     * @returns {number}
     */
    countNodes(node: any): number {
        if (!node) return 0;
        
        let count = 1; // 当前节点
        if (node.children) {
            for (const child of node.children) {
                count += this.countNodes(child);
            }
        }
        return count;
    }
}; 