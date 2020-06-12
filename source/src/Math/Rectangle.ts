class Rectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    private _tempMat: Matrix2D;
    private _transformMat: Matrix2D;

    public get left() {
        return this.x;
    }

    public get right() {
        return this.x + this.width;
    }

    public get top() {
        return this.y;
    }

    public get bottom() {
        return this.y + this.height;
    }

    public get location() {
        return new Vector2(this.x, this.y);
    }

    public set location(value: Vector2) {
        this.x = value.x;
        this.y = value.y;
    }

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public intersects(value: Rectangle) {
        return value.left < this.right &&
            this.left < value.right &&
            value.top < this.bottom &&
            this.top < value.bottom;
    }

    public contains(value: Vector2) {
        return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
            (this.y <= value.y)) &&
            (value.y < (this.y + this.height)));
    }

    public static fromMinMax(minX: number, minY: number, maxX: number, maxY: number) {
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    public getClosestPointOnRectangleBorderToPoint(point: Point): {res: Vector2, edgeNormal: Vector2} {
        let edgeNormal = new Vector2(0, 0);

        let res = new Vector2(0, 0);
        res.x = MathHelper.clamp(point.x, this.left, this.right);
        res.y = MathHelper.clamp(point.y, this.top, this.bottom);

        if (this.contains(res)){
            let dl = res.x - this.left;
            let dr = this.right - res.x;
            let dt = res.y - this.top;
            let db = this.bottom - res.y;

            let min = MathHelper.minOf(dl, dr, dt, db);
            if (min == dt){
                res.y = this.top;
                edgeNormal.y = -1;
            } else if(min == db){
                res.y = this.bottom;
                edgeNormal.y = 1;
            } else if(min == dl){
                res.x = this.left;
                edgeNormal.x = -1;
            } else{
                res.x = this.right;
                edgeNormal.x = 1;
            }
        } else {
            if (res.x == this.left){
                edgeNormal.x = -1;
            }
            if (res.x == this.right){
                edgeNormal.x = 1;
            }
            if (res.y == this.top){
                edgeNormal.y = -1;
            }
            if (res.y == this.bottom){
                edgeNormal.y = 1;
            }
        }

        return {res: res, edgeNormal: edgeNormal};
    }

    public calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2,
        rotation: number, width: number, height: number) {
        if (rotation == 0) {
            this.x = parentPosition.x + position.x - origin.x * scale.x;
            this.y = parentPosition.y + position.y - origin.y * scale.y;
            this.width = width * scale.x;
            this.height = height * scale.y;
        } else {
            let worldPosX = parentPosition.x + position.x;
            let worldPosY = parentPosition.y + position.y;

            this._transformMat = Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y);
            this._tempMat = Matrix2D.createScale(scale.x, scale.y);
            this._transformMat = Matrix2D.multiply(this._transformMat, this._tempMat);
            this._tempMat = Matrix2D.createRotation(rotation);
            this._transformMat = Matrix2D.multiply(this._transformMat, this._tempMat);
            this._tempMat = Matrix2D.createTranslation(worldPosX, worldPosY);
            this._transformMat = Matrix2D.multiply(this._transformMat, this._tempMat);

            let topLeft = new Vector2(worldPosX, worldPosY);
            let topRight = new Vector2(worldPosX + width, worldPosY);
            let bottomLeft = new Vector2(worldPosX, worldPosY + height);
            let bottomRight = new Vector2(worldPosX + width, worldPosY + height);

            topLeft = Vector2.transform(topLeft, this._transformMat);
            topRight = Vector2.transform(topRight, this._transformMat);
            bottomLeft = Vector2.transform(bottomLeft, this._transformMat);
            bottomRight = Vector2.transform(bottomRight, this._transformMat);

            let minX = MathHelper.minOf(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
            let maxX = MathHelper.maxOf(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
            let minY = MathHelper.minOf(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
            let maxY = MathHelper.maxOf(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);

            this.location = new Vector2(minX, minY);
            this.width = maxX - minX;
            this.height = maxY - minY;
        }
    }
}