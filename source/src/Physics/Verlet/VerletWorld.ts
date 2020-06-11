/**
 * 基于verlet进行改造的物理引擎 ts重写
 * https://github.com/subprotocol/verlet-js
 */
class VerletWorld {
    public gravity: Vector2 = new Vector2(0, 980);
    public maximumStepIterations = 5;
    public constraintIterations = 3;
    public simulationBounds: Rectangle;

    private _leftOverTime: number = 0;
    private _iterationSteps: number = 0;
    private _fixedDeltaTime = 1 / 60;
    private _composites: Composite[] = [];
    private _fixedDeltaTimeSq: number;

    private static _colliders = new Array(4);

    constructor(simulationBounds?: Rectangle){
        this.simulationBounds = simulationBounds;
        this._fixedDeltaTimeSq = Math.pow(this._fixedDeltaTime, 2);
    }

    public update(){
        this.updateTiming();

        for (let iteration = 1; iteration <= this._iterationSteps; iteration ++){
            for (let i = this._composites.length - 1; i >= 0; i --){
                let composite = this._composites[i];

                for (let s = 0; s < this.constraintIterations; s++){
                    composite.solveConstraints();
                }

                composite.updateParticles(this._fixedDeltaTimeSq, this.gravity);

                composite.handleConstraintCollisions();

                for (let j = 0; j < composite.particles.length; j ++){
                    let p = composite.particles[j];

                    if (this.simulationBounds){
                        this.constrainParticleToBounds(p);
                    }

                    // if (p.collidesWithColliders)
                    //     this.handleCollisions(p, -1);
                }
            }
        }
    }

    private handleCollisions(p: Particle, collidesWithLayers: number){
        let collidedCount = Physics.overlapCircleAll(p.position, p.radius, VerletWorld._colliders, collidesWithLayers);
        // handle
    }

    private constrainParticleToBounds(p: Particle){
        let tempPos = p.position;
        let bounds = this.simulationBounds;

        if (p.radius == 0){
            if (tempPos.y > bounds.height){
                tempPos.y = bounds.height;
            } else if(tempPos.y < bounds.y){
                tempPos.y = bounds.y;
            }

            if (tempPos.x < bounds.x){
                tempPos.x = bounds.x;
            }else if(tempPos.x > bounds.width){
                tempPos.x = bounds.width;
            }
        }else{
            if (tempPos.y < bounds.y + p.radius){
                tempPos.y = 2 * (bounds.y + p.radius) - tempPos.y;
            }
            if (tempPos.y > bounds.height - p.radius){
                tempPos.y = 2 * (bounds.height - p.radius) - tempPos.y;
            }
            if (tempPos.x > bounds.width - p.radius){
                tempPos.x = 2 * (bounds.width - p.radius) - tempPos.x;
            }
            if (tempPos.x < bounds.x + p.radius)
                tempPos.x = 2 * (bounds.x + p.radius) - tempPos.x;
        }

        p.position = tempPos;
    }

    public debugRender(displayObject: egret.DisplayObject){
        if (!displayObject)
            return;

        displayObject.stage.removeChildren();
        for (let i = 0; i < this._composites.length; i ++){
            let shape = new egret.Shape();
            this._composites[i].debugRender(shape.graphics);
            displayObject.stage.addChild(shape);
        }
    }

    public addComposite<T extends Composite>(composite: T): T{
        this._composites.push(composite);
        return composite;
    }

    private updateTiming(){
        this._leftOverTime += Time.deltaTime;
        this._iterationSteps = Math.trunc(this._leftOverTime / this._fixedDeltaTime);
        this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;

        this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
    }
}