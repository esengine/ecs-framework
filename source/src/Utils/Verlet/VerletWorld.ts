/**
 * 基于verlet 物理引擎进行改造的物理引擎 ts重写
 * https://github.com/subprotocol/verlet-js
 */
class VerletWorld {
    public gravity: Vector2 = new Vector2(0, 980);
    public maximumStepIterations = 5;
    public constraintIterations = 3;
    public simulationBounds: Rectangle;

    private _leftOverTime: number;
    private _iterationSteps: number;
    private _fixedDeltaTime = 1 / 60;
    private _composites: Composite[] = [];
    private _fixedDeltaTimeSq: number;

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
            }
        }
    }

    private updateTiming(){
        this._leftOverTime += Time.deltaTime;
        this._iterationSteps = Math.trunc(this._leftOverTime / this._fixedDeltaTime);
        this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;

        this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
    }
}