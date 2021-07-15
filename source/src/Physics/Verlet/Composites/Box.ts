///<reference path="./Composite.ts" />
module es {
    export class VerletBox extends es.Composite {
        constructor(center: es.Vector2, width: number, height: number, borderStiffness: number = 0.2, diagonalStiffness: number = 0.5) {
            super();

            const tl = this.addParticle(new Particle(center.add(new Vector2(-width / 2, -height / 2))));
            const tr = this.addParticle(new Particle(center.add(new Vector2(width / 2, -height / 2))));
            const br = this.addParticle(new Particle(center.add(new Vector2(width / 2, height / 2))));
            const bl = this.addParticle(new Particle(center.add(new Vector2(-width / 2, height / 2))));

            this.addConstraint(new DistanceConstraint(tl, tr, borderStiffness));
            this.addConstraint(new DistanceConstraint(tr, br, borderStiffness));
            this.addConstraint(new DistanceConstraint(br, bl, borderStiffness));
            this.addConstraint(new DistanceConstraint(bl, tl, borderStiffness));

            this.addConstraint(new DistanceConstraint(tl, br, diagonalStiffness))
                .setCollidesWithColliders(false);
            this.addConstraint(new DistanceConstraint(bl, tr, diagonalStiffness))
                .setCollidesWithColliders(false);
        }
    }
}