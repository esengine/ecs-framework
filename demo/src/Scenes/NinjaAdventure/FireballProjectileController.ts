module samples {
    import Component = es.Component;
    import Vector2 = es.Vector2;
    import ProjectileMover = es.ProjectileMover;
    import Time = es.Time;

    /**
     * 移动一个投射器并在它击中任何东西时摧毁它
     */
    export class FireballProjectileController extends Component {
        public velocity: Vector2;
        public _mover: ProjectileMover;

        constructor(velocity: Vector2){
            super();
            this.velocity = velocity;
        }

        public onAddedToEntity(): void {
            this._mover = this.entity.getComponent<ProjectileMover>(ProjectileMover);
        }

        public update(): void {
            if (this._mover.move(Vector2.multiply(this.velocity, new Vector2(Time.deltaTime))))
                this.entity.destroy();
        }
    }
}