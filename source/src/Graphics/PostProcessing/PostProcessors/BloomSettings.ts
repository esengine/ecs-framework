class BloomSettings {
    public readonly threshold;
    public readonly blurAmount;
    public readonly intensity;
    public readonly baseIntensity;
    public readonly saturation;
    public readonly baseStaturation;

    constructor(bloomThreshold: number, blurAmount: number, bloomIntensity: number,baseIntensity: number,
        bloomSaturation: number, baseSaturation: number){
            this.threshold = bloomThreshold;
            this.blurAmount = blurAmount;
            this.intensity = bloomIntensity;
            this.baseIntensity = baseIntensity;
            this.saturation = bloomSaturation;
            this.baseStaturation = baseSaturation;
    }

    public static presetSettings: BloomSettings[] = [
        new BloomSettings(0.1, 0.6, 2, 1, 1, 0),
        new BloomSettings(0, 3, 1, 1, 1, 1),
        new BloomSettings(0.5, 8, 2, 1, 0, 1),
        new BloomSettings(0.25, 8, 1.3, 1, 1, 0),
        new BloomSettings(0, 2, 1, 0.1, 1, 1),
        new BloomSettings(0.5, 2, 1, 1, 1, 1)
    ];
}