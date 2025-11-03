import { BehaviorTree } from '../models/BehaviorTree';
import { Node } from '../models/Node';
import { Connection } from '../models/Connection';
import { IValidator, ValidationResult, ValidationError as IValidationError } from '../interfaces/IValidator';

/**
 * 行为树验证服务
 * 实现所有业务验证规则
 */
export class TreeValidator implements IValidator {
    /**
     * 验证整个行为树
     */
    validateTree(tree: BehaviorTree): ValidationResult {
        const errors: IValidationError[] = [];

        if (!tree.rootNodeId) {
            errors.push({
                message: '行为树必须有一个根节点'
            });
        }

        const rootNodes = tree.nodes.filter((n) => n.isRoot());
        if (rootNodes.length > 1) {
            errors.push({
                message: '行为树只能有一个根节点',
                nodeId: rootNodes.map((n) => n.id).join(', ')
            });
        }

        tree.nodes.forEach((node) => {
            const nodeValidation = this.validateNode(node);
            errors.push(...nodeValidation.errors);
        });

        tree.connections.forEach((connection) => {
            const connValidation = this.validateConnection(connection, tree);
            errors.push(...connValidation.errors);
        });

        const cycleValidation = this.validateNoCycles(tree);
        errors.push(...cycleValidation.errors);

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证节点
     */
    validateNode(node: Node): ValidationResult {
        const errors: IValidationError[] = [];

        // 使用模板定义的约束，undefined 表示无限制
        const maxChildren = (node.template.maxChildren ?? Infinity) as number;
        const actualChildren = node.children.length;

        if (actualChildren > maxChildren) {
            if (node.isRoot()) {
                errors.push({
                    message: '根节点只能连接一个子节点',
                    nodeId: node.id,
                    field: 'children'
                });
            } else if (node.nodeType.isDecorator()) {
                errors.push({
                    message: '装饰节点只能连接一个子节点',
                    nodeId: node.id,
                    field: 'children'
                });
            } else if (node.nodeType.isLeaf()) {
                errors.push({
                    message: '叶子节点不能有子节点',
                    nodeId: node.id,
                    field: 'children'
                });
            } else {
                errors.push({
                    message: `节点子节点数量 (${actualChildren}) 超过最大限制 (${maxChildren})`,
                    nodeId: node.id,
                    field: 'children'
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证连接
     */
    validateConnection(connection: Connection, tree: BehaviorTree): ValidationResult {
        const errors: IValidationError[] = [];

        if (!tree.hasNode(connection.from)) {
            errors.push({
                message: `源节点不存在: ${connection.from}`,
                nodeId: connection.from
            });
        }

        if (!tree.hasNode(connection.to)) {
            errors.push({
                message: `目标节点不存在: ${connection.to}`,
                nodeId: connection.to
            });
        }

        if (connection.from === connection.to) {
            errors.push({
                message: '节点不能连接到自己',
                nodeId: connection.from
            });
        }

        if (tree.hasNode(connection.from) && tree.hasNode(connection.to)) {
            const fromNode = tree.getNode(connection.from);
            const toNode = tree.getNode(connection.to);

            if (connection.isNodeConnection()) {
                if (!fromNode.canAddChild()) {
                    errors.push({
                        message: `节点 ${connection.from} 无法添加更多子节点`,
                        nodeId: connection.from
                    });
                }

                if (toNode.nodeType.isLeaf() && toNode.hasChildren()) {
                    errors.push({
                        message: `叶子节点 ${connection.to} 不能有子节点`,
                        nodeId: connection.to
                    });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证是否存在循环引用
     */
    validateNoCycles(tree: BehaviorTree): ValidationResult {
        const errors: IValidationError[] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                errors.push({
                    message: `检测到循环引用: 节点 ${nodeId}`,
                    nodeId
                });
                return true;
            }

            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const node = tree.getNode(nodeId);
            for (const childId of node.children) {
                if (dfs(childId)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        if (tree.rootNodeId) {
            dfs(tree.rootNodeId);
        }

        tree.nodes.forEach((node) => {
            if (!visited.has(node.id) && !node.isRoot()) {
                dfs(node.id);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
