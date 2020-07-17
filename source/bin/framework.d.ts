declare interface Array<T> {
    findIndex(predicate: Function): number;
    any(predicate: Function): boolean;
    firstOrDefault(predicate: Function): T;
    find(predicate: Function): T;
    where(predicate: Function): Array<T>;
    count(predicate: Function): number;
    findAll(predicate: Function): Array<T>;
    contains(value: any): boolean;
    removeAll(predicate: Function): void;
    remove(element: T): boolean;
    removeAt(index: any): void;
    removeRange(index: any, count: any): void;
    select(selector: Function): Array<T>;
    orderBy(keySelector: Function, comparer: Function): Array<T>;
    orderByDescending(keySelector: Function, comparer: Function): Array<T>;
    groupBy(keySelector: Function): Array<T>;
    sum(selector: any): any;
}
declare class PriorityQueueNode {
    priority: number;
    insertionIndex: number;
    queueIndex: number;
}
declare class AStarPathfinder {
    static search<T>(graph: IAstarGraph<T>, start: T, goal: T): T[];
    private static hasKey;
    private static getKey;
    static recontructPath<T>(cameFrom: Map<T, T>, start: T, goal: T): T[];
}
declare class AStarNode<T> extends PriorityQueueNode {
    data: T;
    constructor(data: T);
}
declare class AstarGridGraph implements IAstarGraph<Vector2> {
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
interface IAstarGraph<T> {
    getNeighbors(node: T): Array<T>;
    cost(from: T, to: T): number;
    heuristic(node: T, goal: T): any;
}
declare class PriorityQueue<T extends PriorityQueueNode> {
    private _numNodes;
    private _nodes;
    private _numNodesEverEnqueued;
    constructor(maxNodes: number);
    clear(): void;
    readonly count: number;
    readonly maxSize: number;
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
declare class BreadthFirstPathfinder {
    static search<T>(graph: IUnweightedGraph<T>, start: T, goal: T): T[];
    private static hasKey;
}
interface IUnweightedGraph<T> {
    getNeighbors(node: T): T[];
}
declare class UnweightedGraph<T> implements IUnweightedGraph<T> {
    edges: Map<T, T[]>;
    addEdgesForNode(node: T, edges: T[]): this;
    getNeighbors(node: T): T[];
}
declare class Vector2 {
    x: number;
    y: number;
    private static readonly unitYVector;
    private static readonly unitXVector;
    private static readonly unitVector2;
    private static readonly zeroVector2;
    static readonly zero: Vector2;
    static readonly one: Vector2;
    static readonly unitX: Vector2;
    static readonly unitY: Vector2;
    constructor(x?: number, y?: number);
    static add(value1: Vector2, value2: Vector2): Vector2;
    static divide(value1: Vector2, value2: Vector2): Vector2;
    static multiply(value1: Vector2, value2: Vector2): Vector2;
    static subtract(value1: Vector2, value2: Vector2): Vector2;
    normalize(): void;
    length(): number;
    round(): Vector2;
    static normalize(value: Vector2): Vector2;
    static dot(value1: Vector2, value2: Vector2): number;
    static distanceSquared(value1: Vector2, value2: Vector2): number;
    static clamp(value1: Vector2, min: Vector2, max: Vector2): Vector2;
    static lerp(value1: Vector2, value2: Vector2, amount: number): Vector2;
    static transform(position: Vector2, matrix: Matrix2D): Vector2;
    static distance(value1: Vector2, value2: Vector2): number;
    static negate(value: Vector2): Vector2;
}
declare class UnweightedGridGraph implements IUnweightedGraph<Vector2> {
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
interface IWeightedGraph<T> {
    getNeighbors(node: T): T[];
    cost(from: T, to: T): number;
}
declare class WeightedGridGraph implements IWeightedGraph<Vector2> {
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
declare class WeightedNode<T> extends PriorityQueueNode {
    data: T;
    constructor(data: T);
}
declare class WeightedPathfinder {
    static search<T>(graph: IWeightedGraph<T>, start: T, goal: T): T[];
    private static hasKey;
    private static getKey;
    static recontructPath<T>(cameFrom: Map<T, T>, start: T, goal: T): T[];
}
declare class Debug {
    private static _debugDrawItems;
    static drawHollowRect(rectanle: Rectangle, color: number, duration?: number): void;
    static render(): void;
}
declare class DebugDefaults {
    static verletParticle: number;
    static verletConstraintEdge: number;
}
declare enum DebugDrawType {
    line = 0,
    hollowRectangle = 1,
    pixel = 2,
    text = 3
}
declare class DebugDrawItem {
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
declare abstract class Component extends egret.DisplayObjectContainer {
    entity: Entity;
    private _enabled;
    updateInterval: number;
    userData: any;
    private _updateOrder;
    enabled: boolean;
    readonly localPosition: Vector2;
    setEnabled(isEnabled: boolean): this;
    updateOrder: number;
    setUpdateOrder(updateOrder: number): this;
    initialize(): void;
    onAddedToEntity(): void;
    onRemovedFromEntity(): void;
    onEnabled(): void;
    onDisabled(): void;
    debugRender(): void;
    update(): void;
    onEntityTransformChanged(comp: TransformComponent): void;
    registerComponent(): void;
    deregisterComponent(): void;
}
declare enum CoreEvents {
    SceneChanged = 0
}
declare class Entity extends egret.DisplayObjectContainer {
    private static _idGenerator;
    name: string;
    readonly id: number;
    scene: Scene;
    readonly components: ComponentList;
    private _updateOrder;
    private _enabled;
    _isDestoryed: boolean;
    private _tag;
    componentBits: BitSet;
    readonly isDestoryed: boolean;
    position: Vector2;
    scale: Vector2;
    rotation: number;
    enabled: boolean;
    setEnabled(isEnabled: boolean): this;
    tag: number;
    readonly stage: egret.Stage;
    constructor(name: string);
    private onAddToStage;
    updateOrder: number;
    roundPosition(): void;
    setUpdateOrder(updateOrder: number): this;
    setTag(tag: number): Entity;
    attachToScene(newScene: Scene): void;
    detachFromScene(): void;
    addComponent<T extends Component>(component: T): T;
    hasComponent<T extends Component>(type: any): boolean;
    getOrCreateComponent<T extends Component>(type: T): T;
    getComponent<T extends Component>(type: any): T;
    getComponents(typeName: string | any, componentList?: any): any;
    private onEntityTransformChanged;
    removeComponentForType<T extends Component>(type: any): boolean;
    removeComponent(component: Component): void;
    removeAllComponents(): void;
    update(): void;
    onAddedToScene(): void;
    onRemovedFromScene(): void;
    destroy(): void;
}
declare enum TransformComponent {
    rotation = 0,
    scale = 1,
    position = 2
}
declare class Scene extends egret.DisplayObjectContainer {
    camera: Camera;
    readonly entities: EntityList;
    readonly renderableComponents: RenderableComponentList;
    readonly content: ContentManager;
    enablePostProcessing: boolean;
    private _renderers;
    private _postProcessors;
    private _didSceneBegin;
    readonly entityProcessors: EntityProcessorList;
    constructor();
    createEntity(name: string): Entity;
    addEntity(entity: Entity): Entity;
    destroyAllEntities(): void;
    findEntity(name: string): Entity;
    addEntityProcessor(processor: EntitySystem): EntitySystem;
    removeEntityProcessor(processor: EntitySystem): void;
    getEntityProcessor<T extends EntitySystem>(): T;
    addRenderer<T extends Renderer>(renderer: T): T;
    getRenderer<T extends Renderer>(type: any): T;
    removeRenderer(renderer: Renderer): void;
    begin(): void;
    end(): void;
    protected onStart(): Promise<void>;
    protected onActive(): void;
    protected onDeactive(): void;
    protected unload(): void;
    update(): void;
    postRender(): void;
    render(): void;
    addPostProcessor<T extends PostProcessor>(postProcessor: T): T;
}
declare class SceneManager {
    private static _scene;
    private static _nextScene;
    static sceneTransition: SceneTransition;
    static stage: egret.Stage;
    static activeSceneChanged: Function;
    static emitter: Emitter<CoreEvents>;
    static content: ContentManager;
    private static _instnace;
    static readonly Instance: SceneManager;
    constructor(stage: egret.Stage);
    static scene: Scene;
    static initialize(stage: egret.Stage): void;
    static update(): void;
    static render(): void;
    static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T;
    static registerActiveSceneChanged(current: Scene, next: Scene): void;
    onSceneChanged(): void;
}
declare class Camera extends Component {
    private _zoom;
    private _origin;
    private _minimumZoom;
    private _maximumZoom;
    private _position;
    followLerp: number;
    deadzone: Rectangle;
    focusOffset: Vector2;
    mapLockEnabled: boolean;
    mapSize: Vector2;
    targetEntity: Entity;
    private _worldSpaceDeadZone;
    private _desiredPositionDelta;
    private _targetCollider;
    cameraStyle: CameraStyle;
    zoom: number;
    minimumZoom: number;
    maximumZoom: number;
    origin: Vector2;
    position: Vector2;
    x: number;
    y: number;
    constructor();
    onSceneSizeChanged(newWidth: number, newHeight: number): void;
    setMinimumZoom(minZoom: number): Camera;
    setMaximumZoom(maxZoom: number): Camera;
    setZoom(zoom: number): Camera;
    setRotation(rotation: number): Camera;
    setPosition(position: Vector2): this;
    follow(targetEntity: Entity, cameraStyle?: CameraStyle): void;
    update(): void;
    private clampToMapSize;
    private updateFollow;
}
declare enum CameraStyle {
    lockOn = 0,
    cameraWindow = 1
}
declare class ComponentPool<T extends PooledComponent> {
    private _cache;
    private _type;
    constructor(typeClass: any);
    obtain(): T;
    free(component: T): void;
}
declare abstract class PooledComponent extends Component {
    abstract reset(): any;
}
declare abstract class RenderableComponent extends PooledComponent implements IRenderable {
    private _isVisible;
    protected _areBoundsDirty: boolean;
    protected _bounds: Rectangle;
    protected _localOffset: Vector2;
    color: number;
    readonly width: number;
    readonly height: number;
    isVisible: boolean;
    readonly bounds: Rectangle;
    protected getWidth(): number;
    protected getHeight(): number;
    protected onBecameVisible(): void;
    protected onBecameInvisible(): void;
    abstract render(camera: Camera): any;
    isVisibleFromCamera(camera: Camera): boolean;
}
declare class Mesh extends RenderableComponent {
    private _mesh;
    constructor();
    setTexture(texture: egret.Texture): Mesh;
    onAddedToEntity(): void;
    onRemovedFromEntity(): void;
    render(camera: Camera): void;
    reset(): void;
}
declare class SpriteRenderer extends RenderableComponent {
    private _sprite;
    protected bitmap: egret.Bitmap;
    sprite: Sprite;
    setSprite(sprite: Sprite): SpriteRenderer;
    setColor(color: number): SpriteRenderer;
    isVisibleFromCamera(camera: Camera): boolean;
    render(camera: Camera): void;
    onRemovedFromEntity(): void;
    reset(): void;
}
declare class TiledSpriteRenderer extends SpriteRenderer {
    protected sourceRect: Rectangle;
    protected leftTexture: egret.Bitmap;
    protected rightTexture: egret.Bitmap;
    scrollX: number;
    scrollY: number;
    constructor(sprite: Sprite);
    render(camera: Camera): void;
}
declare class ScrollingSpriteRenderer extends TiledSpriteRenderer {
    scrollSpeedX: number;
    scroolSpeedY: number;
    private _scrollX;
    private _scrollY;
    update(): void;
    render(camera: Camera): void;
}
declare class Sprite {
    texture2D: egret.Texture;
    readonly sourceRect: Rectangle;
    readonly center: Vector2;
    origin: Vector2;
    readonly uvs: Rectangle;
    constructor(texture: egret.Texture, sourceRect?: Rectangle, origin?: Vector2);
}
declare class SpriteAnimation {
    readonly sprites: Sprite[];
    readonly frameRate: number;
    constructor(sprites: Sprite[], frameRate: number);
}
declare class SpriteAnimator extends SpriteRenderer {
    onAnimationCompletedEvent: Function;
    speed: number;
    animationState: State;
    currentAnimation: SpriteAnimation;
    currentAnimationName: string;
    currentFrame: number;
    readonly isRunning: boolean;
    private _animations;
    private _elapsedTime;
    private _loopMode;
    constructor(sprite?: Sprite);
    addAnimation(name: string, animation: SpriteAnimation): SpriteAnimator;
    play(name: string, loopMode?: LoopMode): void;
    isAnimationActive(name: string): boolean;
    pause(): void;
    unPause(): void;
    stop(): void;
    update(): void;
}
declare enum LoopMode {
    loop = 0,
    once = 1,
    clampForever = 2,
    pingPong = 3,
    pingPongOnce = 4
}
declare enum State {
    none = 0,
    running = 1,
    paused = 2,
    completed = 3
}
interface ITriggerListener {
    onTriggerEnter(other: Collider, local: Collider): any;
    onTriggerExit(other: Collider, local: Collider): any;
}
declare class Mover extends Component {
    private _triggerHelper;
    onAddedToEntity(): void;
    calculateMovement(motion: Vector2): {
        collisionResult: CollisionResult;
        motion: Vector2;
    };
    applyMovement(motion: Vector2): void;
    move(motion: Vector2): CollisionResult;
}
declare class ProjectileMover extends Component {
    private _tempTriggerList;
    private _collider;
    onAddedToEntity(): void;
    move(motion: Vector2): boolean;
    private notifyTriggerListeners;
}
declare abstract class Collider extends Component {
    shape: Shape;
    physicsLayer: number;
    isTrigger: boolean;
    registeredPhysicsBounds: Rectangle;
    shouldColliderScaleAndRotateWithTransform: boolean;
    collidesWithLayers: number;
    _localOffsetLength: number;
    protected _isParentEntityAddedToScene: any;
    protected _colliderRequiresAutoSizing: any;
    protected _localOffset: Vector2;
    protected _isColliderRegistered: any;
    readonly bounds: Rectangle;
    localOffset: Vector2;
    setLocalOffset(offset: Vector2): void;
    registerColliderWithPhysicsSystem(): void;
    unregisterColliderWithPhysicsSystem(): void;
    overlaps(other: Collider): any;
    collidesWith(collider: Collider, motion: Vector2): CollisionResult;
    onAddedToEntity(): void;
    onRemovedFromEntity(): void;
    onEnabled(): void;
    onDisabled(): void;
    onEntityTransformChanged(comp: TransformComponent): void;
    update(): void;
}
declare class BoxCollider extends Collider {
    width: number;
    setWidth(width: number): BoxCollider;
    height: number;
    setHeight(height: number): void;
    constructor();
    setSize(width: number, height: number): this;
}
declare class CircleCollider extends Collider {
    radius: number;
    constructor(radius?: number);
    setRadius(radius: number): CircleCollider;
}
declare class PolygonCollider extends Collider {
    constructor(points: Vector2[]);
}
declare class EntitySystem {
    private _scene;
    private _entities;
    private _matcher;
    readonly matcher: Matcher;
    scene: Scene;
    constructor(matcher?: Matcher);
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
declare abstract class EntityProcessingSystem extends EntitySystem {
    constructor(matcher: Matcher);
    abstract processEntity(entity: Entity): any;
    lateProcessEntity(entity: Entity): void;
    protected process(entities: Entity[]): void;
    protected lateProcess(entities: Entity[]): void;
}
declare abstract class PassiveSystem extends EntitySystem {
    onChanged(entity: Entity): void;
    protected process(entities: Entity[]): void;
}
declare abstract class ProcessingSystem extends EntitySystem {
    onChanged(entity: Entity): void;
    protected process(entities: Entity[]): void;
    abstract processSystem(): any;
}
declare class BitSet {
    private static LONG_MASK;
    private _bits;
    constructor(nbits?: number);
    and(bs: BitSet): void;
    andNot(bs: BitSet): void;
    cardinality(): number;
    clear(pos?: number): void;
    private ensure;
    get(pos: number): boolean;
    intersects(set: BitSet): boolean;
    isEmpty(): boolean;
    nextSetBit(from: number): number;
    set(pos: number, value?: boolean): void;
}
declare class ComponentList {
    private _entity;
    private _components;
    private _componentsToAdd;
    private _componentsToRemove;
    private _tempBufferList;
    constructor(entity: Entity);
    readonly count: number;
    readonly buffer: Component[];
    add(component: Component): void;
    remove(component: Component): void;
    removeAllComponents(): void;
    deregisterAllComponents(): void;
    registerAllComponents(): void;
    updateLists(): void;
    onEntityTransformChanged(comp: TransformComponent): void;
    private handleRemove;
    getComponent<T extends Component>(type: any, onlyReturnInitializedComponents: boolean): T;
    getComponents(typeName: string | any, components?: any): any;
    update(): void;
}
declare class ComponentTypeManager {
    private static _componentTypesMask;
    static add(type: any): void;
    static getIndexFor(type: any): number;
}
declare class EntityList {
    scene: Scene;
    private _entitiesToRemove;
    private _entitiesToAdded;
    private _tempEntityList;
    private _entities;
    private _entityDict;
    private _unsortedTags;
    constructor(scene: Scene);
    readonly count: number;
    readonly buffer: Entity[];
    add(entity: Entity): void;
    remove(entity: Entity): void;
    findEntity(name: string): Entity;
    getTagList(tag: number): Entity[];
    addToTagList(entity: Entity): void;
    removeFromTagList(entity: Entity): void;
    update(): void;
    removeAllEntities(): void;
    updateLists(): void;
}
declare class EntityProcessorList {
    private _processors;
    add(processor: EntitySystem): void;
    remove(processor: EntitySystem): void;
    onComponentAdded(entity: Entity): void;
    onComponentRemoved(entity: Entity): void;
    onEntityAdded(entity: Entity): void;
    onEntityRemoved(entity: Entity): void;
    protected notifyEntityChanged(entity: Entity): void;
    protected removeFromProcessors(entity: Entity): void;
    begin(): void;
    update(): void;
    lateUpdate(): void;
    end(): void;
    getProcessor<T extends EntitySystem>(): T;
}
declare class Matcher {
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
declare class ObjectUtils {
    static clone<T>(p: any, c?: T): T;
}
declare class RenderableComponentList {
    private _components;
    readonly count: number;
    readonly buffer: IRenderable[];
    add(component: IRenderable): void;
    remove(component: IRenderable): void;
    updateList(): void;
}
declare class StringUtils {
    static matchChineseWord(str: string): string[];
    static lTrim(target: string): string;
    static rTrim(target: string): string;
    static trim(target: string): string;
    static isWhiteSpace(str: string): boolean;
    static replaceMatch(mainStr: string, targetStr: string, replaceStr: string, caseMark?: boolean): string;
    private static specialSigns;
    static htmlSpecialChars(str: string, reversion?: boolean): string;
    static zfill(str: string, width?: number): string;
    static reverse(str: string): string;
    static cutOff(str: string, start: number, len: number, order?: boolean): string;
    static strReplace(str: string, rStr: string[]): string;
}
declare class TextureUtils {
    static sharedCanvas: HTMLCanvasElement;
    static sharedContext: CanvasRenderingContext2D;
    static convertImageToCanvas(texture: egret.Texture, rect?: egret.Rectangle): HTMLCanvasElement;
    static toDataURL(type: string, texture: egret.Texture, rect?: egret.Rectangle, encoderOptions?: any): string;
    static eliFoTevas(type: string, texture: egret.Texture, filePath: string, rect?: egret.Rectangle, encoderOptions?: any): void;
    static getPixel32(texture: egret.Texture, x: number, y: number): number[];
    static getPixels(texture: egret.Texture, x: number, y: number, width?: number, height?: number): number[];
}
declare class Time {
    static unscaledDeltaTime: any;
    static deltaTime: number;
    static timeScale: number;
    static frameCount: number;
    private static _lastTime;
    static _timeSinceSceneLoad: any;
    static update(currentTime: number): void;
    static sceneChanged(): void;
    static checkEvery(interval: number): boolean;
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
declare class GraphicsCapabilities extends egret.Capabilities {
    initialize(device: GraphicsDevice): void;
    private platformInitialize;
}
declare class GraphicsDevice {
    private viewport;
    graphicsCapabilities: GraphicsCapabilities;
    constructor();
}
declare class Viewport {
    private _x;
    private _y;
    private _width;
    private _height;
    private _minDepth;
    private _maxDepth;
    readonly aspectRatio: number;
    bounds: Rectangle;
    constructor(x: number, y: number, width: number, height: number);
}
declare class GaussianBlurEffect extends egret.CustomFilter {
    private static blur_frag;
    constructor();
}
declare class PolygonLightEffect extends egret.CustomFilter {
    private static vertSrc;
    private static fragmentSrc;
    constructor();
}
declare class PostProcessor {
    enable: boolean;
    effect: egret.Filter;
    scene: Scene;
    shape: egret.Shape;
    static default_vert: string;
    constructor(effect?: egret.Filter);
    onAddedToScene(scene: Scene): void;
    process(): void;
    onSceneBackBufferSizeChanged(newWidth: number, newHeight: number): void;
    protected drawFullscreenQuad(): void;
    unload(): void;
}
declare class GaussianBlurPostProcessor extends PostProcessor {
    onAddedToScene(scene: Scene): void;
}
declare abstract class Renderer {
    camera: Camera;
    onAddedToScene(scene: Scene): void;
    protected beginRender(cam: Camera): void;
    abstract render(scene: Scene): any;
    unload(): void;
    protected renderAfterStateCheck(renderable: IRenderable, cam: Camera): void;
}
declare class DefaultRenderer extends Renderer {
    render(scene: Scene): void;
}
interface IRenderable {
    bounds: Rectangle;
    enabled: boolean;
    isVisible: boolean;
    isVisibleFromCamera(camera: Camera): any;
    render(camera: Camera): any;
}
declare class ScreenSpaceRenderer extends Renderer {
    render(scene: Scene): void;
}
declare class PolyLight extends RenderableComponent {
    power: number;
    protected _radius: number;
    private _lightEffect;
    private _indices;
    radius: number;
    constructor(radius: number, color: number, power: number);
    private computeTriangleIndices;
    setRadius(radius: number): void;
    render(camera: Camera): void;
    reset(): void;
}
declare abstract class SceneTransition {
    private _hasPreviousSceneRender;
    loadsNewScene: boolean;
    isNewSceneLoaded: boolean;
    protected sceneLoadAction: Function;
    onScreenObscured: Function;
    onTransitionCompleted: Function;
    readonly hasPreviousSceneRender: boolean;
    constructor(sceneLoadAction: Function);
    preRender(): void;
    render(): void;
    onBeginTransition(): Promise<void>;
    protected transitionComplete(): void;
    protected loadNextScene(): Promise<void>;
    tickEffectProgressProperty(filter: egret.CustomFilter, duration: number, easeType: Function, reverseDirection?: boolean): Promise<boolean>;
}
declare class FadeTransition extends SceneTransition {
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
declare class WindTransition extends SceneTransition {
    private _mask;
    private _windEffect;
    duration: number;
    windSegments: number;
    size: number;
    easeType: (t: number) => number;
    constructor(sceneLoadAction: Function);
    onBeginTransition(): Promise<void>;
}
declare class Bezier {
    static getPoint(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
    static getFirstDerivative(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2;
    static getFirstDerivativeThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
    static getPointThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2, t: number): Vector2;
    static getOptimizedDrawingPoints(start: Vector2, firstCtrlPoint: Vector2, secondCtrlPoint: Vector2, end: Vector2, distanceTolerance?: number): Vector2[];
    private static recursiveGetOptimizedDrawingPoints;
}
declare class Flags {
    static isFlagSet(self: number, flag: number): boolean;
    static isUnshiftedFlagSet(self: number, flag: number): boolean;
    static setFlagExclusive(self: number, flag: number): number;
    static setFlag(self: number, flag: number): number;
    static unsetFlag(self: number, flag: number): number;
    static invertFlags(self: number): number;
}
declare class MathHelper {
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
declare class Matrix2D {
    m11: number;
    m12: number;
    m21: number;
    m22: number;
    m31: number;
    m32: number;
    private static _identity;
    static readonly identity: Matrix2D;
    constructor(m11?: number, m12?: number, m21?: number, m22?: number, m31?: number, m32?: number);
    translation: Vector2;
    rotation: number;
    rotationDegrees: number;
    scale: Vector2;
    static add(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
    static divide(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
    static multiply(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
    static multiplyTranslation(matrix: Matrix2D, x: number, y: number): Matrix2D;
    determinant(): number;
    static invert(matrix: Matrix2D, result?: Matrix2D): Matrix2D;
    static createTranslation(xPosition: number, yPosition: number): Matrix2D;
    static createTranslationVector(position: Vector2): Matrix2D;
    static createRotation(radians: number, result?: Matrix2D): Matrix2D;
    static createScale(xScale: number, yScale: number, result?: Matrix2D): Matrix2D;
    toEgretMatrix(): egret.Matrix;
}
declare class Rectangle extends egret.Rectangle {
    readonly max: Vector2;
    readonly center: Vector2;
    location: Vector2;
    size: Vector2;
    intersects(value: egret.Rectangle): boolean;
    containsRect(value: Rectangle): boolean;
    getHalfSize(): Vector2;
    static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): Rectangle;
    getClosestPointOnRectangleBorderToPoint(point: Vector2): {
        res: Vector2;
        edgeNormal: Vector2;
    };
    getClosestPointOnBoundsToOrigin(): Vector2;
    static rectEncompassingPoints(points: Vector2[]): Rectangle;
}
declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number);
}
declare class ColliderTriggerHelper {
    private _entity;
    private _activeTriggerIntersections;
    private _previousTriggerIntersections;
    private _tempTriggerList;
    constructor(entity: Entity);
    update(): void;
    private checkForExitedColliders;
    private notifyTriggerListeners;
}
declare enum PointSectors {
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
declare class Collisions {
    static isLineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): boolean;
    static lineToLineIntersection(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): Vector2;
    static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
    static isCircleToCircle(circleCenter1: Vector2, circleRadius1: number, circleCenter2: Vector2, circleRadius2: number): boolean;
    static isCircleToLine(circleCenter: Vector2, radius: number, lineFrom: Vector2, lineTo: Vector2): boolean;
    static isCircleToPoint(circleCenter: Vector2, radius: number, point: Vector2): boolean;
    static isRectToCircle(rect: Rectangle, cPosition: Vector2, cRadius: number): boolean;
    static isRectToLine(rect: Rectangle, lineFrom: Vector2, lineTo: Vector2): boolean;
    static isRectToPoint(rX: number, rY: number, rW: number, rH: number, point: Vector2): boolean;
    static getSector(rX: number, rY: number, rW: number, rH: number, point: Vector2): PointSectors;
}
declare class Physics {
    private static _spatialHash;
    static spatialHashCellSize: number;
    static readonly allLayers: number;
    static reset(): void;
    static clear(): void;
    static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask?: number): number;
    static boxcastBroadphase(rect: Rectangle, layerMask?: number): {
        colliders: Collider[];
        rect: Rectangle;
    };
    static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask?: number): {
        tempHashSet: Collider[];
        bounds: Rectangle;
    };
    static addCollider(collider: Collider): void;
    static removeCollider(collider: Collider): void;
    static updateCollider(collider: Collider): void;
    static debugDraw(secondsToDisplay: any): void;
}
declare abstract class Shape {
    bounds: Rectangle;
    position: Vector2;
    abstract center: Vector2;
    abstract recalculateBounds(collider: Collider): any;
    abstract pointCollidesWithShape(point: Vector2): CollisionResult;
    abstract overlaps(other: Shape): any;
    abstract collidesWithShape(other: Shape): CollisionResult;
}
declare class Polygon extends Shape {
    points: Vector2[];
    isUnrotated: boolean;
    private _polygonCenter;
    private _areEdgeNormalsDirty;
    protected _originalPoints: Vector2[];
    center: Vector2;
    _edgeNormals: Vector2[];
    readonly edgeNormals: Vector2[];
    isBox: boolean;
    constructor(points: Vector2[], isBox?: boolean);
    private buildEdgeNormals;
    setPoints(points: Vector2[]): void;
    collidesWithShape(other: Shape): any;
    recalculateCenterAndEdgeNormals(): void;
    overlaps(other: Shape): any;
    static findPolygonCenter(points: Vector2[]): Vector2;
    static recenterPolygonVerts(points: Vector2[]): void;
    static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2): {
        closestPoint: any;
        distanceSquared: any;
        edgeNormal: any;
    };
    pointCollidesWithShape(point: Vector2): CollisionResult;
    containsPoint(point: Vector2): boolean;
    static buildSymmertricalPolygon(vertCount: number, radius: number): any[];
    recalculateBounds(collider: Collider): void;
}
declare class Box extends Polygon {
    width: number;
    height: number;
    constructor(width: number, height: number);
    private static buildBox;
    overlaps(other: Shape): any;
    collidesWithShape(other: Shape): any;
    updateBox(width: number, height: number): void;
    containsPoint(point: Vector2): boolean;
}
declare class Circle extends Shape {
    radius: number;
    _originalRadius: number;
    center: Vector2;
    constructor(radius: number);
    pointCollidesWithShape(point: Vector2): CollisionResult;
    collidesWithShape(other: Shape): CollisionResult;
    recalculateBounds(collider: Collider): void;
    overlaps(other: Shape): any;
}
declare class CollisionResult {
    collider: Collider;
    minimumTranslationVector: Vector2;
    normal: Vector2;
    point: Vector2;
    invertResult(): void;
}
declare class ShapeCollisions {
    static polygonToPolygon(first: Polygon, second: Polygon): CollisionResult;
    static intervalDistance(minA: number, maxA: number, minB: number, maxB: any): number;
    static getInterval(axis: Vector2, polygon: Polygon, min: number, max: number): {
        min: number;
        max: number;
    };
    static circleToPolygon(circle: Circle, polygon: Polygon): CollisionResult;
    static circleToBox(circle: Circle, box: Box): CollisionResult;
    static pointToCircle(point: Vector2, circle: Circle): CollisionResult;
    static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2;
    static pointToPoly(point: Vector2, poly: Polygon): CollisionResult;
    static circleToCircle(first: Circle, second: Circle): CollisionResult;
    static boxToBox(first: Box, second: Box): CollisionResult;
    private static minkowskiDifference;
}
declare class SpatialHash {
    gridBounds: Rectangle;
    private _raycastParser;
    private _cellSize;
    private _inverseCellSize;
    private _overlapTestCircle;
    private _tempHashSet;
    private _cellDict;
    constructor(cellSize?: number);
    remove(collider: Collider): void;
    register(collider: Collider): void;
    clear(): void;
    overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask: any): number;
    aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): {
        tempHashSet: Collider[];
        bounds: Rectangle;
    };
    private cellAtPosition;
    private cellCoords;
    debugDraw(secondsToDisplay: number, textScale?: number): void;
    private debugDrawCellDetails;
}
declare class RaycastResultParser {
}
declare class NumberDictionary {
    private _store;
    private getKey;
    private intToUint;
    add(x: number, y: number, list: Collider[]): void;
    remove(obj: Collider): void;
    tryGetValue(x: number, y: number): Collider[];
    clear(): void;
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
declare class ContentManager {
    protected loadedAssets: Map<string, any>;
    loadRes(name: string, local?: boolean): Promise<any>;
    dispose(): void;
}
declare class DrawUtils {
    static drawLine(shape: egret.Shape, start: Vector2, end: Vector2, color: number, thickness?: number): void;
    static drawLineAngle(shape: egret.Shape, start: Vector2, radians: number, length: number, color: number, thickness?: number): void;
    static drawHollowRect(shape: egret.Shape, rect: Rectangle, color: number, thickness?: number): void;
    static drawHollowRectR(shape: egret.Shape, x: number, y: number, width: number, height: number, color: number, thickness?: number): void;
    static drawPixel(shape: egret.Shape, position: Vector2, color: number, size?: number): void;
}
declare class Emitter<T> {
    private _messageTable;
    constructor();
    addObserver(eventType: T, handler: Function, context: any): void;
    removeObserver(eventType: T, handler: Function): void;
    emit(eventType: T, data?: any): void;
}
declare class FuncPack {
    func: Function;
    context: any;
    constructor(func: Function, context: any);
}
declare class GlobalManager {
    static globalManagers: GlobalManager[];
    private _enabled;
    enabled: boolean;
    setEnabled(isEnabled: boolean): void;
    onEnabled(): void;
    onDisabled(): void;
    update(): void;
    static registerGlobalManager(manager: GlobalManager): void;
    static unregisterGlobalManager(manager: GlobalManager): void;
    static getGlobalManager<T extends GlobalManager>(type: any): T;
}
declare class TouchState {
    x: number;
    y: number;
    touchPoint: number;
    touchDown: boolean;
    readonly position: Vector2;
    reset(): void;
}
declare class Input {
    private static _init;
    private static _stage;
    private static _previousTouchState;
    private static _gameTouchs;
    private static _resolutionOffset;
    private static _resolutionScale;
    private static _touchIndex;
    private static _totalTouchCount;
    static readonly touchPosition: Vector2;
    static maxSupportedTouch: number;
    static readonly resolutionScale: Vector2;
    static readonly totalTouchCount: number;
    static readonly gameTouchs: TouchState[];
    static readonly touchPositionDelta: Vector2;
    static initialize(stage: egret.Stage): void;
    private static initTouchCache;
    private static touchBegin;
    private static touchMove;
    private static touchEnd;
    private static setpreviousTouchState;
    static scaledPosition(position: Vector2): Vector2;
}
declare class KeyboardUtils {
    static TYPE_KEY_DOWN: number;
    static TYPE_KEY_UP: number;
    private static keyDownDict;
    private static keyUpDict;
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
    static init(): void;
    private static onKeyDonwHander;
    private static onKeyUpHander;
    static registerKey(key: string, fun: Function, thisObj: any, type?: number, ...args: any[]): void;
    static unregisterKey(key: string, type?: number): void;
    private static keyCodeToString;
    static destroy(): void;
}
declare class ListPool {
    private static readonly _objectQueue;
    static warmCache(cacheCount: number): void;
    static trimCache(cacheCount: any): void;
    static clearCache(): void;
    static obtain<T>(): Array<T>;
    static free<T>(obj: Array<T>): void;
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
declare class Pair<T> {
    first: T;
    second: T;
    constructor(first: T, second: T);
    clear(): void;
    equals(other: Pair<T>): boolean;
}
declare class RandomUtils {
    static randrange(start: number, stop: number, step?: number): number;
    static randint(a: number, b: number): number;
    static randnum(a: number, b: number): number;
    static shuffle(array: any[]): any[];
    private static _randomCompare;
    static choice(sequence: any): any;
    static sample(sequence: any[], num: number): any[];
    static random(): number;
    static boolean(chance?: number): boolean;
}
declare class RectangleExt {
    static union(first: Rectangle, point: Vector2): Rectangle;
}
declare class Triangulator {
    triangleIndices: number[];
    private _triPrev;
    private _triNext;
    triangulate(points: Vector2[], arePointsCCW?: boolean): void;
    private initialize;
    static testPointTriangle(point: Vector2, a: Vector2, b: Vector2, c: Vector2): boolean;
}
declare class Vector2Ext {
    static isTriangleCCW(a: Vector2, center: Vector2, c: Vector2): boolean;
    static cross(u: Vector2, v: Vector2): number;
    static perpendicular(first: Vector2, second: Vector2): Vector2;
    static normalize(vec: Vector2): Vector2;
    static transformA(sourceArray: Vector2[], sourceIndex: number, matrix: Matrix2D, destinationArray: Vector2[], destinationIndex: number, length: number): void;
    static transformR(position: Vector2, matrix: Matrix2D): Vector2;
    static transform(sourceArray: Vector2[], matrix: Matrix2D, destinationArray: Vector2[]): void;
    static round(vec: Vector2): Vector2;
}
declare class Layout {
    clientArea: Rectangle;
    safeArea: Rectangle;
    constructor();
    place(size: Vector2, horizontalMargin: number, verticalMargine: number, alignment: Alignment): Rectangle;
}
declare enum Alignment {
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
        private calculatePendingSlice;
        private caculateStopwatchTime;
        private getSystemTimeOfCurrentStopwatchTime;
        reset(): void;
        start(forceReset?: boolean): void;
        stop(recordPendingSlice?: boolean): number;
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
declare class TimeRuler {
    static readonly maxBars: number;
    static readonly maxSamples: number;
    static readonly maxNestCall: number;
    static readonly barHeight: number;
    static readonly maxSampleFrames: number;
    static readonly logSnapDuration: number;
    static readonly barPadding: number;
    static readonly autoAdjustDelay: number;
    static Instance: TimeRuler;
    private _frameKey;
    private _logKey;
    private _logs;
    private sampleFrames;
    targetSampleFrames: number;
    width: number;
    enabled: true;
    private _position;
    private _prevLog;
    private _curLog;
    private frameCount;
    private markers;
    private stopwacth;
    private _markerNameToIdMap;
    private _updateCount;
    showLog: boolean;
    private _frameAdjust;
    constructor();
    private onGraphicsDeviceReset;
    startFrame(): void;
    beginMark(markerName: string, color: number, barIndex?: number): void;
    endMark(markerName: string, barIndex?: number): void;
    getAverageTime(barIndex: number, markerName: string): number;
    resetLog(): void;
    render(position?: Vector2, width?: number): void;
}
declare class FrameLog {
    bars: MarkerCollection[];
    constructor();
}
declare class MarkerCollection {
    markers: Marker[];
    markCount: number;
    markerNests: number[];
    nestCount: number;
}
declare class Marker {
    markerId: number;
    beginTime: number;
    endTime: number;
    color: number;
}
declare class MarkerInfo {
    name: string;
    logs: MarkerLog[];
    constructor(name: any);
}
declare class MarkerLog {
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
