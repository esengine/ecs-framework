/**
 * 微信小游戏 Canvas 子系统
 */

import type {
    IPlatformCanvasSubsystem,
    IPlatformCanvas,
    IPlatformImage,
    TempFilePathOptions,
    CanvasContextAttributes
} from '@esengine/platform-common';
import { getWx } from '../utils';

/**
 * 微信小游戏 Canvas 包装
 */
class WeChatCanvas implements IPlatformCanvas {
    private _canvas: WechatMinigame.Canvas;

    constructor(canvas: WechatMinigame.Canvas) {
        this._canvas = canvas;
    }

    get width(): number {
        return this._canvas.width;
    }

    set width(value: number) {
        this._canvas.width = value;
    }

    get height(): number {
        return this._canvas.height;
    }

    set height(value: number) {
        this._canvas.height = value;
    }

    getContext(
        contextType: '2d' | 'webgl' | 'webgl2',
        contextAttributes?: CanvasContextAttributes
    ): RenderingContext | null {
        const wxAttributes: WechatMinigame.ContextAttributes | undefined = contextAttributes ? {
            alpha: typeof contextAttributes.alpha === 'boolean'
                ? (contextAttributes.alpha ? 1 : 0)
                : contextAttributes.alpha,
            antialias: contextAttributes.antialias,
            preserveDrawingBuffer: contextAttributes.preserveDrawingBuffer,
            antialiasSamples: contextAttributes.antialiasSamples
        } : undefined;
        return this._canvas.getContext(contextType, wxAttributes);
    }

    toDataURL(): string {
        return this._canvas.toDataURL();
    }

    toTempFilePath(options: TempFilePathOptions): void {
        this._canvas.toTempFilePath({
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height,
            destWidth: options.destWidth,
            destHeight: options.destHeight,
            fileType: options.fileType,
            quality: options.quality,
            success: options.success,
            fail: options.fail,
            complete: options.complete
        });
    }

    /**
     * 获取原始微信 Canvas 对象
     */
    getNativeCanvas(): WechatMinigame.Canvas {
        return this._canvas;
    }
}

/**
 * 微信小游戏 Image 包装
 */
class WeChatImage implements IPlatformImage {
    private _image: WechatMinigame.Image;

    constructor(image: WechatMinigame.Image) {
        this._image = image;
    }

    get src(): string {
        return this._image.src;
    }

    set src(value: string) {
        this._image.src = value;
    }

    get width(): number {
        return this._image.width;
    }

    get height(): number {
        return this._image.height;
    }

    get onload(): (() => void) | null {
        return this._image.onload as (() => void) | null;
    }

    set onload(value: (() => void) | null) {
        this._image.onload = value as any;
    }

    get onerror(): ((error: any) => void) | null {
        return this._image.onerror as ((error: any) => void) | null;
    }

    set onerror(value: ((error: any) => void) | null) {
        this._image.onerror = value as any;
    }

    /**
     * 获取原始微信 Image 对象
     */
    getNativeImage(): WechatMinigame.Image {
        return this._image;
    }
}

/**
 * 微信小游戏 Canvas 子系统实现
 */
export class WeChatCanvasSubsystem implements IPlatformCanvasSubsystem {
    private _mainCanvas: WeChatCanvas | null = null;
    private _windowInfo: WechatMinigame.WindowInfo;

    constructor() {
        this._windowInfo = getWx().getWindowInfo();
    }

    createCanvas(width?: number, height?: number): IPlatformCanvas {
        const canvas = getWx().createCanvas();

        // 设置尺寸
        if (width !== undefined) {
            canvas.width = width;
        }
        if (height !== undefined) {
            canvas.height = height;
        }

        const wrappedCanvas = new WeChatCanvas(canvas);

        // 首次创建的是主 Canvas
        if (!this._mainCanvas) {
            this._mainCanvas = wrappedCanvas;
        }

        return wrappedCanvas;
    }

    createImage(): IPlatformImage {
        const image = getWx().createImage();
        return new WeChatImage(image);
    }

    createImageData(width: number, height: number): ImageData {
        // 微信小游戏 3.4.10+ 支持 createImageData
        if (typeof getWx().createImageData === 'function') {
            return getWx().createImageData(width, height) as unknown as ImageData;
        }

        // 降级方案：创建标准 ImageData
        const data = new Uint8ClampedArray(width * height * 4);
        return {
            data,
            width,
            height,
            colorSpace: 'srgb'
        } as ImageData;
    }

    getScreenWidth(): number {
        return this._windowInfo.screenWidth;
    }

    getScreenHeight(): number {
        return this._windowInfo.screenHeight;
    }

    getDevicePixelRatio(): number {
        return this._windowInfo.pixelRatio;
    }

    getMainCanvas(): IPlatformCanvas | null {
        return this._mainCanvas;
    }

    getWindowWidth(): number {
        return this._windowInfo.windowWidth;
    }

    getWindowHeight(): number {
        return this._windowInfo.windowHeight;
    }
}
