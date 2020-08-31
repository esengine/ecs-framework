module es {
    /**
     * 代表了Verlet世界中的一个对象。由粒子和约束组成，并处理更新它们
     */
    export class Composite {
        /**
         * 摩擦作用于所有粒子运动以使其阻尼。值应该非常接近1。
         */
        public friction: Vector2 = new Vector2(0.98, 1);
        /**
         * 当实体的时候，碰撞器应该碰撞的所有层的图层蒙版。使用了移动方法。默认为所有层。
         */
        public collidesWithLayers = Physics.allLayers;

        public particles: Particle[] = [];
        public _constraints: Constraint[] = [];
        /**
         * 处理解决所有约束条件
         */
        public solveConstraints(){
            for (let i = this._constraints.length - 1; i >= 0; i --){
                this._constraints[i].solve();
            }
        }

        /**
         * 对每个粒子应用重力，并做Velet积分
         * @param deltaTimeSquared
         * @param gravity
         */
        public updateParticles(deltaTimeSquared: number, gravity: Vector2){
            for (let j = 0; j < this.particles.length; j ++){
                let p = this.particles[j];
                if (p.isPinned){
                    p.position = p.pinnedPosition;
                    continue;
                }

                p.applyForce(Vector2.multiply(new Vector2(p.mass), gravity));

                // 计算速度并用摩擦阻尼
                let vel = Vector2.subtract(p.position, p.lastPosition).multiply(this.friction);

                // 使用verlet积分计算下一个位置
                let nextPos = Vector2.add(p.position, vel).add(Vector2.multiply(new Vector2(0.5 * deltaTimeSquared), p.acceleration));

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

        public debugRender(camera: Camera){

        }
    }
}