module es {
    export interface IRenderable {
        sprite: egret.Sprite;
        enabled: boolean;
        renderLayer: number;
        isVisibleFromCamera(camera: ICamera): boolean;
        render(batcher: IBatcher, camera: ICamera): void;
        debugRender(batcher: IBatcher): void;
    }
}