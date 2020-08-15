module es {
    export class TmxObjectGroup implements ITmxLayer {
        public map: TmxMap;
        public name: string;
        public opacity: number;
        public visible: boolean;
        public offsetX: number;
        public offsetY: number;
        public color: number;
        public drawOrder: DrawOrderType;
        public objects: TmxObject[];
        public properties: Map<string, string>;
    }

    export class TmxObject implements ITmxElement {
        public id: number;
        public name: string;
        public shape: egret.Shape;
        public textField: egret.TextField;
        public objectType: TmxObjectType;
        public type: string;
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public rotation: number;
        public tile: TmxLayerTile;
        public visible: boolean;
        public text: TmxText;
        public points: Vector2[];
        public properties: Map<string, string>;

        constructor(){
            this.shape = new egret.Shape();
            this.textField = new egret.TextField();
        }
    }

    export class TmxText {
        public fontFamily: string;
        public pixelSize: number;
        public wrap: boolean;
        public color: number;
        public bold: boolean;
        public italic: boolean;
        public underline: boolean;
        public strikeout: boolean;
        public kerning: boolean;
        public alignment: TmxAlignment;
        public value: string;
    }

    export class TmxAlignment {
        public horizontal: TmxHorizontalAlignment;
        public vertical: TmxVerticalAlignment;
    }

    export enum TmxObjectType {
        basic,
        point,
        tile,
        ellipse,
        polygon,
        polyline,
        text
    }

    export enum DrawOrderType {
        unkownOrder = -1,
        TopDown,
        IndexOrder
    }

    export enum TmxHorizontalAlignment {
        left,
        center,
        right,
        justify
    }

    export enum TmxVerticalAlignment {
        top,
        center,
        bottom
    }
}