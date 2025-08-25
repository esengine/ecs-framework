import { Compressor, CompressionOptions, CompressionStats, StreamCompressionState } from './CompressionTypes';
import { murmur3_32 } from '../../../Utils/Hash32';
import { RLEUtils, RLEStreamState } from './RLEUtils';

/**
 * 无压缩器（直通）
 */
export class NoCompressor implements Compressor {
    readonly name = 'none';
    readonly supportedLevels: readonly [number, number] = [0, 0];
    readonly supportsDictionary = false;
    readonly supportsStreaming = false;
    
    compress(data: Uint8Array, _options?: CompressionOptions) {
        const startTime = performance.now();
        const endTime = performance.now();
        
        return {
            data: new Uint8Array(data),
            stats: {
                originalSize: data.length,
                compressedSize: data.length,
                compressionRatio: 1.0,
                compressionTime: endTime - startTime
            }
        };
    }
    
    decompress(data: Uint8Array, _options?: CompressionOptions) {
        const startTime = performance.now();
        const endTime = performance.now();
        
        return {
            data: new Uint8Array(data),
            stats: {
                originalSize: data.length,
                compressedSize: data.length,
                compressionRatio: 1.0,
                compressionTime: 0,
                decompressionTime: endTime - startTime
            }
        };
    }
    
}


/**
 * Run-Length Encoding (RLE) 压缩器
 * 特别适合重复数据较多的场景
 */
export class RLECompressor implements Compressor {
    readonly name = 'rle';
    readonly supportedLevels: readonly [number, number] = [1, 1];
    readonly supportsDictionary = false;
    readonly supportsStreaming = true;
    
    compress(data: Uint8Array, _options?: CompressionOptions): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        const compressed = RLEUtils.compressStandard(data, {
            minRunLength: 3,
            maxRunLength: 255,
            escapeMarker: 0xFF,
            escapeValue: 0x00
        });
        
        const endTime = performance.now();
        
        return {
            data: compressed,
            stats: {
                originalSize: data.length,
                compressedSize: compressed.length,
                compressionRatio: compressed.length / data.length,
                compressionTime: endTime - startTime
            }
        };
    }
    
    decompress(data: Uint8Array, _options?: CompressionOptions): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        const decompressed = RLEUtils.decompressStandard(data, {
            escapeMarker: 0xFF,
            escapeValue: 0x00
        });
        
        const endTime = performance.now();
        
        return {
            data: decompressed,
            stats: {
                originalSize: decompressed.length,
                compressedSize: data.length,
                compressionRatio: data.length / decompressed.length,
                compressionTime: 0,
                decompressionTime: endTime - startTime
            }
        };
    }
    
    createCompressionStream(): StreamCompressionState {
        const rleState = RLEUtils.createStreamState({
            minRunLength: 3,
            maxRunLength: 255,
            escapeMarker: 0xFF,
            escapeValue: 0x00
        });
        
        return {
            internalState: rleState,
            processedBytes: 0,
            outputBuffer: new Uint8Array(0),
            finished: false
        };
    }
    
    compressChunk(state: StreamCompressionState, chunk: Uint8Array, isLast = false): Uint8Array {
        const result = RLEUtils.compressStream(
            state.internalState as RLEStreamState,
            chunk,
            isLast
        );
        
        state.processedBytes += chunk.length;
        if (isLast) {
            state.finished = true;
        }
        
        return result;
    }
    
    finishCompression(state: StreamCompressionState): Uint8Array {
        if (!state.finished) {
            const result = RLEUtils.compressStream(
                state.internalState as RLEStreamState,
                new Uint8Array(0),
                true
            );
            state.finished = true;
            return result;
        }
        return new Uint8Array(0);
    }
    
}