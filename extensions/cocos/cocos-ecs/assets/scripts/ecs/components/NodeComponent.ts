import { Component } from '@esengine/ecs-framework';
import { Node, Vec3, Color, Sprite, Label } from 'cc';

/**
 * Node组件 - 包含Cocos Creator节点引用（已移除循环引用）
 */
export class NodeComponent extends Component {
    /** Cocos Creator节点引用 */
    public node: Node | null = null;
    
    /** 子节点列表 */
    public children: Node[] = [];
    
    /** 节点配置信息 */
    public nodeConfig: {
        name: string;
        layer: number;
        tag: string;
        userData: Record<string, any>;
        transformData: {
            position: Vec3;
            rotation: Vec3;
            scale: Vec3;
        };
        renderData: {
            color: Color;
            opacity: number;
            visible: boolean;
        };
        parentId: number | null; // 避免循环引用：使用父节点实体ID
        childIds: number[]; // 避免循环引用：使用子节点实体ID列表
    };
    
    /** 渲染组件引用 */
    public sprite: Sprite | null = null;
    public label: Label | null = null;
    
    /** 复杂嵌套对象 */
    public complexData: {
        statistics: {
            frameCount: number;
            lastUpdateTime: number;
            performance: {
                avgRenderTime: number;
                maxRenderTime: number;
                renderHistory: number[];
            };
        };
        cache: {
            textureCache: Map<string, any>;
            materialCache: Map<string, any>;
            shaderCache: Map<string, any>;
        };
        hierarchy: {
            parentId: number | null; // 避免循环引用：使用ID
            rootId: number | null; // 避免循环引用：使用ID
            depth: number;
            siblingIndex: number;
        };
        animation: {
            isPlaying: boolean;
            currentFrame: number;
            totalFrames: number;
            loopCount: number;
            animationQueue: Array<{
                name: string;
                duration: number;
                delay: number;
                easing: string;
            }>;
        };
        interaction: {
            isInteractable: boolean;
            touchEnabled: boolean;
            hitTestResults: Array<{
                position: Vec3;
                timestamp: number;
                result: boolean;
            }>;
            boundingBox: {
                min: Vec3;
                max: Vec3;
                center: Vec3;
            };
        };
    };
    
    /** 复杂的渲染状态 */
    public renderState: {
        layerInfo: {
            currentLayer: number;
            layerStack: number[];
            sortingOrder: number;
            cullingMask: number;
        };
        materials: Array<{
            materialId: string;
            properties: Map<string, any>;
            textures: Map<string, any>;
            shaderParams: Record<string, any>;
        }>;
        lightingData: {
            ambientColor: Color;
            diffuseColor: Color;
            specularColor: Color;
            lightDirection: Vec3;
            shadowData: {
                castShadows: boolean;
                receiveShadows: boolean;
                shadowQuality: 'low' | 'medium' | 'high';
                shadowDistance: number;
            };
        };
    };
    
    constructor(name: string = "DefaultNode") {
        super();
        
        this.nodeConfig = {
            name: name,
            layer: 0,
            tag: "default",
            userData: {},
            transformData: {
                position: new Vec3(),
                rotation: new Vec3(),
                scale: new Vec3(1, 1, 1)
            },
            renderData: {
                color: new Color(255, 255, 255, 255),
                opacity: 1.0,
                visible: true
            },
            parentId: null,
            childIds: []
        };
        
        this.complexData = {
            statistics: {
                frameCount: 0,
                lastUpdateTime: 0,
                performance: {
                    avgRenderTime: 0,
                    maxRenderTime: 0,
                    renderHistory: []
                }
            },
            cache: {
                textureCache: new Map(),
                materialCache: new Map(),
                shaderCache: new Map()
            },
            hierarchy: {
                parentId: null,
                rootId: null,
                depth: 0,
                siblingIndex: 0
            },
            animation: {
                isPlaying: false,
                currentFrame: 0,
                totalFrames: 60,
                loopCount: 0,
                animationQueue: []
            },
            interaction: {
                isInteractable: true,
                touchEnabled: true,
                hitTestResults: [],
                boundingBox: {
                    min: new Vec3(-1, -1, -1),
                    max: new Vec3(1, 1, 1),
                    center: new Vec3()
                }
            }
        };
        
        this.renderState = {
            layerInfo: {
                currentLayer: 0,
                layerStack: [0],
                sortingOrder: 0,
                cullingMask: 0xFFFFFFFF
            },
            materials: [],
            lightingData: {
                ambientColor: new Color(128, 128, 128, 255),
                diffuseColor: new Color(255, 255, 255, 255),
                specularColor: new Color(255, 255, 255, 255),
                lightDirection: new Vec3(0, -1, 0),
                shadowData: {
                    castShadows: true,
                    receiveShadows: true,
                    shadowQuality: 'medium',
                    shadowDistance: 100
                }
            }
        };
    }
    
