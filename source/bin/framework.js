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
            if (JSON.stringify(array[i]) == JSON.stringify(value)) {
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
                var index2 = keys_1.findIndex(function (x) { return x === key; });
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
                var index = keys.findIndex(function (x) { return x === key; });
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
var Component = (function () {
    function Component() {
    }
    Component.prototype.update = function () {
    };
    Component.prototype.bind = function (displayRender) {
        this.displayRender = displayRender;
        return this;
    };
    return Component;
}());
var Entity = (function () {
    function Entity(name) {
        this._updateOrder = 0;
        this.name = name;
        this.transform = new Transform(this);
        this.components = [];
    }
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
    Entity.prototype.setUpdateOrder = function (updateOrder) {
        if (this._updateOrder != updateOrder) {
            this._updateOrder = updateOrder;
            if (this.scene) {
            }
            return this;
        }
    };
    Entity.prototype.attachToScene = function (newScene) {
        this.scene = newScene;
        newScene.entities.push(this);
        for (var i = 0; i < this.transform.childCount; i++) {
            this.transform.getChild(i).entity.attachToScene(newScene);
        }
    };
    Entity.prototype.addComponent = function (component) {
        component.entity = this;
        this.components.push(component);
        component.initialize();
        return component;
    };
    Entity.prototype.update = function () {
        this.components.forEach(function (component) { return component.update(); });
    };
    Entity.prototype.destory = function () {
        this.scene.entities.remove(this);
        this.transform.parent = null;
        for (var i = this.transform.childCount - 1; i >= 0; i--) {
            var child = this.transform.getChild(i);
            child.entity.destory();
        }
    };
    return Entity;
}());
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene(displayObject) {
        var _this = _super.call(this) || this;
        _this.entities = [];
        displayObject.stage.addChild(_this);
        _this.camera = _this.createEntity("camera").addComponent(new Camera());
        _this._projectionMatrix = new Matrix2D(0, 0, 0, 0, 0, 0);
        _this.addEventListener(egret.Event.ACTIVATE, _this.onActive, _this);
        _this.addEventListener(egret.Event.DEACTIVATE, _this.onDeactive, _this);
        _this.addEventListener(egret.Event.ENTER_FRAME, _this.update, _this);
        return _this;
    }
    Scene.prototype.createEntity = function (name) {
        var entity = new Entity(name);
        entity.transform.position = new Vector2(0, 0);
        return this.addEntity(entity);
    };
    Scene.prototype.addEntity = function (entity) {
        this.entities.push(entity);
        entity.scene = this;
        return entity;
    };
    Scene.prototype.setActive = function () {
        SceneManager.setActiveScene(this);
        return this;
    };
    Scene.prototype.initialize = function () {
    };
    Scene.prototype.onActive = function () {
    };
    Scene.prototype.onDeactive = function () {
    };
    Scene.prototype.update = function () {
        this.entities.forEach(function (entity) { return entity.update(); });
    };
    Scene.prototype.prepRenderState = function () {
        this._projectionMatrix.m11 = 2 / this.stage.width;
        this._projectionMatrix.m22 = -2 / this.stage.height;
        this._transformMatrix = this.camera.transformMatrix;
        this._matrixTransformMatrix = Matrix2D.multiply(this._transformMatrix, this._projectionMatrix);
    };
    Scene.prototype.destory = function () {
        this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
        this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);
        this.camera.destory();
        this.camera = null;
        this.entities.forEach(function (entity) { return entity.destory(); });
        this.entities.length = 0;
    };
    return Scene;
}(egret.DisplayObjectContainer));
var SceneManager = (function () {
    function SceneManager() {
    }
    SceneManager.createScene = function (name, scene) {
        scene.name = name;
        this._loadedScenes.set(name, scene);
        return scene;
    };
    SceneManager.setActiveScene = function (scene) {
        if (this._activeScene) {
            if (this._activeScene == scene)
                return;
            this._lastScene = this._activeScene;
            this._activeScene.destory();
        }
        this._activeScene = scene;
        this._activeScene.initialize();
        return scene;
    };
    SceneManager.getActiveScene = function () {
        return this._activeScene;
    };
    SceneManager._loadedScenes = new Map();
    return SceneManager;
}());
var Transform = (function () {
    function Transform(entity) {
        this._localRotation = 0;
        this._worldTransform = Matrix2D.identity;
        this._worldToLocalTransform = Matrix2D.identity;
        this._worldInverseTransform = Matrix2D.identity;
        this._rotation = 0;
        this.entity = entity;
        this._scale = this._localScale = Vector2.One;
        this._children = [];
    }
    Object.defineProperty(Transform.prototype, "childCount", {
        get: function () {
            return this._children.length;
        },
        enumerable: true,
        configurable: true
    });
    Transform.prototype.getChild = function (index) {
        return this._children[index];
    };
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
    Transform.prototype.setParent = function (parent) {
        if (this._parent == parent)
            return this;
        if (this._parent)
            this._parent._children.remove(this);
        if (parent)
            parent._children.push(this);
        this._parent = parent;
        return this;
    };
    Object.defineProperty(Transform.prototype, "position", {
        get: function () {
            this.updateTransform();
            if (!this.parent) {
                this._position = this._localPosition;
            }
            else {
                this.parent.updateTransform();
                this._position = Vector2.transform(this._localPosition, this.parent._worldTransform);
            }
            return this._position;
        },
        set: function (value) {
            this.setPosition(value);
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
    Transform.prototype.setLocalPosition = function (localPosition) {
        if (localPosition == this._localPosition)
            return this;
        this._localPosition = localPosition;
        return this;
    };
    Transform.prototype.setPosition = function (position) {
        if (position == this._position)
            return this;
        this._position = position;
        if (this.parent) {
            this.localPosition = Vector2.transform(this._position, this._worldToLocalTransform);
        }
        else {
            this.localPosition = position;
        }
        for (var i = 0; i < this.entity.components.length; i++) {
            var component = this.entity.components[i];
            if (component.displayRender) {
                component.displayRender.x = this.entity.scene.camera.transformMatrix.m31 + this.position.x;
                component.displayRender.y = this.entity.scene.camera.transformMatrix.m32 + this.position.y;
            }
        }
        return this;
    };
    Transform.prototype.updateTransform = function () {
        this._translationMatrix = Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y);
        this._rotationMatrix = Matrix2D.createRotation(this._localRotation);
        this._scaleMatrix = Matrix2D.createScale(this._localScale.x, this._localScale.y);
        this._localTransform = Matrix2D.multiply(this._scaleMatrix, this._rotationMatrix);
        this._localTransform = Matrix2D.multiply(this._localTransform, this._translationMatrix);
        if (!this.parent) {
            this._worldTransform = this._localTransform;
            this._rotation = this._localRotation;
            this._scale = this._localScale;
        }
        else {
            this._worldTransform = Matrix2D.multiply(this._localTransform, this.parent._worldTransform);
            this._rotation = this._localRotation + this.parent._rotation;
            this._scale = Vector2.multiply(this.parent._scale, this._localScale);
        }
    };
    return Transform;
}());
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera() {
        var _this = _super.call(this) || this;
        _this._transformMatrix = Matrix2D.identity;
        _this._inverseTransformMatrix = Matrix2D.identity;
        return _this;
    }
    Object.defineProperty(Camera.prototype, "transformMatrix", {
        get: function () {
            this.updateMatrixes();
            return this._transformMatrix;
        },
        enumerable: true,
        configurable: true
    });
    Camera.prototype.initialize = function () {
    };
    Camera.prototype.update = function () {
        var _this = this;
        SceneManager.getActiveScene().entities.forEach(function (entity) { return entity.components.forEach(function (component) {
            if (component.displayRender) {
                var has = _this.entity.scene.$children.indexOf(component.displayRender);
                if (has == -1) {
                    _this.entity.scene.stage.addChild(component.displayRender);
                }
            }
        }); });
    };
    Camera.prototype.setPosition = function (position) {
        this.entity.transform.setPosition(position);
        return this;
    };
    Camera.prototype.updateMatrixes = function () {
        this._transformMatrix = Matrix2D.createTranslation(-this.entity.transform.position.x, -this.entity.transform.position.y);
    };
    Camera.prototype.destory = function () {
    };
    return Camera;
}(Component));
var MathHelper = (function () {
    function MathHelper() {
    }
    MathHelper.toDegrees = function (radians) {
        return radians * 57.295779513082320876798154814105;
    };
    MathHelper.toRadians = function (degrees) {
        return degrees * 0.017453292519943295769236907684886;
    };
    return MathHelper;
}());
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
            return Matrix2D._identity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Matrix2D.prototype, "translation", {
        get: function () {
            return new Vector2(this.m31, this.m32);
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
            return MathHelper.toDegrees(this.rotation);
        },
        set: function (value) {
            this.rotation = MathHelper.toRadians(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Matrix2D.prototype, "scale", {
        get: function () {
            return new Vector2(this.m11, this.m22);
        },
        set: function (value) {
            this.m11 = value.x;
            this.m12 = value.y;
        },
        enumerable: true,
        configurable: true
    });
    Matrix2D.add = function (matrix1, matrix2) {
        matrix1.m11 += matrix2.m11;
        matrix1.m12 += matrix2.m12;
        matrix1.m21 += matrix2.m21;
        matrix1.m22 += matrix2.m22;
        matrix1.m31 += matrix2.m31;
        matrix1.m32 += matrix2.m32;
        return matrix1;
    };
    Matrix2D.divide = function (matrix1, matrix2) {
        matrix1.m11 /= matrix2.m11;
        matrix1.m12 /= matrix2.m12;
        matrix1.m21 /= matrix2.m21;
        matrix1.m22 /= matrix2.m22;
        matrix1.m31 /= matrix2.m31;
        matrix1.m32 /= matrix2.m32;
        return matrix1;
    };
    Matrix2D.multiply = function (matrix1, matrix2) {
        var m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
        var m12 = (matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);
        var m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
        var m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);
        var m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
        var m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;
        matrix1.m11 = m11;
        matrix1.m12 = m12;
        matrix1.m21 = m21;
        matrix1.m22 = m22;
        matrix1.m31 = m31;
        matrix1.m32 = m32;
        return matrix1;
    };
    Matrix2D.multiplyTranslation = function (matrix, x, y) {
        var trans = Matrix2D.createTranslation(x, y);
        return Matrix2D.multiply(matrix, trans);
    };
    Matrix2D.prototype.determinant = function () {
        return this.m11 * this.m22 - this.m12 * this.m21;
    };
    Matrix2D.invert = function (matrix, result) {
        var det = 1 / matrix.determinant();
        result.m11 = matrix.m22 * det;
        result.m12 = -matrix.m12 * det;
        result.m21 = -matrix.m21 * det;
        result.m22 = matrix.m11 * det;
        result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
        result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;
        return result;
    };
    Matrix2D.createTranslation = function (xPosition, yPosition, result) {
        if (result === void 0) { result = Matrix2D.identity; }
        result.m11 = 1;
        result.m12 = 0;
        result.m21 = 0;
        result.m22 = 1;
        result.m31 = xPosition;
        result.m32 = yPosition;
        return result;
    };
    Matrix2D.createRotation = function (radians, result) {
        result = Matrix2D.identity;
        var val1 = Math.cos(radians);
        var val2 = Math.sin(radians);
        result.m11 = val1;
        result.m12 = val2;
        result.m21 = -val2;
        result.m22 = val1;
        return result;
    };
    Matrix2D.createScale = function (xScale, yScale, result) {
        if (result === void 0) { result = Matrix2D.identity; }
        result.m11 = xScale;
        result.m12 = 0;
        result.m21 = 0;
        result.m22 = yScale;
        result.m31 = 0;
        result.m32 = 0;
        return result;
    };
    Matrix2D._identity = new Matrix2D(1, 0, 0, 1, 0, 0);
    return Matrix2D;
}());
var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Vector2, "One", {
        get: function () {
            return this.unitVector2;
        },
        enumerable: true,
        configurable: true
    });
    Vector2.add = function (value1, value2) {
        value1.x += value2.x;
        value1.y += value2.y;
        return value1;
    };
    Vector2.divide = function (value1, value2) {
        value1.x /= value2.x;
        value1.y /= value2.y;
        return value1;
    };
    Vector2.multiply = function (value1, value2) {
        value1.x *= value2.x;
        value1.y *= value2.y;
        return value1;
    };
    Vector2.subtract = function (value1, value2) {
        value1.x -= value2.x;
        value1.y -= value2.y;
        return value1;
    };
    Vector2.prototype.normalize = function () {
        var val = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y));
        this.x *= val;
        this.y *= val;
    };
    Vector2.transform = function (position, matrix) {
        return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21), (position.x * matrix.m12) + (position.y * matrix.m22));
    };
    Vector2.unitVector2 = new Vector2(1, 1);
    return Vector2;
}());
