class CollisionResult {
    public minimumTranslationVector: Vector2;
    public normal: Vector2;
    public point: Vector2;

    public invertResult(){
        this.minimumTranslationVector = Vector2.negate(this.minimumTranslationVector);
        this.normal = Vector2.negate(this.normal);
    }
}