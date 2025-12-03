/**
 * 平台 polyfills
 *
 * 提供跨平台兼容性支持，用于填补不同平台的 API 差异
 */

export {
    TextDecoderPolyfill,
    installTextDecoderPolyfill,
    isTextDecoderAvailable
} from './TextDecoderPolyfill';

export {
    TextEncoderPolyfill,
    installTextEncoderPolyfill,
    isTextEncoderAvailable
} from './TextEncoderPolyfill';

import { installTextDecoderPolyfill } from './TextDecoderPolyfill';
import { installTextEncoderPolyfill } from './TextEncoderPolyfill';

/**
 * 安装当前平台所需的所有 polyfills
 *
 * @returns 已安装的 polyfill 列表
 */
export function installAllPolyfills(): { installed: string[] } {
    const installed: string[] = [];

    if (installTextDecoderPolyfill()) {
        installed.push('TextDecoder');
    }

    if (installTextEncoderPolyfill()) {
        installed.push('TextEncoder');
    }

    return { installed };
}

/**
 * 检查当前平台需要哪些 polyfills
 *
 * @returns 需要的 polyfill 名称列表
 */
export function getRequiredPolyfills(): string[] {
    const required: string[] = [];

    if (typeof globalThis.TextDecoder === 'undefined') {
        required.push('TextDecoder');
    }

    if (typeof globalThis.TextEncoder === 'undefined') {
        required.push('TextEncoder');
    }

    return required;
}
