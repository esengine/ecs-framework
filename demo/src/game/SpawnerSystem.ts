class SpawnerSystem extends EntityProcessingSystem {
    constructor(matcher: Matcher){
        super(matcher);
    }

    public processEntity(entity: Entity){
        let spawner = entity.getComponent<SpawnComponent>(SpawnComponent);
        if (!spawner)
            return;

        if (spawner.numAlive <= 0)
            spawner.enabled = true;

        if (!spawner.enabled)
            return;

        console.log("cooldown", spawner.cooldown);
        if (spawner.cooldown == -1){
            spawner.cooldown = Math.random() * 60;
            spawner.cooldown /= 4;
        }

        spawner.cooldown -= Time.deltaTime;
        if (spawner.cooldown <= 0){
            spawner.cooldown = Math.random() * 60;
            // CreateEnemy
            spawner.numSpawned ++;
            spawner.numAlive ++;

            if (spawner.numAlive > 0)
                spawner.enabled = false;
        }
    }
}