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
    remove(element: any): boolean;
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
declare class AstarGridGraph implements IAstarGraph<Point> {
    dirs: Point[];
    walls: Point[];
    weightedNodes: Point[];
    defaultWeight: number;
    weightedNodeWeight: number;
    private _width;
    private _height;
    private _neighbors;
    constructor(width: number, height: number);
    isNodeInBounds(node: Point): boolean;
    isNodePassable(node: Point): boolean;
    search(start: Point, goal: Point): Point[];
    getNeighbors(node: Point): Point[];
    cost(from: Point, to: Point): number;
    heuristic(node: Point, goal: Point): number;
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
declare class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
}
declare class UnweightedGridGraph implements IUnweightedGraph<Point> {
    private static readonly CARDINAL_DIRS;
    private static readonly COMPASS_DIRS;
    walls: Point[];
    private _width;
    private _hegiht;
    private _dirs;
    private _neighbors;
    constructor(width: number, height: number, allowDiagonalSearch?: boolean);
    isNodeInBounds(node: Point): boolean;
    isNodePassable(node: Point): boolean;
    getNeighbors(node: Point): Point[];
    search(start: Point, goal: Point): Point[];
}
interface IWeightedGraph<T> {
    getNeighbors(node: T): T[];
    cost(from: T, to: T): number;
}
declare class WeightedGridGraph implements IWeightedGraph<Point> {
    static readonly CARDINAL_DIRS: Point[];
    private static readonly COMPASS_DIRS;
    walls: Point[];
    weightedNodes: Point[];
    defaultWeight: number;
    weightedNodeWeight: number;
    private _width;
    private _height;
    private _dirs;
    private _neighbors;
    constructor(width: number, height: number, allowDiagonalSearch?: boolean);
    isNodeInBounds(node: Point): boolean;
    isNodePassable(node: Point): boolean;
    search(start: Point, goal: Point): Point[];
    getNeighbors(node: Point): Point[];
    cost(from: Point, to: Point): number;
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
declare class DebugDefaults {
    static verletParticle: number;
    static verletConstraintEdge: number;
}
declare abstract class Component extends egret.DisplayObjectContainer {
    entity: Entity;
    private _enabled;
    updateInterval: number;
    enabled: boolean;
    setEnabled(isEnabled: boolean): this;
    readonly stage: egret.Stage;
    readonly scene: Scene;
    initialize(): void;
    onAddedToEntity(): void;
    onRemovedFromEntity(): void;
    onEnabled(): void;
    onDisabled(): void;
    onEntityTransformChanged(comp: ComponentTransform): void;
    update(): void;
    debugRender(): void;
    registerComponent(): void;
    deregisterComponent(): void;
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
    enabled: boolean;
    setEnabled(isEnabled: boolean): this;
    tag: number;
    readonly stage: egret.Stage;
    constructor(name: string);
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
    removeComponentForType<T extends Component>(type: any): boolean;
    removeComponent(component: Component): void;
    removeAllComponents(): void;
    update(): void;
    onAddedToScene(): void;
    onRemovedFromScene(): void;
    onTransformChanged(comp: ComponentTransform): void;
    destroy(): void;
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
    constructor(stage: egret.Stage);
    static scene: Scene;
    static initialize(stage: egret.Stage): void;
    static update(): void;
    static render(): void;
    static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T;
}
declare enum DirtyType {
    clean = 0,
    positionDirty = 1,
    scaleDirty = 2,
    rotationDirty = 3
}
declare enum ComponentTransform {
    position = 0,
    scale = 1,
    rotation = 2
}
declare class Transform {
    readonly entity: Entity;
    private _children;
    private _parent;
    private _localPosition;
    private _localRotation;
    private _localScale;
    private _translationMatrix;
    private _rotationMatrix;
    private _scaleMatrix;
    private _worldTransform;
    private _worldToLocalTransform;
    private _worldInverseTransform;
    private _rotation;
    private _position;
    private _scale;
    private _localTransform;
    private _hierachyDirty;
    private _localDirty;
    private _localPositionDirty;
    private _localScaleDirty;
    private _localRotationDirty;
    private _positionDirty;
    private _worldToLocalDirty;
    private _worldInverseDirty;
    readonly childCount: number;
    constructor(entity: Entity);
    getChild(index: number): Transform;
    readonly worldInverseTransform: Matrix2D;
    readonly localToWorldTransform: Matrix2D;
    readonly worldToLocalTransform: Matrix2D;
    parent: Transform;
    setParent(parent: Transform): this;
    rotation: number;
    localRotation: number;
    position: Vector2;
    localPosition: Vector2;
    scale: Vector2;
    localScale: Vector2;
    rotationDegrees: number;
    localRotationDegrees: number;
    setLocalScale(scale: Vector2): this;
    setScale(scale: Vector2): this;
    setLocalRotationDegrees(degrees: number): this;
    setLocalRotation(radians: number): this;
    setRotation(radians: number): this;
    setRotationDegrees(degrees: number): this;
    setLocalPosition(localPosition: Vector2): this;
    setPosition(position: Vector2): this;
    setDirty(dirtyFlagType: DirtyType): void;
    roundPosition(): void;
    updateTransform(): void;
}
declare class Camera extends Component {
    private _zoom;
    private _origin;
    private _transformMatrix;
    private _inverseTransformMatrix;
    private _minimumZoom;
    private _maximumZoom;
    private _areMatrixesDirty;
    private _inset;
    private _bounds;
    private _areBoundsDirty;
    readonly bounds: Rectangle;
    zoom: number;
    minimumZoom: number;
    maximumZoom: number;
    origin: Vector2;
    position: Vector2;
    readonly transformMatrix: Matrix2D;
    readonly inverseTransformMatrix: Matrix2D;
    constructor();
    onSceneSizeChanged(newWidth: number, newHeight: number): void;
    setMinimumZoom(minZoom: number): Camera;
    setMaximumZoom(maxZoom: number): Camera;
    setZoom(zoom: number): this;
    setPosition(position: Vector2): this;
    forceMatrixUpdate(): void;
    protected updateMatrixes(): void;
    screenToWorldPoint(screenPosition: Vector2): Vector2;
    worldToScreenPoint(worldPosition: Vector2): Vector2;
    onEntityTransformChanged(comp: ComponentTransform): void;
    destory(): void;
}
declare class CameraInset {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
declare class FollowCamera extends Component {
    camera: Camera;
    followLerp: number;
    deadzone: Rectangle;
    focusOffset: Vector2;
    mapLockEnabled: boolean;
    mapSize: Vector2;
    private _targetEntity;
    private _cameraStyle;
    private _worldSpaceDeadZone;
    private _desiredPositionDelta;
    private _targetCollider;
    constructor(targetEntity: Entity, cameraStyle?: CameraStyle);
    onAddedToEntity(): void;
    follow(targetEntity: Entity, cameraStyle?: CameraStyle): void;
    update(): void;
    private clampToMapSize;
    private updateFollow;
}
declare enum CameraStyle {
    lockOn = 0,
    cameraWindow = 1
}
declare class Mesh extends Component {
    private _verts;
    private _primitiveCount;
    private _triangles;
    private _topLeftVertPosition;
    private _width;
    private _height;
    initialize(): void;
    setVertPosition(positions: Vector2[]): this;
    setTriangles(triangles: number[]): this;
    recalculateBounds(): this;
    render(): void;
}
declare class VertexPosition {
    position: Vector2;
    constructor(position: Vector2);
}
declare class PolygonMesh extends Mesh {
    constructor(points: Vector2[], arePointsCCW?: boolean);
}
declare abstract class RenderableComponent extends Component implements IRenderable {
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
    onEntityTransformChanged(comp: ComponentTransform): void;
}
declare class ScreenSpaceCamera extends Camera {
    protected updateMatrixes(): void;
}
declare class Sprite {
    texture2D: egret.Texture;
    readonly sourceRect: Rectangle;
    readonly center: Vector2;
    origin: Vector2;
    readonly uvs: Rectangle;
    constructor(texture: egret.Texture, sourceRect?: Rectangle, origin?: Vector2);
}
declare class SpriteRenderer extends RenderableComponent {
    private _origin;
    origin: Vector2;
    setOrigin(origin: Vector2): this;
    setSprite(sprite: Sprite): void;
    setColor(color: number): void;
    isVisibleFromCamera(camera: Camera): boolean;
    render(camera: Camera): void;
    onRemovedFromEntity(): void;
}
interface ITriggerListener {
    onTriggerEnter(other: Collider, local: Collider): any;
    onTriggerExit(other: Collider, local: Collider): any;
}
declare class Mover extends Component {
    private _triggerHelper;
    onAddedToEntity(): void;
    calculateMovement(motion: Vector2): CollisionResult;
    applyMovement(motion: Vector2): void;
    move(motion: Vector2): CollisionResult;
}
declare abstract class Collider extends Component {
    shape: Shape;
    physicsLayer: number;
    isTrigger: boolean;
    registeredPhysicsBounds: Rectangle;
    shouldColliderScaleAndRotationWithTransform: boolean;
    collidesWithLayers: number;
    _localOffsetLength: number;
    _isPositionDirty: boolean;
    _isRotationDirty: boolean;
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
    onEntityTransformChanged(comp: ComponentTransform): void;
    onEnabled(): void;
    onDisabled(): void;
}
declare class BoxCollider extends Collider {
    width: number;
    setWidth(width: number): BoxCollider;
    height: number;
    setHeight(height: number): void;
    constructor();
    setSize(width: number, height: number): this;
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
    private handleRemove;
    getComponent<T extends Component>(type: any, onlyReturnInitializedComponents: boolean): T;
    getComponents(typeName: string | any, components?: any): any;
    update(): void;
    onEntityTransformChanged(comp: any): void;
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
    IsIntersted(e: Entity): boolean;
}
declare class RenderableComponentList {
    private _components;
    readonly count: number;
    readonly buffer: IRenderable[];
    add(component: IRenderable): void;
    remove(component: IRenderable): void;
    updateList(): void;
}
declare class Time {
    static unscaledDeltaTime: any;
    static deltaTime: number;
    static timeScale: number;
    static frameCount: number;
    private static _lastTime;
    static update(currentTime: number): void;
}
declare class GraphicsCapabilities {
    supportsTextureFilterAnisotropic: boolean;
    supportsNonPowerOfTwo: boolean;
    supportsDepth24: boolean;
    supportsPackedDepthStencil: boolean;
    supportsDepthNonLinear: boolean;
    supportsTextureMaxLevel: boolean;
    supportsS3tc: boolean;
    supportsDxt1: boolean;
    supportsPvrtc: boolean;
    supportsAtitc: boolean;
    supportsFramebufferObjectARB: boolean;
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
declare abstract class GraphicsResource {
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
declare class BloomSettings {
    readonly threshold: any;
    readonly blurAmount: any;
    readonly intensity: any;
    readonly baseIntensity: any;
    readonly saturation: any;
    readonly baseStaturation: any;
    constructor(bloomThreshold: number, blurAmount: number, bloomIntensity: number, baseIntensity: number, bloomSaturation: number, baseSaturation: number);
    static presetSettings: BloomSettings[];
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
    readonly bounds: Rectangle;
    radius: number;
    constructor(radius: number, color: number, power: number);
    private computeTriangleIndices;
    setRadius(radius: number): void;
    render(camera: Camera): void;
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
    onBeginTransition(): void;
    protected transitionComplete(): void;
    protected loadNextScene(): Promise<void>;
    tickEffectProgressProperty(filter: egret.CustomFilter, duration: number, easeType: Function, reverseDirection?: boolean): Promise<{}>;
}
declare class FadeTransition extends SceneTransition {
    fadeToColor: number;
    fadeOutDuration: number;
    fadeEaseType: Function;
    delayBeforeFadeInDuration: number;
    private _mask;
    private _alpha;
    constructor(sceneLoadAction: Function);
    onBeginTransition(): void;
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
    onBeginTransition(): void;
}
declare class BaseView extends egret.DisplayObjectContainer {
    protected _data: any;
    protected init(): void;
    show(data?: any): void;
    refreshData(data?: any): void;
    refreshView(): void;
    close(): void;
    destroy(): void;
}
declare class BaseFuiView extends BaseView {
    protected _name: string;
    constructor(name: string);
}
declare class BaseSingle {
    private static _instance;
    static getInstance<T>(): T;
    protected clearFuiObj(obj: fairygui.GObject): boolean;
}
declare class ViewManager extends BaseSingle {
    private _openDic;
    refreshView(viewClass: any, data?: any): void;
    openView(viewClass: any, data?: any, complete?: Function): void;
    getView<T>(viewClass: any): T;
    existView(viewClass: any): boolean;
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
    static createTranslation(xPosition: number, yPosition: number, result?: Matrix2D): Matrix2D;
    static createRotation(radians: number, result?: Matrix2D): Matrix2D;
    static createScale(xScale: number, yScale: number, result?: Matrix2D): Matrix2D;
    toEgretMatrix(): egret.Matrix;
}
declare class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    private _tempMat;
    private _transformMat;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly center: Vector2;
    location: Vector2;
    size: Vector2;
    constructor(x?: number, y?: number, width?: number, height?: number);
    intersects(value: Rectangle): boolean;
    contains(value: Vector2): boolean;
    containsRect(value: Rectangle): boolean;
    getHalfSize(): Vector2;
    static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): Rectangle;
    getClosestPointOnRectangleBorderToPoint(point: Point): {
        res: Vector2;
        edgeNormal: Vector2;
    };
    calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number): void;
    static rectEncompassingPoints(points: Vector2[]): Rectangle;
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
    static boxcastBroadphase(rect: Rectangle, layerMask?: number): Collider[];
    static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask?: number): Collider[];
    static addCollider(collider: Collider): void;
    static removeCollider(collider: Collider): void;
    static updateCollider(collider: Collider): void;
}
declare abstract class Shape {
    bounds: Rectangle;
    position: Vector2;
    center: Vector2;
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
    updateBox(width: number, height: number): void;
    containsPoint(point: Vector2): boolean;
}
declare class Circle extends Shape {
    radius: number;
    private _originalRadius;
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
    aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): Collider[];
    private cellAtPosition;
    private cellCoords;
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
declare class fui {
}
declare class ContentManager {
    protected loadedAssets: Map<string, any>;
    loadRes(name: string, local?: boolean): Promise<any>;
    dispose(): void;
}
declare class Emitter<T> {
    private _messageTable;
    constructor();
    addObserver(eventType: T, handler: Function): void;
    removeObserver(eventType: T, handler: Function): void;
    emit(eventType: T, data: any): void;
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
declare class ListPool {
    private static readonly _objectQueue;
    static warmCache(cacheCount: number): void;
    static trimCache(cacheCount: any): void;
    static clearCache(): void;
    static obtain<T>(): Array<T>;
    static free<T>(obj: Array<T>): void;
}
declare class Pair<T> {
    first: T;
    second: T;
    constructor(first: T, second: T);
    clear(): void;
    equals(other: Pair<T>): boolean;
}
declare class RectangleExt {
    static union(first: Rectangle, point: Point): Rectangle;
    static unionR(value1: Rectangle, value2: Rectangle): Rectangle;
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
