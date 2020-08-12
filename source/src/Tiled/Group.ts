module es {
    export class TmxGroup implements ITmxLayer{
        public map: TmxMap;
        public offsetX: number;
        public offsetY: number;
        public opacity: number;
        public properties: Map<string, string>;
        public visible: boolean;
        public name: string;
        public layers: TmxList<any>;
        public tileLayers: TmxList<TmxLayer>;
        public objectGroups: TmxList<TmxObjectGroup>;
        public imageLayers: TmxList<TmxImageLayer>;
        public groups: TmxList<TmxGroup>;
    }
}