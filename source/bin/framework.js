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
var PriorityQueueNode = (function () {
    function PriorityQueueNode() {
        this.priority = 0;
        this.insertionIndex = 0;
        this.queueIndex = 0;
    }
    return PriorityQueueNode;
}());
var AStarPathfinder = (function () {
    function AStarPathfinder() {
    }
    AStarPathfinder.search = function (graph, start, goal) {
        var _this = this;
        var foundPath = false;
        var cameFrom = new Map();
        cameFrom.set(start, start);
        var costSoFar = new Map();
        var frontier = new PriorityQueue(1000);
        frontier.enqueue(new AStarNode(start), 0);
        costSoFar.set(start, 0);
        var _loop_2 = function () {
            var current = frontier.dequeue();
            if (JSON.stringify(current.data) == JSON.stringify(goal)) {
                foundPath = true;
                return "break";
            }
            graph.getNeighbors(current.data).forEach(function (next) {
                var newCost = costSoFar.get(current.data) + graph.cost(current.data, next);
                if (!_this.hasKey(costSoFar, next) || newCost < costSoFar.get(next)) {
                    costSoFar.set(next, newCost);
                    var priority = newCost + graph.heuristic(next, goal);
                    frontier.enqueue(new AStarNode(next), priority);
                    cameFrom.set(next, current.data);
                }
            });
        };
        while (frontier.count > 0) {
            var state_1 = _loop_2();
            if (state_1 === "break")
                break;
        }
        return foundPath ? this.recontructPath(cameFrom, start, goal) : null;
    };
    AStarPathfinder.hasKey = function (map, compareKey) {
        var iterator = map.keys();
        var r;
        while (r = iterator.next(), !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return true;
        }
        return false;
    };
    AStarPathfinder.getKey = function (map, compareKey) {
        var iterator = map.keys();
        var valueIterator = map.values();
        var r;
        var v;
        while (r = iterator.next(), v = valueIterator.next(), !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return v.value;
        }
        return null;
    };
    AStarPathfinder.recontructPath = function (cameFrom, start, goal) {
        var path = [];
        var current = goal;
        path.push(goal);
        while (current != start) {
            current = this.getKey(cameFrom, current);
            path.push(current);
        }
        path.reverse();
        return path;
    };
    return AStarPathfinder;
}());
var AStarNode = (function (_super) {
    __extends(AStarNode, _super);
    function AStarNode(data) {
        var _this = _super.call(this) || this;
        _this.data = data;
        return _this;
    }
    return AStarNode;
}(PriorityQueueNode));
var AstarGridGraph = (function () {
    function AstarGridGraph(width, height) {
        this.dirs = [
            new Vector2(1, 0),
            new Vector2(0, -1),
            new Vector2(-1, 0),
            new Vector2(0, 1)
        ];
        this.walls = [];
        this.weightedNodes = [];
        this.defaultWeight = 1;
        this.weightedNodeWeight = 5;
        this._neighbors = new Array(4);
        this._width = width;
        this._height = height;
    }
    AstarGridGraph.prototype.isNodeInBounds = function (node) {
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
    };
    AstarGridGraph.prototype.isNodePassable = function (node) {
        return !this.walls.firstOrDefault(function (wall) { return JSON.stringify(wall) == JSON.stringify(node); });
    };
    AstarGridGraph.prototype.search = function (start, goal) {
        return AStarPathfinder.search(this, start, goal);
    };
    AstarGridGraph.prototype.getNeighbors = function (node) {
        var _this = this;
        this._neighbors.length = 0;
        this.dirs.forEach(function (dir) {
            var next = new Vector2(node.x + dir.x, node.y + dir.y);
            if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                _this._neighbors.push(next);
        });
        return this._neighbors;
    };
    AstarGridGraph.prototype.cost = function (from, to) {
        return this.weightedNodes.find(function (p) { return JSON.stringify(p) == JSON.stringify(to); }) ? this.weightedNodeWeight : this.defaultWeight;
    };
    AstarGridGraph.prototype.heuristic = function (node, goal) {
        return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
    };
    return AstarGridGraph;
}());
var PriorityQueue = (function () {
    function PriorityQueue(maxNodes) {
        this._numNodes = 0;
        this._nodes = new Array(maxNodes + 1);
        this._numNodesEverEnqueued = 0;
    }
    PriorityQueue.prototype.clear = function () {
        this._nodes.splice(1, this._numNodes);
        this._numNodes = 0;
    };
    Object.defineProperty(PriorityQueue.prototype, "count", {
        get: function () {
            return this._numNodes;
        },
        enumerable: true,
        configurable: true
    });
    PriorityQueue.prototype.contains = function (node) {
        return (this._nodes[node.queueIndex] == node);
    };
    PriorityQueue.prototype.enqueue = function (node, priority) {
        node.priority = priority;
        this._numNodes++;
        this._nodes[this._numNodes] = node;
        node.queueIndex = this._numNodes;
        node.insertionIndex = this._numNodesEverEnqueued++;
        this.cascadeUp(this._nodes[this._numNodes]);
    };
    PriorityQueue.prototype.dequeue = function () {
        var returnMe = this._nodes[1];
        this.remove(returnMe);
        return returnMe;
    };
    PriorityQueue.prototype.remove = function (node) {
        if (node.queueIndex == this._numNodes) {
            this._nodes[this._numNodes] = null;
            this._numNodes--;
            return;
        }
        var formerLastNode = this._nodes[this._numNodes];
        this.swap(node, formerLastNode);
        delete this._nodes[this._numNodes];
        this._numNodes--;
        this.onNodeUpdated(formerLastNode);
    };
    PriorityQueue.prototype.isValidQueue = function () {
        for (var i = 1; i < this._nodes.length; i++) {
            if (this._nodes[i]) {
                var childLeftIndex = 2 * i;
                if (childLeftIndex < this._nodes.length && this._nodes[childLeftIndex] &&
                    this.hasHigherPriority(this._nodes[childLeftIndex], this._nodes[i]))
                    return false;
                var childRightIndex = childLeftIndex + 1;
                if (childRightIndex < this._nodes.length && this._nodes[childRightIndex] &&
                    this.hasHigherPriority(this._nodes[childRightIndex], this._nodes[i]))
                    return false;
            }
        }
        return true;
    };
    PriorityQueue.prototype.onNodeUpdated = function (node) {
        var parentIndex = Math.floor(node.queueIndex / 2);
        var parentNode = this._nodes[parentIndex];
        if (parentIndex > 0 && this.hasHigherPriority(node, parentNode)) {
            this.cascadeUp(node);
        }
        else {
            this.cascadeDown(node);
        }
    };
    PriorityQueue.prototype.cascadeDown = function (node) {
        var newParent;
        var finalQueueIndex = node.queueIndex;
        while (true) {
            newParent = node;
            var childLeftIndex = 2 * finalQueueIndex;
            if (childLeftIndex > this._numNodes) {
                node.queueIndex = finalQueueIndex;
                this._nodes[finalQueueIndex] = node;
                break;
            }
            var childLeft = this._nodes[childLeftIndex];
            if (this.hasHigherPriority(childLeft, newParent)) {
                newParent = childLeft;
            }
            var childRightIndex = childLeftIndex + 1;
            if (childRightIndex <= this._numNodes) {
                var childRight = this._nodes[childRightIndex];
                if (this.hasHigherPriority(childRight, newParent)) {
                    newParent = childRight;
                }
            }
            if (newParent != node) {
                this._nodes[finalQueueIndex] = newParent;
                var temp = newParent.queueIndex;
                newParent.queueIndex = finalQueueIndex;
                finalQueueIndex = temp;
            }
            else {
                node.queueIndex = finalQueueIndex;
                this._nodes[finalQueueIndex] = node;
                break;
            }
        }
    };
    PriorityQueue.prototype.cascadeUp = function (node) {
        var parent = Math.floor(node.queueIndex / 2);
        while (parent >= 1) {
            var parentNode = this._nodes[parent];
            if (this.hasHigherPriority(parentNode, node))
                break;
            this.swap(node, parentNode);
            parent = Math.floor(node.queueIndex / 2);
        }
    };
    PriorityQueue.prototype.swap = function (node1, node2) {
        this._nodes[node1.queueIndex] = node2;
        this._nodes[node2.queueIndex] = node1;
        var temp = node1.queueIndex;
        node1.queueIndex = node2.queueIndex;
        node2.queueIndex = temp;
    };
    PriorityQueue.prototype.hasHigherPriority = function (higher, lower) {
        return (higher.priority < lower.priority ||
            (higher.priority == lower.priority && higher.insertionIndex < lower.insertionIndex));
    };
    return PriorityQueue;
}());
var BreadthFirstPathfinder = (function () {
    function BreadthFirstPathfinder() {
    }
    BreadthFirstPathfinder.search = function (graph, start, goal) {
        var _this = this;
        var foundPath = false;
        var frontier = [];
        frontier.unshift(start);
        var cameFrom = new Map();
        cameFrom.set(start, start);
        var _loop_3 = function () {
            var current = frontier.shift();
            if (JSON.stringify(current) == JSON.stringify(goal)) {
                foundPath = true;
                return "break";
            }
            graph.getNeighbors(current).forEach(function (next) {
                if (!_this.hasKey(cameFrom, next)) {
                    frontier.unshift(next);
                    cameFrom.set(next, current);
                }
            });
        };
        while (frontier.length > 0) {
            var state_2 = _loop_3();
            if (state_2 === "break")
                break;
        }
        return foundPath ? AStarPathfinder.recontructPath(cameFrom, start, goal) : null;
    };
    BreadthFirstPathfinder.hasKey = function (map, compareKey) {
        var iterator = map.keys();
        var r;
        while (r = iterator.next(), !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return true;
        }
        return false;
    };
    return BreadthFirstPathfinder;
}());
var UnweightedGraph = (function () {
    function UnweightedGraph() {
        this.edges = new Map();
    }
    UnweightedGraph.prototype.addEdgesForNode = function (node, edges) {
        this.edges.set(node, edges);
        return this;
    };
    UnweightedGraph.prototype.getNeighbors = function (node) {
        return this.edges.get(node);
    };
    return UnweightedGraph;
}());
var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x ? x : 0;
        this.y = y ? y : this.x;
    }
    Object.defineProperty(Vector2, "zero", {
        get: function () {
            return Vector2.zeroVector2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector2, "one", {
        get: function () {
            return Vector2.unitVector2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector2, "unitX", {
        get: function () {
            return Vector2.unitXVector;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector2, "unitY", {
        get: function () {
            return Vector2.unitYVector;
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
    Vector2.prototype.normalize = function () {
        var val = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y));
        this.x *= val;
        this.y *= val;
    };
    Vector2.prototype.length = function () {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };
    Vector2.prototype.round = function () {
        return new Vector2(Math.round(this.x), Math.round(this.y));
    };
    Vector2.normalize = function (value) {
        var val = 1 / Math.sqrt((value.x * value.x) + (value.y * value.y));
        value.x *= val;
        value.y *= val;
        return value;
    };
    Vector2.dot = function (value1, value2) {
        return (value1.x * value2.x) + (value1.y * value2.y);
    };
    Vector2.distanceSquared = function (value1, value2) {
        var v1 = value1.x - value2.x, v2 = value1.y - value2.y;
        return (v1 * v1) + (v2 * v2);
    };
    Vector2.clamp = function (value1, min, max) {
        return new Vector2(MathHelper.clamp(value1.x, min.x, max.x), MathHelper.clamp(value1.y, min.y, max.y));
    };
    Vector2.lerp = function (value1, value2, amount) {
        return new Vector2(MathHelper.lerp(value1.x, value2.x, amount), MathHelper.lerp(value1.y, value2.y, amount));
    };
    Vector2.transform = function (position, matrix) {
        return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21), (position.x * matrix.m12) + (position.y * matrix.m22));
    };
    Vector2.distance = function (value1, value2) {
        var v1 = value1.x - value2.x, v2 = value1.y - value2.y;
        return Math.sqrt((v1 * v1) + (v2 * v2));
    };
    Vector2.negate = function (value) {
        var result = new Vector2();
        result.x = -value.x;
        result.y = -value.y;
        return result;
    };
    Vector2.unitYVector = new Vector2(0, 1);
    Vector2.unitXVector = new Vector2(1, 0);
    Vector2.unitVector2 = new Vector2(1, 1);
    Vector2.zeroVector2 = new Vector2(0, 0);
    return Vector2;
}());
var UnweightedGridGraph = (function () {
    function UnweightedGridGraph(width, height, allowDiagonalSearch) {
        if (allowDiagonalSearch === void 0) { allowDiagonalSearch = false; }
        this.walls = [];
        this._neighbors = new Array(4);
        this._width = width;
        this._hegiht = height;
        this._dirs = allowDiagonalSearch ? UnweightedGridGraph.COMPASS_DIRS : UnweightedGridGraph.CARDINAL_DIRS;
    }
    UnweightedGridGraph.prototype.isNodeInBounds = function (node) {
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._hegiht;
    };
    UnweightedGridGraph.prototype.isNodePassable = function (node) {
        return !this.walls.firstOrDefault(function (wall) { return JSON.stringify(wall) == JSON.stringify(node); });
    };
    UnweightedGridGraph.prototype.getNeighbors = function (node) {
        var _this = this;
        this._neighbors.length = 0;
        this._dirs.forEach(function (dir) {
            var next = new Vector2(node.x + dir.x, node.y + dir.y);
            if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                _this._neighbors.push(next);
        });
        return this._neighbors;
    };
    UnweightedGridGraph.prototype.search = function (start, goal) {
        return BreadthFirstPathfinder.search(this, start, goal);
    };
    UnweightedGridGraph.CARDINAL_DIRS = [
        new Vector2(1, 0),
        new Vector2(0, -1),
        new Vector2(-1, 0),
        new Vector2(0, -1)
    ];
    UnweightedGridGraph.COMPASS_DIRS = [
        new Vector2(1, 0),
        new Vector2(1, -1),
        new Vector2(0, -1),
        new Vector2(-1, -1),
        new Vector2(-1, 0),
        new Vector2(-1, 1),
        new Vector2(0, 1),
        new Vector2(1, 1),
    ];
    return UnweightedGridGraph;
}());
var WeightedGridGraph = (function () {
    function WeightedGridGraph(width, height, allowDiagonalSearch) {
        if (allowDiagonalSearch === void 0) { allowDiagonalSearch = false; }
        this.walls = [];
        this.weightedNodes = [];
        this.defaultWeight = 1;
        this.weightedNodeWeight = 5;
        this._neighbors = new Array(4);
        this._width = width;
        this._height = height;
        this._dirs = allowDiagonalSearch ? WeightedGridGraph.COMPASS_DIRS : WeightedGridGraph.CARDINAL_DIRS;
    }
    WeightedGridGraph.prototype.isNodeInBounds = function (node) {
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
    };
    WeightedGridGraph.prototype.isNodePassable = function (node) {
        return !this.walls.firstOrDefault(function (wall) { return JSON.stringify(wall) == JSON.stringify(node); });
    };
    WeightedGridGraph.prototype.search = function (start, goal) {
        return WeightedPathfinder.search(this, start, goal);
    };
    WeightedGridGraph.prototype.getNeighbors = function (node) {
        var _this = this;
        this._neighbors.length = 0;
        this._dirs.forEach(function (dir) {
            var next = new Vector2(node.x + dir.x, node.y + dir.y);
            if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                _this._neighbors.push(next);
        });
        return this._neighbors;
    };
    WeightedGridGraph.prototype.cost = function (from, to) {
        return this.weightedNodes.find(function (t) { return JSON.stringify(t) == JSON.stringify(to); }) ? this.weightedNodeWeight : this.defaultWeight;
    };
    WeightedGridGraph.CARDINAL_DIRS = [
        new Vector2(1, 0),
        new Vector2(0, -1),
        new Vector2(-1, 0),
        new Vector2(0, 1)
    ];
    WeightedGridGraph.COMPASS_DIRS = [
        new Vector2(1, 0),
        new Vector2(1, -1),
        new Vector2(0, -1),
        new Vector2(-1, -1),
        new Vector2(-1, 0),
        new Vector2(-1, 1),
        new Vector2(0, 1),
        new Vector2(1, 1),
    ];
    return WeightedGridGraph;
}());
var WeightedNode = (function (_super) {
    __extends(WeightedNode, _super);
    function WeightedNode(data) {
        var _this = _super.call(this) || this;
        _this.data = data;
        return _this;
    }
    return WeightedNode;
}(PriorityQueueNode));
var WeightedPathfinder = (function () {
    function WeightedPathfinder() {
    }
    WeightedPathfinder.search = function (graph, start, goal) {
        var _this = this;
        var foundPath = false;
        var cameFrom = new Map();
        cameFrom.set(start, start);
        var costSoFar = new Map();
        var frontier = new PriorityQueue(1000);
        frontier.enqueue(new WeightedNode(start), 0);
        costSoFar.set(start, 0);
        var _loop_4 = function () {
            var current = frontier.dequeue();
            if (JSON.stringify(current.data) == JSON.stringify(goal)) {
                foundPath = true;
                return "break";
            }
            graph.getNeighbors(current.data).forEach(function (next) {
                var newCost = costSoFar.get(current.data) + graph.cost(current.data, next);
                if (!_this.hasKey(costSoFar, next) || newCost < costSoFar.get(next)) {
                    costSoFar.set(next, newCost);
                    var priprity = newCost;
                    frontier.enqueue(new WeightedNode(next), priprity);
                    cameFrom.set(next, current.data);
                }
            });
        };
        while (frontier.count > 0) {
            var state_3 = _loop_4();
            if (state_3 === "break")
                break;
        }
        return foundPath ? this.recontructPath(cameFrom, start, goal) : null;
    };
    WeightedPathfinder.hasKey = function (map, compareKey) {
        var iterator = map.keys();
        var r;
        while (r = iterator.next(), !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return true;
        }
        return false;
    };
    WeightedPathfinder.getKey = function (map, compareKey) {
        var iterator = map.keys();
        var valueIterator = map.values();
        var r;
        var v;
        while (r = iterator.next(), v = valueIterator.next(), !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return v.value;
        }
        return null;
    };
    WeightedPathfinder.recontructPath = function (cameFrom, start, goal) {
        var path = [];
        var current = goal;
        path.push(goal);
        while (current != start) {
            current = this.getKey(cameFrom, current);
            path.push(current);
        }
        path.reverse();
        return path;
    };
    return WeightedPathfinder;
}());
var DebugDefaults = (function () {
    function DebugDefaults() {
    }
    DebugDefaults.verletParticle = 0xDC345E;
    DebugDefaults.verletConstraintEdge = 0x433E36;
    return DebugDefaults;
}());
var Component = (function (_super) {
    __extends(Component, _super);
    function Component() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._enabled = true;
        _this.updateInterval = 1;
        return _this;
    }
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
    Component.prototype.initialize = function () {
    };
    Component.prototype.onAddedToEntity = function () {
    };
    Component.prototype.onRemovedFromEntity = function () {
    };
    Component.prototype.onEnabled = function () {
    };
    Component.prototype.onDisabled = function () {
    };
    Component.prototype.update = function () {
    };
    Component.prototype.debugRender = function () {
    };
    Component.prototype.onEntityTransformChanged = function (comp) {
    };
    Component.prototype.registerComponent = function () {
        this.entity.componentBits.set(ComponentTypeManager.getIndexFor(this), false);
        this.entity.scene.entityProcessors.onComponentAdded(this.entity);
    };
    Component.prototype.deregisterComponent = function () {
        this.entity.componentBits.set(ComponentTypeManager.getIndexFor(this));
        this.entity.scene.entityProcessors.onComponentRemoved(this.entity);
    };
    return Component;
}(egret.DisplayObjectContainer));
var Entity = (function (_super) {
    __extends(Entity, _super);
    function Entity(name) {
        var _this = _super.call(this) || this;
        _this._updateOrder = 0;
        _this._enabled = true;
        _this._tag = 0;
        _this.name = name;
        _this.components = new ComponentList(_this);
        _this.id = Entity._idGenerator++;
        _this.componentBits = new BitSet();
        return _this;
    }
    Object.defineProperty(Entity.prototype, "isDestoryed", {
        get: function () {
            return this._isDestoryed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "position", {
        get: function () {
            return new Vector2(this.x, this.y);
        },
        set: function (value) {
            this.$setX(value.x);
            this.$setY(value.y);
            this.onEntityTransformChanged(TransformComponent.position);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "scale", {
        get: function () {
            return new Vector2(this.scaleX, this.scaleY);
        },
        set: function (value) {
            this.$setScaleX(value.x);
            this.$setScaleY(value.y);
            this.onEntityTransformChanged(TransformComponent.scale);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "rotation", {
        set: function (value) {
            this.$setRotation(value);
            this.onEntityTransformChanged(TransformComponent.rotation);
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
    Entity.prototype.setEnabled = function (isEnabled) {
        if (this._enabled != isEnabled) {
            this._enabled = isEnabled;
        }
        return this;
    };
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
    Object.defineProperty(Entity.prototype, "stage", {
        get: function () {
            if (!this.scene)
                return null;
            return this.scene.stage;
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
    Entity.prototype.roundPosition = function () {
        this.position = Vector2Ext.round(this.position);
    };
    Entity.prototype.setUpdateOrder = function (updateOrder) {
        if (this._updateOrder != updateOrder) {
            this._updateOrder = updateOrder;
            if (this.scene) {
            }
            return this;
        }
    };
    Entity.prototype.setTag = function (tag) {
        if (this._tag != tag) {
            if (this.scene) {
                this.scene.entities.removeFromTagList(this);
            }
            this._tag = tag;
            if (this.scene) {
                this.scene.entities.addToTagList(this);
            }
        }
        return this;
    };
    Entity.prototype.attachToScene = function (newScene) {
        this.scene = newScene;
        newScene.entities.add(this);
        this.components.registerAllComponents();
        for (var i = 0; i < this.numChildren; i++) {
            this.getChildAt(i).entity.attachToScene(newScene);
        }
    };
    Entity.prototype.detachFromScene = function () {
        this.scene.entities.remove(this);
        this.components.deregisterAllComponents();
        for (var i = 0; i < this.numChildren; i++)
            this.getChildAt(i).entity.detachFromScene();
    };
    Entity.prototype.addComponent = function (component) {
        component.entity = this;
        this.components.add(component);
        this.addChild(component);
        component.initialize();
        return component;
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
    Entity.prototype.getComponent = function (type) {
        return this.components.getComponent(type, false);
    };
    Entity.prototype.getComponents = function (typeName, componentList) {
        return this.components.getComponents(typeName, componentList);
    };
    Entity.prototype.onEntityTransformChanged = function (comp) {
        this.components.onEntityTransformChanged(comp);
    };
    Entity.prototype.removeComponentForType = function (type) {
        var comp = this.getComponent(type);
        if (comp) {
            this.removeComponent(comp);
            return true;
        }
        return false;
    };
    Entity.prototype.removeComponent = function (component) {
        this.components.remove(component);
    };
    Entity.prototype.removeAllComponents = function () {
        for (var i = 0; i < this.components.count; i++) {
            this.removeComponent(this.components.buffer[i]);
        }
    };
    Entity.prototype.update = function () {
        this.components.update();
    };
    Entity.prototype.onAddedToScene = function () {
    };
    Entity.prototype.onRemovedFromScene = function () {
        if (this._isDestoryed)
            this.components.removeAllComponents();
    };
    Entity.prototype.destroy = function () {
        this._isDestoryed = true;
        this.scene.entities.remove(this);
        this.removeChildren();
        for (var i = this.numChildren - 1; i >= 0; i--) {
            var child = this.getChildAt(i);
            child.entity.destroy();
        }
    };
    return Entity;
}(egret.DisplayObjectContainer));
var TransformComponent;
(function (TransformComponent) {
    TransformComponent[TransformComponent["rotation"] = 0] = "rotation";
    TransformComponent[TransformComponent["scale"] = 1] = "scale";
    TransformComponent[TransformComponent["position"] = 2] = "position";
})(TransformComponent || (TransformComponent = {}));
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene() {
        var _this = _super.call(this) || this;
        _this.enablePostProcessing = true;
        _this._renderers = [];
        _this._postProcessors = [];
        _this.entityProcessors = new EntityProcessorList();
        _this.renderableComponents = new RenderableComponentList();
        _this.entities = new EntityList(_this);
        _this.content = new ContentManager();
        _this.width = SceneManager.stage.stageWidth;
        _this.height = SceneManager.stage.stageHeight;
        _this.addEventListener(egret.Event.ACTIVATE, _this.onActive, _this);
        _this.addEventListener(egret.Event.DEACTIVATE, _this.onDeactive, _this);
        return _this;
    }
    Scene.prototype.createEntity = function (name) {
        var entity = new Entity(name);
        entity.position = new Vector2(0, 0);
        return this.addEntity(entity);
    };
    Scene.prototype.addEntity = function (entity) {
        this.entities.add(entity);
        entity.scene = this;
        this.addChild(entity);
        for (var i = 0; i < entity.numChildren; i++)
            this.addEntity(entity.getChildAt(i).entity);
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
        this._renderers.remove(renderer);
        renderer.unload();
    };
    Scene.prototype.begin = function () {
        if (SceneManager.sceneTransition) {
            SceneManager.stage.addChildAt(this, SceneManager.stage.numChildren - 1);
        }
        else {
            SceneManager.stage.addChild(this);
        }
        if (this._renderers.length == 0) {
            this.addRenderer(new DefaultRenderer());
            console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
        }
        this.camera = this.createEntity("camera").getOrCreateComponent(new Camera());
        Physics.reset();
        if (this.entityProcessors)
            this.entityProcessors.begin();
        this.camera.onSceneSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
        this._didSceneBegin = true;
        this.onStart();
    };
    Scene.prototype.end = function () {
        this._didSceneBegin = false;
        this.removeEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
        this.removeEventListener(egret.Event.ACTIVATE, this.onActive, this);
        for (var i = 0; i < this._renderers.length; i++) {
            this._renderers[i].unload();
        }
        for (var i = 0; i < this._postProcessors.length; i++) {
            this._postProcessors[i].unload();
        }
        this.entities.removeAllEntities();
        this.removeChildren();
        Physics.clear();
        this.camera = null;
        this.content.dispose();
        if (this.entityProcessors)
            this.entityProcessors.end();
        this.unload();
        if (this.parent)
            this.parent.removeChild(this);
    };
    Scene.prototype.onStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2];
            });
        });
    };
    Scene.prototype.onActive = function () {
    };
    Scene.prototype.onDeactive = function () {
    };
    Scene.prototype.unload = function () { };
    Scene.prototype.update = function () {
        this.entities.updateLists();
        if (this.entityProcessors)
            this.entityProcessors.update();
        this.entities.update();
        if (this.entityProcessors)
            this.entityProcessors.lateUpdate();
        this.renderableComponents.updateList();
    };
    Scene.prototype.postRender = function () {
        var enabledCounter = 0;
        if (this.enablePostProcessing) {
            for (var i = 0; i < this._postProcessors.length; i++) {
                if (this._postProcessors[i].enable) {
                    var isEven = MathHelper.isEven(enabledCounter);
                    enabledCounter++;
                    this._postProcessors[i].process();
                }
            }
        }
    };
    Scene.prototype.render = function () {
        for (var i = 0; i < this._renderers.length; i++) {
            this._renderers[i].render(this);
        }
    };
    Scene.prototype.addPostProcessor = function (postProcessor) {
        this._postProcessors.push(postProcessor);
        this._postProcessors.sort();
        postProcessor.onAddedToScene(this);
        if (this._didSceneBegin) {
            postProcessor.onSceneBackBufferSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
        }
        return postProcessor;
    };
    return Scene;
}(egret.DisplayObjectContainer));
var SceneManager = (function () {
    function SceneManager(stage) {
        stage.addEventListener(egret.Event.ENTER_FRAME, SceneManager.update, this);
        SceneManager.stage = stage;
        SceneManager.initialize(stage);
    }
    Object.defineProperty(SceneManager, "scene", {
        get: function () {
            return this._scene;
        },
        set: function (value) {
            if (!value)
                throw new Error("场景不能为空");
            if (this._scene == null) {
                this._scene = value;
                this._scene.begin();
            }
            else {
                this._nextScene = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    SceneManager.initialize = function (stage) {
        Input.initialize(stage);
    };
    SceneManager.update = function () {
        Time.update(egret.getTimer());
        if (SceneManager._scene) {
            for (var i = GlobalManager.globalManagers.length - 1; i >= 0; i--) {
                if (GlobalManager.globalManagers[i].enabled)
                    GlobalManager.globalManagers[i].update();
            }
            if (!SceneManager.sceneTransition ||
                (SceneManager.sceneTransition && (!SceneManager.sceneTransition.loadsNewScene || SceneManager.sceneTransition.isNewSceneLoaded))) {
                SceneManager._scene.update();
            }
            if (SceneManager._nextScene) {
                SceneManager._scene.end();
                for (var i = 0; i < SceneManager._scene.entities.buffer.length; i++) {
                    var entity = SceneManager._scene.entities.buffer[i];
                    entity.destroy();
                }
                SceneManager._scene = SceneManager._nextScene;
                SceneManager._nextScene = null;
                SceneManager._scene.begin();
            }
        }
        SceneManager.render();
    };
    SceneManager.render = function () {
        if (this.sceneTransition) {
            this.sceneTransition.preRender();
            if (this._scene && !this.sceneTransition.hasPreviousSceneRender) {
                this._scene.render();
                this._scene.postRender();
                this.sceneTransition.onBeginTransition();
            }
            else if (this.sceneTransition) {
                if (this._scene && this.sceneTransition.isNewSceneLoaded) {
                    this._scene.render();
                    this._scene.postRender();
                }
                this.sceneTransition.render();
            }
        }
        else if (this._scene) {
            this._scene.render();
            this._scene.postRender();
        }
    };
    SceneManager.startSceneTransition = function (sceneTransition) {
        if (this.sceneTransition) {
            console.warn("在前一个场景完成之前，不能开始一个新的场景转换。");
            return;
        }
        this.sceneTransition = sceneTransition;
        return sceneTransition;
    };
    return SceneManager;
}());
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera() {
        var _this = _super.call(this) || this;
        _this._origin = Vector2.zero;
        _this._minimumZoom = 0.3;
        _this._maximumZoom = 3;
        _this._position = Vector2.zero;
        _this.followLerp = 0.1;
        _this.deadzone = new Rectangle();
        _this.focusOffset = new Vector2();
        _this.mapLockEnabled = false;
        _this.mapSize = new Vector2();
        _this._worldSpaceDeadZone = new Rectangle();
        _this._desiredPositionDelta = new Vector2();
        _this.cameraStyle = CameraStyle.lockOn;
        _this.width = SceneManager.stage.stageWidth;
        _this.height = SceneManager.stage.stageHeight;
        _this.setZoom(0);
        return _this;
    }
    Object.defineProperty(Camera.prototype, "zoom", {
        get: function () {
            if (this._zoom == 0)
                return 1;
            if (this._zoom < 1)
                return MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);
            return MathHelper.map(this._zoom, 1, this._maximumZoom, 0, 1);
        },
        set: function (value) {
            this.setZoom(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "minimumZoom", {
        get: function () {
            return this._minimumZoom;
        },
        set: function (value) {
            this.setMinimumZoom(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "maximumZoom", {
        get: function () {
            return this._maximumZoom;
        },
        set: function (value) {
            this.setMaximumZoom(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "origin", {
        get: function () {
            return this._origin;
        },
        set: function (value) {
            if (this._origin != value) {
                this._origin = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "position", {
        get: function () {
            return this._position;
        },
        set: function (value) {
            this._position = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "x", {
        get: function () {
            return this._position.x;
        },
        set: function (value) {
            this._position.x = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "y", {
        get: function () {
            return this._position.y;
        },
        set: function (value) {
            this._position.y = value;
        },
        enumerable: true,
        configurable: true
    });
    Camera.prototype.onSceneSizeChanged = function (newWidth, newHeight) {
        var oldOrigin = this._origin;
        this.origin = new Vector2(newWidth / 2, newHeight / 2);
        this.entity.position = Vector2.add(this.entity.position, Vector2.subtract(this._origin, oldOrigin));
    };
    Camera.prototype.setMinimumZoom = function (minZoom) {
        if (this._zoom < minZoom)
            this._zoom = this.minimumZoom;
        this._minimumZoom = minZoom;
        return this;
    };
    Camera.prototype.setMaximumZoom = function (maxZoom) {
        if (this._zoom > maxZoom)
            this._zoom = maxZoom;
        this._maximumZoom = maxZoom;
        return this;
    };
    Camera.prototype.setZoom = function (zoom) {
        var newZoom = MathHelper.clamp(zoom, -1, 1);
        if (newZoom == 0) {
            this._zoom = 1;
        }
        else if (newZoom < 0) {
            this._zoom = MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
        }
        else {
            this._zoom = MathHelper.map(newZoom, 0, 1, 1, this._maximumZoom);
        }
        SceneManager.scene.scaleX = this._zoom;
        SceneManager.scene.scaleY = this._zoom;
        return this;
    };
    Camera.prototype.setRotation = function (rotation) {
        SceneManager.scene.rotation = rotation;
        return this;
    };
    Camera.prototype.setPosition = function (position) {
        this.entity.position = position;
        return this;
    };
    Camera.prototype.follow = function (targetEntity, cameraStyle) {
        if (cameraStyle === void 0) { cameraStyle = CameraStyle.cameraWindow; }
        this.targetEntity = targetEntity;
        this.cameraStyle = cameraStyle;
        var cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        switch (this.cameraStyle) {
            case CameraStyle.cameraWindow:
                var w = cameraBounds.width / 6;
                var h = cameraBounds.height / 3;
                this.deadzone = new Rectangle((cameraBounds.width - w) / 2, (cameraBounds.height - h) / 2, w, h);
                break;
            case CameraStyle.lockOn:
                this.deadzone = new Rectangle(cameraBounds.width / 2, cameraBounds.height / 2, 10, 10);
                break;
        }
    };
    Camera.prototype.update = function () {
        var cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        var halfScreen = Vector2.multiply(new Vector2(cameraBounds.width, cameraBounds.height), new Vector2(0.5));
        this._worldSpaceDeadZone.x = this.position.x - halfScreen.x + this.deadzone.x + this.focusOffset.x;
        this._worldSpaceDeadZone.y = this.position.y - halfScreen.y + this.deadzone.y + this.focusOffset.y;
        this._worldSpaceDeadZone.width = this.deadzone.width;
        this._worldSpaceDeadZone.height = this.deadzone.height;
        if (this.targetEntity)
            this.updateFollow();
        this.position = Vector2.lerp(this.position, Vector2.add(this.position, this._desiredPositionDelta), this.followLerp);
        this.entity.roundPosition();
        if (this.mapLockEnabled) {
            this.position = this.clampToMapSize(this.position);
            this.entity.roundPosition();
        }
    };
    Camera.prototype.clampToMapSize = function (position) {
        var cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        var halfScreen = Vector2.multiply(new Vector2(cameraBounds.width, cameraBounds.height), new Vector2(0.5));
        var cameraMax = new Vector2(this.mapSize.x - halfScreen.x, this.mapSize.y - halfScreen.y);
        return Vector2.clamp(position, halfScreen, cameraMax);
    };
    Camera.prototype.updateFollow = function () {
        this._desiredPositionDelta.x = this._desiredPositionDelta.y = 0;
        if (this.cameraStyle == CameraStyle.lockOn) {
            var targetX = this.targetEntity.position.x;
            var targetY = this.targetEntity.position.y;
            if (this._worldSpaceDeadZone.x > targetX)
                this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;
            else if (this._worldSpaceDeadZone.x < targetX)
                this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;
            if (this._worldSpaceDeadZone.y < targetY)
                this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
            else if (this._worldSpaceDeadZone.y > targetY)
                this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
        }
        else {
            if (!this._targetCollider) {
                this._targetCollider = this.targetEntity.getComponent(Collider);
                if (!this._targetCollider)
                    return;
            }
            var targetBounds = this.targetEntity.getComponent(Collider).bounds;
            if (!this._worldSpaceDeadZone.containsRect(targetBounds)) {
                if (this._worldSpaceDeadZone.left > targetBounds.left)
                    this._desiredPositionDelta.x = targetBounds.left - this._worldSpaceDeadZone.left;
                else if (this._worldSpaceDeadZone.right < targetBounds.right)
                    this._desiredPositionDelta.x = targetBounds.right - this._worldSpaceDeadZone.right;
                if (this._worldSpaceDeadZone.bottom < targetBounds.bottom)
                    this._desiredPositionDelta.y = targetBounds.bottom - this._worldSpaceDeadZone.bottom;
                else if (this._worldSpaceDeadZone.top > targetBounds.top)
                    this._desiredPositionDelta.y = targetBounds.top - this._worldSpaceDeadZone.top;
            }
        }
    };
    return Camera;
}(Component));
var CameraStyle;
(function (CameraStyle) {
    CameraStyle[CameraStyle["lockOn"] = 0] = "lockOn";
    CameraStyle[CameraStyle["cameraWindow"] = 1] = "cameraWindow";
})(CameraStyle || (CameraStyle = {}));
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
var PooledComponent = (function (_super) {
    __extends(PooledComponent, _super);
    function PooledComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PooledComponent;
}(Component));
var RenderableComponent = (function (_super) {
    __extends(RenderableComponent, _super);
    function RenderableComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._areBoundsDirty = true;
        _this._bounds = new Rectangle();
        _this._localOffset = Vector2.zero;
        _this.color = 0x000000;
        return _this;
    }
    Object.defineProperty(RenderableComponent.prototype, "width", {
        get: function () {
            return this.getWidth();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RenderableComponent.prototype, "height", {
        get: function () {
            return this.getHeight();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RenderableComponent.prototype, "isVisible", {
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            this._isVisible = value;
            if (this._isVisible)
                this.onBecameVisible();
            else
                this.onBecameInvisible();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RenderableComponent.prototype, "bounds", {
        get: function () {
            return new Rectangle(this.getBounds().x, this.getBounds().y, this.getBounds().width, this.getBounds().height);
        },
        enumerable: true,
        configurable: true
    });
    RenderableComponent.prototype.getWidth = function () {
        return this.bounds.width;
    };
    RenderableComponent.prototype.getHeight = function () {
        return this.bounds.height;
    };
    RenderableComponent.prototype.onBecameVisible = function () { };
    RenderableComponent.prototype.onBecameInvisible = function () { };
    RenderableComponent.prototype.isVisibleFromCamera = function (camera) {
        this.isVisible = camera.getBounds().intersects(this.getBounds());
        return this.isVisible;
    };
    return RenderableComponent;
}(PooledComponent));
var Mesh = (function (_super) {
    __extends(Mesh, _super);
    function Mesh() {
        var _this = _super.call(this) || this;
        _this._mesh = new egret.Mesh();
        return _this;
    }
    Mesh.prototype.setTexture = function (texture) {
        this._mesh.texture = texture;
        return this;
    };
    Mesh.prototype.onAddedToEntity = function () {
        this.addChild(this._mesh);
    };
    Mesh.prototype.onRemovedFromEntity = function () {
        this.removeChild(this._mesh);
    };
    Mesh.prototype.render = function (camera) {
        this.x = this.entity.position.x - camera.position.x + camera.origin.x;
        this.y = this.entity.position.y - camera.position.y + camera.origin.y;
    };
    Mesh.prototype.reset = function () {
    };
    return Mesh;
}(RenderableComponent));
var SpriteRenderer = (function (_super) {
    __extends(SpriteRenderer, _super);
    function SpriteRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SpriteRenderer.prototype, "sprite", {
        get: function () {
            return this._sprite;
        },
        set: function (value) {
            this.setSprite(value);
        },
        enumerable: true,
        configurable: true
    });
    SpriteRenderer.prototype.setSprite = function (sprite) {
        this.removeChildren();
        this._sprite = sprite;
        if (this._sprite) {
            this.anchorOffsetX = this._sprite.origin.x / this._sprite.sourceRect.width;
            this.anchorOffsetY = this._sprite.origin.y / this._sprite.sourceRect.height;
        }
        this.bitmap = new egret.Bitmap(sprite.texture2D);
        this.addChild(this.bitmap);
        return this;
    };
    SpriteRenderer.prototype.setColor = function (color) {
        var colorMatrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
        colorMatrix[0] = Math.floor(color / 256 / 256) / 255;
        colorMatrix[6] = Math.floor(color / 256 % 256) / 255;
        colorMatrix[12] = color % 256 / 255;
        var colorFilter = new egret.ColorMatrixFilter(colorMatrix);
        this.filters = [colorFilter];
        return this;
    };
    SpriteRenderer.prototype.isVisibleFromCamera = function (camera) {
        this.isVisible = new Rectangle(0, 0, this.stage.stageWidth, this.stage.stageHeight).intersects(this.bounds);
        this.visible = this.isVisible;
        return this.isVisible;
    };
    SpriteRenderer.prototype.render = function (camera) {
        this.x = -camera.position.x + camera.origin.x;
        this.y = -camera.position.y + camera.origin.y;
    };
    SpriteRenderer.prototype.onRemovedFromEntity = function () {
        if (this.parent)
            this.parent.removeChild(this);
    };
    SpriteRenderer.prototype.reset = function () {
    };
    return SpriteRenderer;
}(RenderableComponent));
var TiledSpriteRenderer = (function (_super) {
    __extends(TiledSpriteRenderer, _super);
    function TiledSpriteRenderer(sprite) {
        var _this = _super.call(this) || this;
        _this.leftTexture = new egret.Bitmap();
        _this.rightTexture = new egret.Bitmap();
        _this.leftTexture.texture = sprite.texture2D;
        _this.rightTexture.texture = sprite.texture2D;
        _this.setSprite(sprite);
        _this.sourceRect = sprite.sourceRect;
        return _this;
    }
    Object.defineProperty(TiledSpriteRenderer.prototype, "scrollX", {
        get: function () {
            return this.sourceRect.x;
        },
        set: function (value) {
            this.sourceRect.x = value;
            if (this.sourceRect.x < -this.sourceRect.width)
                this.sourceRect.x = this.sourceRect.width;
            else if (this.sourceRect.x > this.sourceRect.width)
                this.sourceRect.x = -this.sourceRect.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TiledSpriteRenderer.prototype, "scrollY", {
        get: function () {
            return this.sourceRect.y;
        },
        set: function (value) {
            this.sourceRect.y = value;
            if (this.sourceRect.y < -this.sourceRect.height)
                this.sourceRect.y = this.sourceRect.height;
            else if (this.sourceRect.y > this.sourceRect.height)
                this.sourceRect.y = -this.sourceRect.height;
        },
        enumerable: true,
        configurable: true
    });
    TiledSpriteRenderer.prototype.render = function (camera) {
        if (!this.sprite)
            return;
        _super.prototype.render.call(this, camera);
        var renderTexture = new egret.RenderTexture();
        var cacheBitmap = new egret.DisplayObjectContainer();
        cacheBitmap.removeChildren();
        cacheBitmap.addChild(this.leftTexture);
        cacheBitmap.addChild(this.rightTexture);
        this.leftTexture.x = this.sourceRect.x;
        this.rightTexture.x = this.sourceRect.x - this.sourceRect.width;
        this.leftTexture.y = this.sourceRect.y;
        this.rightTexture.y = this.sourceRect.y;
        cacheBitmap.cacheAsBitmap = true;
        renderTexture.drawToTexture(cacheBitmap, new egret.Rectangle(0, 0, this.sourceRect.width, this.sourceRect.height));
        this.bitmap.texture = renderTexture;
    };
    return TiledSpriteRenderer;
}(SpriteRenderer));
var ScrollingSpriteRenderer = (function (_super) {
    __extends(ScrollingSpriteRenderer, _super);
    function ScrollingSpriteRenderer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.scrollSpeedX = 15;
        _this.scroolSpeedY = 0;
        _this._scrollX = 0;
        _this._scrollY = 0;
        return _this;
    }
    ScrollingSpriteRenderer.prototype.update = function () {
        this.scrollX += this.scrollSpeedX * Time.deltaTime;
        this.scrollY += this.scroolSpeedY * Time.deltaTime;
        this.sourceRect.x = this._scrollX;
        this.sourceRect.y = this._scrollY;
    };
    return ScrollingSpriteRenderer;
}(TiledSpriteRenderer));
var Sprite = (function () {
    function Sprite(texture, sourceRect, origin) {
        if (sourceRect === void 0) { sourceRect = new Rectangle(0, 0, texture.textureWidth, texture.textureHeight); }
        if (origin === void 0) { origin = sourceRect.getHalfSize(); }
        this.uvs = new Rectangle();
        this.texture2D = texture;
        this.sourceRect = sourceRect;
        this.center = new Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
        this.origin = origin;
        var inverseTexW = 1 / texture.textureWidth;
        var inverseTexH = 1 / texture.textureHeight;
        this.uvs.x = sourceRect.x * inverseTexW;
        this.uvs.y = sourceRect.y * inverseTexH;
        this.uvs.width = sourceRect.width * inverseTexW;
        this.uvs.height = sourceRect.height * inverseTexH;
    }
    return Sprite;
}());
var SpriteAnimation = (function () {
    function SpriteAnimation(sprites, frameRate) {
        this.sprites = sprites;
        this.frameRate = frameRate;
    }
    return SpriteAnimation;
}());
var SpriteAnimator = (function (_super) {
    __extends(SpriteAnimator, _super);
    function SpriteAnimator(sprite) {
        var _this = _super.call(this) || this;
        _this.speed = 1;
        _this.animationState = State.none;
        _this._animations = new Map();
        _this._elapsedTime = 0;
        if (sprite)
            _this.setSprite(sprite);
        return _this;
    }
    Object.defineProperty(SpriteAnimator.prototype, "isRunning", {
        get: function () {
            return this.animationState == State.running;
        },
        enumerable: true,
        configurable: true
    });
    SpriteAnimator.prototype.addAnimation = function (name, animation) {
        if (!this.sprite && animation.sprites.length > 0)
            this.setSprite(animation.sprites[0]);
        this._animations[name] = animation;
        return this;
    };
    SpriteAnimator.prototype.play = function (name, loopMode) {
        if (loopMode === void 0) { loopMode = null; }
        this.currentAnimation = this._animations[name];
        this.currentAnimationName = name;
        this.currentFrame = 0;
        this.animationState = State.running;
        this.sprite = this.currentAnimation.sprites[0];
        this._elapsedTime = 0;
        this._loopMode = loopMode ? loopMode : LoopMode.loop;
    };
    SpriteAnimator.prototype.isAnimationActive = function (name) {
        return this.currentAnimation && this.currentAnimationName == name;
    };
    SpriteAnimator.prototype.pause = function () {
        this.animationState = State.paused;
    };
    SpriteAnimator.prototype.unPause = function () {
        this.animationState = State.running;
    };
    SpriteAnimator.prototype.stop = function () {
        this.currentAnimation = null;
        this.currentAnimationName = null;
        this.currentFrame = 0;
        this.animationState = State.none;
    };
    SpriteAnimator.prototype.update = function () {
        if (this.animationState != State.running || !this.currentAnimation)
            return;
        var animation = this.currentAnimation;
        var secondsPerFrame = 1 / (animation.frameRate * this.speed);
        var iterationDuration = secondsPerFrame * animation.sprites.length;
        this._elapsedTime += Time.deltaTime;
        var time = Math.abs(this._elapsedTime);
        if (this._loopMode == LoopMode.once && time > iterationDuration ||
            this._loopMode == LoopMode.pingPongOnce && time > iterationDuration * 2) {
            this.animationState = State.completed;
            this._elapsedTime = 0;
            this.currentFrame = 0;
            this.sprite = animation.sprites[this.currentFrame];
            return;
        }
        var i = Math.floor(time / secondsPerFrame);
        var n = animation.sprites.length;
        if (n > 2 && (this._loopMode == LoopMode.pingPong || this._loopMode == LoopMode.pingPongOnce)) {
            var maxIndex = n - 1;
            this.currentFrame = maxIndex - Math.abs(maxIndex - i % (maxIndex * 2));
        }
        else {
            this.currentFrame = i % n;
        }
        this.sprite = animation.sprites[this.currentFrame];
    };
    return SpriteAnimator;
}(SpriteRenderer));
var LoopMode;
(function (LoopMode) {
    LoopMode[LoopMode["loop"] = 0] = "loop";
    LoopMode[LoopMode["once"] = 1] = "once";
    LoopMode[LoopMode["clampForever"] = 2] = "clampForever";
    LoopMode[LoopMode["pingPong"] = 3] = "pingPong";
    LoopMode[LoopMode["pingPongOnce"] = 4] = "pingPongOnce";
})(LoopMode || (LoopMode = {}));
var State;
(function (State) {
    State[State["none"] = 0] = "none";
    State[State["running"] = 1] = "running";
    State[State["paused"] = 2] = "paused";
    State[State["completed"] = 3] = "completed";
})(State || (State = {}));
var Mover = (function (_super) {
    __extends(Mover, _super);
    function Mover() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Mover.prototype.onAddedToEntity = function () {
        this._triggerHelper = new ColliderTriggerHelper(this.entity);
    };
    Mover.prototype.calculateMovement = function (motion) {
        var collisionResult = new CollisionResult();
        if (!this.entity.getComponent(Collider) || !this._triggerHelper) {
            return null;
        }
        var colliders = this.entity.getComponents(Collider);
        for (var i = 0; i < colliders.length; i++) {
            var collider = colliders[i];
            if (collider.isTrigger)
                continue;
            var bounds = collider.bounds;
            bounds.x += motion.x;
            bounds.y += motion.y;
            var boxcastResult = Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers);
            bounds = boxcastResult.bounds;
            var neighbors = boxcastResult.tempHashSet;
            for (var j = 0; j < neighbors.length; j++) {
                var neighbor = neighbors[j];
                if (neighbor.isTrigger)
                    continue;
                var _internalcollisionResult = collider.collidesWith(neighbor, motion);
                if (_internalcollisionResult) {
                    motion = Vector2.subtract(motion, _internalcollisionResult.minimumTranslationVector);
                    if (_internalcollisionResult.collider) {
                        collisionResult = _internalcollisionResult;
                    }
                }
            }
        }
        ListPool.free(colliders);
        return { collisionResult: collisionResult, motion: motion };
    };
    Mover.prototype.applyMovement = function (motion) {
        this.entity.position = Vector2.add(this.entity.position, motion);
        if (this._triggerHelper)
            this._triggerHelper.update();
    };
    Mover.prototype.move = function (motion) {
        var movementResult = this.calculateMovement(motion);
        var collisionResult = movementResult.collisionResult;
        motion = movementResult.motion;
        this.applyMovement(motion);
        return collisionResult;
    };
    return Mover;
}(Component));
var Collider = (function (_super) {
    __extends(Collider, _super);
    function Collider() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.physicsLayer = 1 << 0;
        _this.registeredPhysicsBounds = new Rectangle();
        _this.shouldColliderScaleAndRotateWithTransform = true;
        _this.collidesWithLayers = Physics.allLayers;
        _this._localOffset = new Vector2(0, 0);
        return _this;
    }
    Object.defineProperty(Collider.prototype, "bounds", {
        get: function () {
            var bds = this.entity.getBounds();
            return new Rectangle(bds.x, bds.y, bds.width, bds.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collider.prototype, "localOffset", {
        get: function () {
            return new Vector2(this.x, this.y);
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
            this.$setX(offset.x);
            this.$setY(offset.y);
            this._localOffsetLength = this._localOffset.length();
            this.registerColliderWithPhysicsSystem();
        }
    };
    Collider.prototype.registerColliderWithPhysicsSystem = function () {
        if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
            Physics.addCollider(this);
            this._isColliderRegistered = true;
        }
    };
    Collider.prototype.unregisterColliderWithPhysicsSystem = function () {
        if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
            Physics.removeCollider(this);
        }
        this._isColliderRegistered = false;
    };
    Collider.prototype.overlaps = function (other) {
        return this.shape.overlaps(other.shape);
    };
    Collider.prototype.collidesWith = function (collider, motion) {
        var oldPosition = this.shape.position;
        this.shape.position = Vector2.add(this.shape.position, motion);
        var result = this.shape.collidesWithShape(collider.shape);
        if (result)
            result.collider = collider;
        this.shape.position = oldPosition;
        return result;
    };
    Collider.prototype.onAddedToEntity = function () {
        if (this._colliderRequiresAutoSizing) {
            if (!(this instanceof BoxCollider)) {
                console.error("Only box and circle colliders can be created automatically");
            }
            var bounds = this.entity.getBounds();
            var renderbaleBounds = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
            var width = renderbaleBounds.width / this.entity.scale.x;
            var height = renderbaleBounds.height / this.entity.scale.y;
            if (this instanceof BoxCollider) {
                var boxCollider = this;
                boxCollider.width = width;
                boxCollider.height = height;
                this.localOffset = Vector2.subtract(renderbaleBounds.center, this.entity.position);
            }
        }
        this._isParentEntityAddedToScene = true;
        this.registerColliderWithPhysicsSystem();
    };
    Collider.prototype.onRemovedFromEntity = function () {
        this.unregisterColliderWithPhysicsSystem();
        this._isParentEntityAddedToScene = false;
    };
    Collider.prototype.onEnabled = function () {
        this.registerColliderWithPhysicsSystem();
    };
    Collider.prototype.onDisabled = function () {
        this.unregisterColliderWithPhysicsSystem();
    };
    Collider.prototype.onEntityTransformChanged = function (comp) {
        if (this._isColliderRegistered)
            Physics.updateCollider(this);
    };
    return Collider;
}(Component));
var BoxCollider = (function (_super) {
    __extends(BoxCollider, _super);
    function BoxCollider() {
        var _this = _super.call(this) || this;
        _this.shape = new Box(1, 1);
        _this._colliderRequiresAutoSizing = true;
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
    BoxCollider.prototype.setWidth = function (width) {
        this._colliderRequiresAutoSizing = false;
        var box = this.shape;
        if (width != box.width) {
            box.updateBox(width, box.height);
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }
        return this;
    };
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
    BoxCollider.prototype.setHeight = function (height) {
        this._colliderRequiresAutoSizing = false;
        var box = this.shape;
        if (height != box.height) {
            box.updateBox(box.width, height);
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }
    };
    BoxCollider.prototype.setSize = function (width, height) {
        this._colliderRequiresAutoSizing = false;
        var box = this.shape;
        if (width != box.width || height != box.height) {
            box.updateBox(width, height);
            if (this.entity && this._isParentEntityAddedToScene)
                Physics.updateCollider(this);
        }
        return this;
    };
    return BoxCollider;
}(Collider));
var EntitySystem = (function () {
    function EntitySystem(matcher) {
        this._entities = [];
        this._matcher = matcher ? matcher : Matcher.empty();
    }
    Object.defineProperty(EntitySystem.prototype, "matcher", {
        get: function () {
            return this._matcher;
        },
        enumerable: true,
        configurable: true
    });
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
    EntitySystem.prototype.initialize = function () {
    };
    EntitySystem.prototype.onChanged = function (entity) {
        var contains = this._entities.contains(entity);
        var interest = this._matcher.IsIntersted(entity);
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
}(EntitySystem));
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
}(EntitySystem));
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
}(EntitySystem));
var BitSet = (function () {
    function BitSet(nbits) {
        if (nbits === void 0) { nbits = 64; }
        var length = nbits >> 6;
        if ((nbits & BitSet.LONG_MASK) != 0)
            length++;
        this._bits = new Array(length);
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
        var card = 0;
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
            var b = ((a >> 32) + a);
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
    BitSet.prototype.ensure = function (lastElt) {
        if (lastElt >= this._bits.length) {
            var nd = new Number[lastElt + 1];
            nd = this._bits.copyWithin(0, 0, this._bits.length);
            this._bits = nd;
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
    BitSet.LONG_MASK = 0x3f;
    return BitSet;
}());
var ComponentList = (function () {
    function ComponentList(entity) {
        this._components = [];
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
            return this._components;
        },
        enumerable: true,
        configurable: true
    });
    ComponentList.prototype.add = function (component) {
        this._componentsToAdd.push(component);
    };
    ComponentList.prototype.remove = function (component) {
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
        this._components.length = 0;
        this._componentsToAdd.length = 0;
        this._componentsToRemove.length = 0;
    };
    ComponentList.prototype.deregisterAllComponents = function () {
        for (var i = 0; i < this._components.length; i++) {
            var component = this._components[i];
            if (component instanceof RenderableComponent)
                this._entity.scene.renderableComponents.remove(component);
            this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component), false);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
        }
    };
    ComponentList.prototype.registerAllComponents = function () {
        for (var i = 0; i < this._components.length; i++) {
            var component = this._components[i];
            if (component instanceof RenderableComponent)
                this._entity.scene.renderableComponents.add(component);
            this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component));
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
                if (component instanceof RenderableComponent)
                    this._entity.scene.renderableComponents.add(component);
                this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component));
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                this._components.push(component);
                this._tempBufferList.push(component);
            }
            this._componentsToAdd.length = 0;
            for (var i = 0; i < this._tempBufferList.length; i++) {
                var component = this._tempBufferList[i];
                component.onAddedToEntity();
                if (component.enabled) {
                    component.onEnabled();
                }
            }
            this._tempBufferList.length = 0;
        }
    };
    ComponentList.prototype.onEntityTransformChanged = function (comp) {
        for (var i = 0; i < this._components.length; i++) {
            if (this._components[i].enabled)
                this._components[i].onEntityTransformChanged(comp);
        }
        for (var i = 0; i < this._componentsToAdd.length; i++) {
            if (this._componentsToAdd[i].enabled)
                this._componentsToAdd[i].onEntityTransformChanged(comp);
        }
    };
    ComponentList.prototype.handleRemove = function (component) {
        if (component instanceof RenderableComponent)
            this._entity.scene.renderableComponents.remove(component);
        this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component), false);
        this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
        component.onRemovedFromEntity();
        component.entity = null;
    };
    ComponentList.prototype.getComponent = function (type, onlyReturnInitializedComponents) {
        for (var i = 0; i < this._components.length; i++) {
            var component = this._components[i];
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
            var component = this._components[i];
            if (typeof (typeName) == "string") {
                if (egret.is(component, typeName)) {
                    components.push(component);
                }
            }
            else {
                if (component instanceof typeName) {
                    components.push(component);
                }
            }
        }
        for (var i = 0; i < this._componentsToAdd.length; i++) {
            var component = this._componentsToAdd[i];
            if (typeof (typeName) == "string") {
                if (egret.is(component, typeName)) {
                    components.push(component);
                }
            }
            else {
                if (component instanceof typeName) {
                    components.push(component);
                }
            }
        }
        return components;
    };
    ComponentList.prototype.update = function () {
        this.updateLists();
        for (var i = 0; i < this._components.length; i++) {
            var component = this._components[i];
            if (component.enabled && (component.updateInterval == 1 || Time.frameCount % component.updateInterval == 0))
                component.update();
        }
    };
    return ComponentList;
}());
var ComponentTypeManager = (function () {
    function ComponentTypeManager() {
    }
    ComponentTypeManager.add = function (type) {
        if (!this._componentTypesMask.has(type))
            this._componentTypesMask[type] = this._componentTypesMask.size;
    };
    ComponentTypeManager.getIndexFor = function (type) {
        var v = -1;
        if (!this._componentTypesMask.has(type)) {
            this.add(type);
            v = this._componentTypesMask.get(type);
        }
        return v;
    };
    ComponentTypeManager._componentTypesMask = new Map();
    return ComponentTypeManager;
}());
var EntityList = (function () {
    function EntityList(scene) {
        this._entitiesToRemove = [];
        this._entitiesToAdded = [];
        this._tempEntityList = [];
        this._entities = [];
        this._entityDict = new Map();
        this._unsortedTags = [];
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
    EntityList.prototype.add = function (entity) {
        if (this._entitiesToAdded.indexOf(entity) == -1)
            this._entitiesToAdded.push(entity);
    };
    EntityList.prototype.remove = function (entity) {
        if (this._entitiesToAdded.contains(entity)) {
            this._entitiesToAdded.remove(entity);
            return;
        }
        if (!this._entitiesToRemove.contains(entity))
            this._entitiesToRemove.push(entity);
    };
    EntityList.prototype.findEntity = function (name) {
        for (var i = 0; i < this._entities.length; i++) {
            if (this._entities[i].name == name)
                return this._entities[i];
        }
        return this._entitiesToAdded.firstOrDefault(function (entity) { return entity.name == name; });
    };
    EntityList.prototype.getTagList = function (tag) {
        var list = this._entityDict.get(tag);
        if (!list) {
            list = [];
            this._entityDict.set(tag, list);
        }
        return this._entityDict.get(tag);
    };
    EntityList.prototype.addToTagList = function (entity) {
        var list = this.getTagList(entity.tag);
        if (!list.contains(entity)) {
            list.push(entity);
            this._unsortedTags.push(entity.tag);
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
            if (entity.enabled)
                entity.update();
        }
    };
    EntityList.prototype.removeAllEntities = function () {
        this._entitiesToAdded.length = 0;
        this.updateLists();
        for (var i = 0; i < this._entities.length; i++) {
            this._entities[i]._isDestoryed = true;
            this._entities[i].onRemovedFromScene();
            this._entities[i].scene = null;
        }
        this._entities.length = 0;
        this._entityDict.clear();
    };
    EntityList.prototype.updateLists = function () {
        var _this = this;
        if (this._entitiesToRemove.length > 0) {
            var temp = this._entitiesToRemove;
            this._entitiesToRemove = this._tempEntityList;
            this._tempEntityList = temp;
            this._tempEntityList.forEach(function (entity) {
                _this._entities.remove(entity);
                entity.scene = null;
                _this.scene.entityProcessors.onEntityRemoved(entity);
            });
            this._tempEntityList.length = 0;
        }
        if (this._entitiesToAdded.length > 0) {
            var temp = this._entitiesToAdded;
            this._entitiesToAdded = this._tempEntityList;
            this._tempEntityList = temp;
            this._tempEntityList.forEach(function (entity) {
                if (!_this._entities.contains(entity)) {
                    _this._entities.push(entity);
                    entity.scene = _this.scene;
                    _this.scene.entityProcessors.onEntityAdded(entity);
                }
            });
            this._tempEntityList.forEach(function (entity) { return entity.onAddedToScene(); });
            this._tempEntityList.length = 0;
        }
        if (this._unsortedTags.length > 0) {
            this._unsortedTags.forEach(function (tag) {
                _this._entityDict.get(tag).sort();
            });
            this._unsortedTags.length = 0;
        }
    };
    return EntityList;
}());
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
            if (processor instanceof EntitySystem)
                return processor;
        }
        return null;
    };
    return EntityProcessorList;
}());
var Matcher = (function () {
    function Matcher() {
        this.allSet = new BitSet();
        this.exclusionSet = new BitSet();
        this.oneSet = new BitSet();
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
    Matcher.prototype.IsIntersted = function (e) {
        if (!this.allSet.isEmpty()) {
            for (var i = this.allSet.nextSetBit(0); i >= 0; i = this.allSet.nextSetBit(i + 1)) {
                if (!e.componentBits.get(i))
                    return false;
            }
        }
        if (!this.exclusionSet.isEmpty() && this.exclusionSet.intersects(e.componentBits))
            return false;
        if (!this.oneSet.isEmpty() && !this.oneSet.intersects(e.componentBits))
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
            _this.allSet.set(ComponentTypeManager.getIndexFor(type));
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
            _this.exclusionSet.set(ComponentTypeManager.getIndexFor(type));
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
            _this.oneSet.set(ComponentTypeManager.getIndexFor(type));
        });
        return this;
    };
    return Matcher;
}());
var RenderableComponentList = (function () {
    function RenderableComponentList() {
        this._components = [];
    }
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
    };
    RenderableComponentList.prototype.remove = function (component) {
        this._components.remove(component);
    };
    RenderableComponentList.prototype.updateList = function () {
    };
    return RenderableComponentList;
}());
var Time = (function () {
    function Time() {
    }
    ;
    Time.update = function (currentTime) {
        var dt = (currentTime - this._lastTime) / 1000;
        this.deltaTime = dt * this.timeScale;
        this.unscaledDeltaTime = dt;
        this.frameCount++;
        this._lastTime = currentTime;
    };
    Time.deltaTime = 0;
    Time.timeScale = 1;
    Time.frameCount = 0;
    Time._lastTime = 0;
    return Time;
}());
var GraphicsCapabilities = (function () {
    function GraphicsCapabilities() {
    }
    GraphicsCapabilities.prototype.initialize = function (device) {
        this.platformInitialize(device);
    };
    GraphicsCapabilities.prototype.platformInitialize = function (device) {
        var gl = new egret.sys.RenderBuffer().context.getInstance();
        this.supportsNonPowerOfTwo = false;
        this.supportsTextureFilterAnisotropic = gl.getExtension("EXT_texture_filter_anisotropic") != null;
        this.supportsDepth24 = true;
        this.supportsPackedDepthStencil = true;
        this.supportsDepthNonLinear = false;
        this.supportsTextureMaxLevel = true;
        this.supportsS3tc = gl.getExtension("WEBGL_compressed_texture_s3tc") != null ||
            gl.getExtension("WEBGL_compressed_texture_s3tc_srgb") != null;
        this.supportsDxt1 = this.supportsS3tc;
        this.supportsPvrtc = false;
        this.supportsAtitc = gl.getExtension("WEBGL_compressed_texture_astc") != null;
        this.supportsFramebufferObjectARB = false;
    };
    return GraphicsCapabilities;
}());
var GraphicsDevice = (function () {
    function GraphicsDevice() {
        this.graphicsCapabilities = new GraphicsCapabilities();
        this.graphicsCapabilities.initialize(this);
    }
    return GraphicsDevice;
}());
var Viewport = (function () {
    function Viewport(x, y, width, height) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._minDepth = 0;
        this._maxDepth = 1;
    }
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
            return new Rectangle(this._x, this._y, this._width, this._height);
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
var GaussianBlurEffect = (function (_super) {
    __extends(GaussianBlurEffect, _super);
    function GaussianBlurEffect() {
        return _super.call(this, PostProcessor.default_vert, GaussianBlurEffect.blur_frag, {
            screenWidth: SceneManager.stage.stageWidth,
            screenHeight: SceneManager.stage.stageHeight
        }) || this;
    }
    GaussianBlurEffect.blur_frag = "precision mediump float;\n" +
        "uniform sampler2D uSampler;\n" +
        "uniform float screenWidth;\n" +
        "uniform float screenHeight;\n" +
        "float normpdf(in float x, in float sigma)\n" +
        "{\n" +
        "return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;\n" +
        "}\n" +
        "void main()\n" +
        "{\n" +
        "vec3 c = texture2D(uSampler, gl_FragCoord.xy / vec2(screenWidth, screenHeight).xy).rgb;\n" +
        "const int mSize = 11;\n" +
        "const int kSize = (mSize - 1)/2;\n" +
        "float kernel[mSize];\n" +
        "vec3 final_colour = vec3(0.0);\n" +
        "float sigma = 7.0;\n" +
        "float z = 0.0;\n" +
        "for (int j = 0; j <= kSize; ++j)\n" +
        "{\n" +
        "kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j),sigma);\n" +
        "}\n" +
        "for (int j = 0; j < mSize; ++j)\n" +
        "{\n" +
        "z += kernel[j];\n" +
        "}\n" +
        "for (int i = -kSize; i <= kSize; ++i)\n" +
        "{\n" +
        "for (int j = -kSize; j <= kSize; ++j)\n" +
        "{\n" +
        "final_colour += kernel[kSize+j]*kernel[kSize+i]*texture2D(uSampler, (gl_FragCoord.xy+vec2(float(i),float(j))) / vec2(screenWidth, screenHeight).xy).rgb;\n" +
        "}\n}\n" +
        "gl_FragColor = vec4(final_colour/(z*z), 1.0);\n" +
        "}";
    return GaussianBlurEffect;
}(egret.CustomFilter));
var PolygonLightEffect = (function (_super) {
    __extends(PolygonLightEffect, _super);
    function PolygonLightEffect() {
        return _super.call(this, PolygonLightEffect.vertSrc, PolygonLightEffect.fragmentSrc) || this;
    }
    PolygonLightEffect.vertSrc = "attribute vec2 aVertexPosition;\n" +
        "attribute vec2 aTextureCoord;\n" +
        "uniform vec2 projectionVector;\n" +
        "varying vec2 vTextureCoord;\n" +
        "const vec2 center = vec2(-1.0, 1.0);\n" +
        "void main(void) {\n" +
        "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
        "   vTextureCoord = aTextureCoord;\n" +
        "}";
    PolygonLightEffect.fragmentSrc = "precision lowp float;\n" +
        "varying vec2 vTextureCoord;\n" +
        "uniform sampler2D uSampler;\n" +
        "#define SAMPLE_COUNT 15\n" +
        "uniform vec2 _sampleOffsets[SAMPLE_COUNT];\n" +
        "uniform float _sampleWeights[SAMPLE_COUNT];\n" +
        "void main(void) {\n" +
        "vec4 c = vec4(0, 0, 0, 0);\n" +
        "for( int i = 0; i < SAMPLE_COUNT; i++ )\n" +
        "   c += texture2D( uSampler, vTextureCoord + _sampleOffsets[i] ) * _sampleWeights[i];\n" +
        "gl_FragColor = c;\n" +
        "}";
    return PolygonLightEffect;
}(egret.CustomFilter));
var PostProcessor = (function () {
    function PostProcessor(effect) {
        if (effect === void 0) { effect = null; }
        this.enable = true;
        this.effect = effect;
    }
    PostProcessor.prototype.onAddedToScene = function (scene) {
        this.scene = scene;
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0xFFFFFF, 1);
        this.shape.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        this.shape.graphics.endFill();
        scene.addChild(this.shape);
    };
    PostProcessor.prototype.process = function () {
        this.drawFullscreenQuad();
    };
    PostProcessor.prototype.onSceneBackBufferSizeChanged = function (newWidth, newHeight) { };
    PostProcessor.prototype.drawFullscreenQuad = function () {
        this.scene.filters = [this.effect];
    };
    PostProcessor.prototype.unload = function () {
        if (this.effect) {
            this.effect = null;
        }
        this.scene.removeChild(this.shape);
        this.scene = null;
    };
    PostProcessor.default_vert = "attribute vec2 aVertexPosition;\n" +
        "attribute vec2 aTextureCoord;\n" +
        "attribute vec2 aColor;\n" +
        "uniform vec2 projectionVector;\n" +
        "varying vec2 vTextureCoord;\n" +
        "varying vec4 vColor;\n" +
        "const vec2 center = vec2(-1.0, 1.0);\n" +
        "void main(void) {\n" +
        "gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
        "vTextureCoord = aTextureCoord;\n" +
        "vColor = vec4(aColor.x, aColor.x, aColor.x, aColor.x);\n" +
        "}";
    return PostProcessor;
}());
var GaussianBlurPostProcessor = (function (_super) {
    __extends(GaussianBlurPostProcessor, _super);
    function GaussianBlurPostProcessor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GaussianBlurPostProcessor.prototype.onAddedToScene = function (scene) {
        _super.prototype.onAddedToScene.call(this, scene);
        this.effect = new GaussianBlurEffect();
    };
    return GaussianBlurPostProcessor;
}(PostProcessor));
var Renderer = (function () {
    function Renderer() {
    }
    Renderer.prototype.onAddedToScene = function (scene) { };
    Renderer.prototype.beginRender = function (cam) {
    };
    Renderer.prototype.unload = function () { };
    Renderer.prototype.renderAfterStateCheck = function (renderable, cam) {
        renderable.render(cam);
    };
    return Renderer;
}());
var DefaultRenderer = (function (_super) {
    __extends(DefaultRenderer, _super);
    function DefaultRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefaultRenderer.prototype.render = function (scene) {
        var cam = this.camera ? this.camera : scene.camera;
        this.beginRender(cam);
        for (var i = 0; i < scene.renderableComponents.count; i++) {
            var renderable = scene.renderableComponents.buffer[i];
            if (renderable.enabled && renderable.isVisibleFromCamera(cam))
                this.renderAfterStateCheck(renderable, cam);
        }
    };
    return DefaultRenderer;
}(Renderer));
var ScreenSpaceRenderer = (function (_super) {
    __extends(ScreenSpaceRenderer, _super);
    function ScreenSpaceRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ScreenSpaceRenderer.prototype.render = function (scene) {
    };
    return ScreenSpaceRenderer;
}(Renderer));
var PolyLight = (function (_super) {
    __extends(PolyLight, _super);
    function PolyLight(radius, color, power) {
        var _this = _super.call(this) || this;
        _this._indices = [];
        _this.radius = radius;
        _this.power = power;
        _this.color = color;
        _this.computeTriangleIndices();
        return _this;
    }
    Object.defineProperty(PolyLight.prototype, "radius", {
        get: function () {
            return this._radius;
        },
        set: function (value) {
            this.setRadius(value);
        },
        enumerable: true,
        configurable: true
    });
    PolyLight.prototype.computeTriangleIndices = function (totalTris) {
        if (totalTris === void 0) { totalTris = 20; }
        this._indices.length = 0;
        for (var i = 0; i < totalTris; i += 2) {
            this._indices.push(0);
            this._indices.push(i + 2);
            this._indices.push(i + 1);
        }
    };
    PolyLight.prototype.setRadius = function (radius) {
        if (radius != this._radius) {
            this._radius = radius;
            this._areBoundsDirty = true;
        }
    };
    PolyLight.prototype.render = function (camera) {
    };
    PolyLight.prototype.reset = function () {
    };
    return PolyLight;
}(RenderableComponent));
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
    SceneTransition.prototype.preRender = function () { };
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
        SceneManager.sceneTransition = null;
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
                        _a = SceneManager;
                        return [4, this.sceneLoadAction()];
                    case 1:
                        _a.scene = _b.sent();
                        this.isNewSceneLoaded = true;
                        return [2];
                }
            });
        });
    };
    SceneTransition.prototype.tickEffectProgressProperty = function (filter, duration, easeType, reverseDirection) {
        if (reverseDirection === void 0) { reverseDirection = false; }
        return new Promise(function (resolve) {
            var start = reverseDirection ? 1 : 0;
            var end = reverseDirection ? 0 : 1;
            egret.Tween.get(filter.uniforms).set({ _progress: start }).to({ _progress: end }, duration * 1000, easeType).call(function () {
                resolve();
            });
        });
    };
    return SceneTransition;
}());
var FadeTransition = (function (_super) {
    __extends(FadeTransition, _super);
    function FadeTransition(sceneLoadAction) {
        var _this = _super.call(this, sceneLoadAction) || this;
        _this.fadeToColor = 0x000000;
        _this.fadeOutDuration = 0.4;
        _this.fadeEaseType = egret.Ease.quadInOut;
        _this.delayBeforeFadeInDuration = 0.1;
        _this._alpha = 0;
        _this._mask = new egret.Shape();
        return _this;
    }
    FadeTransition.prototype.onBeginTransition = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this._mask.graphics.beginFill(this.fadeToColor, 1);
                this._mask.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
                this._mask.graphics.endFill();
                SceneManager.stage.addChild(this._mask);
                egret.Tween.get(this).to({ _alpha: 1 }, this.fadeOutDuration * 1000, this.fadeEaseType)
                    .call(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, this.loadNextScene()];
                            case 1:
                                _a.sent();
                                return [2];
                        }
                    });
                }); }).wait(this.delayBeforeFadeInDuration).call(function () {
                    egret.Tween.get(_this).to({ _alpha: 0 }, _this.fadeOutDuration * 1000, _this.fadeEaseType).call(function () {
                        _this.transitionComplete();
                        SceneManager.stage.removeChild(_this._mask);
                    });
                });
                return [2];
            });
        });
    };
    FadeTransition.prototype.render = function () {
        this._mask.graphics.clear();
        this._mask.graphics.beginFill(this.fadeToColor, this._alpha);
        this._mask.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        this._mask.graphics.endFill();
    };
    return FadeTransition;
}(SceneTransition));
var WindTransition = (function (_super) {
    __extends(WindTransition, _super);
    function WindTransition(sceneLoadAction) {
        var _this = _super.call(this, sceneLoadAction) || this;
        _this.duration = 1;
        _this.easeType = egret.Ease.quadOut;
        var vertexSrc = "attribute vec2 aVertexPosition;\n" +
            "attribute vec2 aTextureCoord;\n" +
            "uniform vec2 projectionVector;\n" +
            "varying vec2 vTextureCoord;\n" +
            "const vec2 center = vec2(-1.0, 1.0);\n" +
            "void main(void) {\n" +
            "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
            "   vTextureCoord = aTextureCoord;\n" +
            "}";
        var fragmentSrc = "precision lowp float;\n" +
            "varying vec2 vTextureCoord;\n" +
            "uniform sampler2D uSampler;\n" +
            "uniform float _progress;\n" +
            "uniform float _size;\n" +
            "uniform float _windSegments;\n" +
            "void main(void) {\n" +
            "vec2 co = floor(vec2(0.0, vTextureCoord.y * _windSegments));\n" +
            "float x = sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453;\n" +
            "float r = x - floor(x);\n" +
            "float m = smoothstep(0.0, -_size, vTextureCoord.x * (1.0 - _size) + _size * r - (_progress * (1.0 + _size)));\n" +
            "vec4 fg = texture2D(uSampler, vTextureCoord);\n" +
            "gl_FragColor = mix(fg, vec4(0, 0, 0, 0), m);\n" +
            "}";
        _this._windEffect = new egret.CustomFilter(vertexSrc, fragmentSrc, {
            _progress: 0,
            _size: 0.3,
            _windSegments: 100
        });
        _this._mask = new egret.Shape();
        _this._mask.graphics.beginFill(0xFFFFFF, 1);
        _this._mask.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        _this._mask.graphics.endFill();
        _this._mask.filters = [_this._windEffect];
        SceneManager.stage.addChild(_this._mask);
        return _this;
    }
    Object.defineProperty(WindTransition.prototype, "windSegments", {
        set: function (value) {
            this._windEffect.uniforms._windSegments = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WindTransition.prototype, "size", {
        set: function (value) {
            this._windEffect.uniforms._size = value;
        },
        enumerable: true,
        configurable: true
    });
    WindTransition.prototype.onBeginTransition = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.loadNextScene();
                        return [4, this.tickEffectProgressProperty(this._windEffect, this.duration, this.easeType)];
                    case 1:
                        _a.sent();
                        this.transitionComplete();
                        SceneManager.stage.removeChild(this._mask);
                        return [2];
                }
            });
        });
    };
    return WindTransition;
}(SceneTransition));
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
        return 1 << flag;
    };
    Flags.setFlag = function (self, flag) {
        return (self | 1 << flag);
    };
    Flags.unsetFlag = function (self, flag) {
        flag = 1 << flag;
        return (self & (~flag));
    };
    Flags.invertFlags = function (self) {
        return ~self;
    };
    return Flags;
}());
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
        return new Vector2(Math.cos(radians) * radians + circleCenter.x, Math.sin(radians) * radians + circleCenter.y);
    };
    MathHelper.isEven = function (value) {
        return value % 2 == 0;
    };
    MathHelper.Epsilon = 0.00001;
    MathHelper.Rad2Deg = 57.29578;
    MathHelper.Deg2Rad = 0.0174532924;
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
        this.m11 = m11 ? m11 : 1;
        this.m12 = m12 ? m12 : 0;
        this.m21 = m21 ? m21 : 0;
        this.m22 = m22 ? m22 : 1;
        this.m31 = m31 ? m31 : 0;
        this.m32 = m32 ? m32 : 0;
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
        var result = new Matrix2D();
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
        return result;
    };
    Matrix2D.multiplyTranslation = function (matrix, x, y) {
        var trans = Matrix2D.createTranslation(x, y);
        return Matrix2D.multiply(matrix, trans);
    };
    Matrix2D.prototype.determinant = function () {
        return this.m11 * this.m22 - this.m12 * this.m21;
    };
    Matrix2D.invert = function (matrix, result) {
        if (result === void 0) { result = new Matrix2D(); }
        var det = 1 / matrix.determinant();
        result.m11 = matrix.m22 * det;
        result.m12 = -matrix.m12 * det;
        result.m21 = -matrix.m21 * det;
        result.m22 = matrix.m11 * det;
        result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
        result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;
        return result;
    };
    Matrix2D.createTranslation = function (xPosition, yPosition) {
        var result = new Matrix2D();
        result.m11 = 1;
        result.m12 = 0;
        result.m21 = 0;
        result.m22 = 1;
        result.m31 = xPosition;
        result.m32 = yPosition;
        return result;
    };
    Matrix2D.createTranslationVector = function (position) {
        return this.createTranslation(position.x, position.y);
    };
    Matrix2D.createRotation = function (radians, result) {
        result = new Matrix2D();
        var val1 = Math.cos(radians);
        var val2 = Math.sin(radians);
        result.m11 = val1;
        result.m12 = val2;
        result.m21 = -val2;
        result.m22 = val1;
        return result;
    };
    Matrix2D.createScale = function (xScale, yScale, result) {
        if (result === void 0) { result = new Matrix2D(); }
        result.m11 = xScale;
        result.m12 = 0;
        result.m21 = 0;
        result.m22 = yScale;
        result.m31 = 0;
        result.m32 = 0;
        return result;
    };
    Matrix2D.prototype.toEgretMatrix = function () {
        var matrix = new egret.Matrix(this.m11, this.m12, this.m21, this.m22, this.m31, this.m32);
        return matrix;
    };
    Matrix2D._identity = new Matrix2D(1, 0, 0, 1, 0, 0);
    return Matrix2D;
}());
var Rectangle = (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Rectangle.prototype, "max", {
        get: function () {
            return new Vector2(this.right, this.bottom);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "center", {
        get: function () {
            return new Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "location", {
        get: function () {
            return new Vector2(this.x, this.y);
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
            return new Vector2(this.width, this.height);
        },
        set: function (value) {
            this.width = value.x;
            this.height = value.y;
        },
        enumerable: true,
        configurable: true
    });
    Rectangle.prototype.intersects = function (value) {
        return value.left < this.right &&
            this.left < value.right &&
            value.top < this.bottom &&
            this.top < value.bottom;
    };
    Rectangle.prototype.containsInVec = function (value) {
        return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
            (this.y <= value.y)) &&
            (value.y < (this.y + this.height)));
    };
    Rectangle.prototype.containsRect = function (value) {
        return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
            (this.y <= value.y)) &&
            (value.y < (this.y + this.height)));
    };
    Rectangle.prototype.getHalfSize = function () {
        return new Vector2(this.width * 0.5, this.height * 0.5);
    };
    Rectangle.fromMinMax = function (minX, minY, maxX, maxY) {
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    };
    Rectangle.prototype.getClosestPointOnRectangleBorderToPoint = function (point) {
        var edgeNormal = Vector2.zero;
        var res = new Vector2();
        res.x = MathHelper.clamp(point.x, this.left, this.right);
        res.y = MathHelper.clamp(point.y, this.top, this.bottom);
        if (this.containsInVec(res)) {
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
        return { res: res, edgeNormal: edgeNormal };
    };
    Rectangle.prototype.getClosestPointOnBoundsToOrigin = function () {
        var max = this.max;
        var minDist = Math.abs(this.location.x);
        var boundsPoint = new Vector2(this.location.x, 0);
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
    return Rectangle;
}(egret.Rectangle));
var Vector3 = (function () {
    function Vector3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Vector3;
}());
var ColliderTriggerHelper = (function () {
    function ColliderTriggerHelper(entity) {
        this._activeTriggerIntersections = [];
        this._previousTriggerIntersections = [];
        this._tempTriggerList = [];
        this._entity = entity;
    }
    ColliderTriggerHelper.prototype.update = function () {
        var colliders = this._entity.getComponents(Collider);
        for (var i = 0; i < colliders.length; i++) {
            var collider = colliders[i];
            var boxcastResult = Physics.boxcastBroadphase(collider.bounds, collider.collidesWithLayers);
            collider.bounds = boxcastResult.rect;
            var neighbors = boxcastResult.colliders;
            var _loop_5 = function (j) {
                var neighbor = neighbors[j];
                if (!collider.isTrigger && !neighbor.isTrigger)
                    return "continue";
                if (collider.overlaps(neighbor)) {
                    var pair_1 = new Pair(collider, neighbor);
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
                _loop_5(j);
            }
        }
        ListPool.free(colliders);
        this.checkForExitedColliders();
    };
    ColliderTriggerHelper.prototype.checkForExitedColliders = function () {
        var _this = this;
        var _loop_6 = function (i) {
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
            _loop_6(i);
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
})(PointSectors || (PointSectors = {}));
var Collisions = (function () {
    function Collisions() {
    }
    Collisions.isLineToLine = function (a1, a2, b1, b2) {
        var b = Vector2.subtract(a2, a1);
        var d = Vector2.subtract(b2, b1);
        var bDotDPerp = b.x * d.y - b.y * d.x;
        if (bDotDPerp == 0)
            return false;
        var c = Vector2.subtract(b1, a1);
        var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
        if (t < 0 || t > 1)
            return false;
        var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
        if (u < 0 || u > 1)
            return false;
        return true;
    };
    Collisions.lineToLineIntersection = function (a1, a2, b1, b2) {
        var intersection = new Vector2(0, 0);
        var b = Vector2.subtract(a2, a1);
        var d = Vector2.subtract(b2, b1);
        var bDotDPerp = b.x * d.y - b.y * d.x;
        if (bDotDPerp == 0)
            return intersection;
        var c = Vector2.subtract(b1, a1);
        var t = (c.x * d.y - c.y * d.x) / bDotDPerp;
        if (t < 0 || t > 1)
            return intersection;
        var u = (c.x * b.y - c.y * b.x) / bDotDPerp;
        if (u < 0 || u > 1)
            return intersection;
        intersection = Vector2.add(a1, new Vector2(t * b.x, t * b.y));
        return intersection;
    };
    Collisions.closestPointOnLine = function (lineA, lineB, closestTo) {
        var v = Vector2.subtract(lineB, lineA);
        var w = Vector2.subtract(closestTo, lineA);
        var t = Vector2.dot(w, v) / Vector2.dot(v, v);
        t = MathHelper.clamp(t, 0, 1);
        return Vector2.add(lineA, new Vector2(v.x * t, v.y * t));
    };
    Collisions.isCircleToCircle = function (circleCenter1, circleRadius1, circleCenter2, circleRadius2) {
        return Vector2.distanceSquared(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
    };
    Collisions.isCircleToLine = function (circleCenter, radius, lineFrom, lineTo) {
        return Vector2.distanceSquared(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
    };
    Collisions.isCircleToPoint = function (circleCenter, radius, point) {
        return Vector2.distanceSquared(circleCenter, point) < radius * radius;
    };
    Collisions.isRectToCircle = function (rect, cPosition, cRadius) {
        var ew = rect.width * 0.5;
        var eh = rect.height * 0.5;
        var vx = Math.max(0, Math.max(cPosition.x - rect.x) - ew);
        var vy = Math.max(0, Math.max(cPosition.y - rect.y) - eh);
        return vx * vx + vy * vy < cRadius * cRadius;
    };
    Collisions.isRectToLine = function (rect, lineFrom, lineTo) {
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
                edgeFrom = new Vector2(rect.x, rect.y);
                edgeTo = new Vector2(rect.x + rect.width, rect.y);
                if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                    return true;
            }
            if ((both & PointSectors.bottom) != 0) {
                edgeFrom = new Vector2(rect.x, rect.y + rect.height);
                edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                    return true;
            }
            if ((both & PointSectors.left) != 0) {
                edgeFrom = new Vector2(rect.x, rect.y);
                edgeTo = new Vector2(rect.x, rect.y + rect.height);
                if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                    return true;
            }
            if ((both & PointSectors.right) != 0) {
                edgeFrom = new Vector2(rect.x + rect.width, rect.y);
                edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.isLineToLine(edgeFrom, edgeTo, lineFrom, lineTo))
                    return true;
            }
        }
        return false;
    };
    Collisions.isRectToPoint = function (rX, rY, rW, rH, point) {
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
var Physics = (function () {
    function Physics() {
    }
    Physics.reset = function () {
        this._spatialHash = new SpatialHash(this.spatialHashCellSize);
    };
    Physics.clear = function () {
        this._spatialHash.clear();
    };
    Physics.overlapCircleAll = function (center, randius, results, layerMask) {
        if (layerMask === void 0) { layerMask = -1; }
        return this._spatialHash.overlapCircle(center, randius, results, layerMask);
    };
    Physics.boxcastBroadphase = function (rect, layerMask) {
        if (layerMask === void 0) { layerMask = this.allLayers; }
        var boxcastResult = this._spatialHash.aabbBroadphase(rect, null, layerMask);
        return { colliders: boxcastResult.tempHashSet, rect: boxcastResult.bounds };
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
    Physics.spatialHashCellSize = 100;
    Physics.allLayers = -1;
    return Physics;
}());
var Shape = (function () {
    function Shape() {
    }
    return Shape;
}());
var Polygon = (function (_super) {
    __extends(Polygon, _super);
    function Polygon(points, isBox) {
        var _this = _super.call(this) || this;
        _this.isUnrotated = true;
        _this._areEdgeNormalsDirty = true;
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
    Polygon.prototype.buildEdgeNormals = function () {
        var totalEdges = this.isBox ? 2 : this.points.length;
        if (this._edgeNormals == null || this._edgeNormals.length != totalEdges)
            this._edgeNormals = new Array(totalEdges);
        var p2;
        for (var i = 0; i < totalEdges; i++) {
            var p1 = this.points[i];
            if (i + 1 >= this.points.length)
                p2 = this.points[0];
            else
                p2 = this.points[i + 1];
            var perp = Vector2Ext.perpendicular(p1, p2);
            perp = Vector2.normalize(perp);
            this._edgeNormals[i] = perp;
        }
    };
    Polygon.prototype.setPoints = function (points) {
        this.points = points;
        this.recalculateCenterAndEdgeNormals();
        this._originalPoints = [];
        for (var i = 0; i < this.points.length; i++) {
            this._originalPoints.push(this.points[i]);
        }
    };
    Polygon.prototype.collidesWithShape = function (other) {
        var result = new CollisionResult();
        if (other instanceof Polygon) {
            return ShapeCollisions.polygonToPolygon(this, other);
        }
        if (other instanceof Circle) {
            result = ShapeCollisions.circleToPolygon(other, this);
            if (result) {
                result.invertResult();
                return result;
            }
            return null;
        }
        throw new Error("overlaps of Polygon to " + other + " are not supported");
    };
    Polygon.prototype.recalculateCenterAndEdgeNormals = function () {
        this._polygonCenter = Polygon.findPolygonCenter(this.points);
        this._areEdgeNormalsDirty = true;
    };
    Polygon.prototype.overlaps = function (other) {
        var result;
        if (other instanceof Polygon)
            return ShapeCollisions.polygonToPolygon(this, other);
        if (other instanceof Circle) {
            result = ShapeCollisions.circleToPolygon(other, this);
            if (result) {
                result.invertResult();
                return true;
            }
            return false;
        }
        throw new Error("overlaps of Pologon to " + other + " are not supported");
    };
    Polygon.findPolygonCenter = function (points) {
        var x = 0, y = 0;
        for (var i = 0; i < points.length; i++) {
            x += points[i].x;
            y += points[i].y;
        }
        return new Vector2(x / points.length, y / points.length);
    };
    Polygon.getClosestPointOnPolygonToPoint = function (points, point) {
        var distanceSquared = Number.MAX_VALUE;
        var edgeNormal = new Vector2(0, 0);
        var closestPoint = new Vector2(0, 0);
        var tempDistanceSquared;
        for (var i = 0; i < points.length; i++) {
            var j = i + 1;
            if (j == points.length)
                j = 0;
            var closest = ShapeCollisions.closestPointOnLine(points[i], points[j], point);
            tempDistanceSquared = Vector2.distanceSquared(point, closest);
            if (tempDistanceSquared < distanceSquared) {
                distanceSquared = tempDistanceSquared;
                closestPoint = closest;
                var line = Vector2.subtract(points[j], points[i]);
                edgeNormal.x = -line.y;
                edgeNormal.y = line.x;
            }
        }
        edgeNormal = Vector2.normalize(edgeNormal);
        return { closestPoint: closestPoint, distanceSquared: distanceSquared, edgeNormal: edgeNormal };
    };
    Polygon.prototype.pointCollidesWithShape = function (point) {
        return ShapeCollisions.pointToPoly(point, this);
    };
    Polygon.prototype.containsPoint = function (point) {
        point = Vector2.subtract(point, this.position);
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
    Polygon.buildSymmertricalPolygon = function (vertCount, radius) {
        var verts = new Array(vertCount);
        for (var i = 0; i < vertCount; i++) {
            var a = 2 * Math.PI * (i / vertCount);
            verts[i] = new Vector2(Math.cos(a), Math.sin(a) * radius);
        }
        return verts;
    };
    Polygon.prototype.recalculateBounds = function (collider) {
        this.center = collider.localOffset;
        if (collider.shouldColliderScaleAndRotateWithTransform) {
            var hasUnitScale = true;
            var tempMat = void 0;
            var combinedMatrix = Matrix2D.createTranslation(-this._polygonCenter.x, -this._polygonCenter.y);
            if (collider.entity.scale != Vector2.one) {
                tempMat = Matrix2D.createScale(collider.entity.scale.x, collider.entity.scale.y);
                combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);
                hasUnitScale = false;
                var scaledOffset = Vector2.multiply(collider.localOffset, collider.entity.scale);
                this.center = scaledOffset;
            }
            if (collider.entity.rotation != 0) {
                tempMat = Matrix2D.createRotation(collider.entity.rotation, tempMat);
                combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);
                var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                var offsetLength = hasUnitScale ? collider._localOffsetLength : (Vector2.multiply(collider.localOffset, collider.entity.scale)).length();
                this.center = MathHelper.pointOnCirlce(Vector2.zero, offsetLength, MathHelper.toDegrees(collider.entity.rotation) + offsetAngle);
            }
            tempMat = Matrix2D.createTranslation(this._polygonCenter.x, this._polygonCenter.y);
            combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);
            Vector2Ext.transform(this._originalPoints, combinedMatrix, this.points);
            this.isUnrotated = collider.entity.rotation == 0;
        }
        this.position = Vector2.add(collider.entity.position, this.center);
        this.bounds = Rectangle.rectEncompassingPoints(this.points);
        this.bounds.location = Vector2.add(this.bounds.location, this.position);
    };
    return Polygon;
}(Shape));
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
        verts[0] = new Vector2(-halfWidth, -halfHeight);
        verts[1] = new Vector2(halfWidth, -halfHeight);
        verts[2] = new Vector2(halfWidth, halfHeight);
        verts[3] = new Vector2(-halfWidth, halfHeight);
        return verts;
    };
    Box.prototype.overlaps = function (other) {
        if (this.isUnrotated) {
            if (other instanceof Box && other.isUnrotated)
                return this.bounds.intersects(other.bounds);
            if (other instanceof Circle)
                return Collisions.isRectToCircle(this.bounds, other.position, other.radius);
        }
        return _super.prototype.overlaps.call(this, other);
    };
    Box.prototype.collidesWithShape = function (other) {
        if (this.isUnrotated && other instanceof Box && other.isUnrotated) {
            return ShapeCollisions.boxToBox(this, other);
        }
        return _super.prototype.collidesWithShape.call(this, other);
    };
    Box.prototype.updateBox = function (width, height) {
        this.width = width;
        this.height = height;
        var halfWidth = width / 2;
        var halfHeight = height / 2;
        this.points[0] = new Vector2(-halfWidth, -halfHeight);
        this.points[1] = new Vector2(halfWidth, -halfHeight);
        this.points[2] = new Vector2(halfWidth, halfHeight);
        this.points[3] = new Vector2(-halfWidth, halfHeight);
        for (var i = 0; i < this.points.length; i++)
            this._originalPoints[i] = this.points[i];
    };
    Box.prototype.containsPoint = function (point) {
        if (this.isUnrotated)
            return this.bounds.containsInVec(point);
        return _super.prototype.containsPoint.call(this, point);
    };
    return Box;
}(Polygon));
var Circle = (function (_super) {
    __extends(Circle, _super);
    function Circle(radius) {
        var _this = _super.call(this) || this;
        _this.radius = radius;
        _this._originalRadius = radius;
        return _this;
    }
    Circle.prototype.pointCollidesWithShape = function (point) {
        return ShapeCollisions.pointToCircle(point, this);
    };
    Circle.prototype.collidesWithShape = function (other) {
        if (other instanceof Box && other.isUnrotated) {
            return ShapeCollisions.circleToBox(this, other);
        }
        if (other instanceof Circle) {
            return ShapeCollisions.circleToCircle(this, other);
        }
        if (other instanceof Polygon) {
            return ShapeCollisions.circleToPolygon(this, other);
        }
        throw new Error("Collisions of Circle to " + other + " are not supported");
    };
    Circle.prototype.recalculateBounds = function (collider) {
        this.center = collider.localOffset;
        if (collider.shouldColliderScaleAndRotateWithTransform) {
            var scale = collider.entity.scale;
            var hasUnitScale = scale.x == 1 && scale.y == 1;
            var maxScale = Math.max(scale.x, scale.y);
            this.radius = this._originalRadius * maxScale;
            if (collider.entity.rotation != 0) {
                var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                var offsetLength = hasUnitScale ? collider._localOffsetLength : (Vector2.multiply(collider.localOffset, collider.entity.scale)).length();
                this.center = MathHelper.pointOnCirlce(Vector2.zero, offsetLength, MathHelper.toDegrees(collider.entity.rotation) + offsetAngle);
            }
        }
        this.position = Vector2.add(collider.entity.position, this.center);
        this.bounds = new Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
    };
    Circle.prototype.overlaps = function (other) {
        if (other instanceof Box && other.isUnrotated)
            return Collisions.isRectToCircle(other.bounds, this.position, this.radius);
        if (other instanceof Circle)
            return Collisions.isCircleToCircle(this.position, this.radius, other.position, other.radius);
        if (other instanceof Polygon)
            return ShapeCollisions.circleToPolygon(this, other);
        throw new Error("overlaps of circle to " + other + " are not supported");
    };
    return Circle;
}(Shape));
var CollisionResult = (function () {
    function CollisionResult() {
        this.minimumTranslationVector = Vector2.zero;
        this.normal = Vector2.zero;
        this.point = Vector2.zero;
    }
    CollisionResult.prototype.invertResult = function () {
        this.minimumTranslationVector = Vector2.negate(this.minimumTranslationVector);
        this.normal = Vector2.negate(this.normal);
    };
    return CollisionResult;
}());
var ShapeCollisions = (function () {
    function ShapeCollisions() {
    }
    ShapeCollisions.polygonToPolygon = function (first, second) {
        var result = new CollisionResult();
        var isIntersecting = true;
        var firstEdges = first.edgeNormals;
        var secondEdges = second.edgeNormals;
        var minIntervalDistance = Number.POSITIVE_INFINITY;
        var translationAxis = new Vector2();
        var polygonOffset = Vector2.subtract(first.position, second.position);
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
            var relativeIntervalOffset = Vector2.dot(polygonOffset, axis);
            minA += relativeIntervalOffset;
            maxA += relativeIntervalOffset;
            intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
            if (intervalDist > 0)
                isIntersecting = false;
            if (!isIntersecting)
                return null;
            intervalDist = Math.abs(intervalDist);
            if (intervalDist < minIntervalDistance) {
                minIntervalDistance = intervalDist;
                translationAxis = axis;
                if (Vector2.dot(translationAxis, polygonOffset) < 0)
                    translationAxis = new Vector2(-translationAxis);
            }
        }
        result.normal = translationAxis;
        result.minimumTranslationVector = Vector2.multiply(new Vector2(-translationAxis.x, -translationAxis.y), new Vector2(minIntervalDistance));
        return result;
    };
    ShapeCollisions.intervalDistance = function (minA, maxA, minB, maxB) {
        if (minA < minB)
            return minB - maxA;
        return minA - minB;
    };
    ShapeCollisions.getInterval = function (axis, polygon, min, max) {
        var dot = Vector2.dot(polygon.points[0], axis);
        min = max = dot;
        for (var i = 1; i < polygon.points.length; i++) {
            dot = Vector2.dot(polygon.points[i], axis);
            if (dot < min) {
                min = dot;
            }
            else if (dot > max) {
                max = dot;
            }
        }
        return { min: min, max: max };
    };
    ShapeCollisions.circleToPolygon = function (circle, polygon) {
        var result = new CollisionResult();
        var poly2Circle = Vector2.subtract(circle.position, polygon.position);
        var gpp = Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle);
        var closestPoint = gpp.closestPoint;
        var distanceSquared = gpp.distanceSquared;
        result.normal = gpp.edgeNormal;
        var circleCenterInsidePoly = polygon.containsPoint(circle.position);
        if (distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
            return null;
        var mtv;
        if (circleCenterInsidePoly) {
            mtv = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared) - circle.radius));
        }
        else {
            if (distanceSquared == 0) {
                mtv = Vector2.multiply(result.normal, new Vector2(circle.radius));
            }
            else {
                var distance = Math.sqrt(distanceSquared);
                mtv = Vector2.multiply(new Vector2(-Vector2.subtract(poly2Circle, closestPoint)), new Vector2((circle.radius - distanceSquared) / distance));
            }
        }
        result.minimumTranslationVector = mtv;
        result.point = Vector2.add(closestPoint, polygon.position);
        return result;
    };
    ShapeCollisions.circleToBox = function (circle, box) {
        var result = new CollisionResult();
        var closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position).res;
        if (box.containsPoint(circle.position)) {
            result.point = closestPointOnBounds;
            var safePlace = Vector2.add(closestPointOnBounds, Vector2.subtract(result.normal, new Vector2(circle.radius)));
            result.minimumTranslationVector = Vector2.subtract(circle.position, safePlace);
            return result;
        }
        var sqrDistance = Vector2.distanceSquared(closestPointOnBounds, circle.position);
        if (sqrDistance == 0) {
            result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(circle.radius));
        }
        else if (sqrDistance <= circle.radius * circle.radius) {
            result.normal = Vector2.subtract(circle.position, closestPointOnBounds);
            var depth = result.normal.length() - circle.radius;
            result.normal = Vector2Ext.normalize(result.normal);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(depth), result.normal);
            return result;
        }
        return null;
    };
    ShapeCollisions.pointToCircle = function (point, circle) {
        var result = new CollisionResult();
        var distanceSquared = Vector2.distanceSquared(point, circle.position);
        var sumOfRadii = 1 + circle.radius;
        var collided = distanceSquared < sumOfRadii * sumOfRadii;
        if (collided) {
            result.normal = Vector2.normalize(Vector2.subtract(point, circle.position));
            var depth = sumOfRadii - Math.sqrt(distanceSquared);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth, -depth), result.normal);
            result.point = Vector2.add(circle.position, Vector2.multiply(result.normal, new Vector2(circle.radius, circle.radius)));
            return result;
        }
        return null;
    };
    ShapeCollisions.closestPointOnLine = function (lineA, lineB, closestTo) {
        var v = Vector2.subtract(lineB, lineA);
        var w = Vector2.subtract(closestTo, lineA);
        var t = Vector2.dot(w, v) / Vector2.dot(v, v);
        t = MathHelper.clamp(t, 0, 1);
        return Vector2.add(lineA, Vector2.multiply(v, new Vector2(t, t)));
    };
    ShapeCollisions.pointToPoly = function (point, poly) {
        var result = new CollisionResult();
        if (poly.containsPoint(point)) {
            var distanceSquared = void 0;
            var gpp = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position));
            var closestPoint = gpp.closestPoint;
            distanceSquared = gpp.distanceSquared;
            result.normal = gpp.edgeNormal;
            result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared), Math.sqrt(distanceSquared)));
            result.point = Vector2.add(closestPoint, poly.position);
            return result;
        }
        return null;
    };
    ShapeCollisions.circleToCircle = function (first, second) {
        var result = new CollisionResult();
        var distanceSquared = Vector2.distanceSquared(first.position, second.position);
        var sumOfRadii = first.radius + second.radius;
        var collided = distanceSquared < sumOfRadii * sumOfRadii;
        if (collided) {
            result.normal = Vector2.normalize(Vector2.subtract(first.position, second.position));
            var depth = sumOfRadii - Math.sqrt(distanceSquared);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth), result.normal);
            result.point = Vector2.add(second.position, Vector2.multiply(result.normal, new Vector2(second.radius)));
            return result;
        }
        return null;
    };
    ShapeCollisions.boxToBox = function (first, second) {
        var result = new CollisionResult();
        var minkowskiDiff = this.minkowskiDifference(first, second);
        if (minkowskiDiff.containsInVec(new Vector2(0, 0))) {
            result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();
            if (result.minimumTranslationVector.x == 0 && result.minimumTranslationVector.y == 0)
                return null;
            result.normal = new Vector2(-result.minimumTranslationVector.x, -result.minimumTranslationVector.y);
            result.normal.normalize();
            return result;
        }
        return null;
    };
    ShapeCollisions.minkowskiDifference = function (first, second) {
        var positionOffset = Vector2.subtract(first.position, Vector2.add(first.bounds.location, Vector2.divide(first.bounds.size, new Vector2(2))));
        var topLeft = Vector2.subtract(Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
        var fullSize = Vector2.add(first.bounds.size, second.bounds.size);
        return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y);
    };
    return ShapeCollisions;
}());
var SpatialHash = (function () {
    function SpatialHash(cellSize) {
        if (cellSize === void 0) { cellSize = 100; }
        this.gridBounds = new Rectangle();
        this._overlapTestCircle = new Circle(0);
        this._tempHashSet = [];
        this._cellDict = new NumberDictionary();
        this._cellSize = cellSize;
        this._inverseCellSize = 1 / this._cellSize;
        this._raycastParser = new RaycastResultParser();
    }
    SpatialHash.prototype.remove = function (collider) {
        var bounds = collider.registeredPhysicsBounds;
        var p1 = this.cellCoords(bounds.x, bounds.y);
        var p2 = this.cellCoords(bounds.right, bounds.bottom);
        for (var x = p1.x; x <= p2.x; x++) {
            for (var y = p1.y; y <= p2.y; y++) {
                var cell = this.cellAtPosition(x, y);
                if (!cell)
                    console.error("removing Collider [" + collider + "] from a cell that it is not present in");
                else
                    cell.remove(collider);
            }
        }
    };
    SpatialHash.prototype.register = function (collider) {
        var bounds = collider.bounds;
        collider.registeredPhysicsBounds = bounds;
        var p1 = this.cellCoords(bounds.x, bounds.y);
        var p2 = this.cellCoords(bounds.right, bounds.bottom);
        if (!this.gridBounds.containsInVec(new Vector2(p1.x, p1.y))) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p1);
        }
        if (!this.gridBounds.containsInVec(new Vector2(p2.x, p2.y))) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p2);
        }
        for (var x = p1.x; x <= p2.x; x++) {
            for (var y = p1.y; y <= p2.y; y++) {
                var c = this.cellAtPosition(x, y, true);
                c.push(collider);
            }
        }
    };
    SpatialHash.prototype.clear = function () {
        this._cellDict.clear();
    };
    SpatialHash.prototype.overlapCircle = function (circleCenter, radius, results, layerMask) {
        var bounds = new Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);
        this._overlapTestCircle.radius = radius;
        this._overlapTestCircle.position = circleCenter;
        var resultCounter = 0;
        var aabbBroadphaseResult = this.aabbBroadphase(bounds, null, layerMask);
        bounds = aabbBroadphaseResult.bounds;
        var potentials = aabbBroadphaseResult.tempHashSet;
        for (var i = 0; i < potentials.length; i++) {
            var collider = potentials[i];
            if (collider instanceof BoxCollider) {
                results[resultCounter] = collider;
                resultCounter++;
            }
            else {
                throw new Error("overlapCircle against this collider type is not implemented!");
            }
            if (resultCounter == results.length)
                return resultCounter;
        }
        return resultCounter;
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
                for (var i = 0; i < cell.length; i++) {
                    var collider = cell[i];
                    if (collider == excludeCollider || !Flags.isFlagSet(layerMask, collider.physicsLayer))
                        continue;
                    if (bounds.intersects(collider.bounds)) {
                        if (this._tempHashSet.indexOf(collider) == -1)
                            this._tempHashSet.push(collider);
                    }
                }
            }
        }
        return { tempHashSet: this._tempHashSet, bounds: bounds };
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
    SpatialHash.prototype.cellCoords = function (x, y) {
        return new Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
    };
    return SpatialHash;
}());
var RaycastResultParser = (function () {
    function RaycastResultParser() {
    }
    return RaycastResultParser;
}());
var NumberDictionary = (function () {
    function NumberDictionary() {
        this._store = new Map();
    }
    NumberDictionary.prototype.getKey = function (x, y) {
        return Long.fromNumber(x).shiftLeft(32).or(this.intToUint(y)).toString();
    };
    NumberDictionary.prototype.intToUint = function (i) {
        if (i >= 0)
            return i;
        else
            return 4294967296 + i;
    };
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
    NumberDictionary.prototype.clear = function () {
        this._store.clear();
    };
    return NumberDictionary;
}());
var ContentManager = (function () {
    function ContentManager() {
        this.loadedAssets = new Map();
    }
    ContentManager.prototype.loadRes = function (name, local) {
        var _this = this;
        if (local === void 0) { local = true; }
        return new Promise(function (resolve, reject) {
            var res = _this.loadedAssets.get(name);
            if (res) {
                resolve(res);
                return;
            }
            if (local) {
                RES.getResAsync(name).then(function (data) {
                    _this.loadedAssets.set(name, data);
                    resolve(data);
                }).catch(function (err) {
                    console.error("资源加载错误:", name, err);
                    reject(err);
                });
            }
            else {
                RES.getResByUrl(name).then(function (data) {
                    _this.loadedAssets.set(name, data);
                    resolve(data);
                }).catch(function (err) {
                    console.error("资源加载错误:", name, err);
                    reject(err);
                });
            }
        });
    };
    ContentManager.prototype.dispose = function () {
        this.loadedAssets.forEach(function (value) {
            var assetsToRemove = value;
            assetsToRemove.dispose();
        });
        this.loadedAssets.clear();
    };
    return ContentManager;
}());
var Emitter = (function () {
    function Emitter() {
        this._messageTable = new Map();
    }
    Emitter.prototype.addObserver = function (eventType, handler) {
        var list = this._messageTable.get(eventType);
        if (!list) {
            list = [];
            this._messageTable.set(eventType, list);
        }
        if (list.contains(handler))
            console.warn("您试图添加相同的观察者两次");
        list.push(handler);
    };
    Emitter.prototype.removeObserver = function (eventType, handler) {
        this._messageTable.get(eventType).remove(handler);
    };
    Emitter.prototype.emit = function (eventType, data) {
        var list = this._messageTable.get(eventType);
        if (list) {
            for (var i = list.length - 1; i >= 0; i--)
                list[i](data);
        }
    };
    return Emitter;
}());
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
    GlobalManager.prototype.onEnabled = function () { };
    GlobalManager.prototype.onDisabled = function () { };
    GlobalManager.prototype.update = function () { };
    GlobalManager.registerGlobalManager = function (manager) {
        this.globalManagers.push(manager);
        manager.enabled = true;
    };
    GlobalManager.unregisterGlobalManager = function (manager) {
        this.globalManagers.remove(manager);
        manager.enabled = false;
    };
    GlobalManager.getGlobalManager = function (type) {
        for (var i = 0; i < this.globalManagers.length; i++) {
            if (this.globalManagers[i] instanceof type)
                return this.globalManagers[i];
        }
        return null;
    };
    GlobalManager.globalManagers = [];
    return GlobalManager;
}());
var TouchState = (function () {
    function TouchState() {
        this.x = 0;
        this.y = 0;
        this.touchPoint = -1;
        this.touchDown = false;
    }
    Object.defineProperty(TouchState.prototype, "position", {
        get: function () {
            return new Vector2(this.x, this.y);
        },
        enumerable: true,
        configurable: true
    });
    TouchState.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
        this.touchDown = false;
        this.touchPoint = -1;
    };
    return TouchState;
}());
var Input = (function () {
    function Input() {
    }
    Object.defineProperty(Input, "touchPosition", {
        get: function () {
            if (!this._gameTouchs[0])
                return Vector2.zero;
            return this._gameTouchs[0].position;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input, "maxSupportedTouch", {
        get: function () {
            return this._stage.maxTouches;
        },
        set: function (value) {
            this._stage.maxTouches = value;
            this.initTouchCache();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input, "resolutionScale", {
        get: function () {
            return this._resolutionScale;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input, "totalTouchCount", {
        get: function () {
            return this._totalTouchCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input, "gameTouchs", {
        get: function () {
            return this._gameTouchs;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input, "touchPositionDelta", {
        get: function () {
            var delta = Vector2.subtract(this.touchPosition, this._previousTouchState.position);
            if (delta.length() > 0) {
                this.setpreviousTouchState(this._gameTouchs[0]);
            }
            return delta;
        },
        enumerable: true,
        configurable: true
    });
    Input.initialize = function (stage) {
        if (this._init)
            return;
        this._init = true;
        this._stage = stage;
        this._stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
        this._stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
        this._stage.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
        this._stage.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.touchEnd, this);
        this._stage.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.touchEnd, this);
        this.initTouchCache();
    };
    Input.initTouchCache = function () {
        this._totalTouchCount = 0;
        this._touchIndex = 0;
        this._gameTouchs.length = 0;
        for (var i = 0; i < this.maxSupportedTouch; i++) {
            this._gameTouchs.push(new TouchState());
        }
    };
    Input.touchBegin = function (evt) {
        if (this._touchIndex < this.maxSupportedTouch) {
            this._gameTouchs[this._touchIndex].touchPoint = evt.touchPointID;
            this._gameTouchs[this._touchIndex].touchDown = evt.touchDown;
            this._gameTouchs[this._touchIndex].x = evt.stageX;
            this._gameTouchs[this._touchIndex].y = evt.stageY;
            if (this._touchIndex == 0) {
                this.setpreviousTouchState(this._gameTouchs[0]);
            }
            this._touchIndex++;
            this._totalTouchCount++;
        }
    };
    Input.touchMove = function (evt) {
        if (evt.touchPointID == this._gameTouchs[0].touchPoint) {
            this.setpreviousTouchState(this._gameTouchs[0]);
        }
        var touchIndex = this._gameTouchs.findIndex(function (touch) { return touch.touchPoint == evt.touchPointID; });
        if (touchIndex != -1) {
            var touchData = this._gameTouchs[touchIndex];
            touchData.x = evt.stageX;
            touchData.y = evt.stageY;
        }
    };
    Input.touchEnd = function (evt) {
        var touchIndex = this._gameTouchs.findIndex(function (touch) { return touch.touchPoint == evt.touchPointID; });
        if (touchIndex != -1) {
            var touchData = this._gameTouchs[touchIndex];
            touchData.reset();
            if (touchIndex == 0)
                this._previousTouchState.reset();
            this._totalTouchCount--;
            if (this.totalTouchCount == 0) {
                this._touchIndex = 0;
            }
        }
    };
    Input.setpreviousTouchState = function (touchState) {
        this._previousTouchState = new TouchState();
        this._previousTouchState.x = touchState.position.x;
        this._previousTouchState.y = touchState.position.y;
        this._previousTouchState.touchPoint = touchState.touchPoint;
        this._previousTouchState.touchDown = touchState.touchDown;
    };
    Input.scaledPosition = function (position) {
        var scaledPos = new Vector2(position.x - this._resolutionOffset.x, position.y - this._resolutionOffset.y);
        return Vector2.multiply(scaledPos, this.resolutionScale);
    };
    Input._init = false;
    Input._previousTouchState = new TouchState();
    Input._gameTouchs = [];
    Input._resolutionOffset = new Vector2();
    Input._resolutionScale = Vector2.one;
    Input._touchIndex = 0;
    Input._totalTouchCount = 0;
    return Input;
}());
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
var RectangleExt = (function () {
    function RectangleExt() {
    }
    RectangleExt.union = function (first, point) {
        var rect = new Rectangle(point.x, point.y, 0, 0);
        return this.unionR(first, rect);
    };
    RectangleExt.unionR = function (value1, value2) {
        var result = new Rectangle();
        result.x = Math.min(value1.x, value2.x);
        result.y = Math.min(value1.y, value2.y);
        result.width = Math.max(value1.right, value2.right) - result.x;
        result.height = Math.max(value1.bottom, value2.bottom) - result.y;
        return result;
    };
    return RectangleExt;
}());
var Triangulator = (function () {
    function Triangulator() {
        this.triangleIndices = [];
        this._triPrev = new Array(12);
        this._triNext = new Array(12);
    }
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
            if (Vector2Ext.isTriangleCCW(a, b, c)) {
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
    Triangulator.testPointTriangle = function (point, a, b, c) {
        if (Vector2Ext.cross(Vector2.subtract(point, a), Vector2.subtract(b, a)) < 0)
            return false;
        if (Vector2Ext.cross(Vector2.subtract(point, b), Vector2.subtract(c, b)) < 0)
            return false;
        if (Vector2Ext.cross(Vector2.subtract(point, c), Vector2.subtract(a, c)) < 0)
            return false;
        return true;
    };
    return Triangulator;
}());
var Vector2Ext = (function () {
    function Vector2Ext() {
    }
    Vector2Ext.isTriangleCCW = function (a, center, c) {
        return this.cross(Vector2.subtract(center, a), Vector2.subtract(c, center)) < 0;
    };
    Vector2Ext.cross = function (u, v) {
        return u.y * v.x - u.x * v.y;
    };
    Vector2Ext.perpendicular = function (first, second) {
        return new Vector2(-1 * (second.y - first.y), second.x - first.x);
    };
    Vector2Ext.normalize = function (vec) {
        var magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
        if (magnitude > MathHelper.Epsilon) {
            vec = Vector2.divide(vec, new Vector2(magnitude));
        }
        else {
            vec.x = vec.y = 0;
        }
        return vec;
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
    Vector2Ext.transformR = function (position, matrix) {
        var x = (position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31;
        var y = (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32;
        return new Vector2(x, y);
    };
    Vector2Ext.transform = function (sourceArray, matrix, destinationArray) {
        this.transformA(sourceArray, 0, matrix, destinationArray, 0, sourceArray.length);
    };
    Vector2Ext.round = function (vec) {
        return new Vector2(Math.round(vec.x), Math.round(vec.y));
    };
    return Vector2Ext;
}());
