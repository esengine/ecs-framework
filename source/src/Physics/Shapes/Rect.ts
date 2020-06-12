class Rect extends Polygon {
    public containsPoint(point: Vector2){
        if (this.isUnrotated)
            return this.bounds.contains(point);

        return super.containsPoint(point);
    }
}