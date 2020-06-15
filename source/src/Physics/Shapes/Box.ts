///<reference path="./Polygon.ts" />
class Box extends Polygon {
    public width: number;
    public height: number;

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