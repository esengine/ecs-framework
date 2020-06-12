///<reference path="./Shape.ts" />
class Circle extends Shape {
    public radius: number;
    private _originalRadius: number;

    constructor(radius: number){
        super();
        this.radius = radius;
        this._originalRadius = radius;
    }
}