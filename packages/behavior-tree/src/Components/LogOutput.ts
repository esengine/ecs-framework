import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * 日志输出组件
 *
 * 存储运行时输出的日志信息，用于在UI中显示
 */
@ECSComponent('LogOutput')
export class LogOutput extends Component {
    /**
     * 日志消息列表
     */
    messages: Array<{
        timestamp: number;
        message: string;
        level: 'log' | 'info' | 'warn' | 'error';
    }> = [];

    /**
     * 添加日志消息
     */
    addMessage(message: string, level: 'log' | 'info' | 'warn' | 'error' = 'log'): void {
        this.messages.push({
            timestamp: Date.now(),
            message,
            level
        });
    }

    /**
     * 清空日志
     */
    clear(): void {
        this.messages = [];
    }
}
