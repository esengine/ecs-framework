module es {
    export class SpriteAnimation {
        public readonly sprites: Sprite[];
        public readonly frameRate: number;

        constructor(sprites: Sprite[], frameRate: number = 10) {
            this.sprites = sprites;
            this.frameRate = frameRate;
        }
    }
}