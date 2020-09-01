///<reference path="RenderableComponent.ts"/>
module es {
    /**
     * 可用于创建简单网格的基本类
     */
    export class Mesh extends RenderableComponent {
        public displayObject: egret.Mesh = new egret.Mesh();
        public get bounds(){
            if (this._areBoundsDirty){
                this._bounds.calculateBounds(Vector2.add(this.entity.transform.position, this._topLeftVertPosition), Vector2.zero,
                    Vector2.zero, this.entity.transform.scale, this.entity.transform.rotation, this._width, this._height);
                this._areBoundsDirty = false;
            }

            return this._bounds;
        }

        public _primitiveCount: number = 0;
        public _topLeftVertPosition: Vector2;
        public _width: number = 0;
        public _height: number = 0;
        public _triangles: number[] = [];
        public _verts: VertexPositionColorTexture[] = [];

        /**
         * 重新计算边界和可选地设置uv。设置uv以最适合的方式映射纹理。
         * @param recalculateUVs
         */
        public recalculateBounds(recalculateUVs: boolean){
            this._topLeftVertPosition = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            let max = new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);

            for (let i = 0; i < this._verts.length; i ++){
                this._topLeftVertPosition.x = Math.min(this._topLeftVertPosition.x, this._verts[i].position.x);
                this._topLeftVertPosition.y = Math.min(this._topLeftVertPosition.y, this._verts[i].position.y);
                max.x = Math.max(max.x, this._verts[i].position.x);
                max.y = Math.max(max.y, this._verts[i].position.y);
            }

            this._width = max.x - this._topLeftVertPosition.x;
            this._height = max.y - this._topLeftVertPosition.y;

            // 如果需要处理uv
            if (recalculateUVs){
                for (let i = 0; i < this._verts.length; i ++){
                    this._verts[i].textureCoordinate.x = (this._verts[i].position.x - this._topLeftVertPosition.x) / this._width;
                    this._verts[i].textureCoordinate.y = (this._verts[i].position.y - this._topLeftVertPosition.y) / this._height;
                }
            }

            return this;
        }

        /**
         * 设置纹理。传入null来取消纹理设置。
         * @param texture
         */
        public setTexture(texture: egret.Texture): Mesh{
            this.displayObject.texture = texture;
            return this;
        }

        /**
         * 设置vert位置。如果position数组与vert数组大小不匹配，则将重新创建vert数组。
         * @param positions
         */
        public setVertPositions(positions: Vector2[]){
            if (this._verts == undefined || this._verts.length != positions.length){
                this._verts = new Array(positions.length);
                this._verts.fill(new VertexPositionColorTexture(), 0, positions.length);
            }

            for (let i = 0; i < this._verts.length; i ++){
                this._verts[i].position = positions[i];
            }
            return this;
        }

        /**
         * 设置渲染的三角形索引
         * @param triangles
         */
        public setTriangles(triangles: number[]){
            if (triangles.length % 3 != 0){
                console.error("三角形必须是3的倍数");
                return;
            }

            this._primitiveCount = triangles.length / 3;
            this._triangles = triangles;
            return this;
        }

        public render(camera: es.Camera) {
            let renderNode = this.displayObject.$renderNode as egret.sys.MeshNode;
            renderNode.imageWidth = this._width;
            renderNode.imageHeight = this._height;
            renderNode.vertices = this._triangles;
        }
    }

    export class VertexPositionColorTexture {
        public position: Vector2;
        public textureCoordinate: Vector2;
    }
}