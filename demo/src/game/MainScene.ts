class MainScene extends Scene {
    constructor() {
        super();

        // this.addEntityProcessor(new SpawnerSystem(new Matcher()));
        this.astarTest();
        this.dijkstraTest();
        this.breadthfirstTest();
    }

    public async onStart() {
        let sprite = new Sprite(RES.getRes("checkbox_select_disabled_png"));
        let bg = this.createEntity("bg");
        bg.addComponent(new SpriteRenderer()).setSprite(sprite).setColor(0xff0000);
        bg.addComponent(new PlayerController());
        bg.addComponent(new Mover());
        bg.addComponent(new BoxCollider());
        bg.position = new Vector2(Math.random() * 300, Math.random() * 300);

        for (let i = 0; i < 20; i++) {
            let sprite = new Sprite(RES.getRes("checkbox_select_disabled_png"));
            let player2 = this.createEntity("player2");
            player2.addComponent(new SpriteRenderer()).setSprite(sprite);
            player2.position = new Vector2(Math.random() * 1000, Math.random() * 1000);
            player2.addComponent(new BoxCollider());
        }

        this.camera.follow(bg, CameraStyle.lockOn);

        let pool = new ComponentPool<SimplePooled>(SimplePooled);
        let c1 = pool.obtain();
        let c2 = pool.obtain();
        pool.free(c1);
        let c1b = pool.obtain();

        console.log(c1 != c2);
        console.log(c1 == c1b);

        let button = new eui.Button();
        button.label = "切换场景";
        this.addChild(button);
        button.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
            SceneManager.startSceneTransition(new FadeTransition(() => {
                return new MainScene();
            }));
        }, this);
    }

    public breadthfirstTest() {
        let graph = new UnweightedGraph<string>();

        graph.addEdgesForNode("a", ["b"]); // a->b
        graph.addEdgesForNode("b", ["a", "c", "d"]); // b->a b->c b->d
        graph.addEdgesForNode("c", ["a"]); // c->a
        graph.addEdgesForNode("d", ["e", "a"]); // d->e d->a
        graph.addEdgesForNode("e", ["b"]); // e->b

        // 计算从c到e的路径
        let path = BreadthFirstPathfinder.search(graph, "c", "e");
        console.log(path);
    }

    public dijkstraTest() {
        let graph = new WeightedGridGraph(20, 20);

        graph.weightedNodes.push(new Vector2(3, 3));
        graph.weightedNodes.push(new Vector2(3, 4));
        graph.weightedNodes.push(new Vector2(4, 3));
        graph.weightedNodes.push(new Vector2(4, 4));

        let path = graph.search(new Vector2(3, 4), new Vector2(15, 17));
        console.log(path);
    }

    public astarTest() {
        let graph = new AstarGridGraph(30, 30);

        // graph.weightedNodes.push(new Vector2(3, 3));
        // graph.weightedNodes.push(new Vector2(3, 4));
        // graph.weightedNodes.push(new Vector2(4, 3));
        // graph.weightedNodes.push(new Vector2(4, 4));

        let startTime = egret.getTimer();
        let path = graph.search(new Vector2(1, 1), new Vector2(29, 29));
        console.log(egret.getTimer() - startTime);
    }
}