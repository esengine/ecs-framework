module es {
    export class Composite {
        public friction: Vector2 = new Vector2(0.98, 1);
        public drawParticles: boolean = true;
        public drawConstraints: boolean = true;
        public collidesWithLayers: number = Physics.allLayers;
        public particles: Particle[] = [];
        _constraints: Constraint[] = [];

        public addParticle(particle: Particle): Particle {
            this.particles.push(particle);
            return particle;
        }

        public removeParticle(particle: Particle) {
            const index = this.particles.indexOf(particle);
            this.particles.splice(index, 1);
        }

        public removeAll() {
            this.particles.length = 0;
            this._constraints.length = 0;
        }

        public addConstraint<T extends Constraint>(constraint: T): T {
            this._constraints.push(constraint);
            constraint.composite = this;
            return constraint;
        }

        public removeConstraint(constraint: Constraint) {
            const index = this._constraints.indexOf(constraint);
            this._constraints.splice(index, 1);
        }

        public applyForce(force: Vector2) {
            for (let j = 0; j < this.particles.length; j ++)
                this.particles[j].applyForce(force);
        }

        public solveConstraints() {
            for (let i = this._constraints.length - 1; i >= 0; i --)
                this._constraints[i].solve();
        }

        public updateParticles(deltaTimeSquared: number, gravity: Vector2) {
            for (let j = 0; j < this.particles.length; j ++) {
                const p = this.particles[j];
                if (p.isPinned) {
                    p.position = p.pinnedPosition;
                    continue;
                }

                p.applyForce(gravity.scale(p.mass));

                const vel = p.position.sub(p.lastPosition).multiply(this.friction);
                const nextPos = p.position.add(vel).add(p.acceleration.scale(0.5 * deltaTimeSquared));

                p.lastPosition = p.position;
                p.position = nextPos;
                p.acceleration.x = p.acceleration.y = 0;
            }
        }

        public handleConstraintCollisions() {
            for (let i = this._constraints.length - 1; i >= 0; i --) {
                if (this._constraints[i].collidesWithColliders)
                    this._constraints[i].handleCollisions(this.collidesWithLayers);
            }
        }

        public debugRender(batcher: IBatcher) {
            if (this.drawConstraints) {
                for (let i = 0; i < this._constraints.length; i ++)
                    this._constraints[i].debugRender(batcher);
            }

            if (this.drawParticles) {
                for (let i = 0; i < this.particles.length; i ++) {
                    if (this.particles[i].radius == 0) 
                        batcher.drawPixel(this.particles[i].position, new Color(220, 52, 94), 4);
                    else
                        batcher.drawCircleLow(this.particles[i].position, this.particles[i].radius, new Color(220, 52, 94), 1, 4);
                }
            }
        }
    }
}