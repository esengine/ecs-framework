/**
 * 平台子系统接口定义
 * 将平台能力分解为独立的子系统，支持按需实现和代码裁剪
 */

// ============================================================================
// Canvas/渲染子系统
// ============================================================================

/**
 * 平台 Canvas 对象抽象
 */
/**
 * Canvas 上下文属性（兼容 Web 和小游戏平台）
 */
export interface CanvasContextAttributes {
    alpha?: boolean | number;
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    failIfMajorPerformanceCaveat?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    antialiasSamples?: number;
}

export interface IPlatformCanvas {
    width: number;
    height: number;
    getContext(contextType: '2d' | 'webgl' | 'webgl2', contextAttributes?: CanvasContextAttributes): RenderingContext | null;
    toDataURL(): string;
    toTempFilePath?(options: TempFilePathOptions): void;
}

/**
 * 平台 Image 对象抽象
 */
export interface IPlatformImage {
    src: string;
    width: number;
    height: number;
    onload: (() => void) | null;
    onerror: ((error: any) => void) | null;
}

/**
 * 临时文件路径选项
 */
export interface TempFilePathOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    destWidth?: number;
    destHeight?: number;
    fileType?: 'png' | 'jpg';
    quality?: number;
    success?: (res: { tempFilePath: string }) => void;
    fail?: (error: any) => void;
    complete?: () => void;
}

/**
 * Canvas 子系统接口
 */
export interface IPlatformCanvasSubsystem {
    /**
     * 创建主 Canvas（首次调用）或离屏 Canvas
     */
    createCanvas(width?: number, height?: number): IPlatformCanvas;

    /**
     * 创建图片对象
     */
    createImage(): IPlatformImage;

    /**
     * 创建 ImageData
     */
    createImageData?(width: number, height: number): ImageData;

    /**
     * 获取屏幕宽度
     */
    getScreenWidth(): number;

    /**
     * 获取屏幕高度
     */
    getScreenHeight(): number;

    /**
     * 获取设备像素比
     */
    getDevicePixelRatio(): number;
}

// ============================================================================
// 音频子系统
// ============================================================================

/**
 * 平台音频上下文抽象
 */
export interface IPlatformAudioContext {
    src: string;
    autoplay: boolean;
    loop: boolean;
    volume: number;
    duration: number;
    currentTime: number;
    paused: boolean;
    buffered: number;

    play(): void;
    pause(): void;
    stop(): void;
    seek(position: number): void;
    destroy(): void;

    onPlay(callback: () => void): void;
    onPause(callback: () => void): void;
    onStop(callback: () => void): void;
    onEnded(callback: () => void): void;
    onError(callback: (error: { errCode: number; errMsg: string }) => void): void;
    onTimeUpdate(callback: () => void): void;
    onCanplay(callback: () => void): void;
    onSeeking(callback: () => void): void;
    onSeeked(callback: () => void): void;

    offPlay(callback: () => void): void;
    offPause(callback: () => void): void;
    offStop(callback: () => void): void;
    offEnded(callback: () => void): void;
    offError(callback: (error: { errCode: number; errMsg: string }) => void): void;
    offTimeUpdate(callback: () => void): void;
}

/**
 * 音频子系统接口
 */
export interface IPlatformAudioSubsystem {
    /**
     * 创建音频上下文
     */
    createAudioContext(options?: { useWebAudioImplement?: boolean }): IPlatformAudioContext;

    /**
     * 获取支持的音频格式
     */
    getSupportedFormats(): string[];

    /**
     * 设置静音模式下是否可以播放音频
     */
    setInnerAudioOption?(options: {
        mixWithOther?: boolean;
        obeyMuteSwitch?: boolean;
        speakerOn?: boolean;
    }): Promise<void>;
}

// ============================================================================
// 存储子系统
// ============================================================================

/**
 * 存储信息
 */
export interface StorageInfo {
    keys: string[];
    currentSize: number;
    limitSize: number;
}

/**
 * 存储子系统接口
 */
export interface IPlatformStorageSubsystem {
    /**
     * 同步获取存储
     */
    getStorageSync<T = any>(key: string): T | undefined;

    /**
     * 同步设置存储
     */
    setStorageSync<T = any>(key: string, value: T): void;

    /**
     * 同步移除存储
     */
    removeStorageSync(key: string): void;

    /**
     * 同步清空存储
     */
    clearStorageSync(): void;

    /**
     * 获取存储信息
     */
    getStorageInfoSync(): StorageInfo;

    /**
     * 异步获取存储
     */
    getStorage<T = any>(key: string): Promise<T | undefined>;

    /**
     * 异步设置存储
     */
    setStorage<T = any>(key: string, value: T): Promise<void>;

