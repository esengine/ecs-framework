module samples {
    import Component = es.Component;
    import Vector2 = es.Vector2;

    export class CameraBounds extends Component {
        public min: Vector2;
        public max: Vector2;

        constructor(min: Vector2 = Vector2.zero, max: Vector2 = Vector2.zero){
            super();

            this.min = min;
            this.max = max;
            this.setUpdateOrder(Number.MAX_VALUE);
        }

        public onAddedToEntity(): void {
            this.entity.updateOrder = Number.MAX_VALUE;
        }

        public update(): void {
            let cameraBounds = this.entity.scene.camera.bounds;

            if (cameraBounds.top < this.min.y)
                this.entity.scene.camera.position.add(new Vector2(0, this.min.y - cameraBounds.top));

            if (cameraBounds.left < this.min.x)
                this.entity.scene.camera.position.add(new Vector2(this.min.x - cameraBounds.left, 0));

            if (cameraBounds.bottom > this.max.y)
                this.entity.scene.camera.position.add(new Vector2(0, this.max.y - cameraBounds.bottom));

            if (cameraBounds.right > this.max.x)
                this.entity.scene.camera.position.add(new Vector2(this.max.x - cameraBounds.right, 0));
        }
    }
}