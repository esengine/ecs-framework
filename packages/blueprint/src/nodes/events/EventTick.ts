/**
 * Event Tick Node - Triggered every frame
 * 每帧事件节点 - 每帧触发
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * EventTick node template
 * EventTick 节点模板
 */
export const EventTickTemplate: BlueprintNodeTemplate = {
    type: 'EventTick',
    title: 'Event Tick',
    category: 'event',
    color: '#CC0000',
    description: 'Triggered every frame during execution (执行期间每帧触发)',
    keywords: ['update', 'frame', 'tick', 'event'],
    inputs: [],
    outputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: ''
        },
        {
            name: 'deltaTime',
            type: 'float',
            displayName: 'Delta Seconds'
        }
    ]
};

/**
 * EventTick node executor
 * EventTick 节点执行器
 */
@RegisterNode(EventTickTemplate)
export class EventTickExecutor implements INodeExecutor {
    execute(_node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        return {
            nextExec: 'exec',
            outputs: {
                deltaTime: context.deltaTime
            }
        };
    }
}
