module es {
    /**
     * 便利的子类，有一个单一的属性，可以投递Effect，使配置更简单
     */
    export interface IMaterial {
        /**
         * Batcher为当前RenderableComponent使用的效果 
         */
        effect;
        dispose();
        onPreRender(camera: ICamera);
        compareTo(other: IMaterial): number;
        clone(): IMaterial;
    }
}