/**
 * Print Node - Outputs a message for debugging
 * 打印节点 - 输出调试消息
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * Print node template
 * Print 节点模板
 */
export const PrintTemplate: BlueprintNodeTemplate = {
    type: 'Print',
    title: 'Print String',
    category: 'debug',
    color: '#785EF0',
    description: 'Prints a message to the console for debugging (打印消息到控制台用于调试)',
    keywords: ['log', 'debug', 'console', 'output', 'print'],
    inputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: ''
        },
        {
            name: 'message',
            type: 'string',
            displayName: 'Message',
            defaultValue: 'Hello Blueprint!'
        },
        {
            name: 'printToScreen',
            type: 'bool',
            displayName: 'Print to Screen',
            defaultValue: true
        },
        {
            name: 'duration',
            type: 'float',
            displayName: 'Duration',
            defaultValue: 2.0
        }
    ],
    outputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: ''
        }
    ]
};

/**
 * Print node executor
 * Print 节点执行器
 */
@RegisterNode(PrintTemplate)
export class PrintExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const message = context.evaluateInput(node.id, 'message', 'Hello Blueprint!');
        const printToScreen = context.evaluateInput(node.id, 'printToScreen', true);
        const duration = context.evaluateInput(node.id, 'duration', 2.0);

        // Console output
        // 控制台输出
        console.log(`[Blueprint] ${message}`);

        // Screen output via event (handled by runtime)
        // 通过事件输出到屏幕（由运行时处理）
        if (printToScreen) {
            const event = new CustomEvent('blueprint:print', {
                detail: {
                    message: String(message),
                    duration: Number(duration),
                    entityId: context.entity.id,
                    entityName: context.entity.name
                }
            });

            if (typeof window !== 'undefined') {
                window.dispatchEvent(event);
            }
        }

        return {
            nextExec: 'exec'
        };
    }
}
