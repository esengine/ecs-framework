/** 场景 */
class Scene extends egret.DisplayObjectContainer {
   public camera: Camera;
   public readonly entities: EntityList;
   public readonly renderableComponents: RenderableComponentList;
   public readonly content: ContentManager;
   public enablePostProcessing = true;

   private _projectionMatrix: Matrix2D;
   private _transformMatrix: Matrix2D;
   private _matrixTransformMatrix: Matrix2D;
   private _renderers: Renderer[] = [];
   private _postProcessors: PostProcessor[] = [];
   private _afterPostProcessorRenderer: Renderer[] = [];
   private _didSceneBegin;

   public readonly entityProcessors: EntityProcessorList;

   constructor(displayObject: egret.DisplayObject) {
      super();
      displayObject.stage.addChild(this);
      this._projectionMatrix = new Matrix2D(0, 0, 0, 0, 0, 0);
      this.entityProcessors = new EntityProcessorList();
      this.renderableComponents = new RenderableComponentList();
      this.entities = new EntityList(this);
      this.content = new ContentManager();

      this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
      this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
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

   public addRenderer<T extends Renderer>(renderer: T) {
      this._renderers.push(renderer);
      this._renderers.sort();

      renderer.onAddedToScene(this);

      return renderer;
   }

   public getRenderer<T extends Renderer>(type): T {
      for (let i = 0; i < this._renderers.length; i++) {
         if (this._renderers[i] instanceof type)
            return this._renderers[i] as T;
      }

      return null;
   }

   public removeRenderer(renderer: Renderer) {
      this._renderers.remove(renderer);
   }

   public begin() {
      if (this._renderers.length == 0) {
         this.addRenderer(new DefaultRenderer());
         console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
      }
      /** 初始化默认相机 */
      this.camera = this.createEntity("camera").getOrCreateComponent(new Camera());

      Physics.reset();

      if (this.entityProcessors)
         this.entityProcessors.begin();

      this.camera.onSceneSizeChanged(this.stage.stageWidth, this.stage.stageHeight);

      this._didSceneBegin = true;
      this.onStart();
   }

   public end() {
      this._didSceneBegin = false;

      this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
      this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);

      for (let i = 0; i < this._renderers.length; i++) {
         this._renderers[i].unload();
      }

      for (let i = 0; i < this._postProcessors.length; i++) {
         this._postProcessors[i].unload();
      }

      this.entities.removeAllEntities();

      Physics.clear();

      this.camera.destory();
      this.camera = null;
      this.content.dispose();

      if (this.entityProcessors)
         this.entityProcessors.end();

      this.unload();
   }

   protected onStart() {

   }

   /** 场景激活 */
   protected onActive() {

   }

   /** 场景失去焦点 */
   protected onDeactive() {

   }

   protected unload() { }

   public update() {
      this.entities.updateLists();

      if (this.entityProcessors)
         this.entityProcessors.update()

      this.entities.update();

      if (this.entityProcessors)
         this.entityProcessors.lateUpdate();

      this.renderableComponents.updateList();
   }

   public postRender() {
      let enabledCounter = 0;
      if (this.enablePostProcessing) {
         for (let i = 0; i < this._postProcessors.length; i++) {
            if (this._postProcessors[i].enable) {
               let isEven = MathHelper.isEven(enabledCounter);
               enabledCounter ++;

               this._postProcessors[i].process(this);
            }
         }
      }

      for (let i = 0; i < this._afterPostProcessorRenderer.length; i ++){
         if (i == 0){
            // TODO: 设置渲染对象
         }

         if (this._afterPostProcessorRenderer[i].camera){
            this._afterPostProcessorRenderer[i].camera.forceMatrixUpdate();
         }
         this._afterPostProcessorRenderer[i].render(this);
      }
   }

   public render() {
      for (let i = 0; i < this._renderers.length; i++) {
         if (this._renderers[i].camera)
            this._renderers[i].camera.forceMatrixUpdate();
         this.camera.forceMatrixUpdate();
         this._renderers[i].render(this);
      }
   }
}