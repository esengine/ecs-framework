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
    abstract initialize(): any;
    update(): void;
    bind(displayRender: egret.DisplayObject): this;
}
declare class Entity {
    name: string;
    scene: Scene;
    readonly transform: Transform;
    readonly components: Component[];
    private _updateOrder;
    constructor(name: string);
    updateOrder: number;
    setUpdateOrder(updateOrder: number): this;
    attachToScene(newScene: Scene): void;
    addComponent<T extends Component>(component: T): T;
    update(): void;
    destory(): void;
}
declare class Scene extends egret.DisplayObjectContainer {
    camera: Camera;
    entities: Entity[];
    private _projectionMatrix;
    private _transformMatrix;
    private _matrixTransformMatrix;
    constructor(displayObject: egret.DisplayObject);
    createEntity(name: string): Entity;
    addEntity(entity: Entity): Entity;
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
    parent: Transform;
    setParent(parent: Transform): this;
    position: Vector2;
    localPosition: Vector2;
    setLocalPosition(localPosition: Vector2): this;
    setPosition(position: Vector2): this;
    updateTransform(): void;
}
declare class Camera extends Component {
    private _zoom;
    private _origin;
    private _transformMatrix;
    private _inverseTransformMatrix;
    readonly transformMatrix: Matrix2D;
    constructor();
    initialize(): void;
    update(): void;
    setPosition(position: Vector2): this;
    updateMatrixes(): void;
    destory(): void;
}
declare class MathHelper {
    static toDegrees(radians: number): number;
    static toRadians(degrees: number): number;
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
    static invert(matrix: Matrix2D, result: Matrix2D): Matrix2D;
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
