/**
 * Event End Play Node - Triggered when the blueprint stops
 * 结束播放事件节点 - 蓝图停止时触发
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * EventEndPlay node template
 * EventEndPlay 节点模板
 */
export const EventEndPlayTemplate: BlueprintNodeTemplate = {
    type: 'EventEndPlay',
    title: 'Event End Play',
    category: 'event',
    color: '#CC0000',
    description: 'Triggered once when the blueprint stops executing (蓝图停止执行时触发一次)',
    keywords: ['stop', 'end', 'destroy', 'event'],
    inputs: [],
    outputs: [
        {
            name: 'exec',
            type: 'exec',
            displayName: ''
        }
    ]
};

/**
 * EventEndPlay node executor
 * EventEndPlay 节点执行器
 */
@RegisterNode(EventEndPlayTemplate)
export class EventEndPlayExecutor implements INodeExecutor {
    execute(_node: BlueprintNode, _context: ExecutionContext): ExecutionResult {
        return {
            nextExec: 'exec'
        };
    }
}
