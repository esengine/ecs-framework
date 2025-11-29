/**
 * Math Operation Nodes - Basic arithmetic operations
 * 数学运算节点 - 基础算术运算
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

// Add Node (加法节点)
export const AddTemplate: BlueprintNodeTemplate = {
    type: 'Add',
    title: 'Add',
    category: 'math',
    color: '#4CAF50',
    description: 'Adds two numbers together (将两个数字相加)',
    keywords: ['add', 'plus', 'sum', '+', 'math'],
    isPure: true,
    inputs: [
        { name: 'a', type: 'float', displayName: 'A', defaultValue: 0 },
        { name: 'b', type: 'float', displayName: 'B', defaultValue: 0 }
    ],
    outputs: [
        { name: 'result', type: 'float', displayName: 'Result' }
    ]
};

@RegisterNode(AddTemplate)
export class AddExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const a = Number(context.evaluateInput(node.id, 'a', 0));
        const b = Number(context.evaluateInput(node.id, 'b', 0));
        return { outputs: { result: a + b } };
    }
}

// Subtract Node (减法节点)
export const SubtractTemplate: BlueprintNodeTemplate = {
    type: 'Subtract',
    title: 'Subtract',
    category: 'math',
    color: '#4CAF50',
    description: 'Subtracts B from A (从 A 减去 B)',
    keywords: ['subtract', 'minus', '-', 'math'],
    isPure: true,
    inputs: [
        { name: 'a', type: 'float', displayName: 'A', defaultValue: 0 },
        { name: 'b', type: 'float', displayName: 'B', defaultValue: 0 }
    ],
    outputs: [
        { name: 'result', type: 'float', displayName: 'Result' }
    ]
};

@RegisterNode(SubtractTemplate)
export class SubtractExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const a = Number(context.evaluateInput(node.id, 'a', 0));
        const b = Number(context.evaluateInput(node.id, 'b', 0));
        return { outputs: { result: a - b } };
    }
}

// Multiply Node (乘法节点)
export const MultiplyTemplate: BlueprintNodeTemplate = {
    type: 'Multiply',
    title: 'Multiply',
    category: 'math',
    color: '#4CAF50',
    description: 'Multiplies two numbers (将两个数字相乘)',
    keywords: ['multiply', 'times', '*', 'math'],
    isPure: true,
    inputs: [
        { name: 'a', type: 'float', displayName: 'A', defaultValue: 0 },
        { name: 'b', type: 'float', displayName: 'B', defaultValue: 1 }
    ],
    outputs: [
        { name: 'result', type: 'float', displayName: 'Result' }
    ]
};

@RegisterNode(MultiplyTemplate)
export class MultiplyExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const a = Number(context.evaluateInput(node.id, 'a', 0));
        const b = Number(context.evaluateInput(node.id, 'b', 1));
        return { outputs: { result: a * b } };
    }
}

// Divide Node (除法节点)
export const DivideTemplate: BlueprintNodeTemplate = {
    type: 'Divide',
    title: 'Divide',
    category: 'math',
    color: '#4CAF50',
    description: 'Divides A by B (A 除以 B)',
    keywords: ['divide', '/', 'math'],
    isPure: true,
    inputs: [
        { name: 'a', type: 'float', displayName: 'A', defaultValue: 0 },
        { name: 'b', type: 'float', displayName: 'B', defaultValue: 1 }
    ],
    outputs: [
        { name: 'result', type: 'float', displayName: 'Result' }
    ]
};

@RegisterNode(DivideTemplate)
export class DivideExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const a = Number(context.evaluateInput(node.id, 'a', 0));
        const b = Number(context.evaluateInput(node.id, 'b', 1));

        // Prevent division by zero (防止除零)
        if (b === 0) {
            return { outputs: { result: 0 } };
        }

        return { outputs: { result: a / b } };
    }
}
