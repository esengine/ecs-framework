module es {
    export class Screen {
        public static width: number;
        public static height: number;

        public static get size(): Vector2 {
            return new Vector2(this.width, this.height);
        }

        public static get center(): Vector2 {
            return new Vector2(this.width / 2, this.height / 2);
        }
    }
}