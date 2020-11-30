module es {
    export class EntitySystem {
        private _entities: Entity[] = [];

        constructor(matcher?: Matcher) {
            this._matcher = matcher ? matcher : Matcher.empty();
        }

        private _scene: Scene;

        public get scene() {
            return this._scene;
        }

        public set scene(value: Scene) {
            this._scene = value;
            this._entities = [];
        }

        private _matcher: Matcher;

        public get matcher() {
            return this._matcher;
        }

        public initialize() {

        }

        public onChanged(entity: Entity) {
            let contains = new linq.List(this._entities).contains(entity);
            let interest = this._matcher.isInterestedEntity(entity);

            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        }

        public add(entity: Entity) {
            this._entities.push(entity);
            this.onAdded(entity);
        }

        public onAdded(entity: Entity) {
        }

        public remove(entity: Entity) {
            new linq.List(this._entities).remove(entity);
            this.onRemoved(entity);
        }

        public onRemoved(entity: Entity) {

        }

        public update() {
            this.begin();
            this.process(this._entities);
        }

        public lateUpdate() {
            this.lateProcess(this._entities);
            this.end();
        }

        protected begin() {

        }

        protected process(entities: Entity[]) {

        }

        protected lateProcess(entities: Entity[]) {

        }

        protected end() {

        }
    }
}
