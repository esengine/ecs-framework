module es {
    export class Tire extends Composite {
        constructor(origin: Vector2, radius: number, segments: number, spokeStiffness: number = 1, treadStiffness: number = 1) {
            super();

            const stride = 2 * Math.PI / segments;
            for (let i = 0; i < segments; i ++) {
                const theta = i * stride;
                this.addParticle(new Particle(new Vector2(origin.x + Math.cos(theta) * radius,
                    origin.y + Math.sin(theta) * radius)));
            }

            const centerParticle = this.addParticle(new Particle(origin));

            for (let i = 0; i < segments; i ++) {
                this.addConstraint(new DistanceConstraint(this.particles[i], this.particles[(i + 1) % segments], treadStiffness));
                this.addConstraint(new DistanceConstraint(this.particles[i], centerParticle, spokeStiffness))
                    .setCollidesWithColliders(false);
                this.addConstraint(new DistanceConstraint(this.particles[i], this.particles[(i + 5) % segments], treadStiffness));
            }
        }
    }
}