    /**
     * 异步移除存储
     */
    removeStorage(key: string): Promise<void>;

    /**
     * 异步清空存储
     */
    clearStorage(): Promise<void>;
}

// ============================================================================
// 网络子系统
// ============================================================================

/**
 * 请求配置
 */
export interface RequestConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';
    data?: any;
    header?: Record<string, string>;
    timeout?: number;
    dataType?: 'json' | 'text' | 'arraybuffer';
    responseType?: 'text' | 'arraybuffer';
}

/**
 * 请求响应
 */
export interface RequestResponse<T = any> {
    data: T;
    statusCode: number;
    header: Record<string, string>;
}

/**
 * 下载任务
 */
export interface IDownloadTask {
    abort(): void;
    onProgressUpdate(callback: (res: {
        progress: number;
        totalBytesWritten: number;
        totalBytesExpectedToWrite: number;
    }) => void): void;
    offProgressUpdate(callback: Function): void;
}

/**
 * 上传任务
 */
export interface IUploadTask {
    abort(): void;
    onProgressUpdate(callback: (res: {
        progress: number;
        totalBytesSent: number;
        totalBytesExpectedToSend: number;
    }) => void): void;
    offProgressUpdate(callback: Function): void;
}

/**
 * WebSocket 接口
 */
export interface IPlatformWebSocket {
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
    onOpen(callback: (res: { header: Record<string, string> }) => void): void;
    onClose(callback: (res: { code: number; reason: string }) => void): void;
    onError(callback: (error: any) => void): void;
    onMessage(callback: (res: { data: string | ArrayBuffer }) => void): void;
}

/**
 * 网络子系统接口
 */
export interface IPlatformNetworkSubsystem {
    /**
     * 发起请求
     */
    request<T = any>(config: RequestConfig): Promise<RequestResponse<T>>;

    /**
     * 下载文件
     */
    downloadFile(options: {
        url: string;
        filePath?: string;
        header?: Record<string, string>;
        timeout?: number;
    }): Promise<{ tempFilePath: string; filePath?: string; statusCode: number }> & IDownloadTask;

    /**
     * 上传文件
     */
    uploadFile(options: {
        url: string;
        filePath: string;
        name: string;
        header?: Record<string, string>;
        formData?: Record<string, any>;
        timeout?: number;
    }): Promise<{ data: string; statusCode: number }> & IUploadTask;

    /**
     * 创建 WebSocket 连接
     */
    connectSocket(options: {
        url: string;
        header?: Record<string, string>;
        protocols?: string[];
        timeout?: number;
    }): IPlatformWebSocket;

    /**
     * 获取网络类型
     */
    getNetworkType(): Promise<'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none'>;

    /**
     * 监听网络状态变化
     */
    onNetworkStatusChange(callback: (res: {
        isConnected: boolean;
        networkType: string;
    }) => void): void;

    /**
     * 取消监听网络状态变化
     */
    offNetworkStatusChange(callback: Function): void;
}

// ============================================================================
// 输入子系统
// ============================================================================

/**
 * 触摸点信息
 * Touch point information
 */
export interface TouchInfo {
    identifier: number;
    x: number;
    y: number;
    force?: number;
}

/**
 * 触摸事件
 * Touch event
 */
export interface TouchEvent {
    touches: TouchInfo[];
    changedTouches: TouchInfo[];
    timeStamp: number;
}

/**
 * 触摸事件处理函数
 * Touch event handler
 */
export type TouchHandler = (event: TouchEvent) => void;

/**
 * 键盘事件信息
 * Keyboard event information
 */
export interface KeyboardEventInfo {
    /** 按键代码 (如 'KeyW', 'Space', 'ArrowUp') | Key code */
    code: string;
    /** 按键值 (如 'w', ' ', 'ArrowUp') | Key value */
    key: string;
    /** Alt 键是否按下 | Alt key pressed */
    altKey: boolean;
    /** Ctrl 键是否按下 | Ctrl key pressed */
    ctrlKey: boolean;
    /** Shift 键是否按下 | Shift key pressed */
    shiftKey: boolean;
    /** Meta 键是否按下 (Windows/Command) | Meta key pressed */
    metaKey: boolean;
    /** 是否重复触发 | Is repeat */
    repeat: boolean;
    /** 时间戳 | Timestamp */
    timeStamp: number;
}

/**
 * 键盘事件处理函数
 * Keyboard event handler
 */
export type KeyboardHandler = (event: KeyboardEventInfo) => void;

/**
 * 鼠标按钮枚举
 * Mouse button enum
 */
export enum MouseButton {
    /** 左键 | Left button */
    Left = 0,
    /** 中键 | Middle button */
    Middle = 1,
    /** 右键 | Right button */
    Right = 2
}

