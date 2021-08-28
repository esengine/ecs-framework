"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var es;
(function (es) {
    /**
     *  全局核心类
     */
    var Core = /** @class */ (function () {
        function Core(debug, enableEntitySystems) {
            if (debug === void 0) { debug = true; }
            if (enableEntitySystems === void 0) { enableEntitySystems = true; }
            /**
             * 全局访问系统
             */
            this._globalManagers = [];
            this._coroutineManager = new es.CoroutineManager();
            this._timerManager = new es.TimerManager();
            this._frameCounterElapsedTime = 0;
            this._frameCounter = 0;
            this._totalMemory = 0;
            Core._instance = this;
            Core.emitter = new es.Emitter();
            Core.emitter.addObserver(es.CoreEvents.frameUpdated, this.update, this);
            Core.registerGlobalManager(this._coroutineManager);
            Core.registerGlobalManager(new es.TweenManager());
            Core.registerGlobalManager(this._timerManager);
            Core.entitySystemsEnabled = enableEntitySystems;
            this.debug = debug;
            this.initialize();
        }
        Object.defineProperty(Core, "Instance", {
            /**
             * 提供对单例/游戏实例的访问
             * @constructor
             */
            get: function () {
                return this._instance;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core, "scene", {
            /**
             * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
             */
            get: function () {
                if (!this._instance)
                    return null;
                return this._instance._scene;
            },
            /**
             * 当前活动的场景。注意，如果设置了该设置，在更新结束之前场景实际上不会改变
             * @param value
             */
            set: function (value) {
                es.Insist.isNotNull(value, "场景不能为空");
                if (this._instance._scene == null) {
                    this._instance._scene = value;
                    this._instance.onSceneChanged();
                    this._instance._scene.begin();
                }
                else {
                    this._instance._nextScene = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 默认实现创建核心
         */
        Core.create = function (debug) {
            if (debug === void 0) { debug = true; }
            if (this._instance == null) {
                this._instance = new es.Core(debug);
            }
            return this._instance;
        };
        /**
         * 添加一个全局管理器对象，它的更新方法将调用场景前的每一帧。
         * @param manager
         */
        Core.registerGlobalManager = function (manager) {
            this._instance._globalManagers.push(manager);
            manager.enabled = true;
        };
        /**
         * 删除全局管理器对象
         * @param manager
         */
        Core.unregisterGlobalManager = function (manager) {
            new es.List(this._instance._globalManagers).remove(manager);
            manager.enabled = false;
        };
        /**
         * 获取类型为T的全局管理器
         * @param type
         */
        Core.getGlobalManager = function (type) {
            for (var i = 0, s = Core._instance._globalManagers.length; i < s; ++i) {
                var manager = Core._instance._globalManagers[i];
                if (manager instanceof type)
                    return manager;
            }
            return null;
        };
        /**
         * 启动一个coroutine。Coroutine可以将number延时几秒或延时到其他startCoroutine.Yielding
         * null将使coroutine在下一帧被执行。
         * @param enumerator
         */
        Core.startCoroutine = function (enumerator) {
            return this._instance._coroutineManager.startCoroutine(enumerator);
        };
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        Core.schedule = function (timeInSeconds, repeats, context, onTime) {
            if (repeats === void 0) { repeats = false; }
            if (context === void 0) { context = null; }
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        };
        Core.prototype.startDebugDraw = function () {
            if (!this.debug)
                return;
            this._frameCounter++;
            this._frameCounterElapsedTime += es.Time.deltaTime;
            if (this._frameCounterElapsedTime >= 1) {
                var memoryInfo = window.performance["memory"];
                if (memoryInfo != null) {
                    this._totalMemory = Number((memoryInfo.totalJSHeapSize / 1048576).toFixed(2));
                }
                if (this._titleMemory)
                    this._titleMemory(this._totalMemory, this._frameCounter);
                this._frameCounter = 0;
                this._frameCounterElapsedTime -= 1;
            }
        };
        /**
         * 在一个场景结束后，下一个场景开始之前调用
         */
        Core.prototype.onSceneChanged = function () {
            es.Time.sceneChanged();
        };
        Core.prototype.initialize = function () {
        };
        Core.prototype.update = function (currentTime) {
            if (currentTime === void 0) { currentTime = -1; }
            return __awaiter(this, void 0, void 0, function () {
                var i;
                return __generator(this, function (_a) {
                    if (Core.paused) {
                        return [2 /*return*/];
                    }
                    es.Time.update(currentTime, currentTime != -1);
                    if (this._scene != null) {
                        for (i = this._globalManagers.length - 1; i >= 0; i--) {
                            if (this._globalManagers[i].enabled)
                                this._globalManagers[i].update();
                        }
                        this._scene.update();
                        if (this._nextScene != null) {
                            this._scene.end();
                            this._scene = this._nextScene;
                            this._nextScene = null;
                            this.onSceneChanged();
                            this._scene.begin();
                        }
                    }
                    this.startDebugDraw();
                    return [2 /*return*/];
                });
            });
        };
        Core.paused = false;
        /**
         * 是否启用调试渲染
         */
        Core.debugRenderEndabled = false;
        return Core;
    }());
    es.Core = Core;
})(es || (es = {}));
var es;
(function (es) {
    var LogType;
    (function (LogType) {
        LogType[LogType["error"] = 0] = "error";
        LogType[LogType["warn"] = 1] = "warn";
        LogType[LogType["log"] = 2] = "log";
        LogType[LogType["info"] = 3] = "info";
        LogType[LogType["trace"] = 4] = "trace";
    })(LogType = es.LogType || (es.LogType = {}));
    var Debug = /** @class */ (function () {
        function Debug() {
        }
        Debug.warnIf = function (condition, format) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (condition)
                this.log(LogType.warn, format, args);
        };
        Debug.warn = function (format) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.log(LogType.warn, format, args);
        };
        Debug.error = function (format) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.log(LogType.error, format, args);
        };
        Debug.log = function (type, format) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            switch (type) {
                case LogType.error:
                    console.error(type + ": " + es.StringUtils.format(format, args));
                    break;
                case LogType.warn:
                    console.warn(type + ": " + es.StringUtils.format(format, args));
                    break;
                case LogType.log:
                    console.log(type + ": " + es.StringUtils.format(format, args));
                    break;
                case LogType.info:
                    console.info(type + ": " + es.StringUtils.format(format, args));
                    break;
                case LogType.trace:
                    console.trace(type + ": " + es.StringUtils.format(format, args));
                    break;
                default:
                    throw new Error('argument out of range');
            }
        };
        return Debug;
    }());
    es.Debug = Debug;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 我们在这里存储了各种系统的默认颜色，如对撞机调试渲染、Debug.drawText等。
     * 命名方式尽可能采用CLASS-THING，以明确它的使用位置
     */
    var DebugDefault = /** @class */ (function () {
        function DebugDefault() {
        }
        DebugDefault.debugText = 0xffffff;
        DebugDefault.colliderBounds = 0xffffff * 0.3;
        DebugDefault.colliderEdge = 0x8B0000;
        DebugDefault.colliderPosition = 0xFFFF00;
        DebugDefault.colliderCenter = 0xFF0000;
        DebugDefault.renderableBounds = 0xFFFF00;
        DebugDefault.renderableCenter = 0x9932CC;
        DebugDefault.verletParticle = 0xDC345E;
        DebugDefault.verletConstraintEdge = 0x433E36;
        return DebugDefault;
    }());
    es.DebugDefault = DebugDefault;
})(es || (es = {}));
var es;
(function (es) {
    var Insist = /** @class */ (function () {
        function Insist() {
        }
        Insist.fail = function (message) {
            if (message === void 0) { message = null; }
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (message == null) {
                console.assert(false);
            }
            else {
                console.assert(false, es.StringUtils.format(message, args));
            }
        };
        Insist.isTrue = function (condition, message) {
            if (message === void 0) { message = null; }
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (!condition) {
                if (message == null) {
                    this.fail();
                }
                else {
                    this.fail(message, args);
                }
            }
        };
        Insist.isFalse = function (condition, message) {
            if (message === void 0) { message = null; }
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (message == null) {
                this.isTrue(!condition);
            }
            else {
                this.isTrue(!condition, message, args);
            }
        };
        Insist.isNull = function (obj, message) {
            if (message === void 0) { message = null; }
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (message == null) {
                this.isTrue(obj == null);
            }
            else {
                this.isTrue(obj == null, message, args);
            }
        };
        Insist.isNotNull = function (obj, message) {
            if (message === void 0) { message = null; }
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (message == null) {
                this.isTrue(obj != null);
            }
            else {
                this.isTrue(obj != null, message, args);
            }
        };
        Insist.areEqual = function (first, second, message) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            if (first != second)
                this.fail(message, args);
        };
        Insist.areNotEqual = function (first, second, message) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            if (first == second)
                this.fail(message, args);
        };
        return Insist;
    }());
    es.Insist = Insist;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 执行顺序
     *  - onAddedToEntity
     *  - OnEnabled
     *
     *  删除执行顺序
     *      - onRemovedFromEntity
     */
    var Component = /** @class */ (function () {
        function Component() {
            this._enabled = true;
            this._updateOrder = 0;
            this.id = Component._idGenerator++;
        }
        Object.defineProperty(Component.prototype, "transform", {
            /**
             * 快速访问 this.entity.transform
             */
            get: function () {
                return this.entity.transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "enabled", {
            /**
             * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
             */
            get: function () {
                return this.entity ? this.entity.enabled && this._enabled : this._enabled;
            },
            /**
             * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
             * @param value
             */
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "updateOrder", {
            /** 更新此实体上组件的顺序 */
            get: function () {
                return this._updateOrder;
            },
            /** 更新此实体上组件的顺序 */
            set: function (value) {
                this.setUpdateOrder(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 当此组件已分配其实体，但尚未添加到实体的活动组件列表时调用。有用的东西，如物理组件，需要访问转换来修改碰撞体的属性。
         */
        Component.prototype.initialize = function () {
        };
        /**
         * 在提交所有挂起的组件更改后，将该组件添加到场景时调用。此时，设置了实体字段和实体。场景也设定好了。
         */
        Component.prototype.onAddedToEntity = function () {
        };
        /**
         * 当此组件从其实体中移除时调用。在这里做所有的清理工作。
         */
        Component.prototype.onRemovedFromEntity = function () {
        };
        /**
         * 当实体的位置改变时调用。这允许组件知道它们由于父实体的移动而移动了。
         * @param comp
         */
        Component.prototype.onEntityTransformChanged = function (comp) {
        };
        Component.prototype.debugRender = function (batcher) { };
        /**
         *当父实体或此组件启用时调用
         */
        Component.prototype.onEnabled = function () {
        };
        /**
         * 禁用父实体或此组件时调用
         */
        Component.prototype.onDisabled = function () {
        };
        Component.prototype.setEnabled = function (isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                }
                else {
                    this.onDisabled();
                }
            }
            return this;
        };
        Component.prototype.setUpdateOrder = function (updateOrder) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
            }
            return this;
        };
        Component.prototype.addComponent = function (component) {
            return this.entity.addComponent(component);
        };
        Component.prototype.getComponent = function (type) {
            return this.entity.getComponent(type);
        };
        Component.prototype.getComponents = function (typeName, componentList) {
            return this.entity.getComponents(typeName, componentList);
        };
        Component.prototype.hasComponent = function (type) {
            return this.entity.hasComponent(type);
        };
        Component.prototype.removeComponent = function (component) {
            if (component) {
                this.entity.removeComponent(component);
            }
            else {
                this.entity.removeComponent(this);
            }
        };
        Component._idGenerator = 0;
        return Component;
    }());
    es.Component = Component;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentType = /** @class */ (function () {
        function ComponentType(type, index) {
            this.index_ = 0;
            if (index !== undefined) {
                this.index_ = ComponentType.INDEX++;
            }
            else {
                this.index_ = index;
            }
            this.type_ = type;
        }
        ComponentType.prototype.getName = function () {
            return es.getClassName(this.type_);
        };
        ComponentType.prototype.getIndex = function () {
            return this.index_;
        };
        ComponentType.prototype.toString = function () {
            return "ComponentType[" + es.getClassName(ComponentType) + "] (" + this.index_ + ")";
        };
        ComponentType.INDEX = 0;
        return ComponentType;
    }());
    es.ComponentType = ComponentType;
})(es || (es = {}));
var es;
(function (es) {
    var CoreEvents;
    (function (CoreEvents) {
        /**
         * 当场景发生变化时触发
         */
        CoreEvents[CoreEvents["sceneChanged"] = 0] = "sceneChanged";
        /**
         * 每帧更新事件
         */
        CoreEvents[CoreEvents["frameUpdated"] = 1] = "frameUpdated";
        /**
         * 当渲染发生时触发
         */
        CoreEvents[CoreEvents["renderChanged"] = 2] = "renderChanged";
    })(CoreEvents = es.CoreEvents || (es.CoreEvents = {}));
})(es || (es = {}));
var es;
(function (es) {
    var EntityComparer = /** @class */ (function () {
        function EntityComparer() {
        }
        EntityComparer.prototype.compare = function (self, other) {
            var compare = self.updateOrder - other.updateOrder;
            if (compare == 0)
                compare = self.id - other.id;
            return compare;
        };
        return EntityComparer;
    }());
    es.EntityComparer = EntityComparer;
    var Entity = /** @class */ (function () {
        function Entity(name, id) {
            /**
             * 指定应该调用这个entity update方法的频率。1表示每一帧，2表示每一帧，以此类推
             */
            this.updateInterval = 1;
            this._tag = 0;
            this._enabled = true;
            this._updateOrder = 0;
            this.components = new es.ComponentList(this);
            this.transform = new es.Transform(this);
            this.componentBits = new es.Bits();
            this.name = name;
            this.id = id;
        }
        Object.defineProperty(Entity.prototype, "isDestroyed", {
            /**
             * 如果调用了destroy，那么在下一次处理实体之前这将一直为true
             */
            get: function () {
                return this._isDestroyed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "tag", {
            /**
             * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
             */
            get: function () {
                return this._tag;
            },
            /**
             * 你可以随意使用。稍后可以使用它来查询场景中具有特定标记的所有实体
             * @param value
             */
            set: function (value) {
                this.setTag(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "enabled", {
            /**
             * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
             */
            get: function () {
                return this._enabled;
            },
            /**
             * 启用/禁用实体。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
             * @param value
             */
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "updateOrder", {
            /**
             * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
             */
            get: function () {
                return this._updateOrder;
            },
            /**
             * 更新此实体的顺序。updateOrder还用于对scene.entities上的标签列表进行排序
             * @param value
             */
            set: function (value) {
                this.setUpdateOrder(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "parent", {
            get: function () {
                return this.transform.parent;
            },
            set: function (value) {
                this.transform.setParent(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "childCount", {
            get: function () {
                return this.transform.childCount;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "position", {
            get: function () {
                return this.transform.position;
            },
            set: function (value) {
                this.transform.setPosition(value.x, value.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "localPosition", {
            get: function () {
                return this.transform.localPosition;
            },
            set: function (value) {
                this.transform.setLocalPosition(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "rotation", {
            get: function () {
                return this.transform.rotation;
            },
            set: function (value) {
                this.transform.setRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "rotationDegrees", {
            get: function () {
                return this.transform.rotationDegrees;
            },
            set: function (value) {
                this.transform.setRotationDegrees(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "localRotation", {
            get: function () {
                return this.transform.localRotation;
            },
            set: function (value) {
                this.transform.setLocalRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "localRotationDegrees", {
            get: function () {
                return this.transform.localRotationDegrees;
            },
            set: function (value) {
                this.transform.setLocalRotationDegrees(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "scale", {
            get: function () {
                return this.transform.scale;
            },
            set: function (value) {
                this.transform.setScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "localScale", {
            get: function () {
                return this.transform.localScale;
            },
            set: function (value) {
                this.transform.setLocalScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "worldInverseTransform", {
            get: function () {
                return this.transform.worldInverseTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "localToWorldTransform", {
            get: function () {
                return this.transform.localToWorldTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "worldToLocalTransform", {
            get: function () {
                return this.transform.worldToLocalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Entity.prototype.onTransformChanged = function (comp) {
            // 通知我们的子项改变了位置
            this.components.onEntityTransformChanged(comp);
        };
        Entity.prototype.setParent = function (parent) {
            if (parent instanceof es.Transform) {
                this.transform.setParent(parent);
            }
            else if (parent instanceof Entity) {
                this.transform.setParent(parent.transform);
            }
            return this;
        };
        Entity.prototype.setPosition = function (x, y) {
            this.transform.setPosition(x, y);
            return this;
        };
        Entity.prototype.setLocalPosition = function (localPosition) {
            this.transform.setLocalPosition(localPosition);
            return this;
        };
        Entity.prototype.setRotation = function (radians) {
            this.transform.setRotation(radians);
            return this;
        };
        Entity.prototype.setRotationDegrees = function (degrees) {
            this.transform.setRotationDegrees(degrees);
            return this;
        };
        Entity.prototype.setLocalRotation = function (radians) {
            this.transform.setLocalRotation(radians);
            return this;
        };
        Entity.prototype.setLocalRotationDegrees = function (degrees) {
            this.transform.setLocalRotationDegrees(degrees);
            return this;
        };
        Entity.prototype.setScale = function (scale) {
            if (scale instanceof es.Vector2) {
                this.transform.setScale(scale);
            }
            else {
                this.transform.setScale(new es.Vector2(scale, scale));
            }
            return this;
        };
        Entity.prototype.setLocalScale = function (scale) {
            if (scale instanceof es.Vector2) {
                this.transform.setLocalScale(scale);
            }
            else {
                this.transform.setLocalScale(new es.Vector2(scale, scale));
            }
            return this;
        };
        /**
         * 设置实体的标记
         * @param tag
         */
        Entity.prototype.setTag = function (tag) {
            if (this._tag != tag) {
                // 我们只有在已经有场景的情况下才会调用entityTagList。如果我们还没有场景，我们会被添加到entityTagList
                if (this.scene)
                    this.scene.entities.removeFromTagList(this);
                this._tag = tag;
                if (this.scene)
                    this.scene.entities.addToTagList(this);
            }
            return this;
        };
        /**
         * 设置实体的启用状态。当禁用碰撞器从物理系统和组件中移除时，方法将不会被调用
         * @param isEnabled
         */
        Entity.prototype.setEnabled = function (isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled)
                    this.components.onEntityEnabled();
                else
                    this.components.onEntityDisabled();
            }
            return this;
        };
        /**
         * 设置此实体的更新顺序。updateOrder还用于对scene.entities上的标签列表进行排序
         * @param updateOrder
         */
        Entity.prototype.setUpdateOrder = function (updateOrder) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
                if (this.scene) {
                    this.scene.entities.markEntityListUnsorted();
                    this.scene.entities.markTagUnsorted(this.tag);
                }
                return this;
            }
        };
        /**
         * 从场景中删除实体并销毁所有子元素
         */
        Entity.prototype.destroy = function () {
            this._isDestroyed = true;
            this.scene.identifierPool.checkIn(this.id);
            this.scene.entities.remove(this);
            this.transform.parent = null;
            // 销毁所有子项
            for (var i = this.transform.childCount - 1; i >= 0; i--) {
                var child = this.transform.getChild(i);
                child.entity.destroy();
            }
        };
        /**
         * 将实体从场景中分离。下面的生命周期方法将被调用在组件上:OnRemovedFromEntity
         */
        Entity.prototype.detachFromScene = function () {
            this.scene.entities.remove(this);
            this.components.deregisterAllComponents();
            for (var i = 0; i < this.transform.childCount; i++)
                this.transform.getChild(i).entity.detachFromScene();
        };
        /**
         * 将一个先前分离的实体附加到一个新的场景
         * @param newScene
         */
        Entity.prototype.attachToScene = function (newScene) {
            this.scene = newScene;
            newScene.entities.add(this);
            this.components.registerAllComponents();
            for (var i = 0; i < this.transform.childCount; i++) {
                this.transform.getChild(i).entity.attachToScene(newScene);
            }
        };
        /**
         * 在提交了所有挂起的实体更改后，将此实体添加到场景时调用
         */
        Entity.prototype.onAddedToScene = function () {
        };
        /**
         * 当此实体从场景中删除时调用
         */
        Entity.prototype.onRemovedFromScene = function () {
            // 如果已经被销毁了，移走我们的组件。如果我们只是分离，我们需要保持我们的组件在实体上。
            if (this._isDestroyed)
                this.components.removeAllComponents();
        };
        /**
         * 每帧进行调用进行更新组件
         */
        Entity.prototype.update = function () {
            this.components.update();
        };
        Entity.prototype.debugRender = function (batcher) {
            if (!batcher)
                return;
            this.components.debugRender(batcher);
        };
        /**
         * 创建组件的新实例。返回实例组件
         * @param componentType
         */
        Entity.prototype.createComponent = function (componentType) {
            var component = new componentType();
            this.addComponent(component);
            return component;
        };
        /**
         * 将组件添加到组件列表中。返回组件。
         * @param component
         */
        Entity.prototype.addComponent = function (component) {
            component.entity = this;
            this.components.add(component);
            component.initialize();
            return component;
        };
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        Entity.prototype.getComponent = function (type) {
            return this.components.getComponent(type, false);
        };
        /**
         *  获取类型T的第一个并已加入场景的组件并返回它。如果没有找到组件，则返回null。
         * @param type
         * @returns
         */
        Entity.prototype.getComponentInScene = function (type) {
            return this.components.getComponent(type, true);
        };
        /**
         * 尝试获取T类型的组件。如果未找到任何组件，则返回false
         * @param type
         * @param outComponent
         * @returns
         */
        Entity.prototype.tryGetComponent = function (type, outComponent) {
            outComponent.value = this.components.getComponent(type, false);
            return outComponent.value != null;
        };
        /**
         * 检查实体是否具有该组件
         * @param type
         */
        Entity.prototype.hasComponent = function (type) {
            return this.components.getComponent(type, false) != null;
        };
        /**
         * 获取类型T的第一个组件并返回它。如果没有找到组件，将创建组件。
         * @param type
         */
        Entity.prototype.getOrCreateComponent = function (type) {
            var comp = this.components.getComponent(type, true);
            if (!comp) {
                comp = this.addComponent(new type());
            }
            return comp;
        };
        /**
         * 获取typeName类型的所有组件，但不使用列表分配
         * @param typeName
         * @param componentList
         */
        Entity.prototype.getComponents = function (typeName, componentList) {
            return this.components.getComponents(typeName, componentList);
        };
        /**
         * 从组件列表中删除组件
         * @param component
         */
        Entity.prototype.removeComponent = function (component) {
            this.components.remove(component);
        };
        /**
         * 从组件列表中删除类型为T的第一个组件
         * @param type
         */
        Entity.prototype.removeComponentForType = function (type) {
            var comp = this.getComponent(type);
            if (comp) {
                this.removeComponent(comp);
                return true;
            }
            return false;
        };
        /**
         * 从实体中删除所有组件
         */
        Entity.prototype.removeAllComponents = function () {
            for (var i = 0; i < this.components.count; i++) {
                this.removeComponent(this.components.buffer[i]);
            }
        };
        Entity.prototype.tweenPositionTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.position);
            tween.initialize(tween, to, duration);
            return tween;
        };
        Entity.prototype.tweenLocalPositionTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localPosition);
            tween.initialize(tween, to, duration);
            return tween;
        };
        Entity.prototype.tweenScaleTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            if (typeof (to) == 'number') {
                return this.tweenScaleTo(new es.Vector2(to, to), duration);
            }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.scale);
            tween.initialize(tween, to, duration);
            return tween;
        };
        Entity.prototype.tweenLocalScaleTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            if (typeof (to) == 'number') {
                return this.tweenLocalScaleTo(new es.Vector2(to, to), duration);
            }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localScale);
            tween.initialize(tween, to, duration);
            return tween;
        };
        Entity.prototype.tweenRotationDegreesTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.rotationDegrees);
            tween.initialize(tween, new es.Vector2(to, to), duration);
            return tween;
        };
        Entity.prototype.tweenLocalRotationDegreesTo = function (to, duration) {
            if (duration === void 0) { duration = 0.3; }
            var tween = es.Pool.obtain(es.TransformVector2Tween);
            tween.setTargetAndType(this.transform, es.TransformTargetType.localRotationDegrees);
            tween.initialize(tween, new es.Vector2(to, to), duration);
            return tween;
        };
        Entity.prototype.compareTo = function (other) {
            var compare = this._updateOrder - other._updateOrder;
            if (compare == 0)
                compare = this.id - other.id;
            return compare;
        };
        Entity.prototype.equals = function (other) {
            return this.compareTo(other) == 0;
        };
        Entity.prototype.toString = function () {
            return "[Entity: name: " + this.name + ", tag: " + this.tag + ", enabled: " + this.enabled + ", depth: " + this.updateOrder + "]";
        };
        Entity.entityComparer = new EntityComparer();
        return Entity;
    }());
    es.Entity = Entity;
})(es || (es = {}));
var es;
(function (es) {
    /** 2d 向量 */
    var Vector2 = /** @class */ (function () {
        /**
         * 从两个值构造一个带有X和Y的二维向量。
         * @param x 二维空间中的x坐标
         * @param y 二维空间的y坐标
         */
        function Vector2(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = 0;
            this.y = 0;
            this.x = x;
            this.y = y;
        }
        Object.defineProperty(Vector2, "zero", {
            get: function () {
                return new Vector2(0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "one", {
            get: function () {
                return new Vector2(1, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "unitX", {
            get: function () {
                return new Vector2(1, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "unitY", {
            get: function () {
                return new Vector2(0, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "up", {
            get: function () {
                return new Vector2(0, -1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "down", {
            get: function () {
                return new Vector2(0, 1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "left", {
            get: function () {
                return new Vector2(-1, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "right", {
            get: function () {
                return new Vector2(1, 0);
            },
            enumerable: true,
            configurable: true
        });
        /**
         *
         * @param value1
         * @param value2
         */
        Vector2.add = function (value1, value2) {
            var result = Vector2.zero;
            result.x = value1.x + value2.x;
            result.y = value1.y + value2.y;
            return result;
        };
        /**
         *
         * @param value1
         * @param value2
         */
        Vector2.divide = function (value1, value2) {
            var result = Vector2.zero;
            result.x = value1.x / value2.x;
            result.y = value1.y / value2.y;
            return result;
        };
        Vector2.divideScaler = function (value1, value2) {
            var result = Vector2.zero;
            result.x = value1.x / value2;
            result.y = value1.y / value2;
            return result;
        };
        /**
         * 返回两个向量之间距离的平方
         * @param value1
         * @param value2
         */
        Vector2.sqrDistance = function (value1, value2) {
            return Math.pow(value1.x - value2.x, 2) + Math.pow(value1.y - value2.y, 2);
        };
        /**
         * 将指定的值限制在一个范围内
         * @param value1
         * @param min
         * @param max
         */
        Vector2.clamp = function (value1, min, max) {
            return new Vector2(es.MathHelper.clamp(value1.x, min.x, max.x), es.MathHelper.clamp(value1.y, min.y, max.y));
        };
        /**
         * 创建一个新的Vector2，其中包含指定向量的线性插值
         * @param value1 第一个向量
         * @param value2 第二个向量
         * @param amount 加权值(0.0-1.0之间)
         * @returns 指定向量的线性插值结果
         */
        Vector2.lerp = function (value1, value2, amount) {
            return new Vector2(es.MathHelper.lerp(value1.x, value2.x, amount), es.MathHelper.lerp(value1.y, value2.y, amount));
        };
        /**
         * 创建一个新的Vector2，其中包含指定矢量的线性插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        Vector2.lerpPrecise = function (value1, value2, amount) {
            return new Vector2(es.MathHelper.lerpPrecise(value1.x, value2.x, amount), es.MathHelper.lerpPrecise(value1.y, value2.y, amount));
        };
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换。
         * @param position
         * @param matrix
         */
        Vector2.transform = function (position, matrix) {
            return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31, (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32);
        };
        /**
         * 创建一个新的Vector2，其中包含由指定的Matrix转换的指定法线
         * @param normal
         * @param matrix
         */
        Vector2.transformNormal = function (normal, matrix) {
            return new Vector2((normal.x * matrix.m11) + (normal.y * matrix.m21), (normal.x * matrix.m12) + (normal.y * matrix.m22));
        };
        /**
         * 返回两个向量之间的距离
         * @param value1
         * @param value2
         * @returns 两个向量之间的距离
         */
        Vector2.distance = function (vec1, vec2) {
            return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
        };
        /**
         * 返回两个向量之间的角度，单位是度数
         * @param from
         * @param to
         */
        Vector2.angle = function (from, to) {
            from = from.normalize();
            to = to.normalize();
            return Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
        };
        /**
         * 创建一个包含指定向量反转的新Vector2
         * @param value
         * @returns 矢量反演的结果
         */
        Vector2.negate = function (value) {
            value.x = -value.x;
            value.y = -value.y;
            return value;
        };
        /**
         * 创建一个新的Vector2，其中包含给定矢量和法线的反射矢量
         * @param vector
         * @param normal
         * @returns
         */
        Vector2.reflect = function (vector, normal) {
            var result = es.Vector2.zero;
            var val = 2 * ((vector.x * normal.x) + (vector.y * normal.y));
            result.x = vector.x - (normal.x * val);
            result.y = vector.y - (normal.y * val);
            return result;
        };
        /**
         * 创建一个新的Vector2，其中包含指定矢量的三次插值
         * @param value1
         * @param value2
         * @param amount
         * @returns
         */
        Vector2.smoothStep = function (value1, value2, amount) {
            return new Vector2(es.MathHelper.smoothStep(value1.x, value2.x, amount), es.MathHelper.smoothStep(value1.y, value2.y, amount));
        };
        Vector2.prototype.setTo = function (x, y) {
            this.x = x;
            this.y = y;
        };
        Vector2.prototype.negate = function () {
            return this.scale(-1);
        };
        /**
         *
         * @param value
         */
        Vector2.prototype.add = function (v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        };
        Vector2.prototype.addEqual = function (v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        };
        /**
         *
         * @param value
         */
        Vector2.prototype.divide = function (value) {
            return new Vector2(this.x / value.x, this.y / value.y);
        };
        Vector2.prototype.divideScaler = function (value) {
            return new Vector2(this.x / value, this.y / value);
        };
        /**
         *
         * @param value
         */
        Vector2.prototype.multiply = function (value) {
            return new Vector2(value.x * this.x, value.y * this.y);
        };
        /**
         *
         * @param value
         * @returns
         */
        Vector2.prototype.multiplyScaler = function (value) {
            this.x *= value;
            this.y *= value;
            return this;
        };
        /**
         * 从当前Vector2减去一个Vector2
         * @param value 要减去的Vector2
         * @returns 当前Vector2
         */
        Vector2.prototype.sub = function (value) {
            return new Vector2(this.x - value.x, this.y - value.y);
        };
        Vector2.prototype.subEqual = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        };
        Vector2.prototype.dot = function (v) {
            return this.x * v.x + this.y * v.y;
        };
        /**
         *
         * @param size
         * @returns
         */
        Vector2.prototype.scale = function (size) {
            return new Vector2(this.x * size, this.y * size);
        };
        Vector2.prototype.scaleEqual = function (size) {
            this.x *= size;
            this.y *= size;
            return this;
        };
        Vector2.prototype.transform = function (matrix) {
            return new Vector2(this.x * matrix.m11 + this.y * matrix.m21 + matrix.m31, this.x * matrix.m12 + this.y * matrix.m22 + matrix.m32);
        };
        Vector2.prototype.normalize = function () {
            var d = this.distance();
            if (d > 0) {
                return new Vector2(this.x / d, this.y / d);
            }
            else {
                return new Vector2(0, 1);
            }
        };
        /**
         * 将这个Vector2变成一个方向相同的单位向量
         */
        Vector2.prototype.normalizeEqual = function () {
            var d = this.distance();
            if (d > 0) {
                this.setTo(this.x / d, this.y / d);
                return this;
            }
            else {
                this.setTo(0, 1);
                return this;
            }
        };
        Vector2.prototype.magnitude = function () {
            return this.distance();
        };
        Vector2.prototype.distance = function (v) {
            if (!v) {
                v = Vector2.zero;
            }
            return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
        };
        /**
         * 返回该Vector2的平方长度
         * @returns 这个Vector2的平方长度
         */
        Vector2.prototype.lengthSquared = function () {
            return (this.x * this.x) + (this.y * this.y);
        };
        /**
         * 四舍五入X和Y值
         */
        Vector2.prototype.round = function () {
            return new Vector2(Math.round(this.x), Math.round(this.y));
        };
        /**
         * 返回以自己为中心点的左右角，单位为度
         * @param left
         * @param right
         */
        Vector2.prototype.angleBetween = function (left, right) {
            var one = left.sub(this);
            var two = right.sub(this);
            return es.Vector2Ext.angle(one, two);
        };
        /**
         * 比较当前实例是否等于指定的对象
         * @param other 要比较的对象
         * @returns 如果实例相同true 否则false
         */
        Vector2.prototype.equals = function (other, tolerance) {
            if (tolerance === void 0) { tolerance = 0.001; }
            return Math.abs(this.x - other.x) <= tolerance && Math.abs(this.y - other.y) <= tolerance;
        };
        Vector2.prototype.isValid = function () {
            return es.MathHelper.isValid(this.x) && es.MathHelper.isValid(this.y);
        };
        /**
         * 创建一个新的Vector2，其中包含来自两个向量的最小值
         * @param value1
         * @param value2
         * @returns
         */
        Vector2.min = function (value1, value2) {
            return new Vector2(value1.x < value2.x ? value1.x : value2.x, value1.y < value2.y ? value1.y : value2.y);
        };
        /**
         * 创建一个新的Vector2，其中包含两个向量的最大值
         * @param value1
         * @param value2
         * @returns
         */
        Vector2.max = function (value1, value2) {
            return new Vector2(value1.x > value2.x ? value1.x : value2.x, value1.y > value2.y ? value1.y : value2.y);
        };
        /**
         * 创建一个新的Vector2，其中包含Hermite样条插值
         * @param value1
         * @param tangent1
         * @param value2
         * @param tangent2
         * @param amount
         * @returns
         */
        Vector2.hermite = function (value1, tangent1, value2, tangent2, amount) {
            return new Vector2(es.MathHelper.hermite(value1.x, tangent1.x, value2.x, tangent2.x, amount), es.MathHelper.hermite(value1.y, tangent1.y, value2.y, tangent2.y, amount));
        };
        Vector2.unsignedAngle = function (from, to, round) {
            if (round === void 0) { round = true; }
            from.normalizeEqual();
            to.normalizeEqual();
            var angle = Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
            return round ? Math.round(angle) : angle;
        };
        Vector2.prototype.clone = function () {
            return new Vector2(this.x, this.y);
        };
        return Vector2;
    }());
    es.Vector2 = Vector2;
})(es || (es = {}));
///<reference path="../Math/Vector2.ts" />
var es;
///<reference path="../Math/Vector2.ts" />
(function (es) {
    /** 场景 */
    var Scene = /** @class */ (function () {
        function Scene() {
            this._sceneComponents = [];
            this._renderers = [];
            this.entities = new es.EntityList(this);
            this.renderableComponents = new es.RenderableComponentList();
            this.entityProcessors = new es.EntityProcessorList();
            this.identifierPool = new es.IdentifierPool();
            this.initialize();
        }
        /**
         * 在场景子类中重写这个，然后在这里进行加载。
         * 在场景设置好之后，但在调用begin之前，从contructor中调用这个函数
         */
        Scene.prototype.initialize = function () {
        };
        /**
         * 当Core将这个场景设置为活动场景时，这个将被调用
         */
        Scene.prototype.onStart = function () {
        };
        /**
         * 在场景子类中重写这个，并在这里做任何必要的卸载。
         * 当Core把这个场景从活动槽中移除时，这个被调用。
         */
        Scene.prototype.unload = function () {
        };
        Scene.prototype.begin = function () {
            if (this._renderers.length == 0) {
                this.addRenderer(new es.DefaultRenderer());
            }
            es.Physics.reset();
            if (this.entityProcessors != null)
                this.entityProcessors.begin();
            this._didSceneBegin = true;
            this.onStart();
        };
        Scene.prototype.end = function () {
            this._didSceneBegin = false;
            for (var i = 0; i < this._renderers.length; i++)
                this._renderers[i].unload();
            this.entities.removeAllEntities();
            for (var i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;
            this.camera = null;
            es.Physics.clear();
            if (this.entityProcessors)
                this.entityProcessors.end();
            this.unload();
        };
        Scene.prototype.update = function () {
            // 更新我们的列表，以防它们有任何变化
            this.entities.updateLists();
            for (var i = this._sceneComponents.length - 1; i >= 0; i--) {
                if (this._sceneComponents[i].enabled)
                    this._sceneComponents[i].update();
            }
            // 更新我们的实体解析器
            if (this.entityProcessors != null)
                this.entityProcessors.update();
            // 更新我们的实体组
            this.entities.update();
            if (this.entityProcessors != null)
                this.entityProcessors.lateUpdate();
            this.renderableComponents.updateLists();
            this.render();
        };
        Scene.prototype.render = function () {
            for (var i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        };
        Scene.prototype.addRenderer = function (renderer) {
            this._renderers.push(renderer);
            this._renderers.sort(function (self, other) { return self.renderOrder - other.renderOrder; });
            renderer.onAddedToScene(this);
            return renderer;
        };
        Scene.prototype.getRenderer = function (type) {
            for (var i = 0; i < this._renderers.length; i++) {
                if (this._renderers[i] instanceof type)
                    return this._renderers[i];
            }
            return null;
        };
        Scene.prototype.removeRenderer = function (renderer) {
            new es.List(this._renderers).remove(renderer);
            renderer.unload();
        };
        /**
         * 向组件列表添加并返回SceneComponent
         * @param component
         */
        Scene.prototype.addSceneComponent = function (component) {
            component.scene = this;
            component.onEnabled();
            this._sceneComponents.push(component);
            this._sceneComponents.sort(component.compare);
            return component;
        };
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到组件，则返回null。
         * @param type
         */
        Scene.prototype.getSceneComponent = function (type) {
            for (var i = 0; i < this._sceneComponents.length; i++) {
                var component = this._sceneComponents[i];
                if (component instanceof type)
                    return component;
            }
            return null;
        };
        /**
         * 获取类型为T的第一个SceneComponent并返回它。如果没有找到SceneComponent，则将创建SceneComponent。
         * @param type
         */
        Scene.prototype.getOrCreateSceneComponent = function (type) {
            var comp = this.getSceneComponent(type);
            if (comp == null)
                comp = this.addSceneComponent(new type());
            return comp;
        };
        /**
         * 从SceneComponents列表中删除一个SceneComponent
         * @param component
         */
        Scene.prototype.removeSceneComponent = function (component) {
            var sceneComponentList = new es.List(this._sceneComponents);
            es.Insist.isTrue(sceneComponentList.contains(component), "SceneComponent" + component + "\u4E0D\u5728SceneComponents\u5217\u8868\u4E2D!");
            sceneComponentList.remove(component);
            component.onRemovedFromScene();
        };
        /**
         * 将实体添加到此场景，并返回它
         * @param name
         */
        Scene.prototype.createEntity = function (name) {
            var entity = new es.Entity(name, this.identifierPool.checkOut());
            return this.addEntity(entity);
        };
        /**
         * 在场景的实体列表中添加一个实体
         * @param entity
         */
        Scene.prototype.addEntity = function (entity) {
            es.Insist.isFalse(new es.List(this.entities.buffer).contains(entity), "\u60A8\u8BD5\u56FE\u5C06\u540C\u4E00\u5B9E\u4F53\u6DFB\u52A0\u5230\u573A\u666F\u4E24\u6B21: " + entity);
            this.entities.add(entity);
            entity.scene = this;
            for (var i = 0; i < entity.transform.childCount; i++)
                this.addEntity(entity.transform.getChild(i).entity);
            return entity;
        };
        /**
         * 从场景中删除所有实体
         */
        Scene.prototype.destroyAllEntities = function () {
            for (var i = 0; i < this.entities.count; i++) {
                this.entities.buffer[i].destroy();
            }
        };
        /**
         * 搜索并返回第一个具有名称的实体
         * @param name
         */
        Scene.prototype.findEntity = function (name) {
            return this.entities.findEntity(name);
        };
        Scene.prototype.findEntityById = function (id) {
            return this.entities.findEntityById(id);
        };
        /**
         * 返回具有给定标记的所有实体
         * @param tag
         */
        Scene.prototype.findEntitiesWithTag = function (tag) {
            return this.entities.entitiesWithTag(tag);
        };
        /**
         * 返回提一个具有该标记的实体
         * @param tag
         * @returns
         */
        Scene.prototype.findEntityWithTag = function (tag) {
            return this.entities.entityWithTag(tag);
        };
        /**
         * 返回第一个启用加载的类型为T的组件
         * @param type
         */
        Scene.prototype.findComponentOfType = function (type) {
            return this.entities.findComponentOfType(type);
        };
        /**
         * 返回类型为T的所有已启用已加载组件的列表
         * @param type
         */
        Scene.prototype.findComponentsOfType = function (type) {
            return this.entities.findComponentsOfType(type);
        };
        /**
         * 返回场景中包含特定组件的实体列表
         * @param type
         * @returns
         */
        Scene.prototype.findEntitiesOfComponent = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            var _a;
            return (_a = this.entities).findEntitesOfComponent.apply(_a, __spread(types));
        };
        /**
         * 在场景中添加一个EntitySystem处理器
         * @param processor 处理器
         */
        Scene.prototype.addEntityProcessor = function (processor) {
            processor.scene = this;
            this.entityProcessors.add(processor);
            processor.setUpdateOrder(this.entityProcessors.count - 1);
            this.entityProcessors.clearDirty();
            return processor;
        };
        /**
         * 从场景中删除EntitySystem处理器
         * @param processor
         */
        Scene.prototype.removeEntityProcessor = function (processor) {
            this.entityProcessors.remove(processor);
        };
        /**
         * 获取EntitySystem处理器
         */
        Scene.prototype.getEntityProcessor = function (type) {
            return this.entityProcessors.getProcessor(type);
        };
        return Scene;
    }());
    es.Scene = Scene;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentTransform;
    (function (ComponentTransform) {
        ComponentTransform[ComponentTransform["position"] = 0] = "position";
        ComponentTransform[ComponentTransform["scale"] = 1] = "scale";
        ComponentTransform[ComponentTransform["rotation"] = 2] = "rotation";
    })(ComponentTransform = es.ComponentTransform || (es.ComponentTransform = {}));
    var DirtyType;
    (function (DirtyType) {
        DirtyType[DirtyType["clean"] = 0] = "clean";
        DirtyType[DirtyType["positionDirty"] = 1] = "positionDirty";
        DirtyType[DirtyType["scaleDirty"] = 2] = "scaleDirty";
        DirtyType[DirtyType["rotationDirty"] = 4] = "rotationDirty";
    })(DirtyType = es.DirtyType || (es.DirtyType = {}));
    var Transform = /** @class */ (function () {
        function Transform(entity) {
            /**
             * 值会根据位置、旋转和比例自动重新计算
             */
            this._localTransform = es.Matrix2D.identity;
            /**
             * 值将自动从本地和父矩阵重新计算。
             */
            this._worldTransform = es.Matrix2D.identity;
            this._rotationMatrix = es.Matrix2D.identity;
            this._translationMatrix = es.Matrix2D.identity;
            this._scaleMatrix = es.Matrix2D.identity;
            this._children = [];
            this._worldToLocalTransform = es.Matrix2D.identity;
            this._worldInverseTransform = es.Matrix2D.identity;
            this._position = es.Vector2.zero;
            this._scale = es.Vector2.one;
            this._rotation = 0;
            this._localPosition = es.Vector2.zero;
            this._localScale = es.Vector2.one;
            this._localRotation = 0;
            this.entity = entity;
            this.scale = this._localScale = es.Vector2.one;
        }
        Object.defineProperty(Transform.prototype, "childCount", {
            /**
             * 这个转换的所有子元素
             */
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "rotationDegrees", {
            /**
             * 变换在世界空间的旋转度
             */
            get: function () {
                return es.MathHelper.toDegrees(this._rotation);
            },
            /**
             * 变换在世界空间的旋转度
             * @param value
             */
            set: function (value) {
                this.setRotation(es.MathHelper.toRadians(value));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localRotationDegrees", {
            /**
             * 旋转相对于父变换旋转的角度
             */
            get: function () {
                return es.MathHelper.toDegrees(this._localRotation);
            },
            /**
             * 旋转相对于父变换旋转的角度
             * @param value
             */
            set: function (value) {
                this.localRotation = es.MathHelper.toRadians(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localToWorldTransform", {
            get: function () {
                this.updateTransform();
                return this._worldTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "parent", {
            /**
             * 获取此转换的父转换
             */
            get: function () {
                return this._parent;
            },
            /**
             * 设置此转换的父转换
             * @param value
             */
            set: function (value) {
                this.setParent(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "worldToLocalTransform", {
            get: function () {
                if (this._worldToLocalDirty) {
                    if (this.parent == null) {
                        this._worldToLocalTransform = es.Matrix2D.identity;
                    }
                    else {
                        this.parent.updateTransform();
                        this._worldToLocalTransform = es.Matrix2D.invert(this.parent._worldTransform);
                    }
                    this._worldToLocalDirty = false;
                }
                return this._worldToLocalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "worldInverseTransform", {
            get: function () {
                this.updateTransform();
                if (this._worldInverseDirty) {
                    this._worldInverseTransform = es.Matrix2D.invert(this._worldTransform);
                    this._worldInverseDirty = false;
                }
                return this._worldInverseTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "position", {
            /**
             * 变换在世界空间中的位置
             */
            get: function () {
                this.updateTransform();
                if (this._positionDirty) {
                    if (this.parent == null) {
                        this._position = this._localPosition;
                    }
                    else {
                        this.parent.updateTransform();
                        es.Vector2Ext.transformR(this._localPosition, this.parent._worldTransform, this._position);
                    }
                    this._positionDirty = false;
                }
                return this._position;
            },
            /**
             * 变换在世界空间中的位置
             * @param value
             */
            set: function (value) {
                this.setPosition(value.x, value.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "scale", {
            /**
             * 变换在世界空间的缩放
             */
            get: function () {
                this.updateTransform();
                return this._scale;
            },
            /**
             * 变换在世界空间的缩放
             * @param value
             */
            set: function (value) {
                this.setScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "rotation", {
            /**
             * 在世界空间中以弧度旋转的变换
             */
            get: function () {
                this.updateTransform();
                return this._rotation;
            },
            /**
             * 变换在世界空间的旋转度
             * @param value
             */
            set: function (value) {
                this.setRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localPosition", {
            /**
             * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
             */
            get: function () {
                this.updateTransform();
                return this._localPosition;
            },
            /**
             * 转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
             * @param value
             */
            set: function (value) {
                this.setLocalPosition(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localScale", {
            /**
             * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
             */
            get: function () {
                this.updateTransform();
                return this._localScale;
            },
            /**
             * 转换相对于父元素的比例。如果转换没有父元素，则与transform.scale相同
             * @param value
             */
            set: function (value) {
                this.setLocalScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localRotation", {
            /**
             * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
             */
            get: function () {
                this.updateTransform();
                return this._localRotation;
            },
            /**
             * 相对于父变换的旋转，变换的旋转。如果转换没有父元素，则与transform.rotation相同
             * @param value
             */
            set: function (value) {
                this.setLocalRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 返回在索引处的转换子元素
         * @param index
         */
        Transform.prototype.getChild = function (index) {
            return this._children[index];
        };
        /**
         * 设置此转换的父转换
         * @param parent
         */
        Transform.prototype.setParent = function (parent) {
            var _this = this;
            if (this._parent == parent)
                return this;
            if (this._parent != null) {
                var index = this._parent._children.findIndex(function (t) { return t == _this; });
                if (index != -1)
                    this._parent._children.splice(index, 1);
            }
            if (parent != null) {
                parent._children.push(this);
            }
            this._parent = parent;
            this.setDirty(DirtyType.positionDirty);
            return this;
        };
        /**
         * 设置转换在世界空间中的位置
         * @param x
         * @param y
         */
        Transform.prototype.setPosition = function (x, y) {
            var position = new es.Vector2(x, y);
            if (position.equals(this._position))
                return this;
            this._position = position;
            if (this.parent != null) {
                this.localPosition = es.Vector2.transform(this._position, this.worldToLocalTransform);
            }
            else {
                this.localPosition = position;
            }
            this._positionDirty = false;
            return this;
        };
        /**
         * 设置转换相对于父转换的位置。如果转换没有父元素，则与transform.position相同
         * @param localPosition
         */
        Transform.prototype.setLocalPosition = function (localPosition) {
            if (localPosition.equals(this._localPosition))
                return this;
            this._localPosition = localPosition;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.positionDirty);
            return this;
        };
        /**
         * 设置变换在世界空间的旋转度
         * @param radians
         */
        Transform.prototype.setRotation = function (radians) {
            this._rotation = radians;
            if (this.parent != null) {
                this.localRotation = this.parent.rotation + radians;
            }
            else {
                this.localRotation = radians;
            }
            return this;
        };
        /**
         * 设置变换在世界空间的旋转度
         * @param degrees
         */
        Transform.prototype.setRotationDegrees = function (degrees) {
            return this.setRotation(es.MathHelper.toRadians(degrees));
        };
        /**
         * 旋转精灵的顶部，使其朝向位置
         * @param pos
         */
        Transform.prototype.lookAt = function (pos) {
            var sign = this.position.x > pos.x ? -1 : 1;
            var vectorToAlignTo = this.position.sub(pos).normalize();
            this.rotation = sign * Math.acos(vectorToAlignTo.dot(es.Vector2.unitY));
        };
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param radians
         */
        Transform.prototype.setLocalRotation = function (radians) {
            this._localRotation = radians;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.rotationDirty);
            return this;
        };
        /**
         * 相对于父变换的旋转设置变换的旋转。如果转换没有父元素，则与transform.rotation相同
         * @param degrees
         */
        Transform.prototype.setLocalRotationDegrees = function (degrees) {
            return this.setLocalRotation(es.MathHelper.toRadians(degrees));
        };
        /**
         * 设置变换在世界空间中的缩放
         * @param scale
         */
        Transform.prototype.setScale = function (scale) {
            this._scale = scale;
            if (this.parent != null) {
                this.localScale = es.Vector2.divide(scale, this.parent._scale);
            }
            else {
                this.localScale = scale;
            }
            return this;
        };
        /**
         * 设置转换相对于父对象的比例。如果转换没有父元素，则与transform.scale相同
         * @param scale
         */
        Transform.prototype.setLocalScale = function (scale) {
            this._localScale = scale;
            this._localDirty = this._positionDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.scaleDirty);
            return this;
        };
        /**
         * 对精灵坐标进行四舍五入
         */
        Transform.prototype.roundPosition = function () {
            this.position = es.Vector2Ext.round(this._position);
        };
        Transform.prototype.updateTransform = function () {
            if (this.hierarchyDirty != DirtyType.clean) {
                if (this.parent != null)
                    this.parent.updateTransform();
                if (this._localDirty) {
                    if (this._localPositionDirty) {
                        es.Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y, this._translationMatrix);
                        this._localPositionDirty = false;
                    }
                    if (this._localRotationDirty) {
                        es.Matrix2D.createRotation(this._localRotation, this._rotationMatrix);
                        this._localRotationDirty = false;
                    }
                    if (this._localScaleDirty) {
                        es.Matrix2D.createScale(this._localScale.x, this._localScale.y, this._scaleMatrix);
                        this._localScaleDirty = false;
                    }
                    es.Matrix2D.multiply(this._scaleMatrix, this._rotationMatrix, this._localTransform);
                    es.Matrix2D.multiply(this._localTransform, this._translationMatrix, this._localTransform);
                    if (this.parent == null) {
                        this._worldTransform = this._localTransform;
                        this._rotation = this._localRotation;
                        this._scale = this._localScale;
                        this._worldInverseDirty = true;
                    }
                    this._localDirty = false;
                }
                if (this.parent != null) {
                    es.Matrix2D.multiply(this._localTransform, this.parent._worldTransform, this._worldTransform);
                    this._rotation = this._localRotation + this.parent._rotation;
                    this._scale = this.parent._scale.multiply(this._localScale);
                    ;
                    this._worldInverseDirty = true;
                }
                this._worldToLocalDirty = true;
                this._positionDirty = true;
                this.hierarchyDirty = DirtyType.clean;
            }
        };
        Transform.prototype.setDirty = function (dirtyFlagType) {
            if ((this.hierarchyDirty & dirtyFlagType) == 0) {
                this.hierarchyDirty |= dirtyFlagType;
                switch (dirtyFlagType) {
                    case DirtyType.positionDirty:
                        this.entity.onTransformChanged(ComponentTransform.position);
                        break;
                    case DirtyType.rotationDirty:
                        this.entity.onTransformChanged(ComponentTransform.rotation);
                        break;
                    case DirtyType.scaleDirty:
                        this.entity.onTransformChanged(ComponentTransform.scale);
                        break;
                }
                // 告诉子项发生了变换
                for (var i = 0; i < this._children.length; i++)
                    this._children[i].setDirty(dirtyFlagType);
            }
        };
        /**
         * 从另一个transform属性进行拷贝
         * @param transform
         */
        Transform.prototype.copyFrom = function (transform) {
            this._position = transform.position.clone();
            this._localPosition = transform._localPosition.clone();
            this._rotation = transform._rotation;
            this._localRotation = transform._localRotation;
            this._scale = transform._scale;
            this._localScale = transform._localScale;
            this.setDirty(DirtyType.positionDirty);
            this.setDirty(DirtyType.rotationDirty);
            this.setDirty(DirtyType.scaleDirty);
        };
        Transform.prototype.toString = function () {
            return "[Transform: parent: " + this.parent + ", position: " + this.position + ", rotation: " + this.rotation + ",\n                scale: " + this.scale + ", localPosition: " + this._localPosition + ", localRotation: " + this._localRotation + ",\n                localScale: " + this._localScale + "]";
        };
        return Transform;
    }());
    es.Transform = Transform;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于比较组件更新排序
     */
    var IUpdatableComparer = /** @class */ (function () {
        function IUpdatableComparer() {
        }
        IUpdatableComparer.prototype.compare = function (a, b) {
            return a.updateOrder - b.updateOrder;
        };
        return IUpdatableComparer;
    }());
    es.IUpdatableComparer = IUpdatableComparer;
    es.isIUpdatable = function (props) { return typeof props['update'] !== 'undefined'; };
})(es || (es = {}));
var es;
(function (es) {
    var SceneComponent = /** @class */ (function () {
        function SceneComponent() {
            /**
             * 更新此场景中SceneComponents的顺序
             */
            this.updateOrder = 0;
            this._enabled = true;
        }
        Object.defineProperty(SceneComponent.prototype, "enabled", {
            /**
             * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
             */
            get: function () {
                return this._enabled;
            },
            /**
             * 如果启用了SceneComponent，则为true。状态的改变会导致调用onEnabled/onDisable。
             * @param value
             */
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 在启用此SceneComponent时调用
         */
        SceneComponent.prototype.onEnabled = function () {
        };
        /**
         * 当禁用此SceneComponent时调用
         */
        SceneComponent.prototype.onDisabled = function () {
        };
        /**
         * 当该SceneComponent从场景中移除时调用
         */
        SceneComponent.prototype.onRemovedFromScene = function () {
        };
        /**
         * 在实体更新之前每一帧调用
         */
        SceneComponent.prototype.update = function () {
        };
        /**
         * 启用/禁用这个SceneComponent
         * @param isEnabled
         */
        SceneComponent.prototype.setEnabled = function (isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                }
                else {
                    this.onDisabled();
                }
            }
            return this;
        };
        /**
         * 设置SceneComponent的updateOrder并触发某种SceneComponent
         * @param updateOrder
         */
        SceneComponent.prototype.setUpdateOrder = function (updateOrder) {
            if (this.updateOrder != updateOrder) {
                this.updateOrder = updateOrder;
            }
            return this;
        };
        SceneComponent.prototype.compare = function (other) {
            return this.updateOrder - other.updateOrder;
        };
        return SceneComponent;
    }());
    es.SceneComponent = SceneComponent;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 请注意，这不是一个完整的、多迭代的物理系统！它可以用于简单的、街机风格的物理。
     * 这可以用于简单的，街机风格的物理学
     */
    var ArcadeRigidbody = /** @class */ (function (_super) {
        __extends(ArcadeRigidbody, _super);
        function ArcadeRigidbody() {
            var _this = _super.call(this) || this;
            /**
             *  如果为真，则每一帧都会考虑到Physics.gravity
             */
            _this.shouldUseGravity = true;
            /**
             * 该刚体的速度
             */
            _this.velocity = es.Vector2.zero;
            _this._mass = 10;
            _this._elasticity = 0.5;
            _this._friction = 0.5;
            _this._glue = 0.01;
            _this._inverseMass = 0;
            _this._inverseMass = 1 / _this._mass;
            return _this;
        }
        Object.defineProperty(ArcadeRigidbody.prototype, "mass", {
            /** 这个刚体的质量。质量为0，则是一个不可移动的物体 */
            get: function () {
                return this._mass;
            },
            set: function (value) {
                this.setMass(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcadeRigidbody.prototype, "elasticity", {
            /**
             * 0-1范围，其中0为无反弹，1为完全反射。
             */
            get: function () {
                return this._elasticity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcadeRigidbody.prototype, "elasticiy", {
            set: function (value) {
                this.setElasticity(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcadeRigidbody.prototype, "friction", {
            /**
             * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
             */
            get: function () {
                return this._friction;
            },
            set: function (value) {
                this.setFriction(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcadeRigidbody.prototype, "glue", {
            /**
             * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
             */
            get: function () {
                return this._glue;
            },
            set: function (value) {
                this.setGlue(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcadeRigidbody.prototype, "isImmovable", {
            /**
             * 质量为0的刚体被认为是不可移动的。改变速度和碰撞对它们没有影响
             */
            get: function () {
                return this._mass < 0.0001;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 这个刚体的质量。质量为0，则是一个不可移动的物体
         * @param mass
         */
        ArcadeRigidbody.prototype.setMass = function (mass) {
            this._mass = es.MathHelper.clamp(mass, 0, Number.MAX_VALUE);
            if (this._mass > 0.0001)
                this._inverseMass = 1 / this._mass;
            else
                this._inverseMass = 0;
            return this;
        };
        /**
         * 0-1范围，其中0为无反弹，1为完全反射。
         * @param value
         */
        ArcadeRigidbody.prototype.setElasticity = function (value) {
            this._elasticity = es.MathHelper.clamp01(value);
            return this;
        };
        /**
         * 0 - 1范围。0表示没有摩擦力，1表示物体会停止在原地
         * @param value
         */
        ArcadeRigidbody.prototype.setFriction = function (value) {
            this._friction = es.MathHelper.clamp01(value);
            return this;
        };
        /**
         * 0-9的范围。当发生碰撞时，沿碰撞面做直线运动时，如果其平方幅度小于glue摩擦力，则将碰撞设置为上限
         * @param value
         */
        ArcadeRigidbody.prototype.setGlue = function (value) {
            this._glue = es.MathHelper.clamp(value, 0, 10);
            return this;
        };
        ArcadeRigidbody.prototype.setVelocity = function (velocity) {
            this.velocity = velocity;
            return this;
        };
        /**
         * 用刚体的质量给刚体加上一个瞬间的力脉冲。力是一个加速度，单位是每秒像素每秒。将力乘以100000，使数值使用更合理
         * @param force
         */
        ArcadeRigidbody.prototype.addImpulse = function (force) {
            if (!this.isImmovable) {
                this.velocity.addEqual(force.scale(100000 * (this._inverseMass * (es.Time.deltaTime * es.Time.deltaTime))));
            }
        };
        ArcadeRigidbody.prototype.onAddedToEntity = function () {
            this._collider = null;
            for (var i = 0; i < this.entity.components.buffer.length; i++) {
                var component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    this._collider = component;
                    break;
                }
            }
            es.Debug.warnIf(this._collider == null, "ArcadeRigidbody 没有 Collider。ArcadeRigidbody需要一个Collider!");
        };
        ArcadeRigidbody.prototype.update = function () {
            var e_1, _a;
            if (this.isImmovable || this._collider == null) {
                this.velocity = es.Vector2.zero;
                return;
            }
            if (this.shouldUseGravity)
                this.velocity.addEqual(es.Physics.gravity.scale(es.Time.deltaTime));
            this.entity.position = this.entity.position.add(this.velocity.scale(es.Time.deltaTime));
            var collisionResult = new es.CollisionResult();
            // 捞取我们在新的位置上可能会碰撞到的任何东西
            var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(this._collider, this._collider.bounds, this._collider.collidesWithLayers.value);
            try {
                for (var neighbors_1 = __values(neighbors), neighbors_1_1 = neighbors_1.next(); !neighbors_1_1.done; neighbors_1_1 = neighbors_1.next()) {
                    var neighbor = neighbors_1_1.value;
                    if (!neighbor)
                        continue;
                    // 如果邻近的对撞机是同一个实体，则忽略它
                    if (neighbor.entity.equals(this.entity)) {
                        continue;
                    }
                    if (this._collider.collidesWithNonMotion(neighbor, collisionResult)) {
                        // 如果附近有一个ArcadeRigidbody，我们就会处理完整的碰撞响应。如果没有，我们会根据附近是不可移动的来计算事情
                        var neighborRigidbody = neighbor.entity.getComponent(ArcadeRigidbody);
                        if (neighborRigidbody != null) {
                            this.processOverlap(neighborRigidbody, collisionResult.minimumTranslationVector);
                            this.processCollision(neighborRigidbody, collisionResult.minimumTranslationVector);
                        }
                        else {
                            // 没有ArcadeRigidbody，所以我们假设它是不动的，只移动我们自己的
                            this.entity.position = this.entity.position.sub(collisionResult.minimumTranslationVector);
                            var relativeVelocity = this.calculateResponseVelocity(this.velocity, collisionResult.minimumTranslationVector);
                            this.velocity.addEqual(relativeVelocity);
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (neighbors_1_1 && !neighbors_1_1.done && (_a = neighbors_1.return)) _a.call(neighbors_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        /**
         * 将两个重叠的刚体分开。也处理其中一个不可移动的情况
         * @param other
         * @param minimumTranslationVector
         */
        ArcadeRigidbody.prototype.processOverlap = function (other, minimumTranslationVector) {
            if (this.isImmovable) {
                other.entity.position = other.entity.position.add(minimumTranslationVector);
            }
            else if (other.isImmovable) {
                this.entity.position = this.entity.position.sub(minimumTranslationVector);
            }
            else {
                this.entity.position = this.entity.position.sub(minimumTranslationVector.scale(0.5));
                other.entity.position = other.entity.position.add(minimumTranslationVector.scale(0.5));
            }
        };
        /**
         * 处理两个非重叠的刚体的碰撞。新的速度将根据情况分配给每个刚体
         * @param other
         * @param minimumTranslationVector
         */
        ArcadeRigidbody.prototype.processCollision = function (other, minimumTranslationVector) {
            // 我们计算两个相撞物体的响应。
            // 计算的基础是沿碰撞表面法线反射的物体的相对速度。
            // 然后，响应的一部分会根据质量加到每个物体上
            var relativeVelocity = this.velocity.sub(other.velocity);
            relativeVelocity = this.calculateResponseVelocity(relativeVelocity, minimumTranslationVector);
            // 现在，我们使用质量来线性缩放两个刚体上的响应
            var totalinverseMass = this._inverseMass + other._inverseMass;
            var ourResponseFraction = this._inverseMass / totalinverseMass;
            var otherResponseFraction = other._inverseMass / totalinverseMass;
            this.velocity = this.velocity.add(relativeVelocity.scale(ourResponseFraction));
            other.velocity = other.velocity.sub(relativeVelocity.scale(otherResponseFraction));
        };
        /**
         *  给定两个物体和MTV之间的相对速度，本方法修改相对速度，使其成为碰撞响应
         * @param relativeVelocity
         * @param minimumTranslationVector
         * @param responseVelocity
         */
        ArcadeRigidbody.prototype.calculateResponseVelocity = function (relativeVelocity, minimumTranslationVector) {
            // 首先，我们得到反方向的归一化MTV：表面法线
            var inverseMTV = minimumTranslationVector.scale(-1);
            var normal = inverseMTV.normalize();
            // 速度是沿碰撞法线和碰撞平面分解的。
            // 弹性将影响沿法线的响应（法线速度分量），摩擦力将影响速度的切向分量（切向速度分量）
            var n = relativeVelocity.dot(normal);
            var normalVelocityComponent = normal.scale(n);
            var tangentialVelocityComponent = relativeVelocity.sub(normalVelocityComponent);
            if (n > 0)
                normalVelocityComponent = es.Vector2.zero;
            // 如果切向分量的平方幅度小于glue，那么我们就把摩擦力提升到最大
            var coefficientOfFriction = this._friction;
            if (tangentialVelocityComponent.lengthSquared() < this._glue)
                coefficientOfFriction = 1.01;
            // 弹性影响速度的法向分量，摩擦力影响速度的切向分量
            return normalVelocityComponent
                .scale(1 + this._elasticity)
                .sub(tangentialVelocityComponent.scale(coefficientOfFriction))
                .scale(-1);
        };
        return ArcadeRigidbody;
    }(es.Component));
    es.ArcadeRigidbody = ArcadeRigidbody;
})(es || (es = {}));
var es;
(function (es) {
    var CharacterRaycastOrigins = /** @class */ (function () {
        function CharacterRaycastOrigins() {
            this.topLeft = es.Vector2.zero;
            this.bottomRight = es.Vector2.zero;
            this.bottomLeft = es.Vector2.zero;
        }
        return CharacterRaycastOrigins;
    }());
    var CharacterCollisionState2D = /** @class */ (function () {
        function CharacterCollisionState2D() {
            this.right = false;
            this.left = false;
            this.above = false;
            this.below = false;
            this.becameGroundedThisFrame = false;
            this.wasGroundedLastFrame = false;
            this.movingDownSlope = false;
            this.slopeAngle = 0;
        }
        CharacterCollisionState2D.prototype.hasCollision = function () {
            return this.below || this.right || this.left || this.above;
        };
        CharacterCollisionState2D.prototype.reset = function () {
            this.right = this.left = false;
            this.above = this.below = false;
            this.becameGroundedThisFrame = this.movingDownSlope = false;
            this.slopeAngle = 0;
        };
        CharacterCollisionState2D.prototype.toString = function () {
            return "[CharacterCollisionState2D] r: " + this.right + ", l: " + this.left + ", a: " + this.above + ", b: " + this.below + ", movingDownSlope: " + this.movingDownSlope + ", angle: " + this.slopeAngle + ", wasGroundedLastFrame: " + this.wasGroundedLastFrame + ", becameGroundedThisFrame: " + this.becameGroundedThisFrame;
        };
        return CharacterCollisionState2D;
    }());
    var CharacterController = /** @class */ (function () {
        function CharacterController(player, skinWidth, platformMask, onewayPlatformMask, triggerMask) {
            if (platformMask === void 0) { platformMask = -1; }
            if (onewayPlatformMask === void 0) { onewayPlatformMask = -1; }
            if (triggerMask === void 0) { triggerMask = -1; }
            this.ignoredColliders = new Set();
            /**
             * CC2D 可以爬升的最大坡度角
             */
            this.slopeLimit = 30;
            /**
             * 构成跳跃的帧之间垂直运动变化的阈值
             */
            this.jumpingThreshold = -7;
            this.totalHorizontalRays = 5;
            this.totalVerticalRays = 3;
            this.collisionState = new CharacterCollisionState2D();
            this.velocity = new es.Vector2(0, 0);
            this._skinWidth = 0.02;
            this.kSkinWidthFloatFudgeFactor = 0.001;
            /**
             * 我们的光线投射原点角的支架（TR、TL、BR、BL）
             */
            this._raycastOrigins = new CharacterRaycastOrigins();
            /**
             * 存储我们在移动过程中命中的光线投射
             */
            this._raycastHit = new es.RaycastHit();
            /**
             * 我们使用这个标志来标记我们正在爬坡的情况，我们修改了 delta.y 以允许爬升。
             * 原因是，如果我们到达斜坡的尽头，我们可以进行调整以保持接地
             */
            this._isGoingUpSlope = false;
            this._isWarpingToGround = true;
            this.platformMask = -1;
            this.triggerMask = -1;
            this.oneWayPlatformMask = -1;
            this.rayOriginSkinMutiplier = 4;
            this.onTriggerEnterEvent = new es.ObservableT();
            this.onTriggerExitEvent = new es.ObservableT();
            this.onControllerCollidedEvent = new es.ObservableT();
            this.platformMask = platformMask;
            this.oneWayPlatformMask = onewayPlatformMask;
            this.triggerMask = triggerMask;
            // 将我们的单向平台添加到我们的普通平台掩码中，以便我们可以从上方降落 
            this.platformMask |= this.oneWayPlatformMask;
            this._player = player;
            var collider = null;
            for (var i = 0; i < this._player.components.buffer.length; i++) {
                var component = this._player.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            collider.isTrigger = false;
            if (collider instanceof es.BoxCollider) {
                this._collider = collider;
            }
            else {
                throw new Error('player collider must be box');
            }
            // 在这里，我们触发了具有主体的 setter 的属性 
            this.skinWidth = skinWidth || collider.width * 0.05;
            this._slopeLimitTangent = Math.tan(75 * es.MathHelper.Deg2Rad);
            this._triggerHelper = new es.ColliderTriggerHelper(this._player);
            // 我们想设置我们的 CC2D 忽略所有碰撞层，除了我们的 triggerMask 
            for (var i = 0; i < 32; i++) {
                // 查看我们的 triggerMask 是否包含此层，如果不包含则忽略它 
                if ((this.triggerMask & (1 << i)) === 0) {
                    es.Flags.unsetFlag(this._collider.collidesWithLayers, i);
                }
            }
        }
        Object.defineProperty(CharacterController.prototype, "skinWidth", {
            /**
             * 定义距离碰撞射线的边缘有多远。
             * 如果使用 0 范围进行投射，则通常会导致不需要的光线击中（例如，直接从表面水平投射的足部碰撞器可能会导致击中）
             */
            get: function () {
                return this._skinWidth;
            },
            set: function (value) {
                this._skinWidth = value;
                this.recalculateDistanceBetweenRays();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CharacterController.prototype, "isGrounded", {
            get: function () {
                return this.collisionState.below;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CharacterController.prototype, "raycastHitsThisFrame", {
            get: function () {
                return this._raycastHitsThisFrame;
            },
            enumerable: true,
            configurable: true
        });
        CharacterController.prototype.onTriggerEnter = function (other, local) {
            this.onTriggerEnterEvent.notify(other);
        };
        CharacterController.prototype.onTriggerExit = function (other, local) {
            this.onTriggerExitEvent.notify(other);
        };
        /**
         * 尝试将角色移动到位置 + deltaMovement。 任何挡路的碰撞器都会在遇到时导致运动停止
         * @param deltaMovement
         * @param deltaTime
         */
        CharacterController.prototype.move = function (deltaMovement, deltaTime) {
            this.collisionState.wasGroundedLastFrame = this.collisionState.below;
            this.collisionState.reset();
            this._raycastHitsThisFrame = [];
            this._isGoingUpSlope = false;
            this.primeRaycastOrigins();
            if (deltaMovement.y > 0 && this.collisionState.wasGroundedLastFrame) {
                deltaMovement = this.handleVerticalSlope(deltaMovement);
            }
            if (deltaMovement.x !== 0) {
                deltaMovement = this.moveHorizontally(deltaMovement);
            }
            if (deltaMovement.y !== 0) {
                deltaMovement = this.moveVertically(deltaMovement);
            }
            this._player.setPosition(this._player.position.x + deltaMovement.x, this._player.position.y + deltaMovement.y);
            if (deltaTime > 0) {
                this.velocity.x = deltaMovement.x / deltaTime;
                this.velocity.y = deltaMovement.y / deltaTime;
            }
            if (!this.collisionState.wasGroundedLastFrame &&
                this.collisionState.below) {
                this.collisionState.becameGroundedThisFrame = true;
            }
            if (this._isGoingUpSlope) {
                this.velocity.y = 0;
            }
            if (!this._isWarpingToGround) {
                this._triggerHelper.update();
            }
            for (var i = 0; i < this._raycastHitsThisFrame.length; i++) {
                this.onControllerCollidedEvent.notify(this._raycastHitsThisFrame[i]);
            }
            if (this.ignoreOneWayPlatformsTime > 0) {
                this.ignoreOneWayPlatformsTime -= deltaTime;
            }
        };
        /**
         * 直接向下移动直到接地
         * @param maxDistance
         */
        CharacterController.prototype.warpToGrounded = function (maxDistance) {
            if (maxDistance === void 0) { maxDistance = 1000; }
            this.ignoreOneWayPlatformsTime = 0;
            this._isWarpingToGround = true;
            var delta = 0;
            do {
                delta += 1;
                this.move(new es.Vector2(0, 1), 0.02);
                if (delta > maxDistance) {
                    break;
                }
            } while (!this.isGrounded);
            this._isWarpingToGround = false;
        };
        /**
         * 这应该在您必须在运行时修改 BoxCollider2D 的任何时候调用。
         * 它将重新计算用于碰撞检测的光线之间的距离。
         * 它也用于 skinWidth setter，以防在运行时更改。
         */
        CharacterController.prototype.recalculateDistanceBetweenRays = function () {
            var colliderUsableHeight = this._collider.height * Math.abs(this._player.scale.y) -
                2 * this._skinWidth;
            this._verticalDistanceBetweenRays =
                colliderUsableHeight / (this.totalHorizontalRays - 1);
            var colliderUsableWidth = this._collider.width * Math.abs(this._player.scale.x) -
                2 * this._skinWidth;
            this._horizontalDistanceBetweenRays =
                colliderUsableWidth / (this.totalVerticalRays - 1);
        };
        /**
         * 将 raycastOrigins 重置为由 skinWidth 插入的框碰撞器的当前范围。
         * 插入它是为了避免从直接接触另一个碰撞器的位置投射光线，从而导致不稳定的法线数据。
         */
        CharacterController.prototype.primeRaycastOrigins = function () {
            var rect = this._collider.bounds;
            this._raycastOrigins.topLeft = new es.Vector2(rect.x + this._skinWidth, rect.y + this._skinWidth);
            this._raycastOrigins.bottomRight = new es.Vector2(rect.right - this._skinWidth, rect.bottom - this._skinWidth);
            this._raycastOrigins.bottomLeft = new es.Vector2(rect.x + this._skinWidth, rect.bottom - this._skinWidth);
        };
        /**
         * 我们必须在这方面使用一些技巧。
         * 光线必须从我们的碰撞器（skinWidth）内部的一小段距离投射，以避免零距离光线会得到错误的法线。
         * 由于这个小偏移，我们必须增加光线距离 skinWidth 然后记住在实际移动玩家之前从 deltaMovement 中删除 skinWidth
         * @param deltaMovement
         * @returns
         */
        CharacterController.prototype.moveHorizontally = function (deltaMovement) {
            var isGoingRight = deltaMovement.x > 0;
            var rayDistance = Math.abs(deltaMovement.x) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            var rayDirection = isGoingRight ? es.Vector2.right : es.Vector2.left;
            var initialRayOriginY = this._raycastOrigins.bottomLeft.y;
            var initialRayOriginX = isGoingRight
                ? this._raycastOrigins.bottomRight.x -
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.x +
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1);
            for (var i = 0; i < this.totalHorizontalRays; i++) {
                var ray = new es.Vector2(initialRayOriginX, initialRayOriginY - i * this._verticalDistanceBetweenRays);
                // 如果我们接地，我们将只在第一条射线（底部）上包含 oneWayPlatforms。 
                // 允许我们走上倾斜的 oneWayPlatforms 
                if (i === 0 &&
                    this.supportSlopedOneWayPlatforms &&
                    this.collisionState.wasGroundedLastFrame) {
                    this._raycastHit = es.Physics.linecast(ray, ray.add(rayDirection.scaleEqual(rayDistance)), this.platformMask, this.ignoredColliders);
                }
                else {
                    this._raycastHit = es.Physics.linecast(ray, ray.add(rayDirection.scaleEqual(rayDistance)), this.platformMask & ~this.oneWayPlatformMask, this.ignoredColliders);
                }
                if (this._raycastHit.collider) {
                    if (i === 0 &&
                        this.handleHorizontalSlope(deltaMovement, es.Vector2.unsignedAngle(this._raycastHit.normal, es.Vector2.up))) {
                        this._raycastHitsThisFrame.push(this._raycastHit);
                        break;
                    }
                    deltaMovement.x = this._raycastHit.point.x - ray.x;
                    rayDistance = Math.abs(deltaMovement.x);
                    if (isGoingRight) {
                        deltaMovement.x -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.right = true;
                    }
                    else {
                        deltaMovement.x += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.left = true;
                    }
                    this._raycastHitsThisFrame.push(this._raycastHit);
                    if (rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                            this.kSkinWidthFloatFudgeFactor) {
                        break;
                    }
                }
            }
            return deltaMovement;
        };
        CharacterController.prototype.moveVertically = function (deltaMovement) {
            var isGoingUp = deltaMovement.y < 0;
            var rayDistance = Math.abs(deltaMovement.y) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            var rayDirection = isGoingUp ? es.Vector2.up : es.Vector2.down;
            var initialRayOriginX = this._raycastOrigins.topLeft.x;
            var initialRayOriginY = isGoingUp
                ? this._raycastOrigins.topLeft.y +
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.y -
                    this._skinWidth * (this.rayOriginSkinMutiplier - 1);
            initialRayOriginX += deltaMovement.x;
            var mask = this.platformMask;
            if (isGoingUp || this.ignoreOneWayPlatformsTime > 0) {
                mask &= ~this.oneWayPlatformMask;
            }
            for (var i = 0; i < this.totalVerticalRays; i++) {
                var rayStart = new es.Vector2(initialRayOriginX + i * this._horizontalDistanceBetweenRays, initialRayOriginY);
                this._raycastHit = es.Physics.linecast(rayStart, rayStart.add(rayDirection.scaleEqual(rayDistance)), mask, this.ignoredColliders);
                if (this._raycastHit.collider) {
                    deltaMovement.y = this._raycastHit.point.y - rayStart.y;
                    rayDistance = Math.abs(deltaMovement.y);
                    if (isGoingUp) {
                        deltaMovement.y += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.above = true;
                    }
                    else {
                        deltaMovement.y -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.below = true;
                    }
                    this._raycastHitsThisFrame.push(this._raycastHit);
                    if (!isGoingUp && deltaMovement.y < -0.00001) {
                        this._isGoingUpSlope = true;
                    }
                    if (rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                            this.kSkinWidthFloatFudgeFactor) {
                        break;
                    }
                }
            }
            return deltaMovement;
        };
        /**
         * 检查 BoxCollider2D 下的中心点是否存在坡度。
         * 如果找到一个，则调整 deltaMovement 以便玩家保持接地，并考虑slopeSpeedModifier 以加快移动速度。
         * @param deltaMovement
         * @returns
         */
        CharacterController.prototype.handleVerticalSlope = function (deltaMovement) {
            var centerOfCollider = (this._raycastOrigins.bottomLeft.x +
                this._raycastOrigins.bottomRight.x) *
                0.5;
            var rayDirection = es.Vector2.down;
            var slopeCheckRayDistance = this._slopeLimitTangent *
                (this._raycastOrigins.bottomRight.x - centerOfCollider);
            var slopeRay = new es.Vector2(centerOfCollider, this._raycastOrigins.bottomLeft.y);
            this._raycastHit = es.Physics.linecast(slopeRay, slopeRay.add(rayDirection.scaleEqual(slopeCheckRayDistance)), this.platformMask, this.ignoredColliders);
            if (this._raycastHit.collider) {
                var angle = es.Vector2.unsignedAngle(this._raycastHit.normal, es.Vector2.up);
                if (angle === 0) {
                    return deltaMovement;
                }
                var isMovingDownSlope = Math.sign(this._raycastHit.normal.x) === Math.sign(deltaMovement.x);
                if (isMovingDownSlope) {
                    var slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(-angle)
                        : 1;
                    deltaMovement.y +=
                        this._raycastHit.point.y - slopeRay.y - this.skinWidth;
                    deltaMovement.x *= slopeModifier;
                    this.collisionState.movingDownSlope = true;
                    this.collisionState.slopeAngle = angle;
                }
            }
            return deltaMovement;
        };
        /**
         * 如果我们要上坡，则处理调整 deltaMovement
         * @param deltaMovement
         * @param angle
         * @returns
         */
        CharacterController.prototype.handleHorizontalSlope = function (deltaMovement, angle) {
            if (Math.round(angle) === 90) {
                return false;
            }
            if (angle < this.slopeLimit) {
                if (deltaMovement.y > this.jumpingThreshold) {
                    var slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(angle)
                        : 1;
                    deltaMovement.x *= slopeModifier;
                    deltaMovement.y = Math.abs(Math.tan(angle * es.MathHelper.Deg2Rad) * deltaMovement.x);
                    var isGoingRight = deltaMovement.x > 0;
                    var ray = isGoingRight
                        ? this._raycastOrigins.bottomRight
                        : this._raycastOrigins.bottomLeft;
                    var raycastHit = null;
                    if (this.supportSlopedOneWayPlatforms &&
                        this.collisionState.wasGroundedLastFrame) {
                        raycastHit = es.Physics.linecast(ray, ray.add(deltaMovement), this.platformMask, this.ignoredColliders);
                    }
                    else {
                        raycastHit = es.Physics.linecast(ray, ray.add(deltaMovement), this.platformMask & ~this.oneWayPlatformMask, this.ignoredColliders);
                    }
                    if (raycastHit.collider) {
                        deltaMovement.x = raycastHit.point.x - ray.x;
                        deltaMovement.y = raycastHit.point.y - ray.y;
                        if (isGoingRight) {
                            deltaMovement.x -= this._skinWidth;
                        }
                        else {
                            deltaMovement.x += this._skinWidth;
                        }
                    }
                    this._isGoingUpSlope = true;
                    this.collisionState.below = true;
                }
            }
            else {
                deltaMovement.x = 0;
            }
            return true;
        };
        return CharacterController;
    }());
    es.CharacterController = CharacterController;
})(es || (es = {}));
var es;
(function (es) {
    var TriggerListenerHelper = /** @class */ (function () {
        function TriggerListenerHelper() {
        }
        TriggerListenerHelper.getITriggerListener = function (entity, components) {
            var e_2, _a;
            try {
                for (var _b = __values(entity.components._components), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var component = _c.value;
                    if (es.isITriggerListener(component)) {
                        components.push(component);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            for (var i in entity.components._componentsToAdd) {
                var component = entity.components._componentsToAdd[i];
                if (es.isITriggerListener(component)) {
                    components.push(component);
                }
            }
            return components;
        };
        return TriggerListenerHelper;
    }());
    es.TriggerListenerHelper = TriggerListenerHelper;
    es.isITriggerListener = function (props) { return typeof props['onTriggerEnter'] !== 'undefined'; };
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 辅助类说明了一种处理移动的方法，它考虑了包括触发器在内的所有冲突。
     * ITriggerListener接口用于管理对移动过程中违反的任何触发器的回调。
     * 一个物体只能通过移动器移动。要正确报告触发器的move方法。
     *
     * 请注意，多个移动者相互交互将多次调用ITriggerListener。
     */
    var Mover = /** @class */ (function (_super) {
        __extends(Mover, _super);
        function Mover() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Mover.prototype.onAddedToEntity = function () {
            this._triggerHelper = new es.ColliderTriggerHelper(this.entity);
        };
        /**
         * 计算修改运动矢量的运动，以考虑移动时可能发生的碰撞
         * @param motion
         * @param collisionResult
         */
        Mover.prototype.calculateMovement = function (motion, collisionResult) {
            var e_3, _a;
            var collider = null;
            for (var i = 0; i < this.entity.components.buffer.length; i++) {
                var component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            if (collider == null || this._triggerHelper == null) {
                return false;
            }
            // 移动所有的非触发碰撞器并获得最近的碰撞
            var colliders = [];
            for (var i = 0; i < this.entity.components.buffer.length; i++) {
                var component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    colliders.push(component);
                }
            }
            for (var i = 0; i < colliders.length; i++) {
                var collider_1 = colliders[i];
                // 不检测触发器 在我们移动后会重新访问它
                if (collider_1.isTrigger)
                    continue;
                // 获取我们在新位置可能发生碰撞的任何东西
                var bounds = collider_1.bounds.clone();
                bounds.x += motion.x;
                bounds.y += motion.y;
                var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider_1, bounds, collider_1.collidesWithLayers.value);
                try {
                    for (var neighbors_2 = __values(neighbors), neighbors_2_1 = neighbors_2.next(); !neighbors_2_1.done; neighbors_2_1 = neighbors_2.next()) {
                        var neighbor = neighbors_2_1.value;
                        // 不检测触发器
                        if (neighbor.isTrigger)
                            return;
                        var _internalcollisionResult = new es.CollisionResult();
                        if (collider_1.collidesWith(neighbor, motion, _internalcollisionResult)) {
                            // 如果碰撞 则退回之前的移动量
                            motion.sub(_internalcollisionResult.minimumTranslationVector);
                            // 如果我们碰到多个对象，为了简单起见，只取第一个。
                            if (_internalcollisionResult.collider != null) {
                                collisionResult.collider = _internalcollisionResult.collider;
                                collisionResult.minimumTranslationVector = _internalcollisionResult.minimumTranslationVector;
                                collisionResult.normal = _internalcollisionResult.normal;
                                collisionResult.point = _internalcollisionResult.point;
                            }
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (neighbors_2_1 && !neighbors_2_1.done && (_a = neighbors_2.return)) _a.call(neighbors_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            es.ListPool.free(es.Collider, colliders);
            return collisionResult.collider != null;
        };
        /**
         *  将calculatemomovement应用到实体并更新triggerHelper
         * @param motion
         */
        Mover.prototype.applyMovement = function (motion) {
            // 移动实体到它的新位置，如果我们有一个碰撞，否则移动全部数量。当碰撞发生时，运动被更新
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            // 对所有是触发器的碰撞器与所有宽相位碰撞器进行重叠检查。任何重叠都会导致触发事件。
            if (this._triggerHelper)
                this._triggerHelper.update();
        };
        /**
         * 通过调用calculateMovement和applyMovement来移动考虑碰撞的实体;
         * @param motion
         * @param collisionResult
         */
        Mover.prototype.move = function (motion, collisionResult) {
            this.calculateMovement(motion, collisionResult);
            this.applyMovement(motion);
            return collisionResult.collider != null;
        };
        return Mover;
    }(es.Component));
    es.Mover = Mover;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 移动时考虑到碰撞，只用于向任何ITriggerListeners报告。
     * 物体总是会全量移动，所以如果需要的话，由调用者在撞击时销毁它。
     */
    var ProjectileMover = /** @class */ (function (_super) {
        __extends(ProjectileMover, _super);
        function ProjectileMover() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._tempTriggerList = [];
            return _this;
        }
        ProjectileMover.prototype.onAddedToEntity = function () {
            var collider = null;
            for (var i = 0; i < this.entity.components.buffer.length; i++) {
                var component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            this._collider = collider;
            es.Debug.warnIf(this._collider == null, "ProjectileMover没有Collider。ProjectilMover需要一个Collider!");
        };
        /**
         * 在考虑到碰撞的情况下移动实体
         * @param motion
         */
        ProjectileMover.prototype.move = function (motion) {
            var e_4, _a;
            if (this._collider == null)
                return false;
            var didCollide = false;
            // 获取我们在新的位置上可能会碰撞到的任何东西
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            // 获取任何可能在新位置发生碰撞的东西
            var neighbors = es.Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers.value);
            try {
                for (var neighbors_3 = __values(neighbors), neighbors_3_1 = neighbors_3.next(); !neighbors_3_1.done; neighbors_3_1 = neighbors_3.next()) {
                    var neighbor = neighbors_3_1.value;
                    if (this._collider.overlaps(neighbor) && neighbor.enabled) {
                        didCollide = true;
                        this.notifyTriggerListeners(this._collider, neighbor);
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (neighbors_3_1 && !neighbors_3_1.done && (_a = neighbors_3.return)) _a.call(neighbors_3);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return didCollide;
        };
        ProjectileMover.prototype.notifyTriggerListeners = function (self, other) {
            // 通知我们重叠的碰撞器实体上的任何侦听器
            es.TriggerListenerHelper.getITriggerListener(other.entity, this._tempTriggerList);
            for (var i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(self, other);
            }
            this._tempTriggerList.length = 0;
            // 通知此实体上的任何侦听器
            es.TriggerListenerHelper.getITriggerListener(this.entity, this._tempTriggerList);
            for (var i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(other, self);
            }
            this._tempTriggerList.length = 0;
        };
        return ProjectileMover;
    }(es.Component));
    es.ProjectileMover = ProjectileMover;
})(es || (es = {}));
var es;
(function (es) {
    var Collider = /** @class */ (function (_super) {
        __extends(Collider, _super);
        function Collider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.castSortOrder = 0;
            /**
             * 如果这个碰撞器是一个触发器，它将不会引起碰撞，但它仍然会触发事件
             */
            _this.isTrigger = false;
            /**
             * 在处理冲突时，physicsLayer可以用作过滤器。Flags类有帮助位掩码的方法
             */
            _this.physicsLayer = new es.Ref(1 << 0);
            /**
             * 碰撞器在使用移动器移动时应该碰撞的层
             * 默认为所有层
             */
            _this.collidesWithLayers = new es.Ref(es.Physics.allLayers);
            /**
             * 如果为true，碰撞器将根据附加的变换缩放和旋转
             */
            _this.shouldColliderScaleAndRotateWithTransform = true;
            /**
             * 这个对撞机在物理系统注册时的边界。
             * 存储这个允许我们始终能够安全地从物理系统中移除对撞机，即使它在试图移除它之前已经被移动了。
             */
            _this.registeredPhysicsBounds = new es.Rectangle();
            _this._isPositionDirty = true;
            _this._isRotationDirty = true;
            _this._localOffset = es.Vector2.zero;
            return _this;
        }
        Object.defineProperty(Collider.prototype, "absolutePosition", {
            /**
             * 镖师碰撞器的绝对位置
             */
            get: function () {
                return es.Vector2.add(this.entity.transform.position, this._localOffset);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Collider.prototype, "rotation", {
            /**
             * 封装变换。如果碰撞器没和实体一起旋转 则返回transform.rotation
             */
            get: function () {
                if (this.shouldColliderScaleAndRotateWithTransform && this.entity != null)
                    return this.entity.transform.rotation;
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Collider.prototype, "bounds", {
            get: function () {
                if (this._isPositionDirty || this._isRotationDirty) {
                    this.shape.recalculateBounds(this);
                    this._isPositionDirty = this._isRotationDirty = false;
                }
                return this.shape.bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Collider.prototype, "localOffset", {
            /**
             * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
             * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
             */
            get: function () {
                return this._localOffset;
            },
            /**
             * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
             * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
             * @param value
             */
            set: function (value) {
                this.setLocalOffset(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将localOffset添加到实体。获取碰撞器的最终位置。
         * 这允许您向一个实体添加多个碰撞器并分别定位它们。
         * @param offset
         */
        Collider.prototype.setLocalOffset = function (offset) {
            if (!this._localOffset.equals(offset)) {
                this.unregisterColliderWithPhysicsSystem();
                this._localOffset.setTo(offset.x, offset.y);
                this._localOffsetLength = this._localOffset.magnitude();
                this._isPositionDirty = true;
                this.registerColliderWithPhysicsSystem();
            }
            return this;
        };
        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         * @param shouldColliderScaleAndRotationWithTransform
         */
        Collider.prototype.setShouldColliderScaleAndRotateWithTransform = function (shouldColliderScaleAndRotationWithTransform) {
            this.shouldColliderScaleAndRotateWithTransform = shouldColliderScaleAndRotationWithTransform;
            this._isPositionDirty = this._isRotationDirty = true;
            return this;
        };
        Collider.prototype.onAddedToEntity = function () {
            if (this._colliderRequiresAutoSizing) {
                var renderable = null;
                for (var i = 0; i < this.entity.components.buffer.length; i++) {
                    var component = this.entity.components.buffer[i];
                    if (component instanceof es.RenderableComponent) {
                        renderable = component;
                        break;
                    }
                }
                if (renderable != null) {
                    var renderableBounds = renderable.bounds.clone();
                    var width = renderableBounds.width / this.entity.transform.scale.x;
                    var height = renderableBounds.height / this.entity.transform.scale.y;
                    if (this instanceof es.CircleCollider) {
                        this.radius = Math.max(width, height) * 0.5;
                        this.localOffset = renderableBounds.center.sub(this.entity.transform.position);
                    }
                    else if (this instanceof es.BoxCollider) {
                        this.width = width;
                        this.height = height;
                        this.localOffset = renderableBounds.center.sub(this.entity.transform.position);
                    }
                }
            }
            this._isParentEntityAddedToScene = true;
            this.registerColliderWithPhysicsSystem();
        };
        Collider.prototype.onRemovedFromEntity = function () {
            this.unregisterColliderWithPhysicsSystem();
            this._isParentEntityAddedToScene = false;
        };
        Collider.prototype.onEntityTransformChanged = function (comp) {
            switch (comp) {
                case es.ComponentTransform.position:
                    this._isPositionDirty = true;
                    break;
                case es.ComponentTransform.scale:
                    this._isPositionDirty = true;
                    break;
                case es.ComponentTransform.rotation:
                    this._isRotationDirty = true;
                    break;
            }
            if (this._isColliderRegistered)
                es.Physics.updateCollider(this);
        };
        Collider.prototype.onEnabled = function () {
            this.registerColliderWithPhysicsSystem();
            this._isPositionDirty = this._isRotationDirty = true;
        };
        Collider.prototype.onDisabled = function () {
            this.unregisterColliderWithPhysicsSystem();
        };
        /**
         * 父实体会在不同的时间调用它(当添加到场景，启用，等等)
         */
        Collider.prototype.registerColliderWithPhysicsSystem = function () {
            // 如果在将我们添加到实体之前更改了origin等属性，则实体可以为null
            if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
                es.Physics.addCollider(this);
                this._isColliderRegistered = true;
            }
        };
        /**
         * 父实体会在不同的时候调用它(从场景中移除，禁用，等等)
         */
        Collider.prototype.unregisterColliderWithPhysicsSystem = function () {
            if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
                es.Physics.removeCollider(this);
            }
            this._isColliderRegistered = false;
        };
        /**
         * 检查这个形状是否与物理系统中的其他对撞机重叠
         * @param other
         */
        Collider.prototype.overlaps = function (other) {
            return this.shape.overlaps(other.shape);
        };
        /**
         * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
         * @param collider
         * @param motion
         * @param result
         */
        Collider.prototype.collidesWith = function (collider, motion, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            // 改变形状的位置，使它在移动后的位置，这样我们可以检查重叠
            var oldPosition = this.entity.position;
            this.entity.position = this.entity.position.add(motion);
            var didCollide = this.shape.collidesWithShape(collider.shape, result);
            if (didCollide)
                result.collider = collider;
            // 将图形位置返回到检查前的位置
            this.entity.position = oldPosition;
            return didCollide;
        };
        /**
         * 检查这个对撞机是否与对撞机发生碰撞。如果碰撞，则返回true，结果将被填充
         * @param collider
         * @param result
         */
        Collider.prototype.collidesWithNonMotion = function (collider, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            if (this.shape.collidesWithShape(collider.shape, result)) {
                result.collider = collider;
                return true;
            }
            result.collider = null;
            return false;
        };
        /**
         * 检查此碰撞器是否已应用运动（增量运动矢量）与任何碰撞器发生碰撞。
         * 如果是这样，则将返回true，并且将使用碰撞数据填充结果。 运动将设置为碰撞器在碰撞之前可以行进的最大距离。
         * @param motion
         * @param result
         */
        Collider.prototype.collidesWithAny = function (motion, result) {
            var e_5, _a;
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            var colliderBounds = this.bounds.clone();
            colliderBounds.x += motion.x;
            colliderBounds.y += motion.y;
            var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(this, colliderBounds, this.collidesWithLayers.value);
            // 更改形状位置，使其处于移动后的位置，以便我们检查是否有重叠 
            var oldPosition = this.shape.position.clone();
            this.shape.position = es.Vector2.add(this.shape.position, motion);
            var didCollide = false;
            try {
                for (var neighbors_4 = __values(neighbors), neighbors_4_1 = neighbors_4.next(); !neighbors_4_1.done; neighbors_4_1 = neighbors_4.next()) {
                    var neighbor = neighbors_4_1.value;
                    if (neighbor.isTrigger)
                        continue;
                    if (this.collidesWithNonMotion(neighbor, result)) {
                        motion = motion.sub(result.minimumTranslationVector);
                        this.shape.position = this.shape.position.sub(result.minimumTranslationVector);
                        didCollide = true;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (neighbors_4_1 && !neighbors_4_1.done && (_a = neighbors_4.return)) _a.call(neighbors_4);
                }
                finally { if (e_5) throw e_5.error; }
            }
            // 将形状位置返回到检查之前的位置 
            this.shape.position = oldPosition.clone();
            return didCollide;
        };
        /**
         * 检查此碰撞器是否与场景中的其他碰撞器碰撞。它相交的第一个碰撞器将在碰撞结果中返回碰撞数据。
         * @param result
         */
        Collider.prototype.collidesWithAnyNonMotion = function (result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            var e_6, _a;
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            var neighbors = es.Physics.boxcastBroadphaseExcludingSelfNonRect(this, this.collidesWithLayers.value);
            try {
                for (var neighbors_5 = __values(neighbors), neighbors_5_1 = neighbors_5.next(); !neighbors_5_1.done; neighbors_5_1 = neighbors_5.next()) {
                    var neighbor = neighbors_5_1.value;
                    if (neighbor.isTrigger)
                        continue;
                    if (this.collidesWithNonMotion(neighbor, result))
                        return true;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (neighbors_5_1 && !neighbors_5_1.done && (_a = neighbors_5.return)) _a.call(neighbors_5);
                }
                finally { if (e_6) throw e_6.error; }
            }
            return false;
        };
        Collider.lateSortOrder = 999;
        return Collider;
    }(es.Component));
    es.Collider = Collider;
})(es || (es = {}));
///<reference path="./Collider.ts" />
var es;
///<reference path="./Collider.ts" />
(function (es) {
    var BoxCollider = /** @class */ (function (_super) {
        __extends(BoxCollider, _super);
        /**
         * 创建一个BoxCollider，并使用x/y组件作为局部Offset
         * @param x
         * @param y
         * @param width
         * @param height
         */
        function BoxCollider(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 1; }
            if (height === void 0) { height = 1; }
            var _this = _super.call(this) || this;
            if (width == 1 && height == 1) {
                _this._colliderRequiresAutoSizing = true;
            }
            else {
                _this._localOffset = new es.Vector2(x + width / 2, y + height / 2);
            }
            _this.shape = new es.Box(width, height);
            return _this;
        }
        Object.defineProperty(BoxCollider.prototype, "width", {
            get: function () {
                return this.shape.width;
            },
            set: function (value) {
                this.setWidth(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoxCollider.prototype, "height", {
            get: function () {
                return this.shape.height;
            },
            set: function (value) {
                this.setHeight(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置BoxCollider的大小
         * @param width
         * @param height
         */
        BoxCollider.prototype.setSize = function (width, height) {
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (width != box.width || height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, height);
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        /**
         * 设置BoxCollider的宽度
         * @param width
         */
        BoxCollider.prototype.setWidth = function (width) {
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (width != box.width) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, box.height);
                this._isPositionDirty = true;
                if (this.entity != null && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        /**
         * 设置BoxCollider的高度
         * @param height
         */
        BoxCollider.prototype.setHeight = function (height) {
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(box.width, height);
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
        };
        BoxCollider.prototype.debugRender = function (batcher) {
            var poly = this.shape;
            batcher.drawHollowRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, new es.Color(76, 76, 76, 76), 2);
            batcher.end();
            batcher.drawPolygon(this.shape.position, poly.points, new es.Color(139, 0, 0, 255), true, 2);
            batcher.end();
            batcher.drawPixel(this.entity.position, new es.Color(255, 255, 0), 4);
            batcher.end();
            batcher.drawPixel(es.Vector2.add(this.transform.position, this.shape.center), new es.Color(255, 0, 0), 2);
            batcher.end();
        };
        BoxCollider.prototype.toString = function () {
            return "[BoxCollider: bounds: " + this.bounds + "]";
        };
        return BoxCollider;
    }(es.Collider));
    es.BoxCollider = BoxCollider;
})(es || (es = {}));
var es;
(function (es) {
    var CircleCollider = /** @class */ (function (_super) {
        __extends(CircleCollider, _super);
        /**
         * 创建一个具有半径的CircleCollider。
         * 请注意，当指定半径时，如果在实体上使用RenderableComponent，您将需要设置原点来对齐CircleCollider。
         * 例如，如果RenderableComponent有一个0,0的原点，并且创建了一个半径为1.5f * renderable.width的CircleCollider，你可以通过设置originNormalied为中心除以缩放尺寸来偏移原点
         *
         * @param radius
         */
        function CircleCollider(radius) {
            if (radius === void 0) { radius = 1; }
            var _this = _super.call(this) || this;
            _this.shape = new es.Circle(radius);
            if (radius == 1) {
                _this._colliderRequiresAutoSizing = true;
            }
            return _this;
        }
        Object.defineProperty(CircleCollider.prototype, "radius", {
            get: function () {
                return this.shape.radius;
            },
            set: function (value) {
                this.setRadius(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置圆的半径
         * @param radius
         */
        CircleCollider.prototype.setRadius = function (radius) {
            this._colliderRequiresAutoSizing = false;
            var circle = this.shape;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;
                this._isPositionDirty = true;
                if (this.entity != null && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        CircleCollider.prototype.debugRender = function (batcher) {
            batcher.drawHollowRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, new es.Color(76, 76, 76, 76), 2);
            batcher.end();
            batcher.drawCircle(this.shape.position, this.radius, new es.Color(139, 0, 0), 2);
            batcher.end();
            batcher.drawPixel(this.entity.transform.position, new es.Color(255, 255, 0), 4);
            batcher.end();
            batcher.drawPixel(this.shape.position, new es.Color(255, 0, 0), 2);
            batcher.end();
        };
        CircleCollider.prototype.toString = function () {
            return "[CircleCollider: bounds: " + this.bounds + ", radius: " + this.shape.radius + "]";
        };
        return CircleCollider;
    }(es.Collider));
    es.CircleCollider = CircleCollider;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 多边形应该以顺时针方式定义
     */
    var PolygonCollider = /** @class */ (function (_super) {
        __extends(PolygonCollider, _super);
        /**
         * 如果这些点没有居中，它们将以localOffset的差异为居中。
         * @param points
         */
        function PolygonCollider(points) {
            var _this = _super.call(this) || this;
            // 第一点和最后一点决不能相同。我们想要一个开放的多边形
            var isPolygonClosed = points[0] == points[points.length - 1];
            // 最后一个移除
            if (isPolygonClosed)
                points = points.slice(0, points.length - 1);
            var center = es.Polygon.findPolygonCenter(points);
            _this.setLocalOffset(center);
            es.Polygon.recenterPolygonVerts(points);
            _this.shape = new es.Polygon(points);
            return _this;
        }
        return PolygonCollider;
    }(es.Collider));
    es.PolygonCollider = PolygonCollider;
})(es || (es = {}));
var es;
(function (es) {
    var RenderableComponent = /** @class */ (function (_super) {
        __extends(RenderableComponent, _super);
        function RenderableComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._bounds = new es.Rectangle();
            _this._areBoundsDirty = true;
            _this.color = es.Color.White;
            _this._renderLayer = 0;
            _this.debugRenderEnabled = true;
            _this._isVisible = false;
            _this._localOffset = new es.Vector2();
            return _this;
        }
        RenderableComponent.prototype.getwidth = function () {
            return this.bounds.width;
        };
        RenderableComponent.prototype.getheight = function () {
            return this.bounds.height;
        };
        RenderableComponent.prototype.getbounds = function () {
            if (this._areBoundsDirty) {
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, new es.Vector2(this.getwidth() / 2, this.getheight() / 2), this.entity.transform.scale, this.entity.transform.rotation, this.getwidth(), this.getheight());
                this._areBoundsDirty = false;
            }
            return this._bounds;
        };
        Object.defineProperty(RenderableComponent.prototype, "bounds", {
            get: function () {
                return this.getbounds();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderableComponent.prototype, "renderLayer", {
            get: function () {
                return this._renderLayer;
            },
            set: function (value) {
                this.setRenderLayer(value);
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponent.prototype.onEntityTransformChanged = function (comp) {
            this._areBoundsDirty = true;
        };
        Object.defineProperty(RenderableComponent.prototype, "localOffset", {
            get: function () {
                return this._localOffset;
            },
            set: function (value) {
                this.setLocalOffset(value);
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponent.prototype.setLocalOffset = function (offset) {
            if (!this._localOffset.equals(offset)) {
                this._localOffset = offset;
                this._areBoundsDirty = true;
            }
            return this;
        };
        Object.defineProperty(RenderableComponent.prototype, "isVisible", {
            get: function () {
                return this._isVisible;
            },
            set: function (value) {
                if (this._isVisible != value) {
                    this._isVisible = value;
                    if (this._isVisible) {
                        this.onBecameVisible();
                    }
                    else {
                        this.onBecameInvisible();
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponent.prototype.onBecameVisible = function () {
        };
        RenderableComponent.prototype.onBecameInvisible = function () {
        };
        RenderableComponent.prototype.setRenderLayer = function (renderLayer) {
            if (renderLayer != this._renderLayer) {
                var oldRenderLayer = this._renderLayer;
                this._renderLayer = renderLayer;
                if (this.entity != null && this.entity.scene != null)
                    es.Core.scene.renderableComponents.updateRenderableRenderLayer(this, oldRenderLayer, this._renderLayer);
            }
            return this;
        };
        RenderableComponent.prototype.isVisibleFromCamera = function (cam) {
            this.isVisible = cam.bounds.intersects(this.bounds);
            return this.isVisible;
        };
        RenderableComponent.prototype.debugRender = function (batcher) {
            if (!this.debugRenderEnabled)
                return;
            var collider = null;
            for (var i = 0; i < this.entity.components.buffer.length; i++) {
                var component = this.entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    collider = component;
                    break;
                }
            }
            if (collider == null) {
                batcher.drawHollowRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, new es.Color(255, 255, 0));
                batcher.end();
            }
            batcher.drawPixel(es.Vector2.add(this.entity.transform.position, this._localOffset), new es.Color(153, 50, 204), 4);
            batcher.end();
        };
        RenderableComponent.prototype.tweenColorTo = function (to, duration) {
            var tween = es.Pool.obtain(es.RenderableColorTween);
            tween.setTarget(this);
            tween.initialize(tween, to, duration);
            return tween;
        };
        return RenderableComponent;
    }(es.Component));
    es.RenderableComponent = RenderableComponent;
})(es || (es = {}));
var es;
(function (es) {
    function decode(key) {
        switch (typeof key) {
            case "boolean":
                return "" + key;
            case "number":
                return "" + key;
            case "string":
                return "" + key;
            case "function":
                return es.getClassName(key);
            default:
                key.uuid = key.uuid ? key.uuid : es.UUID.randomUUID();
                return key.uuid;
        }
    }
    var HashMap = /** @class */ (function () {
        function HashMap() {
            this.clear();
        }
        HashMap.prototype.clear = function () {
            this.map_ = {};
            this.keys_ = {};
        };
        HashMap.prototype.values = function () {
            var result = [];
            var map = this.map_;
            for (var key in map) {
                result.push(map[key]);
            }
            return result;
        };
        HashMap.prototype.contains = function (value) {
            var map = this.map_;
            for (var key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        };
        HashMap.prototype.containsKey = function (key) {
            return decode(key) in this.map_;
        };
        HashMap.prototype.containsValue = function (value) {
            var map = this.map_;
            for (var key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        };
        HashMap.prototype.get = function (key) {
            return this.map_[decode(key)];
        };
        HashMap.prototype.isEmpty = function () {
            return Object.keys(this.map_).length === 0;
        };
        HashMap.prototype.keys = function () {
            var keys = this.map_;
            var result = [];
            for (var key in keys) {
                result.push(keys[key]);
            }
            return result;
        };
        /**
         * if key is a string, use as is, else use key.id_ or key.name
         */
        HashMap.prototype.put = function (key, value) {
            var k = decode(key);
            this.map_[k] = value;
            this.keys_[k] = key;
        };
        HashMap.prototype.remove = function (key) {
            var map = this.map_;
            var k = decode(key);
            var value = map[k];
            delete map[k];
            delete this.keys_[k];
            return value;
        };
        HashMap.prototype.size = function () {
            return Object.keys(this.map_).length;
        };
        return HashMap;
    }());
    es.HashMap = HashMap;
})(es || (es = {}));
///<reference path="../../Utils/Collections/HashMap.ts"/>
var es;
///<reference path="../../Utils/Collections/HashMap.ts"/>
(function (es) {
    /**
     * 追踪实体的子集，但不实现任何排序或迭代。
     */
    var EntitySystem = /** @class */ (function () {
        function EntitySystem(matcher) {
            this._entities = [];
            this._updateOrder = 0;
            this._startTime = 0;
            this._endTime = 0;
            this._useTime = 0;
            this._matcher = matcher ? matcher : es.Matcher.empty();
            this.initialize();
        }
        Object.defineProperty(EntitySystem.prototype, "useTime", {
            /** 获取系统在当前帧所消耗的时间 仅在debug模式下生效 */
            get: function () {
                return this._useTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EntitySystem.prototype, "updateOrder", {
            /**
             * 获取系统的更新时序
             */
            get: function () {
                return this._updateOrder;
            },
            set: function (value) {
                this.setUpdateOrder(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EntitySystem.prototype, "scene", {
            /**
             * 这个系统所属的场景
             */
            get: function () {
                return this._scene;
            },
            set: function (value) {
                this._scene = value;
                this._entities = [];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EntitySystem.prototype, "matcher", {
            get: function () {
                return this._matcher;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置更新时序
         * @param order
         */
        EntitySystem.prototype.setUpdateOrder = function (order) {
            this._updateOrder = order;
            this.scene.entityProcessors.setDirty();
        };
        EntitySystem.prototype.initialize = function () {
        };
        EntitySystem.prototype.onChanged = function (entity) {
            var contains = !!this._entities.find(function (e) { return e.id == entity.id; });
            var interest = this._matcher.isInterestedEntity(entity);
            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        };
        EntitySystem.prototype.add = function (entity) {
            if (!this._entities.find(function (e) { return e.id == entity.id; }))
                this._entities.push(entity);
            this.onAdded(entity);
        };
        EntitySystem.prototype.onAdded = function (entity) { };
        EntitySystem.prototype.remove = function (entity) {
            new es.List(this._entities).remove(entity);
            this.onRemoved(entity);
        };
        EntitySystem.prototype.onRemoved = function (entity) { };
        EntitySystem.prototype.update = function () {
            if (this.checkProcessing()) {
                this.begin();
                this.process(this._entities);
            }
        };
        EntitySystem.prototype.lateUpdate = function () {
            if (this.checkProcessing()) {
                this.lateProcess(this._entities);
                this.end();
            }
        };
        /**
         * 在系统处理开始前调用
         * 在下一个系统开始处理或新的处理回合开始之前（以先到者为准），使用此方法创建的任何实体都不会激活
         */
        EntitySystem.prototype.begin = function () {
            if (!es.Core.Instance.debug)
                return;
            this._startTime = Date.now();
        };
        EntitySystem.prototype.process = function (entities) { };
        EntitySystem.prototype.lateProcess = function (entities) { };
        /**
         * 系统处理完毕后调用
         */
        EntitySystem.prototype.end = function () {
            if (!es.Core.Instance.debug)
                return;
            this._endTime = Date.now();
            this._useTime = this._endTime - this._startTime;
        };
        /**
         * 系统是否需要处理
         *
         * 在启用系统时有用，但仅偶尔需要处理
         * 这只影响处理，不影响事件或订阅列表
         * @returns 如果系统应该处理，则为true，如果不处理则为false。
         */
        EntitySystem.prototype.checkProcessing = function () {
            return true;
        };
        return EntitySystem;
    }());
    es.EntitySystem = EntitySystem;
})(es || (es = {}));
///<reference path="./EntitySystem.ts"/>
var es;
///<reference path="./EntitySystem.ts"/>
(function (es) {
    /**
     * 追踪每个实体的冷却时间，当实体的计时器耗尽时进行处理
     *
     * 一个示例系统将是ExpirationSystem，该系统将在特定生存期后删除实体。
     * 你不必运行会为每个实体递减timeLeft值的系统
     * 而只需使用此系统在寿命最短的实体时在将来执行
     * 然后重置系统在未来的某一个最短命实体的时间运行
     *
     * 另一个例子是一个动画系统
     * 你知道什么时候你必须对某个实体进行动画制作，比如300毫秒内。
     * 所以你可以设置系统以300毫秒为单位运行来执行动画
     *
     * 这将在某些情况下节省CPU周期
     */
    var DelayedIteratingSystem = /** @class */ (function (_super) {
        __extends(DelayedIteratingSystem, _super);
        function DelayedIteratingSystem(matcher) {
            var _this = _super.call(this, matcher) || this;
            /**
             * 一个实体应被处理的时间
             */
            _this.delay = 0;
            /**
             * 如果系统正在运行，并倒计时延迟
             */
            _this.running = false;
            /**
             * 倒计时
             */
            _this.acc = 0;
            return _this;
        }
        DelayedIteratingSystem.prototype.process = function (entities) {
            var processed = entities.length;
            if (processed == 0) {
                this.stop();
                return;
            }
            this.delay = Number.MAX_VALUE;
            for (var i = 0; processed > i; i++) {
                var e = entities[i];
                this.processDelta(e, this.acc);
                var remaining = this.getRemainingDelay(e);
                if (remaining <= 0) {
                    this.processExpired(e);
                }
                else {
                    this.offerDelay(remaining);
                }
            }
            this.acc = 0;
        };
        DelayedIteratingSystem.prototype.checkProcessing = function () {
            if (this.running) {
                this.acc += es.Time.deltaTime;
                return this.acc >= this.delay;
            }
            return false;
        };
        /**
         * 只有当提供的延迟比系统当前计划执行的时间短时，才会重新启动系统。
         * 如果系统已经停止（不运行），那么提供的延迟将被用来重新启动系统，无论其值如何
         * 如果系统已经在倒计时，并且提供的延迟大于剩余时间，系统将忽略它。
         * 如果提供的延迟时间短于剩余时间，系统将重新启动，以提供的延迟时间运行。
         * @param offeredDelay
         */
        DelayedIteratingSystem.prototype.offerDelay = function (offeredDelay) {
            if (!this.running) {
                this.running = true;
                this.delay = offeredDelay;
            }
            else {
                this.delay = Math.min(this.delay, offeredDelay);
            }
        };
        /**
         * 获取系统被命令处理实体后的初始延迟
         */
        DelayedIteratingSystem.prototype.getInitialTimeDelay = function () {
            return this.delay;
        };
        /**
         * 获取系统计划运行前的时间
         * 如果系统没有运行，则返回零
         */
        DelayedIteratingSystem.prototype.getRemainingTimeUntilProcessing = function () {
            if (this.running) {
                return this.delay - this.acc;
            }
            return 0;
        };
        /**
         * 检查系统是否正在倒计时处理
         */
        DelayedIteratingSystem.prototype.isRunning = function () {
            return this.running;
        };
        /**
         * 停止系统运行，中止当前倒计时
         */
        DelayedIteratingSystem.prototype.stop = function () {
            this.running = false;
            this.acc = 0;
        };
        return DelayedIteratingSystem;
    }(es.EntitySystem));
    es.DelayedIteratingSystem = DelayedIteratingSystem;
})(es || (es = {}));
///<reference path="./EntitySystem.ts" />
var es;
///<reference path="./EntitySystem.ts" />
(function (es) {
    /**
     * 基本实体处理系统。将其用作处理具有特定组件的许多实体的基础
     *
     * 按实体引用遍历实体订阅成员实体的系统
     * 当你需要处理与Matcher相匹配的实体，并且你更喜欢使用Entity的时候，可以使用这个功能。
     */
    var EntityProcessingSystem = /** @class */ (function (_super) {
        __extends(EntityProcessingSystem, _super);
        function EntityProcessingSystem(matcher) {
            return _super.call(this, matcher) || this;
        }
        EntityProcessingSystem.prototype.lateProcessEntity = function (entity) {
        };
        /**
         * 遍历这个系统的所有实体并逐个处理它们
         * @param entities
         */
        EntityProcessingSystem.prototype.process = function (entities) {
            if (entities.length == 0)
                return;
            for (var i = 0, s = entities.length; i < s; ++i) {
                var entity = entities[i];
                this.processEntity(entity);
            }
        };
        EntityProcessingSystem.prototype.lateProcess = function (entities) {
            if (entities.length == 0)
                return;
            for (var i = 0, s = entities.length; i < s; ++i) {
                var entity = entities[i];
                this.lateProcessEntity(entity);
            }
        };
        return EntityProcessingSystem;
    }(es.EntitySystem));
    es.EntityProcessingSystem = EntityProcessingSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 实体系统以一定的时间间隔进行处理
     */
    var IntervalSystem = /** @class */ (function (_super) {
        __extends(IntervalSystem, _super);
        function IntervalSystem(matcher, interval) {
            var _this = _super.call(this, matcher) || this;
            /**
             * 累积增量以跟踪间隔
             */
            _this.acc = 0;
            /**
             * 更新之间需要等待多长时间
             */
            _this.interval = 0;
            _this.intervalDelta = 0;
            _this.interval = interval;
            return _this;
        }
        IntervalSystem.prototype.checkProcessing = function () {
            this.acc += es.Time.deltaTime;
            if (this.acc >= this.interval) {
                this.acc -= this.interval;
                this.intervalDelta = (this.acc - this.intervalDelta);
                return true;
            }
            return false;
        };
        /**
         * 获取本系统上次处理后的实际delta值
         */
        IntervalSystem.prototype.getIntervalDelta = function () {
            return this.interval + this.intervalDelta;
        };
        return IntervalSystem;
    }(es.EntitySystem));
    es.IntervalSystem = IntervalSystem;
})(es || (es = {}));
///<reference path="./IntervalSystem.ts"/>
var es;
///<reference path="./IntervalSystem.ts"/>
(function (es) {
    /**
     * 每x个ticks处理一个实体的子集
     *
     * 典型的用法是每隔一定的时间间隔重新生成弹药或生命值
     * 而无需在每个游戏循环中都进行
     * 而是每100毫秒一次或每秒
     */
    var IntervalIteratingSystem = /** @class */ (function (_super) {
        __extends(IntervalIteratingSystem, _super);
        function IntervalIteratingSystem(matcher, interval) {
            return _super.call(this, matcher, interval) || this;
        }
        IntervalIteratingSystem.prototype.process = function (entities) {
            var _this = this;
            entities.forEach(function (entity) { return _this.processEntity(entity); });
        };
        return IntervalIteratingSystem;
    }(es.IntervalSystem));
    es.IntervalIteratingSystem = IntervalIteratingSystem;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * JobSystem使用实体的子集调用Execute（entities），并在指定数量的线程上分配工作负载。
     */
    var JobSystem = /** @class */ (function (_super) {
        __extends(JobSystem, _super);
        function JobSystem(matcher, threads) {
            var _this = _super.call(this, matcher) || this;
            _this._threads = threads;
            _this._jobs = new Array(threads);
            for (var i = 0; i < _this._jobs.length; i++) {
                _this._jobs[i] = new Job();
            }
            _this._executeStr = JSON.stringify(_this.execute, function (key, val) {
                if (typeof val === 'function') {
                    return val + '';
                }
                return val;
            });
            return _this;
        }
        JobSystem.prototype.process = function (entities) {
            var _this = this;
            var remainder = entities.length & this._threads;
            var slice = entities.length / this._threads + (remainder == 0 ? 0 : 1);
            var _loop_1 = function (t) {
                var from = t * slice;
                var to = from + slice;
                if (to > entities.length) {
                    to = entities.length;
                }
                var job = this_1._jobs[t];
                job.set(entities, from, to, this_1._executeStr, this_1);
                if (from != to) {
                    var worker_1 = es.WorkerUtils.makeWorker(this_1.queueOnThread);
                    var workerDo = es.WorkerUtils.workerMessage(worker_1);
                    workerDo(job).then(function (message) {
                        var job = message;
                        _this.resetJob(job);
                        worker_1.terminate();
                    }).catch(function (err) {
                        job.err = err;
                        worker_1.terminate();
                    });
                }
            };
            var this_1 = this;
            for (var t = 0; t < this._threads; t++) {
                _loop_1(t);
            }
        };
        JobSystem.prototype.queueOnThread = function () {
            onmessage = function (_a) {
                var _b = _a.data, jobId = _b.jobId, message = _b.message;
                var job = message[0];
                var executeFunc = JSON.parse(job.execute, function (k, v) {
                    if (v.indexOf && v.indexOf('function') > -1) {
                        return eval("(function(){return " + v + " })()");
                    }
                    return v;
                });
                for (var i = job.from; i < job.to; i++) {
                    executeFunc.call(job.context, job.entities[i]);
                }
                postMessage({ jobId: jobId, result: message }, null);
            };
        };
        return JobSystem;
    }(es.EntitySystem));
    es.JobSystem = JobSystem;
    var Job = /** @class */ (function () {
        function Job() {
        }
        Job.prototype.set = function (entities, from, to, execute, context) {
            this.entities = entities;
            this.from = from;
            this.to = to;
            this.execute = execute;
            this.context = context;
        };
        return Job;
    }());
})(es || (es = {}));
var es;
(function (es) {
    var PassiveSystem = /** @class */ (function (_super) {
        __extends(PassiveSystem, _super);
        function PassiveSystem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PassiveSystem.prototype.onChanged = function (entity) {
        };
        PassiveSystem.prototype.process = function (entities) {
            // 我们用我们自己的不考虑实体的基本实体系统来代替
            this.begin();
            this.end();
        };
        return PassiveSystem;
    }(es.EntitySystem));
    es.PassiveSystem = PassiveSystem;
})(es || (es = {}));
/** 用于协调其他系统的通用系统基类 */
var es;
/** 用于协调其他系统的通用系统基类 */
(function (es) {
    var ProcessingSystem = /** @class */ (function (_super) {
        __extends(ProcessingSystem, _super);
        function ProcessingSystem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ProcessingSystem.prototype.onChanged = function (entity) {
        };
        ProcessingSystem.prototype.process = function (entities) {
            this.begin();
            this.processSystem();
            this.end();
        };
        return ProcessingSystem;
    }(es.EntitySystem));
    es.ProcessingSystem = ProcessingSystem;
})(es || (es = {}));
var es;
(function (es) {
    var Bits = /** @class */ (function () {
        function Bits() {
            this._bit = {};
        }
        Bits.prototype.set = function (index, value) {
            this._bit[index] = value;
        };
        Bits.prototype.get = function (index) {
            var v = this._bit[index];
            return v == null ? 0 : v;
        };
        return Bits;
    }());
    es.Bits = Bits;
})(es || (es = {}));
///<reference path="../Components/IUpdatable.ts" />
var es;
///<reference path="../Components/IUpdatable.ts" />
(function (es) {
    var ComponentList = /** @class */ (function () {
        function ComponentList(entity) {
            /**
             * 添加到实体的组件列表
             */
            this._components = [];
            /**
             * 所有需要更新的组件列表
             */
            this._updatableComponents = [];
            /**
             * 添加到此框架的组件列表。用来对组件进行分组，这样我们就可以同时进行加工
             */
            this._componentsToAdd = {};
            /**
             * 标记要删除此框架的组件列表。用来对组件进行分组，这样我们就可以同时进行加工
             */
            this._componentsToRemove = {};
            this._componentsToAddList = [];
            this._componentsToRemoveList = [];
            this._tempBufferList = [];
            this.componentsByType = new Map();
            this.componentsToAddByType = new Map();
            this._entity = entity;
        }
        Object.defineProperty(ComponentList.prototype, "count", {
            get: function () {
                return this._components.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ComponentList.prototype, "buffer", {
            get: function () {
                return this._components;
            },
            enumerable: true,
            configurable: true
        });
        ComponentList.prototype.markEntityListUnsorted = function () {
            this._isComponentListUnsorted = true;
        };
        ComponentList.prototype.add = function (component) {
            this._componentsToAdd[component.id] = component;
            this._componentsToAddList.push(component);
            this.addComponentsToAddByType(component);
        };
        ComponentList.prototype.remove = function (component) {
            if (this._componentsToAdd[component.id]) {
                var index = this._componentsToAddList.findIndex(function (c) { return c.id == component.id; });
                if (index != -1)
                    this._componentsToAddList.splice(index, 1);
                delete this._componentsToAdd[component.id];
                this.removeComponentsToAddByType(component);
                return;
            }
            this._componentsToRemove[component.id] = component;
            this._componentsToRemoveList.push(component);
        };
        /**
         * 立即从组件列表中删除所有组件
         */
        ComponentList.prototype.removeAllComponents = function () {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; ++i) {
                    this.handleRemove(this._components[i]);
                }
            }
            this.componentsByType.clear();
            this.componentsToAddByType.clear();
            this._components.length = 0;
            this._updatableComponents.length = 0;
            this._componentsToAdd = {};
            this._componentsToRemove = {};
            this._componentsToAddList.length = 0;
            this._componentsToRemoveList.length = 0;
        };
        ComponentList.prototype.deregisterAllComponents = function () {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; ++i) {
                    var component = this._components[i];
                    if (!component)
                        continue;
                    if (component instanceof es.RenderableComponent)
                        this._entity.scene.renderableComponents.remove(component);
                    // 处理IUpdatable
                    if (es.isIUpdatable(component))
                        new es.List(this._updatableComponents).remove(component);
                    this.decreaseBits(component);
                    this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
                }
            }
        };
        ComponentList.prototype.registerAllComponents = function () {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; ++i) {
                    var component = this._components[i];
                    if (component instanceof es.RenderableComponent)
                        this._entity.scene.renderableComponents.add(component);
                    if (es.isIUpdatable(component))
                        this._updatableComponents.push(component);
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                }
            }
        };
        ComponentList.prototype.decreaseBits = function (component) {
            var bits = this._entity.componentBits;
            var typeIndex = es.ComponentTypeManager.getIndexFor(es.TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) - 1);
        };
        ComponentList.prototype.addBits = function (component) {
            var bits = this._entity.componentBits;
            var typeIndex = es.ComponentTypeManager.getIndexFor(es.TypeUtils.getType(component));
            bits.set(typeIndex, bits.get(typeIndex) + 1);
        };
        /**
         * 处理任何需要删除或添加的组件
         */
        ComponentList.prototype.updateLists = function () {
            if (this._componentsToRemoveList.length > 0) {
                var _loop_2 = function (i, l) {
                    var component = this_2._componentsToRemoveList[i];
                    this_2.handleRemove(component);
                    var index = this_2._components.findIndex(function (c) { return c.id == component.id; });
                    if (index != -1)
                        this_2._components.splice(index, 1);
                    this_2.removeComponentsByType(component);
                };
                var this_2 = this;
                for (var i = 0, l = this._componentsToRemoveList.length; i < l; ++i) {
                    _loop_2(i, l);
                }
                this._componentsToRemove = {};
                this._componentsToRemoveList.length = 0;
            }
            if (this._componentsToAddList.length > 0) {
                for (var i = 0, l = this._componentsToAddList.length; i < l; ++i) {
                    var component = this._componentsToAddList[i];
                    if (component instanceof es.RenderableComponent)
                        this._entity.scene.renderableComponents.add(component);
                    if (es.isIUpdatable(component))
                        this._updatableComponents.push(component);
                    this.addBits(component);
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                    this.addComponentsByType(component);
                    this._components.push(component);
                    this._tempBufferList.push(component);
                }
                // 在调用onAddedToEntity之前清除，以防添加更多组件
                this._componentsToAdd = {};
                this._componentsToAddList.length = 0;
                this.componentsToAddByType.clear();
                this._isComponentListUnsorted = true;
            }
            if (this._tempBufferList.length > 0) {
                // 现在所有的组件都添加到了场景中，我们再次循环并调用onAddedToEntity/onEnabled
                for (var i = 0, l = this._tempBufferList.length; i < l; ++i) {
                    var component = this._tempBufferList[i];
                    component.onAddedToEntity();
                    // enabled检查实体和组件
                    if (component.enabled) {
                        component.onEnabled();
                    }
                }
                this._tempBufferList.length = 0;
            }
        };
        ComponentList.prototype.handleRemove = function (component) {
            if (component instanceof es.RenderableComponent)
                this._entity.scene.renderableComponents.remove(component);
            if (es.isIUpdatable(component) && this._updatableComponents.length > 0) {
                var index = this._updatableComponents.findIndex(function (c) { return c.id == component.id; });
                if (index != -1)
                    this._updatableComponents.splice(index, 1);
            }
            this.decreaseBits(component);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            component.onRemovedFromEntity();
            component.entity = null;
        };
        ComponentList.prototype.removeComponentsByType = function (component) {
            var fastList = this.componentsByType.get(es.TypeUtils.getType(component));
            var fastIndex = fastList.findIndex(function (c) { return c.id == component.id; });
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        };
        ComponentList.prototype.addComponentsByType = function (component) {
            var fastList = this.componentsByType.get(es.TypeUtils.getType(component));
            if (!fastList)
                fastList = [];
            fastList.push(component);
            this.componentsByType.set(es.TypeUtils.getType(component), fastList);
        };
        ComponentList.prototype.removeComponentsToAddByType = function (component) {
            var fastList = this.componentsToAddByType.get(es.TypeUtils.getType(component));
            var fastIndex = fastList.findIndex(function (c) { return c.id == component.id; });
            if (fastIndex != -1) {
                fastList.splice(fastIndex, 1);
            }
        };
        ComponentList.prototype.addComponentsToAddByType = function (component) {
            var fastList = this.componentsToAddByType.get(es.TypeUtils.getType(component));
            if (!fastList)
                fastList = [];
            fastList.push(component);
            this.componentsToAddByType.set(es.TypeUtils.getType(component), fastList);
        };
        /**
         * 获取类型T的第一个组件并返回它
         * 可以选择跳过检查未初始化的组件(尚未调用onAddedToEntity方法的组件)
         * 如果没有找到组件，则返回null。
         * @param type
         * @param onlyReturnInitializedComponents
         */
        ComponentList.prototype.getComponent = function (type, onlyReturnInitializedComponents) {
            var fastList = this.componentsByType.get(type);
            if (fastList && fastList.length > 0)
                return fastList[0];
            // 我们可以选择检查挂起的组件，以防addComponent和getComponent在同一个框架中被调用
            if (!onlyReturnInitializedComponents) {
                var fastToAddList = this.componentsToAddByType.get(type);
                if (fastToAddList && fastToAddList.length > 0)
                    return fastToAddList[0];
            }
            return null;
        };
        /**
         * 获取T类型的所有组件，但不使用列表分配
         * @param typeName
         * @param components
         */
        ComponentList.prototype.getComponents = function (typeName, components) {
            if (!components)
                components = [];
            var fastList = this.componentsByType.get(typeName);
            if (fastList)
                components = components.concat(fastList);
            var fastToAddList = this.componentsToAddByType.get(typeName);
            if (fastToAddList)
                components = components.concat(fastToAddList);
            return components;
        };
        ComponentList.prototype.update = function () {
            this.updateLists();
            if (this._updatableComponents.length > 0) {
                for (var i = 0, s = this._updatableComponents.length; i < s; ++i) {
                    var updateComponent = this._updatableComponents[i];
                    if (updateComponent.enabled)
                        updateComponent.update();
                }
            }
        };
        ComponentList.prototype.onEntityTransformChanged = function (comp) {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; ++i) {
                    var component = this._components[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }
            if (this._componentsToAddList.length > 0) {
                for (var i = 0, s = this._componentsToAddList.length; i < s; ++i) {
                    var component = this._componentsToAddList[i];
                    if (component.enabled)
                        component.onEntityTransformChanged(comp);
                }
            }
        };
        ComponentList.prototype.onEntityEnabled = function () {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onEnabled();
            }
        };
        ComponentList.prototype.onEntityDisabled = function () {
            if (this._components.length > 0) {
                for (var i = 0, s = this._components.length; i < s; i++)
                    this._components[i].onDisabled();
            }
        };
        ComponentList.prototype.debugRender = function (batcher) {
            if (!batcher)
                return;
            for (var i = 0; i < this._components.length; i++) {
                if (this._components[i].enabled) {
                    this._components[i].debugRender(batcher);
                }
            }
        };
        /**
         * 组件列表的全局updateOrder排序
         */
        ComponentList.compareUpdatableOrder = new es.IUpdatableComparer();
        return ComponentList;
    }());
    es.ComponentList = ComponentList;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentTypeFactory = /** @class */ (function () {
        function ComponentTypeFactory() {
            this.componentTypeCount_ = 0;
            this.componentTypes_ = {};
            this.types = new es.Bag();
        }
        ComponentTypeFactory.prototype.getTypeFor = function (c) {
            if ("number" === typeof c) {
                return this.types.get(c);
            }
            var type = this.componentTypes_[es.getClassName(c)];
            if (type == null) {
                var index = this.componentTypeCount_++;
                type = new es.ComponentType(c, index);
                this.componentTypes_[es.getClassName(c)] = type;
                this.types.set(index, type);
            }
            return type;
        };
        ComponentTypeFactory.prototype.getIndexFor = function (c) {
            return this.getTypeFor(c).getIndex();
        };
        return ComponentTypeFactory;
    }());
    es.ComponentTypeFactory = ComponentTypeFactory;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentTypeManager = /** @class */ (function () {
        function ComponentTypeManager() {
        }
        ComponentTypeManager.add = function (type) {
            if (!this._componentTypesMask.has(type))
                this._componentTypesMask.set(type, this._componentTypesMask.size);
        };
        ComponentTypeManager.getIndexFor = function (type) {
            var v = -1;
            if (!this._componentTypesMask.has(type)) {
                this.add(type);
                v = this._componentTypesMask.get(type);
            }
            else {
                v = this._componentTypesMask.get(type);
            }
            return v;
        };
        ComponentTypeManager._componentTypesMask = new Map();
        return ComponentTypeManager;
    }());
    es.ComponentTypeManager = ComponentTypeManager;
})(es || (es = {}));
var es;
(function (es) {
    var EntityList = /** @class */ (function () {
        function EntityList(scene) {
            /**
             * 场景中添加的实体列表
             */
            this._entities = [];
            /**
             * 本帧添加的实体列表。用于对实体进行分组，以便我们可以同时处理它们
             */
            this._entitiesToAdded = {};
            /**
             * 本帧被标记为删除的实体列表。用于对实体进行分组，以便我们可以同时处理它们
             */
            this._entitiesToRemove = {};
            this._entitiesToAddedList = [];
            this._entitiesToRemoveList = [];
            /**
             * 通过标签跟踪实体，便于检索
             */
            this._entityDict = new Map();
            this._unsortedTags = new Set();
            this.scene = scene;
        }
        Object.defineProperty(EntityList.prototype, "count", {
            get: function () {
                return this._entities.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EntityList.prototype, "buffer", {
            get: function () {
                return this._entities;
            },
            enumerable: true,
            configurable: true
        });
        EntityList.prototype.markEntityListUnsorted = function () {
            this._isEntityListUnsorted = true;
        };
        EntityList.prototype.markTagUnsorted = function (tag) {
            this._unsortedTags.add(tag);
        };
        /**
         * 将一个实体添加到列表中。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        EntityList.prototype.add = function (entity) {
            this._entitiesToAdded[entity.id] = entity;
            this._entitiesToAddedList.push(entity);
        };
        /**
         * 从列表中删除一个实体。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        EntityList.prototype.remove = function (entity) {
            // 防止在同一帧中添加或删除实体
            if (this._entitiesToAdded[entity.id]) {
                var index = this._entitiesToAddedList.findIndex(function (e) { return e.id == entity.id; });
                if (index != -1)
                    this._entitiesToAddedList.splice(index, 1);
                delete this._entitiesToAdded[entity.id];
                return;
            }
            this._entitiesToRemoveList.push(entity);
            if (!this._entitiesToRemove[entity.id])
                this._entitiesToRemove[entity.id] = entity;
        };
        /**
         * 从实体列表中删除所有实体
         */
        EntityList.prototype.removeAllEntities = function () {
            this._unsortedTags.clear();
            this._entitiesToAdded = {};
            this._entitiesToAddedList.length = 0;
            this._isEntityListUnsorted = false;
            // 为什么我们要在这里更新列表？主要是为了处理在场景切换前被分离的实体。
            // 它们仍然会在_entitiesToRemove列表中，这将由updateLists处理。
            this.updateLists();
            for (var i = 0; i < this._entities.length; i++) {
                this._entities[i]._isDestroyed = true;
                this._entities[i].onRemovedFromScene();
                this._entities[i].scene = null;
            }
            this._entities.length = 0;
            this._entityDict.clear();
        };
        /**
         * 检查实体目前是否由这个EntityList管理
         * @param entity
         */
        EntityList.prototype.contains = function (entity) {
            return !!this._entitiesToAdded[entity.id];
        };
        EntityList.prototype.getTagList = function (tag) {
            var list = this._entityDict.get(tag);
            if (!list) {
                list = new Set();
                this._entityDict.set(tag, list);
            }
            return list;
        };
        EntityList.prototype.addToTagList = function (entity) {
            this.getTagList(entity.tag).add(entity);
            this._unsortedTags.add(entity.tag);
        };
        EntityList.prototype.removeFromTagList = function (entity) {
            var list = this._entityDict.get(entity.tag);
            if (list)
                list.delete(entity);
        };
        EntityList.prototype.update = function () {
            for (var i = 0, s = this._entities.length; i < s; ++i) {
                var entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval == 1 || es.Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        };
        EntityList.prototype.updateLists = function () {
            if (this._entitiesToRemoveList.length > 0) {
                var _loop_3 = function (i, s) {
                    var entity = this_3._entitiesToRemoveList[i];
                    this_3.removeFromTagList(entity);
                    // 处理常规实体列表
                    var index = this_3._entities.findIndex(function (e) { return e.id == entity.id; });
                    if (index != -1)
                        this_3._entities.splice(index, 1);
                    entity.onRemovedFromScene();
                    entity.scene = null;
                    this_3.scene.entityProcessors.onEntityRemoved(entity);
                };
                var this_3 = this;
                for (var i = 0, s = this._entitiesToRemoveList.length; i < s; ++i) {
                    _loop_3(i, s);
                }
                this._entitiesToRemove = {};
                this._entitiesToRemoveList.length = 0;
            }
            if (this._entitiesToAddedList.length > 0) {
                for (var i = 0, s = this._entitiesToAddedList.length; i < s; ++i) {
                    var entity = this._entitiesToAddedList[i];
                    this._entities.push(entity);
                    entity.scene = this.scene;
                    this.addToTagList(entity);
                    this.scene.entityProcessors.onEntityAdded(entity);
                }
                for (var i = 0, s = this._entitiesToAddedList.length; i < s; ++i) {
                    var entity = this._entitiesToAddedList[i];
                    entity.onAddedToScene();
                }
                this._entitiesToAdded = {};
                this._entitiesToAddedList.length = 0;
            }
        };
        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        EntityList.prototype.findEntity = function (name) {
            if (this._entities.length > 0) {
                for (var i = 0, s = this._entities.length; i < s; ++i) {
                    var entity = this._entities[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (var i = 0, s = this._entitiesToAddedList.length; i < s; ++i) {
                    var entity = this._entitiesToAddedList[i];
                    if (entity.name == name)
                        return entity;
                }
            }
            return null;
        };
        /**
         *
         * @param id
         * @returns
         */
        EntityList.prototype.findEntityById = function (id) {
            if (this._entities.length > 0) {
                for (var i = 0, s = this._entities.length; i < s; ++i) {
                    var entity = this._entities[i];
                    if (entity.id == id)
                        return entity;
                }
            }
            return this._entitiesToAdded[id];
        };
        /**
         * 返回带有标签的所有实体的列表。如果没有实体有标签，则返回一个空列表。
         * 返回的List可以通过ListPool.free放回池中
         * @param tag
         */
        EntityList.prototype.entitiesWithTag = function (tag) {
            var e_7, _a;
            var list = this.getTagList(tag);
            var returnList = es.ListPool.obtain(es.Entity);
            if (list.size > 0) {
                try {
                    for (var list_1 = __values(list), list_1_1 = list_1.next(); !list_1_1.done; list_1_1 = list_1.next()) {
                        var entity = list_1_1.value;
                        returnList.push(entity);
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (list_1_1 && !list_1_1.done && (_a = list_1.return)) _a.call(list_1);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
            return returnList;
        };
        /**
         * 返回第一个找到该tag的实体
         * @param tag
         * @returns
         */
        EntityList.prototype.entityWithTag = function (tag) {
            var e_8, _a;
            var list = this.getTagList(tag);
            if (list.size > 0) {
                try {
                    for (var list_2 = __values(list), list_2_1 = list_2.next(); !list_2_1.done; list_2_1 = list_2.next()) {
                        var entity = list_2_1.value;
                        return entity;
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (list_2_1 && !list_2_1.done && (_a = list_2.return)) _a.call(list_2);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
            return null;
        };
        /**
         * 返回在场景中找到的第一个T类型的组件。
         * @param type
         */
        EntityList.prototype.findComponentOfType = function (type) {
            if (this._entities.length > 0) {
                for (var i = 0, s = this._entities.length; i < s; i++) {
                    var entity = this._entities[i];
                    if (entity.enabled) {
                        var comp = entity.getComponent(type);
                        if (comp)
                            return comp;
                    }
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (var i = 0; i < this._entitiesToAddedList.length; i++) {
                    var entity = this._entitiesToAddedList[i];
                    if (entity.enabled) {
                        var comp = entity.getComponent(type);
                        if (comp)
                            return comp;
                    }
                }
            }
            return null;
        };
        /**
         * 返回在场景中找到的所有T类型的组件。
         * 返回的List可以通过ListPool.free放回池中。
         * @param type
         */
        EntityList.prototype.findComponentsOfType = function (type) {
            var comps = es.ListPool.obtain(type);
            if (this._entities.length > 0) {
                for (var i = 0, s = this._entities.length; i < s; i++) {
                    var entity = this._entities[i];
                    if (entity.enabled)
                        entity.getComponents(type, comps);
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (var i = 0, s = this._entitiesToAddedList.length; i < s; i++) {
                    var entity = this._entitiesToAddedList[i];
                    if (entity.enabled)
                        entity.getComponents(type, comps);
                }
            }
            return comps;
        };
        /**
         * 返回场景中包含特定组件的实体列表
         * @param types
         * @returns
         */
        EntityList.prototype.findEntitesOfComponent = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            var entities = [];
            if (this._entities.length > 0) {
                for (var i = 0, s = this._entities.length; i < s; i++) {
                    if (this._entities[i].enabled) {
                        var meet = true;
                        if (types.length > 0)
                            for (var t = 0, ts = types.length; t < ts; t++) {
                                var type = types[t];
                                var hasComp = this._entities[i].hasComponent(type);
                                if (!hasComp) {
                                    meet = false;
                                    break;
                                }
                            }
                        if (meet) {
                            entities.push(this._entities[i]);
                        }
                    }
                }
            }
            if (this._entitiesToAddedList.length > 0) {
                for (var i = 0, s = this._entitiesToAddedList.length; i < s; i++) {
                    var entity = this._entitiesToAddedList[i];
                    if (entity.enabled) {
                        var meet = true;
                        if (types.length > 0)
                            for (var t = 0, ts = types.length; t < ts; t++) {
                                var type = types[t];
                                var hasComp = entity.hasComponent(type);
                                if (!hasComp) {
                                    meet = false;
                                    break;
                                }
                            }
                        if (meet) {
                            entities.push(entity);
                        }
                    }
                }
            }
            return entities;
        };
        return EntityList;
    }());
    es.EntityList = EntityList;
})(es || (es = {}));
var es;
(function (es) {
    var EntityProcessorList = /** @class */ (function () {
        function EntityProcessorList() {
            this._processors = [];
            this._orderDirty = false;
        }
        Object.defineProperty(EntityProcessorList.prototype, "processors", {
            /** 获取系统列表 */
            get: function () {
                return this._processors;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EntityProcessorList.prototype, "count", {
            /** 系统数量 */
            get: function () {
                return this._processors.length;
            },
            enumerable: true,
            configurable: true
        });
        EntityProcessorList.prototype.add = function (processor) {
            this._processors.push(processor);
        };
        EntityProcessorList.prototype.remove = function (processor) {
            new es.List(this._processors).remove(processor);
        };
        EntityProcessorList.prototype.onComponentAdded = function (entity) {
            this.notifyEntityChanged(entity);
        };
        EntityProcessorList.prototype.onComponentRemoved = function (entity) {
            this.notifyEntityChanged(entity);
        };
        EntityProcessorList.prototype.onEntityAdded = function (entity) {
            this.notifyEntityChanged(entity);
        };
        EntityProcessorList.prototype.onEntityRemoved = function (entity) {
            this.removeFromProcessors(entity);
        };
        EntityProcessorList.prototype.begin = function () {
        };
        EntityProcessorList.prototype.update = function () {
            if (this._processors.length == 0)
                return;
            if (this._orderDirty) {
                // 进行排序
                this._processors = this._processors.sort(function (a, b) { return a.updateOrder - b.updateOrder; });
                for (var i = 0, s = this._processors.length; i < s; ++i) {
                    var processor = this._processors[i];
                    processor.setUpdateOrder(i);
                }
                this.clearDirty();
            }
            for (var i = 0, s = this._processors.length; i < s; ++i) {
                this._processors[i].update();
            }
        };
        EntityProcessorList.prototype.lateUpdate = function () {
            if (this._processors.length == 0)
                return;
            for (var i = 0, s = this._processors.length; i < s; ++i) {
                this._processors[i].lateUpdate();
            }
        };
        EntityProcessorList.prototype.end = function () {
        };
        EntityProcessorList.prototype.setDirty = function () {
            this._orderDirty = true;
        };
        EntityProcessorList.prototype.clearDirty = function () {
            this._orderDirty = false;
        };
        EntityProcessorList.prototype.getProcessor = function (type) {
            if (this._processors.length == 0)
                return null;
            for (var i = 0, s = this._processors.length; i < s; ++i) {
                var processor = this._processors[i];
                if (processor instanceof type)
                    return processor;
            }
            return null;
        };
        EntityProcessorList.prototype.notifyEntityChanged = function (entity) {
            if (this._processors.length == 0)
                return;
            for (var i = 0, s = this._processors.length; i < s; ++i) {
                this._processors[i].onChanged(entity);
            }
        };
        EntityProcessorList.prototype.removeFromProcessors = function (entity) {
            if (this._processors.length == 0)
                return;
            for (var i = 0, s = this._processors.length; i < s; ++i) {
                this._processors[i].remove(entity);
            }
        };
        return EntityProcessorList;
    }());
    es.EntityProcessorList = EntityProcessorList;
})(es || (es = {}));
var es;
(function (es) {
    var HashHelpers = /** @class */ (function () {
        function HashHelpers() {
        }
        HashHelpers.isPrime = function (candidate) {
            if ((candidate & 1) != 0) {
                var limit = Math.sqrt(candidate);
                for (var divisor = 3; divisor <= limit; divisor += 2) {
                    if ((candidate & divisor) == 0)
                        return false;
                }
                return true;
            }
            return (candidate == 2);
        };
        HashHelpers.getPrime = function (min) {
            if (min < 0)
                throw new Error("参数错误 min不能小于0");
            for (var i = 0; i < this.primes.length; i++) {
                var prime = this.primes[i];
                if (prime >= min)
                    return prime;
            }
            // 在我们预定义的表之外，计算的方式稍复杂。
            for (var i = (min | 1); i < Number.MAX_VALUE; i += 2) {
                if (this.isPrime(i) && ((i - 1) % this.hashPrime != 0))
                    return i;
            }
            return min;
        };
        /**
         *
         * @param oldSize
         * @returns 返回要增长的哈希特表的大小
         */
        HashHelpers.expandPrime = function (oldSize) {
            var newSize = 2 * oldSize;
            // 在遇到容量溢出之前，允许哈希特表增长到最大可能的大小
            // 请注意，即使当_items.Length溢出时，这项检查也会起作用
            if (newSize > this.maxPrimeArrayLength && this.maxPrimeArrayLength > oldSize) {
                return this.maxPrimeArrayLength;
            }
            return this.getPrime(newSize);
        };
        HashHelpers.getHashCode = function (str) {
            var s;
            if (typeof str == 'object') {
                s = JSON.stringify(str);
            }
            else {
                s = str.toString();
            }
            var hash = 0;
            if (s.length == 0)
                return hash;
            for (var i = 0; i < s.length; i++) {
                var char = s.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        };
        HashHelpers.hashCollisionThreshold = 100;
        HashHelpers.hashPrime = 101;
        /**
         * 用来作为哈希表大小的质数表。
         * 一个典型的调整大小的算法会在这个数组中选取比之前容量大两倍的最小质数。
         * 假设我们的Hashtable当前的容量为x，并且添加了足够多的元素，因此需要进行大小调整。
         * 调整大小首先计算2x，然后在表中找到第一个大于2x的质数，即如果质数的顺序是p_1，p_2，...，p_i，...，则找到p_n，使p_n-1 < 2x < p_n。
         * 双倍对于保持哈希特操作的渐近复杂度是很重要的，比如添加。
         * 拥有一个质数可以保证双倍哈希不会导致无限循环。 IE，你的哈希函数将是h1(key)+i*h2(key)，0 <= i < size.h2和size必须是相对质数。
         */
        HashHelpers.primes = [3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
            1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
            17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
            187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
            1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369];
        /**
         * 这是比Array.MaxArrayLength小的最大质数
         */
        HashHelpers.maxPrimeArrayLength = 0x7FEFFFFD;
        return HashHelpers;
    }());
    es.HashHelpers = HashHelpers;
})(es || (es = {}));
var es;
(function (es) {
    var IdentifierPool = /** @class */ (function () {
        function IdentifierPool() {
            this.nextAvailableId_ = 0;
            this.ids = new es.Bag();
        }
        IdentifierPool.prototype.checkOut = function () {
            if (this.ids.size() > 0) {
                return this.ids.removeLast();
            }
            return this.nextAvailableId_++;
        };
        IdentifierPool.prototype.checkIn = function (id) {
            this.ids.add(id);
        };
        return IdentifierPool;
    }());
    es.IdentifierPool = IdentifierPool;
})(es || (es = {}));
var es;
(function (es) {
    var Matcher = /** @class */ (function () {
        function Matcher() {
            this.allSet = [];
            this.exclusionSet = [];
            this.oneSet = [];
        }
        Matcher.empty = function () {
            return new Matcher();
        };
        Matcher.prototype.getAllSet = function () {
            return this.allSet;
        };
        Matcher.prototype.getExclusionSet = function () {
            return this.exclusionSet;
        };
        Matcher.prototype.getOneSet = function () {
            return this.oneSet;
        };
        Matcher.prototype.isInterestedEntity = function (e) {
            return this.isInterested(e.componentBits);
        };
        Matcher.prototype.isInterested = function (components) {
            if (this.allSet.length != 0) {
                for (var i = 0, s = this.allSet.length; i < s; ++i) {
                    var type = this.allSet[i];
                    if (!components.get(es.ComponentTypeManager.getIndexFor(type)))
                        return false;
                }
            }
            if (this.exclusionSet.length != 0) {
                for (var i = 0, s = this.exclusionSet.length; i < s; ++i) {
                    var type = this.exclusionSet[i];
                    if (components.get(es.ComponentTypeManager.getIndexFor(type)))
                        return false;
                }
            }
            if (this.oneSet.length != 0) {
                for (var i = 0, s = this.oneSet.length; i < s; ++i) {
                    var type = this.oneSet[i];
                    if (components.get(es.ComponentTypeManager.getIndexFor(type)))
                        return true;
                }
            }
            return true;
        };
        Matcher.prototype.all = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            var t;
            for (var i = 0, s = types.length; i < s; ++i) {
                t = types[i];
                this.allSet.push(t);
            }
            return this;
        };
        Matcher.prototype.exclude = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            var t;
            for (var i = 0, s = types.length; i < s; ++i) {
                t = types[i];
                this.exclusionSet.push(t);
            }
            return this;
        };
        Matcher.prototype.one = function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            for (var i = 0, s = types.length; i < s; ++i) {
                var t = types[i];
                this.oneSet.push(t);
            }
            return this;
        };
        return Matcher;
    }());
    es.Matcher = Matcher;
})(es || (es = {}));
var es;
(function (es) {
    var RenderableComponentList = /** @class */ (function () {
        function RenderableComponentList() {
            this._components = [];
            this._componentsByRenderLayer = new Map();
            this._unsortedRenderLayers = [];
            this._componentsNeedSort = true;
        }
        Object.defineProperty(RenderableComponentList.prototype, "count", {
            get: function () {
                return this._components.length;
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponentList.prototype.get = function (index) {
            return this._components[index];
        };
        RenderableComponentList.prototype.add = function (component) {
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        };
        RenderableComponentList.prototype.remove = function (component) {
            new es.List(this._components).remove(component);
            new es.List(this._componentsByRenderLayer.get(component.renderLayer)).remove(component);
        };
        RenderableComponentList.prototype.updateRenderableRenderLayer = function (component, oldRenderLayer, newRenderLayer) {
            if (this._componentsByRenderLayer.has(oldRenderLayer) && new es.List(this._componentsByRenderLayer.get(oldRenderLayer)).contains(component)) {
                new es.List(this._componentsByRenderLayer.get(oldRenderLayer)).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        };
        RenderableComponentList.prototype.setRenderLayerNeedsComponentSort = function (renderLayer) {
            var unsortedRenderLayersList = new es.List(this._unsortedRenderLayers);
            if (!unsortedRenderLayersList.contains(renderLayer))
                unsortedRenderLayersList.add(renderLayer);
            this._componentsNeedSort = true;
        };
        RenderableComponentList.prototype.setNeedsComponentSort = function () {
            this._componentsNeedSort = true;
        };
        RenderableComponentList.prototype.addToRenderLayerList = function (component, renderLayer) {
            var list = this.componentsWithRenderLayer(renderLayer);
            es.Insist.isFalse(!!list.find(function (c) { return c == component; }), "组件renderLayer列表已包含此组件");
            list.push(component);
            var unsortedRenderLayersList = new es.List(this._unsortedRenderLayers);
            if (!unsortedRenderLayersList.contains(renderLayer))
                unsortedRenderLayersList.add(renderLayer);
            this._componentsNeedSort = true;
        };
        RenderableComponentList.prototype.componentsWithRenderLayer = function (renderLayer) {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }
            return this._componentsByRenderLayer.get(renderLayer);
        };
        RenderableComponentList.prototype.updateLists = function () {
            if (this._componentsNeedSort) {
                this._components.sort(function (self, other) { return other.renderLayer - self.renderLayer; });
                this._componentsNeedSort = false;
            }
            if (this._unsortedRenderLayers.length > 0) {
                for (var i = 0, count = this._unsortedRenderLayers.length; i < count; i++) {
                    var renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents.sort(function (self, other) { return other.renderLayer - self.renderLayer; });
                    }
                    this._unsortedRenderLayers.length = 0;
                }
            }
        };
        return RenderableComponentList;
    }());
    es.RenderableComponentList = RenderableComponentList;
})(es || (es = {}));
var es;
(function (es) {
    var StringUtils = /** @class */ (function () {
        function StringUtils() {
        }
        /**
         * 匹配中文字符
         * @param str 需要匹配的字符串
         * @return
         */
        StringUtils.matchChineseWord = function (str) {
            //中文字符的unicode值[\u4E00-\u9FA5]
            var patternA = /[\u4E00-\u9FA5]+/gim;
            return str.match(patternA);
        };
        /**
         * 去除字符串左端的空白字符
         * @param target 目标字符串
         * @return
         */
        StringUtils.lTrim = function (target) {
            var startIndex = 0;
            while (this.isWhiteSpace(target.charAt(startIndex))) {
                startIndex++;
            }
            return target.slice(startIndex, target.length);
        };
        /**
         * 去除字符串右端的空白字符
         * @param target 目标字符串
         * @return
         */
        StringUtils.rTrim = function (target) {
            var endIndex = target.length - 1;
            while (this.isWhiteSpace(target.charAt(endIndex))) {
                endIndex--;
            }
            return target.slice(0, endIndex + 1);
        };
        /**
         * 返回一个去除2段空白字符的字符串
         * @param target
         * @return 返回一个去除2段空白字符的字符串
         */
        StringUtils.trim = function (target) {
            if (target == null) {
                return null;
            }
            return this.rTrim(this.lTrim(target));
        };
        /**
         * 返回该字符是否为空白字符
         * @param    str
         * @return  返回该字符是否为空白字符
         */
        StringUtils.isWhiteSpace = function (str) {
            if (str == " " || str == "\t" || str == "\r" || str == "\n")
                return true;
            return false;
        };
        /**
         * 返回该字符是否为空字符或者为null
         * @param str
         * @returns
         */
        StringUtils.isNullOrEmpty = function (str) {
            if (str == "" || str == null || str == undefined)
                return true;
            return false;
        };
        /**
         * 返回执行替换后的字符串
         * @param mainStr 待查找字符串
         * @param targetStr 目标字符串
         * @param replaceStr 替换字符串
         * @param caseMark 是否忽略大小写
         * @return 返回执行替换后的字符串
         */
        StringUtils.replaceMatch = function (mainStr, targetStr, replaceStr, caseMark) {
            if (caseMark === void 0) { caseMark = false; }
            var len = mainStr.length;
            var tempStr = "";
            var isMatch = false;
            var tempTarget = caseMark == true ? targetStr.toLowerCase() : targetStr;
            for (var i = 0; i < len; i++) {
                isMatch = false;
                if (mainStr.charAt(i) == tempTarget.charAt(0)) {
                    if (mainStr.substr(i, tempTarget.length) == tempTarget) {
                        isMatch = true;
                    }
                }
                if (isMatch) {
                    tempStr += replaceStr;
                    i = i + tempTarget.length - 1;
                }
                else {
                    tempStr += mainStr.charAt(i);
                }
            }
            return tempStr;
        };
        /**
         * 用html实体换掉字符窜中的特殊字符
         * @param str 需要替换的字符串
         * @param reversion 是否翻转替换：将转义符号替换为正常的符号
         * @return 换掉特殊字符后的字符串
         */
        StringUtils.htmlSpecialChars = function (str, reversion) {
            if (reversion === void 0) { reversion = false; }
            var len = this.specialSigns.length;
            for (var i = 0; i < len; i += 2) {
                var from = void 0;
                var to = void 0;
                from = this.specialSigns[i];
                to = this.specialSigns[i + 1];
                if (reversion) {
                    var temp = from;
                    from = to;
                    to = temp;
                }
                str = this.replaceMatch(str, from, to);
            }
            return str;
        };
        /**
         * 给数字字符前面添 "0"
         *
         * @param str 要进行处理的字符串
         * @param width 处理后字符串的长度，
         *              如果str.length >= width，将不做任何处理直接返回原始的str。
         * @return
         *
         */
        StringUtils.zfill = function (str, width) {
            if (width === void 0) { width = 2; }
            if (!str) {
                return str;
            }
            width = Math.floor(width);
            var slen = str.length;
            if (slen >= width) {
                return str;
            }
            var negative = false;
            if (str.substr(0, 1) == '-') {
                negative = true;
                str = str.substr(1);
            }
            var len = width - slen;
            for (var i = 0; i < len; i++) {
                str = '0' + str;
            }
            if (negative) {
                str = '-' + str;
            }
            return str;
        };
        /**
         * 翻转字符串
         * @param str 字符串
         * @return 翻转后的字符串
         */
        StringUtils.reverse = function (str) {
            if (str.length > 1)
                return this.reverse(str.substring(1)) + str.substring(0, 1);
            else
                return str;
        };
        /**
         * 截断某段字符串
         * @param str 目标字符串
         * @param start 需要截断的起始索引
         * @param en 截断长度
         * @param order 顺序，true从字符串头部开始计算，false从字符串尾巴开始结算。
         * @return 截断后的字符串
         */
        StringUtils.cutOff = function (str, start, len, order) {
            if (order === void 0) { order = true; }
            start = Math.floor(start);
            len = Math.floor(len);
            var length = str.length;
            if (start > length)
                start = length;
            var s = start;
            var e = start + len;
            var newStr;
            if (order) {
                newStr = str.substring(0, s) + str.substr(e, length);
            }
            else {
                s = length - 1 - start - len;
                e = s + len;
                newStr = str.substring(0, s + 1) + str.substr(e + 1, length);
            }
            return newStr;
        };
        /**
         * {0} 字符替换
         */
        StringUtils.strReplace = function (str, rStr) {
            var i = 0, len = rStr.length;
            for (; i < len; i++) {
                if (rStr[i] == null || rStr[i] == "") {
                    rStr[i] = "无";
                }
                str = str.replace("{" + i + "}", rStr[i]);
            }
            return str;
        };
        StringUtils.format = function (str) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            for (var i = 0; i < args.length - 1; i++) {
                var reg = new RegExp("\\{" + i + "\\}", "gm");
                str = str.replace(reg, args[i + 1]);
            }
            return str;
        };
        /**
         * 特殊符号字符串
         */
        StringUtils.specialSigns = [
            '&', '&amp;',
            '<', '&lt;',
            '>', '&gt;',
            '"', '&quot;',
            "'", '&apos;',
            '®', '&reg;',
            '©', '&copy;',
            '™', '&trade;',
        ];
        return StringUtils;
    }());
    es.StringUtils = StringUtils;
})(es || (es = {}));
var es;
(function (es) {
    /** 提供帧定时信息 */
    var Time = /** @class */ (function () {
        function Time() {
        }
        Time.update = function (currentTime, useEngineTime) {
            var dt = 0;
            if (useEngineTime) {
                dt = currentTime;
            }
            else {
                if (currentTime == -1) {
                    currentTime = Date.now();
                }
                if (this._lastTime == -1)
                    this._lastTime = currentTime;
                dt = (currentTime - this._lastTime) / 1000;
            }
            if (dt > this.maxDeltaTime)
                dt = this.maxDeltaTime;
            this.totalTime += dt;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this.timeSinceSceneLoad += dt;
            this.frameCount++;
            this._lastTime = currentTime;
        };
        Time.sceneChanged = function () {
            this.timeSinceSceneLoad = 0;
        };
        /**
         * 允许在间隔检查。只应该使用高于delta的间隔值，否则它将始终返回true。
         * @param interval
         */
        Time.checkEvery = function (interval) {
            // 我们减去了delta，因为timeSinceSceneLoad已经包含了这个update ticks delta
            return this.timeSinceSceneLoad / interval > (this.timeSinceSceneLoad - this.deltaTime) / interval;
        };
        /** 游戏运行的总时间 */
        Time.totalTime = 0;
        /** deltaTime的未缩放版本。不受时间尺度的影响 */
        Time.unscaledDeltaTime = 0;
        /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
        Time.deltaTime = 0;
        /** 时间刻度缩放 */
        Time.timeScale = 1;
        /** DeltaTime可以为的最大值 */
        Time.maxDeltaTime = Number.MAX_VALUE;
        /** 已传递的帧总数 */
        Time.frameCount = 0;
        /** 自场景加载以来的总时间 */
        Time.timeSinceSceneLoad = 0;
        Time._lastTime = -1;
        return Time;
    }());
    es.Time = Time;
})(es || (es = {}));
var TimeUtils = /** @class */ (function () {
    function TimeUtils() {
    }
    /**
     * 计算月份ID
     * @param d 指定计算日期
     * @returns 月ID
     */
    TimeUtils.monthId = function (d) {
        if (d === void 0) { d = null; }
        d = d ? d : new Date();
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var g = m < 10 ? "0" : "";
        return parseInt(y + g + m);
    };
    /**
     * 计算日期ID
     * @param d 指定计算日期
     * @returns 日期ID
     */
    TimeUtils.dateId = function (t) {
        if (t === void 0) { t = null; }
        t = t ? t : new Date();
        var m = t.getMonth() + 1;
        var a = m < 10 ? "0" : "";
        var d = t.getDate();
        var b = d < 10 ? "0" : "";
        return parseInt(t.getFullYear() + a + m + b + d);
    };
    /**
     * 计算周ID
     * @param d 指定计算日期
     * @returns 周ID
     */
    TimeUtils.weekId = function (d, first) {
        if (d === void 0) { d = null; }
        if (first === void 0) { first = true; }
        d = d ? d : new Date();
        var c = new Date();
        c.setTime(d.getTime());
        c.setDate(1);
        c.setMonth(0); //当年第一天
        var year = c.getFullYear();
        var firstDay = c.getDay();
        if (firstDay == 0) {
            firstDay = 7;
        }
        var max = false;
        if (firstDay <= 4) {
            max = firstDay > 1;
            c.setDate(c.getDate() - (firstDay - 1));
        }
        else {
            c.setDate(c.getDate() + 7 - firstDay + 1);
        }
        var num = this.diffDay(d, c, false);
        if (num < 0) {
            c.setDate(1);
            c.setMonth(0); //当年第一天
            c.setDate(c.getDate() - 1);
            return this.weekId(c, false);
        }
        var week = num / 7;
        var weekIdx = Math.floor(week) + 1;
        if (weekIdx == 53) {
            c.setTime(d.getTime());
            c.setDate(c.getDate() - 1);
            var endDay = c.getDay();
            if (endDay == 0) {
                endDay = 7;
            }
            if (first && (!max || endDay < 4)) {
                c.setFullYear(c.getFullYear() + 1);
                c.setDate(1);
                c.setMonth(0); //当年第一天
                return this.weekId(c, false);
            }
        }
        var g = weekIdx > 9 ? "" : "0";
        var s = year + "00" + g + weekIdx; //加上00防止和月份ID冲突
        return parseInt(s);
    };
    /**
     * 计算俩日期时间差，如果a比b小，返回负数
     */
    TimeUtils.diffDay = function (a, b, fixOne) {
        if (fixOne === void 0) { fixOne = false; }
        var x = (a.getTime() - b.getTime()) / 86400000;
        return fixOne ? Math.ceil(x) : Math.floor(x);
    };
    /**
     * 获取本周一 凌晨时间
     */
    TimeUtils.getFirstDayOfWeek = function (d) {
        d = d ? d : new Date();
        var day = d.getDay() || 7;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1 - day, 0, 0, 0, 0);
    };
    /**
     * 获取当日凌晨时间
     */
    TimeUtils.getFirstOfDay = function (d) {
        d = d ? d : new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };
    /**
     * 获取次日凌晨时间
     */
    TimeUtils.getNextFirstOfDay = function (d) {
        return new Date(this.getFirstOfDay(d).getTime() + 86400000);
    };
    /**
     * @returns 2018-12-12
     */
    TimeUtils.formatDate = function (date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        return y + '-' + m + '-' + d;
    };
    /**
     * @returns 2018-12-12 12:12:12
     */
    TimeUtils.formatDateTime = function (date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        var h = date.getHours();
        var i = date.getMinutes();
        i = i < 10 ? ('0' + i) : i;
        var s = date.getSeconds();
        s = s < 10 ? ('0' + s) : s;
        return y + '-' + m + '-' + d + ' ' + h + ':' + i + ":" + s;
    };
    /**
     * @returns s 2018-12-12 或者 2018-12-12 12:12:12
     */
    TimeUtils.parseDate = function (s) {
        var t = Date.parse(s);
        if (!isNaN(t)) {
            return new Date(Date.parse(s.replace(/-/g, "/")));
        }
        else {
            return new Date();
        }
    };
    /**
     * 秒数转换为时间形式。
     * @param    time 秒数
     * @param    partition 分隔符
     * @param    showHour  是否显示小时
     * @return  返回一个以分隔符分割的时, 分, 秒
     *
     * 比如: time = 4351; secondToTime(time)返回字符串01:12:31;
     */
    TimeUtils.secondToTime = function (time, partition, showHour) {
        if (time === void 0) { time = 0; }
        if (partition === void 0) { partition = ":"; }
        if (showHour === void 0) { showHour = true; }
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor(time % 3600 / 60);
        var seconds = Math.floor(time % 3600 % 60);
        var h = hours.toString();
        var m = minutes.toString();
        var s = seconds.toString();
        if (hours < 10)
            h = "0" + h;
        if (minutes < 10)
            m = "0" + m;
        if (seconds < 10)
            s = "0" + s;
        var timeStr;
        if (showHour)
            timeStr = h + partition + m + partition + s;
        else
            timeStr = m + partition + s;
        return timeStr;
    };
    /**
     * 时间形式转换为毫秒数。
     * @param   time  以指定分隔符分割的时间字符串
     * @param   partition  分隔符
     * @return  毫秒数显示的字符串
     * @throws  Error Exception
     *
     * 用法1 trace(MillisecondTransform.timeToMillisecond("00:60:00"))
     * 输出   3600000
     *
     *
     * 用法2 trace(MillisecondTransform.timeToMillisecond("00.60.00","."))
     * 输出   3600000
     */
    TimeUtils.timeToMillisecond = function (time, partition) {
        if (partition === void 0) { partition = ":"; }
        var _ary = time.split(partition);
        var timeNum = 0;
        var len = _ary.length;
        for (var i = 0; i < len; i++) {
            var n = _ary[i];
            timeNum += n * Math.pow(60, (len - 1 - i));
        }
        timeNum *= 1000;
        return timeNum.toString();
    };
    return TimeUtils;
}());
var es;
(function (es) {
    /**
     * 开辟一个新线程
     * 注意：它无法获得主线程中的上下文
     */
    var WorkerUtils = /** @class */ (function () {
        function WorkerUtils() {
        }
        /**
         * 创建一个worker
         * @param doFunc worker所能做的事情
         */
        WorkerUtils.makeWorker = function (doFunc) {
            var worker = new Worker(URL.createObjectURL(new Blob(["(" + doFunc.toString() + ")()"])));
            return worker;
        };
        WorkerUtils.workerMessage = function (worker) {
            var _this = this;
            worker.onmessage = function (_a) {
                var _b = _a.data, result = _b.result, jobId = _b.jobId;
                if (typeof _this.pendingJobs[jobId] == 'function')
                    _this.pendingJobs[jobId](result);
                delete _this.pendingJobs[jobId];
            };
            return function () {
                var message = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    message[_i] = arguments[_i];
                }
                return new Promise(function (resolve) {
                    var jobId = _this.jobIdGen++;
                    _this.pendingJobs[jobId] = resolve;
                    worker.postMessage({ jobId: jobId, message: message });
                });
            };
        };
        /** 正在执行的队列 */
        WorkerUtils.pendingJobs = {};
        WorkerUtils.jobIdGen = 0;
        return WorkerUtils;
    }());
    es.WorkerUtils = WorkerUtils;
})(es || (es = {}));
var es;
(function (es) {
    var Graphics = /** @class */ (function () {
        function Graphics(batcher) {
            this.batcher = batcher;
        }
        return Graphics;
    }());
    es.Graphics = Graphics;
})(es || (es = {}));
var es;
(function (es) {
    var Color = /** @class */ (function () {
        /**
         * 从 r, g, b, a 创建一个新的 Color 实例
         *
         * @param r  颜色的红色分量 (0-255)
         * @param g  颜色的绿色成分 (0-255)
         * @param b  颜色的蓝色分量 (0-255)
         * @param a  颜色的 alpha 分量 (0-1.0)
         */
        function Color(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a != null ? a : 1;
        }
        /**
         * 从 r, g, b, a 创建一个新的 Color 实例
         *
         * @param r  颜色的红色分量 (0-255)
         * @param g  颜色的绿色成分 (0-255)
         * @param b  颜色的蓝色分量 (0-255)
         * @param a  颜色的 alpha 分量 (0-1.0)
         */
        Color.fromRGB = function (r, g, b, a) {
            return new Color(r, g, b, a);
        };
        /**
         * 从十六进制字符串创建一个新的 Color 实例
         *
         * @param hex  #ffffff 形式的 CSS 颜色字符串，alpha 组件是可选的
         */
        Color.createFromHex = function (hex) {
            var color = new Color(1, 1, 1);
            color.fromHex(hex);
            return color;
        };
        /**
         * 从 hsl 值创建一个新的 Color 实例
         *
         * @param h  色调表示 [0-1]
         * @param s  饱和度表示为 [0-1]
         * @param l  亮度表示 [0-1]
         * @param a  透明度表示 [0-1]
         */
        Color.fromHSL = function (h, s, l, a) {
            if (a === void 0) { a = 1.0; }
            var temp = new HSLColor(h, s, l, a);
            return temp.toRGBA();
        };
        /**
         * 将当前颜色调亮指定的量
         *
         * @param factor
         */
        Color.prototype.lighten = function (factor) {
            if (factor === void 0) { factor = 0.1; }
            var temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.l += temp.l * factor;
            return temp.toRGBA();
        };
        /**
         * 将当前颜色变暗指定的量
         *
         * @param factor
         */
        Color.prototype.darken = function (factor) {
            if (factor === void 0) { factor = 0.1; }
            var temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.l -= temp.l * factor;
            return temp.toRGBA();
        };
        /**
         * 使当前颜色饱和指定的量
         *
         * @param factor
         */
        Color.prototype.saturate = function (factor) {
            if (factor === void 0) { factor = 0.1; }
            var temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.s += temp.s * factor;
            return temp.toRGBA();
        };
        /**
         * 按指定量降低当前颜色的饱和度
         *
         * @param factor
         */
        Color.prototype.desaturate = function (factor) {
            if (factor === void 0) { factor = 0.1; }
            var temp = HSLColor.fromRGBA(this.r, this.g, this.b, this.a);
            temp.s -= temp.s * factor;
            return temp.toRGBA();
        };
        /**
         * 将一种颜色乘以另一种颜色，得到更深的颜色
         *
         * @param color
         */
        Color.prototype.mulitiply = function (color) {
            var newR = (((color.r / 255) * this.r) / 255) * 255;
            var newG = (((color.g / 255) * this.g) / 255) * 255;
            var newB = (((color.b / 255) * this.b) / 255) * 255;
            var newA = color.a * this.a;
            return new Color(newR, newG, newB, newA);
        };
        /**
         * 筛选另一种颜色，导致颜色较浅
         *
         * @param color
         */
        Color.prototype.screen = function (color) {
            var color1 = color.invert();
            var color2 = color.invert();
            return color1.mulitiply(color2).invert();
        };
        /**
         * 反转当前颜色
         */
        Color.prototype.invert = function () {
            return new Color(255 - this.r, 255 - this.g, 255 - this.b, 1.0 - this.a);
        };
        /**
         * 将当前颜色与另一个颜色平均
         *
         * @param color
         */
        Color.prototype.average = function (color) {
            var newR = (color.r + this.r) / 2;
            var newG = (color.g + this.g) / 2;
            var newB = (color.b + this.b) / 2;
            var newA = (color.a + this.a) / 2;
            return new Color(newR, newG, newB, newA);
        };
        /**
         * 返回颜色的 CSS 字符串表示形式。
         *
         * @param format
         */
        Color.prototype.toString = function (format) {
            if (format === void 0) { format = 'rgb'; }
            switch (format) {
                case 'rgb':
                    return this.toRGBA();
                case 'hsl':
                    return this.toHSLA();
                case 'hex':
                    return this.toHex();
                default:
                    throw new Error('Invalid Color format');
            }
        };
        /**
         * 返回颜色分量的十六进制值
         * @param c
         * @see https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
         */
        Color.prototype._componentToHex = function (c) {
            var hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        /**
         *返回颜色的十六进制表示
         */
        Color.prototype.toHex = function () {
            return ('#' +
                this._componentToHex(this.r) +
                this._componentToHex(this.g) +
                this._componentToHex(this.b) +
                this._componentToHex(this.a));
        };
        /**
         * 从十六进制字符串设置颜色
         *
         * @param hex  #ffffff 形式的 CSS 颜色字符串，alpha 组件是可选的
         */
        Color.prototype.fromHex = function (hex) {
            var hexRegEx = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;
            var match = hex.match(hexRegEx);
            if (match) {
                var r = parseInt(match[1], 16);
                var g = parseInt(match[2], 16);
                var b = parseInt(match[3], 16);
                var a = 1;
                if (match[4]) {
                    a = parseInt(match[4], 16) / 255;
                }
                this.r = r;
                this.g = g;
                this.b = b;
                this.a = a;
            }
            else {
                throw new Error('Invalid hex string: ' + hex);
            }
        };
        /**
         * 返回颜色的 RGBA 表示
         */
        Color.prototype.toRGBA = function () {
            var result = String(this.r.toFixed(0)) +
                ', ' +
                String(this.g.toFixed(0)) +
                ', ' +
                String(this.b.toFixed(0));
            if (this.a !== undefined || this.a != null) {
                return 'rgba(' + result + ', ' + String(this.a) + ')';
            }
            return 'rgb(' + result + ')';
        };
        /**
         * 返回颜色的 HSLA 表示
         */
        Color.prototype.toHSLA = function () {
            return HSLColor.fromRGBA(this.r, this.g, this.b, this.a).toString();
        };
        /**
         * 返回颜色的 CSS 字符串表示形式
         */
        Color.prototype.fillStyle = function () {
            return this.toString();
        };
        /**
         * 返回当前颜色的克隆
         */
        Color.prototype.clone = function () {
            return new Color(this.r, this.g, this.b, this.a);
        };
        /**
         * Black (#000000)
         */
        Color.Black = Color.createFromHex('#000000');
        /**
         * White (#FFFFFF)
         */
        Color.White = Color.createFromHex('#FFFFFF');
        /**
         * Gray (#808080)
         */
        Color.Gray = Color.createFromHex('#808080');
        /**
         * Light gray (#D3D3D3)
         */
        Color.LightGray = Color.createFromHex('#D3D3D3');
        /**
         * Dark gray (#A9A9A9)
         */
        Color.DarkGray = Color.createFromHex('#A9A9A9');
        /**
         * Yellow (#FFFF00)
         */
        Color.Yellow = Color.createFromHex('#FFFF00');
        /**
         * Orange (#FFA500)
         */
        Color.Orange = Color.createFromHex('#FFA500');
        /**
         * Red (#FF0000)
         */
        Color.Red = Color.createFromHex('#FF0000');
        /**
         * Vermillion (#FF5B31)
         */
        Color.Vermillion = Color.createFromHex('#FF5B31');
        /**
         * Rose (#FF007F)
         */
        Color.Rose = Color.createFromHex('#FF007F');
        /**
         * Magenta (#FF00FF)
         */
        Color.Magenta = Color.createFromHex('#FF00FF');
        /**
         * Violet (#7F00FF)
         */
        Color.Violet = Color.createFromHex('#7F00FF');
        /**
         * Blue (#0000FF)
         */
        Color.Blue = Color.createFromHex('#0000FF');
        /**
         * Azure (#007FFF)
         */
        Color.Azure = Color.createFromHex('#007FFF');
        /**
         * Cyan (#00FFFF)
         */
        Color.Cyan = Color.createFromHex('#00FFFF');
        /**
         * Viridian (#59978F)
         */
        Color.Viridian = Color.createFromHex('#59978F');
        /**
         * Green (#00FF00)
         */
        Color.Green = Color.createFromHex('#00FF00');
        /**
         * Chartreuse (#7FFF00)
         */
        Color.Chartreuse = Color.createFromHex('#7FFF00');
        /**
         * Transparent (#FFFFFF00)
         */
        Color.Transparent = Color.createFromHex('#FFFFFF00');
        return Color;
    }());
    es.Color = Color;
    /**
     * 内部 HSL 颜色表示
     *
     * http://en.wikipedia.org/wiki/HSL_and_HSV
     * http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
     */
    var HSLColor = /** @class */ (function () {
        function HSLColor(h, s, l, a) {
            this.h = h;
            this.s = s;
            this.l = l;
            this.a = a;
        }
        HSLColor.hue2rgb = function (p, q, t) {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1 / 6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
                return q;
            }
            if (t < 2 / 3) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
        };
        HSLColor.fromRGBA = function (r, g, b, a) {
            r /= 255;
            g /= 255;
            b /= 255;
            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);
            var h = (max + min) / 2;
            var s = h;
            var l = h;
            if (max === min) {
                h = s = 0; // achromatic
            }
            else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }
            return new HSLColor(h, s, l, a);
        };
        HSLColor.prototype.toRGBA = function () {
            var r;
            var g;
            var b;
            if (this.s === 0) {
                r = g = b = this.l; // achromatic
            }
            else {
                var q = this.l < 0.5
                    ? this.l * (1 + this.s)
                    : this.l + this.s - this.l * this.s;
                var p = 2 * this.l - q;
                r = HSLColor.hue2rgb(p, q, this.h + 1 / 3);
                g = HSLColor.hue2rgb(p, q, this.h);
                b = HSLColor.hue2rgb(p, q, this.h - 1 / 3);
            }
            return new Color(r * 255, g * 255, b * 255, this.a);
        };
        HSLColor.prototype.toString = function () {
            var h = this.h.toFixed(0);
            var s = this.s.toFixed(0);
            var l = this.l.toFixed(0);
            var a = this.a.toFixed(0);
            return "hsla(" + h + ", " + s + ", " + l + ", " + a + ")";
        };
        return HSLColor;
    }());
})(es || (es = {}));
var es;
(function (es) {
    var Renderer = /** @class */ (function () {
        function Renderer(renderOrder, camera) {
            this.renderOrder = 0;
            this.shouldDebugRender = true;
            this.renderDirty = true;
            this.renderOrder = renderOrder;
            this.camera = camera;
            es.Core.emitter.addObserver(es.CoreEvents.renderChanged, this.onRenderChanged, this);
        }
        Renderer.prototype.onAddedToScene = function (scene) { };
        Renderer.prototype.unload = function () { };
        Renderer.prototype.beginRender = function (cam) {
            if (!es.Graphics.instance)
                return;
            es.Graphics.instance.batcher.begin(cam);
        };
        Renderer.prototype.endRender = function () {
            if (!es.Graphics.instance)
                return;
            es.Graphics.instance.batcher.end();
        };
        Renderer.prototype.onRenderChanged = function () {
            this.renderDirty = true;
        };
        Renderer.prototype.renderAfterStateCheck = function (renderable, cam) {
            if (!es.Graphics.instance)
                return;
            renderable.render(es.Graphics.instance.batcher, cam);
        };
        Renderer.prototype.debugRender = function (scene) {
            if (!es.Graphics.instance)
                return;
            es.Physics.debugDraw(2);
            for (var i = 0; i < scene.entities.count; i++) {
                var entity = scene.entities.buffer[i];
                if (entity.enabled) {
                    entity.debugRender(es.Graphics.instance.batcher);
                }
            }
        };
        return Renderer;
    }());
    es.Renderer = Renderer;
})(es || (es = {}));
///<reference path="Renderer.ts" />
var es;
///<reference path="Renderer.ts" />
(function (es) {
    var DefaultRenderer = /** @class */ (function (_super) {
        __extends(DefaultRenderer, _super);
        function DefaultRenderer(renderOrder, camera) {
            if (renderOrder === void 0) { renderOrder = 0; }
            if (camera === void 0) { camera = null; }
            return _super.call(this, renderOrder, camera) || this;
        }
        DefaultRenderer.prototype.render = function (scene) {
            if (!this.renderDirty)
                return;
            this.renderDirty = false;
            var cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);
            for (var i = 0; i < scene.renderableComponents.count; i++) {
                var renderable = scene.renderableComponents.get(i);
                if (renderable.enabled && renderable.isVisibleFromCamera(scene.camera))
                    this.renderAfterStateCheck(renderable, cam);
            }
            if (this.shouldDebugRender && es.Core.debugRenderEndabled) {
                this.debugRender(scene);
            }
            this.endRender();
        };
        return DefaultRenderer;
    }(es.Renderer));
    es.DefaultRenderer = DefaultRenderer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 三次方和二次方贝塞尔帮助器(cubic and quadratic bezier helper)
     */
    var Bezier = /** @class */ (function () {
        function Bezier() {
        }
        /**
         * 求解二次曲折线
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        Bezier.getPoint = function (p0, p1, p2, t) {
            t = es.MathHelper.clamp01(t);
            var oneMinusT = 1 - t;
            return p0.scale(oneMinusT * oneMinusT)
                .addEqual(p1.scale(2 * oneMinusT * t))
                .addEqual(p2.scale(t * t));
        };
        /**
         * 求解一个立方体曲率
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        Bezier.getPointThree = function (start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            var oneMinusT = 1 - t;
            return start.scale(oneMinusT * oneMinusT * oneMinusT)
                .addEqual(firstControlPoint.scale(3 * oneMinusT * oneMinusT * t))
                .addEqual(secondControlPoint.scale(3 * oneMinusT * t * t))
                .addEqual(end.scale(t * t * t));
        };
        /**
         * 得到二次贝塞尔函数的一阶导数
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        Bezier.getFirstDerivative = function (p0, p1, p2, t) {
            return p1.sub(p0).scale(2 * (1 - t))
                .addEqual(p2.sub(p1).scale(2 * t));
        };
        /**
         * 得到一个三次贝塞尔函数的一阶导数
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        Bezier.getFirstDerivativeThree = function (start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            var oneMunusT = 1 - t;
            return firstControlPoint.sub(start).scale(3 * oneMunusT * oneMunusT)
                .addEqual(secondControlPoint.sub(firstControlPoint).scale(6 * oneMunusT * t))
                .addEqual(end.sub(secondControlPoint).scale(3 * t * t));
        };
        /**
         * 递归地细分bezier曲线，直到满足距离校正
         * 在这种算法中，平面切片的点要比曲面切片少。返回完成后应返回到ListPool的合并列表。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param distanceTolerance
         */
        Bezier.getOptimizedDrawingPoints = function (start, firstCtrlPoint, secondCtrlPoint, end, distanceTolerance) {
            if (distanceTolerance === void 0) { distanceTolerance = 1; }
            var points = es.ListPool.obtain(es.Vector2);
            points.push(start);
            this.recursiveGetOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance);
            points.push(end);
            return points;
        };
        /**
         * 递归地细分bezier曲线，直到满足距离校正。在这种算法中，平面切片的点要比曲面切片少。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param points
         * @param distanceTolerance
         */
        Bezier.recursiveGetOptimizedDrawingPoints = function (start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance) {
            // 计算线段的所有中点
            var pt12 = es.Vector2.divideScaler(start.add(firstCtrlPoint), 2);
            var pt23 = es.Vector2.divideScaler(firstCtrlPoint.add(secondCtrlPoint), 2);
            var pt34 = es.Vector2.divideScaler(secondCtrlPoint.add(end), 2);
            // 计算新半直线的中点
            var pt123 = es.Vector2.divideScaler(pt12.add(pt23), 2);
            var pt234 = es.Vector2.divideScaler(pt23.add(pt34), 2);
            // 最后再细分最后两个中点。如果我们满足我们的距离公差，这将是我们使用的最后一点。
            var pt1234 = es.Vector2.divideScaler(pt123.add(pt234), 2);
            // 试着用一条直线来近似整个三次曲线
            var deltaLine = end.sub(start);
            var d2 = Math.abs(((firstCtrlPoint.x, end.x) * deltaLine.y - (firstCtrlPoint.y - end.y) * deltaLine.x));
            var d3 = Math.abs(((secondCtrlPoint.x - end.x) * deltaLine.y - (secondCtrlPoint.y - end.y) * deltaLine.x));
            if ((d2 + d3) * (d2 + d3) < distanceTolerance * (deltaLine.x * deltaLine.x + deltaLine.y * deltaLine.y)) {
                points.push(pt1234);
                return;
            }
            // 继续细分
            this.recursiveGetOptimizedDrawingPoints(start, pt12, pt123, pt1234, points, distanceTolerance);
            this.recursiveGetOptimizedDrawingPoints(pt1234, pt234, pt34, end, points, distanceTolerance);
        };
        return Bezier;
    }());
    es.Bezier = Bezier;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 提供了一系列立方贝塞尔点，并提供了帮助方法来访问贝塞尔
     */
    var BezierSpline = /** @class */ (function () {
        function BezierSpline() {
            this._points = [];
            this._curveCount = 0;
        }
        /**
         * 在这个过程中，t被修改为在曲线段的范围内。
         * @param t
         */
        BezierSpline.prototype.pointIndexAtTime = function (t) {
            var res = { time: 0, range: 0 };
            if (t >= 1) {
                t = 1;
                res.range = this._points.length - 4;
            }
            else {
                t = es.MathHelper.clamp01(t) * this._curveCount;
                res.range = Math.floor(t);
                t -= res.range;
                res.range *= 3;
            }
            res.time = t;
            return res;
        };
        /**
         * 设置一个控制点，考虑到这是否是一个共享点，如果是，则适当调整
         * @param index
         * @param point
         */
        BezierSpline.prototype.setControlPoint = function (index, point) {
            if (index % 3 == 0) {
                var delta = point.sub(this._points[index]);
                if (index > 0)
                    this._points[index - 1].addEqual(delta);
                if (index + 1 < this._points.length)
                    this._points[index + 1].addEqual(delta);
            }
            this._points[index] = point;
        };
        /**
         * 得到时间t的贝塞尔曲线上的点
         * @param t
         */
        BezierSpline.prototype.getPointAtTime = function (t) {
            var res = this.pointIndexAtTime(t);
            var i = res.range;
            return es.Bezier.getPointThree(this._points[i], this._points[i + 1], this._points[i + 2], this._points[i + 3], t);
        };
        /**
         * 得到贝塞尔在时间t的速度（第一导数）
         * @param t
         */
        BezierSpline.prototype.getVelocityAtTime = function (t) {
            var res = this.pointIndexAtTime(t);
            var i = res.range;
            return es.Bezier.getFirstDerivativeThree(this._points[i], this._points[i + 1], this._points[i + 2], this._points[i + 3], t);
        };
        /**
         * 得到时间t时贝塞尔的方向（归一化第一导数）
         * @param t
         */
        BezierSpline.prototype.getDirectionAtTime = function (t) {
            return this.getVelocityAtTime(t).normalize();
        };
        /**
         * 在贝塞尔曲线上添加一条曲线
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         */
        BezierSpline.prototype.addCurve = function (start, firstControlPoint, secondControlPoint, end) {
            // 只有当这是第一条曲线时，我们才会添加起始点。对于其他所有的曲线，前一个曲线的终点应该等于新曲线的起点。
            if (this._points.length == 0)
                this._points.push(start);
            this._points.push(firstControlPoint);
            this._points.push(secondControlPoint);
            this._points.push(end);
            this._curveCount = (this._points.length - 1) / 3;
        };
        /**
         * 重置bezier，移除所有点
         */
        BezierSpline.prototype.reset = function () {
            this._points.length = 0;
        };
        /**
         * 将splitine分解成totalSegments部分，并返回使用线条绘制所需的所有点
         * @param totalSegments
         */
        BezierSpline.prototype.getDrawingPoints = function (totalSegments) {
            var points = [];
            for (var i = 0; i < totalSegments; i++) {
                var t = i / totalSegments;
                points[i] = this.getPointAtTime(t);
            }
            return points;
        };
        return BezierSpline;
    }());
    es.BezierSpline = BezierSpline;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 帮助处理位掩码的实用程序类
     * 除了isFlagSet之外，所有方法都期望flag参数是一个非移位的标志
     * 允许您使用普通的(0、1、2、3等)来设置/取消您的标记
     */
    var Flags = /** @class */ (function () {
        function Flags() {
        }
        /**
         * 检查位标志是否已在数值中设置
         * 检查期望标志是否已经移位
         * @param self
         * @param flag
         */
        Flags.isFlagSet = function (self, flag) {
            return (self & flag) != 0;
        };
        /**
         * 检查位标志是否在数值中设置
         * @param self
         * @param flag
         */
        Flags.isUnshiftedFlagSet = function (self, flag) {
            flag = 1 << flag;
            return (self & flag) != 0;
        };
        /**
         *  设置数值标志位，移除所有已经设置的标志
         * @param self
         * @param flag
         */
        Flags.setFlagExclusive = function (self, flag) {
            self.value = 1 << flag;
        };
        /**
         * 设置标志位
         * @param self
         * @param flag
         */
        Flags.setFlag = function (self, flag) {
            self.value = (self.value | 1 << flag);
        };
        /**
         * 取消标志位
         * @param self
         * @param flag
         */
        Flags.unsetFlag = function (self, flag) {
            flag = 1 << flag;
            self.value = (self.value & (~flag));
        };
        /**
         * 反转数值集合位
         * @param self
         */
        Flags.invertFlags = function (self) {
            self.value = ~self.value;
        };
        /**
         * 打印 number 的二进制表示。 方便调试 number 标志
         */
        Flags.binaryStringRepresentation = function (self, leftPadWidth) {
            if (leftPadWidth === void 0) { leftPadWidth = 10; }
            var str = self.toString(2);
            while (str.length < (leftPadWidth || 2)) {
                str = '0' + str;
            }
            return str;
        };
        return Flags;
    }());
    es.Flags = Flags;
})(es || (es = {}));
var es;
(function (es) {
    var MathHelper = /** @class */ (function () {
        function MathHelper() {
        }
        /**
         * 将弧度转换成角度。
         * @param radians 用弧度表示的角
         */
        MathHelper.toDegrees = function (radians) {
            return radians * 57.295779513082320876798154814105;
        };
        /**
         * 将角度转换为弧度
         * @param degrees
         */
        MathHelper.toRadians = function (degrees) {
            return degrees * 0.017453292519943295769236907684886;
        };
        /**
         * 返回由给定三角形和两个归一化重心（面积）坐标定义的点的一个轴的笛卡尔坐标
         * @param value1
         * @param value2
         * @param value3
         * @param amount1
         * @param amount2
         */
        MathHelper.barycentric = function (value1, value2, value3, amount1, amount2) {
            return value1 + (value2 - value1) * amount1 + (value3 - value1) * amount2;
        };
        /**
         * 使用指定位置执行Catmull-Rom插值
         * @param value1
         * @param value2
         * @param value3
         * @param value4
         * @param amount
         */
        MathHelper.catmullRom = function (value1, value2, value3, value4, amount) {
            // 使用来自http://www.mvps.org/directx/articles/catmull/的公式 
            var amountSquared = amount * amount;
            var amountCubed = amountSquared * amount;
            return (0.5 * (2 * value2 + (value3 - value1) * amount +
                (2 * value1 - 5 * value2 + 4 * value3 - value4) * amountSquared +
                (3 * value2 - value1 - 3 * value3 + value4) * amountCubed));
        };
        /**
         * 将值（在leftMin-leftMax范围内）映射到一个在rightMin-rightMax范围内的值
         * @param value
         * @param leftMin
         * @param leftMax
         * @param rightMin
         * @param rightMax
         */
        MathHelper.map = function (value, leftMin, leftMax, rightMin, rightMax) {
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        };
        /**
         * 将值从任意范围映射到0到1范围
         * @param value
         * @param min
         * @param max
         * @returns
         */
        MathHelper.map01 = function (value, min, max) {
            return (value - min) * 1 / (max - min);
        };
        /**
         * 将值从某个任意范围映射到1到0范围
         * 这相当于map01的取反
         * @param value
         * @param min
         * @param max
         * @returns
         */
        MathHelper.map10 = function (value, min, max) {
            return 1 - this.map01(value, min, max);
        };
        /**
         * 使用三次方程在两个值之间进行插值
         * @param value1
         * @param value2
         * @param amount
         */
        MathHelper.smoothStep = function (value1, value2, amount) {
            var result = this.clamp(amount, 0, 1);
            result = MathHelper.hermite(value1, 0, value2, 0, result);
            return result;
        };
        /**
         * 将给定角度减小到π到-π之间的值
         * @param angle
         */
        MathHelper.wrapAngle = function (angle) {
            if ((angle > -Math.PI) && (angle <= Math.PI))
                return angle;
            angle %= Math.PI * 2;
            if (angle <= -Math.PI)
                return angle + 2 * Math.PI;
            if (angle > Math.PI)
                return angle - 2 * Math.PI;
            return angle;
        };
        /**
         * 确定值是否以2为底
         * @param value
         * @returns
         */
        MathHelper.isPowerOfTwo = function (value) {
            return (value > 0) && ((value % (value - 1)) == 0);
        };
        MathHelper.lerp = function (from, to, t) {
            return from + (to - from) * this.clamp01(t);
        };
        MathHelper.betterLerp = function (a, b, t, epsilon) {
            return Math.abs(a - b) < epsilon ? b : MathHelper.lerp(a, b, t);
        };
        /**
         * 使度数的角度在a和b之间
         * 用于处理360度环绕
         * @param a
         * @param b
         * @param t
         * @returns
         */
        MathHelper.lerpAngle = function (a, b, t) {
            var num = this.repeat(b - a, 360);
            if (num > 180)
                num -= 360;
            return a + num * this.clamp01(t);
        };
        /**
         * 使弧度的角度在a和b之间
         * @param a
         * @param b
         * @param t
         * @returns
         */
        MathHelper.lerpAngleRadians = function (a, b, t) {
            var num = this.repeat(b - a, Math.PI * 2);
            if (num > Math.PI)
                num -= Math.PI * 2;
            return a + num * this.clamp01(t);
        };
        /**
         * 循环t使其不大于长度且不小于0
         * @param t
         * @param length
         * @returns
         */
        MathHelper.pingPong = function (t, length) {
            t = this.repeat(t, length * 2);
            return length - Math.abs(t - length);
        };
        /**
         * 如果value> = threshold返回其符号，否则返回0
         * @param value
         * @param threshold
         * @returns
         */
        MathHelper.signThreshold = function (value, threshold) {
            if (Math.abs(value) >= threshold)
                return Math.sign(value);
            else
                return 0;
        };
        MathHelper.inverseLerp = function (from, to, t) {
            if (from < to) {
                if (t < from)
                    return 0;
                else if (t > to)
                    return 1;
            }
            else {
                if (t < to)
                    return 1;
                else if (t > from)
                    return 0;
            }
            return (t - from) / (to - from);
        };
        /**
         * 在两个值之间线性插值
         * 此方法是MathHelper.Lerp的效率较低，更精确的版本。
         */
        MathHelper.lerpPrecise = function (value1, value2, amount) {
            return ((1 - amount) * value1) + (value2 * amount);
        };
        MathHelper.clamp = function (value, min, max) {
            if (value < min)
                return min;
            if (value > max)
                return max;
            return value;
        };
        MathHelper.snap = function (value, increment) {
            return Math.round(value / increment) * increment;
        };
        /**
         * 给定圆心、半径和角度，得到圆周上的一个点。0度是3点钟。
         * @param circleCenter
         * @param radius
         * @param angleInDegrees
         */
        MathHelper.pointOnCirlce = function (circleCenter, radius, angleInDegrees) {
            var radians = MathHelper.toRadians(angleInDegrees);
            return new es.Vector2(Math.cos(radians) * radians + circleCenter.x, Math.sin(radians) * radians + circleCenter.y);
        };
        /**
         * 如果值为偶数，返回true
         * @param value
         */
        MathHelper.isEven = function (value) {
            return value % 2 == 0;
        };
        /**
         * 如果值是奇数，则返回true
         * @param value
         * @returns
         */
        MathHelper.isOdd = function (value) {
            return value % 2 != 0;
        };
        /**
         * 将值四舍五入并返回它和四舍五入后的数值
         * @param value
         * @param roundedAmount
         * @returns
         */
        MathHelper.roundWithRoundedAmount = function (value, roundedAmount) {
            var rounded = Math.round(value);
            roundedAmount.value = value - (rounded * Math.round(value / rounded));
            return rounded;
        };
        /**
         * 数值限定在0-1之间
         * @param value
         */
        MathHelper.clamp01 = function (value) {
            if (value < 0)
                return 0;
            if (value > 1)
                return 1;
            return value;
        };
        MathHelper.angleBetweenVectors = function (from, to) {
            return Math.atan2(to.y - from.y, to.x - from.x);
        };
        MathHelper.angleToVector = function (angleRadians, length) {
            return new es.Vector2(Math.cos(angleRadians) * length, Math.sin(angleRadians) * length);
        };
        /**
         * 增加t并确保它总是大于或等于0并且小于长度
         * @param t
         * @param length
         */
        MathHelper.incrementWithWrap = function (t, length) {
            t++;
            if (t == length)
                return 0;
            return t;
        };
        /**
         * 递减t并确保其始终大于或等于0且小于长度
         * @param t
         * @param length
         * @returns
         */
        MathHelper.decrementWithWrap = function (t, length) {
            t--;
            if (t < 0)
                return length - 1;
            return t;
        };
        /**
         * 返回sqrt（x * x + y * y）
         * @param x
         * @param y
         * @returns
         */
        MathHelper.hypotenuse = function (x, y) {
            return Math.sqrt(x * x + y * y);
        };
        MathHelper.closestPowerOfTwoGreaterThan = function (x) {
            x--;
            x |= (x >> 1);
            x |= (x >> 2);
            x |= (x >> 4);
            x |= (x >> 8);
            x |= (x >> 16);
            return (x + 1);
        };
        /**
         * 以roundToNearest为步长，将值舍入到最接近的数字。例如：在125中找到127到最近的5个结果
         * @param value
         * @param roundToNearest
         */
        MathHelper.roundToNearest = function (value, roundToNearest) {
            return Math.round(value / roundToNearest) * roundToNearest;
        };
        /**
         * 检查传递的值是否在某个阈值之下。对于小规模、精确的比较很有用
         * @param value
         * @param ep
         */
        MathHelper.withinEpsilon = function (value, ep) {
            if (ep === void 0) { ep = this.Epsilon; }
            return Math.abs(value) < ep;
        };
        /**
         * 由上移量向上移。start可以小于或大于end。例如:开始是2，结束是10，移位是4，结果是6
         * @param start
         * @param end
         * @param shift
         */
        MathHelper.approach = function (start, end, shift) {
            if (start < end)
                return Math.min(start + shift, end);
            return Math.max(start - shift, end);
        };
        /**
         * 通过偏移量钳位结果并选择最短路径，将起始角度向终止角度移动，起始值可以小于或大于终止值。
         * 示例1：开始是30，结束是100，移位是25，结果为55
         * 示例2：开始是340，结束是30，移位是25，结果是5（365换为5）
         * @param start
         * @param end
         * @param shift
         * @returns
         */
        MathHelper.approachAngle = function (start, end, shift) {
            var deltaAngle = this.deltaAngle(start, end);
            if (-shift < deltaAngle && deltaAngle < shift)
                return end;
            return this.repeat(this.approach(start, start + deltaAngle, shift), 360);
        };
        /**
         * 将 Vector 投影到另一个 Vector 上
         * @param other
         */
        MathHelper.project = function (self, other) {
            var amt = self.dot(other) / other.lengthSquared();
            var vec = other.scale(amt);
            return vec;
        };
        /**
         * 通过将偏移量（全部以弧度为单位）夹住结果并选择最短路径，起始角度朝向终止角度。
         * 起始值可以小于或大于终止值。
         * 此方法的工作方式与“角度”方法非常相似，唯一的区别是使用弧度代替度，并以2 * Pi代替360。
         * @param start
         * @param end
         * @param shift
         * @returns
         */
        MathHelper.approachAngleRadians = function (start, end, shift) {
            var deltaAngleRadians = this.deltaAngleRadians(start, end);
            if (-shift < deltaAngleRadians && deltaAngleRadians < shift)
                return end;
            return this.repeat(this.approach(start, start + deltaAngleRadians, shift), Math.PI * 2);
        };
        /**
         * 使用可接受的检查公差检查两个值是否大致相同
         * @param value1
         * @param value2
         * @param tolerance
         * @returns
         */
        MathHelper.approximately = function (value1, value2, tolerance) {
            if (tolerance === void 0) { tolerance = this.Epsilon; }
            return Math.abs(value1 - value2) <= tolerance;
        };
        /**
         * 计算两个给定角之间的最短差值（度数）
         * @param current
         * @param target
         */
        MathHelper.deltaAngle = function (current, target) {
            var num = this.repeat(target - current, 360);
            if (num > 180)
                num -= 360;
            return num;
        };
        /**
         * 检查值是否介于最小值/最大值（包括最小值/最大值）之间
         * @param value
         * @param min
         * @param max
         * @returns
         */
        MathHelper.between = function (value, min, max) {
            return value >= min && value <= max;
        };
        /**
         * 计算以弧度为单位的两个给定角度之间的最短差
         * @param current
         * @param target
         * @returns
         */
        MathHelper.deltaAngleRadians = function (current, target) {
            var num = this.repeat(target - current, 2 * Math.PI);
            if (num > Math.PI)
                num -= 2 * Math.PI;
            return num;
        };
        /**
         * 循环t，使其永远不大于长度，永远不小于0
         * @param t
         * @param length
         */
        MathHelper.repeat = function (t, length) {
            return t - Math.floor(t / length) * length;
        };
        MathHelper.floorToInt = function (f) {
            return Math.trunc(Math.floor(f));
        };
        /**
         * 将值绕一圈移动的助手
         * @param position
         * @param speed
         * @returns
         */
        MathHelper.rotateAround = function (position, speed) {
            var time = es.Time.totalTime * speed;
            var x = Math.cos(time);
            var y = Math.sin(time);
            return new es.Vector2(position.x + x, position.y + y);
        };
        /**
         * 旋转是相对于当前位置而不是总旋转。
         * 例如，如果您当前处于90度并且想要旋转到135度，则可以使用45度而不是135度的角度
         * @param point
         * @param center
         * @param angleIndegrees
         */
        MathHelper.rotateAround2 = function (point, center, angleIndegrees) {
            angleIndegrees = this.toRadians(angleIndegrees);
            var cos = Math.cos(angleIndegrees);
            var sin = Math.sin(angleIndegrees);
            var rotatedX = cos * (point.x - center.x) - sin * (point.y - center.y) + center.x;
            var rotatedY = sin * (point.x - center.x) + cos * (point.y - center.y) + center.y;
            return new es.Vector2(rotatedX, rotatedY);
        };
        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0度是3点钟方向
         * @param circleCenter
         * @param radius
         * @param angleInDegrees
         */
        MathHelper.pointOnCircle = function (circleCenter, radius, angleInDegrees) {
            var radians = this.toRadians(angleInDegrees);
            return new es.Vector2(Math.cos(radians) * radius + circleCenter.x, Math.sin(radians) * radius + circleCenter.y);
        };
        /**
         * 根据圆的中心，半径和角度在圆的圆周上得到一个点。 0弧度是3点钟方向
         * @param circleCenter
         * @param radius
         * @param angleInRadians
         * @returns
         */
        MathHelper.pointOnCircleRadians = function (circleCenter, radius, angleInRadians) {
            return new es.Vector2(Math.cos(angleInRadians) * radius + circleCenter.x, Math.sin(angleInRadians) * radius + circleCenter.y);
        };
        /**
         * lissajou曲线
         * @param xFrequency
         * @param yFrequency
         * @param xMagnitude
         * @param yMagnitude
         * @param phase
         * @returns
         */
        MathHelper.lissajou = function (xFrequency, yFrequency, xMagnitude, yMagnitude, phase) {
            if (xFrequency === void 0) { xFrequency = 2; }
            if (yFrequency === void 0) { yFrequency = 3; }
            if (xMagnitude === void 0) { xMagnitude = 1; }
            if (yMagnitude === void 0) { yMagnitude = 1; }
            if (phase === void 0) { phase = 0; }
            var x = Math.sin(es.Time.totalTime * xFrequency + phase) * xMagnitude;
            var y = Math.cos(es.Time.totalTime * yFrequency) * yMagnitude;
            return new es.Vector2(x, y);
        };
        /**
         * lissajou曲线的阻尼形式，其振荡随时间在0和最大幅度之间。
         * 为获得最佳效果，阻尼应在0到1之间。
         * 振荡间隔是动画循环的一半完成的时间（以秒为单位）。
         * @param xFrequency
         * @param yFrequency
         * @param xMagnitude
         * @param yMagnitude
         * @param phase
         * @param damping
         * @param oscillationInterval
         * @returns
         */
        MathHelper.lissajouDamped = function (xFrequency, yFrequency, xMagnitude, yMagnitude, phase, damping, oscillationInterval) {
            if (xFrequency === void 0) { xFrequency = 2; }
            if (yFrequency === void 0) { yFrequency = 3; }
            if (xMagnitude === void 0) { xMagnitude = 1; }
            if (yMagnitude === void 0) { yMagnitude = 1; }
            if (phase === void 0) { phase = 0.5; }
            if (damping === void 0) { damping = 0; }
            if (oscillationInterval === void 0) { oscillationInterval = 5; }
            var wrappedTime = this.pingPong(es.Time.totalTime, oscillationInterval);
            var damped = Math.pow(Math.E, -damping * wrappedTime);
            var x = damped * Math.sin(es.Time.totalTime * xFrequency + phase) * xMagnitude;
            var y = damped * Math.cos(es.Time.totalTime * yFrequency) * yMagnitude;
            return new es.Vector2(x, y);
        };
        /**
         * 执行Hermite样条插值
         * @param value1
         * @param tangent1
         * @param value2
         * @param tangent2
         * @param amount
         * @returns
         */
        MathHelper.hermite = function (value1, tangent1, value2, tangent2, amount) {
            var v1 = value1, v2 = value2, t1 = tangent1, t2 = tangent2, s = amount, result;
            var sCubed = s * s * s;
            var sSquared = s * s;
            if (amount == 0)
                result = value1;
            else if (amount == 1)
                result = value2;
            else
                result = (2 * v1 - 2 * v2 + t2 + t1) * sCubed +
                    (3 * v2 - 3 * v1 - 2 * t1 - t2) * sSquared +
                    t1 * s +
                    v1;
            return result;
        };
        /**
         * 此函数用于确保数不是NaN或无穷大
         * @param x
         * @returns
         */
        MathHelper.isValid = function (x) {
            if (Number.isNaN(x)) {
                return false;
            }
            return x !== Infinity;
        };
        MathHelper.smoothDamp = function (current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
            smoothTime = Math.max(0.0001, smoothTime);
            var num = 2 / smoothTime;
            var num2 = num * deltaTime;
            var num3 = 1 /
                (1 + (num2 + (0.48 * (num2 * num2) + 0.235 * (num2 * (num2 * num2)))));
            var num4 = current - target;
            var num5 = target;
            var num6 = maxSpeed * smoothTime;
            num4 = this.clamp(num4, num6 * -1, num6);
            target = current - num4;
            var num7 = (currentVelocity + num * num4) * deltaTime;
            currentVelocity = (currentVelocity - num * num7) * num3;
            var num8 = target + (num4 + num7) * num3;
            if (num5 - current > 0 === num8 > num5) {
                num8 = num5;
                currentVelocity = (num8 - num5) / deltaTime;
            }
            return { value: num8, currentVelocity: currentVelocity };
        };
        MathHelper.smoothDampVector = function (current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
            var v = es.Vector2.zero;
            var resX = this.smoothDamp(current.x, target.x, currentVelocity.x, smoothTime, maxSpeed, deltaTime);
            v.x = resX.value;
            currentVelocity.x = resX.currentVelocity;
            var resY = this.smoothDamp(current.y, target.y, currentVelocity.y, smoothTime, maxSpeed, deltaTime);
            v.y = resY.value;
            currentVelocity.y = resY.currentVelocity;
            return v;
        };
        /**
         * 将值（在 leftMin - leftMax 范围内）映射到 rightMin - rightMax 范围内的值
         * @param value
         * @param leftMin
         * @param leftMax
         * @param rightMin
         * @param rightMax
         * @returns
         */
        MathHelper.mapMinMax = function (value, leftMin, leftMax, rightMin, rightMax) {
            return rightMin + ((MathHelper.clamp(value, leftMin, leftMax) - leftMin) * (rightMax - rightMin)) / (leftMax - leftMin);
        };
        MathHelper.fromAngle = function (angle) {
            return new es.Vector2(Math.cos(angle), Math.sin(angle)).normalizeEqual();
        };
        MathHelper.Epsilon = 0.00001;
        MathHelper.Rad2Deg = 57.29578;
        MathHelper.Deg2Rad = 0.0174532924;
        /**
         * 表示pi除以2的值(1.57079637)
         */
        MathHelper.PiOver2 = Math.PI / 2;
        return MathHelper;
    }());
    es.MathHelper = MathHelper;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 代表右手4x4浮点矩阵，可以存储平移、比例和旋转信息
     */
    var Matrix = /** @class */ (function () {
        function Matrix(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
            this.m11 = m11;
            this.m12 = m12;
            this.m13 = m13;
            this.m14 = m14;
            this.m21 = m21;
            this.m22 = m22;
            this.m23 = m23;
            this.m24 = m24;
            this.m31 = m31;
            this.m32 = m32;
            this.m33 = m33;
            this.m34 = m34;
            this.m41 = m41;
            this.m42 = m42;
            this.m43 = m43;
            this.m44 = m44;
        }
        Object.defineProperty(Matrix, "Identity", {
            get: function () {
                return this.identity;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 为自定义的正交视图创建一个新的投影矩阵
         * @param left
         * @param right
         * @param top
         * @param zFarPlane
         * @param result
         */
        Matrix.createOrthographicOffCenter = function (left, right, bottom, top, zNearPlane, zFarPlane, result) {
            if (result === void 0) { result = new Matrix(); }
            result.m11 = 2 / (right - left);
            result.m12 = 0;
            result.m13 = 0;
            result.m14 = 0;
            result.m21 = 0;
            result.m22 = 2 / (top - bottom);
            result.m23 = 0;
            result.m24 = 0;
            result.m31 = 0;
            result.m32 = 0;
            result.m33 = 1 / (zNearPlane - zFarPlane);
            result.m34 = 0;
            result.m41 = (left + right) / (left - right);
            result.m42 = (top + bottom) / (bottom - top);
            result.m43 = zNearPlane / (zNearPlane - zFarPlane);
            result.m44 = 1;
        };
        Matrix.createTranslation = function (position, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m13 = 0;
            result.m14 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m23 = 0;
            result.m24 = 0;
            result.m31 = 0;
            result.m32 = 0;
            result.m33 = 1;
            result.m34 = 0;
            result.m41 = position.x;
            result.m42 = position.y;
            result.m43 = 0;
            result.m44 = 1;
        };
        Matrix.createRotationZ = function (radians, result) {
            result = Matrix.Identity;
            var val1 = Math.cos(radians);
            var val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
        };
        /**
         * 创建一个新的矩阵，其中包含两个矩阵的乘法。
         * @param matrix1
         * @param matrix2
         * @param result
         */
        Matrix.multiply = function (matrix1, matrix2, result) {
            if (result === void 0) { result = new Matrix(); }
            var m11 = (((matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21)) + (matrix1.m13 * matrix2.m31)) + (matrix1.m14 * matrix2.m41);
            var m12 = (((matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22)) + (matrix1.m13 * matrix2.m32)) + (matrix1.m14 * matrix2.m42);
            var m13 = (((matrix1.m11 * matrix2.m13) + (matrix1.m12 * matrix2.m23)) + (matrix1.m13 * matrix2.m33)) + (matrix1.m14 * matrix2.m43);
            var m14 = (((matrix1.m11 * matrix2.m14) + (matrix1.m12 * matrix2.m24)) + (matrix1.m13 * matrix2.m34)) + (matrix1.m14 * matrix2.m44);
            var m21 = (((matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21)) + (matrix1.m23 * matrix2.m31)) + (matrix1.m24 * matrix2.m41);
            var m22 = (((matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22)) + (matrix1.m23 * matrix2.m32)) + (matrix1.m24 * matrix2.m42);
            var m23 = (((matrix1.m21 * matrix2.m13) + (matrix1.m22 * matrix2.m23)) + (matrix1.m23 * matrix2.m33)) + (matrix1.m24 * matrix2.m43);
            var m24 = (((matrix1.m21 * matrix2.m14) + (matrix1.m22 * matrix2.m24)) + (matrix1.m23 * matrix2.m34)) + (matrix1.m24 * matrix2.m44);
            var m31 = (((matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21)) + (matrix1.m33 * matrix2.m31)) + (matrix1.m34 * matrix2.m41);
            var m32 = (((matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22)) + (matrix1.m33 * matrix2.m32)) + (matrix1.m34 * matrix2.m42);
            var m33 = (((matrix1.m31 * matrix2.m13) + (matrix1.m32 * matrix2.m23)) + (matrix1.m33 * matrix2.m33)) + (matrix1.m34 * matrix2.m43);
            var m34 = (((matrix1.m31 * matrix2.m14) + (matrix1.m32 * matrix2.m24)) + (matrix1.m33 * matrix2.m34)) + (matrix1.m34 * matrix2.m44);
            var m41 = (((matrix1.m41 * matrix2.m11) + (matrix1.m42 * matrix2.m21)) + (matrix1.m43 * matrix2.m31)) + (matrix1.m44 * matrix2.m41);
            var m42 = (((matrix1.m41 * matrix2.m12) + (matrix1.m42 * matrix2.m22)) + (matrix1.m43 * matrix2.m32)) + (matrix1.m44 * matrix2.m42);
            var m43 = (((matrix1.m41 * matrix2.m13) + (matrix1.m42 * matrix2.m23)) + (matrix1.m43 * matrix2.m33)) + (matrix1.m44 * matrix2.m43);
            var m44 = (((matrix1.m41 * matrix2.m14) + (matrix1.m42 * matrix2.m24)) + (matrix1.m43 * matrix2.m34)) + (matrix1.m44 * matrix2.m44);
            result.m11 = m11;
            result.m12 = m12;
            result.m13 = m13;
            result.m14 = m14;
            result.m21 = m21;
            result.m22 = m22;
            result.m23 = m23;
            result.m24 = m24;
            result.m31 = m31;
            result.m32 = m32;
            result.m33 = m33;
            result.m34 = m34;
            result.m41 = m41;
            result.m42 = m42;
            result.m43 = m43;
            result.m44 = m44;
        };
        Matrix.identity = new Matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return Matrix;
    }());
    es.Matrix = Matrix;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
     */
    var Matrix2D = /** @class */ (function () {
        function Matrix2D() {
            this.m11 = 0; // x 缩放
            this.m12 = 0;
            this.m21 = 0;
            this.m22 = 0;
            this.m31 = 0;
            this.m32 = 0;
        }
        Object.defineProperty(Matrix2D, "identity", {
            /**
             * 返回标识矩阵
             */
            get: function () {
                return new Matrix2D().setIdentity();
            },
            enumerable: true,
            configurable: true
        });
        Matrix2D.prototype.setIdentity = function () {
            return this.setValues(1, 0, 0, 1, 0, 0);
        };
        Matrix2D.prototype.setValues = function (m11, m12, m21, m22, m31, m32) {
            this.m11 = m11;
            this.m12 = m12;
            this.m21 = m21;
            this.m22 = m22;
            this.m31 = m31;
            this.m32 = m32;
            return this;
        };
        Object.defineProperty(Matrix2D.prototype, "translation", {
            /**
             * 储存在该矩阵中的位置
             */
            get: function () {
                return new es.Vector2(this.m31, this.m32);
            },
            set: function (value) {
                this.m31 = value.x;
                this.m32 = value.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "rotation", {
            /**
             * 以弧度为单位的旋转，存储在这个矩阵中
             */
            get: function () {
                return Math.atan2(this.m21, this.m11);
            },
            set: function (value) {
                var val1 = Math.cos(value);
                var val2 = Math.sin(value);
                this.m11 = val1;
                this.m12 = val2;
                this.m21 = -val2;
                this.m22 = val1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "rotationDegrees", {
            /**
             * 矩阵中存储的旋转度数
             */
            get: function () {
                return es.MathHelper.toDegrees(this.rotation);
            },
            set: function (value) {
                this.rotation = es.MathHelper.toRadians(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "scale", {
            /**
             * 储存在这个矩阵中的缩放
             */
            get: function () {
                return new es.Vector2(this.m11, this.m22);
            },
            set: function (value) {
                this.m11 = value.x;
                this.m22 = value.y;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 创建一个新的围绕Z轴的旋转矩阵2D
         * @param radians
         */
        Matrix2D.createRotation = function (radians, result) {
            result.setIdentity();
            var val1 = Math.cos(radians);
            var val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = val2 * -1;
            result.m22 = val1;
        };
        Matrix2D.createRotationOut = function (radians, result) {
            var val1 = Math.cos(radians);
            var val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
        };
        /**
         * 创建一个新的缩放矩阵2D
         * @param xScale
         * @param yScale
         */
        Matrix2D.createScale = function (xScale, yScale, result) {
            result.m11 = xScale;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = yScale;
            result.m31 = 0;
            result.m32 = 0;
        };
        Matrix2D.createScaleOut = function (xScale, yScale, result) {
            result.m11 = xScale;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = yScale;
            result.m31 = 0;
            result.m32 = 0;
        };
        /**
         * 创建一个新的平移矩阵2D
         * @param xPosition
         * @param yPosition
         */
        Matrix2D.createTranslation = function (xPosition, yPosition, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m31 = xPosition;
            result.m32 = yPosition;
            return result;
        };
        Matrix2D.createTranslationOut = function (position, result) {
            result.m11 = 1;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m31 = position.x;
            result.m32 = position.y;
        };
        Matrix2D.invert = function (matrix) {
            var det = 1 / matrix.determinant();
            var result = this.identity;
            result.m11 = matrix.m22 * det;
            result.m12 = -matrix.m12 * det;
            result.m21 = -matrix.m21 * det;
            result.m22 = matrix.m11 * det;
            result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
            result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;
            return result;
        };
        /**
         * 创建一个新的matrix, 它包含两个矩阵的和。
         * @param matrix
         */
        Matrix2D.prototype.add = function (matrix) {
            this.m11 += matrix.m11;
            this.m12 += matrix.m12;
            this.m21 += matrix.m21;
            this.m22 += matrix.m22;
            this.m31 += matrix.m31;
            this.m32 += matrix.m32;
            return this;
        };
        Matrix2D.prototype.substract = function (matrix) {
            this.m11 -= matrix.m11;
            this.m12 -= matrix.m12;
            this.m21 -= matrix.m21;
            this.m22 -= matrix.m22;
            this.m31 -= matrix.m31;
            this.m32 -= matrix.m32;
            return this;
        };
        Matrix2D.prototype.divide = function (matrix) {
            this.m11 /= matrix.m11;
            this.m12 /= matrix.m12;
            this.m21 /= matrix.m21;
            this.m22 /= matrix.m22;
            this.m31 /= matrix.m31;
            this.m32 /= matrix.m32;
            return this;
        };
        Matrix2D.prototype.multiply = function (matrix) {
            var m11 = (this.m11 * matrix.m11) + (this.m12 * matrix.m21);
            var m12 = (this.m11 * matrix.m12) + (this.m12 * matrix.m22);
            var m21 = (this.m21 * matrix.m11) + (this.m22 * matrix.m21);
            var m22 = (this.m21 * matrix.m12) + (this.m22 * matrix.m22);
            var m31 = (this.m31 * matrix.m11) + (this.m32 * matrix.m21) + matrix.m31;
            var m32 = (this.m31 * matrix.m12) + (this.m32 * matrix.m22) + matrix.m32;
            this.m11 = m11;
            this.m12 = m12;
            this.m21 = m21;
            this.m22 = m22;
            this.m31 = m31;
            this.m32 = m32;
            return this;
        };
        Matrix2D.multiply = function (matrix1, matrix2, result) {
            var m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
            var m12 = (matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);
            var m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
            var m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);
            var m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
            var m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;
            result.m11 = m11;
            result.m12 = m12;
            result.m21 = m21;
            result.m22 = m22;
            result.m31 = m31;
            result.m32 = m32;
        };
        Matrix2D.prototype.determinant = function () {
            return this.m11 * this.m22 - this.m12 * this.m21;
        };
        /**
         * 创建一个新的Matrix2D，包含指定矩阵中的线性插值。
         * @param matrix1
         * @param matrix2
         * @param amount
         */
        Matrix2D.lerp = function (matrix1, matrix2, amount) {
            matrix1.m11 = matrix1.m11 + ((matrix2.m11 - matrix1.m11) * amount);
            matrix1.m12 = matrix1.m12 + ((matrix2.m12 - matrix1.m12) * amount);
            matrix1.m21 = matrix1.m21 + ((matrix2.m21 - matrix1.m21) * amount);
            matrix1.m22 = matrix1.m22 + ((matrix2.m22 - matrix1.m22) * amount);
            matrix1.m31 = matrix1.m31 + ((matrix2.m31 - matrix1.m31) * amount);
            matrix1.m32 = matrix1.m32 + ((matrix2.m32 - matrix1.m32) * amount);
            return matrix1;
        };
        /**
         * 交换矩阵的行和列
         * @param matrix
         */
        Matrix2D.transpose = function (matrix) {
            var ret = this.identity;
            ret.m11 = matrix.m11;
            ret.m12 = matrix.m21;
            ret.m21 = matrix.m12;
            ret.m22 = matrix.m22;
            ret.m31 = 0;
            ret.m32 = 0;
            return ret;
        };
        Matrix2D.prototype.mutiplyTranslation = function (x, y) {
            var trans = new Matrix2D();
            Matrix2D.createTranslation(x, y, trans);
            return es.MatrixHelper.mutiply(this, trans);
        };
        /**
         * 比较当前实例是否等于指定的Matrix2D
         * @param other
         */
        Matrix2D.prototype.equals = function (other) {
            return this == other;
        };
        Matrix2D.toMatrix = function (mat) {
            var matrix = new es.Matrix();
            matrix.m11 = mat.m11;
            matrix.m12 = mat.m12;
            matrix.m13 = 0;
            matrix.m14 = 0;
            matrix.m21 = mat.m21;
            matrix.m22 = mat.m22;
            matrix.m23 = 0;
            matrix.m24 = 0;
            matrix.m31 = 0;
            matrix.m32 = 0;
            matrix.m33 = 1;
            matrix.m34 = 0;
            matrix.m41 = mat.m31;
            matrix.m42 = mat.m32;
            matrix.m43 = 0;
            matrix.m44 = 1;
            return matrix;
        };
        Matrix2D.prototype.toString = function () {
            return "{m11:" + this.m11 + " m12:" + this.m12 + " m21:" + this.m21 + " m22:" + this.m22 + " m31:" + this.m31 + " m32:" + this.m32 + "}";
        };
        return Matrix2D;
    }());
    es.Matrix2D = Matrix2D;
})(es || (es = {}));
var es;
(function (es) {
    var MatrixHelper = /** @class */ (function () {
        function MatrixHelper() {
        }
        /**
         * 创建一个新的Matrix2D，其中包含两个矩阵的和
         * @param matrix1
         * @param matrix2
         */
        MatrixHelper.add = function (matrix1, matrix2) {
            var result = es.Matrix2D.identity;
            result.m11 = matrix1.m11 + matrix2.m11;
            result.m12 = matrix1.m12 + matrix2.m12;
            result.m21 = matrix1.m21 + matrix2.m21;
            result.m22 = matrix1.m22 + matrix2.m22;
            result.m31 = matrix1.m31 + matrix2.m31;
            result.m32 = matrix1.m32 + matrix2.m32;
            return result;
        };
        /**
         * 将一个Matrix2D的元素除以另一个矩阵的元素
         * @param matrix1
         * @param matrix2
         */
        MatrixHelper.divide = function (matrix1, matrix2) {
            var result = es.Matrix2D.identity;
            result.m11 = matrix1.m11 / matrix2.m11;
            result.m12 = matrix1.m12 / matrix2.m12;
            result.m21 = matrix1.m21 / matrix2.m21;
            result.m22 = matrix1.m22 / matrix2.m22;
            result.m31 = matrix1.m31 / matrix2.m31;
            result.m32 = matrix1.m32 / matrix2.m32;
            return result;
        };
        /**
         * 创建一个新的Matrix2D，包含两个矩阵的乘法
         * @param matrix1
         * @param matrix2
         */
        MatrixHelper.mutiply = function (matrix1, matrix2) {
            var result = es.Matrix2D.identity;
            if (matrix2 instanceof es.Matrix2D) {
                var m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
                var m12 = (matrix2.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);
                var m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
                var m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);
                var m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
                var m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;
                result.m11 = m11;
                result.m12 = m12;
                result.m21 = m21;
                result.m22 = m22;
                result.m31 = m31;
                result.m32 = m32;
            }
            else if (typeof matrix2 == "number") {
                result.m11 = matrix1.m11 * matrix2;
                result.m12 = matrix1.m12 * matrix2;
                result.m21 = matrix1.m21 * matrix2;
                result.m22 = matrix1.m22 * matrix2;
                result.m31 = matrix1.m31 * matrix2;
                result.m32 = matrix1.m32 * matrix2;
            }
            return result;
        };
        /**
         * 创建一个新的Matrix2D，包含一个矩阵与另一个矩阵的减法。
         * @param matrix1
         * @param matrix2
         */
        MatrixHelper.subtract = function (matrix1, matrix2) {
            var result = es.Matrix2D.identity;
            result.m11 = matrix1.m11 - matrix2.m11;
            result.m12 = matrix1.m12 - matrix2.m12;
            result.m21 = matrix1.m21 - matrix2.m21;
            result.m22 = matrix1.m22 - matrix2.m22;
            result.m31 = matrix1.m31 - matrix2.m31;
            result.m32 = matrix1.m32 - matrix2.m32;
            return result;
        };
        return MatrixHelper;
    }());
    es.MatrixHelper = MatrixHelper;
})(es || (es = {}));
var es;
(function (es) {
    var Rectangle = /** @class */ (function () {
        /**
         * 创建一个新的Rectanglestruct实例，指定位置、宽度和高度。
         * @param x 创建的矩形的左上角的X坐标
         * @param y 创建的矩形的左上角的y坐标
         * @param width 创建的矩形的宽度
         * @param height 创建的矩形的高度
         */
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            /**
             * 该矩形的左上角的x坐标
             */
            this.x = 0;
            /**
             * 该矩形的左上角的y坐标
             */
            this.y = 0;
            /**
             * 该矩形的宽度
             */
            this.width = 0;
            /**
             * 该矩形的高度
             */
            this.height = 0;
            // temp 用于计算边界的矩阵
            this._tempMat = new es.Matrix2D();
            this._transformMat = new es.Matrix2D();
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Object.defineProperty(Rectangle, "empty", {
            /**
             * 返回X=0, Y=0, Width=0, Height=0的矩形
             */
            get: function () {
                return new Rectangle();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle, "maxRect", {
            /**
             * 返回一个Number.Min/Max值的矩形
             */
            get: function () {
                return new Rectangle(Number.MIN_VALUE / 2, Number.MIN_VALUE / 2, Number.MAX_VALUE, Number.MAX_VALUE);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "left", {
            /**
             * 返回此矩形左边缘的X坐标
             */
            get: function () {
                return this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "right", {
            /**
             * 返回此矩形右边缘的X坐标
             */
            get: function () {
                return this.x + this.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            /**
             * 返回此矩形顶边的y坐标
             */
            get: function () {
                return this.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            /**
             * 返回此矩形底边的y坐标
             */
            get: function () {
                return this.y + this.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "max", {
            /**
             * 获取矩形的最大点，即右下角
             */
            get: function () {
                return new es.Vector2(this.right, this.bottom);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 这个矩形的宽和高是否为0，位置是否为（0，0）
         */
        Rectangle.prototype.isEmpty = function () {
            return ((((this.width == 0) && (this.height == 0)) && (this.x == 0)) && (this.y == 0));
        };
        Object.defineProperty(Rectangle.prototype, "location", {
            /** 这个矩形的左上角坐标 */
            get: function () {
                return new es.Vector2(this.x, this.y);
            },
            set: function (value) {
                this.x = value.x;
                this.y = value.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "size", {
            /**
             * 这个矩形的宽-高坐标
             */
            get: function () {
                return new es.Vector2(this.width, this.height);
            },
            set: function (value) {
                this.width = value.x;
                this.height = value.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "center", {
            /**
             * 位于这个矩形中心的一个点
             * 如果 "宽度 "或 "高度 "是奇数，则中心点将向下舍入
             */
            get: function () {
                return new es.Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param minX
         * @param minY
         * @param maxX
         * @param maxY
         */
        Rectangle.fromMinMax = function (minX, minY, maxX, maxY) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        };
        /**
         * 给定多边形的点，计算边界
         * @param points
         * @returns 来自多边形的点
         */
        Rectangle.rectEncompassingPoints = function (points) {
            // 我们需要求出x/y的最小值/最大值
            var minX = Number.POSITIVE_INFINITY;
            var minY = Number.POSITIVE_INFINITY;
            var maxX = Number.NEGATIVE_INFINITY;
            var maxY = Number.NEGATIVE_INFINITY;
            for (var i = 0; i < points.length; i++) {
                var pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMax(minX, minY, maxX, maxY);
        };
        /**
         * 获取指定边缘的位置
         * @param edge
         */
        Rectangle.prototype.getSide = function (edge) {
            switch (edge) {
                case es.Edge.top:
                    return this.top;
                case es.Edge.bottom:
                    return this.bottom;
                case es.Edge.left:
                    return this.left;
                case es.Edge.right:
                    return this.right;
                default:
                    throw new Error("Argument Out Of Range");
            }
        };
        /**
         * 获取所提供的坐标是否在这个矩形的范围内
         * @param x 检查封堵点的X坐标
         * @param y 检查封堵点的Y坐标
         */
        Rectangle.prototype.contains = function (x, y) {
            return ((((this.x <= x) && (x < (this.x + this.width))) &&
                (this.y <= y)) && (y < (this.y + this.height)));
        };
        /**
         * 按指定的水平和垂直方向调整此矩形的边缘
         * @param horizontalAmount 调整左、右边缘的值
         * @param verticalAmount 调整上、下边缘的值
         */
        Rectangle.prototype.inflate = function (horizontalAmount, verticalAmount) {
            this.x -= horizontalAmount;
            this.y -= verticalAmount;
            this.width += horizontalAmount * 2;
            this.height += verticalAmount * 2;
        };
        /**
         * 获取其他矩形是否与这个矩形相交
         * @param value 另一个用于测试的矩形
         */
        Rectangle.prototype.intersects = function (value) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        };
        Rectangle.prototype.rayIntersects = function (ray) {
            var res = { intersected: false, distance: 0 };
            var maxValue = Number.MAX_VALUE;
            if (Math.abs(ray.direction.x) < 1E-06) {
                if ((ray.start.x < this.x) || (ray.start.x > this.x + this.width))
                    return res;
            }
            else {
                var num11 = 1 / ray.direction.x;
                var num8 = (this.x - ray.start.x) * num11;
                var num7 = (this.x + this.width - ray.start.x) * num11;
                if (num8 > num7) {
                    var num14 = num8;
                    num8 = num7;
                    num7 = num14;
                }
                res.distance = Math.max(num8, res.distance);
                maxValue = Math.min(num7, maxValue);
                if (res.distance > maxValue)
                    return res;
            }
            if (Math.abs(ray.direction.y) < 1e-06) {
                if ((ray.start.y < this.y) || (ray.start.y > this.y + this.height))
                    return res;
            }
            else {
                var num10 = 1 / ray.direction.y;
                var num6 = (this.y - ray.start.y) * num10;
                var num5 = (this.y + this.height - ray.start.y) * num10;
                if (num6 > num5) {
                    var num13 = num6;
                    num6 = num5;
                    num5 = num13;
                }
                res.distance = Math.max(num6, res.distance);
                maxValue = Math.max(num5, maxValue);
                if (res.distance > maxValue)
                    return res;
            }
            res.intersected = true;
            return res;
        };
        /**
         * 获取所提供的矩形是否在此矩形的边界内
         * @param value
         */
        Rectangle.prototype.containsRect = function (value) {
            return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
                (this.y <= value.y)) &&
                (value.y < (this.y + this.height)));
        };
        Rectangle.prototype.getHalfSize = function () {
            return new es.Vector2(this.width * 0.5, this.height * 0.5);
        };
        Rectangle.prototype.getClosestPointOnBoundsToOrigin = function () {
            var max = this.max;
            var minDist = Math.abs(this.location.x);
            var boundsPoint = new es.Vector2(this.location.x, 0);
            if (Math.abs(max.x) < minDist) {
                minDist = Math.abs(max.x);
                boundsPoint.x = max.x;
                boundsPoint.y = 0;
            }
            if (Math.abs(max.y) < minDist) {
                minDist = Math.abs(max.y);
                boundsPoint.x = 0;
                boundsPoint.y = max.y;
            }
            if (Math.abs(this.location.y) < minDist) {
                minDist = Math.abs(this.location.y);
                boundsPoint.x = 0;
                boundsPoint.y = this.location.y;
            }
            return boundsPoint;
        };
        /**
         * 返回离给定点最近的点
         * @param point 矩形上离点最近的点
         */
        Rectangle.prototype.getClosestPointOnRectangleToPoint = function (point) {
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            var res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
            return res;
        };
        /**
         * 获取矩形边界上与给定点最近的点
         * @param point
         * @param edgeNormal
         * @returns 矩形边框上离点最近的点
         */
        Rectangle.prototype.getClosestPointOnRectangleBorderToPoint = function (point, edgeNormal) {
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            var res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
            // 如果点在矩形内，我们需要将res推到边界上，因为它将在矩形内
            if (this.contains(res.x, res.y)) {
                var dl = res.x - this.left;
                var dr = this.right - res.x;
                var dt = res.y - this.top;
                var db = this.bottom - res.y;
                var min = Math.min(dl, dr, dt, db);
                if (min == dt) {
                    res.y = this.top;
                    edgeNormal.y = -1;
                }
                else if (min == db) {
                    res.y = this.bottom;
                    edgeNormal.y = 1;
                }
                else if (min == dl) {
                    res.x = this.left;
                    edgeNormal.x = -1;
                }
                else {
                    res.x = this.right;
                    edgeNormal.x = 1;
                }
            }
            else {
                if (res.x == this.left)
                    edgeNormal.x = -1;
                if (res.x == this.right)
                    edgeNormal.x = 1;
                if (res.y == this.top)
                    edgeNormal.y = -1;
                if (res.y == this.bottom)
                    edgeNormal.y = 1;
            }
            return res;
        };
        /**
         * 创建一个新的RectangleF，该RectangleF包含两个其他矩形的重叠区域
         * @param value1
         * @param value2
         * @returns 将两个矩形的重叠区域作为输出参数
         */
        Rectangle.intersect = function (value1, value2) {
            if (value1.intersects(value2)) {
                var right_side = Math.min(value1.x + value1.width, value2.x + value2.width);
                var left_side = Math.max(value1.x, value2.x);
                var top_side = Math.max(value1.y, value2.y);
                var bottom_side = Math.min(value1.y + value1.height, value2.y + value2.height);
                return new Rectangle(left_side, top_side, right_side - left_side, bottom_side - top_side);
            }
            else {
                return new Rectangle(0, 0, 0, 0);
            }
        };
        /**
         * 改变这个矩形的位置
         * @param offsetX 要添加到这个矩形的X坐标
         * @param offsetY 要添加到这个矩形的y坐标
         */
        Rectangle.prototype.offset = function (offsetX, offsetY) {
            this.x += offsetX;
            this.y += offsetY;
        };
        /**
         * 创建一个完全包含两个其他矩形的新矩形
         * @param value1
         * @param value2
         */
        Rectangle.union = function (value1, value2) {
            var x = Math.min(value1.x, value2.x);
            var y = Math.min(value1.y, value2.y);
            return new Rectangle(x, y, Math.max(value1.right, value2.right) - x, Math.max(value1.bottom, value2.bottom) - y);
        };
        /**
         * 在矩形重叠的地方创建一个新的矩形
         * @param value1
         * @param value2
         */
        Rectangle.overlap = function (value1, value2) {
            var x = Math.max(value1.x, value2.x, 0);
            var y = Math.max(value1.y, value2.y, 0);
            return new Rectangle(x, y, Math.max(Math.min(value1.right, value2.right) - x, 0), Math.max(Math.min(value1.bottom, value2.bottom) - y, 0));
        };
        Rectangle.prototype.calculateBounds = function (parentPosition, position, origin, scale, rotation, width, height) {
            if (rotation == 0) {
                this.x = Math.trunc(parentPosition.x + position.x - origin.x * scale.x);
                this.y = Math.trunc(parentPosition.y + position.y - origin.y * scale.y);
                this.width = Math.trunc(width * scale.x);
                this.height = Math.trunc(height * scale.y);
            }
            else {
                // 我们需要找到我们的绝对最小/最大值，并据此创建边界
                var worldPosX = parentPosition.x + position.x;
                var worldPosY = parentPosition.y + position.y;
                // 考虑到原点，将参考点设置为世界参考
                es.Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y, this._transformMat);
                es.Matrix2D.createScale(scale.x, scale.y, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                es.Matrix2D.createRotation(rotation, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                es.Matrix2D.createTranslation(worldPosX, worldPosY, this._tempMat);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                // TODO: 我们可以把世界变换留在矩阵中，避免在世界空间中得到所有的四个角
                var topLeft = new es.Vector2(worldPosX, worldPosY);
                var topRight = new es.Vector2(worldPosX + width, worldPosY);
                var bottomLeft = new es.Vector2(worldPosX, worldPosY + height);
                var bottomRight = new es.Vector2(worldPosX + width, worldPosY + height);
                es.Vector2Ext.transformR(topLeft, this._transformMat, topLeft);
                es.Vector2Ext.transformR(topRight, this._transformMat, topRight);
                es.Vector2Ext.transformR(bottomLeft, this._transformMat, bottomLeft);
                es.Vector2Ext.transformR(bottomRight, this._transformMat, bottomRight);
                // 找出最小值和最大值，这样我们就可以计算出我们的边界框。
                var minX = Math.trunc(Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                var maxX = Math.trunc(Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                var minY = Math.trunc(Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                var maxY = Math.trunc(Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                this.location = new es.Vector2(minX, minY);
                this.width = Math.trunc(maxX - minX);
                this.height = Math.trunc(maxY - minY);
            }
        };
        /**
         * 返回一个横跨当前矩形和提供的三角形位置的矩形
         * @param deltaX
         * @param deltaY
         */
        Rectangle.prototype.getSweptBroadphaseBounds = function (deltaX, deltaY) {
            var broadphasebox = Rectangle.empty;
            broadphasebox.x = deltaX > 0 ? this.x : this.x + deltaX;
            broadphasebox.y = deltaY > 0 ? this.y : this.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + this.width : this.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + this.height : this.height - deltaY;
            return broadphasebox;
        };
        /**
         * 如果发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param other
         * @param moveX
         * @param moveY
         */
        Rectangle.prototype.collisionCheck = function (other, moveX, moveY) {
            moveX.value = moveY.value = 0;
            var l = other.x - (this.x + this.width);
            var r = (other.x + other.width) - this.x;
            var t = (other.y - (this.y + this.height));
            var b = (other.y + other.height) - this.y;
            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;
            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;
            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;
            return true;
        };
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形/相交的哪些边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.Zero
         */
        Rectangle.getIntersectionDepth = function (rectA, rectB) {
            // 计算半尺寸
            var halfWidthA = rectA.width / 2;
            var halfHeightA = rectA.height / 2;
            var halfWidthB = rectB.width / 2;
            var halfHeightB = rectB.height / 2;
            // 计算中心
            var centerA = new es.Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            var centerB = new es.Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);
            // 计算当前中心间的距离和最小非相交距离
            var distanceX = centerA.x - centerB.x;
            var distanceY = centerA.y - centerB.y;
            var minDistanceX = halfWidthA + halfWidthB;
            var minDistanceY = halfHeightA + halfHeightB;
            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return es.Vector2.zero;
            // 计算并返回交叉点深度
            var depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            var depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
            return new es.Vector2(depthX, depthY);
        };
        /**
         * 比较当前实例是否等于指定的矩形
         * @param other
         */
        Rectangle.prototype.equals = function (other) {
            return this === other;
        };
        /**
         * 获取这个矩形的哈希码
         */
        Rectangle.prototype.getHashCode = function () {
            return (Math.trunc(this.x) ^ Math.trunc(this.y) ^ Math.trunc(this.width) ^ Math.trunc(this.height));
        };
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        return Rectangle;
    }());
    es.Rectangle = Rectangle;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中
     * 一般用法如下:
     *
     *  let deltaMove = this.velocity * es.Time.deltaTime;
     *  deltaMove.x = this._x.update(deltaMove.x);
     *  deltaMove.y = this._y.update(deltaMove.y);
     */
    var SubpixelFloat = /** @class */ (function () {
        function SubpixelFloat() {
            this.remainder = 0;
        }
        /**
         * 以amount递增余数，将值截断，存储新的余数并将amount设置为当前值
         * @param amount
         */
        SubpixelFloat.prototype.update = function (amount) {
            this.remainder += amount;
            var motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            amount = motion;
            return amount;
        };
        /**
         * 将余数重置为0
         */
        SubpixelFloat.prototype.reset = function () {
            this.remainder = 0;
        };
        return SubpixelFloat;
    }());
    es.SubpixelFloat = SubpixelFloat;
})(es || (es = {}));
var es;
(function (es) {
    var SubpixelVector2 = /** @class */ (function () {
        function SubpixelVector2() {
            this._x = new es.SubpixelFloat();
            this._y = new es.SubpixelFloat();
        }
        /**
         * 以数量递增s/y余数，将值截断为整数，存储新的余数并将amount设置为当前值
         * @param amount
         */
        SubpixelVector2.prototype.update = function (amount) {
            amount.x = this._x.update(amount.x);
            amount.y = this._y.update(amount.y);
        };
        /**
         * 将余数重置为0
         */
        SubpixelVector2.prototype.reset = function () {
            this._x.reset();
            this._y.reset();
        };
        return SubpixelVector2;
    }());
    es.SubpixelVector2 = SubpixelVector2;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    var ColliderTriggerHelper = /** @class */ (function () {
        function ColliderTriggerHelper(entity) {
            /** 存储当前帧中发生的所有活动交点对 */
            this._activeTriggerIntersections = new es.PairSet();
            /** 存储前一帧的交点对，这样我们就可以在移动这一帧后检测到退出 */
            this._previousTriggerIntersections = new es.PairSet();
            this._tempTriggerList = [];
            this._entity = entity;
        }
        /**
         * update应该在实体被移动后被调用，它将处理任何与Colllider重叠的ITriggerListeners。
         * 它将处理任何与Collider重叠的ITriggerListeners。
         */
        ColliderTriggerHelper.prototype.update = function () {
            var e_9, _a;
            var lateColliders = [];
            // 对所有实体.colliders进行重叠检查，这些实体.colliders是触发器，与所有宽相碰撞器，无论是否触发器。   
            // 任何重叠都会导致触发事件
            var colliders = this.getColliders();
            for (var i = 0; i < colliders.length; i++) {
                var collider = colliders[i];
                var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider, collider.bounds, collider.collidesWithLayers.value);
                for (var j = 0; j < neighbors.length; j++) {
                    var neighbor = neighbors[j];
                    // 我们至少需要一个碰撞器作为触发器
                    if (!collider.isTrigger && !neighbor.isTrigger)
                        continue;
                    if (collider.overlaps(neighbor)) {
                        var pair = new es.Pair(collider, neighbor);
                        // 如果我们的某一个集合中已经有了这个对子（前一个或当前的触发交叉点），就不要调用输入事件了
                        var shouldReportTriggerEvent = !this._activeTriggerIntersections.has(pair) &&
                            !this._previousTriggerIntersections.has(pair);
                        if (shouldReportTriggerEvent) {
                            if (neighbor.castSortOrder >= es.Collider.lateSortOrder) {
                                lateColliders.push(pair);
                            }
                            else {
                                this.notifyTriggerListeners(pair, true);
                            }
                        }
                        this._activeTriggerIntersections.add(pair);
                    }
                }
            }
            try {
                for (var lateColliders_1 = __values(lateColliders), lateColliders_1_1 = lateColliders_1.next(); !lateColliders_1_1.done; lateColliders_1_1 = lateColliders_1.next()) {
                    var pair = lateColliders_1_1.value;
                    this.notifyTriggerListeners(pair, true);
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (lateColliders_1_1 && !lateColliders_1_1.done && (_a = lateColliders_1.return)) _a.call(lateColliders_1);
                }
                finally { if (e_9) throw e_9.error; }
            }
            this.checkForExitedColliders();
        };
        ColliderTriggerHelper.prototype.getColliders = function () {
            var colliders = [];
            for (var i = 0; i < this._entity.components.buffer.length; i++) {
                var component = this._entity.components.buffer[i];
                if (component instanceof es.Collider) {
                    colliders.push(component);
                }
            }
            return colliders;
        };
        ColliderTriggerHelper.prototype.checkForExitedColliders = function () {
            var _this = this;
            // 删除所有与此帧交互的触发器，留下我们退出的触发器
            this._previousTriggerIntersections.except(this._activeTriggerIntersections);
            var all = this._previousTriggerIntersections.all;
            all.forEach(function (pair) {
                _this.notifyTriggerListeners(pair, false);
            });
            this._previousTriggerIntersections.clear();
            // 添加所有当前激活的触发器
            this._previousTriggerIntersections.union(this._activeTriggerIntersections);
            // 清空活动集，为下一帧做准备
            this._activeTriggerIntersections.clear();
        };
        ColliderTriggerHelper.prototype.notifyTriggerListeners = function (collisionPair, isEntering) {
            es.TriggerListenerHelper.getITriggerListener(collisionPair.first.entity, this._tempTriggerList);
            for (var i = 0; i < this._tempTriggerList.length; i++) {
                if (isEntering) {
                    this._tempTriggerList[i].onTriggerEnter(collisionPair.second, collisionPair.first);
                }
                else {
                    this._tempTriggerList[i].onTriggerExit(collisionPair.second, collisionPair.first);
                }
                this._tempTriggerList.length = 0;
                if (collisionPair.second.entity) {
                    es.TriggerListenerHelper.getITriggerListener(collisionPair.second.entity, this._tempTriggerList);
                    for (var i_1 = 0; i_1 < this._tempTriggerList.length; i_1++) {
                        if (isEntering) {
                            this._tempTriggerList[i_1].onTriggerEnter(collisionPair.first, collisionPair.second);
                        }
                        else {
                            this._tempTriggerList[i_1].onTriggerExit(collisionPair.first, collisionPair.second);
                        }
                    }
                    this._tempTriggerList.length = 0;
                }
            }
        };
        return ColliderTriggerHelper;
    }());
    es.ColliderTriggerHelper = ColliderTriggerHelper;
})(es || (es = {}));
var es;
(function (es) {
    var PointSectors;
    (function (PointSectors) {
        PointSectors[PointSectors["center"] = 0] = "center";
        PointSectors[PointSectors["top"] = 1] = "top";
        PointSectors[PointSectors["bottom"] = 2] = "bottom";
        PointSectors[PointSectors["topLeft"] = 9] = "topLeft";
        PointSectors[PointSectors["topRight"] = 5] = "topRight";
        PointSectors[PointSectors["left"] = 8] = "left";
        PointSectors[PointSectors["right"] = 4] = "right";
        PointSectors[PointSectors["bottomLeft"] = 10] = "bottomLeft";
        PointSectors[PointSectors["bottomRight"] = 6] = "bottomRight";
    })(PointSectors = es.PointSectors || (es.PointSectors = {}));
    var Collisions = /** @class */ (function () {
        function Collisions() {
        }
        Collisions.lineToLine = function (a1, a2, b1, b2) {
            var b = a2.sub(a1);
            var d = b2.sub(b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            var c = b1.sub(a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1) {
                return false;
            }
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1) {
                return false;
            }
            return true;
        };
        Collisions.lineToLineIntersection = function (a1, a2, b1, b2, intersection) {
            if (intersection === void 0) { intersection = es.Vector2.zero; }
            intersection.x = 0;
            intersection.y = 0;
            var b = a2.sub(a1);
            var d = b2.sub(b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            var c = b1.sub(a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            var temp = a1.add(b.scale(t));
            intersection.x = temp.x;
            intersection.y = temp.y;
            return true;
        };
        Collisions.closestPointOnLine = function (lineA, lineB, closestTo) {
            var v = lineB.sub(lineA);
            var w = closestTo.sub(lineA);
            var t = w.dot(v) / v.dot(v);
            t = es.MathHelper.clamp(t, 0, 1);
            return lineA.add(v.scale(t));
        };
        Collisions.circleToCircle = function (circleCenter1, circleRadius1, circleCenter2, circleRadius2) {
            return es.Vector2.sqrDistance(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
        };
        Collisions.circleToLine = function (circleCenter, radius, lineFrom, lineTo) {
            return es.Vector2.sqrDistance(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
        };
        Collisions.circleToPoint = function (circleCenter, radius, point) {
            return es.Vector2.sqrDistance(circleCenter, point) < radius * radius;
        };
        Collisions.rectToCircle = function (rect, cPosition, cRadius) {
            // 检查矩形是否包含圆的中心点
            if (this.rectToPoint(rect.x, rect.y, rect.width, rect.height, cPosition))
                return true;
            // 对照相关边缘检查圆圈
            var edgeFrom;
            var edgeTo;
            var sector = this.getSector(rect.x, rect.y, rect.width, rect.height, cPosition);
            if ((sector & PointSectors.top) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.bottom) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y + rect.width);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.left) !== 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y);
                edgeTo = new es.Vector2(rect.x, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.right) !== 0) {
                edgeFrom = new es.Vector2(rect.x + rect.width, rect.y);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            return false;
        };
        Collisions.rectToLine = function (rect, lineFrom, lineTo) {
            var fromSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineFrom);
            var toSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineTo);
            if (fromSector == PointSectors.center || toSector == PointSectors.center) {
                return true;
            }
            else if ((fromSector & toSector) != 0) {
                return false;
            }
            else {
                var both = fromSector | toSector;
                // 线对边进行检查
                var edgeFrom = void 0;
                var edgeTo = void 0;
                if ((both & PointSectors.top) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y);
                    if (this.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.bottom) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y + rect.height);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                    if (this.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.left) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y);
                    edgeTo = new es.Vector2(rect.x, rect.y + rect.height);
                    if (this.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.right) != 0) {
                    edgeFrom = new es.Vector2(rect.x + rect.width, rect.y);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                    if (this.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
            }
            return false;
        };
        Collisions.rectToPoint = function (rX, rY, rW, rH, point) {
            return point.x >= rX && point.y >= rY && point.x < rX + rW && point.y < rY + rH;
        };
        /**
         * 位标志和帮助使用Cohen–Sutherland算法
         *
         * 位标志:
         * 1001 1000 1010
         * 0001 0000 0010
         * 0101 0100 0110
         * @param rX
         * @param rY
         * @param rW
         * @param rH
         * @param point
         */
        Collisions.getSector = function (rX, rY, rW, rH, point) {
            var sector = PointSectors.center;
            if (point.x < rX)
                sector |= PointSectors.left;
            else if (point.x >= rX + rW)
                sector |= PointSectors.right;
            if (point.y < rY)
                sector |= PointSectors.top;
            else if (point.y >= rY + rH)
                sector |= PointSectors.bottom;
            return sector;
        };
        return Collisions;
    }());
    es.Collisions = Collisions;
})(es || (es = {}));
var es;
(function (es) {
    var RaycastHit = /** @class */ (function () {
        function RaycastHit(collider, fraction, distance, point, normal) {
            /**
             * 撞击发生时沿射线的距离。
             */
            this.fraction = 0;
            /**
             * 从射线原点到碰撞点的距离
             */
            this.distance = 0;
            /**
             * 世界空间中光线击中对撞机表面的点
             */
            this.point = es.Vector2.zero;
            /**
             * 被射线击中的表面的法向量
             */
            this.normal = es.Vector2.zero;
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.centroid = es.Vector2.zero;
        }
        RaycastHit.prototype.setAllValues = function (collider, fraction, distance, point, normal) {
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.normal = normal;
        };
        RaycastHit.prototype.setValues = function (fraction, distance, point, normal) {
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.normal = normal;
        };
        RaycastHit.prototype.reset = function () {
            this.collider = null;
            this.fraction = this.distance = 0;
        };
        RaycastHit.prototype.clone = function () {
            var hit = new RaycastHit();
            hit.setAllValues(this.collider, this.fraction, this.distance, this.point, this.normal);
            return hit;
        };
        RaycastHit.prototype.toString = function () {
            return "[RaycastHit] fraction: " + this.fraction + ", distance: " + this.distance + ", normal: " + this.normal + ", centroid: " + this.centroid + ", point: " + this.point;
        };
        return RaycastHit;
    }());
    es.RaycastHit = RaycastHit;
})(es || (es = {}));
///<reference path="./RaycastHit.ts" />
var es;
///<reference path="./RaycastHit.ts" />
(function (es) {
    var Physics = /** @class */ (function () {
        function Physics() {
        }
        Physics.reset = function () {
            this._spatialHash = new es.SpatialHash(this.spatialHashCellSize);
            this._hitArray[0].reset();
            this._colliderArray[0] = null;
        };
        /**
         * 从SpatialHash中移除所有碰撞器
         */
        Physics.clear = function () {
            this._spatialHash.clear();
        };
        Physics.debugDraw = function (secondsToDisplay) {
            if (this.debugRender)
                this._spatialHash.debugDraw(secondsToDisplay);
        };
        /**
         * 检查是否有对撞机落在一个圆形区域内。返回遇到的第一个对撞机
         * @param center
         * @param radius
         * @param layerMask
         */
        Physics.overlapCircle = function (center, radius, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            this._colliderArray[0] = null;
            this._spatialHash.overlapCircle(center, radius, this._colliderArray, layerMask);
            return this._colliderArray[0];
        };
        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param center
         * @param randius
         * @param results
         * @param layerMask
         */
        Physics.overlapCircleAll = function (center, radius, results, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            return this._spatialHash.overlapCircle(center, radius, results, layerMask);
        };
        /**
         * 返回所有碰撞器与边界相交的碰撞器。bounds。请注意，这是一个broadphase检查，所以它只检查边界，不做单个碰撞到碰撞器的检查!
         * @param rect
         * @param layerMask
         */
        Physics.boxcastBroadphase = function (rect, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            return this._spatialHash.aabbBroadphase(rect, null, layerMask);
        };
        /**
         * 返回所有被边界交错的碰撞器，但不包括传入的碰撞器（self）。
         * 如果你想为其他查询自己创建扫描边界，这个方法很有用
         * @param collider
         * @param rect
         * @param layerMask
         */
        Physics.boxcastBroadphaseExcludingSelf = function (collider, rect, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        };
        /**
         * 返回所有边界与 collider.bounds 相交的碰撞器，但不包括传入的碰撞器(self)
         * @param collider
         * @param layerMask
         */
        Physics.boxcastBroadphaseExcludingSelfNonRect = function (collider, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            var bounds = collider.bounds;
            return this._spatialHash.aabbBroadphase(bounds, collider, layerMask);
        };
        /**
         * 返回所有被 collider.bounds 扩展为包含 deltaX/deltaY 的碰撞器，但不包括传入的碰撞器（self）
         * @param collider
         * @param deltaX
         * @param deltaY
         * @param layerMask
         */
        Physics.boxcastBroadphaseExcludingSelfDelta = function (collider, deltaX, deltaY, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            var colliderBounds = collider.bounds;
            var sweptBounds = colliderBounds.getSweptBroadphaseBounds(deltaX, deltaY);
            return this._spatialHash.aabbBroadphase(sweptBounds, collider, layerMask);
        };
        /**
         * 将对撞机添加到物理系统中
         * @param collider
         */
        Physics.addCollider = function (collider) {
            Physics._spatialHash.register(collider);
        };
        /**
         * 从物理系统中移除对撞机
         * @param collider
         */
        Physics.removeCollider = function (collider) {
            Physics._spatialHash.remove(collider);
        };
        /**
         * 更新物理系统中对撞机的位置。这实际上只是移除然后重新添加带有新边界的碰撞器
         * @param collider
         */
        Physics.updateCollider = function (collider) {
            this._spatialHash.remove(collider);
            this._spatialHash.register(collider);
        };
        /**
         * 返回与layerMask匹配的碰撞器的第一次命中
         * @param start
         * @param end
         * @param layerMask
         */
        Physics.linecast = function (start, end, layerMask, ignoredColliders) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            if (ignoredColliders === void 0) { ignoredColliders = null; }
            this._hitArray[0].reset();
            this.linecastAll(start, end, this._hitArray, layerMask);
            this._hitArray[0].reset();
            Physics.linecastAll(start, end, this._hitArray, layerMask, ignoredColliders);
            return this._hitArray[0].clone();
        };
        /**
         * 通过空间散列强制执行一行，并用该行命中的任何碰撞器填充hits数组
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        Physics.linecastAll = function (start, end, hits, layerMask, ignoredColliders) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            if (ignoredColliders === void 0) { ignoredColliders = null; }
            return this._spatialHash.linecast(start, end, hits, layerMask, ignoredColliders);
        };
        /**
         * 检查是否有对撞机落在一个矩形区域中
         * @param rect
         * @param layerMask
         */
        Physics.overlapRectangle = function (rect, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            this._colliderArray[0] = null;
            this._spatialHash.overlapRectangle(rect, this._colliderArray, layerMask);
            return this._colliderArray[0];
        };
        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect
         * @param results
         * @param layerMask
         */
        Physics.overlapRectangleAll = function (rect, results, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            if (results.length == 0) {
                console.warn("传入了一个空的结果数组。不会返回任何结果");
                return 0;
            }
            return this._spatialHash.overlapRectangle(rect, results, layerMask);
        };
        /** 用于在全局范围内存储重力值的方便字段 */
        Physics.gravity = new es.Vector2(0, -300);
        /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
        Physics.spatialHashCellSize = 100;
        /** 接受layerMask的所有方法的默认值 */
        Physics.allLayers = -1;
        /**
         * raycast是否检测配置为触发器的碰撞器
         */
        Physics.raycastsHitTriggers = false;
        /**
         * 在碰撞器中开始的射线/直线是否强制转换检测到那些碰撞器
         */
        Physics.raycastsStartInColliders = false;
        Physics.debugRender = false;
        /**
         * 我们保留它以避免在每次raycast发生时分配它
         */
        Physics._hitArray = [
            new es.RaycastHit()
        ];
        /**
         * 避免重叠检查和形状投射的分配
         */
        Physics._colliderArray = [
            null
        ];
        return Physics;
    }());
    es.Physics = Physics;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 不是真正的射线(射线只有开始和方向)，作为一条线和射线。
     */
    var Ray2D = /** @class */ (function () {
        function Ray2D(pos, end) {
            this._start = pos.clone();
            this._end = end.clone();
            this._direction = this._end.sub(this._start);
        }
        Object.defineProperty(Ray2D.prototype, "start", {
            get: function () {
                return this._start;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ray2D.prototype, "direction", {
            get: function () {
                return this._direction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ray2D.prototype, "end", {
            get: function () {
                return this._end;
            },
            enumerable: true,
            configurable: true
        });
        return Ray2D;
    }());
    es.Ray2D = Ray2D;
})(es || (es = {}));
var es;
(function (es) {
    var SpatialHash = /** @class */ (function () {
        function SpatialHash(cellSize) {
            if (cellSize === void 0) { cellSize = 100; }
            this.gridBounds = new es.Rectangle();
            /**
             * 重叠检查缓存框
             */
            this._overlapTestBox = new es.Box(0, 0);
            /**
             * 重叠检查缓存圈
             */
            this._overlapTestCircle = new es.Circle(0);
            /**
             * 保存所有数据的字典
             */
            this._cellDict = new NumberDictionary();
            /**
             * 用于返回冲突信息的共享HashSet
             */
            this._tempHashSet = new Set();
            this._cellSize = cellSize;
            this._inverseCellSize = 1 / this._cellSize;
            this._raycastParser = new RaycastResultParser();
        }
        /**
         * 将对象添加到SpatialHash
         * @param collider
         */
        SpatialHash.prototype.register = function (collider) {
            var bounds = collider.bounds.clone();
            collider.registeredPhysicsBounds = bounds;
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            // 更新边界以跟踪网格大小
            if (!this.gridBounds.contains(p1.x, p1.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p1);
            }
            if (!this.gridBounds.contains(p2.x, p2.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p2);
            }
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    // 如果没有单元格，我们需要创建它
                    var c = this.cellAtPosition(x, y, true);
                    c.push(collider);
                }
            }
        };
        /**
         * 从SpatialHash中删除对象
         * @param collider
         */
        SpatialHash.prototype.remove = function (collider) {
            var bounds = collider.registeredPhysicsBounds.clone();
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    // 单元格应该始终存在，因为这个碰撞器应该在所有查询的单元格中
                    var cell = this.cellAtPosition(x, y);
                    es.Insist.isNotNull(cell, "\u4ECE\u4E0D\u5B58\u5728\u78B0\u649E\u5668\u7684\u5355\u5143\u683C\u4E2D\u79FB\u9664\u78B0\u649E\u5668: [" + collider + "]");
                    if (cell != null)
                        new es.List(cell).remove(collider);
                }
            }
        };
        /**
         * 使用蛮力方法从SpatialHash中删除对象
         * @param obj
         */
        SpatialHash.prototype.removeWithBruteForce = function (obj) {
            this._cellDict.remove(obj);
        };
        SpatialHash.prototype.clear = function () {
            this._cellDict.clear();
        };
        SpatialHash.prototype.debugDraw = function (secondsToDisplay) {
            for (var x = this.gridBounds.x; x <= this.gridBounds.right; x++) {
                for (var y = this.gridBounds.y; y <= this.gridBounds.bottom; y++) {
                    var cell = this.cellAtPosition(x, y);
                    if (cell != null && cell.length > 0)
                        this.debugDrawCellDetails(x, y, secondsToDisplay);
                }
            }
        };
        SpatialHash.prototype.debugDrawCellDetails = function (x, y, secondsToDisplay) {
            if (secondsToDisplay === void 0) { secondsToDisplay = 0.5; }
            es.Graphics.instance.batcher.drawHollowRect(x * this._cellSize, y * this._cellSize, this._cellSize, this._cellSize, new es.Color(255, 0, 0), secondsToDisplay);
            es.Graphics.instance.batcher.end();
        };
        /**
         * 返回边框与单元格相交的所有对象
         * @param bounds
         * @param excludeCollider
         * @param layerMask
         */
        SpatialHash.prototype.aabbBroadphase = function (bounds, excludeCollider, layerMask) {
            this._tempHashSet.clear();
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    var cell = this.cellAtPosition(x, y);
                    if (!cell)
                        continue;
                    // 当cell不为空。循环并取回所有碰撞器
                    for (var i = 0; i < cell.length; i++) {
                        var collider = cell[i];
                        // 如果它是自身或者如果它不匹配我们的层掩码 跳过这个碰撞器
                        if (collider == excludeCollider || !es.Flags.isFlagSet(layerMask, collider.physicsLayer.value))
                            continue;
                        if (bounds.intersects(collider.bounds)) {
                            this._tempHashSet.add(collider);
                        }
                    }
                }
            }
            return Array.from(this._tempHashSet);
        };
        /**
         * 通过空间散列投掷一条线，并将该线碰到的任何碰撞器填入碰撞数组
         * https://github.com/francisengelmann/fast_voxel_traversal/blob/master/main.cpp
         * http://www.cse.yorku.ca/~amana/research/grid.pdf
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        SpatialHash.prototype.linecast = function (start, end, hits, layerMask, ignoredColliders) {
            var ray = new es.Ray2D(start, end);
            this._raycastParser.start(ray, hits, layerMask, ignoredColliders);
            // 获取我们的起始/结束位置，与我们的网格在同一空间内
            var currentCell = this.cellCoords(start.x, start.y);
            var lastCell = this.cellCoords(end.x, end.y);
            // 我们向什么方向递增单元格检查？
            var stepX = Math.sign(ray.direction.x);
            var stepY = Math.sign(ray.direction.y);
            // 我们要确保，如果我们在同一条线上或同一排上，就不会踩到不必要的方向上
            if (currentCell.x == lastCell.x)
                stepX = 0;
            if (currentCell.y == lastCell.y)
                stepY = 0;
            // 计算单元格的边界。
            // 当步长为正数时，下一个单元格在这个单元格之后，意味着我们要加1。
            var xStep = stepX < 0 ? 0 : stepX;
            var yStep = stepY < 0 ? 0 : stepY;
            var nextBoundaryX = (currentCell.x + xStep) * this._cellSize;
            var nextBoundaryY = (currentCell.y + yStep) * this._cellSize;
            // 确定射线穿过第一个垂直体素边界时的t值，y/水平也是如此。
            // 这两个值的最小值将表明我们可以沿着射线移动多少，并且仍然保持在当前的体素中，对于接近垂直/水平的射线可能是无限的。
            var tMaxX = ray.direction.x != 0 ? (nextBoundaryX - ray.start.x) / ray.direction.x : Number.MAX_VALUE;
            var tMaxY = ray.direction.y != 0 ? (nextBoundaryY - ray.start.y) / ray.direction.y : Number.MAX_VALUE;
            // 我们要走多远才能从一个单元格的边界穿过一个单元格
            var tDeltaX = ray.direction.x != 0 ? this._cellSize / (ray.direction.x * stepX) : Number.MAX_VALUE;
            var tDeltaY = ray.direction.y != 0 ? this._cellSize / (ray.direction.y * stepY) : Number.MAX_VALUE;
            // 开始遍历并返回交叉单元格。
            var cell = this.cellAtPosition(currentCell.x, currentCell.y);
            if (cell != null && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                this._raycastParser.reset();
                return this._raycastParser.hitCounter;
            }
            while (currentCell.x != lastCell.x || currentCell.y != lastCell.y) {
                if (tMaxX < tMaxY) {
                    currentCell.x = es.MathHelper.approach(currentCell.x, lastCell.x, Math.abs(stepX));
                    tMaxX += tDeltaX;
                }
                else {
                    currentCell.y = es.MathHelper.approach(currentCell.y, lastCell.y, Math.abs(stepY));
                    tMaxY += tDeltaY;
                }
                cell = this.cellAtPosition(currentCell.x, currentCell.y);
                if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                    this._raycastParser.reset();
                    return this._raycastParser.hitCounter;
                }
            }
            // 复位
            this._raycastParser.reset();
            return this._raycastParser.hitCounter;
        };
        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect
         * @param results
         * @param layerMask
         */
        SpatialHash.prototype.overlapRectangle = function (rect, results, layerMask) {
            var e_10, _a;
            this._overlapTestBox.updateBox(rect.width, rect.height);
            this._overlapTestBox.position = rect.location.clone();
            var resultCounter = 0;
            var potentials = this.aabbBroadphase(rect, null, layerMask);
            try {
                for (var potentials_1 = __values(potentials), potentials_1_1 = potentials_1.next(); !potentials_1_1.done; potentials_1_1 = potentials_1.next()) {
                    var collider = potentials_1_1.value;
                    if (collider instanceof es.BoxCollider) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                    else if (collider instanceof es.CircleCollider) {
                        if (es.Collisions.rectToCircle(rect, collider.bounds.center, collider.bounds.width * 0.5)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else if (collider instanceof es.PolygonCollider) {
                        if (collider.shape.overlaps(this._overlapTestBox)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else {
                        throw new Error("overlapRectangle对这个类型没有实现!");
                    }
                    if (resultCounter == results.length)
                        return resultCounter;
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (potentials_1_1 && !potentials_1_1.done && (_a = potentials_1.return)) _a.call(potentials_1);
                }
                finally { if (e_10) throw e_10.error; }
            }
            return resultCounter;
        };
        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param circleCenter
         * @param radius
         * @param results
         * @param layerMask
         */
        SpatialHash.prototype.overlapCircle = function (circleCenter, radius, results, layerMask) {
            var e_11, _a;
            var bounds = new es.Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);
            this._overlapTestCircle.radius = radius;
            this._overlapTestCircle.position = circleCenter;
            var resultCounter = 0;
            var potentials = this.aabbBroadphase(bounds, null, layerMask);
            try {
                for (var potentials_2 = __values(potentials), potentials_2_1 = potentials_2.next(); !potentials_2_1.done; potentials_2_1 = potentials_2.next()) {
                    var collider = potentials_2_1.value;
                    if (collider instanceof es.BoxCollider) {
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else if (collider instanceof es.CircleCollider) {
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else if (collider instanceof es.PolygonCollider) {
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    }
                    else {
                        throw new Error("对这个对撞机类型的overlapCircle没有实现!");
                    }
                    // 如果我们所有的结果数据有了则返回
                    if (resultCounter === results.length)
                        return resultCounter;
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (potentials_2_1 && !potentials_2_1.done && (_a = potentials_2.return)) _a.call(potentials_2);
                }
                finally { if (e_11) throw e_11.error; }
            }
            return resultCounter;
        };
        /**
         * 获取单元格的x,y值作为世界空间的x,y值
         * @param x
         * @param y
         */
        SpatialHash.prototype.cellCoords = function (x, y) {
            return new es.Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
        };
        /**
         * 获取世界空间x,y值的单元格。
         * 如果单元格为空且createCellIfEmpty为true，则会创建一个新的单元格
         * @param x
         * @param y
         * @param createCellIfEmpty
         */
        SpatialHash.prototype.cellAtPosition = function (x, y, createCellIfEmpty) {
            if (createCellIfEmpty === void 0) { createCellIfEmpty = false; }
            var cell = this._cellDict.tryGetValue(x, y);
            if (!cell) {
                if (createCellIfEmpty) {
                    cell = [];
                    this._cellDict.add(x, y, cell);
                }
            }
            return cell;
        };
        return SpatialHash;
    }());
    es.SpatialHash = SpatialHash;
    var NumberDictionary = /** @class */ (function () {
        function NumberDictionary() {
            this._store = new Map();
        }
        NumberDictionary.prototype.add = function (x, y, list) {
            this._store.set(this.getKey(x, y), list);
        };
        /**
         * 使用蛮力方法从字典存储列表中移除碰撞器
         * @param obj
         */
        NumberDictionary.prototype.remove = function (obj) {
            this._store.forEach(function (list) {
                var linqList = new es.List(list);
                if (linqList.contains(obj))
                    linqList.remove(obj);
            });
        };
        NumberDictionary.prototype.tryGetValue = function (x, y) {
            return this._store.get(this.getKey(x, y));
        };
        NumberDictionary.prototype.getKey = function (x, y) {
            return x + "_" + y;
        };
        /**
         * 清除字典数据
         */
        NumberDictionary.prototype.clear = function () {
            this._store.clear();
        };
        return NumberDictionary;
    }());
    es.NumberDictionary = NumberDictionary;
    var RaycastResultParser = /** @class */ (function () {
        function RaycastResultParser() {
            this._tempHit = new es.RaycastHit();
            this._checkedColliders = [];
            this._cellHits = [];
        }
        RaycastResultParser.prototype.start = function (ray, hits, layerMask, ignoredColliders) {
            this._ray = ray;
            this._hits = hits;
            this._layerMask = layerMask;
            this._ignoredColliders = ignoredColliders;
            this.hitCounter = 0;
        };
        /**
         * 如果hits数组被填充，返回true。单元格不能为空!
         * @param cellX
         * @param cellY
         * @param cell
         */
        RaycastResultParser.prototype.checkRayIntersection = function (cellX, cellY, cell) {
            for (var i = 0; i < cell.length; i++) {
                var potential = cell[i];
                // 管理我们已经处理过的碰撞器
                if (new es.List(this._checkedColliders).contains(potential))
                    continue;
                this._checkedColliders.push(potential);
                // 只有当我们被设置为这样做时才会点击触发器
                if (potential.isTrigger && !es.Physics.raycastsHitTriggers)
                    continue;
                // 确保碰撞器在图层蒙版上
                if (!es.Flags.isFlagSet(this._layerMask, potential.physicsLayer.value))
                    continue;
                if (this._ignoredColliders && this._ignoredColliders.has(potential)) {
                    continue;
                }
                // TODO: rayIntersects的性能够吗?需要测试它。Collisions.rectToLine可能更快
                // TODO: 如果边界检查返回更多数据，我们就不需要为BoxCollider检查做任何事情
                // 在做形状测试之前先做一个边界检查
                var colliderBounds = potential.bounds;
                var res = colliderBounds.rayIntersects(this._ray);
                if (res.intersected && res.distance <= 1) {
                    if (potential.shape.collidesWithLine(this._ray.start, this._ray.end, this._tempHit)) {
                        // 检查一下，我们应该排除这些射线，射线cast是否在碰撞器中开始
                        if (!es.Physics.raycastsStartInColliders && potential.shape.containsPoint(this._ray.start))
                            continue;
                        // TODO: 确保碰撞点在当前单元格中，如果它没有保存它以供以后计算
                        this._tempHit.collider = potential;
                        this._cellHits.push(this._tempHit);
                    }
                }
            }
            if (this._cellHits.length === 0)
                return false;
            // 所有处理单元完成。对结果进行排序并将命中结果打包到结果数组中
            this._cellHits.sort(RaycastResultParser.compareRaycastHits);
            for (var i = 0; i < this._cellHits.length; i++) {
                this._hits[this.hitCounter] = this._cellHits[i];
                // 增加命中计数器，如果它已经达到数组大小的限制，我们就完成了
                this.hitCounter++;
                if (this.hitCounter === this._hits.length)
                    return true;
            }
            return false;
        };
        RaycastResultParser.prototype.reset = function () {
            this._hits = null;
            this._checkedColliders.length = 0;
            this._cellHits.length = 0;
            this._ignoredColliders = null;
        };
        RaycastResultParser.compareRaycastHits = function (a, b) {
            if (a.distance !== b.distance) {
                return a.distance - b.distance;
            }
            else {
                return a.collider.castSortOrder - b.collider.castSortOrder;
            }
        };
        return RaycastResultParser;
    }());
    es.RaycastResultParser = RaycastResultParser;
})(es || (es = {}));
var es;
(function (es) {
    var Shape = /** @class */ (function () {
        function Shape() {
        }
        return Shape;
    }());
    es.Shape = Shape;
})(es || (es = {}));
///<reference path="./Shape.ts" />
var es;
///<reference path="./Shape.ts" />
(function (es) {
    /**
     * 多边形
     */
    var Polygon = /** @class */ (function (_super) {
        __extends(Polygon, _super);
        /**
         * 从点构造一个多边形
         * 多边形应该以顺时针方式指定 不能重复第一个/最后一个点，它们以0 0为中心
         * @param points
         * @param isBox
         */
        function Polygon(points, isBox) {
            var _this = _super.call(this) || this;
            _this._areEdgeNormalsDirty = true;
            _this.isUnrotated = true;
            _this.setPoints(points);
            _this.isBox = isBox;
            return _this;
        }
        Polygon.prototype.create = function (vertCount, radius) {
            Polygon.buildSymmetricalPolygon(vertCount, radius);
        };
        Object.defineProperty(Polygon.prototype, "edgeNormals", {
            /**
             * 边缘法线用于SAT碰撞检测。缓存它们用于避免squareRoots
             * box只有两个边缘 因为其他两边是平行的
             */
            get: function () {
                if (this._areEdgeNormalsDirty)
                    this.buildEdgeNormals();
                return this._edgeNormals;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 重置点并重新计算中心和边缘法线
         * @param points
         */
        Polygon.prototype.setPoints = function (points) {
            var _this = this;
            this.points = points;
            this.recalculateCenterAndEdgeNormals();
            this._originalPoints = [];
            this.points.forEach(function (p) {
                _this._originalPoints.push(p.clone());
            });
        };
        /**
         * 重新计算多边形中心
         * 如果点数改变必须调用该方法
         */
        Polygon.prototype.recalculateCenterAndEdgeNormals = function () {
            this._polygonCenter = Polygon.findPolygonCenter(this.points);
            this._areEdgeNormalsDirty = true;
        };
        /**
         * 建立多边形边缘法线
         * 它们仅由edgeNormals getter惰性创建和更新
         */
        Polygon.prototype.buildEdgeNormals = function () {
            // 对于box 我们只需要两条边，因为另外两条边是平行的
            var totalEdges = this.isBox ? 2 : this.points.length;
            if (this._edgeNormals == undefined || this._edgeNormals.length != totalEdges)
                this._edgeNormals = new Array(totalEdges);
            var p2;
            for (var i = 0; i < totalEdges; i++) {
                var p1 = this.points[i];
                if (i + 1 >= this.points.length)
                    p2 = this.points[0];
                else
                    p2 = this.points[i + 1];
                var perp = es.Vector2Ext.perpendicular(p1, p2);
                es.Vector2Ext.normalize(perp);
                this._edgeNormals[i] = perp;
            }
        };
        /**
         * 建立一个对称的多边形(六边形，八角形，n角形)并返回点
         * @param vertCount
         * @param radius
         */
        Polygon.buildSymmetricalPolygon = function (vertCount, radius) {
            var verts = new Array(vertCount);
            for (var i = 0; i < vertCount; i++) {
                var a = 2 * Math.PI * (i / vertCount);
                verts[i] = new es.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
            }
            return verts;
        };
        /**
         * 重定位多边形的点
         * @param points
         */
        Polygon.recenterPolygonVerts = function (points) {
            var center = this.findPolygonCenter(points);
            for (var i = 0; i < points.length; i++)
                points[i] = points[i].sub(center);
        };
        /**
         * 找到多边形的中心。注意，这对于正则多边形是准确的。不规则多边形没有中心。
         * @param points
         */
        Polygon.findPolygonCenter = function (points) {
            var x = 0, y = 0;
            for (var i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }
            return new es.Vector2(x / points.length, y / points.length);
        };
        /**
         * 不知道辅助顶点，所以取每个顶点，如果你知道辅助顶点，执行climbing算法
         * @param points
         * @param direction
         */
        Polygon.getFarthestPointInDirection = function (points, direction) {
            var index = 0;
            var maxDot = points[index].dot(direction);
            for (var i = 1; i < points.length; i++) {
                var dot = points[i].dot(direction);
                if (dot > maxDot) {
                    maxDot = dot;
                    index = i;
                }
            }
            return points[index];
        };
        /**
         * 迭代多边形的所有边，并得到任意边上离点最近的点。
         * 通过最近点的平方距离和它所在的边的法线返回。
         * 点应该在多边形的空间中(点-多边形.位置)
         * @param points
         * @param point
         * @param distanceSquared
         * @param edgeNormal
         */
        Polygon.getClosestPointOnPolygonToPoint = function (points, point) {
            var res = {
                distanceSquared: Number.MAX_VALUE,
                edgeNormal: es.Vector2.zero,
                closestPoint: es.Vector2.zero,
            };
            var tempDistanceSquared = 0;
            for (var i = 0; i < points.length; i++) {
                var j = i + 1;
                if (j === points.length)
                    j = 0;
                var closest = es.ShapeCollisionsCircle.closestPointOnLine(points[i], points[j], point);
                tempDistanceSquared = es.Vector2.sqrDistance(point, closest);
                if (tempDistanceSquared < res.distanceSquared) {
                    res.distanceSquared = tempDistanceSquared;
                    res.closestPoint = closest;
                    // 求直线的法线
                    var line = points[j].sub(points[i]);
                    res.edgeNormal.x = line.y;
                    res.edgeNormal.y = -line.x;
                }
            }
            res.edgeNormal = res.edgeNormal.normalize();
            return res;
        };
        /**
         * 旋转原始点并复制旋转的值到旋转的点
         * @param radians
         * @param originalPoints
         * @param rotatedPoints
         */
        Polygon.rotatePolygonVerts = function (radians, originalPoints, rotatedPoints) {
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            for (var i = 0; i < originalPoints.length; i++) {
                var position = originalPoints[i];
                rotatedPoints[i] = new es.Vector2(position.x * cos + position.y * -sin, position.x * sin + position.y * cos);
            }
        };
        Polygon.prototype.recalculateBounds = function (collider) {
            var _this = this;
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心，我们会从那开始
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                var hasUnitScale = true;
                var tempMat = new es.Matrix2D();
                var combinedMatrix_1 = new es.Matrix2D();
                es.Matrix2D.createTranslation(this._polygonCenter.x * -1, this._polygonCenter.y * -1, combinedMatrix_1);
                if (!collider.entity.transform.scale.equals(es.Vector2.one)) {
                    es.Matrix2D.createScale(collider.entity.scale.x, collider.entity.scale.y, tempMat);
                    es.Matrix2D.multiply(combinedMatrix_1, tempMat, combinedMatrix_1);
                    hasUnitScale = false;
                    // 缩放偏移量并将其设置为中心。如果我们有旋转，它会在下面重置
                    var scaledOffset = new es.Vector2(collider.localOffset.x * collider.entity.scale.x, collider.localOffset.y * collider.entity.scale.y);
                    this.center = scaledOffset;
                }
                if (collider.entity.transform.rotation != 0) {
                    es.Matrix2D.createRotation(es.MathHelper.Deg2Rad * collider.entity.rotation, tempMat);
                    es.Matrix2D.multiply(combinedMatrix_1, tempMat, combinedMatrix_1);
                    // 为了处理偏移原点的旋转我们只需要将圆心在(0,0)附近移动
                    // 我们的偏移使角度为0我们还需要处理这里的比例所以我们先对偏移进行缩放以得到合适的长度。
                    var offsetAngle = Math.atan2(collider.localOffset.y * collider.entity.transform.scale.y, collider.localOffset.x * collider.entity.transform.scale.x) * es.MathHelper.Rad2Deg;
                    var offsetLength = hasUnitScale ? collider._localOffsetLength :
                        collider.localOffset.multiply(collider.entity.transform.scale).magnitude();
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotationDegrees + offsetAngle);
                }
                es.Matrix2D.createTranslation(this._polygonCenter.x, this._polygonCenter.y, tempMat);
                es.Matrix2D.multiply(combinedMatrix_1, tempMat, combinedMatrix_1);
                // 最后变换原始点
                this.points = [];
                this._originalPoints.forEach(function (p) {
                    _this.points.push(p.transform(combinedMatrix_1));
                });
                this.isUnrotated = collider.entity.transform.rotation == 0;
                // 如果旋转的话，我们只需要重建边的法线
                if (collider._isRotationDirty)
                    this._areEdgeNormalsDirty = true;
            }
            this.position = collider.transform.position.add(this.center);
            this.bounds = es.Rectangle.rectEncompassingPoints(this.points);
            this.bounds.location = this.bounds.location.add(this.position);
        };
        Polygon.prototype.overlaps = function (other) {
            var result = new es.CollisionResult();
            if (other instanceof Polygon)
                return es.ShapeCollisionsPolygon.polygonToPolygon(this, other, result);
            if (other instanceof es.Circle) {
                if (es.ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error("overlaps of Pologon to " + other + " are not supported");
        };
        Polygon.prototype.collidesWithShape = function (other, result) {
            if (other instanceof Polygon) {
                return es.ShapeCollisionsPolygon.polygonToPolygon(this, other, result);
            }
            if (other instanceof es.Circle) {
                if (es.ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error("overlaps of Polygon to " + other + " are not supported");
        };
        Polygon.prototype.collidesWithLine = function (start, end, hit) {
            return es.ShapeCollisionsLine.lineToPoly(start, end, this, hit);
        };
        /**
         * 本质上，这个算法所做的就是从一个点发射一条射线。
         * 如果它与奇数条多边形边相交，我们就知道它在多边形内部。
         * @param point
         */
        Polygon.prototype.containsPoint = function (point) {
            // 将点归一化到多边形坐标空间中
            point = point.sub(this.position);
            var isInside = false;
            for (var i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
                if (((this.points[i].y > point.y) !== (this.points[j].y > point.y)) &&
                    (point.x < (this.points[j].x - this.points[i].x) * (point.y - this.points[i].y) / (this.points[j].y - this.points[i].y) +
                        this.points[i].x)) {
                    isInside = !isInside;
                }
            }
            return isInside;
        };
        Polygon.prototype.pointCollidesWithShape = function (point, result) {
            return es.ShapeCollisionsPoint.pointToPoly(point, this, result);
        };
        return Polygon;
    }(es.Shape));
    es.Polygon = Polygon;
})(es || (es = {}));
///<reference path="./Polygon.ts" />
var es;
///<reference path="./Polygon.ts" />
(function (es) {
    /**
     * 多边形的特殊情况。在进行SAT碰撞检查时，我们只需要检查2个轴而不是8个轴
     */
    var Box = /** @class */ (function (_super) {
        __extends(Box, _super);
        function Box(width, height) {
            var _this = _super.call(this, Box.buildBox(width, height), true) || this;
            _this.width = width;
            _this.height = height;
            return _this;
        }
        /**
         * 在一个盒子的形状中建立多边形需要的点的帮助方法
         * @param width
         * @param height
         */
        Box.buildBox = function (width, height) {
            // 我们在(0,0)的中心周围创建点
            var halfWidth = width / 2;
            var halfHeight = height / 2;
            var verts = new Array(4);
            verts[0] = new es.Vector2(-halfWidth, -halfHeight);
            verts[1] = new es.Vector2(halfWidth, -halfHeight);
            verts[2] = new es.Vector2(halfWidth, halfHeight);
            verts[3] = new es.Vector2(-halfWidth, halfHeight);
            return verts;
        };
        /**
         * 更新框点，重新计算中心，设置宽度/高度
         * @param width
         * @param height
         */
        Box.prototype.updateBox = function (width, height) {
            this.width = width;
            this.height = height;
            // 我们在(0,0)的中心周围创建点
            var halfWidth = width / 2;
            var halfHeight = height / 2;
            this.points[0] = new es.Vector2(-halfWidth, -halfHeight);
            this.points[1] = new es.Vector2(halfWidth, -halfHeight);
            this.points[2] = new es.Vector2(halfWidth, halfHeight);
            this.points[3] = new es.Vector2(-halfWidth, halfHeight);
            for (var i = 0; i < this.points.length; i++)
                this._originalPoints[i] = this.points[i];
        };
        Box.prototype.overlaps = function (other) {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (this.isUnrotated) {
                if (other instanceof Box && other.isUnrotated)
                    return this.bounds.intersects(other.bounds);
                if (other instanceof es.Circle)
                    return es.Collisions.rectToCircle(this.bounds, other.position, other.radius);
            }
            return _super.prototype.overlaps.call(this, other);
        };
        Box.prototype.collidesWithShape = function (other, result) {
            // 特殊情况，这一个高性能方式实现，其他情况则使用polygon方法检测
            if (other instanceof Box && other.isUnrotated) {
                return es.ShapeCollisionsBox.boxToBox(this, other, result);
            }
            // TODO: 让 minkowski 运行于 cricleToBox
            return _super.prototype.collidesWithShape.call(this, other, result);
        };
        Box.prototype.containsPoint = function (point) {
            if (this.isUnrotated)
                return this.bounds.contains(point.x, point.y);
            return _super.prototype.containsPoint.call(this, point);
        };
        Box.prototype.pointCollidesWithShape = function (point, result) {
            if (this.isUnrotated)
                return es.ShapeCollisionsPoint.pointToBox(point, this, result);
            return _super.prototype.pointCollidesWithShape.call(this, point, result);
        };
        return Box;
    }(es.Polygon));
    es.Box = Box;
})(es || (es = {}));
///<reference path="./Shape.ts" />
var es;
///<reference path="./Shape.ts" />
(function (es) {
    var Circle = /** @class */ (function (_super) {
        __extends(Circle, _super);
        function Circle(radius) {
            var _this = _super.call(this) || this;
            _this.radius = radius;
            _this._originalRadius = radius;
            return _this;
        }
        Circle.prototype.recalculateBounds = function (collider) {
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                // 我们只将直线缩放为一个圆，所以我们将使用最大值
                var scale = collider.entity.transform.scale;
                var hasUnitScale = scale.x === 1 && scale.y === 1;
                var maxScale = Math.max(scale.x, scale.y);
                this.radius = this._originalRadius * maxScale;
                if (collider.entity.transform.rotation !== 0) {
                    // 为了处理偏移原点的旋转，我们只需要将圆心围绕(0,0)在一个圆上移动，我们的偏移量就是0角
                    var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * es.MathHelper.Rad2Deg;
                    var offsetLength = hasUnitScale ? collider._localOffsetLength : collider.localOffset.multiply(collider.entity.transform.scale).magnitude();
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
                }
            }
            this.position = collider.transform.position.add(this.center);
            this.bounds = new es.Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        };
        Circle.prototype.overlaps = function (other) {
            var result = new es.CollisionResult();
            if (other instanceof es.Box && other.isUnrotated)
                return es.Collisions.rectToCircle(other.bounds, this.position, this.radius);
            if (other instanceof Circle)
                return es.Collisions.circleToCircle(this.position, this.radius, other.position, other.radius);
            if (other instanceof es.Polygon)
                return es.ShapeCollisionsCircle.circleToPolygon(this, other, result);
            throw new Error("overlaps of circle to " + other + " are not supported");
        };
        Circle.prototype.collidesWithShape = function (other, result) {
            if (other instanceof es.Box && other.isUnrotated) {
                return es.ShapeCollisionsCircle.circleToBox(this, other, result);
            }
            if (other instanceof Circle) {
                return es.ShapeCollisionsCircle.circleToCircle(this, other, result);
            }
            if (other instanceof es.Polygon) {
                return es.ShapeCollisionsCircle.circleToPolygon(this, other, result);
            }
            throw new Error("Collisions of Circle to " + other + " are not supported");
        };
        Circle.prototype.collidesWithLine = function (start, end, hit) {
            return es.ShapeCollisionsLine.lineToCircle(start, end, this, hit);
        };
        Circle.prototype.getPointAlongEdge = function (angle) {
            return new es.Vector2(this.position.x + this.radius * Math.cos(angle), this.position.y + this.radius * Math.sin(angle));
        };
        /**
         * 获取所提供的点是否在此范围内
         * @param point
         */
        Circle.prototype.containsPoint = function (point) {
            return (point.sub(this.position)).lengthSquared() <= this.radius * this.radius;
        };
        Circle.prototype.pointCollidesWithShape = function (point, result) {
            return es.ShapeCollisionsPoint.pointToCircle(point, this, result);
        };
        return Circle;
    }(es.Shape));
    es.Circle = Circle;
})(es || (es = {}));
var es;
(function (es) {
    var CollisionResult = /** @class */ (function () {
        function CollisionResult() {
            /**
             * 被形状击中的表面的法向量
             */
            this.normal = es.Vector2.zero;
            /**
             * 应用于第一个形状以推入形状的转换
             */
            this.minimumTranslationVector = es.Vector2.zero;
            /**
             * 不是所有冲突类型都使用!在依赖这个字段之前，请检查ShapeCollisions切割类!
             */
            this.point = es.Vector2.zero;
        }
        CollisionResult.prototype.reset = function () {
            this.collider = null;
            this.normal.setTo(0, 0);
            this.minimumTranslationVector.setTo(0, 0);
            if (this.point) {
                this.point.setTo(0, 0);
            }
        };
        CollisionResult.prototype.cloneTo = function (cr) {
            cr.collider = this.collider;
            cr.normal.setTo(this.normal.x, this.normal.y);
            cr.minimumTranslationVector.setTo(this.minimumTranslationVector.x, this.minimumTranslationVector.y);
            if (this.point) {
                if (!cr.point) {
                    cr.point = new es.Vector2(0, 0);
                }
                cr.point.setTo(this.point.x, this.point.y);
            }
        };
        /**
         * 改变最小平移向量，如果没有相同方向上的运动，它将移除平移的x分量。
         * @param deltaMovement
         */
        CollisionResult.prototype.removeHorizontalTranslation = function (deltaMovement) {
            // 检查是否需要横向移动，如果需要，移除并固定响应
            if (Math.sign(this.normal.x) !== Math.sign(deltaMovement.x) || (deltaMovement.x === 0 && this.normal.x !== 0)) {
                var responseDistance = this.minimumTranslationVector.magnitude();
                var fix = responseDistance / this.normal.y;
                // 检查一些边界情况。因为我们除以法线 使得x == 1和一个非常小的y这将导致一个巨大的固定值
                if (Math.abs(this.normal.x) != 1 && Math.abs(fix) < Math.abs(deltaMovement.y * 3)) {
                    this.minimumTranslationVector = new es.Vector2(0, -fix);
                }
            }
        };
        CollisionResult.prototype.invertResult = function () {
            this.minimumTranslationVector = this.minimumTranslationVector.negate();
            this.normal = this.normal.negate();
        };
        CollisionResult.prototype.toString = function () {
            return "[CollisionResult] normal: " + this.normal + ", minimumTranslationVector: " + this.minimumTranslationVector;
        };
        return CollisionResult;
    }());
    es.CollisionResult = CollisionResult;
})(es || (es = {}));
var es;
(function (es) {
    var RealtimeCollisions = /** @class */ (function () {
        function RealtimeCollisions() {
        }
        RealtimeCollisions.intersectMovingCircleBox = function (s, b, movement, time) {
            // 计算将b按球面半径r扩大后的AABB
            var e = b.bounds;
            e.inflate(s.radius, s.radius);
            // 将射线与展开的矩形e相交，如果射线错过了e，则以无交点退出，否则得到交点p和时间t作为结果。
            var ray = new es.Ray2D(s.position.sub(movement), s.position);
            var res = e.rayIntersects(ray);
            if (!res.intersected && res.distance > 1)
                return false;
            // 求交点
            var point = ray.start.add(ray.direction.scale(time));
            // 计算交点p位于b的哪个最小面和最大面之外。注意，u和v不能有相同的位集，它们之间必须至少有一个位集。
            var u, v = 0;
            if (point.x < b.bounds.left)
                u |= 1;
            if (point.x > b.bounds.right)
                v |= 1;
            if (point.y < b.bounds.top)
                u |= 2;
            if (point.y > b.bounds.bottom)
                v |= 2;
            // 'or'将所有的比特集合在一起，形成一个比特掩码(注意u + v == u | v)
            var m = u + v;
            // 如果这3个比特都被设置，那么该点就在顶点区域内。
            if (m == 3) {
                // 如果有一条或多条命中,则必须在两条边的顶点相交,并返回最佳时间。
                console.log("m == 3. corner " + es.Time.frameCount);
            }
            // 如果在m中只设置了一个位，那么该点就在一个面的区域。
            if ((m & (m - 1)) == 0) {
                // 从扩大的矩形交点开始的时间就是正确的时间
                return true;
            }
            // 点在边缘区域，与边缘相交。
            return true;
        };
        /**
         * 支持函数，返回索引为n的矩形vert
         * @param b
         * @param n
         */
        RealtimeCollisions.corner = function (b, n) {
            var p = es.Vector2.zero;
            p.x = (n & 1) == 0 ? b.right : b.left;
            p.y = (n & 1) == 0 ? b.bottom : b.top;
            return p;
        };
        /**
         * 检查圆是否与方框重叠，并返回point交点
         * @param cirlce
         * @param box
         * @param point
         */
        RealtimeCollisions.testCircleBox = function (cirlce, box, point) {
            // 找出离球心最近的点
            point = box.bounds.getClosestPointOnRectangleToPoint(cirlce.position);
            // 圆和方块相交，如果圆心到点的距离小于圆的半径，则圆和方块相交
            var v = point.sub(cirlce.position);
            var dist = v.dot(v);
            return dist <= cirlce.radius * cirlce.radius;
        };
        return RealtimeCollisions;
    }());
    es.RealtimeCollisions = RealtimeCollisions;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisionsBox = /** @class */ (function () {
        function ShapeCollisionsBox() {
        }
        ShapeCollisionsBox.boxToBox = function (first, second, result) {
            var minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (result.minimumTranslationVector.equals(es.Vector2.zero))
                    return false;
                result.normal = result.minimumTranslationVector.scale(-1);
                result.normal = result.normal.normalize();
                return true;
            }
            return false;
        };
        /**
         * 用second检查被deltaMovement移动的框的结果
         * @param first
         * @param second
         * @param movement
         * @param hit
         */
        ShapeCollisionsBox.boxToBoxCast = function (first, second, movement, hit) {
            // 首先，我们检查是否有重叠。如果有重叠，我们就不做扫描测试
            var minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                var mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(es.Vector2.zero))
                    return false;
                hit.normal = new es.Vector2(-mtv.x, -mtv.y);
                hit.normal = hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;
                return true;
            }
            else {
                // 射线投射移动矢量
                var ray = new es.Ray2D(es.Vector2.zero, movement.scale(-1));
                var res = minkowskiDiff.rayIntersects(ray);
                if (res.intersected && res.distance <= 1) {
                    hit.fraction = res.distance;
                    hit.distance = movement.magnitude() * res.distance;
                    hit.normal = movement.scale(-1);
                    hit.normal = hit.normal.normalize();
                    hit.centroid = first.bounds.center.add(movement.scale(res.distance));
                    return true;
                }
            }
            return false;
        };
        ShapeCollisionsBox.minkowskiDifference = function (first, second) {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            var positionOffset = first.position.sub(first.bounds.center);
            var topLeft = first.bounds.location.add(positionOffset.sub(second.bounds.max));
            var fullSize = first.bounds.size.add(second.bounds.size);
            return new es.Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y);
        };
        return ShapeCollisionsBox;
    }());
    es.ShapeCollisionsBox = ShapeCollisionsBox;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisionsCircle = /** @class */ (function () {
        function ShapeCollisionsCircle() {
        }
        ShapeCollisionsCircle.circleToCircleCast = function (first, second, deltaMovement, hit) {
            var endPointOfCast = first.position.add(deltaMovement);
            var d = this.closestPointOnLine(first.position, endPointOfCast, second.position);
            var closestDistanceSquared = es.Vector2.sqrDistance(second.position, d);
            var sumOfRadiiSquared = (first.radius + second.radius) * (first.radius + second.radius);
            if (closestDistanceSquared <= sumOfRadiiSquared) {
                var normalizedDeltaMovement = deltaMovement.normalize();
                if (d === endPointOfCast) {
                    endPointOfCast = first.position.add(deltaMovement.add(normalizedDeltaMovement.scale(second.radius)));
                    d = this.closestPointOnLine(first.position, endPointOfCast, second.position);
                    closestDistanceSquared = es.Vector2.sqrDistance(second.position, d);
                }
                var backDist = Math.sqrt(sumOfRadiiSquared - closestDistanceSquared);
                hit.centroid = d.sub(normalizedDeltaMovement.scale(backDist));
                hit.normal = hit.centroid.sub(second.position).normalize();
                hit.fraction = (hit.centroid.x - first.position.x) / deltaMovement.x;
                hit.distance = es.Vector2.distance(first.position, hit.centroid);
                hit.point = second.position.add(hit.normal.scale(second.radius));
                return true;
            }
            return false;
        };
        ShapeCollisionsCircle.circleToCircle = function (first, second, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            var distanceSquared = es.Vector2.sqrDistance(first.position, second.position);
            var sumOfRadii = first.radius + second.radius;
            var collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = first.position.sub(second.position).normalize();
                var depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = result.normal.scale(-depth);
                result.point = second.position.add(result.normal.scale(second.radius));
                return true;
            }
            return false;
        };
        /**
         * 适用于中心在框内的圆，也适用于与框外中心重合的圆。
         * @param circle
         * @param box
         * @param result
         */
        ShapeCollisionsCircle.circleToBox = function (circle, box, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            var closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, result.normal);
            // 先处理中心在盒子里的圆，如果我们是包含的, 它的成本更低，
            if (box.containsPoint(circle.position)) {
                result.point = closestPointOnBounds;
                // 计算MTV。找出安全的、非碰撞的位置，并从中得到MTV
                var safePlace = closestPointOnBounds.add(result.normal.scale(circle.radius));
                result.minimumTranslationVector = circle.position.sub(safePlace);
                return true;
            }
            var sqrDistance = es.Vector2.sqrDistance(closestPointOnBounds, circle.position);
            // 看框上的点距圆的半径是否小于圆的半径
            if (sqrDistance == 0) {
                result.minimumTranslationVector = result.normal.scale(circle.radius);
            }
            else if (sqrDistance <= circle.radius * circle.radius) {
                result.normal = circle.position.sub(closestPointOnBounds);
                var depth = result.normal.magnitude() - circle.radius;
                result.point = closestPointOnBounds;
                result.normal = result.normal.normalize();
                result.minimumTranslationVector = result.normal.scale(depth);
                return true;
            }
            return false;
        };
        ShapeCollisionsCircle.circleToPolygon = function (circle, polygon, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            // 圆圈在多边形中的位置坐标
            var poly2Circle = circle.position.sub(polygon.position);
            // 首先，我们需要找到从圆到多边形的最近距离
            var res = es.Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle);
            result.normal = res.edgeNormal;
            // 确保距离的平方小于半径的平方，否则我们不会相撞。
            // 请注意，如果圆完全包含在多边形中，距离可能大于半径。
            // 正因为如此，我们还要确保圆的位置不在多边形内。
            var circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (res.distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;
            // 算出MTV。我们要注意处理完全包含在多边形中的圆或包含其中心的圆
            var mtv;
            if (circleCenterInsidePoly) {
                mtv = result.normal.scale(Math.sqrt(res.distanceSquared) - circle.radius);
            }
            else {
                // 如果我们没有距离，这意味着圆心在多边形的边缘上。只需根据它的半径移动它
                if (res.distanceSquared === 0) {
                    mtv = result.normal.scale(circle.radius);
                }
                else {
                    var distance = Math.sqrt(res.distanceSquared);
                    mtv = poly2Circle
                        .sub(res.closestPoint)
                        .scale(((circle.radius - distance) / distance) * -1);
                }
            }
            result.minimumTranslationVector = mtv;
            result.point = res.closestPoint.add(polygon.position);
            return true;
        };
        ShapeCollisionsCircle.closestPointOnLine = function (lineA, lineB, closestTo) {
            var v = lineB.sub(lineA);
            var w = closestTo.sub(lineA);
            var t = w.dot(v) / v.dot(v);
            t = es.MathHelper.clamp(t, 0, 1);
            return lineA.add(v.scaleEqual(t));
        };
        return ShapeCollisionsCircle;
    }());
    es.ShapeCollisionsCircle = ShapeCollisionsCircle;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisionsLine = /** @class */ (function () {
        function ShapeCollisionsLine() {
        }
        ShapeCollisionsLine.lineToPoly = function (start, end, polygon, hit) {
            if (hit === void 0) { hit = new es.RaycastHit(); }
            var normal = es.Vector2.zero;
            var intersectionPoint = es.Vector2.zero;
            var fraction = Number.MAX_VALUE;
            var hasIntersection = false;
            for (var j = polygon.points.length - 1, i = 0; i < polygon.points.length; j = i, i++) {
                var edge1 = es.Vector2.add(polygon.position, polygon.points[j]);
                var edge2 = es.Vector2.add(polygon.position, polygon.points[i]);
                var intersection = es.Vector2.zero;
                if (ShapeCollisionsLine.lineToLine(edge1, edge2, start, end, intersection)) {
                    hasIntersection = true;
                    // TODO: 这是得到分数的正确和最有效的方法吗?
                    // 先检查x分数。如果是NaN，就用y代替
                    var distanceFraction = (intersection.x - start.x) / (end.x - start.x);
                    if (Number.isNaN(distanceFraction) || Math.abs(distanceFraction) == Infinity)
                        distanceFraction = (intersection.y - start.y) / (end.y - start.y);
                    if (distanceFraction < fraction) {
                        var edge = edge2.sub(edge1);
                        normal = new es.Vector2(edge.y, -edge.x);
                        fraction = distanceFraction;
                        intersectionPoint = intersection;
                    }
                }
            }
            if (hasIntersection) {
                normal = normal.normalize();
                var distance = es.Vector2.distance(start, intersectionPoint);
                hit.setValues(fraction, distance, intersectionPoint, normal);
                return true;
            }
            return false;
        };
        ShapeCollisionsLine.lineToLine = function (a1, a2, b1, b2, intersection) {
            var b = a2.sub(a1);
            var d = b2.sub(b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;
            var c = b1.sub(a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            var r = a1.add(b.scale(t));
            intersection.x = r.x;
            intersection.y = r.y;
            return true;
        };
        ShapeCollisionsLine.lineToCircle = function (start, end, s, hit) {
            // 计算这里的长度并分别对d进行标准化，因为如果我们命中了我们需要它来得到分数
            var lineLength = es.Vector2.distance(start, end);
            var d = es.Vector2.divideScaler(end.sub(start), lineLength);
            var m = start.sub(s.position);
            var b = m.dot(d);
            var c = m.dot(m) - s.radius * s.radius;
            // 如果r的原点在s之外，(c>0)和r指向s (b>0) 则返回
            if (c > 0 && b > 0)
                return false;
            var discr = b * b - c;
            // 线不在圆圈上
            if (discr < 0)
                return false;
            // 射线相交圆
            hit.fraction = -b - Math.sqrt(discr);
            // 如果分数为负数，射线从圈内开始，
            if (hit.fraction < 0)
                hit.fraction = 0;
            hit.point = start.add(d.scale(hit.fraction));
            hit.distance = es.Vector2.distance(start, hit.point);
            hit.normal = hit.point.sub(s.position).normalize();
            hit.fraction = hit.distance / lineLength;
            return true;
        };
        return ShapeCollisionsLine;
    }());
    es.ShapeCollisionsLine = ShapeCollisionsLine;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisionsPoint = /** @class */ (function () {
        function ShapeCollisionsPoint() {
        }
        ShapeCollisionsPoint.pointToCircle = function (point, circle, result) {
            var distanceSquared = es.Vector2.sqrDistance(point, circle.position);
            var sumOfRadii = 1 + circle.radius;
            var collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = point.sub(circle.position).normalize();
                var depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = result.normal.scale(-depth);
                ;
                result.point = circle.position.add(result.normal.scale(circle.radius));
                return true;
            }
            return false;
        };
        ShapeCollisionsPoint.pointToBox = function (point, box, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            if (box.containsPoint(point)) {
                // 在方框的空间里找到点
                result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, result.normal);
                result.minimumTranslationVector = point.sub(result.point);
                return true;
            }
            return false;
        };
        ShapeCollisionsPoint.pointToPoly = function (point, poly, result) {
            if (result === void 0) { result = new es.CollisionResult(); }
            if (poly.containsPoint(point)) {
                var res = es.Polygon.getClosestPointOnPolygonToPoint(poly.points, point.sub(poly.position));
                result.normal = res.edgeNormal;
                result.minimumTranslationVector = result.normal.scale(Math.sqrt(res.distanceSquared));
                result.point = res.closestPoint.sub(poly.position);
                return true;
            }
            return false;
        };
        return ShapeCollisionsPoint;
    }());
    es.ShapeCollisionsPoint = ShapeCollisionsPoint;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisionsPolygon = /** @class */ (function () {
        function ShapeCollisionsPolygon() {
        }
        /**
         * 检查两个多边形之间的碰撞
         * @param first
         * @param second
         * @param result
         */
        ShapeCollisionsPolygon.polygonToPolygon = function (first, second, result) {
            var isIntersecting = true;
            var firstEdges = first.edgeNormals;
            var secondEdges = second.edgeNormals;
            var minIntervalDistance = Number.POSITIVE_INFINITY;
            var translationAxis = es.Vector2.zero;
            var polygonOffset = first.position.sub(second.position);
            var axis;
            // 循环穿过两个多边形的所有边
            for (var edgeIndex = 0; edgeIndex < firstEdges.length + secondEdges.length; edgeIndex++) {
                // 1. 找出当前多边形是否相交
                // 多边形的归一化轴垂直于缓存给我们的当前边
                axis = edgeIndex < firstEdges.length ? firstEdges[edgeIndex] : secondEdges[edgeIndex - firstEdges.length];
                // 求多边形在当前轴上的投影
                var intervalDist = 0;
                var _a = this.getInterval(axis, first), minA = _a.min, maxA = _a.max;
                var _b = this.getInterval(axis, second), minB = _b.min, maxB = _b.max;
                // 将区间设为第二个多边形的空间。由轴上投影的位置差偏移。
                var relativeIntervalOffset = polygonOffset.dot(axis);
                minA += relativeIntervalOffset;
                maxA += relativeIntervalOffset;
                // 检查多边形投影是否正在相交
                intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
                if (intervalDist > 0)
                    isIntersecting = false;
                // 对于多对多数据类型转换，添加一个Vector2?参数称为deltaMovement。为了提高速度，我们这里不使用它
                // TODO: 现在找出多边形是否会相交。只要检查速度就行了
                // 如果多边形不相交，也不会相交，退出循环
                if (!isIntersecting)
                    return false;
                // 检查当前间隔距离是否为最小值。如果是，则存储间隔距离和当前距离。这将用于计算最小平移向量
                intervalDist = Math.abs(intervalDist);
                if (intervalDist < minIntervalDistance) {
                    minIntervalDistance = intervalDist;
                    translationAxis.setTo(axis.x, axis.y);
                    if (translationAxis.dot(polygonOffset) < 0)
                        translationAxis = translationAxis.scale(-1);
                }
            }
            // 利用最小平移向量对多边形进行推入。
            result.normal = translationAxis;
            result.minimumTranslationVector = translationAxis.scale(-minIntervalDistance);
            return true;
        };
        /**
         * 计算一个多边形在一个轴上的投影，并返回一个[min，max]区间
         * @param axis
         * @param polygon
         * @param min
         * @param max
         */
        ShapeCollisionsPolygon.getInterval = function (axis, polygon) {
            var res = { min: 0, max: 0 };
            var dot;
            dot = polygon.points[0].dot(axis);
            res.max = dot;
            res.min = dot;
            for (var i = 1; i < polygon.points.length; i++) {
                dot = polygon.points[i].dot(axis);
                if (dot < res.min) {
                    res.min = dot;
                }
                else if (dot > res.max) {
                    res.max = dot;
                }
            }
            return res;
        };
        /**
         * 计算[minA, maxA]和[minB, maxB]之间的距离。如果间隔重叠，距离是负的
         * @param minA
         * @param maxA
         * @param minB
         * @param maxB
         */
        ShapeCollisionsPolygon.intervalDistance = function (minA, maxA, minB, maxB) {
            if (minA < minB)
                return minB - maxA;
            return minA - maxB;
        };
        return ShapeCollisionsPolygon;
    }());
    es.ShapeCollisionsPolygon = ShapeCollisionsPolygon;
})(es || (es = {}));
var es;
(function (es) {
    var Particle = /** @class */ (function () {
        function Particle(position) {
            this.position = es.Vector2.zero;
            this.lastPosition = es.Vector2.zero;
            this.mass = 1;
            this.radius = 0;
            this.collidesWithColliders = true;
            this.isPinned = false;
            this.acceleration = es.Vector2.zero;
            this.pinnedPosition = es.Vector2.zero;
            this.position = new es.Vector2(position.x, position.y);
            this.lastPosition = new es.Vector2(position.x, position.y);
        }
        Particle.prototype.applyForce = function (force) {
            this.acceleration = this.acceleration.add(force.divideScaler(this.mass));
        };
        Particle.prototype.pin = function () {
            this.isPinned = true;
            this.pinnedPosition = this.position;
            return this;
        };
        Particle.prototype.pinTo = function (position) {
            this.isPinned = true;
            this.pinnedPosition = position;
            this.position = this.pinnedPosition;
            return this;
        };
        Particle.prototype.unpin = function () {
            this.isPinned = false;
            return this;
        };
        return Particle;
    }());
    es.Particle = Particle;
})(es || (es = {}));
var es;
(function (es) {
    var VerletWorld = /** @class */ (function () {
        function VerletWorld(simulationBounds) {
            if (simulationBounds === void 0) { simulationBounds = null; }
            this.gravity = new es.Vector2(0, -980);
            this.constraintIterations = 3;
            this.maximumStepIterations = 5;
            this.allowDragging = true;
            this.selectionRadiusSquared = 20 * 20;
            this._composites = [];
            this._tempCircle = new es.Circle(1);
            this._leftOverTime = 0;
            this._fixedDeltaTime = 1 / 60;
            this._iterationSteps = 0;
            this._fixedDeltaTimeSq = 0;
            this.simulationBounds = simulationBounds;
            this._fixedDeltaTimeSq = Math.pow(this._fixedDeltaTime, 2);
        }
        VerletWorld.prototype.update = function () {
            this.updateTiming();
            if (this.allowDragging)
                this.handleDragging();
            for (var iteration = 1; iteration <= this._iterationSteps; iteration++) {
                for (var i = this._composites.length - 1; i >= 0; i--) {
                    var composite = this._composites[i];
                    for (var s = 0; s < this.constraintIterations; s++)
                        composite.solveConstraints();
                    composite.updateParticles(this._fixedDeltaTimeSq, this.gravity);
                    composite.handleConstraintCollisions();
                    for (var j = 0; j < composite.particles.length; j++) {
                        var p = composite.particles[j];
                        if (this.simulationBounds) {
                            this.constrainParticleToBounds(p);
                        }
                        if (p.collidesWithColliders)
                            this.handleCollisions(p, composite.collidesWithLayers);
                    }
                }
            }
        };
        VerletWorld.prototype.constrainParticleToBounds = function (p) {
            var tempPos = p.position;
            var bounds = this.simulationBounds;
            if (p.radius == 0) {
                if (tempPos.y > bounds.height)
                    tempPos.y = bounds.height;
                else if (tempPos.y < bounds.y)
                    tempPos.y = bounds.y;
                if (tempPos.x < bounds.x)
                    tempPos.x = bounds.x;
                else if (tempPos.x > bounds.width)
                    tempPos.x = bounds.width;
            }
            else {
                if (tempPos.y < bounds.y + p.radius)
                    tempPos.y = 2 * (bounds.y + p.radius) - tempPos.y;
                if (tempPos.y > bounds.height - p.radius)
                    tempPos.y = 2 * (bounds.height - p.radius) - tempPos.y;
                if (tempPos.x > bounds.width - p.radius)
                    tempPos.x = 2 * (bounds.width - p.radius) - tempPos.x;
                if (tempPos.x < bounds.x + p.radius)
                    tempPos.x = 2 * (bounds.x + p.radius) - tempPos.x;
            }
            p.position = tempPos;
        };
        VerletWorld.prototype.handleCollisions = function (p, collidesWithLayers) {
            var collidedCount = es.Physics.overlapCircleAll(p.position, p.radius, VerletWorld._colliders, collidesWithLayers);
            for (var i = 0; i < collidedCount; i++) {
                var collider = VerletWorld._colliders[i];
                if (collider.isTrigger)
                    continue;
                var collisionResult = new es.CollisionResult();
                if (p.radius < 2) {
                    if (collider.shape.pointCollidesWithShape(p.position, collisionResult)) {
                        p.position = p.position.sub(collisionResult.minimumTranslationVector);
                    }
                }
                else {
                    this._tempCircle.radius = p.radius;
                    this._tempCircle.position = p.position;
                    if (this._tempCircle.collidesWithShape(collider.shape, collisionResult)) {
                        p.position = p.position.sub(collisionResult.minimumTranslationVector);
                    }
                }
            }
        };
        VerletWorld.prototype.updateTiming = function () {
            this._leftOverTime += es.Time.deltaTime;
            this._iterationSteps = Math.trunc(this._leftOverTime / this._fixedDeltaTime);
            this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;
            this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
        };
        VerletWorld.prototype.addComposite = function (composite) {
            this._composites.push(composite);
            return composite;
        };
        VerletWorld.prototype.removeComposite = function (composite) {
            var index = this._composites.indexOf(composite);
            this._composites.splice(index, 1);
        };
        VerletWorld.prototype.handleDragging = function () {
            if (this.onHandleDrag)
                this.onHandleDrag();
        };
        VerletWorld.prototype.getNearestParticle = function (position) {
            var nearestSquaredDistance = this.selectionRadiusSquared;
            var particle = null;
            for (var j = 0; j < this._composites.length; j++) {
                var particles = this._composites[j].particles;
                for (var i = 0; i < particles.length; i++) {
                    var p = particles[i];
                    var squaredDistanceToParticle = es.Vector2.sqrDistance(p.position, position);
                    if (squaredDistanceToParticle <= this.selectionRadiusSquared &&
                        (particle == null || squaredDistanceToParticle < nearestSquaredDistance)) {
                        particle = p;
                        nearestSquaredDistance = squaredDistanceToParticle;
                    }
                }
            }
            return particle;
        };
        VerletWorld.prototype.debugRender = function (batcher) {
            for (var i = 0; i < this._composites.length; i++) {
                this._composites[i].debugRender(batcher);
            }
            if (this.allowDragging) {
                if (this._draggedParticle != null) {
                    batcher.drawCircle(this._draggedParticle.position, 8, es.Color.White);
                }
            }
        };
        VerletWorld._colliders = [];
        return VerletWorld;
    }());
    es.VerletWorld = VerletWorld;
})(es || (es = {}));
var es;
(function (es) {
    var Composite = /** @class */ (function () {
        function Composite() {
            this.friction = new es.Vector2(0.98, 1);
            this.drawParticles = true;
            this.drawConstraints = true;
            this.collidesWithLayers = es.Physics.allLayers;
            this.particles = [];
            this._constraints = [];
        }
        Composite.prototype.addParticle = function (particle) {
            this.particles.push(particle);
            return particle;
        };
        Composite.prototype.removeParticle = function (particle) {
            var index = this.particles.indexOf(particle);
            this.particles.splice(index, 1);
        };
        Composite.prototype.removeAll = function () {
            this.particles.length = 0;
            this._constraints.length = 0;
        };
        Composite.prototype.addConstraint = function (constraint) {
            this._constraints.push(constraint);
            constraint.composite = this;
            return constraint;
        };
        Composite.prototype.removeConstraint = function (constraint) {
            var index = this._constraints.indexOf(constraint);
            this._constraints.splice(index, 1);
        };
        Composite.prototype.applyForce = function (force) {
            for (var j = 0; j < this.particles.length; j++)
                this.particles[j].applyForce(force);
        };
        Composite.prototype.solveConstraints = function () {
            for (var i = this._constraints.length - 1; i >= 0; i--)
                this._constraints[i].solve();
        };
        Composite.prototype.updateParticles = function (deltaTimeSquared, gravity) {
            for (var j = 0; j < this.particles.length; j++) {
                var p = this.particles[j];
                if (p.isPinned) {
                    p.position = p.pinnedPosition;
                    continue;
                }
                p.applyForce(gravity.scale(p.mass));
                var vel = p.position.sub(p.lastPosition).multiply(this.friction);
                var nextPos = p.position.add(vel).add(p.acceleration.scale(0.5 * deltaTimeSquared));
                p.lastPosition = p.position;
                p.position = nextPos;
                p.acceleration.x = p.acceleration.y = 0;
            }
        };
        Composite.prototype.handleConstraintCollisions = function () {
            for (var i = this._constraints.length - 1; i >= 0; i--) {
                if (this._constraints[i].collidesWithColliders)
                    this._constraints[i].handleCollisions(this.collidesWithLayers);
            }
        };
        Composite.prototype.debugRender = function (batcher) {
            if (this.drawConstraints) {
                for (var i = 0; i < this._constraints.length; i++)
                    this._constraints[i].debugRender(batcher);
            }
            if (this.drawParticles) {
                for (var i = 0; i < this.particles.length; i++) {
                    if (this.particles[i].radius == 0)
                        batcher.drawPixel(this.particles[i].position, new es.Color(220, 52, 94), 4);
                    else
                        batcher.drawCircleLow(this.particles[i].position, this.particles[i].radius, new es.Color(220, 52, 94), 1, 4);
                }
            }
        };
        return Composite;
    }());
    es.Composite = Composite;
})(es || (es = {}));
///<reference path="./Composite.ts" />
var es;
///<reference path="./Composite.ts" />
(function (es) {
    var Ball = /** @class */ (function (_super) {
        __extends(Ball, _super);
        function Ball(position, radius) {
            if (radius === void 0) { radius = 10; }
            var _this = _super.call(this) || this;
            _this.addParticle(new es.Particle(position)).radius = radius;
            return _this;
        }
        return Ball;
    }(es.Composite));
    es.Ball = Ball;
})(es || (es = {}));
///<reference path="./Composite.ts" />
var es;
///<reference path="./Composite.ts" />
(function (es) {
    var VerletBox = /** @class */ (function (_super) {
        __extends(VerletBox, _super);
        function VerletBox(center, width, height, borderStiffness, diagonalStiffness) {
            if (borderStiffness === void 0) { borderStiffness = 0.2; }
            if (diagonalStiffness === void 0) { diagonalStiffness = 0.5; }
            var _this = _super.call(this) || this;
            var tl = _this.addParticle(new es.Particle(center.add(new es.Vector2(-width / 2, -height / 2))));
            var tr = _this.addParticle(new es.Particle(center.add(new es.Vector2(width / 2, -height / 2))));
            var br = _this.addParticle(new es.Particle(center.add(new es.Vector2(width / 2, height / 2))));
            var bl = _this.addParticle(new es.Particle(center.add(new es.Vector2(-width / 2, height / 2))));
            _this.addConstraint(new es.DistanceConstraint(tl, tr, borderStiffness));
            _this.addConstraint(new es.DistanceConstraint(tr, br, borderStiffness));
            _this.addConstraint(new es.DistanceConstraint(br, bl, borderStiffness));
            _this.addConstraint(new es.DistanceConstraint(bl, tl, borderStiffness));
            _this.addConstraint(new es.DistanceConstraint(tl, br, diagonalStiffness))
                .setCollidesWithColliders(false);
            _this.addConstraint(new es.DistanceConstraint(bl, tr, diagonalStiffness))
                .setCollidesWithColliders(false);
            return _this;
        }
        return VerletBox;
    }(es.Composite));
    es.VerletBox = VerletBox;
})(es || (es = {}));
var es;
(function (es) {
    var Cloth = /** @class */ (function (_super) {
        __extends(Cloth, _super);
        function Cloth(topLeftPosition, width, height, segments, stiffness, tearSensitivity, connectHorizontalParticles) {
            if (segments === void 0) { segments = 20; }
            if (stiffness === void 0) { stiffness = 0.25; }
            if (tearSensitivity === void 0) { tearSensitivity = 5; }
            if (connectHorizontalParticles === void 0) { connectHorizontalParticles = true; }
            var _this = _super.call(this) || this;
            var xStride = width / segments;
            var yStride = height / segments;
            for (var y = 0; y < segments; y++) {
                for (var x = 0; x < segments; x++) {
                    var px = topLeftPosition.x + x * xStride;
                    var py = topLeftPosition.y + y + yStride;
                    var particle = _this.addParticle(new es.Particle(new es.Vector2(px, py)));
                    if (connectHorizontalParticles && x > 0)
                        _this.addConstraint(new es.DistanceConstraint(_this.particles[y * segments + x], _this.particles[y * segments + x - 1], stiffness))
                            .setTearSensitivity(tearSensitivity)
                            .setCollidesWithColliders(false);
                    if (y > 0)
                        _this.addConstraint(new es.DistanceConstraint(_this.particles[y * segments + x], _this.particles[(y - 1) * segments + x], stiffness))
                            .setTearSensitivity(tearSensitivity)
                            .setCollidesWithColliders(false);
                    if (y == 0)
                        particle.pin();
                }
            }
            return _this;
        }
        return Cloth;
    }(es.Composite));
    es.Cloth = Cloth;
})(es || (es = {}));
var es;
(function (es) {
    var LineSegments = /** @class */ (function (_super) {
        __extends(LineSegments, _super);
        function LineSegments(vertices, stiffness) {
            var _this = _super.call(this) || this;
            for (var i = 0; i < vertices.length; i++) {
                var p = new es.Particle(vertices[i]);
                _this.addParticle(p);
                if (i > 0)
                    _this.addConstraint(new es.DistanceConstraint(_this.particles[i], _this.particles[i - 1], stiffness));
            }
            return _this;
        }
        LineSegments.prototype.pinParticleAtIndex = function (index) {
            this.particles[index].pin();
            return this;
        };
        return LineSegments;
    }(es.Composite));
    es.LineSegments = LineSegments;
})(es || (es = {}));
var es;
(function (es) {
    var Ragdoll = /** @class */ (function (_super) {
        __extends(Ragdoll, _super);
        function Ragdoll(x, y, bodyHeight) {
            var _this = _super.call(this) || this;
            var headLength = bodyHeight / 7.5;
            var head = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            head.radius = headLength * 0.75;
            head.mass = 4;
            var shoulder = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            shoulder.mass = 26;
            _this.addConstraint(new es.DistanceConstraint(head, shoulder, 1, 5 / 4 * headLength));
            var elbowLeft = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            var elbowRight = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            elbowLeft.mass = 2;
            elbowRight.mass = 2;
            _this.addConstraint(new es.DistanceConstraint(elbowLeft, shoulder, 1, headLength * 3 / 2));
            _this.addConstraint(new es.DistanceConstraint(elbowRight, shoulder, 1, headLength * 3 / 2));
            var handLeft = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            var handRight = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            handLeft.mass = 2;
            handRight.mass = 2;
            _this.addConstraint(new es.DistanceConstraint(handLeft, elbowLeft, 1, headLength * 2));
            _this.addConstraint(new es.DistanceConstraint(handRight, elbowRight, 1, headLength * 2));
            var pelvis = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            pelvis.mass = 15;
            _this.addConstraint(new es.DistanceConstraint(pelvis, shoulder, 0.8, headLength * 3.5));
            _this.addConstraint(new es.DistanceConstraint(pelvis, head, 0.02, bodyHeight * 2))
                .setCollidesWithColliders(false);
            var kneeLeft = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            var kneeRight = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            kneeLeft.mass = 10;
            kneeRight.mass = 10;
            _this.addConstraint(new es.DistanceConstraint(kneeLeft, pelvis, 1, headLength * 2));
            _this.addConstraint(new es.DistanceConstraint(kneeRight, pelvis, 1, headLength * 2));
            var footLeft = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            var footRight = _this.addParticle(new es.Particle({ x: x + es.RandomUtils.randint(-5, 5), y: y + es.RandomUtils.randint(-5, 5) }));
            footLeft.mass = 5;
            footRight.mass = 5;
            _this.addConstraint(new es.DistanceConstraint(footLeft, kneeLeft, 1, headLength * 2));
            _this.addConstraint(new es.DistanceConstraint(footRight, kneeRight, 1, headLength * 2));
            _this.addConstraint(new es.DistanceConstraint(footLeft, shoulder, 0.001, bodyHeight * 2))
                .setCollidesWithColliders(false);
            _this.addConstraint(new es.DistanceConstraint(footLeft, shoulder, 0.001, bodyHeight * 2))
                .setCollidesWithColliders(false);
            return _this;
        }
        return Ragdoll;
    }(es.Composite));
    es.Ragdoll = Ragdoll;
})(es || (es = {}));
var es;
(function (es) {
    var Tire = /** @class */ (function (_super) {
        __extends(Tire, _super);
        function Tire(origin, radius, segments, spokeStiffness, treadStiffness) {
            if (spokeStiffness === void 0) { spokeStiffness = 1; }
            if (treadStiffness === void 0) { treadStiffness = 1; }
            var _this = _super.call(this) || this;
            var stride = 2 * Math.PI / segments;
            for (var i = 0; i < segments; i++) {
                var theta = i * stride;
                _this.addParticle(new es.Particle(new es.Vector2(origin.x + Math.cos(theta) * radius, origin.y + Math.sin(theta) * radius)));
            }
            var centerParticle = _this.addParticle(new es.Particle(origin));
            for (var i = 0; i < segments; i++) {
                _this.addConstraint(new es.DistanceConstraint(_this.particles[i], _this.particles[(i + 1) % segments], treadStiffness));
                _this.addConstraint(new es.DistanceConstraint(_this.particles[i], centerParticle, spokeStiffness))
                    .setCollidesWithColliders(false);
                _this.addConstraint(new es.DistanceConstraint(_this.particles[i], _this.particles[(i + 5) % segments], treadStiffness));
            }
            return _this;
        }
        return Tire;
    }(es.Composite));
    es.Tire = Tire;
})(es || (es = {}));
var es;
(function (es) {
    var Constraint = /** @class */ (function () {
        function Constraint() {
            this.collidesWithColliders = true;
        }
        Constraint.prototype.handleCollisions = function (collidesWithLayers) {
        };
        Constraint.prototype.debugRender = function (batcher) {
        };
        return Constraint;
    }());
    es.Constraint = Constraint;
})(es || (es = {}));
///<reference path="./Constraint.ts" />
var es;
///<reference path="./Constraint.ts" />
(function (es) {
    var AngleConstraint = /** @class */ (function (_super) {
        __extends(AngleConstraint, _super);
        function AngleConstraint(a, center, c, stiffness) {
            var _this = _super.call(this) || this;
            _this.stiffness = 0;
            _this.angleInRadius = 0;
            _this._particleA = a;
            _this._centerParticle = center;
            _this._particleC = c;
            _this.stiffness = stiffness;
            _this.collidesWithColliders = false;
            _this.angleInRadius = _this.angleBetweenParticles();
            return _this;
        }
        AngleConstraint.prototype.angleBetweenParticles = function () {
            var first = this._particleA.position.sub(this._centerParticle.position);
            var second = this._particleC.position.sub(this._centerParticle.position);
            return Math.atan2(first.x * second.y - first.y * second.x, first.x * second.x + first.y * second.y);
        };
        AngleConstraint.prototype.solve = function () {
            var angleBetween = this.angleBetweenParticles();
            var diff = angleBetween - this.angleInRadius;
            if (diff <= -Math.PI)
                diff += 2 * Math.PI;
            else if (diff >= Math.PI)
                diff -= 2 * Math.PI;
            diff *= this.stiffness;
            this._particleA.position = es.MathHelper.rotateAround2(this._particleA.position, this._centerParticle.position, diff);
            this._particleC.position = es.MathHelper.rotateAround2(this._particleC.position, this._centerParticle.position, -diff);
            this._centerParticle.position = es.MathHelper.rotateAround2(this._centerParticle.position, this._particleA.position, diff);
            this._centerParticle.position = es.MathHelper.rotateAround2(this._centerParticle.position, this._particleC.position, -diff);
        };
        return AngleConstraint;
    }(es.Constraint));
    es.AngleConstraint = AngleConstraint;
})(es || (es = {}));
var es;
(function (es) {
    var DistanceConstraint = /** @class */ (function (_super) {
        __extends(DistanceConstraint, _super);
        function DistanceConstraint(first, second, stiffness, distance) {
            if (distance === void 0) { distance = -1; }
            var _this = _super.call(this) || this;
            _this.stiffness = 0;
            _this.restingDistance = 0;
            _this.tearSensitivity = Number.POSITIVE_INFINITY;
            _this.shouldApproximateCollisionsWithPoints = false;
            _this.totalPointsToApproximateCollisionsWith = 5;
            DistanceConstraint._polygon.create(2, 1);
            _this._particleOne = first;
            _this._particleTwo = second;
            _this.stiffness = stiffness;
            if (distance > -1)
                _this.restingDistance = distance;
            else
                _this.restingDistance = first.position.distance(second.position);
            return _this;
        }
        DistanceConstraint.create = function (a, center, c, stiffness, angleInDegrees) {
            var aToCenter = a.position.distance(center.position);
            var cToCenter = c.position.distance(center.position);
            var distance = Math.sqrt(aToCenter * aToCenter + cToCenter * cToCenter - (2 * aToCenter * cToCenter * Math.cos(angleInDegrees * es.MathHelper.Deg2Rad)));
            return new DistanceConstraint(a, c, stiffness, distance);
        };
        DistanceConstraint.prototype.setTearSensitivity = function (tearSensitivity) {
            this.tearSensitivity = tearSensitivity;
            return this;
        };
        DistanceConstraint.prototype.setCollidesWithColliders = function (collidesWithColliders) {
            this.collidesWithColliders = collidesWithColliders;
            return this;
        };
        DistanceConstraint.prototype.setShouldApproximateCollisionsWithPoints = function (shouldApproximateCollisionsWithPoints) {
            this.shouldApproximateCollisionsWithPoints = shouldApproximateCollisionsWithPoints;
            return this;
        };
        DistanceConstraint.prototype.solve = function () {
            var diff = this._particleOne.position.sub(this._particleTwo.position);
            var d = diff.distance();
            var difference = (this.restingDistance - d) / d;
            if (d / this.restingDistance > this.tearSensitivity) {
                this.composite.removeConstraint(this);
                return;
            }
            var im1 = 1 / this._particleOne.mass;
            var im2 = 1 / this._particleTwo.mass;
            var scalarP1 = (im1 / (im1 + im2)) * this.stiffness;
            var scalarP2 = this.stiffness - scalarP1;
            this._particleOne.position = this._particleOne.position.add(diff.scale(scalarP1 * difference));
            this._particleTwo.position = this._particleTwo.position.sub(diff.scale(scalarP2 * difference));
        };
        DistanceConstraint.prototype.handleCollisions = function (collidesWithLayers) {
            if (this.shouldApproximateCollisionsWithPoints) {
                this.approximateCollisionsWithPoints(collidesWithLayers);
                return;
            }
            var minX = Math.min(this._particleOne.position.x, this._particleTwo.position.x);
            var maxX = Math.max(this._particleOne.position.x, this._particleTwo.position.x);
            var minY = Math.min(this._particleOne.position.y, this._particleTwo.position.y);
            var maxY = Math.max(this._particleOne.position.y, this._particleTwo.position.y);
            DistanceConstraint._polygon.bounds = es.Rectangle.fromMinMax(minX, minY, maxX, maxY);
            var midPoint = es.Vector2.zero;
            this.preparePolygonForCollisionChecks(midPoint);
            var colliders = es.Physics.boxcastBroadphase(DistanceConstraint._polygon.bounds, collidesWithLayers);
            for (var i = 0; i < colliders.length; i++) {
                var collider = colliders[i];
                var result = new es.CollisionResult();
                if (DistanceConstraint._polygon.collidesWithShape(collider.shape, result)) {
                    this._particleOne.position = this._particleOne.position.sub(result.minimumTranslationVector);
                    this._particleTwo.position = this._particleTwo.position.sub(result.minimumTranslationVector);
                }
            }
        };
        DistanceConstraint.prototype.approximateCollisionsWithPoints = function (collidesWithLayers) {
            var pt;
            for (var j = 0; j < this.totalPointsToApproximateCollisionsWith - 1; j++) {
                pt = es.Vector2.lerp(this._particleOne.position, this._particleTwo.position, (j + 1) / this.totalPointsToApproximateCollisionsWith);
                var collidedCount = es.Physics.overlapCircleAll(pt, 3, es.VerletWorld._colliders, collidesWithLayers);
                for (var i = 0; i < collidedCount; i++) {
                    var collider = es.VerletWorld._colliders[i];
                    var collisionResult = new es.CollisionResult();
                    if (collider.shape.pointCollidesWithShape(pt, collisionResult)) {
                        this._particleOne.position = this._particleOne.position.sub(collisionResult.minimumTranslationVector);
                        this._particleTwo.position = this._particleTwo.position.sub(collisionResult.minimumTranslationVector);
                    }
                }
            }
        };
        DistanceConstraint.prototype.preparePolygonForCollisionChecks = function (midPoint) {
            var tempMidPoint = es.Vector2.lerp(this._particleOne.position, this._particleTwo.position, 0.5);
            midPoint.setTo(tempMidPoint.x, tempMidPoint.y);
            DistanceConstraint._polygon.position = midPoint;
            DistanceConstraint._polygon.points[0] = this._particleOne.position.sub(DistanceConstraint._polygon.position);
            DistanceConstraint._polygon.points[1] = this._particleTwo.position.sub(DistanceConstraint._polygon.position);
            DistanceConstraint._polygon.recalculateCenterAndEdgeNormals();
        };
        DistanceConstraint.prototype.debugRender = function (batcher) {
            batcher.drawLine(this._particleOne.position, this._particleTwo.position, new es.Color(67, 62, 54), 1);
        };
        DistanceConstraint._polygon = new es.Polygon([]);
        return DistanceConstraint;
    }(es.Constraint));
    es.DistanceConstraint = DistanceConstraint;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * AbstractTweenable作为你可能想做的任何可以执行的自定义类的基础。
     * 这些类不同于ITweens，因为他们没有实现ITweenT接口。
     * 它只是说一个AbstractTweenable不仅仅是将一个值从开始移动到结束。
     * 它可以做任何需要每帧执行的事情。
     */
    var AbstractTweenable = /** @class */ (function () {
        function AbstractTweenable() {
        }
        AbstractTweenable.prototype.recycleSelf = function () {
        };
        AbstractTweenable.prototype.isRunning = function () {
            return this._isCurrentlyManagedByTweenManager && !this._isPaused;
        };
        AbstractTweenable.prototype.start = function () {
            if (this._isCurrentlyManagedByTweenManager) {
                this._isPaused = false;
                return;
            }
            es.TweenManager.addTween(this);
            this._isCurrentlyManagedByTweenManager = true;
            this._isPaused = false;
        };
        AbstractTweenable.prototype.pause = function () {
            this._isPaused = true;
        };
        AbstractTweenable.prototype.resume = function () {
            this._isPaused = false;
        };
        AbstractTweenable.prototype.stop = function (bringToCompletion) {
            if (bringToCompletion === void 0) { bringToCompletion = false; }
            es.TweenManager.removeTween(this);
            this._isCurrentlyManagedByTweenManager = false;
            this._isPaused = true;
        };
        return AbstractTweenable;
    }());
    es.AbstractTweenable = AbstractTweenable;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 通用ITweenTarget用于所有属性tweens。
     */
    var PropertyTarget = /** @class */ (function () {
        function PropertyTarget(target, propertyName) {
            this._target = target;
            this._propertyName = propertyName;
        }
        PropertyTarget.prototype.getTargetObject = function () {
            return this._target;
        };
        PropertyTarget.prototype.setTweenedValue = function (value) {
            this._target[this._propertyName] = value;
        };
        PropertyTarget.prototype.getTweenedValue = function () {
            return this._target[this._propertyName];
        };
        return PropertyTarget;
    }());
    var PropertyTweens = /** @class */ (function () {
        function PropertyTweens() {
        }
        PropertyTweens.NumberPropertyTo = function (self, memberName, to, duration) {
            var tweenTarget = new PropertyTarget(self, memberName);
            var tween = es.TweenManager.cacheNumberTweens ? es.Pool.obtain(es.NumberTween) : new es.NumberTween();
            tween.initialize(tweenTarget, to, duration);
            return tween;
        };
        PropertyTweens.Vector2PropertyTo = function (self, memeberName, to, duration) {
            var tweenTarget = new PropertyTarget(self, memeberName);
            var tween = es.TweenManager.cacheVector2Tweens ? es.Pool.obtain(es.Vector2Tween) : new es.Vector2Tween();
            tween.initialize(tweenTarget, to, duration);
            return tween;
        };
        return PropertyTweens;
    }());
    es.PropertyTweens = PropertyTweens;
})(es || (es = {}));
var es;
(function (es) {
    var LoopType;
    (function (LoopType) {
        LoopType[LoopType["none"] = 0] = "none";
        LoopType[LoopType["restartFromBeginning"] = 1] = "restartFromBeginning";
        LoopType[LoopType["pingpong"] = 2] = "pingpong";
    })(LoopType = es.LoopType || (es.LoopType = {}));
    var TweenState;
    (function (TweenState) {
        TweenState[TweenState["running"] = 0] = "running";
        TweenState[TweenState["paused"] = 1] = "paused";
        TweenState[TweenState["complete"] = 2] = "complete";
    })(TweenState = es.TweenState || (es.TweenState = {}));
    var Tween = /** @class */ (function () {
        function Tween() {
            this._shouldRecycleTween = true;
            this._tweenState = TweenState.complete;
            this._timeScale = 1;
        }
        Tween.prototype.setEaseType = function (easeType) {
            this._easeType = easeType;
            return this;
        };
        Tween.prototype.setDelay = function (delay) {
            this._delay = delay;
            this._elapsedTime = -this._delay;
            return this;
        };
        Tween.prototype.setDuration = function (duration) {
            this._duration = duration;
            return this;
        };
        Tween.prototype.setTimeScale = function (timeSclae) {
            this._timeScale = timeSclae;
            return this;
        };
        Tween.prototype.setIsTimeScaleIndependent = function () {
            this._isTimeScaleIndependent = true;
            return this;
        };
        Tween.prototype.setCompletionHandler = function (completeHandler) {
            this._completionHandler = completeHandler;
            return this;
        };
        Tween.prototype.setLoops = function (loopType, loops, delayBetweenLoops) {
            if (loops === void 0) { loops = 1; }
            if (delayBetweenLoops === void 0) { delayBetweenLoops = 0; }
            this._loopType = loopType;
            this._delayBetweenLoops = delayBetweenLoops;
            if (loops < 0)
                loops = -1;
            if (loopType == LoopType.pingpong)
                loops = loops * 2;
            this._loops = loops;
            return this;
        };
        Tween.prototype.setLoopCompletionHanlder = function (loopCompleteHandler) {
            this._loopCompleteHandler = loopCompleteHandler;
            return this;
        };
        Tween.prototype.setFrom = function (from) {
            this._isFromValueOverridden = true;
            this._fromValue = from;
            return this;
        };
        Tween.prototype.prepareForReuse = function (from, to, duration) {
            this.initialize(this._target, to, duration);
            return this;
        };
        Tween.prototype.setRecycleTween = function (shouldRecycleTween) {
            this._shouldRecycleTween = shouldRecycleTween;
            return this;
        };
        Tween.prototype.setContext = function (context) {
            this.context = context;
            return this;
        };
        Tween.prototype.setNextTween = function (nextTween) {
            this._nextTween = nextTween;
            return this;
        };
        Tween.prototype.tick = function () {
            if (this._tweenState == TweenState.paused)
                return false;
            // 当我们进行循环时，我们会在0和持续时间之间限制数值
            var elapsedTimeExcess = 0;
            if (!this._isRunningInReverse && this._elapsedTime >= this._duration) {
                elapsedTimeExcess = this._elapsedTime - this._duration;
                this._elapsedTime = this._duration;
                this._tweenState = TweenState.complete;
            }
            else if (this._isRunningInReverse && this._elapsedTime <= 0) {
                elapsedTimeExcess = 0 - this._elapsedTime;
                this._elapsedTime = 0;
                this._tweenState = TweenState.complete;
            }
            // 当我们延迟开始tween的时候，经过的时间会是负数，所以不要更新这个值。
            if (this._elapsedTime >= 0 && this._elapsedTime <= this._duration) {
                this.updateValue();
            }
            // 如果我们有一个loopType，并且我们是Complete（意味着我们达到了0或持续时间）处理循环。
            // handleLooping将采取任何多余的elapsedTime，并将其因子化，并在必要时调用udpateValue来保持tween的完美准确性
            if (this._loopType != LoopType.none && this._tweenState == TweenState.complete && this._loops != 0) {
                this.handleLooping(elapsedTimeExcess);
            }
            var deltaTime = this._isTimeScaleIndependent ? es.Time.unscaledDeltaTime : es.Time.deltaTime;
            deltaTime *= this._timeScale;
            // 我们需要减去deltaTime
            if (this._isRunningInReverse)
                this._elapsedTime -= deltaTime;
            else
                this._elapsedTime += deltaTime;
            if (this._tweenState == TweenState.complete) {
                this._completionHandler && this._completionHandler(this);
                // 如果我们有一个nextTween，把它添加到TweenManager中，这样它就可以开始运行了
                if (this._nextTween != null) {
                    this._nextTween.start();
                    this._nextTween = null;
                }
                return true;
            }
            return false;
        };
        Tween.prototype.recycleSelf = function () {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
            }
        };
        Tween.prototype.isRunning = function () {
            return this._tweenState == TweenState.running;
        };
        Tween.prototype.start = function () {
            if (!this._isFromValueOverridden)
                this._fromValue = this._target.getTweenedValue();
            if (this._tweenState == TweenState.complete) {
                this._tweenState = TweenState.running;
                es.TweenManager.addTween(this);
            }
        };
        Tween.prototype.pause = function () {
            this._tweenState = TweenState.paused;
        };
        Tween.prototype.resume = function () {
            this._tweenState = TweenState.running;
        };
        Tween.prototype.stop = function (bringToCompletion) {
            if (bringToCompletion === void 0) { bringToCompletion = false; }
            this._tweenState = TweenState.complete;
            if (bringToCompletion) {
                // 如果我们逆向运行，我们在0处结束，否则我们进入持续时间
                this._elapsedTime = this._isRunningInReverse ? 0 : this._duration;
                this._loopType = LoopType.none;
                this._loops = 0;
                // TweenManager将在下一个tick上进行删除处理
            }
            else {
                es.TweenManager.removeTween(this);
            }
        };
        Tween.prototype.jumpToElapsedTime = function (elapsedTime) {
            this._elapsedTime = es.MathHelper.clamp(elapsedTime, 0, this._duration);
            this.updateValue();
        };
        /**
         * 反转当前的tween，如果是向前走，就会向后走，反之亦然
         */
        Tween.prototype.reverseTween = function () {
            this._isRunningInReverse = !this._isRunningInReverse;
        };
        /**
         * 当通过StartCoroutine调用时，这将一直持续到tween完成
         */
        Tween.prototype.waitForCompletion = function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this._tweenState != TweenState.complete)) return [3 /*break*/, 2];
                        return [4 /*yield*/, null];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        };
        Tween.prototype.getTargetObject = function () {
            return this._target.getTargetObject();
        };
        Tween.prototype.resetState = function () {
            this.context = null;
            this._completionHandler = this._loopCompleteHandler = null;
            this._isFromValueOverridden = false;
            this._isTimeScaleIndependent = false;
            this._tweenState = TweenState.complete;
            // TODO: 我认为在没有得到用户同意的情况下，我们绝对不应该从_shouldRecycleTween=false。需要研究和思考
            // this._shouldRecycleTween = true;
            this._isRelative = false;
            this._easeType = es.TweenManager.defaultEaseType;
            if (this._nextTween != null) {
                this._nextTween.recycleSelf();
                this._nextTween = null;
            }
            this._delay = 0;
            this._duration = 0;
            this._timeScale = 1;
            this._elapsedTime = 0;
            this._loopType = LoopType.none;
            this._delayBetweenLoops = 0;
            this._loops = 0;
            this._isRunningInReverse = false;
        };
        /**
         * 将所有状态重置为默认值，并根据传入的参数设置初始状态。
         * 这个方法作为一个切入点，这样Tween子类就可以调用它，这样tweens就可以被回收。
         * 当回收时，构造函数不会再被调用，所以这个方法封装了构造函数要做的事情
         * @param target
         * @param to
         * @param duration
         */
        Tween.prototype.initialize = function (target, to, duration) {
            // 重置状态，以防我们被回收
            this.resetState();
            this._target = target;
            this._toValue = to;
            this._duration = duration;
        };
        /**
         * 处理循环逻辑
         * @param elapsedTimeExcess
         */
        Tween.prototype.handleLooping = function (elapsedTimeExcess) {
            this._loops--;
            if (this._loopType == LoopType.pingpong) {
                this.reverseTween();
            }
            if (this._loopType == LoopType.restartFromBeginning || this._loops % 2 == 0) {
                this._loopCompleteHandler && this._completionHandler(this);
            }
            // 如果我们还有循环要处理，就把我们的状态重置为Running，这样我们就可以继续处理它们了
            if (this._loops != 0) {
                this._tweenState = TweenState.running;
                // 现在，我们需要设置我们的经过时间，并考虑到我们的elapsedTimeExcess
                if (this._loopType == LoopType.restartFromBeginning) {
                    this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                }
                else {
                    if (this._isRunningInReverse)
                        this._elapsedTime += this._delayBetweenLoops - elapsedTimeExcess;
                    else
                        this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                }
                // 如果我们有一个elapsedTimeExcess，并且没有delayBetweenLoops，则更新该值
                if (this._delayBetweenLoops == 0 && elapsedTimeExcess > 0) {
                    this.updateValue();
                }
            }
        };
        return Tween;
    }());
    es.Tween = Tween;
})(es || (es = {}));
///<reference path="./Tween.ts"/>
var es;
///<reference path="./Tween.ts"/>
(function (es) {
    var NumberTween = /** @class */ (function (_super) {
        __extends(NumberTween, _super);
        function NumberTween(target, to, duration) {
            var _this = _super.call(this) || this;
            _this.initialize(target, to, duration);
            return _this;
        }
        NumberTween.create = function () {
            return es.TweenManager.cacheNumberTweens ? es.Pool.obtain(NumberTween) : new NumberTween();
        };
        NumberTween.prototype.setIsRelative = function () {
            this._isRelative = true;
            this._toValue += this._fromValue;
            return this;
        };
        NumberTween.prototype.updateValue = function () {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        };
        NumberTween.prototype.recycleSelf = function () {
            _super.prototype.recycleSelf.call(this);
            if (this._shouldRecycleTween && es.TweenManager.cacheNumberTweens)
                es.Pool.free(NumberTween, this);
        };
        return NumberTween;
    }(es.Tween));
    es.NumberTween = NumberTween;
    var Vector2Tween = /** @class */ (function (_super) {
        __extends(Vector2Tween, _super);
        function Vector2Tween(target, to, duration) {
            var _this = _super.call(this) || this;
            _this.initialize(target, to, duration);
            return _this;
        }
        Vector2Tween.create = function () {
            return es.TweenManager.cacheVector2Tweens ? es.Pool.obtain(Vector2Tween) : new Vector2Tween();
        };
        Vector2Tween.prototype.setIsRelative = function () {
            this._isRelative = true;
            this._toValue.add(this._fromValue);
            return this;
        };
        Vector2Tween.prototype.updateValue = function () {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        };
        Vector2Tween.prototype.recycleSelf = function () {
            _super.prototype.recycleSelf.call(this);
            if (this._shouldRecycleTween && es.TweenManager.cacheVector2Tweens)
                es.Pool.free(Vector2Tween, this);
        };
        return Vector2Tween;
    }(es.Tween));
    es.Vector2Tween = Vector2Tween;
    var RectangleTween = /** @class */ (function (_super) {
        __extends(RectangleTween, _super);
        function RectangleTween(target, to, duration) {
            var _this = _super.call(this) || this;
            _this.initialize(target, to, duration);
            return _this;
        }
        RectangleTween.create = function () {
            return es.TweenManager.cacheRectTweens ? es.Pool.obtain(RectangleTween) : new RectangleTween();
        };
        RectangleTween.prototype.setIsRelative = function () {
            this._isRelative = true;
            this._toValue = new es.Rectangle(this._toValue.x + this._fromValue.x, this._toValue.y + this._fromValue.y, this._toValue.width + this._fromValue.width, this._toValue.height + this._fromValue.height);
            return this;
        };
        RectangleTween.prototype.updateValue = function () {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        };
        RectangleTween.prototype.recycleSelf = function () {
            _super.prototype.recycleSelf.call(this);
            if (this._shouldRecycleTween && es.TweenManager.cacheRectTweens)
                es.Pool.free(RectangleTween, this);
        };
        return RectangleTween;
    }(es.Tween));
    es.RectangleTween = RectangleTween;
    var ColorTween = /** @class */ (function (_super) {
        __extends(ColorTween, _super);
        function ColorTween(target, to, duration) {
            var _this = _super.call(this) || this;
            _this.initialize(target, to, duration);
            return _this;
        }
        ColorTween.create = function () {
            return es.TweenManager.cacheColorTweens ? es.Pool.obtain(ColorTween) : new ColorTween();
        };
        ColorTween.prototype.setIsRelative = function () {
            this._isRelative = true;
            this._toValue.r += this._fromValue.r;
            this._toValue.g += this._fromValue.g;
            this._toValue.b += this._fromValue.b;
            this._toValue.a += this._fromValue.a;
            return this;
        };
        ColorTween.prototype.updateValue = function () {
            this._target.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        };
        return ColorTween;
    }(es.Tween));
    es.ColorTween = ColorTween;
})(es || (es = {}));
///<reference path="./Tweens.ts"/>
var es;
///<reference path="./Tweens.ts"/>
(function (es) {
    var RenderableColorTween = /** @class */ (function (_super) {
        __extends(RenderableColorTween, _super);
        function RenderableColorTween() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RenderableColorTween.prototype.setTweenedValue = function (value) {
            this._renderable.color = value;
        };
        RenderableColorTween.prototype.getTweenedValue = function () {
            return this._renderable.color;
        };
        RenderableColorTween.prototype.getTargetObject = function () {
            return this._renderable;
        };
        RenderableColorTween.prototype.updateValue = function () {
            this.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        };
        RenderableColorTween.prototype.setTarget = function (renderable) {
            this._renderable = renderable;
        };
        RenderableColorTween.prototype.recycleSelf = function () {
            if (this._shouldRecycleTween) {
                this._renderable = null;
                this._target = null;
                this._nextTween = null;
            }
            if (this._shouldRecycleTween && es.TweenManager.cacheColorTweens) {
                es.Pool.free(es.ColorTween, this);
            }
        };
        return RenderableColorTween;
    }(es.ColorTween));
    es.RenderableColorTween = RenderableColorTween;
})(es || (es = {}));
var es;
(function (es) {
    var TransformSpringTween = /** @class */ (function (_super) {
        __extends(TransformSpringTween, _super);
        function TransformSpringTween(transform, targetType, targetValue) {
            var _this = _super.call(this) || this;
            // 阻尼比（dampingRatio）和角频率（angularFrequency）的配置是公开的，以便于在设计时进行调整
            /**
             * 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
             */
            _this.dampingRatio = 0.23;
            /**
             * 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定角频率
             */
            _this.angularFrequency = 25;
            _this._transform = transform;
            _this._targetType = targetType;
            _this.setTargetValue(targetValue);
            return _this;
        }
        Object.defineProperty(TransformSpringTween.prototype, "targetType", {
            get: function () {
                return this._targetType;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 你可以在任何时候调用setTargetValue来重置目标值到一个新的Vector2。
         * 如果你没有调用start来添加spring tween，它会为你调用
         * @param targetValue
         */
        TransformSpringTween.prototype.setTargetValue = function (targetValue) {
            this._velocity = es.Vector2.zero;
            this._targetValue = targetValue;
            if (!this._isCurrentlyManagedByTweenManager)
                this.start();
        };
        /**
         * lambda应该是振荡幅度减少50%时的理想持续时间
         * @param lambda
         */
        TransformSpringTween.prototype.updateDampingRatioWithHalfLife = function (lambda) {
            this.dampingRatio = (-lambda / this.angularFrequency) * Math.log(0.5);
        };
        TransformSpringTween.prototype.tick = function () {
            if (!this._isPaused)
                this.setTweenedValue(es.Lerps.fastSpring(this.getCurrentValueOfTweenedTargetType(), this._targetValue, this._velocity, this.dampingRatio, this.angularFrequency));
            return false;
        };
        TransformSpringTween.prototype.setTweenedValue = function (value) {
            switch (this._targetType) {
                case es.TransformTargetType.position:
                    this._transform.position = value;
                    break;
                case es.TransformTargetType.localPosition:
                    this._transform.localPosition = value;
                    break;
                case es.TransformTargetType.scale:
                    this._transform.scale = value;
                    break;
                case es.TransformTargetType.localScale:
                    this._transform.localScale = value;
                    break;
                case es.TransformTargetType.rotationDegrees:
                    this._transform.rotationDegrees = value.x;
                case es.TransformTargetType.localRotationDegrees:
                    this._transform.localRotationDegrees = value.x;
                    break;
            }
        };
        TransformSpringTween.prototype.getCurrentValueOfTweenedTargetType = function () {
            switch (this._targetType) {
                case es.TransformTargetType.position:
                    return this._transform.position;
                case es.TransformTargetType.localPosition:
                    return this._transform.localPosition;
                case es.TransformTargetType.scale:
                    return this._transform.scale;
                case es.TransformTargetType.localScale:
                    return this._transform.localScale;
                case es.TransformTargetType.rotationDegrees:
                    return new es.Vector2(this._transform.rotationDegrees);
                case es.TransformTargetType.localRotationDegrees:
                    return new es.Vector2(this._transform.localRotationDegrees, 0);
                default:
                    return es.Vector2.zero;
            }
        };
        return TransformSpringTween;
    }(es.AbstractTweenable));
    es.TransformSpringTween = TransformSpringTween;
})(es || (es = {}));
///<reference path="./Tweens.ts"/>
var es;
///<reference path="./Tweens.ts"/>
(function (es) {
    /**
     * 对任何与Transform相关的属性tweens都是有用的枚举
     */
    var TransformTargetType;
    (function (TransformTargetType) {
        TransformTargetType[TransformTargetType["position"] = 0] = "position";
        TransformTargetType[TransformTargetType["localPosition"] = 1] = "localPosition";
        TransformTargetType[TransformTargetType["scale"] = 2] = "scale";
        TransformTargetType[TransformTargetType["localScale"] = 3] = "localScale";
        TransformTargetType[TransformTargetType["rotationDegrees"] = 4] = "rotationDegrees";
        TransformTargetType[TransformTargetType["localRotationDegrees"] = 5] = "localRotationDegrees";
    })(TransformTargetType = es.TransformTargetType || (es.TransformTargetType = {}));
    /**
     * 这是一个特殊的情况，因为Transform是迄今为止最被ween的对象。
     * 我们将Tween和ITweenTarget封装在一个单一的、可缓存的类中
     */
    var TransformVector2Tween = /** @class */ (function (_super) {
        __extends(TransformVector2Tween, _super);
        function TransformVector2Tween() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TransformVector2Tween.prototype.setTweenedValue = function (value) {
            switch (this._targetType) {
                case TransformTargetType.position:
                    this._transform.position = value;
                    break;
                case TransformTargetType.localPosition:
                    this._transform.localPosition = value;
                    break;
                case TransformTargetType.scale:
                    this._transform.scale = value;
                    break;
                case TransformTargetType.localScale:
                    this._transform.localScale = value;
                    break;
                case TransformTargetType.rotationDegrees:
                    this._transform.rotationDegrees = value.x;
                case TransformTargetType.localRotationDegrees:
                    this._transform.localRotationDegrees = value.x;
                    break;
            }
        };
        TransformVector2Tween.prototype.getTweenedValue = function () {
            switch (this._targetType) {
                case TransformTargetType.position:
                    return this._transform.position;
                case TransformTargetType.localPosition:
                    return this._transform.localPosition;
                case TransformTargetType.scale:
                    return this._transform.scale;
                case TransformTargetType.localScale:
                    return this._transform.localScale;
                case TransformTargetType.rotationDegrees:
                    return new es.Vector2(this._transform.rotationDegrees, this._transform.rotationDegrees);
                case TransformTargetType.localRotationDegrees:
                    return new es.Vector2(this._transform.localRotationDegrees, 0);
            }
        };
        TransformVector2Tween.prototype.getTargetObject = function () {
            return this._transform;
        };
        TransformVector2Tween.prototype.setTargetAndType = function (transform, targetType) {
            this._transform = transform;
            this._targetType = targetType;
        };
        TransformVector2Tween.prototype.updateValue = function () {
            // 非相对角勒普的特殊情况，使他们采取尽可能短的旋转
            if ((this._targetType == TransformTargetType.rotationDegrees ||
                this._targetType == TransformTargetType.localRotationDegrees) && !this._isRelative) {
                this.setTweenedValue(es.Lerps.easeAngle(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            }
            else {
                this.setTweenedValue(es.Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            }
        };
        TransformVector2Tween.prototype.recycleSelf = function () {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
                this._transform = null;
                es.Pool.free(es.Vector2Tween, this);
            }
        };
        return TransformVector2Tween;
    }(es.Vector2Tween));
    es.TransformVector2Tween = TransformVector2Tween;
})(es || (es = {}));
var es;
(function (es) {
    var EaseType;
    (function (EaseType) {
        EaseType[EaseType["linear"] = 0] = "linear";
        EaseType[EaseType["sineIn"] = 1] = "sineIn";
        EaseType[EaseType["sineOut"] = 2] = "sineOut";
        EaseType[EaseType["sineInOut"] = 3] = "sineInOut";
        EaseType[EaseType["quadIn"] = 4] = "quadIn";
        EaseType[EaseType["quadOut"] = 5] = "quadOut";
        EaseType[EaseType["quadInOut"] = 6] = "quadInOut";
        EaseType[EaseType["quintIn"] = 7] = "quintIn";
        EaseType[EaseType["quintOut"] = 8] = "quintOut";
        EaseType[EaseType["quintInOut"] = 9] = "quintInOut";
        EaseType[EaseType["cubicIn"] = 10] = "cubicIn";
        EaseType[EaseType["cubicOut"] = 11] = "cubicOut";
        EaseType[EaseType["cubicInOut"] = 12] = "cubicInOut";
        EaseType[EaseType["quartIn"] = 13] = "quartIn";
        EaseType[EaseType["quartOut"] = 14] = "quartOut";
        EaseType[EaseType["quartInOut"] = 15] = "quartInOut";
        EaseType[EaseType["expoIn"] = 16] = "expoIn";
        EaseType[EaseType["expoOut"] = 17] = "expoOut";
        EaseType[EaseType["expoInOut"] = 18] = "expoInOut";
        EaseType[EaseType["circleIn"] = 19] = "circleIn";
        EaseType[EaseType["circleOut"] = 20] = "circleOut";
        EaseType[EaseType["circleInOut"] = 21] = "circleInOut";
        EaseType[EaseType["elasticIn"] = 22] = "elasticIn";
        EaseType[EaseType["elasticOut"] = 23] = "elasticOut";
        EaseType[EaseType["elasticInOut"] = 24] = "elasticInOut";
        EaseType[EaseType["punch"] = 25] = "punch";
        EaseType[EaseType["backIn"] = 26] = "backIn";
        EaseType[EaseType["backOut"] = 27] = "backOut";
        EaseType[EaseType["backInOut"] = 28] = "backInOut";
        EaseType[EaseType["bounceIn"] = 29] = "bounceIn";
        EaseType[EaseType["bounceOut"] = 30] = "bounceOut";
        EaseType[EaseType["bounceInOut"] = 31] = "bounceInOut";
    })(EaseType = es.EaseType || (es.EaseType = {}));
    /**
     * 助手的一个方法，它接收一个EaseType，并通过给定的持续时间和时间参数来应用该Ease方程。
     * 我们这样做是为了避免传来传去的Funcs为垃圾收集器制造大量垃圾
     */
    var EaseHelper = /** @class */ (function () {
        function EaseHelper() {
        }
        /**
         * 返回 easeType 的相反 EaseType
         * @param easeType
         */
        EaseHelper.oppositeEaseType = function (easeType) {
            switch (easeType) {
                case EaseType.linear:
                    return easeType;
                case EaseType.backIn:
                    return EaseType.backOut;
                case EaseType.backOut:
                    return EaseType.backIn;
                case EaseType.backInOut:
                    return easeType;
                case EaseType.bounceIn:
                    return EaseType.bounceOut;
                case EaseType.bounceOut:
                    return EaseType.bounceIn;
                case EaseType.bounceInOut:
                    return easeType;
                case EaseType.circleIn:
                    return EaseType.circleOut;
                case EaseType.circleOut:
                    return EaseType.circleIn;
                case EaseType.circleInOut:
                    return easeType;
                case EaseType.cubicIn:
                    return EaseType.cubicOut;
                case EaseType.cubicOut:
                    return EaseType.cubicIn;
                case EaseType.circleInOut:
                    return easeType;
                case EaseType.punch:
                    return easeType;
                case EaseType.expoIn:
                    return EaseType.expoOut;
                case EaseType.expoOut:
                    return EaseType.expoIn;
                case EaseType.expoInOut:
                    return easeType;
                case EaseType.quadIn:
                    return EaseType.quadOut;
                case EaseType.quadOut:
                    return EaseType.quadIn;
                case EaseType.quadInOut:
                    return easeType;
                case EaseType.quartIn:
                    return EaseType.quadOut;
                case EaseType.quartOut:
                    return EaseType.quartIn;
                case EaseType.quadInOut:
                    return easeType;
                case EaseType.sineIn:
                    return EaseType.sineOut;
                case EaseType.sineOut:
                    return EaseType.sineIn;
                case EaseType.sineInOut:
                    return easeType;
                default:
                    return easeType;
            }
        };
        EaseHelper.ease = function (easeType, t, duration) {
            switch (easeType) {
                case EaseType.linear:
                    return es.Easing.Linear.easeNone(t, duration);
                case EaseType.backIn:
                    return es.Easing.Back.easeIn(t, duration);
                case EaseType.backOut:
                    return es.Easing.Back.easeOut(t, duration);
                case EaseType.backInOut:
                    return es.Easing.Back.easeInOut(t, duration);
                case EaseType.bounceIn:
                    return es.Easing.Bounce.easeIn(t, duration);
                case EaseType.bounceOut:
                    return es.Easing.Bounce.easeOut(t, duration);
                case EaseType.bounceInOut:
                    return es.Easing.Bounce.easeInOut(t, duration);
                case EaseType.circleIn:
                    return es.Easing.Circular.easeIn(t, duration);
                case EaseType.circleOut:
                    return es.Easing.Circular.easeOut(t, duration);
                case EaseType.circleInOut:
                    return es.Easing.Circular.easeInOut(t, duration);
                case EaseType.cubicIn:
                    return es.Easing.Cubic.easeIn(t, duration);
                case EaseType.cubicOut:
                    return es.Easing.Cubic.easeOut(t, duration);
                case EaseType.cubicInOut:
                    return es.Easing.Cubic.easeInOut(t, duration);
                case EaseType.elasticIn:
                    return es.Easing.Elastic.easeIn(t, duration);
                case EaseType.elasticOut:
                    return es.Easing.Elastic.easeOut(t, duration);
                case EaseType.elasticInOut:
                    return es.Easing.Elastic.easeInOut(t, duration);
                case EaseType.punch:
                    return es.Easing.Elastic.punch(t, duration);
                case EaseType.expoIn:
                    return es.Easing.Exponential.easeIn(t, duration);
                case EaseType.expoOut:
                    return es.Easing.Exponential.easeOut(t, duration);
                case EaseType.expoInOut:
                    return es.Easing.Exponential.easeInOut(t, duration);
                case EaseType.quadIn:
                    return es.Easing.Quadratic.easeIn(t, duration);
                case EaseType.quadOut:
                    return es.Easing.Quadratic.easeOut(t, duration);
                case EaseType.quadInOut:
                    return es.Easing.Quadratic.easeInOut(t, duration);
                case EaseType.quadIn:
                    return es.Easing.Quadratic.easeIn(t, duration);
                case EaseType.quadOut:
                    return es.Easing.Quadratic.easeOut(t, duration);
                case EaseType.quadInOut:
                    return es.Easing.Quadratic.easeInOut(t, duration);
                case EaseType.quintIn:
                    return es.Easing.Quintic.easeIn(t, duration);
                case EaseType.quintOut:
                    return es.Easing.Quintic.easeOut(t, duration);
                case EaseType.quintInOut:
                    return es.Easing.Quintic.easeInOut(t, duration);
                case EaseType.sineIn:
                    return es.Easing.Sinusoidal.easeIn(t, duration);
                case EaseType.sineOut:
                    return es.Easing.Sinusoidal.easeOut(t, duration);
                case EaseType.sineInOut:
                    return es.Easing.Sinusoidal.easeInOut(t, duration);
                default:
                    return es.Easing.Linear.easeNone(t, duration);
            }
        };
        return EaseHelper;
    }());
    es.EaseHelper = EaseHelper;
})(es || (es = {}));
var es;
(function (es) {
    var GlobalManager = /** @class */ (function () {
        function GlobalManager() {
        }
        Object.defineProperty(GlobalManager.prototype, "enabled", {
            /**
             * 如果true则启用了GlobalManager。
             * 状态的改变会导致调用OnEnabled/OnDisable
             */
            get: function () {
                return this._enabled;
            },
            /**
             * 如果true则启用了GlobalManager。
             * 状态的改变会导致调用OnEnabled/OnDisable
             * @param value
             */
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 启用/禁用这个GlobalManager
         * @param isEnabled
         */
        GlobalManager.prototype.setEnabled = function (isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                    this.onEnabled();
                }
                else {
                    this.onDisabled();
                }
            }
        };
        /**
         * 此GlobalManager启用时调用
         */
        GlobalManager.prototype.onEnabled = function () {
        };
        /**
         * 此GlobalManager禁用时调用
         */
        GlobalManager.prototype.onDisabled = function () {
        };
        /**
         * 在frame .update之前调用每一帧
         */
        GlobalManager.prototype.update = function () {
        };
        return GlobalManager;
    }());
    es.GlobalManager = GlobalManager;
})(es || (es = {}));
///<reference path="./Easing/EaseType.ts" />
///<reference path="../Utils/GlobalManager.ts"/>
var es;
///<reference path="./Easing/EaseType.ts" />
///<reference path="../Utils/GlobalManager.ts"/>
(function (es) {
    var TweenManager = /** @class */ (function (_super) {
        __extends(TweenManager, _super);
        function TweenManager() {
            var _this = _super.call(this) || this;
            /**
             * 当前所有活跃用户的内部列表
             */
            _this._activeTweens = [];
            _this._tempTweens = [];
            TweenManager._instance = _this;
            return _this;
        }
        TweenManager.prototype.update = function () {
            this._isUpdating = true;
            // 反向循环，这样我们就可以把完成的weens删除了
            for (var i = this._activeTweens.length - 1; i >= 0; --i) {
                var tween = this._activeTweens[i];
                if (tween.tick())
                    this._tempTweens.push(tween);
            }
            this._isUpdating = false;
            for (var i = 0; i < this._tempTweens.length; i++) {
                this._tempTweens[i].recycleSelf();
                new es.List(this._activeTweens).remove(this._tempTweens[i]);
            }
            this._tempTweens.length = 0;
        };
        /**
         * 将一个tween添加到活动tweens列表中
         * @param tween
         */
        TweenManager.addTween = function (tween) {
            TweenManager._instance._activeTweens.push(tween);
        };
        /**
         * 从当前的tweens列表中删除一个tween
         * @param tween
         */
        TweenManager.removeTween = function (tween) {
            if (TweenManager._instance._isUpdating) {
                TweenManager._instance._tempTweens.push(tween);
            }
            else {
                tween.recycleSelf();
                new es.List(TweenManager._instance._activeTweens).remove(tween);
            }
        };
        /**
         * 停止所有的tween并选择地把他们全部完成
         * @param bringToCompletion
         */
        TweenManager.stopAllTweens = function (bringToCompletion) {
            if (bringToCompletion === void 0) { bringToCompletion = false; }
            for (var i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i)
                TweenManager._instance._activeTweens[i].stop(bringToCompletion);
        };
        /**
         * 返回具有特定上下文的所有tweens。
         * Tweens以ITweenable的形式返回，因为这就是TweenManager所知道的所有内容
         * @param context
         */
        TweenManager.allTweensWithContext = function (context) {
            var foundTweens = [];
            for (var i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if (TweenManager._instance._activeTweens[i].context == context)
                    foundTweens.push(TweenManager._instance._activeTweens[i]);
            }
            return foundTweens;
        };
        /**
         * 停止所有给定上下文的tweens
         * @param context
         * @param bringToCompletion
         */
        TweenManager.stopAllTweensWithContext = function (context, bringToCompletion) {
            if (bringToCompletion === void 0) { bringToCompletion = false; }
            for (var i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if (TweenManager._instance._activeTweens[i].context == context)
                    TweenManager._instance._activeTweens[i].stop(bringToCompletion);
            }
        };
        /**
         * 返回具有特定目标的所有tweens。
         * Tweens以ITweenControl的形式返回，因为TweenManager只知道这些
         * @param target
         */
        TweenManager.allTweenWithTarget = function (target) {
            var foundTweens = [];
            for (var i = 0; i < TweenManager._instance._activeTweens.length; i++) {
                if (TweenManager._instance._activeTweens[i]) {
                    var tweenControl = TweenManager._instance._activeTweens[i];
                    if (tweenControl.getTargetObject() == target)
                        foundTweens.push(TweenManager._instance._activeTweens[i]);
                }
            }
            return foundTweens;
        };
        /**
         * 停止所有具有TweenManager知道的特定目标的tweens
         * @param target
         * @param bringToCompletion
         */
        TweenManager.stopAllTweensWithTarget = function (target, bringToCompletion) {
            if (bringToCompletion === void 0) { bringToCompletion = false; }
            for (var i = TweenManager._instance._activeTweens.length - 1; i >= 0; --i) {
                if (TweenManager._instance._activeTweens[i]) {
                    var tweenControl = TweenManager._instance._activeTweens[i];
                    if (tweenControl.getTargetObject() == target)
                        tweenControl.stop(bringToCompletion);
                }
            }
        };
        TweenManager.defaultEaseType = es.EaseType.quartIn;
        /**
         * 如果为真，当加载新关卡时，活动的tween列表将被清除
         */
        TweenManager.removeAllTweensOnLevelLoad = false;
        /**
         * 这里支持各种类型的自动缓存。请
         * 注意，只有在使用扩展方法启动tweens时，或者在做自定义tweens时从缓存中获取tween时，缓存才会起作用。
         * 关于如何获取缓存的tween，请参见扩展方法的实现
         */
        TweenManager.cacheNumberTweens = true;
        TweenManager.cacheVector2Tweens = true;
        TweenManager.cacheColorTweens = true;
        TweenManager.cacheRectTweens = false;
        return TweenManager;
    }(es.GlobalManager));
    es.TweenManager = TweenManager;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 标准缓和方程通过将b和c参数（起始值和变化值）用0和1替换，然后进行简化。
     * 这样做的目的是为了让我们可以得到一个0 - 1之间的原始值（除了弹性/反弹故意超过界限），然后用这个值来lerp任何东西
     */
    var Easing;
    (function (Easing) {
        var Linear = /** @class */ (function () {
            function Linear() {
            }
            Linear.easeNone = function (t, d) {
                return t / d;
            };
            return Linear;
        }());
        Easing.Linear = Linear;
        var Quadratic = /** @class */ (function () {
            function Quadratic() {
            }
            Quadratic.easeIn = function (t, d) {
                return (t /= d) * t;
            };
            Quadratic.easeOut = function (t, d) {
                return -1 * (t /= d) * (t - 2);
            };
            Quadratic.easeInOut = function (t, d) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t;
                return -0.5 * ((--t) * (t - 2) - 1);
            };
            return Quadratic;
        }());
        Easing.Quadratic = Quadratic;
        var Back = /** @class */ (function () {
            function Back() {
            }
            Back.easeIn = function (t, d) {
                return (t /= d) * t * ((1.70158 + 1) * t - 1.70158);
            };
            Back.easeOut = function (t, d) {
                return ((t = t / d - 1) * t * ((1.70158 + 1) * t + 1.70158) + 1);
            };
            Back.easeInOut = function (t, d) {
                var s = 1.70158;
                if ((t /= d / 2) < 1) {
                    return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
                }
                return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
            };
            return Back;
        }());
        Easing.Back = Back;
        var Bounce = /** @class */ (function () {
            function Bounce() {
            }
            Bounce.easeOut = function (t, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return (7.5625 * t * t);
                }
                else if (t < (2 / 2.75)) {
                    return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
                }
                else if (t < (2.5 / 2.75)) {
                    return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
                }
                else {
                    return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
                }
            };
            Bounce.easeIn = function (t, d) {
                return 1 - this.easeOut(d - t, d);
            };
            Bounce.easeInOut = function (t, d) {
                if (t < d / 2)
                    return this.easeIn(t * 2, d) * 0.5;
                else
                    return this.easeOut(t * 2 - d, d) * 0.5 + 1 * 0.5;
            };
            return Bounce;
        }());
        Easing.Bounce = Bounce;
        var Circular = /** @class */ (function () {
            function Circular() {
            }
            Circular.easeIn = function (t, d) {
                return -(Math.sqrt(1 - (t /= d) * t) - 1);
            };
            Circular.easeOut = function (t, d) {
                return Math.sqrt(1 - (t = t / d - 1) * t);
            };
            Circular.easeInOut = function (t, d) {
                if ((t /= d / 2) < 1)
                    return -0.5 * (Math.sqrt(1 - t * t) - 1);
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            };
            return Circular;
        }());
        Easing.Circular = Circular;
        var Cubic = /** @class */ (function () {
            function Cubic() {
            }
            Cubic.easeIn = function (t, d) {
                return (t /= d) * t * t;
            };
            Cubic.easeOut = function (t, d) {
                return ((t = t / d - 1) * t * t + 1);
            };
            Cubic.easeInOut = function (t, d) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t;
                return 0.5 * ((t -= 2) * t * t + 2);
            };
            return Cubic;
        }());
        Easing.Cubic = Cubic;
        var Elastic = /** @class */ (function () {
            function Elastic() {
            }
            Elastic.easeIn = function (t, d) {
                if (t == 0)
                    return 0;
                if ((t /= d) == 1)
                    return 1;
                var p = d * 0.3;
                var s = p / 4;
                return -(1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p));
            };
            Elastic.easeOut = function (t, d) {
                if (t == 0)
                    return 0;
                if ((t /= d) == 1)
                    return 1;
                var p = d * 0.3;
                var s = p / 4;
                return (1 * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + 1);
            };
            Elastic.easeInOut = function (t, d) {
                if (t == 0)
                    return 0;
                if ((t /= d / 2) == 2)
                    return 1;
                var p = d * (0.3 * 1.5);
                var s = p / 4;
                if (t < 1)
                    return -0.5 * (Math.pow(2, 10 * (t -= 1)) * Math.sin(t * d - s) * (2 * Math.PI) / p);
                return (Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + 1);
            };
            Elastic.punch = function (t, d) {
                if (t == 0)
                    return 0;
                if ((t /= d) == 1)
                    return 0;
                var p = 0.3;
                return (Math.pow(2, -10 * t) * Math.sin(t * (2 * Math.PI) / p));
            };
            return Elastic;
        }());
        Easing.Elastic = Elastic;
        var Exponential = /** @class */ (function () {
            function Exponential() {
            }
            Exponential.easeIn = function (t, d) {
                return (t == 0) ? 0 : Math.pow(2, 10 * (t / d - 1));
            };
            Exponential.easeOut = function (t, d) {
                return t == d ? 1 : (-Math.pow(2, -10 * t / d) + 1);
            };
            Exponential.easeInOut = function (t, d) {
                if (t == 0)
                    return 0;
                if (t == d)
                    return 1;
                if ((t /= d / 2) < 1) {
                    return 0.5 * Math.pow(2, 10 * (t - 1));
                }
                return 0.5 * (-Math.pow(2, -10 * --t) + 2);
            };
            return Exponential;
        }());
        Easing.Exponential = Exponential;
        var Quartic = /** @class */ (function () {
            function Quartic() {
            }
            Quartic.easeIn = function (t, d) {
                return (t /= d) * t * t * t;
            };
            Quartic.easeOut = function (t, d) {
                return -1 * ((t = t / d - 1) * t * t * t - 1);
            };
            Quartic.easeInOut = function (t, d) {
                t /= d / 2;
                if (t < 1)
                    return 0.5 * t * t * t * t;
                t -= 2;
                return -0.5 * (t * t * t * t - 2);
            };
            return Quartic;
        }());
        Easing.Quartic = Quartic;
        var Quintic = /** @class */ (function () {
            function Quintic() {
            }
            Quintic.easeIn = function (t, d) {
                return (t /= d) * t * t * t * t;
            };
            Quintic.easeOut = function (t, d) {
                return ((t = t / d - 1) * t * t * t * t + 1);
            };
            Quintic.easeInOut = function (t, d) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t * t * t;
                return 0.5 * ((t -= 2) * t * t * t * t + 2);
            };
            return Quintic;
        }());
        Easing.Quintic = Quintic;
        var Sinusoidal = /** @class */ (function () {
            function Sinusoidal() {
            }
            Sinusoidal.easeIn = function (t, d) {
                return -1 * Math.cos(t / d * (Math.PI / 2)) + 1;
            };
            Sinusoidal.easeOut = function (t, d) {
                return Math.sin(t / d * (Math.PI / 2));
            };
            Sinusoidal.easeInOut = function (t, d) {
                return -0.5 * (Math.cos(Math.PI * t / d) - 1);
            };
            return Sinusoidal;
        }());
        Easing.Sinusoidal = Sinusoidal;
    })(Easing = es.Easing || (es.Easing = {}));
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 一系列静态方法来处理所有常见的tween类型结构，以及它们的unclamped lerps.unclamped lerps对于超过0-1范围的bounce、elastic或其他tweens是必需的
     */
    var Lerps = /** @class */ (function () {
        function Lerps() {
        }
        Lerps.lerp = function (from, to, t) {
            if (typeof (from) == "number" && typeof (to) == "number") {
                return from + (to - from) * t;
            }
            if (from instanceof es.Color && to instanceof es.Color) {
                var t255 = t * 255;
                return new es.Color(from.r + (to.r - from.r) * t255 / 255, from.g + (to.g - from.g) * t255 / 255, from.b + (to.b - from.b) * t255 / 255, from.a + (to.a - from.a) * t255 / 255);
            }
            if (from instanceof es.Rectangle && to instanceof es.Rectangle) {
                return new es.Rectangle((from.x + (to.x - from.x) * t), (from.y + (to.x - from.y) * t), (from.width + (to.width - from.width) * t), (from.height + (to.height - from.height) * t));
            }
            if (from instanceof es.Vector2 && to instanceof es.Vector2) {
                return new es.Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
            }
        };
        Lerps.angleLerp = function (from, to, t) {
            // 我们计算这个lerp的最短角差
            var toMinusFrom = new es.Vector2(es.MathHelper.deltaAngle(from.x, to.x), es.MathHelper.deltaAngle(from.y, to.y));
            return new es.Vector2(from.x + toMinusFrom.x * t, from.y + toMinusFrom.y * t);
        };
        Lerps.ease = function (easeType, from, to, t, duration) {
            if (typeof (from) == 'number' && typeof (to) == "number") {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
            if (from instanceof es.Vector2 && to instanceof es.Vector2) {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
            if (from instanceof es.Rectangle && to instanceof es.Rectangle) {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
            if (from instanceof es.Color && to instanceof es.Color) {
                return this.lerp(from, to, es.EaseHelper.ease(easeType, t, duration));
            }
        };
        Lerps.easeAngle = function (easeType, from, to, t, duration) {
            return this.angleLerp(from, to, es.EaseHelper.ease(easeType, t, duration));
        };
        /**
         * 使用半隐式欧拉方法。速度较慢，但总是很稳定。见
         * http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
         * @param currentValue
         * @param targetValue
         * @param velocity Velocity的引用。如果在两次调用之间改变targetValue，请务必将其重置为0
         * @param dampingRatio 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
         * @param angularFrequency 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定
         */
        Lerps.fastSpring = function (currentValue, targetValue, velocity, dampingRatio, angularFrequency) {
            velocity.add(velocity.scale(-2 * es.Time.deltaTime * dampingRatio * angularFrequency)
                .add(targetValue.sub(currentValue).scale(es.Time.deltaTime * angularFrequency * angularFrequency)));
            currentValue.add(velocity.scale(es.Time.deltaTime));
            return currentValue;
        };
        return Lerps;
    }());
    es.Lerps = Lerps;
})(es || (es = {}));
var es;
(function (es) {
    var AnimCurve = /** @class */ (function () {
        function AnimCurve(points) {
            if (points.length < 2) {
                throw new Error('curve length must be >= 2');
            }
            points.sort(function (a, b) {
                return a.t - b.t;
            });
            if (points[0].t !== 0) {
                throw new Error('curve must start with 0');
            }
            if (points[points.length - 1].t !== 1) {
                throw new Error('curve must end with 1');
            }
            this._points = points;
        }
        Object.defineProperty(AnimCurve.prototype, "points", {
            get: function () {
                return this._points;
            },
            enumerable: true,
            configurable: true
        });
        AnimCurve.prototype.lerp = function (t) {
            for (var i = 1; i < this._points.length; i++) {
                if (t <= this._points[i].t) {
                    var m = es.MathHelper.map01(t, this._points[i - 1].t, this._points[i].t);
                    return es.MathHelper.lerp(this._points[i - 1].value, this._points[i].value, m);
                }
            }
            throw new Error('should never be here');
        };
        return AnimCurve;
    }());
    es.AnimCurve = AnimCurve;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于包装事件的一个小类
     */
    var FuncPack = /** @class */ (function () {
        function FuncPack(func, context) {
            this.func = func;
            this.context = context;
        }
        return FuncPack;
    }());
    es.FuncPack = FuncPack;
    /**
     * 用于事件管理
     */
    var Emitter = /** @class */ (function () {
        function Emitter() {
            this._messageTable = new Map();
        }
        /**
         * 开始监听项
         * @param eventType 监听类型
         * @param handler 监听函数
         * @param context 监听上下文
         */
        Emitter.prototype.addObserver = function (eventType, handler, context) {
            var list = this._messageTable.get(eventType);
            if (!list) {
                list = [];
                this._messageTable.set(eventType, list);
            }
            es.Insist.isFalse(list.findIndex(function (funcPack) { return funcPack.func == handler; }) != -1, "您试图添加相同的观察者两次");
            list.push(new FuncPack(handler, context));
        };
        /**
         * 移除监听项
         * @param eventType 事件类型
         * @param handler 事件函数
         */
        Emitter.prototype.removeObserver = function (eventType, handler) {
            var messageData = this._messageTable.get(eventType);
            var index = messageData.findIndex(function (data) { return data.func == handler; });
            if (index != -1)
                messageData.splice(index, 1);
        };
        /**
         * 触发该事件
         * @param eventType 事件类型
         * @param data 事件数据
         */
        Emitter.prototype.emit = function (eventType) {
            var data = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                data[_i - 1] = arguments[_i];
            }
            var _a;
            var list = this._messageTable.get(eventType);
            if (list) {
                for (var i = list.length - 1; i >= 0; i--)
                    (_a = list[i].func).call.apply(_a, __spread([list[i].context], data));
            }
        };
        return Emitter;
    }());
    es.Emitter = Emitter;
})(es || (es = {}));
var es;
(function (es) {
    var Edge;
    (function (Edge) {
        Edge[Edge["top"] = 0] = "top";
        Edge[Edge["bottom"] = 1] = "bottom";
        Edge[Edge["left"] = 2] = "left";
        Edge[Edge["right"] = 3] = "right";
    })(Edge = es.Edge || (es.Edge = {}));
})(es || (es = {}));
var es;
(function (es) {
    var EqualityComparer = /** @class */ (function () {
        function EqualityComparer() {
        }
        EqualityComparer.default = function () {
            return new EqualityComparer();
        };
        EqualityComparer.prototype.equals = function (x, y) {
            if (typeof x["equals"] == 'function') {
                return x["equals"](y);
            }
            else {
                return x === y;
            }
        };
        EqualityComparer.prototype.getHashCode = function (o) {
            var _this = this;
            if (typeof o == 'number') {
                return this._getHashCodeForNumber(o);
            }
            if (typeof o == 'string') {
                return this._getHashCodeForString(o);
            }
            var hashCode = 385229220;
            this.forOwn(o, function (value) {
                if (typeof value == 'number') {
                    hashCode += _this._getHashCodeForNumber(value);
                }
                else if (typeof value == 'string') {
                    hashCode += _this._getHashCodeForString(value);
                }
                else if (typeof value == 'object') {
                    _this.forOwn(value, function () {
                        hashCode += _this.getHashCode(value);
                    });
                }
            });
            return hashCode;
        };
        EqualityComparer.prototype._getHashCodeForNumber = function (n) {
            return n;
        };
        EqualityComparer.prototype._getHashCodeForString = function (s) {
            var hashCode = 385229220;
            for (var i = 0; i < s.length; i++) {
                hashCode = (hashCode * -1521134295) ^ s.charCodeAt(i);
            }
            return hashCode;
        };
        EqualityComparer.prototype.forOwn = function (object, iteratee) {
            object = Object(object);
            Object.keys(object).forEach(function (key) { return iteratee(object[key], key, object); });
        };
        return EqualityComparer;
    }());
    es.EqualityComparer = EqualityComparer;
})(es || (es = {}));
var es;
(function (es) {
    var Hash = /** @class */ (function () {
        function Hash() {
        }
        /**
         * 从一个字节数组中计算一个哈希值
         * @param data
         */
        Hash.computeHash = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            var p = 16777619;
            var hash = 2166136261;
            for (var i = 0; i < data.length; i++)
                hash = (hash ^ data[i]) * p;
            hash += hash << 13;
            hash ^= hash >> 7;
            hash += hash << 3;
            hash ^= hash >> 17;
            hash += hash << 5;
            return hash;
        };
        return Hash;
    }());
    es.Hash = Hash;
})(es || (es = {}));
var es;
(function (es) {
    var Observable = /** @class */ (function () {
        function Observable() {
            this._listeners = [];
        }
        Observable.prototype.addListener = function (caller, callback) {
            if (this._listeners.findIndex(function (listener) {
                return listener.callback === callback && listener.caller === caller;
            }) === -1) {
                this._listeners.push({ caller: caller, callback: callback });
            }
        };
        Observable.prototype.removeListener = function (caller, callback) {
            var index = this._listeners.findIndex(function (listener) { return listener.callback === callback && listener.caller === caller; });
            if (index >= 0) {
                this._listeners.splice(index, 1);
            }
        };
        Observable.prototype.clearListener = function () {
            this._listeners = [];
        };
        Observable.prototype.clearListenerWithCaller = function (caller) {
            for (var i = this._listeners.length - 1; i >= 0; i--) {
                var listener = this._listeners[i];
                if (listener.caller === caller) {
                    this._listeners.splice(i, 1);
                }
            }
        };
        Observable.prototype.notify = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            for (var i = this._listeners.length - 1; i >= 0; i--) {
                var listener = this._listeners[i];
                if (listener.caller) {
                    (_a = listener.callback).call.apply(_a, __spread([listener.caller], args));
                }
                else {
                    listener.callback.apply(listener, __spread(args));
                }
            }
        };
        return Observable;
    }());
    es.Observable = Observable;
    var ObservableT = /** @class */ (function (_super) {
        __extends(ObservableT, _super);
        function ObservableT() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ObservableT.prototype.addListener = function (caller, callback) {
            _super.prototype.addListener.call(this, caller, callback);
        };
        ObservableT.prototype.removeListener = function (caller, callback) {
            _super.prototype.removeListener.call(this, caller, callback);
        };
        ObservableT.prototype.notify = function (arg) {
            _super.prototype.notify.call(this, arg);
        };
        return ObservableT;
    }(Observable));
    es.ObservableT = ObservableT;
    var ObservableTT = /** @class */ (function (_super) {
        __extends(ObservableTT, _super);
        function ObservableTT() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ObservableTT.prototype.addListener = function (caller, callback) {
            _super.prototype.addListener.call(this, caller, callback);
        };
        ObservableTT.prototype.removeListener = function (caller, callback) {
            _super.prototype.removeListener.call(this, caller, callback);
        };
        ObservableTT.prototype.notify = function (arg1, arg2) {
            _super.prototype.notify.call(this, arg1, arg2);
        };
        return ObservableTT;
    }(Observable));
    es.ObservableTT = ObservableTT;
    var Command = /** @class */ (function () {
        function Command(caller, action) {
            this.bindAction(caller, action);
            this._onExec = new Observable();
        }
        Command.prototype.bindAction = function (caller, action) {
            this._caller = caller;
            this._action = action;
        };
        Command.prototype.dispatch = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var _a;
            if (this._action) {
                if (this._caller) {
                    (_a = this._action).call.apply(_a, __spread([this._caller], args));
                }
                else {
                    this._action.apply(this, __spread(args));
                }
                this._onExec.notify();
            }
            else {
                console.warn('command not bind with an action');
            }
        };
        Command.prototype.addListener = function (caller, callback) {
            this._onExec.addListener(caller, callback);
        };
        Command.prototype.removeListener = function (caller, callback) {
            this._onExec.removeListener(caller, callback);
        };
        Command.prototype.clearListener = function () {
            this._onExec.clearListener();
        };
        Command.prototype.clearListenerWithCaller = function (caller) {
            this._onExec.clearListenerWithCaller(caller);
        };
        return Command;
    }());
    es.Command = Command;
    var ValueChangeCommand = /** @class */ (function () {
        function ValueChangeCommand(value) {
            this._onValueChange = new Observable();
            this._value = value;
        }
        Object.defineProperty(ValueChangeCommand.prototype, "onValueChange", {
            get: function () {
                return this._onValueChange;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ValueChangeCommand.prototype, "value", {
            get: function () {
                return this._value;
            },
            set: function (newValue) {
                this._value = newValue;
            },
            enumerable: true,
            configurable: true
        });
        ValueChangeCommand.prototype.dispatch = function (value) {
            if (value !== this._value) {
                var oldValue = this._value;
                this._value = value;
                this._onValueChange.notify(this._value, oldValue);
            }
        };
        ValueChangeCommand.prototype.addListener = function (caller, callback) {
            this._onValueChange.addListener(caller, callback);
        };
        ValueChangeCommand.prototype.removeListener = function (caller, callback) {
            this._onValueChange.removeListener(caller, callback);
        };
        ValueChangeCommand.prototype.clearListener = function () {
            this._onValueChange.clearListener();
        };
        ValueChangeCommand.prototype.clearListenerWithCaller = function (caller) {
            this._onValueChange.clearListenerWithCaller(caller);
        };
        return ValueChangeCommand;
    }());
    es.ValueChangeCommand = ValueChangeCommand;
})(es || (es = {}));
var es;
(function (es) {
    var Ref = /** @class */ (function () {
        function Ref(value) {
            this.value = value;
        }
        return Ref;
    }());
    es.Ref = Ref;
})(es || (es = {}));
var es;
(function (es) {
    var Screen = /** @class */ (function () {
        function Screen() {
        }
        Object.defineProperty(Screen, "size", {
            get: function () {
                return new es.Vector2(this.width, this.height);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Screen, "center", {
            get: function () {
                return new es.Vector2(this.width / 2, this.height / 2);
            },
            enumerable: true,
            configurable: true
        });
        return Screen;
    }());
    es.Screen = Screen;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 管理数值的简单助手类。它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中。
     */
    var SubpixelNumber = /** @class */ (function () {
        function SubpixelNumber() {
        }
        /**
         * 以amount递增余数，将值截断为int，存储新的余数并将amount设置为当前值。
         * @param amount
         */
        SubpixelNumber.prototype.update = function (amount) {
            this.remainder += amount;
            var motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            return motion;
        };
        /**
         * 将余数重置为0。当一个物体与一个不可移动的物体碰撞时有用。
         * 在这种情况下，您将希望将亚像素余数归零，因为它是空的和无效的碰撞。
         */
        SubpixelNumber.prototype.reset = function () {
            this.remainder = 0;
        };
        return SubpixelNumber;
    }());
    es.SubpixelNumber = SubpixelNumber;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 简单的剪耳三角测量器，最终的三角形将出现在triangleIndices列表中。
     */
    var Triangulator = /** @class */ (function () {
        function Triangulator() {
            /**
             * 上次三角函数调用中使用的点列表的三角列表条目索引
             */
            this.triangleIndices = [];
            this._triPrev = new Array(12);
            this._triNext = new Array(12);
        }
        Triangulator.testPointTriangle = function (point, a, b, c) {
            // 如果点在AB的右边，那么外边的三角形是
            if (es.Vector2Ext.cross(point.sub(a), b.sub(a)) < 0)
                return false;
            // 如果点在BC的右边，则在三角形的外侧
            if (es.Vector2Ext.cross(point.sub(b), c.sub(b)) < 0)
                return false;
            // 如果点在ca的右边，则在三角形的外面
            if (es.Vector2Ext.cross(point.sub(c), a.sub(c)) < 0)
                return false;
            // 点在三角形上
            return true;
        };
        /**
         * 计算一个三角形列表，该列表完全覆盖给定点集所包含的区域。如果点不是CCW，则将arePointsCCW参数传递为false
         * @param points 定义封闭路径的点列表
         * @param arePointsCCW
         */
        Triangulator.prototype.triangulate = function (points, arePointsCCW) {
            if (arePointsCCW === void 0) { arePointsCCW = true; }
            var count = points.length;
            // 设置前一个链接和下一个链接
            this.initialize(count);
            // 非三角的多边形断路器
            var iterations = 0;
            // 从0开始
            var index = 0;
            // 继续移除所有的三角形，直到只剩下一个三角形
            while (count > 3 && iterations < 500) {
                iterations++;
                var isEar = true;
                var a = points[this._triPrev[index]];
                var b = points[index];
                var c = points[this._triNext[index]];
                if (es.Vector2Ext.isTriangleCCW(a, b, c)) {
                    var k = this._triNext[this._triNext[index]];
                    do {
                        if (Triangulator.testPointTriangle(points[k], a, b, c)) {
                            isEar = false;
                            break;
                        }
                        k = this._triNext[k];
                    } while (k != this._triPrev[index]);
                }
                else {
                    isEar = false;
                }
                if (isEar) {
                    this.triangleIndices.push(this._triPrev[index]);
                    this.triangleIndices.push(index);
                    this.triangleIndices.push(this._triNext[index]);
                    // 删除vert通过重定向相邻vert的上一个和下一个链接，从而减少vertext计数
                    this._triNext[this._triPrev[index]] = this._triNext[index];
                    this._triPrev[this._triNext[index]] = this._triPrev[index];
                    count--;
                    // 接下来访问前一个vert
                    index = this._triPrev[index];
                }
                else {
                    index = this._triNext[index];
                }
            }
            this.triangleIndices.push(this._triPrev[index]);
            this.triangleIndices.push(index);
            this.triangleIndices.push(this._triNext[index]);
            if (!arePointsCCW)
                this.triangleIndices.reverse();
        };
        Triangulator.prototype.initialize = function (count) {
            this.triangleIndices.length = 0;
            if (this._triNext.length < count) {
                this._triNext.reverse();
                this._triNext.length = Math.max(this._triNext.length * 2, count);
            }
            if (this._triPrev.length < count) {
                this._triPrev.reverse();
                this._triPrev.length = Math.max(this._triPrev.length * 2, count);
            }
            for (var i = 0; i < count; i++) {
                this._triPrev[i] = i - 1;
                this._triNext[i] = i + 1;
            }
            this._triPrev[0] = count - 1;
            this._triNext[count - 1] = 0;
        };
        return Triangulator;
    }());
    es.Triangulator = Triangulator;
})(es || (es = {}));
var es;
(function (es) {
    var hex = [
        // hex identity values 0-255
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "0a",
        "0b",
        "0c",
        "0d",
        "0e",
        "0f",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "1a",
        "1b",
        "1c",
        "1d",
        "1e",
        "1f",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "2a",
        "2b",
        "2c",
        "2d",
        "2e",
        "2f",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "3a",
        "3b",
        "3c",
        "3d",
        "3e",
        "3f",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "4a",
        "4b",
        "4c",
        "4d",
        "4e",
        "4f",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "5a",
        "5b",
        "5c",
        "5d",
        "5e",
        "5f",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "6a",
        "6b",
        "6c",
        "6d",
        "6e",
        "6f",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "7a",
        "7b",
        "7c",
        "7d",
        "7e",
        "7f",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "8a",
        "8b",
        "8c",
        "8d",
        "8e",
        "8f",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "9a",
        "9b",
        "9c",
        "9d",
        "9e",
        "9f",
        "a0",
        "a1",
        "a2",
        "a3",
        "a4",
        "a5",
        "a6",
        "a7",
        "a8",
        "a9",
        "aa",
        "ab",
        "ac",
        "ad",
        "ae",
        "af",
        "b0",
        "b1",
        "b2",
        "b3",
        "b4",
        "b5",
        "b6",
        "b7",
        "b8",
        "b9",
        "ba",
        "bb",
        "bc",
        "bd",
        "be",
        "bf",
        "c0",
        "c1",
        "c2",
        "c3",
        "c4",
        "c5",
        "c6",
        "c7",
        "c8",
        "c9",
        "ca",
        "cb",
        "cc",
        "cd",
        "ce",
        "cf",
        "d0",
        "d1",
        "d2",
        "d3",
        "d4",
        "d5",
        "d6",
        "d7",
        "d8",
        "d9",
        "da",
        "db",
        "dc",
        "dd",
        "de",
        "df",
        "e0",
        "e1",
        "e2",
        "e3",
        "e4",
        "e5",
        "e6",
        "e7",
        "e8",
        "e9",
        "ea",
        "eb",
        "ec",
        "ed",
        "ee",
        "ef",
        "f0",
        "f1",
        "f2",
        "f3",
        "f4",
        "f5",
        "f6",
        "f7",
        "f8",
        "f9",
        "fa",
        "fb",
        "fc",
        "fd",
        "fe",
        "ff",
    ];
    var UUID = /** @class */ (function () {
        function UUID() {
        }
        UUID.randomUUID = function () {
            var d0 = (Math.random() * 0xffffffff) | 0;
            var d1 = (Math.random() * 0xffffffff) | 0;
            var d2 = (Math.random() * 0xffffffff) | 0;
            var d3 = (Math.random() * 0xffffffff) | 0;
            return (hex[d0 & 0xff] +
                hex[(d0 >> 8) & 0xff] +
                hex[(d0 >> 16) & 0xff] +
                hex[(d0 >> 24) & 0xff] +
                "-" +
                hex[d1 & 0xff] +
                hex[(d1 >> 8) & 0xff] +
                "-" +
                hex[((d1 >> 16) & 0x0f) | 0x40] +
                hex[(d1 >> 24) & 0xff] +
                "-" +
                hex[(d2 & 0x3f) | 0x80] +
                hex[(d2 >> 8) & 0xff] +
                "-" +
                hex[(d2 >> 16) & 0xff] +
                hex[(d2 >> 24) & 0xff] +
                hex[d3 & 0xff] +
                hex[(d3 >> 8) & 0xff] +
                hex[(d3 >> 16) & 0xff] +
                hex[(d3 >> 24) & 0xff]);
        };
        return UUID;
    }());
    es.UUID = UUID;
})(es || (es = {}));
var es;
(function (es) {
    function getClassName(klass) {
        return klass.className || klass.name;
    }
    es.getClassName = getClassName;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 记录时间的持续时间，一些设计灵感来自物理秒表。
     */
    var Stopwatch = /** @class */ (function () {
        function Stopwatch(getSystemTime) {
            if (getSystemTime === void 0) { getSystemTime = _defaultSystemTimeGetter; }
            this.getSystemTime = getSystemTime;
            /** 自上次复位以来，秒表已停止的系统时间总数。 */
            this._stopDuration = 0;
            /**
             * 记录自上次复位以来所有已完成切片的结果。
             */
            this._completeSlices = [];
        }
        Stopwatch.prototype.getState = function () {
            if (this._startSystemTime === undefined) {
                return State.IDLE;
            }
            else if (this._stopSystemTime === undefined) {
                return State.RUNNING;
            }
            else {
                return State.STOPPED;
            }
        };
        Stopwatch.prototype.isIdle = function () {
            return this.getState() === State.IDLE;
        };
        Stopwatch.prototype.isRunning = function () {
            return this.getState() === State.RUNNING;
        };
        Stopwatch.prototype.isStopped = function () {
            return this.getState() === State.STOPPED;
        };
        /**
         *
         */
        Stopwatch.prototype.slice = function () {
            return this.recordPendingSlice();
        };
        /**
         * 获取自上次复位以来该秒表已完成/记录的所有片的列表。
         */
        Stopwatch.prototype.getCompletedSlices = function () {
            return Array.from(this._completeSlices);
        };
        /**
         * 获取自上次重置以来该秒表已完成/记录的所有片的列表，以及当前挂起的片。
         */
        Stopwatch.prototype.getCompletedAndPendingSlices = function () {
            return __spread(this._completeSlices, [this.getPendingSlice()]);
        };
        /**
         * 获取关于这个秒表当前挂起的切片的详细信息。
         */
        Stopwatch.prototype.getPendingSlice = function () {
            return this.calculatePendingSlice();
        };
        /**
         * 获取当前秒表时间。这是这个秒表自上次复位以来运行的系统时间总数。
         */
        Stopwatch.prototype.getTime = function () {
            return this.caculateStopwatchTime();
        };
        /**
         * 完全重置这个秒表到它的初始状态。清除所有记录的运行持续时间、切片等。
         */
        Stopwatch.prototype.reset = function () {
            this._startSystemTime = this._pendingSliceStartStopwatchTime = this._stopSystemTime = undefined;
            this._stopDuration = 0;
            this._completeSlices = [];
        };
        /**
         * 开始(或继续)运行秒表。
         * @param forceReset
         */
        Stopwatch.prototype.start = function (forceReset) {
            if (forceReset === void 0) { forceReset = false; }
            if (forceReset) {
                this.reset();
            }
            if (this._stopSystemTime !== undefined) {
                var systemNow = this.getSystemTime();
                var stopDuration = systemNow - this._stopSystemTime;
                this._stopDuration += stopDuration;
                this._stopSystemTime = undefined;
            }
            else if (this._startSystemTime === undefined) {
                var systemNow = this.getSystemTime();
                this._startSystemTime = systemNow;
                this._pendingSliceStartStopwatchTime = 0;
            }
        };
        /**
         *
         * @param recordPendingSlice
         */
        Stopwatch.prototype.stop = function (recordPendingSlice) {
            if (recordPendingSlice === void 0) { recordPendingSlice = false; }
            if (this._startSystemTime === undefined) {
                return 0;
            }
            var systemTimeOfStopwatchTime = this.getSystemTimeOfCurrentStopwatchTime();
            if (recordPendingSlice) {
                this.recordPendingSlice(this.caculateStopwatchTime(systemTimeOfStopwatchTime));
            }
            this._stopSystemTime = systemTimeOfStopwatchTime;
            return this.getTime();
        };
        /**
         * 计算指定秒表时间的当前挂起片。
         * @param endStopwatchTime
         */
        Stopwatch.prototype.calculatePendingSlice = function (endStopwatchTime) {
            if (this._pendingSliceStartStopwatchTime === undefined) {
                return Object.freeze({ startTime: 0, endTime: 0, duration: 0 });
            }
            if (endStopwatchTime === undefined) {
                endStopwatchTime = this.getTime();
            }
            return Object.freeze({
                startTime: this._pendingSliceStartStopwatchTime,
                endTime: endStopwatchTime,
                duration: endStopwatchTime - this._pendingSliceStartStopwatchTime
            });
        };
        /**
         * 计算指定系统时间的当前秒表时间。
         * @param endSystemTime
         */
        Stopwatch.prototype.caculateStopwatchTime = function (endSystemTime) {
            if (this._startSystemTime === undefined)
                return 0;
            if (endSystemTime === undefined)
                endSystemTime = this.getSystemTimeOfCurrentStopwatchTime();
            return endSystemTime - this._startSystemTime - this._stopDuration;
        };
        /**
         * 获取与当前秒表时间等效的系统时间。
         * 如果该秒表当前停止，则返回该秒表停止时的系统时间。
         */
        Stopwatch.prototype.getSystemTimeOfCurrentStopwatchTime = function () {
            return this._stopSystemTime === undefined ? this.getSystemTime() : this._stopSystemTime;
        };
        /**
         * 结束/记录当前挂起的片的私有实现。
         * @param endStopwatchTime
         */
        Stopwatch.prototype.recordPendingSlice = function (endStopwatchTime) {
            if (this._pendingSliceStartStopwatchTime !== undefined) {
                if (endStopwatchTime === undefined) {
                    endStopwatchTime = this.getTime();
                }
                var slice = this.calculatePendingSlice(endStopwatchTime);
                this._pendingSliceStartStopwatchTime = slice.endTime;
                this._completeSlices.push(slice);
                return slice;
            }
            else {
                return this.calculatePendingSlice();
            }
        };
        return Stopwatch;
    }());
    es.Stopwatch = Stopwatch;
    var State;
    (function (State) {
        /** 秒表尚未启动，或已复位。 */
        State["IDLE"] = "IDLE";
        /** 秒表正在运行。 */
        State["RUNNING"] = "RUNNING";
        /** 秒表以前还在跑，但现在已经停了。 */
        State["STOPPED"] = "STOPPED";
    })(State || (State = {}));
    function setDefaultSystemTimeGetter(systemTimeGetter) {
        if (systemTimeGetter === void 0) { systemTimeGetter = Date.now; }
        _defaultSystemTimeGetter = systemTimeGetter;
    }
    es.setDefaultSystemTimeGetter = setDefaultSystemTimeGetter;
    /** 所有新实例的默认“getSystemTime”实现 */
    var _defaultSystemTimeGetter = Date.now;
})(es || (es = {}));
var es;
(function (es) {
    var Bag = /** @class */ (function () {
        function Bag(capacity) {
            if (capacity === void 0) { capacity = 64; }
            this.size_ = 0;
            this.length = 0;
            this.array = [];
            this.length = capacity;
        }
        Bag.prototype.removeAt = function (index) {
            var e = this.array[index];
            this.array[index] = this.array[--this.size_];
            this.array[this.size_] = null;
            return e;
        };
        Bag.prototype.remove = function (e) {
            var i;
            var e2;
            var size = this.size_;
            for (i = 0; i < size; i++) {
                e2 = this.array[i];
                if (e == e2) {
                    this.array[i] = this.array[--this.size_];
                    this.array[this.size_] = null;
                    return true;
                }
            }
            return false;
        };
        Bag.prototype.removeLast = function () {
            if (this.size_ > 0) {
                var e = this.array[--this.size_];
                this.array[this.size_] = null;
                return e;
            }
            return null;
        };
        Bag.prototype.contains = function (e) {
            var i;
            var size;
            for (i = 0, size = this.size_; size > i; i++) {
                if (e === this.array[i]) {
                    return true;
                }
            }
            return false;
        };
        Bag.prototype.removeAll = function (bag) {
            var modified = false;
            var i;
            var j;
            var l;
            var e1;
            var e2;
            for (i = 0, l = bag.size(); i < l; i++) {
                e1 = bag[i];
                for (j = 0; j < this.size_; j++) {
                    e2 = this.array[j];
                    if (e1 === e2) {
                        this.removeAt(j);
                        j--;
                        modified = true;
                        break;
                    }
                }
            }
            return modified;
        };
        Bag.prototype.get = function (index) {
            if (index >= this.length) {
                throw new Error("ArrayIndexOutOfBoundsException");
            }
            return this.array[index];
        };
        Bag.prototype.safeGet = function (index) {
            if (index >= this.length) {
                this.grow((index * 7) / 4 + 1);
            }
            return this.array[index];
        };
        Bag.prototype.size = function () {
            return this.size_;
        };
        Bag.prototype.getCapacity = function () {
            return this.length;
        };
        Bag.prototype.isIndexWithinBounds = function (index) {
            return index < this.getCapacity();
        };
        Bag.prototype.isEmpty = function () {
            return this.size_ == 0;
        };
        Bag.prototype.add = function (e) {
            if (this.size_ === this.length) {
                this.grow();
            }
            this.array[this.size_++] = e;
        };
        Bag.prototype.set = function (index, e) {
            if (index >= this.length) {
                this.grow(index * 2);
            }
            this.size_ = index + 1;
            this.array[index] = e;
        };
        Bag.prototype.grow = function (newCapacity) {
            if (newCapacity === void 0) { newCapacity = ~~((this.length * 3) / 2) + 1; }
            this.length = ~~newCapacity;
        };
        Bag.prototype.ensureCapacity = function (index) {
            if (index >= this.length) {
                this.grow(index * 2);
            }
        };
        Bag.prototype.clear = function () {
            var i;
            var size;
            for (i = 0, size = this.size_; i < size; i++) {
                this.array[i] = null;
            }
            this.size_ = 0;
        };
        Bag.prototype.addAll = function (items) {
            var i;
            for (i = 0; items.size() > i; i++) {
                this.add(items.get(i));
            }
        };
        return Bag;
    }());
    es.Bag = Bag;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 创建这个字典的原因只有一个：
     * 我需要一个能让我直接以数组的形式对值进行迭代的字典，而不需要生成一个数组或使用迭代器。
     * 对于这个目标是比标准字典快N倍。
     * Faster dictionary在大部分操作上也比标准字典快，但差别可以忽略不计。
     * 唯一较慢的操作是在添加时调整内存大小，因为与标准数组相比，这个实现需要使用两个单独的数组。
     */
    var FasterDictionary = /** @class */ (function () {
        function FasterDictionary(size) {
            if (size === void 0) { size = 1; }
            this._freeValueCellIndex = 0;
            this._collisions = 0;
            this._valuesInfo = new Array(size);
            this._values = new Array(size);
            this._buckets = new Array(es.HashHelpers.getPrime(size));
        }
        FasterDictionary.prototype.getValuesArray = function (count) {
            count.value = this._freeValueCellIndex;
            return this._values;
        };
        Object.defineProperty(FasterDictionary.prototype, "valuesArray", {
            get: function () {
                return this._values;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FasterDictionary.prototype, "count", {
            get: function () {
                return this._freeValueCellIndex;
            },
            enumerable: true,
            configurable: true
        });
        FasterDictionary.prototype.add = function (key, value) {
            if (!this.addValue(key, value, { value: 0 }))
                throw new Error("key 已经存在");
        };
        FasterDictionary.prototype.addValue = function (key, value, indexSet) {
            var hash = es.HashHelpers.getHashCode(key);
            var bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);
            if (this._freeValueCellIndex == this._values.length) {
                var expandPrime = es.HashHelpers.expandPrime(this._freeValueCellIndex);
                this._values.length = expandPrime;
                this._valuesInfo.length = expandPrime;
            }
            // buckets值-1表示它是空的
            var valueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
            if (valueIndex == -1) {
                // 在最后一个位置创建信息节点，并填入相关信息
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash);
            }
            else {
                {
                    var currentValueIndex = valueIndex;
                    do {
                        // 必须检查键是否已经存在于字典中
                        if (this._valuesInfo[currentValueIndex].hashcode == hash &&
                            this._valuesInfo[currentValueIndex].key == key) {
                            // 键已经存在，只需将其值替换掉即可
                            this._values[currentValueIndex] = value;
                            indexSet.value = currentValueIndex;
                            return false;
                        }
                        currentValueIndex = this._valuesInfo[currentValueIndex].previous;
                    } while (currentValueIndex != -1); // -1表示没有更多的值与相同的哈希值的键
                }
                this._collisions++;
                // 创建一个新的节点，该节点之前的索引指向当前指向桶的节点
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash, valueIndex);
                // 更新现有单元格的下一个单元格指向新的单元格，旧的单元格 -> 新的单元格 -> 旧的单元格 <- 下一个单元格
                this._valuesInfo[valueIndex].next = this._freeValueCellIndex;
            }
            // 重要的是：新的节点总是被桶单元格指向的那个节点，所以我可以假设被桶指向的那个节点总是最后添加的值(next = -1)
            // item与这个bucketIndex将指向最后创建的值 
            // TODO: 如果相反，我假设原来的那个是bucket中的那个，我就不需要在这里更新bucket了
            this._buckets[bucketIndex] = (this._freeValueCellIndex + 1);
            this._values[this._freeValueCellIndex] = value;
            indexSet.value = this._freeValueCellIndex;
            this._freeValueCellIndex++;
            if (this._collisions > this._buckets.length) {
                // 我们需要更多的空间和更少的碰撞
                this._buckets = new Array(es.HashHelpers.expandPrime(this._collisions));
                this._collisions = 0;
                // 我们需要得到目前存储的所有值的哈希码，并将它们分布在新的桶长上
                for (var newValueIndex = 0; newValueIndex < this._freeValueCellIndex; newValueIndex++) {
                    // 获取原始哈希码，并根据新的长度找到新的bucketIndex
                    bucketIndex = FasterDictionary.reduce(this._valuesInfo[newValueIndex].hashcode, this._buckets.length);
                    // bucketsIndex可以是-1或下一个值。
                    // 如果是-1意味着没有碰撞。
                    // 如果有碰撞，我们创建一个新节点，它的上一个指向旧节点。
                    // 旧节点指向新节点，新节点指向旧节点，旧节点指向新节点，现在bucket指向新节点，这样我们就可以重建linkedlist.
                    // 获取当前值Index，如果没有碰撞，则为-1。
                    var existingValueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
                    // 将bucket索引更新为共享bucketIndex的当前项目的索引（最后找到的总是bucket中的那个）
                    this._buckets[bucketIndex] = newValueIndex + 1;
                    if (existingValueIndex != -1) {
                        // 这个单元格已经指向了新的bucket list中的一个值，这意味着有一个碰撞，出了问题
                        this._collisions++;
                        // bucket将指向这个值，所以新的值将使用以前的索引
                        this._valuesInfo[newValueIndex].previous = existingValueIndex;
                        this._valuesInfo[newValueIndex].next = -1;
                        // 并将之前的下一个索引更新为新的索引
                        this._valuesInfo[existingValueIndex].next = newValueIndex;
                    }
                    else {
                        // 什么都没有被索引，桶是空的。我们需要更新之前的 next 和 previous 的值。
                        this._valuesInfo[newValueIndex].next = -1;
                        this._valuesInfo[newValueIndex].previous = -1;
                    }
                }
            }
            return true;
        };
        FasterDictionary.prototype.remove = function (key) {
            var hash = FasterDictionary.hash(key);
            var bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);
            // 找桶
            var indexToValueToRemove = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
            // 第一部分：在bucket list中寻找实际的键，如果找到了，我就更新bucket list，使它不再指向要删除的单元格。
            while (indexToValueToRemove != -1) {
                if (this._valuesInfo[indexToValueToRemove].hashcode == hash &&
                    this._valuesInfo[indexToValueToRemove].key == key) {
                    // 如果找到了密钥，并且桶直接指向了要删除的节点
                    if (this._buckets[bucketIndex] - 1 == indexToValueToRemove) {
                        if (this._valuesInfo[indexToValueToRemove].next != -1)
                            throw new Error("如果 bucket 指向单元格，那么 next 必须不存在。");
                        // 如果前一个单元格存在，它的下一个指针必须被更新!
                        //<---迭代顺序  
                        // B(ucket总是指向最后一个)
                        // ------- ------- -------
                        // 1 | | | | 2 | | | 3 | //bucket不能有下一个，只能有上一个。
                        // ------- ------- -------
                        //--> 插入
                        var value = this._valuesInfo[indexToValueToRemove].previous;
                        this._buckets[bucketIndex] = value + 1;
                    }
                    else {
                        if (this._valuesInfo[indexToValueToRemove].next == -1)
                            throw new Error("如果 bucket 指向另一个单元格，则 NEXT 必须存在");
                    }
                    FasterDictionary.updateLinkedList(indexToValueToRemove, this._valuesInfo);
                    break;
                }
                indexToValueToRemove = this._valuesInfo[indexToValueToRemove].previous;
            }
            if (indexToValueToRemove == -1)
                return false; // 未找到
            this._freeValueCellIndex--; // 少了一个需要反复计算的值
            // 第二部分
            // 这时节点指针和水桶会被更新，但_values数组会被更新仍然有要删除的值
            // 这个字典的目标是能够做到像数组一样对数值进行迭代，所以数值数组必须始终是最新的
            // 如果要删除的单元格是列表中的最后一个，我们可以执行较少的操作（不需要交换），否则我们要将最后一个值的单元格移到要删除的值上。
            if (indexToValueToRemove != this._freeValueCellIndex) {
                // 我们可以将两个数组的最后一个值移到要删除的数组中。
                // 为了做到这一点，我们需要确保 bucket 指针已经更新了
                // 首先我们在桶列表中找到指向要移动的单元格的指针的索引
                var movingBucketIndex = FasterDictionary.reduce(this._valuesInfo[this._freeValueCellIndex].hashcode, this._buckets.length);
                // 如果找到了键，并且桶直接指向要删除的节点，现在必须指向要移动的单元格。
                if (this._buckets[movingBucketIndex] - 1 == this._freeValueCellIndex)
                    this._buckets[movingBucketIndex] = (indexToValueToRemove + 1);
                // 否则意味着有多个键具有相同的哈希值（碰撞），所以我们需要更新链接列表和它的指针
                var next = this._valuesInfo[this._freeValueCellIndex].next;
                var previous = this._valuesInfo[this._freeValueCellIndex].previous;
                // 现在它们指向最后一个值被移入的单元格
                if (next != -1)
                    this._valuesInfo[next].previous = indexToValueToRemove;
                if (previous != -1)
                    this._valuesInfo[previous].next = indexToValueToRemove;
                // 最后，实际上是移动值
                this._valuesInfo[indexToValueToRemove] = this._valuesInfo[this._freeValueCellIndex];
                this._values[indexToValueToRemove] = this._values[this._freeValueCellIndex];
            }
            return true;
        };
        FasterDictionary.prototype.trim = function () {
            var expandPrime = es.HashHelpers.expandPrime(this._freeValueCellIndex);
            if (expandPrime < this._valuesInfo.length) {
                this._values.length = expandPrime;
                this._valuesInfo.length = expandPrime;
            }
        };
        FasterDictionary.prototype.clear = function () {
            if (this._freeValueCellIndex == 0)
                return;
            this._freeValueCellIndex = 0;
            this._buckets.length = 0;
            this._values.length = 0;
            this._valuesInfo.length = 0;
        };
        FasterDictionary.prototype.fastClear = function () {
            if (this._freeValueCellIndex == 0)
                return;
            this._freeValueCellIndex = 0;
            this._buckets.length = 0;
            this._valuesInfo.length = 0;
        };
        FasterDictionary.prototype.containsKey = function (key) {
            if (this.tryFindIndex(key, { value: 0 })) {
                return true;
            }
            return false;
        };
        FasterDictionary.prototype.tryGetValue = function (key) {
            var findIndex = { value: 0 };
            if (this.tryFindIndex(key, findIndex)) {
                return this._values[findIndex.value];
            }
            return null;
        };
        FasterDictionary.prototype.tryFindIndex = function (key, findIndex) {
            // 我把所有的索引都用偏移量+1来存储，这样在bucket list中0就意味着实际上不存在
            // 当读取时，偏移量必须再偏移-1才是真实的
            // 这样我就避免了将数组初始化为-1
            var hash = FasterDictionary.hash(key);
            var bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);
            var valueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
            // 即使我们找到了一个现有的值，我们也需要确定它是我们所要求的值
            while (valueIndex != -1) {
                if (this._valuesInfo[valueIndex].hashcode == hash && this._valuesInfo[valueIndex].key == key) {
                    findIndex.value = valueIndex;
                    return true;
                }
                valueIndex = this._valuesInfo[valueIndex].previous;
            }
            findIndex.value = 0;
            return false;
        };
        FasterDictionary.prototype.getDirectValue = function (index) {
            return this._values[index];
        };
        FasterDictionary.prototype.getIndex = function (key) {
            var findIndex = { value: 0 };
            if (this.tryFindIndex(key, findIndex))
                return findIndex.value;
            throw new Error("未找到key");
        };
        FasterDictionary.updateLinkedList = function (index, valuesInfo) {
            var next = valuesInfo[index].next;
            var previous = valuesInfo[index].previous;
            if (next != -1)
                valuesInfo[next].previous = previous;
            if (previous != -1)
                valuesInfo[previous].next = next;
        };
        FasterDictionary.hash = function (key) {
            return es.HashHelpers.getHashCode(key);
        };
        FasterDictionary.reduce = function (x, n) {
            if (x >= n)
                return x % n;
            return x;
        };
        return FasterDictionary;
    }());
    es.FasterDictionary = FasterDictionary;
    var FastNode = /** @class */ (function () {
        function FastNode(key, hash, previousNode) {
            if (previousNode === void 0) { previousNode = -1; }
            this.key = key;
            this.hashcode = hash;
            this.previous = previousNode;
            this.next = -1;
        }
        return FastNode;
    }());
    es.FastNode = FastNode;
})(es || (es = {}));
var es;
(function (es) {
    var Node = /** @class */ (function () {
        // next为可选参数，如果不传则为undefined
        function Node(element, next) {
            this.element = element;
            this.next = next;
        }
        return Node;
    }());
    es.Node = Node;
    function defaultEquals(a, b) {
        return a === b;
    }
    es.defaultEquals = defaultEquals;
    var LinkedList = /** @class */ (function () {
        function LinkedList(equalsFn) {
            if (equalsFn === void 0) { equalsFn = defaultEquals; }
            // 初始化链表内部变量
            this.count = 0;
            this.next = undefined;
            this.equalsFn = equalsFn;
            this.head = null;
        }
        // 链表尾部添加元素
        LinkedList.prototype.push = function (element) {
            // 声明结点变量，将元素当作参数传入生成结点
            var node = new Node(element);
            // 存储遍历到的链表元素
            var current;
            if (this.head == null) {
                // 链表为空，直接将链表头部赋值为结点变量
                this.head = node;
            }
            else {
                // 链表不为空，我们只能拿到链表中第一个元素的引用
                current = this.head;
                // 循环访问链表
                while (current.next != null) {
                    // 赋值遍历到的元素
                    current = current.next;
                }
                // 此时已经得到了链表的最后一个元素(null)，将链表的下一个元素赋值为结点变量。
                current.next = node;
            }
            // 链表长度自增
            this.count++;
        };
        // 移除链表指定位置的元素
        LinkedList.prototype.removeAt = function (index) {
            // 边界判断: 参数是否有效
            if (index >= 0 && index < this.count) {
                // 获取当前链表头部元素
                var current = this.head;
                // 移除第一项
                if (index === 0) {
                    this.head = current.next;
                }
                else {
                    // 获取目标参数上一个结点
                    var previous = this.getElementAt(index - 1);
                    // 当前结点指向目标结点
                    current = previous.next;
                    /**
                     * 目标结点元素已找到
                     * previous.next指向目标结点
                     * current.next指向undefined
                     * previous.next指向current.next即删除目标结点的元素
                     */
                    previous.next = current.next;
                }
                // 链表长度自减
                this.count--;
                // 返回当前删除的目标结点
                return current.element;
            }
            return undefined;
        };
        // 获取链表指定位置的结点
        LinkedList.prototype.getElementAt = function (index) {
            // 参数校验
            if (index >= 0 && index <= this.count) {
                // 获取链表头部元素
                var current = this.head;
                // 从链表头部遍历至目标结点位置
                for (var i = 0; i < index && current != null; i++) {
                    // 当前结点指向下一个目标结点
                    current = current.next;
                }
                // 返回目标结点数据
                return current;
            }
            return undefined;
        };
        // 向链表中插入元素
        LinkedList.prototype.insert = function (element, index) {
            // 参数有效性判断
            if (index >= 0 && index <= this.count) {
                // 声明节点变量，将当前要插入的元素作为参数生成结点
                var node = new Node(element);
                // 第一个位置添加元素
                if (index === 0) {
                    // 将节点变量(node)的下一个元素指向链表的头部元素
                    node.next = this.head;
                    // 链表头部元素赋值为节点变量
                    this.head = node;
                }
                else {
                    // 获取目标结点的上一个结点
                    var previous = this.getElementAt(index - 1);
                    // 将节点变量的下一个元素指向目标节点
                    node.next = previous.next;
                    /**
                     * 此时node中当前结点为要插入的值
                     * next为原位置处的结点
                     * 因此将当前结点赋值为node，就完成了结点插入操作
                     */
                    previous.next = node;
                }
                // 链表长度自增
                this.count++;
                return true;
            }
            return false;
        };
        // 根据元素获取其在链表中的索引
        LinkedList.prototype.indexOf = function (element) {
            // 获取链表顶部元素
            var current = this.head;
            // 遍历链表内的元素
            for (var i = 0; i < this.count && current != null; i++) {
                // 判断当前链表中的结点与目标结点是否相等
                if (this.equalsFn(element, current.element)) {
                    // 返回索引
                    return i;
                }
                // 当前结点指向下一个结点
                current = current.next;
            }
            // 目标元素不存在
            return -1;
        };
        // 移除链表中的指定元素
        LinkedList.prototype.remove = function (element) {
            // 获取element的索引,移除索引位置的元素
            this.removeAt(this.indexOf(element));
        };
        LinkedList.prototype.clear = function () {
            this.head = undefined;
            this.count = 0;
        };
        // 获取链表长度
        LinkedList.prototype.size = function () {
            return this.count;
        };
        // 判断链表是否为空
        LinkedList.prototype.isEmpty = function () {
            return this.size() === 0;
        };
        // 获取链表头部元素
        LinkedList.prototype.getHead = function () {
            return this.head;
        };
        // 获取链表中的所有元素
        LinkedList.prototype.toString = function () {
            if (this.head == null) {
                return "";
            }
            var objString = "" + this.head.element;
            // 获取链表顶点的下一个结点
            var current = this.head.next;
            // 遍历链表中的所有结点
            for (var i = 1; i < this.size() && current != null; i++) {
                // 将当前结点的元素拼接到最终要生成的字符串对象中
                objString = objString + ", " + current.element;
                // 当前结点指向链表的下一个元素
                current = current.next;
            }
            return objString;
        };
        return LinkedList;
    }());
    es.LinkedList = LinkedList;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 可以用于列表池的简单类
     */
    var ListPool = /** @class */ (function () {
        function ListPool() {
        }
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param cacheCount
         */
        ListPool.warmCache = function (type, cacheCount) {
            this.checkCreate(type);
            cacheCount -= this._objectQueue.get(type).length;
            if (cacheCount > 0) {
                for (var i = 0; i < cacheCount; i++) {
                    this._objectQueue.get(type).unshift([]);
                }
            }
        };
        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        ListPool.trimCache = function (type, cacheCount) {
            this.checkCreate(type);
            while (cacheCount > this._objectQueue.get(type).length)
                this._objectQueue.get(type).shift();
        };
        /**
         * 清除缓存
         */
        ListPool.clearCache = function (type) {
            this.checkCreate(type);
            this._objectQueue.get(type).length = 0;
        };
        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        ListPool.obtain = function (type) {
            this.checkCreate(type);
            if (this._objectQueue.get(type).length > 0)
                return this._objectQueue.get(type).shift();
            return [];
        };
        /**
         * 将项推回堆栈
         * @param obj
         */
        ListPool.free = function (type, obj) {
            this.checkCreate(type);
            this._objectQueue.get(type).unshift(obj);
            obj.length = 0;
        };
        ListPool.checkCreate = function (type) {
            if (!this._objectQueue.get(type))
                this._objectQueue.set(type, []);
        };
        ListPool._objectQueue = new Map();
        return ListPool;
    }());
    es.ListPool = ListPool;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于管理一对对象的简单DTO
     */
    var Pair = /** @class */ (function () {
        function Pair(first, second) {
            this.first = first;
            this.second = second;
        }
        Pair.prototype.clear = function () {
            this.first = this.second = null;
        };
        Pair.prototype.equals = function (other) {
            // 这两种方法在功能上应该是等价的
            return this.first === other.first && this.second === other.second;
        };
        return Pair;
    }());
    es.Pair = Pair;
})(es || (es = {}));
var es;
(function (es) {
    var PairSet = /** @class */ (function () {
        function PairSet() {
            this._all = new Array();
        }
        Object.defineProperty(PairSet.prototype, "all", {
            get: function () {
                return this._all;
            },
            enumerable: true,
            configurable: true
        });
        PairSet.prototype.has = function (pair) {
            var index = this._all.findIndex(function (p) { return p.equals(pair); });
            return index > -1;
        };
        PairSet.prototype.add = function (pair) {
            if (!this.has(pair)) {
                this._all.push(pair);
            }
        };
        PairSet.prototype.remove = function (pair) {
            var index = this._all.findIndex(function (p) { return p.equals(pair); });
            if (index > -1) {
                var temp = this._all[index];
                this._all[index] = this._all[this._all.length - 1];
                this._all[this._all.length - 1] = temp;
                this._all = this._all.slice(0, this._all.length - 1);
            }
        };
        PairSet.prototype.clear = function () {
            this._all = [];
        };
        PairSet.prototype.union = function (other) {
            var e_12, _a;
            var otherAll = other.all;
            try {
                for (var otherAll_1 = __values(otherAll), otherAll_1_1 = otherAll_1.next(); !otherAll_1_1.done; otherAll_1_1 = otherAll_1.next()) {
                    var elem = otherAll_1_1.value;
                    this.add(elem);
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (otherAll_1_1 && !otherAll_1_1.done && (_a = otherAll_1.return)) _a.call(otherAll_1);
                }
                finally { if (e_12) throw e_12.error; }
            }
        };
        PairSet.prototype.except = function (other) {
            var e_13, _a;
            var otherAll = other.all;
            try {
                for (var otherAll_2 = __values(otherAll), otherAll_2_1 = otherAll_2.next(); !otherAll_2_1.done; otherAll_2_1 = otherAll_2.next()) {
                    var elem = otherAll_2_1.value;
                    this.remove(elem);
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (otherAll_2_1 && !otherAll_2_1.done && (_a = otherAll_2.return)) _a.call(otherAll_2);
                }
                finally { if (e_13) throw e_13.error; }
            }
        };
        return PairSet;
    }());
    es.PairSet = PairSet;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 用于池任何对象
     */
    var Pool = /** @class */ (function () {
        function Pool() {
        }
        /**
         * 预热缓存，使用最大的cacheCount对象填充缓存
         * @param type
         * @param cacheCount
         */
        Pool.warmCache = function (type, cacheCount) {
            this.checkCreate(type);
            cacheCount -= this._objectQueue.get(type).length;
            if (cacheCount > 0) {
                for (var i = 0; i < cacheCount; i++) {
                    this._objectQueue.get(type).unshift(new type());
                }
            }
        };
        /**
         * 将缓存修剪为cacheCount项目
         * @param cacheCount
         */
        Pool.trimCache = function (type, cacheCount) {
            this.checkCreate(type);
            while (cacheCount > this._objectQueue.get(type).length)
                this._objectQueue.get(type).shift();
        };
        /**
         * 清除缓存
         */
        Pool.clearCache = function (type) {
            this.checkCreate(type);
            this._objectQueue.get(type).length = 0;
        };
        /**
         * 如果可以的话，从堆栈中弹出一个项
         */
        Pool.obtain = function (type) {
            this.checkCreate(type);
            if (this._objectQueue.get(type).length > 0)
                return this._objectQueue.get(type).shift();
            return new type();
        };
        /**
         * 将项推回堆栈
         * @param obj
         */
        Pool.free = function (type, obj) {
            this.checkCreate(type);
            this._objectQueue.get(type).unshift(obj);
            if (es.isIPoolable(obj)) {
                obj["reset"]();
            }
        };
        Pool.checkCreate = function (type) {
            if (!this._objectQueue.get(type))
                this._objectQueue.set(type, []);
        };
        Pool._objectQueue = new Map();
        return Pool;
    }());
    es.Pool = Pool;
    es.isIPoolable = function (props) { return typeof props['reset'] !== 'undefined'; };
})(es || (es = {}));
var es;
(function (es) {
    var Coroutine = /** @class */ (function () {
        function Coroutine() {
        }
        /**
         * 导致Coroutine在指定的时间内暂停。在Coroutine.waitForSeconds的基础上，在Coroutine中使用Yield
         * @param seconds
         */
        Coroutine.waitForSeconds = function (seconds) {
            return WaitForSeconds.waiter.wait(seconds);
        };
        return Coroutine;
    }());
    es.Coroutine = Coroutine;
    /**
     * 帮助类，用于当一个coroutine想要暂停一段时间时。返回Coroutine.waitForSeconds返回其中一个
     */
    var WaitForSeconds = /** @class */ (function () {
        function WaitForSeconds() {
            this.waitTime = 0;
        }
        WaitForSeconds.prototype.wait = function (seconds) {
            WaitForSeconds.waiter.waitTime = seconds;
            return WaitForSeconds.waiter;
        };
        WaitForSeconds.waiter = new WaitForSeconds();
        return WaitForSeconds;
    }());
    es.WaitForSeconds = WaitForSeconds;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * CoroutineManager用于隐藏Coroutine所需数据的内部类
     */
    var CoroutineImpl = /** @class */ (function () {
        function CoroutineImpl() {
            /**
             * 每当产生一个延迟，它就会被添加到跟踪延迟的waitTimer中
             */
            this.waitTimer = 0;
            this.useUnscaledDeltaTime = false;
        }
        CoroutineImpl.prototype.stop = function () {
            this.isDone = true;
        };
        CoroutineImpl.prototype.setUseUnscaledDeltaTime = function (useUnscaledDeltaTime) {
            this.useUnscaledDeltaTime = useUnscaledDeltaTime;
            return this;
        };
        CoroutineImpl.prototype.prepareForUse = function () {
            this.isDone = false;
        };
        CoroutineImpl.prototype.reset = function () {
            this.isDone = true;
            this.waitTimer = 0;
            this.waitForCoroutine = null;
            this.enumerator = null;
            this.useUnscaledDeltaTime = false;
        };
        return CoroutineImpl;
    }());
    es.CoroutineImpl = CoroutineImpl;
    var CoroutineManager = /** @class */ (function (_super) {
        __extends(CoroutineManager, _super);
        function CoroutineManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._unblockedCoroutines = [];
            _this._shouldRunNextFrame = [];
            return _this;
        }
        /**
         * 将IEnumerator添加到CoroutineManager中
         * Coroutine在每一帧调用Update之前被执行
         * @param enumerator
         */
        CoroutineManager.prototype.startCoroutine = function (enumerator) {
            // 找到或创建一个CoroutineImpl
            var coroutine = es.Pool.obtain(CoroutineImpl);
            coroutine.prepareForUse();
            // 设置coroutine并添加它
            coroutine.enumerator = enumerator;
            var shouldContinueCoroutine = this.tickCoroutine(coroutine);
            if (!shouldContinueCoroutine)
                return null;
            if (this._isInUpdate)
                this._shouldRunNextFrame.push(coroutine);
            else
                this._unblockedCoroutines.push(coroutine);
            return coroutine;
        };
        CoroutineManager.prototype.update = function () {
            this._isInUpdate = true;
            for (var i = 0; i < this._unblockedCoroutines.length; i++) {
                var coroutine = this._unblockedCoroutines[i];
                if (coroutine.isDone) {
                    es.Pool.free(CoroutineImpl, coroutine);
                    continue;
                }
                if (coroutine.waitForCoroutine != null) {
                    if (coroutine.waitForCoroutine.isDone) {
                        coroutine.waitForCoroutine = null;
                    }
                    else {
                        this._shouldRunNextFrame.push(coroutine);
                        continue;
                    }
                }
                if (coroutine.waitTimer > 0) {
                    // 递减，然后再运行下一帧，确保用适当的deltaTime递减
                    coroutine.waitTimer -= coroutine.useUnscaledDeltaTime ? es.Time.unscaledDeltaTime : es.Time.deltaTime;
                    this._shouldRunNextFrame.push(coroutine);
                    continue;
                }
                if (this.tickCoroutine(coroutine))
                    this._shouldRunNextFrame.push(coroutine);
            }
            var linqCoroutines = new es.List(this._unblockedCoroutines);
            linqCoroutines.clear();
            linqCoroutines.addRange(this._shouldRunNextFrame);
            this._shouldRunNextFrame.length = 0;
            this._isInUpdate = false;
        };
        /**
         * 勾选一个coroutine，如果该coroutine应该在下一帧继续运行，则返回true。本方法会将完成的coroutine放回Pool
         * @param coroutine
         */
        CoroutineManager.prototype.tickCoroutine = function (coroutine) {
            var chain = coroutine.enumerator.next();
            if (chain.done || coroutine.isDone) {
                es.Pool.free(CoroutineImpl, coroutine);
                return false;
            }
            if (chain.value == null) {
                // 下一帧再运行
                return true;
            }
            if (chain.value instanceof es.WaitForSeconds) {
                coroutine.waitTimer = chain.value.waitTime;
                return true;
            }
            if (typeof chain.value == 'number') {
                coroutine.waitTimer = chain.value;
                return true;
            }
            if (typeof chain.value == 'string') {
                if (chain.value == 'break') {
                    es.Pool.free(CoroutineImpl, coroutine);
                    return false;
                }
                return true;
            }
            if (chain.value instanceof CoroutineImpl) {
                coroutine.waitForCoroutine = chain.value;
                return true;
            }
            else {
                return true;
            }
        };
        return CoroutineManager;
    }(es.GlobalManager));
    es.CoroutineManager = CoroutineManager;
})(es || (es = {}));
var es;
(function (es) {
    var MaxRectsBinPack = /** @class */ (function () {
        function MaxRectsBinPack(width, height, rotations) {
            if (rotations === void 0) { rotations = true; }
            this.binWidth = 0;
            this.binHeight = 0;
            this.usedRectangles = [];
            this.freeRectangles = [];
            this.init(width, height, rotations);
        }
        MaxRectsBinPack.prototype.init = function (width, height, rotations) {
            if (rotations === void 0) { rotations = true; }
            this.binWidth = width;
            this.binHeight = height;
            this.allowRotations = rotations;
            var n = new es.Rectangle();
            n.x = 0;
            n.y = 0;
            n.width = width;
            n.height = height;
            this.usedRectangles.length = 0;
            this.freeRectangles.length = 0;
            this.freeRectangles.push(n);
        };
        MaxRectsBinPack.prototype.insert = function (width, height) {
            var newNode = new es.Rectangle();
            var score1 = new es.Ref(0);
            var score2 = new es.Ref(0);
            newNode = this.findPositionForNewNodeBestAreaFit(width, height, score1, score2);
            if (newNode.height == 0)
                return newNode;
            var numRectanglesToProcess = this.freeRectangles.length;
            for (var i = 0; i < numRectanglesToProcess; ++i) {
                if (this.splitFreeNode(this.freeRectangles[i], newNode)) {
                    new es.List(this.freeRectangles).removeAt(i);
                    --i;
                    --numRectanglesToProcess;
                }
            }
            this.pruneFreeList();
            this.usedRectangles.push(newNode);
            return newNode;
        };
        MaxRectsBinPack.prototype.findPositionForNewNodeBestAreaFit = function (width, height, bestAreaFit, bestShortSideFit) {
            var bestNode = new es.Rectangle();
            bestAreaFit.value = Number.MAX_VALUE;
            for (var i = 0; i < this.freeRectangles.length; ++i) {
                var areaFit = this.freeRectangles[i].width * this.freeRectangles[i].height - width * height;
                // 试着将长方形放在直立（非翻转）的方向
                if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                    var leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                    var leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                    var shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = width;
                        bestNode.height = height;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }
                if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                    var leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                    var leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                    var shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = height;
                        bestNode.height = width;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }
                return bestNode;
            }
        };
        MaxRectsBinPack.prototype.splitFreeNode = function (freeNode, usedNode) {
            // 用SAT测试长方形是否均匀相交
            if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
                usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
                return false;
            if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
                // 在使用过的节点的上边新建一个节点
                if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
                    var newNode = freeNode;
                    newNode.height = usedNode.y - newNode.y;
                    this.freeRectangles.push(newNode);
                }
                // 在使用过的节点的底边新建节点
                if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
                    var newNode = freeNode;
                    newNode.y = usedNode.y + usedNode.height;
                    newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
                    this.freeRectangles.push(newNode);
                }
            }
            if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
                // 在使用过的节点的左侧新建节点
                if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
                    var newNode = freeNode;
                    newNode.width = usedNode.x - newNode.x;
                    this.freeRectangles.push(newNode);
                }
                // 在使用过的节点右侧新建节点
                if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
                    var newNode = freeNode;
                    newNode.x = usedNode.x + usedNode.width;
                    newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
                    this.freeRectangles.push(newNode);
                }
            }
            return true;
        };
        MaxRectsBinPack.prototype.pruneFreeList = function () {
            for (var i = 0; i < this.freeRectangles.length; ++i)
                for (var j = i + 1; j < this.freeRectangles.length; ++j) {
                    if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
                        new es.List(this.freeRectangles).removeAt(i);
                        --i;
                        break;
                    }
                    if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
                        new es.List(this.freeRectangles).removeAt(j);
                        --j;
                    }
                }
        };
        MaxRectsBinPack.prototype.isContainedIn = function (a, b) {
            return a.x >= b.x && a.y >= b.y
                && a.x + a.width <= b.x + b.width
                && a.y + a.height <= b.y + b.height;
        };
        return MaxRectsBinPack;
    }());
    es.MaxRectsBinPack = MaxRectsBinPack;
})(es || (es = {}));
var es;
(function (es) {
    var ArrayUtils = /** @class */ (function () {
        function ArrayUtils() {
        }
        /**
         * 执行冒泡排序
         * @param ary
         */
        ArrayUtils.bubbleSort = function (ary) {
            var isExchange = false;
            for (var i = 0; i < ary.length; i++) {
                isExchange = false;
                for (var j = ary.length - 1; j > i; j--) {
                    if (ary[j] < ary[j - 1]) {
                        var temp = ary[j];
                        ary[j] = ary[j - 1];
                        ary[j - 1] = temp;
                        isExchange = true;
                    }
                }
                if (!isExchange)
                    break;
            }
        };
        /**
         * 执行插入排序
         * @param ary
         */
        ArrayUtils.insertionSort = function (ary) {
            var len = ary.length;
            for (var i = 1; i < len; i++) {
                var val = ary[i];
                for (var j = i; j > 0 && ary[j - 1] > val; j--) {
                    ary[j] = ary[j - 1];
                }
                ary[j] = val;
            }
        };
        /**
         * 执行二分搜索
         * @param ary 搜索的数组（必须排序过）
         * @param value 需要搜索的值
         * @returns 返回匹配结果的数组索引
         */
        ArrayUtils.binarySearch = function (ary, value) {
            var startIndex = 0;
            var endIndex = ary.length;
            var sub = (startIndex + endIndex) >> 1;
            while (startIndex < endIndex) {
                if (value <= ary[sub])
                    endIndex = sub;
                else if (value >= ary[sub])
                    startIndex = sub + 1;
                sub = (startIndex + endIndex) >> 1;
            }
            if (ary[startIndex] == value)
                return startIndex;
            return -1;
        };
        /**
         * 返回匹配项的索引
         * @param ary
         * @param num
         */
        ArrayUtils.findElementIndex = function (ary, num) {
            var len = ary.length;
            for (var i = 0; i < len; ++i) {
                if (ary[i] == num)
                    return i;
            }
            return null;
        };
        /**
         * 返回数组中最大值的索引
         * @param ary
         */
        ArrayUtils.getMaxElementIndex = function (ary) {
            var matchIndex = 0;
            var len = ary.length;
            for (var j = 1; j < len; j++) {
                if (ary[j] > ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        };
        /**
         * 返回数组中最小值的索引
         * @param ary
         */
        ArrayUtils.getMinElementIndex = function (ary) {
            var matchIndex = 0;
            var len = ary.length;
            for (var j = 1; j < len; j++) {
                if (ary[j] < ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        };
        /**
         * 返回一个"唯一性"数组
         * @param ary 需要唯一性的数组
         * @returns 唯一性的数组
         *
         * @tutorial
         * 比如: [1, 2, 2, 3, 4]
         * 返回: [1, 2, 3, 4]
         */
        ArrayUtils.getUniqueAry = function (ary) {
            var uAry = [];
            var newAry = [];
            var count = ary.length;
            for (var i = 0; i < count; ++i) {
                var value = ary[i];
                if (uAry.indexOf(value) == -1)
                    uAry.push(value);
            }
            count = uAry.length;
            for (var i = count - 1; i >= 0; --i) {
                newAry.unshift(uAry[i]);
            }
            return newAry;
        };
        /**
         * 返回2个数组中不同的部分
         * 比如数组A = [1, 2, 3, 4, 6]
         *    数组B = [0, 2, 1, 3, 4]
         * 返回[6, 0]
         * @param    aryA
         * @param    aryB
         * @return
         */
        ArrayUtils.getDifferAry = function (aryA, aryB) {
            aryA = this.getUniqueAry(aryA);
            aryB = this.getUniqueAry(aryB);
            var ary = aryA.concat(aryB);
            var uObj = {};
            var newAry = [];
            var count = ary.length;
            for (var j = 0; j < count; ++j) {
                if (!uObj[ary[j]]) {
                    uObj[ary[j]] = {};
                    uObj[ary[j]].count = 0;
                    uObj[ary[j]].key = ary[j];
                    uObj[ary[j]].count++;
                }
                else {
                    if (uObj[ary[j]] instanceof Object) {
                        uObj[ary[j]].count++;
                    }
                }
            }
            for (var i in uObj) {
                if (uObj[i].count != 2) {
                    newAry.unshift(uObj[i].key);
                }
            }
            return newAry;
        };
        /**
         * 交换数组元素
         * @param    array    目标数组
         * @param    index1    交换后的索引
         * @param    index2    交换前的索引
         */
        ArrayUtils.swap = function (array, index1, index2) {
            var temp = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
        };
        /**
         * 清除列表
         * @param ary
         */
        ArrayUtils.clearList = function (ary) {
            if (!ary)
                return;
            var length = ary.length;
            for (var i = length - 1; i >= 0; i -= 1) {
                ary.splice(i, 1);
            }
        };
        /**
         * 克隆一个数组
         * @param    ary 需要克隆的数组
         * @return  克隆的数组
         */
        ArrayUtils.cloneList = function (ary) {
            if (!ary)
                return null;
            return ary.slice(0, ary.length);
        };
        /**
         * 判断2个数组是否相同
         * @param ary1 数组1
         * @param ary2 数组2
         */
        ArrayUtils.equals = function (ary1, ary2) {
            if (ary1 == ary2)
                return true;
            var length = ary1.length;
            if (length != ary2.length)
                return false;
            while (length--) {
                if (ary1[length] != ary2[length])
                    return false;
            }
            return true;
        };
        /**
         * 根据索引插入元素，索引和索引后的元素都向后移动一位
         * @param ary
         * @param index 插入索引
         * @param value 插入的元素
         * @returns 插入的元素 未插入则返回空
         */
        ArrayUtils.insert = function (ary, index, value) {
            if (!ary)
                return null;
            var length = ary.length;
            if (index > length)
                index = length;
            if (index < 0)
                index = 0;
            if (index == length)
                ary.push(value); //插入最后
            else if (index == 0)
                ary.unshift(value); //插入头
            else {
                for (var i = length - 1; i >= index; i -= 1) {
                    ary[i + 1] = ary[i];
                }
                ary[index] = value;
            }
            return value;
        };
        /**
         * 打乱数组 Fisher–Yates shuffle
         * @param list
         */
        ArrayUtils.shuffle = function (list) {
            var n = list.length;
            while (n > 1) {
                n--;
                var k = es.RandomUtils.randint(0, n + 1);
                var value = list[k];
                list[k] = list[n];
                list[n] = value;
            }
        };
        /**
         * 如果项目已经在列表中，返回false，如果成功添加，返回true
         * @param list
         * @param item
         */
        ArrayUtils.addIfNotPresent = function (list, item) {
            if (new es.List(list).contains(item))
                return false;
            list.push(item);
            return true;
        };
        /**
         * 返回列表中的最后一项。列表中至少应该有一个项目
         * @param list
         */
        ArrayUtils.lastItem = function (list) {
            return list[list.length - 1];
        };
        /**
         * 从列表中随机获取一个项目。不清空检查列表!
         * @param list
         */
        ArrayUtils.randomItem = function (list) {
            return list[es.RandomUtils.randint(0, list.length - 1)];
        };
        /**
         * 从列表中随机获取物品。不清空检查列表，也不验证列表数是否大于项目数。返回的List可以通过ListPool.free放回池中
         * @param list
         * @param itemCount 从列表中返回的随机项目的数量
         */
        ArrayUtils.randomItems = function (type, list, itemCount) {
            var set = new Set();
            while (set.size != itemCount) {
                var item = this.randomItem(list);
                if (!set.has(item))
                    set.add(item);
            }
            var items = es.ListPool.obtain(type);
            set.forEach(function (value) { return items.push(value); });
            return items;
        };
        return ArrayUtils;
    }());
    es.ArrayUtils = ArrayUtils;
})(es || (es = {}));
var es;
(function (es) {
    var Base64Utils = /** @class */ (function () {
        function Base64Utils() {
        }
        Object.defineProperty(Base64Utils, "nativeBase64", {
            /**
             * 判断是否原生支持Base64位解析
             */
            get: function () {
                return (typeof (window.atob) === "function");
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 解码
         * @param input
         */
        Base64Utils.decode = function (input) {
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            if (this.nativeBase64) {
                return window.atob(input);
            }
            else {
                var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
                while (i < input.length) {
                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    output.push(String.fromCharCode(chr1));
                    if (enc3 !== 64) {
                        output.push(String.fromCharCode(chr2));
                    }
                    if (enc4 !== 64) {
                        output.push(String.fromCharCode(chr3));
                    }
                }
                output = output.join("");
                return output;
            }
        };
        /**
         * 编码
         * @param input
         */
        Base64Utils.encode = function (input) {
            input = input.replace(/\r\n/g, "\n");
            if (this.nativeBase64) {
                window.btoa(input);
            }
            else {
                var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
                while (i < input.length) {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    }
                    else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
                    output.push(this._keyStr.charAt(enc1));
                    output.push(this._keyStr.charAt(enc2));
                    output.push(this._keyStr.charAt(enc3));
                    output.push(this._keyStr.charAt(enc4));
                }
                output = output.join("");
                return output;
            }
        };
        /**
         * 解析Base64格式数据
         * @param input
         * @param bytes
         */
        Base64Utils.decodeBase64AsArray = function (input, bytes) {
            bytes = bytes || 1;
            var dec = Base64Utils.decode(input), i, j, len;
            var ar = new Uint32Array(dec.length / bytes);
            for (i = 0, len = dec.length / bytes; i < len; i++) {
                ar[i] = 0;
                for (j = bytes - 1; j >= 0; --j) {
                    ar[i] += dec.charCodeAt((i * bytes) + j) << (j << 3);
                }
            }
            return ar;
        };
        /**
         * 暂时不支持
         * @param data
         * @param decoded
         * @param compression
         * @private
         */
        Base64Utils.decompress = function (data, decoded, compression) {
            throw new Error("GZIP/ZLIB compressed TMX Tile Map not supported!");
        };
        /**
         * 解析csv数据
         * @param input
         */
        Base64Utils.decodeCSV = function (input) {
            var entries = input.replace("\n", "").trim().split(",");
            var result = [];
            for (var i = 0; i < entries.length; i++) {
                result.push(+entries[i]);
            }
            return result;
        };
        Base64Utils._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        return Base64Utils;
    }());
    es.Base64Utils = Base64Utils;
})(es || (es = {}));
var es;
(function (es) {
    var EdgeExt = /** @class */ (function () {
        function EdgeExt() {
        }
        EdgeExt.oppositeEdge = function (self) {
            switch (self) {
                case es.Edge.bottom:
                    return es.Edge.top;
                case es.Edge.top:
                    return es.Edge.bottom;
                case es.Edge.left:
                    return es.Edge.right;
                case es.Edge.right:
                    return es.Edge.left;
            }
        };
        /**
         * 如果边是右或左，则返回true
         * @param self
         */
        EdgeExt.isHorizontal = function (self) {
            return self == es.Edge.right || self == es.Edge.left;
        };
        /**
         * 如果边是顶部或底部，则返回true
         * @param self
         */
        EdgeExt.isVertical = function (self) {
            return self == es.Edge.top || self == es.Edge.bottom;
        };
        return EdgeExt;
    }());
    es.EdgeExt = EdgeExt;
})(es || (es = {}));
var es;
(function (es) {
    var NumberExtension = /** @class */ (function () {
        function NumberExtension() {
        }
        NumberExtension.toNumber = function (value) {
            if (value == undefined)
                return 0;
            return Number(value);
        };
        return NumberExtension;
    }());
    es.NumberExtension = NumberExtension;
})(es || (es = {}));
var es;
(function (es) {
    var RandomUtils = /** @class */ (function () {
        function RandomUtils() {
        }
        /**
         * 在 start 与 stop之间取一个随机整数，可以用step指定间隔， 但不包括较大的端点（start与stop较大的一个）
         * 如
         * this.randrange(1, 10, 3)
         * 则返回的可能是   1 或  4 或  7  , 注意 这里面不会返回10，因为是10是大端点
         *
         * @param start
         * @param stop
         * @param step
         * @return 假设 start < stop,  [start, stop) 区间内的随机整数
         *
         */
        RandomUtils.randrange = function (start, stop, step) {
            if (step === void 0) { step = 1; }
            if (step == 0)
                throw new Error('step 不能为 0');
            var width = stop - start;
            if (width == 0)
                throw new Error('没有可用的范围(' + start + ',' + stop + ')');
            if (width < 0)
                width = start - stop;
            var n = Math.floor((width + step - 1) / step);
            return Math.floor(this.random() * n) * step + Math.min(start, stop);
        };
        /**
         * 返回a 到 b之间的随机整数，包括 a 和 b
         * @param a
         * @param b
         * @return [a, b] 之间的随机整数
         *
         */
        RandomUtils.randint = function (a, b) {
            a = Math.floor(a);
            b = Math.floor(b);
            if (a > b)
                a++;
            else
                b++;
            return this.randrange(a, b);
        };
        /**
         * 返回 a - b之间的随机数，不包括  Math.max(a, b)
         * @param a
         * @param b
         * @return 假设 a < b, [a, b)
         */
        RandomUtils.randnum = function (a, b) {
            return this.random() * (b - a) + a;
        };
        /**
         * 打乱数组
         * @param array
         * @return
         */
        RandomUtils.shuffle = function (array) {
            array.sort(this._randomCompare);
            return array;
        };
        /**
         * 从序列中随机取一个元素
         * @param sequence 可以是 数组、 vector，等只要是有length属性，并且可以用数字索引获取元素的对象，
         *                 另外，字符串也是允许的。
         * @return 序列中的某一个元素
         *
         */
        RandomUtils.choice = function (sequence) {
            if (!sequence.hasOwnProperty("length"))
                throw new Error('无法对此对象执行此操作');
            var index = Math.floor(this.random() * sequence.length);
            if (sequence instanceof String)
                return String(sequence).charAt(index);
            else
                return sequence[index];
        };
        /**
         * 对列表中的元素进行随机采æ ?
         * <pre>
         * this.sample([1, 2, 3, 4, 5],  3)  // Choose 3 elements
         * [4, 1, 5]
         * </pre>
         * @param sequence
         * @param num
         * @return
         *
         */
        RandomUtils.sample = function (sequence, num) {
            var len = sequence.length;
            if (num <= 0 || len < num)
                throw new Error("采样数量不够");
            var selected = [];
            var indices = [];
            for (var i = 0; i < num; i++) {
                var index = Math.floor(this.random() * len);
                while (indices.indexOf(index) >= 0)
                    index = Math.floor(this.random() * len);
                selected.push(sequence[index]);
                indices.push(index);
            }
            return selected;
        };
        /**
         * 返回 0.0 - 1.0 之间的随机数，等同于 Math.random()
         * @return Math.random()
         *
         */
        RandomUtils.random = function () {
            return Math.random();
        };
        /**
         * 计算概率
         * @param    chance 概率
         * @return
         */
        RandomUtils.boolean = function (chance) {
            if (chance === void 0) { chance = .5; }
            return (this.random() < chance) ? true : false;
        };
        RandomUtils._randomCompare = function (a, b) {
            return (this.random() > .5) ? 1 : -1;
        };
        return RandomUtils;
    }());
    es.RandomUtils = RandomUtils;
})(es || (es = {}));
var es;
(function (es) {
    var RectangleExt = /** @class */ (function () {
        function RectangleExt() {
        }
        /**
         * 获取指定边的位置
         * @param rect
         * @param edge
         */
        RectangleExt.getSide = function (rect, edge) {
            switch (edge) {
                case es.Edge.top:
                    return rect.top;
                case es.Edge.bottom:
                    return rect.bottom;
                case es.Edge.left:
                    return rect.left;
                case es.Edge.right:
                    return rect.right;
            }
        };
        /**
         * 计算两个矩形的并集。结果将是一个包含其他两个的矩形。
         * @param first
         * @param point
         */
        RectangleExt.union = function (first, point) {
            var rect = new es.Rectangle(point.x, point.y, 0, 0);
            var result = new es.Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, rect.bottom) - result.y;
            return result;
        };
        RectangleExt.getHalfRect = function (rect, edge) {
            switch (edge) {
                case es.Edge.top:
                    return new es.Rectangle(rect.x, rect.y, rect.width, rect.height / 2);
                case es.Edge.bottom:
                    return new es.Rectangle(rect.x, rect.y + rect.height / 2, rect.width, rect.height / 2);
                case es.Edge.left:
                    return new es.Rectangle(rect.x, rect.y, rect.width / 2, rect.height);
                case es.Edge.right:
                    return new es.Rectangle(rect.x + rect.width / 2, rect.y, rect.width / 2, rect.height);
            }
        };
        /**
         * 获取矩形的一部分，其宽度/高度的大小位于矩形的边缘，但仍然包含在其中。
         * @param rect
         * @param edge
         * @param size
         */
        RectangleExt.getRectEdgePortion = function (rect, edge, size) {
            if (size === void 0) { size = 1; }
            switch (edge) {
                case es.Edge.top:
                    return new es.Rectangle(rect.x, rect.y, rect.width, size);
                case es.Edge.bottom:
                    return new es.Rectangle(rect.x, rect.y + rect.height - size, rect.width, size);
                case es.Edge.left:
                    return new es.Rectangle(rect.x, rect.y, size, rect.height);
                case es.Edge.right:
                    return new es.Rectangle(rect.x + rect.width - size, rect.y, size, rect.height);
            }
        };
        RectangleExt.expandSide = function (rect, edge, amount) {
            amount = Math.abs(amount);
            switch (edge) {
                case es.Edge.top:
                    rect.y -= amount;
                    rect.height += amount;
                    break;
                case es.Edge.bottom:
                    rect.height += amount;
                    break;
                case es.Edge.left:
                    rect.x -= amount;
                    rect.width += amount;
                    break;
                case es.Edge.right:
                    rect.width += amount;
                    break;
            }
        };
        RectangleExt.contract = function (rect, horizontalAmount, verticalAmount) {
            rect.x += horizontalAmount;
            rect.y += verticalAmount;
            rect.width -= horizontalAmount * 2;
            rect.height -= verticalAmount * 2;
        };
        /**
         * 给定多边形的点，计算其边界
         * @param points
         */
        RectangleExt.boundsFromPolygonVector = function (points) {
            // 我们需要找到最小/最大的x/y值。
            var minX = Number.POSITIVE_INFINITY;
            var minY = Number.POSITIVE_INFINITY;
            var maxX = Number.NEGATIVE_INFINITY;
            var maxY = Number.NEGATIVE_INFINITY;
            for (var i = 0; i < points.length; i++) {
                var pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMaxVector(new es.Vector2(minX, minY), new es.Vector2(maxX, maxY));
        };
        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param min
         * @param max
         */
        RectangleExt.fromMinMaxVector = function (min, max) {
            return new es.Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
        };
        /**
         * 返回一个跨越当前边界和提供的delta位置的Bounds
         * @param rect
         * @param deltaX
         * @param deltaY
         */
        RectangleExt.getSweptBroadphaseBounds = function (rect, deltaX, deltaY) {
            var broadphasebox = es.Rectangle.empty;
            broadphasebox.x = deltaX > 0 ? rect.x : rect.x + deltaX;
            broadphasebox.y = deltaY > 0 ? rect.y : rect.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + rect.width : rect.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + rect.height : rect.height - deltaY;
            return broadphasebox;
        };
        /**
         * 如果矩形发生碰撞，返回true
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param rect
         * @param other
         * @param moveX
         * @param moveY
         */
        RectangleExt.prototype.collisionCheck = function (rect, other, moveX, moveY) {
            moveX.value = moveY.value = 0;
            var l = other.x - (rect.x + rect.width);
            var r = (other.x + other.width) - rect.x;
            var t = other.y - (rect.y + rect.height);
            var b = (other.y + other.height) - rect.y;
            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;
            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;
            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;
            return true;
        };
        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA
         * @param rectB
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形相交的边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.zero。
         */
        RectangleExt.getIntersectionDepth = function (rectA, rectB) {
            // 计算半尺寸
            var halfWidthA = rectA.width / 2;
            var halfHeightA = rectA.height / 2;
            var halfWidthB = rectB.width / 2;
            var halfHeightB = rectB.height / 2;
            // 计算中心
            var centerA = new es.Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            var centerB = new es.Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);
            // 计算当前中心间的距离和最小非相交距离
            var distanceX = centerA.x - centerB.x;
            var distanceY = centerA.y - centerB.y;
            var minDistanceX = halfWidthA + halfWidthB;
            var minDistanceY = halfHeightA + halfHeightB;
            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return es.Vector2.zero;
            // 计算并返回交叉点深度
            var depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            var depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
            return new es.Vector2(depthX, depthY);
        };
        RectangleExt.getClosestPointOnBoundsToOrigin = function (rect) {
            var max = this.getMax(rect);
            var minDist = Math.abs(rect.location.x);
            var boundsPoint = new es.Vector2(rect.location.x, 0);
            if (Math.abs(max.x) < minDist) {
                minDist = Math.abs(max.x);
                boundsPoint.x = max.x;
                boundsPoint.y = 0;
            }
            if (Math.abs(max.y) < minDist) {
                minDist = Math.abs(max.y);
                boundsPoint.x = 0;
                boundsPoint.y = max.y;
            }
            if (Math.abs(rect.location.y) < minDist) {
                minDist = Math.abs(rect.location.y);
                boundsPoint.x = 0;
                boundsPoint.y = rect.location.y;
            }
            return boundsPoint;
        };
        /**
         * 将Rectangle中或上的最接近点返回给定点
         * @param rect
         * @param point
         */
        RectangleExt.getClosestPointOnRectangleToPoint = function (rect, point) {
            // 对于每个轴，如果该点在盒子外面，则将在盒子上，否则不理会它
            var res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(point.x, rect.left, rect.right);
            res.y = es.MathHelper.clamp(point.y, rect.top, rect.bottom);
            return res;
        };
        /**
         * 获取矩形边界上与给定点最接近的点
         * @param rect
         * @param point
         */
        RectangleExt.getClosestPointOnRectangleBorderToPoint = function (rect, point) {
            // 对于每个轴，如果该点在盒子外面，则将在盒子上，否则不理会它
            var res = es.Vector2.zero;
            res.x = es.MathHelper.clamp(Math.trunc(point.x), rect.left, rect.right);
            res.y = es.MathHelper.clamp(Math.trunc(point.y), rect.top, rect.bottom);
            // 如果点在矩形内，我们需要将res推到边框，因为它将在矩形内 
            if (rect.contains(res.x, res.y)) {
                var dl = rect.x - rect.left;
                var dr = rect.right - res.x;
                var dt = res.y - rect.top;
                var db = rect.bottom - res.y;
                var min = Math.min(dl, dr, dt, db);
                if (min == dt)
                    res.y = rect.top;
                else if (min == db)
                    res.y = rect.bottom;
                else if (min == dl)
                    res.x == rect.left;
                else
                    res.x = rect.right;
            }
            return res;
        };
        RectangleExt.getMax = function (rect) {
            return new es.Vector2(rect.right, rect.bottom);
        };
        /**
         * 以Vector2的形式获取矩形的中心点
         * @param rect
         * @returns
         */
        RectangleExt.getCenter = function (rect) {
            return new es.Vector2(rect.x + rect.width / 2, rect.y + rect.height / 2);
        };
        /**
         * 给定多边形的点即可计算边界
         * @param points
         */
        RectangleExt.boundsFromPolygonPoints = function (points) {
            // 我们需要找到最小/最大x / y值 
            var minX = Number.POSITIVE_INFINITY;
            var minY = Number.POSITIVE_INFINITY;
            var maxX = Number.NEGATIVE_INFINITY;
            var maxY = Number.NEGATIVE_INFINITY;
            for (var i = 0; i < points.length; i++) {
                var pt = points[i];
                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;
                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }
            return this.fromMinMaxVector(new es.Vector2(Math.trunc(minX), Math.trunc(minY)), new es.Vector2(Math.trunc(maxX), Math.trunc(maxY)));
        };
        RectangleExt.calculateBounds = function (rect, parentPosition, position, origin, scale, rotation, width, height) {
            if (rotation == 0) {
                rect.x = Math.trunc(parentPosition.x + position.x - origin.x * scale.x);
                rect.y = Math.trunc(parentPosition.y + position.y - origin.y * scale.y);
                rect.width = Math.trunc(width * scale.x);
                rect.height = Math.trunc(height * scale.y);
            }
            else {
                // 我们需要找到我们的绝对最小/最大值，并据此创建边界
                var worldPosX = parentPosition.x + position.x;
                var worldPosY = parentPosition.y + position.y;
                var tempMat = void 0;
                // 考虑到原点，将参考点设置为世界参考
                var transformMatrix = new es.Matrix2D();
                es.Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y, transformMatrix);
                es.Matrix2D.createScale(scale.x, scale.y, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                es.Matrix2D.createRotation(rotation, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                es.Matrix2D.createTranslation(worldPosX, worldPosY, tempMat);
                transformMatrix = transformMatrix.multiply(tempMat);
                // TODO: 我们可以把世界变换留在矩阵中，避免在世界空间中得到所有的四个角
                var topLeft = new es.Vector2(worldPosX, worldPosY);
                var topRight = new es.Vector2(worldPosX + width, worldPosY);
                var bottomLeft = new es.Vector2(worldPosX, worldPosY + height);
                var bottomRight = new es.Vector2(worldPosX + width, worldPosY + height);
                es.Vector2Ext.transformR(topLeft, transformMatrix, topLeft);
                es.Vector2Ext.transformR(topRight, transformMatrix, topRight);
                es.Vector2Ext.transformR(bottomLeft, transformMatrix, bottomLeft);
                es.Vector2Ext.transformR(bottomRight, transformMatrix, bottomRight);
                // 找出最小值和最大值，这样我们就可以计算出我们的边界框。
                var minX = Math.trunc(Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                var maxX = Math.trunc(Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                var minY = Math.trunc(Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                var maxY = Math.trunc(Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                rect.location = new es.Vector2(minX, minY);
                rect.width = Math.trunc(maxX - minX);
                rect.height = Math.trunc(maxY - minY);
            }
        };
        /**
         * 缩放矩形
         * @param rect
         * @param scale
         */
        RectangleExt.scale = function (rect, scale) {
            rect.x = Math.trunc(rect.x * scale.x);
            rect.y = Math.trunc(rect.y * scale.y);
            rect.width = Math.trunc(rect.width * scale.x);
            rect.height = Math.trunc(rect.height * scale.y);
        };
        RectangleExt.translate = function (rect, vec) {
            rect.location.addEqual(vec);
        };
        return RectangleExt;
    }());
    es.RectangleExt = RectangleExt;
})(es || (es = {}));
var es;
(function (es) {
    var TextureUtils = /** @class */ (function () {
        function TextureUtils() {
        }
        TextureUtils.premultiplyAlpha = function (pixels) {
            var b = pixels[0];
            for (var i = 0; i < pixels.length; i += 4) {
                if (b[i + 3] != 255) {
                    var alpha = b[i + 3] / 255;
                    b[i + 0] = b[i + 0] * alpha;
                    b[i + 1] = b[i + 1] * alpha;
                    b[i + 2] = b[i + 2] * alpha;
                }
            }
        };
        return TextureUtils;
    }());
    es.TextureUtils = TextureUtils;
})(es || (es = {}));
var es;
(function (es) {
    var TypeUtils = /** @class */ (function () {
        function TypeUtils() {
        }
        TypeUtils.getType = function (obj) {
            return obj.constructor;
        };
        return TypeUtils;
    }());
    es.TypeUtils = TypeUtils;
})(es || (es = {}));
var es;
(function (es) {
    var Vector2Ext = /** @class */ (function () {
        function Vector2Ext() {
        }
        /**
         * 检查三角形是CCW还是CW
         * @param a
         * @param center
         * @param c
         */
        Vector2Ext.isTriangleCCW = function (a, center, c) {
            return this.cross(center.sub(a), c.sub(center)) < 0;
        };
        Vector2Ext.halfVector = function () {
            return new es.Vector2(0.5, 0.5);
        };
        /**
         * 计算二维伪叉乘点(Perp(u)， v)
         * @param u
         * @param v
         */
        Vector2Ext.cross = function (u, v) {
            return u.y * v.x - u.x * v.y;
        };
        /**
         * 返回垂直于传入向量的向量
         * @param first
         * @param second
         */
        Vector2Ext.perpendicular = function (first, second) {
            return new es.Vector2(-1 * (second.y - first.y), second.x - first.x);
        };
        /**
         * 将x/y值翻转，并将y反转，得到垂直于x/y的值
         * @param original
         */
        Vector2Ext.perpendicularFlip = function (original) {
            return new es.Vector2(-original.y, original.x);
        };
        /**
         * 返回两个向量之间的角度，单位为度
         * @param from
         * @param to
         */
        Vector2Ext.angle = function (from, to) {
            this.normalize(from);
            this.normalize(to);
            return Math.acos(es.MathHelper.clamp(from.dot(to), -1, 1)) * es.MathHelper.Rad2Deg;
        };
        /**
         * 返回以自度为中心的左右角度
         * @param self
         * @param left
         * @param right
         */
        Vector2Ext.angleBetween = function (self, left, right) {
            var one = left.sub(self);
            var two = right.sub(self);
            return this.angle(one, two);
        };
        /**
         * 给定两条直线(ab和cd)，求交点
         * @param a
         * @param b
         * @param c
         * @param d
         * @param intersection
         */
        Vector2Ext.getRayIntersection = function (a, b, c, d, intersection) {
            if (intersection === void 0) { intersection = es.Vector2.zero; }
            var dy1 = b.y - a.y;
            var dx1 = b.x - a.x;
            var dy2 = d.y - c.y;
            var dx2 = d.x - c.x;
            if (dy1 * dx2 == dy2 * dx1) {
                intersection.x = Number.NaN;
                intersection.y = Number.NaN;
                return false;
            }
            var x = ((c.y - a.y) * dx1 * dx2 + dy1 * dx2 * a.x - dy2 * dx1 * c.x) / (dy1 * dx2 - dy2 * dx1);
            var y = a.y + (dy1 / dx1) * (x - a.x);
            intersection.x = x;
            intersection.y = y;
            return true;
        };
        /**
         * Vector2的临时解决方案
         * 标准化把向量弄乱了
         * @param vec
         */
        Vector2Ext.normalize = function (vec) {
            var magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
            if (magnitude > es.MathHelper.Epsilon) {
                vec.divideScaler(magnitude);
            }
            else {
                vec.x = vec.y = 0;
            }
        };
        /**
         * 通过指定的矩阵对Vector2的数组中的向量应用变换，并将结果放置在另一个数组中。
         * @param sourceArray
         * @param sourceIndex
         * @param matrix
         * @param destinationArray
         * @param destinationIndex
         * @param length
         */
        Vector2Ext.transformA = function (sourceArray, sourceIndex, matrix, destinationArray, destinationIndex, length) {
            for (var i = 0; i < length; i++) {
                var position = sourceArray[sourceIndex + i];
                var destination = destinationArray[destinationIndex + i];
                destination.x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
                destination.y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
                destinationArray[destinationIndex + i] = destination;
            }
        };
        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换
         * @param position
         * @param matrix
         * @param result
         */
        Vector2Ext.transformR = function (position, matrix, result) {
            if (result === void 0) { result = es.Vector2.zero; }
            var x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
            var y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
            result.x = x;
            result.y = y;
        };
        /**
         * 通过指定的矩阵对Vector2的数组中的所有向量应用变换，并将结果放到另一个数组中。
         * @param sourceArray
         * @param matrix
         * @param destinationArray
         */
        Vector2Ext.transform = function (sourceArray, matrix, destinationArray) {
            this.transformA(sourceArray, 0, matrix, destinationArray, 0, sourceArray.length);
        };
        Vector2Ext.round = function (vec) {
            return new es.Vector2(Math.round(vec.x), Math.round(vec.y));
        };
        return Vector2Ext;
    }());
    es.Vector2Ext = Vector2Ext;
})(es || (es = {}));
var es;
(function (es) {
    var Enumerable = /** @class */ (function () {
        function Enumerable() {
        }
        /**
         * 在指定范围内生成一个整数序列。
         */
        Enumerable.range = function (start, count) {
            var result = new es.List();
            while (count--) {
                result.add(start++);
            }
            return result;
        };
        /**
         * 生成包含一个重复值的序列。
         */
        Enumerable.repeat = function (element, count) {
            var result = new es.List();
            while (count--) {
                result.add(element);
            }
            return result;
        };
        return Enumerable;
    }());
    es.Enumerable = Enumerable;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 检查传递的参数是否为对象
     */
    es.isObj = function (x) { return !!x && typeof x === 'object'; };
    /**
     * 创建一个否定谓词结果的函数
     */
    es.negate = function (pred) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return !pred.apply(void 0, __spread(args));
    }; };
    /**
     * 比较器助手
     */
    es.composeComparers = function (previousComparer, currentComparer) { return function (a, b) {
        return previousComparer(a, b) || currentComparer(a, b);
    }; };
    es.keyComparer = function (_keySelector, descending) { return function (a, b) {
        var sortKeyA = _keySelector(a);
        var sortKeyB = _keySelector(b);
        if (sortKeyA > sortKeyB) {
            return !descending ? 1 : -1;
        }
        else if (sortKeyA < sortKeyB) {
            return !descending ? -1 : 1;
        }
        else {
            return 0;
        }
    }; };
})(es || (es = {}));
var es;
(function (es) {
    var List = /** @class */ (function () {
        /**
         * 默认为列表的元素
         */
        function List(elements) {
            if (elements === void 0) { elements = []; }
            this._elements = elements;
        }
        /**
         * 在列表的末尾添加一个对象。
         */
        List.prototype.add = function (element) {
            this._elements.push(element);
        };
        /**
         * 将一个对象追加到列表的末尾。
         */
        List.prototype.append = function (element) {
            this.add(element);
        };
        /**
         * 在列表的开头添加一个对象。
         */
        List.prototype.prepend = function (element) {
            this._elements.unshift(element);
        };
        /**
         * 将指定集合的元素添加到列表的末尾。
         */
        List.prototype.addRange = function (elements) {
            var _a;
            (_a = this._elements).push.apply(_a, __spread(elements));
        };
        /**
         * 对序列应用累加器函数。
         */
        List.prototype.aggregate = function (accumulator, initialValue) {
            return this._elements.reduce(accumulator, initialValue);
        };
        /**
         * 确定序列的所有元素是否满足一个条件。
         */
        List.prototype.all = function (predicate) {
            return this._elements.every(predicate);
        };
        List.prototype.any = function (predicate) {
            return predicate
                ? this._elements.some(predicate)
                : this._elements.length > 0;
        };
        List.prototype.average = function (transform) {
            return this.sum(transform) / this.count(transform);
        };
        /**
         * 将序列的元素转换为指定的类型。
         */
        List.prototype.cast = function () {
            return new List(this._elements);
        };
        /**
         * 从列表中删除所有元素。
         */
        List.prototype.clear = function () {
            this._elements.length = 0;
        };
        /**
         * 连接两个序列。
         */
        List.prototype.concat = function (list) {
            return new List(this._elements.concat(list.toArray()));
        };
        /**
         * 确定一个元素是否在列表中。
         */
        List.prototype.contains = function (element) {
            return this.any(function (x) { return x === element; });
        };
        List.prototype.count = function (predicate) {
            return predicate ? this.where(predicate).count() : this._elements.length;
        };
        /**
         * 返回指定序列的元素，或者如果序列为空，则返回单例集合中类型参数的默认值。
         */
        List.prototype.defaultIfEmpty = function (defaultValue) {
            return this.count() ? this : new List([defaultValue]);
        };
        /**
         * 根据指定的键选择器从序列中返回不同的元素。
         */
        List.prototype.distinctBy = function (keySelector) {
            var groups = this.groupBy(keySelector);
            return Object.keys(groups).reduce(function (res, key) {
                res.add(groups[key][0]);
                return res;
            }, new List());
        };
        /**
         * 返回序列中指定索引处的元素。
         */
        List.prototype.elementAt = function (index) {
            if (index < this.count() && index >= 0) {
                return this._elements[index];
            }
            else {
                throw new Error('ArgumentOutOfRangeException: index is less than 0 or greater than or equal to the number of elements in source.');
            }
        };
        /**
         * 返回序列中指定索引处的元素，如果索引超出范围，则返回默认值。
         */
        List.prototype.elementAtOrDefault = function (index) {
            return index < this.count() && index >= 0
                ? this._elements[index]
                : undefined;
        };
        /**
         * 通过使用默认的相等比较器来比较值，生成两个序列的差值集。
         */
        List.prototype.except = function (source) {
            return this.where(function (x) { return !source.contains(x); });
        };
        List.prototype.first = function (predicate) {
            if (this.count()) {
                return predicate ? this.where(predicate).first() : this._elements[0];
            }
            else {
                throw new Error('InvalidOperationException: The source sequence is empty.');
            }
        };
        List.prototype.firstOrDefault = function (predicate) {
            return this.count(predicate) ? this.first(predicate) : undefined;
        };
        /**
         * 对列表中的每个元素执行指定的操作。
         */
        List.prototype.forEach = function (action) {
            return this._elements.forEach(action);
        };
        /**
         * 根据指定的键选择器函数对序列中的元素进行分组。
         */
        List.prototype.groupBy = function (grouper, mapper) {
            if (mapper === void 0) { mapper = function (val) { return val; }; }
            var initialValue = {};
            return this.aggregate(function (ac, v) {
                var key = grouper(v);
                var existingGroup = ac[key];
                var mappedValue = mapper(v);
                existingGroup
                    ? existingGroup.push(mappedValue)
                    : (ac[key] = [mappedValue]);
                return ac;
            }, initialValue);
        };
        /**
         * 根据键的相等将两个序列的元素关联起来，并将结果分组。默认的相等比较器用于比较键。
         */
        List.prototype.groupJoin = function (list, key1, key2, result) {
            return this.select(function (x) {
                return result(x, list.where(function (z) { return key1(x) === key2(z); }));
            });
        };
        /**
         * 返回列表中某个元素第一次出现的索引。
         */
        List.prototype.indexOf = function (element) {
            return this._elements.indexOf(element);
        };
        /**
         * 向列表中插入一个元素在指定索引处。
         */
        List.prototype.insert = function (index, element) {
            if (index < 0 || index > this._elements.length) {
                throw new Error('Index is out of range.');
            }
            this._elements.splice(index, 0, element);
        };
        /**
         * 通过使用默认的相等比较器来比较值，生成两个序列的交集集。
         */
        List.prototype.intersect = function (source) {
            return this.where(function (x) { return source.contains(x); });
        };
        /**
         * 基于匹配的键将两个序列的元素关联起来。默认的相等比较器用于比较键。
         */
        List.prototype.join = function (list, key1, key2, result) {
            return this.selectMany(function (x) {
                return list.where(function (y) { return key2(y) === key1(x); }).select(function (z) { return result(x, z); });
            });
        };
        List.prototype.last = function (predicate) {
            if (this.count()) {
                return predicate
                    ? this.where(predicate).last()
                    : this._elements[this.count() - 1];
            }
            else {
                throw Error('InvalidOperationException: The source sequence is empty.');
            }
        };
        List.prototype.lastOrDefault = function (predicate) {
            return this.count(predicate) ? this.last(predicate) : undefined;
        };
        List.prototype.max = function (selector) {
            var id = function (x) { return x; };
            return Math.max.apply(Math, __spread(this._elements.map(selector || id)));
        };
        List.prototype.min = function (selector) {
            var id = function (x) { return x; };
            return Math.min.apply(Math, __spread(this._elements.map(selector || id)));
        };
        /**
         * 根据指定的类型筛选序列中的元素。
         */
        List.prototype.ofType = function (type) {
            var typeName;
            switch (type) {
                case Number:
                    typeName = typeof 0;
                    break;
                case String:
                    typeName = typeof '';
                    break;
                case Boolean:
                    typeName = typeof true;
                    break;
                case Function:
                    typeName = typeof function () { }; // tslint:disable-line no-empty
                    break;
                default:
                    typeName = null;
                    break;
            }
            return typeName === null
                ? this.where(function (x) { return x instanceof type; }).cast()
                : this.where(function (x) { return typeof x === typeName; }).cast();
        };
        /**
         * 根据键按升序对序列中的元素进行排序。
         */
        List.prototype.orderBy = function (keySelector, comparer) {
            if (comparer === void 0) { comparer = es.keyComparer(keySelector, false); }
            // tslint:disable-next-line: no-use-before-declare
            return new OrderedList(this._elements, comparer);
        };
        /**
         * 根据键值降序对序列中的元素进行排序。
         */
        List.prototype.orderByDescending = function (keySelector, comparer) {
            if (comparer === void 0) { comparer = es.keyComparer(keySelector, true); }
            // tslint:disable-next-line: no-use-before-declare
            return new OrderedList(this._elements, comparer);
        };
        /**
         * 按键按升序对序列中的元素执行后续排序。
         */
        List.prototype.thenBy = function (keySelector) {
            return this.orderBy(keySelector);
        };
        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         */
        List.prototype.thenByDescending = function (keySelector) {
            return this.orderByDescending(keySelector);
        };
        /**
         * 从列表中删除第一个出现的特定对象。
         */
        List.prototype.remove = function (element) {
            return this.indexOf(element) !== -1
                ? (this.removeAt(this.indexOf(element)), true)
                : false;
        };
        /**
         * 删除与指定谓词定义的条件匹配的所有元素。
         */
        List.prototype.removeAll = function (predicate) {
            return this.where(es.negate(predicate));
        };
        /**
         * 删除列表指定索引处的元素。
         */
        List.prototype.removeAt = function (index) {
            this._elements.splice(index, 1);
        };
        /**
         * 颠倒整个列表中元素的顺序。
         */
        List.prototype.reverse = function () {
            return new List(this._elements.reverse());
        };
        /**
         * 将序列中的每个元素投射到一个新形式中。
         */
        List.prototype.select = function (selector) {
            return new List(this._elements.map(selector));
        };
        /**
         * 将序列的每个元素投影到一个列表中。并将得到的序列扁平化为一个序列。
         */
        List.prototype.selectMany = function (selector) {
            var _this = this;
            return this.aggregate(function (ac, _, i) { return (ac.addRange(_this.select(selector)
                .elementAt(i)
                .toArray()),
                ac); }, new List());
        };
        /**
         * 通过使用默认的相等比较器对元素的类型进行比较，确定两个序列是否相等。
         */
        List.prototype.sequenceEqual = function (list) {
            return this.all(function (e) { return list.contains(e); });
        };
        /**
         * 返回序列中唯一的元素，如果序列中没有恰好一个元素，则抛出异常。
         */
        List.prototype.single = function (predicate) {
            if (this.count(predicate) !== 1) {
                throw new Error('The collection does not contain exactly one element.');
            }
            else {
                return this.first(predicate);
            }
        };
        /**
         * 返回序列中唯一的元素，如果序列为空，则返回默认值;如果序列中有多个元素，此方法将抛出异常。
         */
        List.prototype.singleOrDefault = function (predicate) {
            return this.count(predicate) ? this.single(predicate) : undefined;
        };
        /**
         * 绕过序列中指定数量的元素，然后返回剩余的元素。
         */
        List.prototype.skip = function (amount) {
            return new List(this._elements.slice(Math.max(0, amount)));
        };
        /**
         * 省略序列中最后指定数量的元素，然后返回剩余的元素。
         */
        List.prototype.skipLast = function (amount) {
            return new List(this._elements.slice(0, -Math.max(0, amount)));
        };
        /**
         * 只要指定条件为真，就绕过序列中的元素，然后返回剩余的元素。
         */
        List.prototype.skipWhile = function (predicate) {
            var _this = this;
            return this.skip(this.aggregate(function (ac) { return (predicate(_this.elementAt(ac)) ? ++ac : ac); }, 0));
        };
        List.prototype.sum = function (transform) {
            return transform
                ? this.select(transform).sum()
                : this.aggregate(function (ac, v) { return (ac += +v); }, 0);
        };
        /**
         * 从序列的开始返回指定数量的连续元素。
         */
        List.prototype.take = function (amount) {
            return new List(this._elements.slice(0, Math.max(0, amount)));
        };
        /**
         * 从序列的末尾返回指定数目的连续元素。
         */
        List.prototype.takeLast = function (amount) {
            return new List(this._elements.slice(-Math.max(0, amount)));
        };
        /**
         * 返回序列中的元素，只要指定的条件为真。
         */
        List.prototype.takeWhile = function (predicate) {
            var _this = this;
            return this.take(this.aggregate(function (ac) { return (predicate(_this.elementAt(ac)) ? ++ac : ac); }, 0));
        };
        /**
         * 复制列表中的元素到一个新数组。
         */
        List.prototype.toArray = function () {
            return this._elements;
        };
        List.prototype.toDictionary = function (key, value) {
            var _this = this;
            return this.aggregate(function (dicc, v, i) {
                dicc[_this.select(key)
                    .elementAt(i)
                    .toString()] = value ? _this.select(value).elementAt(i) : v;
                dicc.add({
                    Key: _this.select(key).elementAt(i),
                    Value: value ? _this.select(value).elementAt(i) : v
                });
                return dicc;
            }, new List());
        };
        /**
         * 创建一个Set从一个Enumerable.List< T>。
         */
        List.prototype.toSet = function () {
            var e_14, _a;
            var result = new Set();
            try {
                for (var _b = __values(this._elements), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var x = _c.value;
                    result.add(x);
                }
            }
            catch (e_14_1) { e_14 = { error: e_14_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_14) throw e_14.error; }
            }
            return result;
        };
        /**
         * 创建一个List< T>从一个Enumerable.List< T>。
         */
        List.prototype.toList = function () {
            return this;
        };
        /**
         * 创建一个查找，TElement>从一个IEnumerable< T>根据指定的键选择器和元素选择器函数。
         */
        List.prototype.toLookup = function (keySelector, elementSelector) {
            return this.groupBy(keySelector, elementSelector);
        };
        /**
         * 基于谓词过滤一系列值。
         */
        List.prototype.where = function (predicate) {
            return new List(this._elements.filter(predicate));
        };
        /**
         * 将指定的函数应用于两个序列的对应元素，生成结果序列。
         */
        List.prototype.zip = function (list, result) {
            var _this = this;
            return list.count() < this.count()
                ? list.select(function (x, y) { return result(_this.elementAt(y), x); })
                : this.select(function (x, y) { return result(x, list.elementAt(y)); });
        };
        return List;
    }());
    es.List = List;
    /**
     * 表示已排序的序列。该类的方法是通过使用延迟执行来实现的。
     * 即时返回值是一个存储执行操作所需的所有信息的对象。
     * 在通过调用对象的ToDictionary、ToLookup、ToList或ToArray方法枚举对象之前，不会执行由该方法表示的查询
     */
    var OrderedList = /** @class */ (function (_super) {
        __extends(OrderedList, _super);
        function OrderedList(elements, _comparer) {
            var _this = _super.call(this, elements) || this;
            _this._comparer = _comparer;
            _this._elements.sort(_this._comparer);
            return _this;
        }
        /**
         * 按键按升序对序列中的元素执行后续排序。
         * @override
         */
        OrderedList.prototype.thenBy = function (keySelector) {
            return new OrderedList(this._elements, es.composeComparers(this._comparer, es.keyComparer(keySelector, false)));
        };
        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         * @override
         */
        OrderedList.prototype.thenByDescending = function (keySelector) {
            return new OrderedList(this._elements, es.composeComparers(this._comparer, es.keyComparer(keySelector, true)));
        };
        return OrderedList;
    }(List));
    es.OrderedList = OrderedList;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 一段的终点
     */
    var EndPoint = /** @class */ (function () {
        function EndPoint() {
            this.position = es.Vector2.zero;
            this.begin = false;
            this.segment = null;
            this.angle = 0;
        }
        return EndPoint;
    }());
    es.EndPoint = EndPoint;
    var EndPointComparer = /** @class */ (function () {
        function EndPointComparer() {
        }
        /**
         * 按角度对点进行排序的比较功能
         * @param a
         * @param b
         */
        EndPointComparer.prototype.compare = function (a, b) {
            // 按角度顺序移动
            if (a.angle > b.angle)
                return 1;
            if (a.angle < b.angle)
                return -1;
            // 但对于纽带，我们希望Begin节点在End节点之前
            if (!a.begin && b.begin)
                return 1;
            if (a.begin && !b.begin)
                return -1;
            return 0;
        };
        return EndPointComparer;
    }());
    es.EndPointComparer = EndPointComparer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 表示可见性网格中的遮挡线段
     */
    var Segment = /** @class */ (function () {
        function Segment() {
            this.p1 = null;
            this.p2 = null;
        }
        return Segment;
    }());
    es.Segment = Segment;
})(es || (es = {}));
///<reference path="../Collections/LinkList.ts" />
var es;
///<reference path="../Collections/LinkList.ts" />
(function (es) {
    /**
     * 类，它可以计算出一个网格，表示从给定的一组遮挡物的原点可以看到哪些区域。使用方法如下。
     *
     * - 调用 begin
     * - 添加任何遮挡物
     * - 调用end来获取可见度多边形。当调用end时，所有的内部存储都会被清空。
     */
    var VisibilityComputer = /** @class */ (function () {
        function VisibilityComputer(origin, radius) {
            /**
             *  在近似圆的时候要用到的线的总数。只需要一个180度的半球，所以这将是近似该半球的线段数
             */
            this.lineCountForCircleApproximation = 10;
            this._radius = 0;
            this._origin = es.Vector2.zero;
            this._isSpotLight = false;
            this._spotStartAngle = 0;
            this._spotEndAngle = 0;
            this._endPoints = [];
            this._segments = [];
            this._origin = origin;
            this._radius = radius;
            this._radialComparer = new es.EndPointComparer();
        }
        /**
         * 增加了一个对撞机作为PolyLight的遮蔽器
         * @param collider
         */
        VisibilityComputer.prototype.addColliderOccluder = function (collider) {
            // 特殊情况下，BoxColliders没有旋转
            if (collider instanceof es.BoxCollider && collider.rotation == 0) {
                this.addSquareOccluder(collider.bounds);
                return;
            }
            if (collider instanceof es.PolygonCollider) {
                var poly = collider.shape;
                for (var i = 0; i < poly.points.length; i++) {
                    var firstIndex = i - 1;
                    if (i == 0)
                        firstIndex += poly.points.length;
                    this.addLineOccluder(es.Vector2.add(poly.points[firstIndex], poly.position), es.Vector2.add(poly.points[i], poly.position));
                }
            }
            else if (collider instanceof es.CircleCollider) {
                this.addCircleOccluder(collider.absolutePosition, collider.radius);
            }
        };
        /**
         * 增加了一个圆形的遮挡器
         * @param position
         * @param radius
         */
        VisibilityComputer.prototype.addCircleOccluder = function (position, radius) {
            var dirToCircle = position.sub(this._origin);
            var angle = Math.atan2(dirToCircle.y, dirToCircle.x);
            var stepSize = Math.PI / this.lineCountForCircleApproximation;
            var startAngle = angle + es.MathHelper.PiOver2;
            var lastPt = es.MathHelper.angleToVector(startAngle, radius).addEqual(position);
            for (var i = 1; i < this.lineCountForCircleApproximation; i++) {
                var nextPt = es.MathHelper.angleToVector(startAngle + i * stepSize, radius).addEqual(position);
                this.addLineOccluder(lastPt, nextPt);
                lastPt = nextPt;
            }
        };
        /**
         * 增加一个线型遮挡器
         * @param p1
         * @param p2
         */
        VisibilityComputer.prototype.addLineOccluder = function (p1, p2) {
            this.addSegment(p1, p2);
        };
        /**
         * 增加一个方形的遮挡器
         * @param bounds
         */
        VisibilityComputer.prototype.addSquareOccluder = function (bounds) {
            var tr = new es.Vector2(bounds.right, bounds.top);
            var bl = new es.Vector2(bounds.left, bounds.bottom);
            var br = new es.Vector2(bounds.right, bounds.bottom);
            this.addSegment(bounds.location, tr);
            this.addSegment(tr, br);
            this.addSegment(br, bl);
            this.addSegment(bl, bounds.location);
        };
        /**
         * 添加一个段，第一个点在可视化中显示，但第二个点不显示。
         * 每个端点都是两个段的一部分，但我们希望只显示一次
         * @param p1
         * @param p2
         */
        VisibilityComputer.prototype.addSegment = function (p1, p2) {
            var segment = new es.Segment();
            var endPoint1 = new es.EndPoint();
            var endPoint2 = new es.EndPoint();
            endPoint1.position = p1;
            endPoint1.segment = segment;
            endPoint2.position = p2;
            endPoint2.segment = segment;
            segment.p1 = endPoint1;
            segment.p2 = endPoint2;
            this._segments.push(segment);
            this._endPoints.push(endPoint1);
            this._endPoints.push(endPoint2);
        };
        /**
         * 移除所有的遮挡物
         */
        VisibilityComputer.prototype.clearOccluders = function () {
            this._segments.length = 0;
            this._endPoints.length = 0;
        };
        /**
         * 为计算机计算当前的聚光做好准备
         * @param origin
         * @param radius
         */
        VisibilityComputer.prototype.begin = function (origin, radius) {
            this._origin = origin;
            this._radius = radius;
            this._isSpotLight = false;
        };
        /**
         * 计算可见性多边形，并返回三角形扇形的顶点（减去中心顶点）。返回的数组来自ListPool
         */
        VisibilityComputer.prototype.end = function () {
            var e_15, _a;
            var output = es.ListPool.obtain(es.Vector2);
            this.updateSegments();
            this._endPoints.sort(this._radialComparer.compare);
            var currentAngle = 0;
            // 在扫描开始时，我们想知道哪些段是活动的。
            // 最简单的方法是先进行一次段的收集，然后再进行一次段的收集和处理。
            // 然而，更有效的方法是通过所有的段，找出哪些段与最初的扫描线相交，然后对它们进行分类
            for (var pass = 0; pass < 2; pass++) {
                try {
                    for (var _b = __values(this._endPoints), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var p = _c.value;
                        var currentOld = VisibilityComputer._openSegments.size() == 0 ? null : VisibilityComputer._openSegments.getHead().element;
                        if (p.begin) {
                            // 在列表中的正确位置插入
                            var node = VisibilityComputer._openSegments.getHead();
                            while (node != null && this.isSegmentInFrontOf(p.segment, node.element, this._origin))
                                node = node.next;
                            if (node == null)
                                VisibilityComputer._openSegments.push(p.segment);
                            else
                                VisibilityComputer._openSegments.insert(p.segment, VisibilityComputer._openSegments.indexOf(node.element));
                        }
                        else {
                            VisibilityComputer._openSegments.remove(p.segment);
                        }
                        var currentNew = null;
                        if (VisibilityComputer._openSegments.size() != 0)
                            currentNew = VisibilityComputer._openSegments.getHead().element;
                        if (currentOld != currentNew) {
                            if (pass == 1) {
                                if (!this._isSpotLight || (VisibilityComputer.between(currentAngle, this._spotStartAngle, this._spotEndAngle) &&
                                    VisibilityComputer.between(p.angle, this._spotStartAngle, this._spotEndAngle)))
                                    this.addTriangle(output, currentAngle, p.angle, currentOld);
                            }
                            currentAngle = p.angle;
                        }
                    }
                }
                catch (e_15_1) { e_15 = { error: e_15_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_15) throw e_15.error; }
                }
            }
            VisibilityComputer._openSegments.clear();
            this.clearOccluders();
            return output;
        };
        VisibilityComputer.prototype.addTriangle = function (triangles, angle1, angle2, segment) {
            var p1 = this._origin.clone();
            var p2 = new es.Vector2(this._origin.x + Math.cos(angle1), this._origin.y + Math.sin(angle1));
            var p3 = es.Vector2.zero;
            var p4 = es.Vector2.zero;
            if (segment != null) {
                // 将三角形停在相交线段上
                p3.x = segment.p1.position.x;
                p3.y = segment.p1.position.y;
                p4.x = segment.p2.position.x;
                p4.y = segment.p2.position.y;
            }
            else {
                p3.x = this._origin.x + Math.cos(angle1) * this._radius * 2;
                p3.y = this._origin.y + Math.sin(angle1) * this._radius * 2;
                p4.x = this._origin.x + Math.cos(angle2) * this._radius * 2;
                p4.y = this._origin.y + Math.sin(angle2) * this._radius * 2;
            }
            var pBegin = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);
            p2.x = this._origin.x + Math.cos(angle2);
            p2.y = this._origin.y + Math.sin(angle2);
            var pEnd = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);
            triangles.push(pBegin);
            triangles.push(pEnd);
        };
        /**
         * 计算直线p1-p2与p3-p4的交点
         * @param p1
         * @param p2
         * @param p3
         * @param p4
         */
        VisibilityComputer.lineLineIntersection = function (p1, p2, p3, p4) {
            var s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x))
                / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
            return new es.Vector2(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
        };
        VisibilityComputer.between = function (value, min, max) {
            value = (360 + (value % 360)) % 360;
            min = (3600000 + min) % 360;
            max = (3600000 + max) % 360;
            if (min < max)
                return min <= value && value <= max;
            return min <= value || value <= max;
        };
        /**
         * 辅助函数，用于沿外周线构建分段，以限制光的半径。
         */
        VisibilityComputer.prototype.loadRectangleBoundaries = function () {
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y - this._radius));
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y + this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
            this.addSegment(new es.Vector2(this._origin.x - this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x - this._radius, this._origin.y + this._radius));
            this.addSegment(new es.Vector2(this._origin.x + this._radius, this._origin.y - this._radius), new es.Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
        };
        /**
         * 助手：我们知道a段在b的前面吗？实现不反对称（也就是说，isSegmentInFrontOf(a, b) != (!isSegmentInFrontOf(b, a))）。
         * 另外要注意的是，在可见性算法中，它只需要在有限的一组情况下工作，我不认为它能处理所有的情况。
         * 见http://www.redblobgames.com/articles/visibility/segment-sorting.html
         * @param a
         * @param b
         * @param relativeTo
         */
        VisibilityComputer.prototype.isSegmentInFrontOf = function (a, b, relativeTo) {
            // 注意：我们稍微缩短了段，所以在这个算法中，端点的交点（共同）不计入交点。
            var a1 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p1.position, b.p2.position, 0.01));
            var a2 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p2.position, b.p1.position, 0.01));
            var a3 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, relativeTo);
            var b1 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p1.position, a.p2.position, 0.01));
            var b2 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p2.position, a.p1.position, 0.01));
            var b3 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, relativeTo);
            // 注：考虑A1-A2这条线。如果B1和B2都在一条边上，而relativeTo在另一条边上，那么A就在观看者和B之间。
            if (b1 == b2 && b2 != b3)
                return true;
            if (a1 == a2 && a2 == a3)
                return true;
            if (a1 == a2 && a2 != a3)
                return false;
            if (b1 == b2 && b2 == b3)
                return false;
            // 如果A1 !=A2，B1 !=B2，那么我们就有一个交点。
            // 一个更稳健的实现是在交叉点上分割段，使一部分段在前面，一部分段在后面，但无论如何我们不应该有重叠的碰撞器，所以这不是太重要
            return false;
            // 注意：以前的实现方式是a.d < b.d.，这比较简单，但当段的大小不一样时，就麻烦了。
            // 如果你是在一个网格上，而且段的大小相似，那么使用距离将是一个更简单和更快的实现。
        };
        /**
         * 返回略微缩短的向量：p * (1 - f) + q * f
         * @param p
         * @param q
         * @param f
         */
        VisibilityComputer.interpolate = function (p, q, f) {
            return new es.Vector2(p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
        };
        /**
         * 返回点是否在直线p1-p2的 "左边"。
         * @param p1
         * @param p2
         * @param point
         */
        VisibilityComputer.isLeftOf = function (p1, p2, point) {
            var cross = (p2.x - p1.x) * (point.y - p1.y)
                - (p2.y - p1.y) * (point.x - p1.x);
            return cross < 0;
        };
        /**
         * 处理片段，以便我们稍后对它们进行分类
         */
        VisibilityComputer.prototype.updateSegments = function () {
            var e_16, _a;
            try {
                for (var _b = __values(this._segments), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var segment = _c.value;
                    // 注：未来的优化：我们可以记录象限和y/x或x/y比率，并按（象限、比率）排序，而不是调用atan2。
                    // 参见<https://github.com/mikolalysenko/compare-slope>，有一个库可以做到这一点
                    segment.p1.angle = Math.atan2(segment.p1.position.y - this._origin.y, segment.p1.position.x - this._origin.x);
                    segment.p2.angle = Math.atan2(segment.p2.position.y - this._origin.y, segment.p2.position.x - this._origin.x);
                    //  Pi和Pi之间的映射角度
                    var dAngle = segment.p2.angle - segment.p1.angle;
                    if (dAngle <= -Math.PI)
                        dAngle += Math.PI * 2;
                    if (dAngle > Math.PI)
                        dAngle -= Math.PI * 2;
                    segment.p1.begin = (dAngle > 0);
                    segment.p2.begin = !segment.p1.begin;
                }
            }
            catch (e_16_1) { e_16 = { error: e_16_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_16) throw e_16.error; }
            }
            // 如果我们有一个聚光灯，我们需要存储前两个段的角度。
            // 这些是光斑的边界，我们将用它们来过滤它们之外的任何顶点。
            if (this._isSpotLight) {
                this._spotStartAngle = this._segments[0].p2.angle;
                this._spotEndAngle = this._segments[1].p2.angle;
            }
        };
        VisibilityComputer._cornerCache = [];
        VisibilityComputer._openSegments = new es.LinkedList();
        return VisibilityComputer;
    }());
    es.VisibilityComputer = VisibilityComputer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 私有类隐藏ITimer的实现
     */
    var Timer = /** @class */ (function () {
        function Timer() {
            this._timeInSeconds = 0;
            this._repeats = false;
            this._isDone = false;
            this._elapsedTime = 0;
        }
        Timer.prototype.getContext = function () {
            return this.context;
        };
        Timer.prototype.reset = function () {
            this._elapsedTime = 0;
        };
        Timer.prototype.stop = function () {
            this._isDone = true;
        };
        Timer.prototype.tick = function () {
            // 如果stop在tick之前被调用，那么isDone将为true，我们不应该再做任何事情
            if (!this._isDone && this._elapsedTime > this._timeInSeconds) {
                this._elapsedTime -= this._timeInSeconds;
                this._onTime(this);
                if (!this._isDone && !this._repeats)
                    this._isDone = true;
            }
            this._elapsedTime += es.Time.deltaTime;
            return this._isDone;
        };
        Timer.prototype.initialize = function (timeInsSeconds, repeats, context, onTime) {
            this._timeInSeconds = timeInsSeconds;
            this._repeats = repeats;
            this.context = context;
            this._onTime = onTime;
        };
        /**
         * 空出对象引用，以便在js需要时GC可以清理它们的引用
         */
        Timer.prototype.unload = function () {
            this.context = null;
            this._onTime = null;
        };
        return Timer;
    }());
    es.Timer = Timer;
})(es || (es = {}));
var es;
(function (es) {
    /**
     * 允许动作的延迟和重复执行
     */
    var TimerManager = /** @class */ (function (_super) {
        __extends(TimerManager, _super);
        function TimerManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._timers = [];
            return _this;
        }
        TimerManager.prototype.update = function () {
            for (var i = this._timers.length - 1; i >= 0; i--) {
                if (this._timers[i].tick()) {
                    this._timers[i].unload();
                    new es.List(this._timers).removeAt(i);
                }
            }
        };
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        TimerManager.prototype.schedule = function (timeInSeconds, repeats, context, onTime) {
            var timer = new es.Timer();
            timer.initialize(timeInSeconds, repeats, context, onTime);
            this._timers.push(timer);
            return timer;
        };
        return TimerManager;
    }(es.GlobalManager));
    es.TimerManager = TimerManager;
})(es || (es = {}));
