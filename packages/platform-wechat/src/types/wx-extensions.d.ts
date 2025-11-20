/**
 * 微信小游戏类型定义扩展
 * 补充官方类型定义包缺失的 API
 */

declare namespace WechatMinigame {
    interface Wx {
        /**
         * 判断小程序的 API，回调，参数，组件等是否在当前版本可用
         * @param schema 使用 ${API}.${method}.${param}.${option} 或者 ${component}.${attribute}.${option} 方式来调用
         * @returns 当前版本是否可用
         *
         * @example
         * ```typescript
         * // 对象的属性或方法
         * wx.canIUse('console.log')
         * wx.canIUse('CameraContext.onCameraFrame')
         *
         * // wx接口参数、回调或者返回值
         * wx.canIUse('openBluetoothAdapter')
         * wx.canIUse('getSystemInfoSync.return.safeArea.left')
         * wx.canIUse('showToast.object.image')
         * ```
         */
        canIUse(schema: string): boolean;
    }
}
