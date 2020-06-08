/** 运行时的场景管理。 */
class SceneManager {
    private static _loadedScenes: Map<string, Scene> = new Map();
    /** 上一个场景 */
    private static _lastScene: Scene;
    /** 当前激活的场景 */
    private static _activeScene: Scene;

    /**
     * 使用给定的名称在运行时创建一个空的新场景。
     * 新场景将与当前打开的任何现有场景一起被添加到层次结构中。
     * 这个函数用于在运行时创建场景。
     * @param name 
     * @param scene 
     */
    public static createScene(name: string, scene: Scene){
        scene.name = name;
        this._loadedScenes.set(name, scene);
        return scene;
    }

    public static setActiveScene(scene: Scene){
        if (this._activeScene){
            // 如果场景相同则不进行切换
            if (this._activeScene == scene)
                return;

            this._lastScene = this._activeScene;
            this._activeScene.destory();
        }

        this._activeScene = scene;
        this._activeScene.initialize();
        return scene;
    }

    public static getActiveScene(){
        return this._activeScene;
    }
}