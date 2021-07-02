module es {
    export class LineSegments extends Composite {
        constructor(vertices: Vector2[], stiffness: number) {
            super();

            for (let i = 0; i < vertices.length; i ++) {
                const p = new Particle(vertices[i]);
                this.addParticle(p);

                if (i > 0)
                    this.addConstraint(new DistanceConstraint(this.particles[i], this.particles[i - 1], stiffness));
            }
        }

        public pinParticleAtIndex(index: number): LineSegments {
            this.particles[index].pin();
            return this;
        }
    }
}