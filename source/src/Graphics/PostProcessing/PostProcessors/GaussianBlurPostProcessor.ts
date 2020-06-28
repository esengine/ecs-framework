class GaussianBlurPostProcessor extends PostProcessor {
    public onAddedToScene(scene: Scene){
        super.onAddedToScene(scene);
        this.effect = new GaussianBlurEffect();
    }
}