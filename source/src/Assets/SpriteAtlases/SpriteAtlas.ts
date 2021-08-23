module es {
    export class SpriteAtlas {
        public names: string[];
        public sprites: Sprite[];
        
        public animationNames: string[];
        public spriteAnimations: SpriteAnimation[];

        public getSprite(name: string): Sprite {
            const index = this.names.indexOf(name);
            return this.sprites[index];
        }

        public getAnimation(name: string) {
            const index = this.animationNames.indexOf(name);
            return this.spriteAnimations[index];
        }

        public dispose() {
            if (this.sprites != null) {
                this.sprites[0].texture2D.dispose();
                this.sprites = null;
            }
        }
    }
}