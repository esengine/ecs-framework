/**
 * @esengine/worker-generator
 *
 * CLI tool to generate Worker files from WorkerEntitySystem classes
 * for WeChat Mini Game and other platforms that require pre-compiled Worker scripts.
 *
 * 从 WorkerEntitySystem 子类生成 Worker 文件的 CLI 工具
 * 用于微信小游戏等需要预编译 Worker 脚本的平台
 *
 * @example
 * ```bash
 * # CLI 使用 | CLI Usage
 * npx esengine-worker-gen --src ./src --out ./workers --wechat
 *
 * # 或者 | Or
 * pnpm esengine-worker-gen -s ./src -o ./workers -w
 * ```
 *
 * @example
 * ```typescript
 * // API 使用 | API Usage
 * import { parseWorkerSystems, generateWorkerFiles } from '@esengine/worker-generator';
 *
 * const systems = parseWorkerSystems({
 *     srcDir: './src',
 *     outDir: './workers',
 *     wechat: true,
 * });
 *
 * const result = generateWorkerFiles(systems, config);
 * ```
 */

export { parseWorkerSystems } from './parser';
export { generateWorkerFiles } from './generator';
export type {
    WorkerSystemInfo,
    GeneratorConfig,
    GenerationResult,
    WorkerScriptMapping,
} from './types';