/**
 * 鼠标事件信息
 * Mouse event information
 */
export interface MouseEventInfo {
    /** X 坐标 | X coordinate */
    x: number;
    /** Y 坐标 | Y coordinate */
    y: number;
    /** 相对上次的 X 偏移 | X movement delta */
    movementX: number;
    /** 相对上次的 Y 偏移 | Y movement delta */
    movementY: number;
    /** 按下的按钮 | Button pressed */
    button: MouseButton;
    /** 所有按下的按钮位掩码 | Buttons bitmask */
    buttons: number;
    /** Alt 键是否按下 | Alt key pressed */
    altKey: boolean;
    /** Ctrl 键是否按下 | Ctrl key pressed */
    ctrlKey: boolean;
    /** Shift 键是否按下 | Shift key pressed */
    shiftKey: boolean;
    /** Meta 键是否按下 | Meta key pressed */
    metaKey: boolean;
    /** 时间戳 | Timestamp */
    timeStamp: number;
}

/**
 * 鼠标滚轮事件信息
 * Mouse wheel event information
 */
export interface WheelEventInfo {
    /** X 坐标 | X coordinate */
    x: number;
    /** Y 坐标 | Y coordinate */
    y: number;
    /** X 轴滚动量 | Delta X */
    deltaX: number;
    /** Y 轴滚动量 | Delta Y */
    deltaY: number;
    /** Z 轴滚动量 | Delta Z */
    deltaZ: number;
    /** 时间戳 | Timestamp */
    timeStamp: number;
}

/**
 * 鼠标事件处理函数
 * Mouse event handler
 */
export type MouseHandler = (event: MouseEventInfo) => void;

/**
 * 鼠标滚轮事件处理函数
 * Mouse wheel event handler
 */
export type WheelHandler = (event: WheelEventInfo) => void;

/**
 * 输入子系统接口
 * Input subsystem interface
 */
export interface IPlatformInputSubsystem {
    // ========== 触摸事件 | Touch events ==========

    /**
     * 监听触摸开始
     * Listen for touch start
     */
    onTouchStart(handler: TouchHandler): void;

    /**
     * 监听触摸移动
     * Listen for touch move
     */
    onTouchMove(handler: TouchHandler): void;

    /**
     * 监听触摸结束
     * Listen for touch end
     */
    onTouchEnd(handler: TouchHandler): void;

    /**
     * 监听触摸取消
     * Listen for touch cancel
     */
    onTouchCancel(handler: TouchHandler): void;

    /**
     * 取消监听触摸开始
     * Stop listening for touch start
     */
    offTouchStart(handler: TouchHandler): void;

    /**
     * 取消监听触摸移动
     * Stop listening for touch move
     */
    offTouchMove(handler: TouchHandler): void;

    /**
     * 取消监听触摸结束
     * Stop listening for touch end
     */
    offTouchEnd(handler: TouchHandler): void;

    /**
     * 取消监听触摸取消
     * Stop listening for touch cancel
     */
    offTouchCancel(handler: TouchHandler): void;

    /**
     * 获取触摸点是否支持压感
     * Check if touch supports pressure
     */
    supportsPressure?(): boolean;

    // ========== 键盘事件 | Keyboard events ==========

    /**
     * 监听键盘按下
     * Listen for key down
     */
    onKeyDown?(handler: KeyboardHandler): void;

    /**
     * 监听键盘释放
     * Listen for key up
     */
    onKeyUp?(handler: KeyboardHandler): void;

    /**
     * 取消监听键盘按下
     * Stop listening for key down
     */
    offKeyDown?(handler: KeyboardHandler): void;

    /**
     * 取消监听键盘释放
     * Stop listening for key up
     */
    offKeyUp?(handler: KeyboardHandler): void;

    // ========== 鼠标事件 | Mouse events ==========

    /**
     * 监听鼠标移动
     * Listen for mouse move
     */
    onMouseMove?(handler: MouseHandler): void;

    /**
     * 监听鼠标按下
     * Listen for mouse down
     */
    onMouseDown?(handler: MouseHandler): void;

    /**
     * 监听鼠标释放
     * Listen for mouse up
     */
    onMouseUp?(handler: MouseHandler): void;

    /**
     * 监听鼠标滚轮
     * Listen for mouse wheel
     */
    onWheel?(handler: WheelHandler): void;

    /**
     * 取消监听鼠标移动
     * Stop listening for mouse move
     */
    offMouseMove?(handler: MouseHandler): void;

    /**
     * 取消监听鼠标按下
     * Stop listening for mouse down
     */
    offMouseDown?(handler: MouseHandler): void;

    /**
     * 取消监听鼠标释放
     * Stop listening for mouse up
     */
    offMouseUp?(handler: MouseHandler): void;

