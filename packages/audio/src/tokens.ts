/**
 * Audio Module Service Tokens
 * 音频模块服务令牌
 *
 * 遵循"谁定义接口，谁导出 Token"原则。
 * Following "who defines interface, who exports Token" principle.
 *
 * 当前模块仅提供组件，暂无服务定义。
 * 此文件预留用于未来可能添加的 AudioManager 服务。
 *
 * Currently this module only provides components, no services defined yet.
 * This file is reserved for potential future AudioManager service.
 */

// import { createServiceToken } from '@esengine/ecs-framework';

// ============================================================================
// Reserved for future service tokens
// 预留用于未来的服务令牌
// ============================================================================

// export interface IAudioManager {
//     // 播放音效 | Play sound effect
//     playSound(path: string): void;
//     // 播放背景音乐 | Play background music
//     playMusic(path: string): void;
//     // 停止所有音频 | Stop all audio
//     stopAll(): void;
// }

// export const AudioManagerToken = createServiceToken<IAudioManager>('audioManager');
