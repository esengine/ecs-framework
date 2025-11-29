/**
 * Get Delta Time Node - Returns the time since last frame
 * 获取增量时间节点 - 返回上一帧以来的时间
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * GetDeltaTime node template
 * GetDeltaTime 节点模板
 */
export const GetDeltaTimeTemplate: BlueprintNodeTemplate = {
    type: 'GetDeltaTime',
    title: 'Get Delta Time',
    category: 'time',
    color: '#4FC3F7',
    description: 'Returns the time elapsed since the last frame in seconds (返回上一帧以来经过的时间，单位秒)',
    keywords: ['delta', 'time', 'frame', 'dt'],
    isPure: true,
    inputs: [],
    outputs: [
        {
            name: 'deltaTime',
            type: 'float',
            displayName: 'Delta Seconds'
        }
    ]
};

/**
 * GetDeltaTime node executor
 * GetDeltaTime 节点执行器
 */
@RegisterNode(GetDeltaTimeTemplate)
export class GetDeltaTimeExecutor implements INodeExecutor {
    execute(_node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        return {
            outputs: {
                deltaTime: context.deltaTime
            }
        };
    }
}
