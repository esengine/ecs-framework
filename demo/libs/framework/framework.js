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
            if (array[i] instanceof egret.HashObject && value instanceof egret.HashObject) {
                if (array[i].hashCode == value.hashCode)
                    return true;
            }
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
    var PriorityQueueNode = (function () {
        function PriorityQueueNode() {
            this.priority = 0;
            this.insertionIndex = 0;
            this.queueIndex = 0;
        }
        return PriorityQueueNode;
    }());
    es.PriorityQueueNode = PriorityQueueNode;
})(es || (es = {}));
var es;
(function (es) {
    var AStarPathfinder = (function () {
        function AStarPathfinder() {
        }
        AStarPathfinder.search = function (graph, start, goal) {
            var _this = this;
            var foundPath = false;
            var cameFrom = new Map();
            cameFrom.set(start, start);
            var costSoFar = new Map();
            var frontier = new es.PriorityQueue(1000);
            frontier.enqueue(new AStarNode(start), 0);
            costSoFar.set(start, 0);
            var _loop_2 = function () {
                var current = frontier.dequeue();
                if (current.data instanceof es.Vector2 && goal instanceof es.Vector2 && current.data.equals(goal)) {
                    foundPath = true;
                    return "break";
                }
                else if (current.data == goal) {
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
        AStarPathfinder.hasKey = function (map, compareKey) {
            var iterator = map.keys();
            var r;
            while (r = iterator.next(), !r.done) {
                if (r.value instanceof es.Vector2 && compareKey instanceof es.Vector2 && r.value.equals(compareKey))
                    return true;
                else if (r.value == compareKey)
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
                if (r.value instanceof es.Vector2 && compareKey instanceof es.Vector2 && r.value.equals(compareKey))
                    return v.value;
                else if (r.value == compareKey)
                    return v.value;
            }
            return null;
        };
        return AStarPathfinder;
    }());
    es.AStarPathfinder = AStarPathfinder;
    var AStarNode = (function (_super) {
        __extends(AStarNode, _super);
        function AStarNode(data) {
            var _this = _super.call(this) || this;
            _this.data = data;
            return _this;
        }
        return AStarNode;
    }(es.PriorityQueueNode));
})(es || (es = {}));
var es;
(function (es) {
    var AstarGridGraph = (function () {
        function AstarGridGraph(width, height) {
            this.dirs = [
                new es.Vector2(1, 0),
                new es.Vector2(0, -1),
                new es.Vector2(-1, 0),
                new es.Vector2(0, 1)
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
            return !this.walls.firstOrDefault(function (wall) { return wall.equals(node); });
        };
        AstarGridGraph.prototype.search = function (start, goal) {
            return es.AStarPathfinder.search(this, start, goal);
        };
        AstarGridGraph.prototype.getNeighbors = function (node) {
            var _this = this;
            this._neighbors.length = 0;
            this.dirs.forEach(function (dir) {
                var next = new es.Vector2(node.x + dir.x, node.y + dir.y);
                if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                    _this._neighbors.push(next);
            });
            return this._neighbors;
        };
        AstarGridGraph.prototype.cost = function (from, to) {
            return this.weightedNodes.find(function (p) { return p.equals(to); }) ? this.weightedNodeWeight : this.defaultWeight;
        };
        AstarGridGraph.prototype.heuristic = function (node, goal) {
            return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
        };
        return AstarGridGraph;
    }());
    es.AstarGridGraph = AstarGridGraph;
})(es || (es = {}));
var es;
(function (es) {
    var PriorityQueue = (function () {
        function PriorityQueue(maxNodes) {
            this._numNodes = 0;
            this._nodes = new Array(maxNodes + 1);
            this._numNodesEverEnqueued = 0;
        }
        Object.defineProperty(PriorityQueue.prototype, "count", {
            get: function () {
                return this._numNodes;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PriorityQueue.prototype, "maxSize", {
            get: function () {
                return this._nodes.length - 1;
            },
            enumerable: true,
            configurable: true
        });
        PriorityQueue.prototype.clear = function () {
            this._nodes.splice(1, this._numNodes);
            this._numNodes = 0;
        };
        PriorityQueue.prototype.contains = function (node) {
            if (!node) {
                console.error("node cannot be null");
                return false;
            }
            if (node.queueIndex < 0 || node.queueIndex >= this._nodes.length) {
                console.error("node.QueueIndex has been corrupted. Did you change it manually? Or add this node to another queue?");
                return false;
            }
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
    es.PriorityQueue = PriorityQueue;
})(es || (es = {}));
var es;
(function (es) {
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
            return foundPath ? es.AStarPathfinder.recontructPath(cameFrom, start, goal) : null;
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
    es.BreadthFirstPathfinder = BreadthFirstPathfinder;
})(es || (es = {}));
var es;
(function (es) {
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
    es.UnweightedGraph = UnweightedGraph;
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
                var next = new es.Vector2(node.x + dir.x, node.y + dir.y);
                if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                    _this._neighbors.push(next);
            });
            return this._neighbors;
        };
        UnweightedGridGraph.prototype.search = function (start, goal) {
            return es.BreadthFirstPathfinder.search(this, start, goal);
        };
        UnweightedGridGraph.CARDINAL_DIRS = [
            new es.Vector2(1, 0),
            new es.Vector2(0, -1),
            new es.Vector2(-1, 0),
            new es.Vector2(0, -1)
        ];
        UnweightedGridGraph.COMPASS_DIRS = [
            new es.Vector2(1, 0),
            new es.Vector2(1, -1),
            new es.Vector2(0, -1),
            new es.Vector2(-1, -1),
            new es.Vector2(-1, 0),
            new es.Vector2(-1, 1),
            new es.Vector2(0, 1),
            new es.Vector2(1, 1),
        ];
        return UnweightedGridGraph;
    }());
    es.UnweightedGridGraph = UnweightedGridGraph;
})(es || (es = {}));
var es;
(function (es) {
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
            return es.WeightedPathfinder.search(this, start, goal);
        };
        WeightedGridGraph.prototype.getNeighbors = function (node) {
            var _this = this;
            this._neighbors.length = 0;
            this._dirs.forEach(function (dir) {
                var next = new es.Vector2(node.x + dir.x, node.y + dir.y);
                if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                    _this._neighbors.push(next);
            });
            return this._neighbors;
        };
        WeightedGridGraph.prototype.cost = function (from, to) {
            return this.weightedNodes.find(function (t) { return JSON.stringify(t) == JSON.stringify(to); }) ? this.weightedNodeWeight : this.defaultWeight;
        };
        WeightedGridGraph.CARDINAL_DIRS = [
            new es.Vector2(1, 0),
            new es.Vector2(0, -1),
            new es.Vector2(-1, 0),
            new es.Vector2(0, 1)
        ];
        WeightedGridGraph.COMPASS_DIRS = [
            new es.Vector2(1, 0),
            new es.Vector2(1, -1),
            new es.Vector2(0, -1),
            new es.Vector2(-1, -1),
            new es.Vector2(-1, 0),
            new es.Vector2(-1, 1),
            new es.Vector2(0, 1),
            new es.Vector2(1, 1),
        ];
        return WeightedGridGraph;
    }());
    es.WeightedGridGraph = WeightedGridGraph;
})(es || (es = {}));
var es;
(function (es) {
    var WeightedNode = (function (_super) {
        __extends(WeightedNode, _super);
        function WeightedNode(data) {
            var _this = _super.call(this) || this;
            _this.data = data;
            return _this;
        }
        return WeightedNode;
    }(es.PriorityQueueNode));
    es.WeightedNode = WeightedNode;
    var WeightedPathfinder = (function () {
        function WeightedPathfinder() {
        }
        WeightedPathfinder.search = function (graph, start, goal) {
            var _this = this;
            var foundPath = false;
            var cameFrom = new Map();
            cameFrom.set(start, start);
            var costSoFar = new Map();
            var frontier = new es.PriorityQueue(1000);
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
        return WeightedPathfinder;
    }());
    es.WeightedPathfinder = WeightedPathfinder;
})(es || (es = {}));
var es;
(function (es) {
    var AStarStorage = (function () {
        function AStarStorage() {
            this._opened = new Array(AStarStorage.MAX_NODES);
            this._closed = new Array(AStarStorage.MAX_NODES);
        }
        AStarStorage.prototype.clear = function () {
            for (var i = 0; i < this._numOpened; i++) {
                es.Pool.free(this._opened[i]);
                this._opened[i] = null;
            }
            for (var i = 0; i < this._numClosed; i++) {
                es.Pool.free(this._closed[i]);
                this._closed[i] = null;
            }
            this._numOpened = this._numClosed = 0;
            this._lastFoundClosed = this._lastFoundOpened = 0;
        };
        AStarStorage.prototype.findOpened = function (node) {
            for (var i = 0; i < this._numOpened; i++) {
                var care = node.worldState.dontCare ^ -1;
                if ((node.worldState.values & care) == (this._opened[i].worldState.values & care)) {
                    this._lastFoundClosed = i;
                    return this._closed[i];
                }
            }
            return null;
        };
        AStarStorage.prototype.findClosed = function (node) {
            for (var i = 0; i < this._numClosed; i++) {
                var care = node.worldState.dontCare ^ -1;
                if ((node.worldState.values & care) == (this._closed[i].worldState.values & care)) {
                    this._lastFoundClosed = i;
                    return this._closed[i];
                }
            }
            return null;
        };
        AStarStorage.prototype.hasOpened = function () {
            return this._numOpened > 0;
        };
        AStarStorage.prototype.removeOpened = function (node) {
            if (this._numOpened > 0)
                this._opened[this._lastFoundOpened] = this._opened[this._numOpened - 1];
            this._numOpened--;
        };
        AStarStorage.prototype.removeClosed = function (node) {
            if (this._numClosed > 0)
                this._closed[this._lastFoundClosed] = this._closed[this._numClosed - 1];
            this._numClosed--;
        };
        AStarStorage.prototype.isOpen = function (node) {
            return this._opened.indexOf(node) > -1;
        };
        AStarStorage.prototype.isClosed = function (node) {
            return this._closed.indexOf(node) > -1;
        };
        AStarStorage.prototype.addToOpenList = function (node) {
            this._opened[this._numOpened++] = node;
        };
        AStarStorage.prototype.addToClosedList = function (node) {
            this._closed[this._numClosed++] = node;
        };
        AStarStorage.prototype.removeCheapestOpenNode = function () {
            var lowestVal = Number.MAX_VALUE;
            this._lastFoundOpened = -1;
            for (var i = 0; i < this._numOpened; i++) {
                if (this._opened[i].costSoFarAndHeuristicCost < lowestVal) {
                    lowestVal = this._opened[i].costSoFarAndHeuristicCost;
                    this._lastFoundOpened = i;
                }
            }
            var val = this._opened[this._lastFoundOpened];
            this.removeOpened(val);
            return val;
        };
        AStarStorage.MAX_NODES = 128;
        return AStarStorage;
    }());
    es.AStarStorage = AStarStorage;
})(es || (es = {}));
var es;
(function (es) {
    var AStarNode = (function () {
        function AStarNode() {
        }
        AStarNode.prototype.equals = function (other) {
            var care = this.worldState.dontCare ^ -1;
            return (this.worldState.values & care) == (other.worldState.values & care);
        };
        AStarNode.prototype.compareTo = function (other) {
            return this.costSoFarAndHeuristicCost - other.costSoFarAndHeuristicCost;
        };
        AStarNode.prototype.reset = function () {
            this.action = null;
            this.parent = null;
        };
        AStarNode.prototype.clone = function () {
            var node = new AStarNode();
            node.action = this.action;
            node.costSoFar = this.costSoFar;
            node.depth = this.depth;
            node.parent = this.parent;
            node.parentWorldState = this.parentWorldState;
            node.heuristicCost = this.heuristicCost;
            node.worldState = this.worldState;
            return node;
        };
        AStarNode.prototype.toString = function () {
            return "[cost: " + this.costSoFar + " | heuristic: " + this.heuristicCost + "]: " + this.action;
        };
        return AStarNode;
    }());
    es.AStarNode = AStarNode;
    var AStar = (function () {
        function AStar() {
        }
        AStar.plan = function (ap, start, goal, selectedNodes) {
            if (selectedNodes === void 0) { selectedNodes = null; }
            this.storage.clear();
            var currentNode = es.Pool.obtain(AStarNode);
            currentNode.worldState = start;
            currentNode.parentWorldState = start;
            currentNode.costSoFar = 0;
            currentNode.heuristicCost = this.calculateHeuristic(start, goal);
            currentNode.costSoFarAndHeuristicCost = currentNode.costSoFar + currentNode.heuristicCost;
            currentNode.depth = 1;
            this.storage.addToOpenList(currentNode);
            while (true) {
                if (!this.storage.hasOpened()) {
                    this.storage.clear();
                    return null;
                }
                currentNode = this.storage.removeCheapestOpenNode();
                this.storage.addToClosedList(currentNode);
                if (goal.equals(currentNode.worldState)) {
                    var plan = this.reconstructPlan(currentNode, selectedNodes);
                    this.storage.clear();
                    return plan;
                }
                var neighbors = ap.getPossibleTransitions(currentNode.worldState);
                for (var i = 0; i < neighbors.length; i++) {
                    var cur = neighbors[i];
                    var opened = this.storage.findOpened(cur);
                    var closed_1 = this.storage.findClosed(cur);
                    var cost = currentNode.costSoFar + cur.costSoFar;
                    if (opened != null && cost < opened.costSoFar) {
                        this.storage.removeOpened(opened);
                        opened = null;
                    }
                    if (closed_1 != null && cost < closed_1.costSoFar) {
                        this.storage.removeClosed(closed_1);
                    }
                    if (opened == null && closed_1 == null) {
                        var nb = es.Pool.obtain(AStarNode);
                        nb.worldState = cur.worldState;
                        nb.costSoFar = cost;
                        nb.heuristicCost = this.calculateHeuristic(cur.worldState, goal);
                        nb.costSoFarAndHeuristicCost = nb.costSoFar + nb.heuristicCost;
                        nb.action = cur.action;
                        nb.parentWorldState = currentNode.worldState;
                        nb.parent = currentNode;
                        nb.depth = currentNode.depth + 1;
                        this.storage.addToOpenList(nb);
                    }
                }
                es.ListPool.free(neighbors);
            }
        };
        AStar.reconstructPlan = function (goalNode, selectedNodes) {
            var totalActionsInPlan = goalNode.depth - 1;
            var plan = new Array(totalActionsInPlan);
            var curnode = goalNode;
            for (var i = 0; i <= totalActionsInPlan - 1; i++) {
                if (selectedNodes != null)
                    selectedNodes.push(curnode.clone());
                plan.push(curnode.action);
                curnode = curnode.parent;
            }
            if (selectedNodes != null)
                selectedNodes.reverse();
            return plan;
        };
        AStar.calculateHeuristic = function (fr, to) {
            var care = (to.dontCare ^ -1);
            var diff = (fr.values & care) ^ (to.values & care);
            var dist = 0;
            for (var i = 0; i < es.ActionPlanner.MAX_CONDITIONS; ++i)
                if ((diff & (1 << i)) != 0)
                    dist++;
            return dist;
        };
        AStar.storage = new es.AStarStorage();
        return AStar;
    }());
    es.AStar = AStar;
})(es || (es = {}));
var es;
(function (es) {
    var Action = (function () {
        function Action(name, cost) {
            if (cost === void 0) { cost = 1; }
            this.cost = 1;
            this._preConditions = new Set();
            this._postConditions = new Set();
            this.name = name;
            this.cost = cost;
        }
        Action.prototype.setPrecondition = function (conditionName, value) {
            this._preConditions.add([conditionName, value]);
        };
        Action.prototype.setPostcondition = function (conditionName, value) {
            this._preConditions.add([conditionName, value]);
        };
        Action.prototype.validate = function () {
            return true;
        };
        Action.prototype.toString = function () {
            return "[Action] " + this.name + " - cost: " + this.cost;
        };
        return Action;
    }());
    es.Action = Action;
})(es || (es = {}));
var es;
(function (es) {
    var ActionPlanner = (function () {
        function ActionPlanner() {
            this.conditionNames = new Array(ActionPlanner.MAX_CONDITIONS);
            this._actions = [];
            this._viableActions = [];
            this._preConditions = new Array(ActionPlanner.MAX_CONDITIONS);
            this._postConditions = new Array(ActionPlanner.MAX_CONDITIONS);
            this._numConditionNames = 0;
            for (var i = 0; i < ActionPlanner.MAX_CONDITIONS; ++i) {
                this.conditionNames[i] = null;
                this._preConditions[i] = es.WorldState.create(this);
                this._postConditions[i] = es.WorldState.create(this);
            }
        }
        ActionPlanner.prototype.createWorldState = function () {
            return es.WorldState.create(this);
        };
        ActionPlanner.prototype.addAction = function (action) {
            var _this = this;
            var actionId = this.findActionIndex(action);
            if (actionId == -1)
                throw new Error("无法找到或创建行动");
            action._preConditions.forEach(function (preCondition) {
                var conditionId = _this.findConditionNameIndex(preCondition[0]);
                if (conditionId == -1)
                    throw new Error("无法找到或创建条件名称");
                _this._preConditions[actionId].set(conditionId, preCondition[1]);
            });
            action._postConditions.forEach(function (postCondition) {
                var conditionId = _this.findConditionNameIndex(postCondition[0]);
                if (conditionId == -1)
                    throw new Error("找不到条件名称");
                _this._postConditions[actionId].set(conditionId, postCondition[1]);
            });
        };
        ActionPlanner.prototype.plan = function (startState, goalState, selectedNode) {
            if (selectedNode === void 0) { selectedNode = null; }
            this._viableActions.length = 0;
            for (var i = 0; i < this._actions.length; i++) {
                if (this._actions[i].validate())
                    this._viableActions.push(this._actions[i]);
            }
            return es.AStar.plan(this, startState, goalState, selectedNode);
        };
        ActionPlanner.prototype.getPossibleTransitions = function (fr) {
            var result = es.ListPool.obtain();
            for (var i = 0; i < this._viableActions.length; ++i) {
                var pre = this._preConditions[i];
                var care = (pre.dontCare ^ -1);
                var met = ((pre.values & care) == (fr.values & care));
                if (met) {
                    var node = es.Pool.obtain(es.AStarNode);
                    node.action = this._viableActions[i];
                    node.costSoFar = this._viableActions[i].cost;
                    node.worldState = this.applyPostConditions(this, i, fr);
                    result.push(node);
                }
            }
            return result;
        };
        ActionPlanner.prototype.applyPostConditions = function (ap, actionnr, fr) {
            var pst = ap._postConditions[actionnr];
            var unaffected = pst.dontCare;
            var affected = (unaffected ^ -1);
            fr.values = (fr.values & unaffected) | (pst.values & affected);
            fr.dontCare &= pst.dontCare;
            return fr;
        };
        ActionPlanner.prototype.findConditionNameIndex = function (conditionName) {
            var idx;
            for (idx = 0; idx < this._numConditionNames; ++idx) {
                if (this.conditionNames[idx] == conditionName)
                    return idx;
            }
            if (idx < ActionPlanner.MAX_CONDITIONS - 1) {
                this.conditionNames[idx] = conditionName;
                this._numConditionNames++;
                return idx;
            }
            return -1;
        };
        ActionPlanner.prototype.findActionIndex = function (action) {
            var idx = this._actions.indexOf(action);
            if (idx > -1)
                return idx;
            this._actions.push(action);
            return this._actions.length - 1;
        };
        ActionPlanner.MAX_CONDITIONS = 64;
        return ActionPlanner;
    }());
    es.ActionPlanner = ActionPlanner;
})(es || (es = {}));
var es;
(function (es) {
    var Agent = (function () {
        function Agent() {
            this._planner = new es.ActionPlanner();
        }
        Agent.prototype.plan = function (debugPlan) {
            if (debugPlan === void 0) { debugPlan = false; }
            var nodes = null;
            if (debugPlan)
                nodes = [];
            this.actions = this._planner.plan(this.getWorldState(), this.getGoalState(), nodes);
            if (nodes != null && nodes.length > 0) {
                console.log("---- ActionPlanner plan ----");
                console.log("plan cost = " + nodes[nodes.length - 1].costSoFar);
                console.log("               start" + "\t" + this.getWorldState().describe(this._planner));
                for (var i = 0; i < nodes.length; i++) {
                    console.log(i + ": " + nodes[i].action.name + "\t" + nodes[i].worldState.describe(this._planner));
                    es.Pool.free(nodes[i]);
                }
            }
            return this.hasActionPlan();
        };
        Agent.prototype.hasActionPlan = function () {
            return this.actions != null && this.actions.length > 0;
        };
        return Agent;
    }());
    es.Agent = Agent;
})(es || (es = {}));
var es;
(function (es) {
    var WorldState = (function () {
        function WorldState(planner, values, dontcare) {
            this.planner = planner;
            this.values = values;
            this.dontCare = dontcare;
        }
        WorldState.create = function (planner) {
            return new WorldState(planner, 0, -1);
        };
        WorldState.prototype.set = function (conditionId, value) {
            if (typeof conditionId == "string") {
                return this.set(this.planner.findConditionNameIndex(conditionId), value);
            }
            this.values = value ? (this.values | (1 << conditionId)) : (this.values & ~(1 << conditionId));
            this.dontCare ^= (1 << conditionId);
            return true;
        };
        WorldState.prototype.equals = function (other) {
            var care = this.dontCare ^ -1;
            return (this.values & care) == (other.values & care);
        };
        WorldState.prototype.describe = function (planner) {
            var s = "";
            for (var i = 0; i < es.ActionPlanner.MAX_CONDITIONS; i++) {
                if ((this.dontCare & (1 << i)) == 0) {
                    var val = planner.conditionNames[i];
                    if (val == null)
                        continue;
                    var set = ((this.values & (1 << i)) != 0);
                    if (s.length > 0)
                        s += ", ";
                    s += (set ? val.toUpperCase() : val);
                }
            }
            return s;
        };
        return WorldState;
    }());
    es.WorldState = WorldState;
})(es || (es = {}));
var es;
(function (es) {
    var Core = (function (_super) {
        __extends(Core, _super);
        function Core() {
            var _this = _super.call(this) || this;
            _this._globalManagers = [];
            _this._coroutineManager = new es.CoroutineManager();
            _this._timerManager = new es.TimerManager();
            _this._frameCounterElapsedTime = 0;
            _this._frameCounter = 0;
            Core._instance = _this;
            Core.emitter = new es.Emitter();
            Core.content = new es.ContentManager();
            _this.addEventListener(egret.Event.ADDED_TO_STAGE, _this.onAddToStage, _this);
            Core.registerGlobalManager(_this._coroutineManager);
            Core.registerGlobalManager(_this._timerManager);
            return _this;
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
                    this._instance.addChild(value);
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
        Core.startCoroutine = function (enumerator) {
            return this._instance._coroutineManager.startCoroutine(enumerator);
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
                                es.Debug.render();
                                this._scene.postRender();
                            }
                            _a.label = 5;
                        case 5: return [2];
                    }
                });
            });
        };
        Core.prototype.startDebugUpdate = function () {
            es.TimeRuler.Instance.startFrame();
            es.TimeRuler.Instance.beginMark("update", 0x00FF00);
        };
        Core.prototype.endDebugUpdate = function () {
            es.TimeRuler.Instance.endMark("update");
        };
        Core.prototype.startDebugDraw = function (elapsedGameTime) {
            es.TimeRuler.Instance.beginMark("draw", 0xFFD700);
            this._frameCounter++;
            this._frameCounterElapsedTime += elapsedGameTime;
            if (this._frameCounterElapsedTime >= 1) {
                this._frameCounter = 0;
                this._frameCounterElapsedTime -= 1;
            }
        };
        Core.prototype.endDebugDraw = function () {
            es.TimeRuler.Instance.endMark("draw");
            es.TimeRuler.Instance.render();
        };
        Core.prototype.onSceneChanged = function () {
            Core.emitter.emit(es.CoreEvents.SceneChanged);
            es.Time.sceneChanged();
        };
        Core.prototype.onGraphicsDeviceReset = function () {
            Core.emitter.emit(es.CoreEvents.GraphicsDeviceReset);
        };
        Core.prototype.initialize = function () {
            es.Graphics.Instance = new es.Graphics();
        };
        Core.prototype.update = function () {
            return __awaiter(this, void 0, void 0, function () {
                var i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            es.Time.update(egret.getTimer());
                            es.Input.update();
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
                            if (this._scene.parent)
                                this._scene.parent.removeChild(this._scene);
                            this._scene.end();
                            this._scene = this._nextScene;
                            this._nextScene = null;
                            this.onSceneChanged();
                            return [4, this._scene.begin()];
                        case 1:
                            _a.sent();
                            this.addChild(this._scene);
                            _a.label = 2;
                        case 2: return [4, this.draw()];
                        case 3:
                            _a.sent();
                            return [2];
                    }
                });
            });
        };
        Core.prototype.onAddToStage = function () {
            Core.graphicsDevice = new es.GraphicsDevice();
            this.addEventListener(egret.Event.RESIZE, this.onGraphicsDeviceReset, this);
            this.addEventListener(egret.StageOrientationEvent.ORIENTATION_CHANGE, this.onOrientationChanged, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.update, this);
            es.Input.initialize();
            KeyboardUtils.init();
            this.initialize();
        };
        Core.debugRenderEndabled = false;
        return Core;
    }(egret.DisplayObjectContainer));
    es.Core = Core;
})(es || (es = {}));
var es;
(function (es) {
    var Colors = (function () {
        function Colors() {
        }
        Colors.renderableBounds = 0xffff00;
        Colors.renderableCenter = 0x9932CC;
        Colors.colliderBounds = 0x555555;
        Colors.colliderEdge = 0x8B0000;
        Colors.colliderPosition = 0xFFFF00;
        Colors.colliderCenter = 0xFF0000;
        return Colors;
    }());
    es.Colors = Colors;
    var Size = (function () {
        function Size() {
        }
        Object.defineProperty(Size, "lineSizeMultiplier", {
            get: function () {
                return Math.max(Math.ceil(es.Core.scene.x / es.Core.scene.width), 1);
            },
            enumerable: true,
            configurable: true
        });
        return Size;
    }());
    es.Size = Size;
    var Debug = (function () {
        function Debug() {
        }
        Debug.drawHollowRect = function (rectanle, color, duration) {
            if (duration === void 0) { duration = 0; }
            this._debugDrawItems.push(new es.DebugDrawItem(rectanle, color, duration));
        };
        Debug.render = function () {
            if (this._debugDrawItems.length > 0) {
                var debugShape = new egret.Shape();
                if (es.Core.scene) {
                    es.Core.scene.addChild(debugShape);
                }
                for (var i = this._debugDrawItems.length - 1; i >= 0; i--) {
                    var item = this._debugDrawItems[i];
                    if (item.draw(debugShape))
                        this._debugDrawItems.removeAt(i);
                }
            }
        };
        Debug._debugDrawItems = [];
        return Debug;
    }());
    es.Debug = Debug;
})(es || (es = {}));
var es;
(function (es) {
    var DebugDefaults = (function () {
        function DebugDefaults() {
        }
        DebugDefaults.verletParticle = 0xDC345E;
        DebugDefaults.verletConstraintEdge = 0x433E36;
        return DebugDefaults;
    }());
    es.DebugDefaults = DebugDefaults;
})(es || (es = {}));
var es;
(function (es) {
    var DebugDrawType;
    (function (DebugDrawType) {
        DebugDrawType[DebugDrawType["line"] = 0] = "line";
        DebugDrawType[DebugDrawType["hollowRectangle"] = 1] = "hollowRectangle";
        DebugDrawType[DebugDrawType["pixel"] = 2] = "pixel";
        DebugDrawType[DebugDrawType["text"] = 3] = "text";
    })(DebugDrawType = es.DebugDrawType || (es.DebugDrawType = {}));
    var DebugDrawItem = (function () {
        function DebugDrawItem(rectangle, color, duration) {
            this.rectangle = rectangle;
            this.color = color;
            this.duration = duration;
            this.drawType = DebugDrawType.hollowRectangle;
        }
        DebugDrawItem.prototype.draw = function (shape) {
            switch (this.drawType) {
                case DebugDrawType.line:
                    break;
                case DebugDrawType.hollowRectangle:
                    break;
                case DebugDrawType.pixel:
                    break;
                case DebugDrawType.text:
                    break;
            }
            this.duration -= es.Time.deltaTime;
            return this.duration < 0;
        };
        return DebugDrawItem;
    }());
    es.DebugDrawItem = DebugDrawItem;
})(es || (es = {}));
var es;
(function (es) {
    var Component = (function (_super) {
        __extends(Component, _super);
        function Component() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.updateInterval = 1;
            _this.debugDisplayObject = new egret.DisplayObjectContainer();
            _this._enabled = true;
            _this._updateOrder = 0;
            return _this;
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
        Component.prototype.debugRender = function (camera) {
        };
        Component.prototype.onEnabled = function () {
        };
        Component.prototype.onDisabled = function () {
        };
        Component.prototype.update = function () {
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
    }(egret.HashObject));
    es.Component = Component;
})(es || (es = {}));
var es;
(function (es) {
    var CoreEvents;
    (function (CoreEvents) {
        CoreEvents[CoreEvents["GraphicsDeviceReset"] = 0] = "GraphicsDeviceReset";
        CoreEvents[CoreEvents["SceneChanged"] = 1] = "SceneChanged";
        CoreEvents[CoreEvents["OrientationChanged"] = 2] = "OrientationChanged";
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
        Entity.prototype.debugRender = function (camera) {
            this.components.debugRender(camera);
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
    var Bitmap = egret.Bitmap;
    var Scene = (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            var _this = _super.call(this) || this;
            _this.enablePostProcessing = true;
            _this._sceneComponents = [];
            _this._renderers = [];
            _this._postProcessors = [];
            _this.dynamicBatch = false;
            _this.optimizeCost = false;
            _this.entities = new es.EntityList(_this);
            _this.renderableComponents = new es.RenderableComponentList();
            _this.content = new es.ContentManager();
            _this.entityProcessors = new es.EntityProcessorList();
            _this.initialize();
            return _this;
        }
        Scene.createWithDefaultRenderer = function () {
            var scene = new Scene();
            scene.addRenderer(new es.DefaultRenderer());
            return scene;
        };
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
            if (this._renderers.length == 0) {
                this.addRenderer(new es.DefaultRenderer());
                console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
            }
            var cameraEntity = this.findEntity("camera");
            if (!cameraEntity)
                cameraEntity = this.createEntity("camera");
            this.camera = cameraEntity.getOrCreateComponent(new es.Camera());
            es.Physics.reset();
            this.updateResolutionScaler();
            if (this.entityProcessors)
                this.entityProcessors.begin();
            es.Core.emitter.addObserver(es.CoreEvents.GraphicsDeviceReset, this.updateResolutionScaler, this);
            es.Core.emitter.addObserver(es.CoreEvents.OrientationChanged, this.updateResolutionScaler, this);
            this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
            this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
            this._didSceneBegin = true;
            this.onStart();
        };
        Scene.prototype.end = function () {
            this._didSceneBegin = false;
            es.Core.emitter.removeObserver(es.CoreEvents.GraphicsDeviceReset, this.updateResolutionScaler);
            es.Core.emitter.removeObserver(es.CoreEvents.OrientationChanged, this.updateResolutionScaler);
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
            for (var i = 0; i < this._sceneComponents.length; i++) {
                this._sceneComponents[i].onRemovedFromScene();
            }
            this._sceneComponents.length = 0;
            this.camera = null;
            this.content.dispose();
            if (this.entityProcessors)
                this.entityProcessors.end();
            if (this.parent)
                this.parent.removeChild(this);
            this.unload();
        };
        Scene.prototype.updateResolutionScaler = function () {
            this.camera.onSceneRenderTargetSizeChanged(es.Core.Instance.stage.stageWidth, es.Core.Instance.stage.stageHeight);
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
            if (this._renderers.length == 0) {
                console.error("场景中没有渲染器!");
                return;
            }
            for (var i = 0; i < this._renderers.length; i++) {
                this.camera.forceMatrixUpdate();
                this._renderers[i].render(this);
            }
        };
        Scene.prototype.dynamicInBatch = function () {
            this.removeChildren();
            var batching = false;
            var displayContainer;
            for (var _i = 0, _a = this.renderableComponents.buffer; _i < _a.length; _i++) {
                var component = _a[_i];
                if (component instanceof es.SpriteAnimator) {
                    this.addChild(component.displayObject);
                    this.addChild(component.debugDisplayObject);
                    batching = false;
                    if (this.optimizeCost && displayContainer)
                        this.optimizeCombine(displayContainer);
                    displayContainer = null;
                }
                else if (component instanceof es.RenderableComponent) {
                    if (!batching) {
                        batching = true;
                        displayContainer = new egret.DisplayObjectContainer();
                        displayContainer.cacheAsBitmap = true;
                        displayContainer.touchEnabled = false;
                        displayContainer.touchChildren = false;
                        this.addChild(displayContainer);
                    }
                    displayContainer.addChild(component.displayObject);
                    displayContainer.addChild(component.debugDisplayObject);
                }
            }
            if (this.optimizeCost && displayContainer)
                this.optimizeCombine(displayContainer);
        };
        Scene.prototype.optimizeCombine = function (container) {
            var renderTexture = new egret.RenderTexture();
            renderTexture.drawToTexture(container, new es.Rectangle(0, 0, container.width, container.height));
            var parent = container.parent;
            var index = this.getChildIndex(container);
            parent.addChildAt(new Bitmap(renderTexture), index);
            parent.removeChild(container);
            container.removeChildren();
        };
        Scene.prototype.postRender = function () {
            if (this.enablePostProcessing) {
                for (var i = 0; i < this._postProcessors.length; i++) {
                    if (this._postProcessors[i].enabled) {
                        this._postProcessors[i].process();
                    }
                }
            }
            if (this._screenshotRequestCallback) {
                var tex = new egret.RenderTexture();
                tex.drawToTexture(this, new es.Rectangle(0, 0, this.stage.stageWidth, this.stage.stageHeight));
                this._screenshotRequestCallback(tex);
                this._screenshotRequestCallback = null;
            }
        };
        Scene.prototype.requestScreenshot = function (callback) {
            this._screenshotRequestCallback = callback;
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
        Scene.prototype.addPostProcessor = function (postProcessor) {
            this._postProcessors.push(postProcessor);
            this._postProcessors.sort();
            postProcessor.onAddedToScene(this);
            if (this._didSceneBegin) {
                postProcessor.onSceneBackBufferSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
            }
            return postProcessor;
        };
        Scene.prototype.getPostProcessor = function (type) {
            for (var i = 0; i < this._postProcessors.length; i++) {
                if (this._postProcessors[i] instanceof type)
                    return this._postProcessors[i];
            }
            return null;
        };
        Scene.prototype.removePostProcessor = function (postProcessor) {
            if (!this._postProcessors.contains(postProcessor))
                return;
            this._postProcessors.remove(postProcessor);
            postProcessor.unload();
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
    }(egret.DisplayObjectContainer));
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
    var HashObject = egret.HashObject;
    var DirtyType;
    (function (DirtyType) {
        DirtyType[DirtyType["clean"] = 0] = "clean";
        DirtyType[DirtyType["positionDirty"] = 1] = "positionDirty";
        DirtyType[DirtyType["scaleDirty"] = 2] = "scaleDirty";
        DirtyType[DirtyType["rotationDirty"] = 3] = "rotationDirty";
    })(DirtyType = es.DirtyType || (es.DirtyType = {}));
    var Transform = (function (_super) {
        __extends(Transform, _super);
        function Transform(entity) {
            var _this = _super.call(this) || this;
            _this._localTransform = es.Matrix2D.create();
            _this._worldTransform = es.Matrix2D.create().identity();
            _this._rotationMatrix = es.Matrix2D.create().identity();
            _this._translationMatrix = es.Matrix2D.create().identity();
            _this._scaleMatrix = es.Matrix2D.create().identity();
            _this._worldToLocalTransform = es.Matrix2D.create().identity();
            _this._worldInverseTransform = es.Matrix2D.create().identity();
            _this._position = es.Vector2.zero;
            _this._scale = es.Vector2.one;
            _this._rotation = 0;
            _this._localPosition = es.Vector2.zero;
            _this._localScale = es.Vector2.one;
            _this._localRotation = 0;
            _this.entity = entity;
            _this.scale = _this._localScale = es.Vector2.one;
            _this._children = [];
            return _this;
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
                        this._worldToLocalTransform = es.Matrix2D.create().identity();
                    }
                    else {
                        this.parent.updateTransform();
                        this._worldToLocalTransform = this.parent._worldTransform.invert();
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
                    this._worldInverseTransform = this._worldTransform.invert();
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
            if (this._parent.equals(parent))
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
                        this._translationMatrix = es.Matrix2D.create().translate(this._localPosition.x, this._localPosition.y);
                        this._localPositionDirty = false;
                    }
                    if (this._localRotationDirty) {
                        this._rotationMatrix = es.Matrix2D.create().rotate(this._localRotation);
                        this._localRotationDirty = false;
                    }
                    if (this._localScaleDirty) {
                        this._scaleMatrix = es.Matrix2D.create().scale(this._localScale.x, this._localScale.y);
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
        Transform.prototype.equals = function (other) {
            return other.hashCode == this.hashCode;
        };
        return Transform;
    }(HashObject));
    es.Transform = Transform;
})(es || (es = {}));
var es;
(function (es) {
    var Camera = (function (_super) {
        __extends(Camera, _super);
        function Camera() {
            var _this = _super.call(this) || this;
            _this._inset = { left: 0, right: 0, top: 0, bottom: 0 };
            _this._areMatrixedDirty = true;
            _this._areBoundsDirty = true;
            _this._isProjectionMatrixDirty = true;
            _this._zoom = 0;
            _this._minimumZoom = 0.3;
            _this._maximumZoom = 3;
            _this._bounds = new es.Rectangle();
            _this._transformMatrix = new es.Matrix2D().identity();
            _this._inverseTransformMatrix = new es.Matrix2D().identity();
            _this._origin = es.Vector2.zero;
            _this.setZoom(0);
            return _this;
        }
        Object.defineProperty(Camera.prototype, "position", {
            get: function () {
                return this.entity.transform.position;
            },
            set: function (value) {
                this.entity.transform.position = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "rotation", {
            get: function () {
                return this.entity.transform.rotation;
            },
            set: function (value) {
                this.entity.transform.rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "rawZoom", {
            get: function () {
                return this._zoom;
            },
            set: function (value) {
                if (value != this._zoom) {
                    this._zoom = value;
                    this._areMatrixedDirty = true;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "zoom", {
            get: function () {
                if (this._zoom == 0)
                    return 1;
                if (this._zoom < 1)
                    return es.MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);
                return es.MathHelper.map(this._zoom, 1, this._maximumZoom, 0, 1);
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
        Object.defineProperty(Camera.prototype, "bounds", {
            get: function () {
                if (this._areMatrixedDirty)
                    this.updateMatrixes();
                if (this._areBoundsDirty) {
                    var topLeft = this.screenToWorldPoint(new es.Vector2(this._inset.left, this._inset.top));
                    var bottomRight = this.screenToWorldPoint(new es.Vector2(es.Core.graphicsDevice.viewport.width - this._inset.right, es.Core.graphicsDevice.viewport.height - this._inset.bottom));
                    if (this.entity.transform.rotation != 0) {
                        var topRight = this.screenToWorldPoint(new es.Vector2(es.Core.graphicsDevice.viewport.width - this._inset.right, this._inset.top));
                        var bottomLeft = this.screenToWorldPoint(new es.Vector2(this._inset.left, es.Core.graphicsDevice.viewport.height - this._inset.bottom));
                        var minX = Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                        var maxX = Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                        var minY = Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                        var maxY = Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                        this._bounds.location = new es.Vector2(minX, minY);
                        this._bounds.width = maxX - minX;
                        this._bounds.height = maxY - minY;
                    }
                    else {
                        this._bounds.location = topLeft;
                        this._bounds.width = bottomRight.x - topLeft.x;
                        this._bounds.height = bottomRight.y - topLeft.y;
                    }
                    this._areBoundsDirty = false;
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "transformMatrix", {
            get: function () {
                if (this._areMatrixedDirty)
                    this.updateMatrixes();
                return this._transformMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "inverseTransformMatrix", {
            get: function () {
                if (this._areMatrixedDirty)
                    this.updateMatrixes();
                return this._inverseTransformMatrix;
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
                    this._areMatrixedDirty = true;
                }
            },
            enumerable: true,
            configurable: true
        });
        Camera.prototype.setInset = function (left, right, top, bottom) {
            this._inset = { left: left, right: right, top: top, bottom: bottom };
            this._areBoundsDirty = true;
            return this;
        };
        Camera.prototype.setPosition = function (position) {
            this.entity.transform.setPosition(position.x, position.y);
            return this;
        };
        Camera.prototype.setRotation = function (rotation) {
            this.entity.transform.setRotation(rotation);
            return this;
        };
        Camera.prototype.setZoom = function (zoom) {
            var newZoom = es.MathHelper.clamp(zoom, -1, 1);
            if (newZoom == 0) {
                this._zoom = 1;
            }
            else if (newZoom < 0) {
                this._zoom = es.MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
            }
            else {
                this._zoom = es.MathHelper.map(newZoom, 0, 1, 1, this._maximumZoom);
            }
            this._areMatrixedDirty = true;
            return this;
        };
        Camera.prototype.setMinimumZoom = function (minZoom) {
            if (minZoom <= 0) {
                console.error("minimumZoom must be greater than zero");
                return;
            }
            if (this._zoom < minZoom)
                this._zoom = this.minimumZoom;
            this._minimumZoom = minZoom;
            return this;
        };
        Camera.prototype.setMaximumZoom = function (maxZoom) {
            if (maxZoom <= 0) {
                console.error("maximumZoom must be greater than zero");
                return;
            }
            if (this._zoom > maxZoom)
                this._zoom = maxZoom;
            this._maximumZoom = maxZoom;
            return this;
        };
        Camera.prototype.forceMatrixUpdate = function () {
            this._areMatrixedDirty = true;
        };
        Camera.prototype.onEntityTransformChanged = function (comp) {
            this._areMatrixedDirty = true;
        };
        Camera.prototype.zoomIn = function (deltaZoom) {
            this.zoom += deltaZoom;
        };
        Camera.prototype.zoomOut = function (deltaZoom) {
            this.zoom -= deltaZoom;
        };
        Camera.prototype.worldToScreenPoint = function (worldPosition) {
            this.updateMatrixes();
            es.Vector2Ext.transformR(worldPosition, this._transformMatrix, worldPosition);
            return worldPosition;
        };
        Camera.prototype.screenToWorldPoint = function (screenPosition) {
            this.updateMatrixes();
            es.Vector2Ext.transformR(screenPosition, this._inverseTransformMatrix, screenPosition);
            return screenPosition;
        };
        Camera.prototype.onSceneRenderTargetSizeChanged = function (newWidth, newHeight) {
            this._isProjectionMatrixDirty = true;
            var oldOrigin = this._origin;
            this.origin = new es.Vector2(newWidth / 2, newHeight / 2);
            this.entity.transform.position.add(es.Vector2.subtract(this._origin, oldOrigin));
        };
        Camera.prototype.mouseToWorldPoint = function () {
            return this.screenToWorldPoint(es.Input.touchPosition);
        };
        Camera.prototype.updateMatrixes = function () {
            if (!this._areMatrixedDirty)
                return;
            var tempMat;
            this._transformMatrix = es.Matrix2D.create().translate(-this.entity.transform.position.x, -this.entity.transform.position.y);
            if (this._zoom != 1) {
                tempMat = es.Matrix2D.create().scale(this._zoom, this._zoom);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }
            if (this.entity.transform.rotation != 0) {
                tempMat = es.Matrix2D.create().rotate(this.entity.transform.rotation);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }
            tempMat = es.Matrix2D.create().translate(Math.floor(this._origin.x), Math.floor(this._origin.y));
            this._transformMatrix = this._transformMatrix.multiply(tempMat);
            this._inverseTransformMatrix = this._transformMatrix.invert();
            this._areBoundsDirty = true;
            this._areMatrixedDirty = false;
        };
        return Camera;
    }(es.Component));
    es.Camera = Camera;
})(es || (es = {}));
var es;
(function (es) {
    var CameraShake = (function (_super) {
        __extends(CameraShake, _super);
        function CameraShake() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._shakeDirection = es.Vector2.zero;
            _this._shakeOffset = es.Vector2.zero;
            _this._shakeIntensity = 0;
            _this._shakeDegredation = 0.95;
            return _this;
        }
        CameraShake.prototype.shake = function (shakeIntensify, shakeDegredation, shakeDirection) {
            if (shakeIntensify === void 0) { shakeIntensify = 15; }
            if (shakeDegredation === void 0) { shakeDegredation = 0.9; }
            if (shakeDirection === void 0) { shakeDirection = es.Vector2.zero; }
            this.enabled = true;
            if (this._shakeIntensity < shakeIntensify) {
                this._shakeDirection = shakeDirection;
                this._shakeIntensity = shakeIntensify;
                if (shakeDegredation < 0 || shakeDegredation >= 1) {
                    shakeDegredation = 0.95;
                }
                this._shakeDegredation = shakeDegredation;
            }
        };
        CameraShake.prototype.update = function () {
            if (Math.abs(this._shakeIntensity) > 0) {
                this._shakeOffset = this._shakeDirection;
                if (this._shakeOffset.x != 0 || this._shakeOffset.y != 0) {
                    this._shakeOffset.normalize();
                }
                else {
                    this._shakeOffset.x = this._shakeOffset.x + Math.random() - 0.5;
                    this._shakeOffset.y = this._shakeOffset.y + Math.random() - 0.5;
                }
                this._shakeOffset.multiply(new es.Vector2(this._shakeIntensity));
                this._shakeIntensity *= -this._shakeDegredation;
                if (Math.abs(this._shakeIntensity) <= 0.01) {
                    this._shakeIntensity = 0;
                    this.enabled = false;
                }
            }
            this.entity.scene.camera.position.add(this._shakeOffset);
        };
        return CameraShake;
    }(es.Component));
    es.CameraShake = CameraShake;
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
    var CameraStyle;
    (function (CameraStyle) {
        CameraStyle[CameraStyle["lockOn"] = 0] = "lockOn";
        CameraStyle[CameraStyle["cameraWindow"] = 1] = "cameraWindow";
    })(CameraStyle = es.CameraStyle || (es.CameraStyle = {}));
    var FollowCamera = (function (_super) {
        __extends(FollowCamera, _super);
        function FollowCamera(targetEntity, camera, cameraStyle) {
            if (targetEntity === void 0) { targetEntity = null; }
            if (camera === void 0) { camera = null; }
            if (cameraStyle === void 0) { cameraStyle = CameraStyle.lockOn; }
            var _this = _super.call(this) || this;
            _this.followLerp = 0.1;
            _this.deadzone = new es.Rectangle();
            _this.focusOffset = es.Vector2.zero;
            _this.mapLockEnabled = false;
            _this.mapSize = new es.Rectangle();
            _this._desiredPositionDelta = new es.Vector2();
            _this._worldSpaceDeadZone = new es.Rectangle();
            _this.rectShape = new egret.Shape();
            _this._targetEntity = targetEntity;
            _this._cameraStyle = cameraStyle;
            _this.camera = camera;
            return _this;
        }
        FollowCamera.prototype.onAddedToEntity = function () {
            if (!this.camera)
                this.camera = this.entity.scene.camera;
            this.follow(this._targetEntity, this._cameraStyle);
            es.Core.emitter.addObserver(es.CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
        };
        FollowCamera.prototype.onGraphicsDeviceReset = function () {
            es.Core.schedule(0, false, this, function (t) {
                var self = t.context;
                self.follow(self._targetEntity, self._cameraStyle);
            });
        };
        FollowCamera.prototype.update = function () {
            var halfScreen = es.Vector2.multiply(this.camera.bounds.size, new es.Vector2(0.5));
            this._worldSpaceDeadZone.x = this.camera.position.x - halfScreen.x * es.Core.scene.scaleX + this.deadzone.x + this.focusOffset.x;
            this._worldSpaceDeadZone.y = this.camera.position.y - halfScreen.y * es.Core.scene.scaleY + this.deadzone.y + this.focusOffset.y;
            this._worldSpaceDeadZone.width = this.deadzone.width;
            this._worldSpaceDeadZone.height = this.deadzone.height;
            if (this._targetEntity)
                this.updateFollow();
            this.camera.position = es.Vector2.lerp(this.camera.position, es.Vector2.add(this.camera.position, this._desiredPositionDelta), this.followLerp);
            this.entity.transform.roundPosition();
            if (this.mapLockEnabled) {
                this.camera.position = this.clampToMapSize(this.camera.position);
                this.entity.transform.roundPosition();
            }
        };
        FollowCamera.prototype.debugRender = function (camera) {
            if (!this.rectShape)
                this.debugDisplayObject.addChild(this.rectShape);
            this.rectShape.graphics.clear();
            if (this._cameraStyle == CameraStyle.lockOn) {
                this.rectShape.graphics.beginFill(0x8B0000, 0);
                this.rectShape.graphics.lineStyle(1, 0x8B0000);
                this.rectShape.graphics.drawRect(this._worldSpaceDeadZone.x - 5 - camera.bounds.x, this._worldSpaceDeadZone.y - 5 - camera.bounds.y, this._worldSpaceDeadZone.width, this._worldSpaceDeadZone.height);
                this.rectShape.graphics.endFill();
            }
            else {
                this.rectShape.graphics.beginFill(0x8B0000, 0);
                this.rectShape.graphics.lineStyle(1, 0x8B0000);
                this.rectShape.graphics.drawRect(this._worldSpaceDeadZone.x - camera.bounds.x, this._worldSpaceDeadZone.y - camera.bounds.y, this._worldSpaceDeadZone.width, this._worldSpaceDeadZone.height);
                this.rectShape.graphics.endFill();
            }
        };
        FollowCamera.prototype.clampToMapSize = function (position) {
            var halfScreen = es.Vector2.multiply(this.camera.bounds.size, new es.Vector2(0.5)).add(new es.Vector2(this.mapSize.x, this.mapSize.y));
            var cameraMax = new es.Vector2(this.mapSize.width - halfScreen.x, this.mapSize.height - halfScreen.y);
            return es.Vector2.clamp(position, halfScreen, cameraMax);
        };
        FollowCamera.prototype.follow = function (targetEntity, cameraStyle) {
            if (cameraStyle === void 0) { cameraStyle = CameraStyle.cameraWindow; }
            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;
            var cameraBounds = this.camera.bounds;
            switch (this._cameraStyle) {
                case CameraStyle.cameraWindow:
                    var w = cameraBounds.width / 6;
                    var h = cameraBounds.height / 3;
                    this.deadzone = new es.Rectangle((cameraBounds.width - w) / 2, (cameraBounds.height - h) / 2, w, h);
                    break;
                case CameraStyle.lockOn:
                    this.deadzone = new es.Rectangle(cameraBounds.width / 2, cameraBounds.height / 2, 10, 10);
                    break;
            }
        };
        FollowCamera.prototype.updateFollow = function () {
            this._desiredPositionDelta.x = this._desiredPositionDelta.y = 0;
            if (this._cameraStyle == CameraStyle.lockOn) {
                var targetX = this._targetEntity.transform.position.x;
                var targetY = this._targetEntity.transform.position.y;
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
                    this._targetCollider = this._targetEntity.getComponent(es.Collider);
                    if (!this._targetCollider)
                        return;
                }
                var targetBounds = this._targetEntity.getComponent(es.Collider).bounds;
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
        FollowCamera.prototype.setCenteredDeadzone = function (width, height) {
            if (!this.camera) {
                console.error("相机是null。我们不能得到它的边界。请等到该组件添加到实体之后");
                return;
            }
            var cameraBounds = this.camera.bounds;
            this.deadzone = new es.Rectangle((cameraBounds.width - width) / 2, (cameraBounds.height - height) / 2, width, height);
        };
        return FollowCamera;
    }(es.Component));
    es.FollowCamera = FollowCamera;
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
    var CollisionState = (function () {
        function CollisionState() {
        }
        Object.defineProperty(CollisionState.prototype, "hasCollision", {
            get: function () {
                return this.below || this.right || this.left || this.above;
            },
            enumerable: true,
            configurable: true
        });
        CollisionState.prototype.reset = function () {
            this.becameGroundedThisFrame = this.isGroundedOnOnewayPlatform = this.right = this.left = this.above = this.below = false;
            this.slopAngle = 0;
        };
        CollisionState.prototype.toString = function () {
            return "[CollisionState] r: " + this.right + ", l: " + this.left + ", a: " + this.above + ", b: " + this.below + ", angle: " + this.slopAngle + ", wasGroundedLastFrame: " + this.wasGroundedLastFrame + ", becameGroundedThisFrame: " + this.becameGroundedThisFrame;
        };
        return CollisionState;
    }());
    es.CollisionState = CollisionState;
    var TiledMapMover = (function (_super) {
        __extends(TiledMapMover, _super);
        function TiledMapMover() {
            var _this = _super.call(this) || this;
            _this.colliderHorizontalInset = 2;
            _this.colliderVerticalInset = 6;
            return _this;
        }
        TiledMapMover.prototype.testCollisions = function (motion, boxColliderBounds, collisionState) {
            this._boxColliderBounds = boxColliderBounds;
            collisionState.wasGroundedLastFrame = collisionState.below;
            collisionState.reset();
            var motionX = motion.x;
            var motionY = motion.y;
            if (motionX != 0) {
                var direction = motionX > 0 ? es.Edge.right : es.Edge.left;
                var sweptBounds = this.collisionRectForSide(direction, motionX);
                var collisionResponse = 0;
                if (this.testMapCollision(sweptBounds, direction, collisionState, collisionResponse)) {
                    motion.x = collisionResponse - es.RectangleExt.getSide(boxColliderBounds, direction);
                    collisionState.left = direction == es.Edge.left;
                    collisionState.right = direction == es.Edge.right;
                    collisionState._movementRemainderX.reset();
                }
                else {
                    collisionState.left = false;
                    collisionState.right = false;
                }
            }
        };
        TiledMapMover.prototype.testMapCollision = function (collisionRect, direction, collisionState, collisionResponse) {
            var side = es.EdgeExt.oppositeEdge(direction);
            var perpindicularPosition = es.EdgeExt.isVertical(side) ? collisionRect.center.x : collisionRect.center.y;
            var leadingPosition = es.RectangleExt.getSide(collisionRect, direction);
            var shouldTestSlopes = es.EdgeExt.isVertical(side);
        };
        TiledMapMover.prototype.collisionRectForSide = function (side, motion) {
            var bounds;
            if (es.EdgeExt.isHorizontal(side)) {
                bounds = es.RectangleExt.getRectEdgePortion(this._boxColliderBounds, side);
            }
            else {
                bounds = es.RectangleExt.getHalfRect(this._boxColliderBounds, side);
            }
            if (es.EdgeExt.isVertical(side)) {
                es.RectangleExt.contract(bounds, this.colliderHorizontalInset, 0);
            }
            else {
                es.RectangleExt.contract(bounds, 0, this.colliderVerticalInset);
            }
            es.RectangleExt.expandSide(bounds, side, motion);
            return bounds;
        };
        return TiledMapMover;
    }(es.Component));
    es.TiledMapMover = TiledMapMover;
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
            if (this._colliderRequiresAutoSizing) {
                if (!(this instanceof es.BoxCollider || this instanceof es.CircleCollider)) {
                    console.error("Only box and circle colliders can be created automatically");
                    return;
                }
                var renderable = this.entity.getComponent(es.RenderableComponent);
                if (renderable) {
                    var renderableBounds = renderable.bounds;
                    var width = renderableBounds.width / this.entity.transform.scale.x;
                    var height = renderableBounds.height / this.entity.transform.scale.y;
                    if (this instanceof es.CircleCollider) {
                        this.radius = Math.max(width, height) * 0.5;
                    }
                    else {
                        this.width = width;
                        this.height = height;
                    }
                    this.localOffset = es.Vector2.subtract(renderableBounds.center, this.entity.transform.position);
                }
                else {
                    console.warn("碰撞器没有形状和RenderableComponent。不知道如何调整大小.");
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
            _this.hollowShape = new egret.Shape();
            _this.polygonShape = new egret.Shape();
            _this.pixelShape1 = new egret.Shape();
            _this.pixelShape2 = new egret.Shape();
            if (x == undefined && y == undefined) {
                if (width == undefined && height == undefined) {
                    _this.shape = new es.Box(1, 1);
                    _this._colliderRequiresAutoSizing = true;
                }
                else if (width != undefined && height != undefined) {
                    x = -width / 2;
                    y = -height / 2;
                    _this._localOffset = new es.Vector2(x + width / 2, y + height / 2);
                    _this.shape = new es.Box(width, height);
                }
            }
            else if (x != undefined && y != undefined && width != undefined && height != undefined) {
                _this._localOffset = new es.Vector2(x + width / 2, y + height / 2);
                _this.shape = new es.Box(width, height);
            }
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
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (width != box.width || height != box.height) {
                box.updateBox(width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        BoxCollider.prototype.setWidth = function (width) {
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (width != box.width) {
                box.updateBox(width, box.height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        BoxCollider.prototype.setHeight = function (height) {
            this._colliderRequiresAutoSizing = false;
            var box = this.shape;
            if (height != box.height) {
                box.updateBox(box.width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
        };
        BoxCollider.prototype.debugRender = function (camera) {
            var poly = this.shape;
            if (!this.hollowShape.parent)
                this.debugDisplayObject.addChild(this.hollowShape);
            if (!this.polygonShape.parent)
                this.debugDisplayObject.addChild(this.polygonShape);
            if (!this.pixelShape1.parent)
                this.debugDisplayObject.addChild(this.pixelShape1);
            if (!this.pixelShape2.parent)
                this.debugDisplayObject.addChild(this.pixelShape2);
            this.hollowShape.graphics.clear();
            this.hollowShape.graphics.beginFill(es.Colors.colliderBounds, 0);
            this.hollowShape.graphics.lineStyle(es.Size.lineSizeMultiplier, es.Colors.colliderBounds);
            this.hollowShape.graphics.drawRect(this.bounds.x - camera.bounds.x, this.bounds.y - camera.bounds.y, this.bounds.width, this.bounds.height);
            this.hollowShape.graphics.endFill();
            this.polygonShape.graphics.clear();
            if (poly.points.length >= 2) {
                this.polygonShape.graphics.beginFill(es.Colors.colliderEdge, 0);
                this.polygonShape.graphics.lineStyle(es.Size.lineSizeMultiplier, es.Colors.colliderEdge);
                for (var i = 0; i < poly.points.length; i++) {
                    if (i == 0) {
                        this.polygonShape.graphics.moveTo(poly.position.x + poly.points[i].x - camera.bounds.x, poly.position.y + poly.points[i].y - camera.bounds.y);
                    }
                    else {
                        this.polygonShape.graphics.lineTo(poly.position.x + poly.points[i].x - camera.bounds.x, poly.position.y + poly.points[i].y - camera.bounds.y);
                    }
                }
                this.polygonShape.graphics.lineTo(poly.position.x + poly.points[poly.points.length - 1].x - camera.bounds.x, poly.position.y + poly.points[0].y - camera.bounds.y);
                this.polygonShape.graphics.endFill();
            }
            this.pixelShape1.graphics.clear();
            this.pixelShape1.graphics.beginFill(es.Colors.colliderPosition, 0);
            this.pixelShape1.graphics.lineStyle(4 * es.Size.lineSizeMultiplier, es.Colors.colliderPosition);
            this.pixelShape1.graphics.moveTo(this.entity.transform.position.x - camera.bounds.x, this.entity.transform.position.y - camera.bounds.y);
            this.pixelShape1.graphics.lineTo(this.entity.transform.position.x - camera.bounds.x, this.entity.transform.position.y - camera.bounds.y);
            this.pixelShape1.graphics.endFill();
            this.pixelShape2.graphics.clear();
            this.pixelShape2.graphics.beginFill(es.Colors.colliderCenter, 0);
            this.pixelShape2.graphics.lineStyle(2 * es.Size.lineSizeMultiplier, es.Colors.colliderCenter);
            this.pixelShape2.graphics.moveTo(this.entity.transform.position.x + this.shape.center.x - camera.bounds.x, this.entity.transform.position.y + this.shape.center.y - camera.bounds.y);
            this.pixelShape2.graphics.lineTo(this.entity.transform.position.x + this.shape.center.x - camera.bounds.x, this.entity.transform.position.y + this.shape.center.y - camera.bounds.y);
            this.pixelShape2.graphics.endFill();
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
            _this.rectShape = new egret.Shape();
            _this.circleShape = new egret.Shape();
            _this.pixelShape1 = new egret.Shape();
            _this.pixelShape2 = new egret.Shape();
            if (radius == undefined) {
                _this.shape = new es.Circle(1);
                _this._colliderRequiresAutoSizing = true;
            }
            else {
                _this.shape = new es.Circle(radius);
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
        CircleCollider.prototype.setRadius = function (radius) {
            this._colliderRequiresAutoSizing = false;
            var circle = this.shape;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;
                if (this.entity && this._isParentEntityAddedToScene)
                    es.Physics.updateCollider(this);
            }
            return this;
        };
        CircleCollider.prototype.debugRender = function (camera) {
            if (!this.rectShape.parent)
                this.debugDisplayObject.addChild(this.rectShape);
            if (!this.circleShape.parent)
                this.debugDisplayObject.addChild(this.circleShape);
            if (!this.pixelShape1.parent)
                this.debugDisplayObject.addChild(this.pixelShape1);
            if (!this.pixelShape2.parent)
                this.debugDisplayObject.addChild(this.pixelShape2);
            this.rectShape.graphics.clear();
            this.rectShape.graphics.beginFill(es.Colors.colliderBounds, 0);
            this.rectShape.graphics.lineStyle(es.Size.lineSizeMultiplier, es.Colors.colliderBounds);
            this.rectShape.graphics.drawRect(this.bounds.x - camera.bounds.x, this.bounds.y - camera.bounds.y, this.bounds.width, this.bounds.height);
            this.rectShape.graphics.endFill();
            this.circleShape.graphics.clear();
            this.circleShape.graphics.beginFill(es.Colors.colliderEdge, 0);
            this.circleShape.graphics.lineStyle(es.Size.lineSizeMultiplier, es.Colors.colliderEdge);
            this.circleShape.graphics.drawCircle(this.shape.position.x - camera.bounds.x, this.shape.position.y - camera.bounds.y, this.shape.radius);
            this.circleShape.graphics.endFill();
            this.pixelShape1.graphics.clear();
            this.pixelShape1.graphics.beginFill(es.Colors.colliderPosition, 0);
            this.pixelShape1.graphics.lineStyle(4 * es.Size.lineSizeMultiplier, es.Colors.colliderPosition);
            this.pixelShape1.graphics.moveTo(this.entity.transform.position.x - camera.bounds.x, this.entity.transform.position.y - camera.bounds.y);
            this.pixelShape1.graphics.lineTo(this.entity.transform.position.x - camera.bounds.y, this.entity.transform.position.y - camera.bounds.y);
            this.pixelShape1.graphics.endFill();
            this.pixelShape2.graphics.clear();
            this.pixelShape2.graphics.beginFill(es.Colors.colliderCenter, 0);
            this.pixelShape2.graphics.lineStyle(2 * es.Size.lineSizeMultiplier, es.Colors.colliderCenter);
            this.pixelShape2.graphics.moveTo(this.shape.position.x - camera.bounds.x, this.shape.position.y - camera.bounds.y);
            this.pixelShape2.graphics.lineTo(this.shape.position.x - camera.bounds.x, this.shape.position.y - camera.bounds.y);
            this.pixelShape2.graphics.endFill();
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
    var RenderableComponent = (function (_super) {
        __extends(RenderableComponent, _super);
        function RenderableComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.displayObject = new egret.DisplayObject();
            _this.hollowShape = new egret.Shape();
            _this.pixelShape = new egret.Shape();
            _this.color = 0x000000;
            _this._areBoundsDirty = true;
            _this.debugRenderEnabled = true;
            _this._localOffset = es.Vector2.zero;
            _this._renderLayer = 0;
            _this._bounds = new es.Rectangle();
            return _this;
        }
        Object.defineProperty(RenderableComponent.prototype, "width", {
            get: function () {
                return this.bounds.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderableComponent.prototype, "height", {
            get: function () {
                return this.bounds.height;
            },
            enumerable: true,
            configurable: true
        });
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
        Object.defineProperty(RenderableComponent.prototype, "bounds", {
            get: function () {
                if (this._areBoundsDirty) {
                    this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, es.Vector2.zero, this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
                    this._areBoundsDirty = false;
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderableComponent.prototype, "isVisible", {
            get: function () {
                return this._isVisible;
            },
            set: function (value) {
                if (this._isVisible != value) {
                    this._isVisible = value;
                    if (this._isVisible)
                        this.onBecameVisible();
                    else
                        this.onBecameInvisible();
                }
            },
            enumerable: true,
            configurable: true
        });
        RenderableComponent.prototype.onEntityTransformChanged = function (comp) {
            this._areBoundsDirty = true;
        };
        RenderableComponent.prototype.debugRender = function (camera) {
            if (!this.debugRenderEnabled)
                return;
            if (!this.hollowShape.parent)
                this.debugDisplayObject.addChild(this.hollowShape);
            if (!this.pixelShape.parent)
                this.debugDisplayObject.addChild(this.pixelShape);
            if (!this.entity.getComponent(es.Collider)) {
                this.hollowShape.graphics.clear();
                this.hollowShape.graphics.beginFill(es.Colors.renderableBounds, 0);
                this.hollowShape.graphics.lineStyle(1, es.Colors.renderableBounds);
                this.hollowShape.graphics.drawRect(this.bounds.x - camera.bounds.x, this.bounds.y - camera.bounds.y, this.bounds.width, this.bounds.height);
                this.hollowShape.graphics.endFill();
            }
            var pixelPos = es.Vector2.add(this.entity.transform.position, this._localOffset).subtract(camera.bounds.location);
            this.pixelShape.graphics.clear();
            this.pixelShape.graphics.beginFill(es.Colors.renderableCenter, 0);
            this.pixelShape.graphics.lineStyle(4, es.Colors.renderableCenter);
            this.pixelShape.graphics.moveTo(pixelPos.x, pixelPos.y);
            this.pixelShape.graphics.lineTo(pixelPos.x, pixelPos.y);
            this.pixelShape.graphics.endFill();
        };
        RenderableComponent.prototype.isVisibleFromCamera = function (camera) {
            if (!camera)
                return false;
            this.isVisible = camera.bounds.intersects(this.bounds);
            return this.isVisible;
        };
        RenderableComponent.prototype.setRenderLayer = function (renderLayer) {
            if (renderLayer != this._renderLayer) {
                var oldRenderLayer = this._renderLayer;
                this._renderLayer = renderLayer;
                if (this.entity && this.entity.scene)
                    this.entity.scene.renderableComponents.updateRenderableRenderLayer(this, oldRenderLayer, this._renderLayer);
            }
            return this;
        };
        RenderableComponent.prototype.setColor = function (color) {
            this.color = color;
            return this;
        };
        RenderableComponent.prototype.setLocalOffset = function (offset) {
            if (this._localOffset != offset) {
                this._localOffset = offset;
            }
            return this;
        };
        RenderableComponent.prototype.sync = function (camera) {
            if (this.displayObject.x != this.bounds.x - camera.bounds.y)
                this.displayObject.x = this.bounds.x - camera.bounds.y;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y)
                this.displayObject.y = this.bounds.y - camera.bounds.y;
            if (this.displayObject.scaleX != this.entity.scale.x)
                this.displayObject.scaleX = this.entity.scale.x;
            if (this.displayObject.scaleY != this.entity.scale.y)
                this.displayObject.scaleY = this.entity.scale.y;
            if (this.displayObject.rotation != this.entity.rotationDegrees)
                this.displayObject.rotation = this.entity.rotationDegrees;
        };
        RenderableComponent.prototype.compareTo = function (other) {
            return other.renderLayer - this.renderLayer;
        };
        RenderableComponent.prototype.toString = function () {
            return "[RenderableComponent] renderLayer: " + this.renderLayer;
        };
        RenderableComponent.prototype.onBecameVisible = function () {
            this.displayObject.visible = this.isVisible;
            this.debugDisplayObject.visible = this.isVisible;
        };
        RenderableComponent.prototype.onBecameInvisible = function () {
            this.displayObject.visible = this.isVisible;
            this.debugDisplayObject.visible = this.isVisible;
        };
        return RenderableComponent;
    }(es.Component));
    es.RenderableComponent = RenderableComponent;
})(es || (es = {}));
var es;
(function (es) {
    var Mesh = (function (_super) {
        __extends(Mesh, _super);
        function Mesh() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.displayObject = new egret.Mesh();
            _this._primitiveCount = 0;
            _this._width = 0;
            _this._height = 0;
            _this._triangles = [];
            _this._verts = [];
            return _this;
        }
        Object.defineProperty(Mesh.prototype, "bounds", {
            get: function () {
                if (this._areBoundsDirty) {
                    this._bounds.calculateBounds(es.Vector2.add(this.entity.transform.position, this._topLeftVertPosition), es.Vector2.zero, es.Vector2.zero, this.entity.transform.scale, this.entity.transform.rotation, this._width, this._height);
                    this._areBoundsDirty = false;
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Mesh.prototype.recalculateBounds = function (recalculateUVs) {
            this._topLeftVertPosition = new es.Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new es.Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
            for (var i = 0; i < this._verts.length; i++) {
                this._topLeftVertPosition.x = Math.min(this._topLeftVertPosition.x, this._verts[i].position.x);
                this._topLeftVertPosition.y = Math.min(this._topLeftVertPosition.y, this._verts[i].position.y);
                max.x = Math.max(max.x, this._verts[i].position.x);
                max.y = Math.max(max.y, this._verts[i].position.y);
            }
            this._width = max.x - this._topLeftVertPosition.x;
            this._height = max.y - this._topLeftVertPosition.y;
            if (recalculateUVs) {
                for (var i = 0; i < this._verts.length; i++) {
                    this._verts[i].textureCoordinate.x = (this._verts[i].position.x - this._topLeftVertPosition.x) / this._width;
                    this._verts[i].textureCoordinate.y = (this._verts[i].position.y - this._topLeftVertPosition.y) / this._height;
                }
            }
            return this;
        };
        Mesh.prototype.setTexture = function (texture) {
            this.displayObject.texture = texture;
            return this;
        };
        Mesh.prototype.setVertPositions = function (positions) {
            if (this._verts == undefined || this._verts.length != positions.length) {
                this._verts = new Array(positions.length);
                this._verts.fill(new VertexPositionColorTexture(), 0, positions.length);
            }
            for (var i = 0; i < this._verts.length; i++) {
                this._verts[i].position = positions[i];
            }
            return this;
        };
        Mesh.prototype.setTriangles = function (triangles) {
            if (triangles.length % 3 != 0) {
                console.error("三角形必须是3的倍数");
                return;
            }
            this._primitiveCount = triangles.length / 3;
            this._triangles = triangles;
            return this;
        };
        Mesh.prototype.render = function (camera) {
            var renderNode = this.displayObject.$renderNode;
            renderNode.imageWidth = this._width;
            renderNode.imageHeight = this._height;
            renderNode.vertices = this._triangles;
        };
        return Mesh;
    }(es.RenderableComponent));
    es.Mesh = Mesh;
    var VertexPositionColorTexture = (function () {
        function VertexPositionColorTexture() {
        }
        return VertexPositionColorTexture;
    }());
    es.VertexPositionColorTexture = VertexPositionColorTexture;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var SpriteRenderer = (function (_super) {
        __extends(SpriteRenderer, _super);
        function SpriteRenderer(sprite) {
            if (sprite === void 0) { sprite = null; }
            var _this = _super.call(this) || this;
            if (sprite instanceof es.Sprite)
                _this.setSprite(sprite);
            else if (sprite instanceof egret.Texture)
                _this.setSprite(new es.Sprite(sprite));
            return _this;
        }
        Object.defineProperty(SpriteRenderer.prototype, "bounds", {
            get: function () {
                if (this._areBoundsDirty) {
                    if (this._sprite) {
                        this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin, this.entity.transform.scale, this.entity.transform.rotation, this._sprite.sourceRect.width, this._sprite.sourceRect.height);
                        this._areBoundsDirty = false;
                    }
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpriteRenderer.prototype, "originNormalized", {
            get: function () {
                return new es.Vector2(this._origin.x / this.width * this.entity.transform.scale.x, this._origin.y / this.height * this.entity.transform.scale.y);
            },
            set: function (value) {
                this.setOrigin(new es.Vector2(value.x * this.width / this.entity.transform.scale.x, value.y * this.height / this.entity.transform.scale.y));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpriteRenderer.prototype, "origin", {
            get: function () {
                return this._origin;
            },
            set: function (value) {
                this.setOrigin(value);
            },
            enumerable: true,
            configurable: true
        });
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
            this._sprite = sprite;
            if (this._sprite) {
                this._origin = this._sprite.origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
            }
            this.displayObject = new Bitmap(sprite.texture2D);
            this.displayObject.touchEnabled = false;
            return this;
        };
        SpriteRenderer.prototype.setOrigin = function (origin) {
            if (!this._origin.equals(origin)) {
                this._origin = origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
                this._areBoundsDirty = true;
            }
            return this;
        };
        SpriteRenderer.prototype.setOriginNormalized = function (value) {
            this.setOrigin(new es.Vector2(value.x * this.width / this.entity.transform.scale.x, value.y * this.height / this.entity.transform.scale.y));
            return this;
        };
        SpriteRenderer.prototype.render = function (camera) {
            this.sync(camera);
            if (this.displayObject.x != this.bounds.x - camera.bounds.x + this._origin.x)
                this.displayObject.x = this.bounds.x - camera.bounds.x + this._origin.x * this.entity.scale.x;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y + this._origin.y)
                this.displayObject.y = this.bounds.y - camera.bounds.y + this._origin.y * this.entity.scale.y;
            if (this.displayObject.anchorOffsetX != this._origin.x)
                this.displayObject.anchorOffsetX = this._origin.x;
            if (this.displayObject.anchorOffsetY != this._origin.y)
                this.displayObject.anchorOffsetY = this._origin.y;
        };
        return SpriteRenderer;
    }(es.RenderableComponent));
    es.SpriteRenderer = SpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var RenderTexture = egret.RenderTexture;
    var TiledSpriteRenderer = (function (_super) {
        __extends(TiledSpriteRenderer, _super);
        function TiledSpriteRenderer(sprite) {
            var _this = _super.call(this, sprite) || this;
            _this._textureScale = es.Vector2.one;
            _this._inverseTexScale = es.Vector2.one;
            _this._gapX = 0;
            _this._gapY = 0;
            _this._sourceRect = sprite.sourceRect;
            var bitmap = _this.displayObject;
            bitmap.$fillMode = egret.BitmapFillMode.REPEAT;
            return _this;
        }
        Object.defineProperty(TiledSpriteRenderer.prototype, "bounds", {
            get: function () {
                if (this._areBoundsDirty) {
                    if (this._sprite) {
                        this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin, this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
                        this._areBoundsDirty = false;
                    }
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "scrollX", {
            get: function () {
                return this._sourceRect.x;
            },
            set: function (value) {
                this._sourceRect.x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "scrollY", {
            get: function () {
                return this._sourceRect.y;
            },
            set: function (value) {
                this._sourceRect.y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "textureScale", {
            get: function () {
                return this._textureScale;
            },
            set: function (value) {
                this._textureScale = value;
                this._inverseTexScale = new es.Vector2(1 / this._textureScale.x, 1 / this._textureScale.y);
                this._sourceRect.width = Math.floor(this._sprite.sourceRect.width * this._inverseTexScale.x);
                this._sourceRect.height = Math.floor(this._sprite.sourceRect.height * this._inverseTexScale.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "width", {
            get: function () {
                return this._sourceRect.width;
            },
            set: function (value) {
                this._areBoundsDirty = true;
                this._sourceRect.width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "height", {
            get: function () {
                return this._sourceRect.height;
            },
            set: function (value) {
                this._areBoundsDirty = true;
                this._sourceRect.height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledSpriteRenderer.prototype, "gapXY", {
            get: function () {
                return new es.Vector2(this._gapX, this._gapY);
            },
            set: function (value) {
                this._gapX = value.x;
                this._gapY = value.y;
                var renderTexture = new RenderTexture();
                var newRectangle = this.sprite.sourceRect;
                newRectangle.x = 0;
                newRectangle.y = 0;
                newRectangle.width += this._gapX;
                newRectangle.height += this._gapY;
                renderTexture.drawToTexture(this.displayObject, newRectangle);
                if (!this.displayObject) {
                    this.displayObject = new Bitmap(renderTexture);
                }
                else {
                    this.displayObject.texture = renderTexture;
                }
            },
            enumerable: true,
            configurable: true
        });
        TiledSpriteRenderer.prototype.setGapXY = function (value) {
            this.gapXY = value;
            return this;
        };
        TiledSpriteRenderer.prototype.render = function (camera) {
            _super.prototype.render.call(this, camera);
            var bitmap = this.displayObject;
            bitmap.width = this.width;
            bitmap.height = this.height;
            bitmap.scrollRect = this._sourceRect;
        };
        return TiledSpriteRenderer;
    }(es.SpriteRenderer));
    es.TiledSpriteRenderer = TiledSpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var ScrollingSpriteRenderer = (function (_super) {
        __extends(ScrollingSpriteRenderer, _super);
        function ScrollingSpriteRenderer(sprite) {
            var _this = _super.call(this, sprite) || this;
            _this.scrollSpeedX = 15;
            _this.scroolSpeedY = 0;
            _this._scrollX = 0;
            _this._scrollY = 0;
            _this._scrollWidth = 0;
            _this._scrollHeight = 0;
            _this._scrollWidth = _this.width;
            _this._scrollHeight = _this.height;
            return _this;
        }
        Object.defineProperty(ScrollingSpriteRenderer.prototype, "textureScale", {
            get: function () {
                return this._textureScale;
            },
            set: function (value) {
                this._textureScale = value;
                this._inverseTexScale = new es.Vector2(1 / this._textureScale.x, 1 / this._textureScale.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollingSpriteRenderer.prototype, "scrollWidth", {
            get: function () {
                return this._scrollWidth;
            },
            set: function (value) {
                this._scrollWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollingSpriteRenderer.prototype, "scrollHeight", {
            get: function () {
                return this._scrollHeight;
            },
            set: function (value) {
                this._scrollHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        ScrollingSpriteRenderer.prototype.update = function () {
            if (!this.sprite)
                return;
            this._scrollX += this.scrollSpeedX * es.Time.deltaTime;
            this._scrollY += this.scroolSpeedY * es.Time.deltaTime;
            this._sourceRect.x = Math.floor(this._scrollX);
            this._sourceRect.y = Math.floor(this._scrollY);
            this._sourceRect.width = this._scrollWidth + Math.abs(this._scrollX);
            this._sourceRect.height = this._scrollHeight + Math.abs(this._scrollY);
        };
        return ScrollingSpriteRenderer;
    }(es.TiledSpriteRenderer));
    es.ScrollingSpriteRenderer = ScrollingSpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var SpriteSheet = egret.SpriteSheet;
    var Sprite = (function () {
        function Sprite(texture, sourceRect, origin) {
            if (sourceRect === void 0) { sourceRect = new es.Rectangle(0, 0, texture.textureWidth, texture.textureHeight); }
            if (origin === void 0) { origin = sourceRect.getHalfSize(); }
            this.uvs = new es.Rectangle();
            this.texture2D = texture;
            this.sourceRect = sourceRect;
            this.center = new es.Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
            this.origin = origin;
            var inverseTexW = 1 / texture.textureWidth;
            var inverseTexH = 1 / texture.textureHeight;
            this.uvs.x = sourceRect.x * inverseTexW;
            this.uvs.y = sourceRect.y * inverseTexH;
            this.uvs.width = sourceRect.width * inverseTexW;
            this.uvs.height = sourceRect.height * inverseTexH;
        }
        Sprite.spritesFromAtlas = function (texture, cellWidth, cellHeight, cellOffset, maxCellsToInclude) {
            if (cellOffset === void 0) { cellOffset = 0; }
            if (maxCellsToInclude === void 0) { maxCellsToInclude = Number.MAX_VALUE; }
            var sprites = [];
            var cols = texture.textureWidth / cellWidth;
            var rows = texture.textureHeight / cellHeight;
            var i = 0;
            var spriteSheet = new SpriteSheet(texture);
            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    if (i++ < cellOffset)
                        continue;
                    var texture_1 = spriteSheet.getTexture(y + "_" + x);
                    if (!texture_1)
                        texture_1 = spriteSheet.createTexture(y + "_" + x, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                    sprites.push(new Sprite(texture_1));
                    if (sprites.length == maxCellsToInclude)
                        return sprites;
                }
            }
            return sprites;
        };
        return Sprite;
    }());
    es.Sprite = Sprite;
})(es || (es = {}));
var es;
(function (es) {
    var SpriteAnimation = (function () {
        function SpriteAnimation(sprites, frameRate) {
            if (frameRate === void 0) { frameRate = 10; }
            this.sprites = sprites;
            this.frameRate = frameRate;
        }
        return SpriteAnimation;
    }());
    es.SpriteAnimation = SpriteAnimation;
})(es || (es = {}));
var es;
(function (es) {
    var LoopMode;
    (function (LoopMode) {
        LoopMode[LoopMode["loop"] = 0] = "loop";
        LoopMode[LoopMode["once"] = 1] = "once";
        LoopMode[LoopMode["clampForever"] = 2] = "clampForever";
        LoopMode[LoopMode["pingPong"] = 3] = "pingPong";
        LoopMode[LoopMode["pingPongOnce"] = 4] = "pingPongOnce";
    })(LoopMode = es.LoopMode || (es.LoopMode = {}));
    var State;
    (function (State) {
        State[State["none"] = 0] = "none";
        State[State["running"] = 1] = "running";
        State[State["paused"] = 2] = "paused";
        State[State["completed"] = 3] = "completed";
    })(State = es.State || (es.State = {}));
    var SpriteAnimator = (function (_super) {
        __extends(SpriteAnimator, _super);
        function SpriteAnimator(sprite) {
            var _this = _super.call(this, sprite) || this;
            _this.speed = 1;
            _this.animationState = State.none;
            _this._elapsedTime = 0;
            _this._animations = new Map();
            return _this;
        }
        Object.defineProperty(SpriteAnimator.prototype, "isRunning", {
            get: function () {
                return this.animationState == State.running;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpriteAnimator.prototype, "animations", {
            get: function () {
                return this._animations;
            },
            enumerable: true,
            configurable: true
        });
        SpriteAnimator.prototype.update = function () {
            if (this.animationState != State.running || !this.currentAnimation)
                return;
            var animation = this.currentAnimation;
            var secondsPerFrame = 1 / (animation.frameRate * this.speed);
            var iterationDuration = secondsPerFrame * animation.sprites.length;
            this._elapsedTime += es.Time.deltaTime;
            var time = Math.abs(this._elapsedTime);
            if (this._loopMode == LoopMode.once && time > iterationDuration ||
                this._loopMode == LoopMode.pingPongOnce && time > iterationDuration * 2) {
                this.animationState = State.completed;
                this._elapsedTime = 0;
                this.currentFrame = 0;
                this.displayObject.texture = animation.sprites[this.currentFrame].texture2D;
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
            this.displayObject.texture = animation.sprites[this.currentFrame].texture2D;
        };
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
            this.displayObject.texture = this.currentAnimation.sprites[0].texture2D;
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
        return SpriteAnimator;
    }(es.SpriteRenderer));
    es.SpriteAnimator = SpriteAnimator;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var StaticSpriteContainerRenderer = (function (_super) {
        __extends(StaticSpriteContainerRenderer, _super);
        function StaticSpriteContainerRenderer(sprite) {
            if (sprite === void 0) { sprite = null; }
            var _this = _super.call(this) || this;
            _this.displayObject = new egret.DisplayObjectContainer();
            _this.displayObjectCache = new Map();
            for (var _i = 0, sprite_1 = sprite; _i < sprite_1.length; _i++) {
                var s = sprite_1[_i];
                if (s instanceof es.Sprite)
                    _this.pushSprite(s);
                else if (s instanceof egret.Texture)
                    _this.pushSprite(new es.Sprite(s));
            }
            _this.displayObject.cacheAsBitmap = true;
            return _this;
        }
        Object.defineProperty(StaticSpriteContainerRenderer.prototype, "bounds", {
            get: function () {
                if (this._areBoundsDirty) {
                    if (this.displayObject) {
                        this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin, this.entity.transform.scale, this.entity.transform.rotation, this.displayObject.width, this.displayObject.height);
                        this._areBoundsDirty = false;
                    }
                }
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StaticSpriteContainerRenderer.prototype, "originNormalized", {
            get: function () {
                return new es.Vector2(this._origin.x / this.width * this.entity.transform.scale.x, this._origin.y / this.height * this.entity.transform.scale.y);
            },
            set: function (value) {
                this.setOrigin(new es.Vector2(value.x * this.width / this.entity.transform.scale.x, value.y * this.height / this.entity.transform.scale.y));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StaticSpriteContainerRenderer.prototype, "origin", {
            get: function () {
                return this._origin;
            },
            set: function (value) {
                this.setOrigin(value);
            },
            enumerable: true,
            configurable: true
        });
        StaticSpriteContainerRenderer.prototype.pushSprite = function (sprite) {
            if (sprite) {
                this._origin = sprite.origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
            }
            var bitmap = new Bitmap(sprite.texture2D);
            this.displayObject.addChild(new Bitmap(sprite.texture2D));
            this.displayObjectCache.set(sprite, bitmap);
            return this;
        };
        StaticSpriteContainerRenderer.prototype.getSprite = function (sprite) {
            return this.displayObjectCache.get(sprite);
        };
        StaticSpriteContainerRenderer.prototype.setOrigin = function (origin) {
            if (this._origin != origin) {
                this._origin = origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
                this._areBoundsDirty = true;
            }
            return this;
        };
        StaticSpriteContainerRenderer.prototype.setOriginNormalized = function (value) {
            this.setOrigin(new es.Vector2(value.x * this.width / this.entity.transform.scale.x, value.y * this.height / this.entity.transform.scale.y));
            return this;
        };
        StaticSpriteContainerRenderer.prototype.render = function (camera) {
            this.sync(camera);
            if (this.displayObject.x != this.bounds.x - camera.bounds.x)
                this.displayObject.x = this.bounds.x - camera.bounds.x;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y)
                this.displayObject.y = this.bounds.y - camera.bounds.y;
        };
        return StaticSpriteContainerRenderer;
    }(es.RenderableComponent));
    es.StaticSpriteContainerRenderer = StaticSpriteContainerRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var TiledMapRenderer = (function (_super) {
        __extends(TiledMapRenderer, _super);
        function TiledMapRenderer(tiledMap, collisionLayerName, shouldCreateColliders) {
            if (collisionLayerName === void 0) { collisionLayerName = null; }
            if (shouldCreateColliders === void 0) { shouldCreateColliders = true; }
            var _this = _super.call(this) || this;
            _this.physicsLayer = new es.Ref(1 << 0);
            _this.toContainer = false;
            _this.tiledMap = tiledMap;
            _this._shouldCreateColliders = shouldCreateColliders;
            _this.displayObject = new egret.DisplayObjectContainer();
            if (collisionLayerName) {
                _this.collisionLayer = tiledMap.tileLayers.find(function (layer) { return layer.name == collisionLayerName; });
            }
            return _this;
        }
        Object.defineProperty(TiledMapRenderer.prototype, "width", {
            get: function () {
                return this.tiledMap.width * this.tiledMap.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledMapRenderer.prototype, "height", {
            get: function () {
                return this.tiledMap.height * this.tiledMap.tileHeight;
            },
            enumerable: true,
            configurable: true
        });
        TiledMapRenderer.prototype.setLayerToRender = function (layerName) {
            this.layerIndicesToRender = [];
            this.layerIndicesToRender[0] = this.getLayerIndex(layerName);
        };
        TiledMapRenderer.prototype.setLayersToRender = function () {
            var layerNames = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                layerNames[_i] = arguments[_i];
            }
            this.layerIndicesToRender = [];
            for (var i = 0; i < layerNames.length; i++)
                this.layerIndicesToRender[i] = this.getLayerIndex(layerNames[i]);
        };
        TiledMapRenderer.prototype.getLayerIndex = function (layerName) {
            var index = 0;
            var layerType = this.tiledMap.getLayer(layerName);
            for (var layer in this.tiledMap.layers) {
                if (this.tiledMap.layers.hasOwnProperty(layer) &&
                    this.tiledMap.layers[layer] == layerType) {
                    return index;
                }
            }
            return -1;
        };
        TiledMapRenderer.prototype.getRowAtWorldPosition = function (yPos) {
            yPos -= this.entity.transform.position.y + this._localOffset.y;
            return this.tiledMap.worldToTilePositionY(yPos);
        };
        TiledMapRenderer.prototype.getColumnAtWorldPosition = function (xPos) {
            xPos -= this.entity.transform.position.x + this._localOffset.x;
            return this.tiledMap.worldToTilePositionX(xPos);
        };
        TiledMapRenderer.prototype.onEntityTransformChanged = function (comp) {
            if (this._shouldCreateColliders && comp == transform.Component.position) {
                this.removeColliders();
                this.addColliders();
            }
        };
        TiledMapRenderer.prototype.onAddedToEntity = function () {
            this.addColliders();
        };
        TiledMapRenderer.prototype.onRemovedFromEntity = function () {
            this.removeColliders();
        };
        TiledMapRenderer.prototype.update = function () {
            this.tiledMap.update();
        };
        TiledMapRenderer.prototype.render = function (camera) {
            this.sync(camera);
            if (!this.layerIndicesToRender) {
                es.TiledRendering.renderMap(this.tiledMap, !this.toContainer ? this.displayObject : null, es.Vector2.add(this.entity.transform.position, this._localOffset), this.transform.scale, this.renderLayer);
            }
            else {
                for (var i = 0; i < this.tiledMap.layers.length; i++) {
                    if (this.tiledMap.layers[i].visible && this.layerIndicesToRender.contains(i))
                        es.TiledRendering.renderLayerRenderCamera(this.tiledMap.layers[i], !this.toContainer ? this.displayObject : null, es.Vector2.add(this.entity.transform.position, this._localOffset), this.transform.scale, this.renderLayer, camera.bounds);
                }
            }
            if (!this.toContainer) {
                this.displayObject.cacheAsBitmap = true;
                this.toContainer = true;
            }
        };
        TiledMapRenderer.prototype.addColliders = function () {
            if (!this.collisionLayer || !this._shouldCreateColliders)
                return;
            var collisionRects = this.collisionLayer.getCollisionRectangles();
            this._colliders = [];
            for (var i = 0; i < collisionRects.length; i++) {
                var collider = new es.BoxCollider(collisionRects[i].x + this._localOffset.x, collisionRects[i].y + this._localOffset.y, collisionRects[i].width, collisionRects[i].height);
                collider.physicsLayer = this.physicsLayer;
                collider.entity = this.entity;
                this._colliders[i] = collider;
                es.Physics.addCollider(collider);
            }
        };
        TiledMapRenderer.prototype.removeColliders = function () {
            if (this._colliders == null)
                return;
            for (var _i = 0, _a = this._colliders; _i < _a.length; _i++) {
                var collider = _a[_i];
                es.Physics.removeCollider(collider);
            }
            this._colliders = null;
        };
        return TiledMapRenderer;
    }(es.RenderableComponent));
    es.TiledMapRenderer = TiledMapRenderer;
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
                var nd = new Number[lastElt + 1];
                nd = this._bits.copyWithin(0, 0, this._bits.length);
                this._bits = nd;
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
            this._componentsToAdd.length = 0;
            this._componentsToRemove.length = 0;
        };
        ComponentList.prototype.deregisterAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (!component)
                    continue;
                if (component instanceof es.RenderableComponent) {
                    if (component.displayObject.parent)
                        component.displayObject.parent.removeChild(component.displayObject);
                    this._entity.scene.renderableComponents.remove(component);
                }
                if (component.debugDisplayObject.parent)
                    component.debugDisplayObject.parent.removeChild(component.debugDisplayObject);
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component), false);
                this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            }
        };
        ComponentList.prototype.registerAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components.buffer[i];
                if (component instanceof es.RenderableComponent) {
                    if (!this._entity.scene.dynamicBatch)
                        this._entity.scene.addChild(component.displayObject);
                    this._entity.scene.renderableComponents.add(component);
                }
                if (!this._entity.scene.dynamicBatch)
                    this._entity.scene.addChild(component.debugDisplayObject);
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component));
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);
            }
            if (this._entity.scene.dynamicBatch)
                this._entity.scene.dynamicInBatch();
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
                    if (component instanceof es.RenderableComponent) {
                        if (!this._entity.scene.dynamicBatch)
                            this._entity.scene.addChild(component.displayObject);
                        this._entity.scene.renderableComponents.add(component);
                    }
                    if (!this._entity.scene.dynamicBatch)
                        this._entity.scene.addChild(component.debugDisplayObject);
                    this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component));
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                    this._components.add(component);
                    this._tempBufferList.push(component);
                }
                if (this._entity.scene.dynamicBatch)
                    this._entity.scene.dynamicInBatch();
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
                this._components.sort(ComponentList.compareUpdatableOrder);
                this._isComponentListUnsorted = false;
            }
        };
        ComponentList.prototype.handleRemove = function (component) {
            if (!component)
                return;
            if (component instanceof es.RenderableComponent) {
                if (component.displayObject.parent)
                    component.displayObject.parent.removeChild(component.displayObject);
                this._entity.scene.renderableComponents.remove(component);
            }
            if (component.debugDisplayObject.parent)
                component.debugDisplayObject.parent.removeChild(component.debugDisplayObject);
            this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component), false);
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
                var updatableComponent = this._components.buffer[i];
                if (updatableComponent.enabled &&
                    (updatableComponent.updateInterval == 1 ||
                        es.Time.frameCount % updatableComponent.updateInterval == 0))
                    updatableComponent.update();
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
        ComponentList.prototype.debugRender = function (camera) {
            for (var i = 0; i < this._components.length; i++) {
                if (this._components.buffer[i].enabled)
                    this._components.buffer[i].debugRender(camera);
            }
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
var ObjectUtils = (function () {
    function ObjectUtils() {
    }
    ObjectUtils.clone = function (p, c) {
        if (c === void 0) { c = null; }
        var c = c || {};
        for (var i in p) {
            if (typeof p[i] === 'object') {
                c[i] = p[i] instanceof Array ? [] : {};
                this.clone(p[i], c[i]);
            }
            else {
                c[i] = p[i];
            }
        }
        return c;
    };
    ObjectUtils.elements = function (p) {
        var c = [];
        for (var i in p) {
            if (Array.isArray(p[i])) {
                for (var _i = 0, _a = p[i]; _i < _a.length; _i++) {
                    var v = _a[_i];
                    c.push(v);
                }
            }
            else {
                c.push(p[i]);
            }
        }
        return c;
    };
    return ObjectUtils;
}());
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
            this._componentsNeedSort = true;
        };
        RenderableComponentList.prototype.setNeedsComponentSort = function () {
            this._componentsNeedSort = true;
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
            this._componentsNeedSort = true;
        };
        RenderableComponentList.prototype.componentsWithRenderLayer = function (renderLayer) {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }
            return this._componentsByRenderLayer.get(renderLayer);
        };
        RenderableComponentList.prototype.updateList = function () {
            if (this._componentsNeedSort) {
                this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this._componentsNeedSort = false;
                this.updateEgretList();
            }
            if (this._unsortedRenderLayers.length > 0) {
                for (var i = 0, count = this._unsortedRenderLayers.length; i < count; i++) {
                    var renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents.sort(RenderableComponentList.compareUpdatableOrder.compare);
                    }
                }
                this._unsortedRenderLayers.length = 0;
                this.updateEgretList();
            }
        };
        RenderableComponentList.prototype.updateEgretList = function () {
            var scene = es.Core._instance._scene;
            if (!scene)
                return;
            var _loop_5 = function (i) {
                var component = this_1._components[i];
                var egretDisplayObject = scene.$children.find(function (a) { return a.hashCode == component.displayObject.hashCode; });
                var displayIndex = scene.getChildIndex(egretDisplayObject);
                if (displayIndex != -1 && displayIndex != i)
                    scene.swapChildrenAt(displayIndex, i);
            };
            var this_1 = this;
            for (var i = 0; i < this._components.length; i++) {
                _loop_5(i);
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
    var TextureUtils = (function () {
        function TextureUtils() {
        }
        TextureUtils.convertImageToCanvas = function (texture, rect) {
            if (!this.sharedCanvas) {
                this.sharedCanvas = egret.sys.createCanvas();
                this.sharedContext = this.sharedCanvas.getContext("2d");
            }
            var w = texture.$getTextureWidth();
            var h = texture.$getTextureHeight();
            if (!rect) {
                rect = egret.$TempRectangle;
                rect.x = 0;
                rect.y = 0;
                rect.width = w;
                rect.height = h;
            }
            rect.x = Math.min(rect.x, w - 1);
            rect.y = Math.min(rect.y, h - 1);
            rect.width = Math.min(rect.width, w - rect.x);
            rect.height = Math.min(rect.height, h - rect.y);
            var iWidth = Math.floor(rect.width);
            var iHeight = Math.floor(rect.height);
            var surface = this.sharedCanvas;
            surface["style"]["width"] = iWidth + "px";
            surface["style"]["height"] = iHeight + "px";
            this.sharedCanvas.width = iWidth;
            this.sharedCanvas.height = iHeight;
            if (egret.Capabilities.renderMode == "webgl") {
                var renderTexture = void 0;
                if (!texture.$renderBuffer) {
                    if (egret.sys.systemRenderer["renderClear"]) {
                        egret.sys.systemRenderer["renderClear"]();
                    }
                    renderTexture = new egret.RenderTexture();
                    renderTexture.drawToTexture(new egret.Bitmap(texture));
                }
                else {
                    renderTexture = texture;
                }
                var pixels = renderTexture.$renderBuffer.getPixels(rect.x, rect.y, iWidth, iHeight);
                var x = 0;
                var y = 0;
                for (var i = 0; i < pixels.length; i += 4) {
                    this.sharedContext.fillStyle =
                        'rgba(' + pixels[i]
                            + ',' + pixels[i + 1]
                            + ',' + pixels[i + 2]
                            + ',' + (pixels[i + 3] / 255) + ')';
                    this.sharedContext.fillRect(x, y, 1, 1);
                    x++;
                    if (x == iWidth) {
                        x = 0;
                        y++;
                    }
                }
                if (!texture.$renderBuffer) {
                    renderTexture.dispose();
                }
                return surface;
            }
            else {
                var bitmapData = texture;
                var offsetX = Math.round(bitmapData.$offsetX);
                var offsetY = Math.round(bitmapData.$offsetY);
                var bitmapWidth = bitmapData.$bitmapWidth;
                var bitmapHeight = bitmapData.$bitmapHeight;
                var $TextureScaleFactor = es.Core._instance.stage.textureScaleFactor;
                this.sharedContext.drawImage(bitmapData.$bitmapData.source, bitmapData.$bitmapX + rect.x / $TextureScaleFactor, bitmapData.$bitmapY + rect.y / $TextureScaleFactor, bitmapWidth * rect.width / w, bitmapHeight * rect.height / h, offsetX, offsetY, rect.width, rect.height);
                return surface;
            }
        };
        TextureUtils.toDataURL = function (type, texture, rect, encoderOptions) {
            try {
                var surface = this.convertImageToCanvas(texture, rect);
                var result = surface.toDataURL(type, encoderOptions);
                return result;
            }
            catch (e) {
                egret.$error(1033);
            }
            return null;
        };
        TextureUtils.eliFoTevas = function (type, texture, filePath, rect, encoderOptions) {
            var surface = this.convertImageToCanvas(texture, rect);
            var result = surface.toTempFilePathSync({
                fileType: type.indexOf("png") >= 0 ? "png" : "jpg"
            });
            wx.getFileSystemManager().saveFile({
                tempFilePath: result,
                filePath: wx.env.USER_DATA_PATH + "/" + filePath,
                success: function (res) {
                }
            });
            return result;
        };
        TextureUtils.getPixel32 = function (texture, x, y) {
            egret.$warn(1041, "getPixel32", "getPixels");
            return texture.getPixels(x, y);
        };
        TextureUtils.getPixels = function (texture, x, y, width, height) {
            if (width === void 0) { width = 1; }
            if (height === void 0) { height = 1; }
            if (egret.Capabilities.renderMode == "webgl") {
                var renderTexture = void 0;
                if (!texture.$renderBuffer) {
                    renderTexture = new egret.RenderTexture();
                    renderTexture.drawToTexture(new egret.Bitmap(texture));
                }
                else {
                    renderTexture = texture;
                }
                var pixels = renderTexture.$renderBuffer.getPixels(x, y, width, height);
                return pixels;
            }
            try {
                var surface = this.convertImageToCanvas(texture);
                var result = this.sharedContext.getImageData(x, y, width, height).data;
                return result;
            }
            catch (e) {
                egret.$error(1039);
            }
        };
        return TextureUtils;
    }());
    es.TextureUtils = TextureUtils;
})(es || (es = {}));
var es;
(function (es) {
    var Time = (function () {
        function Time() {
        }
        Time.update = function (currentTime) {
            var dt = (currentTime - this._lastTime) / 1000;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this._timeSinceSceneLoad += dt;
            this.frameCount++;
            this._lastTime = currentTime;
        };
        Time.sceneChanged = function () {
            this._timeSinceSceneLoad = 0;
        };
        Time.checkEvery = function (interval) {
            return Math.floor(this._timeSinceSceneLoad / interval) > Math.floor((this._timeSinceSceneLoad - this.deltaTime) / interval);
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
    var Graphics = (function () {
        function Graphics() {
            var _this = this;
            var arrayBuffer = new ArrayBuffer(1);
            arrayBuffer[0] = 0xffffff;
            egret.BitmapData.create("arraybuffer", arrayBuffer, function (bitmapData) {
                var tex = new egret.Texture();
                tex.bitmapData = bitmapData;
                _this.pixelTexture = new es.Sprite(tex);
            });
        }
        return Graphics;
    }());
    es.Graphics = Graphics;
})(es || (es = {}));
var es;
(function (es) {
    var GraphicsCapabilities = (function (_super) {
        __extends(GraphicsCapabilities, _super);
        function GraphicsCapabilities() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GraphicsCapabilities.prototype.initialize = function (device) {
            this.platformInitialize(device);
        };
        GraphicsCapabilities.prototype.platformInitialize = function (device) {
            if (GraphicsCapabilities.runtimeType != egret.RuntimeType.WXGAME)
                return;
            var capabilities = this;
            capabilities["isMobile"] = true;
            var systemInfo = wx.getSystemInfoSync();
            var systemStr = systemInfo.system.toLowerCase();
            if (systemStr.indexOf("ios") > -1) {
                capabilities["os"] = "iOS";
            }
            else if (systemStr.indexOf("android") > -1) {
                capabilities["os"] = "Android";
            }
            var language = systemInfo.language;
            if (language.indexOf('zh') > -1) {
                language = "zh-CN";
            }
            else {
                language = "en-US";
            }
            capabilities["language"] = language;
        };
        return GraphicsCapabilities;
    }(egret.Capabilities));
    es.GraphicsCapabilities = GraphicsCapabilities;
})(es || (es = {}));
var es;
(function (es) {
    var GraphicsDevice = (function () {
        function GraphicsDevice() {
            this.setup();
            this.graphicsCapabilities = new es.GraphicsCapabilities();
            this.graphicsCapabilities.initialize(this);
        }
        Object.defineProperty(GraphicsDevice.prototype, "viewport", {
            get: function () {
                return this._viewport;
            },
            enumerable: true,
            configurable: true
        });
        GraphicsDevice.prototype.setup = function () {
            this._viewport = new es.Viewport(0, 0, es.Core._instance.stage.stageWidth, es.Core._instance.stage.stageHeight);
        };
        return GraphicsDevice;
    }());
    es.GraphicsDevice = GraphicsDevice;
})(es || (es = {}));
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
    var GaussianBlurEffect = (function (_super) {
        __extends(GaussianBlurEffect, _super);
        function GaussianBlurEffect() {
            return _super.call(this, es.PostProcessor.default_vert, GaussianBlurEffect.blur_frag, {
                screenWidth: es.Core.graphicsDevice.viewport.width,
                screenHeight: es.Core.graphicsDevice.viewport.height
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
    es.GaussianBlurEffect = GaussianBlurEffect;
})(es || (es = {}));
var es;
(function (es) {
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
    es.PolygonLightEffect = PolygonLightEffect;
})(es || (es = {}));
var es;
(function (es) {
    var PostProcessor = (function () {
        function PostProcessor(effect) {
            if (effect === void 0) { effect = null; }
            this.enabled = true;
            this.effect = effect;
        }
        PostProcessor.prototype.onAddedToScene = function (scene) {
            this.scene = scene;
            this.shape = new egret.Shape();
            this.shape.graphics.beginFill(0xFFFFFF, 1);
            this.shape.graphics.drawRect(0, 0, es.Core.graphicsDevice.viewport.width, es.Core.graphicsDevice.viewport.height);
            this.shape.graphics.endFill();
            scene.addChild(this.shape);
        };
        PostProcessor.prototype.process = function () {
            this.drawFullscreenQuad();
        };
        PostProcessor.prototype.onSceneBackBufferSizeChanged = function (newWidth, newHeight) {
        };
        PostProcessor.prototype.unload = function () {
            if (this.effect) {
                this.effect = null;
            }
            this.scene.removeChild(this.shape);
            this.scene = null;
        };
        PostProcessor.prototype.drawFullscreenQuad = function () {
            this.scene.filters = [this.effect];
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
    es.PostProcessor = PostProcessor;
})(es || (es = {}));
var es;
(function (es) {
    var GaussianBlurPostProcessor = (function (_super) {
        __extends(GaussianBlurPostProcessor, _super);
        function GaussianBlurPostProcessor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GaussianBlurPostProcessor.prototype.onAddedToScene = function (scene) {
            _super.prototype.onAddedToScene.call(this, scene);
            this.effect = new es.GaussianBlurEffect();
        };
        return GaussianBlurPostProcessor;
    }(es.PostProcessor));
    es.GaussianBlurPostProcessor = GaussianBlurPostProcessor;
})(es || (es = {}));
var es;
(function (es) {
    var Renderer = (function () {
        function Renderer(renderOrder, camera) {
            if (camera === void 0) { camera = null; }
            this.renderOrder = 0;
            this.shouldDebugRender = true;
            this.camera = camera;
            this.renderOrder = renderOrder;
        }
        Object.defineProperty(Renderer.prototype, "wantsToRenderToSceneRenderTarget", {
            get: function () {
                return !!this.renderTexture;
            },
            enumerable: true,
            configurable: true
        });
        Renderer.prototype.onAddedToScene = function (scene) {
        };
        Renderer.prototype.unload = function () {
        };
        Renderer.prototype.onSceneBackBufferSizeChanged = function (newWidth, newHeight) {
        };
        Renderer.prototype.compareTo = function (other) {
            return this.renderOrder - other.renderOrder;
        };
        Renderer.prototype.beginRender = function (cam) {
        };
        Renderer.prototype.renderAfterStateCheck = function (renderable, cam) {
            renderable.render(cam);
        };
        Renderer.prototype.debugRender = function (scene, cam) {
            for (var i = 0; i < scene.entities.count; i++) {
                var entity = scene.entities.buffer[i];
                if (entity.enabled)
                    entity.debugRender(cam);
            }
        };
        return Renderer;
    }());
    es.Renderer = Renderer;
})(es || (es = {}));
var es;
(function (es) {
    var DefaultRenderer = (function (_super) {
        __extends(DefaultRenderer, _super);
        function DefaultRenderer() {
            return _super.call(this, 0, null) || this;
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
    }(es.Renderer));
    es.DefaultRenderer = DefaultRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var RenderLayerExcludeRenderer = (function (_super) {
        __extends(RenderLayerExcludeRenderer, _super);
        function RenderLayerExcludeRenderer(renderOrder) {
            var excludedRenderLayers = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                excludedRenderLayers[_i - 1] = arguments[_i];
            }
            var _this = _super.call(this, renderOrder, null) || this;
            _this.excludedRenderLayers = excludedRenderLayers;
            return _this;
        }
        RenderLayerExcludeRenderer.prototype.render = function (scene) {
            var cam = this.camera ? this.camera : scene.camera;
            this.beginRender(cam);
            for (var i = 0; i < scene.renderableComponents.count; i++) {
                var renderable = scene.renderableComponents.buffer[i];
                if (!this.excludedRenderLayers.contains(renderable.renderLayer) && renderable.enabled &&
                    renderable.isVisibleFromCamera(cam))
                    this.renderAfterStateCheck(renderable, cam);
            }
            if (this.shouldDebugRender && es.Core.debugRenderEndabled)
                this.debugRender(scene, cam);
        };
        RenderLayerExcludeRenderer.prototype.debugRender = function (scene, cam) {
            for (var i = 0; i < scene.renderableComponents.count; i++) {
                var renderable = scene.renderableComponents.buffer[i];
                if (!this.excludedRenderLayers.contains(renderable.renderLayer) && renderable.enabled &&
                    renderable.isVisibleFromCamera(cam))
                    renderable.debugRender(cam);
            }
            _super.prototype.debugRender.call(this, scene, cam);
        };
        return RenderLayerExcludeRenderer;
    }(es.Renderer));
    es.RenderLayerExcludeRenderer = RenderLayerExcludeRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var ScreenSpaceRenderer = (function (_super) {
        __extends(ScreenSpaceRenderer, _super);
        function ScreenSpaceRenderer(renderOrder) {
            var renderLayers = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                renderLayers[_i - 1] = arguments[_i];
            }
            var _this = _super.call(this, renderOrder, null) || this;
            renderLayers.sort();
            renderLayers.reverse();
            _this.renderLayers = renderLayers;
            return _this;
        }
        ScreenSpaceRenderer.prototype.render = function (scene) {
            this.beginRender(this.camera);
            for (var i = 0; i < this.renderLayers.length; i++) {
                var renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (var j = 0; j < renderables.length; j++) {
                    var renderable = renderables[j];
                    if (renderable.enabled && renderable.isVisibleFromCamera(this.camera))
                        this.renderAfterStateCheck(renderable, this.camera);
                }
            }
            if (this.shouldDebugRender && es.Core.debugRenderEndabled)
                this.debugRender(scene, this.camera);
        };
        ScreenSpaceRenderer.prototype.debugRender = function (scene, cam) {
            for (var i = 0; i < this.renderLayers.length; i++) {
                var renderables = scene.renderableComponents.componentsWithRenderLayer(this.renderLayers[i]);
                for (var j = 0; j < renderables.length; j++) {
                    var entity = renderables[j];
                    if (entity.enabled)
                        entity.debugRender(cam);
                }
            }
        };
        ScreenSpaceRenderer.prototype.onSceneBackBufferSizeChanged = function (newWidth, newHeight) {
            _super.prototype.onSceneBackBufferSizeChanged.call(this, newWidth, newHeight);
            if (!this.camera)
                this.camera = es.Core.scene.createEntity("screenspace camera").addComponent(new es.Camera());
        };
        return ScreenSpaceRenderer;
    }(es.Renderer));
    es.ScreenSpaceRenderer = ScreenSpaceRenderer;
})(es || (es = {}));
var es;
(function (es) {
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
        PolyLight.prototype.computeTriangleIndices = function (totalTris) {
            if (totalTris === void 0) { totalTris = 20; }
            this._indices.length = 0;
            for (var i = 0; i < totalTris; i += 2) {
                this._indices.push(0);
                this._indices.push(i + 2);
                this._indices.push(i + 1);
            }
        };
        return PolyLight;
    }(es.RenderableComponent));
    es.PolyLight = PolyLight;
})(es || (es = {}));
var es;
(function (es) {
    var GaussianBlur = (function () {
        function GaussianBlur() {
        }
        GaussianBlur.createBlurredTexture = function (image, deviation) {
            if (deviation === void 0) { deviation = 1; }
            var pixelData = image.getPixels(0, 0, image.textureWidth, image.textureHeight);
            var srcData = new Array(image.textureWidth * image.textureHeight);
            for (var i = 0; i < image.textureWidth; i++) {
                for (var j = 0; j < image.textureHeight; j++) {
                    var width = image.textureWidth;
                    var r = pixelData[i * 4 + j * width];
                    var g = pixelData[i * 4 + j * width + 1];
                    var b = pixelData[i * 4 + j * width + 2];
                    var a = pixelData[i * 4 + j * width + 3];
                    srcData[i + j * width] = new es.Color(r, g, b, a);
                }
            }
            var destData = this.createBlurredTextureData(srcData, image.textureWidth, image.textureHeight, deviation);
            var arrayBuffer = new ArrayBuffer(destData.length);
            destData.forEach(function (value, index) {
                arrayBuffer[index] = value.packedValue;
            });
            egret.BitmapData.create("arraybuffer", arrayBuffer, function (bitmapData) {
            });
        };
        GaussianBlur.createBlurredTextureData = function (srcData, width, height, deviation) {
            if (deviation === void 0) { deviation = 1; }
            var matrixR = new es.FasterDictionary();
            var matrixG = new es.FasterDictionary();
            var matrixB = new es.FasterDictionary();
            var matrixA = new es.FasterDictionary();
            var destData = new Array(width * height);
            for (var i = 0; i < width; i++) {
                for (var j = 0; j < height; j++) {
                    matrixR.add({ x: i, y: j }, srcData[i + j * width].r);
                    matrixG.add({ x: i, y: j }, srcData[i + j * width].g);
                    matrixB.add({ x: i, y: j }, srcData[i + j * width].b);
                    matrixA.add({ x: i, y: j }, srcData[i + j * width].a);
                }
            }
            matrixR = this.gaussianConvolution(matrixR, deviation);
            matrixG = this.gaussianConvolution(matrixG, deviation);
            matrixB = this.gaussianConvolution(matrixB, deviation);
            matrixA = this.gaussianConvolution(matrixA, deviation);
            for (var i = 0; i < width; i++) {
                for (var j = 0; j < height; j++) {
                    var r = Math.min(255, matrixR.tryGetValue({ x: i, y: j }));
                    var g = Math.min(255, matrixG.tryGetValue({ x: i, y: j }));
                    var b = Math.min(255, matrixB.tryGetValue({ x: i, y: j }));
                    var a = Math.min(255, matrixA.tryGetValue({ x: i, y: j }));
                    destData[i + j * width] = new es.Color(r, g, b, a);
                }
            }
            return destData;
        };
        GaussianBlur.gaussianConvolution = function (matrix, deviation) {
            var kernel = this.calculateNormalized1DSampleKernel(deviation);
            var res1 = new es.FasterDictionary();
            var res2 = new es.FasterDictionary();
            for (var i = 0; i < matrix._valuesInfo.length; i++) {
                for (var j = 0; j < matrix.valuesArray.length; j++)
                    res1.add({ x: i, y: j }, this.processPoint(matrix, i, j, kernel, 0));
            }
            for (var i = 0; i < matrix._valuesInfo.length; i++) {
                for (var j = 0; j < matrix.valuesArray.length; j++)
                    res2.add({ x: i, y: j }, this.processPoint(res1, i, j, kernel, 1));
            }
            return res2;
        };
        GaussianBlur.processPoint = function (matrix, x, y, kernel, direction) {
            var res = 0;
            var half = kernel._valuesInfo.length / 2;
            for (var i = 0; i < kernel._valuesInfo.length; i++) {
                var cox = direction == 0 ? x + i - half : x;
                var coy = direction == 1 ? y + i - half : y;
                if (cox >= 0 && cox < matrix._valuesInfo.length && coy >= 0 && coy < matrix.valuesArray.length)
                    res += matrix.tryGetValue({ x: cox, y: coy }) * kernel.tryGetValue({ x: i, y: 0 });
            }
            return res;
        };
        GaussianBlur.calculate1DSampleKernel = function (deviation) {
            var size = Math.ceil(deviation * 3) * 3 + 1;
            return this.calculate1DSampleKernelOfSize(deviation, size);
        };
        GaussianBlur.calculate1DSampleKernelOfSize = function (deviation, size) {
            var ret = new es.FasterDictionary();
            var half = (size - 1) / 2;
            for (var i = 0; i < size; i++) {
                ret.add({ x: i, y: 0 }, 1 / (Math.sqrt(2 * Math.PI) * deviation) * Math.exp(-(i - half) * (i - half) / (2 * deviation * deviation)));
            }
            return ret;
        };
        GaussianBlur.calculateNormalized1DSampleKernel = function (deviation) {
            return this.normalizeMatrix(this.calculate1DSampleKernel(deviation));
        };
        GaussianBlur.normalizeMatrix = function (matrix) {
            var ret = new es.FasterDictionary();
            var sum = 0;
            for (var i = 0; i < ret._valuesInfo.length; i++) {
                for (var j = 0; j < ret.valuesArray.length; j++) {
                    sum += matrix.tryGetValue({ x: i, y: j });
                }
            }
            if (sum != 0) {
                for (var i = 0; i < ret._valuesInfo.length; i++) {
                    for (var j = 0; j < ret.valuesArray.length; j++) {
                        ret.add({ x: i, y: j }, matrix.tryGetValue({ x: i, y: j }) / sum);
                    }
                }
            }
            return ret;
        };
        return GaussianBlur;
    }());
    es.GaussianBlur = GaussianBlur;
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
                    if (!this._mask.parent)
                        es.Core.scene.stage.addChild(this._mask);
                    this._mask.graphics.beginFill(this.fadeToColor, 1);
                    this._mask.graphics.drawRect(0, 0, es.Core.graphicsDevice.viewport.width, es.Core.graphicsDevice.viewport.height);
                    this._mask.graphics.endFill();
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
                        });
                    });
                    return [2];
                });
            });
        };
        FadeTransition.prototype.transitionComplete = function () {
            _super.prototype.transitionComplete.call(this);
            if (this._mask.parent)
                this._mask.parent.removeChild(this._mask);
        };
        FadeTransition.prototype.render = function () {
            this._mask.graphics.clear();
            this._mask.graphics.beginFill(this.fadeToColor, this._alpha);
            this._mask.graphics.drawRect(0, 0, es.Core.graphicsDevice.viewport.width, es.Core.graphicsDevice.viewport.height);
            this._mask.graphics.endFill();
        };
        return FadeTransition;
    }(es.SceneTransition));
    es.FadeTransition = FadeTransition;
})(es || (es = {}));
var es;
(function (es) {
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
            _this._mask.graphics.drawRect(0, 0, es.Core.graphicsDevice.viewport.width, es.Core.graphicsDevice.viewport.height);
            _this._mask.graphics.endFill();
            _this._mask.filters = [_this._windEffect];
            es.Core.scene.stage.addChild(_this._mask);
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
                            return [2];
                    }
                });
            });
        };
        WindTransition.prototype.transitionComplete = function () {
            _super.prototype.transitionComplete.call(this);
            if (this._mask.parent)
                this._mask.parent.removeChild(this._mask);
        };
        return WindTransition;
    }(es.SceneTransition));
    es.WindTransition = WindTransition;
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
    es.matrixPool = [];
    var Matrix2D = (function (_super) {
        __extends(Matrix2D, _super);
        function Matrix2D() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Matrix2D.prototype, "m11", {
            get: function () {
                return this.a;
            },
            set: function (value) {
                this.a = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "m12", {
            get: function () {
                return this.b;
            },
            set: function (value) {
                this.b = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "m21", {
            get: function () {
                return this.c;
            },
            set: function (value) {
                this.c = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "m22", {
            get: function () {
                return this.d;
            },
            set: function (value) {
                this.d = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "m31", {
            get: function () {
                return this.tx;
            },
            set: function (value) {
                this.tx = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix2D.prototype, "m32", {
            get: function () {
                return this.ty;
            },
            set: function (value) {
                this.ty = value;
            },
            enumerable: true,
            configurable: true
        });
        Matrix2D.create = function () {
            var matrix = es.matrixPool.pop();
            if (!matrix)
                matrix = new Matrix2D();
            return matrix;
        };
        Matrix2D.prototype.identity = function () {
            this.a = this.d = 1;
            this.b = this.c = this.tx = this.ty = 0;
            return this;
        };
        Matrix2D.prototype.translate = function (dx, dy) {
            this.tx += dx;
            this.ty += dy;
            return this;
        };
        Matrix2D.prototype.scale = function (sx, sy) {
            if (sx !== 1) {
                this.a *= sx;
                this.c *= sx;
                this.tx *= sx;
            }
            if (sy !== 1) {
                this.b *= sy;
                this.d *= sy;
                this.ty *= sy;
            }
            return this;
        };
        Matrix2D.prototype.rotate = function (angle) {
            angle = +angle;
            if (angle !== 0) {
                angle = angle / DEG_TO_RAD;
                var u = Math.cos(angle);
                var v = Math.sin(angle);
                var ta = this.a;
                var tb = this.b;
                var tc = this.c;
                var td = this.d;
                var ttx = this.tx;
                var tty = this.ty;
                this.a = ta * u - tb * v;
                this.b = ta * v + tb * u;
                this.c = tc * u - td * v;
                this.d = tc * v + td * u;
                this.tx = ttx * u - tty * v;
                this.ty = ttx * v + tty * u;
            }
            return this;
        };
        Matrix2D.prototype.invert = function () {
            this.$invertInto(this);
            return this;
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
        Matrix2D.prototype.release = function (matrix) {
            if (!matrix)
                return;
            es.matrixPool.push(matrix);
        };
        return Matrix2D;
    }(egret.Matrix));
    es.Matrix2D = Matrix2D;
})(es || (es = {}));
var es;
(function (es) {
    var Rectangle = (function (_super) {
        __extends(Rectangle, _super);
        function Rectangle() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Rectangle.prototype, "max", {
            get: function () {
                return new es.Vector2(this.right, this.bottom);
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
        Rectangle.prototype.contains = function (x, y) {
            return ((((this.x <= x) && (x < (this.x + this.width))) && (this.y <= y)) && (y < (this.y + this.height)));
        };
        Rectangle.prototype.getHalfSize = function () {
            return new es.Vector2(this.width * 0.5, this.height * 0.5);
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
                this._transformMat = es.Matrix2D.create().translate(-worldPosX - origin.x, -worldPosY - origin.y);
                this._tempMat = es.Matrix2D.create().scale(scale.x, scale.y);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = es.Matrix2D.create().rotate(rotation);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = es.Matrix2D.create().translate(worldPosX, worldPosY);
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
        return Rectangle;
    }(egret.Rectangle));
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
                var _loop_6 = function (j) {
                    var neighbor = neighbors[j];
                    if (!collider.isTrigger && !neighbor.isTrigger)
                        return "continue";
                    if (collider.overlaps(neighbor)) {
                        var pair_1 = new es.Pair(collider, neighbor);
                        var shouldReportTriggerEvent = this_2._activeTriggerIntersections.findIndex(function (value) {
                            return value.first == pair_1.first && value.second == pair_1.second;
                        }) == -1 && this_2._previousTriggerIntersections.findIndex(function (value) {
                            return value.first == pair_1.first && value.second == pair_1.second;
                        }) == -1;
                        if (shouldReportTriggerEvent)
                            this_2.notifyTriggerListeners(pair_1, true);
                        if (!this_2._activeTriggerIntersections.contains(pair_1))
                            this_2._activeTriggerIntersections.push(pair_1);
                    }
                };
                var this_2 = this;
                for (var j = 0; j < neighbors.length; j++) {
                    _loop_6(j);
                }
            }
            es.ListPool.free(colliders);
            this.checkForExitedColliders();
        };
        ColliderTriggerHelper.prototype.checkForExitedColliders = function () {
            var _this = this;
            var _loop_7 = function (i) {
                var index = this_3._previousTriggerIntersections.findIndex(function (value) {
                    if (value.first == _this._activeTriggerIntersections[i].first && value.second == _this._activeTriggerIntersections[i].second)
                        return true;
                    return false;
                });
                if (index != -1)
                    this_3._previousTriggerIntersections.removeAt(index);
            };
            var this_3 = this;
            for (var i = 0; i < this._activeTriggerIntersections.length; i++) {
                _loop_7(i);
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
                    if (!c.firstOrDefault(function (c) { return c.hashCode == collider.hashCode; }))
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
                    var _loop_8 = function (i) {
                        var collider = cell[i];
                        if (collider == excludeCollider || !es.Flags.isFlagSet(layerMask, collider.physicsLayer.value))
                            return "continue";
                        if (bounds.intersects(collider.bounds)) {
                            if (!this_4._tempHashSet.firstOrDefault(function (c) { return c.hashCode == collider.hashCode; }))
                                this_4._tempHashSet.push(collider);
                        }
                    };
                    var this_4 = this;
                    for (var i = 0; i < cell.length; i++) {
                        _loop_8(i);
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
                var combinedMatrix = es.Matrix2D.create().translate(-this._polygonCenter.x, -this._polygonCenter.y);
                if (!collider.entity.transform.scale.equals(es.Vector2.one)) {
                    tempMat = es.Matrix2D.create().scale(collider.entity.transform.scale.x, collider.entity.transform.scale.y);
                    combinedMatrix = combinedMatrix.multiply(tempMat);
                    hasUnitScale = false;
                    this.center = es.Vector2.multiply(collider.localOffset, collider.entity.transform.scale);
                }
                if (collider.entity.transform.rotation != 0) {
                    tempMat = es.Matrix2D.create().rotate(collider.entity.transform.rotation);
                    combinedMatrix = combinedMatrix.multiply(tempMat);
                    var offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * es.MathHelper.Rad2Deg;
                    var offsetLength = hasUnitScale ? collider._localOffsetLength :
                        es.Vector2.multiply(collider.localOffset, collider.entity.transform.scale).length();
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotationDegrees + offsetAngle);
                }
                tempMat = es.Matrix2D.create().translate(this._polygonCenter.x, this._polygonCenter.y);
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
var es;
(function (es) {
    var Particle = (function () {
        function Particle() {
            this.mass = 1;
            this.radius = 0;
            this.collidesWithColliders = true;
        }
        Particle.prototype.applyForce = function (force) {
            this.acceleration.add(es.Vector2.divide(force, new es.Vector2(this.mass)));
        };
        return Particle;
    }());
    es.Particle = Particle;
})(es || (es = {}));
var es;
(function (es) {
    var VerletWorld = (function () {
        function VerletWorld(simulationBounds) {
            if (simulationBounds === void 0) { simulationBounds = null; }
            this.gravity = new es.Vector2(0, 980);
            this.constraintIterations = 3;
            this.maximumStepIterations = 5;
            this.allowDragging = true;
            this._composites = [];
            this._tempCircle = new es.Circle(1);
            this._leftOverTime = 0;
            this._fixedDeltaTime = 1 / 60;
            this._iterationSteps = 0;
            this._fixedDeltaTimeSq = 0;
            this.simulationBounds = simulationBounds;
            this._fixedDeltaTimeSq = Math.pow(this._fixedDeltaTimeSq, 2);
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
        VerletWorld.prototype.handleCollisions = function (p, collidesWithLayers) {
            var collidedCount = es.Physics.overlapCircleAll(p.position, p.radius, VerletWorld._colliders, collidesWithLayers);
            for (var i = 0; i < collidedCount; i++) {
                var collider = VerletWorld._colliders[i];
                if (collider.isTrigger)
                    continue;
                var collisionResult = new es.CollisionResult();
                if (p.radius < 2) {
                    if (collider.shape.pointCollidesWithShape(p.position, collisionResult)) {
                        p.position.subtract(collisionResult.minimumTranslationVector);
                    }
                }
                else {
                    this._tempCircle.radius = p.radius;
                    this._tempCircle.position = p.position;
                    if (this._tempCircle.collidesWithShape(collider.shape, collisionResult)) {
                        p.position.subtract(collisionResult.minimumTranslationVector);
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
        VerletWorld.prototype.updateTiming = function () {
            this._leftOverTime += es.Time.deltaTime;
            this._iterationSteps = Math.floor(Math.trunc(this._leftOverTime / this._fixedDeltaTime));
            this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;
            this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
        };
        VerletWorld.prototype.addComposite = function (composite) {
            this._composites.push(composite);
            return composite;
        };
        VerletWorld.prototype.removeComposite = function (composite) {
            this._composites.remove(composite);
        };
        VerletWorld.prototype.handleDragging = function () {
        };
        VerletWorld.prototype.debugRender = function (camera) {
            for (var i = 0; i < this._composites.length; i++)
                this._composites[i].debugRender(camera);
        };
        VerletWorld._colliders = new Array(4);
        return VerletWorld;
    }());
    es.VerletWorld = VerletWorld;
})(es || (es = {}));
var es;
(function (es) {
    var Composite = (function () {
        function Composite() {
            this.friction = new es.Vector2(0.98, 1);
            this.collidesWithLayers = es.Physics.allLayers;
            this.particles = [];
            this._constraints = [];
        }
        Composite.prototype.solveConstraints = function () {
            for (var i = this._constraints.length - 1; i >= 0; i--) {
                this._constraints[i].solve();
            }
        };
        Composite.prototype.updateParticles = function (deltaTimeSquared, gravity) {
            for (var j = 0; j < this.particles.length; j++) {
                var p = this.particles[j];
                if (p.isPinned) {
                    p.position = p.pinnedPosition;
                    continue;
                }
                p.applyForce(es.Vector2.multiply(new es.Vector2(p.mass), gravity));
                var vel = es.Vector2.subtract(p.position, p.lastPosition).multiply(this.friction);
                var nextPos = es.Vector2.add(p.position, vel).add(es.Vector2.multiply(new es.Vector2(0.5 * deltaTimeSquared), p.acceleration));
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
        Composite.prototype.debugRender = function (camera) {
        };
        return Composite;
    }());
    es.Composite = Composite;
})(es || (es = {}));
var es;
(function (es) {
    var Constraint = (function () {
        function Constraint() {
            this.collidesWithColliders = true;
        }
        Constraint.prototype.handleCollisions = function (collidesWithLayers) { };
        return Constraint;
    }());
    es.Constraint = Constraint;
})(es || (es = {}));
var es;
(function (es) {
    var TmxGroup = (function () {
        function TmxGroup() {
        }
        return TmxGroup;
    }());
    es.TmxGroup = TmxGroup;
})(es || (es = {}));
var es;
(function (es) {
    var TmxImageLayer = (function () {
        function TmxImageLayer() {
        }
        return TmxImageLayer;
    }());
    es.TmxImageLayer = TmxImageLayer;
})(es || (es = {}));
var es;
(function (es) {
    var TmxLayer = (function () {
        function TmxLayer() {
        }
        Object.defineProperty(TmxLayer.prototype, "offset", {
            get: function () {
                return new es.Vector2(this.offsetX, this.offsetY);
            },
            enumerable: true,
            configurable: true
        });
        TmxLayer.prototype.getTileWithGid = function (gid) {
            for (var i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i] && this.tiles[i].gid == gid)
                    return this.tiles[i];
            }
            return null;
        };
        TmxLayer.prototype.getTile = function (x, y) {
            return this.tiles[x + y * this.width];
        };
        TmxLayer.prototype.getCollisionRectangles = function () {
            var checkedIndexes = new Array(this.tiles.length);
            var rectangles = [];
            var startCol = -1;
            var index = -1;
            for (var y = 0; y < this.map.height; y++) {
                for (var x = 0; x < this.map.width; x++) {
                    index = y * this.map.width + x;
                    var tile = this.getTile(x, y);
                    if (tile && !checkedIndexes[index]) {
                        if (startCol < 0)
                            startCol = x;
                        checkedIndexes[index] = true;
                    }
                    else if (!tile || checkedIndexes[index] == true) {
                        if (startCol >= 0) {
                            rectangles.push(this.findBoundsRect(startCol, x, y, checkedIndexes));
                            startCol = -1;
                        }
                    }
                }
                if (startCol >= 0) {
                    rectangles.push(this.findBoundsRect(startCol, this.map.width, y, checkedIndexes));
                    startCol = -1;
                }
            }
            return rectangles;
        };
        TmxLayer.prototype.findBoundsRect = function (startX, endX, startY, checkedIndexes) {
            var index = -1;
            for (var y = startY + 1; y < this.map.height; y++) {
                for (var x = startX; x < endX; x++) {
                    index = y * this.map.width + x;
                    var tile = this.getTile(x, y);
                    if (!tile || checkedIndexes[index]) {
                        for (var _x = startX; _x < x; _x++) {
                            index = y * this.map.width + _x;
                            checkedIndexes[index] = false;
                        }
                        return new es.Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight, (endX - startX) * this.map.tileWidth, (y - startY) * this.map.tileHeight);
                    }
                    checkedIndexes[index] = true;
                }
            }
            return new es.Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight, (endX - startX) * this.map.tileWidth, (this.map.height - startY) * this.map.tileHeight);
        };
        return TmxLayer;
    }());
    es.TmxLayer = TmxLayer;
    var TmxLayerTile = (function () {
        function TmxLayerTile(map, id, x, y) {
            this.x = x;
            this.y = y;
            var rawGid = id;
            var flip;
            flip = (rawGid & TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG) != 0;
            this.horizontalFlip = flip;
            flip = (rawGid & TmxLayerTile.FLIPPED_VERTICALLY_FLAG) != 0;
            this.verticalFlip = flip;
            rawGid &= ~(TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG | TmxLayerTile.FLIPPED_VERTICALLY_FLAG);
            this.gid = Math.floor(rawGid);
            this.tileset = map.getTilesetForTileGid(this.gid);
        }
        Object.defineProperty(TmxLayerTile.prototype, "position", {
            get: function () {
                return new es.Vector2(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxLayerTile.prototype, "tilesetTile", {
            get: function () {
                if (!this._tilesetTileIndex) {
                    this._tilesetTileIndex = -1;
                    if (this.tileset.firstGid <= this.gid) {
                        var tilesetTile = this.tileset.tiles.get(this.gid - this.tileset.firstGid);
                        if (tilesetTile) {
                            this._tilesetTileIndex = this.gid - this.tileset.firstGid;
                        }
                    }
                }
                if (this._tilesetTileIndex < 0)
                    return null;
                return this.tileset.tiles.get(this._tilesetTileIndex);
            },
            enumerable: true,
            configurable: true
        });
        TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        TmxLayerTile.FLIPPED_VERTICALLY_FLAG = 0x40000000;
        return TmxLayerTile;
    }());
    es.TmxLayerTile = TmxLayerTile;
})(es || (es = {}));
var es;
(function (es) {
    var TmxDocument = (function () {
        function TmxDocument() {
            this.tmxDirectory = "resource/assets/";
        }
        return TmxDocument;
    }());
    es.TmxDocument = TmxDocument;
    var TmxImage = (function () {
        function TmxImage() {
        }
        TmxImage.prototype.dispose = function () {
            if (this.bitmap) {
                this.bitmap.dispose();
                this.bitmap = null;
            }
        };
        return TmxImage;
    }());
    es.TmxImage = TmxImage;
})(es || (es = {}));
var es;
(function (es) {
    var TmxMap = (function (_super) {
        __extends(TmxMap, _super);
        function TmxMap() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(TmxMap.prototype, "worldWidth", {
            get: function () {
                return this.width * this.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxMap.prototype, "worldHeight", {
            get: function () {
                return this.height * this.tileHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxMap.prototype, "requiresLargeTileCulling", {
            get: function () {
                return this.maxTileHeight > this.tileHeight || this.maxTileWidth > this.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        TmxMap.prototype.getTilesetForTileGid = function (gid) {
            if (gid == 0)
                return null;
            for (var i = this.tilesets.length - 1; i >= 0; i--) {
                if (this.tilesets[i].firstGid <= gid)
                    return this.tilesets[i];
            }
            console.error("tile gid" + gid + "\u672A\u5728\u4EFB\u4F55tileset\u4E2D\u627E\u5230");
        };
        TmxMap.prototype.worldToTilePositionX = function (x, clampToTilemapBounds) {
            if (clampToTilemapBounds === void 0) { clampToTilemapBounds = true; }
            var tileX = Math.floor(x / this.tileWidth);
            if (!clampToTilemapBounds)
                return tileX;
            return es.MathHelper.clamp(tileX, 0, this.width - 1);
        };
        TmxMap.prototype.worldToTilePositionY = function (y, clampToTilemapBounds) {
            if (clampToTilemapBounds === void 0) { clampToTilemapBounds = true; }
            var tileY = Math.floor(y / this.tileHeight);
            if (!clampToTilemapBounds)
                return tileY;
            return es.MathHelper.clamp(tileY, 0, this.height - 1);
        };
        TmxMap.prototype.getLayer = function (name) {
            return this.layers[name];
        };
        TmxMap.prototype.update = function () {
            this.tilesets.forEach(function (tileset) { tileset.update(); });
        };
        TmxMap.prototype.dispose = function (disposing) {
            if (disposing === void 0) { disposing = true; }
            if (!this._isDisposed) {
                if (disposing) {
                    this.tilesets.forEach(function (tileset) { if (tileset.image)
                        tileset.image.dispose(); });
                    this.imageLayers.forEach(function (layer) { if (layer.image)
                        layer.image.dispose(); });
                }
                this._isDisposed = true;
            }
        };
        return TmxMap;
    }(es.TmxDocument));
    es.TmxMap = TmxMap;
    var OrientationType;
    (function (OrientationType) {
        OrientationType[OrientationType["unknown"] = 0] = "unknown";
        OrientationType[OrientationType["orthogonal"] = 1] = "orthogonal";
        OrientationType[OrientationType["isometric"] = 2] = "isometric";
        OrientationType[OrientationType["staggered"] = 3] = "staggered";
        OrientationType[OrientationType["hexagonal"] = 4] = "hexagonal";
    })(OrientationType = es.OrientationType || (es.OrientationType = {}));
    var StaggerAxisType;
    (function (StaggerAxisType) {
        StaggerAxisType[StaggerAxisType["x"] = 0] = "x";
        StaggerAxisType[StaggerAxisType["y"] = 1] = "y";
    })(StaggerAxisType = es.StaggerAxisType || (es.StaggerAxisType = {}));
    var StaggerIndexType;
    (function (StaggerIndexType) {
        StaggerIndexType[StaggerIndexType["odd"] = 0] = "odd";
        StaggerIndexType[StaggerIndexType["even"] = 1] = "even";
    })(StaggerIndexType = es.StaggerIndexType || (es.StaggerIndexType = {}));
    var RenderOrderType;
    (function (RenderOrderType) {
        RenderOrderType[RenderOrderType["rightDown"] = 0] = "rightDown";
        RenderOrderType[RenderOrderType["rightUp"] = 1] = "rightUp";
        RenderOrderType[RenderOrderType["leftDown"] = 2] = "leftDown";
        RenderOrderType[RenderOrderType["leftUp"] = 3] = "leftUp";
    })(RenderOrderType = es.RenderOrderType || (es.RenderOrderType = {}));
})(es || (es = {}));
var es;
(function (es) {
    var TmxObjectGroup = (function () {
        function TmxObjectGroup() {
        }
        return TmxObjectGroup;
    }());
    es.TmxObjectGroup = TmxObjectGroup;
    var TmxObject = (function () {
        function TmxObject() {
            this.shape = new egret.Shape();
            this.textField = new egret.TextField();
        }
        return TmxObject;
    }());
    es.TmxObject = TmxObject;
    var TmxText = (function () {
        function TmxText() {
        }
        return TmxText;
    }());
    es.TmxText = TmxText;
    var TmxAlignment = (function () {
        function TmxAlignment() {
        }
        return TmxAlignment;
    }());
    es.TmxAlignment = TmxAlignment;
    var TmxObjectType;
    (function (TmxObjectType) {
        TmxObjectType[TmxObjectType["basic"] = 0] = "basic";
        TmxObjectType[TmxObjectType["point"] = 1] = "point";
        TmxObjectType[TmxObjectType["tile"] = 2] = "tile";
        TmxObjectType[TmxObjectType["ellipse"] = 3] = "ellipse";
        TmxObjectType[TmxObjectType["polygon"] = 4] = "polygon";
        TmxObjectType[TmxObjectType["polyline"] = 5] = "polyline";
        TmxObjectType[TmxObjectType["text"] = 6] = "text";
    })(TmxObjectType = es.TmxObjectType || (es.TmxObjectType = {}));
    var DrawOrderType;
    (function (DrawOrderType) {
        DrawOrderType[DrawOrderType["unkownOrder"] = -1] = "unkownOrder";
        DrawOrderType[DrawOrderType["TopDown"] = 0] = "TopDown";
        DrawOrderType[DrawOrderType["IndexOrder"] = 1] = "IndexOrder";
    })(DrawOrderType = es.DrawOrderType || (es.DrawOrderType = {}));
    var TmxHorizontalAlignment;
    (function (TmxHorizontalAlignment) {
        TmxHorizontalAlignment[TmxHorizontalAlignment["left"] = 0] = "left";
        TmxHorizontalAlignment[TmxHorizontalAlignment["center"] = 1] = "center";
        TmxHorizontalAlignment[TmxHorizontalAlignment["right"] = 2] = "right";
        TmxHorizontalAlignment[TmxHorizontalAlignment["justify"] = 3] = "justify";
    })(TmxHorizontalAlignment = es.TmxHorizontalAlignment || (es.TmxHorizontalAlignment = {}));
    var TmxVerticalAlignment;
    (function (TmxVerticalAlignment) {
        TmxVerticalAlignment[TmxVerticalAlignment["top"] = 0] = "top";
        TmxVerticalAlignment[TmxVerticalAlignment["center"] = 1] = "center";
        TmxVerticalAlignment[TmxVerticalAlignment["bottom"] = 2] = "bottom";
    })(TmxVerticalAlignment = es.TmxVerticalAlignment || (es.TmxVerticalAlignment = {}));
})(es || (es = {}));
var es;
(function (es) {
    var TiledMapLoader = (function () {
        function TiledMapLoader() {
        }
        TiledMapLoader.loadTmxMap = function (map, filePath) {
            var xMap = RES.getRes(filePath);
            return this.loadTmxMapData(map, xMap, RES.getResourceInfo(filePath));
        };
        TiledMapLoader.loadTmxMapData = function (map, xMap, info) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, e, tileset;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            map.version = xMap["version"];
                            map.tiledVersion = xMap["tiledversion"];
                            map.width = xMap["width"];
                            map.height = xMap["height"];
                            map.tileWidth = xMap["tilewidth"];
                            map.tileHeight = xMap["tileheight"];
                            map.hexSideLength = xMap["hexsidelength"];
                            map.orientation = this.parseOrientationType(xMap["orientation"]);
                            map.staggerAxis = this.parseStaggerAxisType(xMap["staggeraxis"]);
                            map.staggerIndex = this.parseStaggerIndexType(xMap["staggerindex"]);
                            map.renderOrder = this.parseRenderOrderType(xMap["renderorder"]);
                            map.nextObjectID = xMap["nextobjectid"];
                            map.backgroundColor = es.TmxUtils.color16ToUnit(xMap["color"]);
                            map.properties = this.parsePropertyDict(xMap["properties"]);
                            map.maxTileWidth = map.tileWidth;
                            map.maxTileHeight = map.tileHeight;
                            map.tmxDirectory = info.root + info.url.replace(".", "_").replace(info.name, "");
                            map.tilesets = [];
                            _i = 0, _a = xMap["tilesets"];
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 4];
                            e = _a[_i];
                            return [4, this.parseTmxTileset(map, e)];
                        case 2:
                            tileset = _b.sent();
                            map.tilesets.push(tileset);
                            this.updateMaxTileSizes(tileset);
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3, 1];
                        case 4:
                            map.layers = [];
                            map.tileLayers = [];
                            map.objectGroups = [];
                            map.imageLayers = [];
                            map.groups = [];
                            this.parseLayers(map, xMap, map, map.width, map.height, map.tmxDirectory);
                            return [2, map];
                    }
                });
            });
        };
        TiledMapLoader.parseLayers = function (container, xEle, map, width, height, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, e, layer, _b, tileLayer, objectgroup, imagelayer, newGroup;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _i = 0, _a = ObjectUtils.elements(xEle).where(function (x) {
                                return x.type == "tilelayer" || x.type == "objectgroup" || x.type == "imagelayer" || x.type == "group";
                            });
                            _c.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 11];
                            e = _a[_i];
                            layer = void 0;
                            _b = e.type;
                            switch (_b) {
                                case "tilelayer": return [3, 2];
                                case "objectgroup": return [3, 3];
                                case "imagelayer": return [3, 4];
                                case "group": return [3, 6];
                            }
                            return [3, 8];
                        case 2:
                            tileLayer = this.loadTmxLayer(new es.TmxLayer(), map, e, width, height);
                            layer = tileLayer;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.tileLayers.push(tileLayer);
                            return [3, 9];
                        case 3:
                            objectgroup = this.loadTmxObjectGroup(new es.TmxObjectGroup(), map, e);
                            layer = objectgroup;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.objectGroups.push(objectgroup);
                            return [3, 9];
                        case 4: return [4, this.loadTmxImageLayer(new es.TmxImageLayer(), map, e, tmxDirectory)];
                        case 5:
                            imagelayer = _c.sent();
                            layer = imagelayer;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.imageLayers.push(imagelayer);
                            return [3, 9];
                        case 6: return [4, this.loadTmxGroup(new es.TmxGroup(), map, e, width, height, tmxDirectory)];
                        case 7:
                            newGroup = _c.sent();
                            layer = newGroup;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.groups.push(newGroup);
                            return [3, 9];
                        case 8: throw new Error("无效的操作");
                        case 9:
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.layers.push(layer);
                            _c.label = 10;
                        case 10:
                            _i++;
                            return [3, 1];
                        case 11: return [2];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxGroup = function (group, map, xGroup, width, height, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            group.map = map;
                            group.name = xGroup["name"] != undefined ? xGroup["name"] : "";
                            group.opacity = xGroup["opacity"] != undefined ? xGroup["opacity"] : 1;
                            group.visible = xGroup["visible"] != undefined ? xGroup["visible"] : true;
                            group.offsetX = xGroup["offsetx"] != undefined ? xGroup["offsetx"] : 0;
                            group.offsetY = xGroup["offsety"] != undefined ? xGroup["offsety"] : 0;
                            group.properties = this.parsePropertyDict(xGroup["properties"]);
                            group.layers = [];
                            group.tileLayers = [];
                            group.objectGroups = [];
                            group.imageLayers = [];
                            group.groups = [];
                            return [4, this.parseLayers(group, xGroup, map, width, height, tmxDirectory)];
                        case 1:
                            _a.sent();
                            return [2, group];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxImageLayer = function (layer, map, xImageLayer, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var xImage, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            layer.map = map;
                            layer.name = xImageLayer["name"];
                            layer.width = xImageLayer["width"];
                            layer.height = xImageLayer["height"];
                            layer.visible = xImageLayer["visible"] != undefined ? xImageLayer["visible"] : true;
                            layer.opacity = xImageLayer["opacity"] != undefined ? xImageLayer["opacity"] : 1;
                            layer.offsetX = xImageLayer["offsetx"] != undefined ? xImageLayer["offsetx"] : 0;
                            layer.offsetY = xImageLayer["offsety"] != undefined ? xImageLayer["offsety"] : 0;
                            xImage = xImageLayer["image"];
                            if (!xImage) return [3, 2];
                            _a = layer;
                            return [4, this.loadTmxImage(new es.TmxImage(), xImage, tmxDirectory)];
                        case 1:
                            _a.image = _b.sent();
                            _b.label = 2;
                        case 2:
                            layer.properties = this.parsePropertyDict(xImageLayer["properties"]);
                            return [2, layer];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxLayer = function (layer, map, xLayer, width, height) {
            layer.map = map;
            layer.name = xLayer["name"];
            layer.opacity = xLayer["opacity"] != undefined ? xLayer["opacity"] : 1;
            layer.visible = xLayer["visible"] != undefined ? xLayer["visible"] : true;
            layer.offsetX = xLayer["offsetx"] != undefined ? xLayer["offsetx"] : 0;
            layer.offsetY = xLayer["offsety"] != undefined ? xLayer["offsety"] : 0;
            layer.width = xLayer["width"];
            layer.height = xLayer["height"];
            var xData = xLayer["data"];
            var encoding = xData["encoding"] != undefined ? xData["encoding"] : "csv";
            layer.tiles = new Array(width * height);
            if (encoding == "base64") {
                var br = es.TmxUtils.decode(xData.toString(), encoding, xData["compression"]);
                var index = 0;
                for (var j = 0; j < height; j++) {
                    for (var i = 0; i < width; i++) {
                        var gid = br[index];
                        layer.tiles[index++] = gid != 0 ? new es.TmxLayerTile(map, gid, i, j) : null;
                    }
                }
            }
            else if (encoding == "csv") {
                var k = 0;
                for (var _i = 0, xData_1 = xData; _i < xData_1.length; _i++) {
                    var s = xData_1[_i];
                    var gid = s;
                    var x = k % width;
                    var y = k / width;
                    layer.tiles[k++] = gid != 0 ? new es.TmxLayerTile(map, gid, x, y) : null;
                }
            }
            else if (!encoding) {
                var k = 0;
                for (var _a = 0, _b = xData["tile"]; _a < _b.length; _a++) {
                    var e = _b[_a];
                    var gid = e["gid"] != undefined ? e["gid"] : 0;
                    var x = k % width;
                    var y = k / width;
                    layer.tiles[k++] = gid != 0 ? new es.TmxLayerTile(map, gid, x, y) : null;
                }
            }
            else {
                throw new Error("TmxLayer:未知编码");
            }
            layer.properties = TiledMapLoader.parsePropertyDict(xLayer["properties"]);
            return layer;
        };
        TiledMapLoader.updateMaxTileSizes = function (tileset) {
            tileset.tiles.forEach(function (tile) {
                if (tile.image) {
                    if (tile.image.width > tileset.map.maxTileWidth)
                        tileset.map.maxTileWidth = tile.image.width;
                    if (tile.image.height > tileset.map.maxTileHeight)
                        tileset.map.maxTileHeight = tile.image.height;
                }
            });
            tileset.tileRegions.forEach(function (region) {
                var width = region.width;
                var height = region.height;
                if (width > tileset.map.maxTileWidth)
                    tileset.map.maxTileWidth = width;
                if (width > tileset.map.maxTileHeight)
                    tileset.map.maxTileHeight = height;
            });
        };
        TiledMapLoader.parseOrientationType = function (type) {
            if (type == "unknown")
                return es.OrientationType.unknown;
            if (type == "orthogonal")
                return es.OrientationType.orthogonal;
            if (type == "isometric")
                return es.OrientationType.isometric;
            if (type == "staggered")
                return es.OrientationType.staggered;
            if (type == "hexagonal")
                return es.OrientationType.hexagonal;
            return es.OrientationType.unknown;
        };
        TiledMapLoader.parseStaggerAxisType = function (type) {
            if (type == "y")
                return es.StaggerAxisType.y;
            return es.StaggerAxisType.x;
        };
        TiledMapLoader.parseStaggerIndexType = function (type) {
            if (type == "even")
                return es.StaggerIndexType.even;
            return es.StaggerIndexType.odd;
        };
        TiledMapLoader.parseRenderOrderType = function (type) {
            if (type == "right-up")
                return es.RenderOrderType.rightUp;
            if (type == "left-down")
                return es.RenderOrderType.leftDown;
            if (type == "left-up")
                return es.RenderOrderType.leftUp;
            return es.RenderOrderType.rightDown;
        };
        TiledMapLoader.parsePropertyDict = function (prop) {
            if (!prop)
                return null;
            var dict = new Map();
            for (var _i = 0, prop_1 = prop; _i < prop_1.length; _i++) {
                var p = prop_1[_i];
                var pname = p["name"];
                var valueAttr = p["value"];
                if (p["type"] == "color")
                    dict.set(pname, es.TmxUtils.color16ToUnit(valueAttr).toString());
                else
                    dict.set(pname, valueAttr);
            }
            return dict;
        };
        TiledMapLoader.parseTmxTileset = function (map, xTileset) {
            return __awaiter(this, void 0, void 0, function () {
                var xFirstGid, firstGid, source, xDocTileset;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            xFirstGid = xTileset["firstgid"];
                            firstGid = xFirstGid;
                            source = xTileset["source"];
                            if (!(source != undefined)) return [3, 2];
                            source = map.tmxDirectory + source;
                            return [4, RES.getResByUrl(source).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            xDocTileset = _a.sent();
                            return [2, this.loadTmxTileset(new es.TmxTileset(), map, xDocTileset["tileset"], firstGid)];
                        case 2: return [2, this.loadTmxTileset(new es.TmxTileset(), map, xTileset, firstGid)];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxTileset = function (tileset, map, xTileset, firstGid) {
            return __awaiter(this, void 0, void 0, function () {
                var xImage, _i, _a, e, _b, _c, _d, t, xTile, tile, id, y, column, x;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            tileset.map = map;
                            tileset.firstGid = firstGid;
                            tileset.name = xTileset["name"];
                            tileset.tileWidth = xTileset["tilewidth"];
                            tileset.tileHeight = xTileset["tileheight"];
                            tileset.spacing = xTileset["spacing"] != undefined ? xTileset["spacing"] : 0;
                            tileset.margin = xTileset["margin"] != undefined ? xTileset["margin"] : 0;
                            tileset.columns = xTileset["columns"];
                            tileset.tileCount = xTileset["tilecount"];
                            tileset.tileOffset = this.parseTmxTileOffset(xTileset["tileoffset"]);
                            xImage = xTileset["image"];
                            if (!xImage) return [3, 2];
                            return [4, this.loadTmxImage(new es.TmxImage(), xTileset, map.tmxDirectory).then(function (image) {
                                    tileset.image = image;
                                }).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            _e.sent();
                            _e.label = 2;
                        case 2:
                            tileset.terrains = [];
                            if (xTileset["terrains"])
                                for (_i = 0, _a = xTileset["terrains"]; _i < _a.length; _i++) {
                                    e = _a[_i];
                                    tileset.terrains.push(this.parseTmxTerrain(e));
                                }
                            tileset.tiles = new Map();
                            _b = [];
                            for (_c in xTileset["tiles"])
                                _b.push(_c);
                            _d = 0;
                            _e.label = 3;
                        case 3:
                            if (!(_d < _b.length)) return [3, 6];
                            t = _b[_d];
                            if (!xTileset["tiles"].hasOwnProperty(t)) return [3, 5];
                            xTile = xTileset["tiles"][t];
                            return [4, this.loadTmxTilesetTile(new es.TmxTilesetTile(), tileset, xTile, tileset.terrains, map.tmxDirectory)];
                        case 4:
                            tile = _e.sent();
                            tileset.tiles.set(tile.id == undefined ? Number(t) + 1 : tile.id, tile);
                            _e.label = 5;
                        case 5:
                            _d++;
                            return [3, 3];
                        case 6:
                            tileset.properties = this.parsePropertyDict(xTileset["properties"]);
                            tileset.tileRegions = new Map();
                            if (tileset.image) {
                                id = firstGid;
                                for (y = tileset.margin; y < tileset.image.height - tileset.margin; y += tileset.tileHeight + tileset.spacing) {
                                    column = 0;
                                    for (x = tileset.margin; x < tileset.image.width - tileset.margin; x += tileset.tileWidth + tileset.spacing) {
                                        tileset.tileRegions.set(id++, new es.Rectangle(x, y, tileset.tileWidth, tileset.tileHeight));
                                        if (++column >= tileset.columns)
                                            break;
                                    }
                                }
                            }
                            else {
                                tileset.tiles.forEach(function (tile, key) {
                                    tileset.tileRegions.set(key, new es.Rectangle(0, 0, tile.image.width, tile.image.height));
                                });
                            }
                            return [2, tileset];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxTilesetTile = function (tile, tileset, xTile, terrains, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var strTerrain, index, _i, strTerrain_1, v, edge, xImage, _a, _b, _c, e, _d, _e, e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            tile.tileset = tileset;
                            tile.id = xTile["id"];
                            strTerrain = xTile["terrain"];
                            if (strTerrain) {
                                tile.terrainEdges = new Array(4);
                                index = 0;
                                for (_i = 0, strTerrain_1 = strTerrain; _i < strTerrain_1.length; _i++) {
                                    v = strTerrain_1[_i];
                                    edge = terrains[v];
                                    tile.terrainEdges[index++] = edge;
                                }
                            }
                            tile.probability = xTile["probability"] != undefined ? xTile["probability"] : 1;
                            tile.type = xTile["type"];
                            xImage = xTile["image"];
                            if (!xImage) return [3, 2];
                            _a = tile;
                            return [4, this.loadTmxImage(new es.TmxImage(), xImage, tmxDirectory)];
                        case 1:
                            _a.image = _f.sent();
                            _f.label = 2;
                        case 2:
                            tile.objectGroups = [];
                            if (xTile["objectgroup"])
                                for (_b = 0, _c = xTile["objectgroup"]; _b < _c.length; _b++) {
                                    e = _c[_b];
                                    tile.objectGroups.push(this.loadTmxObjectGroup(new es.TmxObjectGroup(), tileset.map, e));
                                }
                            tile.animationFrames = [];
                            if (xTile["animation"]) {
                                for (_d = 0, _e = xTile["animation"]["frame"]; _d < _e.length; _d++) {
                                    e = _e[_d];
                                    tile.animationFrames.push(this.loadTmxAnimationFrame(new es.TmxAnimationFrame(), e));
                                }
                            }
                            tile.properties = this.parsePropertyDict(xTile["properties"]);
                            if (tile.properties)
                                tile.processProperties();
                            return [2, tile];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxAnimationFrame = function (frame, xFrame) {
            frame.gid = xFrame["tileid"];
            frame.duration = xFrame["duration"] / 1000;
            return frame;
        };
        TiledMapLoader.loadTmxObjectGroup = function (group, map, xObjectGroup) {
            group.map = map;
            group.name = xObjectGroup["name"] != undefined ? xObjectGroup["name"] : "";
            group.color = es.TmxUtils.color16ToUnit(xObjectGroup["color"]);
            group.opacity = xObjectGroup["opacity"] != undefined ? xObjectGroup["opacity"] : 1;
            group.visible = xObjectGroup["visible"] != undefined ? xObjectGroup["visible"] : true;
            group.offsetX = xObjectGroup["offsetx"] != undefined ? xObjectGroup["offsetx"] : 0;
            group.offsetY = xObjectGroup["offsety"] != undefined ? xObjectGroup["offsety"] : 0;
            var drawOrderDict = new Map();
            drawOrderDict.set("unknown", es.DrawOrderType.unkownOrder);
            drawOrderDict.set("topdown", es.DrawOrderType.IndexOrder);
            drawOrderDict.set("index", es.DrawOrderType.TopDown);
            var drawOrderValue = xObjectGroup["draworder"];
            if (drawOrderValue)
                group.drawOrder = drawOrderDict.get(drawOrderValue);
            group.objects = [];
            for (var _i = 0, _a = xObjectGroup["objects"]; _i < _a.length; _i++) {
                var e = _a[_i];
                group.objects.push(this.loadTmxObject(new es.TmxObject(), map, e));
            }
            group.properties = this.parsePropertyDict(xObjectGroup["properties"]);
            return group;
        };
        TiledMapLoader.loadTmxObject = function (obj, map, xObject) {
            obj.id = xObject["id"] != undefined ? xObject["id"] : 0;
            obj.name = xObject["name"] != undefined ? xObject["name"] : "";
            obj.x = xObject["x"];
            obj.y = xObject["y"];
            obj.width = xObject["width"] != undefined ? xObject["width"] : 0;
            obj.height = xObject["height"] != undefined ? xObject["height"] : 0;
            obj.type = xObject["type"] != undefined ? xObject["type"] : "";
            obj.visible = xObject["visible"] != undefined ? xObject["visible"] : true;
            obj.rotation = xObject["rotation"] != undefined ? xObject["rotation"] : 0;
            var xGid = xObject["gid"];
            var xEllipse = xObject["ellipse"];
            var xPolygon = xObject["polygon"];
            var xPolyline = xObject["polyline"];
            var xText = xObject["text"];
            var xPoint = xObject["point"];
            if (xGid) {
                obj.tile = new es.TmxLayerTile(map, xGid, Math.round(obj.x), Math.round(obj.y));
                obj.objectType = es.TmxObjectType.tile;
            }
            else if (xEllipse) {
                obj.objectType = es.TmxObjectType.ellipse;
            }
            else if (xPolygon) {
                obj.points = this.parsePoints(xPolygon);
                obj.objectType = es.TmxObjectType.polygon;
            }
            else if (xPolyline) {
                obj.points = this.parsePoints(xPolyline);
                obj.objectType = es.TmxObjectType.polyline;
            }
            else if (xText) {
                obj.text = this.loadTmxText(new es.TmxText(), xText);
                obj.objectType = es.TmxObjectType.text;
            }
            else if (xPoint) {
                obj.objectType = es.TmxObjectType.point;
            }
            else {
                obj.objectType = es.TmxObjectType.basic;
            }
            obj.properties = this.parsePropertyDict(xObject["properties"]);
            return obj;
        };
        TiledMapLoader.loadTmxText = function (text, xText) {
            text.fontFamily = xText["fontfamily"] != undefined ? xText["fontfamily"] : "sans-serif";
            text.pixelSize = xText["pixelsize"] != undefined ? xText["pixelsize"] : 16;
            text.wrap = xText["wrap"] != undefined ? xText["wrap"] : false;
            text.color = es.TmxUtils.color16ToUnit(xText["color"]);
            text.bold = xText["bold"] ? xText["bold"] : false;
            text.italic = xText["italic"] ? xText["italic"] : false;
            text.underline = xText["underline"] ? xText["underline"] : false;
            text.strikeout = xText["strikeout"] ? xText["strikeout"] : false;
            text.kerning = xText["kerning"] ? xText["kerning"] : true;
            text.alignment = this.loadTmxAlignment(new es.TmxAlignment(), xText);
            text.value = xText;
            return text;
        };
        TiledMapLoader.loadTmxAlignment = function (alignment, xText) {
            function firstLetterToUpperCase(str) {
                if (!str || str == "")
                    return str;
                return str[0].toString().toUpperCase() + str.substr(1);
            }
            var xHorizontal = xText["halign"] != undefined ? xText["halign"] : "left";
            alignment.horizontal = es.TmxHorizontalAlignment[firstLetterToUpperCase(xHorizontal)];
            var xVertical = xText["valign"] != undefined ? xText["valign"] : "top";
            alignment.vertical = es.TmxVerticalAlignment[firstLetterToUpperCase((xVertical))];
            return alignment;
        };
        TiledMapLoader.parsePoints = function (xPoints) {
            var points = [];
            var index = 0;
            for (var _i = 0, xPoints_1 = xPoints; _i < xPoints_1.length; _i++) {
                var s = xPoints_1[_i];
                points[index++] = this.parsePoint(s);
            }
            return points;
        };
        TiledMapLoader.parsePoint = function (pt) {
            return new es.Vector2(pt.x, pt.y);
        };
        TiledMapLoader.parseTmxTerrain = function (xTerrain) {
            var terrain = new es.TmxTerrain();
            terrain.name = xTerrain["name"];
            terrain.tile = xTerrain["tile"];
            terrain.properties = this.parsePropertyDict(xTerrain["properties"]);
            return terrain;
        };
        TiledMapLoader.parseTmxTileOffset = function (xTileOffset) {
            var tmxTileOffset = new es.TmxTileOffset();
            if (!xTileOffset) {
                tmxTileOffset.x = 0;
                tmxTileOffset.y = 0;
                return tmxTileOffset;
            }
            tmxTileOffset.x = xTileOffset["x"];
            tmxTileOffset.y = xTileOffset["y"];
            return tmxTileOffset;
        };
        TiledMapLoader.loadTmxImage = function (image, xImage, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var xSource, texture;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            xSource = xImage["image"];
                            if (xSource != undefined) {
                                image.source = tmxDirectory + xSource;
                            }
                            else {
                                image.source = tmxDirectory + xImage;
                            }
                            return [4, RES.getResByUrl(image.source, null, this, RES.ResourceItem.TYPE_IMAGE).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            texture = _a.sent();
                            image.bitmap = new egret.SpriteSheet(texture);
                            image.trans = es.TmxUtils.color16ToUnit(xImage["trans"]);
                            image.width = xImage["imagewidth"] != undefined ? xImage["imagewidth"] : texture.textureWidth;
                            image.height = xImage["imageheight"] != undefined ? xImage["imageheight"] : texture.textureHeight;
                            return [2, image];
                    }
                });
            });
        };
        return TiledMapLoader;
    }());
    es.TiledMapLoader = TiledMapLoader;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var TiledRendering = (function () {
        function TiledRendering() {
        }
        TiledRendering.renderMap = function (map, container, position, scale, layerDepth) {
            var _this = this;
            map.layers.forEach(function (layer) {
                if (layer instanceof es.TmxLayer && layer.visible) {
                    _this.renderLayer(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxImageLayer && layer.visible) {
                    _this.renderImageLayer(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxGroup && layer.visible) {
                    _this.renderGroup(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxObjectGroup && layer.visible) {
                    _this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }
            });
        };
        TiledRendering.renderLayer = function (layer, container, position, scale, layerDepth) {
            if (!layer.visible)
                return;
            var tileWidth = layer.map.tileWidth * scale.x;
            var tileHeight = layer.map.tileHeight * scale.y;
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            for (var i = 0; i < layer.tiles.length; i++) {
                var tile = layer.tiles[i];
                if (!tile)
                    continue;
                this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
            }
        };
        TiledRendering.renderLayerRenderCamera = function (layer, container, position, scale, layerDepth, camerClipBounds) {
            if (layer instanceof es.TmxLayer && layer.visible) {
                this.renderLayerCamera(layer, container, position, scale, layerDepth, camerClipBounds);
            }
            else if (layer instanceof es.TmxImageLayer && layer.visible) {
                this.renderImageLayer(layer, container, position, scale, layerDepth);
            }
            else if (layer instanceof es.TmxGroup && layer.visible) {
                this.renderGroup(layer, container, position, scale, layerDepth);
            }
            else if (layer instanceof es.TmxObjectGroup && layer.visible) {
                this.renderObjectGroup(layer, container, position, scale, layerDepth);
            }
        };
        TiledRendering.renderLayerCamera = function (layer, container, position, scale, layerDepth, camerClipBounds) {
            if (!layer.visible)
                return;
            position = position.add(layer.offset);
            camerClipBounds.location = camerClipBounds.location.subtract(position);
            var tileWidth = layer.map.tileWidth * scale.x;
            var tileHeight = layer.map.tileHeight * scale.y;
            var minX, minY, maxX, maxY = 0;
            if (layer.map.requiresLargeTileCulling) {
                minX = layer.map.worldToTilePositionX(camerClipBounds.left - (layer.map.maxTileWidth * scale.x - tileWidth));
                minY = layer.map.worldToTilePositionY(camerClipBounds.top - (layer.map.maxTileHeight * scale.y - tileHeight));
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right + (layer.map.maxTileWidth * scale.x - tileWidth));
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom + (layer.map.maxTileHeight * scale.y - tileHeight));
            }
            else {
                minX = layer.map.worldToTilePositionX(camerClipBounds.left);
                minY = layer.map.worldToTilePositionY(camerClipBounds.top);
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right);
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom);
            }
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            for (var y = minY; y <= maxY; y++) {
                for (var x = minX; x <= maxX; x++) {
                    var tile = layer.getTile(x, y);
                    if (tile)
                        this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
                }
            }
        };
        TiledRendering.renderImageLayer = function (layer, container, position, scale, layerDepth) {
            if (!layer.visible)
                return;
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            var pos = es.Vector2.add(position, new es.Vector2(layer.offsetX, layer.offsetY).multiply(scale));
            if (!layer.image.texture.parent)
                container.addChild(layer.image.texture);
            layer.image.texture.x = pos.x;
            layer.image.texture.y = pos.y;
            layer.image.texture.scaleX = scale.x;
            layer.image.texture.scaleY = scale.y;
            layer.image.texture.filters = [color];
        };
        TiledRendering.renderObjectGroup = function (objGroup, container, position, scale, layerDepth) {
            if (!objGroup.visible)
                return;
            function debugRender(obj, pos) {
                if (!container)
                    return;
                if (!es.Core.debugRenderEndabled)
                    return;
                if (!obj.textField.parent && obj.name) {
                    obj.textField.text = obj.name;
                    obj.textField.size = 12;
                    obj.textField.fontFamily = "sans-serif";
                    if (obj.shape) {
                        obj.textField.x = pos.x + (obj.shape.getBounds().width - obj.textField.width) / 2 + obj.shape.getBounds().x;
                        obj.textField.y = pos.y - obj.textField.height - 5 + obj.shape.getBounds().y;
                    }
                    else {
                        obj.textField.x = pos.x + (obj.width - obj.textField.width) / 2;
                        obj.textField.y = pos.y - obj.textField.height - 5;
                    }
                    obj.textField.background = true;
                    obj.textField.backgroundColor = 0xa0a0a4;
                    obj.textField.textColor = 0xffffff;
                    container.addChild(obj.textField);
                }
            }
            for (var object in objGroup.objects) {
                var obj = objGroup.objects[object];
                if (!obj.visible)
                    continue;
                if (!es.Core.debugRenderEndabled) {
                    if (obj.objectType != es.TmxObjectType.tile && obj.objectType != es.TmxObjectType.text)
                        continue;
                }
                var pos = es.Vector2.add(position, new es.Vector2(obj.x, obj.y).multiply(scale));
                switch (obj.objectType) {
                    case es.TmxObjectType.basic:
                        if (!obj.shape.parent) {
                            obj.shape.x = obj.x;
                            obj.shape.y = obj.y;
                            container.addChild(obj.shape);
                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawRect(0, 0, obj.width * scale.x, obj.height * scale.y);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case es.TmxObjectType.point:
                        var size = objGroup.map.tileWidth * 0.5;
                        pos.x -= size * 0.5;
                        pos.y -= size * 0.5;
                        if (!obj.shape.parent) {
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);
                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawCircle(0, 0, 1);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case es.TmxObjectType.tile:
                        this.renderTilesetTile(objGroup, obj, container, pos, scale, debugRender);
                        break;
                    case es.TmxObjectType.ellipse:
                        pos = new es.Vector2(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5).multiply(scale);
                        if (!obj.shape.parent) {
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);
                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawCircle(0, 0, obj.width * 0.5);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case es.TmxObjectType.polygon:
                    case es.TmxObjectType.polyline:
                        var points = [];
                        for (var i = 0; i < obj.points.length; i++)
                            points[i] = es.Vector2.multiply(obj.points[i], scale);
                        if (!obj.shape.parent && points.length > 0) {
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);
                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            for (var i = 0; i < points.length; i++) {
                                if (i == 0) {
                                    obj.shape.graphics.moveTo(points[i].x, points[i].y);
                                }
                                else {
                                    obj.shape.graphics.lineTo(points[i].x, points[i].y);
                                }
                            }
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case es.TmxObjectType.text:
                        if (!obj.textField.parent) {
                            obj.textField.x = pos.x;
                            obj.textField.y = pos.y;
                            container.addChild(obj.textField);
                            obj.textField.text = obj.text.value;
                            obj.textField.textColor = obj.text.color;
                            obj.textField.bold = obj.text.bold != undefined ? obj.text.bold : false;
                            obj.textField.italic = obj.text.italic != undefined ? obj.text.italic : false;
                            obj.textField.size = obj.text.pixelSize;
                            obj.textField.fontFamily = obj.text.fontFamily;
                        }
                        break;
                    default:
                        break;
                }
            }
        };
        TiledRendering.renderTilesetTile = function (objGroup, obj, container, pos, scale, debugRender) {
            var tileset = objGroup.map.getTilesetForTileGid(obj.tile.gid);
            var sourceRect = tileset.tileRegions.get(obj.tile.gid);
            if (container) {
                if (tileset.image) {
                    if (obj.tile.horizontalFlip && obj.tile.verticalFlip) {
                        pos.x += tileset.tileHeight + (sourceRect.height * scale.y - tileset.tileHeight);
                        pos.y -= (sourceRect.width * scale.x - tileset.tileWidth);
                    }
                    else if (obj.tile.horizontalFlip) {
                        pos.x += tileset.tileWidth + (sourceRect.height * scale.y - tileset.tileHeight);
                    }
                    else if (obj.tile.verticalFlip) {
                        pos.y += (tileset.tileWidth - sourceRect.width * scale.x);
                    }
                    else {
                        pos.y += (tileset.tileHeight - sourceRect.height * scale.y);
                    }
                    var texture = tileset.image.bitmap.getTexture("" + obj.tile.gid);
                    if (!texture) {
                        texture = tileset.image.bitmap.createTexture("" + obj.tile.gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }
                    tileset.image.texture = new Bitmap(texture);
                    container.addChild(tileset.image.texture);
                    tileset.image.texture.x = pos.x;
                    tileset.image.texture.y = pos.y;
                    if (obj.tile.verticalFlip && obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.verticalFlip) {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = scale.y;
                    }
                    else {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = scale.y;
                    }
                    tileset.image.texture.anchorOffsetX = 0;
                    tileset.image.texture.anchorOffsetY = 0;
                    debugRender(obj, pos);
                }
                else {
                    var tilesetTile = tileset.tiles.get(obj.tile.gid);
                    var texture = tilesetTile.image.bitmap.getTexture("" + obj.tile.gid);
                    if (!texture) {
                        texture = tilesetTile.image.bitmap.createTexture("" + obj.tile.gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }
                    pos.y -= obj.height;
                    tilesetTile.image.texture = new Bitmap(texture);
                    container.addChild(tilesetTile.image.texture);
                    tilesetTile.image.texture.width = obj.width;
                    tilesetTile.image.texture.height = obj.height;
                    tilesetTile.image.texture.x = pos.x;
                    tilesetTile.image.texture.y = pos.y;
                    if (obj.tile.verticalFlip && obj.tile.horizontalFlip) {
                        tilesetTile.image.texture.scaleX = -1;
                        tilesetTile.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.verticalFlip) {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.horizontalFlip) {
                        tilesetTile.image.texture.scaleX = -1;
                        tilesetTile.image.texture.scaleY = scale.y;
                    }
                    else {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = scale.y;
                    }
                    tilesetTile.image.texture.anchorOffsetX = 0;
                    tilesetTile.image.texture.anchorOffsetY = 0;
                }
            }
        };
        TiledRendering.renderGroup = function (group, container, position, scale, layerDepth) {
            var _this = this;
            if (!group.visible)
                return;
            group.layers.forEach(function (layer) {
                if (layer instanceof es.TmxGroup) {
                    _this.renderGroup(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxObjectGroup) {
                    _this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxLayer) {
                    _this.renderLayer(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxImageLayer) {
                    _this.renderImageLayer(layer, container, position, scale, layerDepth);
                }
            });
        };
        TiledRendering.renderTile = function (tile, container, position, scale, tileWidth, tileHeight, color, layerDepth) {
            var gid = tile.gid;
            var tilesetTile = tile.tilesetTile;
            if (tilesetTile && tilesetTile.animationFrames.length > 0)
                gid = tilesetTile.currentAnimationFrameGid;
            var sourceRect = tile.tileset.tileRegions.get(gid);
            var tx = Math.floor(tile.x) * tileWidth;
            var ty = Math.floor(tile.y) * tileHeight;
            var rotation = 0;
            if (tile.horizontalFlip && tile.verticalFlip) {
                tx += tileHeight + (sourceRect.height * scale.y - tileHeight);
                ty -= (sourceRect.width * scale.x - tileWidth);
            }
            else if (tile.horizontalFlip) {
                tx += tileWidth + (sourceRect.height * scale.y - tileHeight);
            }
            else if (tile.verticalFlip) {
                ty += (tileWidth - sourceRect.width * scale.x);
            }
            else {
                ty += (tileHeight - sourceRect.height * scale.y);
            }
            var pos = new es.Vector2(tx, ty).add(position);
            if (tile.tileset.image) {
                if (container) {
                    var texture = tile.tileset.image.bitmap.getTexture("" + gid);
                    if (!texture) {
                        texture = tile.tileset.image.bitmap.createTexture("" + gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }
                    tile.tileset.image.texture = new Bitmap(texture);
                    container.addChild(tile.tileset.image.texture);
                    if (tile.tileset.image.texture.x != pos.x)
                        tile.tileset.image.texture.x = pos.x;
                    if (tile.tileset.image.texture.y != pos.y)
                        tile.tileset.image.texture.y = pos.y;
                    if (tile.verticalFlip && tile.horizontalFlip) {
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = -1;
                    }
                    else if (tile.verticalFlip) {
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = -1;
                    }
                    else if (tile.horizontalFlip) {
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }
                    else {
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }
                    if (tile.tileset.image.texture.rotation != rotation)
                        tile.tileset.image.texture.rotation = rotation;
                    if (tile.tileset.image.texture.anchorOffsetX != 0)
                        tile.tileset.image.texture.anchorOffsetX = 0;
                    if (tile.tileset.image.texture.anchorOffsetY != 0)
                        tile.tileset.image.texture.anchorOffsetY = 0;
                }
            }
            else {
                if (tilesetTile.image.texture) {
                    if (!tilesetTile.image.bitmap.getTexture(gid.toString())) {
                        tilesetTile.image.texture = new Bitmap(tilesetTile.image.bitmap.createTexture(gid.toString(), sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height));
                        container.addChild(tilesetTile.image.texture);
                    }
                    tilesetTile.image.texture.x = pos.x;
                    tilesetTile.image.texture.y = pos.y;
                    tilesetTile.image.texture.scaleX = scale.x;
                    tilesetTile.image.texture.scaleY = scale.y;
                    tilesetTile.image.texture.rotation = rotation;
                    tilesetTile.image.texture.anchorOffsetX = 0;
                    tilesetTile.image.texture.anchorOffsetY = 0;
                    tilesetTile.image.texture.filters = [color];
                }
            }
        };
        return TiledRendering;
    }());
    es.TiledRendering = TiledRendering;
})(es || (es = {}));
var es;
(function (es) {
    var TmxTileset = (function (_super) {
        __extends(TmxTileset, _super);
        function TmxTileset() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TmxTileset.prototype.update = function () {
            this.tiles.forEach(function (value) {
                value.updateAnimatedTiles();
            });
        };
        return TmxTileset;
    }(es.TmxDocument));
    es.TmxTileset = TmxTileset;
    var TmxTileOffset = (function () {
        function TmxTileOffset() {
        }
        return TmxTileOffset;
    }());
    es.TmxTileOffset = TmxTileOffset;
    var TmxTerrain = (function () {
        function TmxTerrain() {
        }
        return TmxTerrain;
    }());
    es.TmxTerrain = TmxTerrain;
})(es || (es = {}));
var es;
(function (es) {
    var TmxTilesetTile = (function () {
        function TmxTilesetTile() {
        }
        Object.defineProperty(TmxTilesetTile.prototype, "currentAnimationFrameGid", {
            get: function () {
                return this.animationFrames[this._animationCurrentFrame].gid + this.tileset.firstGid;
            },
            enumerable: true,
            configurable: true
        });
        TmxTilesetTile.prototype.processProperties = function () {
            var value;
            value = this.properties.get("engine.isDestructable");
            if (value)
                this.isDestructable = Boolean(value);
            value = this.properties.get("engine:isSlope");
            if (value)
                this.isSlope = Boolean(value);
            value = this.properties.get("engine:isOneWayPlatform");
            if (value)
                this.isOneWayPlatform = Boolean(value);
            value = this.properties.get("engine:slopeTopLeft");
            if (value)
                this.slopeTopLeft = Number(value);
            value = this.properties.get("engine:slopeTopRight");
            if (value)
                this.slopeTopRight = Number(value);
        };
        TmxTilesetTile.prototype.updateAnimatedTiles = function () {
            if (this.animationFrames.length == 0)
                return;
            this._animationElapsedTime += es.Time.deltaTime;
            if (this._animationElapsedTime > this.animationFrames[this._animationCurrentFrame].duration) {
                this._animationCurrentFrame = es.MathHelper.incrementWithWrap(this._animationCurrentFrame, this.animationFrames.length);
                this._animationElapsedTime = 0;
            }
        };
        return TmxTilesetTile;
    }());
    es.TmxTilesetTile = TmxTilesetTile;
    var TmxAnimationFrame = (function () {
        function TmxAnimationFrame() {
        }
        return TmxAnimationFrame;
    }());
    es.TmxAnimationFrame = TmxAnimationFrame;
})(es || (es = {}));
var es;
(function (es) {
    var TmxUtils = (function () {
        function TmxUtils() {
        }
        TmxUtils.decode = function (data, encoding, compression) {
            compression = compression || "none";
            encoding = encoding || "none";
            switch (encoding) {
                case "base64":
                    var decoded = es.Base64Utils.decodeBase64AsArray(data, 4);
                    return (compression === "none") ? decoded : es.Base64Utils.decompress(data, decoded, compression);
                case "csv":
                    return es.Base64Utils.decodeCSV(data);
                case "none":
                    var datas = [];
                    for (var i = 0; i < data.length; i++) {
                        datas[i] = +data[i].gid;
                    }
                    return datas;
                default:
                    throw new Error("未定义的编码:" + encoding);
            }
        };
        TmxUtils.color16ToUnit = function ($color) {
            if (!$color)
                return 0xFFFFFF;
            var colorStr = "0x" + $color.slice(1);
            return parseInt(colorStr, 16);
        };
        return TmxUtils;
    }());
    es.TmxUtils = TmxUtils;
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
                if (RES.destroyRes(assetsToRemove))
                    assetsToRemove.dispose();
            });
            this.loadedAssets.clear();
        };
        return ContentManager;
    }());
    es.ContentManager = ContentManager;
})(es || (es = {}));
var es;
(function (es) {
    var DrawUtils = (function () {
        function DrawUtils() {
        }
        DrawUtils.getColorMatrix = function (color) {
            var colorMatrix = [
                1, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0
            ];
            colorMatrix[0] = Math.floor(color / 256 / 256) / 255;
            colorMatrix[6] = Math.floor(color / 256 % 256) / 255;
            colorMatrix[12] = color % 256 / 255;
            return new egret.ColorMatrixFilter(colorMatrix);
        };
        return DrawUtils;
    }());
    es.DrawUtils = DrawUtils;
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
            if (egret.is(obj, "IPoolable")) {
                obj["reset"]();
            }
        };
        Pool._objectQueue = [];
        return Pool;
    }());
    es.Pool = Pool;
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
var es;
(function (es) {
    var Layout = (function () {
        function Layout() {
            this.clientArea = new es.Rectangle(0, 0, es.Core.graphicsDevice.viewport.width, es.Core.graphicsDevice.viewport.height);
            this.safeArea = this.clientArea;
        }
        Layout.prototype.place = function (size, horizontalMargin, verticalMargine, alignment) {
            var rc = new es.Rectangle(0, 0, size.x, size.y);
            if ((alignment & Alignment.left) != 0) {
                rc.x = this.clientArea.x + (this.clientArea.width * horizontalMargin);
            }
            else if ((alignment & Alignment.right) != 0) {
                rc.x = this.clientArea.x + (this.clientArea.width * (1 - horizontalMargin)) - rc.width;
            }
            else if ((alignment & Alignment.horizontalCenter) != 0) {
                rc.x = this.clientArea.x + (this.clientArea.width - rc.width) / 2 + (horizontalMargin * this.clientArea.width);
            }
            else {
            }
            if ((alignment & Alignment.top) != 0) {
                rc.y = this.clientArea.y + (this.clientArea.height * verticalMargine);
            }
            else if ((alignment & Alignment.bottom) != 0) {
                rc.y = this.clientArea.y + (this.clientArea.height * (1 - verticalMargine)) - rc.height;
            }
            else if ((alignment & Alignment.verticalCenter) != 0) {
                rc.y = this.clientArea.y + (this.clientArea.height - rc.height) / 2 + (verticalMargine * this.clientArea.height);
            }
            else {
            }
            if (rc.left < this.safeArea.left)
                rc.x = this.safeArea.left;
            if (rc.right > this.safeArea.right)
                rc.x = this.safeArea.right - rc.width;
            if (rc.top < this.safeArea.top)
                rc.y = this.safeArea.top;
            if (rc.bottom > this.safeArea.bottom)
                rc.y = this.safeArea.bottom - rc.height;
            return rc;
        };
        return Layout;
    }());
    es.Layout = Layout;
    var Alignment;
    (function (Alignment) {
        Alignment[Alignment["none"] = 0] = "none";
        Alignment[Alignment["left"] = 1] = "left";
        Alignment[Alignment["right"] = 2] = "right";
        Alignment[Alignment["horizontalCenter"] = 4] = "horizontalCenter";
        Alignment[Alignment["top"] = 8] = "top";
        Alignment[Alignment["bottom"] = 16] = "bottom";
        Alignment[Alignment["verticalCenter"] = 32] = "verticalCenter";
        Alignment[Alignment["topLeft"] = 9] = "topLeft";
        Alignment[Alignment["topRight"] = 10] = "topRight";
        Alignment[Alignment["topCenter"] = 12] = "topCenter";
        Alignment[Alignment["bottomLeft"] = 17] = "bottomLeft";
        Alignment[Alignment["bottomRight"] = 18] = "bottomRight";
        Alignment[Alignment["bottomCenter"] = 20] = "bottomCenter";
        Alignment[Alignment["centerLeft"] = 33] = "centerLeft";
        Alignment[Alignment["centerRight"] = 34] = "centerRight";
        Alignment[Alignment["center"] = 36] = "center";
    })(Alignment = es.Alignment || (es.Alignment = {}));
})(es || (es = {}));
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
    var TimeRuler = (function () {
        function TimeRuler() {
            this.showLog = false;
            this.markers = [];
            this.stopwacth = new stopwatch.Stopwatch();
            this._markerNameToIdMap = new Map();
            this._rectShape1 = new egret.Shape();
            this._rectShape2 = new egret.Shape();
            this._rectShape3 = new egret.Shape();
            this._rectShape4 = new egret.Shape();
            this._rectShape5 = new egret.Shape();
            this._rectShape6 = new egret.Shape();
            this.logs = new Array(2);
            for (var i = 0; i < this.logs.length; ++i)
                this.logs[i] = new FrameLog();
            this.sampleFrames = this.targetSampleFrames = 1;
            this.width = Math.floor(es.Core.graphicsDevice.viewport.width * 0.8);
            es.Core.emitter.addObserver(es.CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
            this.onGraphicsDeviceReset();
            es.Core.Instance.stage.addChild(this._rectShape1);
            es.Core.Instance.stage.addChild(this._rectShape2);
            es.Core.Instance.stage.addChild(this._rectShape3);
            es.Core.Instance.stage.addChild(this._rectShape4);
            es.Core.Instance.stage.addChild(this._rectShape5);
            es.Core.Instance.stage.addChild(this._rectShape6);
        }
        Object.defineProperty(TimeRuler, "Instance", {
            get: function () {
                if (!this._instance)
                    this._instance = new TimeRuler();
                return this._instance;
            },
            enumerable: true,
            configurable: true
        });
        TimeRuler.prototype.startFrame = function () {
            if (isNaN(this._updateCount))
                this._updateCount = 0;
            var count = this._updateCount++;
            if (this.enabled && (1 < count && count < TimeRuler.maxSampleFrames))
                return;
            this.prevLog = this.logs[this.frameCount++ & 0x1];
            this.curLog = this.logs[this.frameCount & 0x1];
            var endFrameTime = this.stopwacth.getTime();
            for (var barIdx = 0; barIdx < this.prevLog.bars.length; ++barIdx) {
                var prevBar = this.prevLog.bars[barIdx];
                var nextBar = this.curLog.bars[barIdx];
                for (var nest = 0; nest < prevBar.nestCount; ++nest) {
                    var markerIdx = prevBar.markerNests[nest];
                    prevBar.markers[markerIdx].endTime = endFrameTime;
                    nextBar.markerNests[nest] = nest;
                    nextBar.markers[nest].markerId = prevBar.markers[markerIdx].markerId;
                    nextBar.markers[nest].beginTime = 0;
                    nextBar.markers[nest].endTime = -1;
                    nextBar.markers[nest].color = prevBar.markers[markerIdx].color;
                }
                for (var markerIdx = 0; markerIdx < prevBar.markCount; ++markerIdx) {
                    var duration = prevBar.markers[markerIdx].endTime - prevBar.markers[markerIdx].beginTime;
                    var markerId = prevBar.markers[markerIdx].markerId;
                    var m = this.markers[markerId];
                    m.logs[barIdx].color = prevBar.markers[markerIdx].color;
                    if (!m.logs[barIdx].initialized) {
                        m.logs[barIdx].min = duration;
                        m.logs[barIdx].max = duration;
                        m.logs[barIdx].avg = duration;
                        m.logs[barIdx].initialized = true;
                    }
                    else {
                        m.logs[barIdx].min = Math.min(m.logs[barIdx].min, duration);
                        m.logs[barIdx].max = Math.min(m.logs[barIdx].max, duration);
                        m.logs[barIdx].avg += duration;
                        m.logs[barIdx].avg *= 0.5;
                        if (m.logs[barIdx].samples++ >= TimeRuler.logSnapDuration) {
                            m.logs[barIdx].snapMin = m.logs[barIdx].min;
                            m.logs[barIdx].snapMax = m.logs[barIdx].max;
                            m.logs[barIdx].snapAvg = m.logs[barIdx].avg;
                            m.logs[barIdx].samples = 0;
                        }
                    }
                }
                nextBar.markCount = prevBar.nestCount;
                nextBar.nestCount = prevBar.nestCount;
            }
            this.stopwacth.reset();
            this.stopwacth.start();
        };
        TimeRuler.prototype.beginMark = function (markerName, color, barIndex) {
            if (barIndex === void 0) { barIndex = 0; }
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error("barIndex argument out of range");
            var bar = this.curLog.bars[barIndex];
            if (bar.markCount >= TimeRuler.maxSamples) {
                throw new Error("超出采样次数，可以设置更大的数字为timeruler.maxsaple，或者降低采样次数");
            }
            if (bar.nestCount >= TimeRuler.maxNestCall) {
                throw new Error("超出采样次数，可以设置更大的数字为timeruler.maxsaple，或者降低采样次数");
            }
            var markerId = this._markerNameToIdMap.get(markerName);
            if (isNaN(markerId)) {
                markerId = this.markers.length;
                this._markerNameToIdMap.set(markerName, markerId);
                this.markers.push(new MarkerInfo(markerName));
            }
            bar.markerNests[bar.nestCount++] = bar.markCount;
            bar.markers[bar.markCount].markerId = markerId;
            bar.markers[bar.markCount].color = color;
            bar.markers[bar.markCount].beginTime = this.stopwacth.getTime();
            bar.markers[bar.markCount].endTime = -1;
            bar.markCount++;
        };
        TimeRuler.prototype.endMark = function (markerName, barIndex) {
            if (barIndex === void 0) { barIndex = 0; }
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                throw new Error("barIndex参数超出范围");
            var bar = this.curLog.bars[barIndex];
            if (bar.nestCount <= 0) {
                throw new Error("先调用beginMark方法，再调用endMark方法");
            }
            var markerId = this._markerNameToIdMap.get(markerName);
            if (isNaN(markerId)) {
                throw new Error("\u6807\u8BB0 " + markerName + " \u672A\u6CE8\u518C\u3002\u8BF7\u786E\u8BA4\u60A8\u6307\u5B9A\u7684\u540D\u79F0\u4E0E beginMark \u65B9\u6CD5\u4F7F\u7528\u7684\u540D\u79F0\u76F8\u540C");
            }
            var markerIdx = bar.markerNests[--bar.nestCount];
            if (bar.markers[markerIdx].markerId != markerId) {
                throw new Error("beginMark/endMark方法的调用顺序不正确，beginMark(A)，beginMark(B)，endMark(B)，endMark(A)，但你不能像beginMark(A)，beginMark(B)，endMark(A)，endMark(B)这样调用。");
            }
            bar.markers[markerIdx].endTime = this.stopwacth.getTime();
        };
        TimeRuler.prototype.getAverageTime = function (barIndex, markerName) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars) {
                throw new Error("barIndex参数超出范围");
            }
            var result = 0;
            var markerId = this._markerNameToIdMap.get(markerName);
            if (markerId) {
                result = this.markers[markerId].logs[barIndex].avg;
            }
            return result;
        };
        TimeRuler.prototype.resetLog = function () {
            this.markers.forEach(function (markerInfo) {
                for (var i = 0; i < markerInfo.logs.length; ++i) {
                    markerInfo.logs[i].initialized = false;
                    markerInfo.logs[i].snapMin = 0;
                    markerInfo.logs[i].snapMax = 0;
                    markerInfo.logs[i].snapAvg = 0;
                    markerInfo.logs[i].min = 0;
                    markerInfo.logs[i].max = 0;
                    markerInfo.logs[i].avg = 0;
                    markerInfo.logs[i].samples = 0;
                }
            });
        };
        TimeRuler.prototype.render = function (position, width) {
            if (position === void 0) { position = this._position; }
            if (width === void 0) { width = this.width; }
            if (!this.showLog)
                return;
            var height = 0;
            var maxTime = 0;
            this.prevLog.bars.forEach(function (bar) {
                if (bar.markCount > 0) {
                    height += TimeRuler.barHeight + TimeRuler.barPadding * 2;
                    maxTime = Math.max(maxTime, bar.markers[bar.markCount - 1].endTime);
                }
            });
            var frameSpan = 1 / 60 * 1000;
            var sampleSpan = this.sampleFrames * frameSpan;
            if (maxTime > sampleSpan) {
                this._frameAdjust = Math.max(0, this._frameAdjust) + 1;
            }
            else {
                this._frameAdjust = Math.min(0, this._frameAdjust) - 1;
            }
            if (Math.max(this._frameAdjust) > TimeRuler.autoAdjustDelay) {
                this.sampleFrames = Math.min(TimeRuler.maxSampleFrames, this.sampleFrames);
                this.sampleFrames = Math.max(this.targetSampleFrames, Math.floor(maxTime / frameSpan) + 1);
                this._frameAdjust = 0;
            }
            var msToPs = width / sampleSpan;
            var startY = position.y - (height - TimeRuler.barHeight);
            var y = startY;
            var rc = new es.Rectangle(position.x, y, width, height);
            this._rectShape1.graphics.clear();
            this._rectShape1.graphics.beginFill(0x000000, 128 / 255);
            this._rectShape1.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
            this._rectShape1.graphics.endFill();
            rc.height = TimeRuler.barHeight;
            this._rectShape2.graphics.clear();
            for (var _i = 0, _a = this.prevLog.bars; _i < _a.length; _i++) {
                var bar = _a[_i];
                rc.y = y + TimeRuler.barPadding;
                if (bar.markCount > 0) {
                    for (var j = 0; j < bar.markCount; ++j) {
                        var bt = bar.markers[j].beginTime;
                        var et = bar.markers[j].endTime;
                        var sx = Math.floor(position.x + bt * msToPs);
                        var ex = Math.floor(position.x + et * msToPs);
                        rc.x = sx;
                        rc.width = Math.max(ex - sx, 1);
                        this._rectShape2.graphics.beginFill(bar.markers[j].color);
                        this._rectShape2.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                        this._rectShape2.graphics.endFill();
                    }
                }
                y += TimeRuler.barHeight + TimeRuler.barPadding;
            }
            rc = new es.Rectangle(position.x, startY, 1, height);
            this._rectShape3.graphics.clear();
            for (var t = 1; t < sampleSpan; t += 1) {
                rc.x = Math.floor(position.x + t * msToPs);
                this._rectShape3.graphics.beginFill(0x808080);
                this._rectShape3.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                this._rectShape3.graphics.endFill();
            }
            this._rectShape4.graphics.clear();
            for (var i = 0; i <= this.sampleFrames; ++i) {
                rc.x = Math.floor(position.x + frameSpan * i * msToPs);
                this._rectShape4.graphics.beginFill(0xFFFFFF);
                this._rectShape4.graphics.drawRect(rc.x, rc.y, rc.width, rc.height);
                this._rectShape4.graphics.endFill();
            }
        };
        TimeRuler.prototype.onGraphicsDeviceReset = function () {
            var layout = new es.Layout();
            this._position = layout.place(new es.Vector2(this.width, TimeRuler.barHeight), 0, 0.01, es.Alignment.bottomCenter).location;
        };
        TimeRuler.maxBars = 8;
        TimeRuler.maxSamples = 256;
        TimeRuler.maxNestCall = 32;
        TimeRuler.barHeight = 8;
        TimeRuler.maxSampleFrames = 4;
        TimeRuler.logSnapDuration = 120;
        TimeRuler.barPadding = 2;
        TimeRuler.autoAdjustDelay = 30;
        return TimeRuler;
    }());
    es.TimeRuler = TimeRuler;
    var FrameLog = (function () {
        function FrameLog() {
            this.bars = new Array(TimeRuler.maxBars);
            this.bars.fill(new MarkerCollection(), 0, TimeRuler.maxBars);
        }
        return FrameLog;
    }());
    es.FrameLog = FrameLog;
    var MarkerCollection = (function () {
        function MarkerCollection() {
            this.markers = new Array(TimeRuler.maxSamples);
            this.markCount = 0;
            this.markerNests = new Array(TimeRuler.maxNestCall);
            this.nestCount = 0;
            this.markers.fill(new Marker(), 0, TimeRuler.maxSamples);
            this.markerNests.fill(0, 0, TimeRuler.maxNestCall);
        }
        return MarkerCollection;
    }());
    es.MarkerCollection = MarkerCollection;
    var Marker = (function () {
        function Marker() {
            this.markerId = 0;
            this.beginTime = 0;
            this.endTime = 0;
            this.color = 0x000000;
        }
        return Marker;
    }());
    es.Marker = Marker;
    var MarkerInfo = (function () {
        function MarkerInfo(name) {
            this.logs = new Array(TimeRuler.maxBars);
            this.name = name;
            this.logs.fill(new MarkerLog(), 0, TimeRuler.maxBars);
        }
        return MarkerInfo;
    }());
    es.MarkerInfo = MarkerInfo;
    var MarkerLog = (function () {
        function MarkerLog() {
            this.snapMin = 0;
            this.snapMax = 0;
            this.snapAvg = 0;
            this.min = 0;
            this.max = 0;
            this.avg = 0;
            this.samples = 0;
            this.color = 0x000000;
            this.initialized = false;
        }
        return MarkerLog;
    }());
    es.MarkerLog = MarkerLog;
})(es || (es = {}));
var es;
(function (es) {
    var Coroutine = (function () {
        function Coroutine() {
        }
        Coroutine.waitForSeconds = function (seconds) {
            return WaitForSeconds.waiter.wait(seconds);
        };
        return Coroutine;
    }());
    es.Coroutine = Coroutine;
    var WaitForSeconds = (function () {
        function WaitForSeconds() {
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
    var CoroutineImpl = (function () {
        function CoroutineImpl() {
            this.useUnscaledDeltaTime = false;
        }
        CoroutineImpl.prototype.stop = function () {
            this.isDone = true;
        };
        CoroutineImpl.prototype.setUseUnscaledDeltaTime = function (useUnscaledDeltaTime) {
            this.useUnscaledDeltaTime = useUnscaledDeltaTime;
            return this;
        };
        CoroutineImpl.prototype.prepareForuse = function () {
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
    var CoroutineManager = (function (_super) {
        __extends(CoroutineManager, _super);
        function CoroutineManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._unblockedCoroutines = [];
            _this._shouldRunNextFrame = [];
            return _this;
        }
        CoroutineManager.prototype.startCoroutine = function (enumerator) {
            var coroutine = es.Pool.obtain(CoroutineImpl);
            coroutine.prepareForuse();
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
                    es.Pool.free(coroutine);
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
                    coroutine.waitTimer -= coroutine.useUnscaledDeltaTime ? es.Time.unscaledDeltaTime : es.Time.deltaTime;
                    this._shouldRunNextFrame.push(coroutine);
                    continue;
                }
                if (this.tickCoroutine(coroutine))
                    this._shouldRunNextFrame.push(coroutine);
            }
            this._unblockedCoroutines.length = 0;
            this._unblockedCoroutines.concat(this._shouldRunNextFrame);
            this._shouldRunNextFrame.length = 0;
            this._isInUpdate = false;
        };
        CoroutineManager.prototype.tickCoroutine = function (coroutine) {
            var current = coroutine.enumerator.next();
            if (!current.value || current.done) {
                es.Pool.free(coroutine);
                return false;
            }
            if (!current.value) {
                return true;
            }
            if (current.value instanceof es.WaitForSeconds) {
                coroutine.waitTimer = current.value.waitTime;
                return true;
            }
            if (current.value instanceof Number) {
                console.warn("协同程序检查返回一个Number类型，请不要在生产环境使用");
                coroutine.waitTimer = Number(current);
                return true;
            }
            if (current.value instanceof CoroutineImpl) {
                coroutine.waitForCoroutine = current.value;
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
    var TouchState = (function () {
        function TouchState() {
            this.x = 0;
            this.y = 0;
            this.touchPoint = -1;
            this.touchDown = false;
        }
        Object.defineProperty(TouchState.prototype, "position", {
            get: function () {
                return new es.Vector2(this.x, this.y);
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
    es.TouchState = TouchState;
    var Input = (function () {
        function Input() {
        }
        Object.defineProperty(Input, "gameTouchs", {
            get: function () {
                return this._gameTouchs;
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
        Object.defineProperty(Input, "touchPosition", {
            get: function () {
                if (!this._gameTouchs[0])
                    return es.Vector2.zero;
                return this._gameTouchs[0].position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Input, "maxSupportedTouch", {
            get: function () {
                return es.Core._instance.stage.maxTouches;
            },
            set: function (value) {
                es.Core._instance.stage.maxTouches = value;
                this.initTouchCache();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Input, "touchPositionDelta", {
            get: function () {
                var delta = es.Vector2.subtract(this.touchPosition, this._previousTouchState.position);
                if (delta.length() > 0) {
                    this.setpreviousTouchState(this._gameTouchs[0]);
                }
                return delta;
            },
            enumerable: true,
            configurable: true
        });
        Input.initialize = function () {
            if (this._init)
                return;
            this._init = true;
            es.Core._instance.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
            es.Core._instance.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
            es.Core._instance.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
            es.Core._instance.stage.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.touchEnd, this);
            es.Core._instance.stage.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.touchEnd, this);
            this.initTouchCache();
        };
        Input.update = function () {
            KeyboardUtils.update();
            for (var i = 0; i < this._virtualInputs.length; i++)
                this._virtualInputs[i].update();
        };
        Input.scaledPosition = function (position) {
            var scaledPos = new es.Vector2(position.x - this._resolutionOffset.x, position.y - this._resolutionOffset.y);
            return es.Vector2.multiply(scaledPos, this.resolutionScale);
        };
        Input.isKeyPressed = function (key) {
            return KeyboardUtils.currentKeys.contains(key) && !KeyboardUtils.previousKeys.contains(key);
        };
        Input.isKeyPressedBoth = function (keyA, keyB) {
            return this.isKeyPressed(keyA) || this.isKeyPressed(keyB);
        };
        Input.isKeyDown = function (key) {
            return KeyboardUtils.currentKeys.contains(key);
        };
        Input.isKeyDownBoth = function (keyA, keyB) {
            return this.isKeyDown(keyA) || this.isKeyDown(keyB);
        };
        Input.isKeyReleased = function (key) {
            return !KeyboardUtils.currentKeys.contains(key) && KeyboardUtils.previousKeys.contains(key);
        };
        Input.isKeyReleasedBoth = function (keyA, keyB) {
            return this.isKeyReleased(keyA) || this.isKeyReleased(keyB);
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
        Input._init = false;
        Input._previousTouchState = new TouchState();
        Input._resolutionOffset = new es.Vector2();
        Input._touchIndex = 0;
        Input._gameTouchs = [];
        Input._resolutionScale = es.Vector2.one;
        Input._totalTouchCount = 0;
        Input._virtualInputs = [];
        return Input;
    }());
    es.Input = Input;
})(es || (es = {}));
var Keys = es.Keys;
var KeyboardUtils = (function () {
    function KeyboardUtils() {
    }
    KeyboardUtils.init = function () {
        document.addEventListener("keydown", KeyboardUtils.onKeyDownHandler);
        document.addEventListener("keyup", KeyboardUtils.onKeyUpHandler);
    };
    KeyboardUtils.update = function () {
        KeyboardUtils.previousKeys.length = 0;
        for (var _i = 0, _a = KeyboardUtils.currentKeys; _i < _a.length; _i++) {
            var key = _a[_i];
            KeyboardUtils.previousKeys.push(key);
            KeyboardUtils.currentKeys.remove(key);
        }
        KeyboardUtils.currentKeys.length = 0;
        for (var _b = 0, _c = KeyboardUtils.keyStatusKeys; _b < _c.length; _b++) {
            var key = _c[_b];
            KeyboardUtils.currentKeys.push(key);
        }
    };
    KeyboardUtils.destroy = function () {
        KeyboardUtils.currentKeys.length = 0;
        document.removeEventListener("keyup", KeyboardUtils.onKeyUpHandler);
        document.removeEventListener("keypress", KeyboardUtils.onKeyDownHandler);
    };
    KeyboardUtils.onKeyDownHandler = function (event) {
        if (!KeyboardUtils.keyStatusKeys.contains(event.keyCode))
            KeyboardUtils.keyStatusKeys.push(event.keyCode);
    };
    KeyboardUtils.onKeyUpHandler = function (event) {
        if (KeyboardUtils.keyStatusKeys.contains(event.keyCode))
            KeyboardUtils.keyStatusKeys.remove(event.keyCode);
    };
    KeyboardUtils.currentKeys = [];
    KeyboardUtils.previousKeys = [];
    KeyboardUtils.keyStatusKeys = [];
    return KeyboardUtils;
}());
var es;
(function (es) {
    var Keys;
    (function (Keys) {
        Keys[Keys["none"] = 0] = "none";
        Keys[Keys["back"] = 8] = "back";
        Keys[Keys["tab"] = 9] = "tab";
        Keys[Keys["enter"] = 13] = "enter";
        Keys[Keys["capsLock"] = 20] = "capsLock";
        Keys[Keys["escape"] = 27] = "escape";
        Keys[Keys["space"] = 32] = "space";
        Keys[Keys["pageUp"] = 33] = "pageUp";
        Keys[Keys["pageDown"] = 34] = "pageDown";
        Keys[Keys["end"] = 35] = "end";
        Keys[Keys["home"] = 36] = "home";
        Keys[Keys["left"] = 37] = "left";
        Keys[Keys["up"] = 38] = "up";
        Keys[Keys["right"] = 39] = "right";
        Keys[Keys["down"] = 40] = "down";
        Keys[Keys["select"] = 41] = "select";
        Keys[Keys["print"] = 42] = "print";
        Keys[Keys["execute"] = 43] = "execute";
        Keys[Keys["printScreen"] = 44] = "printScreen";
        Keys[Keys["insert"] = 45] = "insert";
        Keys[Keys["delete"] = 46] = "delete";
        Keys[Keys["help"] = 47] = "help";
        Keys[Keys["d0"] = 48] = "d0";
        Keys[Keys["d1"] = 49] = "d1";
        Keys[Keys["d2"] = 50] = "d2";
        Keys[Keys["d3"] = 51] = "d3";
        Keys[Keys["d4"] = 52] = "d4";
        Keys[Keys["d5"] = 53] = "d5";
        Keys[Keys["d6"] = 54] = "d6";
        Keys[Keys["d7"] = 55] = "d7";
        Keys[Keys["d8"] = 56] = "d8";
        Keys[Keys["d9"] = 57] = "d9";
        Keys[Keys["a"] = 65] = "a";
        Keys[Keys["b"] = 66] = "b";
        Keys[Keys["c"] = 67] = "c";
        Keys[Keys["d"] = 68] = "d";
        Keys[Keys["e"] = 69] = "e";
        Keys[Keys["f"] = 70] = "f";
        Keys[Keys["g"] = 71] = "g";
        Keys[Keys["h"] = 72] = "h";
        Keys[Keys["i"] = 73] = "i";
        Keys[Keys["j"] = 74] = "j";
        Keys[Keys["k"] = 75] = "k";
        Keys[Keys["l"] = 76] = "l";
        Keys[Keys["m"] = 77] = "m";
        Keys[Keys["n"] = 78] = "n";
        Keys[Keys["o"] = 79] = "o";
        Keys[Keys["p"] = 80] = "p";
        Keys[Keys["q"] = 81] = "q";
        Keys[Keys["r"] = 82] = "r";
        Keys[Keys["s"] = 83] = "s";
        Keys[Keys["t"] = 84] = "t";
        Keys[Keys["u"] = 85] = "u";
        Keys[Keys["v"] = 86] = "v";
        Keys[Keys["w"] = 87] = "w";
        Keys[Keys["x"] = 88] = "x";
        Keys[Keys["y"] = 89] = "y";
        Keys[Keys["z"] = 90] = "z";
        Keys[Keys["leftWindows"] = 91] = "leftWindows";
        Keys[Keys["rightWindows"] = 92] = "rightWindows";
        Keys[Keys["apps"] = 93] = "apps";
        Keys[Keys["sleep"] = 95] = "sleep";
        Keys[Keys["numPad0"] = 96] = "numPad0";
        Keys[Keys["numPad1"] = 97] = "numPad1";
        Keys[Keys["numPad2"] = 98] = "numPad2";
        Keys[Keys["numPad3"] = 99] = "numPad3";
        Keys[Keys["numPad4"] = 100] = "numPad4";
        Keys[Keys["numPad5"] = 101] = "numPad5";
        Keys[Keys["numPad6"] = 102] = "numPad6";
        Keys[Keys["numPad7"] = 103] = "numPad7";
        Keys[Keys["numPad8"] = 104] = "numPad8";
        Keys[Keys["numPad9"] = 105] = "numPad9";
        Keys[Keys["multiply"] = 106] = "multiply";
        Keys[Keys["add"] = 107] = "add";
        Keys[Keys["seperator"] = 108] = "seperator";
        Keys[Keys["subtract"] = 109] = "subtract";
        Keys[Keys["decimal"] = 110] = "decimal";
        Keys[Keys["divide"] = 111] = "divide";
        Keys[Keys["f1"] = 112] = "f1";
        Keys[Keys["f2"] = 113] = "f2";
        Keys[Keys["f3"] = 114] = "f3";
        Keys[Keys["f4"] = 115] = "f4";
        Keys[Keys["f5"] = 116] = "f5";
        Keys[Keys["f6"] = 117] = "f6";
        Keys[Keys["f7"] = 118] = "f7";
        Keys[Keys["f8"] = 119] = "f8";
        Keys[Keys["f9"] = 120] = "f9";
        Keys[Keys["f10"] = 121] = "f10";
        Keys[Keys["f11"] = 122] = "f11";
        Keys[Keys["f12"] = 123] = "f12";
        Keys[Keys["f13"] = 124] = "f13";
        Keys[Keys["f14"] = 125] = "f14";
        Keys[Keys["f15"] = 126] = "f15";
        Keys[Keys["f16"] = 127] = "f16";
        Keys[Keys["f17"] = 128] = "f17";
        Keys[Keys["f18"] = 129] = "f18";
        Keys[Keys["f19"] = 130] = "f19";
        Keys[Keys["f20"] = 131] = "f20";
        Keys[Keys["f21"] = 132] = "f21";
        Keys[Keys["f22"] = 133] = "f22";
        Keys[Keys["f23"] = 134] = "f23";
        Keys[Keys["f24"] = 135] = "f24";
        Keys[Keys["numLock"] = 144] = "numLock";
        Keys[Keys["scroll"] = 145] = "scroll";
        Keys[Keys["leftShift"] = 160] = "leftShift";
        Keys[Keys["rightShift"] = 161] = "rightShift";
        Keys[Keys["leftControl"] = 162] = "leftControl";
        Keys[Keys["rightControl"] = 163] = "rightControl";
        Keys[Keys["leftAlt"] = 164] = "leftAlt";
        Keys[Keys["rightAlt"] = 165] = "rightAlt";
        Keys[Keys["browserBack"] = 166] = "browserBack";
        Keys[Keys["browserForward"] = 167] = "browserForward";
    })(Keys = es.Keys || (es.Keys = {}));
})(es || (es = {}));
var es;
(function (es) {
    var OverlapBehavior;
    (function (OverlapBehavior) {
        OverlapBehavior[OverlapBehavior["cancelOut"] = 0] = "cancelOut";
        OverlapBehavior[OverlapBehavior["takeOlder"] = 1] = "takeOlder";
        OverlapBehavior[OverlapBehavior["takeNewer"] = 2] = "takeNewer";
    })(OverlapBehavior = es.OverlapBehavior || (es.OverlapBehavior = {}));
    var VirtualInput = (function () {
        function VirtualInput() {
            es.Input._virtualInputs.push(this);
        }
        VirtualInput.prototype.deregister = function () {
            es.Input._virtualInputs.remove(this);
        };
        return VirtualInput;
    }());
    es.VirtualInput = VirtualInput;
    var VirtualInputNode = (function () {
        function VirtualInputNode() {
        }
        VirtualInputNode.prototype.update = function () { };
        return VirtualInputNode;
    }());
    es.VirtualInputNode = VirtualInputNode;
})(es || (es = {}));
var es;
(function (es) {
    var VirtualIntegerAxis = (function (_super) {
        __extends(VirtualIntegerAxis, _super);
        function VirtualIntegerAxis() {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i] = arguments[_i];
            }
            var _this = _super.call(this) || this;
            _this.nodes = [];
            _this.nodes.concat(nodes);
            return _this;
        }
        Object.defineProperty(VirtualIntegerAxis.prototype, "value", {
            get: function () {
                for (var i = 0; i < this.nodes.length; i++) {
                    var val = this.nodes[i].value;
                    if (val != 0)
                        return Math.sign(val);
                }
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        VirtualIntegerAxis.prototype.update = function () {
            for (var i = 0; i < this.nodes.length; i++)
                this.nodes[i].update();
        };
        VirtualIntegerAxis.prototype.addKeyboardKeys = function (overlapBehavior, negative, positive) {
            this.nodes.push(new es.KeyboardKeys(overlapBehavior, negative, positive));
            return this;
        };
        return VirtualIntegerAxis;
    }(es.VirtualInput));
    es.VirtualIntegerAxis = VirtualIntegerAxis;
    var VirtualAxisNode = (function (_super) {
        __extends(VirtualAxisNode, _super);
        function VirtualAxisNode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return VirtualAxisNode;
    }(es.VirtualInputNode));
    es.VirtualAxisNode = VirtualAxisNode;
})(es || (es = {}));
var es;
(function (es) {
    var VirtualAxis = (function (_super) {
        __extends(VirtualAxis, _super);
        function VirtualAxis() {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i] = arguments[_i];
            }
            var _this = _super.call(this) || this;
            _this.nodes = [];
            _this.nodes.concat(nodes);
            return _this;
        }
        Object.defineProperty(VirtualAxis.prototype, "value", {
            get: function () {
                for (var i = 0; i < this.nodes.length; i++) {
                    var val = this.nodes[i].value;
                    if (val != 0)
                        return val;
                }
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        VirtualAxis.prototype.update = function () {
            for (var i = 0; i < this.nodes.length; i++)
                this.nodes[i].update();
        };
        return VirtualAxis;
    }(es.VirtualInput));
    es.VirtualAxis = VirtualAxis;
    var KeyboardKeys = (function (_super) {
        __extends(KeyboardKeys, _super);
        function KeyboardKeys(overlapBehavior, negative, positive) {
            var _this = _super.call(this) || this;
            _this._value = 0;
            _this.overlapBehavior = overlapBehavior;
            _this.negative = negative;
            _this.positive = positive;
            return _this;
        }
        KeyboardKeys.prototype.update = function () {
            if (es.Input.isKeyDown(this.positive)) {
                if (es.Input.isKeyDown(this.negative)) {
                    switch (this.overlapBehavior) {
                        default:
                        case es.OverlapBehavior.cancelOut:
                            this._value = 0;
                            break;
                        case es.OverlapBehavior.takeNewer:
                            if (!this._turned) {
                                this._value *= -1;
                                this._turned = true;
                            }
                            break;
                        case es.OverlapBehavior.takeOlder:
                            break;
                    }
                }
                else {
                    this._turned = false;
                    this._value = 1;
                }
            }
            else if (es.Input.isKeyDown(this.negative)) {
                this._turned = false;
                this._value = -1;
            }
            else {
                this._turned = false;
                this._value = 0;
            }
        };
        Object.defineProperty(KeyboardKeys.prototype, "value", {
            get: function () {
                return this._value;
            },
            enumerable: true,
            configurable: true
        });
        return KeyboardKeys;
    }(es.VirtualAxisNode));
    es.KeyboardKeys = KeyboardKeys;
})(es || (es = {}));
var es;
(function (es) {
    var VirtualButton = (function (_super) {
        __extends(VirtualButton, _super);
        function VirtualButton(bufferTime) {
            if (bufferTime === void 0) { bufferTime = 0; }
            var nodes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                nodes[_i - 1] = arguments[_i];
            }
            var _this = _super.call(this) || this;
            _this.nodes = [];
            _this.bufferTime = 0;
            _this.firstRepeatTime = 0;
            _this.mutiRepeatTime = 0;
            _this._bufferCounter = 0;
            _this._repeatCounter = 0;
            _this.nodes = nodes;
            _this.bufferTime = bufferTime;
            return _this;
        }
        VirtualButton.prototype.setRepeat = function (firstRepeatTime, mutiRepeatTime) {
            if (mutiRepeatTime === void 0) { mutiRepeatTime = firstRepeatTime; }
            this.firstRepeatTime = firstRepeatTime;
            this.mutiRepeatTime = mutiRepeatTime;
            this._willRepeat = this.firstRepeatTime > 0;
            if (!this._willRepeat)
                this.isRepeating = false;
        };
        VirtualButton.prototype.update = function () {
            this._bufferCounter -= es.Time.unscaledDeltaTime;
            this.isRepeating = false;
            var check = false;
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].update();
                if (this.nodes[i].isPressed) {
                    this._bufferCounter = this.bufferTime;
                    check = true;
                }
                else if (this.nodes[i].isDown) {
                    check = true;
                }
            }
            if (!check) {
                this._repeatCounter = 0;
                this._bufferCounter = 0;
            }
            else if (this._willRepeat) {
                if (this._repeatCounter == 0) {
                    this._repeatCounter = this.firstRepeatTime;
                }
                else {
                    this._repeatCounter -= es.Time.unscaledDeltaTime;
                    if (this._repeatCounter <= 0) {
                        this.isRepeating = true;
                        this._repeatCounter = this.mutiRepeatTime;
                    }
                }
            }
        };
        Object.defineProperty(VirtualButton.prototype, "isDown", {
            get: function () {
                for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                    var node = _a[_i];
                    if (node.isDown)
                        return true;
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VirtualButton.prototype, "isPressed", {
            get: function () {
                if (this._bufferCounter > 0 || this.isRepeating)
                    return true;
                for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                    var node = _a[_i];
                    if (node.isPressed)
                        return true;
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VirtualButton.prototype, "isReleased", {
            get: function () {
                for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                    var node = _a[_i];
                    if (node.isReleased)
                        return true;
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
        VirtualButton.prototype.consumeBuffer = function () {
            this._bufferCounter = 0;
        };
        VirtualButton.prototype.addKeyboardKey = function (key) {
            this.nodes.push(new KeyboardKey(key));
            return this;
        };
        return VirtualButton;
    }(es.VirtualInput));
    es.VirtualButton = VirtualButton;
    var Node = (function (_super) {
        __extends(Node, _super);
        function Node() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Node;
    }(es.VirtualInputNode));
    es.Node = Node;
    var KeyboardKey = (function (_super) {
        __extends(KeyboardKey, _super);
        function KeyboardKey(key) {
            var _this = _super.call(this) || this;
            _this.key = key;
            return _this;
        }
        Object.defineProperty(KeyboardKey.prototype, "isDown", {
            get: function () {
                return es.Input.isKeyDown(this.key);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KeyboardKey.prototype, "isPressed", {
            get: function () {
                return es.Input.isKeyPressed(this.key);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KeyboardKey.prototype, "isReleased", {
            get: function () {
                return es.Input.isKeyReleased(this.key);
            },
            enumerable: true,
            configurable: true
        });
        return KeyboardKey;
    }(Node));
    es.KeyboardKey = KeyboardKey;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var AssetPacker = (function () {
        function AssetPacker() {
            this.itemsToRaster = [];
            this.useCache = false;
            this.cacheName = "";
            this._sprites = new Map();
            this.allow4096Textures = false;
        }
        AssetPacker.prototype.addTextureToPack = function (texture, customID) {
            this.itemsToRaster.push(new es.TextureToPack(texture, customID));
        };
        AssetPacker.prototype.process = function (allow4096Textures) {
            if (allow4096Textures === void 0) { allow4096Textures = false; }
            return __awaiter(this, void 0, void 0, function () {
                var cacheExist;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.allow4096Textures = allow4096Textures;
                            if (!this.useCache) return [3, 2];
                            if (this.cacheName == "") {
                                console.error("未指定缓存名称");
                                return [2];
                            }
                            return [4, RES.getResByUrl(this.cacheName)];
                        case 1:
                            cacheExist = _a.sent();
                            if (!cacheExist)
                                this.createPack();
                            else
                                this.loadPack();
                            return [3, 3];
                        case 2:
                            this.createPack();
                            _a.label = 3;
                        case 3: return [2];
                    }
                });
            });
        };
        AssetPacker.prototype.loadPack = function () {
            return __awaiter(this, void 0, void 0, function () {
                var loaderTexture;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, RES.getResByUrl(this.cacheName)];
                        case 1:
                            loaderTexture = _a.sent();
                            if (this.onProcessCompleted)
                                this.onProcessCompleted();
                            return [2, loaderTexture];
                    }
                });
            });
        };
        AssetPacker.prototype.createPack = function () {
            var textures = [];
            var images = [];
            for (var _i = 0, _a = this.itemsToRaster; _i < _a.length; _i++) {
                var itemToRaster = _a[_i];
                textures.push(new Bitmap(itemToRaster.texture));
                images.push(itemToRaster.id);
            }
            var textureSize = this.allow4096Textures ? 4096 : 2048;
            var rectangles = [];
            for (var i = 0; i < textures.length; i++) {
                if (textures[i].width > textureSize || textures[i].height > textureSize) {
                    throw new Error("一个纹理的大小比图集的大小大");
                }
                else {
                    rectangles.push(new es.Rectangle(0, 0, textures[i].width, textures[i].height));
                }
            }
            var padding = 1;
            var numSpriteSheet = 0;
            while (rectangles.length > 0) {
                var texture = new egret.RenderTexture();
                var packer = new es.RectanglePacker(textureSize, textureSize, padding);
                for (var i = 0; i < rectangles.length; i++)
                    packer.insertRectangle(Math.floor(rectangles[i].width), Math.floor(rectangles[i].height), i);
                packer.packRectangles();
                if (packer.rectangleCount > 0) {
                    var rect = new es.IntegerRectangle();
                    var textureAssets = [];
                    var garbageRect = [];
                    var garabeTextures = [];
                    var garbageImages = [];
                    for (var j = 0; j < packer.rectangleCount; j++) {
                        rect = packer.getRectangle(j, rect);
                        var index = packer.getRectangleId(j);
                        texture.drawToTexture(textures[index], new es.Rectangle(rect.x, rect.y, rect.width, rect.height));
                        var textureAsset = new es.TextureAsset();
                        textureAsset.x = rect.x;
                        textureAsset.y = rect.y;
                        textureAsset.width = rect.width;
                        textureAsset.height = rect.height;
                        textureAsset.name = images[index];
                        textureAssets.push(textureAsset);
                        garbageRect.push(rectangles[index]);
                        garabeTextures.push(textures[index].texture);
                        garbageImages.push(images[index]);
                    }
                    for (var _b = 0, garbageRect_1 = garbageRect; _b < garbageRect_1.length; _b++) {
                        var garbage = garbageRect_1[_b];
                        rectangles.remove(garbage);
                    }
                    var _loop_9 = function (garbage) {
                        textures.removeAll(function (a) { return a.texture.hashCode == garbage.hashCode; });
                    };
                    for (var _c = 0, garabeTextures_1 = garabeTextures; _c < garabeTextures_1.length; _c++) {
                        var garbage = garabeTextures_1[_c];
                        _loop_9(garbage);
                    }
                    for (var _d = 0, garbageImages_1 = garbageImages; _d < garbageImages_1.length; _d++) {
                        var garbage = garbageImages_1[_d];
                        images.remove(garbage);
                    }
                    if (this.cacheName != "") {
                        texture.saveToFile("image/png", this.cacheName);
                        ++numSpriteSheet;
                    }
                    for (var _e = 0, textureAssets_1 = textureAssets; _e < textureAssets_1.length; _e++) {
                        var textureAsset = textureAssets_1[_e];
                        this._sprites.set(textureAsset.name, texture);
                    }
                }
            }
            if (this.onProcessCompleted)
                this.onProcessCompleted();
        };
        AssetPacker.prototype.dispose = function () {
            this._sprites.forEach(function (asset, name) {
                asset.dispose();
                RES.destroyRes(name);
            });
            this._sprites.clear();
        };
        AssetPacker.prototype.getTexture = function (id) {
            return this._sprites.get(id);
        };
        return AssetPacker;
    }());
    es.AssetPacker = AssetPacker;
})(es || (es = {}));
var es;
(function (es) {
    var IntegerRectangle = (function (_super) {
        __extends(IntegerRectangle, _super);
        function IntegerRectangle() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return IntegerRectangle;
    }(es.Rectangle));
    es.IntegerRectangle = IntegerRectangle;
})(es || (es = {}));
var es;
(function (es) {
    var RectanglePacker = (function () {
        function RectanglePacker(width, height, padding) {
            if (padding === void 0) { padding = 0; }
            this._width = 0;
            this._height = 0;
            this._padding = 8;
            this._packedWidth = 0;
            this._packedHeight = 0;
            this._insertList = [];
            this._insertedRectangles = [];
            this._freeAreas = [];
            this._newFreeAreas = [];
            this._sortableSizeStack = [];
            this._rectangleStack = [];
            this._outsideRectangle = new es.IntegerRectangle(width + 1, height + 1, 0, 0);
            this.reset(width, height, padding);
        }
        Object.defineProperty(RectanglePacker.prototype, "rectangleCount", {
            get: function () {
                return this._insertedRectangles.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectanglePacker.prototype, "packedWidth", {
            get: function () {
                return this._packedWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectanglePacker.prototype, "packedHeight", {
            get: function () {
                return this._packedHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RectanglePacker.prototype, "padding", {
            get: function () {
                return this._padding;
            },
            enumerable: true,
            configurable: true
        });
        RectanglePacker.prototype.reset = function (width, height, padding) {
            if (padding === void 0) { padding = 0; }
            while (this._insertedRectangles.length > 0)
                this.freeRectangle(this._insertedRectangles.pop());
            while (this._freeAreas.length > 0)
                this.freeRectangle(this._freeAreas.pop());
            this._width = width;
            this._height = height;
            this._packedWidth = 0;
            this._packedHeight = 0;
            this._freeAreas.push(this.allocateRectangle(0, 0, this._width, this._height));
            while (this._insertedRectangles.length > 0)
                this.freeSize(this._insertList.pop());
            this._padding = padding;
        };
        RectanglePacker.prototype.insertRectangle = function (width, height, id) {
            var sortableSize = this.allocateSize(width, height, id);
            this._insertList.push(sortableSize);
        };
        RectanglePacker.prototype.packRectangles = function (sort) {
            if (sort === void 0) { sort = true; }
            if (sort)
                this._insertList.sort(function (emp1, emp2) {
                    return emp1.width - emp2.width;
                });
            while (this._insertList.length > 0) {
                var sortableSize = this._insertList.pop();
                var width = sortableSize.width;
                var height = sortableSize.height;
                var index = this.getFreeAreaIndex(width, height);
                if (index >= 0) {
                    var freeArea = this._freeAreas[index];
                    var target = this.allocateRectangle(freeArea.x, freeArea.y, width, height);
                    target.id = sortableSize.id;
                    this.generateNewFreeAreas(target, this._freeAreas, this._newFreeAreas);
                    while (this._newFreeAreas.length > 0)
                        this._freeAreas.push(this._newFreeAreas.pop());
                    this._insertedRectangles.push(target);
                    if (target.right > this._packedWidth)
                        this._packedWidth = target.right;
                    if (target.bottom > this._packedHeight)
                        this._packedHeight = target.bottom;
                }
                this.freeSize(sortableSize);
            }
            return this.rectangleCount;
        };
        RectanglePacker.prototype.getRectangle = function (index, rectangle) {
            var inserted = this._insertedRectangles[index];
            rectangle.x = inserted.x;
            rectangle.y = inserted.y;
            rectangle.width = inserted.width;
            rectangle.height = inserted.height;
            return rectangle;
        };
        RectanglePacker.prototype.getRectangleId = function (index) {
            var inserted = this._insertedRectangles[index];
            return inserted.id;
        };
        RectanglePacker.prototype.generateNewFreeAreas = function (target, areas, results) {
            var x = target.x;
            var y = target.y;
            var right = target.right + 1 + this._padding;
            var bottom = target.bottom + 1 + this._padding;
            var targetWithPadding = null;
            if (this._padding == 0)
                targetWithPadding = target;
            for (var i = areas.length - 1; i >= 0; i--) {
                var area = areas[i];
                if (!(x >= area.right || right <= area.x || y >= area.bottom || bottom <= area.y)) {
                    if (targetWithPadding == null)
                        targetWithPadding = this.allocateRectangle(target.x, target.y, target.width + this._padding, target.height + this._padding);
                    this.generateDividedAreas(targetWithPadding, area, results);
                    var topOfStack = areas.pop();
                    if (i < areas.length) {
                        areas[i] = topOfStack;
                    }
                }
            }
            if (targetWithPadding != null && targetWithPadding != target)
                this.freeRectangle(targetWithPadding);
            this.filterSelfSubAreas(results);
        };
        RectanglePacker.prototype.filterSelfSubAreas = function (areas) {
            for (var i = areas.length - 1; i >= 0; i--) {
                var filtered = areas[i];
                for (var j = areas.length - 1; j >= 0; j--) {
                    if (i != j) {
                        var area = areas[j];
                        if (filtered.x >= area.x && filtered.y >= area.y && filtered.right <= area.right && filtered.bottom <= area.bottom) {
                            this.freeRectangle(filtered);
                            var topOfStack = areas.pop();
                            if (i < areas.length) {
                                areas[i] = topOfStack;
                            }
                            break;
                        }
                    }
                }
            }
        };
        RectanglePacker.prototype.generateDividedAreas = function (divider, area, results) {
            var count = 0;
            var rightDelta = area.right - divider.right;
            if (rightDelta > 0) {
                results.push(this.allocateRectangle(divider.right, area.y, rightDelta, area.height));
                count++;
            }
            var leftDelta = divider.x - area.x;
            if (leftDelta > 0) {
                results.push(this.allocateRectangle(area.x, area.y, leftDelta, area.height));
                count++;
            }
            var bottomDelta = area.bottom - divider.bottom;
            if (bottomDelta > 0) {
                results.push(this.allocateRectangle(area.x, divider.bottom, area.width, bottomDelta));
                count++;
            }
            var topDelta = divider.y - area.y;
            if (topDelta > 0) {
                results.push(this.allocateRectangle(area.x, area.y, area.width, topDelta));
                count++;
            }
            if (count == 0 && (divider.width < area.width || divider.height < area.height)) {
                results.push(area);
            }
            else {
                this.freeRectangle(area);
            }
        };
        RectanglePacker.prototype.getFreeAreaIndex = function (width, height) {
            var best = this._outsideRectangle;
            var index = -1;
            var paddedWidth = width + this._padding;
            var paddedHeight = height + this._padding;
            var count = this._freeAreas.length;
            for (var i = count - 1; i >= 0; i--) {
                var free = this._freeAreas[i];
                if (free.x < this._packedWidth || free.y < this.packedHeight) {
                    if (free.x < best.x && paddedWidth <= free.width && paddedHeight <= free.height) {
                        index = i;
                        if ((paddedWidth == free.width && free.width <= free.height && free.right < this._width) ||
                            (paddedHeight == free.height && free.height <= free.width)) {
                            break;
                        }
                        best = free;
                    }
                }
                else {
                    if (free.x < best.x && width <= free.width && height <= free.height) {
                        index = i;
                        if ((width == free.width && free.width <= free.height && free.right < this._width) ||
                            (height == free.height && free.height <= free.width)) {
                            break;
                        }
                        best = free;
                    }
                }
            }
            return index;
        };
        RectanglePacker.prototype.allocateSize = function (width, height, id) {
            if (this._sortableSizeStack.length > 0) {
                var size = this._sortableSizeStack.pop();
                size.width = width;
                size.height = height;
                size.id = id;
                return size;
            }
            return new es.SortableSize(width, height, id);
        };
        RectanglePacker.prototype.freeSize = function (size) {
            this._sortableSizeStack.push(size);
        };
        RectanglePacker.prototype.allocateRectangle = function (x, y, width, height) {
            if (this._rectangleStack.length > 0) {
                var rectangle = this._rectangleStack.pop();
                rectangle.x = x;
                rectangle.y = y;
                rectangle.width = width;
                rectangle.height = height;
                rectangle.right = x + width;
                rectangle.bottom = y + height;
                return rectangle;
            }
            return new es.IntegerRectangle(x, y, width, height);
        };
        RectanglePacker.prototype.freeRectangle = function (rectangle) {
            this._rectangleStack.push(rectangle);
        };
        return RectanglePacker;
    }());
    es.RectanglePacker = RectanglePacker;
})(es || (es = {}));
var es;
(function (es) {
    var SortableSize = (function () {
        function SortableSize(width, height, id) {
            this.width = width;
            this.height = height;
            this.id = id;
        }
        return SortableSize;
    }());
    es.SortableSize = SortableSize;
})(es || (es = {}));
var es;
(function (es) {
    var TextureAssets = (function () {
        function TextureAssets(assets) {
            this.assets = assets;
        }
        return TextureAssets;
    }());
    es.TextureAssets = TextureAssets;
    var TextureAsset = (function () {
        function TextureAsset() {
        }
        return TextureAsset;
    }());
    es.TextureAsset = TextureAsset;
})(es || (es = {}));
var es;
(function (es) {
    var TextureToPack = (function () {
        function TextureToPack(texture, id) {
            this.texture = texture;
            this.id = id;
        }
        return TextureToPack;
    }());
    es.TextureToPack = TextureToPack;
})(es || (es = {}));
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
