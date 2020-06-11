///<reference path="./Shape.ts" />
class Polygon extends Shape {
    public points: Vector2[];

    constructor(vertCount: number, radius: number){
        super();
        this.setPoints(Polygon.buildSymmertricalPolygon(vertCount, radius));
    }

    public setPoints(points: Vector2[]){
        this.points = points;
        this.recalculateCenterAndEdgeNormals();
    }

    public recalculateCenterAndEdgeNormals(){

    }

    public static findPolygonCenter(points: Vector2[]){
        let x = 0, y = 0;

        for (let i = 0; i < points.length; i++){
            x += points[i].x;
            y += points[i].y;
        }

        return new Vector2(x / points.length, y / points.length);
    }

    public static buildSymmertricalPolygon(vertCount: number, radius: number){
        let verts = new Vector2[vertCount];

        for (let i = 0; i < vertCount; i ++){
            let a = 2 * Math.PI * (i / vertCount);
            verts[i] = new Vector2(Math.cos(a), Math.sign(a) * radius);
        }

        return verts;
    }
}