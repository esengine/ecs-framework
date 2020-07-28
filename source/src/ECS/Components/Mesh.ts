///<reference path="./RenderableComponent.ts" />
module es {
    export class Mesh extends RenderableComponent {
        private _mesh: egret.Mesh;

        constructor(){
            super();

            this._mesh = new egret.Mesh();
        }

        public setTexture(texture: egret.Texture): Mesh{
            this._mesh.texture = texture;

            return this;
        }

        public reset() {
        }

        render(camera: es.Camera) {
        }
    }
}
