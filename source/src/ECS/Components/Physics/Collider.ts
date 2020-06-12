abstract class Collider extends Component{
    public shape: Shape;
    public physicsLayer = 1 << 0;

    public get bounds(): Rectangle {
        return this.shape.bounds;
    }
}