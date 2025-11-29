/**
 * Get Time Node - Returns the total time since blueprint started
 * 获取时间节点 - 返回蓝图启动以来的总时间
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../../types/nodes';
import { ExecutionContext, ExecutionResult } from '../../runtime/ExecutionContext';
import { INodeExecutor, RegisterNode } from '../../runtime/NodeRegistry';

/**
 * GetTime node template
 * GetTime 节点模板
 */
export const GetTimeTemplate: BlueprintNodeTemplate = {
    type: 'GetTime',
    title: 'Get Game Time',
    category: 'time',
    color: '#4FC3F7',
    description: 'Returns the total time since the blueprint started in seconds (返回蓝图启动以来的总时间，单位秒)',
    keywords: ['time', 'total', 'elapsed', 'game'],
    isPure: true,
    inputs: [],
    outputs: [
        {
            name: 'time',
            type: 'float',
            displayName: 'Seconds'
        }
    ]
};

/**
 * GetTime node executor
 * GetTime 节点执行器
 */
@RegisterNode(GetTimeTemplate)
export class GetTimeExecutor implements INodeExecutor {
    execute(_node: BlueprintNode, context: ExecutionContext): ExecutionResult {
        return {
            outputs: {
                time: context.time
            }
        };
    }
}
