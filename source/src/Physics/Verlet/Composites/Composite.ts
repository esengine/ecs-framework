class Composite {
    private _constraints: Constraint[] = [];

    public friction = new Vector2(0.98, 1);
    public drawParticles: boolean = true;
    public drawConstraints: boolean = true;
    public particles: Particle[] = [];
    public collidesWithLayers = -1;

    /**
     * 处理解决所有约束条件
     */
    public solveConstraints(){
        for (let i = this._constraints.length - 1; i >= 0; i --){
            this._constraints[i].solve();
        }
    }

    public addParticle(particle: Particle){
        this.particles.push(particle);
        return particle;
    }

    public addConstraint<T extends Constraint>(constraint: T): T{
        this._constraints.push(constraint);
        constraint.composite = this;
        return constraint;
    }

    public removeConstraint(constraint: Constraint){
        this._constraints.remove(constraint);
    }

    public updateParticles(deltaTimeSquared: number, gravity: Vector2){
        for (let j = 0; j < this.particles.length; j ++){
            let p = this.particles[j];
            if (p.isPinned){
                p.position = p.pinnedPosition;
                continue;
            }

            p.applyForce(Vector2.multiply(new Vector2(p.mass, p.mass), gravity));

            let vel = Vector2.multiply(Vector2.subtract(p.position, p.lastPosition), this.friction);
            let nextPos = Vector2.add(Vector2.add(p.position, vel), Vector2.multiply(p.acceleration, new Vector2(0.5 * deltaTimeSquared, 0.5 * deltaTimeSquared)));

            p.lastPosition = p.position;
            p.position = nextPos;
            p.acceleration.x = p.acceleration.y = 0;
        }
    }

    public handleConstraintCollisions(){
        for (let i = this._constraints.length - 1; i >= 0; i --){
            if (this._constraints[i].collidesWithColliders)
                this._constraints[i].handleCollisions(this.collidesWithLayers);
        }
    }

    public debugRender(graphics: egret.Graphics){
        if (this.drawConstraints){
            for (let i = 0; i < this._constraints.length; i ++){
                this._constraints[i].debugRender(graphics);
            }
        }

        if (this.drawParticles){
            for (let i = 0; i < this.particles.length; i ++){
                let size = this.particles[i].radius ? this.particles[i].radius : 4;
                graphics.lineStyle(4, DebugDefaults.verletParticle);
                graphics.drawRect(this.particles[i].position.x, this.particles[i].position.y, size, size);
                graphics.endFill();
            }
        }
    }
}