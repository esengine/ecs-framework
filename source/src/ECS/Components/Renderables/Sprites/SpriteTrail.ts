module es {
    /**
     * 包含单个跟踪实例所需数据的辅助类
     */
    class SpriteTrailInstance {
        public position: Vector2 = Vector2.zero;
        _sprite: Sprite;
        _fadeDuration: number = 0;
        _fadeDelay: number = 0;
        _elapsedTime: number = 0;
        _initialColor: Color = Color.White;
        _targetColor: Color = Color.White;
        _renderColor: Color = Color.White;

        _rotation: number = 0;
        _origin: Vector2 = Vector2.zero;
        _scale: Vector2 = Vector2.one;
        _layerDepth: number = 0;

        public spawn(position: Vector2, sprite: Sprite, fadeDuration: number, fadeDelay: number, initialColor: Color, targetColor: Color) {
            this.position = position.clone();
            this._sprite = sprite.clone();

            this._elapsedTime = 0;
            this._fadeDuration = fadeDuration;
            this._fadeDelay = fadeDelay;
            this._initialColor = initialColor.clone();
            this._targetColor = targetColor.clone();
        }

        public setSpriteRenderOptions(rotation: number, origin: Vector2, scale: Vector2, layerDepth: number) {
            this._rotation = rotation;
            this._origin = origin;
            this._scale = scale;
            this._layerDepth = layerDepth;
        }

        public update(): boolean {
            this._elapsedTime += Time.deltaTime;

            if (this._elapsedTime > this._fadeDelay && this._elapsedTime < this._fadeDuration + this._fadeDelay) {
                const t = MathHelper.map01(this._elapsedTime, 0, this._fadeDelay + this._fadeDuration);
                this._renderColor = ColorExt.lerpOut(this._initialColor, this._targetColor, t);
            } else if(this._elapsedTime >= this._fadeDuration + this._fadeDelay) {
                if (this._sprite) {
                    this._sprite.dispose();
                }
                return true;
            }

            return false;
        }

        public render(batcher: Batcher, camera: ICamera) {
            batcher.drawSprite(this._sprite, this.position, this._renderColor, this._rotation, this._origin, this._scale);
        }
    }

    /**
     * 在同一个实体上渲染和淡化一系列 Sprite 副本。 minDistanceBetweenInstances 确定添加轨迹精灵的频率
     */
    export class SpriteTrail extends RenderableComponent implements IUpdatable {
        public getbounds() {
            return this._bounds;
        }

        public get maxSpriteInstance() {
            return this._maxSpriteInstance;
        }

        public set maxSpriteInstance(value: number) {
            this.setMaxSpriteInstances(value);
        }

        /** 在产生新实例之前，精灵必须移动多远 */
        public minDistanceBetweenInstances = 30;
        /** 从初始颜色到淡入淡出的总持续时间 */
        public fadeDuration = 0.8;
        /** 开始褪色之前的延迟 */
        public fadeDelay = 0.1;
        /** 轨迹实例的初始颜色 */
        public initialColor = Color.White;
        /** 在fadeDuration 过程中将被修改的最终颜色 */
        public fadeToColor = Color.Transparent;

        _maxSpriteInstance = 15;
        _availableSpriteTrailInstances: SpriteTrailInstance[] = [];
        _liveSpriteTrailInstances: SpriteTrailInstance[] = [];
        _lastPosition: Vector2 = Vector2.zero;
        _spriteRender: SpriteRenderer;

        /** flag 为 true 时，无论距离检查如何，它将始终添加新实例 */
        _isFirstInstance: boolean = false;
        /** 如果 awaitingDisable 在组件被禁用之前允许所有实例淡出 */
        _awaitingDisable: boolean = false;

        constructor(spriteRender?: SpriteRenderer) {
            super();

            this._spriteRender = spriteRender;
        }

        public setMaxSpriteInstances(maxSpriteInstance: number) {
            // 如果我们的新值大于我们之前的计数，则实例化所需的 SpriteTrailInstances
            if (this._availableSpriteTrailInstances.length < maxSpriteInstance) {
                const newInstance = this._availableSpriteTrailInstances.length - maxSpriteInstance;
                for (let i = 0; i < newInstance; i ++)
                    this._availableSpriteTrailInstances.push(new SpriteTrailInstance());
            }

            // 如果我们的新值小于我们之前的计数，则修剪列表
            if (this._availableSpriteTrailInstances.length > maxSpriteInstance) {
                const excessInstances = maxSpriteInstance - this._availableSpriteTrailInstances.length;
                for (let i = 0; i < excessInstances; i ++)
                    this._availableSpriteTrailInstances.pop();
            }

            this._maxSpriteInstance = maxSpriteInstance;
            return this;
        }

        public setMinDistanceBetweenInstances(minDistanceBetweenInstances: number) {
            this.minDistanceBetweenInstances = minDistanceBetweenInstances;
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

        /**
         * 启用 SpriteTrail
         * @returns 
         */
        public enableSpriteTrail(): SpriteTrail {
            this._awaitingDisable = false;
            this._isFirstInstance = true;
            this.enabled = true;
            return this;
        }

        /**
         * 禁用 SpriteTrail 
         * @param completeCurrentTrail 等待当前轨迹先淡出
         */
        public disableSpriteTrail(completeCurrentTrail: boolean = true) {
            if (completeCurrentTrail) {
                this._awaitingDisable = true;
            } else {
                this.enabled = false;

                for (let i = 0; i < this._liveSpriteTrailInstances.length; i ++)
                    this._availableSpriteTrailInstances.push(this._liveSpriteTrailInstances[i]);
                this._liveSpriteTrailInstances.length = 0;
            }
        }

        public onAddedToEntity() {
            if (this._spriteRender == null)
                this._spriteRender = this.getComponent(SpriteRenderer);

            if (this._spriteRender == null) {
                this.enabled = false;
                return;
            }

            // 移动trail到sprite之后
            this.layerDepth = this._spriteRender.layerDepth + 0.001;

            // 如果 setMaxSpriteInstances 被调用，它将处理初始化 SpriteTrailInstances 所以确保我们不要做两次
            if (this._availableSpriteTrailInstances.length == 0) {
                for (let i = 0; i < this._maxSpriteInstance; i ++)
                    this._availableSpriteTrailInstances.push(new SpriteTrailInstance());
            }
        }

        public update() {
            if (this._isFirstInstance) {
                this._isFirstInstance = false;
                this.spawnInstance();
            } else {
                const distanceMoved = Math.abs(Vector2.distance(this.entity.transform.position.add(this._localOffset), this._lastPosition));
                if (distanceMoved >= this.minDistanceBetweenInstances)
                    this.spawnInstance();
            }

            let min = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            let max = new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);

            for (let i = this._liveSpriteTrailInstances.length - 1; i >= 0; i --) {
                const spriteTrailInstance = this._liveSpriteTrailInstances[i];
                if (spriteTrailInstance.update()) {
                    this._availableSpriteTrailInstances.push(spriteTrailInstance);
                    this._liveSpriteTrailInstances.splice(i, 1);
                } else {
                    min = Vector2.min(min, spriteTrailInstance.position);
                    max = Vector2.max(max, spriteTrailInstance.position);
                }
            }

            this._bounds.location = min;
            this._bounds.width = max.x - min.x;
            this._bounds.height = max.y - min.y;
            this._bounds.inflate(this._spriteRender.getwidth(), this._spriteRender.getheight());

            if (this._awaitingDisable && this._liveSpriteTrailInstances.length == 0)
                this.enabled = false;
        }

        /**
         * 存储距离计算的最后一个位置，如果堆栈中有可用的，则生成一个新的轨迹实例
         * @returns 
         */
        spawnInstance() {
            this._lastPosition = this._spriteRender.entity.transform.position.add(this._spriteRender.localOffset);

            if (this._awaitingDisable || this._availableSpriteTrailInstances.length == 0)
                return;

            const instance = this._availableSpriteTrailInstances.pop();
            instance.spawn(this._lastPosition, this._spriteRender.sprite, this.fadeDuration, this.fadeDelay, this.initialColor, this.fadeToColor);
            instance.setSpriteRenderOptions(this._spriteRender.entity.transform.rotationDegrees, this._spriteRender.origin,
                this._spriteRender.entity.transform.scale, this.renderLayer);
            this._liveSpriteTrailInstances.push(instance);
        }

        public render(batcher: Batcher, camera: ICamera): void {
            for (let i = 0; i < this._liveSpriteTrailInstances.length; i ++)
                this._liveSpriteTrailInstances[i].render(batcher, camera);
        }
    }
}