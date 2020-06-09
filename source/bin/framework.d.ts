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
    name: string;
    scene: Scene;
    readonly transform: Transform;
    readonly components: ComponentList;
    private _updateOrder;
    private _enabled;
    private _isDestoryed;
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
    constructor(name: string);
    updateOrder: number;
    setUpdateOrder(updateOrder: number): this;
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
    constructor(scene: Scene);
    readonly count: number;
    readonly buffer: Entity[];
    add(entity: Entity): void;
    remove(entity: Entity): void;
    findEntity(name: string): Entity;
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
declare class Vector2 {
    x: number;
    y: number;
    private static readonly unitVector2;
    static readonly One: Vector2;
    constructor(x: number, y: number);
    static add(value1: Vector2, value2: Vector2): Vector2;
    static divide(value1: Vector2, value2: Vector2): Vector2;
    static multiply(value1: Vector2, value2: Vector2): Vector2;
    static subtract(value1: Vector2, value2: Vector2): Vector2;
    normalize(): void;
    static transform(position: Vector2, matrix: Matrix2D): Vector2;
}
