///<reference path="../../Shapes/Polygon.ts"/>
class DistanceConstraint extends Constraint {
    public stiffness: number = 0;
    public restingDistance: number = 0;
    public tearSensitivity = Number.POSITIVE_INFINITY;

    private _particleOne: Particle;
    private _particleTwo: Particle;
    private static _polygon = new Polygon(2, 1);

    constructor(first: Particle, second: Particle, stiffness: number, distance = -1){
        super();

        this._particleOne = first;
        this._particleTwo = second;
        this.stiffness = stiffness;

        if (distance > -1){
            this.restingDistance = distance;
        }else{
            this.restingDistance = Vector2.distance(first.position, second.position);
        }
    }

    public setCollidesWithColliders(collidesWithColliders: boolean){
        this.collidesWithColliders = collidesWithColliders;
        return this;
    }

    public handleCollisions(collidersWithLayers){
        let minX = Math.min(this._particleOne.position.x, this._particleTwo.position.x);
        let maxX = Math.max(this._particleOne.position.x, this._particleTwo.position.x);
        let minY = Math.min(this._particleOne.position.y, this._particleTwo.position.y);
        let maxY = Math.max(this._particleOne.position.y, this._particleTwo.position.y);
        // DistanceConstraint._polygon.bounds = Rectangle.
    }

    public solve() {
        let diff = Vector2.subtract(this._particleOne.position, this._particleTwo.position);
        let d = diff.length();

        let difference = (this.restingDistance - d) / d;

        if (d / this.restingDistance > this.tearSensitivity){
            this.composite.removeConstraint(this);
            return;
        }

        let im1 = 1 / this._particleOne.mass;
        let im2 = 1 / this._particleTwo.mass;
        let scalarP1 = (im1 / (im1 + im2)) * this.stiffness;
        let scalarP2 = this.stiffness - scalarP1;

        this._particleOne.position = Vector2.add(this._particleOne.position, Vector2.multiply(diff, new Vector2(scalarP1 * difference, scalarP1 * difference)));
        this._particleTwo.position = Vector2.subtract(this._particleTwo.position, Vector2.multiply(diff, new Vector2(scalarP2 * difference, scalarP2 * difference)))
    }

    public debugRender(graphics: egret.Graphics){
        graphics.lineStyle(1, DebugDefaults.verletConstraintEdge);
        graphics.lineTo(this._particleOne.position.x, this._particleOne.position.y);
        graphics.lineTo(this._particleTwo.position.x, this._particleTwo.position.y);
        graphics.endFill();
    }
}