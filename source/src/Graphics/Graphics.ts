module es {
    export class Graphics {
        public static instance: Graphics;
        public batcher: IBatcher;

        constructor() {
            this.batcher = new Batcher();
        }
    }
}