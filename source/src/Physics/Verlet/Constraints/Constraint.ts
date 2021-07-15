module es {
    export abstract class Constraint {
        public composite: Composite;
        public collidesWithColliders: boolean = true;

        public abstract solve(): void;

        public handleCollisions(collidesWithLayers: number) {

        }

        public debugRender(batcher: IBatcher) {
            
        }
    }
}