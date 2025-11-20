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
