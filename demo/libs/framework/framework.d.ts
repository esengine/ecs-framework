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
declare class Entity {
    name: string;
    scene: Scene;
    readonly transform: Transform;
    constructor(name: string);
    attachToScene(newScene: Scene): void;
    destory(): void;
}
declare class Scene extends egret.DisplayObjectContainer {
    camera: Camera;
    entities: Entity[];
    constructor(displayObject: egret.DisplayObject);
    createEntity(name: string): Entity;
    addEntity(entity: Entity): Entity;
    setActive(): Scene;
    initialize(): void;
    onActive(): void;
    onDeactive(): void;
    destory(): void;
}
declare class SceneManager {
    private static _loadedScenes;
    private static _lastScene;
    private static _activeScene;
    static createScene(name: string, scene: Scene): Scene;
    static setActiveScene(scene: Scene): Scene;
}
declare class Transform {
    readonly entity: Entity;
    private _children;
    private _parent;
    readonly childCount: number;
    constructor(entity: Entity);
    getChild(index: number): Transform;
    parent: Transform;
    setParent(parent: Transform): this;
}
declare class Camera {
    private _displayContent;
    constructor(displayObject: egret.DisplayObject);
    destory(): void;
}
declare class MathHelper {
    static ToDegrees(radians: number): number;
    static ToRadians(degrees: number): number;
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
}
declare class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number);
    static add(value1: Vector2, value2: Vector2): Vector2;
    static divide(value1: Vector2, value2: Vector2): Vector2;
    static multiply(value1: Vector2, value2: Vector2): Vector2;
    static subtract(value1: Vector2, value2: Vector2): Vector2;
    normalize(): void;
}
