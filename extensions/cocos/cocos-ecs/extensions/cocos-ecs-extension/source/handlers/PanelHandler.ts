/**
 * 面板管理相关的处理器
 */
export class PanelHandler {
    /**
     * 打开默认面板
     */
    static openDefaultPanel(): void {
        try {
            Editor.Panel.open('cocos-ecs-extension');
            console.log('Default panel opened successfully');
        } catch (error) {
            console.error('Failed to open default panel:', error);
            Editor.Dialog.error('打开面板失败', {
                detail: `无法打开面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    }

    /**
     * 打开调试面板
     */
    static openDebugPanel(): void {
        try {
            Editor.Panel.open('cocos-ecs-extension.debug');
            console.log('Debug panel opened successfully');
        } catch (error) {
            console.error('Failed to open debug panel:', error);
            Editor.Dialog.error('打开调试面板失败', {
                detail: `无法打开调试面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    }

    /**
     * 打开代码生成器面板
     */
    static openGeneratorPanel(): void {
        try {
            Editor.Panel.open('cocos-ecs-extension.generator');
            console.log('Generator panel opened successfully');
        } catch (error) {
            console.error('Failed to open generator panel:', error);
            Editor.Dialog.error('打开代码生成器失败', {
                detail: `无法打开代码生成器面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    }

    /**
     * 打开行为树面板
     */
    static openBehaviorTreePanel(): void {
        try {
            Editor.Panel.open('cocos-ecs-extension.behavior-tree');
            console.log('Behavior Tree panel opened successfully');
        } catch (error) {
            console.error('Failed to open behavior tree panel:', error);
            Editor.Dialog.error('打开行为树面板失败', {
                detail: `无法打开行为树AI组件库面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    }
} 