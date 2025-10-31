import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 日志动作执行器
 *
 * 输出日志信息
 */
@NodeExecutorMetadata({
    implementationType: 'Log',
    nodeType: NodeType.Action,
    displayName: '日志',
    description: '输出日志信息',
    category: 'Action',
    configSchema: {
        message: {
            type: 'string',
            default: '',
            description: '日志消息，支持{key}占位符引用黑板变量',
            supportBinding: true
        },
        logLevel: {
            type: 'string',
            default: 'info',
            description: '日志级别',
            options: ['info', 'warn', 'error']
        }
    }
})
export class LogAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;
        const message = BindingHelper.getValue<string>(context, 'message', '');
        const logLevel = BindingHelper.getValue<string>(context, 'logLevel', 'info');

        const finalMessage = this.replaceBlackboardVariables(message, runtime);

        this.log(finalMessage, logLevel);

        return TaskStatus.Success;
    }

    private replaceBlackboardVariables(message: string, runtime: NodeExecutionContext['runtime']): string {
        if (!message.includes('{') || !message.includes('}')) {
            return message;
        }

        // 使用限制长度的正则表达式避免 ReDoS 攻击
        // 限制占位符名称最多100个字符，只允许字母、数字、下划线和点号
        return message.replace(/\{([\w.]{1,100})\}/g, (_, key) => {
            const value = runtime.getBlackboardValue(key.trim());
            return value !== undefined ? String(value) : `{${key}}`;
        });
    }

    private log(message: string, level: string): void {
        switch (level) {
            case 'error':
                console.error(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'info':
            default:
                console.log(message);
                break;
        }
    }
}
