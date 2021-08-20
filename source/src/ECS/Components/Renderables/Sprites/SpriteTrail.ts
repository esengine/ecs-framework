module es {
    class SpriteTrailInstance {
        public position: Vector2;
        _sprite: Sprite;
        _fadeDuration: number;
        _fadeDelay: number;
        _elapsedTime: number;
        _initialColor: Color;
        _targetColor: Color;
        _renderColor: Color;

        _rotation: number;
        _origin: Vector2;
        _scale: Vector2;
        _layerDepth: number;

        public spawn(position: Vector2, sprite: Sprite, fadeDuration: number, fadeDelay: number, initialColor: Color, targetColor: Color) {
            this.position = position;
            this._sprite = sprite;

            this._initialColor = initialColor;
            this._elapsedTime = 0;
            
            this._fadeDuration = fadeDuration;
            this._fadeDelay = fadeDelay;
            this._initialColor = initialColor;
            this._targetColor = targetColor;
        }

        public update(): boolean {
            this._elapsedTime += Time.deltaTime;

            if (this._elapsedTime > this._fadeDelay && this._elapsedTime < this._fadeDuration + this._fadeDelay) {
                const t = MathHelper.map01(this._elapsedTime, 0, this._fadeDelay + this._fadeDuration);
                ColorExt.lerpOut(this._initialColor, this._targetColor, this._renderColor, t);
            } else if(this._elapsedTime >= this._fadeDuration + this._fadeDelay) {
                return true;
            }

            return false;
        }

        public render(batcher: Batcher, camera: Camera) {
        }
    }

    export class SpriteTrail extends RenderableComponent implements IUpdatable {
        public getbounds() {
            return this._bounds;
        }

        public get maxSpriteInstance() {
            return this._maxSpriteInstance;
        }

        public set maxSpriteInstance(value: number) {
            this.setMaxSpriteInstance(value);
        }

        public minDistanceBetweenInstance = 30;
        public fadeDuration = 0.8;
        public fadeDelay = 0.1;
        public initialColor = Color.White;
        public fadeToColor = Color.Transparent;

        _maxSpriteInstance = 15;
        _availableSpriteTrailInstance: SpriteTrailInstance[] = [];
        _liveSpriteTrailInstance: SpriteTrailInstance[] = [];
        _lastPosition: Vector2;
        _sprite: SpriteRenderer;

        _isFirstInstance: boolean;
        _awaitingDisable: boolean;

        constructor(sprite?: SpriteRenderer) {
            super();

            this._sprite = sprite;
        }

        public setMaxSpriteInstance(maxSpriteInstance: number) {
            if (this._availableSpriteTrailInstance.length < maxSpriteInstance) {
                const newInstance = this._availableSpriteTrailInstance.length - maxSpriteInstance;
                for (let i = 0; i < newInstance; i ++)
                    this._availableSpriteTrailInstance.push(new SpriteTrailInstance());
            }

            if (this._availableSpriteTrailInstance.length > maxSpriteInstance) {
                const excessInstances = maxSpriteInstance - this._availableSpriteTrailInstance.length;
                for (let i = 0; i < excessInstances; i ++)
                    this._availableSpriteTrailInstance.pop();
            }

            this._maxSpriteInstance = maxSpriteInstance;
            return this;
        }

        public setMinDistanceBetweenInstance(minDistanceBetweenInstances: number) {
            this.minDistanceBetweenInstance = minDistanceBetweenInstances;
            return this;
        }

        public setFadeDuration(fadeDuration: number) {
            this.fadeDuration = fadeDuration;
            return this;
        }

        public setFadeDelay(fadeDelay: number) {
            this.fadeDelay = fadeDelay;
            return this;
        }

        public setInitialColor(initialColor: Color) {
            this.initialColor = initialColor;
            return this;
        }

        public setFadeToColor(fadeToColor: Color) {
            this.fadeToColor = fadeToColor;
            return this;
        }

        public enableSpriteTrail(): SpriteTrail {
            this._awaitingDisable = false;
            this._isFirstInstance = true;
            this.enabled = true;
            return this;
        }

        public disableSpriteTrail(completeCurrentTrail: boolean = true) {
            if (completeCurrentTrail) {
                this._awaitingDisable = true;
            } else {
                this.enabled = false;

                for (let i = 0; i < this._liveSpriteTrailInstance.length; i ++)
                    this._availableSpriteTrailInstance.push(this._liveSpriteTrailInstance[i]);
                this._liveSpriteTrailInstance.length = 0;
            }
        }

        public onAddedToEntity() {
        }

        update() {
        }

        public render(batcher: IBatcher, camera: ICamera): void {
        }
    }
}