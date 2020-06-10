class Composite {
    private _constraints: Constraint[] = [];

    public particles: Particle[] = [];
    /**
     * 处理解决所有约束条件
     */
    public solveConstraints(){
        for (let i = this._constraints.length - 1; i >= 0; i --){
            this._constraints[i].solve();
        }
    }

    public updateParticles(deltaTimeSquared: number, gravity: Vector2){
        for (let j = 0; j < this.particles.length; j ++){
            let p = this.particles[j];
            if (p.isPinned){
                p.position = p.pinnedPosition;
                continue;
            }

            p.applyForce(Vector2.multiply(new Vector2(p.mass, p.mass), gravity));
        }
    }
}