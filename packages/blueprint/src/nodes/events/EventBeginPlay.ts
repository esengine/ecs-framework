/**
 * Event Begin Play Node - Triggered when the blueprint starts
 * 开始播放事件节点 - 蓝图启动时触发
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * EventBeginPlay node template
 * EventBeginPlay 节点模板
 */
export const EventBeginPlayTemplate: BlueprintNodeTemplate = {
    type: 'EventBeginPlay',
    title: 'Event Begin Play',
    category: 'event',
    color: '#CC0000',
    description: 'Triggered once when the blueprint starts executing (蓝图开始执行时触发一次)',
    keywords: ['start', 'begin', 'init', 'event'],
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
 * EventBeginPlay node executor
 * EventBeginPlay 节点执行器
 */
@RegisterNode(EventBeginPlayTemplate)
export class EventBeginPlayExecutor implements INodeExecutor {
    execute(_node: BlueprintNode, _context: ExecutionContext): ExecutionResult {
        // Event nodes just trigger execution flow
        // 事件节点只触发执行流
        return {
            nextExec: 'exec'
        };
    }
}
