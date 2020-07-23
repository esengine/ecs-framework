module es {
    export class CollisionResult {
        public collider: Collider;
        public minimumTranslationVector: Vector2 = Vector2.zero;
        public normal: Vector2 = Vector2.zero;
        public point: Vector2 = Vector2.zero;

        public invertResult(){
            this.minimumTranslationVector = Vector2.negate(this.minimumTranslationVector);
            this.normal = Vector2.negate(this.normal);
        }
    }
}
