class Physics {
    private static _spatialHash: SpatialHash;

    public static readonly allLayers: number = -1;

    public static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask = -1){
        return this._spatialHash.overlapCircle(center, randius, results, layerMask);
    }

    public static boxcastBroadphase(rect: Rectangle, layerMask: number = this.allLayers){
        return this._spatialHash.aabbBroadphase(rect, null, layerMask);
    }
}