    /**
     * 设置父节点组件（避免循环引用）
     */
    public setParent(parentEntityId: number): void {
        this.nodeConfig.parentId = parentEntityId;
        this.complexData.hierarchy.parentId = parentEntityId;
        // 深度需要通过其他方式计算，避免引用
    }
    
    /**
     * 添加子节点
     */
    public addChild(childEntityId: number): void {
        if (!this.nodeConfig.childIds.includes(childEntityId)) {
            this.nodeConfig.childIds.push(childEntityId);
        }
    }
    
    /**
     * 更新性能统计
     */
    public updatePerformance(renderTime: number): void {
        this.complexData.statistics.frameCount++;
        this.complexData.statistics.lastUpdateTime = Date.now();
        
        const perf = this.complexData.statistics.performance;
        perf.renderHistory.push(renderTime);
        
        // 保持历史记录在合理范围内
        if (perf.renderHistory.length > 100) {
            perf.renderHistory.shift();
        }
        
        // 计算平均值和最大值
        perf.avgRenderTime = perf.renderHistory.reduce((a, b) => a + b, 0) / perf.renderHistory.length;
        perf.maxRenderTime = Math.max(perf.maxRenderTime, renderTime);
    }
    
    /**
     * 更新动画状态
     */
    public updateAnimation(deltaTime: number): void {
        if (this.complexData.animation.isPlaying) {
            this.complexData.animation.currentFrame++;
            
            if (this.complexData.animation.currentFrame >= this.complexData.animation.totalFrames) {
                this.complexData.animation.currentFrame = 0;
                this.complexData.animation.loopCount++;
                
                // 处理动画队列
                if (this.complexData.animation.animationQueue.length > 0) {
                    const nextAnim = this.complexData.animation.animationQueue.shift();
                    if (nextAnim) {
                        this.complexData.animation.totalFrames = Math.floor(nextAnim.duration * 60); // 假设60FPS
                    }
                }
            }
        }
    }
    
    /**
     * 添加材质
     */
    public addMaterial(materialId: string, properties: Record<string, any>): void {
        this.renderState.materials.push({
            materialId,
            properties: new Map(Object.entries(properties)),
            textures: new Map(),
            shaderParams: {}
        });
    }
    
    /**
     * 更新包围盒
     */
    public updateBoundingBox(): void {
        if (this.node) {
            const worldPos = this.node.getWorldPosition();
            const scale = this.node.getScale();
            
            this.complexData.interaction.boundingBox.center = new Vec3(worldPos.x, worldPos.y, worldPos.z);
            this.complexData.interaction.boundingBox.min = new Vec3(
                worldPos.x - scale.x * 0.5,
                worldPos.y - scale.y * 0.5,
                worldPos.z - scale.z * 0.5
            );
            this.complexData.interaction.boundingBox.max = new Vec3(
                worldPos.x + scale.x * 0.5,
                worldPos.y + scale.y * 0.5,
                worldPos.z + scale.z * 0.5
            );
        }
    }
    
    /**
     * 执行点击测试
     */
    public hitTest(point: Vec3): boolean {
        const bbox = this.complexData.interaction.boundingBox;
        const result = point.x >= bbox.min.x && point.x <= bbox.max.x &&
                      point.y >= bbox.min.y && point.y <= bbox.max.y &&
                      point.z >= bbox.min.z && point.z <= bbox.max.z;
        
        // 记录测试结果
        this.complexData.interaction.hitTestResults.push({
            position: new Vec3(point.x, point.y, point.z),
            timestamp: Date.now(),
            result
        });
        
        // 限制历史记录大小
        if (this.complexData.interaction.hitTestResults.length > 50) {
            this.complexData.interaction.hitTestResults.shift();
        }
        
        return result;
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        this.node = null;
        this.children = [];
        this.sprite = null;
        this.label = null;
        
        // 清理ID列表（不再需要处理循环引用）
        this.nodeConfig.parentId = null;
        this.nodeConfig.childIds = [];
        this.complexData.hierarchy.parentId = null;
        this.complexData.hierarchy.rootId = null;
        this.complexData.hierarchy.depth = 0;
        
        this.complexData.cache.textureCache.clear();
        this.complexData.cache.materialCache.clear();
        this.complexData.cache.shaderCache.clear();
        
        this.complexData.animation.isPlaying = false;
        this.complexData.animation.currentFrame = 0;
        this.complexData.animation.animationQueue = [];
        
        this.complexData.interaction.hitTestResults = [];
        this.renderState.materials = [];
    }
} 