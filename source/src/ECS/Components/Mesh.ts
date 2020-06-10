class Mesh extends Component {
    private _verts: VertexPosition[];
    private _primitiveCount: number;
    private _triangles: number[];
    private _topLeftVertPosition: Vector2;
    private _width;
    private _height;

    public initialize() {
    }
    
    public setVertPosition(positions: Vector2[]){
        let createVerts = !this._verts || this._verts.length != positions.length;
        if (createVerts)
            this._verts = new Array(positions.length);

        for (let i = 0; i < this._verts.length; i ++){
            this._verts[i] = new VertexPosition(positions[i]);
        }

        return this;
    }

    public setTriangles(triangles: number[]){
        this._primitiveCount = triangles.length / 3;
        this._triangles = triangles;
        return this;
    }

    public recalculateBounds(){
        this._topLeftVertPosition = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
        let max = new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);

        for (let i = 0; i < this._verts.length; i ++){
            this._topLeftVertPosition.x = Math.min(this._topLeftVertPosition.x, this._verts[i].position.x);
            this._topLeftVertPosition.y = Math.min(this._topLeftVertPosition.y, this._verts[i].position.y);
            max.x = Math.max(max.x, this._verts[i].position.x);
            max.y = Math.max(max.y, this._verts[i].position.y);
        }

        this._width = max.x - this._topLeftVertPosition.x;
        this._height = max.y - this._topLeftVertPosition.y;

        return this;
    }

    public render(){
    }
}

class VertexPosition{
    public position: Vector2;
    
    constructor(position: Vector2){
        this.position = position;
    }
}