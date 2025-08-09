export interface SerializedData {
    type: 'tsrpc' | 'json';
    componentType: string;
    data: Uint8Array | any;
    size: number;
    schema?: string;
    version?: number;
}