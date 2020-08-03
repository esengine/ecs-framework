declare interface Array<T> {
    findIndex(predicate: (c: T) => boolean): number;
    any(predicate: (c: T) => boolean): boolean;
    firstOrDefault(predicate: (c: T) => boolean): T;
    find(predicate: (c: T) => boolean): T;
    where(predicate: (c: T) => boolean): Array<T>;
    count(predicate: (c: T) => boolean): number;
    findAll(predicate: (c: T) => boolean): Array<T>;
    contains(value: T): boolean;
    removeAll(predicate: (c: T) => boolean): void;
    remove(element: T): boolean;
    removeAt(index: number): void;
    removeRange(index: number, count: number): void;
    select(selector: Function): Array<T>;
    orderBy(keySelector: Function, comparer: Function): Array<T>;
    orderByDescending(keySelector: Function, comparer: Function): Array<T>;
    groupBy(keySelector: Function): Array<T>;
    sum(selector: Function): number;
}
declare module es {
    class PriorityQueueNode {
        priority: number;
        insertionIndex: number;
        queueIndex: number;
    }
}
declare module es {
    class AStarPathfinder {
        static search<T>(graph: IAstarGraph<T>, start: T, goal: T): T[];
        static recontructPath<T>(cameFrom: Map<T, T>, start: T, goal: T): T[];
        private static hasKey;
        private static getKey;
    }
    class AStarNode<T> extends PriorityQueueNode {
        data: T;
        constructor(data: T);
    }
}
declare module es {
    class AstarGridGraph implements IAstarGraph<Vector2> {
        dirs: Vector2[];
        walls: Vector2[];
        weightedNodes: Vector2[];
        defaultWeight: number;
        weightedNodeWeight: number;
        private _width;
        private _height;
        private _neighbors;
        constructor(width: number, height: number);
        isNodeInBounds(node: Vector2): boolean;
        isNodePassable(node: Vector2): boolean;
        search(start: Vector2, goal: Vector2): Vector2[];
        getNeighbors(node: Vector2): Vector2[];
        cost(from: Vector2, to: Vector2): number;
        heuristic(node: Vector2, goal: Vector2): number;
    }
}
declare module es {
    interface IAstarGraph<T> {
        getNeighbors(node: T): Array<T>;
        cost(from: T, to: T): number;
        heuristic(node: T, goal: T): any;
    }
}
declare module es {
    class PriorityQueue<T extends PriorityQueueNode> {
        private _numNodes;
        private _nodes;
        private _numNodesEverEnqueued;
        constructor(maxNodes: number);
        readonly count: number;
        readonly maxSize: number;
        clear(): void;
        contains(node: T): boolean;
        enqueue(node: T, priority: number): void;
        dequeue(): T;
        remove(node: T): void;
        isValidQueue(): boolean;
        private onNodeUpdated;
        private cascadeDown;
        private cascadeUp;
        private swap;
        private hasHigherPriority;
    }
}
declare module es {
    class BreadthFirstPathfinder {
        static search<T>(graph: IUnweightedGraph<T>, start: T, goal: T): T[];
        private static hasKey;
    }
}
declare module es {
    interface IUnweightedGraph<T> {
        getNeighbors(node: T): T[];
    }
}
declare module es {
    class UnweightedGraph<T> implements IUnweightedGraph<T> {
        edges: Map<T, T[]>;
        addEdgesForNode(node: T, edges: T[]): this;
        getNeighbors(node: T): T[];
    }
}
declare module es {
    class Vector2 {
        private static readonly unitYVector;
        private static readonly unitXVector;
        private static readonly unitVector2;
        private static readonly zeroVector2;
        x: number;
        y: number;
        constructor(x?: number, y?: number);
        static readonly zero: Vector2;
        static readonly one: Vector2;
        static readonly unitX: Vector2;
        static readonly unitY: Vector2;
        static add(value1: Vector2, value2: Vector2): Vector2;
        static divide(value1: Vector2, value2: Vector2): Vector2;
        static multiply(value1: Vector2, value2: Vector2): Vector2;
        static subtract(value1: Vector2, value2: Vector2): Vector2;
        static normalize(value: Vector2): Vector2;
        static dot(value1: Vector2, value2: Vector2): number;
        static distanceSquared(value1: Vector2, value2: Vector2): number;
        static clamp(value1: Vector2, min: Vector2, max: Vector2): Vector2;
        static lerp(value1: Vector2, value2: Vector2, amount: number): Vector2;
        static transform(position: Vector2, matrix: Matrix2D): Vector2;
        static distance(value1: Vector2, value2: Vector2): number;
        static negate(value: Vector2): Vector2;
        add(value: Vector2): Vector2;
        divide(value: Vector2): Vector2;
        multiply(value: Vector2): Vector2;
        subtract(value: Vector2): this;
        normalize(): this;
        length(): number;
        lengthSquared(): number;
        round(): Vector2;
        equals(other: Vector2): boolean;
    }
}
declare module es {
    class UnweightedGridGraph implements IUnweightedGraph<Vector2> {
        private static readonly CARDINAL_DIRS;
        private static readonly COMPASS_DIRS;
        walls: Vector2[];
        private _width;
        private _hegiht;
        private _dirs;
        private _neighbors;
        constructor(width: number, height: number, allowDiagonalSearch?: boolean);
        isNodeInBounds(node: Vector2): boolean;
        isNodePassable(node: Vector2): boolean;
        getNeighbors(node: Vector2): Vector2[];
        search(start: Vector2, goal: Vector2): Vector2[];
    }
}
declare module es {
    interface IWeightedGraph<T> {
        getNeighbors(node: T): T[];
        cost(from: T, to: T): number;
    }
}
declare module es {
    class WeightedGridGraph implements IWeightedGraph<Vector2> {
        static readonly CARDINAL_DIRS: Vector2[];
        private static readonly COMPASS_DIRS;
        walls: Vector2[];
        weightedNodes: Vector2[];
        defaultWeight: number;
        weightedNodeWeight: number;
        private _width;
        private _height;
        private _dirs;
        private _neighbors;
        constructor(width: number, height: number, allowDiagonalSearch?: boolean);
        isNodeInBounds(node: Vector2): boolean;
        isNodePassable(node: Vector2): boolean;
        search(start: Vector2, goal: Vector2): Vector2[];
        getNeighbors(node: Vector2): Vector2[];
        cost(from: Vector2, to: Vector2): number;
    }
}
declare module es {
    class WeightedNode<T> extends PriorityQueueNode {
        data: T;
        constructor(data: T);
    }
    class WeightedPathfinder {
        static search<T>(graph: IWeightedGraph<T>, start: T, goal: T): T[];
        static recontructPath<T>(cameFrom: Map<T, T>, start: T, goal: T): T[];
        private static hasKey;
        private static getKey;
    }
}
declare module es {
    class Debug {
        private static _debugDrawItems;
        static drawHollowRect(rectanle: Rectangle, color: number, duration?: number): void;
        static render(): void;
    }
}
declare module es {
    class DebugDefaults {
        static verletParticle: number;
        static verletConstraintEdge: number;
    }
}
declare module es {
    enum DebugDrawType {
        line = 0,
        hollowRectangle = 1,
        pixel = 2,
        text = 3
    }
    class DebugDrawItem {
        rectangle: Rectangle;
        color: number;
        duration: number;
        drawType: DebugDrawType;
        text: string;
        start: Vector2;
        end: Vector2;
        x: number;
        y: number;
        size: number;
        constructor(rectangle: Rectangle, color: number, duration: number);
        draw(shape: egret.Shape): boolean;
    }
}
declare module es {
    abstract class Component extends egret.HashObject {
        entity: Entity;
        updateInterval: number;
        readonly transform: Transform;
        private _enabled;
        enabled: boolean;
        private _updateOrder;
        updateOrder: number;
        initialize(): void;
        onAddedToEntity(): void;
        onRemovedFromEntity(): void;
        onEntityTransformChanged(comp: transform.Component): void;
        debugRender(): void;
        onEnabled(): void;
        onDisabled(): void;
        update(): void;
        setEnabled(isEnabled: boolean): this;
        setUpdateOrder(updateOrder: number): this;
        clone(): Component;
    }
}
declare module es {
    class Core extends egret.DisplayObjectContainer {
        static emitter: Emitter<CoreEvents>;
        static graphicsDevice: GraphicsDevice;
        static content: ContentManager;
        static _instance: Core;
        _nextScene: Scene;
        _sceneTransition: SceneTransition;
        _globalManagers: GlobalManager[];
        constructor();
        static readonly Instance: Core;
        _scene: Scene;
        static scene: Scene;
        static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T;
        static registerGlobalManager(manager: es.GlobalManager): void;
        static unregisterGlobalManager(manager: es.GlobalManager): void;
        static getGlobalManager<T extends es.GlobalManager>(type: any): T;
        onOrientationChanged(): void;
        draw(): Promise<void>;
        startDebugUpdate(): void;
        endDebugUpdate(): void;
        onSceneChanged(): void;
        protected onGraphicsDeviceReset(): void;
        protected initialize(): void;
        protected update(): Promise<void>;
        private onAddToStage;
    }
}
declare module es {
    enum CoreEvents {
        GraphicsDeviceReset = 0,
        SceneChanged = 1,
        OrientationChanged = 2
    }
}
declare module es {
    class Entity {
        static _idGenerator: number;
        scene: Scene;
        name: string;
        readonly id: number;
        readonly transform: Transform;
        readonly components: ComponentList;
        updateInterval: number;
        componentBits: BitSet;
        constructor(name: string);
        _isDestroyed: boolean;
        readonly isDestroyed: boolean;
        private _tag;
        tag: number;
        private _enabled;
        enabled: boolean;
        private _updateOrder;
        updateOrder: number;
        parent: Transform;
        readonly childCount: number;
        position: Vector2;
        localPosition: Vector2;
        rotation: number;
        rotationDegrees: number;
        localRotation: number;
        localRotationDegrees: number;
        scale: Vector2;
        localScale: Vector2;
        readonly worldInverseTransform: Matrix2D;
        readonly localToWorldTransform: Matrix2D;
        readonly worldToLocalTransform: Matrix2D;
        onTransformChanged(comp: transform.Component): void;
        setTag(tag: number): Entity;
        setEnabled(isEnabled: boolean): this;
        setUpdateOrder(updateOrder: number): this;
        destroy(): void;
        detachFromScene(): void;
        attachToScene(newScene: Scene): void;
        clone(position?: Vector2): Entity;
        onAddedToScene(): void;
        onRemovedFromScene(): void;
        update(): void;
        addComponent<T extends Component>(component: T): T;
        getComponent<T extends Component>(type: any): T;
        hasComponent<T extends Component>(type: any): boolean;
        getOrCreateComponent<T extends Component>(type: T): T;
        getComponents(typeName: string | any, componentList?: any): any;
        removeComponent(component: Component): void;
        removeComponentForType<T extends Component>(type: any): boolean;
        removeAllComponents(): void;
        compareTo(other: Entity): number;
        toString(): string;
        protected copyFrom(entity: Entity): void;
    }
}
declare module es {
    class Scene extends egret.DisplayObjectContainer {
        camera: Camera;
        readonly content: ContentManager;
        enablePostProcessing: boolean;
        readonly entities: EntityList;
        readonly renderableComponents: RenderableComponentList;
        readonly entityProcessors: EntityProcessorList;
        _renderers: Renderer[];
        readonly _postProcessors: PostProcessor[];
        _didSceneBegin: any;
        constructor();
        static createWithDefaultRenderer(): Scene;
        initialize(): void;
        onStart(): Promise<void>;
        unload(): void;
        onActive(): void;
        onDeactive(): void;
        begin(): Promise<void>;
        end(): void;
        update(): void;
        render(): void;
        postRender(): void;
        addRenderer<T extends Renderer>(renderer: T): T;
        getRenderer<T extends Renderer>(type: any): T;
        removeRenderer(renderer: Renderer): void;
        addPostProcessor<T extends PostProcessor>(postProcessor: T): T;
        getPostProcessor<T extends PostProcessor>(type: any): T;
        removePostProcessor(postProcessor: PostProcessor): void;
        createEntity(name: string): Entity;
        addEntity(entity: Entity): Entity;
        destroyAllEntities(): void;
        findEntity(name: string): Entity;
        findEntitiesWithTag(tag: number): Entity[];
        entitiesOfType<T extends Entity>(type: any): T[];
        findComponentOfType<T extends Component>(type: any): T;
        findComponentsOfType<T extends Component>(type: any): T[];
        addEntityProcessor(processor: EntitySystem): EntitySystem;
        removeEntityProcessor(processor: EntitySystem): void;
        getEntityProcessor<T extends EntitySystem>(): T;
    }
}
declare module transform {
    enum Component {
        position = 0,
        scale = 1,
        rotation = 2
    }
}
declare module es {
    import HashObject = egret.HashObject;
    enum DirtyType {
        clean = 0,
        positionDirty = 1,
        scaleDirty = 2,
        rotationDirty = 3
    }
    class Transform extends HashObject {
        readonly entity: Entity;
        hierarchyDirty: DirtyType;
        _localDirty: boolean;
        _localPositionDirty: boolean;
        _localScaleDirty: boolean;
        _localRotationDirty: boolean;
        _positionDirty: boolean;
        _worldToLocalDirty: boolean;
        _worldInverseDirty: boolean;
        _localTransform: Matrix2D;
        _worldTransform: Matrix2D;
        _rotationMatrix: Matrix2D;
        _translationMatrix: Matrix2D;
        _scaleMatrix: Matrix2D;
        _children: Transform[];
        constructor(entity: Entity);
        readonly childCount: number;
        rotationDegrees: number;
        localRotationDegrees: number;
        readonly localToWorldTransform: Matrix2D;
        _parent: Transform;
        parent: Transform;
        _worldToLocalTransform: Matrix2D;
        readonly worldToLocalTransform: Matrix2D;
        _worldInverseTransform: Matrix2D;
        readonly worldInverseTransform: Matrix2D;
        _position: Vector2;
        position: Vector2;
        _scale: Vector2;
        scale: Vector2;
        _rotation: number;
        rotation: number;
        _localPosition: Vector2;
        localPosition: Vector2;
        _localScale: Vector2;
        localScale: Vector2;
        _localRotation: number;
        localRotation: number;
        getChild(index: number): Transform;
        setParent(parent: Transform): Transform;
        setPosition(x: number, y: number): Transform;
        setLocalPosition(localPosition: Vector2): Transform;
        setRotation(radians: number): Transform;
        setRotationDegrees(degrees: number): Transform;
        lookAt(pos: Vector2): void;
        setLocalRotation(radians: number): this;
        setLocalRotationDegrees(degrees: number): Transform;
        setScale(scale: Vector2): Transform;
        setLocalScale(scale: Vector2): Transform;
        roundPosition(): void;
        updateTransform(): void;
        setDirty(dirtyFlagType: DirtyType): void;
        copyFrom(transform: Transform): void;
        toString(): string;
        equals(other: Transform): boolean;
    }
}
declare module es {
    enum CameraStyle {
        lockOn = 0,
        cameraWindow = 1
    }
    class CameraInset {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
    class Camera extends Component {
        _inset: CameraInset;
        _areMatrixedDirty: boolean;
        _areBoundsDirty: boolean;
        _isProjectionMatrixDirty: boolean;
        followLerp: number;
        deadzone: Rectangle;
        focusOffset: Vector2;
        mapLockEnabled: boolean;
        mapSize: Vector2;
        _targetEntity: Entity;
        _targetCollider: Collider;
        _desiredPositionDelta: Vector2;
        _cameraStyle: CameraStyle;
        _worldSpaceDeadZone: Rectangle;
        constructor(targetEntity?: Entity, cameraStyle?: CameraStyle);
        position: Vector2;
        rotation: number;
        _zoom: any;
        zoom: number;
        _minimumZoom: number;
        minimumZoom: number;
        _maximumZoom: number;
        maximumZoom: number;
        _bounds: Rectangle;
        readonly bounds: Rectangle;
        _transformMatrix: Matrix2D;
        readonly transformMatrix: Matrix2D;
        _inverseTransformMatrix: Matrix2D;
        readonly inverseTransformMatrix: Matrix2D;
        _origin: Vector2;
        origin: Vector2;
        onSceneSizeChanged(newWidth: number, newHeight: number): void;
        setInset(left: number, right: number, top: number, bottom: number): Camera;
        setPosition(position: Vector2): this;
        setRotation(rotation: number): Camera;
        setZoom(zoom: number): Camera;
        setMinimumZoom(minZoom: number): Camera;
        setMaximumZoom(maxZoom: number): Camera;
        onEntityTransformChanged(comp: transform.Component): void;
        zoomIn(deltaZoom: number): void;
        zoomOut(deltaZoom: number): void;
        worldToScreenPoint(worldPosition: Vector2): Vector2;
        screenToWorldPoint(screenPosition: Vector2): Vector2;
        mouseToWorldPoint(): Vector2;
        onAddedToEntity(): void;
        update(): void;
        clampToMapSize(position: Vector2): Vector2;
        updateFollow(): void;
        follow(targetEntity: Entity, cameraStyle?: CameraStyle): void;
        setCenteredDeadzone(width: number, height: number): void;
        protected updateMatrixes(): void;
    }
}
declare module es {
    class ComponentPool<T extends PooledComponent> {
        private _cache;
        private _type;
        constructor(typeClass: any);
        obtain(): T;
        free(component: T): void;
    }
}
declare module es {
    class IUpdatableComparer {
        compare(a: Component, b: Component): number;
    }
}
declare module es {
    abstract class PooledComponent extends Component {
        abstract reset(): any;
    }
}
declare module es {
    abstract class RenderableComponent extends Component implements IRenderable {
        displayObject: egret.DisplayObject;
        color: number;
        protected _areBoundsDirty: boolean;
        readonly width: number;
        readonly height: number;
        protected _localOffset: Vector2;
        localOffset: Vector2;
        protected _renderLayer: number;
        renderLayer: number;
        protected _bounds: Rectangle;
        readonly bounds: Rectangle;
        private _isVisible;
        isVisible: boolean;
        onEntityTransformChanged(comp: transform.Component): void;
        abstract render(camera: Camera): any;
        isVisibleFromCamera(camera: Camera): boolean;
        setRenderLayer(renderLayer: number): RenderableComponent;
        setColor(color: number): RenderableComponent;
        setLocalOffset(offset: Vector2): RenderableComponent;
        sync(camera: Camera): void;
        toString(): string;
        protected onBecameVisible(): void;
        protected onBecameInvisible(): void;
    }
}
declare module es {
    class Mesh extends RenderableComponent {
        private _mesh;
        constructor();
        setTexture(texture: egret.Texture): Mesh;
        reset(): void;
        render(camera: es.Camera): void;
    }
}
declare module es {
    class SpriteRenderer extends RenderableComponent {
        constructor(sprite?: Sprite | egret.Texture);
        readonly bounds: Rectangle;
        originNormalized: Vector2;
        protected _origin: Vector2;
        origin: Vector2;
        protected _sprite: Sprite;
        sprite: Sprite;
        setSprite(sprite: Sprite): SpriteRenderer;
        setOrigin(origin: Vector2): SpriteRenderer;
        setOriginNormalized(value: Vector2): SpriteRenderer;
        render(camera: Camera): void;
    }
}
declare module es {
    class TiledSpriteRenderer extends SpriteRenderer {
        protected sourceRect: Rectangle;
        protected leftTexture: egret.Bitmap;
        protected rightTexture: egret.Bitmap;
        constructor(sprite: Sprite);
        scrollX: number;
        scrollY: number;
        render(camera: es.Camera): void;
    }
}
declare module es {
    class ScrollingSpriteRenderer extends TiledSpriteRenderer {
        scrollSpeedX: number;
        scroolSpeedY: number;
        private _scrollX;
        private _scrollY;
        update(): void;
        render(camera: Camera): void;
    }
}
declare module es {
    class Sprite {
        texture2D: egret.Texture;
        readonly sourceRect: Rectangle;
        readonly center: Vector2;
        origin: Vector2;
        readonly uvs: Rectangle;
        constructor(texture: egret.Texture, sourceRect?: Rectangle, origin?: Vector2);
    }
}
declare module es {
    class SpriteAnimation {
        readonly sprites: Sprite[];
        readonly frameRate: number;
        constructor(sprites: Sprite[], frameRate: number);
    }
}
declare module es {
    enum LoopMode {
        loop = 0,
        once = 1,
        clampForever = 2,
        pingPong = 3,
        pingPongOnce = 4
    }
    enum State {
        none = 0,
        running = 1,
        paused = 2,
        completed = 3
    }
    class SpriteAnimator extends SpriteRenderer {
        onAnimationCompletedEvent: (string: any) => {};
        speed: number;
        animationState: State;
        currentAnimation: SpriteAnimation;
        currentAnimationName: string;
        currentFrame: number;
        _elapsedTime: number;
        _loopMode: LoopMode;
        constructor(sprite?: Sprite);
        readonly isRunning: boolean;
        private _animations;
        readonly animations: Map<string, SpriteAnimation>;
        update(): void;
        addAnimation(name: string, animation: SpriteAnimation): SpriteAnimator;
        play(name: string, loopMode?: LoopMode): void;
        isAnimationActive(name: string): boolean;
        pause(): void;
        unPause(): void;
        stop(): void;
    }
}
declare module es {
    interface ITriggerListener {
        onTriggerEnter(other: Collider, local: Collider): any;
        onTriggerExit(other: Collider, local: Collider): any;
    }
}
declare module es {
    class Mover extends Component {
        private _triggerHelper;
        onAddedToEntity(): void;
        calculateMovement(motion: Vector2, collisionResult: CollisionResult): boolean;
        applyMovement(motion: Vector2): void;
        move(motion: Vector2, collisionResult: CollisionResult): boolean;
    }
}
declare module es {
    class ProjectileMover extends Component {
        private _tempTriggerList;
        private _collider;
        onAddedToEntity(): void;
        move(motion: Vector2): boolean;
        private notifyTriggerListeners;
    }
}
declare module es {
    abstract class Collider extends Component {
        shape: Shape;
        isTrigger: boolean;
        physicsLayer: number;
        collidesWithLayers: number;
        shouldColliderScaleAndRotateWithTransform: boolean;
        registeredPhysicsBounds: Rectangle;
        _localOffsetLength: number;
        _isPositionDirty: boolean;
        _isRotationDirty: boolean;
        protected _colliderRequiresAutoSizing: any;
        protected _isParentEntityAddedToScene: any;
        protected _isColliderRegistered: any;
        readonly absolutePosition: Vector2;
        readonly rotation: number;
        readonly bounds: Rectangle;
        protected _localOffset: Vector2;
        localOffset: Vector2;
        setLocalOffset(offset: Vector2): Collider;
        setShouldColliderScaleAndRotateWithTransform(shouldColliderScaleAndRotationWithTransform: boolean): Collider;
        onAddedToEntity(): void;
        onRemovedFromEntity(): void;
        onEntityTransformChanged(comp: transform.Component): void;
        onEnabled(): void;
        onDisabled(): void;
        registerColliderWithPhysicsSystem(): void;
        unregisterColliderWithPhysicsSystem(): void;
        overlaps(other: Collider): boolean;
        collidesWith(collider: Collider, motion: Vector2, result: CollisionResult): boolean;
        clone(): Component;
    }
}
declare module es {
    class BoxCollider extends Collider {
        constructor();
        width: number;
        height: number;
        setSize(width: number, height: number): this;
        setWidth(width: number): BoxCollider;
        setHeight(height: number): void;
        toString(): string;
    }
}
declare module es {
    class CircleCollider extends Collider {
        constructor(radius?: number);
        radius: number;
        setRadius(radius: number): CircleCollider;
        toString(): string;
    }
}
declare module es {
    class PolygonCollider extends Collider {
        constructor(points: Vector2[]);
    }
}
declare module es {
    class EntitySystem {
        private _entities;
        constructor(matcher?: Matcher);
        private _scene;
        scene: Scene;
        private _matcher;
        readonly matcher: Matcher;
        initialize(): void;
        onChanged(entity: Entity): void;
        add(entity: Entity): void;
        onAdded(entity: Entity): void;
        remove(entity: Entity): void;
        onRemoved(entity: Entity): void;
        update(): void;
        lateUpdate(): void;
        protected begin(): void;
        protected process(entities: Entity[]): void;
        protected lateProcess(entities: Entity[]): void;
        protected end(): void;
    }
}
declare module es {
    abstract class EntityProcessingSystem extends EntitySystem {
        constructor(matcher: Matcher);
        abstract processEntity(entity: Entity): any;
        lateProcessEntity(entity: Entity): void;
        protected process(entities: Entity[]): void;
        protected lateProcess(entities: Entity[]): void;
    }
}
declare module es {
    abstract class PassiveSystem extends EntitySystem {
        onChanged(entity: Entity): void;
        protected process(entities: Entity[]): void;
    }
}
declare module es {
    abstract class ProcessingSystem extends EntitySystem {
        onChanged(entity: Entity): void;
        abstract processSystem(): any;
        protected process(entities: Entity[]): void;
    }
}
declare module es {
    class BitSet {
        private static LONG_MASK;
        private _bits;
        constructor(nbits?: number);
        and(bs: BitSet): void;
        andNot(bs: BitSet): void;
        cardinality(): number;
        clear(pos?: number): void;
        get(pos: number): boolean;
        intersects(set: BitSet): boolean;
        isEmpty(): boolean;
        nextSetBit(from: number): number;
        set(pos: number, value?: boolean): void;
        private ensure;
    }
}
declare module es {
    class ComponentList {
        static compareUpdatableOrder: IUpdatableComparer;
        _entity: Entity;
        _components: Component[];
        _componentsToAdd: Component[];
        _componentsToRemove: Component[];
        _tempBufferList: Component[];
        _isComponentListUnsorted: boolean;
        constructor(entity: Entity);
        readonly count: number;
        readonly buffer: Component[];
        markEntityListUnsorted(): void;
        add(component: Component): void;
        remove(component: Component): void;
        removeAllComponents(): void;
        deregisterAllComponents(): void;
        registerAllComponents(): void;
        updateLists(): void;
        handleRemove(component: Component): void;
        getComponent<T extends Component>(type: any, onlyReturnInitializedComponents: boolean): T;
        getComponents(typeName: string | any, components?: any): any;
        update(): void;
        onEntityTransformChanged(comp: transform.Component): void;
        onEntityEnabled(): void;
        onEntityDisabled(): void;
    }
}
declare module es {
    class ComponentTypeManager {
        private static _componentTypesMask;
        static add(type: any): void;
        static getIndexFor(type: any): number;
    }
}
declare module es {
    class EntityList {
        scene: Scene;
        _entities: Entity[];
        _entitiesToAdded: Entity[];
        _entitiesToRemove: Entity[];
        _isEntityListUnsorted: boolean;
        _entityDict: Map<number, Entity[]>;
        _unsortedTags: number[];
        _tempEntityList: Entity[];
        constructor(scene: Scene);
        readonly count: number;
        readonly buffer: Entity[];
        markEntityListUnsorted(): void;
        markTagUnsorted(tag: number): void;
        add(entity: Entity): void;
        remove(entity: Entity): void;
        removeAllEntities(): void;
        contains(entity: Entity): boolean;
        getTagList(tag: number): Entity[];
        addToTagList(entity: Entity): void;
        removeFromTagList(entity: Entity): void;
        update(): void;
        updateLists(): void;
        findEntity(name: string): Entity;
        entitiesWithTag(tag: number): Entity[];
        entitiesOfType<T extends Entity>(type: any): T[];
        findComponentOfType<T extends Component>(type: any): T;
        findComponentsOfType<T extends Component>(type: any): T[];
    }
}
declare module es {
    class EntityProcessorList {
        private _processors;
        add(processor: EntitySystem): void;
        remove(processor: EntitySystem): void;
        onComponentAdded(entity: Entity): void;
        onComponentRemoved(entity: Entity): void;
        onEntityAdded(entity: Entity): void;
        onEntityRemoved(entity: Entity): void;
        begin(): void;
        update(): void;
        lateUpdate(): void;
        end(): void;
        getProcessor<T extends EntitySystem>(): T;
        protected notifyEntityChanged(entity: Entity): void;
        protected removeFromProcessors(entity: Entity): void;
    }
}
declare module es {
    class Matcher {
        protected allSet: BitSet;
        protected exclusionSet: BitSet;
        protected oneSet: BitSet;
        static empty(): Matcher;
        getAllSet(): BitSet;
        getExclusionSet(): BitSet;
        getOneSet(): BitSet;
        IsIntersted(e: Entity): boolean;
        all(...types: any[]): Matcher;
        exclude(...types: any[]): this;
        one(...types: any[]): this;
    }
}
declare class ObjectUtils {
    static clone<T>(p: any, c?: T): T;
}
declare module es {
    interface IRenderable {
        bounds: Rectangle;
        enabled: boolean;
        renderLayer: number;
        isVisible: boolean;
        isVisibleFromCamera(camera: Camera): any;
        render(camera: Camera): any;
    }
    class RenderableComparer {
        compare(self: IRenderable, other: IRenderable): number;
    }
}
declare module es {
    class RenderableComponentList {
        static compareUpdatableOrder: RenderableComparer;
        _components: IRenderable[];
        _componentsByRenderLayer: Map<number, IRenderable[]>;
        _unsortedRenderLayers: number[];
        _componentsNeedSort: boolean;
        readonly count: number;
        readonly buffer: IRenderable[];
        add(component: IRenderable): void;
        remove(component: IRenderable): void;
        updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number): void;
        setRenderLayerNeedsComponentSort(renderLayer: number): void;
        setNeedsComponentSort(): void;
        addToRenderLayerList(component: IRenderable, renderLayer: number): void;
        componentsWithRenderLayer(renderLayer: number): IRenderable[];
        updateList(): void;
    }
}
declare class StringUtils {
    private static specialSigns;
    static matchChineseWord(str: string): string[];
    static lTrim(target: string): string;
    static rTrim(target: string): string;
    static trim(target: string): string;
    static isWhiteSpace(str: string): boolean;
    static replaceMatch(mainStr: string, targetStr: string, replaceStr: string, caseMark?: boolean): string;
    static htmlSpecialChars(str: string, reversion?: boolean): string;
    static zfill(str: string, width?: number): string;
    static reverse(str: string): string;
    static cutOff(str: string, start: number, len: number, order?: boolean): string;
    static strReplace(str: string, rStr: string[]): string;
}
declare module es {
    class TextureUtils {
        static sharedCanvas: HTMLCanvasElement;
        static sharedContext: CanvasRenderingContext2D;
        static convertImageToCanvas(texture: egret.Texture, rect?: egret.Rectangle): HTMLCanvasElement;
        static toDataURL(type: string, texture: egret.Texture, rect?: egret.Rectangle, encoderOptions?: any): string;
        static eliFoTevas(type: string, texture: egret.Texture, filePath: string, rect?: egret.Rectangle, encoderOptions?: any): void;
        static getPixel32(texture: egret.Texture, x: number, y: number): number[];
        static getPixels(texture: egret.Texture, x: number, y: number, width?: number, height?: number): number[];
    }
}
declare module es {
    class Time {
        static unscaledDeltaTime: any;
        static deltaTime: number;
        static timeScale: number;
        static frameCount: number;
        static _timeSinceSceneLoad: any;
        private static _lastTime;
        static update(currentTime: number): void;
        static sceneChanged(): void;
        static checkEvery(interval: number): boolean;
    }
}
declare class TimeUtils {
    static monthId(d?: Date): number;
    static dateId(t?: Date): number;
    static weekId(d?: Date, first?: boolean): number;
    static diffDay(a: Date, b: Date, fixOne?: boolean): number;
    static getFirstDayOfWeek(d?: Date): Date;
    static getFirstOfDay(d?: Date): Date;
    static getNextFirstOfDay(d?: Date): Date;
    static formatDate(date: Date): string;
    static formatDateTime(date: Date): string;
    static parseDate(s: string): Date;
    static secondToTime(time?: number, partition?: string, showHour?: boolean): string;
    static timeToMillisecond(time: string, partition?: string): string;
}
declare module es {
    class GraphicsCapabilities extends egret.Capabilities {
        initialize(device: GraphicsDevice): void;
        private platformInitialize;
    }
}
declare module es {
    class GraphicsDevice {
        graphicsCapabilities: GraphicsCapabilities;
        constructor();
        private _viewport;
        readonly viewport: Viewport;
        private setup;
    }
}
declare module es {
    class Viewport {
        private _x;
        private _y;
        private _minDepth;
        private _maxDepth;
        constructor(x: number, y: number, width: number, height: number);
        private _width;
        width: number;
        private _height;
        height: number;
        readonly aspectRatio: number;
        bounds: Rectangle;
    }
}
declare module es {
    class GaussianBlurEffect extends egret.CustomFilter {
        private static blur_frag;
        constructor();
    }
}
declare module es {
    class PolygonLightEffect extends egret.CustomFilter {
        private static vertSrc;
        private static fragmentSrc;
        constructor();
    }
}
declare module es {
    class PostProcessor {
        static default_vert: string;
        enabled: boolean;
        effect: egret.Filter;
        scene: Scene;
        shape: egret.Shape;
        constructor(effect?: egret.Filter);
        onAddedToScene(scene: Scene): void;
        process(): void;
        onSceneBackBufferSizeChanged(newWidth: number, newHeight: number): void;
        unload(): void;
        protected drawFullscreenQuad(): void;
    }
}
declare module es {
    class GaussianBlurPostProcessor extends PostProcessor {
        onAddedToScene(scene: Scene): void;
    }
}
declare module es {
    abstract class Renderer {
        camera: Camera;
        readonly renderOrder: number;
        protected constructor(renderOrder: number, camera?: Camera);
        onAddedToScene(scene: Scene): void;
        unload(): void;
        abstract render(scene: Scene): any;
        onSceneBackBufferSizeChanged(newWidth: number, newHeight: number): void;
        compareTo(other: Renderer): number;
        protected beginRender(cam: Camera): void;
        protected renderAfterStateCheck(renderable: IRenderable, cam: Camera): void;
    }
}
declare module es {
    class DefaultRenderer extends Renderer {
        constructor();
        render(scene: Scene): void;
    }
}
declare module es {
    class ScreenSpaceRenderer extends Renderer {
        render(scene: Scene): void;
    }
}
declare module es {
    class PolyLight extends RenderableComponent {
        power: number;
        private _lightEffect;
        private _indices;
        constructor(radius: number, color: number, power: number);
        protected _radius: number;
        radius: number;
        setRadius(radius: number): void;
        render(camera: Camera): void;
        reset(): void;
        private computeTriangleIndices;
    }
}
declare module es {
    abstract class SceneTransition {
        loadsNewScene: boolean;
        isNewSceneLoaded: boolean;
        onScreenObscured: Function;
        onTransitionCompleted: Function;
        protected sceneLoadAction: Function;
        constructor(sceneLoadAction: Function);
        private _hasPreviousSceneRender;
        readonly hasPreviousSceneRender: boolean;
        preRender(): void;
        render(): void;
        onBeginTransition(): Promise<void>;
        tickEffectProgressProperty(filter: egret.CustomFilter, duration: number, easeType: Function, reverseDirection?: boolean): Promise<boolean>;
        protected transitionComplete(): void;
        protected loadNextScene(): Promise<void>;
    }
}
declare module es {
    class FadeTransition extends SceneTransition {
        fadeToColor: number;
        fadeOutDuration: number;
        fadeEaseType: Function;
        delayBeforeFadeInDuration: number;
        private _mask;
        private _alpha;
        constructor(sceneLoadAction: Function);
        onBeginTransition(): Promise<void>;
        render(): void;
    }
}
declare module es {
    class WindTransition extends SceneTransition {
        duration: number;
        easeType: (t: number) => number;
        private _mask;
        private _windEffect;
        constructor(sceneLoadAction: Function);
        windSegments: number;
        size: number;
        onBeginTransition(): Promise<void>;
    }
}
declare module es {
    class Bezier {
        static getPoint(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
        static getFirstDerivative(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
        static getFirstDerivativeThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
        static getPointThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
        static getOptimizedDrawingPoints(start: Vector2, firstCtrlPoint: Vector2, secondCtrlPoint: Vector2, end: Vector2, distanceTolerance?: number): Vector2[];
        private static recursiveGetOptimizedDrawingPoints;
    }
}
declare module es {
    class Flags {
        static isFlagSet(self: number, flag: number): boolean;
        static isUnshiftedFlagSet(self: number, flag: number): boolean;
        static setFlagExclusive(self: number, flag: number): number;
        static setFlag(self: number, flag: number): number;
        static unsetFlag(self: number, flag: number): number;
        static invertFlags(self: number): number;
    }
}
declare module es {
    class MathHelper {
        static readonly Epsilon: number;
        static readonly Rad2Deg: number;
        static readonly Deg2Rad: number;
        static toDegrees(radians: number): number;
        static toRadians(degrees: number): number;
        static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number;
        static lerp(value1: number, value2: number, amount: number): number;
        static clamp(value: number, min: number, max: number): number;
        static pointOnCirlce(circleCenter: Vector2, radius: number, angleInDegrees: number): Vector2;
        static isEven(value: number): boolean;
        static clamp01(value: number): number;
        static angleBetweenVectors(from: Vector2, to: Vector2): number;
    }
}
declare module es {
    var matrixPool: any[];
    class Matrix2D extends egret.Matrix {
        m11: number;
        m12: number;
        m21: number;
        m22: number;
        m31: number;
        m32: number;
        static create(): Matrix2D;
        identity(): Matrix2D;
        translate(dx: number, dy: number): Matrix2D;
        scale(sx: number, sy: number): Matrix2D;
        rotate(angle: number): Matrix2D;
        invert(): Matrix2D;
        add(matrix: Matrix2D): Matrix2D;
        substract(matrix: Matrix2D): Matrix2D;
        divide(matrix: Matrix2D): Matrix2D;
        multiply(matrix: Matrix2D): Matrix2D;
        determinant(): number;
        release(matrix: Matrix2D): void;
    }
}
declare module es {
    class Rectangle extends egret.Rectangle {
        _tempMat: Matrix2D;
        _transformMat: Matrix2D;
        readonly max: Vector2;
        readonly center: Vector2;
        location: Vector2;
        size: Vector2;
        static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): Rectangle;
        static rectEncompassingPoints(points: Vector2[]): Rectangle;
        intersects(value: egret.Rectangle): boolean;
        rayIntersects(ray: Ray2D): number;
        containsRect(value: Rectangle): boolean;
        contains(x: number, y: number): boolean;
        getHalfSize(): Vector2;
        getClosestPointOnRectangleBorderToPoint(point: Vector2, edgeNormal: Vector2): Vector2;
        getClosestPointOnBoundsToOrigin(): Vector2;
        calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number): void;
    }
}
declare module es {
    class Vector3 {
        x: number;
        y: number;
        z: number;
        constructor(x: number, y: number, z: number);
    }
}
declare module es {
    class ColliderTriggerHelper {
        private _entity;
        private _activeTriggerIntersections;
        private _previousTriggerIntersections;
        private _tempTriggerList;
        constructor(entity: Entity);
        update(): void;
        private checkForExitedColliders;
        private notifyTriggerListeners;
    }
}
declare module es {
    enum PointSectors {
        center = 0,
        top = 1,
        bottom = 2,
        topLeft = 9,
        topRight = 5,
        left = 8,
        right = 4,
        bottomLeft = 10,
        bottomRight = 6
    }
    class Collisions {
        static isLineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): boolean;
        static lineToLineIntersection(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): Vector2;
        static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
        static isCircleToCircle(circleCenter1: Vector2, circleRadius1: number, circleCenter2: Vector2, circleRadius2: number): boolean;
        static isCircleToLine(circleCenter: Vector2, radius: number, lineFrom: Vector2, lineTo: Vector2): boolean;
        static isCircleToPoint(circleCenter: Vector2, radius: number, point: Vector2): boolean;
        static isRectToCircle(rect: egret.Rectangle, cPosition: Vector2, cRadius: number): boolean;
        static isRectToLine(rect: Rectangle, lineFrom: Vector2, lineTo: Vector2): boolean;
        static isRectToPoint(rX: number, rY: number, rW: number, rH: number, point: Vector2): boolean;
        static getSector(rX: number, rY: number, rW: number, rH: number, point: Vector2): PointSectors;
    }
}
declare module es {
    class Physics {
        static spatialHashCellSize: number;
        static readonly allLayers: number;
        private static _spatialHash;
        static raycastsHitTriggers: boolean;
        static raycastsStartInColliders: boolean;
        static reset(): void;
        static clear(): void;
        static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask?: number): number;
        static boxcastBroadphase(rect: Rectangle, layerMask?: number): Collider[];
        static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask?: number): Collider[];
        static addCollider(collider: Collider): void;
        static removeCollider(collider: Collider): void;
        static updateCollider(collider: Collider): void;
        static debugDraw(secondsToDisplay: any): void;
    }
}
declare module es {
    class Ray2D {
        start: Vector2;
        end: Vector2;
        direction: Vector2;
        constructor(position: Vector2, end: Vector2);
    }
}
declare module es {
    class RaycastHit {
        collider: Collider;
        fraction: number;
        distance: number;
        point: Vector2;
        normal: Vector2;
        centroid: Vector2;
        constructor(collider: Collider, fraction: number, distance: number, point: Vector2, normal: Vector2);
        setValues(collider: Collider, fraction: number, distance: number, point: Vector2): void;
        setValuesNonCollider(fraction: number, distance: number, point: Vector2, normal: Vector2): void;
        reset(): void;
        toString(): string;
    }
}
declare module es {
    abstract class Shape {
        position: Vector2;
        center: Vector2;
        bounds: Rectangle;
        abstract recalculateBounds(collider: Collider): any;
        abstract overlaps(other: Shape): boolean;
        abstract collidesWithShape(other: Shape, collisionResult: CollisionResult): boolean;
        abstract collidesWithLine(start: Vector2, end: Vector2, hit: RaycastHit): boolean;
        abstract containsPoint(point: Vector2): any;
        abstract pointCollidesWithShape(point: Vector2, result: CollisionResult): boolean;
        clone(): Shape;
    }
}
declare module es {
    class Polygon extends Shape {
        points: Vector2[];
        _areEdgeNormalsDirty: boolean;
        _originalPoints: Vector2[];
        _polygonCenter: Vector2;
        isBox: boolean;
        isUnrotated: boolean;
        constructor(points: Vector2[], isBox?: boolean);
        _edgeNormals: Vector2[];
        readonly edgeNormals: Vector2[];
        setPoints(points: Vector2[]): void;
        recalculateCenterAndEdgeNormals(): void;
        buildEdgeNormals(): void;
        static buildSymmetricalPolygon(vertCount: number, radius: number): any[];
        static recenterPolygonVerts(points: Vector2[]): void;
        static findPolygonCenter(points: Vector2[]): Vector2;
        static getFarthestPointInDirection(points: Vector2[], direction: Vector2): Vector2;
        static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2, distanceSquared: number, edgeNormal: Vector2): Vector2;
        static rotatePolygonVerts(radians: number, originalPoints: Vector2[], rotatedPoints: any): void;
        recalculateBounds(collider: Collider): void;
        overlaps(other: Shape): any;
        collidesWithShape(other: Shape, result: CollisionResult): boolean;
        collidesWithLine(start: es.Vector2, end: es.Vector2, hit: es.RaycastHit): boolean;
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: CollisionResult): boolean;
    }
}
declare module es {
    class Box extends Polygon {
        width: number;
        height: number;
        constructor(width: number, height: number);
        private static buildBox;
        updateBox(width: number, height: number): void;
        overlaps(other: Shape): any;
        collidesWithShape(other: Shape, result: CollisionResult): boolean;
        containsPoint(point: Vector2): boolean;
        pointCollidesWithShape(point: es.Vector2, result: es.CollisionResult): boolean;
    }
}
declare module es {
    class Circle extends Shape {
        radius: number;
        _originalRadius: number;
        constructor(radius: number);
        recalculateBounds(collider: es.Collider): void;
        overlaps(other: Shape): any;
        collidesWithShape(other: Shape, result: CollisionResult): boolean;
        collidesWithLine(start: es.Vector2, end: es.Vector2, hit: es.RaycastHit): boolean;
        containsPoint(point: es.Vector2): boolean;
        pointCollidesWithShape(point: Vector2, result: CollisionResult): boolean;
    }
}
declare module es {
    class CollisionResult {
        collider: Collider;
        normal: Vector2;
        minimumTranslationVector: Vector2;
        point: Vector2;
        removeHorizontal(deltaMovement: Vector2): void;
        invertResult(): this;
        toString(): string;
    }
}
declare module es {
    class RealtimeCollisions {
        static intersectMovingCircleToBox(s: Circle, b: Box, movement: Vector2): number;
    }
}
declare module es {
    class ShapeCollisions {
        static polygonToPolygon(first: Polygon, second: Polygon, result: CollisionResult): boolean;
        static intervalDistance(minA: number, maxA: number, minB: number, maxB: any): number;
        static getInterval(axis: Vector2, polygon: Polygon, min: number, max: number): {
            min: number;
            max: number;
        };
        static circleToPolygon(circle: Circle, polygon: Polygon, result: CollisionResult): boolean;
        static circleToBox(circle: Circle, box: Box, result: CollisionResult): boolean;
        static pointToCircle(point: Vector2, circle: Circle, result: CollisionResult): boolean;
        static pointToBox(point: Vector2, box: Box, result: CollisionResult): boolean;
        static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
        static pointToPoly(point: Vector2, poly: Polygon, result: CollisionResult): boolean;
        static circleToCircle(first: Circle, second: Circle, result: CollisionResult): boolean;
        static boxToBox(first: Box, second: Box, result: CollisionResult): boolean;
        private static minkowskiDifference;
        static lineToPoly(start: Vector2, end: Vector2, polygon: Polygon, hit: RaycastHit): boolean;
        static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection: Vector2): boolean;
        static lineToCircle(start: Vector2, end: Vector2, s: Circle, hit: RaycastHit): boolean;
        static boxToBoxCast(first: Box, second: Box, movement: Vector2, hit: RaycastHit): boolean;
    }
}
declare module es {
    class SpatialHash {
        gridBounds: Rectangle;
        _raycastParser: RaycastResultParser;
        _cellSize: number;
        _inverseCellSize: number;
        _overlapTestCircle: Circle;
        _cellDict: NumberDictionary;
        _tempHashSet: Collider[];
        constructor(cellSize?: number);
        register(collider: Collider): void;
        remove(collider: Collider): void;
        removeWithBruteForce(obj: Collider): void;
        clear(): void;
        debugDraw(secondsToDisplay: number, textScale?: number): void;
        aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): Collider[];
        overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask: any): number;
        private cellCoords;
        private cellAtPosition;
        private debugDrawCellDetails;
    }
    class NumberDictionary {
        _store: Map<string, Collider[]>;
        add(x: number, y: number, list: Collider[]): void;
        remove(obj: Collider): void;
        tryGetValue(x: number, y: number): Collider[];
        clear(): void;
        private getKey;
    }
    class RaycastResultParser {
        hitCounter: number;
        static compareRaycastHits: (a: RaycastHit, b: RaycastHit) => number;
        _hits: RaycastHit[];
        _tempHit: RaycastHit;
        _checkedColliders: Collider[];
        _cellHits: RaycastHit[];
        _ray: Ray2D;
        _layerMask: number;
        start(ray: Ray2D, hits: RaycastHit[], layerMask: number): void;
        checkRayIntersection(cellX: number, cellY: number, cell: Collider[]): boolean;
        reset(): void;
    }
}
declare class ArrayUtils {
    static bubbleSort(ary: number[]): void;
    static insertionSort(ary: number[]): void;
    static binarySearch(ary: number[], value: number): number;
    static findElementIndex(ary: any[], num: any): any;
    static getMaxElementIndex(ary: number[]): number;
    static getMinElementIndex(ary: number[]): number;
    static getUniqueAry(ary: number[]): number[];
    static getDifferAry(aryA: number[], aryB: number[]): number[];
    static swap(array: any[], index1: number, index2: number): void;
    static clearList(ary: any[]): void;
    static cloneList(ary: any[]): any[];
    static equals(ary1: number[], ary2: number[]): Boolean;
    static insert(ary: any[], index: number, value: any): any;
}
declare class Base64Utils {
    private static _keyNum;
    private static _keyStr;
    private static _keyAll;
    static encode: (input: any) => string;
    static decode(input: any, isNotStr?: boolean): string;
    private static _utf8_encode;
    private static _utf8_decode;
    private static getConfKey;
}
declare module es {
    class ContentManager {
        protected loadedAssets: Map<string, any>;
        loadRes(name: string, local?: boolean): Promise<any>;
        dispose(): void;
    }
}
declare module es {
    class DrawUtils {
        static drawLine(shape: egret.Shape, start: Vector2, end: Vector2, color: number, thickness?: number): void;
        static drawLineAngle(shape: egret.Shape, start: Vector2, radians: number, length: number, color: number, thickness?: number): void;
        static drawHollowRect(shape: egret.Shape, rect: Rectangle, color: number, thickness?: number): void;
        static drawHollowRectR(shape: egret.Shape, x: number, y: number, width: number, height: number, color: number, thickness?: number): void;
        static drawPixel(shape: egret.Shape, position: Vector2, color: number, size?: number): void;
        static getColorMatrix(color: number): egret.ColorMatrixFilter;
    }
}
declare module es {
    class FuncPack {
        func: Function;
        context: any;
        constructor(func: Function, context: any);
    }
    class Emitter<T> {
        private _messageTable;
        constructor();
        addObserver(eventType: T, handler: Function, context: any): void;
        removeObserver(eventType: T, handler: Function): void;
        emit(eventType: T, data?: any): void;
    }
}
declare module es {
    class GlobalManager {
        _enabled: boolean;
        enabled: boolean;
        setEnabled(isEnabled: boolean): void;
        onEnabled(): void;
        onDisabled(): void;
        update(): void;
    }
}
declare module es {
    class TouchState {
        x: number;
        y: number;
        touchPoint: number;
        touchDown: boolean;
        readonly position: Vector2;
        reset(): void;
    }
    class Input {
        private static _init;
        private static _previousTouchState;
        private static _resolutionOffset;
        private static _touchIndex;
        private static _gameTouchs;
        static readonly gameTouchs: TouchState[];
        private static _resolutionScale;
        static readonly resolutionScale: Vector2;
        private static _totalTouchCount;
        static readonly totalTouchCount: number;
        static readonly touchPosition: Vector2;
        static maxSupportedTouch: number;
        static readonly touchPositionDelta: Vector2;
        static initialize(): void;
        static scaledPosition(position: Vector2): Vector2;
        private static initTouchCache;
        private static touchBegin;
        private static touchMove;
        private static touchEnd;
        private static setpreviousTouchState;
    }
}
declare class KeyboardUtils {
    static TYPE_KEY_DOWN: number;
    static TYPE_KEY_UP: number;
    static A: string;
    static B: string;
    static C: string;
    static D: string;
    static E: string;
    static F: string;
    static G: string;
    static H: string;
    static I: string;
    static J: string;
    static K: string;
    static L: string;
    static M: string;
    static N: string;
    static O: string;
    static P: string;
    static Q: string;
    static R: string;
    static S: string;
    static T: string;
    static U: string;
    static V: string;
    static W: string;
    static X: string;
    static Y: string;
    static Z: string;
    static ESC: string;
    static F1: string;
    static F2: string;
    static F3: string;
    static F4: string;
    static F5: string;
    static F6: string;
    static F7: string;
    static F8: string;
    static F9: string;
    static F10: string;
    static F11: string;
    static F12: string;
    static NUM_1: string;
    static NUM_2: string;
    static NUM_3: string;
    static NUM_4: string;
    static NUM_5: string;
    static NUM_6: string;
    static NUM_7: string;
    static NUM_8: string;
    static NUM_9: string;
    static NUM_0: string;
    static TAB: string;
    static CTRL: string;
    static ALT: string;
    static SHIFT: string;
    static CAPS_LOCK: string;
    static ENTER: string;
    static SPACE: string;
    static BACK_SPACE: string;
    static INSERT: string;
    static DELETE: string;
    static HOME: string;
    static END: string;
    static PAGE_UP: string;
    static PAGE_DOWN: string;
    static LEFT: string;
    static RIGHT: string;
    static UP: string;
    static DOWN: string;
    static PAUSE_BREAK: string;
    static NUM_LOCK: string;
    static SCROLL_LOCK: string;
    static WINDOWS: string;
    private static keyDownDict;
    private static keyUpDict;
    static init(): void;
    static registerKey(key: string, fun: Function, thisObj: any, type?: number, ...args: any[]): void;
    static unregisterKey(key: string, type?: number): void;
    static destroy(): void;
    private static onKeyDonwHander;
    private static onKeyUpHander;
    private static keyCodeToString;
}
declare module es {
    class ListPool {
        private static readonly _objectQueue;
        static warmCache(cacheCount: number): void;
        static trimCache(cacheCount: any): void;
        static clearCache(): void;
        static obtain<T>(): T[];
        static free<T>(obj: Array<T>): void;
    }
}
declare const THREAD_ID: string;
declare const setItem: any;
declare const getItem: any;
declare const removeItem: any;
declare const nextTick: (fn: any) => void;
declare class LockUtils {
    private _keyX;
    private _keyY;
    constructor(key: any);
    lock(): Promise<{}>;
}
declare module es {
    class Pair<T> {
        first: T;
        second: T;
        constructor(first: T, second: T);
        clear(): void;
        equals(other: Pair<T>): boolean;
    }
}
declare class RandomUtils {
    static randrange(start: number, stop: number, step?: number): number;
    static randint(a: number, b: number): number;
    static randnum(a: number, b: number): number;
    static shuffle(array: any[]): any[];
    static choice(sequence: any): any;
    static sample(sequence: any[], num: number): any[];
    static random(): number;
    static boolean(chance?: number): boolean;
    private static _randomCompare;
}
declare module es {
    class RectangleExt {
        static union(first: Rectangle, point: Vector2): Rectangle;
    }
}
declare module es {
    class Triangulator {
        triangleIndices: number[];
        private _triPrev;
        private _triNext;
        static testPointTriangle(point: Vector2, a: Vector2, b: Vector2, c: Vector2): boolean;
        triangulate(points: Vector2[], arePointsCCW?: boolean): void;
        private initialize;
    }
}
declare module es {
    class Vector2Ext {
        static isTriangleCCW(a: Vector2, center: Vector2, c: Vector2): boolean;
        static cross(u: Vector2, v: Vector2): number;
        static perpendicular(first: Vector2, second: Vector2): Vector2;
        static normalize(vec: Vector2): Vector2;
        static transformA(sourceArray: Vector2[], sourceIndex: number, matrix: Matrix2D, destinationArray: Vector2[], destinationIndex: number, length: number): void;
        static transformR(position: Vector2, matrix: Matrix2D): Vector2;
        static transform(sourceArray: Vector2[], matrix: Matrix2D, destinationArray: Vector2[]): void;
        static round(vec: Vector2): Vector2;
    }
}
declare class WebGLUtils {
    static getContext(): CanvasRenderingContext2D;
}
declare module es {
    class Layout {
        clientArea: Rectangle;
        safeArea: Rectangle;
        constructor();
        place(size: Vector2, horizontalMargin: number, verticalMargine: number, alignment: Alignment): Rectangle;
    }
    enum Alignment {
        none = 0,
        left = 1,
        right = 2,
        horizontalCenter = 4,
        top = 8,
        bottom = 16,
        verticalCenter = 32,
        topLeft = 9,
        topRight = 10,
        topCenter = 12,
        bottomLeft = 17,
        bottomRight = 18,
        bottomCenter = 20,
        centerLeft = 33,
        centerRight = 34,
        center = 36
    }
}
declare namespace stopwatch {
    class Stopwatch {
        private readonly getSystemTime;
        private _startSystemTime;
        private _stopSystemTime;
        private _stopDuration;
        private _pendingSliceStartStopwatchTime;
        private _completeSlices;
        constructor(getSystemTime?: GetTimeFunc);
        getState(): State;
        isIdle(): boolean;
        isRunning(): boolean;
        isStopped(): boolean;
        slice(): Slice;
        getCompletedSlices(): Slice[];
        getCompletedAndPendingSlices(): Slice[];
        getPendingSlice(): Slice;
        getTime(): number;
        reset(): void;
        start(forceReset?: boolean): void;
        stop(recordPendingSlice?: boolean): number;
        private calculatePendingSlice;
        private caculateStopwatchTime;
        private getSystemTimeOfCurrentStopwatchTime;
        private recordPendingSlice;
    }
    type GetTimeFunc = () => number;
    enum State {
        IDLE = "IDLE",
        RUNNING = "RUNNING",
        STOPPED = "STOPPED"
    }
    function setDefaultSystemTimeGetter(systemTimeGetter?: GetTimeFunc): void;
    interface Slice {
        readonly startTime: number;
        readonly endTime: number;
        readonly duration: number;
    }
}
declare module es {
    class TimeRuler {
        static readonly maxBars: number;
        static readonly maxSamples: number;
        static readonly maxNestCall: number;
        static readonly barHeight: number;
        static readonly maxSampleFrames: number;
        static readonly logSnapDuration: number;
        static readonly barPadding: number;
        static readonly autoAdjustDelay: number;
        private static _instance;
        targetSampleFrames: number;
        width: number;
        enabled: true;
        showLog: boolean;
        private _frameKey;
        private _logKey;
        private _logs;
        private sampleFrames;
        private _position;
        private _prevLog;
        private _curLog;
        private frameCount;
        private markers;
        private stopwacth;
        private _markerNameToIdMap;
        private _updateCount;
        private _frameAdjust;
        constructor();
        static readonly Instance: TimeRuler;
        startFrame(): void;
        beginMark(markerName: string, color: number, barIndex?: number): void;
        endMark(markerName: string, barIndex?: number): void;
        getAverageTime(barIndex: number, markerName: string): number;
        resetLog(): void;
        render(position?: Vector2, width?: number): void;
        private onGraphicsDeviceReset;
    }
    class FrameLog {
        bars: MarkerCollection[];
        constructor();
    }
    class MarkerCollection {
        markers: Marker[];
        markCount: number;
        markerNests: number[];
        nestCount: number;
        constructor();
    }
    class Marker {
        markerId: number;
        beginTime: number;
        endTime: number;
        color: number;
    }
    class MarkerInfo {
        name: string;
        logs: MarkerLog[];
        constructor(name: any);
    }
    class MarkerLog {
        snapMin: number;
        snapMax: number;
        snapAvg: number;
        min: number;
        max: number;
        avg: number;
        samples: number;
        color: number;
        initialized: boolean;
    }
}
