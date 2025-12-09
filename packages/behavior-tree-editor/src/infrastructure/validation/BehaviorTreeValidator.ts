import { IValidator, ValidationResult, ValidationError } from '../../domain/interfaces/IValidator';
import { BehaviorTree } from '../../domain/models/BehaviorTree';
import { Node } from '../../domain/models/Node';
import { Connection } from '../../domain/models/Connection';
import { translateBT } from '../../hooks/useBTLocale';

/**
 * 行为树验证器实现
 * Behavior Tree Validator Implementation
 */
export class BehaviorTreeValidator implements IValidator {
    /**
     * 验证整个行为树
     */
    validateTree(tree: BehaviorTree): ValidationResult {
        const errors: ValidationError[] = [];

        // 验证所有节点
        for (const node of tree.nodes) {
            const nodeResult = this.validateNode(node);
            errors.push(...nodeResult.errors);
        }

        // 验证所有连接
        for (const connection of tree.connections) {
            const connResult = this.validateConnection(connection, tree);
            errors.push(...connResult.errors);
        }

        // 验证循环引用
        const cycleResult = this.validateNoCycles(tree);
        errors.push(...cycleResult.errors);

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证节点
     * Validate node
     */
    validateNode(node: Node): ValidationResult {
        const errors: ValidationError[] = [];

        // 验证节点必填字段 | Validate required fields
        if (!node.id) {
            errors.push({
                message: translateBT('validation.nodeIdRequired'),
                nodeId: node.id
            });
        }

        if (!node.template) {
            errors.push({
                message: translateBT('validation.nodeTemplateRequired'),
                nodeId: node.id
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证连接
     * Validate connection
     */
    validateConnection(connection: Connection, tree: BehaviorTree): ValidationResult {
        const errors: ValidationError[] = [];

        // 验证连接的源节点和目标节点都存在 | Validate source and target nodes exist
        const fromNode = tree.nodes.find((n) => n.id === connection.from);
        const toNode = tree.nodes.find((n) => n.id === connection.to);

        if (!fromNode) {
            errors.push({
                message: translateBT('validation.sourceNodeNotFound', undefined, { nodeId: connection.from })
            });
        }

        if (!toNode) {
            errors.push({
                message: translateBT('validation.targetNodeNotFound', undefined, { nodeId: connection.to })
            });
        }

        // 不能自己连接自己 | Cannot connect to self
        if (connection.from === connection.to) {
            errors.push({
                message: translateBT('validation.selfConnection'),
                nodeId: connection.from
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证是否会产生循环引用
     * Validate no cycles exist
     */
    validateNoCycles(tree: BehaviorTree): ValidationResult {
        const errors: ValidationError[] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true;
            }

            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const node = tree.nodes.find((n) => n.id === nodeId);
            if (node) {
                for (const childId of node.children) {
                    if (hasCycle(childId)) {
                        return true;
                    }
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of tree.nodes) {
            if (hasCycle(node.id)) {
                errors.push({
                    message: translateBT('validation.cycleDetected'),
                    nodeId: node.id
                });
                break;
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
