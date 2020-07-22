class Sprite {
    public texture2D: egret.Texture;
    public readonly sourceRect: Rectangle;
    public readonly center: Vector2;
    public origin: Vector2;
    public readonly uvs: Rectangle = new Rectangle();

    constructor(texture: egret.Texture, 
        sourceRect: Rectangle = new Rectangle(0, 0, texture.textureWidth, texture.textureHeight), 
        origin: Vector2 = sourceRect.getHalfSize()) {
        this.texture2D = texture;
        this.sourceRect = sourceRect;
        this.center = new Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
        this.origin = origin;

        let inverseTexW = 1 / texture.textureWidth;
        let inverseTexH = 1 / texture.textureHeight;

        this.uvs.x = sourceRect.x * inverseTexW;
        this.uvs.y = sourceRect.y * inverseTexH;
        this.uvs.width = sourceRect.width * inverseTexW;
        this.uvs.height = sourceRect.height * inverseTexH;
    }
}