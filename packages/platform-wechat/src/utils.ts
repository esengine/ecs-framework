/**
 * 微信小游戏工具函数
 */

/**
 * 获取微信全局对象
 */
export function getWx(): WechatMinigame.Wx {
    if (typeof wx === 'undefined') {
        throw new Error('当前环境不是微信小游戏环境');
    }
    return wx;
}

/**
 * 检测当前是否为微信小游戏环境
 */
export function isWeChatMiniGame(): boolean {
    try {
        if (typeof wx === 'undefined') {
            return false;
        }
        const wxObj = wx as WechatMinigame.Wx;
        return typeof wxObj.getWindowInfo === 'function' &&
               typeof wxObj.createCanvas === 'function' &&
               typeof wxObj.createImage === 'function';
    } catch {
        return false;
    }
}

/**
 * 将微信回调风格 API 转换为 Promise
 */
export function promisify<T>(
    fn: (options: any) => void,
    options: any = {}
): Promise<T> {
    return new Promise((resolve, reject) => {
        fn({
            ...options,
            success: (res: T) => resolve(res),
            fail: (err: any) => reject(err)
        });
    });
}
