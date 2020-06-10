class Particle {
    public position: Vector2 = new Vector2(0, 0);
    public lastPosition: Vector2 = new Vector2(0, 0);
    public isPinned: boolean;
    public pinnedPosition;
    public acceleration: Vector2 = new Vector2(0, 0);
    public mass: number = 1;
    public radius: number = 0;
    public collidesWithColliders = true;

    constructor(position: Vector2){
        this.position = position;
        this.lastPosition = position;
    }

    public applyForce(force: Vector2){
        this.acceleration = Vector2.add(this.acceleration, new Vector2(force.x / this.mass, force.y / this.mass));
    }
}