///<reference path="./Composite.ts" />
module es {
    export class Ball extends Composite {
        constructor(position: Vector2, radius: number = 10) {
            super();
            this.addParticle(new Particle(position)).radius = radius;
        }
    }
}