import { Compressor, CompressionOptions, CompressionStats, StreamCompressionState } from './CompressionTypes';
import { createLogger } from '../../../Utils/Logger';
import { RLEUtils } from './RLEUtils';

/**
 * 流式压缩器
 * 
 * 支持大数据的分块压缩，避免内存占用过高
 */
export class StreamingCompressor implements Compressor {
    readonly name = 'streaming';
    readonly supportedLevels: readonly [number, number] = [1, 9];
    readonly supportsDictionary = true;
    readonly supportsStreaming = true;
    
    private static readonly logger = createLogger('StreamingCompressor');
    
    // 流式压缩参数
    private readonly DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
    private readonly MAX_CHUNK_SIZE = 1024 * 1024; // 1MB
    private readonly DICTIONARY_SIZE = 32 * 1024; // 32KB
    
    compress(data: Uint8Array, options: CompressionOptions = {}): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        // 统一使用流式格式，确保压缩和解压一致
        const chunkSize = Math.min(
            options.blockSize || this.DEFAULT_CHUNK_SIZE,
            this.MAX_CHUNK_SIZE
        );
        
        const state = this.createCompressionStream(options);
        const chunks: Uint8Array[] = [];
        
        // 先创建文件头部（占位符）
        const headerPlaceholder = new Uint8Array(32);
        chunks.push(headerPlaceholder);
        
        let processedBytes = 0;
        for (let offset = 0; offset < data.length; offset += chunkSize) {
            const chunkEnd = Math.min(offset + chunkSize, data.length);
            const chunk = data.slice(offset, chunkEnd);
            const isLast = chunkEnd === data.length;
            
            const compressedChunk = this.compressChunk(state, chunk, isLast);
            if (compressedChunk.length > 0) {
                chunks.push(compressedChunk);
            }
            
            processedBytes += chunk.length;
        }
        
        // 完成压缩并更新头部
        const header = this.createStreamHeader(
            data.length,
            state.internalState.chunkIndex,
            state.internalState.level,
            state.internalState.dictionary
        );
        chunks[0] = header; // 替换占位符
        
