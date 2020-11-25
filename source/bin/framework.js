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
Array.prototype.findIndex = function (predicate) {
    function findIndex(array, predicate) {
        for (var i = 0, len = array.length; i < len; i++) {
            if (predicate.call(arguments[2], array[i], i, array)) {
                return i;
            }
        }
        return -1;
    }
    return findIndex(this, predicate);
};
Array.prototype.any = function (predicate) {
    function any(array, predicate) {
        return array.findIndex(predicate) > -1;
    }
    return any(this, predicate);
};
Array.prototype.firstOrDefault = function (predicate) {
    function firstOrDefault(array, predicate) {
        var index = array.findIndex(predicate);
        return index == -1 ? null : array[index];
    }
    return firstOrDefault(this, predicate);
};
Array.prototype.find = function (predicate) {
    function find(array, predicate) {
        return array.firstOrDefault(predicate);
    }
    return find(this, predicate);
};
Array.prototype.where = function (predicate) {
    function where(array, predicate) {
        if (typeof (array.reduce) === "function") {
            return array.reduce(function (ret, element, index) {
                if (predicate.call(arguments[2], element, index, array)) {
                    ret.push(element);
                }
                return ret;
            }, []);
        }
        else {
            var ret = [];
            for (var i = 0, len = array.length; i < len; i++) {
                var element = array[i];
                if (predicate.call(arguments[2], element, i, array)) {
                    ret.push(element);
                }
            }
            return ret;
        }
    }
    return where(this, predicate);
};
Array.prototype.count = function (predicate) {
    function count(array, predicate) {
        return array.where(predicate).length;
    }
    return count(this, predicate);
};
Array.prototype.findAll = function (predicate) {
    function findAll(array, predicate) {
        return array.where(predicate);
    }
    return findAll(this, predicate);
};
Array.prototype.contains = function (value) {
    function contains(array, value) {
        for (var i = 0, len = array.length; i < len; i++) {
            if (array[i] == value) {
                return true;
            }
        }
        return false;
    }
    return contains(this, value);
};
Array.prototype.removeAll = function (predicate) {
    function removeAll(array, predicate) {
        var index;
        do {
            index = array.findIndex(predicate);
            if (index >= 0) {
                array.splice(index, 1);
            }
        } while (index >= 0);
    }
    removeAll(this, predicate);
};
Array.prototype.remove = function (element) {
    function remove(array, element) {
        var index = array.findIndex(function (x) {
            return x === element;
        });
        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }
    return remove(this, element);
};
Array.prototype.removeAt = function (index) {
    function removeAt(array, index) {
        array.splice(index, 1);
    }
    return removeAt(this, index);
};
Array.prototype.removeRange = function (index, count) {
    function removeRange(array, index, count) {
        array.splice(index, count);
    }
    return removeRange(this, index, count);
};
Array.prototype.select = function (selector) {
    function select(array, selector) {
        if (typeof (array.reduce) === "function") {
            return array.reduce(function (ret, element, index) {
                ret.push(selector.call(arguments[2], element, index, array));
                return ret;
            }, []);
        }
        else {
            var ret = [];
            for (var i = 0, len = array.length; i < len; i++) {
                ret.push(selector.call(arguments[2], array[i], i, array));
            }
            return ret;
        }
    }
    return select(this, selector);
};
Array.prototype.orderBy = function (keySelector, comparer) {
    function orderBy(array, keySelector, comparer) {
        array.sort(function (x, y) {
            var v1 = keySelector(x);
            var v2 = keySelector(y);
            if (comparer) {
                return comparer(v1, v2);
            }
            else {
                return (v1 > v2) ? 1 : -1;
            }
        });
        return array;
    }
    return orderBy(this, keySelector, comparer);
};
Array.prototype.orderByDescending = function (keySelector, comparer) {
    function orderByDescending(array, keySelector, comparer) {
        array.sort(function (x, y) {
            var v1 = keySelector(x);
            var v2 = keySelector(y);
            if (comparer) {
                return -comparer(v1, v2);
            }
            else {
                return (v1 < v2) ? 1 : -1;
            }
        });
        return array;
    }
    return orderByDescending(this, keySelector, comparer);
};
Array.prototype.groupBy = function (keySelector) {
    function groupBy(array, keySelector) {
        if (typeof (array.reduce) === "function") {
            var keys_1 = [];
            return array.reduce(function (groups, element, index) {
                var key = JSON.stringify(keySelector.call(arguments[1], element, index, array));
                var index2 = keys_1.findIndex(function (x) {
                    return x === key;
                });
                if (index2 < 0) {
                    index2 = keys_1.push(key) - 1;
                }
                if (!groups[index2]) {
                    groups[index2] = [];
                }
                groups[index2].push(element);
                return groups;
            }, []);
        }
        else {
            var groups = [];
            var keys = [];
            var _loop_1 = function (i, len) {
                var key = JSON.stringify(keySelector.call(arguments_1[1], array[i], i, array));
                var index = keys.findIndex(function (x) {
                    return x === key;
                });
                if (index < 0) {
                    index = keys.push(key) - 1;
                }
                if (!groups[index]) {
                    groups[index] = [];
                }
                groups[index].push(array[i]);
            };
            var arguments_1 = arguments;
            for (var i = 0, len = array.length; i < len; i++) {
                _loop_1(i, len);
            }
            return groups;
        }
    }
    return groupBy(this, keySelector);
};
Array.prototype.sum = function (selector) {
    function sum(array, selector) {
        var ret;
        for (var i = 0, len = array.length; i < len; i++) {
            if (i == 0) {
                if (selector) {
                    ret = selector.call(arguments[2], array[i], i, array);
                }
                else {
                    ret = array[i];
                }
            }
            else {
                if (selector) {
                    ret += selector.call(arguments[2], array[i], i, array);
                }
                else {
                    ret += array[i];
                }
            }
        }
        return ret;
    }
    return sum(this, selector);
};
var es;
(function (es) {
    var Component = (function () {
        function Component() {
            this.updateInterval = 1;
            this._enabled = true;
            this._updateOrder = 0;
        }
        Object.defineProperty(Component.prototype, "transform", {
            get: function () {
                return this.entity.transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "enabled", {
            get: function () {
                return this.entity ? this.entity.enabled && this._enabled : this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "updateOrder", {
            get: function () {
                return this._updateOrder;
            },
            set: function (value) {
                this.setUpdateOrder(value);
            },
            enumerable: true,
            configurable: true
        });
        Component.prototype.initialize = function () {
        };
        Component.prototype.onAddedToEntity = function () {
        };
        Component.prototype.onRemovedFromEntity = function () {
        };
        Component.prototype.onEntityTransformChanged = function (comp) {
        };
        Component.prototype.onEnabled = function () {
        };
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
        return Component;
    }());
    es.Component = Component;
})(es || (es = {}));
var es;
(function (es) {
    var Core = (function () {
        function Core(width, height) {
            this._globalManagers = [];
            this._timerManager = new es.TimerManager();
            this._frameCounterElapsedTime = 0;
            this._frameCounter = 0;
            this.width = width;
            this.height = height;
            Core._instance = this;
            Core.emitter = new es.Emitter();
            Core.emitter.addObserver(es.CoreEvents.FrameUpdated, this.update, this);
            Core.registerGlobalManager(this._timerManager);
            this.initialize();
        }
        Object.defineProperty(Core, "Instance", {
            get: function () {
                return this._instance;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core, "scene", {
            get: function () {
                if (!this._instance)
                    return null;
                return this._instance._scene;
            },
            set: function (value) {
                if (!value) {
                    console.error("场景不能为空");
                    return;
                }
                if (this._instance._scene == null) {
                    this._instance._scene = value;
                    this._instance._scene.begin();
                    Core.Instance.onSceneChanged();
                }
                else {
                    this._instance._nextScene = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Core.startSceneTransition = function (sceneTransition) {
            if (this._instance._sceneTransition) {
                console.warn("在前一个场景完成之前，不能开始一个新的场景转换。");
                return;
            }
            this._instance._sceneTransition = sceneTransition;
            return sceneTransition;
        };
        Core.registerGlobalManager = function (manager) {
            this._instance._globalManagers.push(manager);
            manager.enabled = true;
        };
        Core.unregisterGlobalManager = function (manager) {
            this._instance._globalManagers.remove(manager);
            manager.enabled = false;
        };
        Core.getGlobalManager = function (type) {
            for (var i = 0; i < this._instance._globalManagers.length; i++) {
                if (this._instance._globalManagers[i] instanceof type)
                    return this._instance._globalManagers[i];
            }
            return null;
        };
        Core.schedule = function (timeInSeconds, repeats, context, onTime) {
            if (repeats === void 0) { repeats = false; }
            if (context === void 0) { context = null; }
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        };
        Core.prototype.onOrientationChanged = function () {
            Core.emitter.emit(es.CoreEvents.OrientationChanged);
        };
        Core.prototype.draw = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this._sceneTransition) return [3, 4];
                            this._sceneTransition.preRender();
                            if (!(this._scene && !this._sceneTransition.hasPreviousSceneRender)) return [3, 2];
                            this._scene.render();
                            this._scene.postRender();
                            return [4, this._sceneTransition.onBeginTransition()];
                        case 1:
                            _a.sent();
                            return [3, 3];
                        case 2:
                            if (this._sceneTransition) {
                                if (this._scene && this._sceneTransition.isNewSceneLoaded) {
                                    this._scene.render();
                                    this._scene.postRender();
                                }
                                this._sceneTransition.render();
                            }
                            _a.label = 3;
                        case 3: return [3, 5];
                        case 4:
                            if (this._scene) {
                                this._scene.render();
                                this._scene.postRender();
                            }
                            _a.label = 5;
                        case 5: return [2];
                    }
                });
            });
        };
        Core.prototype.onSceneChanged = function () {
            Core.emitter.emit(es.CoreEvents.SceneChanged);
            es.Time.sceneChanged();
        };
        Core.prototype.onGraphicsDeviceReset = function () {
            Core.emitter.emit(es.CoreEvents.GraphicsDeviceReset);
        };
        Core.prototype.initialize = function () {
        };
        Core.prototype.update = function () {
            return __awaiter(this, void 0, void 0, function () {
                var i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this._scene) return [3, 2];
                            for (i = this._globalManagers.length - 1; i >= 0; i--) {
                                if (this._globalManagers[i].enabled)
                                    this._globalManagers[i].update();
                            }
                            if (!this._sceneTransition ||
                                (this._sceneTransition && (!this._sceneTransition.loadsNewScene || this._sceneTransition.isNewSceneLoaded))) {
                                this._scene.update();
                            }
                            if (!this._nextScene) return [3, 2];
                            this._scene.end();
                            this._scene = this._nextScene;
                            this._nextScene = null;
                            this.onSceneChanged();
                            return [4, this._scene.begin()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [4, this.draw()];
                        case 3:
                            _a.sent();
                            return [2];
                    }
                });
            });
        };
        Core.debugRenderEndabled = false;
        return Core;
    }());
    es.Core = Core;
})(es || (es = {}));
var es;
(function (es) {
    var CoreEvents;
    (function (CoreEvents) {
        CoreEvents[CoreEvents["GraphicsDeviceReset"] = 0] = "GraphicsDeviceReset";
        CoreEvents[CoreEvents["SceneChanged"] = 1] = "SceneChanged";
        CoreEvents[CoreEvents["OrientationChanged"] = 2] = "OrientationChanged";
        CoreEvents[CoreEvents["FrameUpdated"] = 3] = "FrameUpdated";
    })(CoreEvents = es.CoreEvents || (es.CoreEvents = {}));
})(es || (es = {}));
var es;
(function (es) {
    var Entity = (function () {
        function Entity(name) {
            this.updateInterval = 1;
            this._tag = 0;
            this._enabled = true;
            this._updateOrder = 0;
            this.components = new es.ComponentList(this);
            this.transform = new es.Transform(this);
            this.name = name;
            this.id = Entity._idGenerator++;
            this.componentBits = new es.BitSet();
        }
        Object.defineProperty(Entity.prototype, "isDestroyed", {
            get: function () {
                return this._isDestroyed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "tag", {
            get: function () {
                return this._tag;
            },
            set: function (value) {
                this.setTag(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "updateOrder", {
            get: function () {
                return this._updateOrder;
            },
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
            this.components.onEntityTransformChanged(comp);
        };
        Entity.prototype.setTag = function (tag) {
            if (this._tag != tag) {
                if (this.scene)
                    this.scene.entities.removeFromTagList(this);
                this._tag = tag;
                if (this.scene)
                    this.scene.entities.addToTagList(this);
            }
            return this;
        };
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
        Entity.prototype.destroy = function () {
            this._isDestroyed = true;
            this.scene.entities.remove(this);
            this.transform.parent = null;
            for (var i = this.transform.childCount - 1; i >= 0; i--) {
                var child = this.transform.getChild(i);
                child.entity.destroy();
            }
        };
        Entity.prototype.detachFromScene = function () {
            this.scene.entities.remove(this);
            this.components.deregisterAllComponents();
            for (var i = 0; i < this.transform.childCount; i++)
                this.transform.getChild(i).entity.detachFromScene();
        };
        Entity.prototype.attachToScene = function (newScene) {
            this.scene = newScene;
            newScene.entities.add(this);
            this.components.registerAllComponents();
            for (var i = 0; i < this.transform.childCount; i++) {
                this.transform.getChild(i).entity.attachToScene(newScene);
            }
        };
        Entity.prototype.onAddedToScene = function () {
        };
        Entity.prototype.onRemovedFromScene = function () {
            if (this._isDestroyed)
                this.components.removeAllComponents();
        };
        Entity.prototype.update = function () {
            this.components.update();
        };
        Entity.prototype.addComponent = function (component) {
            component.entity = this;
            this.components.add(component);
            component.initialize();
            return component;
        };
        Entity.prototype.getComponent = function (type) {
            return this.components.getComponent(type, false);
        };
        Entity.prototype.hasComponent = function (type) {
            return this.components.getComponent(type, false) != null;
        };
        Entity.prototype.getOrCreateComponent = function (type) {
            var comp = this.components.getComponent(type, true);
            if (!comp) {
                comp = this.addComponent(type);
            }
            return comp;
        };
        Entity.prototype.getComponents = function (typeName, componentList) {
            return this.components.getComponents(typeName, componentList);
        };
        Entity.prototype.removeComponent = function (component) {
            this.components.remove(component);
        };
        Entity.prototype.removeComponentForType = function (type) {
            var comp = this.getComponent(type);
            if (comp) {
                this.removeComponent(comp);
                return true;
            }
            return false;
        };
        Entity.prototype.removeAllComponents = function () {
            for (var i = 0; i < this.components.count; i++) {
                this.removeComponent(this.components.buffer[i]);
            }
        };
        Entity.prototype.compareTo = function (other) {
            var compare = this._updateOrder - other._updateOrder;
            if (compare == 0)
                compare = this.id - other.id;
            return compare;
        };
        Entity.prototype.toString = function () {
            return "[Entity: name: " + this.name + ", tag: " + this.tag + ", enabled: " + this.enabled + ", depth: " + this.updateOrder + "]";
        };
        Entity._idGenerator = 0;
        return Entity;
    }());
    es.Entity = Entity;
})(es || (es = {}));
var es;
(function (es) {
    var Scene = (function () {
        function Scene() {
            this._sceneComponents = [];
            this._renderers = [];
            this.entities = new es.EntityList(this);
            this.renderableComponents = new es.RenderableComponentList();
            this.entityProcessors = new es.EntityProcessorList();
            this.initialize();
        }
        Scene.prototype.initialize = function () {
        };
        Scene.prototype.onStart = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2];
                });
            });
        };
        Scene.prototype.unload = function () {
        };
        Scene.prototype.onActive = function () {
        };
        Scene.prototype.onDeactive = function () {
        };
        Scene.prototype.begin = function () {
            es.Physics.reset();
            this.updateResolutionScaler();
            if (this.entityProcessors)
                this.entityProcessors.begin();
            es.Core.emitter.addObserver(es.CoreEvents.GraphicsDeviceReset, this.updateResolutionScaler, this);
            es.Core.emitter.addObserver(es.CoreEvents.OrientationChanged, this.updateResolutionScaler, this);
            this._didSceneBegin = true;
            this.onStart();
        };
        Scene.prototype.end = function () {
            this._didSceneBegin = false;
            es.Core.emitter.removeObserver(es.CoreEvents.GraphicsDeviceReset, this.updateResolutionScaler);
            es.Core.emitter.removeObserver(es.CoreEvents.OrientationChanged, this.updateResolutionScaler);
            for (var i = 0; i < this._renderers.length; i++) {
                this._renderers[i].unload();
            }
            this.entities.removeAllEntities();
            for (var i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;
            if (this.entityProcessors)
                this.entityProcessors.end();
            this.unload();
        };
        Scene.prototype.updateResolutionScaler = function () {
        };
        Scene.prototype.update = function () {
            this.entities.updateLists();
            for (var i = this._sceneComponents.length - 1; i >= 0; i--) {
                if (this._sceneComponents[i].enabled)
                    this._sceneComponents[i].update();
            }
            if (this.entityProcessors)
                this.entityProcessors.update();
            this.entities.update();
            if (this.entityProcessors)
                this.entityProcessors.lateUpdate();
            this.renderableComponents.updateList();
        };
        Scene.prototype.render = function () {
            for (var i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        };
        Scene.prototype.postRender = function () {
        };
        Scene.prototype.addSceneComponent = function (component) {
            component.scene = this;
            component.onEnabled();
            this._sceneComponents.push(component);
            this._sceneComponents.sort(component.compareTo);
            return component;
        };
        Scene.prototype.getSceneComponent = function (type) {
            for (var i = 0; i < this._sceneComponents.length; i++) {
                var component = this._sceneComponents[i];
                if (component instanceof type)
                    return component;
            }
            return null;
        };
        Scene.prototype.getOrCreateSceneComponent = function (type) {
            var comp = this.getSceneComponent(type);
            if (comp == null)
                comp = this.addSceneComponent(new type());
            return comp;
        };
        Scene.prototype.removeSceneComponent = function (component) {
            if (!this._sceneComponents.contains(component)) {
                console.warn("SceneComponent" + component + "\u4E0D\u5728SceneComponents\u5217\u8868\u4E2D!");
                return;
            }
            this._sceneComponents.remove(component);
            component.onRemovedFromScene();
        };
        Scene.prototype.addRenderer = function (renderer) {
            this._renderers.push(renderer);
            this._renderers.sort();
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
            if (!this._renderers.contains(renderer))
                return;
            this._renderers.remove(renderer);
            renderer.unload();
        };
        Scene.prototype.createEntity = function (name) {
            var entity = new es.Entity(name);
            return this.addEntity(entity);
        };
        Scene.prototype.addEntity = function (entity) {
            if (this.entities.buffer.contains(entity))
                console.warn("\u60A8\u8BD5\u56FE\u5C06\u540C\u4E00\u5B9E\u4F53\u6DFB\u52A0\u5230\u573A\u666F\u4E24\u6B21: " + entity);
            this.entities.add(entity);
            entity.scene = this;
            for (var i = 0; i < entity.transform.childCount; i++)
                this.addEntity(entity.transform.getChild(i).entity);
            return entity;
        };
        Scene.prototype.destroyAllEntities = function () {
            for (var i = 0; i < this.entities.count; i++) {
                this.entities.buffer[i].destroy();
            }
        };
        Scene.prototype.findEntity = function (name) {
            return this.entities.findEntity(name);
        };
        Scene.prototype.findEntitiesWithTag = function (tag) {
            return this.entities.entitiesWithTag(tag);
        };
        Scene.prototype.entitiesOfType = function (type) {
            return this.entities.entitiesOfType(type);
        };
        Scene.prototype.findComponentOfType = function (type) {
            return this.entities.findComponentOfType(type);
        };
        Scene.prototype.findComponentsOfType = function (type) {
            return this.entities.findComponentsOfType(type);
        };
        Scene.prototype.addEntityProcessor = function (processor) {
            processor.scene = this;
            this.entityProcessors.add(processor);
            return processor;
        };
        Scene.prototype.removeEntityProcessor = function (processor) {
            this.entityProcessors.remove(processor);
        };
        Scene.prototype.getEntityProcessor = function () {
            return this.entityProcessors.getProcessor();
        };
        return Scene;
    }());
    es.Scene = Scene;
})(es || (es = {}));
var transform;
(function (transform) {
    var Component;
    (function (Component) {
        Component[Component["position"] = 0] = "position";
        Component[Component["scale"] = 1] = "scale";
        Component[Component["rotation"] = 2] = "rotation";
    })(Component = transform.Component || (transform.Component = {}));
})(transform || (transform = {}));
var es;
(function (es) {
    var DirtyType;
    (function (DirtyType) {
        DirtyType[DirtyType["clean"] = 0] = "clean";
        DirtyType[DirtyType["positionDirty"] = 1] = "positionDirty";
        DirtyType[DirtyType["scaleDirty"] = 2] = "scaleDirty";
        DirtyType[DirtyType["rotationDirty"] = 3] = "rotationDirty";
    })(DirtyType = es.DirtyType || (es.DirtyType = {}));
    var Transform = (function () {
        function Transform(entity) {
            this._localTransform = es.Matrix2D.identity;
            this._worldTransform = es.Matrix2D.identity;
            this._rotationMatrix = es.Matrix2D.identity;
            this._translationMatrix = es.Matrix2D.identity;
            this._scaleMatrix = es.Matrix2D.identity;
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
            this._children = [];
        }
        Object.defineProperty(Transform.prototype, "childCount", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "rotationDegrees", {
            get: function () {
                return es.MathHelper.toDegrees(this._rotation);
            },
            set: function (value) {
                this.setRotation(es.MathHelper.toRadians(value));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localRotationDegrees", {
            get: function () {
                return es.MathHelper.toDegrees(this._localRotation);
            },
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
            get: function () {
                return this._parent;
            },
            set: function (value) {
                this.setParent(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "worldToLocalTransform", {
            get: function () {
                if (this._worldToLocalDirty) {
                    if (!this.parent) {
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
            get: function () {
                this.updateTransform();
                if (this._positionDirty) {
                    if (!this.parent) {
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
            set: function (value) {
                this.setPosition(value.x, value.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "scale", {
            get: function () {
                this.updateTransform();
                return this._scale;
            },
            set: function (value) {
                this.setScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "rotation", {
            get: function () {
                this.updateTransform();
                return this._rotation;
            },
            set: function (value) {
                this.setRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localPosition", {
            get: function () {
                this.updateTransform();
                return this._localPosition;
            },
            set: function (value) {
                this.setLocalPosition(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localScale", {
            get: function () {
                this.updateTransform();
                return this._localScale;
            },
            set: function (value) {
                this.setLocalScale(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "localRotation", {
            get: function () {
                this.updateTransform();
                return this._localRotation;
            },
            set: function (value) {
                this.setLocalRotation(value);
            },
            enumerable: true,
            configurable: true
        });
        Transform.prototype.getChild = function (index) {
            return this._children[index];
        };
        Transform.prototype.setParent = function (parent) {
            if (this._parent == parent)
                return this;
            if (!this._parent) {
                this._parent._children.remove(this);
                this._parent._children.push(this);
            }
            this._parent = parent;
            this.setDirty(DirtyType.positionDirty);
            return this;
        };
        Transform.prototype.setPosition = function (x, y) {
            var position = new es.Vector2(x, y);
            if (position.equals(this._position))
                return this;
            this._position = position;
            if (this.parent) {
                this.localPosition = es.Vector2.transform(this._position, this._worldToLocalTransform);
            }
            else {
                this.localPosition = position;
            }
            this._positionDirty = false;
            return this;
        };
        Transform.prototype.setLocalPosition = function (localPosition) {
            if (localPosition.equals(this._localPosition))
                return this;
            this._localPosition = localPosition;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.positionDirty);
            return this;
        };
        Transform.prototype.setRotation = function (radians) {
            this._rotation = radians;
            if (this.parent) {
                this.localRotation = this.parent.rotation + radians;
            }
            else {
                this.localRotation = radians;
            }
            return this;
        };
        Transform.prototype.setRotationDegrees = function (degrees) {
            return this.setRotation(es.MathHelper.toRadians(degrees));
        };
        Transform.prototype.lookAt = function (pos) {
            var sign = this.position.x > pos.x ? -1 : 1;
            var vectorToAlignTo = es.Vector2.normalize(es.Vector2.subtract(this.position, pos));
            this.rotation = sign * Math.acos(es.Vector2.dot(vectorToAlignTo, es.Vector2.unitY));
        };
        Transform.prototype.setLocalRotation = function (radians) {
            this._localRotation = radians;
            this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.rotationDirty);
            return this;
        };
        Transform.prototype.setLocalRotationDegrees = function (degrees) {
            return this.setLocalRotation(es.MathHelper.toRadians(degrees));
        };
        Transform.prototype.setScale = function (scale) {
            this._scale = scale;
            if (this.parent) {
                this.localScale = es.Vector2.divide(scale, this.parent._scale);
            }
            else {
                this.localScale = scale;
            }
            return this;
        };
        Transform.prototype.setLocalScale = function (scale) {
            this._localScale = scale;
            this._localDirty = this._positionDirty = this._localScaleDirty = true;
            this.setDirty(DirtyType.scaleDirty);
            return this;
        };
        Transform.prototype.roundPosition = function () {
            this.position = this._position.round();
        };
        Transform.prototype.updateTransform = function () {
            if (this.hierarchyDirty != DirtyType.clean) {
                if (this.parent)
                    this.parent.updateTransform();
                if (this._localDirty) {
                    if (this._localPositionDirty) {
                        this._translationMatrix = es.Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y);
                        this._localPositionDirty = false;
                    }
                    if (this._localRotationDirty) {
                        this._rotationMatrix = es.Matrix2D.createRotation(this._localRotation);
                        this._localRotationDirty = false;
                    }
                    if (this._localScaleDirty) {
                        this._scaleMatrix = es.Matrix2D.createScale(this._localScale.x, this._localScale.y);
                        this._localScaleDirty = false;
                    }
                    this._localTransform = this._scaleMatrix.multiply(this._rotationMatrix);
                    this._localTransform = this._localTransform.multiply(this._translationMatrix);
                    if (!this.parent) {
                        this._worldTransform = this._localTransform;
                        this._rotation = this._localRotation;
                        this._scale = this._localScale;
                        this._worldInverseDirty = true;
                    }
                    this._localDirty = false;
                }
                if (this.parent) {
                    this._worldTransform = this._localTransform.multiply(this.parent._worldTransform);
                    this._rotation = this._localRotation + this.parent._rotation;
                    this._scale = es.Vector2.multiply(this.parent._scale, this._localScale);
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
                    case es.DirtyType.positionDirty:
                        this.entity.onTransformChanged(transform.Component.position);
                        break;
                    case es.DirtyType.rotationDirty:
                        this.entity.onTransformChanged(transform.Component.rotation);
                        break;
                    case es.DirtyType.scaleDirty:
                        this.entity.onTransformChanged(transform.Component.scale);
                        break;
                }
                if (!this._children)
                    this._children = [];
                for (var i = 0; i < this._children.length; i++)
                    this._children[i].setDirty(dirtyFlagType);
            }
        };
        Transform.prototype.copyFrom = function (transform) {
            this._position = transform.position;
            this._localPosition = transform._localPosition;
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
    var ComponentPool = (function () {
        function ComponentPool(typeClass) {
            this._type = typeClass;
            this._cache = [];
        }
        ComponentPool.prototype.obtain = function () {
            try {
                return this._cache.length > 0 ? this._cache.shift() : new this._type();
            }
            catch (err) {
                throw new Error(this._type + err);
            }
        };
        ComponentPool.prototype.free = function (component) {
            component.reset();
            this._cache.push(component);
        };
        return ComponentPool;
    }());
    es.ComponentPool = ComponentPool;
})(es || (es = {}));
var es;
(function (es) {
    var IUpdatableComparer = (function () {
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
    var PooledComponent = (function (_super) {
        __extends(PooledComponent, _super);
        function PooledComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return PooledComponent;
    }(es.Component));
    es.PooledComponent = PooledComponent;
})(es || (es = {}));
var es;
(function (es) {
    var SceneComponent = (function () {
        function SceneComponent() {
            this.updateOrder = 0;
            this._enabled = true;
        }
        Object.defineProperty(SceneComponent.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        SceneComponent.prototype.onEnabled = function () {
        };
        SceneComponent.prototype.onDisabled = function () {
        };
        SceneComponent.prototype.onRemovedFromScene = function () {
        };
        SceneComponent.prototype.update = function () {
        };
        SceneComponent.prototype.setEnabled = function (isEnabled) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;
                if (this._enabled) {
                }
                else {
                }
            }
            return this;
        };
        SceneComponent.prototype.setUpdateOrder = function (updateOrder) {
            if (this.updateOrder != updateOrder) {
                this.updateOrder = updateOrder;
                es.Core.scene._sceneComponents.sort(this.compareTo);
            }
            return this;
        };
        SceneComponent.prototype.compareTo = function (other) {
            return this.updateOrder - other.updateOrder;
        };
        return SceneComponent;
    }());
    es.SceneComponent = SceneComponent;
})(es || (es = {}));
var es;
(function (es) {
    var Mover = (function (_super) {
        __extends(Mover, _super);
        function Mover() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Mover.prototype.onAddedToEntity = function () {
            this._triggerHelper = new es.ColliderTriggerHelper(this.entity);
        };
        Mover.prototype.calculateMovement = function (motion, collisionResult) {
            if (!this.entity.getComponent(es.Collider) || !this._triggerHelper) {
                return false;
            }
            var colliders = this.entity.getComponents(es.Collider);
            for (var i = 0; i < colliders.length; i++) {
                var collider = colliders[i];
                if (collider.isTrigger)
                    continue;
                var bounds = collider.bounds;
                bounds.x += motion.x;
                bounds.y += motion.y;
                var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers.value);
                for (var j = 0; j < neighbors.length; j++) {
                    var neighbor = neighbors[j];
                    if (neighbor.isTrigger)
                        continue;
                    var _internalcollisionResult = new es.CollisionResult();
                    if (collider.collidesWith(neighbor, motion, _internalcollisionResult)) {
                        motion = motion.subtract(_internalcollisionResult.minimumTranslationVector);
                        if (_internalcollisionResult.collider != null) {
                            collisionResult = _internalcollisionResult;
                        }
                    }
                }
            }
            es.ListPool.free(colliders);
            return collisionResult.collider != null;
        };
        Mover.prototype.applyMovement = function (motion) {
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            if (this._triggerHelper)
                this._triggerHelper.update();
        };
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
    var ProjectileMover = (function (_super) {
        __extends(ProjectileMover, _super);
        function ProjectileMover() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._tempTriggerList = [];
            return _this;
        }
        ProjectileMover.prototype.onAddedToEntity = function () {
            this._collider = this.entity.getComponent(es.Collider);
            if (!this._collider)
                console.warn("ProjectileMover has no Collider. ProjectilMover requires a Collider!");
        };
        ProjectileMover.prototype.move = function (motion) {
            if (!this._collider)
                return false;
            var didCollide = false;
            this.entity.position.add(motion);
            var neighbors = es.Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers.value);
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var neighbor = neighbors_1[_i];
                if (this._collider.overlaps(neighbor) && neighbor.enabled) {
                    didCollide = true;
                    this.notifyTriggerListeners(this._collider, neighbor);
                }
            }
            return didCollide;
        };
        ProjectileMover.prototype.notifyTriggerListeners = function (self, other) {
            other.entity.getComponents("ITriggerListener", this._tempTriggerList);
            for (var i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(self, other);
            }
            this._tempTriggerList.length = 0;
            this.entity.getComponents("ITriggerListener", this._tempTriggerList);
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
    var Collider = (function (_super) {
        __extends(Collider, _super);
        function Collider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.physicsLayer = new es.Ref(1 << 0);
            _this.collidesWithLayers = new es.Ref(es.Physics.allLayers);
            _this.shouldColliderScaleAndRotateWithTransform = true;
            _this.registeredPhysicsBounds = new es.Rectangle();
            _this._isPositionDirty = true;
            _this._isRotationDirty = true;
            _this._localOffset = es.Vector2.zero;
            return _this;
        }
        Object.defineProperty(Collider.prototype, "absolutePosition", {
            get: function () {
                return es.Vector2.add(this.entity.transform.position, this._localOffset);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Collider.prototype, "rotation", {
            get: function () {
                if (this.shouldColliderScaleAndRotateWithTransform && this.entity)
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
            get: function () {
                return this._localOffset;
            },
            set: function (value) {
                this.setLocalOffset(value);
            },
            enumerable: true,
            configurable: true
        });
        Collider.prototype.setLocalOffset = function (offset) {
            if (this._localOffset != offset) {
                this.unregisterColliderWithPhysicsSystem();
                this._localOffset = offset;
                this._localOffsetLength = this._localOffset.length();
                this._isPositionDirty = true;
                this.registerColliderWithPhysicsSystem();
            }
            return this;
        };
        Collider.prototype.setShouldColliderScaleAndRotateWithTransform = function (shouldColliderScaleAndRotationWithTransform) {
            this.shouldColliderScaleAndRotateWithTransform = shouldColliderScaleAndRotationWithTransform;
            this._isPositionDirty = this._isRotationDirty = true;
            return this;
        };
        Collider.prototype.onAddedToEntity = function () {
            this._isParentEntityAddedToScene = true;
            this.registerColliderWithPhysicsSystem();
        };
        Collider.prototype.onRemovedFromEntity = function () {
            this.unregisterColliderWithPhysicsSystem();
            this._isParentEntityAddedToScene = false;
        };
        Collider.prototype.onEntityTransformChanged = function (comp) {
            switch (comp) {
                case transform.Component.position:
                    this._isPositionDirty = true;
                    break;
                case transform.Component.scale:
                    this._isPositionDirty = true;
                    break;
                case transform.Component.rotation:
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
        Collider.prototype.registerColliderWithPhysicsSystem = function () {
            if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
                es.Physics.addCollider(this);
                this._isColliderRegistered = true;
            }
        };
        Collider.prototype.unregisterColliderWithPhysicsSystem = function () {
            if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
                es.Physics.removeCollider(this);
            }
            this._isColliderRegistered = false;
        };
        Collider.prototype.overlaps = function (other) {
            return this.shape.overlaps(other.shape);
        };
        Collider.prototype.collidesWith = function (collider, motion, result) {
            var oldPosition = this.entity.position;
            this.entity.position.add(motion);
            var didCollide = this.shape.collidesWithShape(collider.shape, result);
            if (didCollide)
                result.collider = collider;
            this.entity.position = oldPosition;
            return didCollide;
        };
        return Collider;
    }(es.Component));
    es.Collider = Collider;
})(es || (es = {}));
var es;
(function (es) {
    var BoxCollider = (function (_super) {
        __extends(BoxCollider, _super);
        function BoxCollider(x, y, width, height) {
            var _this = _super.call(this) || this;
            _this._localOffset = new es.Vector2(x + width / 2, y + height / 2);
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
        BoxCollider.prototype.setSize = function (width, height) {
            var box = this.shape;
            if (width != box.width || height != box.height) {
                box.updateBox(width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        BoxCollider.prototype.setWidth = function (width) {
            var box = this.shape;
            if (width != box.width) {
                box.updateBox(width, box.height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        BoxCollider.prototype.setHeight = function (height) {
            var box = this.shape;
            if (height != box.height) {
                box.updateBox(box.width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
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
    var CircleCollider = (function (_super) {
        __extends(CircleCollider, _super);
        function CircleCollider(radius) {
            var _this = _super.call(this) || this;
            _this.shape = new es.Circle(radius);
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
        CircleCollider.prototype.setRadius = function (radius) {
            var circle = this.shape;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
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
    var PolygonCollider = (function (_super) {
        __extends(PolygonCollider, _super);
        function PolygonCollider(points) {
            var _this = _super.call(this) || this;
            var isPolygonClosed = points[0] == points[points.length - 1];
            if (isPolygonClosed)
                points.splice(points.length - 1, 1);
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
    var EntitySystem = (function () {
        function EntitySystem(matcher) {
            this._entities = [];
            this._matcher = matcher ? matcher : es.Matcher.empty();
        }
        Object.defineProperty(EntitySystem.prototype, "scene", {
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
        EntitySystem.prototype.initialize = function () {
        };
        EntitySystem.prototype.onChanged = function (entity) {
            var contains = this._entities.contains(entity);
            var interest = this._matcher.isInterestedEntity(entity);
            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        };
        EntitySystem.prototype.add = function (entity) {
            this._entities.push(entity);
            this.onAdded(entity);
        };
        EntitySystem.prototype.onAdded = function (entity) {
        };
        EntitySystem.prototype.remove = function (entity) {
            this._entities.remove(entity);
            this.onRemoved(entity);
        };
        EntitySystem.prototype.onRemoved = function (entity) {
        };
        EntitySystem.prototype.update = function () {
            this.begin();
            this.process(this._entities);
        };
        EntitySystem.prototype.lateUpdate = function () {
            this.lateProcess(this._entities);
            this.end();
        };
        EntitySystem.prototype.begin = function () {
        };
        EntitySystem.prototype.process = function (entities) {
        };
        EntitySystem.prototype.lateProcess = function (entities) {
        };
        EntitySystem.prototype.end = function () {
        };
        return EntitySystem;
    }());
    es.EntitySystem = EntitySystem;
})(es || (es = {}));
var es;
(function (es) {
    var EntityProcessingSystem = (function (_super) {
        __extends(EntityProcessingSystem, _super);
        function EntityProcessingSystem(matcher) {
            return _super.call(this, matcher) || this;
        }
        EntityProcessingSystem.prototype.lateProcessEntity = function (entity) {
        };
        EntityProcessingSystem.prototype.process = function (entities) {
            var _this = this;
            entities.forEach(function (entity) { return _this.processEntity(entity); });
        };
        EntityProcessingSystem.prototype.lateProcess = function (entities) {
            var _this = this;
            entities.forEach(function (entity) { return _this.lateProcessEntity(entity); });
        };
        return EntityProcessingSystem;
    }(es.EntitySystem));
    es.EntityProcessingSystem = EntityProcessingSystem;
})(es || (es = {}));
var es;
(function (es) {
    var PassiveSystem = (function (_super) {
        __extends(PassiveSystem, _super);
        function PassiveSystem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PassiveSystem.prototype.onChanged = function (entity) {
        };
        PassiveSystem.prototype.process = function (entities) {
            this.begin();
            this.end();
        };
        return PassiveSystem;
    }(es.EntitySystem));
    es.PassiveSystem = PassiveSystem;
})(es || (es = {}));
var es;
(function (es) {
    var ProcessingSystem = (function (_super) {
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
    var BitSet = (function () {
        function BitSet(nbits) {
            if (nbits === void 0) { nbits = 64; }
            var length = nbits >> 6 >>> 0;
            if ((nbits & BitSet.LONG_MASK) != 0)
                length++;
            this._bits = new Array(length);
            this._bits.fill(0);
        }
        BitSet.prototype.and = function (bs) {
            var max = Math.min(this._bits.length, bs._bits.length);
            var i;
            for (var i_1 = 0; i_1 < max; ++i_1)
                this._bits[i_1] &= bs._bits[i_1];
            while (i < this._bits.length)
                this._bits[i++] = 0;
        };
        BitSet.prototype.andNot = function (bs) {
            var i = Math.min(this._bits.length, bs._bits.length);
            while (--i >= 0)
                this._bits[i] &= ~bs._bits[i];
        };
        BitSet.prototype.cardinality = function () {
            var card = 0 >>> 0;
            for (var i = this._bits.length - 1; i >= 0; i--) {
                var a = this._bits[i];
                if (a == 0)
                    continue;
                if (a == -1) {
                    card += 64;
                    continue;
                }
                a = ((a >> 1) & 0x5555555555555555) + (a & 0x5555555555555555);
                a = ((a >> 2) & 0x3333333333333333) + (a & 0x3333333333333333);
                var b = ((a >> 32) + a) >>> 0;
                b = ((b >> 4) & 0x0f0f0f0f) + (b & 0x0f0f0f0f);
                b = ((b >> 8) & 0x00ff00ff) + (b & 0x00ff00ff);
                card += ((b >> 16) & 0x0000ffff) + (b & 0x0000ffff);
            }
            return card;
        };
        BitSet.prototype.clear = function (pos) {
            if (pos != undefined) {
                var offset = pos >> 6;
                this.ensure(offset);
                this._bits[offset] &= ~(1 << pos);
            }
            else {
                for (var i = 0; i < this._bits.length; i++)
                    this._bits[i] = 0;
            }
        };
        BitSet.prototype.get = function (pos) {
            var offset = pos >> 6;
            if (offset >= this._bits.length)
                return false;
            return (this._bits[offset] & (1 << pos)) != 0;
        };
        BitSet.prototype.intersects = function (set) {
            var i = Math.min(this._bits.length, set._bits.length);
            while (--i >= 0) {
                if ((this._bits[i] & set._bits[i]) != 0)
                    return true;
            }
            return false;
        };
        BitSet.prototype.isEmpty = function () {
            for (var i = this._bits.length - 1; i >= 0; i--) {
                if (this._bits[i])
                    return false;
            }
            return true;
        };
        BitSet.prototype.nextSetBit = function (from) {
            var offset = from >> 6;
            var mask = 1 << from;
            while (offset < this._bits.length) {
                var h = this._bits[offset];
                do {
                    if ((h & mask) != 0)
                        return from;
                    mask <<= 1;
                    from++;
                } while (mask != 0);
                mask = 1;
                offset++;
            }
            return -1;
        };
        BitSet.prototype.set = function (pos, value) {
            if (value === void 0) { value = true; }
            if (value) {
                var offset = pos >> 6;
                this.ensure(offset);
                this._bits[offset] |= 1 << pos;
            }
            else {
                this.clear(pos);
            }
        };
        BitSet.prototype.ensure = function (lastElt) {
            if (lastElt >= this._bits.length) {
                var startIndex = this._bits.length;
                this._bits.length = lastElt + 1;
                this._bits.fill(0, startIndex, lastElt + 1);
            }
        };
        BitSet.LONG_MASK = 0x3f;
        return BitSet;
    }());
    es.BitSet = BitSet;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentList = (function () {
        function ComponentList(entity) {
            this._components = new es.FastList();
            this._updatableComponents = new es.FastList();
            this._componentsToAdd = [];
            this._componentsToRemove = [];
            this._tempBufferList = [];
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
                return this._components.buffer;
            },
            enumerable: true,
            configurable: true
        });
        ComponentList.prototype.markEntityListUnsorted = function () {
            this._isComponentListUnsorted = true;
        };
        ComponentList.prototype.add = function (component) {
            this._componentsToAdd.push(component);
        };
        ComponentList.prototype.remove = function (component) {
            if (this._componentsToRemove.contains(component))
                console.warn("\u60A8\u6B63\u5728\u5C1D\u8BD5\u5220\u9664\u4E00\u4E2A\u60A8\u5DF2\u7ECF\u5220\u9664\u7684\u7EC4\u4EF6(" + component + ")");
            if (this._componentsToAdd.contains(component)) {
                this._componentsToAdd.remove(component);
                return;
            }
            this._componentsToRemove.push(component);
        };
        ComponentList.prototype.removeAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                this.handleRemove(this._components[i]);
            }
            this._components.clear();
            this._updatableComponents.clear();
            this._componentsToAdd.length = 0;
            this._componentsToRemove.length = 0;
        };
        ComponentList.prototype.deregisterAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (!component)
                    continue;
                if (es.isIUpdatable(component))
                    this._updatableComponents.remove(component);
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component["__proto__"]["constructor"]), false);
                this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            }
        };
        ComponentList.prototype.registerAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (es.isIUpdatable(component))
                    this._updatableComponents.add(component);
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component["__proto__"]["constructor"]));
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);
            }
        };
        ComponentList.prototype.updateLists = function () {
            if (this._componentsToRemove.length > 0) {
                for (var i = 0; i < this._componentsToRemove.length; i++) {
                    this.handleRemove(this._componentsToRemove[i]);
                    this._components.remove(this._componentsToRemove[i]);
                }
                this._componentsToRemove.length = 0;
            }
            if (this._componentsToAdd.length > 0) {
                for (var i = 0, count = this._componentsToAdd.length; i < count; i++) {
                    var component = this._componentsToAdd[i];
                    if (es.isIUpdatable(component))
                        this._updatableComponents.add(component);
                    this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component["__proto__"]["constructor"]));
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                    this._components.add(component);
                    this._tempBufferList.push(component);
                }
                this._componentsToAdd.length = 0;
                this._isComponentListUnsorted = true;
                for (var i = 0; i < this._tempBufferList.length; i++) {
                    var component = this._tempBufferList[i];
                    component.onAddedToEntity();
                    if (component.enabled) {
                        component.onEnabled();
                    }
                }
                this._tempBufferList.length = 0;
            }
            if (this._isComponentListUnsorted) {
                this._updatableComponents.sort(ComponentList.compareUpdatableOrder);
                this._isComponentListUnsorted = false;
            }
        };
        ComponentList.prototype.handleRemove = function (component) {
            if (!component)
                return;
            if (es.isIUpdatable(component))
                this._updatableComponents.remove(component);
            this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component["__proto__"]["constructor"]), false);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            component.onRemovedFromEntity();
            component.entity = null;
        };
        ComponentList.prototype.getComponent = function (type, onlyReturnInitializedComponents) {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (component instanceof type)
                    return component;
            }
            if (!onlyReturnInitializedComponents) {
                for (var i = 0; i < this._componentsToAdd.length; i++) {
                    var component = this._componentsToAdd[i];
                    if (component instanceof type)
                        return component;
                }
            }
            return null;
        };
        ComponentList.prototype.getComponents = function (typeName, components) {
            if (!components)
                components = [];
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (component instanceof typeName) {
                    components.push(component);
                }
            }
            for (var i = 0; i < this._componentsToAdd.length; i++) {
                var component = this._componentsToAdd[i];
                if (component instanceof typeName) {
                    components.push(component);
                }
            }
            return components;
        };
        ComponentList.prototype.update = function () {
            this.updateLists();
            for (var i = 0; i < this._updatableComponents.length; i++) {
                if (this._updatableComponents.buffer[i].enabled)
                    this._updatableComponents.buffer[i].update();
            }
        };
        ComponentList.prototype.onEntityTransformChanged = function (comp) {
            for (var i = 0; i < this._components.length; i++) {
                if (this._components.buffer[i].enabled)
                    this._components.buffer[i].onEntityTransformChanged(comp);
            }
            for (var i = 0; i < this._componentsToAdd.length; i++) {
                if (this._componentsToAdd[i].enabled)
                    this._componentsToAdd[i].onEntityTransformChanged(comp);
            }
        };
        ComponentList.prototype.onEntityEnabled = function () {
            for (var i = 0; i < this._components.length; i++)
                this._components.buffer[i].onEnabled();
        };
        ComponentList.prototype.onEntityDisabled = function () {
            for (var i = 0; i < this._components.length; i++)
                this._components.buffer[i].onDisabled();
        };
        ComponentList.compareUpdatableOrder = new es.IUpdatableComparer();
        return ComponentList;
    }());
    es.ComponentList = ComponentList;
})(es || (es = {}));
var es;
(function (es) {
    var ComponentTypeManager = (function () {
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
    var EntityList = (function () {
        function EntityList(scene) {
            this._entities = [];
            this._entitiesToAdded = [];
            this._entitiesToRemove = [];
            this._entityDict = new Map();
            this._unsortedTags = new Set();
            this._addToSceneEntityList = [];
            this.frameAllocate = false;
            this.maxAllocate = 10;
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
        EntityList.prototype.add = function (entity) {
            if (this._entitiesToAdded.indexOf(entity) == -1)
                this._entitiesToAdded.push(entity);
        };
        EntityList.prototype.remove = function (entity) {
            if (!this._entitiesToRemove.contains(entity)) {
                console.warn("\u60A8\u6B63\u5728\u5C1D\u8BD5\u5220\u9664\u5DF2\u7ECF\u5220\u9664\u7684\u5B9E\u4F53(" + entity.name + ")");
                return;
            }
            if (this._entitiesToAdded.contains(entity)) {
                this._entitiesToAdded.remove(entity);
                return;
            }
            if (!this._entitiesToRemove.contains(entity))
                this._entitiesToRemove.push(entity);
        };
        EntityList.prototype.removeAllEntities = function () {
            this._unsortedTags.clear();
            this._entitiesToAdded.length = 0;
            this._isEntityListUnsorted = false;
            this.updateLists();
            for (var i = 0; i < this._entities.length; i++) {
                this._entities[i]._isDestroyed = true;
                this._entities[i].onRemovedFromScene();
                this._entities[i].scene = null;
            }
            this._entities.length = 0;
            this._entityDict.clear();
        };
        EntityList.prototype.contains = function (entity) {
            return this._entities.findIndex(function (e) { return e.id == entity.id; }) != -1 ||
                this._entitiesToAdded.findIndex(function (e) { return e.id == entity.id; }) != -1;
        };
        EntityList.prototype.getTagList = function (tag) {
            var list = this._entityDict.get(tag);
            if (!list) {
                list = [];
                this._entityDict.set(tag, list);
            }
            return list;
        };
        EntityList.prototype.addToTagList = function (entity) {
            var list = this.getTagList(entity.tag);
            if (list.findIndex(function (e) { return e.id == entity.id; }) == -1) {
                list.push(entity);
                this._unsortedTags.add(entity.tag);
            }
        };
        EntityList.prototype.removeFromTagList = function (entity) {
            var list = this._entityDict.get(entity.tag);
            if (list) {
                list.remove(entity);
            }
        };
        EntityList.prototype.update = function () {
            for (var i = 0; i < this._entities.length; i++) {
                var entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval == 1 || es.Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        };
        EntityList.prototype.updateLists = function () {
            var _this = this;
            if (this._entitiesToRemove.length > 0) {
                for (var _i = 0, _a = this._entitiesToRemove; _i < _a.length; _i++) {
                    var entity = _a[_i];
                    this.removeFromTagList(entity);
                    this._entities.remove(entity);
                    entity.onRemovedFromScene();
                    entity.scene = null;
                    this.scene.entityProcessors.onEntityRemoved(entity);
                }
                this._entitiesToRemove.length = 0;
            }
            while (this._addToSceneEntityList.length > 0) {
                var entity = this._addToSceneEntityList.shift();
                entity.onAddedToScene();
            }
            if (this._entitiesToAdded.length > 0) {
                if (this.frameAllocate && this._entitiesToAdded.length > this.maxAllocate) {
                    for (var i = 0; i < this.maxAllocate; i++) {
                        this.perEntityAddToScene();
                    }
                    if (this._entitiesToAdded.length == 0)
                        this._isEntityListUnsorted = true;
                }
                else {
                    while (this._entitiesToAdded.length > 0) {
                        this.perEntityAddToScene();
                    }
                    this._isEntityListUnsorted = true;
                }
            }
            if (this._isEntityListUnsorted) {
                this._entities.sort(function (a, b) {
                    return a.compareTo(b);
                });
                this._isEntityListUnsorted = false;
            }
            if (this._addToSceneEntityList.length == 0 && this._unsortedTags.size > 0) {
                this._unsortedTags.forEach(function (tag) {
                    _this._entityDict.get(tag).sort(function (a, b) {
                        return a.compareTo(b);
                    });
                });
                this._unsortedTags.clear();
            }
        };
        EntityList.prototype.perEntityAddToScene = function () {
            var entity = this._entitiesToAdded.shift();
            this._addToSceneEntityList.push(entity);
            if (this._entities.findIndex(function (e) { return e.id == entity.id; }) == -1) {
                this._entities.push(entity);
                entity.scene = this.scene;
                this.addToTagList(entity);
                this.scene.entityProcessors.onEntityAdded(entity);
            }
        };
        EntityList.prototype.findEntity = function (name) {
            for (var i = 0; i < this._entities.length; i++) {
                if (this._entities[i].name == name)
                    return this._entities[i];
            }
            return this._entitiesToAdded.firstOrDefault(function (entity) { return entity.name == name; });
        };
        EntityList.prototype.entitiesWithTag = function (tag) {
            var list = this.getTagList(tag);
            var returnList = es.ListPool.obtain();
            returnList.length = this._entities.length;
            for (var i = 0; i < list.length; i++)
                returnList.push(list[i]);
            return returnList;
        };
        EntityList.prototype.entitiesOfType = function (type) {
            var list = es.ListPool.obtain();
            for (var i = 0; i < this._entities.length; i++) {
                if (this._entities[i] instanceof type)
                    list.push(this._entities[i]);
            }
            for (var _i = 0, _a = this._entitiesToAdded; _i < _a.length; _i++) {
                var entity = _a[_i];
                if (entity instanceof type)
                    list.push(entity);
            }
            return list;
        };
        EntityList.prototype.findComponentOfType = function (type) {
            for (var i = 0; i < this._entities.length; i++) {
                if (this._entities[i].enabled) {
                    var comp = this._entities[i].getComponent(type);
                    if (comp)
                        return comp;
                }
            }
            for (var i = 0; i < this._entitiesToAdded.length; i++) {
                var entity = this._entitiesToAdded[i];
                if (entity.enabled) {
                    var comp = entity.getComponent(type);
                    if (comp)
                        return comp;
                }
            }
            return null;
        };
        EntityList.prototype.findComponentsOfType = function (type) {
            var comps = es.ListPool.obtain();
            for (var i = 0; i < this._entities.length; i++) {
                if (this._entities[i].enabled)
                    this._entities[i].getComponents(type, comps);
            }
            for (var i = 0; i < this._entitiesToAdded.length; i++) {
                var entity = this._entitiesToAdded[i];
                if (entity.enabled)
                    entity.getComponents(type, comps);
            }
            return comps;
        };
        return EntityList;
    }());
    es.EntityList = EntityList;
})(es || (es = {}));
var es;
(function (es) {
    var EntityProcessorList = (function () {
        function EntityProcessorList() {
            this._processors = [];
        }
        EntityProcessorList.prototype.add = function (processor) {
            this._processors.push(processor);
        };
        EntityProcessorList.prototype.remove = function (processor) {
            this._processors.remove(processor);
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
            for (var i = 0; i < this._processors.length; i++) {
                this._processors[i].update();
            }
        };
        EntityProcessorList.prototype.lateUpdate = function () {
            for (var i = 0; i < this._processors.length; i++) {
                this._processors[i].lateUpdate();
            }
        };
        EntityProcessorList.prototype.end = function () {
        };
        EntityProcessorList.prototype.getProcessor = function () {
            for (var i = 0; i < this._processors.length; i++) {
                var processor = this._processors[i];
                if (processor instanceof es.EntitySystem)
                    return processor;
            }
            return null;
        };
        EntityProcessorList.prototype.notifyEntityChanged = function (entity) {
            for (var i = 0; i < this._processors.length; i++) {
                this._processors[i].onChanged(entity);
            }
        };
        EntityProcessorList.prototype.removeFromProcessors = function (entity) {
            for (var i = 0; i < this._processors.length; i++) {
                this._processors[i].remove(entity);
            }
        };
        return EntityProcessorList;
    }());
    es.EntityProcessorList = EntityProcessorList;
})(es || (es = {}));
var es;
(function (es) {
    var FasterDictionary = (function () {
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
            var valueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
            if (valueIndex == -1) {
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash);
            }
            else {
                {
                    var currentValueIndex = valueIndex;
                    do {
                        if (this._valuesInfo[currentValueIndex].hashcode == hash &&
                            this._valuesInfo[currentValueIndex].key == key) {
                            this._values[currentValueIndex] = value;
                            indexSet.value = currentValueIndex;
                            return false;
                        }
                        currentValueIndex = this._valuesInfo[currentValueIndex].previous;
                    } while (currentValueIndex != -1);
                }
                this._collisions++;
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash, valueIndex);
                this._valuesInfo[valueIndex].next = this._freeValueCellIndex;
            }
            this._buckets[bucketIndex] = (this._freeValueCellIndex + 1);
            this._values[this._freeValueCellIndex] = value;
            indexSet.value = this._freeValueCellIndex;
            this._freeValueCellIndex++;
            if (this._collisions > this._buckets.length) {
                this._buckets = new Array(es.HashHelpers.expandPrime(this._collisions));
                this._collisions = 0;
                for (var newValueIndex = 0; newValueIndex < this._freeValueCellIndex; newValueIndex++) {
                    bucketIndex = FasterDictionary.reduce(this._valuesInfo[newValueIndex].hashcode, this._buckets.length);
                    var existingValueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
                    this._buckets[bucketIndex] = newValueIndex + 1;
                    if (existingValueIndex != -1) {
                        this._collisions++;
                        this._valuesInfo[newValueIndex].previous = existingValueIndex;
                        this._valuesInfo[newValueIndex].next = -1;
                        this._valuesInfo[existingValueIndex].next = newValueIndex;
                    }
                    else {
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
            var indexToValueToRemove = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
            while (indexToValueToRemove != -1) {
                if (this._valuesInfo[indexToValueToRemove].hashcode == hash &&
                    this._valuesInfo[indexToValueToRemove].key == key) {
                    if (this._buckets[bucketIndex] - 1 == indexToValueToRemove) {
                        if (this._valuesInfo[indexToValueToRemove].next != -1)
                            throw new Error("如果 bucket 指向单元格，那么 next 必须不存在。");
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
                return false;
            this._freeValueCellIndex--;
            if (indexToValueToRemove != this._freeValueCellIndex) {
                var movingBucketIndex = FasterDictionary.reduce(this._valuesInfo[this._freeValueCellIndex].hashcode, this._buckets.length);
                if (this._buckets[movingBucketIndex] - 1 == this._freeValueCellIndex)
                    this._buckets[movingBucketIndex] = (indexToValueToRemove + 1);
                var next = this._valuesInfo[this._freeValueCellIndex].next;
                var previous = this._valuesInfo[this._freeValueCellIndex].previous;
                if (next != -1)
                    this._valuesInfo[next].previous = indexToValueToRemove;
                if (previous != -1)
                    this._valuesInfo[previous].next = indexToValueToRemove;
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
            var hash = FasterDictionary.hash(key);
            var bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);
            var valueIndex = es.NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
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
    var FastNode = (function () {
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
    var FastList = (function () {
        function FastList(size) {
            if (size === void 0) { size = 5; }
            this.length = 0;
            this.buffer = new Array(size);
        }
        FastList.prototype.clear = function () {
            this.buffer.length = 0;
            this.length = 0;
        };
        FastList.prototype.reset = function () {
            this.length = 0;
        };
        FastList.prototype.add = function (item) {
            if (this.length == this.buffer.length)
                this.buffer.length = Math.max(this.buffer.length << 1, 10);
            this.buffer[this.length++] = item;
        };
        FastList.prototype.remove = function (item) {
            var comp = es.EqualityComparer.default();
            for (var i = 0; i < this.length; ++i) {
                if (comp.equals(this.buffer[i], item)) {
                    this.removeAt(i);
                    return;
                }
            }
        };
        FastList.prototype.removeAt = function (index) {
            if (index >= this.length)
                throw new Error("index超出范围！");
            this.length--;
            this.buffer.removeAt(index);
        };
        FastList.prototype.contains = function (item) {
            var comp = es.EqualityComparer.default();
            for (var i = 0; i < this.length; ++i) {
                if (comp.equals(this.buffer[i], item))
                    return true;
            }
            return false;
        };
        FastList.prototype.ensureCapacity = function (additionalItemCount) {
            if (additionalItemCount === void 0) { additionalItemCount = 1; }
            if (this.length + additionalItemCount >= this.buffer.length)
                this.buffer.length = Math.max(this.buffer.length << 1, this.length + additionalItemCount);
        };
        FastList.prototype.addRange = function (array) {
            for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                var item = array_1[_i];
                this.add(item);
            }
        };
        FastList.prototype.sort = function (comparer) {
            this.buffer.sort(comparer.compare);
        };
        return FastList;
    }());
    es.FastList = FastList;
})(es || (es = {}));
var es;
(function (es) {
    var HashHelpers = (function () {
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
            for (var i = (min | 1); i < Number.MAX_VALUE; i += 2) {
                if (this.isPrime(i) && ((i - 1) % this.hashPrime != 0))
                    return i;
            }
            return min;
        };
        HashHelpers.expandPrime = function (oldSize) {
            var newSize = 2 * oldSize;
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
        HashHelpers.primes = [3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
            1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
            17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
            187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
            1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369];
        HashHelpers.maxPrimeArrayLength = 0x7FEFFFFD;
        return HashHelpers;
    }());
    es.HashHelpers = HashHelpers;
})(es || (es = {}));
var es;
(function (es) {
    var Matcher = (function () {
        function Matcher() {
            this.allSet = new es.BitSet();
            this.exclusionSet = new es.BitSet();
            this.oneSet = new es.BitSet();
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
        Matcher.prototype.isInterested = function (componentBits) {
            if (!this.allSet.isEmpty()) {
                for (var i = this.allSet.nextSetBit(0); i >= 0; i = this.allSet.nextSetBit(i + 1)) {
                    if (!componentBits.get(i))
                        return false;
                }
            }
            if (!this.exclusionSet.isEmpty() && this.exclusionSet.intersects(componentBits))
                return false;
            if (!this.oneSet.isEmpty() && !this.oneSet.intersects(componentBits))
                return false;
            return true;
        };
        Matcher.prototype.all = function () {
            var _this = this;
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            types.forEach(function (type) {
                _this.allSet.set(es.ComponentTypeManager.getIndexFor(type));
            });
            return this;
        };
        Matcher.prototype.exclude = function () {
            var _this = this;
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            types.forEach(function (type) {
                _this.exclusionSet.set(es.ComponentTypeManager.getIndexFor(type));
            });
            return this;
        };
        Matcher.prototype.one = function () {
            var _this = this;
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            types.forEach(function (type) {
                _this.oneSet.set(es.ComponentTypeManager.getIndexFor(type));
            });
            return this;
        };
        return Matcher;
    }());
    es.Matcher = Matcher;
})(es || (es = {}));
var es;
(function (es) {
    var RenderableComparer = (function () {
        function RenderableComparer() {
        }
        RenderableComparer.prototype.compare = function (self, other) {
            return other.renderLayer - self.renderLayer;
        };
        return RenderableComparer;
    }());
    es.RenderableComparer = RenderableComparer;
})(es || (es = {}));
var es;
(function (es) {
    var RenderableComponentList = (function () {
        function RenderableComponentList() {
            this._components = [];
            this._componentsByRenderLayer = new Map();
            this._unsortedRenderLayers = [];
            this._componentsNeedSort = true;
        }
        Object.defineProperty(RenderableComponentList.prototype, "componentsNeedSort", {
            get: function () {
                return this._componentsNeedSort;
            },
            set: function (value) {
                this._componentsNeedSort = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderableComponentList.prototype, "count", {
            get: function () {
                return this._components.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderableComponentList.prototype, "buffer", {
            get: function () {
                return this._components;
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponentList.prototype.add = function (component) {
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        };
        RenderableComponentList.prototype.remove = function (component) {
            this._components.remove(component);
            this._componentsByRenderLayer.get(component.renderLayer).remove(component);
        };
        RenderableComponentList.prototype.updateRenderableRenderLayer = function (component, oldRenderLayer, newRenderLayer) {
            if (this._componentsByRenderLayer.has(oldRenderLayer) && this._componentsByRenderLayer.get(oldRenderLayer).contains(component)) {
                this._componentsByRenderLayer.get(oldRenderLayer).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        };
        RenderableComponentList.prototype.setRenderLayerNeedsComponentSort = function (renderLayer) {
            if (!this._unsortedRenderLayers.contains(renderLayer))
                this._unsortedRenderLayers.push(renderLayer);
            this.componentsNeedSort = true;
        };
        RenderableComponentList.prototype.setNeedsComponentSort = function () {
            this.componentsNeedSort = true;
        };
        RenderableComponentList.prototype.addToRenderLayerList = function (component, renderLayer) {
            var list = this.componentsWithRenderLayer(renderLayer);
            if (list.contains(component)) {
                console.warn("组件呈现层列表已经包含此组件");
                return;
            }
            list.push(component);
            if (!this._unsortedRenderLayers.contains(renderLayer))
                this._unsortedRenderLayers.push(renderLayer);
            this.componentsNeedSort = true;
        };
        RenderableComponentList.prototype.componentsWithRenderLayer = function (renderLayer) {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }
            return this._componentsByRenderLayer.get(renderLayer);
        };
        RenderableComponentList.prototype.updateList = function () {
            if (this.componentsNeedSort) {
                this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this.componentsNeedSort = false;
            }
            if (this._unsortedRenderLayers.length > 0) {
                for (var i = 0, count = this._unsortedRenderLayers.length; i < count; i++) {
                    var renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents.sort(RenderableComponentList.compareUpdatableOrder.compare);
                    }
                }
                this._unsortedRenderLayers.length = 0;
            }
        };
        RenderableComponentList.compareUpdatableOrder = new es.RenderableComparer();
        return RenderableComponentList;
    }());
    es.RenderableComponentList = RenderableComponentList;
})(es || (es = {}));
var StringUtils = (function () {
    function StringUtils() {
    }
    StringUtils.matchChineseWord = function (str) {
        var patternA = /[\u4E00-\u9FA5]+/gim;
        return str.match(patternA);
    };
    StringUtils.lTrim = function (target) {
        var startIndex = 0;
        while (this.isWhiteSpace(target.charAt(startIndex))) {
            startIndex++;
        }
        return target.slice(startIndex, target.length);
    };
    StringUtils.rTrim = function (target) {
        var endIndex = target.length - 1;
        while (this.isWhiteSpace(target.charAt(endIndex))) {
            endIndex--;
        }
        return target.slice(0, endIndex + 1);
    };
    StringUtils.trim = function (target) {
        if (target == null) {
            return null;
        }
        return this.rTrim(this.lTrim(target));
    };
    StringUtils.isWhiteSpace = function (str) {
        if (str == " " || str == "\t" || str == "\r" || str == "\n")
            return true;
        return false;
    };
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
    StringUtils.reverse = function (str) {
        if (str.length > 1)
            return this.reverse(str.substring(1)) + str.substring(0, 1);
        else
            return str;
    };
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
var es;
(function (es) {
    var Time = (function () {
        function Time() {
        }
        Time.update = function (currentTime) {
            var dt = (currentTime - this._lastTime) / 1000;
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
        Time.checkEvery = function (interval) {
            return this.timeSinceSceneLoad / interval > (this.timeSinceSceneLoad - this.deltaTime) / interval;
        };
        Time.deltaTime = 0;
        Time.timeScale = 1;
        Time.frameCount = 0;
        Time._lastTime = 0;
        return Time;
    }());
    es.Time = Time;
})(es || (es = {}));
var TimeUtils = (function () {
    function TimeUtils() {
    }
    TimeUtils.monthId = function (d) {
        if (d === void 0) { d = null; }
        d = d ? d : new Date();
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var g = m < 10 ? "0" : "";
        return parseInt(y + g + m);
    };
    TimeUtils.dateId = function (t) {
        if (t === void 0) { t = null; }
        t = t ? t : new Date();
        var m = t.getMonth() + 1;
        var a = m < 10 ? "0" : "";
        var d = t.getDate();
        var b = d < 10 ? "0" : "";
        return parseInt(t.getFullYear() + a + m + b + d);
    };
    TimeUtils.weekId = function (d, first) {
        if (d === void 0) { d = null; }
        if (first === void 0) { first = true; }
        d = d ? d : new Date();
        var c = new Date();
        c.setTime(d.getTime());
        c.setDate(1);
        c.setMonth(0);
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
            c.setMonth(0);
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
                c.setMonth(0);
                return this.weekId(c, false);
            }
        }
        var g = weekIdx > 9 ? "" : "0";
        var s = year + "00" + g + weekIdx;
        return parseInt(s);
    };
    TimeUtils.diffDay = function (a, b, fixOne) {
        if (fixOne === void 0) { fixOne = false; }
        var x = (a.getTime() - b.getTime()) / 86400000;
        return fixOne ? Math.ceil(x) : Math.floor(x);
    };
    TimeUtils.getFirstDayOfWeek = function (d) {
        d = d ? d : new Date();
        var day = d.getDay() || 7;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1 - day, 0, 0, 0, 0);
    };
    TimeUtils.getFirstOfDay = function (d) {
        d = d ? d : new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };
    TimeUtils.getNextFirstOfDay = function (d) {
        return new Date(this.getFirstOfDay(d).getTime() + 86400000);
    };
    TimeUtils.formatDate = function (date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        return y + '-' + m + '-' + d;
    };
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
    TimeUtils.parseDate = function (s) {
        var t = Date.parse(s);
        if (!isNaN(t)) {
            return new Date(Date.parse(s.replace(/-/g, "/")));
        }
        else {
            return new Date();
        }
    };
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
    var Viewport = (function () {
        function Viewport(x, y, width, height) {
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
            this._minDepth = 0;
            this._maxDepth = 1;
        }
        Object.defineProperty(Viewport.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                this._width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewport.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                this._height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewport.prototype, "aspectRatio", {
            get: function () {
                if ((this._height != 0) && (this._width != 0))
                    return (this._width / this._height);
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewport.prototype, "bounds", {
            get: function () {
                return new es.Rectangle(this._x, this._y, this._width, this._height);
            },
            set: function (value) {
                this._x = value.x;
                this._y = value.y;
                this._width = value.width;
                this._height = value.height;
            },
            enumerable: true,
            configurable: true
        });
        return Viewport;
    }());
    es.Viewport = Viewport;
})(es || (es = {}));
var es;
(function (es) {
    var Renderer = (function () {
        function Renderer(renderOrder) {
            this.renderOrder = 0;
            this.shouldDebugRender = true;
            this.renderOrder = renderOrder;
        }
        Renderer.prototype.onAddedToScene = function (scene) {
        };
        Renderer.prototype.unload = function () {
        };
        Renderer.prototype.onSceneBackBufferSizeChanged = function (newWidth, newHeight) {
        };
        Renderer.prototype.compareTo = function (other) {
            return this.renderOrder - other.renderOrder;
        };
        return Renderer;
    }());
    es.Renderer = Renderer;
})(es || (es = {}));
var es;
(function (es) {
    var SceneTransition = (function () {
        function SceneTransition(sceneLoadAction) {
            this.sceneLoadAction = sceneLoadAction;
            this.loadsNewScene = sceneLoadAction != null;
        }
        Object.defineProperty(SceneTransition.prototype, "hasPreviousSceneRender", {
            get: function () {
                if (!this._hasPreviousSceneRender) {
                    this._hasPreviousSceneRender = true;
                    return false;
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        SceneTransition.prototype.preRender = function () {
        };
        SceneTransition.prototype.render = function () {
        };
        SceneTransition.prototype.onBeginTransition = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, this.loadNextScene()];
                        case 1:
                            _a.sent();
                            this.transitionComplete();
                            return [2];
                    }
                });
            });
        };
        SceneTransition.prototype.transitionComplete = function () {
            es.Core._instance._sceneTransition = null;
            if (this.onTransitionCompleted) {
                this.onTransitionCompleted();
            }
        };
        SceneTransition.prototype.loadNextScene = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (this.onScreenObscured)
                                this.onScreenObscured();
                            if (!this.loadsNewScene) {
                                this.isNewSceneLoaded = true;
                            }
                            _a = es.Core;
                            return [4, this.sceneLoadAction()];
                        case 1:
                            _a.scene = _b.sent();
                            this.isNewSceneLoaded = true;
                            return [2];
                    }
                });
            });
        };
        return SceneTransition;
    }());
    es.SceneTransition = SceneTransition;
})(es || (es = {}));
var es;
(function (es) {
    var Bezier = (function () {
        function Bezier() {
        }
        Bezier.getPoint = function (p0, p1, p2, t) {
            t = es.MathHelper.clamp01(t);
            var oneMinusT = 1 - t;
            return es.Vector2.add(es.Vector2.add(es.Vector2.multiply(new es.Vector2(oneMinusT * oneMinusT), p0), es.Vector2.multiply(new es.Vector2(2 * oneMinusT * t), p1)), es.Vector2.multiply(new es.Vector2(t * t), p2));
        };
        Bezier.getFirstDerivative = function (p0, p1, p2, t) {
            return es.Vector2.add(es.Vector2.multiply(new es.Vector2(2 * (1 - t)), es.Vector2.subtract(p1, p0)), es.Vector2.multiply(new es.Vector2(2 * t), es.Vector2.subtract(p2, p1)));
        };
        Bezier.getFirstDerivativeThree = function (start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            var oneMunusT = 1 - t;
            return es.Vector2.add(es.Vector2.add(es.Vector2.multiply(new es.Vector2(3 * oneMunusT * oneMunusT), es.Vector2.subtract(firstControlPoint, start)), es.Vector2.multiply(new es.Vector2(6 * oneMunusT * t), es.Vector2.subtract(secondControlPoint, firstControlPoint))), es.Vector2.multiply(new es.Vector2(3 * t * t), es.Vector2.subtract(end, secondControlPoint)));
        };
        Bezier.getPointThree = function (start, firstControlPoint, secondControlPoint, end, t) {
            t = es.MathHelper.clamp01(t);
            var oneMunusT = 1 - t;
            return es.Vector2.add(es.Vector2.add(es.Vector2.add(es.Vector2.multiply(new es.Vector2(oneMunusT * oneMunusT * oneMunusT), start), es.Vector2.multiply(new es.Vector2(3 * oneMunusT * oneMunusT * t), firstControlPoint)), es.Vector2.multiply(new es.Vector2(3 * oneMunusT * t * t), secondControlPoint)), es.Vector2.multiply(new es.Vector2(t * t * t), end));
        };
        Bezier.getOptimizedDrawingPoints = function (start, firstCtrlPoint, secondCtrlPoint, end, distanceTolerance) {
            if (distanceTolerance === void 0) { distanceTolerance = 1; }
            var points = es.ListPool.obtain();
            points.push(start);
            this.recursiveGetOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance);
            points.push(end);
            return points;
        };
        Bezier.recursiveGetOptimizedDrawingPoints = function (start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance) {
            var pt12 = es.Vector2.divide(es.Vector2.add(start, firstCtrlPoint), new es.Vector2(2));
            var pt23 = es.Vector2.divide(es.Vector2.add(firstCtrlPoint, secondCtrlPoint), new es.Vector2(2));
            var pt34 = es.Vector2.divide(es.Vector2.add(secondCtrlPoint, end), new es.Vector2(2));
            var pt123 = es.Vector2.divide(es.Vector2.add(pt12, pt23), new es.Vector2(2));
            var pt234 = es.Vector2.divide(es.Vector2.add(pt23, pt34), new es.Vector2(2));
            var pt1234 = es.Vector2.divide(es.Vector2.add(pt123, pt234), new es.Vector2(2));
            var deltaLine = es.Vector2.subtract(end, start);
            var d2 = Math.abs(((firstCtrlPoint.x, end.x) * deltaLine.y - (firstCtrlPoint.y - end.y) * deltaLine.x));
            var d3 = Math.abs(((secondCtrlPoint.x - end.x) * deltaLine.y - (secondCtrlPoint.y - end.y) * deltaLine.x));
            if ((d2 + d3) * (d2 + d3) < distanceTolerance * (deltaLine.x * deltaLine.x + deltaLine.y * deltaLine.y)) {
                points.push(pt1234);
                return;
            }
            this.recursiveGetOptimizedDrawingPoints(start, pt12, pt123, pt1234, points, distanceTolerance);
            this.recursiveGetOptimizedDrawingPoints(pt1234, pt234, pt34, end, points, distanceTolerance);
        };
        return Bezier;
    }());
    es.Bezier = Bezier;
})(es || (es = {}));
var es;
(function (es) {
    var Flags = (function () {
        function Flags() {
        }
        Flags.isFlagSet = function (self, flag) {
            return (self & flag) != 0;
        };
        Flags.isUnshiftedFlagSet = function (self, flag) {
            flag = 1 << flag;
            return (self & flag) != 0;
        };
        Flags.setFlagExclusive = function (self, flag) {
            self.value = 1 << flag;
        };
        Flags.setFlag = function (self, flag) {
            self.value = (self.value | 1 << flag);
        };
        Flags.unsetFlag = function (self, flag) {
            flag = 1 << flag;
            self.value = (self.value & (~flag));
        };
        Flags.invertFlags = function (self) {
            self.value = ~self.value;
        };
        return Flags;
    }());
    es.Flags = Flags;
})(es || (es = {}));
var es;
(function (es) {
    var MathHelper = (function () {
        function MathHelper() {
        }
        MathHelper.toDegrees = function (radians) {
            return radians * 57.295779513082320876798154814105;
        };
        MathHelper.toRadians = function (degrees) {
            return degrees * 0.017453292519943295769236907684886;
        };
        MathHelper.map = function (value, leftMin, leftMax, rightMin, rightMax) {
            return rightMin + (value - leftMin) * (rightMax - rightMin) / (leftMax - leftMin);
        };
        MathHelper.lerp = function (value1, value2, amount) {
            return value1 + (value2 - value1) * amount;
        };
        MathHelper.clamp = function (value, min, max) {
            if (value < min)
                return min;
            if (value > max)
                return max;
            return value;
        };
        MathHelper.pointOnCirlce = function (circleCenter, radius, angleInDegrees) {
            var radians = MathHelper.toRadians(angleInDegrees);
            return new es.Vector2(Math.cos(radians) * radians + circleCenter.x, Math.sin(radians) * radians + circleCenter.y);
        };
        MathHelper.isEven = function (value) {
            return value % 2 == 0;
        };
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
        MathHelper.incrementWithWrap = function (t, length) {
            t++;
            if (t == length)
                return 0;
            return t;
        };
        MathHelper.approach = function (start, end, shift) {
            if (start < end)
                return Math.min(start + shift, end);
            return Math.max(start - shift, end);
        };
        MathHelper.Epsilon = 0.00001;
        MathHelper.Rad2Deg = 57.29578;
        MathHelper.Deg2Rad = 0.0174532924;
        MathHelper.PiOver2 = Math.PI / 2;
        return MathHelper;
    }());
    es.MathHelper = MathHelper;
})(es || (es = {}));
var es;
(function (es) {
    var Matrix2D = (function () {
        function Matrix2D(m11, m12, m21, m22, m31, m32) {
            this.m11 = 0;
            this.m12 = 0;
            this.m21 = 0;
            this.m22 = 0;
            this.m31 = 0;
            this.m32 = 0;
            this.m11 = m11;
            this.m12 = m12;
            this.m21 = m21;
            this.m22 = m22;
            this.m31 = m31;
            this.m32 = m32;
        }
        Object.defineProperty(Matrix2D, "identity", {
            get: function () {
                return this._identity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "translation", {
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
        Matrix2D.createRotation = function (radians) {
            var result = this.identity;
            var val1 = Math.cos(radians);
            var val2 = Math.sin(radians);
            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
            return result;
        };
        Matrix2D.createScale = function (xScale, yScale) {
            var result = this.identity;
            result.m11 = xScale;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = yScale;
            result.m31 = 0;
            result.m32 = 0;
            return result;
        };
        Matrix2D.createTranslation = function (xPosition, yPosition) {
            var result = this.identity;
            result.m11 = 1;
            result.m12 = 0;
            result.m21 = 0;
            result.m22 = 1;
            result.m31 = xPosition;
            result.m32 = yPosition;
            return result;
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
        Matrix2D.prototype.determinant = function () {
            return this.m11 * this.m22 - this.m12 * this.m21;
        };
        Matrix2D.lerp = function (matrix1, matrix2, amount) {
            matrix1.m11 = matrix1.m11 + ((matrix2.m11 - matrix1.m11) * amount);
            matrix1.m12 = matrix1.m12 + ((matrix2.m12 - matrix1.m12) * amount);
            matrix1.m21 = matrix1.m21 + ((matrix2.m21 - matrix1.m21) * amount);
            matrix1.m22 = matrix1.m22 + ((matrix2.m22 - matrix1.m22) * amount);
            matrix1.m31 = matrix1.m31 + ((matrix2.m31 - matrix1.m31) * amount);
            matrix1.m32 = matrix1.m32 + ((matrix2.m32 - matrix1.m32) * amount);
            return matrix1;
        };
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
            var trans = Matrix2D.createTranslation(x, y);
            return es.MatrixHelper.mutiply(this, trans);
        };
        Matrix2D.prototype.equals = function (other) {
            return this == other;
        };
        Matrix2D.prototype.toString = function () {
            return "{m11:" + this.m11 + " m12:" + this.m12 + " m21:" + this.m21 + " m22:" + this.m22 + " m31:" + this.m31 + " m32:" + this.m32 + "}";
        };
        Matrix2D._identity = new Matrix2D(1, 0, 0, 1, 0, 0);
        return Matrix2D;
    }());
    es.Matrix2D = Matrix2D;
})(es || (es = {}));
var es;
(function (es) {
    var MatrixHelper = (function () {
        function MatrixHelper() {
        }
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
    var Rectangle = (function () {
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Object.defineProperty(Rectangle, "empty", {
            get: function () {
                return this.emptyRectangle;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle, "maxRect", {
            get: function () {
                return new Rectangle(Number.MIN_VALUE / 2, Number.MIN_VALUE / 2, Number.MAX_VALUE, Number.MAX_VALUE);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "left", {
            get: function () {
                return this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "right", {
            get: function () {
                return this.x + this.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            get: function () {
                return this.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            get: function () {
                return this.y + this.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "max", {
            get: function () {
                return new es.Vector2(this.right, this.bottom);
            },
            enumerable: true,
            configurable: true
        });
        Rectangle.prototype.isEmpty = function () {
            return ((((this.width == 0) && (this.height == 0)) && (this.x == 0)) && (this.y == 0));
        };
        Object.defineProperty(Rectangle.prototype, "location", {
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
            get: function () {
                return new es.Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
            },
            enumerable: true,
            configurable: true
        });
        Rectangle.fromMinMax = function (minX, minY, maxX, maxY) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        };
        Rectangle.rectEncompassingPoints = function (points) {
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
        Rectangle.prototype.contains = function (x, y) {
            return ((((this.x <= x) && (x < (this.x + this.width))) &&
                (this.y <= y)) && (y < (this.y + this.height)));
        };
        Rectangle.prototype.inflate = function (horizontalAmount, verticalAmount) {
            this.x -= horizontalAmount;
            this.y -= verticalAmount;
            this.width += horizontalAmount * 2;
            this.height += verticalAmount * 2;
        };
        Rectangle.prototype.intersects = function (value) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        };
        Rectangle.prototype.rayIntersects = function (ray, distance) {
            distance.value = 0;
            var maxValue = Number.MAX_VALUE;
            if (Math.abs(ray.direction.x) < 1E-06) {
                if ((ray.start.x < this.x) || (ray.start.x > this.x + this.width))
                    return false;
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
                distance.value = Math.max(num8, distance.value);
                maxValue = Math.min(num7, maxValue);
                if (distance.value > maxValue)
                    return false;
            }
            if (Math.abs(ray.direction.y) < 1E-06) {
                if ((ray.start.y < this.y) || (ray.start.y > this.y + this.height))
                    return false;
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
                distance.value = Math.max(num6, distance.value);
                maxValue = Math.max(num5, maxValue);
                if (distance.value > maxValue)
                    return false;
            }
            return true;
        };
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
        Rectangle.prototype.getClosestPointOnRectangleToPoint = function (point) {
            var res = new es.Vector2();
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
            return res;
        };
        Rectangle.prototype.getClosestPointOnRectangleBorderToPoint = function (point, edgeNormal) {
            edgeNormal = es.Vector2.zero;
            var res = new es.Vector2();
            res.x = es.MathHelper.clamp(point.x, this.left, this.right);
            res.y = es.MathHelper.clamp(point.y, this.top, this.bottom);
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
        Rectangle.prototype.offset = function (offsetX, offsetY) {
            this.x += offsetX;
            this.y += offsetY;
        };
        Rectangle.union = function (value1, value2) {
            var x = Math.min(value1.x, value2.x);
            var y = Math.min(value1.y, value2.y);
            return new Rectangle(x, y, Math.max(value1.right, value2.right) - x, Math.max(value1.bottom, value2.bottom) - y);
        };
        Rectangle.overlap = function (value1, value2) {
            var x = Math.max(Math.max(value1.x, value2.x), 0);
            var y = Math.max(Math.max(value1.y, value2.y), 0);
            return new Rectangle(x, y, Math.max(Math.min(value1.right, value2.right) - x, 0), Math.max(Math.min(value1.bottom, value2.bottom) - y, 0));
        };
        Rectangle.prototype.calculateBounds = function (parentPosition, position, origin, scale, rotation, width, height) {
            if (rotation == 0) {
                this.x = parentPosition.x + position.x - origin.x * scale.x;
                this.y = parentPosition.y + position.y - origin.y * scale.y;
                this.width = width * scale.x;
                this.height = height * scale.y;
            }
            else {
                var worldPosX = parentPosition.x + position.x;
                var worldPosY = parentPosition.y + position.y;
                this._transformMat = es.Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y);
                this._tempMat = es.Matrix2D.createScale(scale.x, scale.y);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = es.Matrix2D.createRotation(rotation);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = es.Matrix2D.createTranslation(worldPosX, worldPosY);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                var topLeft = new es.Vector2(worldPosX, worldPosY);
                var topRight = new es.Vector2(worldPosX + width, worldPosY);
                var bottomLeft = new es.Vector2(worldPosX, worldPosY + height);
                var bottomRight = new es.Vector2(worldPosX + width, worldPosY + height);
                es.Vector2Ext.transformR(topLeft, this._transformMat, topLeft);
                es.Vector2Ext.transformR(topRight, this._transformMat, topRight);
                es.Vector2Ext.transformR(bottomLeft, this._transformMat, bottomLeft);
                es.Vector2Ext.transformR(bottomRight, this._transformMat, bottomRight);
                var minX = Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                var maxX = Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                var minY = Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                var maxY = Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                this.location = new es.Vector2(minX, minY);
                this.width = maxX - minX;
                this.height = maxY - minY;
            }
        };
        Rectangle.prototype.getSweptBroadphaseBounds = function (deltaX, deltaY) {
            var broadphasebox = Rectangle.empty;
            broadphasebox.x = deltaX > 0 ? this.x : this.x + deltaX;
            broadphasebox.y = deltaY > 0 ? this.y : this.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + this.width : this.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + this.height : this.height - deltaY;
            return broadphasebox;
        };
        Rectangle.prototype.collisionCheck = function (other, moveX, moveY) {
            moveX.value = moveY.value = 0;
            var l = other.x - (this.x + this.width);
            var r = (other.x + other.width) - this.x;
            var t = (other.y - (this.y + this.height));
            var b = (other.y + other.height) - this.y;
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;
            return true;
        };
        Rectangle.getIntersectionDepth = function (rectA, rectB) {
            var halfWidthA = rectA.width / 2;
            var halfHeightA = rectA.height / 2;
            var halfWidthB = rectB.width / 2;
            var halfHeightB = rectB.height / 2;
            var centerA = new es.Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            var centerB = new es.Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);
            var distanceX = centerA.x - centerB.x;
            var distanceY = centerA.y - centerB.y;
            var minDistanceX = halfWidthA + halfWidthB;
            var minDistanceY = halfHeightA + halfHeightB;
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return es.Vector2.zero;
            var depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            var depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
            return new es.Vector2(depthX, depthY);
        };
        Rectangle.prototype.equals = function (other) {
            return this === other;
        };
        Rectangle.prototype.getHashCode = function () {
            return (this.x ^ this.y ^ this.width ^ this.height);
        };
        Rectangle.emptyRectangle = new Rectangle();
        return Rectangle;
    }());
    es.Rectangle = Rectangle;
})(es || (es = {}));
var es;
(function (es) {
    var SubpixelFloat = (function () {
        function SubpixelFloat() {
            this.remainder = 0;
        }
        SubpixelFloat.prototype.update = function (amount) {
            this.remainder += amount;
            var motion = Math.floor(Math.trunc(this.remainder));
            this.remainder -= motion;
            amount = motion;
            return amount;
        };
        SubpixelFloat.prototype.reset = function () {
            this.remainder = 0;
        };
        return SubpixelFloat;
    }());
    es.SubpixelFloat = SubpixelFloat;
})(es || (es = {}));
var es;
(function (es) {
    var SubpixelVector2 = (function () {
        function SubpixelVector2() {
            this._x = new es.SubpixelFloat();
            this._y = new es.SubpixelFloat();
        }
        SubpixelVector2.prototype.update = function (amount) {
            amount.x = this._x.update(amount.x);
            amount.y = this._y.update(amount.y);
        };
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
    var Vector2 = (function () {
        function Vector2(x, y) {
            this.x = 0;
            this.y = 0;
            this.x = x ? x : 0;
            this.y = y != undefined ? y : this.x;
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
        Vector2.add = function (value1, value2) {
            var result = new Vector2(0, 0);
            result.x = value1.x + value2.x;
            result.y = value1.y + value2.y;
            return result;
        };
        Vector2.divide = function (value1, value2) {
            var result = new Vector2(0, 0);
            result.x = value1.x / value2.x;
            result.y = value1.y / value2.y;
            return result;
        };
        Vector2.multiply = function (value1, value2) {
            var result = new Vector2(0, 0);
            result.x = value1.x * value2.x;
            result.y = value1.y * value2.y;
            return result;
        };
        Vector2.subtract = function (value1, value2) {
            var result = new Vector2(0, 0);
            result.x = value1.x - value2.x;
            result.y = value1.y - value2.y;
            return result;
        };
        Vector2.normalize = function (value) {
            var nValue = new Vector2(value.x, value.y);
            var val = 1 / Math.sqrt((nValue.x * nValue.x) + (nValue.y * nValue.y));
            nValue.x *= val;
            nValue.y *= val;
            return nValue;
        };
        Vector2.dot = function (value1, value2) {
            return (value1.x * value2.x) + (value1.y * value2.y);
        };
        Vector2.distanceSquared = function (value1, value2) {
            var v1 = value1.x - value2.x, v2 = value1.y - value2.y;
            return (v1 * v1) + (v2 * v2);
        };
        Vector2.clamp = function (value1, min, max) {
            return new Vector2(es.MathHelper.clamp(value1.x, min.x, max.x), es.MathHelper.clamp(value1.y, min.y, max.y));
        };
        Vector2.lerp = function (value1, value2, amount) {
            return new Vector2(es.MathHelper.lerp(value1.x, value2.x, amount), es.MathHelper.lerp(value1.y, value2.y, amount));
        };
        Vector2.transform = function (position, matrix) {
            return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31, (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32);
        };
        Vector2.distance = function (value1, value2) {
            var v1 = value1.x - value2.x, v2 = value1.y - value2.y;
            return Math.sqrt((v1 * v1) + (v2 * v2));
        };
        Vector2.angle = function (from, to) {
            from = Vector2.normalize(from);
            to = Vector2.normalize(to);
            return Math.acos(es.MathHelper.clamp(Vector2.dot(from, to), -1, 1)) * es.MathHelper.Rad2Deg;
        };
        Vector2.negate = function (value) {
            value.x = -value.x;
            value.y = -value.y;
            return value;
        };
        Vector2.prototype.add = function (value) {
            this.x += value.x;
            this.y += value.y;
            return this;
        };
        Vector2.prototype.divide = function (value) {
            this.x /= value.x;
            this.y /= value.y;
            return this;
        };
        Vector2.prototype.multiply = function (value) {
            this.x *= value.x;
            this.y *= value.y;
            return this;
        };
        Vector2.prototype.subtract = function (value) {
            this.x -= value.x;
            this.y -= value.y;
            return this;
        };
        Vector2.prototype.normalize = function () {
            var val = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y));
            this.x *= val;
            this.y *= val;
        };
        Vector2.prototype.length = function () {
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        };
        Vector2.prototype.lengthSquared = function () {
            return (this.x * this.x) + (this.y * this.y);
        };
        Vector2.prototype.round = function () {
            return new Vector2(Math.round(this.x), Math.round(this.y));
        };
        Vector2.prototype.equals = function (other) {
            if (other instanceof Vector2) {
                return other.x == this.x && other.y == this.y;
            }
            return false;
        };
        return Vector2;
    }());
    es.Vector2 = Vector2;
})(es || (es = {}));
var es;
(function (es) {
    var Vector3 = (function () {
        function Vector3(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        return Vector3;
    }());
    es.Vector3 = Vector3;
})(es || (es = {}));
var es;
(function (es) {
    var ColliderTriggerHelper = (function () {
        function ColliderTriggerHelper(entity) {
            this._activeTriggerIntersections = [];
            this._previousTriggerIntersections = [];
            this._tempTriggerList = [];
            this._entity = entity;
        }
        ColliderTriggerHelper.prototype.update = function () {
            var colliders = this._entity.getComponents(es.Collider);
            for (var i = 0; i < colliders.length; i++) {
                var collider = colliders[i];
                var neighbors = es.Physics.boxcastBroadphase(collider.bounds, collider.collidesWithLayers);
                var _loop_2 = function (j) {
                    var neighbor = neighbors[j];
                    if (!collider.isTrigger && !neighbor.isTrigger)
                        return "continue";
                    if (collider.overlaps(neighbor)) {
                        var pair_1 = new es.Pair(collider, neighbor);
                        var shouldReportTriggerEvent = this_1._activeTriggerIntersections.findIndex(function (value) {
                            return value.first == pair_1.first && value.second == pair_1.second;
                        }) == -1 && this_1._previousTriggerIntersections.findIndex(function (value) {
                            return value.first == pair_1.first && value.second == pair_1.second;
                        }) == -1;
                        if (shouldReportTriggerEvent)
                            this_1.notifyTriggerListeners(pair_1, true);
                        if (!this_1._activeTriggerIntersections.contains(pair_1))
                            this_1._activeTriggerIntersections.push(pair_1);
                    }
                };
                var this_1 = this;
                for (var j = 0; j < neighbors.length; j++) {
                    _loop_2(j);
                }
            }
            es.ListPool.free(colliders);
            this.checkForExitedColliders();
        };
        ColliderTriggerHelper.prototype.checkForExitedColliders = function () {
            var _this = this;
            var _loop_3 = function (i) {
                var index = this_2._previousTriggerIntersections.findIndex(function (value) {
                    if (value.first == _this._activeTriggerIntersections[i].first && value.second == _this._activeTriggerIntersections[i].second)
                        return true;
                    return false;
                });
                if (index != -1)
                    this_2._previousTriggerIntersections.removeAt(index);
            };
            var this_2 = this;
            for (var i = 0; i < this._activeTriggerIntersections.length; i++) {
                _loop_3(i);
            }
            for (var i = 0; i < this._previousTriggerIntersections.length; i++) {
                this.notifyTriggerListeners(this._previousTriggerIntersections[i], false);
            }
            this._previousTriggerIntersections.length = 0;
            for (var i = 0; i < this._activeTriggerIntersections.length; i++) {
                if (!this._previousTriggerIntersections.contains(this._activeTriggerIntersections[i])) {
                    this._previousTriggerIntersections.push(this._activeTriggerIntersections[i]);
                }
            }
            this._activeTriggerIntersections.length = 0;
        };
        ColliderTriggerHelper.prototype.notifyTriggerListeners = function (collisionPair, isEntering) {
            collisionPair.first.entity.getComponents("ITriggerListener", this._tempTriggerList);
            for (var i = 0; i < this._tempTriggerList.length; i++) {
                if (isEntering) {
                    this._tempTriggerList[i].onTriggerEnter(collisionPair.second, collisionPair.first);
                }
                else {
                    this._tempTriggerList[i].onTriggerExit(collisionPair.second, collisionPair.first);
                }
                this._tempTriggerList.length = 0;
                if (collisionPair.second.entity) {
                    collisionPair.second.entity.getComponents("ITriggerListener", this._tempTriggerList);
                    for (var i_2 = 0; i_2 < this._tempTriggerList.length; i_2++) {
                        if (isEntering) {
                            this._tempTriggerList[i_2].onTriggerEnter(collisionPair.first, collisionPair.second);
                        }
                        else {
                            this._tempTriggerList[i_2].onTriggerExit(collisionPair.first, collisionPair.second);
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
    var Collisions = (function () {
        function Collisions() {
        }
        Collisions.isLineToLine = function (a1, a2, b1, b2) {
            var b = es.Vector2.subtract(a2, a1);
            var d = es.Vector2.subtract(b2, b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            if (bDotDPerp == 0)
                return false;
            var c = es.Vector2.subtract(b1, a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            return true;
        };
        Collisions.lineToLineIntersection = function (a1, a2, b1, b2) {
            var intersection = new es.Vector2(0, 0);
            var b = es.Vector2.subtract(a2, a1);
            var d = es.Vector2.subtract(b2, b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            if (bDotDPerp == 0)
                return intersection;
            var c = es.Vector2.subtract(b1, a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return intersection;
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return intersection;
            intersection = es.Vector2.add(a1, new es.Vector2(t * b.x, t * b.y));
            return intersection;
        };
        Collisions.closestPointOnLine = function (lineA, lineB, closestTo) {
            var v = es.Vector2.subtract(lineB, lineA);
            var w = es.Vector2.subtract(closestTo, lineA);
            var t = es.Vector2.dot(w, v) / es.Vector2.dot(v, v);
            t = es.MathHelper.clamp(t, 0, 1);
            return es.Vector2.add(lineA, new es.Vector2(v.x * t, v.y * t));
        };
        Collisions.circleToCircle = function (circleCenter1, circleRadius1, circleCenter2, circleRadius2) {
            return es.Vector2.distanceSquared(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
        };
        Collisions.circleToLine = function (circleCenter, radius, lineFrom, lineTo) {
            return es.Vector2.distanceSquared(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
        };
        Collisions.circleToPoint = function (circleCenter, radius, point) {
            return es.Vector2.distanceSquared(circleCenter, point) < radius * radius;
        };
        Collisions.rectToCircle = function (rect, cPosition, cRadius) {
            if (this.rectToPoint(rect.x, rect.y, rect.width, rect.height, cPosition))
                return true;
            var edgeFrom = es.Vector2.zero;
            var edgeTo = es.Vector2.zero;
            var sector = this.getSector(rect.x, rect.y, rect.width, rect.height, cPosition);
            if ((sector & PointSectors.top) != 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.bottom) != 0) {
                edgeFrom = new es.Vector2(rect.x, rect.y + rect.width);
                edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }
            if ((sector & PointSectors.left) != 0) {
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
                var edgeFrom = void 0;
                var edgeTo = void 0;
                if ((both & PointSectors.top) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y);
                    if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.bottom) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y + rect.height);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                    if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.left) != 0) {
                    edgeFrom = new es.Vector2(rect.x, rect.y);
                    edgeTo = new es.Vector2(rect.x, rect.y + rect.height);
                    if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
                if ((both & PointSectors.right) != 0) {
                    edgeFrom = new es.Vector2(rect.x + rect.width, rect.y);
                    edgeTo = new es.Vector2(rect.x + rect.width, rect.y + rect.height);
                    if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                        return true;
                }
            }
            return false;
        };
        Collisions.rectToPoint = function (rX, rY, rW, rH, point) {
            return point.x >= rX && point.y >= rY && point.x < rX + rW && point.y < rY + rH;
        };
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
    var RaycastHit = (function () {
        function RaycastHit(collider, fraction, distance, point, normal) {
            this.fraction = 0;
            this.distance = 0;
            this.point = es.Vector2.zero;
            this.normal = es.Vector2.zero;
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.centroid = es.Vector2.zero;
        }
        RaycastHit.prototype.setValues = function (collider, fraction, distance, point) {
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
        };
        RaycastHit.prototype.setValuesNonCollider = function (fraction, distance, point, normal) {
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.normal = normal;
        };
        RaycastHit.prototype.reset = function () {
            this.collider = null;
            this.fraction = this.distance = 0;
        };
        RaycastHit.prototype.toString = function () {
            return "[RaycastHit] fraction: " + this.fraction + ", distance: " + this.distance + ", normal: " + this.normal + ", centroid: " + this.centroid + ", point: " + this.point;
        };
        return RaycastHit;
    }());
    es.RaycastHit = RaycastHit;
})(es || (es = {}));
var es;
(function (es) {
    var Physics = (function () {
        function Physics() {
        }
        Physics.reset = function () {
            this._spatialHash = new es.SpatialHash(this.spatialHashCellSize);
        };
        Physics.clear = function () {
            this._spatialHash.clear();
        };
        Physics.overlapCircleAll = function (center, randius, results, layerMask) {
            if (layerMask === void 0) { layerMask = -1; }
            if (results.length == 0) {
                console.error("An empty results array was passed in. No results will ever be returned.");
                return;
            }
            return this._spatialHash.overlapCircle(center, randius, results, layerMask);
        };
        Physics.boxcastBroadphase = function (rect, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            return this._spatialHash.aabbBroadphase(rect, null, layerMask);
        };
        Physics.boxcastBroadphaseExcludingSelf = function (collider, rect, layerMask) {
            if (layerMask === void 0) { layerMask = this.allLayers; }
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        };
        Physics.addCollider = function (collider) {
            Physics._spatialHash.register(collider);
        };
        Physics.removeCollider = function (collider) {
            Physics._spatialHash.remove(collider);
        };
        Physics.updateCollider = function (collider) {
            this._spatialHash.remove(collider);
            this._spatialHash.register(collider);
        };
        Physics.linecast = function (start, end, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            this._hitArray[0].reset();
            this.linecastAll(start, end, this._hitArray, layerMask);
            return this._hitArray[0];
        };
        Physics.linecastAll = function (start, end, hits, layerMask) {
            if (layerMask === void 0) { layerMask = Physics.allLayers; }
            if (hits.length == 0) {
                console.warn("传入了一个空的hits数组。没有点击会被返回");
                return 0;
            }
            return this._spatialHash.linecast(start, end, hits, layerMask);
        };
        Physics.debugDraw = function (secondsToDisplay) {
            this._spatialHash.debugDraw(secondsToDisplay, 2);
        };
        Physics.spatialHashCellSize = 100;
        Physics.allLayers = -1;
        Physics.raycastsHitTriggers = false;
        Physics.raycastsStartInColliders = false;
        Physics._hitArray = [
            new es.RaycastHit()
        ];
        return Physics;
    }());
    es.Physics = Physics;
})(es || (es = {}));
var es;
(function (es) {
    var Ray2D = (function () {
        function Ray2D(position, end) {
            this.start = position;
            this.end = end;
            this.direction = es.Vector2.subtract(this.end, this.start);
        }
        return Ray2D;
    }());
    es.Ray2D = Ray2D;
})(es || (es = {}));
var es;
(function (es) {
    var SpatialHash = (function () {
        function SpatialHash(cellSize) {
            if (cellSize === void 0) { cellSize = 100; }
            this.gridBounds = new es.Rectangle();
            this._overlapTestCircle = new es.Circle(0);
            this._cellDict = new NumberDictionary();
            this._tempHashSet = [];
            this._cellSize = cellSize;
            this._inverseCellSize = 1 / this._cellSize;
            this._raycastParser = new RaycastResultParser();
        }
        SpatialHash.prototype.register = function (collider) {
            var bounds = collider.bounds;
            collider.registeredPhysicsBounds = bounds;
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            if (!this.gridBounds.contains(p1.x, p1.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p1);
            }
            if (!this.gridBounds.contains(p2.x, p2.y)) {
                this.gridBounds = es.RectangleExt.union(this.gridBounds, p2);
            }
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    var c = this.cellAtPosition(x, y, true);
                    if (!c.firstOrDefault(function (c) { return c == collider; }))
                        c.push(collider);
                }
            }
        };
        SpatialHash.prototype.remove = function (collider) {
            var bounds = collider.registeredPhysicsBounds;
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    var cell = this.cellAtPosition(x, y);
                    if (!cell)
                        console.log("\u4ECE\u4E0D\u5B58\u5728\u78B0\u649E\u5668\u7684\u5355\u5143\u683C\u4E2D\u79FB\u9664\u78B0\u649E\u5668: [" + collider + "]");
                    else
                        cell.remove(collider);
                }
            }
        };
        SpatialHash.prototype.removeWithBruteForce = function (obj) {
            this._cellDict.remove(obj);
        };
        SpatialHash.prototype.clear = function () {
            this._cellDict.clear();
        };
        SpatialHash.prototype.debugDraw = function (secondsToDisplay, textScale) {
            if (textScale === void 0) { textScale = 1; }
            for (var x = this.gridBounds.x; x <= this.gridBounds.right; x++) {
                for (var y = this.gridBounds.y; y <= this.gridBounds.bottom; y++) {
                    var cell = this.cellAtPosition(x, y);
                    if (cell && cell.length > 0)
                        this.debugDrawCellDetails(x, y, cell.length, secondsToDisplay, textScale);
                }
            }
        };
        SpatialHash.prototype.aabbBroadphase = function (bounds, excludeCollider, layerMask) {
            this._tempHashSet.length = 0;
            var p1 = this.cellCoords(bounds.x, bounds.y);
            var p2 = this.cellCoords(bounds.right, bounds.bottom);
            for (var x = p1.x; x <= p2.x; x++) {
                for (var y = p1.y; y <= p2.y; y++) {
                    var cell = this.cellAtPosition(x, y);
                    if (!cell)
                        continue;
                    var _loop_4 = function (i) {
                        var collider = cell[i];
                        if (collider == excludeCollider || !es.Flags.isFlagSet(layerMask, collider.physicsLayer.value))
                            return "continue";
                        if (bounds.intersects(collider.bounds)) {
                            if (!this_3._tempHashSet.firstOrDefault(function (c) { return c == collider; }))
                                this_3._tempHashSet.push(collider);
                        }
                    };
                    var this_3 = this;
                    for (var i = 0; i < cell.length; i++) {
                        _loop_4(i);
                    }
                }
            }
            return this._tempHashSet;
        };
        SpatialHash.prototype.linecast = function (start, end, hits, layerMask) {
            var ray = new es.Ray2D(start, end);
            this._raycastParser.start(ray, hits, layerMask);
            var currentCell = this.cellCoords(start.x, start.y);
            var lastCell = this.cellCoords(end.x, end.y);
            var stepX = Math.sign(ray.direction.x);
            var stepY = Math.sign(ray.direction.y);
            if (currentCell.x == lastCell.x)
                stepX = 0;
            if (currentCell.y == lastCell.y)
                stepY = 0;
            var xStep = stepX < 0 ? 0 : stepX;
            var yStep = stepY < 0 ? 0 : stepY;
            var nextBoundaryX = (currentCell.x + xStep) * this._cellSize;
            var nextBoundaryY = (currentCell.y + yStep) * this._cellSize;
            var tMaxX = ray.direction.x != 0 ? (nextBoundaryX - ray.start.x) / ray.direction.x : Number.MAX_VALUE;
            var tMaxY = ray.direction.y != 0 ? (nextBoundaryY - ray.start.y) / ray.direction.y : Number.MAX_VALUE;
            var tDeltaX = ray.direction.x != 0 ? this._cellSize / (ray.direction.x * stepX) : Number.MAX_VALUE;
            var tDeltaY = ray.direction.y != 0 ? this._cellSize / (ray.direction.y * stepY) : Number.MAX_VALUE;
            var cell = this.cellAtPosition(currentCell.x, currentCell.y);
            if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                this._raycastParser.reset();
                return this._raycastParser.hitCounter;
            }
            while (currentCell.x != lastCell.x || currentCell.y != lastCell.y) {
                if (tMaxX < tMaxY) {
                    currentCell.x = Math.floor(es.MathHelper.approach(currentCell.x, lastCell.x, Math.abs(stepX)));
                    tMaxX += tDeltaX;
                }
                else {
                    currentCell.y = Math.floor(es.MathHelper.approach(currentCell.y, lastCell.y, Math.abs(stepY)));
                    tMaxY += tDeltaY;
                }
                cell = this.cellAtPosition(currentCell.x, currentCell.y);
                if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                    this._raycastParser.reset();
                    return this._raycastParser.hitCounter;
                }
            }
            this._raycastParser.reset();
            return this._raycastParser.hitCounter;
        };
        SpatialHash.prototype.overlapCircle = function (circleCenter, radius, results, layerMask) {
            var bounds = new es.Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);
            this._overlapTestCircle.radius = radius;
            this._overlapTestCircle.position = circleCenter;
            var resultCounter = 0;
            var potentials = this.aabbBroadphase(bounds, null, layerMask);
            for (var i = 0; i < potentials.length; i++) {
                var collider = potentials[i];
                if (collider instanceof es.BoxCollider) {
                    results[resultCounter] = collider;
                    resultCounter++;
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
                    throw new Error("overlapCircle against this collider type is not implemented!");
                }
                if (resultCounter == results.length)
                    return resultCounter;
            }
            return resultCounter;
        };
        SpatialHash.prototype.cellCoords = function (x, y) {
            return new es.Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
        };
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
        SpatialHash.prototype.debugDrawCellDetails = function (x, y, cellCount, secondsToDisplay, textScale) {
            if (secondsToDisplay === void 0) { secondsToDisplay = 0.5; }
            if (textScale === void 0) { textScale = 1; }
        };
        return SpatialHash;
    }());
    es.SpatialHash = SpatialHash;
    var NumberDictionary = (function () {
        function NumberDictionary() {
            this._store = new Map();
        }
        NumberDictionary.prototype.add = function (x, y, list) {
            this._store.set(this.getKey(x, y), list);
        };
        NumberDictionary.prototype.remove = function (obj) {
            this._store.forEach(function (list) {
                if (list.contains(obj))
                    list.remove(obj);
            });
        };
        NumberDictionary.prototype.tryGetValue = function (x, y) {
            return this._store.get(this.getKey(x, y));
        };
        NumberDictionary.prototype.getKey = function (x, y) {
            return x + "_" + y;
        };
        NumberDictionary.prototype.clear = function () {
            this._store.clear();
        };
        return NumberDictionary;
    }());
    es.NumberDictionary = NumberDictionary;
    var RaycastResultParser = (function () {
        function RaycastResultParser() {
            this._tempHit = new es.RaycastHit();
            this._checkedColliders = [];
            this._cellHits = [];
        }
        RaycastResultParser.prototype.start = function (ray, hits, layerMask) {
            this._ray = ray;
            this._hits = hits;
            this._layerMask = layerMask;
            this.hitCounter = 0;
        };
        RaycastResultParser.prototype.checkRayIntersection = function (cellX, cellY, cell) {
            var fraction = new es.Ref(0);
            for (var i = 0; i < cell.length; i++) {
                var potential = cell[i];
                if (this._checkedColliders.contains(potential))
                    continue;
                this._checkedColliders.push(potential);
                if (potential.isTrigger && !es.Physics.raycastsHitTriggers)
                    continue;
                if (!es.Flags.isFlagSet(this._layerMask, potential.physicsLayer.value))
                    continue;
                var colliderBounds = potential.bounds;
                if (colliderBounds.rayIntersects(this._ray, fraction) && fraction.value <= 1) {
                    if (potential.shape.collidesWithLine(this._ray.start, this._ray.end, this._tempHit)) {
                        if (!es.Physics.raycastsStartInColliders && potential.shape.containsPoint(this._ray.start))
                            continue;
                        this._tempHit.collider = potential;
                        this._cellHits.push(this._tempHit);
                    }
                }
            }
            if (this._cellHits.length == 0)
                return false;
            this._cellHits.sort(RaycastResultParser.compareRaycastHits);
            for (var i = 0; i < this._cellHits.length; i++) {
                this._hits[this.hitCounter] = this._cellHits[i];
                this.hitCounter++;
                if (this.hitCounter == this._hits.length)
                    return true;
            }
            return false;
        };
        RaycastResultParser.prototype.reset = function () {
            this._hits = null;
            this._checkedColliders.length = 0;
            this._cellHits.length = 0;
        };
        RaycastResultParser.compareRaycastHits = function (a, b) {
            return a.distance - b.distance;
        };
        return RaycastResultParser;
    }());
    es.RaycastResultParser = RaycastResultParser;
})(es || (es = {}));
var es;
(function (es) {
    var Shape = (function () {
        function Shape() {
        }
        return Shape;
    }());
    es.Shape = Shape;
})(es || (es = {}));
var es;
(function (es) {
    var Polygon = (function (_super) {
        __extends(Polygon, _super);
        function Polygon(points, isBox) {
            var _this = _super.call(this) || this;
            _this._areEdgeNormalsDirty = true;
            _this.isUnrotated = true;
            _this.setPoints(points);
            _this.isBox = isBox;
            return _this;
        }
        Object.defineProperty(Polygon.prototype, "edgeNormals", {
            get: function () {
                if (this._areEdgeNormalsDirty)
                    this.buildEdgeNormals();
                return this._edgeNormals;
            },
            enumerable: true,
            configurable: true
        });
        Polygon.prototype.setPoints = function (points) {
            this.points = points;
            this.recalculateCenterAndEdgeNormals();
            this._originalPoints = [];
            for (var i = 0; i < this.points.length; i++) {
                this._originalPoints.push(this.points[i]);
            }
        };
        Polygon.prototype.recalculateCenterAndEdgeNormals = function () {
            this._polygonCenter = Polygon.findPolygonCenter(this.points);
            this._areEdgeNormalsDirty = true;
        };
        Polygon.prototype.buildEdgeNormals = function () {
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
        Polygon.buildSymmetricalPolygon = function (vertCount, radius) {
            var verts = new Array(vertCount);
            for (var i = 0; i < vertCount; i++) {
                var a = 2 * Math.PI * (i / vertCount);
                verts[i] = new es.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
            }
            return verts;
        };
        Polygon.recenterPolygonVerts = function (points) {
            var center = this.findPolygonCenter(points);
            for (var i = 0; i < points.length; i++)
                points[i].subtract(center);
        };
        Polygon.findPolygonCenter = function (points) {
            var x = 0, y = 0;
            for (var i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }
            return new es.Vector2(x / points.length, y / points.length);
        };
        Polygon.getFarthestPointInDirection = function (points, direction) {
            var index = 0;
            var maxDot = es.Vector2.dot(points[index], direction);
            for (var i = 1; i < points.length; i++) {
                var dot = es.Vector2.dot(points[i], direction);
                if (dot > maxDot) {
                    maxDot = dot;
                    index = i;
                }
            }
            return points[index];
        };
        Polygon.getClosestPointOnPolygonToPoint = function (points, point, distanceSquared, edgeNormal) {
            distanceSquared.value = Number.MAX_VALUE;
            edgeNormal.x = 0;
            edgeNormal.y = 0;
            var closestPoint = new es.Vector2(0, 0);
            var tempDistanceSquared = 0;
            for (var i = 0; i < points.length; i++) {
                var j = i + 1;
                if (j == points.length)
                    j = 0;
                var closest = es.ShapeCollisions.closestPointOnLine(points[i], points[j], point);
                tempDistanceSquared = es.Vector2.distanceSquared(point, closest);
                if (tempDistanceSquared < distanceSquared.value) {
                    distanceSquared.value = tempDistanceSquared;
                    closestPoint = closest;
                    var line = es.Vector2.subtract(points[j], points[i]);
                    edgeNormal.x = -line.y;
                    edgeNormal.y = line.x;
                }
            }
            es.Vector2Ext.normalize(edgeNormal);
            return closestPoint;
        };
        Polygon.rotatePolygonVerts = function (radians, originalPoints, rotatedPoints) {
            var cos = Math.cos(radians);
            var sin = Math.sin(radians);
            for (var i = 0; i < originalPoints.length; i++) {
                var position = originalPoints[i];
                rotatedPoints[i] = new es.Vector2(position.x * cos + position.y * -sin, position.x * sin + position.y * cos);
            }
        };
        Polygon.prototype.recalculateBounds = function (collider) {
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                var hasUnitScale = true;
                var tempMat = void 0;
                var combinedMatrix = es.Matrix2D.createTranslation(-this._polygonCenter.x, -this._polygonCenter.y);
                if (!collider.entity.transform.scale.equals(es.Vector2.one)) {
                    tempMat = es.Matrix2D.createScale(collider.entity.transform.scale.x, collider.entity.transform.scale.y);
                    combinedMatrix = combinedMatrix.multiply(tempMat);
                    hasUnitScale = false;
                    this.center = es.Vector2.multiply(collider.localOffset, collider.entity.transform.scale);
                }
                if (collider.entity.transform.rotation != 0) {
                    tempMat = es.Matrix2D.createRotation(collider.entity.transform.rotation);
                    combinedMatrix = combinedMatrix.multiply(tempMat);
                    var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * es.MathHelper.Rad2Deg;
                    var offsetLength = hasUnitScale ? collider._localOffsetLength :
                        es.Vector2.multiply(collider.localOffset, collider.entity.transform.scale).length();
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotationDegrees + offsetAngle);
                }
                tempMat = es.Matrix2D.createTranslation(this._polygonCenter.x, this._polygonCenter.y);
                combinedMatrix = combinedMatrix.multiply(tempMat);
                es.Vector2Ext.transform(this._originalPoints, combinedMatrix, this.points);
                this.isUnrotated = collider.entity.transform.rotation == 0;
                if (collider._isRotationDirty)
                    this._areEdgeNormalsDirty = true;
            }
            this.position = es.Vector2.add(collider.entity.transform.position, this.center);
            this.bounds = es.Rectangle.rectEncompassingPoints(this.points);
            this.bounds.location.add(this.position);
        };
        Polygon.prototype.overlaps = function (other) {
            var result = new es.CollisionResult();
            if (other instanceof Polygon)
                return es.ShapeCollisions.polygonToPolygon(this, other, result);
            if (other instanceof es.Circle) {
                if (es.ShapeCollisions.circleToPolygon(other, this, result)) {
                    result.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error("overlaps of Pologon to " + other + " are not supported");
        };
        Polygon.prototype.collidesWithShape = function (other, result) {
            if (other instanceof Polygon) {
                return es.ShapeCollisions.polygonToPolygon(this, other, result);
            }
            if (other instanceof es.Circle) {
                if (es.ShapeCollisions.circleToPolygon(other, this, result)) {
                    result.invertResult();
                    return true;
                }
                return false;
            }
            throw new Error("overlaps of Polygon to " + other + " are not supported");
        };
        Polygon.prototype.collidesWithLine = function (start, end, hit) {
            return es.ShapeCollisions.lineToPoly(start, end, this, hit);
        };
        Polygon.prototype.containsPoint = function (point) {
            point.subtract(this.position);
            var isInside = false;
            for (var i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
                if (((this.points[i].y > point.y) != (this.points[j].y > point.y)) &&
                    (point.x < (this.points[j].x - this.points[i].x) * (point.y - this.points[i].y) / (this.points[j].y - this.points[i].y) +
                        this.points[i].x)) {
                    isInside = !isInside;
                }
            }
            return isInside;
        };
        Polygon.prototype.pointCollidesWithShape = function (point, result) {
            return es.ShapeCollisions.pointToPoly(point, this, result);
        };
        return Polygon;
    }(es.Shape));
    es.Polygon = Polygon;
})(es || (es = {}));
var es;
(function (es) {
    var Box = (function (_super) {
        __extends(Box, _super);
        function Box(width, height) {
            var _this = _super.call(this, Box.buildBox(width, height), true) || this;
            _this.width = width;
            _this.height = height;
            return _this;
        }
        Box.buildBox = function (width, height) {
            var halfWidth = width / 2;
            var halfHeight = height / 2;
            var verts = new Array(4);
            verts[0] = new es.Vector2(-halfWidth, -halfHeight);
            verts[1] = new es.Vector2(halfWidth, -halfHeight);
            verts[2] = new es.Vector2(halfWidth, halfHeight);
            verts[3] = new es.Vector2(-halfWidth, halfHeight);
            return verts;
        };
        Box.prototype.updateBox = function (width, height) {
            this.width = width;
            this.height = height;
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
            if (this.isUnrotated) {
                if (other instanceof Box && other.isUnrotated)
                    return this.bounds.intersects(other.bounds);
                if (other instanceof es.Circle)
                    return es.Collisions.rectToCircle(this.bounds, other.position, other.radius);
            }
            return _super.prototype.overlaps.call(this, other);
        };
        Box.prototype.collidesWithShape = function (other, result) {
            if (other instanceof Box && other.isUnrotated) {
                return es.ShapeCollisions.boxToBox(this, other, result);
            }
            return _super.prototype.collidesWithShape.call(this, other, result);
        };
        Box.prototype.containsPoint = function (point) {
            if (this.isUnrotated)
                return this.bounds.contains(point.x, point.y);
            return _super.prototype.containsPoint.call(this, point);
        };
        Box.prototype.pointCollidesWithShape = function (point, result) {
            if (this.isUnrotated)
                return es.ShapeCollisions.pointToBox(point, this, result);
            return _super.prototype.pointCollidesWithShape.call(this, point, result);
        };
        return Box;
    }(es.Polygon));
    es.Box = Box;
})(es || (es = {}));
var es;
(function (es) {
    var Circle = (function (_super) {
        __extends(Circle, _super);
        function Circle(radius) {
            var _this = _super.call(this) || this;
            _this.radius = radius;
            _this._originalRadius = radius;
            return _this;
        }
        Circle.prototype.recalculateBounds = function (collider) {
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                var scale = collider.entity.transform.scale;
                var hasUnitScale = scale.x == 1 && scale.y == 1;
                var maxScale = Math.max(scale.x, scale.y);
                this.radius = this._originalRadius * maxScale;
                if (collider.entity.transform.rotation != 0) {
                    var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * es.MathHelper.Rad2Deg;
                    var offsetLength = hasUnitScale ? collider._localOffsetLength : es.Vector2.multiply(collider.localOffset, collider.entity.transform.scale).length();
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotationDegrees + offsetAngle);
                }
            }
            this.position = es.Vector2.add(collider.entity.transform.position, this.center);
            this.bounds = new es.Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        };
        Circle.prototype.overlaps = function (other) {
            var result = new es.CollisionResult();
            if (other instanceof es.Box && other.isUnrotated)
                return es.Collisions.rectToCircle(other.bounds, this.position, this.radius);
            if (other instanceof Circle)
                return es.Collisions.circleToCircle(this.position, this.radius, other.position, other.radius);
            if (other instanceof es.Polygon)
                return es.ShapeCollisions.circleToPolygon(this, other, result);
            throw new Error("overlaps of circle to " + other + " are not supported");
        };
        Circle.prototype.collidesWithShape = function (other, result) {
            if (other instanceof es.Box && other.isUnrotated) {
                return es.ShapeCollisions.circleToBox(this, other, result);
            }
            if (other instanceof Circle) {
                return es.ShapeCollisions.circleToCircle(this, other, result);
            }
            if (other instanceof es.Polygon) {
                return es.ShapeCollisions.circleToPolygon(this, other, result);
            }
            throw new Error("Collisions of Circle to " + other + " are not supported");
        };
        Circle.prototype.collidesWithLine = function (start, end, hit) {
            return es.ShapeCollisions.lineToCircle(start, end, this, hit);
        };
        Circle.prototype.containsPoint = function (point) {
            return (es.Vector2.subtract(point, this.position)).lengthSquared() <= this.radius * this.radius;
        };
        Circle.prototype.pointCollidesWithShape = function (point, result) {
            return es.ShapeCollisions.pointToCircle(point, this, result);
        };
        return Circle;
    }(es.Shape));
    es.Circle = Circle;
})(es || (es = {}));
var es;
(function (es) {
    var CollisionResult = (function () {
        function CollisionResult() {
            this.normal = es.Vector2.zero;
            this.minimumTranslationVector = es.Vector2.zero;
            this.point = es.Vector2.zero;
        }
        CollisionResult.prototype.removeHorizontal = function (deltaMovement) {
            if (Math.sign(this.normal.x) != Math.sign(deltaMovement.x) || (deltaMovement.x == 0 && this.normal.x != 0)) {
                var responseDistance = this.minimumTranslationVector.length();
                var fix = responseDistance / this.normal.y;
                if (Math.abs(this.normal.x) != 1 && Math.abs(fix) < Math.abs(deltaMovement.y * 3)) {
                    this.minimumTranslationVector = new es.Vector2(0, -fix);
                }
            }
        };
        CollisionResult.prototype.invertResult = function () {
            this.minimumTranslationVector = es.Vector2.negate(this.minimumTranslationVector);
            this.normal = es.Vector2.negate(this.normal);
            return this;
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
    var RealtimeCollisions = (function () {
        function RealtimeCollisions() {
        }
        RealtimeCollisions.intersectMovingCircleBox = function (s, b, movement, time) {
            var e = b.bounds;
            e.inflate(s.radius, s.radius);
            var ray = new es.Ray2D(es.Vector2.subtract(s.position, movement), s.position);
            if (!e.rayIntersects(ray, time) && time.value > 1)
                return false;
            var point = es.Vector2.add(ray.start, es.Vector2.add(ray.direction, new es.Vector2(time.value)));
            var u, v = 0;
            if (point.x < b.bounds.left)
                u |= 1;
            if (point.x > b.bounds.right)
                v |= 1;
            if (point.y < b.bounds.top)
                u |= 2;
            if (point.y > b.bounds.bottom)
                v |= 2;
            var m = u + v;
            if (m == 3) {
                console.log("m == 3. corner " + es.Time.frameCount);
            }
            if ((m & (m - 1)) == 0) {
                return true;
            }
            return true;
        };
        return RealtimeCollisions;
    }());
    es.RealtimeCollisions = RealtimeCollisions;
})(es || (es = {}));
var es;
(function (es) {
    var ShapeCollisions = (function () {
        function ShapeCollisions() {
        }
        ShapeCollisions.polygonToPolygon = function (first, second, result) {
            var isIntersecting = true;
            var firstEdges = first.edgeNormals;
            var secondEdges = second.edgeNormals;
            var minIntervalDistance = Number.POSITIVE_INFINITY;
            var translationAxis = new es.Vector2();
            var polygonOffset = es.Vector2.subtract(first.position, second.position);
            var axis;
            for (var edgeIndex = 0; edgeIndex < firstEdges.length + secondEdges.length; edgeIndex++) {
                if (edgeIndex < firstEdges.length) {
                    axis = firstEdges[edgeIndex];
                }
                else {
                    axis = secondEdges[edgeIndex - firstEdges.length];
                }
                var minA = 0;
                var minB = 0;
                var maxA = 0;
                var maxB = 0;
                var intervalDist = 0;
                var ta = this.getInterval(axis, first, minA, maxA);
                minA = ta.min;
                minB = ta.max;
                var tb = this.getInterval(axis, second, minB, maxB);
                minB = tb.min;
                maxB = tb.max;
                var relativeIntervalOffset = es.Vector2.dot(polygonOffset, axis);
                minA += relativeIntervalOffset;
                maxA += relativeIntervalOffset;
                intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
                if (intervalDist > 0)
                    isIntersecting = false;
                if (!isIntersecting)
                    return false;
                intervalDist = Math.abs(intervalDist);
                if (intervalDist < minIntervalDistance) {
                    minIntervalDistance = intervalDist;
                    translationAxis = axis;
                    if (es.Vector2.dot(translationAxis, polygonOffset) < 0)
                        translationAxis = new es.Vector2(-translationAxis);
                }
            }
            result.normal = translationAxis;
            result.minimumTranslationVector = es.Vector2.multiply(new es.Vector2(-translationAxis.x, -translationAxis.y), new es.Vector2(minIntervalDistance));
            return true;
        };
        ShapeCollisions.intervalDistance = function (minA, maxA, minB, maxB) {
            if (minA < minB)
                return minB - maxA;
            return minA - minB;
        };
        ShapeCollisions.getInterval = function (axis, polygon, min, max) {
            var dot = es.Vector2.dot(polygon.points[0], axis);
            min = max = dot;
            for (var i = 1; i < polygon.points.length; i++) {
                dot = es.Vector2.dot(polygon.points[i], axis);
                if (dot < min) {
                    min = dot;
                }
                else if (dot > max) {
                    max = dot;
                }
            }
            return { min: min, max: max };
        };
        ShapeCollisions.circleToPolygon = function (circle, polygon, result) {
            var poly2Circle = es.Vector2.subtract(circle.position, polygon.position);
            var distanceSquared = new es.Ref(0);
            var closestPoint = es.Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle, distanceSquared, result.normal);
            var circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (distanceSquared.value > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;
            var mtv;
            if (circleCenterInsidePoly) {
                mtv = es.Vector2.multiply(result.normal, new es.Vector2(Math.sqrt(distanceSquared.value) - circle.radius));
            }
            else {
                if (distanceSquared.value == 0) {
                    mtv = es.Vector2.multiply(result.normal, new es.Vector2(circle.radius));
                }
                else {
                    var distance = Math.sqrt(distanceSquared.value);
                    mtv = es.Vector2.multiply(new es.Vector2(-es.Vector2.subtract(poly2Circle, closestPoint)), new es.Vector2((circle.radius - distanceSquared.value) / distance));
                }
            }
            result.minimumTranslationVector = mtv;
            result.point = es.Vector2.add(closestPoint, polygon.position);
            return true;
        };
        ShapeCollisions.circleToBox = function (circle, box, result) {
            var closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, result.normal);
            if (box.containsPoint(circle.position)) {
                result.point = closestPointOnBounds;
                var safePlace = es.Vector2.add(closestPointOnBounds, es.Vector2.multiply(result.normal, new es.Vector2(circle.radius)));
                result.minimumTranslationVector = es.Vector2.subtract(circle.position, safePlace);
                return true;
            }
            var sqrDistance = es.Vector2.distanceSquared(closestPointOnBounds, circle.position);
            if (sqrDistance == 0) {
                result.minimumTranslationVector = es.Vector2.multiply(result.normal, new es.Vector2(circle.radius));
            }
            else if (sqrDistance <= circle.radius * circle.radius) {
                result.normal = es.Vector2.subtract(circle.position, closestPointOnBounds);
                var depth = result.normal.length() - circle.radius;
                result.point = closestPointOnBounds;
                es.Vector2Ext.normalize(result.normal);
                result.minimumTranslationVector = es.Vector2.multiply(new es.Vector2(depth), result.normal);
                return true;
            }
            return false;
        };
        ShapeCollisions.pointToCircle = function (point, circle, result) {
            var distanceSquared = es.Vector2.distanceSquared(point, circle.position);
            var sumOfRadii = 1 + circle.radius;
            var collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = es.Vector2.normalize(es.Vector2.subtract(point, circle.position));
                var depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = es.Vector2.multiply(new es.Vector2(-depth, -depth), result.normal);
                result.point = es.Vector2.add(circle.position, es.Vector2.multiply(result.normal, new es.Vector2(circle.radius, circle.radius)));
                return true;
            }
            return false;
        };
        ShapeCollisions.pointToBox = function (point, box, result) {
            if (box.containsPoint(point)) {
                result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, result.normal);
                result.minimumTranslationVector = es.Vector2.subtract(point, result.point);
                return true;
            }
            return false;
        };
        ShapeCollisions.closestPointOnLine = function (lineA, lineB, closestTo) {
            var v = es.Vector2.subtract(lineB, lineA);
            var w = es.Vector2.subtract(closestTo, lineA);
            var t = es.Vector2.dot(w, v) / es.Vector2.dot(v, v);
            t = es.MathHelper.clamp(t, 0, 1);
            return es.Vector2.add(lineA, es.Vector2.multiply(v, new es.Vector2(t, t)));
        };
        ShapeCollisions.pointToPoly = function (point, poly, result) {
            if (poly.containsPoint(point)) {
                var distanceSquared = new es.Ref(0);
                var closestPoint = es.Polygon.getClosestPointOnPolygonToPoint(poly.points, es.Vector2.subtract(point, poly.position), distanceSquared, result.normal);
                result.minimumTranslationVector = es.Vector2.multiply(result.normal, new es.Vector2(Math.sqrt(distanceSquared.value), Math.sqrt(distanceSquared.value)));
                result.point = es.Vector2.add(closestPoint, poly.position);
                return true;
            }
            return false;
        };
        ShapeCollisions.circleToCircle = function (first, second, result) {
            var distanceSquared = es.Vector2.distanceSquared(first.position, second.position);
            var sumOfRadii = first.radius + second.radius;
            var collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = es.Vector2.normalize(es.Vector2.subtract(first.position, second.position));
                var depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = es.Vector2.multiply(new es.Vector2(-depth), result.normal);
                result.point = es.Vector2.add(second.position, es.Vector2.multiply(result.normal, new es.Vector2(second.radius)));
                return true;
            }
            return false;
        };
        ShapeCollisions.boxToBox = function (first, second, result) {
            var minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (result.minimumTranslationVector.equals(es.Vector2.zero))
                    return false;
                result.normal = new es.Vector2(-result.minimumTranslationVector.x, -result.minimumTranslationVector.y);
                result.normal.normalize();
                return true;
            }
            return false;
        };
        ShapeCollisions.minkowskiDifference = function (first, second) {
            var positionOffset = es.Vector2.subtract(first.position, es.Vector2.add(first.bounds.location, es.Vector2.divide(first.bounds.size, new es.Vector2(2))));
            var topLeft = es.Vector2.subtract(es.Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
            var fullSize = es.Vector2.add(first.bounds.size, second.bounds.size);
            return new es.Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y);
        };
        ShapeCollisions.lineToPoly = function (start, end, polygon, hit) {
            var normal = es.Vector2.zero;
            var intersectionPoint = es.Vector2.zero;
            var fraction = Number.MAX_VALUE;
            var hasIntersection = false;
            for (var j = polygon.points.length - 1, i = 0; i < polygon.points.length; j = i, i++) {
                var edge1 = es.Vector2.add(polygon.position, polygon.points[j]);
                var edge2 = es.Vector2.add(polygon.position, polygon.points[i]);
                var intersection = es.Vector2.zero;
                if (this.lineToLine(edge1, edge2, start, end, intersection)) {
                    hasIntersection = true;
                    var distanceFraction = (intersection.x - start.x) / (end.x - start.x);
                    if (Number.isNaN(distanceFraction) || Number.isFinite(distanceFraction))
                        distanceFraction = (intersection.y - start.y) / (end.y - start.y);
                    if (distanceFraction < fraction) {
                        var edge = es.Vector2.subtract(edge2, edge1);
                        normal = new es.Vector2(edge.y, -edge.x);
                        fraction = distanceFraction;
                        intersectionPoint = intersection;
                    }
                }
            }
            if (hasIntersection) {
                normal.normalize();
                var distance = es.Vector2.distance(start, intersectionPoint);
                hit.setValuesNonCollider(fraction, distance, intersectionPoint, normal);
                return true;
            }
            return false;
        };
        ShapeCollisions.lineToLine = function (a1, a2, b1, b2, intersection) {
            var b = es.Vector2.subtract(a2, a1);
            var d = es.Vector2.subtract(b2, b1);
            var bDotDPerp = b.x * d.y - b.y * d.x;
            if (bDotDPerp == 0)
                return false;
            var c = es.Vector2.subtract(b1, a1);
            var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;
            var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;
            intersection = intersection.add(a1).add(es.Vector2.multiply(new es.Vector2(t), b));
            return true;
        };
        ShapeCollisions.lineToCircle = function (start, end, s, hit) {
            var lineLength = es.Vector2.distance(start, end);
            var d = es.Vector2.divide(es.Vector2.subtract(end, start), new es.Vector2(lineLength));
            var m = es.Vector2.subtract(start, s.position);
            var b = es.Vector2.dot(m, d);
            var c = es.Vector2.dot(m, m) - s.radius * s.radius;
            if (c > 0 && b > 0)
                return false;
            var discr = b * b - c;
            if (discr < 0)
                return false;
            hit.fraction = -b - Math.sqrt(discr);
            if (hit.fraction < 0)
                hit.fraction = 0;
            hit.point = es.Vector2.add(start, es.Vector2.multiply(new es.Vector2(hit.fraction), d));
            hit.distance = es.Vector2.distance(start, hit.point);
            hit.normal = es.Vector2.normalize(es.Vector2.subtract(hit.point, s.position));
            hit.fraction = hit.distance / lineLength;
            return true;
        };
        ShapeCollisions.boxToBoxCast = function (first, second, movement, hit) {
            var minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                var mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(es.Vector2.zero))
                    return false;
                hit.normal = new es.Vector2(-mtv.x);
                hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;
                return true;
            }
            else {
                var ray = new es.Ray2D(es.Vector2.zero, new es.Vector2(-movement.x));
                var fraction = new es.Ref(0);
                if (minkowskiDiff.rayIntersects(ray, fraction) && fraction.value <= 1) {
                    hit.fraction = fraction.value;
                    hit.distance = movement.length() * fraction.value;
                    hit.normal = new es.Vector2(-movement.x, -movement.y);
                    hit.normal.normalize();
                    hit.centroid = es.Vector2.add(first.bounds.center, es.Vector2.multiply(movement, new es.Vector2(fraction.value)));
                    return true;
                }
            }
            return false;
        };
        return ShapeCollisions;
    }());
    es.ShapeCollisions = ShapeCollisions;
})(es || (es = {}));
var ArrayUtils = (function () {
    function ArrayUtils() {
    }
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
    ArrayUtils.findElementIndex = function (ary, num) {
        var len = ary.length;
        for (var i = 0; i < len; ++i) {
            if (ary[i] == num)
                return i;
        }
        return null;
    };
    ArrayUtils.getMaxElementIndex = function (ary) {
        var matchIndex = 0;
        var len = ary.length;
        for (var j = 1; j < len; j++) {
            if (ary[j] > ary[matchIndex])
                matchIndex = j;
        }
        return matchIndex;
    };
    ArrayUtils.getMinElementIndex = function (ary) {
        var matchIndex = 0;
        var len = ary.length;
        for (var j = 1; j < len; j++) {
            if (ary[j] < ary[matchIndex])
                matchIndex = j;
        }
        return matchIndex;
    };
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
    ArrayUtils.swap = function (array, index1, index2) {
        var temp = array[index1];
        array[index1] = array[index2];
        array[index2] = temp;
    };
    ArrayUtils.clearList = function (ary) {
        if (!ary)
            return;
        var length = ary.length;
        for (var i = length - 1; i >= 0; i -= 1) {
            ary.splice(i, 1);
        }
    };
    ArrayUtils.cloneList = function (ary) {
        if (!ary)
            return null;
        return ary.slice(0, ary.length);
    };
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
    ArrayUtils.insert = function (ary, index, value) {
        if (!ary)
            return null;
        var length = ary.length;
        if (index > length)
            index = length;
        if (index < 0)
            index = 0;
        if (index == length)
            ary.push(value);
        else if (index == 0)
            ary.unshift(value);
        else {
            for (var i = length - 1; i >= index; i -= 1) {
                ary[i + 1] = ary[i];
            }
            ary[index] = value;
        }
        return value;
    };
    return ArrayUtils;
}());
var es;
(function (es) {
    var Base64Utils = (function () {
        function Base64Utils() {
        }
        Object.defineProperty(Base64Utils, "nativeBase64", {
            get: function () {
                return (typeof (window.atob) === "function");
            },
            enumerable: true,
            configurable: true
        });
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
        Base64Utils.decompress = function (data, decoded, compression) {
            throw new Error("GZIP/ZLIB compressed TMX Tile Map not supported!");
        };
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
    var Color = (function () {
        function Color(r, g, b, alpha) {
            if (((r | g | b | alpha) & 0xFFFFFF00) != 0) {
                var clampedR = es.MathHelper.clamp(r, 0, 255);
                var clampedG = es.MathHelper.clamp(g, 0, 255);
                var clampedB = es.MathHelper.clamp(b, 0, 255);
                var clampedA = es.MathHelper.clamp(alpha, 0, 255);
                this._packedValue = (clampedA << 24) | (clampedB << 16) | (clampedG << 8) | (clampedR);
            }
            else {
                this._packedValue = (alpha << 24) | (b << 16) | (g << 8) | r;
            }
        }
        Object.defineProperty(Color.prototype, "b", {
            get: function () {
                return this._packedValue >> 16;
            },
            set: function (value) {
                this._packedValue = (this._packedValue & 0xff00ffff) | (value << 16);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "g", {
            get: function () {
                return this._packedValue >> 8;
            },
            set: function (value) {
                this._packedValue = (this._packedValue & 0xffff00ff) | (value << 8);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "r", {
            get: function () {
                return this._packedValue;
            },
            set: function (value) {
                this._packedValue = (this._packedValue & 0xffffff00) | value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "a", {
            get: function () {
                return this._packedValue >> 24;
            },
            set: function (value) {
                this._packedValue = (this._packedValue & 0x00ffffff) | (value << 24);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "packedValue", {
            get: function () {
                return this._packedValue;
            },
            set: function (value) {
                this._packedValue = value;
            },
            enumerable: true,
            configurable: true
        });
        Color.prototype.equals = function (other) {
            return this._packedValue == other._packedValue;
        };
        return Color;
    }());
    es.Color = Color;
})(es || (es = {}));
var es;
(function (es) {
    var EdgeExt = (function () {
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
        EdgeExt.isHorizontal = function (self) {
            return self == es.Edge.right || self == es.Edge.left;
        };
        EdgeExt.isVertical = function (self) {
            return self == es.Edge.top || self == es.Edge.bottom;
        };
        return EdgeExt;
    }());
    es.EdgeExt = EdgeExt;
})(es || (es = {}));
var es;
(function (es) {
    var FuncPack = (function () {
        function FuncPack(func, context) {
            this.func = func;
            this.context = context;
        }
        return FuncPack;
    }());
    es.FuncPack = FuncPack;
    var Emitter = (function () {
        function Emitter() {
            this._messageTable = new Map();
        }
        Emitter.prototype.addObserver = function (eventType, handler, context) {
            var list = this._messageTable.get(eventType);
            if (!list) {
                list = [];
                this._messageTable.set(eventType, list);
            }
            if (list.findIndex(function (funcPack) { return funcPack.func == handler; }) != -1)
                console.warn("您试图添加相同的观察者两次");
            list.push(new FuncPack(handler, context));
        };
        Emitter.prototype.removeObserver = function (eventType, handler) {
            var messageData = this._messageTable.get(eventType);
            var index = messageData.findIndex(function (data) { return data.func == handler; });
            if (index != -1)
                messageData.removeAt(index);
        };
        Emitter.prototype.emit = function (eventType, data) {
            var list = this._messageTable.get(eventType);
            if (list) {
                for (var i = list.length - 1; i >= 0; i--)
                    list[i].func.call(list[i].context, data);
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
    var Enumerable = (function () {
        function Enumerable() {
        }
        Enumerable.repeat = function (element, count) {
            var result = [];
            while (count--) {
                result.push(element);
            }
            return result;
        };
        return Enumerable;
    }());
    es.Enumerable = Enumerable;
})(es || (es = {}));
var es;
(function (es) {
    var EqualityComparer = (function () {
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
        return EqualityComparer;
    }());
    es.EqualityComparer = EqualityComparer;
})(es || (es = {}));
var es;
(function (es) {
    var GlobalManager = (function () {
        function GlobalManager() {
        }
        Object.defineProperty(GlobalManager.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
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
        GlobalManager.prototype.onEnabled = function () {
        };
        GlobalManager.prototype.onDisabled = function () {
        };
        GlobalManager.prototype.update = function () {
        };
        return GlobalManager;
    }());
    es.GlobalManager = GlobalManager;
})(es || (es = {}));
var es;
(function (es) {
    var ListPool = (function () {
        function ListPool() {
        }
        ListPool.warmCache = function (cacheCount) {
            cacheCount -= this._objectQueue.length;
            if (cacheCount > 0) {
                for (var i = 0; i < cacheCount; i++) {
                    this._objectQueue.unshift([]);
                }
            }
        };
        ListPool.trimCache = function (cacheCount) {
            while (cacheCount > this._objectQueue.length)
                this._objectQueue.shift();
        };
        ListPool.clearCache = function () {
            this._objectQueue.length = 0;
        };
        ListPool.obtain = function () {
            if (this._objectQueue.length > 0)
                return this._objectQueue.shift();
            return [];
        };
        ListPool.free = function (obj) {
            this._objectQueue.unshift(obj);
            obj.length = 0;
        };
        ListPool._objectQueue = [];
        return ListPool;
    }());
    es.ListPool = ListPool;
})(es || (es = {}));
var es;
(function (es) {
    var NumberExtension = (function () {
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
    var Pair = (function () {
        function Pair(first, second) {
            this.first = first;
            this.second = second;
        }
        Pair.prototype.clear = function () {
            this.first = this.second = null;
        };
        Pair.prototype.equals = function (other) {
            return this.first == other.first && this.second == other.second;
        };
        return Pair;
    }());
    es.Pair = Pair;
})(es || (es = {}));
var es;
(function (es) {
    var Pool = (function () {
        function Pool() {
        }
        Pool.warmCache = function (type, cacheCount) {
            cacheCount -= this._objectQueue.length;
            if (cacheCount > 0) {
                for (var i = 0; i < cacheCount; i++) {
                    this._objectQueue.unshift(new type());
                }
            }
        };
        Pool.trimCache = function (cacheCount) {
            while (cacheCount > this._objectQueue.length)
                this._objectQueue.shift();
        };
        Pool.clearCache = function () {
            this._objectQueue.length = 0;
        };
        Pool.obtain = function (type) {
            if (this._objectQueue.length > 0)
                return this._objectQueue.shift();
            return new type();
        };
        Pool.free = function (obj) {
            this._objectQueue.unshift(obj);
            if (es.isIPoolable(obj)) {
                obj["reset"]();
            }
        };
        Pool._objectQueue = [];
        return Pool;
    }());
    es.Pool = Pool;
    es.isIPoolable = function (props) { return typeof props['reset'] !== 'undefined'; };
})(es || (es = {}));
var RandomUtils = (function () {
    function RandomUtils() {
    }
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
    RandomUtils.randint = function (a, b) {
        a = Math.floor(a);
        b = Math.floor(b);
        if (a > b)
            a++;
        else
            b++;
        return this.randrange(a, b);
    };
    RandomUtils.randnum = function (a, b) {
        return this.random() * (b - a) + a;
    };
    RandomUtils.shuffle = function (array) {
        array.sort(this._randomCompare);
        return array;
    };
    RandomUtils.choice = function (sequence) {
        if (!sequence.hasOwnProperty("length"))
            throw new Error('无法对此对象执行此操作');
        var index = Math.floor(this.random() * sequence.length);
        if (sequence instanceof String)
            return String(sequence).charAt(index);
        else
            return sequence[index];
    };
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
    RandomUtils.random = function () {
        return Math.random();
    };
    RandomUtils.boolean = function (chance) {
        if (chance === void 0) { chance = .5; }
        return (this.random() < chance) ? true : false;
    };
    RandomUtils._randomCompare = function (a, b) {
        return (this.random() > .5) ? 1 : -1;
    };
    return RandomUtils;
}());
var es;
(function (es) {
    var RectangleExt = (function () {
        function RectangleExt() {
        }
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
        RectangleExt.union = function (first, point) {
            var rect = new es.Rectangle(point.x, point.y, 0, 0);
            var result = new es.Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, result.bottom) - result.y;
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
        return RectangleExt;
    }());
    es.RectangleExt = RectangleExt;
})(es || (es = {}));
var es;
(function (es) {
    var Ref = (function () {
        function Ref(value) {
            this.value = value;
        }
        return Ref;
    }());
    es.Ref = Ref;
})(es || (es = {}));
var es;
(function (es) {
    var SubpixelNumber = (function () {
        function SubpixelNumber() {
        }
        SubpixelNumber.prototype.update = function (amount) {
            this.remainder += amount;
            var motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            return motion;
        };
        SubpixelNumber.prototype.reset = function () {
            this.remainder = 0;
        };
        return SubpixelNumber;
    }());
    es.SubpixelNumber = SubpixelNumber;
})(es || (es = {}));
var es;
(function (es) {
    var Triangulator = (function () {
        function Triangulator() {
            this.triangleIndices = [];
            this._triPrev = new Array(12);
            this._triNext = new Array(12);
        }
        Triangulator.testPointTriangle = function (point, a, b, c) {
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, a), es.Vector2.subtract(b, a)) < 0)
                return false;
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, b), es.Vector2.subtract(c, b)) < 0)
                return false;
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, c), es.Vector2.subtract(a, c)) < 0)
                return false;
            return true;
        };
        Triangulator.prototype.triangulate = function (points, arePointsCCW) {
            if (arePointsCCW === void 0) { arePointsCCW = true; }
            var count = points.length;
            this.initialize(count);
            var iterations = 0;
            var index = 0;
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
                    this._triNext[this._triPrev[index]] = this._triNext[index];
                    this._triPrev[this._triNext[index]] = this._triPrev[index];
                    count--;
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
                this._triNext = new Array(Math.max(this._triNext.length * 2, count));
            }
            if (this._triPrev.length < count) {
                this._triPrev.reverse();
                this._triPrev = new Array(Math.max(this._triPrev.length * 2, count));
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
    var Vector2Ext = (function () {
        function Vector2Ext() {
        }
        Vector2Ext.isTriangleCCW = function (a, center, c) {
            return this.cross(es.Vector2.subtract(center, a), es.Vector2.subtract(c, center)) < 0;
        };
        Vector2Ext.halfVector = function () {
            return new es.Vector2(0.5, 0.5);
        };
        Vector2Ext.cross = function (u, v) {
            return u.y * v.x - u.x * v.y;
        };
        Vector2Ext.perpendicular = function (first, second) {
            return new es.Vector2(-1 * (second.y - first.y), second.x - first.x);
        };
        Vector2Ext.normalize = function (vec) {
            var magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
            if (magnitude > es.MathHelper.Epsilon) {
                vec.divide(new es.Vector2(magnitude));
            }
            else {
                vec.x = vec.y = 0;
            }
        };
        Vector2Ext.transformA = function (sourceArray, sourceIndex, matrix, destinationArray, destinationIndex, length) {
            for (var i = 0; i < length; i++) {
                var position = sourceArray[sourceIndex + i];
                var destination = destinationArray[destinationIndex + i];
                destination.x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
                destination.y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
                destinationArray[destinationIndex + i] = destination;
            }
        };
        Vector2Ext.transformR = function (position, matrix, result) {
            var x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
            var y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
            result.x = x;
            result.y = y;
        };
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
var WebGLUtils = (function () {
    function WebGLUtils() {
    }
    WebGLUtils.getContext = function () {
        var canvas = document.getElementsByTagName('canvas')[0];
        return canvas.getContext('2d');
    };
    return WebGLUtils;
}());
var stopwatch;
(function (stopwatch) {
    var Stopwatch = (function () {
        function Stopwatch(getSystemTime) {
            if (getSystemTime === void 0) { getSystemTime = _defaultSystemTimeGetter; }
            this.getSystemTime = getSystemTime;
            this._stopDuration = 0;
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
        Stopwatch.prototype.slice = function () {
            return this.recordPendingSlice();
        };
        Stopwatch.prototype.getCompletedSlices = function () {
            return Array.from(this._completeSlices);
        };
        Stopwatch.prototype.getCompletedAndPendingSlices = function () {
            return this._completeSlices.concat([this.getPendingSlice()]);
        };
        Stopwatch.prototype.getPendingSlice = function () {
            return this.calculatePendingSlice();
        };
        Stopwatch.prototype.getTime = function () {
            return this.caculateStopwatchTime();
        };
        Stopwatch.prototype.reset = function () {
            this._startSystemTime = this._pendingSliceStartStopwatchTime = this._stopSystemTime = undefined;
            this._stopDuration = 0;
            this._completeSlices = [];
        };
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
        Stopwatch.prototype.caculateStopwatchTime = function (endSystemTime) {
            if (this._startSystemTime === undefined)
                return 0;
            if (endSystemTime === undefined)
                endSystemTime = this.getSystemTimeOfCurrentStopwatchTime();
            return endSystemTime - this._startSystemTime - this._stopDuration;
        };
        Stopwatch.prototype.getSystemTimeOfCurrentStopwatchTime = function () {
            return this._stopSystemTime === undefined ? this.getSystemTime() : this._stopSystemTime;
        };
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
    stopwatch.Stopwatch = Stopwatch;
    var State;
    (function (State) {
        State["IDLE"] = "IDLE";
        State["RUNNING"] = "RUNNING";
        State["STOPPED"] = "STOPPED";
    })(State || (State = {}));
    function setDefaultSystemTimeGetter(systemTimeGetter) {
        if (systemTimeGetter === void 0) { systemTimeGetter = Date.now; }
        _defaultSystemTimeGetter = systemTimeGetter;
    }
    stopwatch.setDefaultSystemTimeGetter = setDefaultSystemTimeGetter;
    var _defaultSystemTimeGetter = Date.now;
})(stopwatch || (stopwatch = {}));
var es;
(function (es) {
    var Timer = (function () {
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
    var TimerManager = (function (_super) {
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
                    this._timers.removeAt(i);
                }
            }
        };
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
