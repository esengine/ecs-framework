class SpawnComponent extends Component {
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
}

enum EnemyType {
    worm
}