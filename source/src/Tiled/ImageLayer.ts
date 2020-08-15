module es {
    export class TmxImageLayer implements ITmxLayer {
        public map: TmxMap;
        public name: string;
        public offsetX: number;
        public offsetY: number;
        public opacity: number;
        public properties: Map<string, string>;
        public visible: boolean;

        public width?: number;
        public height?: number;
        public image: TmxImage;
    }
}