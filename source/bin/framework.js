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
    es.AStarNode = AStarNode;
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
            return !this.walls.firstOrDefault(function (wall) { return JSON.stringify(wall) == JSON.stringify(node); });
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
            return this.weightedNodes.find(function (p) { return JSON.stringify(p) == JSON.stringify(to); }) ? this.weightedNodeWeight : this.defaultWeight;
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
        Object.defineProperty(PriorityQueue.prototype, "maxSize", {
            get: function () {
                return this._nodes.length - 1;
            },
            enumerable: true,
            configurable: true
        });
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
        Vector2.negate = function (value) {
            var result = new Vector2();
            result.x = -value.x;
            result.y = -value.y;
            return result;
        };
        Vector2.prototype.equals = function (other) {
            return other.x == this.x && other.y == this.y;
        };
        Vector2.unitYVector = new Vector2(0, 1);
        Vector2.unitXVector = new Vector2(1, 0);
        Vector2.unitVector2 = new Vector2(1, 1);
        Vector2.zeroVector2 = new Vector2(0, 0);
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
    es.WeightedPathfinder = WeightedPathfinder;
})(es || (es = {}));
var es;
(function (es) {
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
                    es.DrawUtils.drawLine(shape, this.start, this.end, this.color);
                    break;
                case DebugDrawType.hollowRectangle:
                    es.DrawUtils.drawHollowRect(shape, this.rectangle, this.color);
                    break;
                case DebugDrawType.pixel:
                    es.DrawUtils.drawPixel(shape, new es.Vector2(this.x, this.y), this.color, this.size);
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
        Component.prototype.debugRender = function () {
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
        Component.prototype.clone = function () {
            var component = ObjectUtils.clone(this);
            component.entity = null;
            return component;
        };
        return Component;
    }());
    es.Component = Component;
})(es || (es = {}));
var es;
(function (es) {
    var Core = (function (_super) {
        __extends(Core, _super);
        function Core() {
            var _this = _super.call(this) || this;
            _this._globalManagers = [];
            Core._instance = _this;
            Core.emitter = new es.Emitter();
            Core.content = new es.ContentManager();
            _this.addEventListener(egret.Event.ADDED_TO_STAGE, _this.onAddToStage, _this);
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
                    this._instance._scene = value;
                    this._instance.addChild(value);
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
        Core.prototype.onAddToStage = function () {
            Core.graphicsDevice = new es.GraphicsDevice();
            this.addEventListener(egret.Event.RESIZE, this.onGraphicsDeviceReset, this);
            this.addEventListener(egret.StageOrientationEvent.ORIENTATION_CHANGE, this.onOrientationChanged, this);
            this.addEventListener(egret.Event.ENTER_FRAME, this.update, this);
            es.Input.initialize();
            this.initialize();
        };
        Core.prototype.onOrientationChanged = function () {
            Core.emitter.emit(es.CoreEvents.OrientationChanged);
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
                            es.Time.update(egret.getTimer());
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
                            this.removeChild(this._scene);
                            this._scene.end();
                            this._scene = this._nextScene;
                            this._nextScene = null;
                            this.onSceneChanged();
                            this.addChild(this._scene);
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
        Core.prototype.onSceneChanged = function () {
            Core.emitter.emit(es.CoreEvents.SceneChanged);
            es.Time.sceneChanged();
        };
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
        return Core;
    }(egret.DisplayObjectContainer));
    es.Core = Core;
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
        Object.defineProperty(Entity.prototype, "isDestroyed", {
            get: function () {
                return this._isDestroyed;
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
        Entity.prototype.clone = function (position) {
            if (position === void 0) { position = new es.Vector2(); }
            var entity = new Entity(this.name + "(clone)");
            entity.copyFrom(this);
            entity.transform.position = position;
            return entity;
        };
        Entity.prototype.copyFrom = function (entity) {
            this.tag = entity.tag;
            this.updateInterval = entity.updateInterval;
            this.updateOrder = entity.updateOrder;
            this.enabled = entity.enabled;
            this.transform.scale = entity.transform.scale;
            this.transform.rotation = entity.transform.rotation;
            for (var i = 0; i < entity.components.count; i++)
                this.addComponent(entity.components.buffer[i].clone());
            for (var i = 0; i < entity.components._componentsToAdd.length; i++)
                this.addComponent(entity.components._componentsToAdd[i].clone());
            for (var i = 0; i < entity.transform.childCount; i++) {
                var child = entity.transform.getChild(i).entity;
                var childClone = child.clone();
                childClone.transform.copyFrom(child.transform);
                childClone.transform.parent = this.transform;
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
        return Entity;
    }());
    es.Entity = Entity;
})(es || (es = {}));
var es;
(function (es) {
    var Scene = (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            var _this = _super.call(this) || this;
            _this.enablePostProcessing = true;
            _this._renderers = [];
            _this._postProcessors = [];
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
        Scene.prototype.initialize = function () { };
        Scene.prototype.onStart = function () {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2];
            }); });
        };
        Scene.prototype.unload = function () { };
        Scene.prototype.onActive = function () { };
        Scene.prototype.onDeactive = function () { };
        Scene.prototype.begin = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (this._renderers.length == 0) {
                        this.addRenderer(new es.DefaultRenderer());
                        console.warn("场景开始时没有渲染器 自动添加DefaultRenderer以保证能够正常渲染");
                    }
                    this.camera = this.createEntity("camera").getOrCreateComponent(new es.Camera());
                    es.Physics.reset();
                    if (this.entityProcessors)
                        this.entityProcessors.begin();
                    this.addEventListener(egret.Event.ACTIVATE, this.onActive, this);
                    this.addEventListener(egret.Event.DEACTIVATE, this.onDeactive, this);
                    this.camera.onSceneSizeChanged(this.stage.stageWidth, this.stage.stageHeight);
                    this._didSceneBegin = true;
                    this.onStart();
                    return [2];
                });
            });
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
            this.camera = null;
            this.content.dispose();
            if (this.entityProcessors)
                this.entityProcessors.end();
            if (this.parent)
                this.parent.removeChild(this);
            this.unload();
        };
        Scene.prototype.update = function () {
            this.entities.updateLists();
            if (this.entityProcessors)
                this.entityProcessors.update();
            this.entities.update();
            if (this.entityProcessors)
                this.entityProcessors.lateUpdate();
            this.renderableComponents.updateList();
        };
        Scene.prototype.render = function () {
            if (this._renderers.length == 0) {
                console.error("there are no renderers in the scene!");
                return;
            }
            for (var i = 0; i < this._renderers.length; i++) {
                this._renderers[i].render(this);
            }
        };
        Scene.prototype.postRender = function () {
            if (this.enablePostProcessing) {
                for (var i = 0; i < this._postProcessors.length; i++) {
                    if (this._postProcessors[i].enabled) {
                        this._postProcessors[i].process();
                    }
                }
            }
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
                console.warn("You are attempting to add the same entity to a scene twice: " + entity);
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
            _this._worldToLocalTransform = es.Matrix2D.create().identity();
            _this._worldInverseTransform = es.Matrix2D.create().identity();
            _this._rotationMatrix = es.Matrix2D.create();
            _this._translationMatrix = es.Matrix2D.create();
            _this._scaleMatrix = es.Matrix2D.create();
            _this._position = es.Vector2.zero;
            _this._scale = es.Vector2.one;
            _this._rotation = 0;
            _this._localPosition = es.Vector2.zero;
            _this._localScale = es.Vector2.one;
            _this._localRotation = 0;
            _this.entity = entity;
            _this.scale = es.Vector2.one;
            _this._children = [];
            return _this;
        }
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
        Object.defineProperty(Transform.prototype, "childCount", {
            get: function () {
                return this._children.length;
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
                        this._position = es.Vector2Ext.transformR(this._localPosition, this.parent._worldTransform);
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
        Object.defineProperty(Transform.prototype, "localToWorldTransform", {
            get: function () {
                this.updateTransform();
                return this._worldTransform;
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
                this.localPosition = es.Vector2Ext.transformR(this._position, this._worldToLocalTransform);
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
    var CameraStyle;
    (function (CameraStyle) {
        CameraStyle[CameraStyle["lockOn"] = 0] = "lockOn";
        CameraStyle[CameraStyle["cameraWindow"] = 1] = "cameraWindow";
    })(CameraStyle = es.CameraStyle || (es.CameraStyle = {}));
    var CameraInset = (function () {
        function CameraInset() {
            this.left = 0;
            this.right = 0;
            this.top = 0;
            this.bottom = 0;
        }
        return CameraInset;
    }());
    es.CameraInset = CameraInset;
    var Camera = (function (_super) {
        __extends(Camera, _super);
        function Camera(targetEntity, cameraStyle) {
            if (targetEntity === void 0) { targetEntity = null; }
            if (cameraStyle === void 0) { cameraStyle = CameraStyle.lockOn; }
            var _this = _super.call(this) || this;
            _this._minimumZoom = 0.3;
            _this._maximumZoom = 3;
            _this._bounds = new es.Rectangle();
            _this._inset = new CameraInset();
            _this._transformMatrix = new es.Matrix2D().identity();
            _this._inverseTransformMatrix = new es.Matrix2D().identity();
            _this._origin = es.Vector2.zero;
            _this._areMatrixedDirty = true;
            _this._areBoundsDirty = true;
            _this._isProjectionMatrixDirty = true;
            _this.followLerp = 0.1;
            _this.deadzone = new es.Rectangle();
            _this.focusOffset = es.Vector2.zero;
            _this.mapLockEnabled = false;
            _this.mapSize = es.Vector2.zero;
            _this._desiredPositionDelta = new es.Vector2();
            _this._worldSpaceDeadZone = new es.Rectangle();
            _this._targetEntity = targetEntity;
            _this._cameraStyle = cameraStyle;
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
        Camera.prototype.onSceneSizeChanged = function (newWidth, newHeight) {
            var oldOrigin = this._origin;
            this.origin = new es.Vector2(newWidth / 2, newHeight / 2);
            this.entity.transform.position = es.Vector2.add(this.entity.transform.position, es.Vector2.subtract(this._origin, oldOrigin));
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
            tempMat = es.Matrix2D.create().translate(this._origin.x, this._origin.y);
            this._transformMatrix = this._transformMatrix.multiply(tempMat);
            this._inverseTransformMatrix = this._transformMatrix.invert();
            this._areBoundsDirty = true;
            this._areMatrixedDirty = false;
        };
        Camera.prototype.setInset = function (left, right, top, bottom) {
            this._inset = new CameraInset();
            this._inset.left = left;
            this._inset.right = right;
            this._inset.top = top;
            this._inset.bottom = bottom;
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
            worldPosition = es.Vector2.transform(worldPosition, this._transformMatrix);
            return worldPosition;
        };
        Camera.prototype.screenToWorldPoint = function (screenPosition) {
            this.updateMatrixes();
            screenPosition = es.Vector2.transform(screenPosition, this._inverseTransformMatrix);
            return screenPosition;
        };
        Camera.prototype.mouseToWorldPoint = function () {
            return this.screenToWorldPoint(es.Input.touchPosition);
        };
        Camera.prototype.onAddedToEntity = function () {
            this.follow(this._targetEntity, this._cameraStyle);
        };
        Camera.prototype.update = function () {
            var halfScreen = es.Vector2.multiply(new es.Vector2(this.bounds.width, this.bounds.height), new es.Vector2(0.5));
            this._worldSpaceDeadZone.x = this.position.x - halfScreen.x * es.Core.scene.scaleX + this.deadzone.x + this.focusOffset.x;
            this._worldSpaceDeadZone.y = this.position.y - halfScreen.y * es.Core.scene.scaleY + this.deadzone.y + this.focusOffset.y;
            this._worldSpaceDeadZone.width = this.deadzone.width;
            this._worldSpaceDeadZone.height = this.deadzone.height;
            if (this._targetEntity)
                this.updateFollow();
            this.position = es.Vector2.lerp(this.position, es.Vector2.add(this.position, this._desiredPositionDelta), this.followLerp);
            this.entity.transform.roundPosition();
            if (this.mapLockEnabled) {
                this.position = this.clampToMapSize(this.position);
                this.entity.transform.roundPosition();
            }
        };
        Camera.prototype.clampToMapSize = function (position) {
            var halfScreen = es.Vector2.multiply(new es.Vector2(this.bounds.width, this.bounds.height), new es.Vector2(0.5));
            var cameraMax = new es.Vector2(this.mapSize.x - halfScreen.x, this.mapSize.y - halfScreen.y);
            return es.Vector2.clamp(position, halfScreen, cameraMax);
        };
        Camera.prototype.updateFollow = function () {
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
        Camera.prototype.follow = function (targetEntity, cameraStyle) {
            if (cameraStyle === void 0) { cameraStyle = CameraStyle.cameraWindow; }
            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;
            switch (this._cameraStyle) {
                case CameraStyle.cameraWindow:
                    var w = this.bounds.width / 6;
                    var h = this.bounds.height / 3;
                    this.deadzone = new es.Rectangle((this.bounds.width - w) / 2, (this.bounds.height - h) / 2, w, h);
                    break;
                case CameraStyle.lockOn:
                    this.deadzone = new es.Rectangle(this.bounds.width / 2, this.bounds.height / 2, 10, 10);
                    break;
            }
        };
        Camera.prototype.setCenteredDeadzone = function (width, height) {
            this.deadzone = new es.Rectangle((this.bounds.width - width) / 2, (this.bounds.height - height) / 2, width, height);
        };
        return Camera;
    }(es.Component));
    es.Camera = Camera;
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
    var RenderableComponent = (function (_super) {
        __extends(RenderableComponent, _super);
        function RenderableComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.displayObject = new egret.DisplayObject();
            _this.color = 0x000000;
            _this._localOffset = es.Vector2.zero;
            _this._renderLayer = 0;
            _this._bounds = new es.Rectangle();
            _this._areBoundsDirty = true;
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
        Object.defineProperty(RenderableComponent.prototype, "renderLayer", {
            get: function () {
                return this._renderLayer;
            },
            set: function (value) {
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
        RenderableComponent.prototype.onBecameVisible = function () {
            this.displayObject.visible = this.isVisible;
        };
        RenderableComponent.prototype.onBecameInvisible = function () {
            this.displayObject.visible = this.isVisible;
        };
        RenderableComponent.prototype.isVisibleFromCamera = function (camera) {
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
            this.displayObject.x = this.entity.position.x + this.localOffset.x - camera.position.x + camera.origin.x;
            this.displayObject.y = this.entity.position.y + this.localOffset.y - camera.position.y + camera.origin.y;
            this.displayObject.scaleX = this.entity.scale.x;
            this.displayObject.scaleY = this.entity.scale.y;
            this.displayObject.rotation = this.entity.rotation;
        };
        RenderableComponent.prototype.toString = function () {
            return "[RenderableComponent] renderLayer: " + this.renderLayer;
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
            var _this = _super.call(this) || this;
            _this._mesh = new egret.Mesh();
            return _this;
        }
        Mesh.prototype.setTexture = function (texture) {
            this._mesh.texture = texture;
            return this;
        };
        Mesh.prototype.reset = function () {
        };
        Mesh.prototype.render = function (camera) {
        };
        return Mesh;
    }(es.RenderableComponent));
    es.Mesh = Mesh;
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
            return this;
        };
        SpriteRenderer.prototype.setOrigin = function (origin) {
            if (this._origin != origin) {
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
            this.displayObject.x = this.entity.position.x - this.origin.x + this.localOffset.x - camera.position.x + camera.origin.x;
            this.displayObject.y = this.entity.position.y - this.origin.y + this.localOffset.y - camera.position.y + camera.origin.y;
        };
        return SpriteRenderer;
    }(es.RenderableComponent));
    es.SpriteRenderer = SpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var TiledSpriteRenderer = (function (_super) {
        __extends(TiledSpriteRenderer, _super);
        function TiledSpriteRenderer(sprite) {
            var _this = _super.call(this, sprite) || this;
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
        };
        return TiledSpriteRenderer;
    }(es.SpriteRenderer));
    es.TiledSpriteRenderer = TiledSpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
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
            this._scrollX += this.scrollSpeedX * es.Time.deltaTime;
            this._scrollY += this.scroolSpeedY * es.Time.deltaTime;
            this.sourceRect.x = this._scrollX;
            this.sourceRect.y = this._scrollY;
        };
        ScrollingSpriteRenderer.prototype.render = function (camera) {
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
        };
        return ScrollingSpriteRenderer;
    }(es.TiledSpriteRenderer));
    es.ScrollingSpriteRenderer = ScrollingSpriteRenderer;
})(es || (es = {}));
var es;
(function (es) {
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
        return Sprite;
    }());
    es.Sprite = Sprite;
})(es || (es = {}));
var es;
(function (es) {
    var SpriteAnimation = (function () {
        function SpriteAnimation(sprites, frameRate) {
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
            _this._animations = new Map();
            _this._elapsedTime = 0;
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
        return SpriteAnimator;
    }(es.SpriteRenderer));
    es.SpriteAnimator = SpriteAnimator;
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
                var neighbors = es.Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers);
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
            this.entity.position = es.Vector2.add(this.entity.position, motion);
            var neighbors = es.Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers);
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
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
            _this.physicsLayer = 1 << 0;
            _this.collidesWithLayers = es.Physics.allLayers;
            _this.shouldColliderScaleAndRotateWithTransform = true;
            _this.registeredPhysicsBounds = new es.Rectangle();
            _this._localOffset = es.Vector2.zero;
            _this._isPositionDirty = true;
            _this._isRotationDirty = true;
            return _this;
        }
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
                    var width = renderableBounds.width / this.entity.scale.x;
                    var height = renderableBounds.height / this.entity.scale.y;
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
                    console.warn("Collider has no shape and no RenderableComponent. Can't figure out how to size it.");
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
            this.entity.position = this.entity.position.add(motion);
            var didCollide = this.shape.collidesWithShape(collider.shape, result);
            if (didCollide)
                result.collider = collider;
            this.entity.position = oldPosition;
            return didCollide;
        };
        Collider.prototype.clone = function () {
            var collider = ObjectUtils.clone(this);
            collider.entity = null;
            if (this.shape)
                collider.shape = this.shape.clone();
            return collider;
        };
        return Collider;
    }(es.Component));
    es.Collider = Collider;
})(es || (es = {}));
var es;
(function (es) {
    var BoxCollider = (function (_super) {
        __extends(BoxCollider, _super);
        function BoxCollider() {
            var _this = _super.call(this) || this;
            _this.shape = new es.Box(1, 1);
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
            if (radius)
                _this._colliderRequiresAutoSizing = true;
            _this.shape = new es.Circle(radius ? radius : 1);
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
    es.BitSet = BitSet;
})(es || (es = {}));
var es;
(function (es) {
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
        ComponentList.prototype.markEntityListUnsorted = function () {
            this._isComponentListUnsorted = true;
        };
        ComponentList.prototype.add = function (component) {
            this._componentsToAdd.push(component);
        };
        ComponentList.prototype.remove = function (component) {
            if (this._componentsToRemove.contains(component))
                console.warn("You are trying to remove a Component (" + component + ") that you already removed");
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
                if (component instanceof es.RenderableComponent) {
                    this._entity.scene.removeChild(component.displayObject);
                    this._entity.scene.renderableComponents.remove(component);
                }
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component), false);
                this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
            }
        };
        ComponentList.prototype.registerAllComponents = function () {
            for (var i = 0; i < this._components.length; i++) {
                var component = this._components[i];
                if (component instanceof es.RenderableComponent) {
                    this._entity.scene.addChild(component.displayObject);
                    this._entity.scene.renderableComponents.add(component);
                }
                this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component));
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
                    if (component instanceof es.RenderableComponent) {
                        this._entity.scene.addChild(component.displayObject);
                        this._entity.scene.renderableComponents.add(component);
                    }
                    this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component));
                    this._entity.scene.entityProcessors.onComponentAdded(this._entity);
                    this._components.push(component);
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
                this._components.sort(ComponentList.compareUpdatableOrder.compare);
                this._isComponentListUnsorted = false;
            }
        };
        ComponentList.prototype.handleRemove = function (component) {
            if (component instanceof es.RenderableComponent) {
                this._entity.scene.removeChild(component.displayObject);
                this._entity.scene.renderableComponents.remove(component);
            }
            this._entity.componentBits.set(es.ComponentTypeManager.getIndexFor(component), false);
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
                var updatableComponent = this._components[i];
                if (updatableComponent.enabled &&
                    (updatableComponent.updateInterval == 1 ||
                        es.Time.frameCount % updatableComponent.updateInterval == 0))
                    updatableComponent.update();
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
        ComponentList.prototype.onEntityEnabled = function () {
            for (var i = 0; i < this._components.length; i++)
                this._components[i].onEnabled();
        };
        ComponentList.prototype.onEntityDisabled = function () {
            for (var i = 0; i < this._components.length; i++)
                this._components[i].onDisabled();
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
            this._unsortedTags = [];
            this._tempEntityList = [];
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
            this._unsortedTags.push(tag);
        };
        EntityList.prototype.add = function (entity) {
            if (this._entitiesToAdded.indexOf(entity) == -1)
                this._entitiesToAdded.push(entity);
        };
        EntityList.prototype.remove = function (entity) {
            if (!this._entitiesToRemove.contains(entity)) {
                console.warn("You are trying to remove an entity (" + entity.name + ") that you already removed");
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
            this._unsortedTags.length = 0;
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
            return this._entities.contains(entity) || this._entitiesToAdded.contains(entity);
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
                if (entity.enabled && (entity.updateInterval == 1 || es.Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        };
        EntityList.prototype.updateLists = function () {
            var _this = this;
            if (this._entitiesToRemove.length > 0) {
                var temp = this._entitiesToRemove;
                this._entitiesToRemove = this._tempEntityList;
                this._tempEntityList = temp;
                this._tempEntityList.forEach(function (entity) {
                    _this.removeFromTagList(entity);
                    _this._entities.remove(entity);
                    entity.onRemovedFromScene();
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
                        _this.addToTagList(entity);
                        _this.scene.entityProcessors.onEntityAdded(entity);
                    }
                });
                this._tempEntityList.forEach(function (entity) { return entity.onAddedToScene(); });
                this._tempEntityList.length = 0;
                this._isEntityListUnsorted = true;
            }
            if (this._isEntityListUnsorted) {
                this._entities.sort();
                this._isEntityListUnsorted = false;
            }
            if (this._unsortedTags.length > 0) {
                this._unsortedTags.forEach(function (tag) {
                    _this._entityDict.get(tag).sort();
                });
                this._unsortedTags.length = 0;
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
            this._entitiesToAdded.forEach(function (entity) {
                if (entity instanceof type)
                    list.push(entity);
            });
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
                if (processor instanceof es.EntitySystem)
                    return processor;
            }
            return null;
        };
        return EntityProcessorList;
    }());
    es.EntityProcessorList = EntityProcessorList;
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
            if (!list.contains(component)) {
                console.warn("Component renderLayer list already contains this component");
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
            return (this._timeSinceSceneLoad / interval) > ((this._timeSinceSceneLoad - this.deltaTime) / interval);
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
            this.camera = camera;
            this.renderOrder = renderOrder;
        }
        Renderer.prototype.onAddedToScene = function (scene) { };
        Renderer.prototype.unload = function () { };
        Renderer.prototype.beginRender = function (cam) { };
        Renderer.prototype.renderAfterStateCheck = function (renderable, cam) {
            renderable.render(cam);
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
    var ScreenSpaceRenderer = (function (_super) {
        __extends(ScreenSpaceRenderer, _super);
        function ScreenSpaceRenderer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ScreenSpaceRenderer.prototype.render = function (scene) {
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
    }(es.RenderableComponent));
    es.PolyLight = PolyLight;
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
        MathHelper.Epsilon = 0.00001;
        MathHelper.Rad2Deg = 57.29578;
        MathHelper.Deg2Rad = 0.0174532924;
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
        Rectangle.prototype.intersects = function (value) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        };
        Rectangle.prototype.containsRect = function (value) {
            return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
                (this.y <= value.y)) &&
                (value.y < (this.y + this.height)));
        };
        Rectangle.prototype.getHalfSize = function () {
            return new es.Vector2(this.width * 0.5, this.height * 0.5);
        };
        Rectangle.fromMinMax = function (minX, minY, maxX, maxY) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
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
                topLeft = es.Vector2Ext.transformR(topLeft, this._transformMat);
                topRight = es.Vector2Ext.transformR(topRight, this._transformMat);
                bottomLeft = es.Vector2Ext.transformR(bottomLeft, this._transformMat);
                bottomRight = es.Vector2Ext.transformR(bottomRight, this._transformMat);
                var minX = Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                var maxX = Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                var minY = Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                var maxY = Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                this.location = new es.Vector2(minX, minY);
                this.width = maxX - minX;
                this.height = maxY - minY;
            }
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
    es.Rectangle = Rectangle;
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
                var _loop_5 = function (j) {
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
                    _loop_5(j);
                }
            }
            es.ListPool.free(colliders);
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
        Collisions.isCircleToCircle = function (circleCenter1, circleRadius1, circleCenter2, circleRadius2) {
            return es.Vector2.distanceSquared(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
        };
        Collisions.isCircleToLine = function (circleCenter, radius, lineFrom, lineTo) {
            return es.Vector2.distanceSquared(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
        };
        Collisions.isCircleToPoint = function (circleCenter, radius, point) {
            return es.Vector2.distanceSquared(circleCenter, point) < radius * radius;
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
    es.Collisions = Collisions;
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
        Physics.debugDraw = function (secondsToDisplay) {
            this._spatialHash.debugDraw(secondsToDisplay, 2);
        };
        Physics.spatialHashCellSize = 100;
        Physics.allLayers = -1;
        return Physics;
    }());
    es.Physics = Physics;
})(es || (es = {}));
var es;
(function (es) {
    var Shape = (function () {
        function Shape() {
        }
        Shape.prototype.clone = function () {
            return ObjectUtils.clone(this);
        };
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
            if (this._edgeNormals == null || this._edgeNormals.length != totalEdges)
                this._edgeNormals = new Array(totalEdges);
            var p2;
            for (var i = 0; i < totalEdges; i++) {
                var p1 = this.points[i];
                if (i + 1 >= this.points.length)
                    p2 = this.points[0];
                else
                    p2 = this.points[i + 1];
                var perp = es.Vector2Ext.perpendicular(p1, p2);
                perp = es.Vector2.normalize(perp);
                this._edgeNormals[i] = perp;
            }
        };
        Polygon.buildSymmetricalPolygon = function (vertCount, radius) {
            var verts = new Array(vertCount);
            for (var i = 0; i < vertCount; i++) {
                var a = 2 * Math.PI * (i / vertCount);
                verts[i] = new es.Vector2(Math.cos(a), Math.sin(a) * radius);
            }
            return verts;
        };
        Polygon.recenterPolygonVerts = function (points) {
            var center = this.findPolygonCenter(points);
            for (var i = 0; i < points.length; i++)
                points[i] = es.Vector2.subtract(points[i], center);
        };
        Polygon.findPolygonCenter = function (points) {
            var x = 0, y = 0;
            for (var i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }
            return new es.Vector2(x / points.length, y / points.length);
        };
        Polygon.getClosestPointOnPolygonToPoint = function (points, point, distanceSquared, edgeNormal) {
            distanceSquared = Number.MAX_VALUE;
            edgeNormal = new es.Vector2(0, 0);
            var closestPoint = new es.Vector2(0, 0);
            var tempDistanceSquared;
            for (var i = 0; i < points.length; i++) {
                var j = i + 1;
                if (j == points.length)
                    j = 0;
                var closest = es.ShapeCollisions.closestPointOnLine(points[i], points[j], point);
                tempDistanceSquared = es.Vector2.distanceSquared(point, closest);
                if (tempDistanceSquared < distanceSquared) {
                    distanceSquared = tempDistanceSquared;
                    closestPoint = closest;
                    var line = es.Vector2.subtract(points[j], points[i]);
                    edgeNormal = new es.Vector2(-line.y, line.x);
                }
            }
            edgeNormal = es.Vector2Ext.normalize(edgeNormal);
            return closestPoint;
        };
        Polygon.prototype.recalculateBounds = function (collider) {
            this.center = collider.localOffset;
            if (collider.shouldColliderScaleAndRotateWithTransform) {
                var hasUnitScale = true;
                var tempMat = void 0;
                var combinedMatrix = es.Matrix2D.create().translate(-this._polygonCenter.x, -this._polygonCenter.y);
                if (collider.entity.transform.scale != es.Vector2.zero) {
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
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
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
            this.bounds.location = this.bounds.location.add(this.position);
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
        Polygon.prototype.containsPoint = function (point) {
            point = es.Vector2.subtract(point, this.position);
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
                if (other instanceof Box)
                    return this.bounds.intersects(other.bounds);
                if (other instanceof es.Circle)
                    return es.Collisions.isRectToCircle(this.bounds, other.position, other.radius);
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
                    this.center = es.MathHelper.pointOnCirlce(es.Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
                }
            }
            this.position = es.Vector2.add(collider.transform.position, this.center);
            this.bounds = new es.Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        };
        Circle.prototype.overlaps = function (other) {
            var result = new es.CollisionResult();
            if (other instanceof es.Box && other.isUnrotated)
                return es.Collisions.isRectToCircle(other.bounds, this.position, this.radius);
            if (other instanceof Circle)
                return es.Collisions.isCircleToCircle(this.position, this.radius, other.position, other.radius);
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
            this.minimumTranslationVector = es.Vector2.zero;
            this.normal = es.Vector2.zero;
            this.point = es.Vector2.zero;
        }
        CollisionResult.prototype.invertResult = function () {
            this.minimumTranslationVector = es.Vector2.negate(this.minimumTranslationVector);
            this.normal = es.Vector2.negate(this.normal);
        };
        return CollisionResult;
    }());
    es.CollisionResult = CollisionResult;
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
            var distanceSquared = 0;
            var closestPoint = es.Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle, distanceSquared, result.normal);
            var circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;
            var mtv;
            if (circleCenterInsidePoly) {
                mtv = es.Vector2.multiply(result.normal, new es.Vector2(Math.sqrt(distanceSquared) - circle.radius));
            }
            else {
                if (distanceSquared == 0) {
                    mtv = es.Vector2.multiply(result.normal, new es.Vector2(circle.radius));
                }
                else {
                    var distance = Math.sqrt(distanceSquared);
                    mtv = es.Vector2.multiply(new es.Vector2(-es.Vector2.subtract(poly2Circle, closestPoint)), new es.Vector2((circle.radius - distanceSquared) / distance));
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
                result.normal = es.Vector2Ext.normalize(result.normal);
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
        ShapeCollisions.closestPointOnLine = function (lineA, lineB, closestTo) {
            var v = es.Vector2.subtract(lineB, lineA);
            var w = es.Vector2.subtract(closestTo, lineA);
            var t = es.Vector2.dot(w, v) / es.Vector2.dot(v, v);
            t = es.MathHelper.clamp(t, 0, 1);
            return es.Vector2.add(lineA, es.Vector2.multiply(v, new es.Vector2(t, t)));
        };
        ShapeCollisions.pointToPoly = function (point, poly, result) {
            if (poly.containsPoint(point)) {
                var distanceSquared = 0;
                var closestPoint = es.Polygon.getClosestPointOnPolygonToPoint(poly.points, es.Vector2.subtract(point, poly.position), distanceSquared, result.normal);
                result.minimumTranslationVector = es.Vector2.multiply(result.normal, new es.Vector2(Math.sqrt(distanceSquared), Math.sqrt(distanceSquared)));
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
        return ShapeCollisions;
    }());
    es.ShapeCollisions = ShapeCollisions;
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
                    if (c.indexOf(collider) == -1)
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
                        console.error("removing Collider [" + collider + "] from a cell that it is not present in");
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
        SpatialHash.prototype.debugDrawCellDetails = function (x, y, cellCount, secondsToDisplay, textScale) {
            if (secondsToDisplay === void 0) { secondsToDisplay = 0.5; }
            if (textScale === void 0) { textScale = 1; }
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
                        if (collider == excludeCollider || !es.Flags.isFlagSet(layerMask, collider.physicsLayer))
                            continue;
                        if (bounds.intersects(collider.bounds)) {
                            if (this._tempHashSet.indexOf(collider) == -1)
                                this._tempHashSet.push(collider);
                        }
                    }
                }
            }
            return this._tempHashSet;
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
        return SpatialHash;
    }());
    es.SpatialHash = SpatialHash;
    var NumberDictionary = (function () {
        function NumberDictionary() {
            this._store = new Map();
        }
        NumberDictionary.prototype.getKey = function (x, y) {
            return Long.fromNumber(x).shiftLeft(32).or(Long.fromNumber(y, true)).toString();
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
    es.NumberDictionary = NumberDictionary;
    var RaycastResultParser = (function () {
        function RaycastResultParser() {
        }
        return RaycastResultParser;
    }());
    es.RaycastResultParser = RaycastResultParser;
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
        var uObj = new Object();
        var newAry = [];
        var count = ary.length;
        for (var j = 0; j < count; ++j) {
            if (!uObj[ary[j]]) {
                uObj[ary[j]] = new Object();
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
var Base64Utils = (function () {
    function Base64Utils() {
    }
    Base64Utils._utf8_encode = function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    Base64Utils.decode = function (input, isNotStr) {
        if (isNotStr === void 0) { isNotStr = true; }
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = this.getConfKey(input);
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = this._keyAll.indexOf(input.charAt(i++));
            enc2 = this._keyAll.indexOf(input.charAt(i++));
            enc3 = this._keyAll.indexOf(input.charAt(i++));
            enc4 = this._keyAll.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                if (chr2 == 0) {
                    if (isNotStr)
                        output = output + String.fromCharCode(chr2);
                }
                else {
                    output = output + String.fromCharCode(chr2);
                }
            }
            if (enc4 != 64) {
                if (chr3 == 0) {
                    if (isNotStr)
                        output = output + String.fromCharCode(chr3);
                }
                else {
                    output = output + String.fromCharCode(chr3);
                }
            }
        }
        output = this._utf8_decode(output);
        return output;
    };
    Base64Utils._utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c = 0;
        var c1 = 0;
        var c2 = 0;
        var c3 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    };
    Base64Utils.getConfKey = function (key) {
        return key.slice(1, key.length);
    };
    Base64Utils._keyNum = "0123456789+/";
    Base64Utils._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    Base64Utils._keyAll = Base64Utils._keyNum + Base64Utils._keyStr;
    Base64Utils.encode = function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = this._utf8_encode(input);
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
            output = output +
                this._keyAll.charAt(enc1) + this._keyAll.charAt(enc2) +
                this._keyAll.charAt(enc3) + this._keyAll.charAt(enc4);
        }
        return this._keyStr.charAt(Math.floor((Math.random() * this._keyStr.length))) + output;
    };
    return Base64Utils;
}());
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
        DrawUtils.drawLine = function (shape, start, end, color, thickness) {
            if (thickness === void 0) { thickness = 1; }
            this.drawLineAngle(shape, start, es.MathHelper.angleBetweenVectors(start, end), es.Vector2.distance(start, end), color, thickness);
        };
        DrawUtils.drawLineAngle = function (shape, start, radians, length, color, thickness) {
            if (thickness === void 0) { thickness = 1; }
            shape.graphics.beginFill(color);
            shape.graphics.drawRect(start.x, start.y, 1, 1);
            shape.graphics.endFill();
            shape.scaleX = length;
            shape.scaleY = thickness;
            shape.$anchorOffsetX = 0;
            shape.$anchorOffsetY = 0;
            shape.rotation = radians;
        };
        DrawUtils.drawHollowRect = function (shape, rect, color, thickness) {
            if (thickness === void 0) { thickness = 1; }
            this.drawHollowRectR(shape, rect.x, rect.y, rect.width, rect.height, color, thickness);
        };
        DrawUtils.drawHollowRectR = function (shape, x, y, width, height, color, thickness) {
            if (thickness === void 0) { thickness = 1; }
            var tl = new es.Vector2(x, y).round();
            var tr = new es.Vector2(x + width, y).round();
            var br = new es.Vector2(x + width, y + height).round();
            var bl = new es.Vector2(x, y + height).round();
            this.drawLine(shape, tl, tr, color, thickness);
            this.drawLine(shape, tr, br, color, thickness);
            this.drawLine(shape, br, bl, color, thickness);
            this.drawLine(shape, bl, tl, color, thickness);
        };
        DrawUtils.drawPixel = function (shape, position, color, size) {
            if (size === void 0) { size = 1; }
            var destRect = new es.Rectangle(position.x, position.y, size, size);
            if (size != 1) {
                destRect.x -= size * 0.5;
                destRect.y -= size * 0.5;
            }
            shape.graphics.beginFill(color);
            shape.graphics.drawRect(destRect.x, destRect.y, destRect.width, destRect.height);
            shape.graphics.endFill();
        };
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
        return GlobalManager;
    }());
    es.GlobalManager = GlobalManager;
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
            var scaledPos = new es.Vector2(position.x - this._resolutionOffset.x, position.y - this._resolutionOffset.y);
            return es.Vector2.multiply(scaledPos, this.resolutionScale);
        };
        Input._init = false;
        Input._previousTouchState = new TouchState();
        Input._gameTouchs = [];
        Input._resolutionOffset = new es.Vector2();
        Input._resolutionScale = es.Vector2.one;
        Input._touchIndex = 0;
        Input._totalTouchCount = 0;
        return Input;
    }());
    es.Input = Input;
})(es || (es = {}));
var KeyboardUtils = (function () {
    function KeyboardUtils() {
    }
    KeyboardUtils.init = function () {
        this.keyDownDict = {};
        this.keyUpDict = {};
        document.addEventListener("keydown", this.onKeyDonwHander);
        document.addEventListener("keyup", this.onKeyUpHander);
    };
    KeyboardUtils.onKeyDonwHander = function (event) {
        if (!this.keyDownDict)
            return;
        var key = this.keyCodeToString(event.keyCode);
        var o = this.keyDownDict[key];
        if (o) {
            var fun = o["fun"];
            var thisObj = o["thisObj"];
            var args = o["args"];
            fun.apply(thisObj, args);
        }
    };
    KeyboardUtils.onKeyUpHander = function (event) {
        if (!this.keyUpDict)
            return;
        var key = this.keyCodeToString(event.keyCode);
        var o = this.keyUpDict[key];
        if (o) {
            var fun = o["fun"];
            var thisObj = o["thisObj"];
            var args = o["args"];
            fun.apply(thisObj, args);
        }
    };
    KeyboardUtils.registerKey = function (key, fun, thisObj, type) {
        if (type === void 0) { type = 0; }
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var keyDict = type ? this.keyUpDict : this.keyDownDict;
        keyDict[key] = { "fun": fun, args: args, "thisObj": thisObj };
    };
    KeyboardUtils.unregisterKey = function (key, type) {
        if (type === void 0) { type = 0; }
        var keyDict = type ? this.keyUpDict : this.keyDownDict;
        delete keyDict[key];
    };
    KeyboardUtils.keyCodeToString = function (keyCode) {
        switch (keyCode) {
            case 8:
                return this.BACK_SPACE;
            case 9:
                return this.TAB;
            case 13:
                return this.ENTER;
            case 16:
                return this.SHIFT;
            case 17:
                return this.CTRL;
            case 19:
                return this.PAUSE_BREAK;
            case 20:
                return this.CAPS_LOCK;
            case 27:
                return this.ESC;
            case 32:
                return this.SPACE;
            case 33:
                return this.PAGE_UP;
            case 34:
                return this.PAGE_DOWN;
            case 35:
                return this.END;
            case 36:
                return this.HOME;
            case 37:
                return this.LEFT;
            case 38:
                return this.UP;
            case 39:
                return this.RIGHT;
            case 40:
                return this.DOWN;
            case 45:
                return this.INSERT;
            case 46:
                return this.DELETE;
            case 91:
                return this.WINDOWS;
            case 112:
                return this.F1;
            case 113:
                return this.F2;
            case 114:
                return this.F3;
            case 115:
                return this.F4;
            case 116:
                return this.F5;
            case 117:
                return this.F6;
            case 118:
                return this.F7;
            case 119:
                return this.F8;
            case 120:
                return this.F9;
            case 122:
                return this.F11;
            case 123:
                return this.F12;
            case 144:
                return this.NUM_LOCK;
            case 145:
                return this.SCROLL_LOCK;
            default:
                return String.fromCharCode(keyCode);
        }
    };
    KeyboardUtils.destroy = function () {
        this.keyDownDict = null;
        this.keyUpDict = null;
        document.removeEventListener("keydown", this.onKeyDonwHander);
        document.removeEventListener("keyup", this.onKeyUpHander);
    };
    KeyboardUtils.TYPE_KEY_DOWN = 0;
    KeyboardUtils.TYPE_KEY_UP = 1;
    KeyboardUtils.A = "A";
    KeyboardUtils.B = "B";
    KeyboardUtils.C = "C";
    KeyboardUtils.D = "D";
    KeyboardUtils.E = "E";
    KeyboardUtils.F = "F";
    KeyboardUtils.G = "G";
    KeyboardUtils.H = "H";
    KeyboardUtils.I = "I";
    KeyboardUtils.J = "J";
    KeyboardUtils.K = "K";
    KeyboardUtils.L = "L";
    KeyboardUtils.M = "M";
    KeyboardUtils.N = "N";
    KeyboardUtils.O = "O";
    KeyboardUtils.P = "P";
    KeyboardUtils.Q = "Q";
    KeyboardUtils.R = "R";
    KeyboardUtils.S = "S";
    KeyboardUtils.T = "T";
    KeyboardUtils.U = "U";
    KeyboardUtils.V = "V";
    KeyboardUtils.W = "W";
    KeyboardUtils.X = "X";
    KeyboardUtils.Y = "Y";
    KeyboardUtils.Z = "Z";
    KeyboardUtils.ESC = "Esc";
    KeyboardUtils.F1 = "F1";
    KeyboardUtils.F2 = "F2";
    KeyboardUtils.F3 = "F3";
    KeyboardUtils.F4 = "F4";
    KeyboardUtils.F5 = "F5";
    KeyboardUtils.F6 = "F6";
    KeyboardUtils.F7 = "F7";
    KeyboardUtils.F8 = "F8";
    KeyboardUtils.F9 = "F9";
    KeyboardUtils.F10 = "F10";
    KeyboardUtils.F11 = "F11";
    KeyboardUtils.F12 = "F12";
    KeyboardUtils.NUM_1 = "1";
    KeyboardUtils.NUM_2 = "2";
    KeyboardUtils.NUM_3 = "3";
    KeyboardUtils.NUM_4 = "4";
    KeyboardUtils.NUM_5 = "5";
    KeyboardUtils.NUM_6 = "6";
    KeyboardUtils.NUM_7 = "7";
    KeyboardUtils.NUM_8 = "8";
    KeyboardUtils.NUM_9 = "9";
    KeyboardUtils.NUM_0 = "0";
    KeyboardUtils.TAB = "Tab";
    KeyboardUtils.CTRL = "Ctrl";
    KeyboardUtils.ALT = "Alt";
    KeyboardUtils.SHIFT = "Shift";
    KeyboardUtils.CAPS_LOCK = "Caps Lock";
    KeyboardUtils.ENTER = "Enter";
    KeyboardUtils.SPACE = "Space";
    KeyboardUtils.BACK_SPACE = "Back Space";
    KeyboardUtils.INSERT = "Insert";
    KeyboardUtils.DELETE = "Page Down";
    KeyboardUtils.HOME = "Home";
    KeyboardUtils.END = "Page Down";
    KeyboardUtils.PAGE_UP = "Page Up";
    KeyboardUtils.PAGE_DOWN = "Page Down";
    KeyboardUtils.LEFT = "Left";
    KeyboardUtils.RIGHT = "Right";
    KeyboardUtils.UP = "Up";
    KeyboardUtils.DOWN = "Down";
    KeyboardUtils.PAUSE_BREAK = "Pause Break";
    KeyboardUtils.NUM_LOCK = "Num Lock";
    KeyboardUtils.SCROLL_LOCK = "Scroll Lock";
    KeyboardUtils.WINDOWS = "Windows";
    return KeyboardUtils;
}());
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
var THREAD_ID = Math.floor(Math.random() * 1000) + "-" + Date.now();
var setItem = egret.localStorage.setItem.bind(localStorage);
var getItem = egret.localStorage.getItem.bind(localStorage);
var removeItem = egret.localStorage.removeItem.bind(localStorage);
var nextTick = function (fn) {
    setTimeout(fn, 0);
};
var LockUtils = (function () {
    function LockUtils(key) {
        this._keyX = "mutex_key_" + key + "_X";
        this._keyY = "mutex_key_" + key + "_Y";
    }
    LockUtils.prototype.lock = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fn = function () {
                setItem(_this._keyX, THREAD_ID);
                if (!getItem(_this._keyY) === null) {
                    nextTick(fn);
                }
                setItem(_this._keyY, THREAD_ID);
                if (getItem(_this._keyX) !== THREAD_ID) {
                    setTimeout(function () {
                        if (getItem(_this._keyY) !== THREAD_ID) {
                            nextTick(fn);
                            return;
                        }
                        resolve();
                        removeItem(_this._keyY);
                    }, 10);
                }
                else {
                    resolve();
                    removeItem(_this._keyY);
                }
            };
            fn();
        });
    };
    return LockUtils;
}());
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
    RandomUtils._randomCompare = function (a, b) {
        return (this.random() > .5) ? 1 : -1;
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
    return RandomUtils;
}());
var es;
(function (es) {
    var RectangleExt = (function () {
        function RectangleExt() {
        }
        RectangleExt.union = function (first, point) {
            var rect = new es.Rectangle(point.x, point.y, 0, 0);
            var result = new es.Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, result.bottom) - result.y;
            return result;
        };
        return RectangleExt;
    }());
    es.RectangleExt = RectangleExt;
})(es || (es = {}));
var es;
(function (es) {
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
        Triangulator.testPointTriangle = function (point, a, b, c) {
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, a), es.Vector2.subtract(b, a)) < 0)
                return false;
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, b), es.Vector2.subtract(c, b)) < 0)
                return false;
            if (es.Vector2Ext.cross(es.Vector2.subtract(point, c), es.Vector2.subtract(a, c)) < 0)
                return false;
            return true;
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
        Vector2Ext.cross = function (u, v) {
            return u.y * v.x - u.x * v.y;
        };
        Vector2Ext.perpendicular = function (first, second) {
            return new es.Vector2(-1 * (second.y - first.y), second.x - first.x);
        };
        Vector2Ext.normalize = function (vec) {
            var magnitude = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
            if (magnitude > es.MathHelper.Epsilon) {
                vec = es.Vector2.divide(vec, new es.Vector2(magnitude));
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
            return new es.Vector2(x, y);
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
            this._frameKey = 'frame';
            this._logKey = 'log';
            this.markers = [];
            this.stopwacth = new stopwatch.Stopwatch();
            this._markerNameToIdMap = new Map();
            this.showLog = false;
            this._logs = new Array(2);
            for (var i = 0; i < this._logs.length; ++i)
                this._logs[i] = new FrameLog();
            this.sampleFrames = this.targetSampleFrames = 1;
            this.width = es.Core.graphicsDevice.viewport.width * 0.8;
            es.Core.emitter.addObserver(es.CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
            this.onGraphicsDeviceReset();
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
        TimeRuler.prototype.onGraphicsDeviceReset = function () {
            var layout = new es.Layout();
            this._position = layout.place(new es.Vector2(this.width, TimeRuler.barHeight), 0, 0.01, es.Alignment.bottomCenter).location;
        };
        TimeRuler.prototype.startFrame = function () {
            var _this = this;
            var lock = new LockUtils(this._frameKey);
            lock.lock().then(function () {
                _this._updateCount = parseInt(egret.localStorage.getItem(_this._frameKey), 10);
                if (isNaN(_this._updateCount))
                    _this._updateCount = 0;
                var count = _this._updateCount;
                count += 1;
                egret.localStorage.setItem(_this._frameKey, count.toString());
                if (_this.enabled && (1 < count && count < TimeRuler.maxSampleFrames))
                    return;
                _this._prevLog = _this._logs[_this.frameCount++ & 0x1];
                _this._curLog = _this._logs[_this.frameCount & 0x1];
                var endFrameTime = _this.stopwacth.getTime();
                for (var barIndex = 0; barIndex < _this._prevLog.bars.length; ++barIndex) {
                    var prevBar = _this._prevLog.bars[barIndex];
                    var nextBar = _this._curLog.bars[barIndex];
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
                        var m = _this.markers[markerId];
                        m.logs[barIndex].color = prevBar.markers[markerIdx].color;
                        if (!m.logs[barIndex].initialized) {
                            m.logs[barIndex].min = duration;
                            m.logs[barIndex].max = duration;
                            m.logs[barIndex].avg = duration;
                            m.logs[barIndex].initialized = true;
                        }
                        else {
                            m.logs[barIndex].min = Math.min(m.logs[barIndex].min, duration);
                            m.logs[barIndex].max = Math.min(m.logs[barIndex].max, duration);
                            m.logs[barIndex].avg += duration;
                            m.logs[barIndex].avg *= 0.5;
                            if (m.logs[barIndex].samples++ >= TimeRuler.logSnapDuration) {
                                m.logs[barIndex].snapMin = m.logs[barIndex].min;
                                m.logs[barIndex].snapMax = m.logs[barIndex].max;
                                m.logs[barIndex].snapAvg = m.logs[barIndex].avg;
                                m.logs[barIndex].samples = 0;
                            }
                        }
                    }
                    nextBar.markCount = prevBar.nestCount;
                    nextBar.nestCount = prevBar.nestCount;
                }
                _this.stopwacth.reset();
                _this.stopwacth.start();
            });
        };
        TimeRuler.prototype.beginMark = function (markerName, color, barIndex) {
            var _this = this;
            if (barIndex === void 0) { barIndex = 0; }
            var lock = new LockUtils(this._frameKey);
            lock.lock().then(function () {
                if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                    throw new Error("barIndex argument out of range");
                var bar = _this._curLog.bars[barIndex];
                if (bar.markCount >= TimeRuler.maxSamples) {
                    throw new Error("exceeded sample count. either set larger number to timeruler.maxsaple or lower sample count");
                }
                if (bar.nestCount >= TimeRuler.maxNestCall) {
                    throw new Error("exceeded nest count. either set larger number to timeruler.maxnestcall or lower nest calls");
                }
                var markerId = _this._markerNameToIdMap.get(markerName);
                if (isNaN(markerId)) {
                    markerId = _this.markers.length;
                    _this._markerNameToIdMap.set(markerName, markerId);
                }
                bar.markerNests[bar.nestCount++] = bar.markCount;
                bar.markers[bar.markCount].markerId = markerId;
                bar.markers[bar.markCount].color = color;
                bar.markers[bar.markCount].beginTime = _this.stopwacth.getTime();
                bar.markers[bar.markCount].endTime = -1;
            });
        };
        TimeRuler.prototype.endMark = function (markerName, barIndex) {
            var _this = this;
            if (barIndex === void 0) { barIndex = 0; }
            var lock = new LockUtils(this._frameKey);
            lock.lock().then(function () {
                if (barIndex < 0 || barIndex >= TimeRuler.maxBars)
                    throw new Error("barIndex argument out of range");
                var bar = _this._curLog.bars[barIndex];
                if (bar.nestCount <= 0) {
                    throw new Error("call beginMark method before calling endMark method");
                }
                var markerId = _this._markerNameToIdMap.get(markerName);
                if (isNaN(markerId)) {
                    throw new Error("Marker " + markerName + " is not registered. Make sure you specifed same name as you used for beginMark method");
                }
                var markerIdx = bar.markerNests[--bar.nestCount];
                if (bar.markers[markerIdx].markerId != markerId) {
                    throw new Error("Incorrect call order of beginMark/endMark method. beginMark(A), beginMark(B), endMark(B), endMark(A) But you can't called it like beginMark(A), beginMark(B), endMark(A), endMark(B).");
                }
                bar.markers[markerIdx].endTime = _this.stopwacth.getTime();
            });
        };
        TimeRuler.prototype.getAverageTime = function (barIndex, markerName) {
            if (barIndex < 0 || barIndex >= TimeRuler.maxBars) {
                throw new Error("barIndex argument out of range");
            }
            var result = 0;
            var markerId = this._markerNameToIdMap.get(markerName);
            if (markerId) {
                result = this.markers[markerId].logs[barIndex].avg;
            }
            return result;
        };
        TimeRuler.prototype.resetLog = function () {
            var _this = this;
            var lock = new LockUtils(this._logKey);
            lock.lock().then(function () {
                var count = parseInt(egret.localStorage.getItem(_this._logKey), 10);
                count += 1;
                egret.localStorage.setItem(_this._logKey, count.toString());
                _this.markers.forEach(function (markerInfo) {
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
            });
        };
        TimeRuler.prototype.render = function (position, width) {
            if (position === void 0) { position = this._position; }
            if (width === void 0) { width = this.width; }
            egret.localStorage.setItem(this._frameKey, "0");
            if (!this.showLog)
                return;
            var height = 0;
            var maxTime = 0;
            this._prevLog.bars.forEach(function (bar) {
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
                this.sampleFrames = Math.max(this.targetSampleFrames, (maxTime / frameSpan) + 1);
                this._frameAdjust = 0;
            }
            var msToPs = width / sampleSpan;
            var startY = position.y - (height - TimeRuler.barHeight);
            var y = startY;
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
