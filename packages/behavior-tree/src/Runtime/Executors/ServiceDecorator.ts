import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * Service执行接口
 */
export interface IServiceExecutor {
    /**
     * Service开始执行
     */
    onServiceStart?(context: NodeExecutionContext): void;

    /**
     * Service每帧更新
     */
    onServiceTick(context: NodeExecutionContext): void;

    /**
     * Service结束执行
     */
    onServiceEnd?(context: NodeExecutionContext): void;
}

/**
 * Service注册表
 */
class ServiceRegistry {
    private static services: Map<string, IServiceExecutor> = new Map();

    static register(name: string, service: IServiceExecutor): void {
        this.services.set(name, service);
    }

    static get(name: string): IServiceExecutor | undefined {
        return this.services.get(name);
    }

    static has(name: string): boolean {
        return this.services.has(name);
    }

    static unregister(name: string): boolean {
        return this.services.delete(name);
    }
}

/**
 * Service装饰器执行器
 *
 * 在子节点执行期间持续运行后台逻辑
 */
@NodeExecutorMetadata({
    implementationType: 'Service',
    nodeType: NodeType.Decorator,
    displayName: 'Service',
    description: '在子节点执行期间持续运行后台逻辑',
    category: 'Decorator',
    configSchema: {
        serviceName: {
            type: 'string',
            default: '',
            description: 'Service名称'
        },
        tickInterval: {
            type: 'number',
            default: 0,
            description: 'Service更新间隔（秒，0表示每帧更新）',
            supportBinding: true
        }
    }
})
export class ServiceDecorator implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state, totalTime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const serviceName = BindingHelper.getValue<string>(context, 'serviceName', '');
        const tickInterval = BindingHelper.getValue<number>(context, 'tickInterval', 0);

        if (!serviceName) {
            return TaskStatus.Failure;
        }

        const service = ServiceRegistry.get(serviceName);
        if (!service) {
            console.warn(`未找到Service: ${serviceName}`);
            return TaskStatus.Failure;
        }

        if (state.status !== TaskStatus.Running) {
            state.startTime = totalTime;
            state.lastExecutionTime = totalTime;

            if (service.onServiceStart) {
                service.onServiceStart(context);
            }
        }

        const shouldTick = tickInterval === 0 ||
            (state.lastExecutionTime !== undefined &&
                (totalTime - state.lastExecutionTime) >= tickInterval);

        if (shouldTick) {
            service.onServiceTick(context);
            state.lastExecutionTime = totalTime;
        }

        const childId = nodeData.children[0]!;
        const childStatus = context.executeChild(childId);

        if (childStatus !== TaskStatus.Running) {
            if (service.onServiceEnd) {
                service.onServiceEnd(context);
            }
        }

        return childStatus;
    }

    reset(context: NodeExecutionContext): void {
        const { nodeData, runtime, state } = context;

        const serviceName = BindingHelper.getValue<string>(context, 'serviceName', '');
        if (serviceName) {
            const service = ServiceRegistry.get(serviceName);
            if (service && service.onServiceEnd) {
                service.onServiceEnd(context);
            }
        }

        delete state.startTime;
        delete state.lastExecutionTime;

        if (nodeData.children && nodeData.children.length > 0) {
            runtime.resetNodeState(nodeData.children[0]!);
        }
    }
}

export { ServiceRegistry };
