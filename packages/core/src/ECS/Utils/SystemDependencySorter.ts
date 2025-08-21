import { EntitySystem } from '../Systems/EntitySystem';
import { SystemMetadata, SystemPhase } from '../Decorators';
import type { ComponentType } from '../Core/ComponentStorage';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('SystemDependencySorter');

/**
 * 系统依赖图节点
 */
interface DependencyNode {
    system: EntitySystem;
    metadata: SystemMetadata;
    dependencies: Set<DependencyNode>; // 依赖的节点（必须在此节点之前执行）
    dependents: Set<DependencyNode>;   // 依赖此节点的节点
}

/**
 * 系统依赖排序器
 * 负责根据系统的reads/writes依赖关系进行拓扑排序
 */
export class SystemDependencySorter {
    /**
     * 对系统列表进行确定性排序
     * 排序规则（优先级从高到低）：
     * 1. 阶段排序（PreUpdate → Update → PostUpdate）
     * 2. 拓扑排序（基于reads/writes依赖）
     * 3. updateOrder排序
     * 4. registrationOrder排序
     * 5. systemHash排序（确保完全确定性）
     */
    public static sort(systems: EntitySystem[]): EntitySystem[] {
        // 按阶段分组
        const systemsByPhase = this.groupByPhase(systems);
        const sortedSystems: EntitySystem[] = [];
        
        // 按阶段顺序处理
        const phaseOrder = [SystemPhase.PreUpdate, SystemPhase.Update, SystemPhase.PostUpdate];
        
        for (const phase of phaseOrder) {
            const phaseSystems = systemsByPhase.get(phase) || [];
            if (phaseSystems.length === 0) continue;
            
            const sortedPhaseSystems = this.sortSystemsInPhase(phaseSystems);
            sortedSystems.push(...sortedPhaseSystems);
        }
        
        return sortedSystems;
    }
    
    /**
     * 按阶段分组系统
     */
    private static groupByPhase(systems: EntitySystem[]): Map<SystemPhase, EntitySystem[]> {
        const groups = new Map<SystemPhase, EntitySystem[]>();
        
        for (const system of systems) {
            const phase = system.phase;
            if (!groups.has(phase)) {
                groups.set(phase, []);
            }
            groups.get(phase)!.push(system);
        }
        
        return groups;
    }
    
    /**
     * 对单个阶段内的系统进行排序
     */
    private static sortSystemsInPhase(systems: EntitySystem[]): EntitySystem[] {
        // 尝试拓扑排序
        const topologicalResult = this.topologicalSort(systems);
        
        if (topologicalResult.success) {
            // 拓扑排序成功，应用多级排序
            return this.applyMultiLevelSort(topologicalResult.sorted);
        } else {
            // 拓扑排序失败（存在循环依赖），警告并使用fallback排序
            logger.warn('检测到系统循环依赖，使用fallback排序', {
                cycles: topologicalResult.cycles
            });
            return this.fallbackSort(systems);
        }
    }
    
    /**
     * 拓扑排序
     */
    private static topologicalSort(systems: EntitySystem[]): {
        success: boolean;
        sorted: EntitySystem[];
        cycles?: string[][];
    } {
        // 构建依赖图
        const dependencyGraph = this.buildDependencyGraph(systems);
        
        // Kahn算法进行拓扑排序
        const inDegree = new Map<EntitySystem, number>();
        const queue: EntitySystem[] = [];
        const result: EntitySystem[] = [];
        
        // 初始化入度
        for (const system of systems) {
            inDegree.set(system, 0);
        }
        
        // 计算入度
        for (const [system, node] of dependencyGraph) {
            for (const dependent of node.dependents) {
                inDegree.set(dependent.system, (inDegree.get(dependent.system) || 0) + 1);
            }
        }
        
        // 找到所有入度为0的节点
        for (const [system, degree] of inDegree) {
            if (degree === 0) {
                queue.push(system);
            }
        }
        
        // 处理队列
        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);
            
