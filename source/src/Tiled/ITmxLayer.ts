module es {
    export interface ITmxLayer {
        offsetX: number;
        offsetY: number;
        opacity: number;
        visible: boolean;
        properties: Map<string, string>;
    }
}