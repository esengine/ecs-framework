/** 场景 */
class Scene extends egret.DisplayObjectContainer {
   public camera: Camera;
   public readonly entities: EntityList;
   public readonly renderableComponents: RenderableComponentList;

   private _projectionMatrix: Matrix2D;
   private _transformMatrix: Matrix2D;
   private _matrixTransformMatrix: Matrix2D;
   private _renderers: Renderer[] = [];

   public readonly entityProcessors: EntityProcessorList;

   constructor(displayObject: egret.DisplayObject) {
      super();
      displayObject.stage.addChild(this);
      this._projectionMatrix = new Matrix2D(0, 0, 0, 0, 0, 0);
      this.entityProcessors = new EntityProcessorList();
      this.renderableComponents = new RenderableComponentList();
      this.entities = new EntityList(this);

      this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
      this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.addEventListener(egret.Event.ENTER_FRAME, this.update, this);
   }

   public createEntity(name: string) {
      let entity = new Entity(name);
      entity.transform.position = new Vector2(0, 0);
      return this.addEntity(entity);
   }

   public addEntity(entity: Entity) {
      this.entities.add(entity);
      entity.scene = this;

      for (let i = 0; i < entity.transform.childCount; i++)
         this.addEntity(entity.transform.getChild(i).entity);

      return entity;
   }

   public destroyAllEntities() {
      for (let i = 0; i < this.entities.count; i++) {
         this.entities.buffer[i].destory();
      }
   }

   public findEntity(name: string): Entity {
      return this.entities.findEntity(name);
   }

   /**
    * 在场景中添加一个EntitySystem处理器
    * @param processor 处理器
    */
   public addEntityProcessor(processor: EntitySystem) {
      processor.scene = this;
      this.entityProcessors.add(processor);
      return processor;
   }

   public removeEntityProcessor(processor: EntitySystem) {
      this.entityProcessors.remove(processor);
   }

   public getEntityProcessor<T extends EntitySystem>(): T {
      return this.entityProcessors.getProcessor<T>();
   }

   public setActive(): Scene {
      SceneManager.setActiveScene(this);

      return this;
   }

   public addRenderer<T extends Renderer>(renderer: T) {
      this._renderers.push(renderer);
      this._renderers.sort();

      renderer.onAddedToScene(this);

      return renderer;
   }

   public getRenderer<T extends Renderer>(type): T{
      for (let i = 0; i < this._renderers.length; i ++){
         if (this._renderers[i] instanceof type)
            return this._renderers[i] as T;
      }

      return null;
   }

   public removeRenderer(renderer: Renderer){
      this._renderers.remove(renderer);
   }

   /** 初始化场景 */
   public initialize() {
      if (this._renderers.length == 0) {
         this.addRenderer(new DefaultRenderer());
         console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
      }
      /** 初始化默认相机 */
      this.camera = this.createEntity("camera").getOrCreateComponent(new Camera());

      Physics.reset();
      Input.initialize();

      if (this.entityProcessors)
         this.entityProcessors.begin();

      this.camera.onSceneSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
   }

   /** 场景激活 */
   public onActive() {

   }

   /** 场景失去焦点 */
   public onDeactive() {

   }

   public update() {
      Time.update(egret.getTimer());

      for (let i = GlobalManager.globalManagers.length - 1; i >= 0; i--) {
         if (GlobalManager.globalManagers[i].enabled)
            GlobalManager.globalManagers[i].update();
      }

      this.entities.updateLists();

      if (this.entityProcessors)
         this.entityProcessors.update()

      this.entities.update();

      if (this.entityProcessors)
         this.entityProcessors.lateUpdate();

      this.renderableComponents.updateList();
      this.render();
   }

   public render(){
      for (let i = 0; i <this._renderers.length; i ++){
         if (this._renderers[i].camera)
            this._renderers[i].camera.forceMatrixUpdate();
         this.camera.forceMatrixUpdate();
         this._renderers[i].render(this);
      }
   }

   public prepRenderState() {
      this._projectionMatrix.m11 = 2 / this.stage.stageWidth;
      this._projectionMatrix.m22 = -2 / this.stage.stageHeight;

      this._transformMatrix = this.camera.transformMatrix;
      this._matrixTransformMatrix = Matrix2D.multiply(this._transformMatrix, this._projectionMatrix);
   }

   public destory() {
      this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);

      this.camera.destory();
      this.camera = null;

      this.entities.removeAllEntities();
   }
}