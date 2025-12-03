/**
 * TextEncoder polyfill
 *
 * 用于不原生支持 TextEncoder 的平台（如微信小游戏 iOS 环境）
 *
 * 支持 UTF-8 编码，包含：
 * - ASCII 字符（1字节输出）
 * - 扩展 Unicode（2-4字节输出）
 * - BMP 外字符的代理对处理
 */
class TextEncoderPolyfill {
    /**
     * 编码格式（始终为 'utf-8'）
     */
    readonly encoding: string = 'utf-8';

    /**
     * 将字符串编码为 UTF-8 字节数组
     *
     * @param input - 要编码的字符串
     * @returns UTF-8 编码的字节数组
     */
    encode(input: string = ''): Uint8Array {
        const bytes: number[] = [];

        for (let i = 0; i < input.length; i++) {
            let codePoint = input.charCodeAt(i);

            // 处理代理对（BMP 外的字符）
            if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
                // 高代理项
                if (i + 1 < input.length) {
                    const next = input.charCodeAt(i + 1);
                    if (next >= 0xDC00 && next <= 0xDFFF) {
                        // 低代理项 - 组合成完整码点
                        codePoint = 0x10000 + ((codePoint - 0xD800) << 10) + (next - 0xDC00);
                        i++; // 跳过低代理项
                    }
                }
            } else if (codePoint >= 0xDC00 && codePoint <= 0xDFFF) {
                // 孤立的低代理项 - 替换为替换字符
                codePoint = 0xFFFD;
            }

            if (codePoint < 0x80) {
                // 1字节字符（ASCII）
                bytes.push(codePoint);
            } else if (codePoint < 0x800) {
                // 2字节字符
                bytes.push(0xC0 | (codePoint >> 6));
                bytes.push(0x80 | (codePoint & 0x3F));
            } else if (codePoint < 0x10000) {
                // 3字节字符
                bytes.push(0xE0 | (codePoint >> 12));
                bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
                bytes.push(0x80 | (codePoint & 0x3F));
            } else if (codePoint <= 0x10FFFF) {
                // 4字节字符
                bytes.push(0xF0 | (codePoint >> 18));
                bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
                bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
                bytes.push(0x80 | (codePoint & 0x3F));
            } else {
                // 无效码点 - 使用替换字符
                bytes.push(0xEF, 0xBF, 0xBD); // U+FFFD 的 UTF-8 编码
            }
        }

        return new Uint8Array(bytes);
    }

    /**
     * 将字符串编码到目标缓冲区
     *
     * 尽可能多地将源字符串编码到目标缓冲区中
     *
     * @param source - 要编码的字符串
     * @param destination - 目标缓冲区
     * @returns 包含已读取字符数和已写入字节数的对象
     */
    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
        let read = 0;
        let written = 0;

        for (let i = 0; i < source.length; i++) {
            let codePoint = source.charCodeAt(i);
            let bytesNeeded: number;

            // 处理代理对
            if (codePoint >= 0xD800 && codePoint <= 0xDBFF && i + 1 < source.length) {
                const next = source.charCodeAt(i + 1);
                if (next >= 0xDC00 && next <= 0xDFFF) {
                    codePoint = 0x10000 + ((codePoint - 0xD800) << 10) + (next - 0xDC00);
                }
            }

            // 计算所需字节数
            if (codePoint < 0x80) {
                bytesNeeded = 1;
            } else if (codePoint < 0x800) {
                bytesNeeded = 2;
            } else if (codePoint < 0x10000) {
                bytesNeeded = 3;
            } else {
                bytesNeeded = 4;
            }

            // 检查是否有足够空间
            if (written + bytesNeeded > destination.length) {
                break;
            }

            // 写入字节
            if (codePoint < 0x80) {
                destination[written++] = codePoint;
            } else if (codePoint < 0x800) {
                destination[written++] = 0xC0 | (codePoint >> 6);
                destination[written++] = 0x80 | (codePoint & 0x3F);
            } else if (codePoint < 0x10000) {
                destination[written++] = 0xE0 | (codePoint >> 12);
                destination[written++] = 0x80 | ((codePoint >> 6) & 0x3F);
                destination[written++] = 0x80 | (codePoint & 0x3F);
            } else {
                destination[written++] = 0xF0 | (codePoint >> 18);
                destination[written++] = 0x80 | ((codePoint >> 12) & 0x3F);
                destination[written++] = 0x80 | ((codePoint >> 6) & 0x3F);
                destination[written++] = 0x80 | (codePoint & 0x3F);
            }

            read++;
            // 如果处理了代理对，跳过低代理项
            if (codePoint >= 0x10000) {
                read++;
                i++;
            }
        }

        return { read, written };
    }
}

/**
 * 安装 TextEncoder polyfill
 *
 * 如果当前环境不支持 TextEncoder，则安装 polyfill
 *
 * @returns 是否安装了 polyfill
 */
export function installTextEncoderPolyfill(): boolean {
    if (typeof globalThis.TextEncoder === 'undefined') {
        (globalThis as any).TextEncoder = TextEncoderPolyfill;
        console.log('[Polyfill] TextEncoder 已安装');
        return true;
    }
    return false;
}

/**
 * 检查 TextEncoder 是否可用（原生或 polyfill）
 *
 * @returns 是否可用
 */
export function isTextEncoderAvailable(): boolean {
    return typeof globalThis.TextEncoder !== 'undefined';
}

export { TextEncoderPolyfill };
