module es {
    export class Cloth extends Composite {
        constructor(topLeftPosition: Vector2, width: number, height: number, segments: number = 20, stiffness: number = 0.25,
            tearSensitivity: number = 5, connectHorizontalParticles: boolean = true) {
            super();
            const xStride = width / segments;
            const yStride = height / segments;

            for (let y = 0; y < segments; y++) {
                for (let x = 0; x < segments; x++) {
                    const px = topLeftPosition.x + x * xStride;
                    const py = topLeftPosition.y + y + yStride;
                    const particle = this.addParticle(new Particle(new Vector2(px, py)));

                    if (connectHorizontalParticles && x > 0)
                        this.addConstraint(new DistanceConstraint(this.particles[y * segments + x],
                            this.particles[y * segments + x - 1], stiffness))
                            .setTearSensitivity(tearSensitivity)
                            .setCollidesWithColliders(false);

                    if (y > 0)
                        this.addConstraint(new DistanceConstraint(this.particles[y * segments + x],
                            this.particles[(y - 1) * segments + x], stiffness))
                            .setTearSensitivity(tearSensitivity)
                            .setCollidesWithColliders(false);

                    if (y == 0)
                        particle.pin();
                }
            }
        }
    }
}