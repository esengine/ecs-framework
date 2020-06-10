///<reference path="./Composite.ts"/>
class Box extends Composite{
    constructor(center: Vector2, width: number, height: number, borderStiffness = 0.2, diagonalStiffness = 0.5){
        super();

        let tl = this.addParticle(new Particle(Vector2.add(center, new Vector2(-width / 2, -height / 2))));
        let tr = this.addParticle(new Particle(Vector2.add(center, new Vector2(width / 2, -height / 2))));
        let br = this.addParticle(new Particle(Vector2.add(center, new Vector2(width / 2, height / 2))));
        let bl = this.addParticle(new Particle(Vector2.add(center, new Vector2(-width / 2, height / 2))));

        this.addConstraint(new DistanceConstraint(tl, tr, borderStiffness));
        this.addConstraint(new DistanceConstraint(tr, br, borderStiffness));
        this.addConstraint(new DistanceConstraint(br, bl, borderStiffness));
        this.addConstraint(new DistanceConstraint(bl, tl, borderStiffness));

        this.addConstraint(new DistanceConstraint(tl, br, diagonalStiffness)).setCollidesWithColliders(false);
        this.addConstraint(new DistanceConstraint(bl, tr, diagonalStiffness)).setCollidesWithColliders(false);
    }
}