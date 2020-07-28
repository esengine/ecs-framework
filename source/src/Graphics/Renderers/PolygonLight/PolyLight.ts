module es {
    export class PolyLight extends RenderableComponent {
        public power: number;
        protected _radius: number;
        private _lightEffect;
        private _indices: number[] = [];

        public get radius(){
            return this._radius;
        }
        public set radius(value: number){
            this.setRadius(value);
        }

        constructor(radius: number, color: number, power: number){
            super();

            this.radius = radius;
            this.power = power;
            this.color = color;
            this.computeTriangleIndices();
        }

        private computeTriangleIndices(totalTris: number = 20){
            this._indices.length = 0;

            for (let i = 0; i < totalTris; i += 2){
                this._indices.push(0);
                this._indices.push(i + 2);
                this._indices.push(i + 1);
            }
        }

        public setRadius(radius: number){
            if (radius != this._radius){
                this._radius = radius;
                this._areBoundsDirty = true;
            }
        }

        public render(camera: Camera) {
        }

        public reset(){

        }
    }
}
