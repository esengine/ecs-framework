import { BehaviorTree } from '../models/BehaviorTree';
import { Node } from '../models/Node';
import { Connection } from '../models/Connection';

/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * 验证错误详情
 */
export interface ValidationError {
    message: string;
    nodeId?: string;
    field?: string;
}

/**
 * 验证器接口
 * 负责行为树的验证逻辑
 */
export interface IValidator {
    /**
     * 验证整个行为树
     */
    validateTree(tree: BehaviorTree): ValidationResult;

    /**
     * 验证节点
     */
    validateNode(node: Node): ValidationResult;

    /**
     * 验证连接
     */
    validateConnection(connection: Connection, tree: BehaviorTree): ValidationResult;

    /**
     * 验证是否会产生循环引用
     */
    validateNoCycles(tree: BehaviorTree): ValidationResult;
}
