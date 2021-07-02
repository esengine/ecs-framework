module es {
    export class Particle {
        public position: Vector2;
        public lastPosition: Vector2;
        public mass = 1;
        public radius: number;
        public collidesWithColliders: boolean = true;
        public isPinned: boolean;
        public acceleration: Vector2;
        public pinnedPosition: Vector2;

        constructor(position: {x: number, y: number}) {
            this.position = new Vector2(position.x, position.y);
            this.lastPosition = new Vector2(position.x, position.y);
        }

        public applyForce(force: Vector2) {
            this.acceleration = this.acceleration.add(force.divideScaler(this.mass));
        }

        public pin(): Particle {
            this.isPinned = true;
            this.pinnedPosition = this.position;
            return this;
        }

        public pinTo(position: Vector2): Particle {
            this.isPinned = true;
            this.pinnedPosition = position;
            this.position = this.pinnedPosition;
            return this;
        }

        public unpin(): Particle {
            this.isPinned = false;
            return this;
        }
    }
}