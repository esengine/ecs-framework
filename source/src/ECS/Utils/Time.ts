class Time {
    public static unscaledDeltaTime;
    public static deltaTime: number;
    public static timeScale = 1;
    
    private static _lastTime = 0;

    public static update(currentTime: number){
        let dt = (currentTime - this._lastTime) / 1000;
        this.deltaTime = dt * this.timeScale;
        this.unscaledDeltaTime = dt;

        this._lastTime = currentTime;
    }
}