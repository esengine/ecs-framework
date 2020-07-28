module component {
    export class SpawnComponent extends es.Component implements es.ITriggerListener {
        public cooldown = -1;
        public minInterval = 2;
        public maxInterval = 60;
        public enemyType = EnemyType.worm;
        public numSpawned = 0;
        public numAlive = 0;

        constructor(enemyType: EnemyType) {
            super();
            this.enemyType = enemyType;
        }

        public initialize() {
            // console.log("initialize");
        }

        public update() {
            // console.log("update");
        }

        public onTriggerEnter(other: es.Collider, local: es.Collider){
            if (other == local)
                console.log("repeat collider");
            console.log("enter collider");
        }

        public onTriggerExit(other: es.Collider, local: es.Collider){
            console.log("exit collider");
        }
    }

    export enum EnemyType {
        worm
    }
}
