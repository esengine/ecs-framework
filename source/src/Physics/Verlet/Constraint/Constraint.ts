abstract class Constraint {
    public composite: Composite;
    public collidesWithColliders = true;

    public abstract solve();

    public debugRender(graphics: egret.Graphics) {}
}