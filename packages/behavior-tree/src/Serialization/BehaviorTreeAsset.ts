import { NodeType, BlackboardValueType } from '../Types/TaskStatus';

/**
 * 行为树资产元数据
 */
export interface AssetMetadata {
    name: string;
    description?: string;
    version: string;
    createdAt?: string;
    modifiedAt?: string;
}

/**
 * 黑板变量定义
 */
export interface BlackboardVariableDefinition {
    name: string;
    type: BlackboardValueType;
    defaultValue: any;
    readonly?: boolean;
    description?: string;
}

/**
 * 行为树节点配置数据
 */
export interface BehaviorNodeConfigData {
    className?: string;
    [key: string]: any;
}

/**
 * 行为树节点数据（运行时格式）
 */
export interface BehaviorTreeNodeData {
    id: string;
    name: string;
    nodeType: NodeType;

    // 节点类型特定数据
    data: BehaviorNodeConfigData;

    // 子节点ID列表
    children: string[];
}

/**
 * 属性绑定定义
 */
export interface PropertyBinding {
    nodeId: string;
    propertyName: string;
    variableName: string;
}

/**
 * 行为树资产（运行时格式）
 *
 * 这是用于游戏运行时的优化格式，不包含编辑器UI信息
 */
export interface BehaviorTreeAsset {
    /**
     * 资产格式版本
     */
    version: string;

    /**
     * 元数据
     */
    metadata: AssetMetadata;

    /**
     * 根节点ID
     */
    rootNodeId: string;

    /**
     * 所有节点数据（扁平化存储，通过children建立层级）
     */
    nodes: BehaviorTreeNodeData[];

    /**
     * 黑板变量定义
     */
    blackboard: BlackboardVariableDefinition[];

    /**
     * 属性绑定
     */
    propertyBindings?: PropertyBinding[];
}

/**
 * 资产验证结果
 */
export interface AssetValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
}

/**
 * 资产验证器
 */
export class BehaviorTreeAssetValidator {
    /**
     * 验证资产数据的完整性和正确性
     */
    static validate(asset: BehaviorTreeAsset): AssetValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 检查版本
        if (!asset.version) {
            errors.push('Missing version field');
        }

        // 检查元数据
        if (!asset.metadata || !asset.metadata.name) {
            errors.push('Missing or invalid metadata');
        }

        // 检查根节点
        if (!asset.rootNodeId) {
            errors.push('Missing rootNodeId');
        }

        // 检查节点列表
        if (!asset.nodes || !Array.isArray(asset.nodes)) {
            errors.push('Missing or invalid nodes array');
        } else {
            const nodeIds = new Set<string>();
            const rootNode = asset.nodes.find((n) => n.id === asset.rootNodeId);

            if (!rootNode) {
                errors.push(`Root node '${asset.rootNodeId}' not found in nodes array`);
            }

            // 检查节点ID唯一性
            for (const node of asset.nodes) {
                if (!node.id) {
                    errors.push('Node missing id field');
                    continue;
                }

                if (nodeIds.has(node.id)) {
                    errors.push(`Duplicate node id: ${node.id}`);
                }
                nodeIds.add(node.id);

                // 检查节点类型
                if (!node.nodeType) {
                    errors.push(`Node ${node.id} missing nodeType`);
                }

                // 检查子节点引用
                if (node.children) {
                    for (const childId of node.children) {
                        if (!asset.nodes.find((n) => n.id === childId)) {
                            errors.push(`Node ${node.id} references non-existent child: ${childId}`);
                        }
                    }
                }
            }

            // 检查是否有孤立节点
            const referencedNodes = new Set<string>([asset.rootNodeId]);
            const collectReferencedNodes = (nodeId: string) => {
                const node = asset.nodes.find((n) => n.id === nodeId);
                if (node && node.children) {
                    for (const childId of node.children) {
                        referencedNodes.add(childId);
                        collectReferencedNodes(childId);
                    }
                }
            };
            collectReferencedNodes(asset.rootNodeId);

            for (const node of asset.nodes) {
                if (!referencedNodes.has(node.id)) {
                    warnings.push(`Orphaned node detected: ${node.id} (${node.name})`);
                }
            }
        }

        // 检查黑板定义
        if (asset.blackboard && Array.isArray(asset.blackboard)) {
            const varNames = new Set<string>();
            for (const variable of asset.blackboard) {
                if (!variable.name) {
                    errors.push('Blackboard variable missing name');
                    continue;
                }

                if (varNames.has(variable.name)) {
                    errors.push(`Duplicate blackboard variable: ${variable.name}`);
                }
                varNames.add(variable.name);

                if (!variable.type) {
                    errors.push(`Blackboard variable ${variable.name} missing type`);
                }
            }
        }

        // 检查属性绑定
        if (asset.propertyBindings && Array.isArray(asset.propertyBindings)) {
            const nodeIds = new Set(asset.nodes.map((n) => n.id));
            const varNames = new Set(asset.blackboard?.map((v) => v.name) || []);

            for (const binding of asset.propertyBindings) {
                if (!nodeIds.has(binding.nodeId)) {
                    errors.push(`Property binding references non-existent node: ${binding.nodeId}`);
                }

                if (!varNames.has(binding.variableName)) {
                    errors.push(`Property binding references non-existent variable: ${binding.variableName}`);
                }

                if (!binding.propertyName) {
                    errors.push('Property binding missing propertyName');
                }
            }
        }

        const result: AssetValidationResult = {
            valid: errors.length === 0
        };

        if (errors.length > 0) {
            result.errors = errors;
        }

        if (warnings.length > 0) {
            result.warnings = warnings;
        }

        return result;
    }

    /**
     * 获取资产统计信息
     */
    static getStats(asset: BehaviorTreeAsset): {
        nodeCount: number;
        actionCount: number;
        conditionCount: number;
        compositeCount: number;
        decoratorCount: number;
        blackboardVariableCount: number;
        propertyBindingCount: number;
        maxDepth: number;
    } {
        let actionCount = 0;
        let conditionCount = 0;
        let compositeCount = 0;
        let decoratorCount = 0;

        for (const node of asset.nodes) {
            switch (node.nodeType) {
                case NodeType.Action:
                    actionCount++;
                    break;
                case NodeType.Condition:
                    conditionCount++;
                    break;
                case NodeType.Composite:
                    compositeCount++;
                    break;
                case NodeType.Decorator:
                    decoratorCount++;
                    break;
            }
        }

        // 计算最大深度
        const getDepth = (nodeId: string, currentDepth: number = 0): number => {
            const node = asset.nodes.find((n) => n.id === nodeId);
            if (!node || !node.children || node.children.length === 0) {
                return currentDepth;
            }

            let maxChildDepth = currentDepth;
            for (const childId of node.children) {
                const childDepth = getDepth(childId, currentDepth + 1);
                maxChildDepth = Math.max(maxChildDepth, childDepth);
            }
            return maxChildDepth;
        };

        return {
            nodeCount: asset.nodes.length,
            actionCount,
            conditionCount,
            compositeCount,
            decoratorCount,
            blackboardVariableCount: asset.blackboard?.length || 0,
            propertyBindingCount: asset.propertyBindings?.length || 0,
            maxDepth: getDepth(asset.rootNodeId)
        };
    }
}
