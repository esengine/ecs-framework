class WebGLUtils {
    /**
     * 获取webgl context
     */
    public static getContext(){
        const canvas = document.getElementsByTagName('canvas')[0];
        return canvas.getContext('2d');
    }
}