class Time {
    public static unscaledDeltaTime;
    public static deltaTime: number = 0;
    public static timeScale = 1;
    public static frameCount = 0;;
    
    private static _lastTime = 0;

    public static update(currentTime: number){
        let dt = (currentTime - this._lastTime) / 1000;
        this.deltaTime = dt * this.timeScale;
        this.unscaledDeltaTime = dt;
        this.frameCount ++;

        this._lastTime = currentTime;
    }
}