window.fgui = {};
window.fairygui = window.fgui;
window.__extends = (this && this.__extends) || (function () {
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

(function (fgui) {
    var AsyncOperation = (function () {
        function AsyncOperation() {
            this._itemList = new Array();
            this._objectPool = new Array();
        }
        AsyncOperation.prototype.createObject = function (pkgName, resName) {
            var pkg = fgui.UIPackage.getByName(pkgName);
            if (pkg) {
                var pi = pkg.getItemByName(resName);
                if (!pi)
                    throw new Error("resource not found: " + resName);
                this.internalCreateObject(pi);
            }
            else
                throw new Error("package not found: " + pkgName);
        };
        AsyncOperation.prototype.createObjectFromURL = function (url) {
            var pi = fgui.UIPackage.getItemByURL(url);
            if (pi)
                this.internalCreateObject(pi);
            else
                throw new Error("resource not found: " + url);
        };
        AsyncOperation.prototype.cancel = function () {
            fgui.GTimers.inst.remove(this.run, this);
            this._itemList.length = 0;
            var cnt = this._objectPool.length;
            if (cnt > 0) {
                for (var i = 0; i < cnt; i++)
                    this._objectPool[i].dispose();
                this._objectPool.length = 0;
            }
        };
        AsyncOperation.prototype.internalCreateObject = function (item) {
            this._itemList.length = 0;
            this._objectPool.length = 0;
            var di = { pi: item, type: item.objectType };
            di.childCount = this.collectComponentChildren(item);
            this._itemList.push(di);
            this._index = 0;
            fgui.GTimers.inst.add(1, 0, this.run, this);
        };
        AsyncOperation.prototype.collectComponentChildren = function (item) {
            var buffer = item.rawData;
            buffer.seek(0, 2);
            var di;
            var pi;
            var i;
            var dataLen;
            var curPos;
            var pkg;
            var dcnt = buffer.readShort();
            for (i = 0; i < dcnt; i++) {
                dataLen = buffer.readShort();
                curPos = buffer.position;
                buffer.seek(curPos, 0);
                var type = buffer.readByte();
                var src = buffer.readS();
                var pkgId = buffer.readS();
                buffer.position = curPos;
                if (src != null) {
                    if (pkgId != null)
                        pkg = fgui.UIPackage.getById(pkgId);
                    else
                        pkg = item.owner;
                    pi = pkg != null ? pkg.getItemById(src) : null;
                    di = { pi: pi, type: type };
                    if (pi != null && pi.type == fgui.PackageItemType.Component)
                        di.childCount = this.collectComponentChildren(pi);
                }
                else {
                    di = { type: type };
                    if (type == fgui.ObjectType.List)
                        di.listItemCount = this.collectListChildren(buffer);
                }
                this._itemList.push(di);
                buffer.position = curPos + dataLen;
            }
            return dcnt;
        };
        AsyncOperation.prototype.collectListChildren = function (buffer) {
            buffer.seek(buffer.position, 8);
            var listItemCount = 0;
            var i;
            var nextPos;
            var url;
            var pi;
            var di;
            var defaultItem = buffer.readS();
            var itemCount = buffer.readShort();
            for (i = 0; i < itemCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                url = buffer.readS();
                if (url == null)
                    url = defaultItem;
                if (url) {
                    pi = fgui.UIPackage.getItemByURL(url);
                    if (pi) {
                        di = { pi: pi, type: pi.objectType };
                        if (pi.type == fgui.PackageItemType.Component)
                            di.childCount = this.collectComponentChildren(pi);
                        this._itemList.push(di);
                        listItemCount++;
                    }
                }
                buffer.position = nextPos;
            }
            return listItemCount;
        };
        AsyncOperation.prototype.run = function () {
            var obj;
            var di;
            var poolStart;
            var k;
            var t = egret.getTimer();
            var frameTime = fgui.UIConfig.frameTimeForAsyncUIConstruction;
            var totalItems = this._itemList.length;
            while (this._index < totalItems) {
                di = this._itemList[this._index];
                if (di.pi) {
                    obj = fgui.UIObjectFactory.newObject(di.pi);
                    this._objectPool.push(obj);
                    fgui.UIPackage._constructing++;
                    if (di.pi.type == fgui.PackageItemType.Component) {
                        poolStart = this._objectPool.length - di.childCount - 1;
                        obj.constructFromResource2(this._objectPool, poolStart);
                        this._objectPool.splice(poolStart, di.childCount);
                    }
                    else {
                        obj.constructFromResource();
                    }
                    fgui.UIPackage._constructing--;
                }
                else {
                    obj = fgui.UIObjectFactory.newObject(di.type);
                    this._objectPool.push(obj);
                    if (di.type == fgui.ObjectType.List && di.listItemCount > 0) {
                        poolStart = this._objectPool.length - di.listItemCount - 1;
                        for (k = 0; k < di.listItemCount; k++)
                            obj.itemPool.returnObject(this._objectPool[k + poolStart]);
                        this._objectPool.splice(poolStart, di.listItemCount);
                    }
                }
                this._index++;
                if ((this._index % 5 == 0) && egret.getTimer() - t >= frameTime)
                    return;
            }
            fgui.GTimers.inst.remove(this.run, this);
            var result = this._objectPool[0];
            this._itemList.length = 0;
            this._objectPool.length = 0;
            if (this.callback != null)
                this.callback.call(this.callbackObj, result);
        };
        return AsyncOperation;
    }());
    fgui.AsyncOperation = AsyncOperation;
})(fgui || (fgui = {}));

(function (fgui) {
    var _nextPageId = 0;
    var Controller = (function (_super_1) {
        __extends(Controller, _super_1);
        function Controller() {
            var _this = _super_1.call(this) || this;
            _this._pageIds = [];
            _this._pageNames = [];
            _this._selectedIndex = -1;
            _this._previousIndex = -1;
            return _this;
        }
        Controller.prototype.dispose = function () {
        };
        Object.defineProperty(Controller.prototype, "selectedIndex", {
            get: function () {
                return this._selectedIndex;
            },
            set: function (value) {
                if (this._selectedIndex != value) {
                    if (value > this._pageIds.length - 1)
                        throw "index out of bounds: " + value;
                    this.changing = true;
                    this._previousIndex = this._selectedIndex;
                    this._selectedIndex = value;
                    this.parent.applyController(this);
                    this.dispatchEvent(new fgui.StateChangeEvent(fgui.StateChangeEvent.CHANGED));
                    this.changing = false;
                }
            },
            enumerable: true,
            configurable: true
        });
        Controller.prototype.setSelectedIndex = function (value) {
            if (this._selectedIndex != value) {
                if (value > this._pageIds.length - 1)
                    throw "index out of bounds: " + value;
                this.changing = true;
                this._previousIndex = this._selectedIndex;
                this._selectedIndex = value;
                this.parent.applyController(this);
                this.changing = false;
            }
        };
        Object.defineProperty(Controller.prototype, "previsousIndex", {
            get: function () {
                return this._previousIndex;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controller.prototype, "selectedPage", {
            get: function () {
                if (this._selectedIndex == -1)
                    return null;
                else
                    return this._pageNames[this._selectedIndex];
            },
            set: function (val) {
                var i = this._pageNames.indexOf(val);
                if (i == -1)
                    i = 0;
                this.selectedIndex = i;
            },
            enumerable: true,
            configurable: true
        });
        Controller.prototype.setSelectedPage = function (value) {
            var i = this._pageNames.indexOf(value);
            if (i == -1)
                i = 0;
            this.setSelectedIndex(i);
        };
        Object.defineProperty(Controller.prototype, "previousPage", {
            get: function () {
                if (this._previousIndex == -1)
                    return null;
                else
                    return this._pageNames[this._previousIndex];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controller.prototype, "pageCount", {
            get: function () {
                return this._pageIds.length;
            },
            enumerable: true,
            configurable: true
        });
        Controller.prototype.getPageName = function (index) {
            return this._pageNames[index];
        };
        Controller.prototype.addPage = function (name) {
            this.addPageAt(name || "", this._pageIds.length);
        };
        Controller.prototype.addPageAt = function (name, index) {
            var nid = "" + (_nextPageId++);
            if (index == this._pageIds.length) {
                this._pageIds.push(nid);
                this._pageNames.push(name);
            }
            else {
                this._pageIds.splice(index, 0, nid);
                this._pageNames.splice(index, 0, name);
            }
        };
        Controller.prototype.removePage = function (name) {
            var i = this._pageNames.indexOf(name);
            if (i != -1) {
                this._pageIds.splice(i, 1);
                this._pageNames.splice(i, 1);
                if (this._selectedIndex >= this._pageIds.length)
                    this.selectedIndex = this._selectedIndex - 1;
                else
                    this.parent.applyController(this);
            }
        };
        Controller.prototype.removePageAt = function (index) {
            if (index === void 0) { index = 0; }
            this._pageIds.splice(index, 1);
            this._pageNames.splice(index, 1);
            if (this._selectedIndex >= this._pageIds.length)
                this.selectedIndex = this._selectedIndex - 1;
            else
                this.parent.applyController(this);
        };
        Controller.prototype.clearPages = function () {
            this._pageIds.length = 0;
            this._pageNames.length = 0;
            if (this._selectedIndex != -1)
                this.selectedIndex = -1;
            else
                this.parent.applyController(this);
        };
        Controller.prototype.hasPage = function (aName) {
            return this._pageNames.indexOf(aName) != -1;
        };
        Controller.prototype.getPageIndexById = function (aId) {
            return this._pageIds.indexOf(aId);
        };
        Controller.prototype.getPageIdByName = function (aName) {
            var i = this._pageNames.indexOf(aName);
            if (i != -1)
                return this._pageIds[i];
            else
                return null;
        };
        Controller.prototype.getPageNameById = function (aId) {
            var i = this._pageIds.indexOf(aId);
            if (i != -1)
                return this._pageNames[i];
            else
                return null;
        };
        Controller.prototype.getPageId = function (index) {
            if (index === void 0) { index = 0; }
            return this._pageIds[index];
        };
        Object.defineProperty(Controller.prototype, "selectedPageId", {
            get: function () {
                if (this._selectedIndex == -1)
                    return null;
                else
                    return this._pageIds[this._selectedIndex];
            },
            set: function (val) {
                var i = this._pageIds.indexOf(val);
                this.selectedIndex = i;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controller.prototype, "oppositePageId", {
            set: function (val) {
                var i = this._pageIds.indexOf(val);
                if (i > 0)
                    this.selectedIndex = 0;
                else if (this._pageIds.length > 1)
                    this.selectedIndex = 1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Controller.prototype, "previousPageId", {
            get: function () {
                if (this._previousIndex == -1)
                    return null;
                else
                    return this._pageIds[this._previousIndex];
            },
            enumerable: true,
            configurable: true
        });
        Controller.prototype.runActions = function () {
            if (this._actions) {
                var cnt = this._actions.length;
                for (var i = 0; i < cnt; i++)
                    this._actions[i].run(this, this.previousPageId, this.selectedPageId);
            }
        };
        Controller.prototype.setup = function (buffer) {
            var beginPos = buffer.position;
            buffer.seek(beginPos, 0);
            this.name = buffer.readS();
            if (buffer.readBool())
                this.autoRadioGroupDepth = true;
            buffer.seek(beginPos, 1);
            var i;
            var nextPos;
            var cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                this._pageIds.push(buffer.readS());
                this._pageNames.push(buffer.readS());
            }
            var homePageIndex = 0;
            if (buffer.version >= 2) {
                var homePageType = buffer.readByte();
                switch (homePageType) {
                    case 1:
                        homePageIndex = buffer.readShort();
                        break;
                    case 2:
                        homePageIndex = this._pageNames.indexOf(fgui.UIPackage.branch);
                        if (homePageIndex == -1)
                            homePageIndex = 0;
                        break;
                    case 3:
                        homePageIndex = this._pageNames.indexOf(fgui.UIPackage.getVar(buffer.readS()));
                        if (homePageIndex == -1)
                            homePageIndex = 0;
                        break;
                }
            }
            buffer.seek(beginPos, 2);
            cnt = buffer.readShort();
            if (cnt > 0) {
                if (!this._actions)
                    this._actions = new Array();
                for (i = 0; i < cnt; i++) {
                    nextPos = buffer.readShort();
                    nextPos += buffer.position;
                    var action = fgui.ControllerAction.createAction(buffer.readByte());
                    action.setup(buffer);
                    this._actions.push(action);
                    buffer.position = nextPos;
                }
            }
            if (this.parent && this._pageIds.length > 0)
                this._selectedIndex = homePageIndex;
            else
                this._selectedIndex = -1;
        };
        return Controller;
    }(egret.EventDispatcher));
    fgui.Controller = Controller;
})(fgui || (fgui = {}));

(function (fgui) {
    var DragDropManager = (function () {
        function DragDropManager() {
            this._agent = new fgui.GLoader();
            this._agent.draggable = true;
            this._agent.touchable = false;
            this._agent.setSize(100, 100);
            this._agent.setPivot(0.5, 0.5, true);
            this._agent.align = fgui.AlignType.Center;
            this._agent.verticalAlign = fgui.VertAlignType.Middle;
            this._agent.sortingOrder = 1000000;
            this._agent.addEventListener(fgui.DragEvent.DRAG_END, this.__dragEnd, this);
        }
        Object.defineProperty(DragDropManager, "inst", {
            get: function () {
                if (DragDropManager._inst == null)
                    DragDropManager._inst = new DragDropManager();
                return DragDropManager._inst;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DragDropManager.prototype, "dragAgent", {
            get: function () {
                return this._agent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DragDropManager.prototype, "dragging", {
            get: function () {
                return this._agent.parent != null;
            },
            enumerable: true,
            configurable: true
        });
        DragDropManager.prototype.startDrag = function (source, icon, sourceData, touchPointID) {
            if (this._agent.parent)
                return;
            this._sourceData = sourceData;
            this._agent.url = icon;
            fgui.GRoot.inst.addChild(this._agent);
            var pt = fgui.GRoot.inst.globalToLocal(fgui.GRoot.mouseX, fgui.GRoot.mouseY);
            this._agent.setXY(pt.x, pt.y);
            this._agent.startDrag(touchPointID);
        };
        DragDropManager.prototype.cancel = function () {
            if (this._agent.parent) {
                this._agent.stopDrag();
                fgui.GRoot.inst.removeChild(this._agent);
                this._sourceData = null;
            }
        };
        DragDropManager.prototype.__dragEnd = function (evt) {
            if (this._agent.parent == null)
                return;
            fgui.GRoot.inst.removeChild(this._agent);
            var sourceData = this._sourceData;
            this._sourceData = null;
            var obj = fgui.GRoot.inst.getObjectUnderPoint(evt.stageX, evt.stageY);
            while (obj) {
                if (obj.hasEventListener(fgui.DropEvent.DROP)) {
                    var dropEvt = new fgui.DropEvent(fgui.DropEvent.DROP, sourceData);
                    obj.requestFocus();
                    obj.dispatchEvent(dropEvt);
                    return;
                }
                obj = obj.parent;
            }
        };
        return DragDropManager;
    }());
    fgui.DragDropManager = DragDropManager;
})(fgui || (fgui = {}));

(function (fgui) {
    var ButtonMode;
    (function (ButtonMode) {
        ButtonMode[ButtonMode["Common"] = 0] = "Common";
        ButtonMode[ButtonMode["Check"] = 1] = "Check";
        ButtonMode[ButtonMode["Radio"] = 2] = "Radio";
    })(ButtonMode = fgui.ButtonMode || (fgui.ButtonMode = {}));
    var AutoSizeType;
    (function (AutoSizeType) {
        AutoSizeType[AutoSizeType["None"] = 0] = "None";
        AutoSizeType[AutoSizeType["Both"] = 1] = "Both";
        AutoSizeType[AutoSizeType["Height"] = 2] = "Height";
    })(AutoSizeType = fgui.AutoSizeType || (fgui.AutoSizeType = {}));
    var AlignType;
    (function (AlignType) {
        AlignType[AlignType["Left"] = 0] = "Left";
        AlignType[AlignType["Center"] = 1] = "Center";
        AlignType[AlignType["Right"] = 2] = "Right";
    })(AlignType = fgui.AlignType || (fgui.AlignType = {}));
    var VertAlignType;
    (function (VertAlignType) {
        VertAlignType[VertAlignType["Top"] = 0] = "Top";
        VertAlignType[VertAlignType["Middle"] = 1] = "Middle";
        VertAlignType[VertAlignType["Bottom"] = 2] = "Bottom";
    })(VertAlignType = fgui.VertAlignType || (fgui.VertAlignType = {}));
    var LoaderFillType;
    (function (LoaderFillType) {
        LoaderFillType[LoaderFillType["None"] = 0] = "None";
        LoaderFillType[LoaderFillType["Scale"] = 1] = "Scale";
        LoaderFillType[LoaderFillType["ScaleMatchHeight"] = 2] = "ScaleMatchHeight";
        LoaderFillType[LoaderFillType["ScaleMatchWidth"] = 3] = "ScaleMatchWidth";
        LoaderFillType[LoaderFillType["ScaleFree"] = 4] = "ScaleFree";
        LoaderFillType[LoaderFillType["ScaleNoBorder"] = 5] = "ScaleNoBorder";
    })(LoaderFillType = fgui.LoaderFillType || (fgui.LoaderFillType = {}));
    var ListLayoutType;
    (function (ListLayoutType) {
        ListLayoutType[ListLayoutType["SingleColumn"] = 0] = "SingleColumn";
        ListLayoutType[ListLayoutType["SingleRow"] = 1] = "SingleRow";
        ListLayoutType[ListLayoutType["FlowHorizontal"] = 2] = "FlowHorizontal";
        ListLayoutType[ListLayoutType["FlowVertical"] = 3] = "FlowVertical";
        ListLayoutType[ListLayoutType["Pagination"] = 4] = "Pagination";
    })(ListLayoutType = fgui.ListLayoutType || (fgui.ListLayoutType = {}));
    var ListSelectionMode;
    (function (ListSelectionMode) {
        ListSelectionMode[ListSelectionMode["Single"] = 0] = "Single";
        ListSelectionMode[ListSelectionMode["Multiple"] = 1] = "Multiple";
        ListSelectionMode[ListSelectionMode["Multiple_SingleClick"] = 2] = "Multiple_SingleClick";
        ListSelectionMode[ListSelectionMode["None"] = 3] = "None";
    })(ListSelectionMode = fgui.ListSelectionMode || (fgui.ListSelectionMode = {}));
    var OverflowType;
    (function (OverflowType) {
        OverflowType[OverflowType["Visible"] = 0] = "Visible";
        OverflowType[OverflowType["Hidden"] = 1] = "Hidden";
        OverflowType[OverflowType["Scroll"] = 2] = "Scroll";
    })(OverflowType = fgui.OverflowType || (fgui.OverflowType = {}));
    var PackageItemType;
    (function (PackageItemType) {
        PackageItemType[PackageItemType["Image"] = 0] = "Image";
        PackageItemType[PackageItemType["MovieClip"] = 1] = "MovieClip";
        PackageItemType[PackageItemType["Sound"] = 2] = "Sound";
        PackageItemType[PackageItemType["Component"] = 3] = "Component";
        PackageItemType[PackageItemType["Atlas"] = 4] = "Atlas";
        PackageItemType[PackageItemType["Font"] = 5] = "Font";
        PackageItemType[PackageItemType["Swf"] = 6] = "Swf";
        PackageItemType[PackageItemType["Misc"] = 7] = "Misc";
        PackageItemType[PackageItemType["Unknown"] = 8] = "Unknown";
        PackageItemType[PackageItemType["Spine"] = 9] = "Spine";
        PackageItemType[PackageItemType["DragonBones"] = 10] = "DragonBones";
    })(PackageItemType = fgui.PackageItemType || (fgui.PackageItemType = {}));
    ;
    var ObjectType;
    (function (ObjectType) {
        ObjectType[ObjectType["Image"] = 0] = "Image";
        ObjectType[ObjectType["MovieClip"] = 1] = "MovieClip";
        ObjectType[ObjectType["Swf"] = 2] = "Swf";
        ObjectType[ObjectType["Graph"] = 3] = "Graph";
        ObjectType[ObjectType["Loader"] = 4] = "Loader";
        ObjectType[ObjectType["Group"] = 5] = "Group";
        ObjectType[ObjectType["Text"] = 6] = "Text";
        ObjectType[ObjectType["RichText"] = 7] = "RichText";
        ObjectType[ObjectType["InputText"] = 8] = "InputText";
        ObjectType[ObjectType["Component"] = 9] = "Component";
        ObjectType[ObjectType["List"] = 10] = "List";
        ObjectType[ObjectType["Label"] = 11] = "Label";
        ObjectType[ObjectType["Button"] = 12] = "Button";
        ObjectType[ObjectType["ComboBox"] = 13] = "ComboBox";
        ObjectType[ObjectType["ProgressBar"] = 14] = "ProgressBar";
        ObjectType[ObjectType["Slider"] = 15] = "Slider";
        ObjectType[ObjectType["ScrollBar"] = 16] = "ScrollBar";
        ObjectType[ObjectType["Tree"] = 17] = "Tree";
        ObjectType[ObjectType["Loader3D"] = 18] = "Loader3D";
    })(ObjectType = fgui.ObjectType || (fgui.ObjectType = {}));
    var ProgressTitleType;
    (function (ProgressTitleType) {
        ProgressTitleType[ProgressTitleType["Percent"] = 0] = "Percent";
        ProgressTitleType[ProgressTitleType["ValueAndMax"] = 1] = "ValueAndMax";
        ProgressTitleType[ProgressTitleType["Value"] = 2] = "Value";
        ProgressTitleType[ProgressTitleType["Max"] = 3] = "Max";
    })(ProgressTitleType = fgui.ProgressTitleType || (fgui.ProgressTitleType = {}));
    var ScrollBarDisplayType;
    (function (ScrollBarDisplayType) {
        ScrollBarDisplayType[ScrollBarDisplayType["Default"] = 0] = "Default";
        ScrollBarDisplayType[ScrollBarDisplayType["Visible"] = 1] = "Visible";
        ScrollBarDisplayType[ScrollBarDisplayType["Auto"] = 2] = "Auto";
        ScrollBarDisplayType[ScrollBarDisplayType["Hidden"] = 3] = "Hidden";
    })(ScrollBarDisplayType = fgui.ScrollBarDisplayType || (fgui.ScrollBarDisplayType = {}));
    ;
    var ScrollType;
    (function (ScrollType) {
        ScrollType[ScrollType["Horizontal"] = 0] = "Horizontal";
        ScrollType[ScrollType["Vertical"] = 1] = "Vertical";
        ScrollType[ScrollType["Both"] = 2] = "Both";
    })(ScrollType = fgui.ScrollType || (fgui.ScrollType = {}));
    ;
    var FlipType;
    (function (FlipType) {
        FlipType[FlipType["None"] = 0] = "None";
        FlipType[FlipType["Horizontal"] = 1] = "Horizontal";
        FlipType[FlipType["Vertical"] = 2] = "Vertical";
        FlipType[FlipType["Both"] = 3] = "Both";
    })(FlipType = fgui.FlipType || (fgui.FlipType = {}));
    var ChildrenRenderOrder;
    (function (ChildrenRenderOrder) {
        ChildrenRenderOrder[ChildrenRenderOrder["Ascent"] = 0] = "Ascent";
        ChildrenRenderOrder[ChildrenRenderOrder["Descent"] = 1] = "Descent";
        ChildrenRenderOrder[ChildrenRenderOrder["Arch"] = 2] = "Arch";
    })(ChildrenRenderOrder = fgui.ChildrenRenderOrder || (fgui.ChildrenRenderOrder = {}));
    var GroupLayoutType;
    (function (GroupLayoutType) {
        GroupLayoutType[GroupLayoutType["None"] = 0] = "None";
        GroupLayoutType[GroupLayoutType["Horizontal"] = 1] = "Horizontal";
        GroupLayoutType[GroupLayoutType["Vertical"] = 2] = "Vertical";
    })(GroupLayoutType = fgui.GroupLayoutType || (fgui.GroupLayoutType = {}));
    var PopupDirection;
    (function (PopupDirection) {
        PopupDirection[PopupDirection["Auto"] = 0] = "Auto";
        PopupDirection[PopupDirection["Up"] = 1] = "Up";
        PopupDirection[PopupDirection["Down"] = 2] = "Down";
    })(PopupDirection = fgui.PopupDirection || (fgui.PopupDirection = {}));
    var RelationType;
    (function (RelationType) {
        RelationType[RelationType["Left_Left"] = 0] = "Left_Left";
        RelationType[RelationType["Left_Center"] = 1] = "Left_Center";
        RelationType[RelationType["Left_Right"] = 2] = "Left_Right";
        RelationType[RelationType["Center_Center"] = 3] = "Center_Center";
        RelationType[RelationType["Right_Left"] = 4] = "Right_Left";
        RelationType[RelationType["Right_Center"] = 5] = "Right_Center";
        RelationType[RelationType["Right_Right"] = 6] = "Right_Right";
        RelationType[RelationType["Top_Top"] = 7] = "Top_Top";
        RelationType[RelationType["Top_Middle"] = 8] = "Top_Middle";
        RelationType[RelationType["Top_Bottom"] = 9] = "Top_Bottom";
        RelationType[RelationType["Middle_Middle"] = 10] = "Middle_Middle";
        RelationType[RelationType["Bottom_Top"] = 11] = "Bottom_Top";
        RelationType[RelationType["Bottom_Middle"] = 12] = "Bottom_Middle";
        RelationType[RelationType["Bottom_Bottom"] = 13] = "Bottom_Bottom";
        RelationType[RelationType["Width"] = 14] = "Width";
        RelationType[RelationType["Height"] = 15] = "Height";
        RelationType[RelationType["LeftExt_Left"] = 16] = "LeftExt_Left";
        RelationType[RelationType["LeftExt_Right"] = 17] = "LeftExt_Right";
        RelationType[RelationType["RightExt_Left"] = 18] = "RightExt_Left";
        RelationType[RelationType["RightExt_Right"] = 19] = "RightExt_Right";
        RelationType[RelationType["TopExt_Top"] = 20] = "TopExt_Top";
        RelationType[RelationType["TopExt_Bottom"] = 21] = "TopExt_Bottom";
        RelationType[RelationType["BottomExt_Top"] = 22] = "BottomExt_Top";
        RelationType[RelationType["BottomExt_Bottom"] = 23] = "BottomExt_Bottom";
        RelationType[RelationType["Size"] = 24] = "Size";
    })(RelationType = fgui.RelationType || (fgui.RelationType = {}));
    var FillMethod;
    (function (FillMethod) {
        FillMethod[FillMethod["None"] = 0] = "None";
        FillMethod[FillMethod["Horizontal"] = 1] = "Horizontal";
        FillMethod[FillMethod["Vertical"] = 2] = "Vertical";
        FillMethod[FillMethod["Radial90"] = 3] = "Radial90";
        FillMethod[FillMethod["Radial180"] = 4] = "Radial180";
        FillMethod[FillMethod["Radial360"] = 5] = "Radial360";
    })(FillMethod = fgui.FillMethod || (fgui.FillMethod = {}));
    var FillOrigin;
    (function (FillOrigin) {
        FillOrigin[FillOrigin["Top"] = 0] = "Top";
        FillOrigin[FillOrigin["Bottom"] = 1] = "Bottom";
        FillOrigin[FillOrigin["Left"] = 2] = "Left";
        FillOrigin[FillOrigin["Right"] = 3] = "Right";
        FillOrigin[FillOrigin["TopLeft"] = 0] = "TopLeft";
        FillOrigin[FillOrigin["TopRight"] = 1] = "TopRight";
        FillOrigin[FillOrigin["BottomLeft"] = 2] = "BottomLeft";
        FillOrigin[FillOrigin["BottomRight"] = 3] = "BottomRight";
    })(FillOrigin = fgui.FillOrigin || (fgui.FillOrigin = {}));
    var FillOrigin90;
    (function (FillOrigin90) {
        FillOrigin90[FillOrigin90["TopLeft"] = 0] = "TopLeft";
        FillOrigin90[FillOrigin90["TopRight"] = 1] = "TopRight";
        FillOrigin90[FillOrigin90["BottomLeft"] = 2] = "BottomLeft";
        FillOrigin90[FillOrigin90["BottomRight"] = 3] = "BottomRight";
    })(FillOrigin90 = fgui.FillOrigin90 || (fgui.FillOrigin90 = {}));
    var ObjectPropID;
    (function (ObjectPropID) {
        ObjectPropID[ObjectPropID["Text"] = 0] = "Text";
        ObjectPropID[ObjectPropID["Icon"] = 1] = "Icon";
        ObjectPropID[ObjectPropID["Color"] = 2] = "Color";
        ObjectPropID[ObjectPropID["OutlineColor"] = 3] = "OutlineColor";
        ObjectPropID[ObjectPropID["Playing"] = 4] = "Playing";
        ObjectPropID[ObjectPropID["Frame"] = 5] = "Frame";
        ObjectPropID[ObjectPropID["DeltaTime"] = 6] = "DeltaTime";
        ObjectPropID[ObjectPropID["TimeScale"] = 7] = "TimeScale";
        ObjectPropID[ObjectPropID["FontSize"] = 8] = "FontSize";
        ObjectPropID[ObjectPropID["Selected"] = 9] = "Selected";
    })(ObjectPropID = fgui.ObjectPropID || (fgui.ObjectPropID = {}));
})(fgui || (fgui = {}));

(function (fgui) {
    var GObject = (function (_super_1) {
        __extends(GObject, _super_1);
        function GObject() {
            var _this = _super_1.call(this) || this;
            _this._x = 0;
            _this._y = 0;
            _this._alpha = 1;
            _this._rotation = 0;
            _this._visible = true;
            _this._touchable = true;
            _this._scaleX = 1;
            _this._scaleY = 1;
            _this._skewX = 0;
            _this._skewY = 0;
            _this._pivotX = 0;
            _this._pivotY = 0;
            _this._pivotOffsetX = 0;
            _this._pivotOffsetY = 0;
            _this._sortingOrder = 0;
            _this._internalVisible = true;
            _this._disposed = false;
            _this.sourceWidth = 0;
            _this.sourceHeight = 0;
            _this.initWidth = 0;
            _this.initHeight = 0;
            _this.minWidth = 0;
            _this.minHeight = 0;
            _this.maxWidth = 0;
            _this.maxHeight = 0;
            _this._width = 0;
            _this._height = 0;
            _this._rawWidth = 0;
            _this._rawHeight = 0;
            _this._sizePercentInGroup = 0;
            _this._id = "" + _gInstanceCounter++;
            _this._name = "";
            _this.createDisplayObject();
            _this._relations = new fgui.Relations(_this);
            _this._gears = new Array(10);
            return _this;
        }
        Object.defineProperty(GObject.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "name", {
            get: function () {
                return this._name;
            },
            set: function (value) {
                this._name = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (value) {
                this.setXY(value, this._y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (value) {
                this.setXY(this._x, value);
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setXY = function (xv, yv) {
            if (this._x != xv || this._y != yv) {
                var dx = xv - this._x;
                var dy = yv - this._y;
                this._x = xv;
                this._y = yv;
                this.handleXYChanged();
                if (this instanceof fgui.GGroup)
                    this.moveChildren(dx, dy);
                this.updateGear(1);
                if (this._parent && !(this._parent instanceof fgui.GList)) {
                    this._parent.setBoundsChangedFlag();
                    if (this._group)
                        this._group.setBoundsChangedFlag(true);
                    this.dispatchEventWith(GObject.XY_CHANGED);
                }
                if (GObject.draggingObject == this && !sUpdateInDragging)
                    this.localToGlobalRect(0, 0, this._width, this._height, sGlobalRect);
            }
        };
        Object.defineProperty(GObject.prototype, "xMin", {
            get: function () {
                return this._pivotAsAnchor ? (this._x - this._width * this._pivotX) : this._x;
            },
            set: function (value) {
                if (this._pivotAsAnchor)
                    this.setXY(value + this._width * this._pivotX, this._y);
                else
                    this.setXY(value, this._y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "yMin", {
            get: function () {
                return this._pivotAsAnchor ? (this._y - this._height * this._pivotY) : this._y;
            },
            set: function (value) {
                if (this._pivotAsAnchor)
                    this.setXY(this._x, value + this._height * this._pivotY);
                else
                    this.setXY(this._x, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "pixelSnapping", {
            get: function () {
                return this._pixelSnapping;
            },
            set: function (value) {
                if (this._pixelSnapping != value) {
                    this._pixelSnapping = value;
                    this.handleXYChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.center = function (restraint) {
            var r;
            if (this._parent)
                r = this.parent;
            else
                r = this.root;
            this.setXY((r.width - this._width) / 2, (r.height - this._height) / 2);
            if (restraint) {
                this.addRelation(r, fgui.RelationType.Center_Center);
                this.addRelation(r, fgui.RelationType.Middle_Middle);
            }
        };
        Object.defineProperty(GObject.prototype, "width", {
            get: function () {
                this.ensureSizeCorrect();
                if (this._relations.sizeDirty)
                    this._relations.ensureRelationsSizeCorrect();
                return this._width;
            },
            set: function (value) {
                this.setSize(value, this._rawHeight);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "height", {
            get: function () {
                this.ensureSizeCorrect();
                if (this._relations.sizeDirty)
                    this._relations.ensureRelationsSizeCorrect();
                return this._height;
            },
            set: function (value) {
                this.setSize(this._rawWidth, value);
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setSize = function (wv, hv, ignorePivot) {
            if (this._rawWidth != wv || this._rawHeight != hv) {
                this._rawWidth = wv;
                this._rawHeight = hv;
                if (wv < this.minWidth)
                    wv = this.minWidth;
                if (hv < this.minHeight)
                    hv = this.minHeight;
                if (this.maxWidth > 0 && wv > this.maxWidth)
                    wv = this.maxWidth;
                if (this.maxHeight > 0 && hv > this.maxHeight)
                    hv = this.maxHeight;
                var dWidth = wv - this._width;
                var dHeight = hv - this._height;
                this._width = wv;
                this._height = hv;
                this.handleSizeChanged();
                if (this._pivotX != 0 || this._pivotY != 0) {
                    if (!this._pivotAsAnchor) {
                        if (!ignorePivot)
                            this.setXY(this.x - this._pivotX * dWidth, this.y - this._pivotY * dHeight);
                        this.updatePivotOffset();
                    }
                    else {
                        this.applyPivot();
                    }
                }
                if (this instanceof fgui.GGroup)
                    this.resizeChildren(dWidth, dHeight);
                this.updateGear(2);
                if (this._parent) {
                    this._relations.onOwnerSizeChanged(dWidth, dHeight, this._pivotAsAnchor || !ignorePivot);
                    this._parent.setBoundsChangedFlag();
                    if (this._group)
                        this._group.setBoundsChangedFlag();
                }
                this.dispatchEventWith(GObject.SIZE_CHANGED);
            }
        };
        GObject.prototype.makeFullScreen = function () {
            this.setSize(fgui.GRoot.inst.width, fgui.GRoot.inst.height);
        };
        GObject.prototype.ensureSizeCorrect = function () {
        };
        Object.defineProperty(GObject.prototype, "actualWidth", {
            get: function () {
                return this.width * Math.abs(this._scaleX);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "actualHeight", {
            get: function () {
                return this.height * Math.abs(this._scaleY);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "scaleX", {
            get: function () {
                return this._scaleX;
            },
            set: function (value) {
                this.setScale(value, this._scaleY);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "scaleY", {
            get: function () {
                return this._scaleY;
            },
            set: function (value) {
                this.setScale(this._scaleX, value);
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setScale = function (sx, sy) {
            if (this._scaleX != sx || this._scaleY != sy) {
                this._scaleX = sx;
                this._scaleY = sy;
                this.handleScaleChanged();
                this.applyPivot();
                this.updateGear(2);
            }
        };
        Object.defineProperty(GObject.prototype, "skewX", {
            get: function () {
                return this._skewX;
            },
            set: function (value) {
                this.setSkew(value, this._skewY);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "skewY", {
            get: function () {
                return this._skewY;
            },
            set: function (value) {
                this.setSkew(this._skewX, value);
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setSkew = function (xv, yv) {
            if (this._skewX != xv || this._skewY != yv) {
                this._skewX = xv;
                this._skewY = yv;
                if (this._displayObject) {
                    this._displayObject.skewX = xv;
                    this._displayObject.skewY = yv;
                }
                this.applyPivot();
            }
        };
        Object.defineProperty(GObject.prototype, "pivotX", {
            get: function () {
                return this._pivotX;
            },
            set: function (value) {
                this.setPivot(value, this._pivotY);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "pivotY", {
            get: function () {
                return this._pivotY;
            },
            set: function (value) {
                this.setPivot(this._pivotX, value);
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setPivot = function (xv, yv, asAnchor) {
            if (this._pivotX != xv || this._pivotY != yv || this._pivotAsAnchor != asAnchor) {
                this._pivotX = xv;
                this._pivotY = yv;
                this._pivotAsAnchor = asAnchor;
                this.updatePivotOffset();
                this.handleXYChanged();
            }
        };
        Object.defineProperty(GObject.prototype, "pivotAsAnchor", {
            get: function () {
                return this._pivotAsAnchor;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.internalSetPivot = function (xv, yv, asAnchor) {
            this._pivotX = xv;
            this._pivotY = yv;
            this._pivotAsAnchor = asAnchor;
            if (asAnchor)
                this.handleXYChanged();
        };
        GObject.prototype.updatePivotOffset = function () {
            if (this._displayObject) {
                if (this._pivotX != 0 || this._pivotY != 0) {
                    var px = this._pivotX * this._width;
                    var py = this._pivotY * this._height;
                    var pt = this._displayObject.matrix.transformPoint(px, py, sHelperPoint);
                    this._pivotOffsetX = this._pivotX * this._width - (pt.x - this._displayObject.x);
                    this._pivotOffsetY = this._pivotY * this._height - (pt.y - this._displayObject.y);
                }
                else {
                    this._pivotOffsetX = 0;
                    this._pivotOffsetY = 0;
                }
            }
        };
        GObject.prototype.applyPivot = function () {
            if (this._pivotX != 0 || this._pivotY != 0) {
                this.updatePivotOffset();
                this.handleXYChanged();
            }
        };
        Object.defineProperty(GObject.prototype, "touchable", {
            get: function () {
                return this._touchable;
            },
            set: function (value) {
                if (this._touchable != value) {
                    this._touchable = value;
                    this.updateGear(3);
                    if ((this instanceof fgui.GImage) || (this instanceof fgui.GMovieClip)
                        || (this instanceof fgui.GTextField) && !(this instanceof fgui.GTextInput) && !(this instanceof fgui.GRichTextField))
                        return;
                    if (this._displayObject) {
                        this._displayObject.touchEnabled = this._touchable;
                        if (this._displayObject instanceof egret.DisplayObjectContainer)
                            this._displayObject.touchChildren = this._touchable;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "grayed", {
            get: function () {
                return this._grayed;
            },
            set: function (value) {
                if (this._grayed != value) {
                    this._grayed = value;
                    this.handleGrayedChanged();
                    this.updateGear(3);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "enabled", {
            get: function () {
                return !this._grayed && this._touchable;
            },
            set: function (value) {
                this.grayed = !value;
                this.touchable = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this._rotation != value) {
                    this._rotation = value;
                    if (this._displayObject)
                        this._displayObject.rotation = this.normalizeRotation;
                    this.applyPivot();
                    this.updateGear(3);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "normalizeRotation", {
            get: function () {
                var rot = this._rotation % 360;
                if (rot > 180)
                    rot -= 360;
                else if (rot < -180)
                    rot += 360;
                return rot;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (value) {
                if (this._alpha != value) {
                    this._alpha = value;
                    this.handleAlphaChanged();
                    this.updateGear(3);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "visible", {
            get: function () {
                return this._visible;
            },
            set: function (value) {
                if (this._visible != value) {
                    this._visible = value;
                    this.handleVisibleChanged();
                    if (this._parent)
                        this._parent.setBoundsChangedFlag();
                    if (this._group && this._group.excludeInvisibles)
                        this._group.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "internalVisible", {
            get: function () {
                return this._internalVisible && (!this._group || this._group.internalVisible);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "internalVisible2", {
            get: function () {
                return this._visible && (!this._group || this._group.internalVisible2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "internalVisible3", {
            get: function () {
                return this._visible && this._internalVisible;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "sortingOrder", {
            get: function () {
                return this._sortingOrder;
            },
            set: function (value) {
                if (value < 0)
                    value = 0;
                if (this._sortingOrder != value) {
                    var old = this._sortingOrder;
                    this._sortingOrder = value;
                    if (this._parent)
                        this._parent.childSortingOrderChanged(this, old, this._sortingOrder);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "focused", {
            get: function () {
                return this.root.focus == this;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.requestFocus = function () {
            this.root.focus = this;
        };
        Object.defineProperty(GObject.prototype, "tooltips", {
            get: function () {
                return this._tooltips;
            },
            set: function (value) {
                this._tooltips = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "blendMode", {
            get: function () {
                return this._displayObject.blendMode;
            },
            set: function (value) {
                this._displayObject.blendMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "filters", {
            get: function () {
                return this._displayObject.filters;
            },
            set: function (value) {
                this._displayObject.filters = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "inContainer", {
            get: function () {
                return this._displayObject != null && this._displayObject.parent != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "onStage", {
            get: function () {
                return this._displayObject != null && this._displayObject.stage != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "resourceURL", {
            get: function () {
                if (this.packageItem)
                    return "ui://" + this.packageItem.owner.id + this.packageItem.id;
                else
                    return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "group", {
            get: function () {
                return this._group;
            },
            set: function (value) {
                if (this._group != value) {
                    if (this._group)
                        this._group.setBoundsChangedFlag();
                    this._group = value;
                    if (this._group)
                        this._group.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.getGear = function (index) {
            var gear = this._gears[index];
            if (gear == null)
                this._gears[index] = gear = fgui.GearBase.create(this, index);
            return gear;
        };
        GObject.prototype.updateGear = function (index) {
            if (this._underConstruct || this._gearLocked)
                return;
            var gear = this._gears[index];
            if (gear && gear.controller)
                gear.updateState();
        };
        GObject.prototype.checkGearController = function (index, c) {
            return this._gears[index] != null && this._gears[index].controller == c;
        };
        GObject.prototype.updateGearFromRelations = function (index, dx, dy) {
            if (this._gears[index])
                this._gears[index].updateFromRelations(dx, dy);
        };
        GObject.prototype.addDisplayLock = function () {
            var gearDisplay = this._gears[0];
            if (gearDisplay && gearDisplay.controller) {
                var ret = gearDisplay.addLock();
                this.checkGearDisplay();
                return ret;
            }
            else
                return 0;
        };
        GObject.prototype.releaseDisplayLock = function (token) {
            var gearDisplay = this._gears[0];
            if (gearDisplay && gearDisplay.controller) {
                gearDisplay.releaseLock(token);
                this.checkGearDisplay();
            }
        };
        GObject.prototype.checkGearDisplay = function () {
            if (this._handlingController)
                return;
            var connected = this._gears[0] == null || this._gears[0].connected;
            if (this._gears[8])
                connected = this._gears[8].evaluate(connected);
            if (connected != this._internalVisible) {
                this._internalVisible = connected;
                if (this._parent)
                    this._parent.childStateChanged(this);
                if (this._group && this._group.excludeInvisibles)
                    this._group.setBoundsChangedFlag();
            }
        };
        Object.defineProperty(GObject.prototype, "gearXY", {
            get: function () {
                return this.getGear(1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "gearSize", {
            get: function () {
                return this.getGear(2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "gearLook", {
            get: function () {
                return this.getGear(3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "relations", {
            get: function () {
                return this._relations;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.addRelation = function (target, relationType, usePercent) {
            this._relations.add(target, relationType, usePercent);
        };
        GObject.prototype.removeRelation = function (target, relationType) {
            this._relations.remove(target, relationType || 0);
        };
        Object.defineProperty(GObject.prototype, "displayObject", {
            get: function () {
                return this._displayObject;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.setDisplayObject = function (value) {
            if (this._displayObject != value) {
                if (this._displayObject)
                    delete this._displayObject["$owner"];
                this._displayObject = value;
                this._displayObject["$owner"] = this;
            }
        };
        Object.defineProperty(GObject.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            set: function (val) {
                this._parent = val;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.removeFromParent = function () {
            if (this._parent)
                this._parent.removeChild(this);
        };
        Object.defineProperty(GObject.prototype, "root", {
            get: function () {
                if (this instanceof fgui.GRoot)
                    return this;
                var p = this._parent;
                while (p) {
                    if (p instanceof fgui.GRoot)
                        return p;
                    p = p.parent;
                }
                return fgui.GRoot.inst;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asCom", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asButton", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asLabel", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asProgress", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asTextField", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asRichTextField", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asTextInput", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asLoader", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asList", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asTree", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asGraph", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asGroup", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asSlider", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asComboBox", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asImage", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "asMovieClip", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        GObject.cast = function (obj) {
            return obj["$owner"];
        };
        Object.defineProperty(GObject.prototype, "text", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "icon", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "isDisposed", {
            get: function () {
                return this._disposed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "treeNode", {
            get: function () {
                return this._treeNode;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.dispose = function () {
            if (this._disposed)
                return;
            this._disposed = true;
            this.removeFromParent();
            this._relations.dispose();
            this._displayObject = null;
            for (var i = 0; i < 10; i++) {
                var gear = this._gears[i];
                if (gear)
                    gear.dispose();
            }
        };
        GObject.prototype.addClickListener = function (listener, thisObj) {
            this.addEventListener(egret.TouchEvent.TOUCH_TAP, listener, thisObj);
        };
        GObject.prototype.removeClickListener = function (listener, thisObj) {
            this.removeEventListener(egret.TouchEvent.TOUCH_TAP, listener, thisObj);
        };
        GObject.prototype.hasClickListener = function () {
            return this.hasEventListener(egret.TouchEvent.TOUCH_TAP);
        };
        GObject.prototype.addEventListener = function (type, listener, thisObject) {
            _super_1.prototype.addEventListener.call(this, type, listener, thisObject);
            if (this._displayObject) {
                this._displayObject.addEventListener(type, this._reDispatch, this);
            }
        };
        GObject.prototype.removeEventListener = function (type, listener, thisObject) {
            _super_1.prototype.removeEventListener.call(this, type, listener, thisObject);
            if (this._displayObject && !this.hasEventListener(type)) {
                this._displayObject.removeEventListener(type, this._reDispatch, this);
            }
        };
        GObject.prototype._reDispatch = function (evt) {
            this.dispatchEvent(evt);
        };
        Object.defineProperty(GObject.prototype, "draggable", {
            get: function () {
                return this._draggable;
            },
            set: function (value) {
                if (this._draggable != value) {
                    this._draggable = value;
                    this.initDrag();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GObject.prototype, "dragBounds", {
            get: function () {
                return this._dragBounds;
            },
            set: function (value) {
                this._dragBounds = value;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.startDrag = function (touchPointID, stageX, stageY) {
            if (this._displayObject.stage == null)
                return;
            this.dragBegin(touchPointID, stageX, stageY);
        };
        GObject.prototype.stopDrag = function () {
            this.dragEnd();
        };
        Object.defineProperty(GObject.prototype, "dragging", {
            get: function () {
                return GObject.draggingObject == this;
            },
            enumerable: true,
            configurable: true
        });
        GObject.prototype.localToGlobal = function (ax, ay, result) {
            ax = ax || 0;
            ay = ay || 0;
            if (this._pivotAsAnchor) {
                ax += this._pivotX * this._width;
                ay += this._pivotY * this._height;
            }
            return this._displayObject.localToGlobal(ax, ay, result);
        };
        GObject.prototype.globalToLocal = function (ax, ay, result) {
            ax = ax || 0;
            ay = ay || 0;
            var pt = this._displayObject.globalToLocal(ax, ay, result);
            if (this._pivotAsAnchor) {
                pt.x -= this._pivotX * this._width;
                pt.y -= this._pivotY * this._height;
            }
            return pt;
        };
        GObject.prototype.localToRoot = function (ax, ay, result) {
            ax = ax || 0;
            ay = ay || 0;
            var pt = this._displayObject.localToGlobal(ax, ay, result);
            pt.x /= fgui.GRoot.contentScaleFactor;
            pt.y /= fgui.GRoot.contentScaleFactor;
            return pt;
        };
        GObject.prototype.rootToLocal = function (ax, ay, resultPoint) {
            ax = ax || 0;
            ay = ay || 0;
            ax *= fgui.GRoot.contentScaleFactor;
            ay *= fgui.GRoot.contentScaleFactor;
            return this._displayObject.globalToLocal(ax, ay, resultPoint);
        };
        GObject.prototype.localToGlobalRect = function (ax, ay, aw, ah, result) {
            ax = ax || 0;
            ay = ay || 0;
            aw = aw || 0;
            ah = ah || 0;
            result = result || new egret.Rectangle();
            var pt = this.localToGlobal(ax, ay);
            result.x = pt.x;
            result.y = pt.y;
            pt = this.localToGlobal(ax + aw, ay + ah);
            result.right = pt.x;
            result.bottom = pt.y;
            return result;
        };
        GObject.prototype.globalToLocalRect = function (ax, ay, aw, ah, result) {
            ax = ax || 0;
            ay = ay || 0;
            aw = aw || 0;
            ah = ah || 0;
            result = result || new egret.Rectangle();
            var pt = this.globalToLocal(ax, ay);
            result.x = pt.x;
            result.y = pt.y;
            pt = this.globalToLocal(ax + aw, ay + ah);
            result.right = pt.x;
            result.bottom = pt.y;
            return result;
        };
        GObject.prototype.handleControllerChanged = function (c) {
            this._handlingController = true;
            for (var i = 0; i < 10; i++) {
                var gear = this._gears[i];
                if (gear && gear.controller == c)
                    gear.apply();
            }
            this._handlingController = false;
            this.checkGearDisplay();
        };
        GObject.prototype.createDisplayObject = function () {
        };
        GObject.prototype.switchDisplayObject = function (newObj) {
            if (newObj == this._displayObject)
                return;
            var old = this._displayObject;
            if (this._displayObject && this._displayObject.parent) {
                var i = this._displayObject.parent.getChildIndex(this._displayObject);
                this._displayObject.parent.addChildAt(newObj, i);
                this._displayObject.parent.removeChild(this._displayObject);
            }
            this._displayObject = newObj;
            this._displayObject.x = old.x;
            this._displayObject.y = old.y;
            this._displayObject.rotation = old.rotation;
            this._displayObject.alpha = old.alpha;
            this._displayObject.visible = old.visible;
            this._displayObject.touchEnabled = old.touchEnabled;
            this._displayObject.scaleX = old.scaleX;
            this._displayObject.scaleY = old.scaleY;
            fgui.ToolSet.setColorFilter(this._displayObject, this._grayed);
            if (this._displayObject instanceof egret.DisplayObjectContainer)
                this._displayObject.touchChildren = this._touchable;
        };
        GObject.prototype.handleXYChanged = function () {
            if (this._displayObject) {
                var xv = this._x;
                var yv = this._y;
                if (this._pivotAsAnchor) {
                    xv -= this._pivotX * this._width;
                    yv -= this._pivotY * this._height;
                }
                if (this._pixelSnapping) {
                    xv = Math.round(xv);
                    yv = Math.round(yv);
                }
                this._displayObject.x = xv + this._pivotOffsetX;
                this._displayObject.y = yv + this._pivotOffsetY;
            }
        };
        GObject.prototype.handleSizeChanged = function () {
            if (this._displayObject) {
                this._displayObject.width = this._width;
                this._displayObject.height = this._height;
            }
        };
        GObject.prototype.handleScaleChanged = function () {
            if (this._displayObject) {
                this._displayObject.scaleX = this._scaleX;
                this._displayObject.scaleY = this._scaleY;
            }
        };
        GObject.prototype.handleGrayedChanged = function () {
            if (this._displayObject) {
                fgui.ToolSet.setColorFilter(this._displayObject, this._grayed);
            }
        };
        GObject.prototype.handleAlphaChanged = function () {
            if (this._displayObject)
                this._displayObject.alpha = this._alpha;
        };
        GObject.prototype.handleVisibleChanged = function () {
            if (this._displayObject)
                this._displayObject.visible = this.internalVisible2;
            if (this instanceof fgui.GGroup)
                this.handleVisibleChanged();
        };
        GObject.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Text:
                    return this.text;
                case fgui.ObjectPropID.Icon:
                    return this.icon;
                case fgui.ObjectPropID.Color:
                    return NaN;
                case fgui.ObjectPropID.OutlineColor:
                    return NaN;
                case fgui.ObjectPropID.Playing:
                    return false;
                case fgui.ObjectPropID.Frame:
                    return 0;
                case fgui.ObjectPropID.DeltaTime:
                    return 0;
                case fgui.ObjectPropID.TimeScale:
                    return 1;
                case fgui.ObjectPropID.FontSize:
                    return 0;
                case fgui.ObjectPropID.Selected:
                    return false;
                default:
                    return undefined;
            }
        };
        GObject.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Text:
                    this.text = value;
                    break;
                case fgui.ObjectPropID.Icon:
                    this.icon = value;
                    break;
            }
        };
        GObject.prototype.constructFromResource = function () {
        };
        GObject.prototype.setup_beforeAdd = function (buffer, beginPos) {
            buffer.seek(beginPos, 0);
            buffer.skip(5);
            var f1;
            var f2;
            this._id = buffer.readS();
            this._name = buffer.readS();
            f1 = buffer.readInt();
            f2 = buffer.readInt();
            this.setXY(f1, f2);
            if (buffer.readBool()) {
                this.initWidth = buffer.readInt();
                this.initHeight = buffer.readInt();
                this.setSize(this.initWidth, this.initHeight, true);
            }
            if (buffer.readBool()) {
                this.minWidth = buffer.readInt();
                this.maxWidth = buffer.readInt();
                this.minHeight = buffer.readInt();
                this.maxHeight = buffer.readInt();
            }
            if (buffer.readBool()) {
                f1 = buffer.readFloat();
                f2 = buffer.readFloat();
                this.setScale(f1, f2);
            }
            if (buffer.readBool()) {
                f1 = buffer.readFloat();
                f2 = buffer.readFloat();
                this.setSkew(f1, f2);
            }
            if (buffer.readBool()) {
                f1 = buffer.readFloat();
                f2 = buffer.readFloat();
                this.setPivot(f1, f2, buffer.readBool());
            }
            f1 = buffer.readFloat();
            if (f1 != 1)
                this.alpha = f1;
            f1 = buffer.readFloat();
            if (f1 != 0)
                this.rotation = f1;
            if (!buffer.readBool())
                this.visible = false;
            if (!buffer.readBool())
                this.touchable = false;
            if (buffer.readBool())
                this.grayed = true;
            var bm = buffer.readByte();
            if (bm == 2)
                this.blendMode = egret.BlendMode.ADD;
            else if (bm == 5)
                this.blendMode = egret.BlendMode.ERASE;
            var filter = buffer.readByte();
            if (filter == 1 && this._displayObject)
                fgui.ToolSet.setColorFilter(this._displayObject, [buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat()]);
            var str = buffer.readS();
            if (str != null)
                this.data = str;
        };
        GObject.prototype.setup_afterAdd = function (buffer, beginPos) {
            buffer.seek(beginPos, 1);
            var str = buffer.readS();
            if (str != null)
                this.tooltips = str;
            var groupId = buffer.readShort();
            if (groupId >= 0)
                this.group = this.parent.getChildAt(groupId);
            buffer.seek(beginPos, 2);
            var cnt = buffer.readShort();
            for (var i = 0; i < cnt; i++) {
                var nextPos = buffer.readShort();
                nextPos += buffer.position;
                var gear = this.getGear(buffer.readByte());
                gear.setup(buffer);
                buffer.position = nextPos;
            }
        };
        GObject.prototype.initDrag = function () {
            if (this._draggable)
                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__begin, this);
            else
                this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__begin, this);
        };
        GObject.prototype.dragBegin = function (touchPointID, stageX, stageY) {
            if (GObject.draggingObject) {
                var tmp = GObject.draggingObject;
                tmp.stopDrag();
                GObject.draggingObject = null;
                var dragEvent = new fgui.DragEvent(fgui.DragEvent.DRAG_END);
                dragEvent.stageX = stageX || fgui.GRoot.mouseX;
                dragEvent.stageY = stageY || fgui.GRoot.mouseY;
                dragEvent.touchPointID = touchPointID || 0;
                tmp.dispatchEvent(dragEvent);
            }
            sGlobalDragStart.x = stageX || fgui.GRoot.mouseX;
            sGlobalDragStart.y = stageY || fgui.GRoot.mouseY;
            this.localToGlobalRect(0, 0, this._width, this._height, sGlobalRect);
            this._dragTesting = true;
            GObject.draggingObject = this;
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__moving, this);
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_END, this.__end, this);
        };
        GObject.prototype.dragEnd = function () {
            if (GObject.draggingObject == this) {
                this.reset();
                this._dragTesting = false;
                GObject.draggingObject = null;
            }
        };
        GObject.prototype.reset = function () {
            fgui.GRoot.inst.nativeStage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.__moving, this);
            fgui.GRoot.inst.nativeStage.removeEventListener(egret.TouchEvent.TOUCH_END, this.__end, this);
        };
        GObject.prototype.__begin = function (evt) {
            if (this._dragStartPos == null)
                this._dragStartPos = new egret.Point();
            this._dragStartPos.x = evt.stageX;
            this._dragStartPos.y = evt.stageY;
            this._dragTesting = true;
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__moving, this);
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_END, this.__end, this);
        };
        GObject.prototype.__moving = function (evt) {
            if (GObject.draggingObject != this && this._draggable && this._dragTesting) {
                var sensitivity = fgui.UIConfig.touchDragSensitivity;
                if (this._dragStartPos
                    && Math.abs(this._dragStartPos.x - evt.stageX) < sensitivity
                    && Math.abs(this._dragStartPos.y - evt.stageY) < sensitivity)
                    return;
                this._dragTesting = false;
                var dragEvent = new fgui.DragEvent(fgui.DragEvent.DRAG_START);
                dragEvent.stageX = evt.stageX;
                dragEvent.stageY = evt.stageY;
                dragEvent.touchPointID = evt.touchPointID;
                this.dispatchEvent(dragEvent);
                if (!dragEvent.isDefaultPrevented())
                    this.dragBegin(evt.touchPointID, evt.stageX, evt.stageY);
            }
            if (GObject.draggingObject == this) {
                var xx = evt.stageX - sGlobalDragStart.x + sGlobalRect.x;
                var yy = evt.stageY - sGlobalDragStart.y + sGlobalRect.y;
                if (this._dragBounds) {
                    var rect = fgui.GRoot.inst.localToGlobalRect(this._dragBounds.x, this._dragBounds.y, this._dragBounds.width, this._dragBounds.height, sDragHelperRect);
                    if (xx < rect.x)
                        xx = rect.x;
                    else if (xx + sGlobalRect.width > rect.right) {
                        xx = rect.right - sGlobalRect.width;
                        if (xx < rect.x)
                            xx = rect.x;
                    }
                    if (yy < rect.y)
                        yy = rect.y;
                    else if (yy + sGlobalRect.height > rect.bottom) {
                        yy = rect.bottom - sGlobalRect.height;
                        if (yy < rect.y)
                            yy = rect.y;
                    }
                }
                sUpdateInDragging = true;
                var pt = this.parent.globalToLocal(xx, yy, sHelperPoint);
                this.setXY(Math.round(pt.x), Math.round(pt.y));
                sUpdateInDragging = false;
                var dragEvent = new fgui.DragEvent(fgui.DragEvent.DRAG_MOVING);
                dragEvent.stageX = evt.stageX;
                dragEvent.stageY = evt.stageY;
                dragEvent.touchPointID = evt.touchPointID;
                this.dispatchEvent(dragEvent);
            }
        };
        GObject.prototype.__end = function (evt) {
            if (GObject.draggingObject == this) {
                GObject.draggingObject = null;
                this.reset();
                var dragEvent = new fgui.DragEvent(fgui.DragEvent.DRAG_END);
                dragEvent.stageX = evt.stageX;
                dragEvent.stageY = evt.stageY;
                dragEvent.touchPointID = evt.touchPointID;
                this.dispatchEvent(dragEvent);
            }
            else if (this._dragTesting) {
                this._dragTesting = false;
                this.reset();
            }
        };
        GObject.XY_CHANGED = "__xyChanged";
        GObject.SIZE_CHANGED = "__sizeChanged";
        GObject.SIZE_DELAY_CHANGE = "__sizeDelayChange";
        GObject.GEAR_STOP = "gearStop";
        return GObject;
    }(egret.EventDispatcher));
    fgui.GObject = GObject;
    var _gInstanceCounter = 0;
    var sGlobalDragStart = new egret.Point();
    var sGlobalRect = new egret.Rectangle();
    var sHelperPoint = new egret.Point();
    var sDragHelperRect = new egret.Rectangle();
    var sUpdateInDragging;
})(fgui || (fgui = {}));

(function (fgui) {
    var GComponent = (function (_super_1) {
        __extends(GComponent, _super_1);
        function GComponent() {
            var _this = _super_1.call(this) || this;
            _this._sortingChildCount = 0;
            _this._childrenRenderOrder = fgui.ChildrenRenderOrder.Ascent;
            _this._apexIndex = 0;
            _this._children = new Array();
            _this._controllers = new Array();
            _this._transitions = new Array();
            _this._margin = new fgui.Margin();
            _this._alignOffset = new egret.Point();
            return _this;
        }
        GComponent.prototype.createDisplayObject = function () {
            this._rootContainer = new fgui.UIContainer();
            this.setDisplayObject(this._rootContainer);
            this._container = this._rootContainer;
        };
        GComponent.prototype.dispose = function () {
            var i;
            var cnt;
            cnt = this._transitions.length;
            for (i = 0; i < cnt; ++i) {
                var trans = this._transitions[i];
                trans.dispose();
            }
            cnt = this._controllers.length;
            for (i = 0; i < cnt; ++i) {
                var cc = this._controllers[i];
                cc.dispose();
            }
            if (this._scrollPane)
                this._scrollPane.dispose();
            cnt = this._children.length;
            for (i = cnt - 1; i >= 0; --i) {
                var obj = this._children[i];
                obj.parent = null;
                obj.dispose();
            }
            this._boundsChanged = false;
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GComponent.prototype, "displayListContainer", {
            get: function () {
                return this._container;
            },
            enumerable: true,
            configurable: true
        });
        GComponent.prototype.addChild = function (child) {
            this.addChildAt(child, this._children.length);
            return child;
        };
        GComponent.prototype.addChildAt = function (child, index) {
            if (index === void 0) { index = 0; }
            if (!child)
                throw "child is null";
            var numChildren = this._children.length;
            if (index >= 0 && index <= numChildren) {
                if (child.parent == this) {
                    this.setChildIndex(child, index);
                }
                else {
                    child.removeFromParent();
                    child.parent = this;
                    var cnt = this._children.length;
                    if (child.sortingOrder != 0) {
                        this._sortingChildCount++;
                        index = this.getInsertPosForSortingChild(child);
                    }
                    else if (this._sortingChildCount > 0) {
                        if (index > (cnt - this._sortingChildCount))
                            index = cnt - this._sortingChildCount;
                    }
                    if (index == cnt)
                        this._children.push(child);
                    else
                        this._children.splice(index, 0, child);
                    this.childStateChanged(child);
                    this.setBoundsChangedFlag();
                }
                return child;
            }
            else {
                throw "Invalid child index";
            }
        };
        GComponent.prototype.getInsertPosForSortingChild = function (target) {
            var cnt = this._children.length;
            var i = 0;
            for (i = 0; i < cnt; i++) {
                var child = this._children[i];
                if (child == target)
                    continue;
                if (target.sortingOrder < child.sortingOrder)
                    break;
            }
            return i;
        };
        GComponent.prototype.removeChild = function (child, dispose) {
            var childIndex = this._children.indexOf(child);
            if (childIndex != -1) {
                this.removeChildAt(childIndex, dispose);
            }
            return child;
        };
        GComponent.prototype.removeChildAt = function (index, dispose) {
            if (index >= 0 && index < this.numChildren) {
                var child = this._children[index];
                child.parent = null;
                if (child.sortingOrder != 0)
                    this._sortingChildCount--;
                this._children.splice(index, 1);
                child.group = null;
                if (child.inContainer) {
                    this._container.removeChild(child.displayObject);
                    if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Arch)
                        fgui.GTimers.inst.callLater(this.buildNativeDisplayList, this);
                }
                if (dispose)
                    child.dispose();
                this.setBoundsChangedFlag();
                return child;
            }
            else {
                throw "Invalid child index";
            }
        };
        GComponent.prototype.removeChildren = function (beginIndex, endIndex, dispose) {
            if (beginIndex == undefined)
                beginIndex = 0;
            if (endIndex == undefined)
                endIndex = -1;
            if (endIndex < 0 || endIndex >= this.numChildren)
                endIndex = this.numChildren - 1;
            for (var i = beginIndex; i <= endIndex; ++i)
                this.removeChildAt(beginIndex, dispose);
        };
        GComponent.prototype.getChildAt = function (index) {
            if (index >= 0 && index < this.numChildren)
                return this._children[index];
            else
                throw "Invalid child index";
        };
        GComponent.prototype.getChild = function (name) {
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                if (this._children[i].name == name)
                    return this._children[i];
            }
            return null;
        };
        GComponent.prototype.getChildByPath = function (path) {
            var arr = path.split(".");
            var cnt = arr.length;
            var gcom = this;
            var obj;
            for (var i = 0; i < cnt; ++i) {
                obj = gcom.getChild(arr[i]);
                if (!obj)
                    break;
                if (i != cnt - 1) {
                    if (!(obj instanceof GComponent)) {
                        obj = null;
                        break;
                    }
                    else
                        gcom = obj;
                }
            }
            return obj;
        };
        GComponent.prototype.getVisibleChild = function (name) {
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                var child = this._children[i];
                if (child.internalVisible && child.internalVisible && child.name == name)
                    return child;
            }
            return null;
        };
        GComponent.prototype.getChildInGroup = function (name, group) {
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                var child = this._children[i];
                if (child.group == group && child.name == name)
                    return child;
            }
            return null;
        };
        GComponent.prototype.getChildById = function (id) {
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                if (this._children[i]._id == id)
                    return this._children[i];
            }
            return null;
        };
        GComponent.prototype.getChildIndex = function (child) {
            return this._children.indexOf(child);
        };
        GComponent.prototype.setChildIndex = function (child, index) {
            var oldIndex = this._children.indexOf(child);
            if (oldIndex == -1)
                throw "Not a child of this container";
            if (child.sortingOrder != 0)
                return;
            var cnt = this._children.length;
            if (this._sortingChildCount > 0) {
                if (index > (cnt - this._sortingChildCount - 1))
                    index = cnt - this._sortingChildCount - 1;
            }
            this._setChildIndex(child, oldIndex, index);
        };
        GComponent.prototype.setChildIndexBefore = function (child, index) {
            var oldIndex = this._children.indexOf(child);
            if (oldIndex == -1)
                throw "Not a child of this container";
            if (child.sortingOrder != 0)
                return oldIndex;
            var cnt = this._children.length;
            if (this._sortingChildCount > 0) {
                if (index > (cnt - this._sortingChildCount - 1))
                    index = cnt - this._sortingChildCount - 1;
            }
            if (oldIndex < index)
                return this._setChildIndex(child, oldIndex, index - 1);
            else
                return this._setChildIndex(child, oldIndex, index);
        };
        GComponent.prototype._setChildIndex = function (child, oldIndex, index) {
            var cnt = this._children.length;
            if (index > cnt)
                index = cnt;
            if (oldIndex == index)
                return oldIndex;
            this._children.splice(oldIndex, 1);
            this._children.splice(index, 0, child);
            if (child.inContainer) {
                var displayIndex = 0;
                var g;
                var i;
                if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Ascent) {
                    for (i = 0; i < index; i++) {
                        g = this._children[i];
                        if (g.inContainer)
                            displayIndex++;
                    }
                    if (displayIndex == this._container.numChildren)
                        displayIndex--;
                    this._container.setChildIndex(child.displayObject, displayIndex);
                }
                else if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Descent) {
                    for (i = cnt - 1; i > index; i--) {
                        g = this._children[i];
                        if (g.inContainer)
                            displayIndex++;
                    }
                    if (displayIndex == this._container.numChildren)
                        displayIndex--;
                    this._container.setChildIndex(child.displayObject, displayIndex);
                }
                else {
                    fgui.GTimers.inst.callLater(this.buildNativeDisplayList, this);
                }
                this.setBoundsChangedFlag();
            }
            return index;
        };
        GComponent.prototype.swapChildren = function (child1, child2) {
            var index1 = this._children.indexOf(child1);
            var index2 = this._children.indexOf(child2);
            if (index1 == -1 || index2 == -1)
                throw "Not a child of this container";
            this.swapChildrenAt(index1, index2);
        };
        GComponent.prototype.swapChildrenAt = function (index1, index2) {
            var child1 = this._children[index1];
            var child2 = this._children[index2];
            this.setChildIndex(child1, index2);
            this.setChildIndex(child2, index1);
        };
        Object.defineProperty(GComponent.prototype, "numChildren", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        GComponent.prototype.isAncestorOf = function (child) {
            if (!child)
                return false;
            var p = child.parent;
            while (p) {
                if (p == this)
                    return true;
                p = p.parent;
            }
            return false;
        };
        GComponent.prototype.addController = function (controller) {
            this._controllers.push(controller);
            controller.parent = this;
            this.applyController(controller);
        };
        GComponent.prototype.getControllerAt = function (index) {
            return this._controllers[index];
        };
        GComponent.prototype.getController = function (name) {
            var cnt = this._controllers.length;
            for (var i = 0; i < cnt; ++i) {
                var c = this._controllers[i];
                if (c.name == name)
                    return c;
            }
            return null;
        };
        GComponent.prototype.removeController = function (c) {
            var index = this._controllers.indexOf(c);
            if (index == -1)
                throw "controller not exists";
            c.parent = null;
            this._controllers.splice(index, 1);
            var length = this._children.length;
            for (var i = 0; i < length; i++) {
                var child = this._children[i];
                child.handleControllerChanged(c);
            }
        };
        Object.defineProperty(GComponent.prototype, "controllers", {
            get: function () {
                return this._controllers;
            },
            enumerable: true,
            configurable: true
        });
        GComponent.prototype.childStateChanged = function (child) {
            if (this._buildingDisplayList)
                return;
            var cnt = this._children.length;
            var g;
            var i;
            if (child instanceof fgui.GGroup) {
                for (i = 0; i < cnt; i++) {
                    g = this._children[i];
                    if (g.group == child)
                        this.childStateChanged(g);
                }
                return;
            }
            if (!child.displayObject)
                return;
            if (child.internalVisible) {
                if (!child.displayObject.parent) {
                    var index = 0;
                    if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Ascent) {
                        for (i = 0; i < cnt; i++) {
                            g = this._children[i];
                            if (g == child)
                                break;
                            if (g.displayObject && g.displayObject.parent)
                                index++;
                        }
                        this._container.addChildAt(child.displayObject, index);
                    }
                    else if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Descent) {
                        for (i = cnt - 1; i >= 0; i--) {
                            g = this._children[i];
                            if (g == child)
                                break;
                            if (g.displayObject && g.displayObject.parent)
                                index++;
                        }
                        this._container.addChildAt(child.displayObject, index);
                    }
                    else {
                        this._container.addChild(child.displayObject);
                        fgui.GTimers.inst.callLater(this.buildNativeDisplayList, this);
                    }
                }
            }
            else {
                if (child.displayObject.parent)
                    this._container.removeChild(child.displayObject);
            }
        };
        GComponent.prototype.buildNativeDisplayList = function () {
            var cnt = this._children.length;
            if (cnt == 0)
                return;
            var i;
            var child;
            switch (this._childrenRenderOrder) {
                case fgui.ChildrenRenderOrder.Ascent:
                    {
                        for (i = 0; i < cnt; i++) {
                            child = this._children[i];
                            if (child.displayObject && child.internalVisible)
                                this._container.addChild(child.displayObject);
                        }
                    }
                    break;
                case fgui.ChildrenRenderOrder.Descent:
                    {
                        for (i = cnt - 1; i >= 0; i--) {
                            child = this._children[i];
                            if (child.displayObject && child.internalVisible)
                                this._container.addChild(child.displayObject);
                        }
                    }
                    break;
                case fgui.ChildrenRenderOrder.Arch:
                    {
                        var apex = fgui.ToolSet.clamp(this._apexIndex, 0, cnt);
                        for (i = 0; i < apex; i++) {
                            child = this._children[i];
                            if (child.displayObject && child.internalVisible)
                                this._container.addChild(child.displayObject);
                        }
                        for (i = cnt - 1; i >= apex; i--) {
                            child = this._children[i];
                            if (child.displayObject && child.internalVisible)
                                this._container.addChild(child.displayObject);
                        }
                    }
                    break;
            }
        };
        GComponent.prototype.applyController = function (c) {
            this._applyingController = c;
            var child;
            var length = this._children.length;
            for (var i = 0; i < length; i++) {
                child = this._children[i];
                child.handleControllerChanged(c);
            }
            this._applyingController = null;
            c.runActions();
        };
        GComponent.prototype.applyAllControllers = function () {
            var cnt = this._controllers.length;
            for (var i = 0; i < cnt; ++i) {
                this.applyController(this._controllers[i]);
            }
        };
        GComponent.prototype.adjustRadioGroupDepth = function (obj, c) {
            var cnt = this._children.length;
            var i;
            var child;
            var myIndex = -1, maxIndex = -1;
            for (i = 0; i < cnt; i++) {
                child = this._children[i];
                if (child == obj) {
                    myIndex = i;
                }
                else if ((child instanceof fgui.GButton) && child.relatedController == c) {
                    if (i > maxIndex)
                        maxIndex = i;
                }
            }
            if (myIndex < maxIndex) {
                if (this._applyingController)
                    this._children[maxIndex].handleControllerChanged(this._applyingController);
                this.swapChildrenAt(myIndex, maxIndex);
            }
        };
        GComponent.prototype.getTransitionAt = function (index) {
            return this._transitions[index];
        };
        GComponent.prototype.getTransition = function (transName) {
            var cnt = this._transitions.length;
            for (var i = 0; i < cnt; ++i) {
                var trans = this._transitions[i];
                if (trans.name == transName)
                    return trans;
            }
            return null;
        };
        GComponent.prototype.isChildInView = function (child) {
            if (this._rootContainer.scrollRect) {
                return child.x + child.width >= 0 && child.x <= this.width
                    && child.y + child.height >= 0 && child.y <= this.height;
            }
            else if (this._scrollPane) {
                return this._scrollPane.isChildInView(child);
            }
            else
                return true;
        };
        GComponent.prototype.getFirstChildInView = function () {
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                var child = this._children[i];
                if (this.isChildInView(child))
                    return i;
            }
            return -1;
        };
        Object.defineProperty(GComponent.prototype, "scrollPane", {
            get: function () {
                return this._scrollPane;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "opaque", {
            get: function () {
                return this._rootContainer.opaque;
            },
            set: function (value) {
                this._rootContainer.opaque = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "margin", {
            get: function () {
                return this._margin;
            },
            set: function (value) {
                this._margin.copy(value);
                if (this._rootContainer.scrollRect) {
                    this._container.x = this._margin.left + this._alignOffset.x;
                    this._container.y = this._margin.top + this._alignOffset.y;
                }
                this.handleSizeChanged();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "childrenRenderOrder", {
            get: function () {
                return this._childrenRenderOrder;
            },
            set: function (value) {
                if (this._childrenRenderOrder != value) {
                    this._childrenRenderOrder = value;
                    this.buildNativeDisplayList();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "apexIndex", {
            get: function () {
                return this._apexIndex;
            },
            set: function (value) {
                if (this._apexIndex != value) {
                    this._apexIndex = value;
                    if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Arch)
                        this.buildNativeDisplayList();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "mask", {
            get: function () {
                return this._rootContainer.mask;
            },
            set: function (value) {
                this._rootContainer.mask = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "baseUserData", {
            get: function () {
                var buffer = this.packageItem.rawData;
                buffer.seek(0, 4);
                return buffer.readS();
            },
            enumerable: true,
            configurable: true
        });
        GComponent.prototype.updateScrollRect = function () {
            var rect = this._rootContainer.scrollRect;
            if (rect == null)
                rect = new egret.Rectangle();
            var w = this.width - this._margin.right;
            var h = this.height - this._margin.bottom;
            rect.setTo(0, 0, w, h);
            this._rootContainer.scrollRect = rect;
        };
        GComponent.prototype.setupScroll = function (buffer) {
            if (this._rootContainer == this._container) {
                this._container = new egret.DisplayObjectContainer();
                this._rootContainer.addChild(this._container);
            }
            this._scrollPane = new fgui.ScrollPane(this);
            this._scrollPane.setup(buffer);
            this.setBoundsChangedFlag();
        };
        GComponent.prototype.setupOverflow = function (overflow) {
            if (overflow == fgui.OverflowType.Hidden) {
                if (this._rootContainer == this._container) {
                    this._container = new egret.DisplayObjectContainer();
                    this._rootContainer.addChild(this._container);
                }
                this.updateScrollRect();
                this._container.x = this._margin.left;
                this._container.y = this._margin.top;
            }
            else if (this._margin.left != 0 || this._margin.top != 0) {
                if (this._rootContainer == this._container) {
                    this._container = new egret.DisplayObjectContainer();
                    this._rootContainer.addChild(this._container);
                }
                this._container.x = this._margin.left;
                this._container.y = this._margin.top;
            }
            this.setBoundsChangedFlag();
        };
        GComponent.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (this._scrollPane)
                this._scrollPane.onOwnerSizeChanged();
            else if (this._rootContainer.scrollRect)
                this.updateScrollRect();
            if (this._rootContainer.hitArea instanceof fgui.PixelHitTest) {
                var hitTest = (this._rootContainer.hitArea);
                if (this.sourceWidth != 0)
                    hitTest.scaleX = this._width / this.sourceWidth;
                if (this.sourceHeight != 0)
                    hitTest.scaleY = this._height / this.sourceHeight;
            }
        };
        GComponent.prototype.handleGrayedChanged = function () {
            var c = this.getController("grayed");
            if (c) {
                c.selectedIndex = this.grayed ? 1 : 0;
                return;
            }
            var v = this.grayed;
            var cnt = this._children.length;
            for (var i = 0; i < cnt; ++i) {
                this._children[i].grayed = v;
            }
        };
        GComponent.prototype.handleControllerChanged = function (c) {
            _super_1.prototype.handleControllerChanged.call(this, c);
            if (this._scrollPane)
                this._scrollPane.handleControllerChanged(c);
        };
        GComponent.prototype.setBoundsChangedFlag = function () {
            if (!this._scrollPane && !this._trackBounds)
                return;
            if (!this._boundsChanged) {
                this._boundsChanged = true;
                egret.callLater(this.__render, this);
            }
        };
        GComponent.prototype.__render = function () {
            if (this._boundsChanged) {
                var len = this._children.length;
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        var child = this._children[i];
                        child.ensureSizeCorrect();
                    }
                }
                this.updateBounds();
            }
        };
        GComponent.prototype.ensureBoundsCorrect = function () {
            var len = this._children.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    var child = this._children[i];
                    child.ensureSizeCorrect();
                }
            }
            if (this._boundsChanged)
                this.updateBounds();
        };
        GComponent.prototype.updateBounds = function () {
            var ax = 0, ay = 0, aw = 0, ah = 0;
            var len = this._children.length;
            if (len > 0) {
                ax = Number.POSITIVE_INFINITY, ay = Number.POSITIVE_INFINITY;
                var ar = Number.NEGATIVE_INFINITY, ab = Number.NEGATIVE_INFINITY;
                var tmp = 0;
                var i = 0;
                for (var i = 0; i < len; i++) {
                    var child = this._children[i];
                    tmp = child.x;
                    if (tmp < ax)
                        ax = tmp;
                    tmp = child.y;
                    if (tmp < ay)
                        ay = tmp;
                    tmp = child.x + child.actualWidth;
                    if (tmp > ar)
                        ar = tmp;
                    tmp = child.y + child.actualHeight;
                    if (tmp > ab)
                        ab = tmp;
                }
                aw = ar - ax;
                ah = ab - ay;
            }
            this.setBounds(ax, ay, aw, ah);
        };
        GComponent.prototype.setBounds = function (ax, ay, aw, ah) {
            if (ah === void 0) { ah = 0; }
            this._boundsChanged = false;
            if (this._scrollPane)
                this._scrollPane.setContentSize(Math.round(ax + aw), Math.round(ay + ah));
        };
        Object.defineProperty(GComponent.prototype, "viewWidth", {
            get: function () {
                if (this._scrollPane)
                    return this._scrollPane.viewWidth;
                else
                    return this.width - this._margin.left - this._margin.right;
            },
            set: function (value) {
                if (this._scrollPane)
                    this._scrollPane.viewWidth = value;
                else
                    this.width = value + this._margin.left + this._margin.right;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComponent.prototype, "viewHeight", {
            get: function () {
                if (this._scrollPane)
                    return this._scrollPane.viewHeight;
                else
                    return this.height - this._margin.top - this._margin.bottom;
            },
            set: function (value) {
                if (this._scrollPane)
                    this._scrollPane.viewHeight = value;
                else
                    this.height = value + this._margin.top + this._margin.bottom;
            },
            enumerable: true,
            configurable: true
        });
        GComponent.prototype.getSnappingPosition = function (xValue, yValue, resultPoint) {
            if (!resultPoint)
                resultPoint = new egret.Point();
            var cnt = this._children.length;
            if (cnt == 0) {
                resultPoint.x = 0;
                resultPoint.y = 0;
                return resultPoint;
            }
            this.ensureBoundsCorrect();
            var obj = null;
            var prev = null;
            var i = 0;
            if (yValue != 0) {
                for (; i < cnt; i++) {
                    obj = this._children[i];
                    if (yValue < obj.y) {
                        if (i == 0) {
                            yValue = 0;
                            break;
                        }
                        else {
                            prev = this._children[i - 1];
                            if (yValue < prev.y + prev.actualHeight / 2)
                                yValue = prev.y;
                            else
                                yValue = obj.y;
                            break;
                        }
                    }
                }
                if (i == cnt)
                    yValue = obj.y;
            }
            if (xValue != 0) {
                if (i > 0)
                    i--;
                for (; i < cnt; i++) {
                    obj = this._children[i];
                    if (xValue < obj.x) {
                        if (i == 0) {
                            xValue = 0;
                            break;
                        }
                        else {
                            prev = this._children[i - 1];
                            if (xValue < prev.x + prev.actualWidth / 2)
                                xValue = prev.x;
                            else
                                xValue = obj.x;
                            break;
                        }
                    }
                }
                if (i == cnt)
                    xValue = obj.x;
            }
            resultPoint.x = xValue;
            resultPoint.y = yValue;
            return resultPoint;
        };
        GComponent.prototype.childSortingOrderChanged = function (child, oldValue, newValue) {
            if (newValue === void 0) { newValue = 0; }
            if (newValue == 0) {
                this._sortingChildCount--;
                this.setChildIndex(child, this._children.length);
            }
            else {
                if (oldValue == 0)
                    this._sortingChildCount++;
                var oldIndex = this._children.indexOf(child);
                var index = this.getInsertPosForSortingChild(child);
                if (oldIndex < index)
                    this._setChildIndex(child, oldIndex, index - 1);
                else
                    this._setChildIndex(child, oldIndex, index);
            }
        };
        GComponent.prototype.constructFromResource = function () {
            this.constructFromResource2(null, 0);
        };
        GComponent.prototype.constructFromResource2 = function (objectPool, poolIndex) {
            var contentItem = this.packageItem.getBranch();
            if (!contentItem.decoded) {
                contentItem.decoded = true;
                fgui.TranslationHelper.translateComponent(contentItem);
            }
            var i;
            var dataLen;
            var curPos;
            var nextPos;
            var f1;
            var f2;
            var i1;
            var i2;
            var buffer = contentItem.rawData;
            buffer.seek(0, 0);
            this._underConstruct = true;
            this.sourceWidth = buffer.readInt();
            this.sourceHeight = buffer.readInt();
            this.initWidth = this.sourceWidth;
            this.initHeight = this.sourceHeight;
            this.setSize(this.sourceWidth, this.sourceHeight);
            if (buffer.readBool()) {
                this.minWidth = buffer.readInt();
                this.maxWidth = buffer.readInt();
                this.minHeight = buffer.readInt();
                this.maxHeight = buffer.readInt();
            }
            if (buffer.readBool()) {
                f1 = buffer.readFloat();
                f2 = buffer.readFloat();
                this.internalSetPivot(f1, f2, buffer.readBool());
            }
            if (buffer.readBool()) {
                this._margin.top = buffer.readInt();
                this._margin.bottom = buffer.readInt();
                this._margin.left = buffer.readInt();
                this._margin.right = buffer.readInt();
            }
            var overflow = buffer.readByte();
            if (overflow == fgui.OverflowType.Scroll) {
                var savedPos = buffer.position;
                buffer.seek(0, 7);
                this.setupScroll(buffer);
                buffer.position = savedPos;
            }
            else
                this.setupOverflow(overflow);
            if (buffer.readBool())
                buffer.skip(8);
            this._buildingDisplayList = true;
            buffer.seek(0, 1);
            var controllerCount = buffer.readShort();
            for (i = 0; i < controllerCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                var controller = new fgui.Controller();
                this._controllers.push(controller);
                controller.parent = this;
                controller.setup(buffer);
                buffer.position = nextPos;
            }
            buffer.seek(0, 2);
            var child;
            var childCount = buffer.readShort();
            for (i = 0; i < childCount; i++) {
                dataLen = buffer.readShort();
                curPos = buffer.position;
                if (objectPool)
                    child = objectPool[poolIndex + i];
                else {
                    buffer.seek(curPos, 0);
                    var type = buffer.readByte();
                    var src = buffer.readS();
                    var pkgId = buffer.readS();
                    var pi = null;
                    if (src != null) {
                        var pkg;
                        if (pkgId != null)
                            pkg = fgui.UIPackage.getById(pkgId);
                        else
                            pkg = contentItem.owner;
                        pi = pkg ? pkg.getItemById(src) : null;
                    }
                    if (pi) {
                        child = fgui.UIObjectFactory.newObject(pi);
                        child.constructFromResource();
                    }
                    else
                        child = fgui.UIObjectFactory.newObject(type);
                }
                child._underConstruct = true;
                child.setup_beforeAdd(buffer, curPos);
                child.parent = this;
                this._children.push(child);
                buffer.position = curPos + dataLen;
            }
            buffer.seek(0, 3);
            this.relations.setup(buffer, true);
            buffer.seek(0, 2);
            buffer.skip(2);
            for (i = 0; i < childCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                buffer.seek(buffer.position, 3);
                this._children[i].relations.setup(buffer, false);
                buffer.position = nextPos;
            }
            buffer.seek(0, 2);
            buffer.skip(2);
            for (i = 0; i < childCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                child = this._children[i];
                child.setup_afterAdd(buffer, buffer.position);
                child._underConstruct = false;
                buffer.position = nextPos;
            }
            buffer.seek(0, 4);
            buffer.skip(2);
            this.opaque = buffer.readBool();
            var maskId = buffer.readShort();
            if (maskId != -1) {
                this.mask = this.getChildAt(maskId).displayObject;
                buffer.readBool();
            }
            var hitTestId = buffer.readS();
            i1 = buffer.readInt();
            i2 = buffer.readInt();
            if (hitTestId != null) {
                pi = contentItem.owner.getItemById(hitTestId);
                if (pi && pi.pixelHitTestData)
                    this._rootContainer.hitArea = new fgui.PixelHitTest(pi.pixelHitTestData, i1, i2);
            }
            else if (i1 != 0 && i2 != -1) {
                this._rootContainer.hitArea = this.getChildAt(i2).displayObject;
            }
            buffer.seek(0, 5);
            var transitionCount = buffer.readShort();
            for (i = 0; i < transitionCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                var trans = new fgui.Transition(this);
                trans.setup(buffer);
                this._transitions.push(trans);
                buffer.position = nextPos;
            }
            if (this._transitions.length > 0) {
                this.displayObject.addEventListener(egret.Event.ADDED_TO_STAGE, this.___added, this);
                this.displayObject.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.___removed, this);
            }
            this.applyAllControllers();
            this._buildingDisplayList = false;
            this._underConstruct = false;
            this.buildNativeDisplayList();
            this.setBoundsChangedFlag();
            if (contentItem.objectType != fgui.ObjectType.Component)
                this.constructExtension(buffer);
            this.onConstruct();
        };
        GComponent.prototype.onConstruct = function () {
            this.constructFromXML(null);
        };
        GComponent.prototype.constructExtension = function (buffer) {
        };
        GComponent.prototype.constructFromXML = function (xml) {
        };
        GComponent.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 4);
            var pageController = buffer.readShort();
            if (pageController != -1 && this._scrollPane)
                this._scrollPane.pageController = this._parent.getControllerAt(pageController);
            var cnt = buffer.readShort();
            for (var i = 0; i < cnt; i++) {
                var cc = this.getController(buffer.readS());
                var pageId = buffer.readS();
                if (cc)
                    cc.selectedPageId = pageId;
            }
            if (buffer.version >= 2) {
                cnt = buffer.readShort();
                for (i = 0; i < cnt; i++) {
                    var target = buffer.readS();
                    var propertyId = buffer.readShort();
                    var value = buffer.readS();
                    var obj = this.getChildByPath(target);
                    if (obj)
                        obj.setProp(propertyId, value);
                }
            }
        };
        GComponent.prototype.___added = function (evt) {
            var cnt = this._transitions.length;
            for (var i = 0; i < cnt; ++i) {
                this._transitions[i].onOwnerAddedToStage();
            }
        };
        GComponent.prototype.___removed = function (evt) {
            var cnt = this._transitions.length;
            for (var i = 0; i < cnt; ++i) {
                this._transitions[i].onOwnerRemovedFromStage();
            }
        };
        return GComponent;
    }(fgui.GObject));
    fgui.GComponent = GComponent;
})(fgui || (fgui = {}));

(function (fgui) {
    var GButton = (function (_super_1) {
        __extends(GButton, _super_1);
        function GButton() {
            var _this = _super_1.call(this) || this;
            _this._mode = fgui.ButtonMode.Common;
            _this._title = "";
            _this._icon = "";
            _this._sound = fgui.UIConfig.buttonSound;
            _this._soundVolumeScale = fgui.UIConfig.buttonSoundVolumeScale;
            _this._changeStateOnClick = true;
            _this._downEffect = 0;
            _this._downEffectValue = 0.8;
            return _this;
        }
        Object.defineProperty(GButton.prototype, "icon", {
            get: function () {
                return this._icon;
            },
            set: function (value) {
                this._icon = value;
                value = (this._selected && this._selectedIcon) ? this._selectedIcon : this._icon;
                if (this._iconObject)
                    this._iconObject.icon = value;
                this.updateGear(7);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "selectedIcon", {
            get: function () {
                return this._selectedIcon;
            },
            set: function (value) {
                this._selectedIcon = value;
                value = (this._selected && this._selectedIcon) ? this._selectedIcon : this._icon;
                if (this._iconObject)
                    this._iconObject.icon = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "title", {
            get: function () {
                return this._title;
            },
            set: function (value) {
                this._title = value;
                if (this._titleObject)
                    this._titleObject.text = (this._selected && this._selectedTitle) ? this._selectedTitle : this._title;
                this.updateGear(6);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "text", {
            get: function () {
                return this.title;
            },
            set: function (value) {
                this.title = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "selectedTitle", {
            get: function () {
                return this._selectedTitle;
            },
            set: function (value) {
                this._selectedTitle = value;
                if (this._titleObject)
                    this._titleObject.text = (this._selected && this._selectedTitle) ? this._selectedTitle : this._title;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "titleColor", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.color;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.color = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "titleFontSize", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.fontSize;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.fontSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "sound", {
            get: function () {
                return this._sound;
            },
            set: function (val) {
                this._sound = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "soundVolumeScale", {
            get: function () {
                return this._soundVolumeScale;
            },
            set: function (value) {
                this._soundVolumeScale = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            set: function (val) {
                if (this._mode == fgui.ButtonMode.Common)
                    return;
                if (this._selected != val) {
                    this._selected = val;
                    if (this.grayed && this._buttonController && this._buttonController.hasPage(GButton.DISABLED)) {
                        if (this._selected)
                            this.setState(GButton.SELECTED_DISABLED);
                        else
                            this.setState(GButton.DISABLED);
                    }
                    else {
                        if (this._selected)
                            this.setState(this._over ? GButton.SELECTED_OVER : GButton.DOWN);
                        else
                            this.setState(this._over ? GButton.OVER : GButton.UP);
                    }
                    if (this._selectedTitle && this._titleObject)
                        this._titleObject.text = this._selected ? this._selectedTitle : this._title;
                    if (this._selectedIcon) {
                        var str = this._selected ? this._selectedIcon : this._icon;
                        if (this._iconObject)
                            this._iconObject.icon = str;
                    }
                    if (this._relatedController
                        && this._parent
                        && !this._parent._buildingDisplayList) {
                        if (this._selected) {
                            this._relatedController.selectedPageId = this._relatedPageId;
                            if (this._relatedController.autoRadioGroupDepth)
                                this._parent.adjustRadioGroupDepth(this, this._relatedController);
                        }
                        else if (this._mode == fgui.ButtonMode.Check && this._relatedController.selectedPageId == this._relatedPageId)
                            this._relatedController.oppositePageId = this._relatedPageId;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "mode", {
            get: function () {
                return this._mode;
            },
            set: function (value) {
                if (this._mode != value) {
                    if (value == fgui.ButtonMode.Common)
                        this.selected = false;
                    this._mode = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "relatedController", {
            get: function () {
                return this._relatedController;
            },
            set: function (val) {
                this._relatedController = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "relatedPageId", {
            get: function () {
                return this._relatedPageId;
            },
            set: function (val) {
                this._relatedPageId = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "changeStateOnClick", {
            get: function () {
                return this._changeStateOnClick;
            },
            set: function (value) {
                this._changeStateOnClick = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GButton.prototype, "linkedPopup", {
            get: function () {
                return this._linkedPopup;
            },
            set: function (value) {
                this._linkedPopup = value;
            },
            enumerable: true,
            configurable: true
        });
        GButton.prototype.getTextField = function () {
            if (this._titleObject instanceof fgui.GTextField)
                return this._titleObject;
            else if ((this._titleObject instanceof fgui.GLabel) || (this._titleObject instanceof GButton))
                return this._titleObject.getTextField();
            else
                return null;
        };
        GButton.prototype.addStateListener = function (listener, thisObj) {
            this.addEventListener(fgui.StateChangeEvent.CHANGED, listener, thisObj);
        };
        GButton.prototype.removeStateListener = function (listener, thisObj) {
            this.removeEventListener(fgui.StateChangeEvent.CHANGED, listener, thisObj);
        };
        GButton.prototype.fireClick = function (downEffect) {
            if (downEffect && this._mode == fgui.ButtonMode.Common) {
                this.setState(GButton.OVER);
                fgui.GTimers.inst.add(100, 1, function () { this.setState(GButton.DOWN); }, this);
                fgui.GTimers.inst.add(200, 1, function () { this.setState(GButton.UP); }, this);
            }
            this.__click(null);
        };
        GButton.prototype.setState = function (val) {
            if (this._buttonController)
                this._buttonController.selectedPage = val;
            if (this._downEffect == 1) {
                var cnt = this.numChildren;
                if (val == GButton.DOWN || val == GButton.SELECTED_OVER || val == GButton.SELECTED_DISABLED) {
                    var r = this._downEffectValue * 255;
                    var color = (r << 16) + (r << 8) + r;
                    for (var i = 0; i < cnt; i++) {
                        var obj = this.getChildAt(i);
                        if (obj["color"] != undefined && !(obj instanceof fgui.GTextField))
                            obj.color = color;
                    }
                }
                else {
                    for (var i = 0; i < cnt; i++) {
                        var obj = this.getChildAt(i);
                        if (obj["color"] != undefined && !(obj instanceof fgui.GTextField))
                            obj.color = 0xFFFFFF;
                    }
                }
            }
            else if (this._downEffect == 2) {
                if (val == GButton.DOWN || val == GButton.SELECTED_OVER || val == GButton.SELECTED_DISABLED) {
                    if (!this._downScaled) {
                        this._downScaled = true;
                        this._rootContainer.cacheHitArea(true);
                        this.setScale(this.scaleX * this._downEffectValue, this.scaleY * this._downEffectValue);
                    }
                }
                else {
                    if (this._downScaled) {
                        this._downScaled = false;
                        this._rootContainer.cacheHitArea(false);
                        this.setScale(this.scaleX / this._downEffectValue, this.scaleY / this._downEffectValue);
                    }
                }
            }
        };
        GButton.prototype.handleControllerChanged = function (c) {
            _super_1.prototype.handleControllerChanged.call(this, c);
            if (this._relatedController == c)
                this.selected = this._relatedPageId == c.selectedPageId;
        };
        GButton.prototype.handleGrayedChanged = function () {
            if (this._buttonController && this._buttonController.hasPage(GButton.DISABLED)) {
                if (this.grayed) {
                    if (this._selected && this._buttonController.hasPage(GButton.SELECTED_DISABLED))
                        this.setState(GButton.SELECTED_DISABLED);
                    else
                        this.setState(GButton.DISABLED);
                }
                else if (this._selected)
                    this.setState(GButton.DOWN);
                else
                    this.setState(GButton.UP);
            }
            else
                _super_1.prototype.handleGrayedChanged.call(this);
        };
        GButton.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.titleColor;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            return tf.strokeColor;
                        else
                            return 0;
                    }
                case fgui.ObjectPropID.FontSize:
                    return this.titleFontSize;
                case fgui.ObjectPropID.Selected:
                    return this.selected;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GButton.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.titleColor = value;
                    break;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            tf.strokeColor = value;
                    }
                    break;
                case fgui.ObjectPropID.FontSize:
                    this.titleFontSize = value;
                    break;
                case fgui.ObjectPropID.Selected:
                    this.selected = value;
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GButton.prototype.constructExtension = function (buffer) {
            buffer.seek(0, 6);
            this._mode = buffer.readByte();
            var str = buffer.readS();
            if (str)
                this._sound = str;
            this._soundVolumeScale = buffer.readFloat();
            this._downEffect = buffer.readByte();
            this._downEffectValue = buffer.readFloat();
            if (this._downEffect == 2)
                this.setPivot(0.5, 0.5, this.pivotAsAnchor);
            this._buttonController = this.getController("button");
            this._titleObject = this.getChild("title");
            this._iconObject = this.getChild("icon");
            if (this._titleObject)
                this._title = this._titleObject.text;
            if (this._iconObject)
                this._icon = this._iconObject.icon;
            if (this._mode == fgui.ButtonMode.Common)
                this.setState(GButton.UP);
            this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__mousedown, this);
            this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.__click, this);
        };
        GButton.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!buffer.seek(beginPos, 6))
                return;
            if (buffer.readByte() != this.packageItem.objectType)
                return;
            var str;
            var iv;
            str = buffer.readS();
            if (str != null)
                this.title = str;
            str = buffer.readS();
            if (str != null)
                this.selectedTitle = str;
            str = buffer.readS();
            if (str != null)
                this.icon = str;
            str = buffer.readS();
            if (str != null)
                this.selectedIcon = str;
            if (buffer.readBool())
                this.titleColor = buffer.readColor();
            iv = buffer.readInt();
            if (iv != 0)
                this.titleFontSize = iv;
            iv = buffer.readShort();
            if (iv >= 0)
                this._relatedController = this.parent.getControllerAt(iv);
            this._relatedPageId = buffer.readS();
            str = buffer.readS();
            if (str != null)
                this._sound = str;
            if (buffer.readBool())
                this._soundVolumeScale = buffer.readFloat();
            this.selected = buffer.readBool();
        };
        GButton.prototype.__mousedown = function (evt) {
            this._down = true;
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_END, this.__mouseup, this);
            if (this._mode == fgui.ButtonMode.Common) {
                if (this.grayed && this._buttonController && this._buttonController.hasPage(GButton.DISABLED))
                    this.setState(GButton.SELECTED_DISABLED);
                else
                    this.setState(GButton.DOWN);
            }
            if (this._linkedPopup) {
                if (this._linkedPopup instanceof fgui.Window)
                    this._linkedPopup.toggleStatus();
                else
                    this.root.togglePopup(this._linkedPopup, this);
            }
        };
        GButton.prototype.__mouseup = function (evt) {
            if (this._down) {
                fgui.GRoot.inst.nativeStage.removeEventListener(egret.TouchEvent.TOUCH_END, this.__mouseup, this);
                this._down = false;
                if (!this.displayObject)
                    return;
                if (this._mode == fgui.ButtonMode.Common) {
                    if (this.grayed && this._buttonController && this._buttonController.hasPage(GButton.DISABLED))
                        this.setState(GButton.DISABLED);
                    else if (this._over)
                        this.setState(GButton.OVER);
                    else
                        this.setState(GButton.UP);
                }
            }
        };
        GButton.prototype.__click = function (evt) {
            if (this._sound) {
                var pi = fgui.UIPackage.getItemByURL(this._sound);
                if (pi) {
                    var sound = pi.owner.getItemAsset(pi);
                    if (sound)
                        fgui.GRoot.inst.playOneShotSound(sound, this._soundVolumeScale);
                }
            }
            if (this._mode == fgui.ButtonMode.Check) {
                if (this._changeStateOnClick) {
                    this.selected = !this._selected;
                    this.dispatchEvent(new fgui.StateChangeEvent(fgui.StateChangeEvent.CHANGED));
                }
            }
            else if (this._mode == fgui.ButtonMode.Radio) {
                if (this._changeStateOnClick && !this._selected) {
                    this.selected = true;
                    this.dispatchEvent(new fgui.StateChangeEvent(fgui.StateChangeEvent.CHANGED));
                }
            }
            else {
                if (this._relatedController)
                    this._relatedController.selectedPageId = this._relatedPageId;
            }
        };
        GButton.UP = "up";
        GButton.DOWN = "down";
        GButton.OVER = "over";
        GButton.SELECTED_OVER = "selectedOver";
        GButton.DISABLED = "disabled";
        GButton.SELECTED_DISABLED = "selectedDisabled";
        return GButton;
    }(fgui.GComponent));
    fgui.GButton = GButton;
})(fgui || (fgui = {}));

(function (fgui) {
    var GComboBox = (function (_super_1) {
        __extends(GComboBox, _super_1);
        function GComboBox() {
            var _this = _super_1.call(this) || this;
            _this._visibleItemCount = 0;
            _this._selectedIndex = 0;
            _this._popupDirection = fgui.PopupDirection.Auto;
            _this._visibleItemCount = fgui.UIConfig.defaultComboBoxVisibleItemCount;
            _this._itemsUpdated = true;
            _this._selectedIndex = -1;
            _this._items = [];
            _this._values = [];
            return _this;
        }
        Object.defineProperty(GComboBox.prototype, "text", {
            get: function () {
                if (this._titleObject)
                    return this._titleObject.text;
                else
                    return null;
            },
            set: function (value) {
                if (this._titleObject)
                    this._titleObject.text = value;
                this.updateGear(6);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "icon", {
            get: function () {
                if (this._iconObject)
                    return this._iconObject.icon;
                else
                    return null;
            },
            set: function (value) {
                if (this._iconObject)
                    this._iconObject.icon = value;
                this.updateGear(7);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "titleColor", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.color;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.color = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "titleFontSize", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.fontSize;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.fontSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "visibleItemCount", {
            get: function () {
                return this._visibleItemCount;
            },
            set: function (value) {
                this._visibleItemCount = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "popupDirection", {
            get: function () {
                return this._popupDirection;
            },
            set: function (value) {
                this._popupDirection = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "items", {
            get: function () {
                return this._items;
            },
            set: function (value) {
                if (!value)
                    this._items.length = 0;
                else
                    this._items = value.concat();
                if (this._items.length > 0) {
                    if (this._selectedIndex >= this._items.length)
                        this._selectedIndex = this._items.length - 1;
                    else if (this._selectedIndex == -1)
                        this._selectedIndex = 0;
                    this.text = this._items[this._selectedIndex];
                    if (this._icons && this._selectedIndex < this._icons.length)
                        this.icon = this._icons[this._selectedIndex];
                }
                else {
                    this.text = "";
                    if (this._icons)
                        this.icon = null;
                    this._selectedIndex = -1;
                }
                this._itemsUpdated = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "icons", {
            get: function () {
                return this._icons;
            },
            set: function (value) {
                this._icons = value;
                if (this._icons && this._selectedIndex != -1 && this._selectedIndex < this._icons.length)
                    this.icon = this._icons[this._selectedIndex];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "values", {
            get: function () {
                return this._values;
            },
            set: function (value) {
                if (!value)
                    this._values.length = 0;
                else
                    this._values = value.concat();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "selectedIndex", {
            get: function () {
                return this._selectedIndex;
            },
            set: function (val) {
                if (this._selectedIndex == val)
                    return;
                this._selectedIndex = val;
                if (this._selectedIndex >= 0 && this._selectedIndex < this._items.length) {
                    this.text = this._items[this._selectedIndex];
                    if (this._icons && this._selectedIndex < this._icons.length)
                        this.icon = this._icons[this._selectedIndex];
                }
                else {
                    this.text = "";
                    if (this._icons)
                        this.icon = null;
                }
                this.updateSelectionController();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "value", {
            get: function () {
                return this._values[this._selectedIndex];
            },
            set: function (val) {
                var index = this._values.indexOf(val);
                if (index == -1 && val == null)
                    index = this._values.indexOf("");
                this.selectedIndex = index;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GComboBox.prototype, "selectionController", {
            get: function () {
                return this._selectionController;
            },
            set: function (value) {
                this._selectionController = value;
            },
            enumerable: true,
            configurable: true
        });
        GComboBox.prototype.getTextField = function () {
            if (this._titleObject instanceof fgui.GTextField)
                return this._titleObject;
            else if ((this._titleObject instanceof fgui.GLabel) || (this._titleObject instanceof fgui.GButton))
                return this._titleObject.getTextField();
            else
                return null;
        };
        GComboBox.prototype.setState = function (val) {
            if (this._buttonController)
                this._buttonController.selectedPage = val;
        };
        GComboBox.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.titleColor;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            return tf.strokeColor;
                        else
                            return 0;
                    }
                case fgui.ObjectPropID.FontSize:
                    {
                        tf = this.getTextField();
                        if (tf)
                            return tf.fontSize;
                        else
                            return 0;
                    }
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GComboBox.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.titleColor = value;
                    break;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            tf.strokeColor = value;
                    }
                    break;
                case fgui.ObjectPropID.FontSize:
                    {
                        tf = this.getTextField();
                        if (tf)
                            tf.fontSize = value;
                    }
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GComboBox.prototype.constructExtension = function (buffer) {
            var str;
            this._buttonController = this.getController("button");
            this._titleObject = this.getChild("title");
            this._iconObject = this.getChild("icon");
            str = buffer.readS();
            if (str) {
                this.dropdown = (fgui.UIPackage.createObjectFromURL(str));
                if (!this.dropdown) {
                    console.error("下拉框必须为元件");
                    return;
                }
                this.dropdown.name = "this.dropdown";
                this._list = this.dropdown.getChild("list").asList;
                if (this._list == null) {
                    console.error(this.resourceURL + ": 下拉框的弹出元件里必须包含名为list的列表");
                    return;
                }
                this._list.addEventListener(fgui.ItemEvent.CLICK, this.__clickItem, this);
                this._list.addRelation(this.dropdown, fgui.RelationType.Width);
                this._list.removeRelation(this.dropdown, fgui.RelationType.Height);
                this.dropdown.addRelation(this._list, fgui.RelationType.Height);
                this.dropdown.removeRelation(this._list, fgui.RelationType.Width);
                this.dropdown.displayObject.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.__popupWinClosed, this);
            }
            this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__mousedown, this);
        };
        GComboBox.prototype.handleControllerChanged = function (c) {
            _super_1.prototype.handleControllerChanged.call(this, c);
            if (this._selectionController == c)
                this.selectedIndex = c.selectedIndex;
        };
        GComboBox.prototype.updateSelectionController = function () {
            if (this._selectionController && !this._selectionController.changing
                && this._selectedIndex < this._selectionController.pageCount) {
                var c = this._selectionController;
                this._selectionController = null;
                c.selectedIndex = this._selectedIndex;
                this._selectionController = c;
            }
        };
        GComboBox.prototype.dispose = function () {
            if (this.dropdown) {
                this.dropdown.dispose();
                this.dropdown = null;
            }
            _super_1.prototype.dispose.call(this);
        };
        GComboBox.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!buffer.seek(beginPos, 6))
                return;
            if (buffer.readByte() != this.packageItem.objectType)
                return;
            var i;
            var iv;
            var nextPos;
            var str;
            var itemCount = buffer.readShort();
            for (i = 0; i < itemCount; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                this._items[i] = buffer.readS();
                this._values[i] = buffer.readS();
                str = buffer.readS();
                if (str != null) {
                    if (this._icons == null)
                        this._icons = new Array();
                    this._icons[i] = str;
                }
                buffer.position = nextPos;
            }
            str = buffer.readS();
            if (str != null) {
                this.text = str;
                this._selectedIndex = this._items.indexOf(str);
            }
            else if (this._items.length > 0) {
                this._selectedIndex = 0;
                this.text = this._items[0];
            }
            else
                this._selectedIndex = -1;
            str = buffer.readS();
            if (str != null)
                this.icon = str;
            if (buffer.readBool())
                this.titleColor = buffer.readColor();
            iv = buffer.readInt();
            if (iv > 0)
                this._visibleItemCount = iv;
            this._popupDirection = buffer.readByte();
            iv = buffer.readShort();
            if (iv >= 0)
                this._selectionController = this.parent.getControllerAt(iv);
        };
        GComboBox.prototype.showDropdown = function () {
            if (this._itemsUpdated) {
                this._itemsUpdated = false;
                this._list.removeChildrenToPool();
                var cnt = this._items.length;
                for (var i = 0; i < cnt; i++) {
                    var item = this._list.addItemFromPool();
                    item.name = i < this._values.length ? this._values[i] : "";
                    item.text = this._items[i];
                    item.icon = (this._icons && i < this._icons.length) ? this._icons[i] : null;
                }
                this._list.resizeToFit(this._visibleItemCount);
            }
            this._list.selectedIndex = -1;
            this.dropdown.width = this.width;
            this._list.ensureBoundsCorrect();
            this.root.togglePopup(this.dropdown, this, this._popupDirection);
            if (this.dropdown.parent)
                this.setState(fgui.GButton.DOWN);
        };
        GComboBox.prototype.__popupWinClosed = function (evt) {
            if (this._over)
                this.setState(fgui.GButton.OVER);
            else
                this.setState(fgui.GButton.UP);
        };
        GComboBox.prototype.__clickItem = function (evt) {
            fgui.GTimers.inst.add(100, 1, this.__clickItem2, this, this._list.getChildIndex(evt.itemObject));
        };
        GComboBox.prototype.__clickItem2 = function (index) {
            if (this.dropdown.parent instanceof fgui.GRoot)
                this.dropdown.parent.hidePopup();
            this._selectedIndex = -1;
            this.selectedIndex = index;
            this.dispatchEvent(new fgui.StateChangeEvent(fgui.StateChangeEvent.CHANGED));
        };
        GComboBox.prototype.__mousedown = function (evt) {
            if ((evt.target instanceof egret.TextField) && evt.target.type == egret.TextFieldType.INPUT)
                return;
            this._down = true;
            fgui.GRoot.inst.nativeStage.addEventListener(egret.TouchEvent.TOUCH_END, this.__mouseup, this);
            if (this.dropdown)
                this.showDropdown();
        };
        GComboBox.prototype.__mouseup = function (evt) {
            if (this._down) {
                this._down = false;
                fgui.GRoot.inst.nativeStage.removeEventListener(egret.TouchEvent.TOUCH_END, this.__mouseup, this);
                if (this.dropdown && !this.dropdown.parent) {
                    if (this._over)
                        this.setState(fgui.GButton.OVER);
                    else
                        this.setState(fgui.GButton.UP);
                }
            }
        };
        return GComboBox;
    }(fgui.GComponent));
    fgui.GComboBox = GComboBox;
})(fgui || (fgui = {}));

(function (fgui) {
    var GGraph = (function (_super_1) {
        __extends(GGraph, _super_1);
        function GGraph() {
            var _this = _super_1.call(this) || this;
            _this._type = 0;
            _this._lineSize = 0;
            _this._lineColor = 0;
            _this._fillColor = 0;
            _this._lineSize = 1;
            _this._lineAlpha = 1;
            _this._fillAlpha = 1;
            _this._fillColor = 0xFFFFFF;
            return _this;
        }
        Object.defineProperty(GGraph.prototype, "graphics", {
            get: function () {
                return this._graphics;
            },
            enumerable: true,
            configurable: true
        });
        GGraph.prototype.drawRect = function (lineSize, lineColor, lineAlpha, fillColor, fillAlpha, corner) {
            this._type = 1;
            this._lineSize = lineSize;
            this._lineColor = lineColor;
            this._lineAlpha = lineAlpha;
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._cornerRadius = corner;
            this.updateGraph();
        };
        GGraph.prototype.drawEllipse = function (lineSize, lineColor, lineAlpha, fillColor, fillAlpha) {
            this._type = 2;
            this._lineSize = lineSize;
            this._lineColor = lineColor;
            this._lineAlpha = lineAlpha;
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._cornerRadius = null;
            this.updateGraph();
        };
        GGraph.prototype.drawRegularPolygon = function (lineSize, lineColor, lineAlpha, fillColor, fillAlpha, sides, startAngle, distances) {
            this._type = 4;
            this._lineSize = lineSize;
            this._lineColor = lineColor;
            this._lineAlpha = lineAlpha;
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._sides = sides;
            this._startAngle = startAngle || 0;
            this._distances = distances;
            this.updateGraph();
        };
        GGraph.prototype.drawPolygon = function (lineSize, lineColor, lineAlpha, fillColor, fillAlpha, points) {
            this._type = 3;
            this._lineSize = lineSize;
            this._lineColor = lineColor;
            this._lineAlpha = lineAlpha;
            this._fillColor = fillColor;
            this._fillAlpha = fillAlpha;
            this._polygonPoints = points;
            this.updateGraph();
        };
        Object.defineProperty(GGraph.prototype, "distances", {
            get: function () {
                return this._distances;
            },
            set: function (value) {
                this._distances = value;
                if (this._type == 3)
                    this.updateGraph();
            },
            enumerable: true,
            configurable: true
        });
        GGraph.prototype.clearGraphics = function () {
            if (this._graphics) {
                this._type = 0;
                this._graphics.clear();
            }
        };
        Object.defineProperty(GGraph.prototype, "color", {
            get: function () {
                return this._fillColor;
            },
            set: function (value) {
                this._fillColor = value;
                if (this._type != 0)
                    this.updateGraph();
            },
            enumerable: true,
            configurable: true
        });
        GGraph.prototype.updateGraph = function () {
            var ctx = this.graphics;
            ctx.clear();
            var w = this.width;
            var h = this.height;
            if (w == 0 || h == 0)
                return;
            if (this._lineSize == 0)
                ctx.lineStyle(0, 0, 0);
            else
                ctx.lineStyle(this._lineSize, this._lineColor, this._lineAlpha);
            ctx.beginFill(this._fillColor, this._fillAlpha);
            if (this._type == 1) {
                if (this._cornerRadius) {
                    if (this._cornerRadius.length == 1)
                        ctx.drawRoundRect(0, 0, w, h, this._cornerRadius[0] * 2, this._cornerRadius[0] * 2);
                    else
                        ctx.drawRoundRect(0, 0, w, h, this._cornerRadius[0] * 2, this._cornerRadius[1] * 2);
                }
                else
                    ctx.drawRect(0, 0, w, h);
            }
            else if (this._type == 2)
                ctx.drawEllipse(0, 0, w, h);
            else if (this._type == 3) {
                fgui.ToolSet.fillPath(ctx, this._polygonPoints, 0, 0);
            }
            else if (this._type == 4) {
                if (!this._polygonPoints)
                    this._polygonPoints = [];
                var radius = Math.min(this._width, this._height) / 2;
                this._polygonPoints.length = 0;
                var angle = this._startAngle * Math.PI / 180;
                var deltaAngle = 2 * Math.PI / this._sides;
                var dist;
                for (var i = 0; i < this._sides; i++) {
                    if (this._distances) {
                        dist = this._distances[i];
                        if (isNaN(dist))
                            dist = 1;
                    }
                    else
                        dist = 1;
                    var xv = radius + radius * dist * Math.cos(angle);
                    var yv = radius + radius * dist * Math.sin(angle);
                    this._polygonPoints.push(xv, yv);
                    angle += deltaAngle;
                }
                fgui.ToolSet.fillPath(ctx, this._polygonPoints, 0, 0);
            }
            ctx.endFill();
        };
        GGraph.prototype.replaceMe = function (target) {
            if (!this._parent)
                throw "parent not set";
            target.name = this.name;
            target.alpha = this.alpha;
            target.rotation = this.rotation;
            target.visible = this.visible;
            target.touchable = this.touchable;
            target.grayed = this.grayed;
            target.setXY(this.x, this.y);
            target.setSize(this.width, this.height);
            var index = this._parent.getChildIndex(this);
            this._parent.addChildAt(target, index);
            target.relations.copyFrom(this.relations);
            this._parent.removeChild(this, true);
        };
        GGraph.prototype.addBeforeMe = function (target) {
            if (this._parent == null)
                throw "parent not set";
            var index = this._parent.getChildIndex(this);
            this._parent.addChildAt(target, index);
        };
        GGraph.prototype.addAfterMe = function (target) {
            if (this._parent == null)
                throw "parent not set";
            var index = this._parent.getChildIndex(this);
            index++;
            this._parent.addChildAt(target, index);
        };
        GGraph.prototype.setNativeObject = function (obj) {
            var sprite = new egret.Sprite();
            this.setDisplayObject(sprite);
            if (this._parent)
                this._parent.childStateChanged(this);
            this.handleXYChanged();
            sprite.alpha = this.alpha;
            sprite.rotation = this.rotation;
            sprite.visible = this.visible;
            sprite.touchEnabled = this.touchable;
            sprite.touchChildren = this.touchable;
            sprite.addChild(obj);
        };
        GGraph.prototype.createDisplayObject = function () {
            var sprite = new egret.Sprite();
            sprite.touchEnabled = true;
            this._graphics = sprite.graphics;
            this.setDisplayObject(sprite);
        };
        GGraph.prototype.getProp = function (index) {
            if (index == fgui.ObjectPropID.Color)
                return this.color;
            else
                return _super_1.prototype.getProp.call(this, index);
        };
        GGraph.prototype.setProp = function (index, value) {
            if (index == fgui.ObjectPropID.Color)
                this.color = value;
            else
                _super_1.prototype.setProp.call(this, index, value);
        };
        GGraph.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (this._type != 0)
                this.updateGraph();
        };
        GGraph.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._type = buffer.readByte();
            if (this._type != 0) {
                var i;
                var cnt;
                this._lineSize = buffer.readInt();
                var c = buffer.readColor(true);
                this._lineColor = c & 0xFFFFFF;
                this._lineAlpha = ((c >> 24) & 0xFF) / 0xFF;
                c = buffer.readColor(true);
                this._fillColor = c & 0xFFFFFF;
                this._fillAlpha = ((c >> 24) & 0xFF) / 0xFF;
                if (buffer.readBool()) {
                    this._cornerRadius = new Array(4);
                    for (i = 0; i < 4; i++)
                        this._cornerRadius[i] = buffer.readFloat();
                }
                if (this._type == 3) {
                    cnt = buffer.readShort();
                    this._polygonPoints = [];
                    this._polygonPoints.length = cnt;
                    for (i = 0; i < cnt; i++)
                        this._polygonPoints[i] = buffer.readFloat();
                }
                else if (this._type == 4) {
                    this._sides = buffer.readShort();
                    this._startAngle = buffer.readFloat();
                    cnt = buffer.readShort();
                    if (cnt > 0) {
                        this._distances = [];
                        for (i = 0; i < cnt; i++)
                            this._distances[i] = buffer.readFloat();
                    }
                }
                this.updateGraph();
            }
        };
        return GGraph;
    }(fgui.GObject));
    fgui.GGraph = GGraph;
})(fgui || (fgui = {}));

(function (fgui) {
    var GGroup = (function (_super_1) {
        __extends(GGroup, _super_1);
        function GGroup() {
            var _this = _super_1.call(this) || this;
            _this._layout = 0;
            _this._lineGap = 0;
            _this._columnGap = 0;
            _this._mainGridIndex = -1;
            _this._mainGridMinSize = 50;
            _this._mainChildIndex = -1;
            _this._totalSize = 0;
            _this._numChildren = 0;
            _this._updating = 0;
            return _this;
        }
        GGroup.prototype.dispose = function () {
            this._boundsChanged = false;
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GGroup.prototype, "layout", {
            get: function () {
                return this._layout;
            },
            set: function (value) {
                if (this._layout != value) {
                    this._layout = value;
                    this.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "lineGap", {
            get: function () {
                return this._lineGap;
            },
            set: function (value) {
                if (this._lineGap != value) {
                    this._lineGap = value;
                    this.setBoundsChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "columnGap", {
            get: function () {
                return this._columnGap;
            },
            set: function (value) {
                if (this._columnGap != value) {
                    this._columnGap = value;
                    this.setBoundsChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "excludeInvisibles", {
            get: function () {
                return this._excludeInvisibles;
            },
            set: function (value) {
                if (this._excludeInvisibles != value) {
                    this._excludeInvisibles = value;
                    this.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "autoSizeDisabled", {
            get: function () {
                return this._autoSizeDisabled;
            },
            set: function (value) {
                this._autoSizeDisabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "mainGridMinSize", {
            get: function () {
                return this._mainGridMinSize;
            },
            set: function (value) {
                if (this._mainGridMinSize != value) {
                    this._mainGridMinSize = value;
                    this.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GGroup.prototype, "mainGridIndex", {
            get: function () {
                return this._mainGridIndex;
            },
            set: function (value) {
                if (this._mainGridIndex != value) {
                    this._mainGridIndex = value;
                    this.setBoundsChangedFlag();
                }
            },
            enumerable: true,
            configurable: true
        });
        GGroup.prototype.setBoundsChangedFlag = function (positionChangedOnly) {
            if (this._updating == 0 && this._parent) {
                if (!positionChangedOnly)
                    this._percentReady = false;
                if (!this._boundsChanged) {
                    this._boundsChanged = true;
                    if (this._layout != fgui.GroupLayoutType.None)
                        fgui.GTimers.inst.callLater(this.ensureBoundsCorrect, this);
                }
            }
        };
        GGroup.prototype.ensureSizeCorrect = function () {
            if (this._parent == null || !this._boundsChanged || this._layout == 0)
                return;
            this._boundsChanged = false;
            if (this._autoSizeDisabled)
                this.resizeChildren(0, 0);
            else {
                this.handleLayout();
                this.updateBounds();
            }
        };
        GGroup.prototype.ensureBoundsCorrect = function () {
            if (this._parent == null || !this._boundsChanged)
                return;
            this._boundsChanged = false;
            if (this._layout == 0)
                this.updateBounds();
            else {
                if (this._autoSizeDisabled)
                    this.resizeChildren(0, 0);
                else {
                    this.handleLayout();
                    this.updateBounds();
                }
            }
        };
        GGroup.prototype.updateBounds = function () {
            fgui.GTimers.inst.remove(this.ensureBoundsCorrect, this);
            var cnt = this._parent.numChildren;
            var i;
            var child;
            var ax = Number.POSITIVE_INFINITY, ay = Number.POSITIVE_INFINITY;
            var ar = Number.NEGATIVE_INFINITY, ab = Number.NEGATIVE_INFINITY;
            var tmp;
            var empty = true;
            for (i = 0; i < cnt; i++) {
                child = this._parent.getChildAt(i);
                if (child.group != this || this._excludeInvisibles && !child.internalVisible3)
                    continue;
                tmp = child.xMin;
                if (tmp < ax)
                    ax = tmp;
                tmp = child.yMin;
                if (tmp < ay)
                    ay = tmp;
                tmp = child.xMin + child.width;
                if (tmp > ar)
                    ar = tmp;
                tmp = child.yMin + child.height;
                if (tmp > ab)
                    ab = tmp;
                empty = false;
            }
            var w = 0, h = 0;
            if (!empty) {
                this._updating |= 1;
                this.setXY(ax, ay);
                this._updating &= 2;
                w = ar - ax;
                h = ab - ay;
            }
            if ((this._updating & 2) == 0) {
                this._updating |= 2;
                this.setSize(w, h);
                this._updating &= 1;
            }
            else {
                this._updating &= 1;
                this.resizeChildren(this._width - w, this._height - h);
            }
        };
        GGroup.prototype.handleLayout = function () {
            this._updating |= 1;
            var child;
            var i;
            var cnt;
            if (this._layout == fgui.GroupLayoutType.Horizontal) {
                var curX = this.x;
                cnt = this._parent.numChildren;
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (this._excludeInvisibles && !child.internalVisible3)
                        continue;
                    child.xMin = curX;
                    if (child.width != 0)
                        curX += child.width + this._columnGap;
                }
            }
            else if (this._layout == fgui.GroupLayoutType.Vertical) {
                var curY = this.y;
                cnt = this._parent.numChildren;
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (this._excludeInvisibles && !child.internalVisible3)
                        continue;
                    child.yMin = curY;
                    if (child.height != 0)
                        curY += child.height + this._lineGap;
                }
            }
            this._updating &= 2;
        };
        GGroup.prototype.moveChildren = function (dx, dy) {
            if ((this._updating & 1) != 0 || this._parent == null)
                return;
            this._updating |= 1;
            var cnt = this._parent.numChildren;
            var i;
            var child;
            for (i = 0; i < cnt; i++) {
                child = this._parent.getChildAt(i);
                if (child.group == this) {
                    child.setXY(child.x + dx, child.y + dy);
                }
            }
            this._updating &= 2;
        };
        GGroup.prototype.resizeChildren = function (dw, dh) {
            if (this._layout == fgui.GroupLayoutType.None || (this._updating & 2) != 0 || this._parent == null)
                return;
            this._updating |= 2;
            if (this._boundsChanged) {
                this._boundsChanged = false;
                if (!this._autoSizeDisabled) {
                    this.updateBounds();
                    return;
                }
            }
            var cnt = this._parent.numChildren;
            var i;
            var child;
            if (!this._percentReady) {
                this._percentReady = true;
                this._numChildren = 0;
                this._totalSize = 0;
                this._mainChildIndex = -1;
                var j = 0;
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (!this._excludeInvisibles || child.internalVisible3) {
                        if (j == this._mainGridIndex)
                            this._mainChildIndex = i;
                        this._numChildren++;
                        if (this._layout == 1)
                            this._totalSize += child.width;
                        else
                            this._totalSize += child.height;
                    }
                    j++;
                }
                if (this._mainChildIndex != -1) {
                    if (this._layout == 1) {
                        child = this._parent.getChildAt(this._mainChildIndex);
                        this._totalSize += this._mainGridMinSize - child.width;
                        child._sizePercentInGroup = this._mainGridMinSize / this._totalSize;
                    }
                    else {
                        child = this._parent.getChildAt(this._mainChildIndex);
                        this._totalSize += this._mainGridMinSize - child.height;
                        child._sizePercentInGroup = this._mainGridMinSize / this._totalSize;
                    }
                }
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (i == this._mainChildIndex)
                        continue;
                    if (this._totalSize > 0)
                        child._sizePercentInGroup = (this._layout == 1 ? child.width : child.height) / this._totalSize;
                    else
                        child._sizePercentInGroup = 0;
                }
            }
            var remainSize = 0;
            var remainPercent = 1;
            var priorHandled = false;
            if (this._layout == 1) {
                remainSize = this.width - (this._numChildren - 1) * this._columnGap;
                if (this._mainChildIndex != -1 && remainSize >= this._totalSize) {
                    child = this._parent.getChildAt(this._mainChildIndex);
                    child.setSize(remainSize - (this._totalSize - this._mainGridMinSize), child._rawHeight + dh, true);
                    remainSize -= child.width;
                    remainPercent -= child._sizePercentInGroup;
                    priorHandled = true;
                }
                var curX = this.x;
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (this._excludeInvisibles && !child.internalVisible3) {
                        child.setSize(child._rawWidth, child._rawHeight + dh, true);
                        continue;
                    }
                    if (!priorHandled || i != this._mainChildIndex) {
                        child.setSize(Math.round(child._sizePercentInGroup / remainPercent * remainSize), child._rawHeight + dh, true);
                        remainPercent -= child._sizePercentInGroup;
                        remainSize -= child.width;
                    }
                    child.xMin = curX;
                    if (child.width != 0)
                        curX += child.width + this._columnGap;
                }
            }
            else {
                remainSize = this.height - (this._numChildren - 1) * this._lineGap;
                if (this._mainChildIndex != -1 && remainSize >= this._totalSize) {
                    child = this._parent.getChildAt(this._mainChildIndex);
                    child.setSize(child._rawWidth + dw, remainSize - (this._totalSize - this._mainGridMinSize), true);
                    remainSize -= child.height;
                    remainPercent -= child._sizePercentInGroup;
                    priorHandled = true;
                }
                var curY = this.y;
                for (i = 0; i < cnt; i++) {
                    child = this._parent.getChildAt(i);
                    if (child.group != this)
                        continue;
                    if (this._excludeInvisibles && !child.internalVisible3) {
                        child.setSize(child._rawWidth + dw, child._rawHeight, true);
                        continue;
                    }
                    if (!priorHandled || i != this._mainChildIndex) {
                        child.setSize(child._rawWidth + dw, Math.round(child._sizePercentInGroup / remainPercent * remainSize), true);
                        remainPercent -= child._sizePercentInGroup;
                        remainSize -= child.height;
                    }
                    child.yMin = curY;
                    if (child.height != 0)
                        curY += child.height + this._lineGap;
                }
            }
            this._updating &= 1;
        };
        GGroup.prototype.handleAlphaChanged = function () {
            if (this._underConstruct)
                return;
            var cnt = this._parent.numChildren;
            for (var i = 0; i < cnt; i++) {
                var child = this._parent.getChildAt(i);
                if (child.group == this)
                    child.alpha = this.alpha;
            }
        };
        GGroup.prototype.handleVisibleChanged = function () {
            if (!this._parent)
                return;
            var cnt = this._parent.numChildren;
            for (var i = 0; i < cnt; i++) {
                var child = this._parent.getChildAt(i);
                if (child.group == this)
                    child.handleVisibleChanged();
            }
        };
        GGroup.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._layout = buffer.readByte();
            this._lineGap = buffer.readInt();
            this._columnGap = buffer.readInt();
            if (buffer.version >= 2) {
                this._excludeInvisibles = buffer.readBool();
                this._autoSizeDisabled = buffer.readBool();
                this._mainChildIndex = buffer.readInt();
            }
        };
        GGroup.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!this.visible)
                this.handleVisibleChanged();
        };
        return GGroup;
    }(fgui.GObject));
    fgui.GGroup = GGroup;
})(fgui || (fgui = {}));

(function (fgui) {
    var GImage = (function (_super_1) {
        __extends(GImage, _super_1);
        function GImage() {
            var _this = _super_1.call(this) || this;
            _this._flip = fgui.FlipType.None;
            return _this;
        }
        Object.defineProperty(GImage.prototype, "color", {
            get: function () {
                return this._content.color;
            },
            set: function (value) {
                if (this._content.color != value) {
                    this._content.color = value;
                    this.updateGear(4);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "flip", {
            get: function () {
                return this._flip;
            },
            set: function (value) {
                if (this._flip != value) {
                    this._flip = value;
                    var sx = 1, sy = 1;
                    if (this._flip == fgui.FlipType.Horizontal || this._flip == fgui.FlipType.Both)
                        sx = -1;
                    if (this._flip == fgui.FlipType.Vertical || this._flip == fgui.FlipType.Both)
                        sy = -1;
                    this._content.scaleX = sx;
                    this._content.scaleY = sy;
                    this.handleXYChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "fillMethod", {
            get: function () {
                return this._content.fillMethod;
            },
            set: function (value) {
                this._content.fillMethod = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "fillOrigin", {
            get: function () {
                return this._content.fillOrigin;
            },
            set: function (value) {
                this._content.fillOrigin = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "fillClockwise", {
            get: function () {
                return this._content.fillClockwise;
            },
            set: function (value) {
                this._content.fillClockwise = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "fillAmount", {
            get: function () {
                return this._content.fillAmount;
            },
            set: function (value) {
                this._content.fillAmount = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GImage.prototype, "texture", {
            get: function () {
                return this._content.texture;
            },
            set: function (value) {
                if (value) {
                    this.sourceWidth = value.textureWidth;
                    this.sourceHeight = value.textureHeight;
                }
                else {
                    this.sourceWidth = 0;
                    this.sourceHeight = 0;
                }
                this.initWidth = this.sourceWidth;
                this.initHeight = this.sourceHeight;
                this._content.scale9Grid = null;
                this._content.fillMode = egret.BitmapFillMode.SCALE;
                this._content.texture = value;
            },
            enumerable: true,
            configurable: true
        });
        GImage.prototype.createDisplayObject = function () {
            this._content = new fgui.Image();
            this._content.touchEnabled = false;
            this.setDisplayObject(this._content);
        };
        GImage.prototype.constructFromResource = function () {
            var contentItem = this.packageItem.getBranch();
            this.sourceWidth = contentItem.width;
            this.sourceHeight = contentItem.height;
            this.initWidth = this.sourceWidth;
            this.initHeight = this.sourceHeight;
            this.setSize(this.sourceWidth, this.sourceHeight);
            contentItem = contentItem.getHighResolution();
            contentItem.load();
            this._content.scale9Grid = contentItem.scale9Grid;
            this._content.smoothing = contentItem.smoothing;
            if (contentItem.scaleByTile)
                this._content.fillMode = egret.BitmapFillMode.REPEAT;
            this.setSize(this.sourceWidth, this.sourceHeight);
            this._content.texture = contentItem.asset;
        };
        GImage.prototype.handleXYChanged = function () {
            _super_1.prototype.handleXYChanged.call(this);
            if (this._flip != fgui.FlipType.None) {
                if (this._content.scaleX == -1)
                    this._content.x += this.width;
                if (this._content.scaleY == -1)
                    this._content.y += this.height;
            }
        };
        GImage.prototype.getProp = function (index) {
            if (index == fgui.ObjectPropID.Color)
                return this.color;
            else
                return _super_1.prototype.getProp.call(this, index);
        };
        GImage.prototype.setProp = function (index, value) {
            if (index == fgui.ObjectPropID.Color)
                this.color = value;
            else
                _super_1.prototype.setProp.call(this, index, value);
        };
        GImage.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            if (buffer.readBool())
                this.color = buffer.readColor();
            this.flip = buffer.readByte();
            this._content.fillMethod = buffer.readByte();
            if (this._content.fillMethod != 0) {
                this._content.fillOrigin = buffer.readByte();
                this._content.fillClockwise = buffer.readBool();
                this._content.fillAmount = buffer.readFloat();
            }
        };
        return GImage;
    }(fgui.GObject));
    fgui.GImage = GImage;
})(fgui || (fgui = {}));

(function (fgui) {
    var GLabel = (function (_super_1) {
        __extends(GLabel, _super_1);
        function GLabel() {
            return _super_1.call(this) || this;
        }
        Object.defineProperty(GLabel.prototype, "icon", {
            get: function () {
                if (this._iconObject)
                    return this._iconObject.icon;
            },
            set: function (value) {
                if (this._iconObject)
                    this._iconObject.icon = value;
                this.updateGear(7);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLabel.prototype, "title", {
            get: function () {
                if (this._titleObject)
                    return this._titleObject.text;
                else
                    return null;
            },
            set: function (value) {
                if (this._titleObject)
                    this._titleObject.text = value;
                this.updateGear(6);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLabel.prototype, "text", {
            get: function () {
                return this.title;
            },
            set: function (value) {
                this.title = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLabel.prototype, "titleColor", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.color;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.color = value;
                this.updateGear(4);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLabel.prototype, "titleFontSize", {
            get: function () {
                var tf = this.getTextField();
                if (tf)
                    return tf.fontSize;
                else
                    return 0;
            },
            set: function (value) {
                var tf = this.getTextField();
                if (tf)
                    tf.fontSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLabel.prototype, "editable", {
            get: function () {
                if (this._titleObject && (this._titleObject instanceof fgui.GTextInput))
                    return this._titleObject.asTextInput.editable;
                else
                    return false;
            },
            set: function (val) {
                if (this._titleObject)
                    this._titleObject.asTextInput.editable = val;
            },
            enumerable: true,
            configurable: true
        });
        GLabel.prototype.getTextField = function () {
            if (this._titleObject instanceof fgui.GTextField)
                return this._titleObject;
            else if ((this._titleObject instanceof GLabel) || (this._titleObject instanceof fgui.GButton))
                return this._titleObject.getTextField();
            else
                return null;
        };
        GLabel.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.titleColor;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            return tf.strokeColor;
                        else
                            return 0;
                    }
                case fgui.ObjectPropID.FontSize:
                    return this.titleFontSize;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GLabel.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.titleColor = value;
                    break;
                case fgui.ObjectPropID.OutlineColor:
                    {
                        var tf = this.getTextField();
                        if (tf)
                            tf.strokeColor = value;
                    }
                    break;
                case fgui.ObjectPropID.FontSize:
                    this.titleFontSize = value;
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GLabel.prototype.constructExtension = function (buffer) {
            this._titleObject = this.getChild("title");
            this._iconObject = this.getChild("icon");
        };
        GLabel.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!buffer.seek(beginPos, 6))
                return;
            if (buffer.readByte() != this.packageItem.objectType)
                return;
            var str;
            str = buffer.readS();
            if (str != null)
                this.title = str;
            str = buffer.readS();
            if (str != null)
                this.icon = str;
            if (buffer.readBool())
                this.titleColor = buffer.readColor();
            var iv = buffer.readInt();
            if (iv != 0)
                this.titleFontSize = iv;
            if (buffer.readBool()) {
                var input = this.getTextField();
                if (input instanceof fgui.GTextInput) {
                    str = buffer.readS();
                    if (str != null)
                        input.promptText = str;
                    str = buffer.readS();
                    if (str != null)
                        input.restrict = str;
                    iv = buffer.readInt();
                    if (iv != 0)
                        input.maxLength = iv;
                    iv = buffer.readInt();
                    if (iv != 0) {
                    }
                    if (buffer.readBool())
                        input.password = true;
                }
                else
                    buffer.skip(13);
            }
        };
        return GLabel;
    }(fgui.GComponent));
    fgui.GLabel = GLabel;
})(fgui || (fgui = {}));

(function (fgui) {
    var GList = (function (_super_1) {
        __extends(GList, _super_1);
        function GList() {
            var _this = _super_1.call(this) || this;
            _this.scrollItemToViewOnClick = true;
            _this.foldInvisibleItems = false;
            _this._lineCount = 0;
            _this._columnCount = 0;
            _this._lineGap = 0;
            _this._columnGap = 0;
            _this._lastSelectedIndex = 0;
            _this._numItems = 0;
            _this._realNumItems = 0;
            _this._firstIndex = 0;
            _this._curLineItemCount = 0;
            _this._curLineItemCount2 = 0;
            _this._virtualListChanged = 0;
            _this.itemInfoVer = 0;
            _this._trackBounds = true;
            _this._pool = new fgui.GObjectPool();
            _this._layout = fgui.ListLayoutType.SingleColumn;
            _this._autoResizeItem = true;
            _this._lastSelectedIndex = -1;
            _this._selectionMode = fgui.ListSelectionMode.Single;
            _this.opaque = true;
            _this._align = fgui.AlignType.Left;
            _this._verticalAlign = fgui.VertAlignType.Top;
            _this._container = new egret.DisplayObjectContainer();
            _this._rootContainer.addChild(_this._container);
            return _this;
        }
        GList.prototype.dispose = function () {
            this._pool.clear();
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GList.prototype, "layout", {
            get: function () {
                return this._layout;
            },
            set: function (value) {
                if (this._layout != value) {
                    this._layout = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "lineCount", {
            get: function () {
                return this._lineCount;
            },
            set: function (value) {
                if (this._lineCount != value) {
                    this._lineCount = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "columnCount", {
            get: function () {
                return this._columnCount;
            },
            set: function (value) {
                if (this._columnCount != value) {
                    this._columnCount = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "lineGap", {
            get: function () {
                return this._lineGap;
            },
            set: function (value) {
                if (this._lineGap != value) {
                    this._lineGap = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "columnGap", {
            get: function () {
                return this._columnGap;
            },
            set: function (value) {
                if (this._columnGap != value) {
                    this._columnGap = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "align", {
            get: function () {
                return this._align;
            },
            set: function (value) {
                if (this._align != value) {
                    this._align = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "verticalAlign", {
            get: function () {
                return this._verticalAlign;
            },
            set: function (value) {
                if (this._verticalAlign != value) {
                    this._verticalAlign = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "virtualItemSize", {
            get: function () {
                return this._itemSize;
            },
            set: function (value) {
                if (this._virtual) {
                    if (!this._itemSize)
                        this._itemSize = new egret.Point();
                    this._itemSize.copyFrom(value);
                    this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "defaultItem", {
            get: function () {
                return this._defaultItem;
            },
            set: function (val) {
                this._defaultItem = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "autoResizeItem", {
            get: function () {
                return this._autoResizeItem;
            },
            set: function (value) {
                if (this._autoResizeItem != value) {
                    this._autoResizeItem = value;
                    this.setBoundsChangedFlag();
                    if (this._virtual)
                        this.setVirtualListChangedFlag(true);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "selectionMode", {
            get: function () {
                return this._selectionMode;
            },
            set: function (value) {
                this._selectionMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "selectionController", {
            get: function () {
                return this._selectionController;
            },
            set: function (value) {
                this._selectionController = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GList.prototype, "itemPool", {
            get: function () {
                return this._pool;
            },
            enumerable: true,
            configurable: true
        });
        GList.prototype.getFromPool = function (url) {
            if (!url)
                url = this._defaultItem;
            var obj = this._pool.getObject(url);
            if (obj)
                obj.visible = true;
            return obj;
        };
        GList.prototype.returnToPool = function (obj) {
            obj.displayObject.cacheAsBitmap = false;
            this._pool.returnObject(obj);
        };
        GList.prototype.addChildAt = function (child, index) {
            _super_1.prototype.addChildAt.call(this, child, index);
            if (child instanceof fgui.GButton) {
                child.selected = false;
                child.changeStateOnClick = false;
            }
            child.addEventListener(egret.TouchEvent.TOUCH_TAP, this.__clickItem, this);
            return child;
        };
        GList.prototype.addItem = function (url) {
            if (!url)
                url = this._defaultItem;
            return this.addChild(fgui.UIPackage.createObjectFromURL(url));
        };
        GList.prototype.addItemFromPool = function (url) {
            return this.addChild(this.getFromPool(url));
        };
        GList.prototype.removeChildAt = function (index, dispose) {
            var child = _super_1.prototype.removeChildAt.call(this, index, dispose);
            child.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.__clickItem, this);
            return child;
        };
        GList.prototype.removeChildToPoolAt = function (index) {
            var child = _super_1.prototype.removeChildAt.call(this, index);
            this.returnToPool(child);
        };
        GList.prototype.removeChildToPool = function (child) {
            _super_1.prototype.removeChild.call(this, child);
            this.returnToPool(child);
        };
        GList.prototype.removeChildrenToPool = function (beginIndex, endIndex) {
            if (beginIndex == undefined)
                beginIndex = 0;
            if (endIndex == undefined)
                endIndex = -1;
            if (endIndex < 0 || endIndex >= this._children.length)
                endIndex = this._children.length - 1;
            for (var i = beginIndex; i <= endIndex; ++i)
                this.removeChildToPoolAt(beginIndex);
        };
        Object.defineProperty(GList.prototype, "selectedIndex", {
            get: function () {
                var i;
                if (this._virtual) {
                    for (i = 0; i < this._realNumItems; i++) {
                        var ii = this._virtualItems[i];
                        if ((ii.obj instanceof fgui.GButton) && ii.obj.selected
                            || ii.obj == null && ii.selected) {
                            if (this._loop)
                                return i % this._numItems;
                            else
                                return i;
                        }
                    }
                }
                else {
                    var cnt = this._children.length;
                    for (i = 0; i < cnt; i++) {
                        var obj = this._children[i];
                        if ((obj instanceof fgui.GButton) && obj.selected)
                            return i;
                    }
                }
                return -1;
            },
            set: function (value) {
                if (value >= 0 && value < this.numItems) {
                    if (this._selectionMode != fgui.ListSelectionMode.Single)
                        this.clearSelection();
                    this.addSelection(value);
                }
                else
                    this.clearSelection();
            },
            enumerable: true,
            configurable: true
        });
        GList.prototype.getSelection = function (result) {
            if (!result)
                result = new Array();
            var i;
            if (this._virtual) {
                for (i = 0; i < this._realNumItems; i++) {
                    var ii = this._virtualItems[i];
                    if ((ii.obj instanceof fgui.GButton) && ii.obj.selected
                        || ii.obj == null && ii.selected) {
                        var j = i;
                        if (this._loop) {
                            j = i % this._numItems;
                            if (result.indexOf(j) != -1)
                                continue;
                        }
                        result.push(j);
                    }
                }
            }
            else {
                var cnt = this._children.length;
                for (i = 0; i < cnt; i++) {
                    var obj = this._children[i];
                    if ((obj instanceof fgui.GButton) && obj.selected)
                        result.push(i);
                }
            }
            return result;
        };
        GList.prototype.addSelection = function (index, scrollItToView) {
            if (this._selectionMode == fgui.ListSelectionMode.None)
                return;
            this.checkVirtualList();
            if (this._selectionMode == fgui.ListSelectionMode.Single)
                this.clearSelection();
            if (scrollItToView)
                this.scrollToView(index);
            this._lastSelectedIndex = index;
            var obj;
            if (this._virtual) {
                var ii = this._virtualItems[index];
                if (ii.obj)
                    obj = ii.obj;
                ii.selected = true;
            }
            else
                obj = this.getChildAt(index);
            if ((obj instanceof fgui.GButton) && !obj.selected) {
                obj.selected = true;
                this.updateSelectionController(index);
            }
        };
        GList.prototype.removeSelection = function (index) {
            if (this._selectionMode == fgui.ListSelectionMode.None)
                return;
            var obj;
            if (this._virtual) {
                var ii = this._virtualItems[index];
                if (ii.obj)
                    obj = ii.obj;
                ii.selected = false;
            }
            else
                obj = this.getChildAt(index);
            if (obj instanceof fgui.GButton)
                obj.selected = false;
        };
        GList.prototype.clearSelection = function () {
            var i;
            if (this._virtual) {
                for (i = 0; i < this._realNumItems; i++) {
                    var ii = this._virtualItems[i];
                    if (ii.obj instanceof fgui.GButton)
                        ii.obj.selected = false;
                    ii.selected = false;
                }
            }
            else {
                var cnt = this._children.length;
                for (i = 0; i < cnt; i++) {
                    var obj = this._children[i];
                    if (obj instanceof fgui.GButton)
                        obj.selected = false;
                }
            }
        };
        GList.prototype.clearSelectionExcept = function (g) {
            var i;
            if (this._virtual) {
                for (i = 0; i < this._realNumItems; i++) {
                    var ii = this._virtualItems[i];
                    if (ii.obj != g) {
                        if ((ii.obj instanceof fgui.GButton))
                            ii.obj.selected = false;
                        ii.selected = false;
                    }
                }
            }
            else {
                var cnt = this._children.length;
                for (i = 0; i < cnt; i++) {
                    var obj = this._children[i];
                    if ((obj instanceof fgui.GButton) && obj != g)
                        obj.selected = false;
                }
            }
        };
        GList.prototype.selectAll = function () {
            this.checkVirtualList();
            var last = -1;
            var i;
            if (this._virtual) {
                for (i = 0; i < this._realNumItems; i++) {
                    var ii = this._virtualItems[i];
                    if ((ii.obj instanceof fgui.GButton) && !ii.obj.selected) {
                        ii.obj.selected = true;
                        last = i;
                    }
                    ii.selected = true;
                }
            }
            else {
                var cnt = this._children.length;
                for (i = 0; i < cnt; i++) {
                    var obj = this._children[i];
                    if ((obj instanceof fgui.GButton) && !obj.selected) {
                        obj.selected = true;
                        last = i;
                    }
                }
            }
            if (last != -1)
                this.updateSelectionController(last);
        };
        GList.prototype.selectNone = function () {
            this.clearSelection();
        };
        GList.prototype.selectReverse = function () {
            this.checkVirtualList();
            var last = -1;
            var i;
            if (this._virtual) {
                for (i = 0; i < this._realNumItems; i++) {
                    var ii = this._virtualItems[i];
                    if (ii.obj instanceof fgui.GButton) {
                        ii.obj.selected = !ii.obj.selected;
                        if (ii.obj.selected)
                            last = i;
                    }
                    ii.selected = !ii.selected;
                }
            }
            else {
                var cnt = this._children.length;
                for (i = 0; i < cnt; i++) {
                    var obj = this._children[i];
                    if (obj instanceof fgui.GButton) {
                        obj.selected = !obj.selected;
                        if (obj.selected)
                            last = i;
                    }
                }
            }
            if (last != -1)
                this.updateSelectionController(last);
        };
        GList.prototype.handleArrowKey = function (dir) {
            var index = this.selectedIndex;
            if (index == -1)
                return;
            switch (dir) {
                case 1:
                    if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowVertical) {
                        index--;
                        if (index >= 0) {
                            this.clearSelection();
                            this.addSelection(index, true);
                        }
                    }
                    else if (this._layout == fgui.ListLayoutType.FlowHorizontal || this._layout == fgui.ListLayoutType.Pagination) {
                        var current = this._children[index];
                        var k = 0;
                        for (var i = index - 1; i >= 0; i--) {
                            var obj = this._children[i];
                            if (obj.y != current.y) {
                                current = obj;
                                break;
                            }
                            k++;
                        }
                        for (; i >= 0; i--) {
                            obj = this._children[i];
                            if (obj.y != current.y) {
                                this.clearSelection();
                                this.addSelection(i + k + 1, true);
                                break;
                            }
                        }
                    }
                    break;
                case 3:
                    if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowHorizontal || this._layout == fgui.ListLayoutType.Pagination) {
                        index++;
                        if (index < this._children.length) {
                            this.clearSelection();
                            this.addSelection(index, true);
                        }
                    }
                    else if (this._layout == fgui.ListLayoutType.FlowVertical) {
                        current = this._children[index];
                        k = 0;
                        var cnt = this._children.length;
                        for (i = index + 1; i < cnt; i++) {
                            obj = this._children[i];
                            if (obj.x != current.x) {
                                current = obj;
                                break;
                            }
                            k++;
                        }
                        for (; i < cnt; i++) {
                            obj = this._children[i];
                            if (obj.x != current.x) {
                                this.clearSelection();
                                this.addSelection(i - k - 1, true);
                                break;
                            }
                        }
                    }
                    break;
                case 5:
                    if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowVertical) {
                        index++;
                        if (index < this._children.length) {
                            this.clearSelection();
                            this.addSelection(index, true);
                        }
                    }
                    else if (this._layout == fgui.ListLayoutType.FlowHorizontal || this._layout == fgui.ListLayoutType.Pagination) {
                        current = this._children[index];
                        k = 0;
                        cnt = this._children.length;
                        for (i = index + 1; i < cnt; i++) {
                            obj = this._children[i];
                            if (obj.y != current.y) {
                                current = obj;
                                break;
                            }
                            k++;
                        }
                        for (; i < cnt; i++) {
                            obj = this._children[i];
                            if (obj.y != current.y) {
                                this.clearSelection();
                                this.addSelection(i - k - 1, true);
                                break;
                            }
                        }
                    }
                    break;
                case 7:
                    if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowHorizontal || this._layout == fgui.ListLayoutType.Pagination) {
                        index--;
                        if (index >= 0) {
                            this.clearSelection();
                            this.addSelection(index, true);
                        }
                    }
                    else if (this._layout == fgui.ListLayoutType.FlowVertical) {
                        current = this._children[index];
                        k = 0;
                        for (i = index - 1; i >= 0; i--) {
                            obj = this._children[i];
                            if (obj.x != current.x) {
                                current = obj;
                                break;
                            }
                            k++;
                        }
                        for (; i >= 0; i--) {
                            obj = this._children[i];
                            if (obj.x != current.x) {
                                this.clearSelection();
                                this.addSelection(i + k + 1, true);
                                break;
                            }
                        }
                    }
                    break;
            }
        };
        GList.prototype.__clickItem = function (evt) {
            if (this._scrollPane && this._scrollPane.isDragged)
                return;
            var item = (evt.currentTarget);
            this.setSelectionOnEvent(item);
            if (this._scrollPane && this.scrollItemToViewOnClick)
                this._scrollPane.scrollToView(item, true);
            var ie = new fgui.ItemEvent(fgui.ItemEvent.CLICK, item);
            ie.stageX = evt.stageX;
            ie.stageY = evt.stageY;
            this.dispatchItemEvent(ie);
        };
        GList.prototype.dispatchItemEvent = function (evt) {
            this.dispatchEvent(evt);
        };
        GList.prototype.setSelectionOnEvent = function (item) {
            if (!(item instanceof fgui.GButton) || this._selectionMode == fgui.ListSelectionMode.None)
                return;
            var dontChangeLastIndex = false;
            var index = this.childIndexToItemIndex(this.getChildIndex(item));
            if (this._selectionMode == fgui.ListSelectionMode.Single) {
                if (!item.selected) {
                    this.clearSelectionExcept(item);
                    item.selected = true;
                }
            }
            else {
                if (fgui.GRoot.shiftKeyDown) {
                    if (!item.selected) {
                        if (this._lastSelectedIndex != -1) {
                            var min = Math.min(this._lastSelectedIndex, index);
                            var max = Math.max(this._lastSelectedIndex, index);
                            max = Math.min(max, this.numItems - 1);
                            var i;
                            if (this._virtual) {
                                for (i = min; i <= max; i++) {
                                    var ii = this._virtualItems[i];
                                    if (ii.obj instanceof fgui.GButton)
                                        ii.obj.selected = true;
                                    ii.selected = true;
                                }
                            }
                            else {
                                for (i = min; i <= max; i++) {
                                    var obj = this.getChildAt(i);
                                    if (obj instanceof fgui.GButton)
                                        obj.selected = true;
                                }
                            }
                            dontChangeLastIndex = true;
                        }
                        else {
                            item.selected = true;
                        }
                    }
                }
                else if (fgui.GRoot.ctrlKeyDown || this._selectionMode == fgui.ListSelectionMode.Multiple_SingleClick) {
                    item.selected = !item.selected;
                }
                else {
                    if (!item.selected) {
                        this.clearSelectionExcept(item);
                        item.selected = true;
                    }
                    else
                        this.clearSelectionExcept(item);
                }
            }
            if (!dontChangeLastIndex)
                this._lastSelectedIndex = index;
            if (item.selected)
                this.updateSelectionController(index);
        };
        GList.prototype.resizeToFit = function (itemCount, minSize) {
            if (itemCount === void 0) { itemCount = Number.POSITIVE_INFINITY; }
            if (minSize === void 0) { minSize = 0; }
            this.ensureBoundsCorrect();
            var curCount = this.numItems;
            if (itemCount > curCount)
                itemCount = curCount;
            if (this._virtual) {
                var lineCount = Math.ceil(itemCount / this._curLineItemCount);
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal)
                    this.viewHeight = lineCount * this._itemSize.y + Math.max(0, lineCount - 1) * this._lineGap;
                else
                    this.viewWidth = lineCount * this._itemSize.x + Math.max(0, lineCount - 1) * this._columnGap;
            }
            else if (itemCount == 0) {
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal)
                    this.viewHeight = minSize;
                else
                    this.viewWidth = minSize;
            }
            else {
                var i = itemCount - 1;
                var obj;
                while (i >= 0) {
                    obj = this.getChildAt(i);
                    if (!this.foldInvisibleItems || obj.visible)
                        break;
                    i--;
                }
                if (i < 0) {
                    if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal)
                        this.viewHeight = minSize;
                    else
                        this.viewWidth = minSize;
                }
                else {
                    var size = 0;
                    if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                        size = obj.y + obj.height;
                        if (size < minSize)
                            size = minSize;
                        this.viewHeight = size;
                    }
                    else {
                        size = obj.x + obj.width;
                        if (size < minSize)
                            size = minSize;
                        this.viewWidth = size;
                    }
                }
            }
        };
        GList.prototype.getMaxItemWidth = function () {
            var cnt = this._children.length;
            var max = 0;
            for (var i = 0; i < cnt; i++) {
                var child = this.getChildAt(i);
                if (child.width > max)
                    max = child.width;
            }
            return max;
        };
        GList.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        };
        GList.prototype.handleControllerChanged = function (c) {
            _super_1.prototype.handleControllerChanged.call(this, c);
            if (this._selectionController == c)
                this.selectedIndex = c.selectedIndex;
        };
        GList.prototype.updateSelectionController = function (index) {
            if (this._selectionController && !this._selectionController.changing
                && index < this._selectionController.pageCount) {
                var c = this._selectionController;
                this._selectionController = null;
                c.selectedIndex = index;
                this._selectionController = c;
            }
        };
        GList.prototype.getSnappingPosition = function (xValue, yValue, result) {
            if (this._virtual) {
                if (!result)
                    result = new egret.Point();
                var saved;
                var index;
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                    saved = yValue;
                    s_n = yValue;
                    index = this.getIndexOnPos1(false);
                    yValue = s_n;
                    if (index < this._virtualItems.length && saved - yValue > this._virtualItems[index].height / 2 && index < this._realNumItems)
                        yValue += this._virtualItems[index].height + this._lineGap;
                }
                else if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowVertical) {
                    saved = xValue;
                    s_n = xValue;
                    index = this.getIndexOnPos2(false);
                    xValue = s_n;
                    if (index < this._virtualItems.length && saved - xValue > this._virtualItems[index].width / 2 && index < this._realNumItems)
                        xValue += this._virtualItems[index].width + this._columnGap;
                }
                else {
                    saved = xValue;
                    s_n = xValue;
                    index = this.getIndexOnPos3(false);
                    xValue = s_n;
                    if (index < this._virtualItems.length && saved - xValue > this._virtualItems[index].width / 2 && index < this._realNumItems)
                        xValue += this._virtualItems[index].width + this._columnGap;
                }
                result.x = xValue;
                result.y = yValue;
                return result;
            }
            else {
                return _super_1.prototype.getSnappingPosition.call(this, xValue, yValue, result);
            }
        };
        GList.prototype.scrollToView = function (index, ani, setFirst) {
            if (this._virtual) {
                if (this._numItems == 0)
                    return;
                this.checkVirtualList();
                if (index >= this._virtualItems.length)
                    throw "Invalid child index: " + index + ">" + this._virtualItems.length;
                if (this._loop)
                    index = Math.floor(this._firstIndex / this._numItems) * this._numItems + index;
                var rect;
                var ii = this._virtualItems[index];
                var pos = 0;
                var i;
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                    for (i = this._curLineItemCount - 1; i < index; i += this._curLineItemCount)
                        pos += this._virtualItems[i].height + this._lineGap;
                    rect = new egret.Rectangle(0, pos, this._itemSize.x, ii.height);
                }
                else if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowVertical) {
                    for (i = this._curLineItemCount - 1; i < index; i += this._curLineItemCount)
                        pos += this._virtualItems[i].width + this._columnGap;
                    rect = new egret.Rectangle(pos, 0, ii.width, this._itemSize.y);
                }
                else {
                    var page = index / (this._curLineItemCount * this._curLineItemCount2);
                    rect = new egret.Rectangle(page * this.viewWidth + (index % this._curLineItemCount) * (ii.width + this._columnGap), (index / this._curLineItemCount) % this._curLineItemCount2 * (ii.height + this._lineGap), ii.width, ii.height);
                }
                if (this._scrollPane)
                    this._scrollPane.scrollToView(rect, ani, setFirst);
            }
            else {
                var obj = this.getChildAt(index);
                if (obj) {
                    if (this._scrollPane)
                        this._scrollPane.scrollToView(obj, ani, setFirst);
                    else if (this.parent && this.parent.scrollPane)
                        this.parent.scrollPane.scrollToView(obj, ani, setFirst);
                }
            }
        };
        GList.prototype.getFirstChildInView = function () {
            return this.childIndexToItemIndex(_super_1.prototype.getFirstChildInView.call(this));
        };
        GList.prototype.childIndexToItemIndex = function (index) {
            if (!this._virtual)
                return index;
            if (this._layout == fgui.ListLayoutType.Pagination) {
                for (var i = this._firstIndex; i < this._realNumItems; i++) {
                    if (this._virtualItems[i].obj) {
                        index--;
                        if (index < 0)
                            return i;
                    }
                }
                return index;
            }
            else {
                index += this._firstIndex;
                if (this._loop && this._numItems > 0)
                    index = index % this._numItems;
                return index;
            }
        };
        GList.prototype.itemIndexToChildIndex = function (index) {
            if (!this._virtual)
                return index;
            if (this._layout == fgui.ListLayoutType.Pagination) {
                return this.getChildIndex(this._virtualItems[index].obj);
            }
            else {
                if (this._loop && this._numItems > 0) {
                    var j = this._firstIndex % this._numItems;
                    if (index >= j)
                        index = index - j;
                    else
                        index = this._numItems - j + index;
                }
                else
                    index -= this._firstIndex;
                return index;
            }
        };
        GList.prototype.setVirtual = function () {
            this._setVirtual(false);
        };
        GList.prototype.setVirtualAndLoop = function () {
            this._setVirtual(true);
        };
        GList.prototype._setVirtual = function (loop) {
            if (!this._virtual) {
                if (this._scrollPane == null)
                    throw "Virtual list must be scrollable!";
                if (loop) {
                    if (this._layout == fgui.ListLayoutType.FlowHorizontal || this._layout == fgui.ListLayoutType.FlowVertical)
                        throw "Loop list is not supported for FlowHorizontal or FlowVertical layout!";
                    this._scrollPane.bouncebackEffect = false;
                }
                this._virtual = true;
                this._loop = loop;
                this._virtualItems = new Array();
                this.removeChildrenToPool();
                if (this._itemSize == null) {
                    this._itemSize = new egret.Point();
                    var obj = this.getFromPool(null);
                    if (obj == null) {
                        throw "Virtual List must have a default list item resource.";
                    }
                    else {
                        this._itemSize.x = obj.width;
                        this._itemSize.y = obj.height;
                    }
                    this.returnToPool(obj);
                }
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                    this._scrollPane.scrollStep = this._itemSize.y;
                    if (this._loop)
                        this._scrollPane._loop = 2;
                }
                else {
                    this._scrollPane.scrollStep = this._itemSize.x;
                    if (this._loop)
                        this._scrollPane._loop = 1;
                }
                this._scrollPane.addEventListener(fgui.ScrollPane.SCROLL, this.__scrolled, this);
                this.setVirtualListChangedFlag(true);
            }
        };
        Object.defineProperty(GList.prototype, "numItems", {
            get: function () {
                if (this._virtual)
                    return this._numItems;
                else
                    return this._children.length;
            },
            set: function (value) {
                if (this._virtual) {
                    if (this.itemRenderer == null)
                        throw "Set itemRenderer first!";
                    this._numItems = value;
                    if (this._loop)
                        this._realNumItems = this._numItems * 6;
                    else
                        this._realNumItems = this._numItems;
                    var oldCount = this._virtualItems.length;
                    if (this._realNumItems > oldCount) {
                        for (i = oldCount; i < this._realNumItems; i++) {
                            var ii = {
                                width: this._itemSize.x,
                                height: this._itemSize.y,
                                updateFlag: 0
                            };
                            this._virtualItems.push(ii);
                        }
                    }
                    else {
                        for (i = this._realNumItems; i < oldCount; i++)
                            this._virtualItems[i].selected = false;
                    }
                    if (this._virtualListChanged != 0)
                        fgui.GTimers.inst.remove(this._refreshVirtualList, this);
                    this._refreshVirtualList();
                }
                else {
                    var cnt = this._children.length;
                    if (value > cnt) {
                        for (var i = cnt; i < value; i++) {
                            if (this.itemProvider == null)
                                this.addItemFromPool();
                            else
                                this.addItemFromPool(this.itemProvider.call(this.callbackThisObj, i));
                        }
                    }
                    else {
                        this.removeChildrenToPool(value, cnt);
                    }
                    if (this.itemRenderer != null) {
                        for (i = 0; i < value; i++)
                            this.itemRenderer.call(this.callbackThisObj, i, this.getChildAt(i));
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        GList.prototype.refreshVirtualList = function () {
            this.setVirtualListChangedFlag(false);
        };
        GList.prototype.checkVirtualList = function () {
            if (this._virtualListChanged != 0) {
                this._refreshVirtualList();
                fgui.GTimers.inst.remove(this._refreshVirtualList, this);
            }
        };
        GList.prototype.setVirtualListChangedFlag = function (layoutChanged) {
            if (layoutChanged)
                this._virtualListChanged = 2;
            else if (this._virtualListChanged == 0)
                this._virtualListChanged = 1;
            fgui.GTimers.inst.callLater(this._refreshVirtualList, this);
        };
        GList.prototype._refreshVirtualList = function () {
            var layoutChanged = this._virtualListChanged == 2;
            this._virtualListChanged = 0;
            this._eventLocked = true;
            if (layoutChanged) {
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.SingleRow)
                    this._curLineItemCount = 1;
                else if (this._layout == fgui.ListLayoutType.FlowHorizontal) {
                    if (this._columnCount > 0)
                        this._curLineItemCount = this._columnCount;
                    else {
                        this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap));
                        if (this._curLineItemCount <= 0)
                            this._curLineItemCount = 1;
                    }
                }
                else if (this._layout == fgui.ListLayoutType.FlowVertical) {
                    if (this._lineCount > 0)
                        this._curLineItemCount = this._lineCount;
                    else {
                        this._curLineItemCount = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap));
                        if (this._curLineItemCount <= 0)
                            this._curLineItemCount = 1;
                    }
                }
                else {
                    if (this._columnCount > 0)
                        this._curLineItemCount = this._columnCount;
                    else {
                        this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap));
                        if (this._curLineItemCount <= 0)
                            this._curLineItemCount = 1;
                    }
                    if (this._lineCount > 0)
                        this._curLineItemCount2 = this._lineCount;
                    else {
                        this._curLineItemCount2 = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap));
                        if (this._curLineItemCount2 <= 0)
                            this._curLineItemCount2 = 1;
                    }
                }
            }
            var ch = 0, cw = 0;
            if (this._realNumItems > 0) {
                var i;
                var len = Math.ceil(this._realNumItems / this._curLineItemCount) * this._curLineItemCount;
                var len2 = Math.min(this._curLineItemCount, this._realNumItems);
                if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                    for (i = 0; i < len; i += this._curLineItemCount)
                        ch += this._virtualItems[i].height + this._lineGap;
                    if (ch > 0)
                        ch -= this._lineGap;
                    if (this._autoResizeItem)
                        cw = this._scrollPane.viewWidth;
                    else {
                        for (i = 0; i < len2; i++)
                            cw += this._virtualItems[i].width + this._columnGap;
                        if (cw > 0)
                            cw -= this._columnGap;
                    }
                }
                else if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowVertical) {
                    for (i = 0; i < len; i += this._curLineItemCount)
                        cw += this._virtualItems[i].width + this._columnGap;
                    if (cw > 0)
                        cw -= this._columnGap;
                    if (this._autoResizeItem)
                        ch = this._scrollPane.viewHeight;
                    else {
                        for (i = 0; i < len2; i++)
                            ch += this._virtualItems[i].height + this._lineGap;
                        if (ch > 0)
                            ch -= this._lineGap;
                    }
                }
                else {
                    var pageCount = Math.ceil(len / (this._curLineItemCount * this._curLineItemCount2));
                    cw = pageCount * this.viewWidth;
                    ch = this.viewHeight;
                }
            }
            this.handleAlign(cw, ch);
            this._scrollPane.setContentSize(cw, ch);
            this._eventLocked = false;
            this.handleScroll(true);
        };
        GList.prototype.__scrolled = function (evt) {
            this.handleScroll(false);
        };
        GList.prototype.getIndexOnPos1 = function (forceUpdate) {
            if (this._realNumItems < this._curLineItemCount) {
                s_n = 0;
                return 0;
            }
            var i;
            var pos2;
            var pos3;
            if (this.numChildren > 0 && !forceUpdate) {
                pos2 = this.getChildAt(0).y;
                if (pos2 > s_n) {
                    for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) {
                        pos2 -= (this._virtualItems[i].height + this._lineGap);
                        if (pos2 <= s_n) {
                            s_n = pos2;
                            return i;
                        }
                    }
                    s_n = 0;
                    return 0;
                }
                else {
                    for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                        pos3 = pos2 + this._virtualItems[i].height + this._lineGap;
                        if (pos3 > s_n) {
                            s_n = pos2;
                            return i;
                        }
                        pos2 = pos3;
                    }
                    s_n = pos2;
                    return this._realNumItems - this._curLineItemCount;
                }
            }
            else {
                pos2 = 0;
                for (i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                    pos3 = pos2 + this._virtualItems[i].height + this._lineGap;
                    if (pos3 > s_n) {
                        s_n = pos2;
                        return i;
                    }
                    pos2 = pos3;
                }
                s_n = pos2;
                return this._realNumItems - this._curLineItemCount;
            }
        };
        GList.prototype.getIndexOnPos2 = function (forceUpdate) {
            if (this._realNumItems < this._curLineItemCount) {
                s_n = 0;
                return 0;
            }
            var i;
            var pos2;
            var pos3;
            if (this.numChildren > 0 && !forceUpdate) {
                pos2 = this.getChildAt(0).x;
                if (pos2 > s_n) {
                    for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) {
                        pos2 -= (this._virtualItems[i].width + this._columnGap);
                        if (pos2 <= s_n) {
                            s_n = pos2;
                            return i;
                        }
                    }
                    s_n = 0;
                    return 0;
                }
                else {
                    for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                        pos3 = pos2 + this._virtualItems[i].width + this._columnGap;
                        if (pos3 > s_n) {
                            s_n = pos2;
                            return i;
                        }
                        pos2 = pos3;
                    }
                    s_n = pos2;
                    return this._realNumItems - this._curLineItemCount;
                }
            }
            else {
                pos2 = 0;
                for (i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                    pos3 = pos2 + this._virtualItems[i].width + this._columnGap;
                    if (pos3 > s_n) {
                        s_n = pos2;
                        return i;
                    }
                    pos2 = pos3;
                }
                s_n = pos2;
                return this._realNumItems - this._curLineItemCount;
            }
        };
        GList.prototype.getIndexOnPos3 = function (forceUpdate) {
            if (this._realNumItems < this._curLineItemCount) {
                s_n = 0;
                return 0;
            }
            var viewWidth = this.viewWidth;
            var page = Math.floor(s_n / viewWidth);
            var startIndex = page * (this._curLineItemCount * this._curLineItemCount2);
            var pos2 = page * viewWidth;
            var i;
            var pos3;
            for (i = 0; i < this._curLineItemCount; i++) {
                pos3 = pos2 + this._virtualItems[startIndex + i].width + this._columnGap;
                if (pos3 > s_n) {
                    s_n = pos2;
                    return startIndex + i;
                }
                pos2 = pos3;
            }
            s_n = pos2;
            return startIndex + this._curLineItemCount - 1;
        };
        GList.prototype.handleScroll = function (forceUpdate) {
            if (this._eventLocked)
                return;
            if (this._layout == fgui.ListLayoutType.SingleColumn || this._layout == fgui.ListLayoutType.FlowHorizontal) {
                var enterCounter = 0;
                while (this.handleScroll1(forceUpdate)) {
                    enterCounter++;
                    forceUpdate = false;
                    if (enterCounter > 20) {
                        console.log("FairyGUI: list will never be filled as the item renderer function always returns a different size.");
                        break;
                    }
                }
                this.handleArchOrder1();
            }
            else if (this._layout == fgui.ListLayoutType.SingleRow || this._layout == fgui.ListLayoutType.FlowVertical) {
                enterCounter = 0;
                while (this.handleScroll2(forceUpdate)) {
                    enterCounter++;
                    forceUpdate = false;
                    if (enterCounter > 20) {
                        console.log("FairyGUI: list will never be filled as the item renderer function always returns a different size.");
                        break;
                    }
                }
                this.handleArchOrder2();
            }
            else {
                this.handleScroll3(forceUpdate);
            }
            this._boundsChanged = false;
        };
        GList.prototype.handleScroll1 = function (forceUpdate) {
            var pos = this._scrollPane.scrollingPosY;
            var max = pos + this._scrollPane.viewHeight;
            var end = max == this._scrollPane.contentHeight;
            s_n = pos;
            var newFirstIndex = this.getIndexOnPos1(forceUpdate);
            pos = s_n;
            if (newFirstIndex == this._firstIndex && !forceUpdate) {
                return false;
            }
            var oldFirstIndex = this._firstIndex;
            this._firstIndex = newFirstIndex;
            var curIndex = newFirstIndex;
            var forward = oldFirstIndex > newFirstIndex;
            var childCount = this.numChildren;
            var lastIndex = oldFirstIndex + childCount - 1;
            var reuseIndex = forward ? lastIndex : oldFirstIndex;
            var curX = 0, curY = pos;
            var needRender;
            var deltaSize = 0;
            var firstItemDeltaSize = 0;
            var url = this.defaultItem;
            var ii, ii2;
            var i, j;
            var partSize = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
            this.itemInfoVer++;
            while (curIndex < this._realNumItems && (end || curY < max)) {
                ii = this._virtualItems[curIndex];
                if (ii.obj == null || forceUpdate) {
                    if (this.itemProvider != null) {
                        url = this.itemProvider.call(this.callbackThisObj, curIndex % this._numItems);
                        if (url == null)
                            url = this._defaultItem;
                        url = fgui.UIPackage.normalizeURL(url);
                    }
                    if (ii.obj && ii.obj.resourceURL != url) {
                        if (ii.obj instanceof fgui.GButton)
                            ii.selected = ii.obj.selected;
                        this.removeChildToPool(ii.obj);
                        ii.obj = null;
                    }
                }
                if (ii.obj == null) {
                    if (forward) {
                        for (j = reuseIndex; j >= oldFirstIndex; j--) {
                            ii2 = this._virtualItems[j];
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof fgui.GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex--;
                                break;
                            }
                        }
                    }
                    else {
                        for (j = reuseIndex; j <= lastIndex; j++) {
                            ii2 = this._virtualItems[j];
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof fgui.GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex++;
                                break;
                            }
                        }
                    }
                    if (ii.obj) {
                        this.setChildIndex(ii.obj, forward ? curIndex - newFirstIndex : this.numChildren);
                    }
                    else {
                        ii.obj = this._pool.getObject(url);
                        if (forward)
                            this.addChildAt(ii.obj, curIndex - newFirstIndex);
                        else
                            this.addChild(ii.obj);
                    }
                    if (ii.obj instanceof fgui.GButton)
                        ii.obj.selected = ii.selected;
                    needRender = true;
                }
                else
                    needRender = forceUpdate;
                if (needRender) {
                    if (this._autoResizeItem && (this._layout == fgui.ListLayoutType.SingleColumn || this._columnCount > 0))
                        ii.obj.setSize(partSize, ii.obj.height, true);
                    this.itemRenderer.call(this.callbackThisObj, curIndex % this._numItems, ii.obj);
                    if (curIndex % this._curLineItemCount == 0) {
                        deltaSize += Math.ceil(ii.obj.height) - ii.height;
                        if (curIndex == newFirstIndex && oldFirstIndex > newFirstIndex) {
                            firstItemDeltaSize = Math.ceil(ii.obj.height) - ii.height;
                        }
                    }
                    ii.width = Math.ceil(ii.obj.width);
                    ii.height = Math.ceil(ii.obj.height);
                }
                ii.updateFlag = this.itemInfoVer;
                ii.obj.setXY(curX, curY);
                if (curIndex == newFirstIndex)
                    max += ii.height;
                curX += ii.width + this._columnGap;
                if (curIndex % this._curLineItemCount == this._curLineItemCount - 1) {
                    curX = 0;
                    curY += ii.height + this._lineGap;
                }
                curIndex++;
            }
            for (i = 0; i < childCount; i++) {
                ii = this._virtualItems[oldFirstIndex + i];
                if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                    if (ii.obj instanceof fgui.GButton)
                        ii.selected = ii.obj.selected;
                    this.removeChildToPool(ii.obj);
                    ii.obj = null;
                }
            }
            childCount = this._children.length;
            for (i = 0; i < childCount; i++) {
                var obj = this._virtualItems[newFirstIndex + i].obj;
                if (this._children[i] != obj)
                    this.setChildIndex(obj, i);
            }
            if (deltaSize != 0 || firstItemDeltaSize != 0)
                this._scrollPane.changeContentSizeOnScrolling(0, deltaSize, 0, firstItemDeltaSize);
            if (curIndex > 0 && this.numChildren > 0 && this._container.y <= 0 && this.getChildAt(0).y > -this._container.y)
                return true;
            else
                return false;
        };
        GList.prototype.handleScroll2 = function (forceUpdate) {
            var pos = this._scrollPane.scrollingPosX;
            var max = pos + this._scrollPane.viewWidth;
            var end = pos == this._scrollPane.contentWidth;
            s_n = pos;
            var newFirstIndex = this.getIndexOnPos2(forceUpdate);
            pos = s_n;
            if (newFirstIndex == this._firstIndex && !forceUpdate) {
                return false;
            }
            var oldFirstIndex = this._firstIndex;
            this._firstIndex = newFirstIndex;
            var curIndex = newFirstIndex;
            var forward = oldFirstIndex > newFirstIndex;
            var childCount = this.numChildren;
            var lastIndex = oldFirstIndex + childCount - 1;
            var reuseIndex = forward ? lastIndex : oldFirstIndex;
            var curX = pos, curY = 0;
            var needRender;
            var deltaSize = 0;
            var firstItemDeltaSize = 0;
            var url = this.defaultItem;
            var ii, ii2;
            var i, j;
            var partSize = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
            this.itemInfoVer++;
            while (curIndex < this._realNumItems && (end || curX < max)) {
                ii = this._virtualItems[curIndex];
                if (ii.obj == null || forceUpdate) {
                    if (this.itemProvider != null) {
                        url = this.itemProvider.call(this.callbackThisObj, curIndex % this._numItems);
                        if (url == null)
                            url = this._defaultItem;
                        url = fgui.UIPackage.normalizeURL(url);
                    }
                    if (ii.obj && ii.obj.resourceURL != url) {
                        if (ii.obj instanceof fgui.GButton)
                            ii.selected = ii.obj.selected;
                        this.removeChildToPool(ii.obj);
                        ii.obj = null;
                    }
                }
                if (ii.obj == null) {
                    if (forward) {
                        for (j = reuseIndex; j >= oldFirstIndex; j--) {
                            ii2 = this._virtualItems[j];
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof fgui.GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex--;
                                break;
                            }
                        }
                    }
                    else {
                        for (j = reuseIndex; j <= lastIndex; j++) {
                            ii2 = this._virtualItems[j];
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof fgui.GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex++;
                                break;
                            }
                        }
                    }
                    if (ii.obj) {
                        this.setChildIndex(ii.obj, forward ? curIndex - newFirstIndex : this.numChildren);
                    }
                    else {
                        ii.obj = this._pool.getObject(url);
                        if (forward)
                            this.addChildAt(ii.obj, curIndex - newFirstIndex);
                        else
                            this.addChild(ii.obj);
                    }
                    if (ii.obj instanceof fgui.GButton)
                        ii.obj.selected = ii.selected;
                    needRender = true;
                }
                else
                    needRender = forceUpdate;
                if (needRender) {
                    if (this._autoResizeItem && (this._layout == fgui.ListLayoutType.SingleRow || this._lineCount > 0))
                        ii.obj.setSize(ii.obj.width, partSize, true);
                    this.itemRenderer.call(this.callbackThisObj, curIndex % this._numItems, ii.obj);
                    if (curIndex % this._curLineItemCount == 0) {
                        deltaSize += Math.ceil(ii.obj.width) - ii.width;
                        if (curIndex == newFirstIndex && oldFirstIndex > newFirstIndex) {
                            firstItemDeltaSize = Math.ceil(ii.obj.width) - ii.width;
                        }
                    }
                    ii.width = Math.ceil(ii.obj.width);
                    ii.height = Math.ceil(ii.obj.height);
                }
                ii.updateFlag = this.itemInfoVer;
                ii.obj.setXY(curX, curY);
                if (curIndex == newFirstIndex)
                    max += ii.width;
                curY += ii.height + this._lineGap;
                if (curIndex % this._curLineItemCount == this._curLineItemCount - 1) {
                    curY = 0;
                    curX += ii.width + this._columnGap;
                }
                curIndex++;
            }
            for (i = 0; i < childCount; i++) {
                ii = this._virtualItems[oldFirstIndex + i];
                if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                    if (ii.obj instanceof fgui.GButton)
                        ii.selected = ii.obj.selected;
                    this.removeChildToPool(ii.obj);
                    ii.obj = null;
                }
            }
            childCount = this._children.length;
            for (i = 0; i < childCount; i++) {
                var obj = this._virtualItems[newFirstIndex + i].obj;
                if (this._children[i] != obj)
                    this.setChildIndex(obj, i);
            }
            if (deltaSize != 0 || firstItemDeltaSize != 0)
                this._scrollPane.changeContentSizeOnScrolling(deltaSize, 0, firstItemDeltaSize, 0);
            if (curIndex > 0 && this.numChildren > 0 && this._container.x <= 0 && this.getChildAt(0).x > -this._container.x)
                return true;
            else
                return false;
        };
        GList.prototype.handleScroll3 = function (forceUpdate) {
            var pos = this._scrollPane.scrollingPosX;
            s_n = pos;
            var newFirstIndex = this.getIndexOnPos3(forceUpdate);
            pos = s_n;
            if (newFirstIndex == this._firstIndex && !forceUpdate)
                return;
            var oldFirstIndex = this._firstIndex;
            this._firstIndex = newFirstIndex;
            var reuseIndex = oldFirstIndex;
            var virtualItemCount = this._virtualItems.length;
            var pageSize = this._curLineItemCount * this._curLineItemCount2;
            var startCol = newFirstIndex % this._curLineItemCount;
            var viewWidth = this.viewWidth;
            var page = Math.floor(newFirstIndex / pageSize);
            var startIndex = page * pageSize;
            var lastIndex = startIndex + pageSize * 2;
            var needRender;
            var i;
            var ii, ii2;
            var col;
            var url = this._defaultItem;
            var partWidth = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
            var partHeight = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount2 - 1)) / this._curLineItemCount2;
            this.itemInfoVer++;
            for (i = startIndex; i < lastIndex; i++) {
                if (i >= this._realNumItems)
                    continue;
                col = i % this._curLineItemCount;
                if (i - startIndex < pageSize) {
                    if (col < startCol)
                        continue;
                }
                else {
                    if (col > startCol)
                        continue;
                }
                ii = this._virtualItems[i];
                ii.updateFlag = this.itemInfoVer;
            }
            var lastObj;
            var insertIndex = 0;
            for (i = startIndex; i < lastIndex; i++) {
                if (i >= this._realNumItems)
                    continue;
                ii = this._virtualItems[i];
                if (ii.updateFlag != this.itemInfoVer)
                    continue;
                if (ii.obj == null) {
                    while (reuseIndex < virtualItemCount) {
                        ii2 = this._virtualItems[reuseIndex];
                        if (ii2.obj && ii2.updateFlag != this.itemInfoVer) {
                            if (ii2.obj instanceof fgui.GButton)
                                ii2.selected = ii2.obj.selected;
                            ii.obj = ii2.obj;
                            ii2.obj = null;
                            break;
                        }
                        reuseIndex++;
                    }
                    if (insertIndex == -1)
                        insertIndex = this.getChildIndex(lastObj) + 1;
                    if (ii.obj == null) {
                        if (this.itemProvider != null) {
                            url = this.itemProvider.call(this.callbackThisObj, i % this._numItems);
                            if (url == null)
                                url = this._defaultItem;
                            url = fgui.UIPackage.normalizeURL(url);
                        }
                        ii.obj = this._pool.getObject(url);
                        this.addChildAt(ii.obj, insertIndex);
                    }
                    else {
                        insertIndex = this.setChildIndexBefore(ii.obj, insertIndex);
                    }
                    insertIndex++;
                    if (ii.obj instanceof fgui.GButton)
                        ii.obj.selected = ii.selected;
                    needRender = true;
                }
                else {
                    needRender = forceUpdate;
                    insertIndex = -1;
                    lastObj = ii.obj;
                }
                if (needRender) {
                    if (this._autoResizeItem) {
                        if (this._curLineItemCount == this._columnCount && this._curLineItemCount2 == this._lineCount)
                            ii.obj.setSize(partWidth, partHeight, true);
                        else if (this._curLineItemCount == this._columnCount)
                            ii.obj.setSize(partWidth, ii.obj.height, true);
                        else if (this._curLineItemCount2 == this._lineCount)
                            ii.obj.setSize(ii.obj.width, partHeight, true);
                    }
                    this.itemRenderer.call(this.callbackThisObj, i % this._numItems, ii.obj);
                    ii.width = Math.ceil(ii.obj.width);
                    ii.height = Math.ceil(ii.obj.height);
                }
            }
            var borderX = (startIndex / pageSize) * viewWidth;
            var xx = borderX;
            var yy = 0;
            var lineHeight = 0;
            for (i = startIndex; i < lastIndex; i++) {
                if (i >= this._realNumItems)
                    continue;
                ii = this._virtualItems[i];
                if (ii.updateFlag == this.itemInfoVer)
                    ii.obj.setXY(xx, yy);
                if (ii.height > lineHeight)
                    lineHeight = ii.height;
                if (i % this._curLineItemCount == this._curLineItemCount - 1) {
                    xx = borderX;
                    yy += lineHeight + this._lineGap;
                    lineHeight = 0;
                    if (i == startIndex + pageSize - 1) {
                        borderX += viewWidth;
                        xx = borderX;
                        yy = 0;
                    }
                }
                else
                    xx += ii.width + this._columnGap;
            }
            for (i = reuseIndex; i < virtualItemCount; i++) {
                ii = this._virtualItems[i];
                if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                    if (ii.obj instanceof fgui.GButton)
                        ii.selected = ii.obj.selected;
                    this.removeChildToPool(ii.obj);
                    ii.obj = null;
                }
            }
        };
        GList.prototype.handleArchOrder1 = function () {
            if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Arch) {
                var mid = this._scrollPane.posY + this.viewHeight / 2;
                var minDist = Number.POSITIVE_INFINITY;
                var dist = 0;
                var apexIndex = 0;
                var cnt = this.numChildren;
                for (var i = 0; i < cnt; i++) {
                    var obj = this.getChildAt(i);
                    if (!this.foldInvisibleItems || obj.visible) {
                        dist = Math.abs(mid - obj.y - obj.height / 2);
                        if (dist < minDist) {
                            minDist = dist;
                            apexIndex = i;
                        }
                    }
                }
                this.apexIndex = apexIndex;
            }
        };
        GList.prototype.handleArchOrder2 = function () {
            if (this._childrenRenderOrder == fgui.ChildrenRenderOrder.Arch) {
                var mid = this._scrollPane.posX + this.viewWidth / 2;
                var minDist = Number.POSITIVE_INFINITY;
                var dist = 0;
                var apexIndex = 0;
                var cnt = this.numChildren;
                for (var i = 0; i < cnt; i++) {
                    var obj = this.getChildAt(i);
                    if (!this.foldInvisibleItems || obj.visible) {
                        dist = Math.abs(mid - obj.x - obj.width / 2);
                        if (dist < minDist) {
                            minDist = dist;
                            apexIndex = i;
                        }
                    }
                }
                this.apexIndex = apexIndex;
            }
        };
        GList.prototype.handleAlign = function (contentWidth, contentHeight) {
            var newOffsetX = 0;
            var newOffsetY = 0;
            if (contentHeight < this.viewHeight) {
                if (this._verticalAlign == fgui.VertAlignType.Middle)
                    newOffsetY = Math.floor((this.viewHeight - contentHeight) / 2);
                else if (this._verticalAlign == fgui.VertAlignType.Bottom)
                    newOffsetY = this.viewHeight - contentHeight;
            }
            if (contentWidth < this.viewWidth) {
                if (this._align == fgui.AlignType.Center)
                    newOffsetX = Math.floor((this.viewWidth - contentWidth) / 2);
                else if (this._align == fgui.AlignType.Right)
                    newOffsetX = this.viewWidth - contentWidth;
            }
            if (newOffsetX != this._alignOffset.x || newOffsetY != this._alignOffset.y) {
                this._alignOffset.setTo(newOffsetX, newOffsetY);
                if (this._scrollPane)
                    this._scrollPane.adjustMaskContainer();
                else {
                    this._container.x = this._margin.left + this._alignOffset.x;
                    this._container.y = this._margin.top + this._alignOffset.y;
                }
            }
        };
        GList.prototype.updateBounds = function () {
            if (this._virtual)
                return;
            var i;
            var child;
            var curX = 0;
            var curY = 0;
            var maxWidth = 0;
            var maxHeight = 0;
            var cw = 0, ch = 0;
            var j = 0;
            var page = 0;
            var k = 0;
            var cnt = this._children.length;
            var viewWidth = this.viewWidth;
            var viewHeight = this.viewHeight;
            var lineSize = 0;
            var lineStart = 0;
            var ratio = 0;
            if (this._layout == fgui.ListLayoutType.SingleColumn) {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;
                    if (curY != 0)
                        curY += this._lineGap;
                    child.y = curY;
                    if (this._autoResizeItem)
                        child.setSize(viewWidth, child.height, true);
                    curY += Math.ceil(child.height);
                    if (child.width > maxWidth)
                        maxWidth = child.width;
                }
                ch = curY;
                if (ch <= viewHeight && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.vtScrollBar) {
                    viewWidth += this._scrollPane.vtScrollBar.width;
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        child.setSize(viewWidth, child.height, true);
                        if (child.width > maxWidth)
                            maxWidth = child.width;
                    }
                }
                cw = Math.ceil(maxWidth);
            }
            else if (this._layout == fgui.ListLayoutType.SingleRow) {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;
                    if (curX != 0)
                        curX += this._columnGap;
                    child.x = curX;
                    if (this._autoResizeItem)
                        child.setSize(child.width, viewHeight, true);
                    curX += Math.ceil(child.width);
                    if (child.height > maxHeight)
                        maxHeight = child.height;
                }
                cw = curX;
                if (cw <= viewWidth && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.hzScrollBar) {
                    viewHeight += this._scrollPane.hzScrollBar.height;
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        child.setSize(child.width, viewHeight, true);
                        if (child.height > maxHeight)
                            maxHeight = child.height;
                    }
                }
                ch = Math.ceil(maxHeight);
            }
            else if (this._layout == fgui.ListLayoutType.FlowHorizontal) {
                if (this._autoResizeItem && this._columnCount > 0) {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        lineSize += child.sourceWidth;
                        j++;
                        if (j == this._columnCount || i == cnt - 1) {
                            ratio = (viewWidth - lineSize - (j - 1) * this._columnGap) / lineSize;
                            curX = 0;
                            for (j = lineStart; j <= i; j++) {
                                child = this.getChildAt(j);
                                if (this.foldInvisibleItems && !child.visible)
                                    continue;
                                child.setXY(curX, curY);
                                if (j < i) {
                                    child.setSize(child.sourceWidth + Math.round(child.sourceWidth * ratio), child.height, true);
                                    curX += Math.ceil(child.width) + this._columnGap;
                                }
                                else {
                                    child.setSize(viewWidth - curX, child.height, true);
                                }
                                if (child.height > maxHeight)
                                    maxHeight = child.height;
                            }
                            curY += Math.ceil(maxHeight) + this._lineGap;
                            maxHeight = 0;
                            j = 0;
                            lineStart = i + 1;
                            lineSize = 0;
                        }
                    }
                    ch = curY + Math.ceil(maxHeight);
                    cw = viewWidth;
                }
                else {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        if (curX != 0)
                            curX += this._columnGap;
                        if (this._columnCount != 0 && j >= this._columnCount
                            || this._columnCount == 0 && curX + child.width > viewWidth && maxHeight != 0) {
                            curX = 0;
                            curY += Math.ceil(maxHeight) + this._lineGap;
                            maxHeight = 0;
                            j = 0;
                        }
                        child.setXY(curX, curY);
                        curX += Math.ceil(child.width);
                        if (curX > maxWidth)
                            maxWidth = curX;
                        if (child.height > maxHeight)
                            maxHeight = child.height;
                        j++;
                    }
                    ch = curY + Math.ceil(maxHeight);
                    cw = Math.ceil(maxWidth);
                }
            }
            else if (this._layout == fgui.ListLayoutType.FlowVertical) {
                if (this._autoResizeItem && this._lineCount > 0) {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        lineSize += child.sourceHeight;
                        j++;
                        if (j == this._lineCount || i == cnt - 1) {
                            ratio = (viewHeight - lineSize - (j - 1) * this._lineGap) / lineSize;
                            curY = 0;
                            for (j = lineStart; j <= i; j++) {
                                child = this.getChildAt(j);
                                if (this.foldInvisibleItems && !child.visible)
                                    continue;
                                child.setXY(curX, curY);
                                if (j < i) {
                                    child.setSize(child.width, child.sourceHeight + Math.round(child.sourceHeight * ratio), true);
                                    curY += Math.ceil(child.height) + this._lineGap;
                                }
                                else {
                                    child.setSize(child.width, viewHeight - curY, true);
                                }
                                if (child.width > maxWidth)
                                    maxWidth = child.width;
                            }
                            curX += Math.ceil(maxWidth) + this._columnGap;
                            maxWidth = 0;
                            j = 0;
                            lineStart = i + 1;
                            lineSize = 0;
                        }
                    }
                    cw = curX + Math.ceil(maxWidth);
                    ch = viewHeight;
                }
                else {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        if (curY != 0)
                            curY += this._lineGap;
                        if (this._lineCount != 0 && j >= this._lineCount
                            || this._lineCount == 0 && curY + child.height > viewHeight && maxWidth != 0) {
                            curY = 0;
                            curX += Math.ceil(maxWidth) + this._columnGap;
                            maxWidth = 0;
                            j = 0;
                        }
                        child.setXY(curX, curY);
                        curY += Math.ceil(child.height);
                        if (curY > maxHeight)
                            maxHeight = curY;
                        if (child.width > maxWidth)
                            maxWidth = child.width;
                        j++;
                    }
                    cw = curX + Math.ceil(maxWidth);
                    ch = Math.ceil(maxHeight);
                }
            }
            else {
                var eachHeight;
                if (this._autoResizeItem && this._lineCount > 0)
                    eachHeight = Math.floor((viewHeight - (this._lineCount - 1) * this._lineGap) / this._lineCount);
                if (this._autoResizeItem && this._columnCount > 0) {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        if (j == 0 && (this._lineCount != 0 && k >= this._lineCount
                            || this._lineCount == 0 && curY + (this._lineCount > 0 ? eachHeight : child.height) > viewHeight)) {
                            page++;
                            curY = 0;
                            k = 0;
                        }
                        lineSize += child.sourceWidth;
                        j++;
                        if (j == this._columnCount || i == cnt - 1) {
                            ratio = (viewWidth - lineSize - (j - 1) * this._columnGap) / lineSize;
                            curX = 0;
                            for (j = lineStart; j <= i; j++) {
                                child = this.getChildAt(j);
                                if (this.foldInvisibleItems && !child.visible)
                                    continue;
                                child.setXY(page * viewWidth + curX, curY);
                                if (j < i) {
                                    child.setSize(child.sourceWidth + Math.round(child.sourceWidth * ratio), this._lineCount > 0 ? eachHeight : child.height, true);
                                    curX += Math.ceil(child.width) + this._columnGap;
                                }
                                else {
                                    child.setSize(viewWidth - curX, this._lineCount > 0 ? eachHeight : child.height, true);
                                }
                                if (child.height > maxHeight)
                                    maxHeight = child.height;
                            }
                            curY += Math.ceil(maxHeight) + this._lineGap;
                            maxHeight = 0;
                            j = 0;
                            lineStart = i + 1;
                            lineSize = 0;
                            k++;
                        }
                    }
                }
                else {
                    for (i = 0; i < cnt; i++) {
                        child = this.getChildAt(i);
                        if (this.foldInvisibleItems && !child.visible)
                            continue;
                        if (curX != 0)
                            curX += this._columnGap;
                        if (this._autoResizeItem && this._lineCount > 0)
                            child.setSize(child.width, eachHeight, true);
                        if (this._columnCount != 0 && j >= this._columnCount
                            || this._columnCount == 0 && curX + child.width > viewWidth && maxHeight != 0) {
                            curX = 0;
                            curY += Math.ceil(maxHeight) + this._lineGap;
                            maxHeight = 0;
                            j = 0;
                            k++;
                            if (this._lineCount != 0 && k >= this._lineCount
                                || this._lineCount == 0 && curY + child.height > viewHeight && maxWidth != 0) {
                                page++;
                                curY = 0;
                                k = 0;
                            }
                        }
                        child.setXY(page * viewWidth + curX, curY);
                        curX += Math.ceil(child.width);
                        if (curX > maxWidth)
                            maxWidth = curX;
                        if (child.height > maxHeight)
                            maxHeight = child.height;
                        j++;
                    }
                }
                ch = page > 0 ? viewHeight : curY + Math.ceil(maxHeight);
                cw = (page + 1) * viewWidth;
            }
            this.handleAlign(cw, ch);
            this.setBounds(0, 0, cw, ch);
        };
        GList.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._layout = buffer.readByte();
            this._selectionMode = buffer.readByte();
            this._align = buffer.readByte();
            this._verticalAlign = buffer.readByte();
            this._lineGap = buffer.readShort();
            this._columnGap = buffer.readShort();
            this._lineCount = buffer.readShort();
            this._columnCount = buffer.readShort();
            this._autoResizeItem = buffer.readBool();
            this._childrenRenderOrder = buffer.readByte();
            this._apexIndex = buffer.readShort();
            if (buffer.readBool()) {
                this._margin.top = buffer.readInt();
                this._margin.bottom = buffer.readInt();
                this._margin.left = buffer.readInt();
                this._margin.right = buffer.readInt();
            }
            var overflow = buffer.readByte();
            if (overflow == fgui.OverflowType.Scroll) {
                var savedPos = buffer.position;
                buffer.seek(beginPos, 7);
                this.setupScroll(buffer);
                buffer.position = savedPos;
            }
            else
                this.setupOverflow(overflow);
            if (buffer.readBool())
                buffer.skip(8);
            if (buffer.version >= 2) {
                this.scrollItemToViewOnClick = buffer.readBool();
                this.foldInvisibleItems = buffer.readBool();
            }
            buffer.seek(beginPos, 8);
            this._defaultItem = buffer.readS();
            this.readItems(buffer);
        };
        GList.prototype.readItems = function (buffer) {
            var cnt;
            var i;
            var nextPos;
            var str;
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                str = buffer.readS();
                if (str == null) {
                    str = this.defaultItem;
                    if (!str) {
                        buffer.position = nextPos;
                        continue;
                    }
                }
                var obj = this.getFromPool(str);
                if (obj != null) {
                    this.addChild(obj);
                    this.setupItem(buffer, obj);
                }
                buffer.position = nextPos;
            }
        };
        GList.prototype.setupItem = function (buffer, obj) {
            var str;
            str = buffer.readS();
            if (str != null)
                obj.text = str;
            str = buffer.readS();
            if (str != null && (obj instanceof fgui.GButton))
                obj.selectedTitle = str;
            str = buffer.readS();
            if (str != null)
                obj.icon = str;
            str = buffer.readS();
            if (str != null && (obj instanceof fgui.GButton))
                obj.selectedIcon = str;
            str = buffer.readS();
            if (str != null)
                obj.name = str;
            var cnt;
            var i;
            if (obj instanceof fgui.GComponent) {
                cnt = buffer.readShort();
                for (i = 0; i < cnt; i++) {
                    var cc = obj.getController(buffer.readS());
                    str = buffer.readS();
                    if (cc)
                        cc.selectedPageId = str;
                }
                if (buffer.version >= 2) {
                    cnt = buffer.readShort();
                    for (i = 0; i < cnt; i++) {
                        var target = buffer.readS();
                        var propertyId = buffer.readShort();
                        var value = buffer.readS();
                        var obj2 = obj.getChildByPath(target);
                        if (obj2)
                            obj2.setProp(propertyId, value);
                    }
                }
            }
        };
        GList.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 6);
            var i = buffer.readShort();
            if (i != -1)
                this._selectionController = this.parent.getControllerAt(i);
        };
        return GList;
    }(fgui.GComponent));
    fgui.GList = GList;
    var s_n = 0;
})(fgui || (fgui = {}));

(function (fgui) {
    var GObjectPool = (function () {
        function GObjectPool() {
            this._count = 0;
            this._pool = {};
        }
        GObjectPool.prototype.clear = function () {
            for (var i1 in this._pool) {
                var arr = this._pool[i1];
                var cnt = arr.length;
                for (var i = 0; i < cnt; i++)
                    arr[i].dispose();
            }
            this._pool = {};
            this._count = 0;
        };
        Object.defineProperty(GObjectPool.prototype, "count", {
            get: function () {
                return this._count;
            },
            enumerable: true,
            configurable: true
        });
        GObjectPool.prototype.getObject = function (url) {
            url = fgui.UIPackage.normalizeURL(url);
            if (url == null)
                return null;
            var arr = this._pool[url];
            if (arr && arr.length) {
                this._count--;
                return arr.shift();
            }
            var child = fgui.UIPackage.createObjectFromURL(url);
            return child;
        };
        GObjectPool.prototype.returnObject = function (obj) {
            var url = obj.resourceURL;
            if (!url)
                return;
            var arr = this._pool[url];
            if (arr == null) {
                arr = new Array();
                this._pool[url] = arr;
            }
            this._count++;
            arr.push(obj);
        };
        return GObjectPool;
    }());
    fgui.GObjectPool = GObjectPool;
})(fgui || (fgui = {}));

(function (fgui) {
    var GLoader = (function (_super_1) {
        __extends(GLoader, _super_1);
        function GLoader() {
            var _this = _super_1.call(this) || this;
            _this._url = "";
            _this._fill = fgui.LoaderFillType.None;
            _this._align = fgui.AlignType.Left;
            _this._verticalAlign = fgui.VertAlignType.Top;
            _this._showErrorSign = true;
            return _this;
        }
        GLoader.prototype.createDisplayObject = function () {
            this._container = new fgui.UIContainer();
            this._container.opaque = true;
            this.setDisplayObject(this._container);
            this._content = new fgui.MovieClip();
            this._container.addChild(this._content);
        };
        GLoader.prototype.dispose = function () {
            if (!this._contentItem) {
                var texture = this._content.texture;
                if (texture)
                    this.freeExternal(texture);
            }
            if (this._content2)
                this._content2.dispose();
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GLoader.prototype, "url", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                if (this._url == value)
                    return;
                this.clearContent();
                this._url = value;
                this.loadContent();
                this.updateGear(7);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "icon", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                this.url = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "align", {
            get: function () {
                return this._align;
            },
            set: function (value) {
                if (this._align != value) {
                    this._align = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "verticalAlign", {
            get: function () {
                return this._verticalAlign;
            },
            set: function (value) {
                if (this._verticalAlign != value) {
                    this._verticalAlign = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "fill", {
            get: function () {
                return this._fill;
            },
            set: function (value) {
                if (this._fill != value) {
                    this._fill = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "shrinkOnly", {
            get: function () {
                return this._shrinkOnly;
            },
            set: function (value) {
                if (this._shrinkOnly != value) {
                    this._shrinkOnly = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "autoSize", {
            get: function () {
                return this._autoSize;
            },
            set: function (value) {
                if (this._autoSize != value) {
                    this._autoSize = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "playing", {
            get: function () {
                return this._content.playing;
            },
            set: function (value) {
                if (this._content.playing != value) {
                    this._content.playing = value;
                    this.updateGear(5);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "frame", {
            get: function () {
                return this._content.frame;
            },
            set: function (value) {
                if (this._content.frame != value) {
                    this._content.frame = value;
                    this.updateGear(5);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "color", {
            get: function () {
                return this._content.color;
            },
            set: function (value) {
                if (this._content.color != value) {
                    this._content.color = value;
                    this.updateGear(4);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "showErrorSign", {
            get: function () {
                return this._showErrorSign;
            },
            set: function (value) {
                this._showErrorSign = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "content", {
            get: function () {
                return this._content;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "component", {
            get: function () {
                return this._content2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "texture", {
            get: function () {
                return this._content.texture;
            },
            set: function (value) {
                this.url = null;
                this._content.frames = null;
                this._content.texture = value;
                if (value) {
                    this.sourceWidth = value.textureWidth;
                    this.sourceHeight = value.textureHeight;
                }
                else {
                    this.sourceWidth = this.sourceHeight = 0;
                }
                this.updateLayout();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "fillMethod", {
            get: function () {
                return this._content.fillMethod;
            },
            set: function (value) {
                this._content.fillMethod = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "fillOrigin", {
            get: function () {
                return this._content.fillOrigin;
            },
            set: function (value) {
                this._content.fillOrigin = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "fillClockwise", {
            get: function () {
                return this._content.fillClockwise;
            },
            set: function (value) {
                this._content.fillClockwise = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader.prototype, "fillAmount", {
            get: function () {
                return this._content.fillAmount;
            },
            set: function (value) {
                this._content.fillAmount = value;
            },
            enumerable: true,
            configurable: true
        });
        GLoader.prototype.loadContent = function () {
            if (!this._url)
                return;
            if (fgui.ToolSet.startsWith(this._url, "ui://"))
                this.loadFromPackage(this._url);
            else
                this.loadExternal();
        };
        GLoader.prototype.loadFromPackage = function (itemURL) {
            this._contentItem = fgui.UIPackage.getItemByURL(itemURL);
            if (this._contentItem) {
                this._contentItem = this._contentItem.getBranch();
                this.sourceWidth = this._contentItem.width;
                this.sourceHeight = this._contentItem.height;
                this._contentItem = this._contentItem.getHighResolution();
                this._contentItem.load();
                if (this._autoSize)
                    this.setSize(this.sourceWidth, this.sourceHeight);
                if (this._contentItem.type == fgui.PackageItemType.Image) {
                    if (this._contentItem.asset == null) {
                        this.setErrorState();
                    }
                    else {
                        this._content.texture = this._contentItem.asset;
                        this._content.scale9Grid = this._contentItem.scale9Grid;
                        if (this._contentItem.scaleByTile)
                            this._content.fillMode = egret.BitmapFillMode.REPEAT;
                        else
                            this._content.fillMode = egret.BitmapFillMode.SCALE;
                        this.updateLayout();
                    }
                }
                else if (this._contentItem.type == fgui.PackageItemType.MovieClip) {
                    this._content.interval = this._contentItem.interval;
                    this._content.swing = this._contentItem.swing;
                    this._content.repeatDelay = this._contentItem.repeatDelay;
                    this._content.frames = this._contentItem.frames;
                    this.updateLayout();
                }
                else if (this._contentItem.type == fgui.PackageItemType.Component) {
                    var obj = fgui.UIPackage.createObjectFromURL(itemURL);
                    if (!obj)
                        this.setErrorState();
                    else if (!(obj instanceof fgui.GComponent)) {
                        obj.dispose();
                        this.setErrorState();
                    }
                    else {
                        this._content2 = obj.asCom;
                        this._container.addChild(this._content2.displayObject);
                        this.updateLayout();
                    }
                }
                else
                    this.setErrorState();
            }
            else
                this.setErrorState();
        };
        GLoader.prototype.loadExternal = function () {
            RES.getResByUrl(this._url, this.__getResCompleted, this);
        };
        GLoader.prototype.freeExternal = function (texture) {
        };
        GLoader.prototype.onExternalLoadSuccess = function (texture) {
            this._content.texture = texture;
            this._content.scale9Grid = null;
            this._content.fillMode = egret.BitmapFillMode.SCALE;
            this.sourceWidth = texture.textureWidth;
            this.sourceHeight = texture.textureHeight;
            this.updateLayout();
        };
        GLoader.prototype.onExternalLoadFailed = function () {
            this.setErrorState();
        };
        GLoader.prototype.__getResCompleted = function (res, key) {
            if (res instanceof egret.Texture)
                this.onExternalLoadSuccess(res);
            else
                this.onExternalLoadFailed();
        };
        GLoader.prototype.setErrorState = function () {
            if (!this._showErrorSign)
                return;
            if (this._errorSign == null) {
                if (fgui.UIConfig.loaderErrorSign != null) {
                    this._errorSign = GLoader._errorSignPool.getObject(fgui.UIConfig.loaderErrorSign);
                }
            }
            if (this._errorSign) {
                this._errorSign.setSize(this.width, this.height);
                this._container.addChild(this._errorSign.displayObject);
            }
        };
        GLoader.prototype.clearErrorState = function () {
            if (this._errorSign) {
                this._container.removeChild(this._errorSign.displayObject);
                GLoader._errorSignPool.returnObject(this._errorSign);
                this._errorSign = null;
            }
        };
        GLoader.prototype.updateLayout = function () {
            if (!this._content2 && !this._content) {
                if (this._autoSize) {
                    this._updatingLayout = true;
                    this.setSize(50, 30);
                    this._updatingLayout = false;
                }
                return;
            }
            var cw = this.sourceWidth;
            var ch = this.sourceHeight;
            if (this._autoSize) {
                this._updatingLayout = true;
                if (cw == 0)
                    cw = 50;
                if (ch == 0)
                    ch = 30;
                this.setSize(cw, ch);
                this._updatingLayout = false;
                if (cw == this._width && ch == this._height) {
                    if (this._content2) {
                        this._content2.setXY(0, 0);
                        this._content2.setScale(1, 1);
                    }
                    else {
                        this._content.x = 0;
                        this._content.y = 0;
                        this._content.width = cw;
                        this._content.height = ch;
                    }
                    return;
                }
            }
            var sx = 1, sy = 1;
            if (this._fill != fgui.LoaderFillType.None) {
                sx = this.width / this.sourceWidth;
                sy = this.height / this.sourceHeight;
                if (sx != 1 || sy != 1) {
                    if (this._fill == fgui.LoaderFillType.ScaleMatchHeight)
                        sx = sy;
                    else if (this._fill == fgui.LoaderFillType.ScaleMatchWidth)
                        sy = sx;
                    else if (this._fill == fgui.LoaderFillType.Scale) {
                        if (sx > sy)
                            sx = sy;
                        else
                            sy = sx;
                    }
                    else if (this._fill == fgui.LoaderFillType.ScaleNoBorder) {
                        if (sx > sy)
                            sy = sx;
                        else
                            sx = sy;
                    }
                    if (this._shrinkOnly) {
                        if (sx > 1)
                            sx = 1;
                        if (sy > 1)
                            sy = 1;
                    }
                    cw = this.sourceWidth * sx;
                    ch = this.sourceHeight * sy;
                }
            }
            if (this._content2) {
                this._content2.setScale(sx, sy);
            }
            else {
                this._content.width = cw;
                this._content.height = ch;
            }
            var nx, ny;
            if (this._align == fgui.AlignType.Center)
                nx = Math.floor((this.width - cw) / 2);
            else if (this._align == fgui.AlignType.Right)
                nx = this.width - cw;
            else
                nx = 0;
            if (this._verticalAlign == fgui.VertAlignType.Middle)
                ny = Math.floor((this.height - ch) / 2);
            else if (this._verticalAlign == fgui.VertAlignType.Bottom)
                ny = this.height - ch;
            else
                ny = 0;
            if (this._content2)
                this._content2.setXY(nx, ny);
            else {
                this._content.x = nx;
                this._content.y = ny;
            }
        };
        GLoader.prototype.clearContent = function () {
            this.clearErrorState();
            if (!this._contentItem && this._content.texture) {
                this.freeExternal(this._content.texture);
            }
            this._content.texture = null;
            this._content.frames = null;
            if (this._content2) {
                this._container.removeChild(this._content2.displayObject);
                this._content2.dispose();
                this._content2 = null;
            }
            this._contentItem = null;
        };
        GLoader.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (!this._updatingLayout)
                this.updateLayout();
        };
        GLoader.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.color;
                case fgui.ObjectPropID.Playing:
                    return this.playing;
                case fgui.ObjectPropID.Frame:
                    return this.frame;
                case fgui.ObjectPropID.TimeScale:
                    return this._content.timeScale;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GLoader.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.color = value;
                    break;
                case fgui.ObjectPropID.Playing:
                    this.playing = value;
                    break;
                case fgui.ObjectPropID.Frame:
                    this.frame = value;
                    break;
                case fgui.ObjectPropID.TimeScale:
                    this._content.timeScale = value;
                    break;
                case fgui.ObjectPropID.DeltaTime:
                    this._content.advance(value);
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GLoader.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._url = buffer.readS();
            this._align = buffer.readByte();
            this._verticalAlign = buffer.readByte();
            this._fill = buffer.readByte();
            this._shrinkOnly = buffer.readBool();
            this._autoSize = buffer.readBool();
            this._showErrorSign = buffer.readBool();
            this._content.playing = buffer.readBool();
            this._content.frame = buffer.readInt();
            if (buffer.readBool())
                this.color = buffer.readColor();
            this._content.fillMethod = buffer.readByte();
            if (this._content.fillMethod != 0) {
                this._content.fillOrigin = buffer.readByte();
                this._content.fillClockwise = buffer.readBool();
                this._content.fillAmount = buffer.readFloat();
            }
            if (this._url)
                this.loadContent();
        };
        GLoader._errorSignPool = new fgui.GObjectPool();
        return GLoader;
    }(fgui.GObject));
    fgui.GLoader = GLoader;
})(fgui || (fgui = {}));

(function (fgui) {
    var GLoader3D = (function (_super_1) {
        __extends(GLoader3D, _super_1);
        function GLoader3D() {
            var _this = _super_1.call(this) || this;
            _this._frame = 0;
            _this._playing = true;
            _this._url = "";
            _this._fill = fgui.LoaderFillType.None;
            _this._align = fgui.AlignType.Left;
            _this._verticalAlign = fgui.VertAlignType.Top;
            _this._color = 0xFFFFFF;
            return _this;
        }
        GLoader3D.prototype.createDisplayObject = function () {
            var d = new fgui.UIContainer();
            d.opaque = true;
            this.setDisplayObject(d);
            this._container = new egret.DisplayObjectContainer();
            d.addChild(this._container);
        };
        GLoader3D.prototype.dispose = function () {
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GLoader3D.prototype, "url", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                if (this._url == value)
                    return;
                this._url = value;
                this.loadContent();
                this.updateGear(7);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "icon", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                this.url = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "align", {
            get: function () {
                return this._align;
            },
            set: function (value) {
                if (this._align != value) {
                    this._align = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "verticalAlign", {
            get: function () {
                return this._verticalAlign;
            },
            set: function (value) {
                if (this._verticalAlign != value) {
                    this._verticalAlign = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "fill", {
            get: function () {
                return this._fill;
            },
            set: function (value) {
                if (this._fill != value) {
                    this._fill = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "shrinkOnly", {
            get: function () {
                return this._shrinkOnly;
            },
            set: function (value) {
                if (this._shrinkOnly != value) {
                    this._shrinkOnly = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "autoSize", {
            get: function () {
                return this._autoSize;
            },
            set: function (value) {
                if (this._autoSize != value) {
                    this._autoSize = value;
                    this.updateLayout();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "playing", {
            get: function () {
                return this._playing;
            },
            set: function (value) {
                if (this._playing != value) {
                    this._playing = value;
                    this.updateGear(5);
                    this.onChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "frame", {
            get: function () {
                return this._frame;
            },
            set: function (value) {
                if (this._frame != value) {
                    this._frame = value;
                    this.updateGear(5);
                    this.onChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "animationName", {
            get: function () {
                return this._animationName;
            },
            set: function (value) {
                if (this._animationName != value) {
                    this._animationName = value;
                    this.onChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "skinName", {
            get: function () {
                return this._skinName;
            },
            set: function (value) {
                if (this._skinName != value) {
                    this._skinName = value;
                    this.onChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "loop", {
            get: function () {
                return this._loop;
            },
            set: function (value) {
                if (this._loop != value) {
                    this._loop = value;
                    this.onChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "color", {
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this._color != value) {
                    this._color = value;
                    this.updateGear(4);
                    if (this._content)
                        this._content.tint = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLoader3D.prototype, "content", {
            get: function () {
                return;
            },
            enumerable: true,
            configurable: true
        });
        GLoader3D.prototype.loadContent = function () {
            this.clearContent();
            if (!this._url)
                return;
            if (fgui.ToolSet.startsWith(this._url, "ui://"))
                this.loadFromPackage(this._url);
            else
                this.loadExternal();
        };
        GLoader3D.prototype.loadFromPackage = function (itemURL) {
            this._contentItem = fgui.UIPackage.getItemByURL(itemURL);
            if (this._contentItem) {
                this._contentItem = this._contentItem.getBranch();
                this.sourceWidth = this._contentItem.width;
                this.sourceHeight = this._contentItem.height;
                this._contentItem = this._contentItem.getHighResolution();
                if (this._autoSize)
                    this.setSize(this.sourceWidth, this.sourceHeight);
                if (this._contentItem.type == fgui.PackageItemType.Spine || this._contentItem.type == fgui.PackageItemType.DragonBones)
                    this._contentItem.owner.getItemAssetAsync(this._contentItem, this.onLoaded.bind(this));
            }
        };
        GLoader3D.prototype.onLoaded = function (err, item) {
            if (this._contentItem != item)
                return;
            if (err)
                console.warn(err);
            if (!this._contentItem.asset)
                return;
            if (this._contentItem.type == fgui.PackageItemType.DragonBones)
                this.setDragonBones(this._contentItem.armatureName, this._contentItem.asset.name, this._contentItem.atlasAsset.name, this._skinName, this._contentItem.skeletonAnchor);
        };
        GLoader3D.prototype.setDragonBones = function (armatureName, dragonBonesName, skinName, textureAtlasName, anchor) {
            this.url = null;
            var egretFactory = dragonBones.EgretFactory.factory;
            this._content = egretFactory.buildArmatureDisplay(armatureName, dragonBonesName, skinName, textureAtlasName);
            this._container.addChild(this._content);
            this._content.x = anchor.x;
            this._content.y = anchor.y;
            this._content.tint = this._color;
            this.onChangeDragonBones();
            this.updateLayout();
        };
        GLoader3D.prototype.onChange = function () {
            this.onChangeDragonBones();
        };
        GLoader3D.prototype.onChangeDragonBones = function () {
            if (!(this._content instanceof dragonBones.EgretArmatureDisplay))
                return;
            if (this._animationName) {
                if (this._playing)
                    this._content.animation.play(this._animationName, this._loop ? 0 : 1);
                else
                    this._content.animation.gotoAndStopByFrame(this._animationName, this._frame);
            }
            else
                this._content.animation.reset();
        };
        GLoader3D.prototype.loadExternal = function () {
        };
        GLoader3D.prototype.updateLayout = function () {
            var cw = this.sourceWidth;
            var ch = this.sourceHeight;
            if (this._autoSize) {
                this._updatingLayout = true;
                if (cw == 0)
                    cw = 50;
                if (ch == 0)
                    ch = 30;
                this.setSize(cw, ch);
                this._updatingLayout = false;
                if (cw == this._width && ch == this._height) {
                    this._container.scaleX = this._container.scaleY = 1;
                    this._container.x = this._container.y = 0;
                    return;
                }
            }
            var sx = 1, sy = 1;
            if (this._fill != fgui.LoaderFillType.None) {
                sx = this.width / this.sourceWidth;
                sy = this.height / this.sourceHeight;
                if (sx != 1 || sy != 1) {
                    if (this._fill == fgui.LoaderFillType.ScaleMatchHeight)
                        sx = sy;
                    else if (this._fill == fgui.LoaderFillType.ScaleMatchWidth)
                        sy = sx;
                    else if (this._fill == fgui.LoaderFillType.Scale) {
                        if (sx > sy)
                            sx = sy;
                        else
                            sy = sx;
                    }
                    else if (this._fill == fgui.LoaderFillType.ScaleNoBorder) {
                        if (sx > sy)
                            sy = sx;
                        else
                            sx = sy;
                    }
                    if (this._shrinkOnly) {
                        if (sx > 1)
                            sx = 1;
                        if (sy > 1)
                            sy = 1;
                    }
                    cw = this.sourceWidth * sx;
                    ch = this.sourceHeight * sy;
                }
            }
            this._container.scaleX = sx;
            this._container.scaleY = sy;
            var nx, ny;
            if (this._align == fgui.AlignType.Center)
                nx = Math.floor((this.width - cw) / 2);
            else if (this._align == fgui.AlignType.Right)
                nx = this.width - cw;
            else
                nx = 0;
            if (this._verticalAlign == fgui.VertAlignType.Middle)
                ny = Math.floor((this.height - ch) / 2);
            else if (this._verticalAlign == fgui.VertAlignType.Bottom)
                ny = this.height - ch;
            else
                ny = 0;
            this._container.x = nx;
            this._container.y = ny;
        };
        GLoader3D.prototype.clearContent = function () {
            this._contentItem = null;
            if (this._content) {
                this._container.removeChild(this._content);
                if ('dispose' in this._content)
                    this._content.dispose();
                this._content = null;
            }
        };
        GLoader3D.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (!this._updatingLayout)
                this.updateLayout();
        };
        GLoader3D.prototype.handleGrayedChanged = function () {
        };
        GLoader3D.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.color;
                case fgui.ObjectPropID.Playing:
                    return this.playing;
                case fgui.ObjectPropID.Frame:
                    return this.frame;
                case fgui.ObjectPropID.TimeScale:
                    return 1;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GLoader3D.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.color = value;
                    break;
                case fgui.ObjectPropID.Playing:
                    this.playing = value;
                    break;
                case fgui.ObjectPropID.Frame:
                    this.frame = value;
                    break;
                case fgui.ObjectPropID.TimeScale:
                    break;
                case fgui.ObjectPropID.DeltaTime:
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GLoader3D.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._url = buffer.readS();
            this._align = buffer.readByte();
            this._verticalAlign = buffer.readByte();
            this._fill = buffer.readByte();
            this._shrinkOnly = buffer.readBool();
            this._autoSize = buffer.readBool();
            this._animationName = buffer.readS();
            this._skinName = buffer.readS();
            this._playing = buffer.readBool();
            this._frame = buffer.readInt();
            this._loop = buffer.readBool();
            if (buffer.readBool())
                this.color = buffer.readColor();
            if (this._url)
                this.loadContent();
        };
        return GLoader3D;
    }(fgui.GObject));
    fgui.GLoader3D = GLoader3D;
})(fgui || (fgui = {}));

(function (fgui) {
    var GMovieClip = (function (_super_1) {
        __extends(GMovieClip, _super_1);
        function GMovieClip() {
            return _super_1.call(this) || this;
        }
        Object.defineProperty(GMovieClip.prototype, "color", {
            get: function () {
                return this._content.color;
            },
            set: function (value) {
                if (this._content.color != value) {
                    this._content.color = value;
                    this.updateGear(4);
                }
            },
            enumerable: true,
            configurable: true
        });
        GMovieClip.prototype.createDisplayObject = function () {
            this._content = new fgui.MovieClip();
            this._content.touchEnabled = false;
            this.setDisplayObject(this._content);
        };
        Object.defineProperty(GMovieClip.prototype, "playing", {
            get: function () {
                return this._content.playing;
            },
            set: function (value) {
                if (this._content.playing != value) {
                    this._content.playing = value;
                    this.updateGear(5);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GMovieClip.prototype, "frame", {
            get: function () {
                return this._content.frame;
            },
            set: function (value) {
                if (this._content.frame != value) {
                    this._content.frame = value;
                    this.updateGear(5);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GMovieClip.prototype, "timeScale", {
            get: function () {
                return this._content.timeScale;
            },
            set: function (value) {
                this._content.timeScale = value;
            },
            enumerable: true,
            configurable: true
        });
        GMovieClip.prototype.rewind = function () {
            this._content.rewind();
        };
        GMovieClip.prototype.syncStatus = function (anotherMc) {
            this._content.syncStatus(anotherMc._content);
        };
        GMovieClip.prototype.advance = function (timeInMiniseconds) {
            this._content.advance(timeInMiniseconds);
        };
        GMovieClip.prototype.setPlaySettings = function (start, end, times, endAt, endCallback, callbackObj) {
            this._content.setPlaySettings(start, end, times, endAt, endCallback, callbackObj);
        };
        GMovieClip.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.color;
                case fgui.ObjectPropID.Playing:
                    return this.playing;
                case fgui.ObjectPropID.Frame:
                    return this.frame;
                case fgui.ObjectPropID.TimeScale:
                    return this.timeScale;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GMovieClip.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.color = value;
                    break;
                case fgui.ObjectPropID.Playing:
                    this.playing = value;
                    break;
                case fgui.ObjectPropID.Frame:
                    this.frame = value;
                    break;
                case fgui.ObjectPropID.TimeScale:
                    this.timeScale = value;
                    break;
                case fgui.ObjectPropID.DeltaTime:
                    this.advance(value);
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GMovieClip.prototype.constructFromResource = function () {
            var contentItem = this.packageItem.getBranch();
            this.sourceWidth = contentItem.width;
            this.sourceHeight = contentItem.height;
            this.initWidth = this.sourceWidth;
            this.initHeight = this.sourceHeight;
            this.setSize(this.sourceWidth, this.sourceHeight);
            contentItem = contentItem.getHighResolution();
            contentItem.load();
            this._content.interval = contentItem.interval;
            this._content.swing = contentItem.swing;
            this._content.repeatDelay = contentItem.repeatDelay;
            this._content.frames = contentItem.frames;
            this._content.smoothing = contentItem.smoothing;
        };
        GMovieClip.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            if (buffer.readBool())
                this.color = buffer.readColor();
            buffer.readByte();
            this._content.frame = buffer.readInt();
            this._content.playing = buffer.readBool();
        };
        return GMovieClip;
    }(fgui.GObject));
    fgui.GMovieClip = GMovieClip;
})(fgui || (fgui = {}));

(function (fgui) {
    var GProgressBar = (function (_super_1) {
        __extends(GProgressBar, _super_1);
        function GProgressBar() {
            var _this = _super_1.call(this) || this;
            _this._min = 0;
            _this._max = 0;
            _this._value = 0;
            _this._barMaxWidth = 0;
            _this._barMaxHeight = 0;
            _this._barMaxWidthDelta = 0;
            _this._barMaxHeightDelta = 0;
            _this._barStartX = 0;
            _this._barStartY = 0;
            _this._titleType = fgui.ProgressTitleType.Percent;
            _this._value = 50;
            _this._max = 100;
            return _this;
        }
        Object.defineProperty(GProgressBar.prototype, "titleType", {
            get: function () {
                return this._titleType;
            },
            set: function (value) {
                if (this._titleType != value) {
                    this._titleType = value;
                    this.update(this._value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GProgressBar.prototype, "min", {
            get: function () {
                return this._min;
            },
            set: function (value) {
                if (this._min != value) {
                    this._min = value;
                    this.update(this._value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GProgressBar.prototype, "max", {
            get: function () {
                return this._max;
            },
            set: function (value) {
                if (this._max != value) {
                    this._max = value;
                    this.update(this._value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GProgressBar.prototype, "value", {
            get: function () {
                return this._value;
            },
            set: function (value) {
                if (this._value != value) {
                    fgui.GTween.kill(this, false, this.update);
                    this._value = value;
                    this.update(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        GProgressBar.prototype.tweenValue = function (value, duration) {
            var oldValule;
            var tweener = fgui.GTween.getTween(this, this.update);
            if (tweener) {
                oldValule = tweener.value.x;
                tweener.kill();
            }
            else
                oldValule = this._value;
            this._value = value;
            return fgui.GTween.to(oldValule, this._value, duration).setTarget(this, this.update).setEase(fgui.EaseType.Linear);
        };
        GProgressBar.prototype.update = function (newValue) {
            var percent = fgui.ToolSet.clamp01((newValue - this._min) / (this._max - this._min));
            if (this._titleObject) {
                switch (this._titleType) {
                    case fgui.ProgressTitleType.Percent:
                        this._titleObject.text = Math.floor(percent * 100) + "%";
                        break;
                    case fgui.ProgressTitleType.ValueAndMax:
                        this._titleObject.text = Math.floor(newValue) + "/" + Math.floor(this._max);
                        break;
                    case fgui.ProgressTitleType.Value:
                        this._titleObject.text = "" + Math.floor(newValue);
                        break;
                    case fgui.ProgressTitleType.Max:
                        this._titleObject.text = "" + Math.floor(this._max);
                        break;
                }
            }
            var fullWidth = this.width - this._barMaxWidthDelta;
            var fullHeight = this.height - this._barMaxHeightDelta;
            if (!this._reverse) {
                if (this._barObjectH) {
                    if (!this.setFillAmount(this._barObjectH, percent))
                        this._barObjectH.width = Math.round(fullWidth * percent);
                }
                if (this._barObjectV) {
                    if (!this.setFillAmount(this._barObjectV, percent))
                        this._barObjectV.height = Math.round(fullHeight * percent);
                }
            }
            else {
                if (this._barObjectH) {
                    if (!this.setFillAmount(this._barObjectH, 1 - percent)) {
                        this._barObjectH.width = Math.round(fullWidth * percent);
                        this._barObjectH.x = this._barStartX + (fullWidth - this._barObjectH.width);
                    }
                }
                if (this._barObjectV) {
                    if (!this.setFillAmount(this._barObjectV, 1 - percent)) {
                        this._barObjectV.height = Math.round(fullHeight * percent);
                        this._barObjectV.y = this._barStartY + (fullHeight - this._barObjectV.height);
                    }
                }
            }
            if (this._aniObject)
                this._aniObject.setProp(fgui.ObjectPropID.Frame, Math.floor(percent * 100));
        };
        GProgressBar.prototype.setFillAmount = function (bar, percent) {
            if (((bar instanceof fgui.GImage) || (bar instanceof fgui.GLoader)) && bar.fillMethod != fgui.FillMethod.None) {
                bar.fillAmount = percent;
                return true;
            }
            else
                return false;
        };
        GProgressBar.prototype.constructExtension = function (buffer) {
            buffer.seek(0, 6);
            this._titleType = buffer.readByte();
            this._reverse = buffer.readBool();
            this._titleObject = this.getChild("title");
            this._barObjectH = this.getChild("bar");
            this._barObjectV = this.getChild("bar_v");
            this._aniObject = this.getChild("ani");
            if (this._barObjectH) {
                this._barMaxWidth = this._barObjectH.width;
                this._barMaxWidthDelta = this.width - this._barMaxWidth;
                this._barStartX = this._barObjectH.x;
            }
            if (this._barObjectV) {
                this._barMaxHeight = this._barObjectV.height;
                this._barMaxHeightDelta = this.height - this._barMaxHeight;
                this._barStartY = this._barObjectV.y;
            }
        };
        GProgressBar.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (this._barObjectH)
                this._barMaxWidth = this.width - this._barMaxWidthDelta;
            if (this._barObjectV)
                this._barMaxHeight = this.height - this._barMaxHeightDelta;
            if (!this._underConstruct)
                this.update(this._value);
        };
        GProgressBar.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!buffer.seek(beginPos, 6)) {
                this.update(this._value);
                return;
            }
            if (buffer.readByte() != this.packageItem.objectType) {
                this.update(this._value);
                return;
            }
            this._value = buffer.readInt();
            this._max = buffer.readInt();
            if (buffer.version >= 2)
                this._min = buffer.readInt();
            this.update(this._value);
        };
        return GProgressBar;
    }(fgui.GComponent));
    fgui.GProgressBar = GProgressBar;
})(fgui || (fgui = {}));

(function (fgui) {
    var GTextField = (function (_super_1) {
        __extends(GTextField, _super_1);
        function GTextField() {
            var _this = _super_1.call(this) || this;
            _this._fontSize = 0;
            _this._leading = 0;
            _this._letterSpacing = 0;
            _this._textWidth = 0;
            _this._textHeight = 0;
            _this._fontSize = 12;
            _this._align = fgui.AlignType.Left;
            _this._verticalAlign = fgui.VertAlignType.Top;
            _this._text = "";
            _this._leading = 3;
            _this._color = 0;
            _this._autoSize = fgui.AutoSizeType.Both;
            _this._widthAutoSize = true;
            _this._heightAutoSize = true;
            return _this;
        }
        GTextField.prototype.createDisplayObject = function () {
            this._textField = new egret.TextField();
            this._textField.touchEnabled = false;
            this.setDisplayObject(this._textField);
        };
        GTextField.prototype.switchBitmapMode = function (val) {
            if (val && this.displayObject == this._textField) {
                if (this._bitmapContainer == null)
                    this._bitmapContainer = new egret.Sprite();
                this.switchDisplayObject(this._bitmapContainer);
            }
            else if (!val && this.displayObject == this._bitmapContainer)
                this.switchDisplayObject(this._textField);
        };
        GTextField.prototype.dispose = function () {
            _super_1.prototype.dispose.call(this);
            this._bitmapFont = null;
            this._requireRender = false;
        };
        Object.defineProperty(GTextField.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
                if (this._text == null)
                    this._text = "";
                this.updateGear(6);
                if (this.parent && this.parent._underConstruct)
                    this.renderNow();
                else
                    this.render();
            },
            enumerable: true,
            configurable: true
        });
        GTextField.prototype.updateTextFieldText = function () {
            var text2 = this._text;
            if (this._templateVars)
                text2 = this.parseTemplate(text2);
            if (this._ubbEnabled) {
                var arr = GTextField._htmlParser.parser(fgui.UBBParser.inst.parse(fgui.ToolSet.encodeHTML(text2)));
                if (this._underline) {
                    for (var i = 0; i < arr.length; i++) {
                        var element = arr[i];
                        if (element.style)
                            element.style.underline = true;
                        else
                            element.style = { underline: true };
                    }
                }
                this._textField.textFlow = arr;
            }
            else if (this._underline) {
                var arr = new Array(1);
                arr[0] = { text: text2, style: { underline: true } };
                this._textField.textFlow = arr;
            }
            else
                this._textField.text = text2;
        };
        Object.defineProperty(GTextField.prototype, "font", {
            get: function () {
                return this._font;
            },
            set: function (value) {
                if (this._font != value) {
                    this._font = value;
                    this.updateTextFormat();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "fontSize", {
            get: function () {
                return this._fontSize;
            },
            set: function (value) {
                if (value < 0)
                    return;
                if (this._fontSize != value) {
                    this._fontSize = value;
                    this.updateTextFormat();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "color", {
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this._color != value) {
                    this._color = value;
                    this.updateGear(4);
                    this.updateTextFormat();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "align", {
            get: function () {
                return this._align;
            },
            set: function (value) {
                if (this._align != value) {
                    this._align = value;
                    this._textField.textAlign = this.getAlignTypeString(this._align);
                    if (this._bitmapFont && !this._underConstruct)
                        this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "verticalAlign", {
            get: function () {
                return this._verticalAlign;
            },
            set: function (value) {
                if (this._verticalAlign != value) {
                    this._verticalAlign = value;
                    this._textField.verticalAlign = this.getVertAlignTypeString(this._verticalAlign);
                    if (this._bitmapFont && !this._underConstruct)
                        this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        GTextField.prototype.getAlignTypeString = function (type) {
            return type == fgui.AlignType.Left ? egret.HorizontalAlign.LEFT :
                (type == fgui.AlignType.Center ? egret.HorizontalAlign.CENTER : egret.HorizontalAlign.RIGHT);
        };
        GTextField.prototype.getVertAlignTypeString = function (type) {
            return type == fgui.VertAlignType.Top ? egret.VerticalAlign.TOP :
                (type == fgui.VertAlignType.Middle ? egret.VerticalAlign.MIDDLE : egret.VerticalAlign.BOTTOM);
        };
        Object.defineProperty(GTextField.prototype, "leading", {
            get: function () {
                return this._leading;
            },
            set: function (value) {
                if (this._leading != value) {
                    this._leading = value;
                    this.updateTextFormat();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "letterSpacing", {
            get: function () {
                return this._letterSpacing;
            },
            set: function (value) {
                if (this._letterSpacing != value) {
                    this._letterSpacing = value;
                    this.updateTextFormat();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "underline", {
            get: function () {
                return this._underline;
            },
            set: function (value) {
                this._underline = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "bold", {
            get: function () {
                return this._textField.bold;
            },
            set: function (value) {
                this._textField.bold = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "italic", {
            get: function () {
                return this._textField.italic;
            },
            set: function (value) {
                this._textField.italic = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "singleLine", {
            get: function () {
                return !this._textField.multiline;
            },
            set: function (value) {
                value = !value;
                if (this._textField.multiline != value) {
                    this._textField.multiline = value;
                    this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "stroke", {
            get: function () {
                return this._textField.stroke;
            },
            set: function (value) {
                this._textField.stroke = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "strokeColor", {
            get: function () {
                return this._textField.strokeColor;
            },
            set: function (value) {
                this._textField.strokeColor = value;
                this.updateGear(4);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "ubbEnabled", {
            get: function () {
                return this._ubbEnabled;
            },
            set: function (value) {
                if (this._ubbEnabled != value) {
                    this._ubbEnabled = value;
                    this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "autoSize", {
            get: function () {
                return this._autoSize;
            },
            set: function (value) {
                if (this._autoSize != value) {
                    this._autoSize = value;
                    this._widthAutoSize = value == fgui.AutoSizeType.Both;
                    this._heightAutoSize = value == fgui.AutoSizeType.Both || value == fgui.AutoSizeType.Height;
                    this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextField.prototype, "textWidth", {
            get: function () {
                if (this._requireRender)
                    this.renderNow();
                return this._textWidth;
            },
            enumerable: true,
            configurable: true
        });
        GTextField.prototype.ensureSizeCorrect = function () {
            if (this._sizeDirty && this._requireRender)
                this.renderNow();
        };
        GTextField.prototype.updateTextFormat = function () {
            this._textField.size = this._fontSize;
            this._bitmapFont = null;
            if (fgui.ToolSet.startsWith(this._font, "ui://")) {
                var pi = fgui.UIPackage.getItemByURL(this._font);
                if (pi)
                    this._bitmapFont = pi.owner.getItemAsset(pi);
            }
            if (this._bitmapFont == null) {
                if (this._font)
                    this._textField.fontFamily = this._font;
                else
                    this._textField.fontFamily = fgui.UIConfig.defaultFont;
            }
            if (this.grayed)
                this._textField.textColor = 0xAAAAAA;
            else
                this._textField.textColor = this._color;
            this._textField.lineSpacing = this._leading;
            if (!this._underConstruct)
                this.render();
        };
        GTextField.prototype.render = function () {
            if (!this._requireRender) {
                this._requireRender = true;
                egret.callLater(this.__render, this);
            }
            if (!this._sizeDirty && (this._widthAutoSize || this._heightAutoSize)) {
                this._sizeDirty = true;
                this.dispatchEventWith(fgui.GObject.SIZE_DELAY_CHANGE);
            }
        };
        GTextField.prototype.__render = function () {
            if (this._requireRender)
                this.renderNow();
        };
        GTextField.prototype.renderNow = function (updateBounds) {
            if (updateBounds === void 0) { updateBounds = true; }
            this._requireRender = false;
            this._sizeDirty = false;
            if (this._bitmapFont) {
                this.renderWithBitmapFont(updateBounds);
                return;
            }
            this.switchBitmapMode(false);
            this._textField.width = this._widthAutoSize ? (this.maxWidth <= 0 ? 10000 : this.maxWidth) : Math.ceil(this.width);
            this.updateTextFieldText();
            this._textWidth = Math.ceil(this._textField.textWidth);
            if (this._textWidth > 0)
                this._textWidth += 4;
            this._textHeight = Math.ceil(this._textField.textHeight);
            if (this._textHeight > 0)
                this._textHeight += 4;
            var w, h = 0;
            if (this._widthAutoSize) {
                w = this._textWidth;
                this._textField.width = w;
            }
            else
                w = this.width;
            if (this._heightAutoSize) {
                h = this._textHeight;
                if (this._textField.height != this._textHeight)
                    this._textField.height = this._textHeight;
            }
            else {
                h = this.height;
                if (this._textHeight > h)
                    this._textHeight = h;
            }
            if (updateBounds) {
                this._updatingSize = true;
                this.setSize(w, h);
                this._updatingSize = false;
            }
        };
        GTextField.prototype.renderWithBitmapFont = function (updateBounds) {
            this.switchBitmapMode(true);
            if (!this._bitmapPool)
                this._bitmapPool = [];
            var cnt = this._bitmapContainer.numChildren;
            for (var i = 0; i < cnt; i++) {
                var obj = this._bitmapContainer.getChildAt(i);
                this._bitmapPool.push(obj);
            }
            this._bitmapContainer.removeChildren();
            if (!this._lines)
                this._lines = new Array();
            else
                returnList(this._lines);
            var letterSpacing = this._letterSpacing;
            var lineSpacing = this._leading - 1;
            var rectWidth = this.width - GUTTER_X * 2;
            var lineWidth = 0, lineHeight = 0, lineTextHeight = 0;
            var glyphWidth = 0, glyphHeight = 0;
            var wordChars = 0, wordStart = 0, wordEnd = 0;
            var lastLineHeight = 0;
            var lineBuffer = "";
            var lineY = GUTTER_Y;
            var line;
            var wordWrap = !this._widthAutoSize && this._textField.multiline;
            var fontScale = this._bitmapFont.resizable ? this._fontSize / this._bitmapFont.size : 1;
            var tint = this._bitmapFont.tint;
            this._textWidth = 0;
            this._textHeight = 0;
            var text2 = this._text;
            if (this._templateVars)
                text2 = this.parseTemplate(text2);
            var textLength = text2.length;
            for (var offset = 0; offset < textLength; ++offset) {
                var ch = text2.charAt(offset);
                var cc = ch.charCodeAt(0);
                if (cc == 10) {
                    lineBuffer += ch;
                    line = borrow();
                    line.width = lineWidth;
                    if (lineTextHeight == 0) {
                        if (lastLineHeight == 0)
                            lastLineHeight = this._fontSize;
                        if (lineHeight == 0)
                            lineHeight = lastLineHeight;
                        lineTextHeight = lineHeight;
                    }
                    line.height = lineHeight;
                    lastLineHeight = lineHeight;
                    line.textHeight = lineTextHeight;
                    line.text = lineBuffer;
                    line.y = lineY;
                    lineY += (line.height + lineSpacing);
                    if (line.width > this._textWidth)
                        this._textWidth = line.width;
                    this._lines.push(line);
                    lineBuffer = "";
                    lineWidth = 0;
                    lineHeight = 0;
                    lineTextHeight = 0;
                    wordChars = 0;
                    wordStart = 0;
                    wordEnd = 0;
                    continue;
                }
                if (cc >= 65 && cc <= 90 || cc >= 97 && cc <= 122) {
                    if (wordChars == 0)
                        wordStart = lineWidth;
                    wordChars++;
                }
                else {
                    if (wordChars > 0)
                        wordEnd = lineWidth;
                    wordChars = 0;
                }
                if (cc == 32) {
                    glyphWidth = Math.ceil(this._fontSize / 2);
                    glyphHeight = this._fontSize;
                }
                else {
                    var glyph = this._bitmapFont.glyphs[ch];
                    if (glyph) {
                        glyphWidth = Math.ceil(glyph.advance * fontScale);
                        glyphHeight = Math.ceil(glyph.lineHeight * fontScale);
                    }
                    else {
                        glyphWidth = 0;
                        glyphHeight = 0;
                    }
                }
                if (glyphHeight > lineTextHeight)
                    lineTextHeight = glyphHeight;
                if (glyphHeight > lineHeight)
                    lineHeight = glyphHeight;
                if (lineWidth != 0)
                    lineWidth += letterSpacing;
                lineWidth += glyphWidth;
                if (!wordWrap || lineWidth <= rectWidth) {
                    lineBuffer += ch;
                }
                else {
                    line = borrow();
                    line.height = lineHeight;
                    line.textHeight = lineTextHeight;
                    if (lineBuffer.length == 0) {
                        line.text = ch;
                    }
                    else if (wordChars > 0 && wordEnd > 0) {
                        lineBuffer += ch;
                        var len = lineBuffer.length - wordChars;
                        line.text = fgui.ToolSet.trimRight(lineBuffer.substr(0, len));
                        line.width = wordEnd;
                        lineBuffer = lineBuffer.substr(len);
                        lineWidth -= wordStart;
                    }
                    else {
                        line.text = lineBuffer;
                        line.width = lineWidth - (glyphWidth + letterSpacing);
                        lineBuffer = ch;
                        lineWidth = glyphWidth;
                        lineHeight = glyphHeight;
                        lineTextHeight = glyphHeight;
                    }
                    line.y = lineY;
                    lineY += (line.height + lineSpacing);
                    if (line.width > this._textWidth)
                        this._textWidth = line.width;
                    wordChars = 0;
                    wordStart = 0;
                    wordEnd = 0;
                    this._lines.push(line);
                }
            }
            if (lineBuffer.length > 0) {
                line = borrow();
                line.width = lineWidth;
                if (lineHeight == 0)
                    lineHeight = lastLineHeight;
                if (lineTextHeight == 0)
                    lineTextHeight = lineHeight;
                line.height = lineHeight;
                line.textHeight = lineTextHeight;
                line.text = lineBuffer;
                line.y = lineY;
                if (line.width > this._textWidth)
                    this._textWidth = line.width;
                this._lines.push(line);
            }
            if (this._textWidth > 0)
                this._textWidth += GUTTER_X * 2;
            var count = this._lines.length;
            if (count == 0) {
                this._textHeight = 0;
            }
            else {
                line = this._lines[this._lines.length - 1];
                this._textHeight = line.y + line.height + GUTTER_Y;
            }
            var w, h = 0;
            if (this._widthAutoSize) {
                if (this._textWidth == 0)
                    w = 0;
                else
                    w = this._textWidth;
            }
            else
                w = this.width;
            if (this._heightAutoSize) {
                if (this._textHeight == 0)
                    h = 0;
                else
                    h = this._textHeight;
            }
            else
                h = this.height;
            if (updateBounds) {
                this._updatingSize = true;
                this.setSize(w, h);
                this._updatingSize = false;
            }
            if (w == 0 || h == 0)
                return;
            var charX = GUTTER_X;
            var lineIndent = 0;
            var charIndent = 0;
            rectWidth = this.width - GUTTER_X * 2;
            var lineCount = this._lines.length;
            for (var i = 0; i < lineCount; i++) {
                line = this._lines[i];
                charX = GUTTER_X;
                if (this._align == fgui.AlignType.Center)
                    lineIndent = (rectWidth - line.width) / 2;
                else if (this._align == fgui.AlignType.Right)
                    lineIndent = rectWidth - line.width;
                else
                    lineIndent = 0;
                textLength = line.text.length;
                for (var j = 0; j < textLength; j++) {
                    ch = line.text.charAt(j);
                    cc = ch.charCodeAt(0);
                    if (cc == 10)
                        continue;
                    if (cc == 32) {
                        charX += letterSpacing + Math.ceil(this._fontSize / 2);
                        continue;
                    }
                    glyph = this._bitmapFont.glyphs[ch];
                    if (glyph) {
                        charIndent = (line.height + line.textHeight) / 2 - Math.ceil(glyph.lineHeight * fontScale);
                        var bm;
                        if (this._bitmapPool.length)
                            bm = this._bitmapPool.pop();
                        else {
                            bm = new egret.Bitmap();
                            bm.smoothing = true;
                        }
                        bm.x = charX + lineIndent + Math.ceil(glyph.x * fontScale);
                        bm.y = line.y + charIndent + Math.ceil(glyph.y * fontScale);
                        bm["$backupY"] = bm.y;
                        bm.texture = glyph.texture;
                        bm.scaleX = fontScale;
                        bm.scaleY = fontScale;
                        if (tint)
                            bm.tint = this._color;
                        else
                            bm.tint = 0xFFFFFF;
                        this._bitmapContainer.addChild(bm);
                        charX += letterSpacing + Math.ceil(glyph.advance * fontScale);
                    }
                    else {
                        charX += letterSpacing;
                    }
                }
            }
            this.doAlign();
        };
        GTextField.prototype.handleSizeChanged = function () {
            if (this._updatingSize)
                return;
            if (this._bitmapFont) {
                if (!this._widthAutoSize)
                    this.render();
                else
                    this.doAlign();
            }
            else {
                if (this._underConstruct) {
                    this._textField.width = this.width;
                    this._textField.height = this.height;
                }
                else {
                    if (!this._widthAutoSize) {
                        if (!this._heightAutoSize) {
                            this._textField.width = this.width;
                            this._textField.height = this.height;
                        }
                        else
                            this._textField.width = this.width;
                    }
                }
            }
        };
        GTextField.prototype.parseTemplate = function (template) {
            var pos1 = 0, pos2, pos3;
            var tag;
            var value;
            var result = "";
            while ((pos2 = template.indexOf("{", pos1)) != -1) {
                if (pos2 > 0 && template.charCodeAt(pos2 - 1) == 92) {
                    result += template.substring(pos1, pos2 - 1);
                    result += "{";
                    pos1 = pos2 + 1;
                    continue;
                }
                result += template.substring(pos1, pos2);
                pos1 = pos2;
                pos2 = template.indexOf("}", pos1);
                if (pos2 == -1)
                    break;
                if (pos2 == pos1 + 1) {
                    result += template.substr(pos1, 2);
                    pos1 = pos2 + 1;
                    continue;
                }
                tag = template.substring(pos1 + 1, pos2);
                pos3 = tag.indexOf("=");
                if (pos3 != -1) {
                    value = this._templateVars[tag.substring(0, pos3)];
                    if (value == null)
                        result += tag.substring(pos3 + 1);
                    else
                        result += value;
                }
                else {
                    value = this._templateVars[tag];
                    if (value != null)
                        result += value;
                }
                pos1 = pos2 + 1;
            }
            if (pos1 < template.length)
                result += template.substr(pos1);
            return result;
        };
        Object.defineProperty(GTextField.prototype, "templateVars", {
            get: function () {
                return this._templateVars;
            },
            set: function (value) {
                if (!this._templateVars && !value)
                    return;
                this._templateVars = value;
                this.flushVars();
            },
            enumerable: true,
            configurable: true
        });
        GTextField.prototype.setVar = function (name, value) {
            if (!this._templateVars)
                this._templateVars = {};
            this._templateVars[name] = value;
            return this;
        };
        GTextField.prototype.flushVars = function () {
            this.render();
        };
        GTextField.prototype.handleGrayedChanged = function () {
            _super_1.prototype.handleGrayedChanged.call(this);
            this.updateTextFormat();
        };
        GTextField.prototype.doAlign = function () {
            var yOffset;
            if (this._verticalAlign == fgui.VertAlignType.Top || this._textHeight == 0)
                yOffset = GUTTER_Y;
            else {
                var dh = this.height - this._textHeight;
                if (dh < 0)
                    dh = 0;
                if (this._verticalAlign == fgui.VertAlignType.Middle)
                    yOffset = Math.floor(dh / 2);
                else
                    yOffset = Math.floor(dh);
            }
            var cnt = this._bitmapContainer.numChildren;
            for (var i = 0; i < cnt; i++) {
                var obj = this._bitmapContainer.getChildAt(i);
                obj.y = obj["$backupY"] + yOffset;
            }
        };
        GTextField.prototype.getProp = function (index) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    return this.color;
                case fgui.ObjectPropID.OutlineColor:
                    return this.strokeColor;
                case fgui.ObjectPropID.FontSize:
                    return this.fontSize;
                default:
                    return _super_1.prototype.getProp.call(this, index);
            }
        };
        GTextField.prototype.setProp = function (index, value) {
            switch (index) {
                case fgui.ObjectPropID.Color:
                    this.color = value;
                    break;
                case fgui.ObjectPropID.OutlineColor:
                    this.strokeColor = value;
                    break;
                case fgui.ObjectPropID.FontSize:
                    this.fontSize = value;
                    break;
                default:
                    _super_1.prototype.setProp.call(this, index, value);
                    break;
            }
        };
        GTextField.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 5);
            this._font = buffer.readS();
            this._fontSize = buffer.readShort();
            this._color = buffer.readColor();
            this.align = buffer.readByte();
            this.verticalAlign = buffer.readByte();
            this._leading = buffer.readShort();
            this._letterSpacing = buffer.readShort();
            this._ubbEnabled = buffer.readBool();
            this._autoSize = buffer.readByte();
            this._widthAutoSize = this._autoSize == fgui.AutoSizeType.Both;
            this._heightAutoSize = this._autoSize == fgui.AutoSizeType.Both || this._autoSize == fgui.AutoSizeType.Height;
            this._underline = buffer.readBool();
            this._textField.italic = buffer.readBool();
            this._textField.bold = buffer.readBool();
            this._textField.multiline = !buffer.readBool();
            if (buffer.readBool()) {
                this._textField.strokeColor = buffer.readColor();
                this.stroke = buffer.readFloat() + 1;
            }
            if (buffer.readBool())
                buffer.skip(12);
            if (buffer.readBool())
                this._templateVars = {};
        };
        GTextField.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            this.updateTextFormat();
            buffer.seek(beginPos, 6);
            var str = buffer.readS();
            if (str != null)
                this.text = str;
            this._sizeDirty = false;
        };
        GTextField._htmlParser = new egret.HtmlTextParser();
        return GTextField;
    }(fgui.GObject));
    fgui.GTextField = GTextField;
    var pool = [];
    function borrow() {
        if (pool.length) {
            var ret = pool.pop();
            ret.width = 0;
            ret.height = 0;
            ret.textHeight = 0;
            ret.text = null;
            ret.y = 0;
            return ret;
        }
        else
            return {
                width: 0,
                height: 0,
                textHeight: 0,
                text: null,
                y: 0
            };
    }
    function returnList(value) {
        var length = value.length;
        for (var i = 0; i < length; i++) {
            var li = value[i];
            pool.push(li);
        }
        value.length = 0;
    }
    var GUTTER_X = 2;
    var GUTTER_Y = 2;
})(fgui || (fgui = {}));

(function (fgui) {
    var GRichTextField = (function (_super_1) {
        __extends(GRichTextField, _super_1);
        function GRichTextField() {
            var _this = _super_1.call(this) || this;
            _this._textField.touchEnabled = true;
            return _this;
        }
        GRichTextField.prototype.updateTextFieldText = function () {
            var text2 = this._text;
            if (this._templateVars)
                text2 = this.parseTemplate(text2);
            var arr;
            if (this._ubbEnabled)
                arr = fgui.GTextField._htmlParser.parser(fgui.UBBParser.inst.parse(text2));
            else
                arr = fgui.GTextField._htmlParser.parser(text2);
            if (this._underline) {
                for (var i = 0; i < arr.length; i++) {
                    var element = arr[i];
                    if (element.style)
                        element.style.underline = true;
                    else
                        element.style = { underline: true };
                }
            }
            this._textField.textFlow = arr;
        };
        return GRichTextField;
    }(fgui.GTextField));
    fgui.GRichTextField = GRichTextField;
})(fgui || (fgui = {}));

(function (fgui) {
    var GRoot = (function (_super_1) {
        __extends(GRoot, _super_1);
        function GRoot() {
            var _this = _super_1.call(this) || this;
            if (GRoot._inst == null)
                GRoot._inst = _this;
            _this.opaque = false;
            _this._volumeScale = 1;
            _this._popupStack = new Array();
            _this._justClosedPopups = new Array();
            _this.displayObject.addEventListener(egret.Event.ADDED_TO_STAGE, _this.__addedToStage, _this);
            return _this;
        }
        Object.defineProperty(GRoot, "inst", {
            get: function () {
                if (GRoot._inst == null)
                    new GRoot();
                return GRoot._inst;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GRoot.prototype, "nativeStage", {
            get: function () {
                return this._nativeStage;
            },
            enumerable: true,
            configurable: true
        });
        GRoot.prototype.showWindow = function (win) {
            this.addChild(win);
            win.requestFocus();
            if (win.x > this.width)
                win.x = this.width - win.width;
            else if (win.x + win.width < 0)
                win.x = 0;
            if (win.y > this.height)
                win.y = this.height - win.height;
            else if (win.y + win.height < 0)
                win.y = 0;
            this.adjustModalLayer();
        };
        GRoot.prototype.hideWindow = function (win) {
            win.hide();
        };
        GRoot.prototype.hideWindowImmediately = function (win) {
            if (win.parent == this)
                this.removeChild(win);
            this.adjustModalLayer();
        };
        GRoot.prototype.bringToFront = function (win) {
            var cnt = this.numChildren;
            var i;
            if (this._modalLayer.parent != null && !win.modal)
                i = this.getChildIndex(this._modalLayer) - 1;
            else
                i = cnt - 1;
            for (; i >= 0; i--) {
                var g = this.getChildAt(i);
                if (g == win)
                    return;
                if (g instanceof fgui.Window)
                    break;
            }
            if (i >= 0)
                this.setChildIndex(win, i);
        };
        GRoot.prototype.showModalWait = function (msg) {
            if (fgui.UIConfig.globalModalWaiting != null) {
                if (this._modalWaitPane == null)
                    this._modalWaitPane = fgui.UIPackage.createObjectFromURL(fgui.UIConfig.globalModalWaiting);
                this._modalWaitPane.setSize(this.width, this.height);
                this._modalWaitPane.addRelation(this, fgui.RelationType.Size);
                this.addChild(this._modalWaitPane);
                this._modalWaitPane.text = msg;
            }
        };
        GRoot.prototype.closeModalWait = function () {
            if (this._modalWaitPane != null && this._modalWaitPane.parent != null)
                this.removeChild(this._modalWaitPane);
        };
        GRoot.prototype.closeAllExceptModals = function () {
            var arr = this._children.slice();
            var cnt = arr.length;
            for (var i = 0; i < cnt; i++) {
                var g = arr[i];
                if ((g instanceof fgui.Window) && !g.modal)
                    g.hide();
            }
        };
        GRoot.prototype.closeAllWindows = function () {
            var arr = this._children.slice();
            var cnt = arr.length;
            for (var i = 0; i < cnt; i++) {
                var g = arr[i];
                if (g instanceof fgui.Window)
                    g.hide();
            }
        };
        GRoot.prototype.getTopWindow = function () {
            var cnt = this.numChildren;
            for (var i = cnt - 1; i >= 0; i--) {
                var g = this.getChildAt(i);
                if (g instanceof fgui.Window) {
                    return g;
                }
            }
            return null;
        };
        Object.defineProperty(GRoot.prototype, "modalLayer", {
            get: function () {
                return this._modalLayer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GRoot.prototype, "hasModalWindow", {
            get: function () {
                return this._modalLayer.parent != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GRoot.prototype, "modalWaiting", {
            get: function () {
                return this._modalWaitPane && this._modalWaitPane.inContainer;
            },
            enumerable: true,
            configurable: true
        });
        GRoot.prototype.showPopup = function (popup, target, dir) {
            if (this._popupStack.length > 0) {
                var k = this._popupStack.indexOf(popup);
                if (k != -1) {
                    for (var i = this._popupStack.length - 1; i >= k; i--)
                        this.removeChild(this._popupStack.pop());
                }
            }
            this._popupStack.push(popup);
            if (target) {
                var p = target;
                while (p) {
                    if (p.parent == this) {
                        if (popup.sortingOrder < p.sortingOrder) {
                            popup.sortingOrder = p.sortingOrder;
                        }
                        break;
                    }
                    p = p.parent;
                }
            }
            this.addChild(popup);
            this.adjustModalLayer();
            var pos;
            var sizeW = 0, sizeH = 0;
            if (target) {
                pos = target.localToRoot();
                sizeW = target.width;
                sizeH = target.height;
            }
            else {
                pos = this.globalToLocal(GRoot.mouseX, GRoot.mouseY);
            }
            var xx, yy;
            xx = pos.x;
            if (xx + popup.width > this.width)
                xx = xx + sizeW - popup.width;
            yy = pos.y + sizeH;
            if (((dir === undefined || dir === fgui.PopupDirection.Auto) && pos.y + popup.height > this.height)
                || dir === false || dir === fgui.PopupDirection.Up) {
                yy = pos.y - popup.height - 1;
                if (yy < 0) {
                    yy = 0;
                    xx += sizeW / 2;
                }
            }
            popup.x = xx;
            popup.y = yy;
        };
        GRoot.prototype.togglePopup = function (popup, target, dir) {
            if (this._justClosedPopups.indexOf(popup) != -1)
                return;
            this.showPopup(popup, target, dir);
        };
        GRoot.prototype.hidePopup = function (popup) {
            if (popup) {
                var k = this._popupStack.indexOf(popup);
                if (k != -1) {
                    for (var i = this._popupStack.length - 1; i >= k; i--)
                        this.closePopup(this._popupStack.pop());
                }
            }
            else {
                var cnt = this._popupStack.length;
                for (i = cnt - 1; i >= 0; i--)
                    this.closePopup(this._popupStack[i]);
                this._popupStack.length = 0;
            }
        };
        Object.defineProperty(GRoot.prototype, "hasAnyPopup", {
            get: function () {
                return this._popupStack.length != 0;
            },
            enumerable: true,
            configurable: true
        });
        GRoot.prototype.closePopup = function (target) {
            if (target.parent) {
                if (target instanceof fgui.Window)
                    target.hide();
                else
                    this.removeChild(target);
            }
        };
        GRoot.prototype.showTooltips = function (msg) {
            if (this._defaultTooltipWin == null) {
                var resourceURL = fgui.UIConfig.tooltipsWin;
                if (!resourceURL) {
                    console.error("UIConfig.tooltipsWin not defined");
                    return;
                }
                this._defaultTooltipWin = fgui.UIPackage.createObjectFromURL(resourceURL);
            }
            this._defaultTooltipWin.text = msg;
            this.showTooltipsWin(this._defaultTooltipWin);
        };
        GRoot.prototype.showTooltipsWin = function (tooltipWin, position) {
            this.hideTooltips();
            this._tooltipWin = tooltipWin;
            var xx = 0;
            var yy = 0;
            if (!position) {
                xx = GRoot.mouseX + 10;
                yy = GRoot.mouseY + 20;
            }
            else {
                xx = position.x;
                yy = position.y;
            }
            var pt = this.globalToLocal(xx, yy);
            xx = pt.x;
            yy = pt.y;
            if (xx + this._tooltipWin.width > this.width) {
                xx = xx - this._tooltipWin.width - 1;
                if (xx < 0)
                    xx = 10;
            }
            if (yy + this._tooltipWin.height > this.height) {
                yy = yy - this._tooltipWin.height - 1;
                if (xx - this._tooltipWin.width - 1 > 0)
                    xx = xx - this._tooltipWin.width - 1;
                if (yy < 0)
                    yy = 10;
            }
            this._tooltipWin.x = xx;
            this._tooltipWin.y = yy;
            this.addChild(this._tooltipWin);
        };
        GRoot.prototype.hideTooltips = function () {
            if (this._tooltipWin) {
                if (this._tooltipWin.parent)
                    this.removeChild(this._tooltipWin);
                this._tooltipWin = null;
            }
        };
        GRoot.prototype.getObjectUnderPoint = function (globalX, globalY) {
            var ret = this._nativeStage.$hitTest(globalX, globalY);
            if (ret)
                return fgui.ToolSet.displayObjectToGObject(ret);
            else
                return null;
        };
        Object.defineProperty(GRoot.prototype, "focus", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        GRoot.prototype.setFocus = function (value) {
        };
        Object.defineProperty(GRoot.prototype, "volumeScale", {
            get: function () {
                return this._volumeScale;
            },
            set: function (value) {
                this._volumeScale = value;
            },
            enumerable: true,
            configurable: true
        });
        GRoot.prototype.playOneShotSound = function (sound, volumeScale) {
            volumeScale = volumeScale || 1;
            var vs = this._volumeScale * volumeScale;
            var channel = sound.play(0, 1);
            channel.volume = vs;
        };
        GRoot.prototype.adjustModalLayer = function () {
            var cnt = this.numChildren;
            if (this._modalWaitPane && this._modalWaitPane.parent)
                this.setChildIndex(this._modalWaitPane, cnt - 1);
            for (var i = cnt - 1; i >= 0; i--) {
                var g = this.getChildAt(i);
                if ((g instanceof fgui.Window) && g.modal) {
                    if (this._modalLayer.parent == null)
                        this.addChildAt(this._modalLayer, i);
                    else
                        this.setChildIndexBefore(this._modalLayer, i);
                    return;
                }
            }
            if (this._modalLayer.parent)
                this.removeChild(this._modalLayer);
        };
        GRoot.prototype.__addedToStage = function (evt) {
            this.displayObject.removeEventListener(egret.Event.ADDED_TO_STAGE, this.__addedToStage, this);
            this._nativeStage = this.displayObject.stage;
            this._nativeStage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__stageMouseDownCapture, this, true);
            this._nativeStage.addEventListener(egret.TouchEvent.TOUCH_END, this.__stageMouseUpCapture, this, true);
            this._nativeStage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__stageMouseMoveCapture, this, true);
            this._modalLayer = new fgui.GGraph();
            this._modalLayer.setSize(this.width, this.height);
            this._modalLayer.drawRect(0, 0, 0, fgui.UIConfig.modalLayerColor, fgui.UIConfig.modalLayerAlpha);
            this._modalLayer.addRelation(this, fgui.RelationType.Size);
            this.displayObject.stage.addEventListener(egret.Event.RESIZE, this.__winResize, this);
            this.__winResize(null);
        };
        GRoot.prototype.__stageMouseDownCapture = function (evt) {
            GRoot.mouseX = evt.stageX;
            GRoot.mouseY = evt.stageY;
            GRoot.touchDown = true;
            if (this._tooltipWin)
                this.hideTooltips();
            this._justClosedPopups.length = 0;
            if (this._popupStack.length > 0) {
                var mc = (evt.target);
                while (mc != this.displayObject.stage && mc) {
                    if (mc["$owner"]) {
                        var pindex = this._popupStack.indexOf(mc["$owner"]);
                        if (pindex != -1) {
                            for (var i = this._popupStack.length - 1; i > pindex; i--) {
                                var popup = this._popupStack.pop();
                                this.closePopup(popup);
                                this._justClosedPopups.push(popup);
                            }
                            return;
                        }
                    }
                    mc = mc.parent;
                }
                var cnt = this._popupStack.length;
                for (i = cnt - 1; i >= 0; i--) {
                    popup = this._popupStack[i];
                    this.closePopup(popup);
                    this._justClosedPopups.push(popup);
                }
                this._popupStack.length = 0;
            }
        };
        GRoot.prototype.__stageMouseMoveCapture = function (evt) {
            GRoot.mouseX = evt.stageX;
            GRoot.mouseY = evt.stageY;
        };
        GRoot.prototype.__stageMouseUpCapture = function (evt) {
            GRoot.touchDown = false;
        };
        GRoot.prototype.__winResize = function (evt) {
            this.setSize(this._nativeStage.stageWidth, this._nativeStage.stageHeight);
        };
        GRoot.prototype.updateContentScaleLevel = function () {
            var ss = 1;
            if (ss >= 3.5)
                GRoot.contentScaleLevel = 3;
            else if (ss >= 2.5)
                GRoot.contentScaleLevel = 2;
            else if (ss >= 1.5)
                GRoot.contentScaleLevel = 1;
            else
                GRoot.contentScaleLevel = 0;
        };
        GRoot.contentScaleLevel = 0;
        GRoot.contentScaleFactor = 1;
        return GRoot;
    }(fgui.GComponent));
    fgui.GRoot = GRoot;
})(fgui || (fgui = {}));

(function (fgui) {
    var GScrollBar = (function (_super_1) {
        __extends(GScrollBar, _super_1);
        function GScrollBar() {
            var _this = _super_1.call(this) || this;
            _this._dragOffset = new egret.Point();
            _this._scrollPerc = 0;
            return _this;
        }
        GScrollBar.prototype.setScrollPane = function (target, vertical) {
            this._target = target;
            this._vertical = vertical;
        };
        GScrollBar.prototype.setDisplayPerc = function (value) {
            if (this._vertical) {
                if (!this._fixedGripSize)
                    this._grip.height = Math.floor(value * this._bar.height);
                this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * this._scrollPerc;
            }
            else {
                if (!this._fixedGripSize)
                    this._grip.width = Math.floor(value * this._bar.width);
                this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * this._scrollPerc;
            }
            this._grip.visible = value != 0 && value != 1;
        };
        GScrollBar.prototype.setScrollPerc = function (val) {
            this._scrollPerc = val;
            if (this._vertical)
                this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * this._scrollPerc;
            else
                this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * this._scrollPerc;
        };
        Object.defineProperty(GScrollBar.prototype, "minSize", {
            get: function () {
                if (this._vertical)
                    return (this._arrowButton1 ? this._arrowButton1.height : 0) + (this._arrowButton2 ? this._arrowButton2.height : 0);
                else
                    return (this._arrowButton1 ? this._arrowButton1.width : 0) + (this._arrowButton2 ? this._arrowButton2.width : 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GScrollBar.prototype, "gripDragging", {
            get: function () {
                return this._gripDragging;
            },
            enumerable: true,
            configurable: true
        });
        GScrollBar.prototype.constructExtension = function (buffer) {
            buffer.seek(0, 6);
            this._fixedGripSize = buffer.readBool();
            this._grip = this.getChild("grip");
            if (!this._grip) {
                console.error("需要定义grip");
                return;
            }
            this._bar = this.getChild("bar");
            if (!this._bar) {
                console.error("需要定义bar");
                return;
            }
            this._arrowButton1 = this.getChild("arrow1");
            this._arrowButton2 = this.getChild("arrow2");
            this._grip.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__gripMouseDown, this);
            if (this._arrowButton1)
                this._arrowButton1.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__arrowButton1Click, this);
            if (this._arrowButton2)
                this._arrowButton2.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__arrowButton2Click, this);
            this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__barMouseDown, this);
        };
        GScrollBar.prototype.__gripMouseDown = function (evt) {
            this._gripDragging = true;
            this._target.updateScrollBarVisible();
            evt.stopPropagation();
            this.globalToLocal(evt.stageX, evt.stageY, this._dragOffset);
            this._dragOffset.x -= this._grip.x;
            this._dragOffset.y -= this._grip.y;
            this._grip.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__gripMouseMove, this);
            this._grip.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.__gripMouseUp, this);
        };
        GScrollBar.prototype.__gripMouseMove = function (evt) {
            if (!this.onStage)
                return;
            var pt = this.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            if (this._vertical) {
                var curY = pt.y - this._dragOffset.y;
                this._target.setPercY((curY - this._bar.y) / (this._bar.height - this._grip.height), false);
            }
            else {
                var curX = pt.x - this._dragOffset.x;
                this._target.setPercX((curX - this._bar.x) / (this._bar.width - this._grip.width), false);
            }
        };
        GScrollBar.prototype.__gripMouseUp = function (evt) {
            var st = evt.currentTarget;
            st.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.__gripMouseMove, this);
            st.removeEventListener(egret.TouchEvent.TOUCH_END, this.__gripMouseUp, this);
            if (this.onStage)
                return;
            this._gripDragging = false;
            this._target.updateScrollBarVisible();
        };
        GScrollBar.prototype.__arrowButton1Click = function (evt) {
            evt.stopPropagation();
            if (this._vertical)
                this._target.scrollUp();
            else
                this._target.scrollLeft();
        };
        GScrollBar.prototype.__arrowButton2Click = function (evt) {
            evt.stopPropagation();
            if (this._vertical)
                this._target.scrollDown();
            else
                this._target.scrollRight();
        };
        GScrollBar.prototype.__barMouseDown = function (evt) {
            var pt = this._grip.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            if (this._vertical) {
                if (pt.y < 0)
                    this._target.scrollUp(4);
                else
                    this._target.scrollDown(4);
            }
            else {
                if (pt.x < 0)
                    this._target.scrollLeft(4);
                else
                    this._target.scrollRight(4);
            }
        };
        return GScrollBar;
    }(fgui.GComponent));
    fgui.GScrollBar = GScrollBar;
    var s_vec2 = new egret.Point();
})(fgui || (fgui = {}));

(function (fgui) {
    var GSlider = (function (_super_1) {
        __extends(GSlider, _super_1);
        function GSlider() {
            var _this = _super_1.call(this) || this;
            _this._min = 0;
            _this._max = 0;
            _this._value = 0;
            _this._barMaxWidth = 0;
            _this._barMaxHeight = 0;
            _this._barMaxWidthDelta = 0;
            _this._barMaxHeightDelta = 0;
            _this._clickPercent = 0;
            _this._barStartX = 0;
            _this._barStartY = 0;
            _this.changeOnClick = true;
            _this.canDrag = true;
            _this._titleType = fgui.ProgressTitleType.Percent;
            _this._value = 50;
            _this._max = 100;
            _this._clickPos = new egret.Point();
            return _this;
        }
        Object.defineProperty(GSlider.prototype, "titleType", {
            get: function () {
                return this._titleType;
            },
            set: function (value) {
                this._titleType = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GSlider.prototype, "wholeNumbers", {
            get: function () {
                return this._wholeNumbers;
            },
            set: function (value) {
                if (this._wholeNumbers != value) {
                    this._wholeNumbers = value;
                    this.update();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GSlider.prototype, "min", {
            get: function () {
                return this._min;
            },
            set: function (value) {
                if (this._min != value) {
                    this._min = value;
                    this.update();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GSlider.prototype, "max", {
            get: function () {
                return this._max;
            },
            set: function (value) {
                if (this._max != value) {
                    this._max = value;
                    this.update();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GSlider.prototype, "value", {
            get: function () {
                return this._value;
            },
            set: function (value) {
                if (this._value != value) {
                    this._value = value;
                    this.update();
                }
            },
            enumerable: true,
            configurable: true
        });
        GSlider.prototype.update = function () {
            this.updateWithPercent((this._value - this._min) / (this._max - this._min));
        };
        GSlider.prototype.updateWithPercent = function (percent, manual) {
            percent = fgui.ToolSet.clamp01(percent);
            if (manual) {
                var newValue = fgui.ToolSet.clamp(this._min + (this._max - this._min) * percent, this._min, this._max);
                if (this._wholeNumbers) {
                    newValue = Math.round(newValue);
                    percent = fgui.ToolSet.clamp01((newValue - this._min) / (this._max - this._min));
                }
                if (newValue != this._value) {
                    this._value = newValue;
                    this.dispatchEvent(new fgui.StateChangeEvent(fgui.StateChangeEvent.CHANGED));
                }
            }
            if (this._titleObject) {
                switch (this._titleType) {
                    case fgui.ProgressTitleType.Percent:
                        this._titleObject.text = Math.floor(percent * 100) + "%";
                        break;
                    case fgui.ProgressTitleType.ValueAndMax:
                        this._titleObject.text = this._value + "/" + this._max;
                        break;
                    case fgui.ProgressTitleType.Value:
                        this._titleObject.text = "" + this._value;
                        break;
                    case fgui.ProgressTitleType.Max:
                        this._titleObject.text = "" + this._max;
                        break;
                }
            }
            var fullWidth = this.width - this._barMaxWidthDelta;
            var fullHeight = this.height - this._barMaxHeightDelta;
            if (!this._reverse) {
                if (this._barObjectH)
                    this._barObjectH.width = Math.round(fullWidth * percent);
                if (this._barObjectV)
                    this._barObjectV.height = Math.round(fullHeight * percent);
            }
            else {
                if (this._barObjectH) {
                    this._barObjectH.width = Math.round(fullWidth * percent);
                    this._barObjectH.x = this._barStartX + (fullWidth - this._barObjectH.width);
                }
                if (this._barObjectV) {
                    this._barObjectV.height = Math.round(fullHeight * percent);
                    this._barObjectV.y = this._barStartY + (fullHeight - this._barObjectV.height);
                }
            }
        };
        GSlider.prototype.constructExtension = function (buffer) {
            buffer.seek(0, 6);
            this._titleType = buffer.readByte();
            this._reverse = buffer.readBool();
            if (buffer.version >= 2) {
                this._wholeNumbers = buffer.readBool();
                this.changeOnClick = buffer.readBool();
            }
            this._titleObject = (this.getChild("title"));
            this._barObjectH = this.getChild("bar");
            this._barObjectV = this.getChild("bar_v");
            this._gripObject = this.getChild("grip");
            if (this._barObjectH) {
                this._barMaxWidth = this._barObjectH.width;
                this._barMaxWidthDelta = this.width - this._barMaxWidth;
                this._barStartX = this._barObjectH.x;
            }
            if (this._barObjectV) {
                this._barMaxHeight = this._barObjectV.height;
                this._barMaxHeightDelta = this.height - this._barMaxHeight;
                this._barStartY = this._barObjectV.y;
            }
            if (this._gripObject) {
                this._gripObject.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__gripMouseDown, this);
            }
            this.displayObject.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__barMouseDown, this);
        };
        GSlider.prototype.handleSizeChanged = function () {
            _super_1.prototype.handleSizeChanged.call(this);
            if (this._barObjectH)
                this._barMaxWidth = this.width - this._barMaxWidthDelta;
            if (this._barObjectV)
                this._barMaxHeight = this.height - this._barMaxHeightDelta;
            if (!this._underConstruct)
                this.update();
        };
        GSlider.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!buffer.seek(beginPos, 6)) {
                this.update();
                return;
            }
            if (buffer.readByte() != this.packageItem.objectType) {
                this.update();
                return;
            }
            this._value = buffer.readInt();
            this._max = buffer.readInt();
            if (buffer.version >= 2)
                this._min = buffer.readInt();
            this.update();
        };
        GSlider.prototype.__gripMouseDown = function (evt) {
            this.canDrag = true;
            evt.stopPropagation();
            this._clickPos = this.globalToLocal(evt.stageX, evt.stageY);
            this._clickPercent = fgui.ToolSet.clamp01((this._value - this._min) / (this._max - this._min));
            this._gripObject.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__gripMouseMove, this);
            this._gripObject.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.__gripMouseUp, this);
        };
        GSlider.prototype.__gripMouseMove = function (evt) {
            if (!this.canDrag) {
                return;
            }
            var pt = this.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            var deltaX = pt.x - this._clickPos.x;
            var deltaY = pt.y - this._clickPos.y;
            if (this._reverse) {
                deltaX = -deltaX;
                deltaY = -deltaY;
            }
            var percent;
            if (this._barObjectH)
                percent = this._clickPercent + deltaX / this._barMaxWidth;
            else
                percent = this._clickPercent + deltaY / this._barMaxHeight;
            this.updateWithPercent(percent, true);
        };
        GSlider.prototype.__gripMouseUp = function (evt) {
            evt.currentTarget.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.__gripMouseMove, this);
            evt.currentTarget.removeEventListener(egret.TouchEvent.TOUCH_END, this.__gripMouseUp, this);
        };
        GSlider.prototype.__barMouseDown = function (evt) {
            if (!this.changeOnClick)
                return;
            var pt = this._gripObject.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            var percent = fgui.ToolSet.clamp01((this._value - this._min) / (this._max - this._min));
            var delta;
            if (this._barObjectH)
                delta = pt.x / this._barMaxWidth;
            if (this._barObjectV)
                delta = pt.y / this._barMaxHeight;
            if (this._reverse)
                percent -= delta;
            else
                percent += delta;
            this.updateWithPercent(percent, true);
        };
        return GSlider;
    }(fgui.GComponent));
    fgui.GSlider = GSlider;
    var s_vec2 = new egret.Point();
})(fgui || (fgui = {}));

(function (fgui) {
    var GTextInput = (function (_super_1) {
        __extends(GTextInput, _super_1);
        function GTextInput() {
            var _this = _super_1.call(this) || this;
            _this._widthAutoSize = false;
            _this._heightAutoSize = false;
            _this.displayObject.touchChildren = true;
            _this._textField.type = egret.TextFieldType.INPUT;
            _this._textField.addEventListener(egret.Event.CHANGE, _this.__textChanged, _this);
            _this._textField.addEventListener(egret.FocusEvent.FOCUS_IN, _this.__focusIn, _this);
            _this._textField.addEventListener(egret.FocusEvent.FOCUS_OUT, _this.__focusOut, _this);
            return _this;
        }
        GTextInput.prototype.dispose = function () {
            _super_1.prototype.dispose.call(this);
        };
        Object.defineProperty(GTextInput.prototype, "editable", {
            get: function () {
                return this._textField.type == egret.TextFieldType.INPUT;
            },
            set: function (val) {
                if (val)
                    this._textField.type = egret.TextFieldType.INPUT;
                else
                    this._textField.type = egret.TextFieldType.DYNAMIC;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextInput.prototype, "maxLength", {
            get: function () {
                return this._textField.maxChars;
            },
            set: function (val) {
                this._textField.maxChars = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextInput.prototype, "promptText", {
            get: function () {
                return this._promptText;
            },
            set: function (val) {
                this._promptText = val;
                this.updateTextFieldText();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextInput.prototype, "restrict", {
            get: function () {
                return this._textField.restrict;
            },
            set: function (value) {
                this._textField.restrict = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextInput.prototype, "password", {
            get: function () {
                return this._password;
            },
            set: function (val) {
                if (this._password != val) {
                    this._password = val;
                    this._textField.displayAsPassword = this._password;
                    if (val)
                        this._textField.inputType = egret.TextFieldInputType.PASSWORD;
                    else
                        this._textField.inputType = egret.TextFieldInputType.TEXT;
                    this.render();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTextInput.prototype, "verticalAlign", {
            get: function () {
                return this._verticalAlign;
            },
            set: function (value) {
                if (this._verticalAlign != value) {
                    this._verticalAlign = value;
                    this.updateVertAlign();
                }
            },
            enumerable: true,
            configurable: true
        });
        GTextInput.prototype.updateVertAlign = function () {
            switch (this._verticalAlign) {
                case fgui.VertAlignType.Top:
                    this._textField.verticalAlign = egret.VerticalAlign.TOP;
                    break;
                case fgui.VertAlignType.Middle:
                    this._textField.verticalAlign = egret.VerticalAlign.MIDDLE;
                    break;
                case fgui.VertAlignType.Bottom:
                    this._textField.verticalAlign = egret.VerticalAlign.BOTTOM;
                    break;
            }
        };
        GTextInput.prototype.updateTextFieldText = function () {
            if (!this._text && this._promptText) {
                this._textField.displayAsPassword = false;
                this._textField.textFlow = (new egret.HtmlTextParser).parser(fgui.UBBParser.inst.parse(this._promptText));
            }
            else {
                this._textField.displayAsPassword = this._password;
                if (this._ubbEnabled)
                    this._textField.textFlow = (new egret.HtmlTextParser).parser(fgui.UBBParser.inst.parse(fgui.ToolSet.encodeHTML(this._text)));
                else
                    this._textField.text = this._text;
            }
        };
        GTextInput.prototype.handleSizeChanged = function () {
            if (!this._updatingSize) {
                this._textField.width = Math.ceil(this.width);
                this._textField.height = Math.ceil(this.height);
            }
        };
        GTextInput.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 4);
            var str = buffer.readS();
            if (str != null)
                this._promptText = str;
            str = buffer.readS();
            if (str != null)
                this._textField.restrict = str;
            var iv = buffer.readInt();
            if (iv != 0)
                this._textField.maxChars = iv;
            iv = buffer.readInt();
            if (iv != 0) {
            }
            if (buffer.readBool())
                this.password = true;
            this.updateVertAlign();
        };
        GTextInput.prototype.setup_afterAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_afterAdd.call(this, buffer, beginPos);
            if (!this._text && this._promptText) {
                this._textField.displayAsPassword = false;
                this._textField.textFlow = (new egret.HtmlTextParser).parser(fgui.UBBParser.inst.parse(fgui.ToolSet.encodeHTML(this._promptText)));
            }
        };
        GTextInput.prototype.__textChanged = function (evt) {
            this._text = this._textField.text;
        };
        GTextInput.prototype.__focusIn = function (evt) {
            if (!this._text && this._promptText) {
                this._textField.displayAsPassword = this._password;
                this._textField.text = "";
            }
        };
        GTextInput.prototype.__focusOut = function (evt) {
            this._text = this._textField.text;
            if (!this._text && this._promptText) {
                this._textField.displayAsPassword = false;
                this._textField.textFlow = (new egret.HtmlTextParser).parser(fgui.UBBParser.inst.parse(fgui.ToolSet.encodeHTML(this._promptText)));
            }
        };
        return GTextInput;
    }(fgui.GTextField));
    fgui.GTextInput = GTextInput;
})(fgui || (fgui = {}));

(function (fgui) {
    var GTree = (function (_super_1) {
        __extends(GTree, _super_1);
        function GTree() {
            var _this = _super_1.call(this) || this;
            _this._indent = 15;
            _this._rootNode = new fgui.GTreeNode(true);
            _this._rootNode._setTree(_this);
            _this._rootNode.expanded = true;
            return _this;
        }
        Object.defineProperty(GTree.prototype, "rootNode", {
            get: function () {
                return this._rootNode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTree.prototype, "indent", {
            get: function () {
                return this._indent;
            },
            set: function (value) {
                this._indent = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTree.prototype, "clickToExpand", {
            get: function () {
                return this._clickToExpand;
            },
            set: function (value) {
                this._clickToExpand = value;
            },
            enumerable: true,
            configurable: true
        });
        GTree.prototype.getSelectedNode = function () {
            if (this.selectedIndex != -1)
                return this.getChildAt(this.selectedIndex)._treeNode;
            else
                return null;
        };
        GTree.prototype.getSelectedNodes = function (result) {
            if (!result)
                result = new Array();
            s_list.length = 0;
            _super_1.prototype.getSelection.call(this, s_list);
            var cnt = s_list.length;
            var ret = new Array();
            for (var i = 0; i < cnt; i++) {
                var node = this.getChildAt(s_list[i])._treeNode;
                ret.push(node);
            }
            return ret;
        };
        GTree.prototype.selectNode = function (node, scrollItToView) {
            var parentNode = node.parent;
            while (parentNode && parentNode != this._rootNode) {
                parentNode.expanded = true;
                parentNode = parentNode.parent;
            }
            if (!node._cell)
                return;
            this.addSelection(this.getChildIndex(node._cell), scrollItToView);
        };
        GTree.prototype.unselectNode = function (node) {
            if (!node._cell)
                return;
            this.removeSelection(this.getChildIndex(node._cell));
        };
        GTree.prototype.expandAll = function (folderNode) {
            if (!folderNode)
                folderNode = this._rootNode;
            folderNode.expanded = true;
            var cnt = folderNode.numChildren;
            for (var i = 0; i < cnt; i++) {
                var node = folderNode.getChildAt(i);
                if (node.isFolder)
                    this.expandAll(node);
            }
        };
        GTree.prototype.collapseAll = function (folderNode) {
            if (!folderNode)
                folderNode = this._rootNode;
            if (folderNode != this._rootNode)
                folderNode.expanded = false;
            var cnt = folderNode.numChildren;
            for (var i = 0; i < cnt; i++) {
                var node = folderNode.getChildAt(i);
                if (node.isFolder)
                    this.collapseAll(node);
            }
        };
        GTree.prototype.createCell = function (node) {
            var child = this.getFromPool(node._resURL ? node._resURL : this.defaultItem);
            if (!(child instanceof fgui.GComponent))
                throw new Error("cannot create tree node object.");
            child._treeNode = node;
            node._cell = child;
            var indentObj = child.getChild("indent");
            if (indentObj != null)
                indentObj.width = (node.level - 1) * this._indent;
            var cc;
            cc = child.getController("expanded");
            if (cc) {
                cc.addEventListener(fgui.StateChangeEvent.CHANGED, this.__expandedStateChanged, this);
                cc.selectedIndex = node.expanded ? 1 : 0;
            }
            cc = child.getController("leaf");
            if (cc)
                cc.selectedIndex = node.isFolder ? 0 : 1;
            if (node.isFolder)
                child.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.__cellMouseDown, this);
            if (this.treeNodeRender)
                this.treeNodeRender.call(this.callbackThisObj, node, child);
        };
        GTree.prototype._afterInserted = function (node) {
            if (!node._cell)
                this.createCell(node);
            var index = this.getInsertIndexForNode(node);
            this.addChildAt(node._cell, index);
            if (this.treeNodeRender)
                this.treeNodeRender.call(this.callbackThisObj, node, node._cell);
            if (node.isFolder && node.expanded)
                this.checkChildren(node, index);
        };
        GTree.prototype.getInsertIndexForNode = function (node) {
            var prevNode = node.getPrevSibling();
            if (prevNode == null)
                prevNode = node.parent;
            var insertIndex = this.getChildIndex(prevNode._cell) + 1;
            var myLevel = node.level;
            var cnt = this.numChildren;
            for (var i = insertIndex; i < cnt; i++) {
                var testNode = this.getChildAt(i)._treeNode;
                if (testNode.level <= myLevel)
                    break;
                insertIndex++;
            }
            return insertIndex;
        };
        GTree.prototype._afterRemoved = function (node) {
            this.removeNode(node);
        };
        GTree.prototype._afterExpanded = function (node) {
            if (node == this._rootNode) {
                this.checkChildren(this._rootNode, 0);
                return;
            }
            if (this.treeNodeWillExpand != null)
                this.treeNodeWillExpand.call(this.callbackThisObj, node, true);
            if (node._cell == null)
                return;
            if (this.treeNodeRender)
                this.treeNodeRender.call(this.callbackThisObj, node, node._cell);
            var cc = node._cell.getController("expanded");
            if (cc)
                cc.selectedIndex = 1;
            if (node._cell.parent)
                this.checkChildren(node, this.getChildIndex(node._cell));
        };
        GTree.prototype._afterCollapsed = function (node) {
            if (node == this._rootNode) {
                this.checkChildren(this._rootNode, 0);
                return;
            }
            if (this.treeNodeWillExpand)
                this.treeNodeWillExpand.call(this.callbackThisObj, node, false);
            if (node._cell == null)
                return;
            if (this.treeNodeRender)
                this.treeNodeRender.call(this.callbackThisObj, node, node._cell);
            var cc = node._cell.getController("expanded");
            if (cc)
                cc.selectedIndex = 0;
            if (node._cell.parent)
                this.hideFolderNode(node);
        };
        GTree.prototype._afterMoved = function (node) {
            var startIndex = this.getChildIndex(node._cell);
            var endIndex;
            if (node.isFolder)
                endIndex = this.getFolderEndIndex(startIndex, node.level);
            else
                endIndex = startIndex + 1;
            var insertIndex = this.getInsertIndexForNode(node);
            var i;
            var cnt = endIndex - startIndex;
            var obj;
            if (insertIndex < startIndex) {
                for (i = 0; i < cnt; i++) {
                    obj = this.getChildAt(startIndex + i);
                    this.setChildIndex(obj, insertIndex + i);
                }
            }
            else {
                for (i = 0; i < cnt; i++) {
                    obj = this.getChildAt(startIndex);
                    this.setChildIndex(obj, insertIndex);
                }
            }
        };
        GTree.prototype.getFolderEndIndex = function (startIndex, level) {
            var cnt = this.numChildren;
            for (var i = startIndex + 1; i < cnt; i++) {
                var node = this.getChildAt(i)._treeNode;
                if (node.level <= level)
                    return i;
            }
            return cnt;
        };
        GTree.prototype.checkChildren = function (folderNode, index) {
            var cnt = folderNode.numChildren;
            for (var i = 0; i < cnt; i++) {
                index++;
                var node = folderNode.getChildAt(i);
                if (node._cell == null)
                    this.createCell(node);
                if (!node._cell.parent)
                    this.addChildAt(node._cell, index);
                if (node.isFolder && node.expanded)
                    index = this.checkChildren(node, index);
            }
            return index;
        };
        GTree.prototype.hideFolderNode = function (folderNode) {
            var cnt = folderNode.numChildren;
            for (var i = 0; i < cnt; i++) {
                var node = folderNode.getChildAt(i);
                if (node._cell)
                    this.removeChild(node._cell);
                if (node.isFolder && node.expanded)
                    this.hideFolderNode(node);
            }
        };
        GTree.prototype.removeNode = function (node) {
            if (node._cell) {
                if (node._cell.parent)
                    this.removeChild(node._cell);
                this.returnToPool(node._cell);
                node._cell._treeNode = null;
                node._cell = null;
            }
            if (node.isFolder) {
                var cnt = node.numChildren;
                for (var i = 0; i < cnt; i++) {
                    var node2 = node.getChildAt(i);
                    this.removeNode(node2);
                }
            }
        };
        GTree.prototype.__cellMouseDown = function (evt) {
            var node = evt.currentTarget._treeNode;
            this._expandedStatusInEvt = node.expanded;
        };
        GTree.prototype.__expandedStateChanged = function (evt) {
            var cc = evt.currentTarget;
            var node = cc.parent._treeNode;
            node.expanded = cc.selectedIndex == 1;
        };
        GTree.prototype.dispatchItemEvent = function (evt) {
            if (this._clickToExpand != 0) {
                var node = evt.itemObject._treeNode;
                if (node && node.isFolder && this._expandedStatusInEvt == node.expanded) {
                    if (this._clickToExpand == 2) {
                    }
                    else
                        node.expanded = !node.expanded;
                }
            }
            _super_1.prototype.dispatchItemEvent.call(this, evt);
        };
        GTree.prototype.setup_beforeAdd = function (buffer, beginPos) {
            _super_1.prototype.setup_beforeAdd.call(this, buffer, beginPos);
            buffer.seek(beginPos, 9);
            this._indent = buffer.readInt();
            this._clickToExpand = buffer.readByte();
        };
        GTree.prototype.readItems = function (buffer) {
            var cnt;
            var i;
            var nextPos;
            var str;
            var isFolder;
            var lastNode;
            var level;
            var prevLevel = 0;
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                str = buffer.readS();
                if (str == null) {
                    str = this.defaultItem;
                    if (!str) {
                        buffer.position = nextPos;
                        continue;
                    }
                }
                isFolder = buffer.readBool();
                level = buffer.readByte();
                var node = new fgui.GTreeNode(isFolder, str);
                node.expanded = true;
                if (i == 0)
                    this._rootNode.addChild(node);
                else {
                    if (level > prevLevel)
                        lastNode.addChild(node);
                    else if (level < prevLevel) {
                        for (var j = level; j <= prevLevel; j++)
                            lastNode = lastNode.parent;
                        lastNode.addChild(node);
                    }
                    else
                        lastNode.parent.addChild(node);
                }
                lastNode = node;
                prevLevel = level;
                this.setupItem(buffer, node.cell);
                buffer.position = nextPos;
            }
        };
        return GTree;
    }(fgui.GList));
    fgui.GTree = GTree;
    var s_list = new Array();
})(fgui || (fgui = {}));

(function (fgui) {
    var GTreeNode = (function () {
        function GTreeNode(hasChild, resURL) {
            this._level = 0;
            this._resURL = resURL;
            if (hasChild)
                this._children = new Array();
        }
        Object.defineProperty(GTreeNode.prototype, "expanded", {
            get: function () {
                return this._expanded;
            },
            set: function (value) {
                if (!this._children)
                    return;
                if (this._expanded != value) {
                    this._expanded = value;
                    if (this._tree) {
                        if (this._expanded)
                            this._tree._afterExpanded(this);
                        else
                            this._tree._afterCollapsed(this);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "isFolder", {
            get: function () {
                return this._children != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "text", {
            get: function () {
                if (this._cell)
                    return this._cell.text;
                else
                    return null;
            },
            set: function (value) {
                if (this._cell)
                    this._cell.text = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "icon", {
            get: function () {
                if (this._cell)
                    return this._cell.icon;
                else
                    return null;
            },
            set: function (value) {
                if (this._cell)
                    this._cell.icon = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "cell", {
            get: function () {
                return this._cell;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTreeNode.prototype, "level", {
            get: function () {
                return this._level;
            },
            enumerable: true,
            configurable: true
        });
        GTreeNode.prototype._setLevel = function (value) {
            this._level = value;
        };
        GTreeNode.prototype.addChild = function (child) {
            this.addChildAt(child, this._children.length);
            return child;
        };
        GTreeNode.prototype.addChildAt = function (child, index) {
            if (!child)
                throw new Error("child is null");
            var numChildren = this._children.length;
            if (index >= 0 && index <= numChildren) {
                if (child._parent == this) {
                    this.setChildIndex(child, index);
                }
                else {
                    if (child._parent)
                        child._parent.removeChild(child);
                    var cnt = this._children.length;
                    if (index == cnt)
                        this._children.push(child);
                    else
                        this._children.splice(index, 0, child);
                    child._parent = this;
                    child._level = this._level + 1;
                    child._setTree(this._tree);
                    if (this._tree && this == this._tree.rootNode || this._cell && this._cell.parent && this._expanded)
                        this._tree._afterInserted(child);
                }
                return child;
            }
            else {
                throw new RangeError("Invalid child index");
            }
        };
        GTreeNode.prototype.removeChild = function (child) {
            var childIndex = this._children.indexOf(child);
            if (childIndex != -1) {
                this.removeChildAt(childIndex);
            }
            return child;
        };
        GTreeNode.prototype.removeChildAt = function (index) {
            if (index >= 0 && index < this.numChildren) {
                var child = this._children[index];
                this._children.splice(index, 1);
                child._parent = null;
                if (this._tree) {
                    child._setTree(null);
                    this._tree._afterRemoved(child);
                }
                return child;
            }
            else {
                throw "Invalid child index";
            }
        };
        GTreeNode.prototype.removeChildren = function (beginIndex, endIndex) {
            beginIndex = beginIndex || 0;
            if (endIndex == null)
                endIndex = -1;
            if (endIndex < 0 || endIndex >= this.numChildren)
                endIndex = this.numChildren - 1;
            for (var i = beginIndex; i <= endIndex; ++i)
                this.removeChildAt(beginIndex);
        };
        GTreeNode.prototype.getChildAt = function (index) {
            if (index >= 0 && index < this.numChildren)
                return this._children[index];
            else
                throw "Invalid child index";
        };
        GTreeNode.prototype.getChildIndex = function (child) {
            return this._children.indexOf(child);
        };
        GTreeNode.prototype.getPrevSibling = function () {
            if (this._parent == null)
                return null;
            var i = this._parent._children.indexOf(this);
            if (i <= 0)
                return null;
            return this._parent._children[i - 1];
        };
        GTreeNode.prototype.getNextSibling = function () {
            if (this._parent == null)
                return null;
            var i = this._parent._children.indexOf(this);
            if (i < 0 || i >= this._parent._children.length - 1)
                return null;
            return this._parent._children[i + 1];
        };
        GTreeNode.prototype.setChildIndex = function (child, index) {
            var oldIndex = this._children.indexOf(child);
            if (oldIndex == -1)
                throw "Not a child of this container";
            var cnt = this._children.length;
            if (index < 0)
                index = 0;
            else if (index > cnt)
                index = cnt;
            if (oldIndex == index)
                return;
            this._children.splice(oldIndex, 1);
            this._children.splice(index, 0, child);
            if (this._tree && this == this._tree.rootNode || this._cell && this._cell.parent && this._expanded)
                this._tree._afterMoved(child);
        };
        GTreeNode.prototype.swapChildren = function (child1, child2) {
            var index1 = this._children.indexOf(child1);
            var index2 = this._children.indexOf(child2);
            if (index1 == -1 || index2 == -1)
                throw "Not a child of this container";
            this.swapChildrenAt(index1, index2);
        };
        GTreeNode.prototype.swapChildrenAt = function (index1, index2) {
            var child1 = this._children[index1];
            var child2 = this._children[index2];
            this.setChildIndex(child1, index2);
            this.setChildIndex(child2, index1);
        };
        Object.defineProperty(GTreeNode.prototype, "numChildren", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        GTreeNode.prototype.expandToRoot = function () {
            var p = this;
            while (p) {
                p.expanded = true;
                p = p.parent;
            }
        };
        Object.defineProperty(GTreeNode.prototype, "tree", {
            get: function () {
                return this._tree;
            },
            enumerable: true,
            configurable: true
        });
        GTreeNode.prototype._setTree = function (value) {
            this._tree = value;
            if (this._tree && this._tree.treeNodeWillExpand && this._expanded)
                this._tree.treeNodeWillExpand(this, true);
            if (this._children) {
                var cnt = this._children.length;
                for (var i = 0; i < cnt; i++) {
                    var node = this._children[i];
                    node._level = this._level + 1;
                    node._setTree(value);
                }
            }
        };
        return GTreeNode;
    }());
    fgui.GTreeNode = GTreeNode;
})(fgui || (fgui = {}));

(function (fgui) {
    var Margin = (function () {
        function Margin() {
            this.left = 0;
            this.right = 0;
            this.top = 0;
            this.bottom = 0;
        }
        Margin.prototype.copy = function (source) {
            this.top = source.top;
            this.bottom = source.bottom;
            this.left = source.left;
            this.right = source.right;
        };
        return Margin;
    }());
    fgui.Margin = Margin;
})(fgui || (fgui = {}));

(function (fgui) {
    var PixelHitTest = (function () {
        function PixelHitTest(data, offsetX, offsetY) {
            this._data = data;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.scaleX = 1;
            this.scaleY = 1;
        }
        PixelHitTest.prototype.contains = function (x, y) {
            x = Math.floor((x / this.scaleX - this.offsetX) * this._data.scale);
            y = Math.floor((y / this.scaleY - this.offsetY) * this._data.scale);
            if (x < 0 || y < 0 || x >= this._data.pixelWidth)
                return false;
            var pos = y * this._data.pixelWidth + x;
            var pos2 = Math.floor(pos / 8);
            var pos3 = pos % 8;
            if (pos2 >= 0 && pos2 < this._data.pixels.length)
                return ((this._data.pixels[pos2] >> pos3) & 0x1) == 1;
            else
                return false;
        };
        return PixelHitTest;
    }());
    fgui.PixelHitTest = PixelHitTest;
    var PixelHitTestData = (function () {
        function PixelHitTestData() {
        }
        PixelHitTestData.prototype.load = function (ba) {
            ba.readInt();
            this.pixelWidth = ba.readInt();
            this.scale = 1 / ba.readByte();
            var len = ba.readInt();
            this.pixels = [];
            for (var i = 0; i < len; i++) {
                var j = ba.readByte();
                if (j < 0)
                    j += 256;
                this.pixels[i] = j;
            }
        };
        return PixelHitTestData;
    }());
    fgui.PixelHitTestData = PixelHitTestData;
})(fgui || (fgui = {}));

(function (fgui) {
    var PackageItem = (function () {
        function PackageItem() {
            this.width = 0;
            this.height = 0;
        }
        PackageItem.prototype.load = function () {
            return this.owner.getItemAsset(this);
        };
        PackageItem.prototype.getBranch = function () {
            if (this.branches && this.owner._branchIndex != -1) {
                var itemId = this.branches[this.owner._branchIndex];
                if (itemId)
                    return this.owner.getItemById(itemId);
            }
            return this;
        };
        PackageItem.prototype.getHighResolution = function () {
            if (this.highResolution && fgui.GRoot.contentScaleLevel > 0) {
                var itemId = this.highResolution[fgui.GRoot.contentScaleLevel - 1];
                if (itemId)
                    return this.owner.getItemById(itemId);
            }
            return this;
        };
        PackageItem.prototype.toString = function () {
            return this.name;
        };
        return PackageItem;
    }());
    fgui.PackageItem = PackageItem;
})(fgui || (fgui = {}));

(function (fgui) {
    var PopupMenu = (function () {
        function PopupMenu(resourceURL) {
            if (!resourceURL) {
                resourceURL = fgui.UIConfig.popupMenu;
                if (!resourceURL)
                    throw "UIConfig.popupMenu not defined";
            }
            this._contentPane = fgui.UIPackage.createObjectFromURL(resourceURL).asCom;
            this._contentPane.addEventListener(egret.Event.ADDED_TO_STAGE, this.__addedToStage, this);
            this._list = (this._contentPane.getChild("list"));
            this._list.removeChildrenToPool();
            this._list.addRelation(this._contentPane, fgui.RelationType.Width);
            this._list.removeRelation(this._contentPane, fgui.RelationType.Height);
            this._contentPane.addRelation(this._list, fgui.RelationType.Height);
            this._list.addEventListener(fgui.ItemEvent.CLICK, this.__clickItem, this);
        }
        PopupMenu.prototype.dispose = function () {
            this._contentPane.dispose();
        };
        PopupMenu.prototype.addItem = function (caption, callback) {
            var item = this._list.addItemFromPool().asButton;
            item.title = caption;
            item.data = callback;
            item.grayed = false;
            var c = item.getController("checked");
            if (c)
                c.selectedIndex = 0;
            return item;
        };
        PopupMenu.prototype.addItemAt = function (caption, index, callback) {
            var item = this._list.getFromPool().asButton;
            this._list.addChildAt(item, index);
            item.title = caption;
            item.data = callback;
            item.grayed = false;
            var c = item.getController("checked");
            if (c)
                c.selectedIndex = 0;
            return item;
        };
        PopupMenu.prototype.addSeperator = function () {
            if (fgui.UIConfig.popupMenu_seperator == null)
                throw "UIConfig.popupMenu_seperator not defined";
            this.list.addItemFromPool(fgui.UIConfig.popupMenu_seperator);
        };
        PopupMenu.prototype.getItemName = function (index) {
            var item = this._list.getChildAt(index);
            return item.name;
        };
        PopupMenu.prototype.setItemText = function (name, caption) {
            var item = this._list.getChild(name).asButton;
            item.title = caption;
        };
        PopupMenu.prototype.setItemVisible = function (name, visible) {
            var item = this._list.getChild(name).asButton;
            if (item.visible != visible) {
                item.visible = visible;
                this._list.setBoundsChangedFlag();
            }
        };
        PopupMenu.prototype.setItemGrayed = function (name, grayed) {
            var item = this._list.getChild(name).asButton;
            item.grayed = grayed;
        };
        PopupMenu.prototype.setItemCheckable = function (name, checkable) {
            var item = this._list.getChild(name).asButton;
            var c = item.getController("checked");
            if (c) {
                if (checkable) {
                    if (c.selectedIndex == 0)
                        c.selectedIndex = 1;
                }
                else
                    c.selectedIndex = 0;
            }
        };
        PopupMenu.prototype.setItemChecked = function (name, checked) {
            var item = this._list.getChild(name).asButton;
            var c = item.getController("checked");
            if (c)
                c.selectedIndex = checked ? 2 : 1;
        };
        PopupMenu.prototype.isItemChecked = function (name) {
            var item = this._list.getChild(name).asButton;
            var c = item.getController("checked");
            if (c)
                return c.selectedIndex == 2;
            else
                return false;
        };
        PopupMenu.prototype.removeItem = function (name) {
            var item = this._list.getChild(name);
            if (item) {
                var index = this._list.getChildIndex(item);
                this._list.removeChildToPoolAt(index);
                return true;
            }
            else
                return false;
        };
        PopupMenu.prototype.clearItems = function () {
            this._list.removeChildrenToPool();
        };
        Object.defineProperty(PopupMenu.prototype, "itemCount", {
            get: function () {
                return this._list.numChildren;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PopupMenu.prototype, "contentPane", {
            get: function () {
                return this._contentPane;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PopupMenu.prototype, "list", {
            get: function () {
                return this._list;
            },
            enumerable: true,
            configurable: true
        });
        PopupMenu.prototype.show = function (target, dir) {
            var r = target ? target.root : fgui.GRoot.inst;
            r.showPopup(this.contentPane, (target instanceof fgui.GRoot) ? null : target, dir);
        };
        PopupMenu.prototype.__clickItem = function (evt) {
            fgui.GTimers.inst.add(100, 1, this.__clickItem2, this, evt);
        };
        PopupMenu.prototype.__clickItem2 = function (evt) {
            var item = evt.itemObject.asButton;
            if (item == null)
                return;
            if (item.grayed) {
                this._list.selectedIndex = -1;
                return;
            }
            var c = item.getController("checked");
            if (c && c.selectedIndex != 0) {
                if (c.selectedIndex == 1)
                    c.selectedIndex = 2;
                else
                    c.selectedIndex = 1;
            }
            var r = (this._contentPane.parent);
            r.hidePopup(this.contentPane);
            if (item.data != null) {
                if (item.data.length == 1)
                    item.data(evt);
                else
                    item.data();
            }
        };
        PopupMenu.prototype.__addedToStage = function (evt) {
            this._list.selectedIndex = -1;
            this._list.resizeToFit(100000, 10);
        };
        return PopupMenu;
    }());
    fgui.PopupMenu = PopupMenu;
})(fgui || (fgui = {}));

(function (fgui) {
    var RelationItem = (function () {
        function RelationItem(owner) {
            this._owner = owner;
            this._defs = new Array();
        }
        Object.defineProperty(RelationItem.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RelationItem.prototype, "target", {
            get: function () {
                return this._target;
            },
            set: function (value) {
                if (this._target != value) {
                    if (this._target)
                        this.releaseRefTarget(this._target);
                    this._target = value;
                    if (this._target)
                        this.addRefTarget(this._target);
                }
            },
            enumerable: true,
            configurable: true
        });
        RelationItem.prototype.add = function (relationType, usePercent) {
            if (relationType == fgui.RelationType.Size) {
                this.add(fgui.RelationType.Width, usePercent);
                this.add(fgui.RelationType.Height, usePercent);
                return;
            }
            var length = this._defs.length;
            for (var i = 0; i < length; i++) {
                var def = this._defs[i];
                if (def.type == relationType)
                    return;
            }
            this.internalAdd(relationType, usePercent);
        };
        RelationItem.prototype.internalAdd = function (relationType, usePercent) {
            if (relationType == fgui.RelationType.Size) {
                this.internalAdd(fgui.RelationType.Width, usePercent);
                this.internalAdd(fgui.RelationType.Height, usePercent);
                return;
            }
            var info = new RelationDef();
            info.percent = usePercent;
            info.type = relationType;
            info.axis = (relationType <= fgui.RelationType.Right_Right || relationType == fgui.RelationType.Width || relationType >= fgui.RelationType.LeftExt_Left && relationType <= fgui.RelationType.RightExt_Right) ? 0 : 1;
            this._defs.push(info);
            if (usePercent || relationType == fgui.RelationType.Left_Center || relationType == fgui.RelationType.Center_Center || relationType == fgui.RelationType.Right_Center
                || relationType == fgui.RelationType.Top_Middle || relationType == fgui.RelationType.Middle_Middle || relationType == fgui.RelationType.Bottom_Middle)
                this._owner.pixelSnapping = true;
        };
        RelationItem.prototype.remove = function (relationType) {
            if (relationType === void 0) { relationType = 0; }
            if (relationType == fgui.RelationType.Size) {
                this.remove(fgui.RelationType.Width);
                this.remove(fgui.RelationType.Height);
                return;
            }
            var dc = this._defs.length;
            for (var k = 0; k < dc; k++) {
                if (this._defs[k].type == relationType) {
                    this._defs.splice(k, 1);
                    break;
                }
            }
        };
        RelationItem.prototype.copyFrom = function (source) {
            this.target = source.target;
            this._defs.length = 0;
            var length = source._defs.length;
            for (var i = 0; i < length; i++) {
                var info = source._defs[i];
                var info2 = new RelationDef();
                info2.copyFrom(info);
                this._defs.push(info2);
            }
        };
        RelationItem.prototype.dispose = function () {
            if (this._target) {
                this.releaseRefTarget(this._target);
                this._target = null;
            }
        };
        Object.defineProperty(RelationItem.prototype, "isEmpty", {
            get: function () {
                return this._defs.length == 0;
            },
            enumerable: true,
            configurable: true
        });
        RelationItem.prototype.applyOnSelfResized = function (dWidth, dHeight, applyPivot) {
            var ox = this._owner.x;
            var oy = this._owner.y;
            var length = this._defs.length;
            for (var i = 0; i < length; i++) {
                var info = this._defs[i];
                switch (info.type) {
                    case fgui.RelationType.Center_Center:
                        this._owner.x -= (0.5 - (applyPivot ? this._owner.pivotX : 0)) * dWidth;
                        break;
                    case fgui.RelationType.Right_Center:
                    case fgui.RelationType.Right_Left:
                    case fgui.RelationType.Right_Right:
                        this._owner.x -= (1 - (applyPivot ? this._owner.pivotX : 0)) * dWidth;
                        break;
                    case fgui.RelationType.Middle_Middle:
                        this._owner.y -= (0.5 - (applyPivot ? this._owner.pivotY : 0)) * dHeight;
                        break;
                    case fgui.RelationType.Bottom_Middle:
                    case fgui.RelationType.Bottom_Top:
                    case fgui.RelationType.Bottom_Bottom:
                        this._owner.y -= (1 - (applyPivot ? this._owner.pivotY : 0)) * dHeight;
                        break;
                }
            }
            if (ox != this._owner.x || oy != this._owner.y) {
                ox = this._owner.x - ox;
                oy = this._owner.y - oy;
                this._owner.updateGearFromRelations(1, ox, oy);
                if (this._owner.parent) {
                    var len = this._owner.parent._transitions.length;
                    if (len > 0) {
                        for (var i = 0; i < len; ++i) {
                            this._owner.parent._transitions[i].updateFromRelations(this._owner.id, ox, oy);
                        }
                    }
                }
            }
        };
        RelationItem.prototype.applyOnXYChanged = function (info, dx, dy) {
            var tmp;
            switch (info.type) {
                case fgui.RelationType.Left_Left:
                case fgui.RelationType.Left_Center:
                case fgui.RelationType.Left_Right:
                case fgui.RelationType.Center_Center:
                case fgui.RelationType.Right_Left:
                case fgui.RelationType.Right_Center:
                case fgui.RelationType.Right_Right:
                    this._owner.x += dx;
                    break;
                case fgui.RelationType.Top_Top:
                case fgui.RelationType.Top_Middle:
                case fgui.RelationType.Top_Bottom:
                case fgui.RelationType.Middle_Middle:
                case fgui.RelationType.Bottom_Top:
                case fgui.RelationType.Bottom_Middle:
                case fgui.RelationType.Bottom_Bottom:
                    this._owner.y += dy;
                    break;
                case fgui.RelationType.Width:
                case fgui.RelationType.Height:
                    break;
                case fgui.RelationType.LeftExt_Left:
                case fgui.RelationType.LeftExt_Right:
                    if (this._owner != this._target.parent) {
                        tmp = this._owner.xMin;
                        this._owner.width = this._owner._rawWidth - dx;
                        this._owner.xMin = tmp + dx;
                    }
                    else
                        this._owner.width = this._owner._rawWidth - dx;
                    break;
                case fgui.RelationType.RightExt_Left:
                case fgui.RelationType.RightExt_Right:
                    if (this._owner != this._target.parent) {
                        tmp = this._owner.xMin;
                        this._owner.width = this._owner._rawWidth + dx;
                        this._owner.xMin = tmp;
                    }
                    else
                        this._owner.width = this._owner._rawWidth + dx;
                    break;
                case fgui.RelationType.TopExt_Top:
                case fgui.RelationType.TopExt_Bottom:
                    if (this._owner != this._target.parent) {
                        tmp = this._owner.yMin;
                        this._owner.height = this._owner._rawHeight - dy;
                        this._owner.yMin = tmp + dy;
                    }
                    else
                        this._owner.height = this._owner._rawHeight - dy;
                    break;
                case fgui.RelationType.BottomExt_Top:
                case fgui.RelationType.BottomExt_Bottom:
                    if (this._owner != this._target.parent) {
                        tmp = this._owner.yMin;
                        this._owner.height = this._owner._rawHeight + dy;
                        this._owner.yMin = tmp;
                    }
                    else
                        this._owner.height = this._owner._rawHeight + dy;
                    break;
            }
        };
        RelationItem.prototype.applyOnSizeChanged = function (info) {
            var pos = 0, pivot = 0, delta = 0;
            var v, tmp;
            if (info.axis == 0) {
                if (this._target != this._owner.parent) {
                    pos = this._target.x;
                    if (this._target.pivotAsAnchor)
                        pivot = this._target.pivotX;
                }
                if (info.percent) {
                    if (this._targetWidth != 0)
                        delta = this._target._width / this._targetWidth;
                }
                else
                    delta = this._target._width - this._targetWidth;
            }
            else {
                if (this._target != this._owner.parent) {
                    pos = this._target.y;
                    if (this._target.pivotAsAnchor)
                        pivot = this._target.pivotY;
                }
                if (info.percent) {
                    if (this._targetHeight != 0)
                        delta = this._target._height / this._targetHeight;
                }
                else
                    delta = this._target._height - this._targetHeight;
            }
            switch (info.type) {
                case fgui.RelationType.Left_Left:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin - pos) * delta;
                    else if (pivot != 0)
                        this._owner.x += delta * (-pivot);
                    break;
                case fgui.RelationType.Left_Center:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin - pos) * delta;
                    else
                        this._owner.x += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Left_Right:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin - pos) * delta;
                    else
                        this._owner.x += delta * (1 - pivot);
                    break;
                case fgui.RelationType.Center_Center:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin + this._owner._rawWidth * 0.5 - pos) * delta - this._owner._rawWidth * 0.5;
                    else
                        this._owner.x += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Right_Left:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin + this._owner._rawWidth - pos) * delta - this._owner._rawWidth;
                    else if (pivot != 0)
                        this._owner.x += delta * (-pivot);
                    break;
                case fgui.RelationType.Right_Center:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin + this._owner._rawWidth - pos) * delta - this._owner._rawWidth;
                    else
                        this._owner.x += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Right_Right:
                    if (info.percent)
                        this._owner.xMin = pos + (this._owner.xMin + this._owner._rawWidth - pos) * delta - this._owner._rawWidth;
                    else
                        this._owner.x += delta * (1 - pivot);
                    break;
                case fgui.RelationType.Top_Top:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin - pos) * delta;
                    else if (pivot != 0)
                        this._owner.y += delta * (-pivot);
                    break;
                case fgui.RelationType.Top_Middle:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin - pos) * delta;
                    else
                        this._owner.y += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Top_Bottom:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin - pos) * delta;
                    else
                        this._owner.y += delta * (1 - pivot);
                    break;
                case fgui.RelationType.Middle_Middle:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin + this._owner._rawHeight * 0.5 - pos) * delta - this._owner._rawHeight * 0.5;
                    else
                        this._owner.y += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Bottom_Top:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin + this._owner._rawHeight - pos) * delta - this._owner._rawHeight;
                    else if (pivot != 0)
                        this._owner.y += delta * (-pivot);
                    break;
                case fgui.RelationType.Bottom_Middle:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin + this._owner._rawHeight - pos) * delta - this._owner._rawHeight;
                    else
                        this._owner.y += delta * (0.5 - pivot);
                    break;
                case fgui.RelationType.Bottom_Bottom:
                    if (info.percent)
                        this._owner.yMin = pos + (this._owner.yMin + this._owner._rawHeight - pos) * delta - this._owner._rawHeight;
                    else
                        this._owner.y += delta * (1 - pivot);
                    break;
                case fgui.RelationType.Width:
                    if (this._owner._underConstruct && this._owner == this._target.parent)
                        v = this._owner.sourceWidth - this._target.initWidth;
                    else
                        v = this._owner._rawWidth - this._targetWidth;
                    if (info.percent)
                        v = v * delta;
                    if (this._target == this._owner.parent) {
                        if (this._owner.pivotAsAnchor) {
                            tmp = this._owner.xMin;
                            this._owner.setSize(this._target._width + v, this._owner._rawHeight, true);
                            this._owner.xMin = tmp;
                        }
                        else
                            this._owner.setSize(this._target._width + v, this._owner._rawHeight, true);
                    }
                    else
                        this._owner.width = this._target._width + v;
                    break;
                case fgui.RelationType.Height:
                    if (this._owner._underConstruct && this._owner == this._target.parent)
                        v = this._owner.sourceHeight - this._target.initHeight;
                    else
                        v = this._owner._rawHeight - this._targetHeight;
                    if (info.percent)
                        v = v * delta;
                    if (this._target == this._owner.parent) {
                        if (this._owner.pivotAsAnchor) {
                            tmp = this._owner.yMin;
                            this._owner.setSize(this._owner._rawWidth, this._target._height + v, true);
                            this._owner.yMin = tmp;
                        }
                        else
                            this._owner.setSize(this._owner._rawWidth, this._target._height + v, true);
                    }
                    else
                        this._owner.height = this._target._height + v;
                    break;
                case fgui.RelationType.LeftExt_Left:
                    tmp = this._owner.xMin;
                    if (info.percent)
                        v = pos + (tmp - pos) * delta - tmp;
                    else
                        v = delta * (-pivot);
                    this._owner.width = this._owner._rawWidth - v;
                    this._owner.xMin = tmp + v;
                    break;
                case fgui.RelationType.LeftExt_Right:
                    tmp = this._owner.xMin;
                    if (info.percent)
                        v = pos + (tmp - pos) * delta - tmp;
                    else
                        v = delta * (1 - pivot);
                    this._owner.width = this._owner._rawWidth - v;
                    this._owner.xMin = tmp + v;
                    break;
                case fgui.RelationType.RightExt_Left:
                    tmp = this._owner.xMin;
                    if (info.percent)
                        v = pos + (tmp + this._owner._rawWidth - pos) * delta - (tmp + this._owner._rawWidth);
                    else
                        v = delta * (-pivot);
                    this._owner.width = this._owner._rawWidth + v;
                    this._owner.xMin = tmp;
                    break;
                case fgui.RelationType.RightExt_Right:
                    tmp = this._owner.xMin;
                    if (info.percent) {
                        if (this._owner == this._target.parent) {
                            if (this._owner._underConstruct)
                                this._owner.width = pos + this._target._width - this._target._width * pivot +
                                    (this._owner.sourceWidth - pos - this._target.initWidth + this._target.initWidth * pivot) * delta;
                            else
                                this._owner.width = pos + (this._owner._rawWidth - pos) * delta;
                        }
                        else {
                            v = pos + (tmp + this._owner._rawWidth - pos) * delta - (tmp + this._owner._rawWidth);
                            this._owner.width = this._owner._rawWidth + v;
                            this._owner.xMin = tmp;
                        }
                    }
                    else {
                        if (this._owner == this._target.parent) {
                            if (this._owner._underConstruct)
                                this._owner.width = this._owner.sourceWidth + (this._target._width - this._target.initWidth) * (1 - pivot);
                            else
                                this._owner.width = this._owner._rawWidth + delta * (1 - pivot);
                        }
                        else {
                            v = delta * (1 - pivot);
                            this._owner.width = this._owner._rawWidth + v;
                            this._owner.xMin = tmp;
                        }
                    }
                    break;
                case fgui.RelationType.TopExt_Top:
                    tmp = this._owner.yMin;
                    if (info.percent)
                        v = pos + (tmp - pos) * delta - tmp;
                    else
                        v = delta * (-pivot);
                    this._owner.height = this._owner._rawHeight - v;
                    this._owner.yMin = tmp + v;
                    break;
                case fgui.RelationType.TopExt_Bottom:
                    tmp = this._owner.yMin;
                    if (info.percent)
                        v = pos + (tmp - pos) * delta - tmp;
                    else
                        v = delta * (1 - pivot);
                    this._owner.height = this._owner._rawHeight - v;
                    this._owner.yMin = tmp + v;
                    break;
                case fgui.RelationType.BottomExt_Top:
                    tmp = this._owner.yMin;
                    if (info.percent)
                        v = pos + (tmp + this._owner._rawHeight - pos) * delta - (tmp + this._owner._rawHeight);
                    else
                        v = delta * (-pivot);
                    this._owner.height = this._owner._rawHeight + v;
                    this._owner.yMin = tmp;
                    break;
                case fgui.RelationType.BottomExt_Bottom:
                    tmp = this._owner.yMin;
                    if (info.percent) {
                        if (this._owner == this._target.parent) {
                            if (this._owner._underConstruct)
                                this._owner.height = pos + this._target._height - this._target._height * pivot +
                                    (this._owner.sourceHeight - pos - this._target.initHeight + this._target.initHeight * pivot) * delta;
                            else
                                this._owner.height = pos + (this._owner._rawHeight - pos) * delta;
                        }
                        else {
                            v = pos + (tmp + this._owner._rawHeight - pos) * delta - (tmp + this._owner._rawHeight);
                            this._owner.height = this._owner._rawHeight + v;
                            this._owner.yMin = tmp;
                        }
                    }
                    else {
                        if (this._owner == this._target.parent) {
                            if (this._owner._underConstruct)
                                this._owner.height = this._owner.sourceHeight + (this._target._height - this._target.initHeight) * (1 - pivot);
                            else
                                this._owner.height = this._owner._rawHeight + delta * (1 - pivot);
                        }
                        else {
                            v = delta * (1 - pivot);
                            this._owner.height = this._owner._rawHeight + v;
                            this._owner.yMin = tmp;
                        }
                    }
                    break;
            }
        };
        RelationItem.prototype.addRefTarget = function (target) {
            if (target != this._owner.parent)
                target.addEventListener(fgui.GObject.XY_CHANGED, this.__targetXYChanged, this);
            target.addEventListener(fgui.GObject.SIZE_CHANGED, this.__targetSizeChanged, this);
            target.addEventListener(fgui.GObject.SIZE_DELAY_CHANGE, this.__targetSizeWillChange, this);
            this._targetX = this._target.x;
            this._targetY = this._target.y;
            this._targetWidth = this._target._width;
            this._targetHeight = this._target._height;
        };
        RelationItem.prototype.releaseRefTarget = function (target) {
            target.removeEventListener(fgui.GObject.XY_CHANGED, this.__targetXYChanged, this);
            target.removeEventListener(fgui.GObject.SIZE_CHANGED, this.__targetSizeChanged, this);
            target.removeEventListener(fgui.GObject.SIZE_DELAY_CHANGE, this.__targetSizeWillChange, this);
        };
        RelationItem.prototype.__targetXYChanged = function (evt) {
            if (this._owner.relations.handling != null || this._owner.group != null && this._owner.group._updating) {
                this._targetX = this._target.x;
                this._targetY = this._target.y;
                return;
            }
            this._owner.relations.handling = this._target;
            var ox = this._owner.x;
            var oy = this._owner.y;
            var dx = this._target.x - this._targetX;
            var dy = this._target.y - this._targetY;
            var length = this._defs.length;
            for (var i = 0; i < length; i++) {
                var info = this._defs[i];
                this.applyOnXYChanged(info, dx, dy);
            }
            this._targetX = this._target.x;
            this._targetY = this._target.y;
            if (ox != this._owner.x || oy != this._owner.y) {
                ox = this._owner.x - ox;
                oy = this._owner.y - oy;
                this._owner.updateGearFromRelations(1, ox, oy);
                if (this._owner.parent) {
                    var len = this._owner.parent._transitions.length;
                    if (len > 0) {
                        for (var i = 0; i < len; ++i) {
                            this._owner.parent._transitions[i].updateFromRelations(this._owner.id, ox, oy);
                        }
                    }
                }
            }
            this._owner.relations.handling = null;
        };
        RelationItem.prototype.__targetSizeChanged = function (evt) {
            if (this._owner.relations.handling != null)
                return;
            this._owner.relations.handling = this._target;
            var ox = this._owner.x;
            var oy = this._owner.y;
            var ow = this._owner._rawWidth;
            var oh = this._owner._rawHeight;
            var length = this._defs.length;
            for (var i = 0; i < length; i++) {
                var info = this._defs[i];
                this.applyOnSizeChanged(info);
            }
            this._targetWidth = this._target._width;
            this._targetHeight = this._target._height;
            if (ox != this._owner.x || oy != this._owner.y) {
                ox = this._owner.x - ox;
                oy = this._owner.y - oy;
                this._owner.updateGearFromRelations(1, ox, oy);
                if (this._owner.parent) {
                    var len = this._owner.parent._transitions.length;
                    if (len > 0) {
                        for (var i = 0; i < len; ++i) {
                            this._owner.parent._transitions[i].updateFromRelations(this._owner.id, ox, oy);
                        }
                    }
                }
            }
            if (ow != this._owner._rawWidth || oh != this._owner._rawHeight) {
                ow = this._owner._rawWidth - ow;
                oh = this._owner._rawHeight - oh;
                this._owner.updateGearFromRelations(2, ow, oh);
            }
            this._owner.relations.handling = null;
        };
        RelationItem.prototype.__targetSizeWillChange = function (evt) {
            this._owner.relations.sizeDirty = true;
        };
        return RelationItem;
    }());
    fgui.RelationItem = RelationItem;
    var RelationDef = (function () {
        function RelationDef() {
        }
        RelationDef.prototype.copyFrom = function (source) {
            this.percent = source.percent;
            this.type = source.type;
            this.axis = source.axis;
        };
        return RelationDef;
    }());
    fgui.RelationDef = RelationDef;
})(fgui || (fgui = {}));

(function (fgui) {
    var Relations = (function () {
        function Relations(owner) {
            this._owner = owner;
            this._items = new Array();
        }
        Relations.prototype.add = function (target, relationType, usePercent) {
            var length = this._items.length;
            for (var i = 0; i < length; i++) {
                var item = this._items[i];
                if (item.target == target) {
                    item.add(relationType, usePercent);
                    return;
                }
            }
            var newItem = new fgui.RelationItem(this._owner);
            newItem.target = target;
            newItem.add(relationType, usePercent);
            this._items.push(newItem);
        };
        Relations.prototype.remove = function (target, relationType) {
            relationType = relationType || 0;
            var cnt = this._items.length;
            var i = 0;
            while (i < cnt) {
                var item = this._items[i];
                if (item.target == target) {
                    item.remove(relationType);
                    if (item.isEmpty) {
                        item.dispose();
                        this._items.splice(i, 1);
                        cnt--;
                    }
                    else
                        i++;
                }
                else
                    i++;
            }
        };
        Relations.prototype.contains = function (target) {
            var length = this._items.length;
            for (var i = 0; i < length; i++) {
                var item = this._items[i];
                if (item.target == target)
                    return true;
            }
            return false;
        };
        Relations.prototype.clearFor = function (target) {
            var cnt = this._items.length;
            var i = 0;
            while (i < cnt) {
                var item = this._items[i];
                if (item.target == target) {
                    item.dispose();
                    this._items.splice(i, 1);
                    cnt--;
                }
                else
                    i++;
            }
        };
        Relations.prototype.clearAll = function () {
            var length = this._items.length;
            for (var i = 0; i < length; i++) {
                var item = this._items[i];
                item.dispose();
            }
            this._items.length = 0;
        };
        Relations.prototype.copyFrom = function (source) {
            this.clearAll();
            var arr = source._items;
            var length = arr.length;
            for (var i = 0; i < length; i++) {
                var ri = arr[i];
                var item = new fgui.RelationItem(this._owner);
                item.copyFrom(ri);
                this._items.push(item);
            }
        };
        Relations.prototype.dispose = function () {
            this.clearAll();
        };
        Relations.prototype.onOwnerSizeChanged = function (dWidth, dHeight, applyPivot) {
            if (this._items.length == 0)
                return;
            var length = this._items.length;
            for (var i = 0; i < length; i++) {
                var item = this._items[i];
                item.applyOnSelfResized(dWidth, dHeight, applyPivot);
            }
        };
        Relations.prototype.ensureRelationsSizeCorrect = function () {
            if (this._items.length == 0)
                return;
            this.sizeDirty = false;
            var length = this._items.length;
            for (var i = 0; i < length; i++) {
                var item = this._items[i];
                item.target.ensureSizeCorrect();
            }
        };
        Object.defineProperty(Relations.prototype, "empty", {
            get: function () {
                return this._items.length == 0;
            },
            enumerable: true,
            configurable: true
        });
        Relations.prototype.setup = function (buffer, parentToChild) {
            var cnt = buffer.readByte();
            var target;
            for (var i = 0; i < cnt; i++) {
                var targetIndex = buffer.readShort();
                if (targetIndex == -1)
                    target = this._owner.parent;
                else if (parentToChild)
                    target = this._owner.getChildAt(targetIndex);
                else
                    target = this._owner.parent.getChildAt(targetIndex);
                var newItem = new fgui.RelationItem(this._owner);
                newItem.target = target;
                this._items.push(newItem);
                var cnt2 = buffer.readByte();
                for (var j = 0; j < cnt2; j++) {
                    var rt = buffer.readByte();
                    var usePercent = buffer.readBool();
                    newItem.internalAdd(rt, usePercent);
                }
            }
        };
        return Relations;
    }());
    fgui.Relations = Relations;
})(fgui || (fgui = {}));

(function (fgui) {
    var ScrollPane = (function (_super_1) {
        __extends(ScrollPane, _super_1);
        function ScrollPane(owner) {
            var _this = _super_1.call(this) || this;
            _this._owner = owner;
            _this._maskContainer = new egret.DisplayObjectContainer();
            _this._owner._rootContainer.addChild(_this._maskContainer);
            _this._container = _this._owner._container;
            _this._container.x = 0;
            _this._container.y = 0;
            _this._maskContainer.addChild(_this._container);
            _this._scrollBarMargin = new fgui.Margin();
            _this._xPos = 0;
            _this._yPos = 0;
            _this._aniFlag = 0;
            _this._tweening = 0;
            _this._footerLockedSize = 0;
            _this._headerLockedSize = 0;
            _this._viewSize = new egret.Point();
            _this._contentSize = new egret.Point();
            _this._pageSize = new egret.Point(1, 1);
            _this._overlapSize = new egret.Point();
            _this._tweenTime = new egret.Point();
            _this._tweenStart = new egret.Point();
            _this._tweenDuration = new egret.Point();
            _this._tweenChange = new egret.Point();
            _this._velocity = new egret.Point();
            _this._containerPos = new egret.Point();
            _this._beginTouchPos = new egret.Point();
            _this._lastTouchPos = new egret.Point();
            _this._lastTouchGlobalPos = new egret.Point();
            _this._scrollStep = fgui.UIConfig.defaultScrollStep;
            _this._decelerationRate = fgui.UIConfig.defaultScrollDecelerationRate;
            _this._owner.addEventListener(egret.TouchEvent.TOUCH_BEGIN, _this.__touchBegin, _this);
            return _this;
        }
        ScrollPane.prototype.setup = function (buffer) {
            this._scrollType = buffer.readByte();
            var scrollBarDisplay = buffer.readByte();
            var flags = buffer.readInt();
            if (buffer.readBool()) {
                this._scrollBarMargin.top = buffer.readInt();
                this._scrollBarMargin.bottom = buffer.readInt();
                this._scrollBarMargin.left = buffer.readInt();
                this._scrollBarMargin.right = buffer.readInt();
            }
            var vtScrollBarRes = buffer.readS();
            var hzScrollBarRes = buffer.readS();
            var headerRes = buffer.readS();
            var footerRes = buffer.readS();
            if ((flags & 1) != 0)
                this._displayOnLeft = true;
            if ((flags & 2) != 0)
                this._snapToItem = true;
            if ((flags & 4) != 0)
                this._displayInDemand = true;
            if ((flags & 8) != 0)
                this._pageMode = true;
            if (flags & 16)
                this._touchEffect = true;
            else if (flags & 32)
                this._touchEffect = false;
            else
                this._touchEffect = fgui.UIConfig.defaultScrollTouchEffect;
            if (flags & 64)
                this._bouncebackEffect = true;
            else if (flags & 128)
                this._bouncebackEffect = false;
            else
                this._bouncebackEffect = fgui.UIConfig.defaultScrollBounceEffect;
            if ((flags & 256) != 0)
                this._inertiaDisabled = true;
            if ((flags & 512) == 0)
                this._maskContainer.scrollRect = new egret.Rectangle();
            if ((flags & 1024) != 0)
                this._floating = true;
            if ((flags & 2048) != 0)
                this._dontClipMargin = true;
            if (scrollBarDisplay == fgui.ScrollBarDisplayType.Default)
                scrollBarDisplay = fgui.UIConfig.defaultScrollBarDisplay;
            if (scrollBarDisplay != fgui.ScrollBarDisplayType.Hidden) {
                if (this._scrollType == fgui.ScrollType.Both || this._scrollType == fgui.ScrollType.Vertical) {
                    var res = vtScrollBarRes ? vtScrollBarRes : fgui.UIConfig.verticalScrollBar;
                    if (res) {
                        this._vtScrollBar = fgui.UIPackage.createObjectFromURL(res);
                        if (!this._vtScrollBar)
                            throw "cannot create scrollbar from " + res;
                        this._vtScrollBar.setScrollPane(this, true);
                        this._owner._rootContainer.addChild(this._vtScrollBar.displayObject);
                    }
                }
                if (this._scrollType == fgui.ScrollType.Both || this._scrollType == fgui.ScrollType.Horizontal) {
                    var res = hzScrollBarRes ? hzScrollBarRes : fgui.UIConfig.horizontalScrollBar;
                    if (res) {
                        this._hzScrollBar = fgui.UIPackage.createObjectFromURL(res);
                        if (!this._hzScrollBar)
                            throw "cannot create scrollbar from " + res;
                        this._hzScrollBar.setScrollPane(this, false);
                        this._owner._rootContainer.addChild(this._hzScrollBar.displayObject);
                    }
                }
                if (scrollBarDisplay == fgui.ScrollBarDisplayType.Auto)
                    this._scrollBarDisplayAuto = true;
                if (this._scrollBarDisplayAuto) {
                    if (this._vtScrollBar)
                        this._vtScrollBar.displayObject.visible = false;
                    if (this._hzScrollBar)
                        this._hzScrollBar.displayObject.visible = false;
                }
            }
            if (headerRes) {
                this._header = fgui.UIPackage.createObjectFromURL(headerRes);
                if (!this._header)
                    throw "cannot create scrollPane header from " + headerRes;
            }
            if (footerRes) {
                this._footer = fgui.UIPackage.createObjectFromURL(footerRes);
                if (!this._footer)
                    throw "cannot create scrollPane footer from " + footerRes;
            }
            if (this._header || this._footer)
                this._refreshBarAxis = (this._scrollType == fgui.ScrollType.Both || this._scrollType == fgui.ScrollType.Vertical) ? "y" : "x";
            this.setSize(this._owner.width, this._owner.height);
        };
        ScrollPane.prototype.dispose = function () {
            if (this._tweening != 0)
                fgui.GTimers.inst.remove(this.tweenUpdate, this);
            delete this._pageController;
            if (this._hzScrollBar)
                this._hzScrollBar.dispose();
            if (this._vtScrollBar)
                this._vtScrollBar.dispose();
            if (this._header)
                this._header.dispose();
            if (this._footer)
                this._footer.dispose();
        };
        Object.defineProperty(ScrollPane.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "hzScrollBar", {
            get: function () {
                return this._hzScrollBar;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "vtScrollBar", {
            get: function () {
                return this._vtScrollBar;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "header", {
            get: function () {
                return this._header;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "footer", {
            get: function () {
                return this._footer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "bouncebackEffect", {
            get: function () {
                return this._bouncebackEffect;
            },
            set: function (sc) {
                this._bouncebackEffect = sc;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "touchEffect", {
            get: function () {
                return this._touchEffect;
            },
            set: function (sc) {
                this._touchEffect = sc;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "scrollStep", {
            get: function () {
                return this._scrollStep;
            },
            set: function (val) {
                this._scrollStep = val;
                if (this._scrollStep == 0)
                    this._scrollStep = fgui.UIConfig.defaultScrollStep;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "decelerationRate", {
            get: function () {
                return this._decelerationRate;
            },
            set: function (val) {
                this._decelerationRate = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "snapToItem", {
            get: function () {
                return this._snapToItem;
            },
            set: function (value) {
                this._snapToItem = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "isDragged", {
            get: function () {
                return this._dragged;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "percX", {
            get: function () {
                return this._overlapSize.x == 0 ? 0 : this._xPos / this._overlapSize.x;
            },
            set: function (value) {
                this.setPercX(value, false);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.setPercX = function (value, ani) {
            if (ani === void 0) { ani = false; }
            this._owner.ensureBoundsCorrect();
            this.setPosX(this._overlapSize.x * fgui.ToolSet.clamp01(value), ani);
        };
        Object.defineProperty(ScrollPane.prototype, "percY", {
            get: function () {
                return this._overlapSize.y == 0 ? 0 : this._yPos / this._overlapSize.y;
            },
            set: function (value) {
                this.setPercY(value, false);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.setPercY = function (value, ani) {
            if (ani === void 0) { ani = false; }
            this._owner.ensureBoundsCorrect();
            this.setPosY(this._overlapSize.y * fgui.ToolSet.clamp01(value), ani);
        };
        Object.defineProperty(ScrollPane.prototype, "posX", {
            get: function () {
                return this._xPos;
            },
            set: function (value) {
                this.setPosX(value, false);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.setPosX = function (value, ani) {
            this._owner.ensureBoundsCorrect();
            if (this._loop == 1)
                value = this.loopCheckingNewPos(value, "x");
            value = fgui.ToolSet.clamp(value, 0, this._overlapSize.x);
            if (value != this._xPos) {
                this._xPos = value;
                this.posChanged(ani);
            }
        };
        Object.defineProperty(ScrollPane.prototype, "posY", {
            get: function () {
                return this._yPos;
            },
            set: function (value) {
                this.setPosY(value, false);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.setPosY = function (value, ani) {
            this._owner.ensureBoundsCorrect();
            if (this._loop == 1)
                value = this.loopCheckingNewPos(value, "y");
            value = fgui.ToolSet.clamp(value, 0, this._overlapSize.y);
            if (value != this._yPos) {
                this._yPos = value;
                this.posChanged(ani);
            }
        };
        Object.defineProperty(ScrollPane.prototype, "contentWidth", {
            get: function () {
                return this._contentSize.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "contentHeight", {
            get: function () {
                return this._contentSize.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "viewWidth", {
            get: function () {
                return this._viewSize.x;
            },
            set: function (value) {
                value = value + this._owner.margin.left + this._owner.margin.right;
                if (this._vtScrollBar && !this._floating)
                    value += this._vtScrollBar.width;
                this._owner.width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "viewHeight", {
            get: function () {
                return this._viewSize.y;
            },
            set: function (value) {
                value = value + this._owner.margin.top + this._owner.margin.bottom;
                if (this._hzScrollBar && !this._floating)
                    value += this._hzScrollBar.height;
                this._owner.height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "currentPageX", {
            get: function () {
                if (!this._pageMode)
                    return 0;
                var page = Math.floor(this._xPos / this._pageSize.x);
                if (this._xPos - page * this._pageSize.x > this._pageSize.x * 0.5)
                    page++;
                return page;
            },
            set: function (value) {
                this.setCurrentPageX(value, false);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "currentPageY", {
            get: function () {
                if (!this._pageMode)
                    return 0;
                var page = Math.floor(this._yPos / this._pageSize.y);
                if (this._yPos - page * this._pageSize.y > this._pageSize.y * 0.5)
                    page++;
                return page;
            },
            set: function (value) {
                this.setCurrentPageY(value, false);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.setCurrentPageX = function (value, ani) {
            if (!this._pageMode)
                return;
            this._owner.ensureBoundsCorrect();
            if (this._overlapSize.x > 0)
                this.setPosX(value * this._pageSize.x, ani);
        };
        ScrollPane.prototype.setCurrentPageY = function (value, ani) {
            if (!this._pageMode)
                return;
            this._owner.ensureBoundsCorrect();
            if (this._overlapSize.y > 0)
                this.setPosY(value * this._pageSize.y, ani);
        };
        Object.defineProperty(ScrollPane.prototype, "isBottomMost", {
            get: function () {
                return this._yPos == this._overlapSize.y || this._overlapSize.y == 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "isRightMost", {
            get: function () {
                return this._xPos == this._overlapSize.x || this._overlapSize.x == 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "pageController", {
            get: function () {
                return this._pageController;
            },
            set: function (value) {
                this._pageController = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "scrollingPosX", {
            get: function () {
                return fgui.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ScrollPane.prototype, "scrollingPosY", {
            get: function () {
                return fgui.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y);
            },
            enumerable: true,
            configurable: true
        });
        ScrollPane.prototype.scrollTop = function (ani) {
            this.setPercY(0, ani);
        };
        ScrollPane.prototype.scrollBottom = function (ani) {
            this.setPercY(1, ani);
        };
        ScrollPane.prototype.scrollUp = function (ratio, ani) {
            ratio = ratio || 1;
            if (this._pageMode)
                this.setPosY(this._yPos - this._pageSize.y * ratio, ani);
            else
                this.setPosY(this._yPos - this._scrollStep * ratio, ani);
        };
        ScrollPane.prototype.scrollDown = function (ratio, ani) {
            ratio = ratio || 1;
            if (this._pageMode)
                this.setPosY(this._yPos + this._pageSize.y * ratio, ani);
            else
                this.setPosY(this._yPos + this._scrollStep * ratio, ani);
        };
        ScrollPane.prototype.scrollLeft = function (ratio, ani) {
            ratio = ratio || 1;
            if (this._pageMode)
                this.setPosX(this._xPos - this._pageSize.x * ratio, ani);
            else
                this.setPosX(this._xPos - this._scrollStep * ratio, ani);
        };
        ScrollPane.prototype.scrollRight = function (ratio, ani) {
            ratio = ratio || 1;
            if (this._pageMode)
                this.setPosX(this._xPos + this._pageSize.x * ratio, ani);
            else
                this.setPosX(this._xPos + this._scrollStep * ratio, ani);
        };
        ScrollPane.prototype.scrollToView = function (target, ani, setFirst) {
            this._owner.ensureBoundsCorrect();
            if (this._needRefresh)
                this.refresh();
            var rect;
            if (target instanceof fgui.GObject) {
                if (target.parent != this._owner) {
                    target.parent.localToGlobalRect(target.x, target.y, target.width, target.height, s_rect);
                    rect = this._owner.globalToLocalRect(s_rect.x, s_rect.y, s_rect.width, s_rect.height, s_rect);
                }
                else {
                    rect = s_rect;
                    rect.setTo(target.x, target.y, target.width, target.height);
                }
            }
            else
                rect = target;
            if (this._overlapSize.y > 0) {
                var bottom = this._yPos + this._viewSize.y;
                if (setFirst || rect.y <= this._yPos || rect.height >= this._viewSize.y) {
                    if (this._pageMode)
                        this.setPosY(Math.floor(rect.y / this._pageSize.y) * this._pageSize.y, ani);
                    else
                        this.setPosY(rect.y, ani);
                }
                else if (rect.y + rect.height > bottom) {
                    if (this._pageMode)
                        this.setPosY(Math.floor(rect.y / this._pageSize.y) * this._pageSize.y, ani);
                    else if (rect.height <= this._viewSize.y / 2)
                        this.setPosY(rect.y + rect.height * 2 - this._viewSize.y, ani);
                    else
                        this.setPosY(rect.y + rect.height - this._viewSize.y, ani);
                }
            }
            if (this._overlapSize.x > 0) {
                var right = this._xPos + this._viewSize.x;
                if (setFirst || rect.x <= this._xPos || rect.width >= this._viewSize.x) {
                    if (this._pageMode)
                        this.setPosX(Math.floor(rect.x / this._pageSize.x) * this._pageSize.x, ani);
                    else
                        this.setPosX(rect.x, ani);
                }
                else if (rect.x + rect.width > right) {
                    if (this._pageMode)
                        this.setPosX(Math.floor(rect.x / this._pageSize.x) * this._pageSize.x, ani);
                    else if (rect.width <= this._viewSize.x / 2)
                        this.setPosX(rect.x + rect.width * 2 - this._viewSize.x, ani);
                    else
                        this.setPosX(rect.x + rect.width - this._viewSize.x, ani);
                }
            }
            if (!ani && this._needRefresh)
                this.refresh();
        };
        ScrollPane.prototype.isChildInView = function (obj) {
            if (this._overlapSize.y > 0) {
                var dist = obj.y + this._container.y;
                if (dist < -obj.height || dist > this._viewSize.y)
                    return false;
            }
            if (this._overlapSize.x > 0) {
                dist = obj.x + this._container.x;
                if (dist < -obj.width || dist > this._viewSize.x)
                    return false;
            }
            return true;
        };
        ScrollPane.prototype.cancelDragging = function () {
            this._owner.displayObject.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.__touchMove, this);
            this._owner.displayObject.removeEventListener(egret.TouchEvent.TOUCH_END, this.__touchEnd, this);
            this._owner.displayObject.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.__touchTap, this);
            if (ScrollPane.draggingPane == this)
                ScrollPane.draggingPane = null;
            _gestureFlag = 0;
            this._dragged = false;
            this._maskContainer.touchChildren = true;
        };
        ScrollPane.prototype.lockHeader = function (size) {
            if (this._headerLockedSize == size)
                return;
            this._headerLockedSize = size;
            if (!this._refreshEventDispatching && this._container[this._refreshBarAxis] >= 0) {
                this._tweenStart.setTo(this._container.x, this._container.y);
                this._tweenChange.setTo(0, 0);
                this._tweenChange[this._refreshBarAxis] = this._headerLockedSize - this._tweenStart[this._refreshBarAxis];
                this._tweenDuration.setTo(TWEEN_TIME_DEFAULT, TWEEN_TIME_DEFAULT);
                this.startTween(2);
            }
        };
        ScrollPane.prototype.lockFooter = function (size) {
            if (this._footerLockedSize == size)
                return;
            this._footerLockedSize = size;
            if (!this._refreshEventDispatching && this._container[this._refreshBarAxis] <= -this._overlapSize[this._refreshBarAxis]) {
                this._tweenStart.setTo(this._container.x, this._container.y);
                this._tweenChange.setTo(0, 0);
                var max = this._overlapSize[this._refreshBarAxis];
                if (max == 0)
                    max = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0);
                else
                    max += this._footerLockedSize;
                this._tweenChange[this._refreshBarAxis] = -max - this._tweenStart[this._refreshBarAxis];
                this._tweenDuration.setTo(TWEEN_TIME_DEFAULT, TWEEN_TIME_DEFAULT);
                this.startTween(2);
            }
        };
        ScrollPane.prototype.onOwnerSizeChanged = function () {
            this.setSize(this._owner.width, this._owner.height);
            this.posChanged(false);
        };
        ScrollPane.prototype.handleControllerChanged = function (c) {
            if (this._pageController == c) {
                if (this._scrollType == fgui.ScrollType.Horizontal)
                    this.setCurrentPageX(c.selectedIndex, true);
                else
                    this.setCurrentPageY(c.selectedIndex, true);
            }
        };
        ScrollPane.prototype.updatePageController = function () {
            if (this._pageController && !this._pageController.changing) {
                var index;
                if (this._scrollType == fgui.ScrollType.Horizontal)
                    index = this.currentPageX;
                else
                    index = this.currentPageY;
                if (index < this._pageController.pageCount) {
                    var c = this._pageController;
                    this._pageController = null;
                    c.selectedIndex = index;
                    this._pageController = c;
                }
            }
        };
        ScrollPane.prototype.adjustMaskContainer = function () {
            var mx = 0, my = 0;
            if (this._dontClipMargin) {
                if (this._displayOnLeft && this._vtScrollBar && !this._floating)
                    mx = this._vtScrollBar.width;
            }
            else {
                if (this._displayOnLeft && this._vtScrollBar && !this._floating)
                    mx = this._owner.margin.left + this._vtScrollBar.width;
                else
                    mx = this._owner.margin.left;
                my = this._owner.margin.top;
            }
            this._maskContainer.x = mx;
            this._maskContainer.y = my;
            mx = this._owner._alignOffset.x;
            my = this._owner._alignOffset.y;
            if (mx != 0 || my != 0 || this._dontClipMargin) {
                if (!this._alignContainer) {
                    this._alignContainer = new egret.DisplayObjectContainer();
                    this._maskContainer.addChild(this._alignContainer);
                    this._alignContainer.addChild(this._container);
                }
            }
            if (this._alignContainer) {
                if (this._dontClipMargin) {
                    mx += this._owner.margin.left;
                    my += this._owner.margin.top;
                }
                this._alignContainer.x = mx;
                this._alignContainer.y = my;
            }
        };
        ScrollPane.prototype.setSize = function (aWidth, aHeight) {
            this.adjustMaskContainer();
            if (this._hzScrollBar) {
                this._hzScrollBar.y = aHeight - this._hzScrollBar.height;
                if (this._vtScrollBar && !this._vScrollNone) {
                    this._hzScrollBar.width = aWidth - this._vtScrollBar.width - this._scrollBarMargin.left - this._scrollBarMargin.right;
                    if (this._displayOnLeft)
                        this._hzScrollBar.x = this._scrollBarMargin.left + this._vtScrollBar.width;
                    else
                        this._hzScrollBar.x = this._scrollBarMargin.left;
                }
                else {
                    this._hzScrollBar.width = aWidth - this._scrollBarMargin.left - this._scrollBarMargin.right;
                    this._hzScrollBar.x = this._scrollBarMargin.left;
                }
            }
            if (this._vtScrollBar) {
                if (!this._displayOnLeft)
                    this._vtScrollBar.x = aWidth - this._vtScrollBar.width;
                if (this._hzScrollBar)
                    this._vtScrollBar.height = aHeight - this._hzScrollBar.height - this._scrollBarMargin.top - this._scrollBarMargin.bottom;
                else
                    this._vtScrollBar.height = aHeight - this._scrollBarMargin.top - this._scrollBarMargin.bottom;
                this._vtScrollBar.y = this._scrollBarMargin.top;
            }
            this._viewSize.x = aWidth;
            this._viewSize.y = aHeight;
            if (this._hzScrollBar && !this._floating)
                this._viewSize.y -= this._hzScrollBar.height;
            if (this._vtScrollBar && !this._floating)
                this._viewSize.x -= this._vtScrollBar.width;
            this._viewSize.x -= (this._owner.margin.left + this._owner.margin.right);
            this._viewSize.y -= (this._owner.margin.top + this._owner.margin.bottom);
            this._viewSize.x = Math.max(1, this._viewSize.x);
            this._viewSize.y = Math.max(1, this._viewSize.y);
            this._pageSize.x = this._viewSize.x;
            this._pageSize.y = this._viewSize.y;
            this.handleSizeChanged();
        };
        ScrollPane.prototype.setContentSize = function (aWidth, aHeight) {
            if (this._contentSize.x == aWidth && this._contentSize.y == aHeight)
                return;
            this._contentSize.x = aWidth;
            this._contentSize.y = aHeight;
            this.handleSizeChanged();
        };
        ScrollPane.prototype.changeContentSizeOnScrolling = function (deltaWidth, deltaHeight, deltaPosX, deltaPosY) {
            var isRightmost = this._xPos == this._overlapSize.x;
            var isBottom = this._yPos == this._overlapSize.y;
            this._contentSize.x += deltaWidth;
            this._contentSize.y += deltaHeight;
            this.handleSizeChanged();
            if (this._tweening == 1) {
                if (deltaWidth != 0 && isRightmost && this._tweenChange.x < 0) {
                    this._xPos = this._overlapSize.x;
                    this._tweenChange.x = -this._xPos - this._tweenStart.x;
                }
                if (deltaHeight != 0 && isBottom && this._tweenChange.y < 0) {
                    this._yPos = this._overlapSize.y;
                    this._tweenChange.y = -this._yPos - this._tweenStart.y;
                }
            }
            else if (this._tweening == 2) {
                if (deltaPosX != 0) {
                    this._container.x -= deltaPosX;
                    this._tweenStart.x -= deltaPosX;
                    this._xPos = -this._container.x;
                }
                if (deltaPosY != 0) {
                    this._container.y -= deltaPosY;
                    this._tweenStart.y -= deltaPosY;
                    this._yPos = -this._container.y;
                }
            }
            else if (this._dragged) {
                if (deltaPosX != 0) {
                    this._container.x -= deltaPosX;
                    this._containerPos.x -= deltaPosX;
                    this._xPos = -this._container.x;
                }
                if (deltaPosY != 0) {
                    this._container.y -= deltaPosY;
                    this._containerPos.y -= deltaPosY;
                    this._yPos = -this._container.y;
                }
            }
            else {
                if (deltaWidth != 0 && isRightmost) {
                    this._xPos = this._overlapSize.x;
                    this._container.x = -this._xPos;
                }
                if (deltaHeight != 0 && isBottom) {
                    this._yPos = this._overlapSize.y;
                    this._container.y = -this._yPos;
                }
            }
            if (this._pageMode)
                this.updatePageController();
        };
        ScrollPane.prototype.handleSizeChanged = function () {
            if (this._displayInDemand) {
                this._vScrollNone = this._contentSize.y <= this._viewSize.y;
                this._hScrollNone = this._contentSize.x <= this._viewSize.x;
            }
            if (this._vtScrollBar) {
                if (this._contentSize.y == 0)
                    this._vtScrollBar.setDisplayPerc(0);
                else
                    this._vtScrollBar.setDisplayPerc(Math.min(1, this._viewSize.y / this._contentSize.y));
            }
            if (this._hzScrollBar) {
                if (this._contentSize.x == 0)
                    this._hzScrollBar.setDisplayPerc(0);
                else
                    this._hzScrollBar.setDisplayPerc(Math.min(1, this._viewSize.x / this._contentSize.x));
            }
            this.updateScrollBarVisible();
            var rect = this._maskContainer.scrollRect;
            if (rect) {
                rect.width = this._viewSize.x;
                rect.height = this._viewSize.y;
                if (this._vScrollNone && this._vtScrollBar)
                    rect.width += this._vtScrollBar.width;
                if (this._hScrollNone && this._hzScrollBar)
                    rect.height += this._hzScrollBar.height;
                if (this._dontClipMargin) {
                    rect.width += (this._owner.margin.left + this._owner.margin.right);
                    rect.height += (this._owner.margin.top + this._owner.margin.bottom);
                }
                this._maskContainer.scrollRect = rect;
            }
            if (this._scrollType == fgui.ScrollType.Horizontal || this._scrollType == fgui.ScrollType.Both)
                this._overlapSize.x = Math.ceil(Math.max(0, this._contentSize.x - this._viewSize.x));
            else
                this._overlapSize.x = 0;
            if (this._scrollType == fgui.ScrollType.Vertical || this._scrollType == fgui.ScrollType.Both)
                this._overlapSize.y = Math.ceil(Math.max(0, this._contentSize.y - this._viewSize.y));
            else
                this._overlapSize.y = 0;
            this._xPos = fgui.ToolSet.clamp(this._xPos, 0, this._overlapSize.x);
            this._yPos = fgui.ToolSet.clamp(this._yPos, 0, this._overlapSize.y);
            if (this._refreshBarAxis != null) {
                var max = this._overlapSize[this._refreshBarAxis];
                if (max == 0)
                    max = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0);
                else
                    max += this._footerLockedSize;
                if (this._refreshBarAxis == "x") {
                    this._container.x = fgui.ToolSet.clamp(this._container.x, -max, this._headerLockedSize);
                    this._container.y = fgui.ToolSet.clamp(this._container.y, -this._overlapSize.y, 0);
                }
                else {
                    this._container.x = fgui.ToolSet.clamp(this._container.x, -this._overlapSize.x, 0);
                    this._container.y = fgui.ToolSet.clamp(this._container.y, -max, this._headerLockedSize);
                }
                if (this._header) {
                    if (this._refreshBarAxis == "x")
                        this._header.height = this._viewSize.y;
                    else
                        this._header.width = this._viewSize.x;
                }
                if (this._footer) {
                    if (this._refreshBarAxis == "y")
                        this._footer.height = this._viewSize.y;
                    else
                        this._footer.width = this._viewSize.x;
                }
            }
            else {
                this._container.x = fgui.ToolSet.clamp(this._container.x, -this._overlapSize.x, 0);
                this._container.y = fgui.ToolSet.clamp(this._container.y, -this._overlapSize.y, 0);
            }
            this.updateScrollBarPos();
            if (this._pageMode)
                this.updatePageController();
        };
        ScrollPane.prototype.posChanged = function (ani) {
            if (this._aniFlag == 0)
                this._aniFlag = ani ? 1 : -1;
            else if (this._aniFlag == 1 && !ani)
                this._aniFlag = -1;
            this._needRefresh = true;
            fgui.GTimers.inst.callLater(this.refresh, this);
            if (this._tweening != 0)
                this.killTween();
        };
        ScrollPane.prototype.refresh = function () {
            this._needRefresh = false;
            fgui.GTimers.inst.remove(this.refresh, this);
            if (this._pageMode || this._snapToItem) {
                sEndPos.setTo(-this._xPos, -this._yPos);
                this.alignPosition(sEndPos, false);
                this._xPos = -sEndPos.x;
                this._yPos = -sEndPos.y;
            }
            this.refresh2();
            this.dispatchEventWith(ScrollPane.SCROLL);
            if (this._needRefresh) {
                this._needRefresh = false;
                fgui.GTimers.inst.remove(this.refresh, this);
                this.refresh2();
            }
            this.updateScrollBarPos();
            this._aniFlag = 0;
        };
        ScrollPane.prototype.refresh2 = function () {
            if (this._aniFlag == 1 && !this._dragged) {
                var posX;
                var posY;
                if (this._overlapSize.x > 0)
                    posX = -Math.floor(this._xPos);
                else {
                    if (this._container.x != 0)
                        this._container.x = 0;
                    posX = 0;
                }
                if (this._overlapSize.y > 0)
                    posY = -Math.floor(this._yPos);
                else {
                    if (this._container.y != 0)
                        this._container.y = 0;
                    posY = 0;
                }
                if (posX != this._container.x || posY != this._container.y) {
                    this._tweenDuration.setTo(TWEEN_TIME_GO, TWEEN_TIME_GO);
                    this._tweenStart.setTo(this._container.x, this._container.y);
                    this._tweenChange.setTo(posX - this._tweenStart.x, posY - this._tweenStart.y);
                    this.startTween(1);
                }
                else if (this._tweening != 0)
                    this.killTween();
            }
            else {
                if (this._tweening != 0)
                    this.killTween();
                this._container.x = Math.floor(-this._xPos);
                this._container.y = Math.floor(-this._yPos);
                this.loopCheckingCurrent();
            }
            if (this._pageMode)
                this.updatePageController();
        };
        ScrollPane.prototype.__touchBegin = function (evt) {
            if (!this._touchEffect)
                return;
            if (this._tweening != 0) {
                this.killTween();
                this._dragged = true;
            }
            else
                this._dragged = false;
            var pt = this._owner.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            this._containerPos.setTo(this._container.x, this._container.y);
            this._beginTouchPos.setTo(pt.x, pt.y);
            this._lastTouchPos.setTo(pt.x, pt.y);
            this._lastTouchGlobalPos.setTo(evt.stageX, evt.stageY);
            this._isHoldAreaDone = false;
            this._velocity.setTo(0, 0);
            this._velocityScale = 1;
            this._lastMoveTime = egret.getTimer() / 1000;
            this._owner.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.__touchMove, this);
            this._owner.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.__touchEnd, this);
            this._owner.displayObject.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, this.__touchTap, this);
        };
        ScrollPane.prototype.__touchMove = function (evt) {
            if (this._owner.displayObject.stage == null)
                return;
            if (!this._touchEffect)
                return;
            if (ScrollPane.draggingPane && ScrollPane.draggingPane != this || fgui.GObject.draggingObject)
                return;
            var pt = this._owner.globalToLocal(evt.stageX, evt.stageY, s_vec2);
            var sensitivity = fgui.UIConfig.touchScrollSensitivity;
            var diff, diff2;
            var sv, sh, st;
            if (this._scrollType == fgui.ScrollType.Vertical) {
                if (!this._isHoldAreaDone) {
                    _gestureFlag |= 1;
                    diff = Math.abs(this._beginTouchPos.y - pt.y);
                    if (diff < sensitivity)
                        return;
                    if ((_gestureFlag & 2) != 0) {
                        diff2 = Math.abs(this._beginTouchPos.x - pt.x);
                        if (diff < diff2)
                            return;
                    }
                }
                sv = true;
            }
            else if (this._scrollType == fgui.ScrollType.Horizontal) {
                if (!this._isHoldAreaDone) {
                    _gestureFlag |= 2;
                    diff = Math.abs(this._beginTouchPos.x - pt.x);
                    if (diff < sensitivity)
                        return;
                    if ((_gestureFlag & 1) != 0) {
                        diff2 = Math.abs(this._beginTouchPos.y - pt.y);
                        if (diff < diff2)
                            return;
                    }
                }
                sh = true;
            }
            else {
                _gestureFlag = 3;
                if (!this._isHoldAreaDone) {
                    diff = Math.abs(this._beginTouchPos.y - pt.y);
                    if (diff < sensitivity) {
                        diff = Math.abs(this._beginTouchPos.x - pt.x);
                        if (diff < sensitivity)
                            return;
                    }
                }
                sv = sh = true;
            }
            var newPosX = Math.floor(this._containerPos.x + pt.x - this._beginTouchPos.x);
            var newPosY = Math.floor(this._containerPos.y + pt.y - this._beginTouchPos.y);
            if (sv) {
                if (newPosY > 0) {
                    if (!this._bouncebackEffect)
                        this._container.y = 0;
                    else if (this._header && this._header.maxHeight != 0)
                        this._container.y = Math.floor(Math.min(newPosY * 0.5, this._header.maxHeight));
                    else
                        this._container.y = Math.floor(Math.min(newPosY * 0.5, this._viewSize.y * PULL_RATIO));
                }
                else if (newPosY < -this._overlapSize.y) {
                    if (!this._bouncebackEffect)
                        this._container.y = -this._overlapSize.y;
                    else if (this._footer && this._footer.maxHeight > 0)
                        this._container.y = Math.floor(Math.max((newPosY + this._overlapSize.y) * 0.5, -this._footer.maxHeight) - this._overlapSize.y);
                    else
                        this._container.y = Math.floor(Math.max((newPosY + this._overlapSize.y) * 0.5, -this._viewSize.y * PULL_RATIO) - this._overlapSize.y);
                }
                else
                    this._container.y = newPosY;
            }
            if (sh) {
                if (newPosX > 0) {
                    if (!this._bouncebackEffect)
                        this._container.x = 0;
                    else if (this._header && this._header.maxWidth != 0)
                        this._container.x = Math.floor(Math.min(newPosX * 0.5, this._header.maxWidth));
                    else
                        this._container.x = Math.floor(Math.min(newPosX * 0.5, this._viewSize.x * PULL_RATIO));
                }
                else if (newPosX < 0 - this._overlapSize.x) {
                    if (!this._bouncebackEffect)
                        this._container.x = -this._overlapSize.x;
                    else if (this._footer && this._footer.maxWidth > 0)
                        this._container.x = Math.floor(Math.max((newPosX + this._overlapSize.x) * 0.5, -this._footer.maxWidth) - this._overlapSize.x);
                    else
                        this._container.x = Math.floor(Math.max((newPosX + this._overlapSize.x) * 0.5, -this._viewSize.x * PULL_RATIO) - this._overlapSize.x);
                }
                else
                    this._container.x = newPosX;
            }
            var now = egret.getTimer() / 1000;
            var deltaTime = Math.max(now - this._lastMoveTime, 1 / 60);
            var deltaPositionX = pt.x - this._lastTouchPos.x;
            var deltaPositionY = pt.y - this._lastTouchPos.y;
            if (!sh)
                deltaPositionX = 0;
            if (!sv)
                deltaPositionY = 0;
            if (deltaTime != 0) {
                var frameRate = this._owner.displayObject.stage.frameRate;
                var elapsed = deltaTime * frameRate - 1;
                if (elapsed > 1) {
                    var factor = Math.pow(0.833, elapsed);
                    this._velocity.x = this._velocity.x * factor;
                    this._velocity.y = this._velocity.y * factor;
                }
                this._velocity.x = fgui.ToolSet.lerp(this._velocity.x, deltaPositionX * 60 / frameRate / deltaTime, deltaTime * 10);
                this._velocity.y = fgui.ToolSet.lerp(this._velocity.y, deltaPositionY * 60 / frameRate / deltaTime, deltaTime * 10);
            }
            var deltaGlobalPositionX = this._lastTouchGlobalPos.x - evt.stageX;
            var deltaGlobalPositionY = this._lastTouchGlobalPos.y - evt.stageY;
            if (deltaPositionX != 0)
                this._velocityScale = Math.abs(deltaGlobalPositionX / deltaPositionX);
            else if (deltaPositionY != 0)
                this._velocityScale = Math.abs(deltaGlobalPositionY / deltaPositionY);
            this._lastTouchPos.setTo(pt.x, pt.y);
            this._lastTouchGlobalPos.setTo(evt.stageX, evt.stageY);
            this._lastMoveTime = now;
            if (this._overlapSize.x > 0)
                this._xPos = fgui.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x);
            if (this._overlapSize.y > 0)
                this._yPos = fgui.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y);
            if (this._loop != 0) {
                newPosX = this._container.x;
                newPosY = this._container.y;
                if (this.loopCheckingCurrent()) {
                    this._containerPos.x += this._container.x - newPosX;
                    this._containerPos.y += this._container.y - newPosY;
                }
            }
            ScrollPane.draggingPane = this;
            this._isHoldAreaDone = true;
            this._dragged = true;
            this._maskContainer.touchChildren = false;
            this.updateScrollBarPos();
            this.updateScrollBarVisible();
            if (this._pageMode)
                this.updatePageController();
            this.dispatchEventWith(ScrollPane.SCROLL);
        };
        ScrollPane.prototype.__touchEnd = function (evt) {
            evt.currentTarget.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.__touchMove, this);
            evt.currentTarget.removeEventListener(egret.TouchEvent.TOUCH_END, this.__touchEnd, this);
            evt.currentTarget.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.__touchTap, this);
            if (ScrollPane.draggingPane == this)
                ScrollPane.draggingPane = null;
            _gestureFlag = 0;
            if (!this._dragged || !this._touchEffect || this._owner.displayObject.stage == null) {
                this._dragged = false;
                this._maskContainer.touchChildren = true;
                return;
            }
            this._dragged = false;
            this._maskContainer.touchChildren = true;
            this._tweenStart.setTo(this._container.x, this._container.y);
            sEndPos.setTo(this._tweenStart.x, this._tweenStart.y);
            var flag = false;
            if (this._container.x > 0) {
                sEndPos.x = 0;
                flag = true;
            }
            else if (this._container.x < -this._overlapSize.x) {
                sEndPos.x = -this._overlapSize.x;
                flag = true;
            }
            if (this._container.y > 0) {
                sEndPos.y = 0;
                flag = true;
            }
            else if (this._container.y < -this._overlapSize.y) {
                sEndPos.y = -this._overlapSize.y;
                flag = true;
            }
            if (flag) {
                this._tweenChange.setTo(sEndPos.x - this._tweenStart.x, sEndPos.y - this._tweenStart.y);
                if (this._tweenChange.x < -fgui.UIConfig.touchDragSensitivity || this._tweenChange.y < -fgui.UIConfig.touchDragSensitivity) {
                    this._refreshEventDispatching = true;
                    this.dispatchEventWith(ScrollPane.PULL_DOWN_RELEASE);
                    this._refreshEventDispatching = false;
                }
                else if (this._tweenChange.x > fgui.UIConfig.touchDragSensitivity || this._tweenChange.y > fgui.UIConfig.touchDragSensitivity) {
                    this._refreshEventDispatching = true;
                    this.dispatchEventWith(ScrollPane.PULL_UP_RELEASE);
                    this._refreshEventDispatching = false;
                }
                if (this._headerLockedSize > 0 && sEndPos[this._refreshBarAxis] == 0) {
                    sEndPos[this._refreshBarAxis] = this._headerLockedSize;
                    this._tweenChange.x = sEndPos.x - this._tweenStart.x;
                    this._tweenChange.y = sEndPos.y - this._tweenStart.y;
                }
                else if (this._footerLockedSize > 0 && sEndPos[this._refreshBarAxis] == -this._overlapSize[this._refreshBarAxis]) {
                    var max = this._overlapSize[this._refreshBarAxis];
                    if (max == 0)
                        max = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0);
                    else
                        max += this._footerLockedSize;
                    sEndPos[this._refreshBarAxis] = -max;
                    this._tweenChange.x = sEndPos.x - this._tweenStart.x;
                    this._tweenChange.y = sEndPos.y - this._tweenStart.y;
                }
                this._tweenDuration.setTo(TWEEN_TIME_DEFAULT, TWEEN_TIME_DEFAULT);
            }
            else {
                if (!this._inertiaDisabled) {
                    var frameRate = this._owner.displayObject.stage.frameRate;
                    var elapsed = (egret.getTimer() / 1000 - this._lastMoveTime) * frameRate - 1;
                    if (elapsed > 1) {
                        var factor = Math.pow(0.833, elapsed);
                        this._velocity.x = this._velocity.x * factor;
                        this._velocity.y = this._velocity.y * factor;
                    }
                    this.updateTargetAndDuration(this._tweenStart, sEndPos);
                }
                else
                    this._tweenDuration.setTo(TWEEN_TIME_DEFAULT, TWEEN_TIME_DEFAULT);
                sOldChange.setTo(sEndPos.x - this._tweenStart.x, sEndPos.y - this._tweenStart.y);
                this.loopCheckingTarget(sEndPos);
                if (this._pageMode || this._snapToItem)
                    this.alignPosition(sEndPos, true);
                this._tweenChange.x = sEndPos.x - this._tweenStart.x;
                this._tweenChange.y = sEndPos.y - this._tweenStart.y;
                if (this._tweenChange.x == 0 && this._tweenChange.y == 0) {
                    this.updateScrollBarVisible();
                    return;
                }
                if (this._pageMode || this._snapToItem) {
                    this.fixDuration("x", sOldChange.x);
                    this.fixDuration("y", sOldChange.y);
                }
            }
            this.startTween(2);
        };
        ScrollPane.prototype.__touchTap = function (evt) {
            this._dragged = false;
        };
        ScrollPane.prototype.updateScrollBarPos = function () {
            if (this._vtScrollBar)
                this._vtScrollBar.setScrollPerc(this._overlapSize.y == 0 ? 0 : fgui.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y) / this._overlapSize.y);
            if (this._hzScrollBar)
                this._hzScrollBar.setScrollPerc(this._overlapSize.x == 0 ? 0 : fgui.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x) / this._overlapSize.x);
            this.checkRefreshBar();
        };
        ScrollPane.prototype.updateScrollBarVisible = function () {
            if (this._vtScrollBar) {
                if (this._viewSize.y <= this._vtScrollBar.minSize || this._vScrollNone)
                    this._vtScrollBar.displayObject.visible = false;
                else
                    this.updateScrollBarVisible2(this._vtScrollBar);
            }
            if (this._hzScrollBar) {
                if (this._viewSize.x <= this._hzScrollBar.minSize || this._hScrollNone)
                    this._hzScrollBar.displayObject.visible = false;
                else
                    this.updateScrollBarVisible2(this._hzScrollBar);
            }
        };
        ScrollPane.prototype.updateScrollBarVisible2 = function (bar) {
            if (this._scrollBarDisplayAuto)
                fgui.GTween.kill(bar, false, "alpha");
            if (this._scrollBarDisplayAuto && this._tweening == 0 && !this._dragged && !bar.gripDragging) {
                if (bar.displayObject.visible)
                    fgui.GTween.to(1, 0, 0.5).setDelay(0.5).onComplete(this.__barTweenComplete, this).setTarget(bar, "alpha");
            }
            else {
                bar.alpha = 1;
                bar.displayObject.visible = true;
            }
        };
        ScrollPane.prototype.__barTweenComplete = function (tweener) {
            var bar = (tweener.target);
            bar.alpha = 1;
            bar.displayObject.visible = false;
        };
        ScrollPane.prototype.getLoopPartSize = function (division, axis) {
            return (this._contentSize[axis] + (axis == "x" ? this._owner.columnGap : this._owner.lineGap)) / division;
        };
        ScrollPane.prototype.loopCheckingCurrent = function () {
            var changed = false;
            if (this._loop == 1 && this._overlapSize.x > 0) {
                if (this._xPos < 0.001) {
                    this._xPos += this.getLoopPartSize(2, "x");
                    changed = true;
                }
                else if (this._xPos >= this._overlapSize.x) {
                    this._xPos -= this.getLoopPartSize(2, "x");
                    changed = true;
                }
            }
            else if (this._loop == 2 && this._overlapSize.y > 0) {
                if (this._yPos < 0.001) {
                    this._yPos += this.getLoopPartSize(2, "y");
                    changed = true;
                }
                else if (this._yPos >= this._overlapSize.y) {
                    this._yPos -= this.getLoopPartSize(2, "y");
                    changed = true;
                }
            }
            if (changed) {
                this._container.x = Math.floor(-this._xPos);
                this._container.y = Math.floor(-this._yPos);
            }
            return changed;
        };
        ScrollPane.prototype.loopCheckingTarget = function (endPos) {
            if (this._loop == 1)
                this.loopCheckingTarget2(endPos, "x");
            if (this._loop == 2)
                this.loopCheckingTarget2(endPos, "y");
        };
        ScrollPane.prototype.loopCheckingTarget2 = function (endPos, axis) {
            var halfSize;
            var tmp;
            if (endPos[axis] > 0) {
                halfSize = this.getLoopPartSize(2, axis);
                tmp = this._tweenStart[axis] - halfSize;
                if (tmp <= 0 && tmp >= -this._overlapSize[axis]) {
                    endPos[axis] -= halfSize;
                    this._tweenStart[axis] = tmp;
                }
            }
            else if (endPos[axis] < -this._overlapSize[axis]) {
                halfSize = this.getLoopPartSize(2, axis);
                tmp = this._tweenStart[axis] + halfSize;
                if (tmp <= 0 && tmp >= -this._overlapSize[axis]) {
                    endPos[axis] += halfSize;
                    this._tweenStart[axis] = tmp;
                }
            }
        };
        ScrollPane.prototype.loopCheckingNewPos = function (value, axis) {
            if (this._overlapSize[axis] == 0)
                return value;
            var pos = axis == "x" ? this._xPos : this._yPos;
            var changed = false;
            var v;
            if (value < 0.001) {
                value += this.getLoopPartSize(2, axis);
                if (value > pos) {
                    v = this.getLoopPartSize(6, axis);
                    v = Math.ceil((value - pos) / v) * v;
                    pos = fgui.ToolSet.clamp(pos + v, 0, this._overlapSize[axis]);
                    changed = true;
                }
            }
            else if (value >= this._overlapSize[axis]) {
                value -= this.getLoopPartSize(2, axis);
                if (value < pos) {
                    v = this.getLoopPartSize(6, axis);
                    v = Math.ceil((pos - value) / v) * v;
                    pos = fgui.ToolSet.clamp(pos - v, 0, this._overlapSize[axis]);
                    changed = true;
                }
            }
            if (changed) {
                if (axis == "x")
                    this._container.x = -Math.floor(pos);
                else
                    this._container.y = -Math.floor(pos);
            }
            return value;
        };
        ScrollPane.prototype.alignPosition = function (pos, inertialScrolling) {
            if (this._pageMode) {
                pos.x = this.alignByPage(pos.x, "x", inertialScrolling);
                pos.y = this.alignByPage(pos.y, "y", inertialScrolling);
            }
            else if (this._snapToItem) {
                var pt = this._owner.getSnappingPosition(-pos.x, -pos.y, s_vec2);
                if (pos.x < 0 && pos.x > -this._overlapSize.x)
                    pos.x = -pt.x;
                if (pos.y < 0 && pos.y > -this._overlapSize.y)
                    pos.y = -pt.y;
            }
        };
        ScrollPane.prototype.alignByPage = function (pos, axis, inertialScrolling) {
            var page;
            if (pos > 0)
                page = 0;
            else if (pos < -this._overlapSize[axis])
                page = Math.ceil(this._contentSize[axis] / this._pageSize[axis]) - 1;
            else {
                page = Math.floor(-pos / this._pageSize[axis]);
                var change = inertialScrolling ? (pos - this._containerPos[axis]) : (pos - this._container[axis]);
                var testPageSize = Math.min(this._pageSize[axis], this._contentSize[axis] - (page + 1) * this._pageSize[axis]);
                var delta = -pos - page * this._pageSize[axis];
                if (Math.abs(change) > this._pageSize[axis]) {
                    if (delta > testPageSize * 0.5)
                        page++;
                }
                else {
                    if (delta > testPageSize * (change < 0 ? 0.3 : 0.7))
                        page++;
                }
                pos = -page * this._pageSize[axis];
                if (pos < -this._overlapSize[axis])
                    pos = -this._overlapSize[axis];
            }
            if (inertialScrolling) {
                var oldPos = this._tweenStart[axis];
                var oldPage;
                if (oldPos > 0)
                    oldPage = 0;
                else if (oldPos < -this._overlapSize[axis])
                    oldPage = Math.ceil(this._contentSize[axis] / this._pageSize[axis]) - 1;
                else
                    oldPage = Math.floor(-oldPos / this._pageSize[axis]);
                var startPage = Math.floor(-this._containerPos[axis] / this._pageSize[axis]);
                if (Math.abs(page - startPage) > 1 && Math.abs(oldPage - startPage) <= 1) {
                    if (page > startPage)
                        page = startPage + 1;
                    else
                        page = startPage - 1;
                    pos = -page * this._pageSize[axis];
                }
            }
            return pos;
        };
        ScrollPane.prototype.updateTargetAndDuration = function (orignPos, resultPos) {
            resultPos.x = this.updateTargetAndDuration2(orignPos.x, "x");
            resultPos.y = this.updateTargetAndDuration2(orignPos.y, "y");
        };
        ScrollPane.prototype.updateTargetAndDuration2 = function (pos, axis) {
            var v = this._velocity[axis];
            var duration = 0;
            if (pos > 0)
                pos = 0;
            else if (pos < -this._overlapSize[axis])
                pos = -this._overlapSize[axis];
            else {
                var isMobile = egret.Capabilities.isMobile;
                var v2 = Math.abs(v) * this._velocityScale;
                if (isMobile)
                    v2 *= 1136 / Math.max(this._owner.displayObject.stage.stageWidth, this._owner.displayObject.stage.stageHeight);
                var ratio = 0;
                if (this._pageMode || !isMobile) {
                    if (v2 > 500)
                        ratio = Math.pow((v2 - 500) / 500, 2);
                }
                else {
                    if (v2 > 1000)
                        ratio = Math.pow((v2 - 1000) / 1000, 2);
                }
                if (ratio != 0) {
                    if (ratio > 1)
                        ratio = 1;
                    v2 *= ratio;
                    v *= ratio;
                    this._velocity[axis] = v;
                    duration = Math.log(60 / v2) / Math.log(this._decelerationRate) / 60;
                    var change = Math.floor(v * duration * 0.4);
                    pos += change;
                }
            }
            if (duration < TWEEN_TIME_DEFAULT)
                duration = TWEEN_TIME_DEFAULT;
            this._tweenDuration[axis] = duration;
            return pos;
        };
        ScrollPane.prototype.fixDuration = function (axis, oldChange) {
            if (this._tweenChange[axis] == 0 || Math.abs(this._tweenChange[axis]) >= Math.abs(oldChange))
                return;
            var newDuration = Math.abs(this._tweenChange[axis] / oldChange) * this._tweenDuration[axis];
            if (newDuration < TWEEN_TIME_DEFAULT)
                newDuration = TWEEN_TIME_DEFAULT;
            this._tweenDuration[axis] = newDuration;
        };
        ScrollPane.prototype.startTween = function (type) {
            this._tweenTime.setTo(0, 0);
            this._tweening = type;
            fgui.GTimers.inst.add(1, 0, this.tweenUpdate, this);
            this.updateScrollBarVisible();
        };
        ScrollPane.prototype.killTween = function () {
            if (this._tweening == 1) {
                this._container.x = this._tweenStart.x + this._tweenChange.x;
                this._container.y = this._tweenStart.y + this._tweenChange.y;
                this.dispatchEventWith(ScrollPane.SCROLL);
            }
            this._tweening = 0;
            fgui.GTimers.inst.remove(this.tweenUpdate, this);
            this.updateScrollBarVisible();
            this.dispatchEventWith(ScrollPane.SCROLL_END);
        };
        ScrollPane.prototype.checkRefreshBar = function () {
            if (this._header == null && this._footer == null)
                return;
            var pos = this._container[this._refreshBarAxis];
            if (this._header) {
                if (pos > 0) {
                    if (this._header.displayObject.parent == null)
                        this._maskContainer.addChildAt(this._header.displayObject, 0);
                    var pt = s_vec2;
                    pt.setTo(this._header.width, this._header.height);
                    pt[this._refreshBarAxis] = pos;
                    this._header.setSize(pt.x, pt.y);
                }
                else {
                    if (this._header.displayObject.parent)
                        this._maskContainer.removeChild(this._header.displayObject);
                }
            }
            if (this._footer) {
                var max = this._overlapSize[this._refreshBarAxis];
                if (pos < -max || max == 0 && this._footerLockedSize > 0) {
                    if (this._footer.displayObject.parent == null)
                        this._maskContainer.addChildAt(this._footer.displayObject, 0);
                    pt = s_vec2;
                    pt.setTo(this._footer.x, this._footer.y);
                    if (max > 0)
                        pt[this._refreshBarAxis] = pos + this._contentSize[this._refreshBarAxis];
                    else
                        pt[this._refreshBarAxis] = Math.max(Math.min(pos + this._viewSize[this._refreshBarAxis], this._viewSize[this._refreshBarAxis] - this._footerLockedSize), this._viewSize[this._refreshBarAxis] - this._contentSize[this._refreshBarAxis]);
                    this._footer.setXY(pt.x, pt.y);
                    pt.setTo(this._footer.width, this._footer.height);
                    if (max > 0)
                        pt[this._refreshBarAxis] = -max - pos;
                    else
                        pt[this._refreshBarAxis] = this._viewSize[this._refreshBarAxis] - this._footer[this._refreshBarAxis];
                    this._footer.setSize(pt.x, pt.y);
                }
                else {
                    if (this._footer.displayObject.parent)
                        this._maskContainer.removeChild(this._footer.displayObject);
                }
            }
        };
        ScrollPane.prototype.tweenUpdate = function (timestamp) {
            var nx = this.runTween("x");
            var ny = this.runTween("y");
            this._container.x = nx;
            this._container.y = ny;
            if (this._tweening == 2) {
                if (this._overlapSize.x > 0)
                    this._xPos = fgui.ToolSet.clamp(-nx, 0, this._overlapSize.x);
                if (this._overlapSize.y > 0)
                    this._yPos = fgui.ToolSet.clamp(-ny, 0, this._overlapSize.y);
                if (this._pageMode)
                    this.updatePageController();
            }
            if (this._tweenChange.x == 0 && this._tweenChange.y == 0) {
                this._tweening = 0;
                fgui.GTimers.inst.remove(this.tweenUpdate, this);
                this.loopCheckingCurrent();
                this.updateScrollBarPos();
                this.updateScrollBarVisible();
                this.dispatchEventWith(ScrollPane.SCROLL);
                this.dispatchEventWith(ScrollPane.SCROLL_END);
            }
            else {
                this.updateScrollBarPos();
                this.dispatchEventWith(ScrollPane.SCROLL);
            }
            return true;
        };
        ScrollPane.prototype.runTween = function (axis) {
            var newValue;
            if (this._tweenChange[axis] != 0) {
                this._tweenTime[axis] += fgui.GTimers.deltaTime / 1000;
                if (this._tweenTime[axis] >= this._tweenDuration[axis]) {
                    newValue = this._tweenStart[axis] + this._tweenChange[axis];
                    this._tweenChange[axis] = 0;
                }
                else {
                    var ratio = easeFunc(this._tweenTime[axis], this._tweenDuration[axis]);
                    newValue = this._tweenStart[axis] + Math.floor(this._tweenChange[axis] * ratio);
                }
                var threshold1 = 0;
                var threshold2 = -this._overlapSize[axis];
                if (this._headerLockedSize > 0 && this._refreshBarAxis == axis)
                    threshold1 = this._headerLockedSize;
                if (this._footerLockedSize > 0 && this._refreshBarAxis == axis) {
                    var max = this._overlapSize[this._refreshBarAxis];
                    if (max == 0)
                        max = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0);
                    else
                        max += this._footerLockedSize;
                    threshold2 = -max;
                }
                if (this._tweening == 2 && this._bouncebackEffect) {
                    if (newValue > 20 + threshold1 && this._tweenChange[axis] > 0
                        || newValue > threshold1 && this._tweenChange[axis] == 0) {
                        this._tweenTime[axis] = 0;
                        this._tweenDuration[axis] = TWEEN_TIME_DEFAULT;
                        this._tweenChange[axis] = -newValue + threshold1;
                        this._tweenStart[axis] = newValue;
                    }
                    else if (newValue < threshold2 - 20 && this._tweenChange[axis] < 0
                        || newValue < threshold2 && this._tweenChange[axis] == 0) {
                        this._tweenTime[axis] = 0;
                        this._tweenDuration[axis] = TWEEN_TIME_DEFAULT;
                        this._tweenChange[axis] = threshold2 - newValue;
                        this._tweenStart[axis] = newValue;
                    }
                }
                else {
                    if (newValue > threshold1) {
                        newValue = threshold1;
                        this._tweenChange[axis] = 0;
                    }
                    else if (newValue < threshold2) {
                        newValue = threshold2;
                        this._tweenChange[axis] = 0;
                    }
                }
            }
            else
                newValue = this._container[axis];
            return newValue;
        };
        ScrollPane.SCROLL = "__scroll";
        ScrollPane.SCROLL_END = "__scrollEnd";
        ScrollPane.PULL_DOWN_RELEASE = "pullDownRelease";
        ScrollPane.PULL_UP_RELEASE = "pullUpRelease";
        return ScrollPane;
    }(egret.EventDispatcher));
    fgui.ScrollPane = ScrollPane;
    var _gestureFlag = 0;
    var TWEEN_TIME_GO = 0.5;
    var TWEEN_TIME_DEFAULT = 0.3;
    var PULL_RATIO = 0.5;
    var s_vec2 = new egret.Point();
    var s_rect = new egret.Rectangle();
    var sEndPos = new egret.Point();
    var sOldChange = new egret.Point();
    function easeFunc(t, d) {
        return (t = t / d - 1) * t * t + 1;
    }
})(fgui || (fgui = {}));

(function (fgui) {
    var Transition = (function () {
        function Transition(owner) {
            this._ownerBaseX = 0;
            this._ownerBaseY = 0;
            this._totalTimes = 0;
            this._totalTasks = 0;
            this._options = 0;
            this._totalDuration = 0;
            this._autoPlayTimes = 1;
            this._autoPlayDelay = 0;
            this._timeScale = 1;
            this._startTime = 0;
            this._endTime = 0;
            this._owner = owner;
            this._items = new Array();
        }
        Transition.prototype.play = function (onComplete, onCompleteObj, onCompleteParam, times, delay, startTime, endTime) {
            this._play(onComplete, onCompleteObj, onCompleteParam, times, delay, startTime, endTime, false);
        };
        Transition.prototype.playReverse = function (onComplete, onCompleteObj, onCompleteParam, times, delay) {
            this._play(onComplete, onCompleteObj, onCompleteParam, times, delay, 0, -1, true);
        };
        Transition.prototype.changePlayTimes = function (value) {
            this._totalTimes = value;
        };
        Transition.prototype.setAutoPlay = function (value, times, delay) {
            if (times == undefined)
                times = -1;
            if (delay == undefined)
                delay = 0;
            if (this._autoPlay != value) {
                this._autoPlay = value;
                this._autoPlayTimes = times;
                this._autoPlayDelay = delay;
                if (this._autoPlay) {
                    if (this._owner.onStage)
                        this.play(null, null, this._autoPlayTimes, this._autoPlayDelay);
                }
                else {
                    if (!this._owner.onStage)
                        this.stop(false, true);
                }
            }
        };
        Transition.prototype._play = function (onComplete, onCompleteCaller, onCompleteParam, times, delay, startTime, endTime, reversed) {
            if (times == undefined)
                times = 1;
            if (delay == undefined)
                delay = 0;
            if (startTime == undefined)
                startTime = 0;
            if (endTime == undefined)
                endTime = -1;
            this.stop(true, true);
            this._totalTimes = times;
            this._reversed = reversed;
            this._startTime = startTime;
            this._endTime = endTime;
            this._playing = true;
            this._paused = false;
            this._onComplete = onComplete;
            this._onCompleteParam = onCompleteParam;
            this._onCompleteCaller = onCompleteCaller;
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (!item.target) {
                    if (item.targetId)
                        item.target = this._owner.getChildById(item.targetId);
                    else
                        item.target = this._owner;
                }
                else if (item.target != this._owner && item.target.parent != this._owner)
                    item.target = null;
                if (item.target && item.type == ActionType.Transition) {
                    var trans = item.target.getTransition(item.value.transName);
                    if (trans == this)
                        trans = null;
                    if (trans) {
                        if (item.value.playTimes == 0) {
                            var j;
                            for (j = i - 1; j >= 0; j--) {
                                var item2 = this._items[j];
                                if (item2.type == ActionType.Transition) {
                                    if (item2.value.trans == trans) {
                                        item2.value.stopTime = item.time - item2.time;
                                        break;
                                    }
                                }
                            }
                            if (j < 0)
                                item.value.stopTime = 0;
                            else
                                trans = null;
                        }
                        else
                            item.value.stopTime = -1;
                    }
                    item.value.trans = trans;
                }
            }
            if (delay == 0)
                this.onDelayedPlay();
            else
                fgui.GTween.delayedCall(delay).onComplete(this.onDelayedPlay, this);
        };
        Transition.prototype.stop = function (setToComplete, processCallback) {
            if (setToComplete == undefined)
                setToComplete = true;
            if (!this._playing)
                return;
            this._playing = false;
            this._totalTasks = 0;
            this._totalTimes = 0;
            var func = this._onComplete;
            var param = this._onCompleteParam;
            var thisObj = this._onCompleteCaller;
            this._onComplete = null;
            this._onCompleteParam = null;
            this._onCompleteCaller = null;
            fgui.GTween.kill(this);
            var cnt = this._items.length;
            if (this._reversed) {
                for (var i = cnt - 1; i >= 0; i--) {
                    var item = this._items[i];
                    if (!item.target)
                        continue;
                    this.stopItem(item, setToComplete);
                }
            }
            else {
                for (i = 0; i < cnt; i++) {
                    item = this._items[i];
                    if (!item.target)
                        continue;
                    this.stopItem(item, setToComplete);
                }
            }
            if (processCallback && func != null) {
                func.call(thisObj, param);
            }
        };
        Transition.prototype.stopItem = function (item, setToComplete) {
            if (item.displayLockToken != 0) {
                item.target.releaseDisplayLock(item.displayLockToken);
                item.displayLockToken = 0;
            }
            if (item.tweener) {
                item.tweener.kill(setToComplete);
                item.tweener = null;
                if (item.type == ActionType.Shake && !setToComplete) {
                    item.target._gearLocked = true;
                    item.target.setXY(item.target.x - item.value.lastOffsetX, item.target.y - item.value.lastOffsetY);
                    item.target._gearLocked = false;
                }
            }
            if (item.type == ActionType.Transition) {
                var trans = item.value.trans;
                if (trans)
                    trans.stop(setToComplete, false);
            }
        };
        Transition.prototype.setPaused = function (paused) {
            if (!this._playing || this._paused == paused)
                return;
            this._paused = paused;
            var tweener = fgui.GTween.getTween(this);
            if (tweener)
                tweener.setPaused(paused);
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (!item.target)
                    continue;
                if (item.type == ActionType.Transition) {
                    if (item.value.trans)
                        item.value.trans.setPaused(paused);
                }
                else if (item.type == ActionType.Animation) {
                    if (paused) {
                        item.value.flag = item.target.getProp(fgui.ObjectPropID.Playing);
                        item.target.setProp(fgui.ObjectPropID.Playing, false);
                    }
                    else
                        item.target.setProp(fgui.ObjectPropID.Playing, item.value.flag);
                }
                if (item.tweener)
                    item.tweener.setPaused(paused);
            }
        };
        Transition.prototype.dispose = function () {
            if (this._playing)
                fgui.GTween.kill(this);
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.tweener) {
                    item.tweener.kill();
                    item.tweener = null;
                }
                item.target = null;
                item.hook = null;
                if (item.tweenConfig)
                    item.tweenConfig.endHook = null;
            }
            this._items.length = 0;
            this._playing = false;
            this._onComplete = null;
            this._onCompleteCaller = null;
            this._onCompleteParam = null;
        };
        Object.defineProperty(Transition.prototype, "playing", {
            get: function () {
                return this._playing;
            },
            enumerable: true,
            configurable: true
        });
        Transition.prototype.setValue = function (label) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var cnt = this._items.length;
            var value;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.label == label) {
                    if (item.tweenConfig)
                        value = item.tweenConfig.startValue;
                    else
                        value = item.value;
                }
                else if (item.tweenConfig && item.tweenConfig.endLabel == label) {
                    value = item.tweenConfig.endValue;
                }
                else
                    continue;
                switch (item.type) {
                    case ActionType.XY:
                    case ActionType.Size:
                    case ActionType.Pivot:
                    case ActionType.Scale:
                    case ActionType.Skew:
                        value.b1 = true;
                        value.b2 = true;
                        value.f1 = parseFloat(args[0]);
                        value.f2 = parseFloat(args[1]);
                        break;
                    case ActionType.Alpha:
                        value.f1 = parseFloat(args[0]);
                        break;
                    case ActionType.Rotation:
                        value.f1 = parseFloat(args[0]);
                        break;
                    case ActionType.Color:
                        value.f1 = parseFloat(args[0]);
                        break;
                    case ActionType.Animation:
                        value.frame = parseInt(args[0]);
                        if (args.length > 1)
                            value.playing = args[1];
                        break;
                    case ActionType.Visible:
                        value.visible = args[0];
                        break;
                    case ActionType.Sound:
                        value.sound = args[0];
                        if (args.length > 1)
                            value.volume = parseFloat(args[1]);
                        break;
                    case ActionType.Transition:
                        value.transName = args[0];
                        if (args.length > 1)
                            value.playTimes = parseInt(args[1]);
                        break;
                    case ActionType.Shake:
                        value.amplitude = parseFloat(args[0]);
                        if (args.length > 1)
                            value.duration = parseFloat(args[1]);
                        break;
                    case ActionType.ColorFilter:
                        value.f1 = parseFloat(args[0]);
                        value.f2 = parseFloat(args[1]);
                        value.f3 = parseFloat(args[2]);
                        value.f4 = parseFloat(args[3]);
                        break;
                    case ActionType.Text:
                    case ActionType.Icon:
                        value.text = args[0];
                        break;
                }
            }
        };
        Transition.prototype.setHook = function (label, callback, caller) {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.label == label) {
                    item.hook = callback;
                    item.hookCaller = caller;
                    break;
                }
                else if (item.tweenConfig && item.tweenConfig.endLabel == label) {
                    item.tweenConfig.endHook = callback;
                    item.tweenConfig.endHookCaller = caller;
                    break;
                }
            }
        };
        Transition.prototype.clearHooks = function () {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                item.hook = null;
                item.hookCaller = null;
                if (item.tweenConfig) {
                    item.tweenConfig.endHook = null;
                    item.tweenConfig.endHookCaller = null;
                }
            }
        };
        Transition.prototype.setTarget = function (label, newTarget) {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.label == label) {
                    item.targetId = (newTarget == this._owner || !newTarget) ? "" : newTarget.id;
                    if (this._playing) {
                        if (item.targetId.length > 0)
                            item.target = this._owner.getChildById(item.targetId);
                        else
                            item.target = this._owner;
                    }
                    else
                        item.target = null;
                }
            }
        };
        Transition.prototype.setDuration = function (label, value) {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.tweenConfig && item.label == label)
                    item.tweenConfig.duration = value;
            }
        };
        Transition.prototype.getLabelTime = function (label) {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.label == label)
                    return item.time;
                else if (item.tweenConfig && item.tweenConfig.endLabel == label)
                    return item.time + item.tweenConfig.duration;
            }
            return Number.NaN;
        };
        Object.defineProperty(Transition.prototype, "timeScale", {
            get: function () {
                return this._timeScale;
            },
            set: function (value) {
                if (this._timeScale != value) {
                    this._timeScale = value;
                    if (this._playing) {
                        var cnt = this._items.length;
                        for (var i = 0; i < cnt; i++) {
                            var item = this._items[i];
                            if (item.tweener)
                                item.tweener.setTimeScale(value);
                            else if (item.type == ActionType.Transition) {
                                if (item.value.trans)
                                    item.value.trans.timeScale = value;
                            }
                            else if (item.type == ActionType.Animation) {
                                if (item.target)
                                    item.target.setProp(fgui.ObjectPropID.TimeScale, value);
                            }
                        }
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Transition.prototype.updateFromRelations = function (targetId, dx, dy) {
            var cnt = this._items.length;
            if (cnt == 0)
                return;
            for (var i = 0; i < cnt; i++) {
                var item = this._items[i];
                if (item.type == ActionType.XY && item.targetId == targetId) {
                    if (item.tweenConfig) {
                        item.tweenConfig.startValue.f1 += dx;
                        item.tweenConfig.startValue.f2 += dy;
                        item.tweenConfig.endValue.f1 += dx;
                        item.tweenConfig.endValue.f2 += dy;
                    }
                    else {
                        item.value.f1 += dx;
                        item.value.f2 += dy;
                    }
                }
            }
        };
        Transition.prototype.onOwnerAddedToStage = function () {
            if (this._autoPlay && !this._playing)
                this.play(null, null, null, this._autoPlayTimes, this._autoPlayDelay);
        };
        Transition.prototype.onOwnerRemovedFromStage = function () {
            if ((this._options & OPTION_AUTO_STOP_DISABLED) == 0)
                this.stop((this._options & OPTION_AUTO_STOP_AT_END) != 0 ? true : false, false);
        };
        Transition.prototype.onDelayedPlay = function () {
            this.internalPlay();
            this._playing = this._totalTasks > 0;
            if (this._playing) {
                if ((this._options & OPTION_IGNORE_DISPLAY_CONTROLLER) != 0) {
                    var cnt = this._items.length;
                    for (var i = 0; i < cnt; i++) {
                        var item = this._items[i];
                        if (item.target && item.target != this._owner)
                            item.displayLockToken = item.target.addDisplayLock();
                    }
                }
            }
            else if (this._onComplete != null) {
                var func = this._onComplete;
                var param = this._onCompleteParam;
                var thisObj = this._onCompleteCaller;
                this._onComplete = null;
                this._onCompleteParam = null;
                this._onCompleteCaller = null;
                func.call(thisObj, param);
            }
        };
        Transition.prototype.internalPlay = function () {
            this._ownerBaseX = this._owner.x;
            this._ownerBaseY = this._owner.y;
            this._totalTasks = 0;
            var cnt = this._items.length;
            var item;
            var needSkipAnimations = false;
            var i;
            if (!this._reversed) {
                for (i = 0; i < cnt; i++) {
                    item = this._items[i];
                    if (!item.target)
                        continue;
                    if (item.type == ActionType.Animation && this._startTime != 0 && item.time <= this._startTime) {
                        needSkipAnimations = true;
                        item.value.flag = false;
                    }
                    else
                        this.playItem(item);
                }
            }
            else {
                for (i = cnt - 1; i >= 0; i--) {
                    item = this._items[i];
                    if (!item.target)
                        continue;
                    this.playItem(item);
                }
            }
            if (needSkipAnimations)
                this.skipAnimations();
        };
        Transition.prototype.playItem = function (item) {
            var time;
            if (item.tweenConfig) {
                if (this._reversed)
                    time = (this._totalDuration - item.time - item.tweenConfig.duration);
                else
                    time = item.time;
                if (this._endTime == -1 || time <= this._endTime) {
                    var startValue;
                    var endValue;
                    if (this._reversed) {
                        startValue = item.tweenConfig.endValue;
                        endValue = item.tweenConfig.startValue;
                    }
                    else {
                        startValue = item.tweenConfig.startValue;
                        endValue = item.tweenConfig.endValue;
                    }
                    item.value.b1 = startValue.b1 || endValue.b1;
                    item.value.b2 = startValue.b2 || endValue.b2;
                    switch (item.type) {
                        case ActionType.XY:
                        case ActionType.Size:
                        case ActionType.Scale:
                        case ActionType.Skew:
                            item.tweener = fgui.GTween.to2(startValue.f1, startValue.f2, endValue.f1, endValue.f2, item.tweenConfig.duration);
                            break;
                        case ActionType.Alpha:
                        case ActionType.Rotation:
                            item.tweener = fgui.GTween.to(startValue.f1, endValue.f1, item.tweenConfig.duration);
                            break;
                        case ActionType.Color:
                            item.tweener = fgui.GTween.toColor(startValue.f1, endValue.f1, item.tweenConfig.duration);
                            break;
                        case ActionType.ColorFilter:
                            item.tweener = fgui.GTween.to4(startValue.f1, startValue.f2, startValue.f3, startValue.f4, endValue.f1, endValue.f2, endValue.f3, endValue.f4, item.tweenConfig.duration);
                            break;
                    }
                    item.tweener.setDelay(time)
                        .setEase(item.tweenConfig.easeType)
                        .setRepeat(item.tweenConfig.repeat, item.tweenConfig.yoyo)
                        .setTimeScale(this._timeScale)
                        .setTarget(item)
                        .onStart(this.onTweenStart, this)
                        .onUpdate(this.onTweenUpdate, this)
                        .onComplete(this.onTweenComplete, this);
                    if (this._endTime >= 0)
                        item.tweener.setBreakpoint(this._endTime - time);
                    this._totalTasks++;
                }
            }
            else if (item.type == ActionType.Shake) {
                if (this._reversed)
                    time = (this._totalDuration - item.time - item.value.duration);
                else
                    time = item.time;
                item.value.offsetX = item.value.offsetY = 0;
                item.value.lastOffsetX = item.value.lastOffsetY = 0;
                item.tweener = fgui.GTween.shake(0, 0, item.value.amplitude, item.value.duration)
                    .setDelay(time)
                    .setTimeScale(this._timeScale)
                    .setTarget(item)
                    .onUpdate(this.onTweenUpdate, this)
                    .onComplete(this.onTweenComplete, this);
                if (this._endTime >= 0)
                    item.tweener.setBreakpoint(this._endTime - item.time);
                this._totalTasks++;
            }
            else {
                if (this._reversed)
                    time = (this._totalDuration - item.time);
                else
                    time = item.time;
                if (time <= this._startTime) {
                    this.applyValue(item);
                    this.callHook(item, false);
                }
                else if (this._endTime == -1 || time <= this._endTime) {
                    this._totalTasks++;
                    item.tweener = fgui.GTween.delayedCall(time)
                        .setTimeScale(this._timeScale)
                        .setTarget(item)
                        .onComplete(this.onDelayedPlayItem, this);
                }
            }
            if (item.tweener != null)
                item.tweener.seek(this._startTime);
        };
        Transition.prototype.skipAnimations = function () {
            var frame;
            var playStartTime;
            var playTotalTime;
            var value;
            var target;
            var item;
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                item = this._items[i];
                if (item.type != ActionType.Animation || item.time > this._startTime)
                    continue;
                value = item.value;
                if (value.flag)
                    continue;
                target = item.target;
                frame = target.getProp(fgui.ObjectPropID.Frame);
                playStartTime = target.getProp(fgui.ObjectPropID.Playing) ? 0 : -1;
                playTotalTime = 0;
                for (var j = i; j < cnt; j++) {
                    item = this._items[j];
                    if (item.type != ActionType.Animation || item.target != target || item.time > this._startTime)
                        continue;
                    value = item.value;
                    value.flag = true;
                    if (value.frame != -1) {
                        frame = value.frame;
                        if (value.playing)
                            playStartTime = item.time;
                        else
                            playStartTime = -1;
                        playTotalTime = 0;
                    }
                    else {
                        if (value.playing) {
                            if (playStartTime < 0)
                                playStartTime = item.time;
                        }
                        else {
                            if (playStartTime >= 0)
                                playTotalTime += (item.time - playStartTime);
                            playStartTime = -1;
                        }
                    }
                    this.callHook(item, false);
                }
                if (playStartTime >= 0)
                    playTotalTime += (this._startTime - playStartTime);
                target.setProp(fgui.ObjectPropID.Playing, playStartTime >= 0);
                target.setProp(fgui.ObjectPropID.Frame, frame);
                if (playTotalTime > 0)
                    target.setProp(fgui.ObjectPropID.DeltaTime, playTotalTime * 1000);
            }
        };
        Transition.prototype.onDelayedPlayItem = function (tweener) {
            var item = tweener.target;
            item.tweener = null;
            this._totalTasks--;
            this.applyValue(item);
            this.callHook(item, false);
            this.checkAllComplete();
        };
        Transition.prototype.onTweenStart = function (tweener) {
            var item = tweener.target;
            if (item.type == ActionType.XY || item.type == ActionType.Size) {
                var startValue;
                var endValue;
                if (this._reversed) {
                    startValue = item.tweenConfig.endValue;
                    endValue = item.tweenConfig.startValue;
                }
                else {
                    startValue = item.tweenConfig.startValue;
                    endValue = item.tweenConfig.endValue;
                }
                if (item.type == ActionType.XY) {
                    if (item.target != this._owner) {
                        if (!startValue.b1)
                            tweener.startValue.x = item.target.x;
                        else if (startValue.b3)
                            tweener.startValue.x = startValue.f1 * this._owner.width;
                        if (!startValue.b2)
                            tweener.startValue.y = item.target.y;
                        else if (startValue.b3)
                            tweener.startValue.y = startValue.f2 * this._owner.height;
                        if (!endValue.b1)
                            tweener.endValue.x = tweener.startValue.x;
                        else if (endValue.b3)
                            tweener.endValue.x = endValue.f1 * this._owner.width;
                        if (!endValue.b2)
                            tweener.endValue.y = tweener.startValue.y;
                        else if (endValue.b3)
                            tweener.endValue.y = endValue.f2 * this._owner.height;
                    }
                    else {
                        if (!startValue.b1)
                            tweener.startValue.x = item.target.x - this._ownerBaseX;
                        if (!startValue.b2)
                            tweener.startValue.y = item.target.y - this._ownerBaseY;
                        if (!endValue.b1)
                            tweener.endValue.x = tweener.startValue.x;
                        if (!endValue.b2)
                            tweener.endValue.y = tweener.startValue.y;
                    }
                }
                else {
                    if (!startValue.b1)
                        tweener.startValue.x = item.target.width;
                    if (!startValue.b2)
                        tweener.startValue.y = item.target.height;
                    if (!endValue.b1)
                        tweener.endValue.x = tweener.startValue.x;
                    if (!endValue.b2)
                        tweener.endValue.y = tweener.startValue.y;
                }
                if (item.tweenConfig.path) {
                    item.value.b1 = item.value.b2 = true;
                    tweener.setPath(item.tweenConfig.path);
                }
            }
            this.callHook(item, false);
        };
        Transition.prototype.onTweenUpdate = function (tweener) {
            var item = tweener.target;
            switch (item.type) {
                case ActionType.XY:
                case ActionType.Size:
                case ActionType.Scale:
                case ActionType.Skew:
                    item.value.f1 = tweener.value.x;
                    item.value.f2 = tweener.value.y;
                    if (item.tweenConfig.path) {
                        item.value.f1 += tweener.startValue.x;
                        item.value.f2 += tweener.startValue.y;
                    }
                    break;
                case ActionType.Alpha:
                case ActionType.Rotation:
                    item.value.f1 = tweener.value.x;
                    break;
                case ActionType.Color:
                    item.value.f1 = tweener.value.color;
                    break;
                case ActionType.ColorFilter:
                    item.value.f1 = tweener.value.x;
                    item.value.f2 = tweener.value.y;
                    item.value.f3 = tweener.value.z;
                    item.value.f4 = tweener.value.w;
                    break;
                case ActionType.Shake:
                    item.value.offsetX = tweener.deltaValue.x;
                    item.value.offsetY = tweener.deltaValue.y;
                    break;
            }
            this.applyValue(item);
        };
        Transition.prototype.onTweenComplete = function (tweener) {
            var item = tweener.target;
            item.tweener = null;
            this._totalTasks--;
            if (tweener.allCompleted)
                this.callHook(item, true);
            this.checkAllComplete();
        };
        Transition.prototype.onPlayTransCompleted = function (item) {
            this._totalTasks--;
            this.checkAllComplete();
        };
        Transition.prototype.callHook = function (item, tweenEnd) {
            if (tweenEnd) {
                if (item.tweenConfig && item.tweenConfig.endHook)
                    item.tweenConfig.endHook.call(item.tweenConfig.endHookCaller);
            }
            else {
                if (item.time >= this._startTime && item.hook != null)
                    item.hook.call(item.hookCaller);
            }
        };
        Transition.prototype.checkAllComplete = function () {
            if (this._playing && this._totalTasks == 0) {
                if (this._totalTimes < 0) {
                    this.internalPlay();
                }
                else {
                    this._totalTimes--;
                    if (this._totalTimes > 0)
                        this.internalPlay();
                    else {
                        this._playing = false;
                        var cnt = this._items.length;
                        for (var i = 0; i < cnt; i++) {
                            var item = this._items[i];
                            if (item.target && item.displayLockToken != 0) {
                                item.target.releaseDisplayLock(item.displayLockToken);
                                item.displayLockToken = 0;
                            }
                        }
                        if (this._onComplete != null) {
                            var func = this._onComplete;
                            var param = this._onCompleteParam;
                            var thisObj = this._onCompleteCaller;
                            this._onComplete = null;
                            this._onCompleteParam = null;
                            this._onCompleteCaller = null;
                            func.call(thisObj, param);
                        }
                    }
                }
            }
        };
        Transition.prototype.applyValue = function (item) {
            item.target._gearLocked = true;
            var value = item.value;
            switch (item.type) {
                case ActionType.XY:
                    if (item.target == this._owner) {
                        if (value.b1 && value.b2)
                            item.target.setXY(value.f1 + this._ownerBaseX, value.f2 + this._ownerBaseY);
                        else if (value.b1)
                            item.target.x = value.f1 + this._ownerBaseX;
                        else
                            item.target.y = value.f2 + this._ownerBaseY;
                    }
                    else {
                        if (value.b3) {
                            if (value.b1 && value.b2)
                                item.target.setXY(value.f1 * this._owner.width, value.f2 * this._owner.height);
                            else if (value.b1)
                                item.target.x = value.f1 * this._owner.width;
                            else if (value.b2)
                                item.target.y = value.f2 * this._owner.height;
                        }
                        else {
                            if (value.b1 && value.b2)
                                item.target.setXY(value.f1, value.f2);
                            else if (value.b1)
                                item.target.x = value.f1;
                            else if (value.b2)
                                item.target.y = value.f2;
                        }
                    }
                    break;
                case ActionType.Size:
                    if (!value.b1)
                        value.f1 = item.target.width;
                    if (!value.b2)
                        value.f2 = item.target.height;
                    item.target.setSize(value.f1, value.f2);
                    break;
                case ActionType.Pivot:
                    item.target.setPivot(value.f1, value.f2, item.target.pivotAsAnchor);
                    break;
                case ActionType.Alpha:
                    item.target.alpha = value.f1;
                    break;
                case ActionType.Rotation:
                    item.target.rotation = value.f1;
                    break;
                case ActionType.Scale:
                    item.target.setScale(value.f1, value.f2);
                    break;
                case ActionType.Skew:
                    item.target.setSkew(value.f1, value.f2);
                    break;
                case ActionType.Color:
                    item.target.setProp(fgui.ObjectPropID.Color, value.f1);
                    break;
                case ActionType.Animation:
                    if (value.frame >= 0)
                        item.target.setProp(fgui.ObjectPropID.Frame, value.frame);
                    item.target.setProp(fgui.ObjectPropID.Playing, value.playing);
                    item.target.setProp(fgui.ObjectPropID.TimeScale, this._timeScale);
                    break;
                case ActionType.Visible:
                    item.target.visible = value.visible;
                    break;
                case ActionType.Transition:
                    if (this._playing) {
                        var trans = value.trans;
                        if (trans) {
                            this._totalTasks++;
                            var startTime = this._startTime > item.time ? (this._startTime - item.time) : 0;
                            var endTime = this._endTime >= 0 ? (this._endTime - item.time) : -1;
                            if (value.stopTime >= 0 && (endTime < 0 || endTime > value.stopTime))
                                endTime = value.stopTime;
                            trans.timeScale = this._timeScale;
                            trans._play(this.onPlayTransCompleted, this, item, value.playTimes, 0, startTime, endTime, this._reversed);
                        }
                    }
                    break;
                case ActionType.Sound:
                    if (this._playing && item.time >= this._startTime) {
                        if (!value.audioClip) {
                            var pi = fgui.UIPackage.getItemByURL(value.sound);
                            if (pi)
                                value.audioClip = pi.owner.getItemAsset(pi);
                        }
                        if (value.audioClip)
                            fgui.GRoot.inst.playOneShotSound(value.audioClip, value.volume);
                    }
                    break;
                case ActionType.Shake:
                    item.target.setXY(item.target.x - value.lastOffsetX + value.offsetX, item.target.y - value.lastOffsetY + value.offsetY);
                    value.lastOffsetX = value.offsetX;
                    value.lastOffsetY = value.offsetY;
                    break;
                case ActionType.ColorFilter:
                    {
                        fgui.ToolSet.setColorFilter(item.target.displayObject, [value.f1, value.f2, value.f3, value.f4]);
                        break;
                    }
                case ActionType.Text:
                    item.target.text = value.text;
                    break;
                case ActionType.Icon:
                    item.target.icon = value.text;
                    break;
            }
            item.target._gearLocked = false;
        };
        Transition.prototype.setup = function (buffer) {
            this.name = buffer.readS();
            this._options = buffer.readInt();
            this._autoPlay = buffer.readBool();
            this._autoPlayTimes = buffer.readInt();
            this._autoPlayDelay = buffer.readFloat();
            var cnt = buffer.readShort();
            for (var i = 0; i < cnt; i++) {
                var dataLen = buffer.readShort();
                var curPos = buffer.position;
                buffer.seek(curPos, 0);
                var item = new Item(buffer.readByte());
                this._items[i] = item;
                item.time = buffer.readFloat();
                var targetId = buffer.readShort();
                if (targetId < 0)
                    item.targetId = "";
                else
                    item.targetId = this._owner.getChildAt(targetId).id;
                item.label = buffer.readS();
                if (buffer.readBool()) {
                    buffer.seek(curPos, 1);
                    item.tweenConfig = new TweenConfig();
                    item.tweenConfig.duration = buffer.readFloat();
                    if (item.time + item.tweenConfig.duration > this._totalDuration)
                        this._totalDuration = item.time + item.tweenConfig.duration;
                    item.tweenConfig.easeType = buffer.readByte();
                    item.tweenConfig.repeat = buffer.readInt();
                    item.tweenConfig.yoyo = buffer.readBool();
                    item.tweenConfig.endLabel = buffer.readS();
                    buffer.seek(curPos, 2);
                    this.decodeValue(item, buffer, item.tweenConfig.startValue);
                    buffer.seek(curPos, 3);
                    this.decodeValue(item, buffer, item.tweenConfig.endValue);
                    if (buffer.version >= 2) {
                        var pathLen = buffer.readInt();
                        if (pathLen > 0) {
                            item.tweenConfig.path = new fgui.GPath();
                            var pts = new Array();
                            for (var j = 0; j < pathLen; j++) {
                                var curveType = buffer.readByte();
                                switch (curveType) {
                                    case fgui.CurveType.Bezier:
                                        pts.push(fgui.GPathPoint.newBezierPoint(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat()));
                                        break;
                                    case fgui.CurveType.CubicBezier:
                                        pts.push(fgui.GPathPoint.newCubicBezierPoint(buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat()));
                                        break;
                                    default:
                                        pts.push(fgui.GPathPoint.newPoint(buffer.readFloat(), buffer.readFloat(), curveType));
                                        break;
                                }
                            }
                            item.tweenConfig.path.create(pts);
                        }
                    }
                }
                else {
                    if (item.time > this._totalDuration)
                        this._totalDuration = item.time;
                    buffer.seek(curPos, 2);
                    this.decodeValue(item, buffer, item.value);
                }
                buffer.position = curPos + dataLen;
            }
        };
        Transition.prototype.decodeValue = function (item, buffer, value) {
            switch (item.type) {
                case ActionType.XY:
                case ActionType.Size:
                case ActionType.Pivot:
                case ActionType.Skew:
                    value.b1 = buffer.readBool();
                    value.b2 = buffer.readBool();
                    value.f1 = buffer.readFloat();
                    value.f2 = buffer.readFloat();
                    if (buffer.version >= 2 && item.type == ActionType.XY)
                        value.b3 = buffer.readBool();
                    break;
                case ActionType.Alpha:
                case ActionType.Rotation:
                    value.f1 = buffer.readFloat();
                    break;
                case ActionType.Scale:
                    value.f1 = buffer.readFloat();
                    value.f2 = buffer.readFloat();
                    break;
                case ActionType.Color:
                    value.f1 = buffer.readColor();
                    break;
                case ActionType.Animation:
                    value.playing = buffer.readBool();
                    value.frame = buffer.readInt();
                    break;
                case ActionType.Visible:
                    value.visible = buffer.readBool();
                    break;
                case ActionType.Sound:
                    value.sound = buffer.readS();
                    value.volume = buffer.readFloat();
                    break;
                case ActionType.Transition:
                    value.transName = buffer.readS();
                    value.playTimes = buffer.readInt();
                    break;
                case ActionType.Shake:
                    value.amplitude = buffer.readFloat();
                    value.duration = buffer.readFloat();
                    break;
                case ActionType.ColorFilter:
                    value.f1 = buffer.readFloat();
                    value.f2 = buffer.readFloat();
                    value.f3 = buffer.readFloat();
                    value.f4 = buffer.readFloat();
                    break;
                case ActionType.Text:
                case ActionType.Icon:
                    value.text = buffer.readS();
                    break;
            }
        };
        return Transition;
    }());
    fgui.Transition = Transition;
    var OPTION_IGNORE_DISPLAY_CONTROLLER = 1;
    var OPTION_AUTO_STOP_DISABLED = 2;
    var OPTION_AUTO_STOP_AT_END = 4;
    var ActionType = (function () {
        function ActionType() {
        }
        ActionType.XY = 0;
        ActionType.Size = 1;
        ActionType.Scale = 2;
        ActionType.Pivot = 3;
        ActionType.Alpha = 4;
        ActionType.Rotation = 5;
        ActionType.Color = 6;
        ActionType.Animation = 7;
        ActionType.Visible = 8;
        ActionType.Sound = 9;
        ActionType.Transition = 10;
        ActionType.Shake = 11;
        ActionType.ColorFilter = 12;
        ActionType.Skew = 13;
        ActionType.Text = 14;
        ActionType.Icon = 15;
        ActionType.Unknown = 16;
        return ActionType;
    }());
    var Item = (function () {
        function Item(type) {
            this.type = type;
            this.value = {};
            this.displayLockToken = 0;
        }
        return Item;
    }());
    var TweenConfig = (function () {
        function TweenConfig() {
            this.duration = 0;
            this.repeat = 0;
            this.easeType = fgui.EaseType.QuadOut;
            this.startValue = { b1: true, b2: true };
            this.endValue = { b1: true, b2: true };
        }
        return TweenConfig;
    }());
})(fgui || (fgui = {}));

(function (fgui) {
    var TranslationHelper = (function () {
        function TranslationHelper() {
        }
        TranslationHelper.loadFromXML = function (source) {
            var strings = {};
            TranslationHelper.strings = strings;
            var xml = egret.XML.parse(source);
            var nodes = xml.children;
            var length1 = nodes.length;
            for (var i1 = 0; i1 < length1; i1++) {
                var cxml = nodes[i1];
                if (cxml.name == "string") {
                    var key = cxml.attributes.name;
                    var text = cxml.children.length > 0 ? cxml.children[0].text : "";
                    var i = key.indexOf("-");
                    if (i == -1)
                        continue;
                    var key2 = key.substr(0, i);
                    var key3 = key.substr(i + 1);
                    var col = strings[key2];
                    if (!col) {
                        col = {};
                        strings[key2] = col;
                    }
                    col[key3] = text;
                }
            }
        };
        TranslationHelper.translateComponent = function (item) {
            if (TranslationHelper.strings == null)
                return;
            var compStrings = TranslationHelper.strings[item.owner.id + item.id];
            if (compStrings == null)
                return;
            var elementId, value;
            var buffer = item.rawData;
            var nextPos;
            var itemCount;
            var i, j, k;
            var dataLen;
            var curPos;
            var valueCnt;
            var page;
            buffer.seek(0, 2);
            var childCount = buffer.readShort();
            for (i = 0; i < childCount; i++) {
                dataLen = buffer.readShort();
                curPos = buffer.position;
                buffer.seek(curPos, 0);
                var baseType = buffer.readByte();
                var type = baseType;
                buffer.skip(4);
                elementId = buffer.readS();
                if (type == fgui.ObjectType.Component) {
                    if (buffer.seek(curPos, 6))
                        type = buffer.readByte();
                }
                buffer.seek(curPos, 1);
                if ((value = compStrings[elementId + "-tips"]) != null)
                    buffer.writeS(value);
                buffer.seek(curPos, 2);
                var gearCnt = buffer.readShort();
                for (j = 0; j < gearCnt; j++) {
                    nextPos = buffer.readShort();
                    nextPos += buffer.position;
                    if (buffer.readByte() == 6) {
                        buffer.skip(2);
                        valueCnt = buffer.readShort();
                        for (k = 0; k < valueCnt; k++) {
                            page = buffer.readS();
                            if (page != null) {
                                if ((value = compStrings[elementId + "-texts_" + k]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                            }
                        }
                        if (buffer.readBool() && (value = compStrings[elementId + "-texts_def"]) != null)
                            buffer.writeS(value);
                    }
                    if (baseType == fgui.ObjectType.Component && buffer.version >= 2) {
                        buffer.seek(curPos, 4);
                        buffer.skip(2);
                        buffer.skip(4 * buffer.readShort());
                        var cpCount = buffer.readShort();
                        for (var k = 0; k < cpCount; k++) {
                            var target = buffer.readS();
                            var propertyId = buffer.readShort();
                            if (propertyId == 0 && (value = compStrings[elementId + "-cp-" + target]) != null)
                                buffer.writeS(value);
                            else
                                buffer.skip(2);
                        }
                    }
                    buffer.position = nextPos;
                }
                switch (type) {
                    case fgui.ObjectType.Text:
                    case fgui.ObjectType.RichText:
                    case fgui.ObjectType.InputText:
                        {
                            if ((value = compStrings[elementId]) != null) {
                                buffer.seek(curPos, 6);
                                buffer.writeS(value);
                            }
                            if ((value = compStrings[elementId + "-prompt"]) != null) {
                                buffer.seek(curPos, 4);
                                buffer.writeS(value);
                            }
                            break;
                        }
                    case fgui.ObjectType.List:
                    case fgui.ObjectType.Tree:
                        {
                            buffer.seek(curPos, 8);
                            buffer.skip(2);
                            itemCount = buffer.readShort();
                            for (j = 0; j < itemCount; j++) {
                                nextPos = buffer.readShort();
                                nextPos += buffer.position;
                                buffer.skip(2);
                                if (type == fgui.ObjectType.Tree)
                                    buffer.skip(2);
                                if ((value = compStrings[elementId + "-" + j]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                if ((value = compStrings[elementId + "-" + j + "-0"]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                if (buffer.version >= 2) {
                                    buffer.skip(6);
                                    buffer.skip(buffer.readUnsignedShort() * 4);
                                    var cpCount = buffer.readUnsignedShort();
                                    for (var k = 0; k < cpCount; k++) {
                                        var target = buffer.readS();
                                        var propertyId = buffer.readUnsignedShort();
                                        if (propertyId == 0 && (value = compStrings[elementId + "-" + j + "-" + target]) != null)
                                            buffer.writeS(value);
                                        else
                                            buffer.skip(2);
                                    }
                                }
                                buffer.position = nextPos;
                            }
                            break;
                        }
                    case fgui.ObjectType.Label:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                buffer.skip(2);
                                if (buffer.readBool())
                                    buffer.skip(4);
                                buffer.skip(4);
                                if (buffer.readBool() && (value = compStrings[elementId + "-prompt"]) != null)
                                    buffer.writeS(value);
                            }
                            break;
                        }
                    case fgui.ObjectType.Button:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                                else
                                    buffer.skip(2);
                                if ((value = compStrings[elementId + "-0"]) != null)
                                    buffer.writeS(value);
                            }
                            break;
                        }
                    case fgui.ObjectType.ComboBox:
                        {
                            if (buffer.seek(curPos, 6) && buffer.readByte() == type) {
                                itemCount = buffer.readShort();
                                for (j = 0; j < itemCount; j++) {
                                    nextPos = buffer.readShort();
                                    nextPos += buffer.position;
                                    if ((value = compStrings[elementId + "-" + j]) != null)
                                        buffer.writeS(value);
                                    buffer.position = nextPos;
                                }
                                if ((value = compStrings[elementId]) != null)
                                    buffer.writeS(value);
                            }
                            break;
                        }
                }
                buffer.position = curPos + dataLen;
            }
        };
        return TranslationHelper;
    }());
    fgui.TranslationHelper = TranslationHelper;
})(fgui || (fgui = {}));

(function (fgui) {
    var UIConfig = (function () {
        function UIConfig() {
        }
        UIConfig.defaultFont = "SimSun";
        UIConfig.modalLayerColor = 0x333333;
        UIConfig.modalLayerAlpha = 0.2;
        UIConfig.buttonSoundVolumeScale = 1;
        UIConfig.defaultScrollStep = 25;
        UIConfig.defaultScrollDecelerationRate = 0.967;
        UIConfig.defaultScrollBarDisplay = fgui.ScrollBarDisplayType.Visible;
        UIConfig.defaultScrollTouchEffect = true;
        UIConfig.defaultScrollBounceEffect = true;
        UIConfig.defaultComboBoxVisibleItemCount = 10;
        UIConfig.touchScrollSensitivity = 20;
        UIConfig.touchDragSensitivity = 10;
        UIConfig.clickDragSensitivity = 2;
        UIConfig.bringWindowToFrontOnClick = true;
        UIConfig.frameTimeForAsyncUIConstruction = 2;
        return UIConfig;
    }());
    fgui.UIConfig = UIConfig;
})(fgui || (fgui = {}));

(function (fgui) {
    var UIObjectFactory = (function () {
        function UIObjectFactory() {
        }
        UIObjectFactory.setExtension = function (url, type) {
            if (url == null)
                throw "Invaild url: " + url;
            var pi = fgui.UIPackage.getItemByURL(url);
            if (pi)
                pi.extensionType = type;
            UIObjectFactory.extensions[url] = type;
        };
        UIObjectFactory.setPackageItemExtension = function (url, type) {
            UIObjectFactory.setExtension(url, type);
        };
        UIObjectFactory.setLoaderExtension = function (type) {
            UIObjectFactory.loaderType = type;
        };
        UIObjectFactory.resolvePackageItemExtension = function (pi) {
            var extensionType = UIObjectFactory.extensions["ui://" + pi.owner.id + pi.id];
            if (!extensionType)
                extensionType = UIObjectFactory.extensions["ui://" + pi.owner.name + "/" + pi.name];
            if (extensionType)
                pi.extensionType = extensionType;
        };
        UIObjectFactory.newObject = function (type, userClass) {
            var obj;
            if (typeof type === 'number') {
                switch (type) {
                    case fgui.ObjectType.Image:
                        return new fgui.GImage();
                    case fgui.ObjectType.MovieClip:
                        return new fgui.GMovieClip();
                    case fgui.ObjectType.Component:
                        return new fgui.GComponent();
                    case fgui.ObjectType.Text:
                        return new fgui.GTextField();
                    case fgui.ObjectType.RichText:
                        return new fgui.GRichTextField();
                    case fgui.ObjectType.InputText:
                        return new fgui.GTextInput();
                    case fgui.ObjectType.Group:
                        return new fgui.GGroup();
                    case fgui.ObjectType.List:
                        return new fgui.GList();
                    case fgui.ObjectType.Graph:
                        return new fgui.GGraph();
                    case fgui.ObjectType.Loader:
                        if (UIObjectFactory.loaderType)
                            return new UIObjectFactory.loaderType();
                        else
                            return new fgui.GLoader();
                    case fgui.ObjectType.Button:
                        return new fgui.GButton();
                    case fgui.ObjectType.Label:
                        return new fgui.GLabel();
                    case fgui.ObjectType.ProgressBar:
                        return new fgui.GProgressBar();
                    case fgui.ObjectType.Slider:
                        return new fgui.GSlider();
                    case fgui.ObjectType.ScrollBar:
                        return new fgui.GScrollBar();
                    case fgui.ObjectType.ComboBox:
                        return new fgui.GComboBox();
                    case fgui.ObjectType.Tree:
                        return new fgui.GTree();
                    case fgui.ObjectType.Loader3D:
                        return new fgui.GLoader3D();
                    default:
                        return null;
                }
            }
            else {
                if (type.type == fgui.PackageItemType.Component) {
                    if (userClass)
                        obj = new userClass();
                    else if (type.extensionType)
                        obj = new type.extensionType();
                    else
                        obj = UIObjectFactory.newObject(type.objectType);
                }
                else
                    obj = UIObjectFactory.newObject(type.objectType);
                if (obj)
                    obj.packageItem = type;
            }
            return obj;
        };
        UIObjectFactory.extensions = {};
        return UIObjectFactory;
    }());
    fgui.UIObjectFactory = UIObjectFactory;
})(fgui || (fgui = {}));

(function (fgui) {
    var UIPackage = (function () {
        function UIPackage() {
            this._items = [];
            this._itemsById = {};
            this._itemsByName = {};
            this._sprites = {};
            this._dependencies = [];
            this._branches = [];
            this._branchIndex = -1;
        }
        Object.defineProperty(UIPackage, "branch", {
            get: function () {
                return UIPackage._branch;
            },
            set: function (value) {
                UIPackage._branch = value;
                for (var pkgId in UIPackage._instById) {
                    var pkg = UIPackage._instById[pkgId];
                    if (pkg._branches) {
                        pkg._branchIndex = pkg._branches.indexOf(value);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        UIPackage.getVar = function (key) {
            return UIPackage._vars[key];
        };
        UIPackage.setVar = function (key, value) {
            UIPackage._vars[key] = value;
        };
        UIPackage.getById = function (id) {
            return UIPackage._instById[id];
        };
        UIPackage.getByName = function (name) {
            return UIPackage._instByName[name];
        };
        UIPackage.loadPackage = function (resKey) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                            var pkg, asset, cnt, tasks, i, pi;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        pkg = UIPackage._instById[resKey];
                                        if (pkg) {
                                            resolve(pkg);
                                            return [2];
                                        }
                                        return [4, RES.getResAsync(getAssetResKey(resKey, "fui"))];
                                    case 1:
                                        asset = _a.sent();
                                        pkg = new UIPackage();
                                        pkg._resKey = resKey;
                                        pkg.loadPackage(new fgui.ByteBuffer(asset));
                                        cnt = pkg._items.length;
                                        tasks = [];
                                        for (i = 0; i < cnt; i++) {
                                            pi = pkg._items[i];
                                            if (pi.type == fgui.PackageItemType.Atlas || pi.type == fgui.PackageItemType.Sound) {
                                                tasks.push(RES.getResAsync(pi.file));
                                            }
                                        }
                                        if (!(tasks.length > 0)) return [3, 3];
                                        return [4, Promise.all(tasks)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        UIPackage._instById[pkg.id] = pkg;
                                        UIPackage._instByName[pkg.name] = pkg;
                                        UIPackage._instById[pkg._resKey] = pkg;
                                        resolve(pkg);
                                        return [2];
                                }
                            });
                        }); })];
                });
            });
        };
        UIPackage.addPackage = function (resKey, descData) {
            if (!descData) {
                descData = RES.getRes(resKey);
                if (!descData)
                    throw "Resource '" + resKey + "' not found, please check default.res.json!";
            }
            var pkg = new UIPackage();
            pkg._resKey = resKey;
            pkg.loadPackage(new fgui.ByteBuffer(descData));
            UIPackage._instById[pkg.id] = pkg;
            UIPackage._instByName[pkg.name] = pkg;
            UIPackage._instById[resKey] = pkg;
            return pkg;
        };
        UIPackage.removePackage = function (packageIdOrName) {
            var pkg = UIPackage._instById[packageIdOrName];
            if (!pkg)
                pkg = UIPackage._instByName[packageIdOrName];
            if (!pkg)
                throw new Error("unknown package: " + packageIdOrName);
            pkg.dispose();
            delete UIPackage._instById[pkg.id];
            delete UIPackage._instByName[pkg.name];
            delete UIPackage._instById[pkg._resKey];
            if (pkg._customId != null)
                delete UIPackage._instById[pkg._customId];
        };
        UIPackage.createObject = function (pkgName, resName, userClass) {
            var pkg = UIPackage.getByName(pkgName);
            if (pkg)
                return pkg.createObject(resName, userClass);
            else
                return null;
        };
        UIPackage.createObjectFromURL = function (url, userClass) {
            var pi = UIPackage.getItemByURL(url);
            if (pi)
                return pi.owner.internalCreateObject(pi, userClass);
            else
                return null;
        };
        UIPackage.getItemURL = function (pkgName, resName) {
            var pkg = UIPackage.getByName(pkgName);
            if (!pkg)
                return null;
            var pi = pkg._itemsByName[resName];
            if (!pi)
                return null;
            return "ui://" + pkg.id + pi.id;
        };
        UIPackage.getItemByURL = function (url) {
            var pos1 = url.indexOf("//");
            if (pos1 == -1)
                return null;
            var pos2 = url.indexOf("/", pos1 + 2);
            if (pos2 == -1) {
                if (url.length > 13) {
                    var pkgId = url.substr(5, 8);
                    var pkg = UIPackage.getById(pkgId);
                    if (pkg != null) {
                        var srcId = url.substr(13);
                        return pkg.getItemById(srcId);
                    }
                }
            }
            else {
                var pkgName = url.substr(pos1 + 2, pos2 - pos1 - 2);
                pkg = UIPackage.getByName(pkgName);
                if (pkg != null) {
                    var srcName = url.substr(pos2 + 1);
                    return pkg.getItemByName(srcName);
                }
            }
            return null;
        };
        UIPackage.normalizeURL = function (url) {
            if (url == null)
                return null;
            var pos1 = url.indexOf("//");
            if (pos1 == -1)
                return null;
            var pos2 = url.indexOf("/", pos1 + 2);
            if (pos2 == -1)
                return url;
            var pkgName = url.substr(pos1 + 2, pos2 - pos1 - 2);
            var srcName = url.substr(pos2 + 1);
            return UIPackage.getItemURL(pkgName, srcName);
        };
        UIPackage.setStringsSource = function (source) {
            fgui.TranslationHelper.loadFromXML(source);
        };
        UIPackage.prototype.loadPackage = function (buffer) {
            if (buffer.readUnsignedInt() != 0x46475549)
                throw "FairyGUI: old package format found in '" + this._resKey + "'";
            buffer.version = buffer.readInt();
            var compressed = buffer.readBool();
            this._id = buffer.readUTF();
            this._name = buffer.readUTF();
            buffer.skip(20);
            if (compressed) {
                var buf = new Uint8Array(buffer.buffer, buffer.position, buffer.length - buffer.position);
                var inflater = new Zlib.RawInflate(buf);
                var buffer2 = new fgui.ByteBuffer(inflater.decompress());
                buffer2.version = buffer.version;
                buffer = buffer2;
            }
            var ver2 = buffer.version >= 2;
            var indexTablePos = buffer.position;
            var cnt;
            var i;
            var nextPos;
            var str;
            var branchIncluded;
            buffer.seek(indexTablePos, 4);
            cnt = buffer.readInt();
            var stringTable = new Array(cnt);
            stringTable.reduceRight;
            for (i = 0; i < cnt; i++)
                stringTable[i] = buffer.readUTF();
            buffer.stringTable = stringTable;
            buffer.seek(indexTablePos, 0);
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++)
                this._dependencies.push({ id: buffer.readS(), name: buffer.readS() });
            if (ver2) {
                cnt = buffer.readShort();
                if (cnt > 0) {
                    this._branches = buffer.readSArray(cnt);
                    if (UIPackage._branch)
                        this._branchIndex = this._branches.indexOf(UIPackage._branch);
                }
                branchIncluded = cnt > 0;
            }
            buffer.seek(indexTablePos, 1);
            var pi;
            var path = this._resKey;
            var pos = path.lastIndexOf('/');
            var shortPath = pos == -1 ? "" : path.substr(0, pos + 1);
            path = path + "_";
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                nextPos = buffer.readInt();
                nextPos += buffer.position;
                pi = new fgui.PackageItem();
                pi.owner = this;
                pi.type = buffer.readByte();
                pi.id = buffer.readS();
                pi.name = buffer.readS();
                buffer.readS();
                pi.file = buffer.readS();
                buffer.readBool();
                pi.width = buffer.readInt();
                pi.height = buffer.readInt();
                switch (pi.type) {
                    case fgui.PackageItemType.Image:
                        {
                            pi.objectType = fgui.ObjectType.Image;
                            var scaleOption = buffer.readByte();
                            if (scaleOption == 1) {
                                pi.scale9Grid = new egret.Rectangle();
                                pi.scale9Grid.x = buffer.readInt();
                                pi.scale9Grid.y = buffer.readInt();
                                pi.scale9Grid.width = buffer.readInt();
                                pi.scale9Grid.height = buffer.readInt();
                                pi.tileGridIndice = buffer.readInt();
                            }
                            else if (scaleOption == 2)
                                pi.scaleByTile = true;
                            pi.smoothing = buffer.readBool();
                            break;
                        }
                    case fgui.PackageItemType.MovieClip:
                        {
                            pi.smoothing = buffer.readBool();
                            pi.objectType = fgui.ObjectType.MovieClip;
                            pi.rawData = buffer.readBuffer();
                            break;
                        }
                    case fgui.PackageItemType.Font:
                        {
                            pi.rawData = buffer.readBuffer();
                            break;
                        }
                    case fgui.PackageItemType.Component:
                        {
                            var extension = buffer.readByte();
                            if (extension > 0)
                                pi.objectType = extension;
                            else
                                pi.objectType = fgui.ObjectType.Component;
                            pi.rawData = buffer.readBuffer();
                            fgui.UIObjectFactory.resolvePackageItemExtension(pi);
                            break;
                        }
                    case fgui.PackageItemType.Atlas:
                    case fgui.PackageItemType.Sound:
                    case fgui.PackageItemType.Misc:
                        {
                            var pos_1 = pi.file.lastIndexOf(".");
                            pi.file = path + (pos_1 == -1 ? pi.file : getAssetResKey(pi.file.substring(0, pos_1), pi.file.substring(pos_1 + 1)));
                            break;
                        }
                    case fgui.PackageItemType.Spine:
                    case fgui.PackageItemType.DragonBones:
                        {
                            var pos_2 = pi.file.lastIndexOf(".");
                            pi.file = shortPath + (pos_2 == -1 ? pi.file : pi.file.substring(0, pos_2));
                            pi.skeletonAnchor = new egret.Point();
                            pi.skeletonAnchor.x = buffer.readFloat();
                            pi.skeletonAnchor.y = buffer.readFloat();
                            break;
                        }
                }
                if (ver2) {
                    str = buffer.readS();
                    if (str)
                        pi.name = str + "/" + pi.name;
                    var branchCnt = buffer.readUnsignedByte();
                    if (branchCnt > 0) {
                        if (branchIncluded)
                            pi.branches = buffer.readSArray(branchCnt);
                        else
                            this._itemsById[buffer.readS()] = pi;
                    }
                    var highResCnt = buffer.readUnsignedByte();
                    if (highResCnt > 0)
                        pi.highResolution = buffer.readSArray(highResCnt);
                }
                this._items.push(pi);
                this._itemsById[pi.id] = pi;
                if (pi.name != null)
                    this._itemsByName[pi.name] = pi;
                buffer.position = nextPos;
            }
            buffer.seek(indexTablePos, 2);
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                nextPos = buffer.readShort();
                nextPos += buffer.position;
                var itemId = buffer.readS();
                pi = this._itemsById[buffer.readS()];
                var sprite = { atlas: pi, rect: new egret.Rectangle(), offset: new egret.Point(), originalSize: new egret.Point() };
                sprite.rect.x = buffer.readInt();
                sprite.rect.y = buffer.readInt();
                sprite.rect.width = buffer.readInt();
                sprite.rect.height = buffer.readInt();
                sprite.rotated = buffer.readBool();
                if (ver2 && buffer.readBool()) {
                    sprite.offset.x = buffer.readInt();
                    sprite.offset.y = buffer.readInt();
                    sprite.originalSize.x = buffer.readInt();
                    sprite.originalSize.y = buffer.readInt();
                }
                else {
                    sprite.originalSize.x = sprite.rect.width;
                    sprite.originalSize.y = sprite.rect.height;
                }
                this._sprites[itemId] = sprite;
                buffer.position = nextPos;
            }
            if (buffer.seek(indexTablePos, 3)) {
                cnt = buffer.readShort();
                for (i = 0; i < cnt; i++) {
                    nextPos = buffer.readInt();
                    nextPos += buffer.position;
                    pi = this._itemsById[buffer.readS()];
                    if (pi && pi.type == fgui.PackageItemType.Image) {
                        pi.pixelHitTestData = new fgui.PixelHitTestData();
                        pi.pixelHitTestData.load(buffer);
                    }
                    buffer.position = nextPos;
                }
            }
        };
        UIPackage.prototype.dispose = function () {
            var cnt = this._items.length;
            for (var i = 0; i < cnt; i++) {
                var pi = this._items[i];
                if (pi.type == fgui.PackageItemType.Atlas) {
                    RES.destroyRes(pi.file, false);
                }
                else if (pi.type == fgui.PackageItemType.Sound) {
                }
            }
        };
        Object.defineProperty(UIPackage.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIPackage.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIPackage.prototype, "customId", {
            get: function () {
                return this._customId;
            },
            set: function (value) {
                if (this._customId != null)
                    delete UIPackage._instById[this._customId];
                this._customId = value;
                if (this._customId != null)
                    UIPackage._instById[this._customId] = this;
            },
            enumerable: true,
            configurable: true
        });
        UIPackage.prototype.createObject = function (resName, userClass) {
            var pi = this._itemsByName[resName];
            if (pi)
                return this.internalCreateObject(pi, userClass);
            else
                return null;
        };
        UIPackage.prototype.internalCreateObject = function (item, userClass) {
            var g = fgui.UIObjectFactory.newObject(item, userClass);
            if (g == null)
                return null;
            UIPackage._constructing++;
            g.constructFromResource();
            UIPackage._constructing--;
            return g;
        };
        UIPackage.prototype.getItemById = function (itemId) {
            return this._itemsById[itemId];
        };
        UIPackage.prototype.getItemByName = function (resName) {
            return this._itemsByName[resName];
        };
        UIPackage.prototype.getItemAssetByName = function (resName) {
            var pi = this._itemsByName[resName];
            if (pi == null) {
                throw "Resource not found -" + resName;
            }
            return this.getItemAsset(pi);
        };
        UIPackage.prototype.getItemAsset = function (item) {
            switch (item.type) {
                case fgui.PackageItemType.Image:
                    if (!item.decoded) {
                        item.decoded = true;
                        var sprite = this._sprites[item.id];
                        if (sprite) {
                            var atlas = this.getItemAsset(sprite.atlas);
                            item.asset = new egret.Texture();
                            item.asset.bitmapData = atlas.bitmapData;
                            item.asset.$initData(atlas.$bitmapX + sprite.rect.x, atlas.$bitmapY + sprite.rect.y, sprite.rect.width, sprite.rect.height, sprite.offset.x, sprite.offset.y, sprite.originalSize.x, sprite.originalSize.y, atlas.$sourceWidth, atlas.$sourceHeight, sprite.rotated);
                        }
                    }
                    return item.asset;
                case fgui.PackageItemType.Atlas:
                case fgui.PackageItemType.Sound:
                    if (!item.decoded) {
                        item.decoded = true;
                        item.asset = RES.getRes(item.file);
                        if (!item.asset)
                            console.log("Resource '" + item.file + "' not found, please check default.res.json!");
                    }
                    return item.asset;
                case fgui.PackageItemType.Font:
                    if (!item.decoded) {
                        item.decoded = true;
                        this.loadFont(item);
                    }
                    return item.bitmapFont;
                case fgui.PackageItemType.MovieClip:
                    if (!item.decoded) {
                        item.decoded = true;
                        this.loadMovieClip(item);
                    }
                    return item.frames;
                case fgui.PackageItemType.Misc:
                    if (item.file)
                        return RES.getRes(item.file);
                    else
                        return null;
                default:
                    return null;
            }
        };
        UIPackage.prototype.getItemAssetAsync = function (item, onComplete) {
            if (item.decoded) {
                onComplete(null, item);
                return;
            }
            if (item.loading) {
                item.loading.push(onComplete);
                return;
            }
            switch (item.type) {
                case fgui.PackageItemType.DragonBones:
                    item.loading = [onComplete];
                    this.loadDragonBones(item);
                    break;
                default:
                    this.getItemAsset(item);
                    onComplete(null, item);
                    break;
            }
        };
        UIPackage.prototype.loadMovieClip = function (item) {
            var buffer = item.rawData;
            buffer.seek(0, 0);
            item.interval = buffer.readInt();
            item.swing = buffer.readBool();
            item.repeatDelay = buffer.readInt();
            buffer.seek(0, 1);
            var frameCount = buffer.readShort();
            item.frames = Array(frameCount);
            var spriteId;
            var sprite;
            var fx;
            var fy;
            for (var i = 0; i < frameCount; i++) {
                var nextPos = buffer.readShort();
                nextPos += buffer.position;
                var frame = {};
                fx = buffer.readInt();
                fy = buffer.readInt();
                buffer.readInt();
                buffer.readInt();
                frame.addDelay = buffer.readInt();
                spriteId = buffer.readS();
                if (spriteId != null && (sprite = this._sprites[spriteId]) != null) {
                    var atlas = this.getItemAsset(sprite.atlas);
                    frame.texture = new egret.Texture();
                    frame.texture.bitmapData = atlas.bitmapData;
                    frame.texture.$initData(atlas.$bitmapX + sprite.rect.x, atlas.$bitmapY + sprite.rect.y, sprite.rect.width, sprite.rect.height, fx, fy, item.width, item.height, atlas.$sourceWidth, atlas.$sourceHeight, sprite.rotated);
                }
                item.frames[i] = frame;
                buffer.position = nextPos;
            }
        };
        UIPackage.prototype.loadFont = function (item) {
            var font = new fgui.BitmapFont();
            item.bitmapFont = font;
            var buffer = item.rawData;
            buffer.seek(0, 0);
            font.ttf = buffer.readBool();
            font.tint = buffer.readBool();
            font.resizable = buffer.readBool();
            buffer.readBool();
            font.size = buffer.readInt();
            var xadvance = buffer.readInt();
            var lineHeight = buffer.readInt();
            var mainTexture;
            var mainSprite = this._sprites[item.id];
            if (mainSprite)
                mainTexture = (this.getItemAsset(mainSprite.atlas));
            buffer.seek(0, 1);
            var bg;
            var cnt = buffer.readInt();
            for (var i = 0; i < cnt; i++) {
                var nextPos = buffer.readShort();
                nextPos += buffer.position;
                bg = {};
                var ch = buffer.readChar();
                font.glyphs[ch] = bg;
                var img = buffer.readS();
                var bx = buffer.readInt();
                var by = buffer.readInt();
                bg.x = buffer.readInt();
                bg.y = buffer.readInt();
                bg.width = buffer.readInt();
                bg.height = buffer.readInt();
                bg.advance = buffer.readInt();
                bg.channel = buffer.readByte();
                if (bg.channel == 1)
                    bg.channel = 3;
                else if (bg.channel == 2)
                    bg.channel = 2;
                else if (bg.channel == 3)
                    bg.channel = 1;
                if (font.ttf) {
                    bg.texture = new egret.Texture();
                    bg.texture.bitmapData = mainTexture.bitmapData;
                    bg.texture.$initData(mainTexture.$bitmapX + bx + mainSprite.rect.x, mainTexture.$bitmapY + by + mainSprite.rect.y, bg.width, bg.height, mainSprite.offset.x, mainSprite.offset.y, mainSprite.originalSize.x, mainSprite.originalSize.y, mainTexture.$sourceWidth, mainTexture.$sourceHeight, mainSprite.rotated);
                    bg.lineHeight = lineHeight;
                }
                else {
                    var charImg = this._itemsById[img];
                    if (charImg) {
                        this.getItemAsset(charImg);
                        bg.width = charImg.width;
                        bg.height = charImg.height;
                        bg.texture = charImg.asset;
                    }
                    if (bg.advance == 0) {
                        if (xadvance == 0)
                            bg.advance = bg.x + bg.width;
                        else
                            bg.advance = xadvance;
                    }
                    bg.lineHeight = bg.y < 0 ? bg.height : (bg.y + bg.height);
                    if (bg.lineHeight < font.size)
                        bg.lineHeight = font.size;
                }
                buffer.position = nextPos;
            }
        };
        UIPackage.prototype.loadDragonBones = function (item) {
            var jsonFile = getAssetResKey(item.file, ["json", "dbbin"]);
            var str = item.file.replace("_ske", "_tex");
            var atlasFile = getAssetResKey(str, "json");
            var texFile = getAssetResKey(str, "png");
            var task1 = RES.getResAsync(jsonFile);
            var task2 = RES.getResAsync(atlasFile);
            var task3 = RES.getResAsync(texFile);
            Promise.all([task1, task2, task3]).then(function (values) {
                var egretFactory = dragonBones.EgretFactory.factory;
                item.asset = egretFactory.parseDragonBonesData(values[0]);
                item.atlasAsset = egretFactory.parseTextureAtlasData(values[1], values[2]);
                item.armatureName = item.asset.armatureNames[0];
                var arr = item.loading;
                delete item.loading;
                arr.forEach(function (e) { return e(null, item); });
            }).catch(function (reason) {
                var arr = item.loading;
                delete item.loading;
                arr.forEach(function (e) { return e(reason, item); });
            });
        };
        UIPackage._constructing = 0;
        UIPackage._instById = {};
        UIPackage._instByName = {};
        UIPackage._branch = "";
        UIPackage._vars = {};
        return UIPackage;
    }());
    fgui.UIPackage = UIPackage;
    function getAssetResKey(file, types) {
        if (Array.isArray(types)) {
            for (var i = 0; i < types.length; i++) {
                var key = file + "_" + types[i];
                if (RES.hasRes(key))
                    return key;
            }
            return file;
        }
        else {
            var key = file + "_" + types;
            if (RES.hasRes(key))
                return key;
            return file;
        }
    }
})(fgui || (fgui = {}));

(function (fgui) {
    var Window = (function (_super_1) {
        __extends(Window, _super_1);
        function Window() {
            var _this = _super_1.call(this) || this;
            _this._requestingCmd = 0;
            _this._uiSources = new Array();
            _this.bringToFontOnClick = fgui.UIConfig.bringWindowToFrontOnClick;
            _this.displayObject.addEventListener(egret.Event.ADDED_TO_STAGE, _this.__onShown, _this);
            _this.displayObject.addEventListener(egret.Event.REMOVED_FROM_STAGE, _this.__onHidden, _this);
            _this.displayObject.addEventListener(egret.TouchEvent.TOUCH_BEGIN, _this.__mouseDown, _this, true);
            return _this;
        }
        Window.prototype.addUISource = function (source) {
            this._uiSources.push(source);
        };
        Object.defineProperty(Window.prototype, "contentPane", {
            get: function () {
                return this._contentPane;
            },
            set: function (val) {
                if (this._contentPane != val) {
                    if (this._contentPane)
                        this.removeChild(this._contentPane);
                    this._contentPane = val;
                    if (this._contentPane) {
                        this.addChild(this._contentPane);
                        this.setSize(this._contentPane.width, this._contentPane.height);
                        this._contentPane.addRelation(this, fgui.RelationType.Size);
                        this._frame = (this._contentPane.getChild("frame"));
                        if (this._frame) {
                            this.closeButton = this._frame.getChild("closeButton");
                            this.dragArea = this._frame.getChild("dragArea");
                            this.contentArea = this._frame.getChild("contentArea");
                        }
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "frame", {
            get: function () {
                return this._frame;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "closeButton", {
            get: function () {
                return this._closeButton;
            },
            set: function (value) {
                if (this._closeButton)
                    this._closeButton.removeClickListener(this.closeEventHandler, this);
                this._closeButton = value;
                if (this._closeButton)
                    this._closeButton.addClickListener(this.closeEventHandler, this);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "dragArea", {
            get: function () {
                return this._dragArea;
            },
            set: function (value) {
                if (this._dragArea != value) {
                    if (this._dragArea) {
                        this._dragArea.draggable = false;
                        this._dragArea.removeEventListener(fgui.DragEvent.DRAG_START, this.__dragStart, this);
                    }
                    this._dragArea = value;
                    if (this._dragArea) {
                        if ((this._dragArea instanceof fgui.GGraph) && this._dragArea.displayObject == null)
                            this._dragArea.asGraph.drawRect(0, 0, 0, 0, 0);
                        this._dragArea.draggable = true;
                        this._dragArea.addEventListener(fgui.DragEvent.DRAG_START, this.__dragStart, this);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "contentArea", {
            get: function () {
                return this._contentArea;
            },
            set: function (value) {
                this._contentArea = value;
            },
            enumerable: true,
            configurable: true
        });
        Window.prototype.show = function () {
            fgui.GRoot.inst.showWindow(this);
        };
        Window.prototype.showOn = function (root) {
            root.showWindow(this);
        };
        Window.prototype.hide = function () {
            if (this.isShowing)
                this.doHideAnimation();
        };
        Window.prototype.hideImmediately = function () {
            var r = (this.parent instanceof fgui.GRoot) ? this.parent : null;
            if (!r)
                r = fgui.GRoot.inst;
            r.hideWindowImmediately(this);
        };
        Window.prototype.centerOn = function (r, restraint) {
            this.setXY(Math.round((r.width - this.width) / 2), Math.round((r.height - this.height) / 2));
            if (restraint) {
                this.addRelation(r, fgui.RelationType.Center_Center);
                this.addRelation(r, fgui.RelationType.Middle_Middle);
            }
        };
        Window.prototype.toggleStatus = function () {
            if (this.isTop)
                this.hide();
            else
                this.show();
        };
        Object.defineProperty(Window.prototype, "isShowing", {
            get: function () {
                return this.parent != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "isTop", {
            get: function () {
                return this.parent != null && this.parent.getChildIndex(this) == this.parent.numChildren - 1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "modal", {
            get: function () {
                return this._modal;
            },
            set: function (val) {
                this._modal = val;
            },
            enumerable: true,
            configurable: true
        });
        Window.prototype.bringToFront = function () {
            this.root.bringToFront(this);
        };
        Window.prototype.showModalWait = function (requestingCmd) {
            if (requestingCmd != undefined)
                this._requestingCmd = requestingCmd;
            if (fgui.UIConfig.windowModalWaiting) {
                if (!this._modalWaitPane)
                    this._modalWaitPane = fgui.UIPackage.createObjectFromURL(fgui.UIConfig.windowModalWaiting);
                this.layoutModalWaitPane();
                this.addChild(this._modalWaitPane);
            }
        };
        Window.prototype.layoutModalWaitPane = function () {
            if (this._contentArea) {
                var pt = this._frame.localToGlobal();
                pt = this.globalToLocal(pt.x, pt.y, pt);
                this._modalWaitPane.setXY(pt.x + this._contentArea.x, pt.y + this._contentArea.y);
                this._modalWaitPane.setSize(this._contentArea.width, this._contentArea.height);
            }
            else
                this._modalWaitPane.setSize(this.width, this.height);
        };
        Window.prototype.closeModalWait = function (requestingCmd) {
            if (requestingCmd != null && requestingCmd != 0) {
                if (this._requestingCmd != requestingCmd)
                    return false;
            }
            this._requestingCmd = 0;
            if (this._modalWaitPane && this._modalWaitPane.parent != null)
                this.removeChild(this._modalWaitPane);
            return true;
        };
        Object.defineProperty(Window.prototype, "modalWaiting", {
            get: function () {
                return this._modalWaitPane && this._modalWaitPane.parent != null;
            },
            enumerable: true,
            configurable: true
        });
        Window.prototype.init = function () {
            if (this._inited || this._loading)
                return;
            if (this._uiSources.length > 0) {
                this._loading = false;
                var cnt = this._uiSources.length;
                for (var i = 0; i < cnt; i++) {
                    var lib = this._uiSources[i];
                    if (!lib.loaded) {
                        lib.load(this.__uiLoadComplete, this);
                        this._loading = true;
                    }
                }
                if (!this._loading)
                    this._init();
            }
            else
                this._init();
        };
        Window.prototype.onInit = function () {
        };
        Window.prototype.onShown = function () {
        };
        Window.prototype.onHide = function () {
        };
        Window.prototype.doShowAnimation = function () {
            this.onShown();
        };
        Window.prototype.doHideAnimation = function () {
            this.hideImmediately();
        };
        Window.prototype.__uiLoadComplete = function () {
            var cnt = this._uiSources.length;
            for (var i = 0; i < cnt; i++) {
                var lib = this._uiSources[i];
                if (!lib.loaded)
                    return;
            }
            this._loading = false;
            this._init();
        };
        Window.prototype._init = function () {
            this._inited = true;
            this.onInit();
            if (this.isShowing)
                this.doShowAnimation();
        };
        Window.prototype.dispose = function () {
            this.displayObject.removeEventListener(egret.Event.ADDED_TO_STAGE, this.__onShown, this);
            this.displayObject.removeEventListener(egret.Event.REMOVED_FROM_STAGE, this.__onHidden, this);
            if (this.parent)
                this.hideImmediately();
            _super_1.prototype.dispose.call(this);
        };
        Window.prototype.closeEventHandler = function (evt) {
            this.hide();
        };
        Window.prototype.__onShown = function (evt) {
            if (!this._inited)
                this.init();
            else
                this.doShowAnimation();
        };
        Window.prototype.__onHidden = function (evt) {
            this.closeModalWait();
            this.onHide();
        };
        Window.prototype.__mouseDown = function (evt) {
            if (this.isShowing && this.bringToFontOnClick)
                this.bringToFront();
        };
        Window.prototype.__dragStart = function (evt) {
            evt.preventDefault();
            this.startDrag(evt.touchPointID, evt.stageX, evt.stageY);
        };
        return Window;
    }(fgui.GComponent));
    fgui.Window = Window;
})(fgui || (fgui = {}));

(function (fgui) {
    var ControllerAction = (function () {
        function ControllerAction() {
        }
        ControllerAction.createAction = function (type) {
            switch (type) {
                case 0:
                    return new fgui.PlayTransitionAction();
                case 1:
                    return new fgui.ChangePageAction();
            }
            return null;
        };
        ControllerAction.prototype.run = function (controller, prevPage, curPage) {
            if ((this.fromPage == null || this.fromPage.length == 0 || this.fromPage.indexOf(prevPage) != -1)
                && (this.toPage == null || this.toPage.length == 0 || this.toPage.indexOf(curPage) != -1))
                this.enter(controller);
            else
                this.leave(controller);
        };
        ControllerAction.prototype.enter = function (controller) {
        };
        ControllerAction.prototype.leave = function (controller) {
        };
        ControllerAction.prototype.setup = function (buffer) {
            var cnt;
            var i;
            cnt = buffer.readShort();
            this.fromPage = [];
            for (i = 0; i < cnt; i++)
                this.fromPage[i] = buffer.readS();
            cnt = buffer.readShort();
            this.toPage = [];
            for (i = 0; i < cnt; i++)
                this.toPage[i] = buffer.readS();
        };
        return ControllerAction;
    }());
    fgui.ControllerAction = ControllerAction;
})(fgui || (fgui = {}));

(function (fgui) {
    var ChangePageAction = (function (_super_1) {
        __extends(ChangePageAction, _super_1);
        function ChangePageAction() {
            return _super_1.call(this) || this;
        }
        ChangePageAction.prototype.enter = function (controller) {
            if (!this.controllerName)
                return;
            var gcom;
            if (this.objectId) {
                var obj = controller.parent.getChildById(this.objectId);
                if (obj instanceof fgui.GComponent)
                    gcom = obj;
                else
                    return;
            }
            else
                gcom = controller.parent;
            if (gcom) {
                var cc = gcom.getController(this.controllerName);
                if (cc && cc != controller && !cc.changing) {
                    if (this.targetPage == "~1") {
                        if (controller.selectedIndex < cc.pageCount)
                            cc.selectedIndex = controller.selectedIndex;
                    }
                    else if (this.targetPage == "~2")
                        cc.selectedPage = controller.selectedPage;
                    else
                        cc.selectedPageId = this.targetPage;
                }
            }
        };
        ChangePageAction.prototype.setup = function (buffer) {
            _super_1.prototype.setup.call(this, buffer);
            this.objectId = buffer.readS();
            this.controllerName = buffer.readS();
            this.targetPage = buffer.readS();
        };
        return ChangePageAction;
    }(fgui.ControllerAction));
    fgui.ChangePageAction = ChangePageAction;
})(fgui || (fgui = {}));

(function (fgui) {
    var PlayTransitionAction = (function (_super_1) {
        __extends(PlayTransitionAction, _super_1);
        function PlayTransitionAction() {
            var _this = _super_1.call(this) || this;
            _this.playTimes = 1;
            _this.delay = 0;
            _this.stopOnExit = false;
            return _this;
        }
        PlayTransitionAction.prototype.enter = function (controller) {
            var trans = controller.parent.getTransition(this.transitionName);
            if (trans) {
                if (this._currentTransition && this._currentTransition.playing)
                    trans.changePlayTimes(this.playTimes);
                else
                    trans.play(null, null, null, this.playTimes, this.delay);
                this._currentTransition = trans;
            }
        };
        PlayTransitionAction.prototype.leave = function (controller) {
            if (this.stopOnExit && this._currentTransition) {
                this._currentTransition.stop();
                this._currentTransition = null;
            }
        };
        PlayTransitionAction.prototype.setup = function (buffer) {
            _super_1.prototype.setup.call(this, buffer);
            this.transitionName = buffer.readS();
            this.playTimes = buffer.readInt();
            this.delay = buffer.readFloat();
            this.stopOnExit = buffer.readBool();
        };
        return PlayTransitionAction;
    }(fgui.ControllerAction));
    fgui.PlayTransitionAction = PlayTransitionAction;
})(fgui || (fgui = {}));

(function (fgui) {
    var BitmapFont = (function () {
        function BitmapFont() {
            this.size = 0;
            this.glyphs = {};
        }
        return BitmapFont;
    }());
    fgui.BitmapFont = BitmapFont;
})(fgui || (fgui = {}));

(function (fgui) {
    function fillImage(w, h, method, origin, clockwise, amount) {
        if (amount <= 0)
            return null;
        else if (amount >= 0.9999)
            return [0, 0, w, 0, w, h, 0, h];
        var points;
        switch (method) {
            case fgui.FillMethod.Horizontal:
                points = fillHorizontal(w, h, origin, amount);
                break;
            case fgui.FillMethod.Vertical:
                points = fillVertical(w, h, origin, amount);
                break;
            case fgui.FillMethod.Radial90:
                points = fillRadial90(w, h, origin, clockwise, amount);
                break;
            case fgui.FillMethod.Radial180:
                points = fillRadial180(w, h, origin, clockwise, amount);
                break;
            case fgui.FillMethod.Radial360:
                points = fillRadial360(w, h, origin, clockwise, amount);
                break;
        }
        return points;
    }
    fgui.fillImage = fillImage;
    function fillHorizontal(w, h, origin, amount) {
        var w2 = w * amount;
        if (origin == fgui.FillOrigin.Left || origin == fgui.FillOrigin.Top)
            return [0, 0, w2, 0, w2, h, 0, h];
        else
            return [w, 0, w, h, w - w2, h, w - w2, 0];
    }
    function fillVertical(w, h, origin, amount) {
        var h2 = h * amount;
        if (origin == fgui.FillOrigin.Left || origin == fgui.FillOrigin.Top)
            return [0, 0, 0, h2, w, h2, w, 0];
        else
            return [0, h, w, h, w, h - h2, 0, h - h2];
    }
    function fillRadial90(w, h, origin, clockwise, amount) {
        if (clockwise && (origin == fgui.FillOrigin.TopRight || origin == fgui.FillOrigin.BottomLeft)
            || !clockwise && (origin == fgui.FillOrigin.TopLeft || origin == fgui.FillOrigin.BottomRight)) {
            amount = 1 - amount;
        }
        var v, v2, h2;
        v = Math.tan(Math.PI / 2 * amount);
        h2 = w * v;
        v2 = (h2 - h) / h2;
        var points;
        switch (origin) {
            case fgui.FillOrigin.TopLeft:
                if (clockwise) {
                    if (h2 <= h)
                        points = [0, 0, w, h2, w, 0];
                    else
                        points = [0, 0, w * (1 - v2), h, w, h, w, 0];
                }
                else {
                    if (h2 <= h)
                        points = [0, 0, w, h2, w, h, 0, h];
                    else
                        points = [0, 0, w * (1 - v2), h, 0, h];
                }
                break;
            case fgui.FillOrigin.TopRight:
                if (clockwise) {
                    if (h2 <= h)
                        points = [w, 0, 0, h2, 0, h, w, h];
                    else
                        points = [w, 0, w * v2, h, w, h];
                }
                else {
                    if (h2 <= h)
                        points = [w, 0, 0, h2, 0, 0];
                    else
                        points = [w, 0, w * v2, h, 0, h, 0, 0];
                }
                break;
            case fgui.FillOrigin.BottomLeft:
                if (clockwise) {
                    if (h2 <= h)
                        points = [0, h, w, h - h2, w, 0, 0, 0];
                    else
                        points = [0, h, w * (1 - v2), 0, 0, 0];
                }
                else {
                    if (h2 <= h)
                        points = [0, h, w, h - h2, w, h];
                    else
                        points = [0, h, w * (1 - v2), 0, w, 0, w, h];
                }
                break;
            case fgui.FillOrigin.BottomRight:
                if (clockwise) {
                    if (h2 <= h)
                        points = [w, h, 0, h - h2, 0, h];
                    else
                        points = [w, h, w * v2, 0, 0, 0, 0, h];
                }
                else {
                    if (h2 <= h)
                        points = [w, h, 0, h - h2, 0, 0, w, 0];
                    else
                        points = [w, h, w * v2, 0, w, 0];
                }
                break;
        }
        return points;
    }
    function movePoints(points, offsetX, offsetY) {
        var cnt = points.length;
        for (var i = 0; i < cnt; i += 2) {
            points[i] += offsetX;
            points[i + 1] += offsetY;
        }
    }
    function fillRadial180(w, h, origin, clockwise, amount) {
        var points;
        switch (origin) {
            case fgui.FillOrigin.Top:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial90(w / 2, h, clockwise ? fgui.FillOrigin.TopLeft : fgui.FillOrigin.TopRight, clockwise, amount);
                    if (clockwise)
                        movePoints(points, w / 2, 0);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial90(w / 2, h, clockwise ? fgui.FillOrigin.TopRight : fgui.FillOrigin.TopLeft, clockwise, amount);
                    if (clockwise)
                        points.push(w, h, w, 0);
                    else {
                        movePoints(points, w / 2, 0);
                        points.push(0, h, 0, 0);
                    }
                }
                break;
            case fgui.FillOrigin.Bottom:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial90(w / 2, h, clockwise ? fgui.FillOrigin.BottomRight : fgui.FillOrigin.BottomLeft, clockwise, amount);
                    if (!clockwise)
                        movePoints(points, w / 2, 0);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial90(w / 2, h, clockwise ? fgui.FillOrigin.BottomLeft : fgui.FillOrigin.BottomRight, clockwise, amount);
                    if (clockwise) {
                        movePoints(points, w / 2, 0);
                        points.push(0, 0, 0, h);
                    }
                    else
                        points.push(w, 0, w, h);
                }
                break;
            case fgui.FillOrigin.Left:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial90(w, h / 2, clockwise ? fgui.FillOrigin.BottomLeft : fgui.FillOrigin.TopLeft, clockwise, amount);
                    if (!clockwise)
                        movePoints(points, 0, h / 2);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial90(w, h / 2, clockwise ? fgui.FillOrigin.TopLeft : fgui.FillOrigin.BottomLeft, clockwise, amount);
                    if (clockwise) {
                        movePoints(points, 0, h / 2);
                        points.push(w, 0, 0, 0);
                    }
                    else
                        points.push(w, h, 0, h);
                }
                break;
            case fgui.FillOrigin.Right:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial90(w, h / 2, clockwise ? fgui.FillOrigin.TopRight : fgui.FillOrigin.BottomRight, clockwise, amount);
                    if (clockwise)
                        movePoints(points, 0, h / 2);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial90(w, h / 2, clockwise ? fgui.FillOrigin.BottomRight : fgui.FillOrigin.TopRight, clockwise, amount);
                    if (clockwise)
                        points.push(0, h, w, h);
                    else {
                        movePoints(points, 0, h / 2);
                        points.push(0, 0, w, 0);
                    }
                }
                break;
        }
        return points;
    }
    function fillRadial360(w, h, origin, clockwise, amount) {
        var points;
        switch (origin) {
            case fgui.FillOrigin.Top:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial180(w / 2, h, clockwise ? fgui.FillOrigin.Left : fgui.FillOrigin.Right, clockwise, amount);
                    if (clockwise)
                        movePoints(points, w / 2, 0);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial180(w / 2, h, clockwise ? fgui.FillOrigin.Right : fgui.FillOrigin.Left, clockwise, amount);
                    if (clockwise)
                        points.push(w, h, w, 0, w / 2, 0);
                    else {
                        movePoints(points, w / 2, 0);
                        points.push(0, h, 0, 0, w / 2, 0);
                    }
                }
                break;
            case fgui.FillOrigin.Bottom:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial180(w / 2, h, clockwise ? fgui.FillOrigin.Right : fgui.FillOrigin.Left, clockwise, amount);
                    if (!clockwise)
                        movePoints(points, w / 2, 0);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial180(w / 2, h, clockwise ? fgui.FillOrigin.Left : fgui.FillOrigin.Right, clockwise, amount);
                    if (clockwise) {
                        movePoints(points, w / 2, 0);
                        points.push(0, 0, 0, h, w / 2, h);
                    }
                    else
                        points.push(w, 0, w, h, w / 2, h);
                }
                break;
            case fgui.FillOrigin.Left:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial180(w, h / 2, clockwise ? fgui.FillOrigin.Bottom : fgui.FillOrigin.Top, clockwise, amount);
                    if (!clockwise)
                        movePoints(points, 0, h / 2);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial180(w, h / 2, clockwise ? fgui.FillOrigin.Top : fgui.FillOrigin.Bottom, clockwise, amount);
                    if (clockwise) {
                        movePoints(points, 0, h / 2);
                        points.push(w, 0, 0, 0, 0, h / 2);
                    }
                    else
                        points.push(w, h, 0, h, 0, h / 2);
                }
                break;
            case fgui.FillOrigin.Right:
                if (amount <= 0.5) {
                    amount = amount / 0.5;
                    points = fillRadial180(w, h / 2, clockwise ? fgui.FillOrigin.Top : fgui.FillOrigin.Bottom, clockwise, amount);
                    if (clockwise)
                        movePoints(points, 0, h / 2);
                }
                else {
                    amount = (amount - 0.5) / 0.5;
                    points = fillRadial180(w, h / 2, clockwise ? fgui.FillOrigin.Bottom : fgui.FillOrigin.Top, clockwise, amount);
                    if (clockwise)
                        points.push(0, h, w, h, w, h / 2);
                    else {
                        movePoints(points, 0, h / 2);
                        points.push(0, 0, w, 0, w, h / 2);
                    }
                }
                break;
        }
        return points;
    }
})(fgui || (fgui = {}));

(function (fgui) {
    var Image = (function (_super_1) {
        __extends(Image, _super_1);
        function Image() {
            var _this = _super_1.call(this) || this;
            _this._fillMethod = 0;
            _this._fillOrigin = 0;
            _this._fillAmount = 0;
            _this._color = 0xFFFFFF;
            return _this;
        }
        Object.defineProperty(Image.prototype, "color", {
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this._color != value) {
                    this._color = value;
                    if (this.tint == undefined)
                        fgui.ToolSet.setColorFilter(this, value);
                    else
                        this.tint = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Image.prototype.$setX = function (value) {
            if (this.mask)
                this.mask.x = value;
            return _super_1.prototype.$setX.call(this, value);
        };
        Image.prototype.$setY = function (value) {
            if (this.mask)
                this.mask.y = value;
            return _super_1.prototype.$setY.call(this, value);
        };
        Object.defineProperty(Image.prototype, "fillMethod", {
            get: function () {
                return this._fillMethod;
            },
            set: function (value) {
                if (this._fillMethod != value) {
                    this._fillMethod = value;
                    if (this._fillMethod != 0) {
                        if (!this._mask) {
                            this._mask = new egret.Shape();
                            this._mask.touchEnabled = false;
                        }
                        this.mask = this._mask;
                        this._mask.x = this.x;
                        this._mask.y = this.y;
                        this.addEventListener(egret.Event.RESIZE, this.markChanged, this);
                        this.markChanged();
                    }
                    else if (this.mask) {
                        this._mask.graphics.clear();
                        this.mask = null;
                        this.removeEventListener(egret.Event.RESIZE, this.markChanged, this);
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Image.prototype, "fillOrigin", {
            get: function () {
                return this._fillOrigin;
            },
            set: function (value) {
                if (this._fillOrigin != value) {
                    this._fillOrigin = value;
                    if (this._fillMethod != 0)
                        this.markChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Image.prototype, "fillClockwise", {
            get: function () {
                return this._fillClockwise;
            },
            set: function (value) {
                if (this._fillClockwise != value) {
                    this._fillClockwise = value;
                    if (this._fillMethod != 0)
                        this.markChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Image.prototype, "fillAmount", {
            get: function () {
                return this._fillAmount;
            },
            set: function (value) {
                if (this._fillAmount != value) {
                    this._fillAmount = value;
                    if (this._fillMethod != 0)
                        this.markChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Image.prototype.markChanged = function () {
            if (!this._maskDirtyFlag) {
                this._maskDirtyFlag = true;
                fgui.GTimers.inst.callLater(this.doFill, this);
            }
        };
        Image.prototype.doFill = function () {
            this._maskDirtyFlag = false;
            if (!this._mask.parent && this.parent)
                this.parent.addChild(this._mask);
            var w = this.width;
            var h = this.height;
            var g = this._mask.graphics;
            g.clear();
            if (w == 0 || h == 0)
                return;
            var points = fgui.fillImage(w, h, this._fillMethod, this._fillOrigin, this._fillClockwise, this._fillAmount);
            if (!points)
                return;
            g.beginFill(0, 1);
            fgui.ToolSet.fillPath(g, points, 0, 0);
            g.endFill();
        };
        return Image;
    }(egret.Bitmap));
    fgui.Image = Image;
})(fgui || (fgui = {}));

(function (fgui) {
    var MovieClip = (function (_super_1) {
        __extends(MovieClip, _super_1);
        function MovieClip() {
            var _this = _super_1.call(this) || this;
            _this.interval = 0;
            _this.repeatDelay = 0;
            _this.timeScale = 1;
            _this._playing = true;
            _this._frameCount = 0;
            _this._frame = 0;
            _this._start = 0;
            _this._end = 0;
            _this._times = 0;
            _this._endAt = 0;
            _this._status = 0;
            _this._frameElapsed = 0;
            _this._reversed = false;
            _this._repeatedCount = 0;
            _this.touchEnabled = false;
            _this.setPlaySettings();
            return _this;
        }
        Object.defineProperty(MovieClip.prototype, "frames", {
            get: function () {
                return this._frames;
            },
            set: function (value) {
                this._frames = value;
                this.scale9Grid = null;
                this.fillMode = egret.BitmapFillMode.SCALE;
                if (this._frames)
                    this._frameCount = this._frames.length;
                else
                    this._frameCount = 0;
                if (this._end == -1 || this._end > this._frameCount - 1)
                    this._end = this._frameCount - 1;
                if (this._endAt == -1 || this._endAt > this._frameCount - 1)
                    this._endAt = this._frameCount - 1;
                if (this._frame < 0 || this._frame > this._frameCount - 1)
                    this._frame = this._frameCount - 1;
                this.drawFrame();
                this._frameElapsed = 0;
                this._repeatedCount = 0;
                this._reversed = false;
                this.checkTimer();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MovieClip.prototype, "frameCount", {
            get: function () {
                return this._frameCount;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MovieClip.prototype, "frame", {
            get: function () {
                return this._frame;
            },
            set: function (value) {
                if (this._frame != value) {
                    if (this._frames && value >= this._frameCount)
                        value = this._frameCount - 1;
                    this._frame = value;
                    this._frameElapsed = 0;
                    this.drawFrame();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MovieClip.prototype, "playing", {
            get: function () {
                return this._playing;
            },
            set: function (value) {
                if (this._playing != value) {
                    this._playing = value;
                    this.checkTimer();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MovieClip.prototype, "smoothing", {
            get: function () {
                return this._smoothing;
            },
            set: function (value) {
                this._smoothing = value;
            },
            enumerable: true,
            configurable: true
        });
        MovieClip.prototype.rewind = function () {
            this._frame = 0;
            this._frameElapsed = 0;
            this._reversed = false;
            this._repeatedCount = 0;
            this.drawFrame();
        };
        MovieClip.prototype.syncStatus = function (anotherMc) {
            this._frame = anotherMc._frame;
            this._frameElapsed = anotherMc._frameElapsed;
            this._reversed = anotherMc._reversed;
            this._repeatedCount = anotherMc._repeatedCount;
            this.drawFrame();
        };
        MovieClip.prototype.advance = function (timeInMiniseconds) {
            var beginFrame = this._frame;
            var beginReversed = this._reversed;
            var backupTime = timeInMiniseconds;
            while (true) {
                var tt = this.interval + this._frames[this._frame].addDelay;
                if (this._frame == 0 && this._repeatedCount > 0)
                    tt += this.repeatDelay;
                if (timeInMiniseconds < tt) {
                    this._frameElapsed = 0;
                    break;
                }
                timeInMiniseconds -= tt;
                if (this.swing) {
                    if (this._reversed) {
                        this._frame--;
                        if (this._frame <= 0) {
                            this._frame = 0;
                            this._repeatedCount++;
                            this._reversed = !this._reversed;
                        }
                    }
                    else {
                        this._frame++;
                        if (this._frame > this._frameCount - 1) {
                            this._frame = Math.max(0, this._frameCount - 2);
                            this._repeatedCount++;
                            this._reversed = !this._reversed;
                        }
                    }
                }
                else {
                    this._frame++;
                    if (this._frame > this._frameCount - 1) {
                        this._frame = 0;
                        this._repeatedCount++;
                    }
                }
                if (this._frame == beginFrame && this._reversed == beginReversed) {
                    var roundTime = backupTime - timeInMiniseconds;
                    timeInMiniseconds -= Math.floor(timeInMiniseconds / roundTime) * roundTime;
                }
            }
            this.drawFrame();
        };
        MovieClip.prototype.setPlaySettings = function (start, end, times, endAt, endCallback, callbackObj) {
            if (start == undefined)
                start = 0;
            if (end == undefined)
                end = -1;
            if (times == undefined)
                times = 0;
            if (endAt == undefined)
                endAt = -1;
            this._start = start;
            this._end = end;
            if (this._end == -1 || this._end > this._frameCount - 1)
                this._end = this._frameCount - 1;
            this._times = times;
            this._endAt = endAt;
            if (this._endAt == -1)
                this._endAt = this._end;
            this._status = 0;
            this._callback = endCallback;
            this._callbackObj = callbackObj;
            this.frame = start;
        };
        MovieClip.prototype.update = function () {
            if (!this._playing || this._frameCount == 0 || this._status == 3)
                return;
            var dt = fgui.GTimers.deltaTime;
            if (this.timeScale != 1)
                dt *= this.timeScale;
            this._frameElapsed += dt;
            var tt = this.interval + this._frames[this._frame].addDelay;
            if (this._frame == 0 && this._repeatedCount > 0)
                tt += this.repeatDelay;
            if (this._frameElapsed < tt)
                return;
            this._frameElapsed -= tt;
            if (this._frameElapsed > this.interval)
                this._frameElapsed = this.interval;
            if (this.swing) {
                if (this._reversed) {
                    this._frame--;
                    if (this._frame <= 0) {
                        this._frame = 0;
                        this._repeatedCount++;
                        this._reversed = !this._reversed;
                    }
                }
                else {
                    this._frame++;
                    if (this._frame > this._frameCount - 1) {
                        this._frame = Math.max(0, this._frameCount - 2);
                        this._repeatedCount++;
                        this._reversed = !this._reversed;
                    }
                }
            }
            else {
                this._frame++;
                if (this._frame > this._frameCount - 1) {
                    this._frame = 0;
                    this._repeatedCount++;
                }
            }
            if (this._status == 1) {
                this._frame = this._start;
                this._frameElapsed = 0;
                this._status = 0;
            }
            else if (this._status == 2) {
                this._frame = this._endAt;
                this._frameElapsed = 0;
                this._status = 3;
                if (this._callback != null) {
                    var callback = this._callback;
                    var caller = this._callbackObj;
                    this._callback = null;
                    this._callbackObj = null;
                    callback.call(caller);
                }
            }
            else {
                if (this._frame == this._end) {
                    if (this._times > 0) {
                        this._times--;
                        if (this._times == 0)
                            this._status = 2;
                        else
                            this._status = 1;
                    }
                    else if (this._start != 0)
                        this._status = 1;
                }
            }
            this.drawFrame();
        };
        MovieClip.prototype.drawFrame = function () {
            if (this._frameCount > 0 && this._frame < this._frames.length) {
                var frame = this._frames[this._frame];
                this.texture = frame.texture;
            }
            else
                this.texture = null;
        };
        MovieClip.prototype.checkTimer = function () {
            if (this._playing && this._frameCount > 0 && this.stage != null)
                fgui.GTimers.inst.add(1, 0, this.update, this);
            else
                fgui.GTimers.inst.remove(this.update, this);
        };
        MovieClip.prototype.$onAddToStage = function (stage, nestLevel) {
            _super_1.prototype.$onAddToStage.call(this, stage, nestLevel);
            if (this._playing && this._frameCount > 0)
                fgui.GTimers.inst.add(1, 0, this.update, this);
        };
        MovieClip.prototype.$onRemoveFromStage = function () {
            _super_1.prototype.$onRemoveFromStage.call(this);
            fgui.GTimers.inst.remove(this.update, this);
        };
        return MovieClip;
    }(fgui.Image));
    fgui.MovieClip = MovieClip;
})(fgui || (fgui = {}));

(function (fgui) {
    var UIContainer = (function (_super_1) {
        __extends(UIContainer, _super_1);
        function UIContainer() {
            var _this = _super_1.call(this) || this;
            _this.touchEnabled = true;
            _this.touchChildren = true;
            return _this;
        }
        UIContainer.prototype.cacheHitArea = function (value) {
            this._cachedHitArea = value;
            if (value) {
                if (!this._cachedMatrix)
                    this._cachedMatrix = new egret.Matrix();
                this._cachedMatrix.copyFrom(this.$getInvertedConcatenatedMatrix());
            }
        };
        Object.defineProperty(UIContainer.prototype, "hitArea", {
            get: function () {
                return this._hitArea;
            },
            set: function (value) {
                this._hitArea = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIContainer.prototype, "opaque", {
            get: function () {
                return this._opaque;
            },
            set: function (value) {
                this._opaque = value;
            },
            enumerable: true,
            configurable: true
        });
        UIContainer.prototype.$hitTest = function (stageX, stageY) {
            if (!this.$visible)
                return null;
            if (this._hitArea) {
                if (!this.touchEnabled)
                    return null;
                if (this._hitArea.$graphics) {
                    if (!this._hitArea.$graphics.$hitTest(stageX, stageY))
                        return null;
                }
                else {
                    var m = this._cachedHitArea ? this._cachedMatrix : this.$getInvertedConcatenatedMatrix();
                    var localX = m.a * stageX + m.c * stageY + m.tx;
                    var localY = m.b * stageX + m.d * stageY + m.ty;
                    if (!this._hitArea.contains(localX, localY))
                        return null;
                }
                return this;
            }
            var ret = _super_1.prototype.$hitTest.call(this, stageX, stageY);
            if (ret == this && !this.touchEnabled)
                return null;
            if (ret == null && this._opaque) {
                var m = this._cachedHitArea ? this._cachedMatrix : this.$getInvertedConcatenatedMatrix();
                var localX = m.a * stageX + m.c * stageY + m.tx;
                var localY = m.b * stageX + m.d * stageY + m.ty;
                if (localX >= 0 && localY >= 0 && localX <= this.$explicitWidth && localY <= this.$explicitHeight)
                    return this;
                else
                    return null;
            }
            else if (ret == this && !this._opaque)
                return null;
            else
                return ret;
        };
        return UIContainer;
    }(egret.DisplayObjectContainer));
    fgui.UIContainer = UIContainer;
})(fgui || (fgui = {}));

(function (fgui) {
    var DragEvent = (function (_super_1) {
        __extends(DragEvent, _super_1);
        function DragEvent(type, stageX, stageY, touchPointID) {
            if (stageX === void 0) { stageX = 0; }
            if (stageY === void 0) { stageY = 0; }
            if (touchPointID === void 0) { touchPointID = -1; }
            var _this = _super_1.call(this, type, false) || this;
            _this.touchPointID = 0;
            _this.stageX = stageX;
            _this.stageY = stageY;
            _this.touchPointID = touchPointID;
            return _this;
        }
        DragEvent.prototype.preventDefault = function () {
            this._prevented = true;
        };
        DragEvent.prototype.isDefaultPrevented = function () {
            return this._prevented;
        };
        DragEvent.DRAG_START = "__dragStart";
        DragEvent.DRAG_END = "__dragEnd";
        DragEvent.DRAG_MOVING = "__dragMoving";
        return DragEvent;
    }(egret.Event));
    fgui.DragEvent = DragEvent;
})(fgui || (fgui = {}));

(function (fgui) {
    var DropEvent = (function (_super_1) {
        __extends(DropEvent, _super_1);
        function DropEvent(type, source) {
            var _this = _super_1.call(this, type, false) || this;
            _this.source = source;
            return _this;
        }
        DropEvent.DROP = "__drop";
        return DropEvent;
    }(egret.Event));
    fgui.DropEvent = DropEvent;
})(fgui || (fgui = {}));

(function (fgui) {
    var ItemEvent = (function (_super_1) {
        __extends(ItemEvent, _super_1);
        function ItemEvent(type, itemObject, stageX, stageY) {
            if (itemObject === void 0) { itemObject = null; }
            if (stageX === void 0) { stageX = 0; }
            if (stageY === void 0) { stageY = 0; }
            var _this = _super_1.call(this, type, false) || this;
            _this.itemObject = itemObject;
            _this.stageX = stageX;
            _this.stageY = stageY;
            return _this;
        }
        ItemEvent.CLICK = "___itemClick";
        return ItemEvent;
    }(egret.Event));
    fgui.ItemEvent = ItemEvent;
})(fgui || (fgui = {}));

(function (fgui) {
    var StateChangeEvent = (function (_super_1) {
        __extends(StateChangeEvent, _super_1);
        function StateChangeEvent(type) {
            return _super_1.call(this, type, false) || this;
        }
        StateChangeEvent.CHANGED = "___stateChanged";
        return StateChangeEvent;
    }(egret.Event));
    fgui.StateChangeEvent = StateChangeEvent;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearBase = (function () {
        function GearBase(owner) {
            this._owner = owner;
        }
        GearBase.create = function (owner, index) {
            if (!Classes)
                Classes = [
                    fgui.GearDisplay, fgui.GearXY, fgui.GearSize, fgui.GearLook, fgui.GearColor,
                    fgui.GearAnimation, fgui.GearText, fgui.GearIcon, fgui.GearDisplay2, fgui.GearFontSize
                ];
            return new (Classes[index])(owner);
        };
        GearBase.prototype.dispose = function () {
            if (this._tweenConfig && this._tweenConfig._tweener) {
                this._tweenConfig._tweener.kill();
                this._tweenConfig._tweener = null;
            }
        };
        Object.defineProperty(GearBase.prototype, "controller", {
            get: function () {
                return this._controller;
            },
            set: function (val) {
                if (val != this._controller) {
                    this._controller = val;
                    if (this._controller)
                        this.init();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GearBase.prototype, "tweenConfig", {
            get: function () {
                if (!this._tweenConfig)
                    this._tweenConfig = new GearTweenConfig();
                return this._tweenConfig;
            },
            enumerable: true,
            configurable: true
        });
        GearBase.prototype.setup = function (buffer) {
            this._controller = this._owner.parent.getControllerAt(buffer.readShort());
            this.init();
            var i;
            var page;
            var cnt = buffer.readShort();
            if (this instanceof fgui.GearDisplay) {
                this.pages = buffer.readSArray(cnt);
            }
            else if (this instanceof fgui.GearDisplay2) {
                this.pages = buffer.readSArray(cnt);
            }
            else {
                for (i = 0; i < cnt; i++) {
                    page = buffer.readS();
                    if (page == null)
                        continue;
                    this.addStatus(page, buffer);
                }
                if (buffer.readBool())
                    this.addStatus(null, buffer);
            }
            if (buffer.readBool()) {
                this._tweenConfig = new GearTweenConfig();
                this._tweenConfig.easeType = buffer.readByte();
                this._tweenConfig.duration = buffer.readFloat();
                this._tweenConfig.delay = buffer.readFloat();
            }
            if (buffer.version >= 2) {
                if (this instanceof fgui.GearXY) {
                    if (buffer.readBool()) {
                        this.positionsInPercent = true;
                        for (i = 0; i < cnt; i++) {
                            page = buffer.readS();
                            if (page == null)
                                continue;
                            this.addExtStatus(page, buffer);
                        }
                        if (buffer.readBool())
                            this.addExtStatus(null, buffer);
                    }
                }
                else if (this instanceof fgui.GearDisplay2)
                    this.condition = buffer.readByte();
            }
        };
        GearBase.prototype.updateFromRelations = function (dx, dy) {
        };
        GearBase.prototype.addStatus = function (pageId, buffer) {
        };
        GearBase.prototype.init = function () {
        };
        GearBase.prototype.apply = function () {
        };
        GearBase.prototype.updateState = function () {
        };
        return GearBase;
    }());
    fgui.GearBase = GearBase;
    var Classes;
    var GearTweenConfig = (function () {
        function GearTweenConfig() {
            this.tween = true;
            this.easeType = fgui.EaseType.QuadOut;
            this.duration = 0.3;
            this.delay = 0;
        }
        return GearTweenConfig;
    }());
    fgui.GearTweenConfig = GearTweenConfig;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearAnimation = (function (_super_1) {
        __extends(GearAnimation, _super_1);
        function GearAnimation(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearAnimation.prototype.init = function () {
            this._default = {
                playing: this._owner.getProp(fgui.ObjectPropID.Playing),
                frame: this._owner.getProp(fgui.ObjectPropID.Frame)
            };
            this._storage = {};
        };
        GearAnimation.prototype.addStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                this._storage[pageId] = gv = {};
            gv.playing = buffer.readBool();
            gv.frame = buffer.readInt();
        };
        GearAnimation.prototype.apply = function () {
            this._owner._gearLocked = true;
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                gv = this._default;
            this._owner.setProp(fgui.ObjectPropID.Playing, gv.playing);
            this._owner.setProp(fgui.ObjectPropID.Frame, gv.frame);
            this._owner._gearLocked = false;
        };
        GearAnimation.prototype.updateState = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                this._storage[this._controller.selectedPageId] = gv = {};
            gv.playing = this._owner.getProp(fgui.ObjectPropID.Playing);
            gv.frame = this._owner.getProp(fgui.ObjectPropID.Frame);
        };
        return GearAnimation;
    }(fgui.GearBase));
    fgui.GearAnimation = GearAnimation;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearColor = (function (_super_1) {
        __extends(GearColor, _super_1);
        function GearColor(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearColor.prototype.init = function () {
            this._default = {
                color: this._owner.getProp(fgui.ObjectPropID.Color),
                strokeColor: this._owner.getProp(fgui.ObjectPropID.OutlineColor)
            };
            this._storage = {};
        };
        GearColor.prototype.addStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                this._storage[pageId] = gv = {};
            gv.color = buffer.readColor();
            gv.strokeColor = buffer.readColor();
        };
        GearColor.prototype.apply = function () {
            this._owner._gearLocked = true;
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                gv = this._default;
            this._owner.setProp(fgui.ObjectPropID.Color, gv.color);
            this._owner.setProp(fgui.ObjectPropID.OutlineColor, gv.strokeColor);
            this._owner._gearLocked = false;
        };
        GearColor.prototype.updateState = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                this._storage[this._controller.selectedPageId] = gv = {};
            gv.color = this._owner.getProp(fgui.ObjectPropID.Color);
            gv.strokeColor = this._owner.getProp(fgui.ObjectPropID.OutlineColor);
        };
        return GearColor;
    }(fgui.GearBase));
    fgui.GearColor = GearColor;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearDisplay = (function (_super_1) {
        __extends(GearDisplay, _super_1);
        function GearDisplay(owner) {
            var _this = _super_1.call(this, owner) || this;
            _this._displayLockToken = 1;
            _this._visible = 0;
            return _this;
        }
        GearDisplay.prototype.init = function () {
            this.pages = null;
        };
        GearDisplay.prototype.apply = function () {
            this._displayLockToken++;
            if (this._displayLockToken == 0)
                this._displayLockToken = 1;
            if (this.pages == null || this.pages.length == 0
                || this.pages.indexOf(this._controller.selectedPageId) != -1)
                this._visible = 1;
            else
                this._visible = 0;
        };
        GearDisplay.prototype.addLock = function () {
            this._visible++;
            return this._displayLockToken;
        };
        GearDisplay.prototype.releaseLock = function (token) {
            if (token == this._displayLockToken)
                this._visible--;
        };
        Object.defineProperty(GearDisplay.prototype, "connected", {
            get: function () {
                return this._controller == null || this._visible > 0;
            },
            enumerable: true,
            configurable: true
        });
        return GearDisplay;
    }(fgui.GearBase));
    fgui.GearDisplay = GearDisplay;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearDisplay2 = (function (_super_1) {
        __extends(GearDisplay2, _super_1);
        function GearDisplay2(owner) {
            var _this = _super_1.call(this, owner) || this;
            _this._visible = 0;
            return _this;
        }
        GearDisplay2.prototype.init = function () {
            this.pages = null;
        };
        GearDisplay2.prototype.apply = function () {
            if (this.pages == null || this.pages.length == 0
                || this.pages.indexOf(this._controller.selectedPageId) != -1)
                this._visible = 1;
            else
                this._visible = 0;
        };
        GearDisplay2.prototype.evaluate = function (connected) {
            var v = this._controller == null || this._visible > 0;
            if (this.condition == 0)
                v = v && connected;
            else
                v = v || connected;
            return v;
        };
        return GearDisplay2;
    }(fgui.GearBase));
    fgui.GearDisplay2 = GearDisplay2;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearFontSize = (function (_super_1) {
        __extends(GearFontSize, _super_1);
        function GearFontSize(owner) {
            var _this = _super_1.call(this, owner) || this;
            _this._default = 0;
            return _this;
        }
        GearFontSize.prototype.init = function () {
            this._default = this._owner.getProp(fgui.ObjectPropID.FontSize);
            this._storage = {};
        };
        GearFontSize.prototype.addStatus = function (pageId, buffer) {
            if (pageId == null)
                this._default = buffer.readInt();
            else
                this._storage[pageId] = buffer.readInt();
        };
        GearFontSize.prototype.apply = function () {
            this._owner._gearLocked = true;
            var data = this._storage[this._controller.selectedPageId];
            if (data != undefined)
                this._owner.setProp(fgui.ObjectPropID.FontSize, data);
            else
                this._owner.setProp(fgui.ObjectPropID.FontSize, this._default);
            this._owner._gearLocked = false;
        };
        GearFontSize.prototype.updateState = function () {
            this._storage[this._controller.selectedPageId] = this._owner.getProp(fgui.ObjectPropID.FontSize);
        };
        return GearFontSize;
    }(fgui.GearBase));
    fgui.GearFontSize = GearFontSize;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearIcon = (function (_super_1) {
        __extends(GearIcon, _super_1);
        function GearIcon(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearIcon.prototype.init = function () {
            this._default = this._owner.icon;
            this._storage = {};
        };
        GearIcon.prototype.addStatus = function (pageId, buffer) {
            if (pageId == null)
                this._default = buffer.readS();
            else
                this._storage[pageId] = buffer.readS();
        };
        GearIcon.prototype.apply = function () {
            this._owner._gearLocked = true;
            var data = this._storage[this._controller.selectedPageId];
            if (data !== undefined)
                this._owner.icon = data;
            else
                this._owner.icon = this._default;
            this._owner._gearLocked = false;
        };
        GearIcon.prototype.updateState = function () {
            this._storage[this._controller.selectedPageId] = this._owner.icon;
        };
        return GearIcon;
    }(fgui.GearBase));
    fgui.GearIcon = GearIcon;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearLook = (function (_super_1) {
        __extends(GearLook, _super_1);
        function GearLook(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearLook.prototype.init = function () {
            this._default = {
                alpha: this._owner.alpha,
                rotation: this._owner.rotation,
                grayed: this._owner.grayed,
                touchable: this._owner.touchable
            };
            this._storage = {};
        };
        GearLook.prototype.addStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                this._storage[pageId] = gv = {};
            gv.alpha = buffer.readFloat();
            gv.rotation = buffer.readFloat();
            gv.grayed = buffer.readBool();
            gv.touchable = buffer.readBool();
        };
        GearLook.prototype.apply = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                gv = this._default;
            if (this._tweenConfig && this._tweenConfig.tween && !fgui.UIPackage._constructing && !fgui.GearBase.disableAllTweenEffect) {
                this._owner._gearLocked = true;
                this._owner.grayed = gv.grayed;
                this._owner.touchable = gv.touchable;
                this._owner._gearLocked = false;
                if (this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x != gv.alpha || this._tweenConfig._tweener.endValue.y != gv.rotation) {
                        this._tweenConfig._tweener.kill(true);
                        this._tweenConfig._tweener = null;
                    }
                    else
                        return;
                }
                var a = gv.alpha != this._owner.alpha;
                var b = gv.rotation != this._owner.rotation;
                if (a || b) {
                    if (this._owner.checkGearController(0, this._controller))
                        this._tweenConfig._displayLockToken = this._owner.addDisplayLock();
                    this._tweenConfig._tweener = fgui.GTween.to2(this._owner.alpha, this._owner.rotation, gv.alpha, gv.rotation, this._tweenConfig.duration)
                        .setDelay(this._tweenConfig.delay)
                        .setEase(this._tweenConfig.easeType)
                        .setUserData((a ? 1 : 0) + (b ? 2 : 0))
                        .setTarget(this)
                        .onUpdate(this.__tweenUpdate, this)
                        .onComplete(this.__tweenComplete, this);
                }
            }
            else {
                this._owner._gearLocked = true;
                this._owner.grayed = gv.grayed;
                this._owner.touchable = gv.touchable;
                this._owner.alpha = gv.alpha;
                this._owner.rotation = gv.rotation;
                this._owner._gearLocked = false;
            }
        };
        GearLook.prototype.__tweenUpdate = function (tweener) {
            var flag = tweener.userData;
            this._owner._gearLocked = true;
            if ((flag & 1) != 0)
                this._owner.alpha = tweener.value.x;
            if ((flag & 2) != 0)
                this._owner.rotation = tweener.value.y;
            this._owner._gearLocked = false;
        };
        GearLook.prototype.__tweenComplete = function () {
            if (this._tweenConfig._displayLockToken != 0) {
                this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken);
                this._tweenConfig._displayLockToken = 0;
            }
            this._tweenConfig._tweener = null;
        };
        GearLook.prototype.updateState = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                this._storage[this._controller.selectedPageId] = gv = {};
            gv.alpha = this._owner.alpha;
            gv.rotation = this._owner.rotation;
            gv.grayed = this._owner.grayed;
            gv.touchable = this._owner.touchable;
        };
        return GearLook;
    }(fgui.GearBase));
    fgui.GearLook = GearLook;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearSize = (function (_super_1) {
        __extends(GearSize, _super_1);
        function GearSize(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearSize.prototype.init = function () {
            this._default = {
                width: this._owner.width,
                height: this._owner.height,
                scaleX: this._owner.scaleX,
                scaleY: this._owner.scaleY
            };
            this._storage = {};
        };
        GearSize.prototype.addStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                this._storage[pageId] = gv = {};
            gv.width = buffer.readInt();
            gv.height = buffer.readInt();
            gv.scaleX = buffer.readFloat();
            gv.scaleY = buffer.readFloat();
        };
        GearSize.prototype.apply = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                gv = this._default;
            if (this._tweenConfig && this._tweenConfig.tween && !fgui.UIPackage._constructing && !fgui.GearBase.disableAllTweenEffect) {
                if (this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x != gv.width || this._tweenConfig._tweener.endValue.y != gv.height
                        || this._tweenConfig._tweener.endValue.z != gv.scaleX || this._tweenConfig._tweener.endValue.w != gv.scaleY) {
                        this._tweenConfig._tweener.kill(true);
                        this._tweenConfig._tweener = null;
                    }
                    else
                        return;
                }
                var a = gv.width != this._owner.width || gv.height != this._owner.height;
                var b = gv.scaleX != this._owner.scaleX || gv.scaleY != this._owner.scaleY;
                if (a || b) {
                    if (this._owner.checkGearController(0, this._controller))
                        this._tweenConfig._displayLockToken = this._owner.addDisplayLock();
                    this._tweenConfig._tweener = fgui.GTween.to4(this._owner.width, this._owner.height, this._owner.scaleX, this._owner.scaleY, gv.width, gv.height, gv.scaleX, gv.scaleY, this._tweenConfig.duration)
                        .setDelay(this._tweenConfig.delay)
                        .setEase(this._tweenConfig.easeType)
                        .setUserData((a ? 1 : 0) + (b ? 2 : 0))
                        .setTarget(this)
                        .onUpdate(this.__tweenUpdate, this)
                        .onComplete(this.__tweenComplete, this);
                }
            }
            else {
                this._owner._gearLocked = true;
                this._owner.setSize(gv.width, gv.height, this._owner.gearXY.controller == this._controller);
                this._owner.setScale(gv.scaleX, gv.scaleY);
                this._owner._gearLocked = false;
            }
        };
        GearSize.prototype.__tweenUpdate = function (tweener) {
            var flag = tweener.userData;
            this._owner._gearLocked = true;
            if ((flag & 1) != 0)
                this._owner.setSize(tweener.value.x, tweener.value.y, this._owner.checkGearController(1, this._controller));
            if ((flag & 2) != 0)
                this._owner.setScale(tweener.value.z, tweener.value.w);
            this._owner._gearLocked = false;
        };
        GearSize.prototype.__tweenComplete = function () {
            if (this._tweenConfig._displayLockToken != 0) {
                this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken);
                this._tweenConfig._displayLockToken = 0;
            }
            this._tweenConfig._tweener = null;
        };
        GearSize.prototype.updateState = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                this._storage[this._controller.selectedPageId] = gv = {};
            gv.width = this._owner.width;
            gv.height = this._owner.height;
            gv.scaleX = this._owner.scaleX;
            gv.scaleY = this._owner.scaleY;
        };
        GearSize.prototype.updateFromRelations = function (dx, dy) {
            if (this._controller == null || this._storage == null)
                return;
            for (var key in this._storage) {
                var gv = this._storage[key];
                gv.width += dx;
                gv.height += dy;
            }
            this._default.width += dx;
            this._default.height += dy;
            this.updateState();
        };
        return GearSize;
    }(fgui.GearBase));
    fgui.GearSize = GearSize;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearText = (function (_super_1) {
        __extends(GearText, _super_1);
        function GearText(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearText.prototype.init = function () {
            this._default = this._owner.text;
            this._storage = {};
        };
        GearText.prototype.addStatus = function (pageId, buffer) {
            if (pageId == null)
                this._default = buffer.readS();
            else
                this._storage[pageId] = buffer.readS();
        };
        GearText.prototype.apply = function () {
            this._owner._gearLocked = true;
            var data = this._storage[this._controller.selectedPageId];
            if (data !== undefined)
                this._owner.text = data;
            else
                this._owner.text = this._default;
            this._owner._gearLocked = false;
        };
        GearText.prototype.updateState = function () {
            this._storage[this._controller.selectedPageId] = this._owner.text;
        };
        return GearText;
    }(fgui.GearBase));
    fgui.GearText = GearText;
})(fgui || (fgui = {}));

(function (fgui) {
    var GearXY = (function (_super_1) {
        __extends(GearXY, _super_1);
        function GearXY(owner) {
            return _super_1.call(this, owner) || this;
        }
        GearXY.prototype.init = function () {
            this._default = {
                x: this._owner.x,
                y: this._owner.y,
                px: this._owner.x / this._owner.parent.width,
                py: this._owner.y / this._owner.parent.height
            };
            this._storage = {};
        };
        GearXY.prototype.addStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                this._storage[pageId] = gv = {};
            gv.x = buffer.readInt();
            gv.y = buffer.readInt();
        };
        GearXY.prototype.addExtStatus = function (pageId, buffer) {
            var gv;
            if (pageId == null)
                gv = this._default;
            else
                gv = this._storage[pageId];
            gv.px = buffer.readFloat();
            gv.py = buffer.readFloat();
        };
        GearXY.prototype.apply = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                gv = this._default;
            var ex;
            var ey;
            if (this.positionsInPercent && this._owner.parent) {
                ex = gv.px * this._owner.parent.width;
                ey = gv.py * this._owner.parent.height;
            }
            else {
                ex = gv.x;
                ey = gv.y;
            }
            if (this._tweenConfig && this._tweenConfig.tween && !fgui.UIPackage._constructing && !fgui.GearBase.disableAllTweenEffect) {
                if (this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x != ex || this._tweenConfig._tweener.endValue.y != ey) {
                        this._tweenConfig._tweener.kill(true);
                        this._tweenConfig._tweener = null;
                    }
                    else
                        return;
                }
                var ox = this._owner.x;
                var oy = this._owner.y;
                if (ox != ex || oy != ey) {
                    if (this._owner.checkGearController(0, this._controller))
                        this._tweenConfig._displayLockToken = this._owner.addDisplayLock();
                    this._tweenConfig._tweener = fgui.GTween.to2(ox, oy, ex, ey, this._tweenConfig.duration)
                        .setDelay(this._tweenConfig.delay)
                        .setEase(this._tweenConfig.easeType)
                        .setTarget(this)
                        .onUpdate(this.__tweenUpdate, this)
                        .onComplete(this.__tweenComplete, this);
                }
            }
            else {
                this._owner._gearLocked = true;
                this._owner.setXY(ex, ey);
                this._owner._gearLocked = false;
            }
        };
        GearXY.prototype.__tweenUpdate = function (tweener) {
            this._owner._gearLocked = true;
            this._owner.setXY(tweener.value.x, tweener.value.y);
            this._owner._gearLocked = false;
        };
        GearXY.prototype.__tweenComplete = function () {
            if (this._tweenConfig._displayLockToken != 0) {
                this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken);
                this._tweenConfig._displayLockToken = 0;
            }
            this._tweenConfig._tweener = null;
        };
        GearXY.prototype.updateState = function () {
            var gv = this._storage[this._controller.selectedPageId];
            if (!gv)
                this._storage[this._controller.selectedPageId] = gv = {};
            gv.x = this._owner.x;
            gv.y = this._owner.y;
            gv.px = this._owner.x / this._owner.parent.width;
            gv.py = this._owner.y / this._owner.parent.height;
        };
        GearXY.prototype.updateFromRelations = function (dx, dy) {
            if (this._controller == null || this._storage == null || this.positionsInPercent)
                return;
            for (var key in this._storage) {
                var pt = this._storage[key];
                pt.x += dx;
                pt.y += dy;
            }
            this._default.x += dx;
            this._default.y += dy;
            this.updateState();
        };
        return GearXY;
    }(fgui.GearBase));
    fgui.GearXY = GearXY;
})(fgui || (fgui = {}));

(function (fgui) {
    var _PiOver2 = Math.PI * 0.5;
    var _TwoPi = Math.PI * 2;
    function evaluateEase(easeType, time, duration, overshootOrAmplitude, period) {
        switch (easeType) {
            case fgui.EaseType.Linear:
                return time / duration;
            case fgui.EaseType.SineIn:
                return -Math.cos(time / duration * _PiOver2) + 1;
            case fgui.EaseType.SineOut:
                return Math.sin(time / duration * _PiOver2);
            case fgui.EaseType.SineInOut:
                return -0.5 * (Math.cos(Math.PI * time / duration) - 1);
            case fgui.EaseType.QuadIn:
                return (time /= duration) * time;
            case fgui.EaseType.QuadOut:
                return -(time /= duration) * (time - 2);
            case fgui.EaseType.QuadInOut:
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * time * time;
                return -0.5 * ((--time) * (time - 2) - 1);
            case fgui.EaseType.CubicIn:
                return (time /= duration) * time * time;
            case fgui.EaseType.CubicOut:
                return ((time = time / duration - 1) * time * time + 1);
            case fgui.EaseType.CubicInOut:
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * time * time * time;
                return 0.5 * ((time -= 2) * time * time + 2);
            case fgui.EaseType.QuartIn:
                return (time /= duration) * time * time * time;
            case fgui.EaseType.QuartOut:
                return -((time = time / duration - 1) * time * time * time - 1);
            case fgui.EaseType.QuartInOut:
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * time * time * time * time;
                return -0.5 * ((time -= 2) * time * time * time - 2);
            case fgui.EaseType.QuintIn:
                return (time /= duration) * time * time * time * time;
            case fgui.EaseType.QuintOut:
                return ((time = time / duration - 1) * time * time * time * time + 1);
            case fgui.EaseType.QuintInOut:
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * time * time * time * time * time;
                return 0.5 * ((time -= 2) * time * time * time * time + 2);
            case fgui.EaseType.ExpoIn:
                return (time == 0) ? 0 : Math.pow(2, 10 * (time / duration - 1));
            case fgui.EaseType.ExpoOut:
                if (time == duration)
                    return 1;
                return (-Math.pow(2, -10 * time / duration) + 1);
            case fgui.EaseType.ExpoInOut:
                if (time == 0)
                    return 0;
                if (time == duration)
                    return 1;
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * Math.pow(2, 10 * (time - 1));
                return 0.5 * (-Math.pow(2, -10 * --time) + 2);
            case fgui.EaseType.CircIn:
                return -(Math.sqrt(1 - (time /= duration) * time) - 1);
            case fgui.EaseType.CircOut:
                return Math.sqrt(1 - (time = time / duration - 1) * time);
            case fgui.EaseType.CircInOut:
                if ((time /= duration * 0.5) < 1)
                    return -0.5 * (Math.sqrt(1 - time * time) - 1);
                return 0.5 * (Math.sqrt(1 - (time -= 2) * time) + 1);
            case fgui.EaseType.ElasticIn:
                var s0;
                if (time == 0)
                    return 0;
                if ((time /= duration) == 1)
                    return 1;
                if (period == 0)
                    period = duration * 0.3;
                if (overshootOrAmplitude < 1) {
                    overshootOrAmplitude = 1;
                    s0 = period / 4;
                }
                else
                    s0 = period / _TwoPi * Math.asin(1 / overshootOrAmplitude);
                return -(overshootOrAmplitude * Math.pow(2, 10 * (time -= 1)) * Math.sin((time * duration - s0) * _TwoPi / period));
            case fgui.EaseType.ElasticOut:
                var s1;
                if (time == 0)
                    return 0;
                if ((time /= duration) == 1)
                    return 1;
                if (period == 0)
                    period = duration * 0.3;
                if (overshootOrAmplitude < 1) {
                    overshootOrAmplitude = 1;
                    s1 = period / 4;
                }
                else
                    s1 = period / _TwoPi * Math.asin(1 / overshootOrAmplitude);
                return (overshootOrAmplitude * Math.pow(2, -10 * time) * Math.sin((time * duration - s1) * _TwoPi / period) + 1);
            case fgui.EaseType.ElasticInOut:
                var s;
                if (time == 0)
                    return 0;
                if ((time /= duration * 0.5) == 2)
                    return 1;
                if (period == 0)
                    period = duration * (0.3 * 1.5);
                if (overshootOrAmplitude < 1) {
                    overshootOrAmplitude = 1;
                    s = period / 4;
                }
                else
                    s = period / _TwoPi * Math.asin(1 / overshootOrAmplitude);
                if (time < 1)
                    return -0.5 * (overshootOrAmplitude * Math.pow(2, 10 * (time -= 1)) * Math.sin((time * duration - s) * _TwoPi / period));
                return overshootOrAmplitude * Math.pow(2, -10 * (time -= 1)) * Math.sin((time * duration - s) * _TwoPi / period) * 0.5 + 1;
            case fgui.EaseType.BackIn:
                return (time /= duration) * time * ((overshootOrAmplitude + 1) * time - overshootOrAmplitude);
            case fgui.EaseType.BackOut:
                return ((time = time / duration - 1) * time * ((overshootOrAmplitude + 1) * time + overshootOrAmplitude) + 1);
            case fgui.EaseType.BackInOut:
                if ((time /= duration * 0.5) < 1)
                    return 0.5 * (time * time * (((overshootOrAmplitude *= (1.525)) + 1) * time - overshootOrAmplitude));
                return 0.5 * ((time -= 2) * time * (((overshootOrAmplitude *= (1.525)) + 1) * time + overshootOrAmplitude) + 2);
            case fgui.EaseType.BounceIn:
                return bounce_easeIn(time, duration);
            case fgui.EaseType.BounceOut:
                return bounce_easeOut(time, duration);
            case fgui.EaseType.BounceInOut:
                return bounce_easeInOut(time, duration);
            default:
                return -(time /= duration) * (time - 2);
        }
    }
    fgui.evaluateEase = evaluateEase;
    function bounce_easeIn(time, duration) {
        return 1 - bounce_easeOut(duration - time, duration);
    }
    function bounce_easeOut(time, duration) {
        if ((time /= duration) < (1 / 2.75)) {
            return (7.5625 * time * time);
        }
        if (time < (2 / 2.75)) {
            return (7.5625 * (time -= (1.5 / 2.75)) * time + 0.75);
        }
        if (time < (2.5 / 2.75)) {
            return (7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375);
        }
        return (7.5625 * (time -= (2.625 / 2.75)) * time + 0.984375);
    }
    function bounce_easeInOut(time, duration) {
        if (time < duration * 0.5) {
            return bounce_easeIn(time * 2, duration) * 0.5;
        }
        return bounce_easeOut(time * 2 - duration, duration) * 0.5 + 0.5;
    }
})(fgui || (fgui = {}));

(function (fgui) {
    var EaseType = (function () {
        function EaseType() {
        }
        EaseType.Linear = 0;
        EaseType.SineIn = 1;
        EaseType.SineOut = 2;
        EaseType.SineInOut = 3;
        EaseType.QuadIn = 4;
        EaseType.QuadOut = 5;
        EaseType.QuadInOut = 6;
        EaseType.CubicIn = 7;
        EaseType.CubicOut = 8;
        EaseType.CubicInOut = 9;
        EaseType.QuartIn = 10;
        EaseType.QuartOut = 11;
        EaseType.QuartInOut = 12;
        EaseType.QuintIn = 13;
        EaseType.QuintOut = 14;
        EaseType.QuintInOut = 15;
        EaseType.ExpoIn = 16;
        EaseType.ExpoOut = 17;
        EaseType.ExpoInOut = 18;
        EaseType.CircIn = 19;
        EaseType.CircOut = 20;
        EaseType.CircInOut = 21;
        EaseType.ElasticIn = 22;
        EaseType.ElasticOut = 23;
        EaseType.ElasticInOut = 24;
        EaseType.BackIn = 25;
        EaseType.BackOut = 26;
        EaseType.BackInOut = 27;
        EaseType.BounceIn = 28;
        EaseType.BounceOut = 29;
        EaseType.BounceInOut = 30;
        EaseType.Custom = 31;
        return EaseType;
    }());
    fgui.EaseType = EaseType;
})(fgui || (fgui = {}));

(function (fgui) {
    var GPath = (function () {
        function GPath() {
            this._segments = new Array();
            this._points = new Array();
        }
        Object.defineProperty(GPath.prototype, "length", {
            get: function () {
                return this._fullLength;
            },
            enumerable: true,
            configurable: true
        });
        GPath.prototype.create = function (pt1, pt2, pt3, pt4) {
            var points;
            if (Array.isArray(pt1))
                points = pt1;
            else {
                points = new Array();
                points.push(pt1);
                points.push(pt2);
                if (pt3)
                    points.push(pt3);
                if (pt4)
                    points.push(pt4);
            }
            this._segments.length = 0;
            this._points.length = 0;
            this._fullLength = 0;
            var cnt = points.length;
            if (cnt == 0)
                return;
            var splinePoints = s_points;
            splinePoints.length = 0;
            var prev = points[0];
            if (prev.curveType == fgui.CurveType.CRSpline)
                splinePoints.push(new egret.Point(prev.x, prev.y));
            for (var i = 1; i < cnt; i++) {
                var current = points[i];
                if (prev.curveType != fgui.CurveType.CRSpline) {
                    var seg = {};
                    seg.type = prev.curveType;
                    seg.ptStart = this._points.length;
                    if (prev.curveType == fgui.CurveType.Straight) {
                        seg.ptCount = 2;
                        this._points.push(new egret.Point(prev.x, prev.y));
                        this._points.push(new egret.Point(current.x, current.y));
                    }
                    else if (prev.curveType == fgui.CurveType.Bezier) {
                        seg.ptCount = 3;
                        this._points.push(new egret.Point(prev.x, prev.y));
                        this._points.push(new egret.Point(current.x, current.y));
                        this._points.push(new egret.Point(prev.control1_x, prev.control1_y));
                    }
                    else if (prev.curveType == fgui.CurveType.CubicBezier) {
                        seg.ptCount = 4;
                        this._points.push(new egret.Point(prev.x, prev.y));
                        this._points.push(new egret.Point(current.x, current.y));
                        this._points.push(new egret.Point(prev.control1_x, prev.control1_y));
                        this._points.push(new egret.Point(prev.control2_x, prev.control2_y));
                    }
                    seg.length = fgui.ToolSet.distance(prev.x, prev.y, current.x, current.y);
                    this._fullLength += seg.length;
                    this._segments.push(seg);
                }
                if (current.curveType != fgui.CurveType.CRSpline) {
                    if (splinePoints.length > 0) {
                        splinePoints.push(new egret.Point(current.x, current.y));
                        this.createSplineSegment();
                    }
                }
                else
                    splinePoints.push(new egret.Point(current.x, current.y));
                prev = current;
            }
            if (splinePoints.length > 1)
                this.createSplineSegment();
        };
        GPath.prototype.createSplineSegment = function () {
            var splinePoints = s_points;
            var cnt = splinePoints.length;
            splinePoints.splice(0, 0, splinePoints[0]);
            splinePoints.push(splinePoints[cnt]);
            splinePoints.push(splinePoints[cnt]);
            cnt += 3;
            var seg = {};
            seg.type = fgui.CurveType.CRSpline;
            seg.ptStart = this._points.length;
            seg.ptCount = cnt;
            this._points = this._points.concat(splinePoints);
            seg.length = 0;
            for (var i = 1; i < cnt; i++) {
                seg.length += fgui.ToolSet.distance(splinePoints[i - 1].x, splinePoints[i - 1].y, splinePoints[i].x, splinePoints[i].y);
            }
            this._fullLength += seg.length;
            this._segments.push(seg);
            splinePoints.length = 0;
        };
        GPath.prototype.clear = function () {
            this._segments.length = 0;
            this._points.length = 0;
        };
        GPath.prototype.getPointAt = function (t, result) {
            if (!result)
                result = new egret.Point();
            else
                result.x = result.y = 0;
            t = fgui.ToolSet.clamp01(t);
            var cnt = this._segments.length;
            if (cnt == 0) {
                return result;
            }
            var seg;
            if (t == 1) {
                seg = this._segments[cnt - 1];
                if (seg.type == fgui.CurveType.Straight) {
                    result.x = fgui.ToolSet.lerp(this._points[seg.ptStart].x, this._points[seg.ptStart + 1].x, t);
                    result.y = fgui.ToolSet.lerp(this._points[seg.ptStart].y, this._points[seg.ptStart + 1].y, t);
                    return result;
                }
                else if (seg.type == fgui.CurveType.Bezier || seg.type == fgui.CurveType.CubicBezier)
                    return this.onBezierCurve(seg.ptStart, seg.ptCount, t, result);
                else
                    return this.onCRSplineCurve(seg.ptStart, seg.ptCount, t, result);
            }
            var len = t * this._fullLength;
            for (var i = 0; i < cnt; i++) {
                seg = this._segments[i];
                len -= seg.length;
                if (len < 0) {
                    t = 1 + len / seg.length;
                    if (seg.type == fgui.CurveType.Straight) {
                        result.x = fgui.ToolSet.lerp(this._points[seg.ptStart].x, this._points[seg.ptStart + 1].x, t);
                        result.y = fgui.ToolSet.lerp(this._points[seg.ptStart].y, this._points[seg.ptStart + 1].y, t);
                    }
                    else if (seg.type == fgui.CurveType.Bezier || seg.type == fgui.CurveType.CubicBezier)
                        result = this.onBezierCurve(seg.ptStart, seg.ptCount, t, result);
                    else
                        result = this.onCRSplineCurve(seg.ptStart, seg.ptCount, t, result);
                    break;
                }
            }
            return result;
        };
        Object.defineProperty(GPath.prototype, "segmentCount", {
            get: function () {
                return this._segments.length;
            },
            enumerable: true,
            configurable: true
        });
        GPath.prototype.getAnchorsInSegment = function (segmentIndex, points) {
            if (points == null)
                points = new Array();
            var seg = this._segments[segmentIndex];
            for (var i = 0; i < seg.ptCount; i++)
                points.push(new egret.Point(this._points[seg.ptStart + i].x, this._points[seg.ptStart + i].y));
            return points;
        };
        GPath.prototype.getPointsInSegment = function (segmentIndex, t0, t1, points, ts, pointDensity) {
            if (points == null)
                points = new Array();
            if (!pointDensity || isNaN(pointDensity))
                pointDensity = 0.1;
            if (ts)
                ts.push(t0);
            var seg = this._segments[segmentIndex];
            if (seg.type == fgui.CurveType.Straight) {
                points.push(new egret.Point(fgui.ToolSet.lerp(this._points[seg.ptStart].x, this._points[seg.ptStart + 1].x, t0), fgui.ToolSet.lerp(this._points[seg.ptStart].y, this._points[seg.ptStart + 1].y, t0)));
                points.push(new egret.Point(fgui.ToolSet.lerp(this._points[seg.ptStart].x, this._points[seg.ptStart + 1].x, t1), fgui.ToolSet.lerp(this._points[seg.ptStart].y, this._points[seg.ptStart + 1].y, t1)));
            }
            else {
                var func;
                if (seg.type == fgui.CurveType.Bezier || seg.type == fgui.CurveType.CubicBezier)
                    func = this.onBezierCurve;
                else
                    func = this.onCRSplineCurve;
                points.push(func.call(this, seg.ptStart, seg.ptCount, t0, new egret.Point()));
                var SmoothAmount = Math.min(seg.length * pointDensity, 50);
                for (var j = 0; j <= SmoothAmount; j++) {
                    var t = j / SmoothAmount;
                    if (t > t0 && t < t1) {
                        points.push(func.call(this, seg.ptStart, seg.ptCount, t, new egret.Point()));
                        if (ts != null)
                            ts.push(t);
                    }
                }
                points.push(func.call(this, seg.ptStart, seg.ptCount, t1, new egret.Point()));
            }
            if (ts != null)
                ts.push(t1);
            return points;
        };
        GPath.prototype.getAllPoints = function (points, ts, pointDensity) {
            if (points == null)
                points = new Array();
            if (!pointDensity || isNaN(pointDensity))
                pointDensity = 0.1;
            var cnt = this._segments.length;
            for (var i = 0; i < cnt; i++)
                this.getPointsInSegment(i, 0, 1, points, ts, pointDensity);
            return points;
        };
        GPath.prototype.onCRSplineCurve = function (ptStart, ptCount, t, result) {
            var adjustedIndex = Math.floor(t * (ptCount - 4)) + ptStart;
            var p0x = this._points[adjustedIndex].x;
            var p0y = this._points[adjustedIndex].y;
            var p1x = this._points[adjustedIndex + 1].x;
            var p1y = this._points[adjustedIndex + 1].y;
            var p2x = this._points[adjustedIndex + 2].x;
            var p2y = this._points[adjustedIndex + 2].y;
            var p3x = this._points[adjustedIndex + 3].x;
            var p3y = this._points[adjustedIndex + 3].y;
            var adjustedT = (t == 1) ? 1 : fgui.ToolSet.repeat(t * (ptCount - 4), 1);
            var t0 = ((-adjustedT + 2) * adjustedT - 1) * adjustedT * 0.5;
            var t1 = (((3 * adjustedT - 5) * adjustedT) * adjustedT + 2) * 0.5;
            var t2 = ((-3 * adjustedT + 4) * adjustedT + 1) * adjustedT * 0.5;
            var t3 = ((adjustedT - 1) * adjustedT * adjustedT) * 0.5;
            result.x = p0x * t0 + p1x * t1 + p2x * t2 + p3x * t3;
            result.y = p0y * t0 + p1y * t1 + p2y * t2 + p3y * t3;
            return result;
        };
        GPath.prototype.onBezierCurve = function (ptStart, ptCount, t, result) {
            var t2 = 1 - t;
            var p0x = this._points[ptStart].x;
            var p0y = this._points[ptStart].y;
            var p1x = this._points[ptStart + 1].x;
            var p1y = this._points[ptStart + 1].y;
            var cp0x = this._points[ptStart + 2].x;
            var cp0y = this._points[ptStart + 2].y;
            if (ptCount == 4) {
                var cp1x = this._points[ptStart + 3].x;
                var cp1y = this._points[ptStart + 3].y;
                result.x = t2 * t2 * t2 * p0x + 3 * t2 * t2 * t * cp0x + 3 * t2 * t * t * cp1x + t * t * t * p1x;
                result.y = t2 * t2 * t2 * p0y + 3 * t2 * t2 * t * cp0y + 3 * t2 * t * t * cp1y + t * t * t * p1y;
            }
            else {
                result.x = t2 * t2 * p0x + 2 * t2 * t * cp0x + t * t * p1x;
                result.y = t2 * t2 * p0y + 2 * t2 * t * cp0y + t * t * p1y;
            }
            return result;
        };
        return GPath;
    }());
    fgui.GPath = GPath;
    var s_points = new Array();
})(fgui || (fgui = {}));

(function (fgui) {
    var CurveType;
    (function (CurveType) {
        CurveType[CurveType["CRSpline"] = 0] = "CRSpline";
        CurveType[CurveType["Bezier"] = 1] = "Bezier";
        CurveType[CurveType["CubicBezier"] = 2] = "CubicBezier";
        CurveType[CurveType["Straight"] = 3] = "Straight";
    })(CurveType = fgui.CurveType || (fgui.CurveType = {}));
    var GPathPoint = (function () {
        function GPathPoint() {
            this.x = 0;
            this.y = 0;
            this.control1_x = 0;
            this.control1_y = 0;
            this.control2_x = 0;
            this.control2_y = 0;
            this.curveType = 0;
        }
        GPathPoint.newPoint = function (x, y, curveType) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (curveType === void 0) { curveType = 0; }
            var pt = new GPathPoint();
            pt.x = x;
            pt.y = y;
            pt.control1_x = 0;
            pt.control1_y = 0;
            pt.control2_x = 0;
            pt.control2_y = 0;
            pt.curveType = curveType;
            return pt;
        };
        GPathPoint.newBezierPoint = function (x, y, control1_x, control1_y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (control1_x === void 0) { control1_x = 0; }
            if (control1_y === void 0) { control1_y = 0; }
            var pt = new GPathPoint();
            pt.x = x;
            pt.y = y;
            pt.control1_x = control1_x;
            pt.control1_y = control1_y;
            pt.control2_x = 0;
            pt.control2_y = 0;
            pt.curveType = CurveType.Bezier;
            return pt;
        };
        GPathPoint.newCubicBezierPoint = function (x, y, control1_x, control1_y, control2_x, control2_y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (control1_x === void 0) { control1_x = 0; }
            if (control1_y === void 0) { control1_y = 0; }
            if (control2_x === void 0) { control2_x = 0; }
            if (control2_y === void 0) { control2_y = 0; }
            var pt = new GPathPoint();
            pt.x = x;
            pt.y = y;
            pt.control1_x = control1_x;
            pt.control1_y = control1_y;
            pt.control2_x = control2_x;
            pt.control2_y = control2_y;
            pt.curveType = CurveType.CubicBezier;
            return pt;
        };
        GPathPoint.prototype.clone = function () {
            var ret = new GPathPoint();
            ret.x = this.x;
            ret.y = this.y;
            ret.control1_x = this.control1_x;
            ret.control1_y = this.control1_y;
            ret.control2_x = this.control2_x;
            ret.control2_y = this.control2_y;
            ret.curveType = this.curveType;
            return ret;
        };
        return GPathPoint;
    }());
    fgui.GPathPoint = GPathPoint;
})(fgui || (fgui = {}));

(function (fgui) {
    var GTween = (function () {
        function GTween() {
        }
        GTween.to = function (start, end, duration) {
            return fgui.TweenManager.createTween()._to(start, end, duration);
        };
        GTween.to2 = function (start, start2, end, end2, duration) {
            return fgui.TweenManager.createTween()._to2(start, start2, end, end2, duration);
        };
        GTween.to3 = function (start, start2, start3, end, end2, end3, duration) {
            return fgui.TweenManager.createTween()._to3(start, start2, start3, end, end2, end3, duration);
        };
        GTween.to4 = function (start, start2, start3, start4, end, end2, end3, end4, duration) {
            return fgui.TweenManager.createTween()._to4(start, start2, start3, start4, end, end2, end3, end4, duration);
        };
        GTween.toColor = function (start, end, duration) {
            return fgui.TweenManager.createTween()._toColor(start, end, duration);
        };
        GTween.delayedCall = function (delay) {
            return fgui.TweenManager.createTween().setDelay(delay);
        };
        GTween.shake = function (startX, startY, amplitude, duration) {
            return fgui.TweenManager.createTween()._shake(startX, startY, amplitude, duration);
        };
        GTween.isTweening = function (target, propType) {
            return fgui.TweenManager.isTweening(target, propType);
        };
        GTween.kill = function (target, complete, propType) {
            fgui.TweenManager.killTweens(target, complete, propType);
        };
        GTween.getTween = function (target, propType) {
            return fgui.TweenManager.getTween(target, propType);
        };
        GTween.catchCallbackExceptions = true;
        return GTween;
    }());
    fgui.GTween = GTween;
})(fgui || (fgui = {}));

(function (fgui) {
    var GTweener = (function () {
        function GTweener() {
            this._startValue = new fgui.TweenValue();
            this._endValue = new fgui.TweenValue();
            this._value = new fgui.TweenValue();
            this._deltaValue = new fgui.TweenValue();
            this._reset();
        }
        GTweener.prototype.setDelay = function (value) {
            this._delay = value;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "delay", {
            get: function () {
                return this._delay;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setDuration = function (value) {
            this._duration = value;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "duration", {
            get: function () {
                return this._duration;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setBreakpoint = function (value) {
            this._breakpoint = value;
            return this;
        };
        GTweener.prototype.setEase = function (value) {
            this._easeType = value;
            return this;
        };
        GTweener.prototype.setEasePeriod = function (value) {
            this._easePeriod = value;
            return this;
        };
        GTweener.prototype.setEaseOvershootOrAmplitude = function (value) {
            this._easeOvershootOrAmplitude = value;
            return this;
        };
        GTweener.prototype.setRepeat = function (repeat, yoyo) {
            this._repeat = repeat;
            this._yoyo = yoyo;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "repeat", {
            get: function () {
                return this._repeat;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setTimeScale = function (value) {
            this._timeScale = value;
            return this;
        };
        GTweener.prototype.setSnapping = function (value) {
            this._snapping = value;
            return this;
        };
        GTweener.prototype.setTarget = function (value, propType) {
            this._target = value;
            this._propType = propType;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "target", {
            get: function () {
                return this._target;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setUserData = function (value) {
            this._userData = value;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "userData", {
            get: function () {
                return this._userData;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setPath = function (value) {
            this._path = value;
            return this;
        };
        GTweener.prototype.onUpdate = function (callback, caller) {
            this._onUpdate = callback;
            this._onUpdateCaller = caller;
            return this;
        };
        GTweener.prototype.onStart = function (callback, caller) {
            this._onStart = callback;
            this._onStartCaller = caller;
            return this;
        };
        GTweener.prototype.onComplete = function (callback, caller) {
            this._onComplete = callback;
            this._onCompleteCaller = caller;
            return this;
        };
        Object.defineProperty(GTweener.prototype, "startValue", {
            get: function () {
                return this._startValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "endValue", {
            get: function () {
                return this._endValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "value", {
            get: function () {
                return this._value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "deltaValue", {
            get: function () {
                return this._deltaValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "normalizedTime", {
            get: function () {
                return this._normalizedTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "completed", {
            get: function () {
                return this._ended != 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GTweener.prototype, "allCompleted", {
            get: function () {
                return this._ended == 1;
            },
            enumerable: true,
            configurable: true
        });
        GTweener.prototype.setPaused = function (paused) {
            this._paused = paused;
            return this;
        };
        GTweener.prototype.seek = function (time) {
            if (this._killed)
                return;
            this._elapsedTime = time;
            if (this._elapsedTime < this._delay) {
                if (this._started)
                    this._elapsedTime = this._delay;
                else
                    return;
            }
            this.update();
        };
        GTweener.prototype.kill = function (complete) {
            if (this._killed)
                return;
            if (complete) {
                if (this._ended == 0) {
                    if (this._breakpoint >= 0)
                        this._elapsedTime = this._delay + this._breakpoint;
                    else if (this._repeat >= 0)
                        this._elapsedTime = this._delay + this._duration * (this._repeat + 1);
                    else
                        this._elapsedTime = this._delay + this._duration * 2;
                    this.update();
                }
                this.callCompleteCallback();
            }
            this._killed = true;
        };
        GTweener.prototype._to = function (start, end, duration) {
            this._valueSize = 1;
            this._startValue.x = start;
            this._endValue.x = end;
            this._value.x = start;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._to2 = function (start, start2, end, end2, duration) {
            this._valueSize = 2;
            this._startValue.x = start;
            this._endValue.x = end;
            this._startValue.y = start2;
            this._endValue.y = end2;
            this._value.x = start;
            this._value.y = start2;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._to3 = function (start, start2, start3, end, end2, end3, duration) {
            this._valueSize = 3;
            this._startValue.x = start;
            this._endValue.x = end;
            this._startValue.y = start2;
            this._endValue.y = end2;
            this._startValue.z = start3;
            this._endValue.z = end3;
            this._value.x = start;
            this._value.y = start2;
            this._value.z = start3;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._to4 = function (start, start2, start3, start4, end, end2, end3, end4, duration) {
            this._valueSize = 4;
            this._startValue.x = start;
            this._endValue.x = end;
            this._startValue.y = start2;
            this._endValue.y = end2;
            this._startValue.z = start3;
            this._endValue.z = end3;
            this._startValue.w = start4;
            this._endValue.w = end4;
            this._value.x = start;
            this._value.y = start2;
            this._value.z = start3;
            this._value.w = start4;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._toColor = function (start, end, duration) {
            this._valueSize = 4;
            this._startValue.color = start;
            this._endValue.color = end;
            this._value.color = start;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._shake = function (startX, startY, amplitude, duration) {
            this._valueSize = 5;
            this._startValue.x = startX;
            this._startValue.y = startY;
            this._startValue.w = amplitude;
            this._duration = duration;
            return this;
        };
        GTweener.prototype._init = function () {
            this._delay = 0;
            this._duration = 0;
            this._breakpoint = -1;
            this._easeType = fgui.EaseType.QuadOut;
            this._timeScale = 1;
            this._easePeriod = 0;
            this._easeOvershootOrAmplitude = 1.70158;
            this._snapping = false;
            this._repeat = 0;
            this._yoyo = false;
            this._valueSize = 0;
            this._started = false;
            this._paused = false;
            this._killed = false;
            this._elapsedTime = 0;
            this._normalizedTime = 0;
            this._ended = 0;
        };
        GTweener.prototype._reset = function () {
            this._target = null;
            this._propType = null;
            this._userData = null;
            this._path = null;
            this._onStart = this._onUpdate = this._onComplete = null;
            this._onStartCaller = this._onUpdateCaller = this._onCompleteCaller = null;
        };
        GTweener.prototype._update = function (dt) {
            if (this._timeScale != 1)
                dt *= this._timeScale;
            if (dt == 0)
                return;
            if (this._ended != 0) {
                this.callCompleteCallback();
                this._killed = true;
                return;
            }
            this._elapsedTime += dt;
            this.update();
            if (this._ended != 0) {
                if (!this._killed) {
                    this.callCompleteCallback();
                    this._killed = true;
                }
            }
        };
        GTweener.prototype.update = function () {
            this._ended = 0;
            if (this._valueSize == 0) {
                if (this._elapsedTime >= this._delay + this._duration)
                    this._ended = 1;
                return;
            }
            if (!this._started) {
                if (this._elapsedTime < this._delay)
                    return;
                this._started = true;
                this.callStartCallback();
                if (this._killed)
                    return;
            }
            var reversed = false;
            var tt = this._elapsedTime - this._delay;
            if (this._breakpoint >= 0 && tt >= this._breakpoint) {
                tt = this._breakpoint;
                this._ended = 2;
            }
            if (this._repeat != 0) {
                var round = Math.floor(tt / this._duration);
                tt -= this._duration * round;
                if (this._yoyo)
                    reversed = round % 2 == 1;
                if (this._repeat > 0 && this._repeat - round < 0) {
                    if (this._yoyo)
                        reversed = this._repeat % 2 == 1;
                    tt = this._duration;
                    this._ended = 1;
                }
            }
            else if (tt >= this._duration) {
                tt = this._duration;
                this._ended = 1;
            }
            this._normalizedTime = fgui.evaluateEase(this._easeType, reversed ? (this._duration - tt) : tt, this._duration, this._easeOvershootOrAmplitude, this._easePeriod);
            this._value.setZero();
            this._deltaValue.setZero();
            if (this._valueSize == 5) {
                if (this._ended == 0) {
                    var r = this._startValue.w * (1 - this._normalizedTime);
                    var rx = r * (Math.random() > 0.5 ? 1 : -1);
                    var ry = r * (Math.random() > 0.5 ? 1 : -1);
                    this._deltaValue.x = rx;
                    this._deltaValue.y = ry;
                    this._value.x = this._startValue.x + rx;
                    this._value.y = this._startValue.y + ry;
                }
                else {
                    this._value.x = this._startValue.x;
                    this._value.y = this._startValue.y;
                }
            }
            else if (this._path) {
                var pt = s_vec2;
                this._path.getPointAt(this._normalizedTime, pt);
                if (this._snapping) {
                    pt.x = Math.round(pt.x);
                    pt.y = Math.round(pt.y);
                }
                this._deltaValue.x = pt.x - this._value.x;
                this._deltaValue.y = pt.y - this._value.y;
                this._value.x = pt.x;
                this._value.y = pt.y;
            }
            else {
                for (var i = 0; i < this._valueSize; i++) {
                    var n1 = this._startValue.getField(i);
                    var n2 = this._endValue.getField(i);
                    var f = n1 + (n2 - n1) * this._normalizedTime;
                    if (this._snapping)
                        f = Math.round(f);
                    this._deltaValue.setField(i, f - this._value.getField(i));
                    this._value.setField(i, f);
                }
            }
            if (this._target != null && this._propType != null) {
                if (this._propType instanceof Function) {
                    switch (this._valueSize) {
                        case 1:
                            this._propType.call(this._target, this._value.x);
                            break;
                        case 2:
                            this._propType.call(this._target, this._value.x, this._value.y);
                            break;
                        case 3:
                            this._propType.call(this._target, this._value.x, this._value.y, this._value.z);
                            break;
                        case 4:
                            this._propType.call(this._target, this._value.x, this._value.y, this._value.z, this._value.w);
                            break;
                        case 5:
                            this._propType.call(this._target, this._value.color);
                            break;
                        case 6:
                            this._propType.call(this._target, this._value.x, this._value.y);
                            break;
                    }
                }
                else {
                    if (this._valueSize == 5)
                        this._target[this._propType] = this._value.color;
                    else
                        this._target[this._propType] = this._value.x;
                }
            }
            this.callUpdateCallback();
        };
        GTweener.prototype.callStartCallback = function () {
            if (this._onStart != null) {
                try {
                    this._onStart.call(this._onStartCaller, this);
                }
                catch (err) {
                    console.log("FairyGUI: error in start callback > " + err);
                }
            }
        };
        GTweener.prototype.callUpdateCallback = function () {
            if (this._onUpdate != null) {
                try {
                    this._onUpdate.call(this._onUpdateCaller, this);
                }
                catch (err) {
                    console.log("FairyGUI: error in update callback > " + err);
                }
            }
        };
        GTweener.prototype.callCompleteCallback = function () {
            if (this._onComplete != null) {
                try {
                    this._onComplete.call(this._onCompleteCaller, this);
                }
                catch (err) {
                    console.log("FairyGUI: error in complete callback > " + err);
                }
            }
        };
        return GTweener;
    }());
    fgui.GTweener = GTweener;
    var s_vec2 = new egret.Point();
})(fgui || (fgui = {}));

(function (fgui) {
    var TweenManager = (function () {
        function TweenManager() {
        }
        TweenManager.createTween = function () {
            if (!_inited) {
                egret.startTick(TweenManager.update, null);
                _inited = true;
                _lastTime = egret.getTimer();
            }
            var tweener;
            var cnt = _tweenerPool.length;
            if (cnt > 0) {
                tweener = _tweenerPool.pop();
            }
            else
                tweener = new fgui.GTweener();
            tweener._init();
            _activeTweens[_totalActiveTweens++] = tweener;
            if (_totalActiveTweens == _activeTweens.length)
                _activeTweens.length = _activeTweens.length + Math.ceil(_activeTweens.length * 0.5);
            return tweener;
        };
        TweenManager.isTweening = function (target, propType) {
            if (target == null)
                return false;
            var anyType = propType == null;
            for (var i = 0; i < _totalActiveTweens; i++) {
                var tweener = _activeTweens[i];
                if (tweener != null && tweener.target == target && !tweener._killed
                    && (anyType || tweener._propType == propType))
                    return true;
            }
            return false;
        };
        TweenManager.killTweens = function (target, completed, propType) {
            if (target == null)
                return false;
            var flag = false;
            var cnt = _totalActiveTweens;
            var anyType = propType == null;
            for (var i = 0; i < cnt; i++) {
                var tweener = _activeTweens[i];
                if (tweener != null && tweener.target == target && !tweener._killed
                    && (anyType || tweener._propType == propType)) {
                    tweener.kill(completed);
                    flag = true;
                }
            }
            return flag;
        };
        TweenManager.getTween = function (target, propType) {
            if (target == null)
                return null;
            var cnt = _totalActiveTweens;
            var anyType = propType == null;
            for (var i = 0; i < cnt; i++) {
                var tweener = _activeTweens[i];
                if (tweener != null && tweener.target == target && !tweener._killed
                    && (anyType || tweener._propType == propType)) {
                    return tweener;
                }
            }
            return null;
        };
        TweenManager.update = function (timestamp) {
            var dt = timestamp - _lastTime;
            _lastTime = timestamp;
            dt /= 1000;
            var cnt = _totalActiveTweens;
            var freePosStart = -1;
            var freePosCount = 0;
            for (var i = 0; i < cnt; i++) {
                var tweener = _activeTweens[i];
                if (tweener == null) {
                    if (freePosStart == -1)
                        freePosStart = i;
                    freePosCount++;
                }
                else if (tweener._killed) {
                    tweener._reset();
                    _tweenerPool.push(tweener);
                    _activeTweens[i] = null;
                    if (freePosStart == -1)
                        freePosStart = i;
                    freePosCount++;
                }
                else {
                    if ((tweener._target instanceof fgui.GObject) && (tweener._target).isDisposed)
                        tweener._killed = true;
                    else if (!tweener._paused)
                        tweener._update(dt);
                    if (freePosStart != -1) {
                        _activeTweens[freePosStart] = tweener;
                        _activeTweens[i] = null;
                        freePosStart++;
                    }
                }
            }
            if (freePosStart >= 0) {
                if (_totalActiveTweens != cnt) {
                    var j = cnt;
                    cnt = _totalActiveTweens - cnt;
                    for (i = 0; i < cnt; i++)
                        _activeTweens[freePosStart++] = _activeTweens[j++];
                }
                _totalActiveTweens = freePosStart;
            }
            return false;
        };
        return TweenManager;
    }());
    fgui.TweenManager = TweenManager;
    var _activeTweens = new Array(30);
    var _tweenerPool = new Array();
    var _totalActiveTweens = 0;
    var _lastTime = 0;
    var _inited;
})(fgui || (fgui = {}));

(function (fgui) {
    var TweenValue = (function () {
        function TweenValue() {
            this.x = this.y = this.z = this.w = 0;
        }
        Object.defineProperty(TweenValue.prototype, "color", {
            get: function () {
                return (this.w << 24) + (this.x << 16) + (this.y << 8) + this.z;
            },
            set: function (value) {
                this.x = (value & 0xFF0000) >> 16;
                this.y = (value & 0x00FF00) >> 8;
                this.z = (value & 0x0000FF);
                this.w = (value & 0xFF000000) >> 24;
            },
            enumerable: true,
            configurable: true
        });
        TweenValue.prototype.getField = function (index) {
            switch (index) {
                case 0:
                    return this.x;
                case 1:
                    return this.y;
                case 2:
                    return this.z;
                case 3:
                    return this.w;
                default:
                    throw new Error("Index out of bounds: " + index);
            }
        };
        TweenValue.prototype.setField = function (index, value) {
            switch (index) {
                case 0:
                    this.x = value;
                    break;
                case 1:
                    this.y = value;
                    break;
                case 2:
                    this.z = value;
                    break;
                case 3:
                    this.w = value;
                    break;
                default:
                    throw new Error("Index out of bounds: " + index);
            }
        };
        TweenValue.prototype.setZero = function () {
            this.x = this.y = this.z = this.w = 0;
        };
        return TweenValue;
    }());
    fgui.TweenValue = TweenValue;
})(fgui || (fgui = {}));

(function (fgui) {
    var ByteBuffer = (function (_super_1) {
        __extends(ByteBuffer, _super_1);
        function ByteBuffer(buffer, bufferExtSize) {
            var _this = _super_1.call(this, buffer, bufferExtSize) || this;
            _this.version = 0;
            return _this;
        }
        ByteBuffer.prototype.skip = function (count) {
            this.position += count;
        };
        ByteBuffer.prototype.readBool = function () {
            return this.readByte() == 1;
        };
        ByteBuffer.prototype.readS = function () {
            var index = this.readUnsignedShort();
            if (index == 65534)
                return null;
            else if (index == 65533)
                return "";
            else
                return this.stringTable[index];
        };
        ByteBuffer.prototype.readSArray = function (cnt) {
            var ret = new Array(cnt);
            for (var i = 0; i < cnt; i++)
                ret[i] = this.readS();
            return ret;
        };
        ByteBuffer.prototype.writeS = function (value) {
            var index = this.readUnsignedShort();
            if (index != 65534 && index != 65533)
                this.stringTable[index] = value;
        };
        ByteBuffer.prototype.readColor = function (hasAlpha) {
            var r = this.readUnsignedByte();
            var g = this.readUnsignedByte();
            var b = this.readUnsignedByte();
            var a = this.readUnsignedByte();
            return (hasAlpha ? (a << 24) : 0) + (r << 16) + (g << 8) + b;
        };
        ByteBuffer.prototype.readChar = function () {
            var i = this.readUnsignedShort();
            return String.fromCharCode(i);
        };
        ByteBuffer.prototype.readBuffer = function () {
            var count = this.readUnsignedInt();
            var ba = new ByteBuffer(new Uint8Array(this.buffer, this.position, count));
            ba.stringTable = this.stringTable;
            ba.version = this.version;
            this.position += count;
            return ba;
        };
        ByteBuffer.prototype.seek = function (indexTablePos, blockIndex) {
            var tmp = this.position;
            this.position = indexTablePos;
            var segCount = this.readByte();
            if (blockIndex < segCount) {
                var useShort = this.readByte() == 1;
                var newPos;
                if (useShort) {
                    this.position += 2 * blockIndex;
                    newPos = this.readUnsignedShort();
                }
                else {
                    this.position += 4 * blockIndex;
                    newPos = this.readUnsignedInt();
                }
                if (newPos > 0) {
                    this.position = indexTablePos + newPos;
                    return true;
                }
                else {
                    this.position = tmp;
                    return false;
                }
            }
            else {
                this.position = tmp;
                return false;
            }
        };
        return ByteBuffer;
    }(egret.ByteArray));
    fgui.ByteBuffer = ByteBuffer;
})(fgui || (fgui = {}));

(function (fgui) {
    var ColorMatrix = (function () {
        function ColorMatrix(p_brightness, p_contrast, p_saturation, p_hue) {
            this.matrix = new Array(LENGTH);
            this.reset();
            if (p_brightness !== undefined || p_contrast !== undefined || p_saturation !== undefined || p_hue !== undefined)
                this.adjustColor(p_brightness, p_contrast, p_saturation, p_hue);
        }
        ColorMatrix.prototype.reset = function () {
            for (var i = 0; i < LENGTH; i++) {
                this.matrix[i] = IDENTITY_MATRIX[i];
            }
        };
        ColorMatrix.prototype.invert = function () {
            this.multiplyMatrix([-1, 0, 0, 0, 255,
                0, -1, 0, 0, 255,
                0, 0, -1, 0, 255,
                0, 0, 0, 1, 0]);
        };
        ColorMatrix.prototype.adjustColor = function (p_brightness, p_contrast, p_saturation, p_hue) {
            this.adjustHue(p_hue || 0);
            this.adjustContrast(p_contrast || 0);
            this.adjustBrightness(p_brightness || 0);
            this.adjustSaturation(p_saturation || 0);
        };
        ColorMatrix.prototype.adjustBrightness = function (p_val) {
            p_val = this.cleanValue(p_val, 1) * 255;
            this.multiplyMatrix([
                1, 0, 0, 0, p_val,
                0, 1, 0, 0, p_val,
                0, 0, 1, 0, p_val,
                0, 0, 0, 1, 0
            ]);
        };
        ColorMatrix.prototype.adjustContrast = function (p_val) {
            p_val = this.cleanValue(p_val, 1);
            var s = p_val + 1;
            var o = 128 * (1 - s);
            this.multiplyMatrix([
                s, 0, 0, 0, o,
                0, s, 0, 0, o,
                0, 0, s, 0, o,
                0, 0, 0, 1, 0
            ]);
        };
        ColorMatrix.prototype.adjustSaturation = function (p_val) {
            p_val = this.cleanValue(p_val, 1);
            p_val += 1;
            var invSat = 1 - p_val;
            var invLumR = invSat * LUMA_R;
            var invLumG = invSat * LUMA_G;
            var invLumB = invSat * LUMA_B;
            this.multiplyMatrix([
                (invLumR + p_val), invLumG, invLumB, 0, 0,
                invLumR, (invLumG + p_val), invLumB, 0, 0,
                invLumR, invLumG, (invLumB + p_val), 0, 0,
                0, 0, 0, 1, 0
            ]);
        };
        ColorMatrix.prototype.adjustHue = function (p_val) {
            p_val = this.cleanValue(p_val, 1);
            p_val *= Math.PI;
            var cos = Math.cos(p_val);
            var sin = Math.sin(p_val);
            this.multiplyMatrix([
                ((LUMA_R + (cos * (1 - LUMA_R))) + (sin * -(LUMA_R))), ((LUMA_G + (cos * -(LUMA_G))) + (sin * -(LUMA_G))), ((LUMA_B + (cos * -(LUMA_B))) + (sin * (1 - LUMA_B))), 0, 0,
                ((LUMA_R + (cos * -(LUMA_R))) + (sin * 0.143)), ((LUMA_G + (cos * (1 - LUMA_G))) + (sin * 0.14)), ((LUMA_B + (cos * -(LUMA_B))) + (sin * -0.283)), 0, 0,
                ((LUMA_R + (cos * -(LUMA_R))) + (sin * -((1 - LUMA_R)))), ((LUMA_G + (cos * -(LUMA_G))) + (sin * LUMA_G)), ((LUMA_B + (cos * (1 - LUMA_B))) + (sin * LUMA_B)), 0, 0,
                0, 0, 0, 1, 0
            ]);
        };
        ColorMatrix.prototype.concat = function (p_matrix) {
            if (p_matrix.length != LENGTH) {
                return;
            }
            this.multiplyMatrix(p_matrix);
        };
        ColorMatrix.prototype.clone = function () {
            var result = new ColorMatrix();
            result.copyMatrix(this.matrix);
            return result;
        };
        ColorMatrix.prototype.copyMatrix = function (p_matrix) {
            var l = LENGTH;
            for (var i = 0; i < l; i++) {
                this.matrix[i] = p_matrix[i];
            }
        };
        ColorMatrix.prototype.multiplyMatrix = function (p_matrix) {
            var col = [];
            var i = 0;
            for (var y = 0; y < 4; ++y) {
                for (var x = 0; x < 5; ++x) {
                    col[i + x] = p_matrix[i] * this.matrix[x] +
                        p_matrix[i + 1] * this.matrix[x + 5] +
                        p_matrix[i + 2] * this.matrix[x + 10] +
                        p_matrix[i + 3] * this.matrix[x + 15] +
                        (x == 4 ? p_matrix[i + 4] : 0);
                }
                i += 5;
            }
            this.copyMatrix(col);
        };
        ColorMatrix.prototype.cleanValue = function (p_val, p_limit) {
            return Math.min(p_limit, Math.max(-p_limit, p_val));
        };
        return ColorMatrix;
    }());
    fgui.ColorMatrix = ColorMatrix;
    var IDENTITY_MATRIX = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
    ];
    var LENGTH = IDENTITY_MATRIX.length;
    var LUMA_R = 0.299;
    var LUMA_G = 0.587;
    var LUMA_B = 0.114;
})(fgui || (fgui = {}));

(function (fgui) {
    var GTimers = (function () {
        function GTimers() {
            this._enumI = 0;
            this._enumCount = 0;
            this._lastTime = 0;
            this._items = new Array();
            this._itemPool = new Array();
            this._lastTime = egret.getTimer();
            GTimers.time = this._lastTime;
            egret.startTick(this.__timer, this);
        }
        GTimers.prototype.getItem = function () {
            if (this._itemPool.length)
                return this._itemPool.pop();
            else
                return new TimerItem();
        };
        GTimers.prototype.findItem = function (callback, thisObj) {
            var len = this._items.length;
            for (var i = 0; i < len; i++) {
                var item = this._items[i];
                if (item.callback == callback && item.thisObj == thisObj)
                    return item;
            }
            return null;
        };
        GTimers.prototype.add = function (delayInMiniseconds, repeat, callback, thisObj, callbackParam) {
            var item = this.findItem(callback, thisObj);
            if (!item) {
                item = this.getItem();
                item.callback = callback;
                item.hasParam = callback.length == 1;
                item.thisObj = thisObj;
                this._items.push(item);
            }
            item.delay = delayInMiniseconds;
            item.counter = 0;
            item.repeat = repeat;
            item.param = callbackParam;
            item.end = false;
        };
        GTimers.prototype.callLater = function (callback, thisObj, callbackParam) {
            this.add(1, 1, callback, thisObj, callbackParam);
        };
        GTimers.prototype.callDelay = function (delay, callback, thisObj, callbackParam) {
            this.add(delay, 1, callback, thisObj, callbackParam);
        };
        GTimers.prototype.exists = function (callback, thisObj) {
            var item = this.findItem(callback, thisObj);
            return item != null;
        };
        GTimers.prototype.remove = function (callback, thisObj) {
            var item = this.findItem(callback, thisObj);
            if (item) {
                var i = this._items.indexOf(item);
                this._items.splice(i, 1);
                if (i < this._enumI)
                    this._enumI--;
                this._enumCount--;
                item.reset();
                this._itemPool.push(item);
            }
        };
        GTimers.prototype.__timer = function (timeStamp) {
            GTimers.time = timeStamp;
            GTimers.deltaTime = timeStamp - this._lastTime;
            this._lastTime = timeStamp;
            this._enumI = 0;
            this._enumCount = this._items.length;
            while (this._enumI < this._enumCount) {
                var item = this._items[this._enumI];
                this._enumI++;
                if (item.advance(GTimers.deltaTime)) {
                    if (item.end) {
                        this._enumI--;
                        this._enumCount--;
                        this._items.splice(this._enumI, 1);
                    }
                    if (item.hasParam)
                        item.callback.call(item.thisObj, item.param);
                    else
                        item.callback.call(item.thisObj);
                    if (item.end) {
                        item.reset();
                        this._itemPool.push(item);
                    }
                }
            }
            return false;
        };
        GTimers.deltaTime = 0;
        GTimers.time = 0;
        GTimers.inst = new GTimers();
        return GTimers;
    }());
    fgui.GTimers = GTimers;
    var TimerItem = (function () {
        function TimerItem() {
            this.delay = 0;
            this.counter = 0;
            this.repeat = 0;
        }
        TimerItem.prototype.advance = function (elapsed) {
            this.counter += elapsed;
            if (this.counter >= this.delay) {
                this.counter -= this.delay;
                if (this.counter > this.delay)
                    this.counter = this.delay;
                if (this.repeat > 0) {
                    this.repeat--;
                    if (this.repeat == 0)
                        this.end = true;
                }
                return true;
            }
            else
                return false;
        };
        TimerItem.prototype.reset = function () {
            this.callback = null;
            this.thisObj = null;
            this.param = null;
        };
        return TimerItem;
    }());
})(fgui || (fgui = {}));

(function (fgui) {
    var UBBParser = (function () {
        function UBBParser() {
            this._readPos = 0;
            this.smallFontSize = 12;
            this.normalFontSize = 14;
            this.largeFontSize = 16;
            this.defaultImgWidth = 0;
            this.defaultImgHeight = 0;
            this._handlers = {};
            this._handlers["url"] = this.onTag_URL;
            this._handlers["img"] = this.onTag_IMG;
            this._handlers["b"] = this.onTag_Simple;
            this._handlers["i"] = this.onTag_Simple;
            this._handlers["u"] = this.onTag_Simple;
            this._handlers["sup"] = this.onTag_Simple;
            this._handlers["sub"] = this.onTag_Simple;
            this._handlers["color"] = this.onTag_COLOR;
            this._handlers["font"] = this.onTag_FONT;
            this._handlers["size"] = this.onTag_SIZE;
        }
        UBBParser.prototype.onTag_URL = function (tagName, end, attr) {
            if (!end) {
                if (attr != null)
                    return "<a href=\"" + attr + "\" target=\"_blank\">";
                else {
                    var href = this.getTagText();
                    return "<a href=\"" + href + "\" target=\"_blank\">";
                }
            }
            else
                return "</a>";
        };
        UBBParser.prototype.onTag_IMG = function (tagName, end, attr) {
            if (!end) {
                var src = this.getTagText(true);
                if (!src)
                    return null;
                if (this.defaultImgWidth)
                    return "<img src=\"" + src + "\" width=\"" + this.defaultImgWidth + "\" height=\"" + this.defaultImgHeight + "\"/>";
                else
                    return "<img src=\"" + src + "\"/>";
            }
            else
                return null;
        };
        UBBParser.prototype.onTag_Simple = function (tagName, end, attr) {
            return end ? ("</" + tagName + ">") : ("<" + tagName + ">");
        };
        UBBParser.prototype.onTag_COLOR = function (tagName, end, attr) {
            if (!end)
                return "<font color=\"" + attr + "\">";
            else
                return "</font>";
        };
        UBBParser.prototype.onTag_FONT = function (tagName, end, attr) {
            if (!end)
                return "<font face=\"" + attr + "\">";
            else
                return "</font>";
        };
        UBBParser.prototype.onTag_SIZE = function (tagName, end, attr) {
            if (!end) {
                if (attr == "normal")
                    attr = "" + this.normalFontSize;
                else if (attr == "small")
                    attr = "" + this.smallFontSize;
                else if (attr == "large")
                    attr = "" + this.largeFontSize;
                else if (attr.length && attr.charAt(0) == "+")
                    attr = "" + (this.smallFontSize + parseInt(attr.substr(1)));
                else if (attr.length && attr.charAt(0) == "-")
                    attr = "" + (this.smallFontSize - parseInt(attr.substr(1)));
                return "<font size=\"" + attr + "\">";
            }
            else
                return "</font>";
        };
        UBBParser.prototype.getTagText = function (remove) {
            if (remove === void 0) { remove = false; }
            var pos1 = this._readPos;
            var pos2;
            var result = "";
            while ((pos2 = this._text.indexOf("[", pos1)) != -1) {
                if (this._text.charCodeAt(pos2 - 1) == 92) {
                    result += this._text.substring(pos1, pos2 - 1);
                    result += "[";
                    pos1 = pos2 + 1;
                }
                else {
                    result += this._text.substring(pos1, pos2);
                    break;
                }
            }
            if (pos2 == -1)
                return null;
            if (remove)
                this._readPos = pos2;
            return result;
        };
        UBBParser.prototype.parse = function (text, remove) {
            this._text = text;
            var pos1 = 0, pos2, pos3;
            var end;
            var tag, attr;
            var repl;
            var func;
            var result = "";
            while ((pos2 = this._text.indexOf("[", pos1)) != -1) {
                if (pos2 > 0 && this._text.charCodeAt(pos2 - 1) == 92) {
                    result += this._text.substring(pos1, pos2 - 1);
                    result += "[";
                    pos1 = pos2 + 1;
                    continue;
                }
                result += this._text.substring(pos1, pos2);
                pos1 = pos2;
                pos2 = this._text.indexOf("]", pos1);
                if (pos2 == -1)
                    break;
                end = this._text.charAt(pos1 + 1) == '/';
                tag = this._text.substring(end ? pos1 + 2 : pos1 + 1, pos2);
                this._readPos = pos2 + 1;
                attr = null;
                repl = null;
                pos3 = tag.indexOf("=");
                if (pos3 != -1) {
                    attr = tag.substring(pos3 + 1);
                    tag = tag.substring(0, pos3);
                }
                tag = tag.toLowerCase();
                func = this._handlers[tag];
                if (func != null) {
                    if (!remove) {
                        repl = func.call(this, tag, end, attr);
                        if (repl != null)
                            result += repl;
                    }
                }
                else
                    result += this._text.substring(pos1, this._readPos);
                pos1 = this._readPos;
            }
            if (pos1 < this._text.length)
                result += this._text.substr(pos1);
            this._text = null;
            return result;
        };
        UBBParser.inst = new UBBParser();
        return UBBParser;
    }());
    fgui.UBBParser = UBBParser;
})(fgui || (fgui = {}));

(function (fgui) {
    var ToolSet = (function () {
        function ToolSet() {
        }
        ToolSet.startsWith = function (source, str, ignoreCase) {
            if (!source)
                return false;
            else if (source.length < str.length)
                return false;
            else {
                source = source.substring(0, str.length);
                if (!ignoreCase)
                    return source == str;
                else
                    return source.toLowerCase() == str.toLowerCase();
            }
        };
        ToolSet.trimRight = function (targetString) {
            var tempChar = "";
            for (var i = targetString.length - 1; i >= 0; i--) {
                tempChar = targetString.charAt(i);
                if (tempChar != " " && tempChar != "\n" && tempChar != "\r") {
                    break;
                }
            }
            return targetString.substring(0, i + 1);
        };
        ToolSet.convertToHtmlColor = function (argb, hasAlpha) {
            var alpha;
            if (hasAlpha)
                alpha = (argb >> 24 & 0xFF).toString(16);
            else
                alpha = "";
            var red = (argb >> 16 & 0xFF).toString(16);
            var green = (argb >> 8 & 0xFF).toString(16);
            var blue = (argb & 0xFF).toString(16);
            if (alpha.length == 1)
                alpha = "0" + alpha;
            if (red.length == 1)
                red = "0" + red;
            if (green.length == 1)
                green = "0" + green;
            if (blue.length == 1)
                blue = "0" + blue;
            return "#" + alpha + red + green + blue;
        };
        ToolSet.convertFromHtmlColor = function (str, hasAlpha) {
            if (str.length < 1)
                return 0;
            if (str.charAt(0) == "#")
                str = str.substr(1);
            if (str.length == 8)
                return (parseInt(str.substr(0, 2), 16) << 24) + parseInt(str.substr(2), 16);
            else if (hasAlpha)
                return 0xFF000000 + parseInt(str, 16);
            else
                return parseInt(str, 16);
        };
        ToolSet.displayObjectToGObject = function (obj) {
            while (obj && !(obj instanceof egret.Stage)) {
                if (obj["$owner"])
                    return fgui.GObject.cast(obj);
                obj = obj.parent;
            }
            return null;
        };
        ToolSet.encodeHTML = function (str) {
            if (!str)
                return "";
            else
                return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
        };
        ToolSet.clamp = function (value, min, max) {
            if (value < min)
                value = min;
            else if (value > max)
                value = max;
            return value;
        };
        ToolSet.clamp01 = function (value) {
            if (value > 1)
                value = 1;
            else if (value < 0)
                value = 0;
            return value;
        };
        ToolSet.lerp = function (start, end, percent) {
            return (start + percent * (end - start));
        };
        ToolSet.repeat = function (t, length) {
            return t - Math.floor(t / length) * length;
        };
        ToolSet.distance = function (x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        };
        ToolSet.fillPath = function (ctx, points, px, py) {
            var cnt = points.length;
            ctx.moveTo(points[0] + px, points[1] + py);
            for (var i = 2; i < cnt; i += 2)
                ctx.lineTo(points[i] + px, points[i + 1] + py);
            ctx.lineTo(points[0] + px, points[1] + py);
        };
        ToolSet.setColorFilter = function (obj, color) {
            var filter = obj.$_colorFilter_;
            var filters = obj.filters;
            var toApplyColor;
            var toApplyGray;
            var tp = typeof (color);
            if (tp == "boolean") {
                toApplyColor = filter ? filter.$_color_ : null;
                toApplyGray = color;
            }
            else {
                toApplyColor = color == 0xFFFFFF ? null : color;
                toApplyGray = filter ? filter.$_grayed_ : false;
            }
            if ((!toApplyColor && toApplyColor !== 0) && !toApplyGray) {
                if (filters && filter) {
                    var i = filters.indexOf(filter);
                    if (i != -1) {
                        filters.splice(i, 1);
                        if (filters.length > 0)
                            obj.filters = filters;
                        else
                            obj.filters = null;
                    }
                }
                return;
            }
            if (!filter) {
                filter = new egret.ColorMatrixFilter();
                obj.$_colorFilter_ = filter;
            }
            if (!filters)
                filters = [filter];
            else {
                var i_1 = filters.indexOf(filter);
                if (i_1 == -1)
                    filters.push(filter);
            }
            obj.filters = filters;
            filter.$_color_ = toApplyColor;
            filter.$_grayed_ = toApplyGray;
            var mat = filter.matrix;
            if (toApplyGray) {
                for (var i_2 = 0; i_2 < 20; i_2++)
                    mat[i_2] = grayScaleMatrix[i_2];
            }
            else if (toApplyColor instanceof Array) {
                getColorMatrix(toApplyColor[0], toApplyColor[1], toApplyColor[2], toApplyColor[3], mat);
            }
            else {
                for (var i_3 = 0; i_3 < 20; i_3++) {
                    mat[i_3] = (i_3 == 0 || i_3 == 6 || i_3 == 12 || i_3 == 18) ? 1 : 0;
                }
                mat[0] = ((color >> 16) & 0xFF) / 255;
                mat[6] = ((color >> 8) & 0xFF) / 255;
                mat[12] = (color & 0xFF) / 255;
            }
            filter.matrix = mat;
        };
        return ToolSet;
    }());
    fgui.ToolSet = ToolSet;
    var grayScaleMatrix = [
        0.3, 0.6, 0, 0, 0,
        0.3, 0.6, 0, 0, 0,
        0.3, 0.6, 0, 0, 0,
        0, 0, 0, 1, 0
    ];
    var helper = new fgui.ColorMatrix();
    function getColorMatrix(p_brightness, p_contrast, p_saturation, p_hue, result) {
        if (!result)
            result = new Array(fgui.ColorMatrix.length);
        helper.reset();
        helper.adjustColor(p_brightness, p_contrast, p_saturation, p_hue);
        helper.matrix.forEach(function (e, i) { return result[i] = e; });
    }
})(fgui || (fgui = {}));
