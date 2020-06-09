class MainScene extends Scene {
    constructor(displayContent: egret.DisplayObject){
        super(displayContent);

        this.addEntityProcessor(new SpawnerSystem(new Matcher()));
        this.astarTest();
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