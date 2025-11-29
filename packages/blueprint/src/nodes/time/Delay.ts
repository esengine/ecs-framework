/**
 * Delay Node - Pauses execution for a specified duration
 * 延迟节点 - 暂停执行指定的时长
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * Delay node template
 * Delay 节点模板
 */
export const DelayTemplate: BlueprintNodeTemplate = {
    type: 'Delay',
    title: 'Delay',
    category: 'flow',
    color: '#FFFFFF',
    description: 'Pauses execution for a specified number of seconds (暂停执行指定的秒数)',
    keywords: ['wait', 'delay', 'pause', 'sleep', 'timer'],
    inputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: ''
        },
        {
            name: 'duration',
            type: 'float',
            displayName: 'Duration',
            defaultValue: 1.0
        }
    ],
    outputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: 'Completed'
        }
    ]
};

/**
 * Delay node executor
 * Delay 节点执行器
 */
@RegisterNode(DelayTemplate)
export class DelayExecutor implements INodeExecutor {
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        const duration = context.evaluateInput(node.id, 'duration', 1.0) as number;

        return {
            nextExec: 'exec',
            delay: duration
        };
    }
}
