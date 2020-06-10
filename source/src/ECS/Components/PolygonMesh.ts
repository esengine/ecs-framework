class PolygonMesh extends Mesh {
    constructor(points: Vector2[], arePointsCCW: boolean = true){
        super();

        let triangulator = new Triangulator();
        triangulator.triangulate(points, arePointsCCW);

        this.setVertPosition(points);
        this.setTriangles(triangulator.triangleIndices);
        this.recalculateBounds();
    }
}