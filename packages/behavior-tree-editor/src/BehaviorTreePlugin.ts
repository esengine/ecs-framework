/**
 * Behavior Tree Plugin Descriptor
 * 行为树插件描述符
 */

import type { PluginDescriptor } from '@esengine/editor-runtime';

/**
 * 插件描述符
 */
export const descriptor: PluginDescriptor = {
    id: '@esengine/behavior-tree',
    name: 'Behavior Tree System',
    version: '1.0.0',
    description: 'AI 行为树系统，支持可视化编辑和运行时执行',
    category: 'ai',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: false,
    modules: [
        {
            name: 'BehaviorTreeRuntime',
            type: 'runtime',
            loadingPhase: 'default',
            entry: './src/index.ts'
        },
        {
            name: 'BehaviorTreeEditor',
            type: 'editor',
            loadingPhase: 'default',
            entry: './src/editor/index.ts'
        }
    ],
    dependencies: [
        { id: '@esengine/engine-core', version: '>=1.0.0', optional: true }
    ],
    icon: 'GitBranch'
};