    /**
     * 取消监听鼠标滚轮
     * Stop listening for mouse wheel
     */
    offWheel?(handler: WheelHandler): void;

    // ========== 输入能力查询 | Input capability queries ==========

    /**
     * 是否支持键盘输入
     * Check if keyboard input is supported
     */
    supportsKeyboard?(): boolean;

    /**
     * 是否支持鼠标输入
     * Check if mouse input is supported
     */
    supportsMouse?(): boolean;

    // ========== 生命周期 | Lifecycle ==========

    /**
     * 释放资源
     * Dispose resources
     */
    dispose?(): void;
}

// ============================================================================
// 文件系统子系统
// ============================================================================

/**
 * 文件信息
 */
export interface FileInfo {
    size: number;
    createTime: number;
    modifyTime?: number;
    isDirectory: boolean;
    isFile: boolean;
}

/**
 * 文件系统子系统接口
 */
export interface IPlatformFileSubsystem {
    /**
     * 读取文件
     */
    readFile(options: {
        filePath: string;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
        position?: number;
        length?: number;
    }): Promise<string | ArrayBuffer>;

    /**
     * 同步读取文件
     */
    readFileSync(
        filePath: string,
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8',
        position?: number,
        length?: number
    ): string | ArrayBuffer;

    /**
     * 写入文件
     */
    writeFile(options: {
        filePath: string;
        data: string | ArrayBuffer;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
    }): Promise<void>;

    /**
     * 同步写入文件
     */
    writeFileSync(
        filePath: string,
        data: string | ArrayBuffer,
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8'
    ): void;

    /**
     * 追加文件内容
     */
    appendFile(options: {
        filePath: string;
        data: string | ArrayBuffer;
        encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'ucs2' | 'utf-8' | 'utf8';
    }): Promise<void>;

    /**
     * 删除文件
     */
    unlink(filePath: string): Promise<void>;

    /**
     * 创建目录
     */
    mkdir(options: {
        dirPath: string;
        recursive?: boolean;
    }): Promise<void>;

    /**
     * 删除目录
     */
    rmdir(options: {
        dirPath: string;
        recursive?: boolean;
    }): Promise<void>;

    /**
     * 读取目录
     */
    readdir(dirPath: string): Promise<string[]>;

    /**
     * 获取文件信息
     */
    stat(path: string): Promise<FileInfo>;

    /**
     * 检查文件/目录是否存在
     */
    access(path: string): Promise<void>;

    /**
     * 重命名文件
     */
    rename(oldPath: string, newPath: string): Promise<void>;

    /**
     * 复制文件
     */
    copyFile(srcPath: string, destPath: string): Promise<void>;

    /**
     * 获取用户数据目录路径
     */
    getUserDataPath(): string;

    /**
     * 解压文件
     */
    unzip?(options: {
        zipFilePath: string;
        targetPath: string;
    }): Promise<void>;
}

// ============================================================================
// WASM 子系统
// ============================================================================

/**
 * WASM 模块导出
 */
export type WASMExports = Record<string, WebAssembly.ExportValue>;

/**
 * WASM 导入值类型（兼容 Web 和小游戏平台）
 */
export type WASMImportValue = WebAssembly.ExportValue | number;

/**
 * WASM 模块导入
 */
export type WASMImports = Record<string, Record<string, WASMImportValue>>;

/**
 * WASM 实例
 */
export interface IWASMInstance {
    exports: WASMExports;
}

/**
 * WASM 子系统接口
 */
export interface IPlatformWASMSubsystem {
    /**
     * 实例化 WASM 模块
     * @param path WASM 文件路径
     * @param imports 导入对象
     */
    instantiate(path: string, imports?: WASMImports): Promise<IWASMInstance>;

    /**
     * 检查是否支持 WASM
     */
    isSupported(): boolean;
}

// ============================================================================
// 系统信息
// ============================================================================

/**
 * 系统信息
 */
export interface SystemInfo {
    /** 设备品牌 */
    brand: string;
    /** 设备型号 */
    model: string;
    /** 设备像素比 */
    pixelRatio: number;
    /** 屏幕宽度 */
    screenWidth: number;
    /** 屏幕高度 */
    screenHeight: number;
    /** 可使用窗口宽度 */
    windowWidth: number;
    /** 可使用窗口高度 */
    windowHeight: number;
    /** 状态栏高度 */
    statusBarHeight: number;
    /** 操作系统及版本 */
    system: string;
    /** 客户端平台 */
    platform: 'ios' | 'android' | 'windows' | 'mac' | 'devtools';
    /** 客户端基础库版本 */
    SDKVersion: string;
    /** 设备性能等级 */
    benchmarkLevel: number;
    /** 设备内存大小 (MB) */
    memorySize?: number;
}
