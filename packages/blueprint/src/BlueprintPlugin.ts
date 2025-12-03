/**
 * Blueprint Plugin for ES Engine.
 * ES引擎的蓝图插件。
 *
 * Provides visual scripting runtime support.
 * 提供可视化脚本运行时支持。
 */

import type { IPlugin, ModuleManifest, IRuntimeModule } from '@esengine/engine-core';

/**
 * Blueprint Runtime Module.
 * 蓝图运行时模块。
 *
 * Note: Blueprint uses a custom system (IBlueprintSystem) instead of EntitySystem,
 * so createSystems is not implemented here. Blueprint systems should be created
 * manually using createBlueprintSystem(scene).
 */
class BlueprintRuntimeModule implements IRuntimeModule {
    async onInitialize(): Promise<void> {
        // Blueprint system initialization
        // Blueprint uses IBlueprintSystem which is different from EntitySystem
    }

    onDestroy(): void {
        // Cleanup
    }
}

/**
 * Plugin manifest for Blueprint.
 * 蓝图的插件清单。
 */
const manifest: ModuleManifest = {
    id: 'blueprint',
    name: '@esengine/blueprint',
    displayName: 'Blueprint',
    version: '1.0.0',
    description: '可视化脚本系统',
    category: 'AI',
    icon: 'Workflow',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    dependencies: ['core'],
    exports: {
        components: ['BlueprintComponent'],
        systems: ['BlueprintSystem']
    },
    requiresWasm: false
};

/**
 * Blueprint Plugin.
 * 蓝图插件。
 */
export const BlueprintPlugin: IPlugin = {
    manifest,
    runtimeModule: new BlueprintRuntimeModule()
};
