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
    constructor(x: number, y: number);
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
declare abstract class Component {
    entity: Entity;
    displayRender: egret.DisplayObject;
    private _enabled;
    updateInterval: number;
    readonly transform: Transform;
    enabled: boolean;
    setEnabled(isEnabled: boolean): this;
    abstract initialize(): any;
    onAddedToEntity(): void;
    onRemovedFromEntity(): void;
    onEnabled(): void;
    onDisabled(): void;
    onEntityTransformChanged(comp: ComponentTransform): void;
    update(): void;
    bind(displayRender: egret.DisplayObject): this;
    registerComponent(): void;
    deregisterComponent(): void;
}
declare class Entity {
    private static _idGenerator;
    name: string;
    readonly id: number;
    scene: Scene;
    readonly transform: Transform;
    readonly components: ComponentList;
    private _updateOrder;
    private _enabled;
    private _isDestoryed;
    private _tag;
    componentBits: BitSet;
    parent: Transform;
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
    readonly isDestoryed: boolean;
    enabled: boolean;
    setEnabled(isEnabled: boolean): this;
    tag: number;
    constructor(name: string);
    updateOrder: number;
    setUpdateOrder(updateOrder: number): this;
    setTag(tag: number): Entity;
    attachToScene(newScene: Scene): void;
    detachFromScene(): void;
    addComponent<T extends Component>(component: T): T;
    hasComponent<T extends Component>(type: any): boolean;
    getOrCreateComponent<T extends Component>(type: T): T;
    getComponent<T extends Component>(type: any): T;
    removeComponentForType<T extends Component>(type: any): boolean;
    removeComponent(component: Component): void;
    removeAllComponents(): void;
    update(): void;
    onAddedToScene(): void;
    onRemovedFromScene(): void;
    onTransformChanged(comp: ComponentTransform): void;
    destory(): void;
}
declare class Scene extends egret.DisplayObjectContainer {
    camera: Camera;
    readonly entities: EntityList;
    private _projectionMatrix;
    private _transformMatrix;
    private _matrixTransformMatrix;
    readonly entityProcessors: EntityProcessorList;
    constructor(displayObject: egret.DisplayObject);
    createEntity(name: string): Entity;
    addEntity(entity: Entity): Entity;
    destroyAllEntities(): void;
    findEntity(name: string): Entity;
    addEntityProcessor(processor: EntitySystem): EntitySystem;
    removeEntityProcessor(processor: EntitySystem): void;
    getEntityProcessor<T extends EntitySystem>(): T;
    setActive(): Scene;
    initialize(): void;
    onActive(): void;
    onDeactive(): void;
    update(): void;
    prepRenderState(): void;
    destory(): void;
}
declare class SceneManager {
    private static _loadedScenes;
    private static _lastScene;
    private static _activeScene;
    static createScene(name: string, scene: Scene): Scene;
    static setActiveScene(scene: Scene): Scene;
    static getActiveScene(): Scene;
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
    zoom: number;
    minimumZoom: number;
    maximumZoom: number;
    origin: Vector2;
    readonly transformMatrix: Matrix2D;
    constructor();
    setMinimumZoom(minZoom: number): Camera;
    setMaximumZoom(maxZoom: number): Camera;
    setZoom(zoom: number): this;
    initialize(): void;
    update(): void;
    setPosition(position: Vector2): this;
    updateMatrixes(): void;
    destory(): void;
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
declare class Time {
    static unscaledDeltaTime: any;
    static deltaTime: number;
    static timeScale: number;
    private static _lastTime;
    static update(currentTime: number): void;
}
declare class MathHelper {
    static toDegrees(radians: number): number;
    static toRadians(degrees: number): number;
    static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number;
    static clamp(value: number, min: number, max: number): number;
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
    constructor(m11: number, m12: number, m21: number, m22: number, m31: number, m32: number);
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
}
declare class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
}
declare class Vector2 {
    x: number;
    y: number;
    private static readonly zeroVector;
    private static readonly unitVector;
    static readonly One: Vector2;
    static readonly Zero: Vector2;
    constructor(x: number, y: number);
    static add(value1: Vector2, value2: Vector2): Vector2;
    static divide(value1: Vector2, value2: Vector2): Vector2;
    static multiply(value1: Vector2, value2: Vector2): Vector2;
    static subtract(value1: Vector2, value2: Vector2): Vector2;
    normalize(): void;
    static dot(value1: Vector2, value2: Vector2): number;
    static distanceSquared(value1: Vector2, value2: Vector2): number;
    static transform(position: Vector2, matrix: Matrix2D): Vector2;
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
}
