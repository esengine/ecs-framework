abstract class Constraint {
    public composite: Composite;
    public collidesWithColliders = true;

    public abstract solve();

    public handleCollisions(collidesWithLayers: number){
        
    }

    public debugRender(graphics: egret.Graphics) {}
}