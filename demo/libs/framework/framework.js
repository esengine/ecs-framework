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
            new Point(1, 0),
            new Point(0, -1),
            new Point(-1, 0),
            new Point(0, 1)
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
            var next = new Point(node.x + dir.x, node.y + dir.y);
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
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
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
            var next = new Point(node.x + dir.x, node.y + dir.y);
            if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                _this._neighbors.push(next);
        });
        return this._neighbors;
    };
    UnweightedGridGraph.prototype.search = function (start, goal) {
        return BreadthFirstPathfinder.search(this, start, goal);
    };
    UnweightedGridGraph.CARDINAL_DIRS = [
        new Point(1, 0),
        new Point(0, -1),
        new Point(-1, 0),
        new Point(0, -1)
    ];
    UnweightedGridGraph.COMPASS_DIRS = [
        new Point(1, 0),
        new Point(1, -1),
        new Point(0, -1),
        new Point(-1, -1),
        new Point(-1, 0),
        new Point(-1, 1),
        new Point(0, 1),
        new Point(1, 1),
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
            var next = new Point(node.x + dir.x, node.y + dir.y);
            if (_this.isNodeInBounds(next) && _this.isNodePassable(next))
                _this._neighbors.push(next);
        });
        return this._neighbors;
    };
    WeightedGridGraph.prototype.cost = function (from, to) {
        return this.weightedNodes.find(function (t) { return JSON.stringify(t) == JSON.stringify(to); }) ? this.weightedNodeWeight : this.defaultWeight;
    };
    WeightedGridGraph.CARDINAL_DIRS = [
        new Point(1, 0),
        new Point(0, -1),
        new Point(-1, 0),
        new Point(0, 1)
    ];
    WeightedGridGraph.COMPASS_DIRS = [
        new Point(1, 0),
        new Point(1, -1),
        new Point(0, -1),
        new Point(-1, -1),
        new Point(-1, 0),
        new Point(-1, 1),
        new Point(0, 1),
        new Point(1, 1),
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
var Component = (function () {
    function Component() {
        this._enabled = true;
        this.updateInterval = 1;
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
    Component.prototype.onAddedToEntity = function () {
    };
    Component.prototype.onRemovedFromEntity = function () {
    };
    Component.prototype.onEnabled = function () {
    };
    Component.prototype.onDisabled = function () {
    };
    Component.prototype.onEntityTransformChanged = function (comp) {
    };
    Component.prototype.update = function () {
    };
    Component.prototype.bind = function (displayRender) {
        this.displayRender = displayRender;
        return this;
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
}());
var Entity = (function () {
    function Entity(name) {
        this._updateOrder = 0;
        this._enabled = true;
        this._tag = 0;
        this.name = name;
        this.transform = new Transform(this);
        this.components = new ComponentList(this);
        this.id = Entity._idGenerator++;
        this.componentBits = new BitSet();
    }
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
    Object.defineProperty(Entity.prototype, "position", {
        get: function () {
            return this.transform.position;
        },
        set: function (value) {
            this.transform.setPosition(value);
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
            return this.transform.scale;
        },
        set: function (value) {
            this.transform.setScale(value);
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
    Object.defineProperty(Entity.prototype, "isDestoryed", {
        get: function () {
            return this._isDestoryed;
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
        for (var i = 0; i < this.transform.childCount; i++) {
            this.transform.getChild(i).entity.attachToScene(newScene);
        }
    };
    Entity.prototype.detachFromScene = function () {
        this.scene.entities.remove(this);
        this.components.deregisterAllComponents();
        for (var i = 0; i < this.transform.childCount; i++)
            this.transform.getChild(i).entity.detachFromScene();
    };
    Entity.prototype.addComponent = function (component) {
        component.entity = this;
        this.components.add(component);
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
        this.transform.updateTransform();
    };
    Entity.prototype.onAddedToScene = function () {
    };
    Entity.prototype.onRemovedFromScene = function () {
        if (this._isDestoryed)
            this.components.remove;
    };
    Entity.prototype.onTransformChanged = function (comp) {
        this.components.onEntityTransformChanged(comp);
    };
    Entity.prototype.destory = function () {
        this._isDestoryed = true;
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
        displayObject.stage.addChild(_this);
        _this._projectionMatrix = new Matrix2D(0, 0, 0, 0, 0, 0);
        _this.entityProcessors = new EntityProcessorList();
        _this.entities = new EntityList(_this);
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
        this.entities.add(entity);
        entity.scene = this;
        for (var i = 0; i < entity.transform.childCount; i++)
            this.addEntity(entity.transform.getChild(i).entity);
        return entity;
    };
    Scene.prototype.destroyAllEntities = function () {
        for (var i = 0; i < this.entities.count; i++) {
            this.entities.buffer[i].destory();
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
    Scene.prototype.setActive = function () {
        SceneManager.setActiveScene(this);
        return this;
    };
    Scene.prototype.initialize = function () {
        this.camera = this.createEntity("camera").addComponent(new Camera());
        if (this.entityProcessors)
            this.entityProcessors.begin();
    };
    Scene.prototype.onActive = function () {
    };
    Scene.prototype.onDeactive = function () {
    };
    Scene.prototype.update = function () {
        Time.update(egret.getTimer());
        this.entities.updateLists();
        if (this.entityProcessors)
            this.entityProcessors.update();
        this.entities.update();
        if (this.entityProcessors)
            this.entityProcessors.lateUpdate();
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
        this.entities.removeAllEntities();
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
var DirtyType;
(function (DirtyType) {
    DirtyType[DirtyType["clean"] = 0] = "clean";
    DirtyType[DirtyType["positionDirty"] = 1] = "positionDirty";
    DirtyType[DirtyType["scaleDirty"] = 2] = "scaleDirty";
    DirtyType[DirtyType["rotationDirty"] = 3] = "rotationDirty";
})(DirtyType || (DirtyType = {}));
var ComponentTransform;
(function (ComponentTransform) {
    ComponentTransform[ComponentTransform["position"] = 0] = "position";
    ComponentTransform[ComponentTransform["scale"] = 1] = "scale";
    ComponentTransform[ComponentTransform["rotation"] = 2] = "rotation";
})(ComponentTransform || (ComponentTransform = {}));
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
    Object.defineProperty(Transform.prototype, "worldInverseTransform", {
        get: function () {
            this.updateTransform();
            if (this._worldInverseDirty) {
                this._worldInverseTransform = Matrix2D.invert(this._worldTransform, this._worldInverseTransform);
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
                    this._worldInverseTransform = Matrix2D.identity;
                }
                else {
                    this.parent.updateTransform();
                    this._worldToLocalTransform = Matrix2D.invert(this.parent._worldTransform, this._worldToLocalTransform);
                }
                this._worldToLocalDirty = false;
            }
            return this._worldToLocalTransform;
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
    Object.defineProperty(Transform.prototype, "rotationDegrees", {
        get: function () {
            return MathHelper.toDegrees(this._rotation);
        },
        set: function (value) {
            this.setRotation(MathHelper.toRadians(value));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transform.prototype, "localRotationDegrees", {
        get: function () {
            return MathHelper.toDegrees(this._localRotation);
        },
        set: function (value) {
            this.localRotation = MathHelper.toRadians(value);
        },
        enumerable: true,
        configurable: true
    });
    Transform.prototype.setLocalScale = function (scale) {
        this._localScale = scale;
        this._localDirty = this._positionDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.scaleDirty);
        return this;
    };
    Transform.prototype.setScale = function (scale) {
        this._scale = scale;
        if (this.parent) {
            this.localScale = Vector2.divide(scale, this.parent._scale);
        }
        else {
            this.localScale = scale;
        }
        for (var i = 0; i < this.entity.components.buffer.length; i++) {
            var component = this.entity.components.buffer[i];
            if (component.displayRender) {
                component.displayRender.scaleX = this.scale.x;
                component.displayRender.scaleY = this.scale.y;
            }
        }
        return this;
    };
    Transform.prototype.setLocalRotationDegrees = function (degrees) {
        return this.setLocalRotation(MathHelper.toRadians(degrees));
    };
    Transform.prototype.setLocalRotation = function (radians) {
        this._localRotation = radians;
        this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.rotationDirty);
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
        for (var i = 0; i < this.entity.components.buffer.length; i++) {
            var component = this.entity.components.buffer[i];
            if (component.displayRender) {
                component.displayRender.rotation = this.rotation;
            }
        }
        return this;
    };
    Transform.prototype.setRotationDegrees = function (degrees) {
        return this.setRotation(MathHelper.toRadians(degrees));
    };
    Transform.prototype.setLocalPosition = function (localPosition) {
        if (localPosition == this._localPosition)
            return this;
        this._localPosition = localPosition;
        this._localDirty = this._positionDirty = this._localPositionDirty = this._localRotationDirty = this._localScaleDirty = true;
        this.setDirty(DirtyType.positionDirty);
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
        for (var i = 0; i < this.entity.components.buffer.length; i++) {
            var component = this.entity.components.buffer[i];
            if (component.displayRender) {
                component.displayRender.x = this.entity.scene.camera.transformMatrix.m31 + this.position.x;
                component.displayRender.y = this.entity.scene.camera.transformMatrix.m32 + this.position.y;
            }
        }
        return this;
    };
    Transform.prototype.setDirty = function (dirtyFlagType) {
        if ((this._hierachyDirty & dirtyFlagType) == 0) {
            this._hierachyDirty |= dirtyFlagType;
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
            if (this._children == null)
                this._children = [];
            for (var i = 0; i < this._children.length; i++) {
                this._children[i].setDirty(dirtyFlagType);
            }
        }
    };
    Transform.prototype.updateTransform = function () {
        if (this._hierachyDirty != DirtyType.clean) {
            if (this.parent)
                this.parent.updateTransform();
            if (this._localDirty) {
                if (this._localPositionDirty) {
                    this._translationMatrix = Matrix2D.createTranslation(this._localPosition.x, this._localPosition.y);
                    this._localPositionDirty = false;
                }
                if (this._localRotationDirty) {
                    this._rotationMatrix = Matrix2D.createRotation(this._localRotation);
                    this._localRotationDirty = false;
                }
                if (this._localScaleDirty) {
                    this._scaleMatrix = Matrix2D.createScale(this._localScale.x, this._localScale.y);
                    this._localScaleDirty = false;
                }
                this._localTransform = Matrix2D.multiply(this._scaleMatrix, this._rotationMatrix);
                this._localTransform = Matrix2D.multiply(this._localTransform, this._translationMatrix);
                if (!this.parent) {
                    this._worldTransform = this._localTransform;
                    this._rotation = this._localRotation;
                    this._scale = this._localScale;
                    this._worldInverseDirty = true;
                }
                this._localDirty = false;
            }
            if (this.parent) {
                this._worldTransform = Matrix2D.multiply(this._localTransform, this.parent._worldTransform);
                this._rotation = this._localRotation + this.parent._rotation;
                this._scale = Vector2.multiply(this.parent._scale, this._localScale);
                this._worldInverseDirty = true;
            }
            this._worldToLocalDirty = true;
            this._positionDirty = true;
            this._hierachyDirty = DirtyType.clean;
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
        _this._minimumZoom = 0.3;
        _this._maximumZoom = 3;
        _this._areMatrixesDirty = true;
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
                this._areMatrixesDirty = true;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "transformMatrix", {
        get: function () {
            this.updateMatrixes();
            return this._transformMatrix;
        },
        enumerable: true,
        configurable: true
    });
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
        this._areMatrixesDirty = true;
        return this;
    };
    Camera.prototype.initialize = function () {
    };
    Camera.prototype.update = function () {
        var _this = this;
        SceneManager.getActiveScene().entities.buffer.forEach(function (entity) { return entity.components.buffer.forEach(function (component) {
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
        if (!this._areMatrixesDirty)
            return;
        var tempMat;
        this._transformMatrix = Matrix2D.createTranslation(-this.entity.transform.position.x, -this.entity.transform.position.y);
        if (this._zoom != 1) {
            tempMat = Matrix2D.createScale(this._zoom, this._zoom);
            this._transformMatrix = Matrix2D.multiply(this._transformMatrix, tempMat);
        }
        tempMat = Matrix2D.createTranslation(this._origin.x, this._origin.y, tempMat);
        this._transformMatrix = Matrix2D.multiply(this._transformMatrix, tempMat);
        this._inverseTransformMatrix = Matrix2D.invert(this._transformMatrix);
        this._areMatrixesDirty = false;
    };
    Camera.prototype.destory = function () {
    };
    return Camera;
}(Component));
var Mesh = (function (_super) {
    __extends(Mesh, _super);
    function Mesh() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Mesh.prototype.initialize = function () {
    };
    Mesh.prototype.setVertPosition = function (positions) {
        var createVerts = !this._verts || this._verts.length != positions.length;
        if (createVerts)
            this._verts = new Array(positions.length);
        for (var i = 0; i < this._verts.length; i++) {
            this._verts[i] = new VertexPosition(positions[i]);
        }
        return this;
    };
    Mesh.prototype.setTriangles = function (triangles) {
        this._primitiveCount = triangles.length / 3;
        this._triangles = triangles;
        return this;
    };
    Mesh.prototype.recalculateBounds = function () {
        this._topLeftVertPosition = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
        var max = new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
        for (var i = 0; i < this._verts.length; i++) {
            this._topLeftVertPosition.x = Math.min(this._topLeftVertPosition.x, this._verts[i].position.x);
            this._topLeftVertPosition.y = Math.min(this._topLeftVertPosition.y, this._verts[i].position.y);
            max.x = Math.max(max.x, this._verts[i].position.x);
            max.y = Math.max(max.y, this._verts[i].position.y);
        }
        this._width = max.x - this._topLeftVertPosition.x;
        this._height = max.y - this._topLeftVertPosition.y;
        return this;
    };
    Mesh.prototype.render = function () {
    };
    return Mesh;
}(Component));
var VertexPosition = (function () {
    function VertexPosition(position) {
        this.position = position;
    }
    return VertexPosition;
}());
var PolygonMesh = (function (_super) {
    __extends(PolygonMesh, _super);
    function PolygonMesh(points, arePointsCCW) {
        if (arePointsCCW === void 0) { arePointsCCW = true; }
        var _this = _super.call(this) || this;
        var triangulator = new Triangulator();
        triangulator.triangulate(points, arePointsCCW);
        _this.setVertPosition(points);
        _this.setTriangles(triangulator.triangleIndices);
        _this.recalculateBounds();
        return _this;
    }
    return PolygonMesh;
}(Mesh));
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
            this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component), false);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
        }
    };
    ComponentList.prototype.registerAllComponents = function () {
        for (var i = 0; i < this._components.length; i++) {
            var component = this._components[i];
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
    ComponentList.prototype.handleRemove = function (component) {
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
    ComponentList.prototype.update = function () {
        this.updateLists();
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
                _this._entities.push(entity);
                entity.scene = _this.scene;
                _this.scene.entityProcessors.onEntityAdded(entity);
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
    return Matcher;
}());
var Time = (function () {
    function Time() {
    }
    Time.update = function (currentTime) {
        var dt = (currentTime - this._lastTime) / 1000;
        this.deltaTime = dt * this.timeScale;
        this.unscaledDeltaTime = dt;
        this._lastTime = currentTime;
    };
    Time.timeScale = 1;
    Time._lastTime = 0;
    return Time;
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
    MathHelper.clamp = function (value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
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
        if (result === void 0) { result = Matrix2D.identity; }
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
var Rectangle = (function () {
    function Rectangle(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    return Rectangle;
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
            return this.unitVector;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector2, "Zero", {
        get: function () {
            return this.zeroVector;
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
    Vector2.dot = function (value1, value2) {
        return (value1.x * value2.x) + (value1.y * value2.y);
    };
    Vector2.distanceSquared = function (value1, value2) {
        var v1 = value1.x - value2.x, v2 = value1.y - value2.y;
        return (v1 * v1) + (v2 * v2);
    };
    Vector2.transform = function (position, matrix) {
        return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21), (position.x * matrix.m12) + (position.y * matrix.m22));
    };
    Vector2.zeroVector = new Vector2(0, 0);
    Vector2.unitVector = new Vector2(1, 1);
    return Vector2;
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
        var intersection = Vector2.Zero;
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
        if (this.isRectToPoint(rect.x, rect.y, rect.width, rect.height, cPosition))
            return true;
        var edgeFrom;
        var edgeTo;
        var sector = this.getSector(rect.x, rect.y, rect.width, rect.height, cPosition);
        if ((sector & PointSectors.top) != 0) {
            edgeFrom = new Vector2(rect.x, rect.y);
            edgeTo = new Vector2(rect.x + rect.width, rect.y);
            if (this.isCircleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                return true;
        }
        if ((sector & PointSectors.bottom) != 0) {
            edgeFrom = new Vector2(rect.x, rect.y + rect.height);
            edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
            if (this.isCircleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                return true;
        }
        if ((sector & PointSectors.left) != 0) {
            edgeFrom = new Vector2(rect.x, rect.y);
            edgeTo = new Vector2(rect.x, rect.y + rect.height);
            if (this.isCircleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                return true;
        }
        if ((sector & PointSectors.right) != 0) {
            edgeFrom = new Vector2(rect.x + rect.width, rect.y);
            edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
            if (this.isCircleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                return true;
        }
        return false;
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
    return Vector2Ext;
}());
var WebGLUtils = (function () {
    function WebGLUtils() {
    }
    WebGLUtils.getWebGL = function () {
        return document.querySelector("canvas").getContext("webgl");
    };
    WebGLUtils.drawUserIndexPrimitives = function (primitiveType, vertexData, vertexOffset, numVertices, indexData, indexOffset, primitiveCount) {
        var GL = this.getWebGL();
        GL.bindBuffer(GL.ARRAY_BUFFER, 0);
        this.checkGLError();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, 0);
        this.checkGLError();
        GL.drawElements(primitiveType, this.getElementCountArray(primitiveType, primitiveCount), GL.UNSIGNED_SHORT, indexOffset * 2);
        this.checkGLError();
    };
    WebGLUtils.getElementCountArray = function (primitiveType, primitiveCount) {
        var GL = this.getWebGL();
        switch (primitiveType) {
            case GL.LINES:
                return primitiveCount * 2;
            case GL.LINE_STRIP:
                return primitiveCount + 1;
            case GL.TRIANGLES:
                return primitiveCount * 3;
            case GL.TRIANGLE_STRIP:
                return primitiveCount + 2;
        }
        throw new Error("not support");
    };
    WebGLUtils.checkGLError = function () {
        var GL = this.getWebGL();
        var error = GL.getError();
        if (error != GL.NO_ERROR) {
            throw new Error("GL.GetError() returned" + error);
        }
    };
    return WebGLUtils;
}());