            const node = dependencyGraph.get(current)!;
            for (const dependent of node.dependents) {
                const newDegree = inDegree.get(dependent.system)! - 1;
                inDegree.set(dependent.system, newDegree);
                
                if (newDegree === 0) {
                    queue.push(dependent.system);
                }
            }
        }
        
        // 检查是否存在循环依赖
        if (result.length !== systems.length) {
            const cycles = this.detectCycles(dependencyGraph, result);
            return { success: false, sorted: [], cycles };
        }
        
        return { success: true, sorted: result };
    }
    
    /**
     * 构建系统依赖图
     */
    private static buildDependencyGraph(systems: EntitySystem[]): Map<EntitySystem, DependencyNode> {
        const graph = new Map<EntitySystem, DependencyNode>();
        
        // 初始化节点
        for (const system of systems) {
            graph.set(system, {
                system,
                metadata: system.metadata,
                dependencies: new Set(),
                dependents: new Set()
            });
        }
        
        // 构建依赖关系
        for (const [system, node] of graph) {
            const writes = node.metadata.writes || [];
            
            logger.debug(`系统 ${system.systemName} 写入组件:`, writes.map(w => w.name));
            
            for (const [otherSystem, otherNode] of graph) {
                if (system === otherSystem) continue;
                
                const reads = otherNode.metadata.reads || [];
                
                // 如果system写入的组件被otherSystem读取，则otherSystem依赖system
                for (const writeType of writes) {
                    for (const readType of reads) {
                        // 使用构造函数来比较组件类型，确保类型匹配的准确性
                        if (writeType === readType || writeType.name === readType.name) {
                            // otherSystem依赖system
                            otherNode.dependencies.add(node);
                            node.dependents.add(otherNode);
                            logger.debug(`依赖关系: ${otherSystem.systemName} 依赖 ${system.systemName} (通过组件 ${writeType.name || readType.name})`);
                        }
                    }
                }
            }
        }
        
        return graph;
    }
    
    /**
     * 检测循环依赖
     */
    private static detectCycles(
        graph: Map<EntitySystem, DependencyNode>,
        processed: EntitySystem[]
    ): string[][] {
        const cycles: string[][] = [];
        const processedSet = new Set(processed);
        
        for (const [system, node] of graph) {
            if (!processedSet.has(system)) {
                const cycle = this.findCycleFromNode(node, new Set(), []);
                if (cycle.length > 0) {
                    cycles.push(cycle.map(n => n.system.systemName));
                }
            }
        }
        
        return cycles;
    }
    
    /**
     * 从指定节点查找循环依赖
     */
    private static findCycleFromNode(
        node: DependencyNode,
        visited: Set<DependencyNode>,
        path: DependencyNode[]
    ): DependencyNode[] {
        if (visited.has(node)) {
            const cycleStart = path.indexOf(node);
            return cycleStart >= 0 ? path.slice(cycleStart) : [];
        }
        
        visited.add(node);
        path.push(node);
        
        for (const dependency of node.dependencies) {
            const cycle = this.findCycleFromNode(dependency, visited, path);
            if (cycle.length > 0) {
                return cycle;
            }
        }
        
        path.pop();
        return [];
    }
    
    /**
     * 应用多级排序（在拓扑排序基础上）
     */
    private static applyMultiLevelSort(systems: EntitySystem[]): EntitySystem[] {
        return systems.sort((a, b) => {
            // 注意：拓扑排序已经保证了依赖关系，这里只需要处理相同层级的排序
            
            // 1. updateOrder排序
            if (a.updateOrder !== b.updateOrder) {
                return a.updateOrder - b.updateOrder;
            }
            
            // 2. registrationOrder排序
            if (a.registrationOrder !== b.registrationOrder) {
                return a.registrationOrder - b.registrationOrder;
            }
            
            // 3. systemHash排序（确保完全确定性）
            return a.systemHash - b.systemHash;
        });
    }
    
    /**
     * Fallback排序（当存在循环依赖时使用）
     */
    private static fallbackSort(systems: EntitySystem[]): EntitySystem[] {
        return systems.sort((a, b) => {
            // 1. updateOrder排序
            if (a.updateOrder !== b.updateOrder) {
                return a.updateOrder - b.updateOrder;
            }
            
            // 2. registrationOrder排序
            if (a.registrationOrder !== b.registrationOrder) {
                return a.registrationOrder - b.registrationOrder;
            }
            
            // 3. systemHash排序
            return a.systemHash - b.systemHash;
        });
    }
}