module es {
    export class TiledMapRenderer extends RenderableComponent {
        public tiledMap: TmxMap;
        public physicsLayer: Ref<number> = new Ref(1 << 0);
        /**
         * 如果空，所有层将被渲染
         */
        public layerIndicesToRender: number[];
        private toContainer: boolean = false;

        public get width() {
            return this.tiledMap.width * this.tiledMap.tileWidth;
        }

        public get height() {
            return this.tiledMap.height * this.tiledMap.tileHeight;
        }

        public collisionLayer: TmxLayer;
        public _shouldCreateColliders: boolean;
        public _colliders: Collider[];

        constructor(tiledMap: TmxMap, collisionLayerName: string = null, shouldCreateColliders: boolean = true) {
            super();
            this.tiledMap = tiledMap;
            this._shouldCreateColliders = shouldCreateColliders;
            this.displayObject = new egret.DisplayObjectContainer();

            if (collisionLayerName) {
                this.collisionLayer = tiledMap.tileLayers.find(layer => layer.name == collisionLayerName);
            }
        }

        /**
         * 将此组件设置为只渲染单层
         * @param layerName
         */
        public setLayerToRender(layerName: string) {
            this.layerIndicesToRender = [];
            this.layerIndicesToRender[0] = this.getLayerIndex(layerName);
        }

        /**
         * 设置该组件应该按名称呈现哪些层。如果你知道索引，你可以直接设置layerIndicesToRender
         * @param layerNames
         */
        public setLayersToRender(...layerNames: string[]) {
            this.layerIndicesToRender = [];
            for (let i = 0; i < layerNames.length; i++)
                this.layerIndicesToRender[i] = this.getLayerIndex(layerNames[i]);
        }

        private getLayerIndex(layerName: string) {
            let index = 0;
            let layerType = this.tiledMap.getLayer(layerName);
            for (let layer in this.tiledMap.layers) {
                if (this.tiledMap.layers.hasOwnProperty(layer) &&
                    this.tiledMap.layers[layer] == layerType) {
                    return index;
                }
            }

            return -1;
        }

        public getRowAtWorldPosition(yPos: number): number {
            yPos -= this.entity.transform.position.y + this._localOffset.y;
            return this.tiledMap.worldToTilePositionY(yPos);
        }

        public getColumnAtWorldPosition(xPos: number): number {
            xPos -= this.entity.transform.position.x + this._localOffset.x;
            return this.tiledMap.worldToTilePositionX(xPos);
        }

        public onEntityTransformChanged(comp: transform.Component) {
            // 这里我们只处理位置变化。平铺地图不能缩放
            if (this._shouldCreateColliders && comp == transform.Component.position) {
                this.removeColliders();
                this.addColliders();
            }
        }

        public onAddedToEntity() {
            this.addColliders();
        }

        public onRemovedFromEntity() {
            this.removeColliders();
        }

        public update() {
            this.tiledMap.update();
        }

        public render(camera: es.Camera) {
            this.sync(camera);

            if (!this.layerIndicesToRender) {
                TiledRendering.renderMap(this.tiledMap, !this.toContainer ? this.displayObject as egret.DisplayObjectContainer : null, Vector2.add(this.entity.transform.position, this._localOffset),
                    this.transform.scale, this.renderLayer);
            } else {
                for (let i = 0; i < this.tiledMap.layers.length; i++) {
                    if (this.tiledMap.layers[i].visible && this.layerIndicesToRender.contains(i))
                        TiledRendering.renderLayerRenderCamera(this.tiledMap.layers[i] as TmxLayer, !this.toContainer ? this.displayObject as egret.DisplayObjectContainer : null, Vector2.add(this.entity.transform.position, this._localOffset),
                            this.transform.scale, this.renderLayer, camera.bounds);
                }
            }

            if (!this.toContainer){
                this.displayObject.cacheAsBitmap = true;
                this.toContainer = true;
            }
        }

        public addColliders() {
            if (!this.collisionLayer || !this._shouldCreateColliders)
                return;

            // 获取冲突层及其冲突的矩形
            let collisionRects = this.collisionLayer.getCollisionRectangles();

            // 为我们收到的矩形创建碰撞器
            this._colliders = [];
            for (let i = 0; i < collisionRects.length; i++) {
                let collider = new BoxCollider(collisionRects[i].x + this._localOffset.x,
                    collisionRects[i].y + this._localOffset.y, collisionRects[i].width, collisionRects[i].height);
                collider.physicsLayer = this.physicsLayer;
                collider.entity = this.entity;
                this._colliders[i] = collider;

                Physics.addCollider(collider);
            }
        }

        public removeColliders() {
            if (this._colliders == null)
                return;

            for (let collider of this._colliders) {
                Physics.removeCollider(collider);
            }
            this._colliders = null;
        }
    }
}