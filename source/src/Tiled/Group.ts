module es {
    export class TmxGroup implements ITmxLayer{
        public map: TmxMap;
        public offsetX: number;
        public offsetY: number;
        public opacity: number;
        public properties: Map<string, string>;
        public visible: boolean;
        public name: string;
        public layers: ITmxLayer[];
        public tileLayers: TmxLayer[];
        public objectGroups: TmxObjectGroup[];
        public imageLayers: TmxImageLayer[];
        public groups: TmxGroup[];
    }
}