///<reference path="./RenderableComponent.ts" />
class Mesh extends RenderableComponent {
    private _mesh: egret.Mesh;

    constructor(){
        super();

        this._mesh = new egret.Mesh();
    }

    public setTexture(texture: egret.Texture): Mesh{
        this._mesh.texture = texture;

        return this;
    }

    public onAddedToEntity(){
        this.addChild(this._mesh);
    }

    public onRemovedFromEntity(){
        this.removeChild(this._mesh);
    }

    public render(camera: Camera){
        this.x = this.entity.position.x - camera.position.x + camera.origin.x;
        this.y = this.entity.position.y - camera.position.y + camera.origin.y;
    }

    public reset() {
    }
}