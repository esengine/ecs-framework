class Point {
    public x: number;
    public y: number;

    constructor(x?: number, y?: number){
        this.x = x ? x : 0;
        this.y = y ? y : this.x;
    }
}