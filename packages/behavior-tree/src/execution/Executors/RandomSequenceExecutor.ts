import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 随机序列执行器
 *
 * 随机顺序执行子节点序列，全部成功才成功
 */
@NodeExecutorMetadata({
    implementationType: 'RandomSequence',
    nodeType: NodeType.Composite,
    displayName: '随机序列',
    description: '随机顺序执行子节点，全部成功才成功',
    category: 'Composite',
    childrenConstraints: {
        min: 1
    }
})
export class RandomSequenceExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        if (!state.shuffledIndices || state.shuffledIndices.length === 0) {
            state.shuffledIndices = this.shuffleIndices(nodeData.children.length);
        }

        while (state.currentChildIndex < state.shuffledIndices.length) {
            const shuffledIndex = state.shuffledIndices[state.currentChildIndex]!;
            const childId = nodeData.children[shuffledIndex]!;
            const status = context.executeChild(childId);

            if (status === TaskStatus.Running) {
                return TaskStatus.Running;
            }

            if (status === TaskStatus.Failure) {
                state.currentChildIndex = 0;
                delete state.shuffledIndices;
                return TaskStatus.Failure;
            }

            state.currentChildIndex++;
        }

        state.currentChildIndex = 0;
        delete state.shuffledIndices;
        return TaskStatus.Success;
    }

    private shuffleIndices(length: number): number[] {
        const indices = Array.from({ length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = indices[i]!;
            indices[i] = indices[j]!;
            indices[j] = temp;
        }
        return indices;
    }

    reset(context: NodeExecutionContext): void {
        context.state.currentChildIndex = 0;
        delete context.state.shuffledIndices;
    }
}
