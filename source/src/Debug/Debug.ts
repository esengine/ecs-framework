class Debug {
    private static _debugDrawItems: DebugDrawItem[] = [];

    public static drawHollowRect(rectanle: Rectangle, color: number, duration = 0){
        this._debugDrawItems.push(new DebugDrawItem(rectanle, color, duration));
    }

    public static render(){
        if (this._debugDrawItems.length > 0){
            let debugShape = new egret.Shape();
            if (SceneManager.scene){
                SceneManager.scene.addChild(debugShape);
            }

            for (let i = this._debugDrawItems.length - 1; i >= 0; i --){
                let item = this._debugDrawItems[i];
                if (item.draw(debugShape))
                    this._debugDrawItems.removeAt(i);
            }
        }
    }
}