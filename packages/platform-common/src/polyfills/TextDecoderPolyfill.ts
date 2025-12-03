/**
 * TextDecoder polyfill
 *
 * 用于不原生支持 TextDecoder 的平台（如微信小游戏 iOS 环境）
 *
 * 支持以下编码格式：
 * - UTF-8（包含1-4字节字符、代理对）
 * - ASCII
 * - UTF-16LE
 */
class TextDecoderPolyfill {
    /**
     * 编码格式
     */
    readonly encoding: string;

    /**
     * 是否在遇到无效序列时抛出错误
     */
    readonly fatal: boolean = false;

    /**
     * 是否忽略 BOM（字节顺序标记）
     */
    readonly ignoreBOM: boolean = false;

    /**
     * 创建 TextDecoder 实例
     *
     * @param encoding - 编码格式，默认 'utf-8'
     * @param options - 解码选项
     */
    constructor(encoding: string = 'utf-8', options?: TextDecoderOptions) {
        this.encoding = encoding.toLowerCase().replace('-', '');
        if (options?.fatal) {
            this.fatal = options.fatal;
        }
        if (options?.ignoreBOM) {
            this.ignoreBOM = options.ignoreBOM;
        }
    }

    /**
     * 将二进制数据解码为字符串
     *
     * @param input - 要解码的二进制数据
     * @param options - 解码选项
     * @returns 解码后的字符串
     */
    decode(input?: BufferSource | null, options?: TextDecodeOptions): string {
        if (!input) return '';

        const bytes = input instanceof Uint8Array
            ? input
            : input instanceof ArrayBuffer
                ? new Uint8Array(input)
                : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);

        if (this.encoding === 'utf8' || this.encoding === 'utf-8') {
            return this.decodeUTF8(bytes);
        }

        if (this.encoding === 'ascii' || this.encoding === 'usascii') {
            return this.decodeASCII(bytes);
        }

        if (this.encoding === 'utf16le' || this.encoding === 'utf-16le') {
            return this.decodeUTF16LE(bytes);
        }

        // 降级：作为 ASCII 处理
        return this.decodeASCII(bytes);
    }

    /**
     * 解码 UTF-8 数据
     *
     * @param bytes - 字节数组
     * @returns 解码后的字符串
     */
    private decodeUTF8(bytes: Uint8Array): string {
        const result: string[] = [];
        let i = 0;

        // 跳过 BOM（如果存在且不忽略）
        if (!this.ignoreBOM && bytes.length >= 3 &&
            bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
            i = 3;
        }

        while (i < bytes.length) {
            const byte1 = bytes[i++];

            if (byte1 < 0x80) {
                // 1字节字符（ASCII: 0xxxxxxx）
                result.push(String.fromCharCode(byte1));
            } else if ((byte1 & 0xE0) === 0xC0) {
                // 2字节字符（110xxxxx 10xxxxxx）
                if (i >= bytes.length) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    break;
                }
                const byte2 = bytes[i++];
                if ((byte2 & 0xC0) !== 0x80) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    i--;
                    continue;
                }
                result.push(String.fromCharCode(
                    ((byte1 & 0x1F) << 6) | (byte2 & 0x3F)
                ));
            } else if ((byte1 & 0xF0) === 0xE0) {
                // 3字节字符（1110xxxx 10xxxxxx 10xxxxxx）
                if (i + 1 >= bytes.length) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    break;
                }
                const byte2 = bytes[i++];
                const byte3 = bytes[i++];
                if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    i -= 2;
                    continue;
                }
                result.push(String.fromCharCode(
                    ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F)
                ));
            } else if ((byte1 & 0xF8) === 0xF0) {
                // 4字节字符（11110xxx 10xxxxxx 10xxxxxx 10xxxxxx）
                if (i + 2 >= bytes.length) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    break;
                }
                const byte2 = bytes[i++];
                const byte3 = bytes[i++];
                const byte4 = bytes[i++];
                if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80 || (byte4 & 0xC0) !== 0x80) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    i -= 3;
                    continue;
                }
                // 计算码点并转换为代理对
                const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) |
                    ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
                if (codePoint > 0x10FFFF) {
                    if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                    result.push('\uFFFD');
                    continue;
                }
                const surrogate = codePoint - 0x10000;
                result.push(
                    String.fromCharCode(0xD800 + (surrogate >> 10)),
                    String.fromCharCode(0xDC00 + (surrogate & 0x3FF))
                );
            } else {
                // 无效字节
                if (this.fatal) throw new TypeError('无效的 UTF-8 序列');
                result.push('\uFFFD');
            }
        }

        return result.join('');
    }

    /**
     * 解码 ASCII 数据
     *
     * @param bytes - 字节数组
     * @returns 解码后的字符串
     */
    private decodeASCII(bytes: Uint8Array): string {
        const result: string[] = [];
        for (let i = 0; i < bytes.length; i++) {
            result.push(String.fromCharCode(bytes[i] & 0x7F));
        }
        return result.join('');
    }

    /**
     * 解码 UTF-16LE 数据
     *
     * @param bytes - 字节数组
     * @returns 解码后的字符串
     */
    private decodeUTF16LE(bytes: Uint8Array): string {
        const result: string[] = [];

        // 跳过 BOM（如果存在）
        let i = 0;
        if (!this.ignoreBOM && bytes.length >= 2 &&
            bytes[0] === 0xFF && bytes[1] === 0xFE) {
            i = 2;
        }

        for (; i + 1 < bytes.length; i += 2) {
            const codeUnit = bytes[i] | (bytes[i + 1] << 8);
            result.push(String.fromCharCode(codeUnit));
        }

        return result.join('');
    }
}

/**
 * 安装 TextDecoder polyfill
 *
 * 如果当前环境不支持 TextDecoder，则安装 polyfill
 *
 * @returns 是否安装了 polyfill
 */
export function installTextDecoderPolyfill(): boolean {
    if (typeof globalThis.TextDecoder === 'undefined') {
        (globalThis as any).TextDecoder = TextDecoderPolyfill;
        console.log('[Polyfill] TextDecoder 已安装');
        return true;
    }
    return false;
}

/**
 * 检查 TextDecoder 是否可用（原生或 polyfill）
 *
 * @returns 是否可用
 */
export function isTextDecoderAvailable(): boolean {
    return typeof globalThis.TextDecoder !== 'undefined';
}

export { TextDecoderPolyfill };
