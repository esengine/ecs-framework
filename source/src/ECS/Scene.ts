/** 场景 */
class Scene extends egret.DisplayObjectContainer {
   public camera: Camera; 
   public entities: Entity[] = [];

   constructor(displayObject: egret.DisplayObject){
      super();
      /** 初始化默认相机 */
      this.camera = new Camera(displayObject);
      this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
      this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
   }

   public createEntity(name: string){
      let entity = new Entity(name);

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

   public destory(){
      this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);

      this.camera.destory();
      this.camera = null;

      this.entities.forEach(entity => entity.destory());
      this.entities.length = 0;
   }
}