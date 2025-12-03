/**
 * Behavior Tree Plugin Manifest
 * 行为树插件清单
 */

import type { ModuleManifest } from '@esengine/editor-runtime';

/**
 * 插件清单
 */
export const manifest: ModuleManifest = {
    id: '@esengine/behavior-tree',
    name: '@esengine/behavior-tree',
    displayName: 'Behavior Tree System',
    version: '1.0.0',
    description: 'AI 行为树系统，支持可视化编辑和运行时执行',
    category: 'AI',
    icon: 'GitBranch',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: false,
    canContainContent: false,
    dependencies: ['engine-core'],
    exports: {
        components: ['BehaviorTreeRuntimeComponent'],
        systems: ['BehaviorTreeExecutionSystem'],
        loaders: ['BehaviorTreeLoader']
    }
};
