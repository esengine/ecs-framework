module es {
    export class Ragdoll extends Composite {
        constructor(x: number, y: number, bodyHeight: number) {
            super();

            const headLength = bodyHeight / 7.5;
            const head = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            head.radius = headLength * 0.75;
            head.mass = 4;
            const shoulder = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            shoulder.mass = 26;
            this.addConstraint(new DistanceConstraint(head, shoulder, 1, 5 / 4 * headLength));

            const elbowLeft = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            const elbowRight = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            elbowLeft.mass = 2;
            elbowRight.mass = 2;
            this.addConstraint(new DistanceConstraint(elbowLeft, shoulder, 1, headLength * 3 / 2));
            this.addConstraint(new DistanceConstraint(elbowRight, shoulder, 1, headLength * 3 / 2));

            const handLeft = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            const handRight = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            handLeft.mass = 2;
            handRight.mass = 2;
            this.addConstraint(new DistanceConstraint(handLeft, elbowLeft, 1, headLength * 2));
            this.addConstraint(new DistanceConstraint(handRight, elbowRight, 1, headLength * 2));

            const pelvis = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            pelvis.mass = 15;
            this.addConstraint(new DistanceConstraint(pelvis, shoulder, 0.8, headLength * 3.5));

            this.addConstraint(new DistanceConstraint(pelvis, head, 0.02, bodyHeight * 2))
                .setCollidesWithColliders(false);

            const kneeLeft = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            const kneeRight = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            kneeLeft.mass = 10;
            kneeRight.mass = 10;
            this.addConstraint(new DistanceConstraint(kneeLeft, pelvis, 1, headLength * 2));
            this.addConstraint(new DistanceConstraint(kneeRight, pelvis, 1, headLength * 2));

            const footLeft = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            const footRight = this.addParticle(new Particle({ x: x + RandomUtils.randint(-5, 5), y: y + RandomUtils.randint(-5, 5) }));
            footLeft.mass = 5;
            footRight.mass = 5;
            this.addConstraint(new DistanceConstraint(footLeft, kneeLeft, 1, headLength * 2));
            this.addConstraint(new DistanceConstraint(footRight, kneeRight, 1, headLength * 2));

            this.addConstraint(new DistanceConstraint(footLeft, shoulder, 0.001, bodyHeight * 2))
                .setCollidesWithColliders(false);
            this.addConstraint(new DistanceConstraint(footLeft, shoulder, 0.001, bodyHeight * 2))
                .setCollidesWithColliders(false);
        }
    }
}