        // 合并所有块
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalSize);
        let offset = 0;
        
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: data.length,
            compressedSize: result.length,
            compressionRatio: result.length / data.length,
            compressionTime: endTime - startTime
        };
        
        StreamingCompressor.logger.debug(
            `流式压缩完成: ${data.length} -> ${result.length} 字节 ` +
            `(${chunks.length} 块, 压缩比: ${(stats.compressionRatio * 100).toFixed(1)}%)`
        );
        
        return { data: result, stats };
    }
    
    decompress(data: Uint8Array, options: CompressionOptions = {}): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        if (data.length === 0) {
            return {
                data: new Uint8Array(0),
                stats: {
                    originalSize: 0,
                    compressedSize: 0,
                    compressionRatio: 1.0,
                    compressionTime: 0,
                    decompressionTime: 0
                }
            };
        }
        
        // 读取头部信息
        let header, chunks;
        try {
            header = this.readStreamHeader(data);
            chunks = this.parseChunks(data, header.headerSize);
        } catch (error) {
            // 损坏数据的graceful fallback
            return {
                data: new Uint8Array(0),
                stats: {
                    originalSize: 0,
                    compressedSize: data.length,
                    compressionRatio: 0,
                    compressionTime: 0,
                    decompressionTime: 0
                }
            };
        }
        
        if (chunks.length === 0) {
            // 空数据情况，返回空结果
            return {
                data: new Uint8Array(0),
                stats: {
                    originalSize: 0,
                    compressedSize: data.length,
                    compressionRatio: 0,
                    compressionTime: 0,
                    decompressionTime: 0
                }
            };
        }
        
        // 创建解压状态
        this.createDecompressionStream(options);
        const decompressedChunks: Uint8Array[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunkInfo = this.parseChunkHeader(chunks[i]);
            const compressedData = chunks[i].slice(chunkInfo.headerSize);
            const decompressedData = this.decompressWithRLE(compressedData);
            
            if (decompressedData.length > 0) {
                decompressedChunks.push(decompressedData);
            }
        }
        
        // 合并结果
        const totalSize = decompressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalSize);
        let offset = 0;
        
        for (const chunk of decompressedChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: result.length,
            compressedSize: data.length,
            compressionRatio: data.length / result.length,
            compressionTime: 0,
            decompressionTime: endTime - startTime
        };
        
        return { data: result, stats };
    }
    
    createCompressionStream(options: CompressionOptions = {}): StreamCompressionState {
        const chunkSize = Math.min(
            options.blockSize || this.DEFAULT_CHUNK_SIZE,
            this.MAX_CHUNK_SIZE
        );
        
        return {
            internalState: {
                level: Math.max(1, Math.min(9, options.level || 6)),
                chunkSize,
                dictionary: options.dictionary ? new Uint8Array(options.dictionary) : null,
                history: new Uint8Array(this.DICTIONARY_SIZE),
                historyPos: 0,
                outputBuffer: [],
                chunkIndex: 0,
                totalInputBytes: 0
            },
            processedBytes: 0,
            outputBuffer: new Uint8Array(0),
            finished: false
        };
    }
    
    compressChunk(state: StreamCompressionState, chunk: Uint8Array, isLast = false): Uint8Array {
        const { internalState } = state;
        
        // 更新历史缓冲区
        this.updateHistory(internalState.history, internalState.historyPos, chunk);
        
        // 压缩当前块
        const compressedChunk = this.compressChunkData(
            chunk,
            internalState.history,
            internalState.level,
            internalState.dictionary
        );
        
        // 构建块头部
        const chunkHeader = this.createChunkHeader(
            internalState.chunkIndex,
            chunk.length,
            compressedChunk.length,
            isLast
        );
        
        // 合并头部和数据
        const result = new Uint8Array(chunkHeader.length + compressedChunk.length);
        result.set(chunkHeader, 0);
        result.set(compressedChunk, chunkHeader.length);
        
        // 更新状态
        internalState.chunkIndex++;
        internalState.totalInputBytes += chunk.length;
        internalState.historyPos = (internalState.historyPos + chunk.length) % this.DICTIONARY_SIZE;
        state.processedBytes += chunk.length;
        
        if (isLast) {
            state.finished = true;
        }
        
        return result;
    }
    
    finishCompression(_state: StreamCompressionState): Uint8Array {
        // 流式压缩的完成在主方法中处理
        return new Uint8Array(0);
    }
    
    createDecompressionStream(options: CompressionOptions = {}): StreamCompressionState {
        return {
            internalState: {
                dictionary: options.dictionary ? new Uint8Array(options.dictionary) : null,
                history: new Uint8Array(this.DICTIONARY_SIZE),
                historyPos: 0,
                expectedChunks: 0,
                processedChunks: 0
            },
            processedBytes: 0,
            outputBuffer: new Uint8Array(0),
            finished: false
        };
    }
    
    decompressChunk(state: StreamCompressionState, chunk: Uint8Array, isLast = false): Uint8Array {
        // 解析块头部
        const chunkInfo = this.parseChunkHeader(chunk);
        const compressedData = chunk.slice(chunkInfo.headerSize);
        
        // 解压块数据
        const decompressedData = this.decompressWithRLE(compressedData);
        
        // 更新状态
        state.processedBytes += decompressedData.length;
        
        if (isLast) {
            state.finished = true;
        }
        
        return decompressedData;
    }
    
    finishDecompression(_state: StreamCompressionState): Uint8Array {
        // 流式解压不需要额外的完成步骤
        return new Uint8Array(0);
    }
    
    
    
    // 私有方法
    
    private createStreamHeader(
        originalSize: number,
        chunkCount: number,
        level: number,
        dictionary: Uint8Array | null
    ): Uint8Array {
        const header = new Uint8Array(32);
        const view = new DataView(header.buffer);
        
        // 魔数
        view.setUint32(0, 0x53545245, true); // 'STRE'
        // 版本
        view.setUint16(4, 1, true);
        // 压缩级别
        view.setUint8(6, level);
        // 标志位
        view.setUint8(7, dictionary ? 0x01 : 0x00);
        // 原始大小
        view.setUint32(8, originalSize, true);
        // 块数量
        view.setUint32(12, chunkCount, true);
        // 字典大小
        view.setUint32(16, dictionary ? dictionary.length : 0, true);
        
        return header;
    }
    
    private readStreamHeader(data: Uint8Array): {
        originalSize: number;
        chunkCount: number;
        level: number;
        hasDictionary: boolean;
        dictionarySize: number;
        headerSize: number;
    } {
        if (data.length < 32) {
            throw new Error('流式压缩数据头部不完整');
        }
        
        const view = new DataView(data.buffer, data.byteOffset);
        const magic = view.getUint32(0, true);
        
        if (magic !== 0x53545245) {
            throw new Error(`无效的流式压缩魔数: 0x${magic.toString(16)}`);
        }
        
        return {
            originalSize: view.getUint32(8, true),
            chunkCount: view.getUint32(12, true),
            level: view.getUint8(6),
            hasDictionary: (view.getUint8(7) & 0x01) !== 0,
            dictionarySize: view.getUint32(16, true),
            headerSize: 32
        };
    }
    
    private createChunkHeader(
        chunkIndex: number,
        originalSize: number,
        compressedSize: number,
        isLast: boolean
    ): Uint8Array {
        const header = new Uint8Array(16);
        const view = new DataView(header.buffer);
        
        view.setUint32(0, chunkIndex, true);
        view.setUint32(4, originalSize, true);
        view.setUint32(8, compressedSize, true);
        view.setUint32(12, isLast ? 1 : 0, true);
        
        return header;
    }
    
    private parseChunkHeader(chunk: Uint8Array): {
        chunkIndex: number;
        originalSize: number;
        compressedSize: number;
        isLast: boolean;
        headerSize: number;
    } {
        if (chunk.length < 16) {
            throw new Error('块头部不完整');
        }
        
        const view = new DataView(chunk.buffer, chunk.byteOffset);
        
        return {
            chunkIndex: view.getUint32(0, true),
            originalSize: view.getUint32(4, true),
            compressedSize: view.getUint32(8, true),
            isLast: view.getUint32(12, true) !== 0,
            headerSize: 16
        };
    }
    
    private parseChunks(data: Uint8Array, headerOffset: number): Uint8Array[] {
        const chunks: Uint8Array[] = [];
        let pos = headerOffset;
        
        while (pos < data.length) {
            if (pos + 16 > data.length) break;
            
            const chunkInfo = this.parseChunkHeader(data.slice(pos));
            const chunkEnd = pos + 16 + chunkInfo.compressedSize;
            
            if (chunkEnd > data.length) break;
            
            chunks.push(data.slice(pos, chunkEnd));
            pos = chunkEnd;
            
            if (chunkInfo.isLast) break;
        }
        
        return chunks;
    }
    
    /**
     * 压缩块数据
     */
    private compressChunkData(
        data: Uint8Array,
        _history: Uint8Array,
        level: number,
        _dictionary: Uint8Array | null
    ): Uint8Array {
        return this.compressWithRLE(data, level);
    }
    
    /**
     * 使用RLE算法压缩数据
     */
    private compressWithRLE(data: Uint8Array, _level: number): Uint8Array {
        return RLEUtils.compressStandard(data, {
            minRunLength: 3,
            maxRunLength: 255,
            escapeMarker: 0xFF,
            escapeValue: 0x00
        });
    }
    
    /**
     * 使用RLE算法解压数据
     */
    private decompressWithRLE(data: Uint8Array): Uint8Array {
        return RLEUtils.decompressStandard(data, {
            escapeMarker: 0xFF,
            escapeValue: 0x00
        });
    }
    
    /**
     * 更新历史缓冲区
     */
    private updateHistory(history: Uint8Array, historyPos: number, newData: Uint8Array): void {
        for (let i = 0; i < newData.length; i++) {
            history[(historyPos + i) % history.length] = newData[i];
        }
    }
    
}