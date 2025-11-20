/**
 * Web 平台 Canvas 子系统
 */

import type {
    IPlatformCanvasSubsystem,
    IPlatformCanvas,
    IPlatformImage,
    TempFilePathOptions,
    CanvasContextAttributes
} from '@esengine/platform-common';

/**
 * Web Canvas 包装
 */
class WebCanvas implements IPlatformCanvas {
    private _canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
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
        const attrs: WebGLContextAttributes | undefined = contextAttributes ? {
            alpha: typeof contextAttributes.alpha === 'number'
                ? contextAttributes.alpha > 0
                : contextAttributes.alpha,
            antialias: contextAttributes.antialias,
            depth: contextAttributes.depth,
            stencil: contextAttributes.stencil,
            premultipliedAlpha: contextAttributes.premultipliedAlpha,
            preserveDrawingBuffer: contextAttributes.preserveDrawingBuffer,
            failIfMajorPerformanceCaveat: contextAttributes.failIfMajorPerformanceCaveat,
            powerPreference: contextAttributes.powerPreference
        } : undefined;
        return this._canvas.getContext(contextType, attrs);
    }

    toDataURL(): string {
        return this._canvas.toDataURL();
    }

    toTempFilePath(_options: TempFilePathOptions): void {
        throw new Error('toTempFilePath is not supported on Web platform');
    }

    getNativeCanvas(): HTMLCanvasElement {
        return this._canvas;
    }
}

/**
 * Web Image 包装
 */
class WebImage implements IPlatformImage {
    private _image: HTMLImageElement;

    constructor() {
        this._image = new Image();
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
        this._image.onload = value;
    }

    get onerror(): ((error: any) => void) | null {
        return this._image.onerror as ((error: any) => void) | null;
    }

    set onerror(value: ((error: any) => void) | null) {
        this._image.onerror = value;
    }

    getNativeImage(): HTMLImageElement {
        return this._image;
    }
}

/**
 * Web 平台 Canvas 子系统实现
 */
export class WebCanvasSubsystem implements IPlatformCanvasSubsystem {
    private _mainCanvas: WebCanvas | null = null;

    createCanvas(width?: number, height?: number): IPlatformCanvas {
        const canvas = document.createElement('canvas');

        if (width !== undefined) {
            canvas.width = width;
        }
        if (height !== undefined) {
            canvas.height = height;
        }

        const wrappedCanvas = new WebCanvas(canvas);

        if (!this._mainCanvas) {
            this._mainCanvas = wrappedCanvas;
        }

        return wrappedCanvas;
    }

    createImage(): IPlatformImage {
        return new WebImage();
    }

    createImageData(width: number, height: number): ImageData {
        return new ImageData(width, height);
    }

    getScreenWidth(): number {
        return window.screen.width;
    }

    getScreenHeight(): number {
        return window.screen.height;
    }

    getDevicePixelRatio(): number {
        return window.devicePixelRatio || 1;
    }

    getMainCanvas(): IPlatformCanvas | null {
        return this._mainCanvas;
    }

    getWindowWidth(): number {
        return window.innerWidth;
    }

    getWindowHeight(): number {
        return window.innerHeight;
    }
}
