///<reference path="./Polygon.ts" />
class Box extends Polygon {
    public width: number;
    public height: number;

    constructor(width: number, height: number){
        super(Box.buildBox(width, height), true);
        this.width = width;
        this.height = height;
    }

    private static buildBox(width: number, height: number): Vector2[]{
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let verts = new Array(4);
        verts[0] = new Vector2(-halfWidth, -halfHeight);
        verts[1] = new Vector2(halfWidth, -halfHeight);
        verts[2] = new Vector2(halfWidth, halfHeight);
        verts[3] = new Vector2(-halfWidth, halfHeight);

        return verts;
    }

    /**
     * 
     * @param other 
     */
    public collidesWithShape(other: Shape){
        if (this.isUnrotated && other instanceof Box && other.isUnrotated){
            return ShapeCollisions.boxToBox(this, other);
        }

        // TODO: 让 minkowski 运行于 cricleToBox

        return super.collidesWithShape(other);
    }

    public updateBox(width: number, height: number){
        this.width = width;
        this.height = height;

        let halfWidth = width / 2;
        let halfHeight = height / 2;

        this.points[0] = new Vector2(-halfWidth, -halfHeight);
        this.points[1] = new Vector2(halfWidth, -halfHeight);
        this.points[2] = new Vector2(halfWidth, halfHeight);
        this.points[3] = new Vector2(-halfWidth, halfHeight);

        for (let i = 0; i < this.points.length; i ++)
            this._originalPoints[i] = this.points[i];
    }

    public containsPoint(point: Vector2){
        if (this.isUnrotated)
            return this.bounds.contains(point);

        return super.containsPoint(point);
    }
}