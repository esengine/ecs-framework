module es {
    export interface IRenderable {
        id: number;
        sprite: Sprite;
        enabled: boolean;
        layerDepth: number;
        renderLayer: number;
        isVisibleFromCamera(camera: ICamera): boolean;
        render(batcher: IBatcher, camera: ICamera): void;
        debugRender(batcher: IBatcher): void;
    }

    /**
     * 用于对 IRenderable 进行排序的比较器。 首先按 RenderLayer 排序，然后按 LayerDepth
     */
    export class RenderableComparer implements IComparer<IRenderable> {
        public compare(self: IRenderable, other: IRenderable): number {
            let res = other.renderLayer - self.renderLayer;
            if (res == 0) {
                res = other.layerDepth - self.layerDepth;
            }

            return res;
        }
    }
}