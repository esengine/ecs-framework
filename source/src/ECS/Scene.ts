/** 场景 */
class Scene extends egret.DisplayObjectContainer {
   public camera: Camera; 
   public entities: Entity[] = [];

   private _projectionMatrix: Matrix2D;
   private _transformMatrix: Matrix2D;
   private _matrixTransformMatrix: Matrix2D;

   constructor(displayObject: egret.DisplayObject){
      super();
      displayObject.stage.addChild(this);
      /** 初始化默认相机 */
      this.camera = this.createEntity("camera").addComponent(new Camera());
      this._projectionMatrix = new Matrix2D(0, 0, 0, 0, 0, 0);
      this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
      this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.addEventListener(egret.Event.ENTER_FRAME, this.update, this);
   }

   public createEntity(name: string){
      let entity = new Entity(name);
      entity.transform.position = new Vector2(0, 0);
      return this.addEntity(entity);
   }

   public addEntity(entity: Entity){
      this.entities.push(entity);
      entity.scene = this;

      return entity;
   }

   public setActive(): Scene{
      SceneManager.setActiveScene(this);

      return this;
   }

   /** 初始化场景 */
   public initialize(){

   }

   /** 场景激活 */
   public onActive(){

   }

   /** 场景失去焦点 */
   public onDeactive(){

   }

   public update(){
      this.entities.forEach(entity => entity.update());
   }

   public prepRenderState(){
      this._projectionMatrix.m11 = 2 / this.stage.width;
      this._projectionMatrix.m22 = -2 / this.stage.height;

      this._transformMatrix = this.camera.transformMatrix;
      this._matrixTransformMatrix = Matrix2D.multiply(this._transformMatrix, this._projectionMatrix);
   }

   public destory(){
      this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);

      this.camera.destory();
      this.camera = null;

      this.entities.forEach(entity => entity.destory());
      this.entities.length = 0;
   }
}