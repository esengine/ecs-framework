class MainScene extends Scene {
    constructor(displayContent: egret.DisplayObject){
        super(displayContent);

        // this.addEntityProcessor(new SpawnerSystem(new Matcher()));
        this.astarTest();
        this.dijkstraTest();
        this.breadthfirstTest();
    }

    public onStart(){
        this.content.load("http://www.hyuan.org/123.jpeg", false).then((data)=>{
            console.log(data);
        });

        this.camera.setZoom(0.5);

        let sprite = new Sprite(RES.getRes("checkbox_select_disabled_png"));
        let player = this.createEntity("player");
        player.addComponent(new SpriteRenderer()).setSprite(sprite).setColor(0xFF0000);
        player.addComponent(new SpawnComponent(EnemyType.worm));
        player.addComponent(new Mover());
        player.addComponent(new PlayerController());
        player.addComponent(new FollowCamera(player));
        player.addComponent(new BoxCollider());

        

        for (let i = 0; i < 20; i ++){
            let sprite = new Sprite(RES.getRes("checkbox_select_disabled_png"));
            let player2 = this.createEntity("player2");
            player2.addComponent(new SpriteRenderer()).setSprite(sprite);
            player2.transform.position = new Vector2(Math.random() * 100 * i, Math.random() * 100 * i);
            player2.addComponent(new BoxCollider());
        }
    }

    public breadthfirstTest(){
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

    public dijkstraTest(){
        let graph = new WeightedGridGraph(20, 20);

        graph.weightedNodes.push(new Point(3, 3));
        graph.weightedNodes.push(new Point(3, 4));
        graph.weightedNodes.push(new Point(4, 3));
        graph.weightedNodes.push(new Point(4, 4));

        let path = graph.search(new Point(3, 4), new Point(15, 17));
        console.log(path);
    }

    public astarTest(){
        let graph = new AstarGridGraph(20, 20);

        graph.weightedNodes.push(new Point(3, 3));
        graph.weightedNodes.push(new Point(3, 4));
        graph.weightedNodes.push(new Point(4, 3));
        graph.weightedNodes.push(new Point(4, 4));

        let path = graph.search(new Point(3, 4), new Point(15, 17));
        console.log(path);
    }
}