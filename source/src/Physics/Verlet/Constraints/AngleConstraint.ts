///<reference path="./Constraint.ts" />
module es {
    export class AngleConstraint extends Constraint {
        public stiffness: number;
        public angleInRadius: number;
        
        _particleA: Particle;
        _centerParticle: Particle;
        _particleC: Particle;

        constructor(a: Particle, center: Particle, c: Particle, stiffness: number) {
            super();
            this._particleA = a;
            this._centerParticle = center;
            this._particleC = c;
            this.stiffness = stiffness;

            this.collidesWithColliders = false;

            this.angleInRadius = this.angleBetweenParticles();
        }

        angleBetweenParticles(): number {
            const first = this._particleA.position.sub(this._centerParticle.position);
            const second = this._particleC.position.sub(this._centerParticle.position);

            return Math.atan2(first.x * second.y - first.y * second.x, first.x * second.x + first.y * second.y);
        }

        public solve() {
            const angleBetween = this.angleBetweenParticles();
            let diff = angleBetween - this.angleInRadius;

            if (diff <= -Math.PI)
                diff += 2 * Math.PI;
            else if(diff >= Math.PI)
                diff -= 2 * Math.PI;

            diff *= this.stiffness;

            this._particleA.position = MathHelper.rotateAround2(this._particleA.position, this._centerParticle.position, diff);
            this._particleC.position = MathHelper.rotateAround2(this._particleC.position, this._centerParticle.position, -diff);
            this._centerParticle.position = MathHelper.rotateAround2(this._centerParticle.position, this._particleA.position, diff);
            this._centerParticle.position = MathHelper.rotateAround2(this._centerParticle.position, this._particleC.position, -diff);
        }
    }
}