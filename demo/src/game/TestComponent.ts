class TestComponent extends Component {
    constructor(displayRender: egret.DisplayObject){
        super();
        this.bind(displayRender);
    }

    public initialize(){
        // console.log("initialize");
    }

    public update(){
        // console.log("update");
    }
}