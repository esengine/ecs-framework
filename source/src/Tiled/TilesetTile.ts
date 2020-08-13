module es {
    export class TmxTilesetTile {
        public tileset: TmxTileset;
        public id: number;
        public terrainEdges: TmxTerrain[];
        public probability: number;
        public type: string;
        public properties: Map<string, string>;
        public image: TmxImage;
        public objectGroups: TmxObjectGroup[];
        public animationFrames: TmxAnimationFrame[];

        // TODO: 为什么动画瓷砖需要添加firstGid
        public get currentAnimationFrameGid(){
            return this.animationFrames[this._animationCurrentFrame].gid + this.tileset.firstGid;
        }
        public _animationElapsedTime: number;
        public _animationCurrentFrame: number;
        /**
         * 返回“engine:isDestructable”属性的值(如果属性字典中存在)
         */
        public isDestructable: boolean;
        /**
         * 返回“engine:isSlope”属性的值(如果存在于属性字典中)
         */
        public isSlope: boolean;
        /**
         * 返回“engine:isOneWayPlatform”属性的值(如果存在于属性字典中)
         */
        public isOneWayPlatform: boolean;
        /**
         * 返回“engine:slopeTopLeft”属性的值(如果存在于属性字典中)
         */
        public slopeTopLeft: number;
        /**
         * 如果属性字典中存在“engine:slopeTopRight”属性，则返回该属性的值
         */
        public slopeTopRight: number;

        public processProperties(){
            let value: string;
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
        }

        public updateAnimatedTiles(){
            if (this.animationFrames.length == 0)
                return;

            this._animationElapsedTime += Time.deltaTime;
            if (this._animationElapsedTime > this.animationFrames[this._animationCurrentFrame].duration){
                this._animationCurrentFrame = MathHelper.incrementWithWrap(this._animationCurrentFrame, this.animationFrames.length);
                this._animationElapsedTime = 0;
            }
        }
    }

    export class TmxAnimationFrame {
        public gid: number;
        public duration: number;
    }
}