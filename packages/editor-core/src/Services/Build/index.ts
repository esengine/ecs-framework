/**
 * Build System.
 * 构建系统。
 *
 * Provides cross-platform project build capabilities.
 * 提供跨平台的项目构建能力。
 */

export {
    BuildPlatform,
    BuildStatus,
    type BuildProgress,
    type BuildConfig,
    type WebBuildConfig,
    type WebBuildMode,
    type InlineConfig,
    type WeChatBuildConfig,
    type BuildResult,
    type BuildStep,
    type BuildContext,
    type IBuildPipeline,
    type IBuildPipelineRegistry
} from './IBuildPipeline';

export { BuildService, type BuildTask } from './BuildService';

// Build pipelines | 构建管线
export { WebBuildPipeline, WeChatBuildPipeline, type IBuildFileSystem } from './pipelines';
