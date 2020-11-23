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
    abstract class Component {
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
        debugRender(camera: Camera): void;
        onEnabled(): void;
        onDisabled(): void;
        setEnabled(isEnabled: boolean): this;
        setUpdateOrder(updateOrder: number): this;
    }
}
declare module es {
    class Core {
        static emitter: Emitter<CoreEvents>;
        static debugRenderEndabled: boolean;
        static _instance: Core;
        _nextScene: Scene;
        _sceneTransition: SceneTransition;
        _globalManagers: GlobalManager[];
        _timerManager: TimerManager;
        width: number;
        height: number;
        constructor(width: number, height: number);
        static readonly Instance: Core;
        _frameCounterElapsedTime: number;
        _frameCounter: number;
        _scene: Scene;
        static scene: Scene;
        static startSceneTransition<T extends SceneTransition>(sceneTransition: T): T;
        static registerGlobalManager(manager: es.GlobalManager): void;
        static unregisterGlobalManager(manager: es.GlobalManager): void;
        static getGlobalManager<T extends es.GlobalManager>(type: any): T;
        static schedule(timeInSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): Timer;
        onOrientationChanged(): void;
        draw(): Promise<void>;
        onSceneChanged(): void;
        protected onGraphicsDeviceReset(): void;
        protected initialize(): void;
        protected update(): Promise<void>;
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
        onAddedToScene(): void;
        onRemovedFromScene(): void;
        update(): void;
        debugRender(camera: Camera): void;
        addComponent<T extends Component>(component: T): T;
        getComponent<T extends Component>(type: any): T;
        hasComponent<T extends Component>(type: any): boolean;
        getOrCreateComponent<T extends Component>(type: T): T;
        getComponents(typeName: any, componentList?: any): any;
        removeComponent(component: Component): void;
        removeComponentForType<T extends Component>(type: any): boolean;
        removeAllComponents(): void;
        compareTo(other: Entity): number;
        toString(): string;
    }
}
declare module es {
    class Scene {
        camera: Camera;
        readonly entities: EntityList;
        readonly renderableComponents: RenderableComponentList;
        readonly entityProcessors: EntityProcessorList;
        readonly _sceneComponents: SceneComponent[];
        _renderers: Renderer[];
        _didSceneBegin: any;
        constructor();
        static createWithDefaultRenderer(): Scene;
        initialize(): void;
        onStart(): Promise<void>;
        unload(): void;
        onActive(): void;
        onDeactive(): void;
        begin(): void;
        end(): void;
        updateResolutionScaler(): void;
        update(): void;
        render(): void;
        postRender(): void;
        addSceneComponent<T extends SceneComponent>(component: T): T;
        getSceneComponent<T extends SceneComponent>(type: any): T;
        getOrCreateSceneComponent<T extends SceneComponent>(type: any): T;
        removeSceneComponent(component: SceneComponent): void;
        addRenderer<T extends Renderer>(renderer: T): T;
        getRenderer<T extends Renderer>(type: any): T;
        removeRenderer(renderer: Renderer): void;
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
    enum DirtyType {
        clean = 0,
        positionDirty = 1,
        scaleDirty = 2,
        rotationDirty = 3
    }
    class Transform {
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
    interface IUpdatable {
        enabled: boolean;
        updateOrder: number;
        update(): any;
    }
    class IUpdatableComparer implements IComparer<IUpdatable> {
        compare(a: IUpdatable, b: IUpdatable): number;
    }
    var isIUpdatable: (props: any) => props is IUpdatable;
}
declare module es {
    abstract class PooledComponent extends Component {
        abstract reset(): any;
    }
}
declare module es {
    class SceneComponent {
        scene: Scene;
        enabled: boolean;
        updateOrder: number;
        _enabled: boolean;
        onEnabled(): void;
        onDisabled(): void;
        onRemovedFromScene(): void;
        update(): void;
        setEnabled(isEnabled: boolean): SceneComponent;
        setUpdateOrder(updateOrder: number): this;
        compareTo(other: SceneComponent): number;
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
        physicsLayer: Ref<number>;
        collidesWithLayers: Ref<number>;
        shouldColliderScaleAndRotateWithTransform: boolean;
        registeredPhysicsBounds: Rectangle;
        _localOffsetLength: number;
        _isPositionDirty: boolean;
        _isRotationDirty: boolean;
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
    }
}
declare module es {
    class BoxCollider extends Collider {
        constructor(x: number, y: number, width: number, height: number);
        width: number;
        height: number;
        setSize(width: number, height: number): this;
        setWidth(width: number): BoxCollider;
        setHeight(height: number): void;
        debugRender(camera: Camera): void;
        toString(): string;
    }
}
declare module es {
    class CircleCollider extends Collider {
        constructor(radius: number);
        radius: number;
        setRadius(radius: number): CircleCollider;
        debugRender(camera: Camera): void;
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
        _components: FastList<Component>;
        _updatableComponents: FastList<IUpdatable>;
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
        getComponents(typeName: any, components?: any): any;
        update(): void;
        onEntityTransformChanged(comp: transform.Component): void;
        onEntityEnabled(): void;
        onEntityDisabled(): void;
        debugRender(camera: Camera): void;
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
        _unsortedTags: Set<number>;
        _addToSceneEntityList: Entity[];
        frameAllocate: boolean;
        maxAllocate: number;
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
        private perEntityAddToScene;
        findEntity(name: string): Entity;
        entitiesWithTag(tag: number): Entity[];
        entitiesOfType<T extends Entity>(type: any): T[];
        findComponentOfType<T extends Component>(type: any): T;
        findComponentsOfType<T extends Component>(type: any): T[];
    }
}
declare module es {
    class EntityProcessorList {
        protected _processors: EntitySystem[];
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
    class FasterDictionary<TKey, TValue> {
        _values: TValue[];
        _valuesInfo: FastNode[];
        _buckets: number[];
        _freeValueCellIndex: number;
        _collisions: number;
        constructor(size?: number);
        getValuesArray(count: {
            value: number;
        }): TValue[];
        readonly valuesArray: TValue[];
        readonly count: number;
        add(key: TKey, value: TValue): void;
        addValue(key: TKey, value: TValue, indexSet: {
            value: number;
        }): boolean;
        remove(key: TKey): boolean;
        trim(): void;
        clear(): void;
        fastClear(): void;
        containsKey(key: TKey): boolean;
        tryGetValue(key: TKey): TValue;
        tryFindIndex(key: TKey, findIndex: {
            value: number;
        }): boolean;
        getDirectValue(index: number): TValue;
        getIndex(key: TKey): number;
        static updateLinkedList(index: number, valuesInfo: FastNode[]): void;
        static hash(key: any): number;
        static reduce(x: number, n: number): number;
    }
    class FastNode {
        readonly key: any;
        readonly hashcode: number;
        previous: number;
        next: number;
        constructor(key: any, hash: number, previousNode?: number);
    }
}
declare module es {
    class FastList<T> {
        buffer: T[];
        length: number;
        constructor(size?: number);
        clear(): void;
        reset(): void;
        add(item: T): void;
        remove(item: T): void;
        removeAt(index: number): void;
        contains(item: T): boolean;
        ensureCapacity(additionalItemCount?: number): void;
        addRange(array: T[]): void;
        sort(comparer: IComparer<T>): void;
    }
}
declare module es {
    class HashHelpers {
        static readonly hashCollisionThreshold: number;
        static readonly hashPrime: number;
        static readonly primes: number[];
        static readonly maxPrimeArrayLength: number;
        static isPrime(candidate: number): boolean;
        static getPrime(min: number): number;
        static expandPrime(oldSize: number): number;
        static getHashCode(str: any): number;
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
declare module es {
    interface IRenderable {
        bounds: Rectangle;
        enabled: boolean;
        renderLayer: number;
        isVisible: boolean;
        isVisibleFromCamera(camera: Camera): any;
        render(camera: Camera): any;
        debugRender(camera: Camera): any;
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
        private _componentsNeedSort;
        componentsNeedSort: boolean;
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
    abstract class Renderer {
        camera: Camera;
        readonly renderOrder: number;
        shouldDebugRender: boolean;
        protected constructor(renderOrder: number, camera?: Camera);
        onAddedToScene(scene: Scene): void;
        unload(): void;
        abstract render(scene: Scene): any;
        onSceneBackBufferSizeChanged(newWidth: number, newHeight: number): void;
        compareTo(other: Renderer): number;
        protected beginRender(cam: Camera): void;
        protected renderAfterStateCheck(renderable: IRenderable, cam: Camera): void;
        protected debugRender(scene: Scene, cam: Camera): void;
    }
}
declare module es {
    class DefaultRenderer extends Renderer {
        constructor();
        render(scene: Scene): void;
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
        protected transitionComplete(): void;
        protected loadNextScene(): Promise<void>;
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
        static setFlagExclusive(self: Ref<number>, flag: number): void;
        static setFlag(self: Ref<number>, flag: number): void;
        static unsetFlag(self: Ref<number>, flag: number): void;
        static invertFlags(self: Ref<number>): void;
    }
}
declare module es {
    class MathHelper {
        static readonly Epsilon: number;
        static readonly Rad2Deg: number;
        static readonly Deg2Rad: number;
        static readonly PiOver2: number;
        static toDegrees(radians: number): number;
        static toRadians(degrees: number): number;
        static map(value: number, leftMin: number, leftMax: number, rightMin: number, rightMax: number): number;
        static lerp(value1: number, value2: number, amount: number): number;
        static clamp(value: number, min: number, max: number): number;
        static pointOnCirlce(circleCenter: Vector2, radius: number, angleInDegrees: number): Vector2;
        static isEven(value: number): boolean;
        static clamp01(value: number): number;
        static angleBetweenVectors(from: Vector2, to: Vector2): number;
        static incrementWithWrap(t: number, length: number): number;
        static approach(start: number, end: number, shift: number): number;
    }
}
declare module es {
    class Matrix2D implements IEquatable<Matrix2D> {
        m11: number;
        m12: number;
        m21: number;
        m22: number;
        m31: number;
        m32: number;
        static readonly identity: Matrix2D;
        translation: Vector2;
        rotation: number;
        rotationDegrees: number;
        scale: Vector2;
        static _identity: Matrix2D;
        constructor(m11: number, m12: number, m21: number, m22: number, m31: number, m32: number);
        static createRotation(radians: number): Matrix2D;
        static createScale(xScale: number, yScale: number): Matrix2D;
        static createTranslation(xPosition: number, yPosition: number): Matrix2D;
        static invert(matrix: Matrix2D): Matrix2D;
        add(matrix: Matrix2D): Matrix2D;
        substract(matrix: Matrix2D): Matrix2D;
        divide(matrix: Matrix2D): Matrix2D;
        multiply(matrix: Matrix2D): Matrix2D;
        determinant(): number;
        static lerp(matrix1: Matrix2D, matrix2: Matrix2D, amount: number): Matrix2D;
        static transpose(matrix: Matrix2D): Matrix2D;
        mutiplyTranslation(x: number, y: number): Matrix2D;
        equals(other: Matrix2D): boolean;
        toString(): string;
    }
}
declare module es {
    class MatrixHelper {
        static add(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
        static divide(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
        static mutiply(matrix1: Matrix2D, matrix2: Matrix2D | number): Matrix2D;
        static subtract(matrix1: Matrix2D, matrix2: Matrix2D): Matrix2D;
    }
}
declare module es {
    class Rectangle implements IEquatable<Rectangle> {
        static emptyRectangle: Rectangle;
        x: number;
        y: number;
        width: number;
        height: number;
        static readonly empty: Rectangle;
        static readonly maxRect: Rectangle;
        readonly left: number;
        readonly right: number;
        readonly top: number;
        readonly bottom: number;
        readonly max: Vector2;
        isEmpty(): boolean;
        location: Vector2;
        size: Vector2;
        readonly center: Vector2;
        _tempMat: Matrix2D;
        _transformMat: Matrix2D;
        constructor(x?: number, y?: number, width?: number, height?: number);
        static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): Rectangle;
        static rectEncompassingPoints(points: Vector2[]): Rectangle;
        getSide(edge: Edge): number;
        contains(x: number, y: number): boolean;
        inflate(horizontalAmount: number, verticalAmount: number): void;
        intersects(value: Rectangle): boolean;
        rayIntersects(ray: Ray2D, distance: Ref<number>): boolean;
        containsRect(value: Rectangle): boolean;
        getHalfSize(): Vector2;
        getClosestPointOnBoundsToOrigin(): Vector2;
        getClosestPointOnRectangleToPoint(point: Vector2): Vector2;
        getClosestPointOnRectangleBorderToPoint(point: Vector2, edgeNormal: Vector2): Vector2;
        static intersect(value1: Rectangle, value2: Rectangle): Rectangle;
        offset(offsetX: number, offsetY: number): void;
        static union(value1: Rectangle, value2: Rectangle): Rectangle;
        static overlap(value1: Rectangle, value2: Rectangle): Rectangle;
        calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number): void;
        getSweptBroadphaseBounds(deltaX: number, deltaY: number): Rectangle;
        collisionCheck(other: Rectangle, moveX: Ref<number>, moveY: Ref<number>): boolean;
        static getIntersectionDepth(rectA: Rectangle, rectB: Rectangle): Vector2;
        equals(other: Rectangle): boolean;
        getHashCode(): number;
    }
}
declare module es {
    class SubpixelFloat {
        remainder: number;
        update(amount: number): number;
        reset(): void;
    }
}
declare module es {
    class SubpixelVector2 {
        _x: SubpixelFloat;
        _y: SubpixelFloat;
        update(amount: Vector2): void;
        reset(): void;
    }
}
declare module es {
    class Vector2 implements IEquatable<Vector2> {
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
        static angle(from: Vector2, to: Vector2): number;
        static negate(value: Vector2): Vector2;
        add(value: Vector2): Vector2;
        divide(value: Vector2): Vector2;
        multiply(value: Vector2): Vector2;
        subtract(value: Vector2): this;
        normalize(): void;
        length(): number;
        lengthSquared(): number;
        round(): Vector2;
        equals(other: Vector2 | object): boolean;
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
        static circleToCircle(circleCenter1: Vector2, circleRadius1: number, circleCenter2: Vector2, circleRadius2: number): boolean;
        static circleToLine(circleCenter: Vector2, radius: number, lineFrom: Vector2, lineTo: Vector2): boolean;
        static circleToPoint(circleCenter: Vector2, radius: number, point: Vector2): boolean;
        static rectToCircle(rect: Rectangle, cPosition: Vector2, cRadius: number): boolean;
        static rectToLine(rect: Rectangle, lineFrom: Vector2, lineTo: Vector2): boolean;
        static rectToPoint(rX: number, rY: number, rW: number, rH: number, point: Vector2): boolean;
        static getSector(rX: number, rY: number, rW: number, rH: number, point: Vector2): PointSectors;
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
        constructor(collider?: Collider, fraction?: number, distance?: number, point?: Vector2, normal?: Vector2);
        setValues(collider: Collider, fraction: number, distance: number, point: Vector2): void;
        setValuesNonCollider(fraction: number, distance: number, point: Vector2, normal: Vector2): void;
        reset(): void;
        toString(): string;
    }
}
declare module es {
    class Physics {
        static spatialHashCellSize: number;
        static readonly allLayers: number;
        private static _spatialHash;
        static raycastsHitTriggers: boolean;
        static raycastsStartInColliders: boolean;
        static _hitArray: RaycastHit[];
        static reset(): void;
        static clear(): void;
        static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask?: number): number;
        static boxcastBroadphase(rect: Rectangle, layerMask?: number): Collider[];
        static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask?: number): Collider[];
        static addCollider(collider: Collider): void;
        static removeCollider(collider: Collider): void;
        static updateCollider(collider: Collider): void;
        static linecast(start: Vector2, end: Vector2, layerMask?: number): RaycastHit;
        static linecastAll(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask?: number): number;
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
        linecast(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask: number): number;
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
        getKey(x: number, y: number): string;
        clear(): void;
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
        static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2, distanceSquared: Ref<number>, edgeNormal: Vector2): Vector2;
        static rotatePolygonVerts(radians: number, originalPoints: Vector2[], rotatedPoints: Vector2[]): void;
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
        static intersectMovingCircleBox(s: Circle, b: Box, movement: Vector2, time: Ref<number>): boolean;
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
declare module es {
    class Base64Utils {
        private static _keyStr;
        static readonly nativeBase64: boolean;
        static decode(input: string): string;
        static encode(input: string): string;
        static decodeBase64AsArray(input: string, bytes: number): Uint32Array;
        static decompress(data: string, decoded: any, compression: string): any;
        static decodeCSV(input: string): Array<number>;
    }
}
declare module es {
    class Color {
        private _packedValue;
        constructor(r: number, g: number, b: number, alpha: number);
        b: number;
        g: number;
        r: number;
        a: number;
        packedValue: number;
        equals(other: Color): boolean;
    }
}
declare module es {
    class EdgeExt {
        static oppositeEdge(self: Edge): Edge;
        static isHorizontal(self: Edge): boolean;
        static isVertical(self: Edge): boolean;
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
    enum Edge {
        top = 0,
        bottom = 1,
        left = 2,
        right = 3
    }
}
declare module es {
    class Enumerable {
        static repeat<T>(element: T, count: number): any[];
    }
}
declare module es {
    class EqualityComparer<T> implements IEqualityComparer {
        static default<T>(): EqualityComparer<T>;
        protected constructor();
        equals(x: T, y: T): boolean;
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
    interface IComparer<T> {
        compare(x: T, y: T): number;
    }
}
declare module es {
    interface IEqualityComparer {
        equals(x: any, y: any): boolean;
    }
}
declare module es {
    interface IEquatable<T> {
        equals(other: T): boolean;
    }
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
declare module es {
    class NumberExtension {
        static toNumber(value: any): number;
    }
}
declare module es {
    class Pair<T> implements IEquatable<Pair<T>> {
        first: T;
        second: T;
        constructor(first: T, second: T);
        clear(): void;
        equals(other: Pair<T>): boolean;
    }
}
declare module es {
    class Pool<T> {
        private static _objectQueue;
        static warmCache(type: any, cacheCount: number): void;
        static trimCache(cacheCount: number): void;
        static clearCache(): void;
        static obtain<T>(type: any): T;
        static free<T>(obj: T): void;
    }
    interface IPoolable {
        reset(): any;
    }
    var isIPoolable: (props: any) => props is IPoolable;
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
        static getSide(rect: Rectangle, edge: Edge): number;
        static union(first: Rectangle, point: Vector2): Rectangle;
        static getHalfRect(rect: Rectangle, edge: Edge): Rectangle;
        static getRectEdgePortion(rect: Rectangle, edge: Edge, size?: number): Rectangle;
        static expandSide(rect: Rectangle, edge: Edge, amount: number): void;
        static contract(rect: Rectangle, horizontalAmount: any, verticalAmount: any): void;
    }
}
declare module es {
    class Ref<T extends number | string | boolean> {
        value: T;
        constructor(value: T);
    }
}
declare module es {
    class SubpixelNumber {
        remainder: number;
        update(amount: number): number;
        reset(): void;
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
        static halfVector(): Vector2;
        static cross(u: Vector2, v: Vector2): number;
        static perpendicular(first: Vector2, second: Vector2): Vector2;
        static normalize(vec: Vector2): void;
        static transformA(sourceArray: Vector2[], sourceIndex: number, matrix: Matrix2D, destinationArray: Vector2[], destinationIndex: number, length: number): void;
        static transformR(position: Vector2, matrix: Matrix2D, result: Vector2): void;
        static transform(sourceArray: Vector2[], matrix: Matrix2D, destinationArray: Vector2[]): void;
        static round(vec: Vector2): Vector2;
    }
}
declare class WebGLUtils {
    static getContext(): CanvasRenderingContext2D;
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
    interface ITimer {
        context: any;
        stop(): any;
        reset(): any;
        getContext<T>(): T;
    }
}
declare module es {
    class Timer implements ITimer {
        context: any;
        _timeInSeconds: number;
        _repeats: boolean;
        _onTime: (timer: ITimer) => void;
        _isDone: boolean;
        _elapsedTime: number;
        getContext<T>(): T;
        reset(): void;
        stop(): void;
        tick(): boolean;
        initialize(timeInsSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): void;
        unload(): void;
    }
}
declare module es {
    class TimerManager extends GlobalManager {
        _timers: Timer[];
        update(): void;
        schedule(timeInSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer) => void): Timer;
    }
}
