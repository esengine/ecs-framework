/**
 * 平台通用接口定义包
 * @packageDocumentation
 */

// 导出所有平台子系统接口
export type {
    // Canvas/渲染
    IPlatformCanvas,
    IPlatformImage,
    IPlatformCanvasSubsystem,
    TempFilePathOptions,
    CanvasContextAttributes,
    // 音频
    IPlatformAudioContext,
    IPlatformAudioSubsystem,
    // 存储
    IPlatformStorageSubsystem,
    StorageInfo,
    // 网络
    IPlatformNetworkSubsystem,
    RequestConfig,
    RequestResponse,
    IDownloadTask,
    IUploadTask,
    IPlatformWebSocket,
    // 输入
    IPlatformInputSubsystem,
    TouchInfo,
    TouchEvent,
    TouchHandler,
    KeyboardEventInfo,
    KeyboardHandler,
    MouseEventInfo,
    MouseHandler,
    WheelEventInfo,
    WheelHandler,
    // 文件系统
    IPlatformFileSubsystem,
    FileInfo,
    // WASM
    IPlatformWASMSubsystem,
    IWASMInstance,
    WASMExports,
    WASMImports,
    // 系统信息
    SystemInfo
} from './IPlatformSubsystems';

// 导出枚举值 | Export enum values
export { MouseButton } from './IPlatformSubsystems';

// WASM 库加载器
export {
    PlatformType,
    WasmLibraryLoaderFactory
} from './wasm';

export type {
    WasmLibraryConfig,
    PlatformInfo,
    IWasmLibraryLoader,
    IPlatformWasmLoader
} from './wasm';

// Polyfills
export {
    installTextDecoderPolyfill,
    installTextEncoderPolyfill,
    isTextDecoderAvailable,
    isTextEncoderAvailable,
    installAllPolyfills,
    getRequiredPolyfills,
    TextDecoderPolyfill,
    TextEncoderPolyfill
} from './polyfills';

/**
 * 检测是否在编辑器环境（Tauri 桌面应用）
 * Detect if running in editor environment (Tauri desktop app)
 */
export function isEditorEnvironment(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    // Tauri 桌面应用 | Tauri desktop app
    if ('__TAURI__' in window || '__TAURI_INTERNALS__' in window) {
        return true;
    }

    // 编辑器标记 | Editor marker
    if ('__ESENGINE_EDITOR__' in window) {
        return true;
    }

    return false;
}
