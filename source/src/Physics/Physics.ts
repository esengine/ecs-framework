class Physics {
    private static _spatialHash: SpatialHash;
    /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
    public static spatialHashCellSize = 100;

    public static readonly allLayers: number = -1;

    public static reset(){
        this._spatialHash = new SpatialHash(this.spatialHashCellSize);
    }

    public static clear(){
        this._spatialHash.clear();
    }

    public static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask = -1){
        return this._spatialHash.overlapCircle(center, randius, results, layerMask);
    }

    public static boxcastBroadphase(rect: Rectangle, layerMask: number = this.allLayers){
        return this._spatialHash.aabbBroadphase(rect, null, layerMask);
    }

    public static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask = this.allLayers){
        return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
    }

    public static addCollider(collider: Collider){
        Physics._spatialHash.register(collider);
    }

    public static removeCollider(collider: Collider){
        Physics._spatialHash.remove(collider);
    }

    public static updateCollider(collider: Collider){
        this._spatialHash.remove(collider);
        this._spatialHash.register(collider);
    }
}