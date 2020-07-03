class SpriteAnimation {
    public readonly sprites: Sprite[];
    public readonly frameRate: number;

    constructor(sprites: Sprite[], frameRate: number){
        this.sprites = sprites;
        this.frameRate = frameRate;
    }
}