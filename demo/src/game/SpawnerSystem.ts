class SpawnerSystem extends EntityProcessingSystem {
    constructor(matcher: Matcher){
        super(matcher);
    }

    public processEntity(entity: Entity){
        let spawner = entity.getComponent<SpawnComponent>();
        if (spawner.numAlive <= 0)
            spawner.enabled = true;

        if (!spawner.enabled)
            return;

        console.log("cooldown", spawner.cooldown);
        if (spawner.cooldown == -1){
            spawner.cooldown /= 4;
        }

        spawner.cooldown -= 0.001;
        if (spawner.cooldown <= 0){
            // CreateEnemy
            spawner.numSpawned ++;
            spawner.numAlive ++;

            if (spawner.numAlive > 0)
                spawner.enabled = false;
        }
    }
}