/**
 * User Code System.
 * 用户代码系统。
 *
 * Provides compilation, loading, and hot-reload for user-written scripts.
 * 提供用户脚本的编译、加载和热更新功能。
 *
 * # Directory Convention | 目录约定
 *
 * ```
 * my-game/
 * ├── scripts/                    # User scripts | 用户脚本
 * │   ├── Player.ts              # Runtime code | 运行时代码
 * │   ├── Enemy.ts               # Runtime code | 运行时代码
 * │   ├── systems/               # Can organize freely | 可自由组织
 * │   │   └── MovementSystem.ts
 * │   └── editor/                # Editor-only code | 仅编辑器代码
 * │       ├── PlayerInspector.tsx
 * │       └── EnemyGizmo.tsx
 * ├── scenes/
 * ├── assets/
 * └── esengine.config.json
 * ```
 *
 * # Rules | 规则
 *
 * 1. All `.ts` files in `scripts/` (except `scripts/editor/`) are Runtime code
 *    `scripts/` 下所有 `.ts` 文件（除了 `scripts/editor/`）是运行时代码
 *
 * 2. All files in `scripts/editor/` are Editor-only code
 *    `scripts/editor/` 下所有文件是编辑器专用代码
 *
 * 3. Editor code can import Runtime code, but not vice versa
 *    编辑器代码可以导入运行时代码，但反过来不行
 *
 * 4. Editor code is tree-shaken from production builds
 *    编辑器代码会从生产构建中移除
 *
 * # Workflow | 工作流程
 *
 * ```
 * [User writes .ts files]
 *         ↓
 * [UserCodeService.scan()] - Discovers all scripts
 *         ↓
 * [UserCodeService.compile()] - Compiles to JS using esbuild
 *         ↓
 * [UserCodeService.load()] - Loads compiled module
 *         ↓
 * [registerComponents()] - Registers with ECS runtime
 * [registerEditorExtensions()] - Registers inspectors/gizmos
 *         ↓
 * [UserCodeService.watch()] - Hot reload on file changes
 * ```
 *
 * # Example User Component | 用户组件示例
 *
 * ```typescript
 * // scripts/Player.ts
 * import { Component, Serialize, Property } from '@esengine/ecs-framework';
 *
 * export class PlayerComponent extends Component {
 *     @Serialize()
 *     @Property({ label: 'Speed' })
 *     speed: number = 5;
 *
 *     @Serialize()
 *     @Property({ label: 'Health' })
 *     health: number = 100;
 * }
 * ```
 *
 * # Example User Inspector | 用户检查器示例
 *
 * ```typescript
 * // scripts/editor/PlayerInspector.tsx
 * import React from 'react';
 * import { IComponentInspector } from '@esengine/editor-core';
 * import { PlayerComponent } from '../Player';
 *
 * export class PlayerInspector implements IComponentInspector<PlayerComponent> {
 *     id = 'player-inspector';
 *     name = 'Player Inspector';
 *     targetComponents = ['PlayerComponent'];
 *     renderMode = 'append' as const;
 *
 *     canHandle(component: any): component is PlayerComponent {
 *         return component instanceof PlayerComponent;
 *     }
 *
 *     render(context) {
 *         return <div>Custom player UI here</div>;
 *     }
 * }
 * ```
 */

export type {
    IUserCodeService,
    UserScriptInfo,
    UserCodeCompileOptions,
    UserCodeCompileResult,
    CompileError,
    UserCodeModule,
    HotReloadEvent,
    IHotReloadStatus,
    IHotReloadOptions
} from './IUserCodeService';

export {
    UserCodeTarget,
    SCRIPTS_DIR,
    EDITOR_SCRIPTS_DIR,
    USER_CODE_OUTPUT_DIR,
    EHotReloadPhase
} from './IUserCodeService';

export { UserCodeService } from './UserCodeService';

export { HotReloadCoordinator } from './HotReloadCoordinator';
