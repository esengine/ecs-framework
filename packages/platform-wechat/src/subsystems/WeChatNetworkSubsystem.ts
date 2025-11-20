/**
 * 微信小游戏网络子系统
 */

import type {
    IPlatformNetworkSubsystem,
    RequestConfig,
    RequestResponse,
    IDownloadTask,
    IUploadTask,
    IPlatformWebSocket
} from '@esengine/platform-common';
import { getWx, promisify } from '../utils';

/**
 * 微信 WebSocket 包装
 */
class WeChatWebSocket implements IPlatformWebSocket {
    private _task: WechatMinigame.SocketTask;

    constructor(task: WechatMinigame.SocketTask) {
        this._task = task;
    }

    send(data: string | ArrayBuffer): void {
        this._task.send({ data });
    }

    close(code?: number, reason?: string): void {
        this._task.close({ code, reason });
    }

    onOpen(callback: (res: { header: Record<string, string> }) => void): void {
        this._task.onOpen(callback as any);
    }

    onClose(callback: (res: { code: number; reason: string }) => void): void {
        this._task.onClose(callback as any);
    }

    onError(callback: (error: any) => void): void {
        this._task.onError(callback);
    }

    onMessage(callback: (res: { data: string | ArrayBuffer }) => void): void {
        this._task.onMessage(callback as any);
    }
}

/**
 * 微信小游戏网络子系统实现
 */
export class WeChatNetworkSubsystem implements IPlatformNetworkSubsystem {
    async request<T = any>(config: RequestConfig): Promise<RequestResponse<T>> {
        return new Promise((resolve, reject) => {
            getWx().request({
                url: config.url,
                method: config.method as any,
                data: config.data,
                header: config.header,
                timeout: config.timeout,
                dataType: config.dataType as any,
                responseType: config.responseType as any,
                success: (res) => {
                    resolve({
                        data: res.data as T,
                        statusCode: res.statusCode,
                        header: res.header as Record<string, string>
                    });
                },
                fail: reject
            });
        });
    }

    downloadFile(options: {
        url: string;
        filePath?: string;
        header?: Record<string, string>;
        timeout?: number;
    }): Promise<{ tempFilePath: string; filePath?: string; statusCode: number }> & IDownloadTask {
        const task = getWx().downloadFile({
            url: options.url,
            filePath: options.filePath,
            header: options.header,
            timeout: options.timeout,
            success: () => {},
            fail: () => {}
        });

        const promise = new Promise<{ tempFilePath: string; filePath?: string; statusCode: number }>((resolve, reject) => {
            task.onProgressUpdate(() => {});
            getWx().downloadFile({
                ...options,
                success: (res) => resolve({
                    tempFilePath: res.tempFilePath,
                    filePath: res.filePath,
                    statusCode: res.statusCode
                }),
                fail: reject
            });
        });

        return Object.assign(promise, {
            abort: () => task.abort(),
            onProgressUpdate: (callback: any) => task.onProgressUpdate(callback),
            offProgressUpdate: (callback: any) => task.offProgressUpdate(callback)
        });
    }

    uploadFile(options: {
        url: string;
        filePath: string;
        name: string;
        header?: Record<string, string>;
        formData?: Record<string, any>;
        timeout?: number;
    }): Promise<{ data: string; statusCode: number }> & IUploadTask {
        const task = getWx().uploadFile({
            url: options.url,
            filePath: options.filePath,
            name: options.name,
            header: options.header,
            formData: options.formData,
            timeout: options.timeout,
            success: () => {},
            fail: () => {}
        });

        const promise = new Promise<{ data: string; statusCode: number }>((resolve, reject) => {
            getWx().uploadFile({
                ...options,
                success: (res) => resolve({
                    data: res.data,
                    statusCode: res.statusCode
                }),
                fail: reject
            });
        });

        return Object.assign(promise, {
            abort: () => task.abort(),
            onProgressUpdate: (callback: any) => task.onProgressUpdate(callback),
            offProgressUpdate: (callback: any) => task.offProgressUpdate(callback)
        });
    }

    connectSocket(options: {
        url: string;
        header?: Record<string, string>;
        protocols?: string[];
        timeout?: number;
    }): IPlatformWebSocket {
        const task = getWx().connectSocket({
            url: options.url,
            header: options.header,
            protocols: options.protocols,
            timeout: options.timeout
        });
        return new WeChatWebSocket(task);
    }

    async getNetworkType(): Promise<'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none'> {
        const res = await promisify<{ networkType: string }>(
            getWx().getNetworkType.bind(getWx()),
            {}
        );
        return res.networkType as any;
    }

    onNetworkStatusChange(callback: (res: {
        isConnected: boolean;
        networkType: string;
    }) => void): void {
        getWx().onNetworkStatusChange(callback);
    }

    offNetworkStatusChange(callback: Function): void {
        getWx().offNetworkStatusChange(callback as any);
    }
}
