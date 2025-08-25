import { Compressor, CompressionOptions, CompressionStats, StreamCompressionState } from './CompressionTypes';
import { murmur3_32 } from '../../../Utils/Hash32';
import { createLogger } from '../../../Utils/Logger';
import { RLEUtils } from './RLEUtils';

/**
 * ECS数据专用压缩器
 * 
 * 针对ECS架构数据模式优化的压缩算法，支持实体ID序列、位图数据和重复字段的高效压缩
 */
export class ECSCompressor implements Compressor {
    readonly name = 'ecs-lz';
    readonly supportedLevels: readonly [number, number] = [1, 9];
    readonly supportsDictionary = true;
    readonly supportsStreaming = true;
    
    private static readonly logger = createLogger('ECSCompressor');
    
    // ECS数据特定参数
    private readonly MAX_RLE_LENGTH = 255;
    
    // ECS特定模式
    private readonly ENTITY_ID_PATTERN = 0x01;
    private readonly COMPONENT_DATA_PATTERN = 0x02;
    private readonly BITMAP_PATTERN = 0x03;
    private readonly FIELD_REPEAT_PATTERN = 0x04;
    
    compress(data: Uint8Array, options: CompressionOptions = {}): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        const level = Math.max(1, Math.min(9, options.level || 6));
        
        // 分析数据模式
        const patterns = this.analyzeDataPatterns(data);
        ECSCompressor.logger.debug(`检测到ECS数据模式: ${JSON.stringify(patterns)}`);
        
        // 根据模式选择压缩策略
        let compressedData: Uint8Array;
        if (patterns.hasEntityIds) {
            compressedData = this.compressWithEntityIdOptimization(data, level, options);
        } else if (patterns.hasBitmaps) {
            compressedData = this.compressWithBitmapOptimization(data, level, options);
        } else if (patterns.hasRepeatedFields) {
            compressedData = this.compressWithFieldRepeatOptimization(data, level, options);
        } else {
            compressedData = this.compressGeneric(data, level, options);
        }
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: data.length,
            compressedSize: compressedData.length,
            compressionRatio: compressedData.length / data.length,
            compressionTime: endTime - startTime
        };
        
        ECSCompressor.logger.debug(
            `ECS压缩完成: ${data.length} -> ${compressedData.length} 字节 ` +
            `(压缩比: ${(stats.compressionRatio * 100).toFixed(1)}%)`
        );
        
        return { data: compressedData, stats };
    }
    
    decompress(data: Uint8Array, _options: CompressionOptions = {}): {
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
        
        // 读取压缩模式
        const mode = data[0];
        const payload = data.slice(1);
        
        let decompressedData: Uint8Array;
        switch (mode) {
            case this.ENTITY_ID_PATTERN:
                decompressedData = this.decompressEntityIds(payload);
                break;
            case this.BITMAP_PATTERN:
                decompressedData = this.decompressBitmaps(payload);
                break;
            case this.FIELD_REPEAT_PATTERN:
                decompressedData = this.decompressFieldRepeats(payload);
                break;
            case this.COMPONENT_DATA_PATTERN:
            default:
                decompressedData = this.decompressGeneric(payload);
                break;
        }
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: decompressedData.length,
            compressedSize: data.length,
            compressionRatio: data.length / decompressedData.length,
            compressionTime: 0,
            decompressionTime: endTime - startTime
        };
        
        return { data: decompressedData, stats };
    }
    
    /**
     * 分析数据模式
     */
    private analyzeDataPatterns(data: Uint8Array): {
        hasEntityIds: boolean;
        hasBitmaps: boolean;
        hasRepeatedFields: boolean;
        entropy: number;
    } {
        let entityIdLikeSequences = 0;
        let bitmapLikeSequences = 0;
        let repeatedFieldPatterns = 0;
        
        const histogram = new Array(256).fill(0);
        
        // 统计字节频率
        for (let i = 0; i < data.length; i++) {
            histogram[data[i]]++;
        }
        
        // 计算熵
        let entropy = 0;
        for (let i = 0; i < 256; i++) {
            if (histogram[i] > 0) {
                const p = histogram[i] / data.length;
                entropy -= p * Math.log2(p);
            }
        }
        
        // 检测实体ID模式（递增的4字节序列）
        for (let i = 0; i < data.length - 7; i += 4) {
            const id1 = this.readUint32LE(data, i);
            const id2 = this.readUint32LE(data, i + 4);
            if (id2 === id1 + 1) {
                entityIdLikeSequences++;
            }
        }
        
        // 检测位图模式（大量的0和连续的位模式）
        let zeroBytes = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] === 0) zeroBytes++;
        }
        if (zeroBytes > data.length * 0.7) {
            bitmapLikeSequences = 1;
        }
        
        // 检测重复字段模式（固定间隔的重复数据）
        const intervals = [4, 8, 12, 16, 20, 32];
        for (const interval of intervals) {
            let matches = 0;
            for (let i = 0; i < data.length - interval * 2; i += interval) {
                if (data[i] === data[i + interval]) {
                    matches++;
                }
            }
            if (matches > data.length / interval * 0.3) {
                repeatedFieldPatterns++;
                break;
            }
        }
        
        return {
            hasEntityIds: entityIdLikeSequences > 5,
            hasBitmaps: bitmapLikeSequences > 0,
            hasRepeatedFields: repeatedFieldPatterns > 0,
            entropy
        };
    }
    
    /**
     * 实体ID优化压缩
     */
    private compressWithEntityIdOptimization(data: Uint8Array, _level: number, _options: CompressionOptions): Uint8Array {
        const result: number[] = [this.ENTITY_ID_PATTERN];
        
        // 将实体ID序列进行增量编码
        let pos = 0;
        while (pos < data.length - 3) {
            // 尝试读取4字节实体ID
            if (pos + 7 < data.length) {
                const id1 = this.readUint32LE(data, pos);
                const id2 = this.readUint32LE(data, pos + 4);
                
                if (id2 === id1 + 1) {
                    // 找到连续的实体ID序列
                    let sequenceLength = 2;
                    let currentPos = pos + 8;
                    
                    while (currentPos + 3 < data.length) {
                        const nextId = this.readUint32LE(data, currentPos);
                        if (nextId === id1 + sequenceLength) {
                            sequenceLength++;
                            currentPos += 4;
                        } else {
                            break;
                        }
                    }
                    
                    if (sequenceLength >= 3) {
                        // 编码实体ID序列：标记 + 起始ID + 长度
                        result.push(0x80); // 实体ID序列标记
                        this.writeUint32LE(result, id1);
                        this.writeVarInt(result, sequenceLength);
                        pos = currentPos;
                        continue;
                    }
                }
            }
            
            // 普通字节
            result.push(data[pos]);
            pos++;
        }
        
        // 剩余字节
        while (pos < data.length) {
            result.push(data[pos++]);
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 位图优化压缩
     */
    private compressWithBitmapOptimization(data: Uint8Array, _level: number, _options: CompressionOptions): Uint8Array {
        const result: number[] = [this.BITMAP_PATTERN];
        
        let pos = 0;
        while (pos < data.length) {
            // 查找连续的0字节
            if (data[pos] === 0) {
                let zeroCount = 0;
                while (pos + zeroCount < data.length && data[pos + zeroCount] === 0 && zeroCount < 255) {
                    zeroCount++;
                }
                
                if (zeroCount >= 3) {
                    // 编码0字节序列
                    result.push(0x81); // 零字节序列标记
                    result.push(zeroCount);
                    pos += zeroCount;
                    continue;
                }
            }
            
            // 查找连续的非0字节
            let nonZeroStart = pos;
            while (pos < data.length && data[pos] !== 0) {
                pos++;
            }
            
            if (pos > nonZeroStart) {
                const nonZeroLength = pos - nonZeroStart;
                if (nonZeroLength >= 128) {
                    // 长非零序列
                    result.push(0x82);
                    this.writeVarInt(result, nonZeroLength);
                } else {
                    // 短非零序列
                    result.push(nonZeroLength);
                }
                
                for (let i = nonZeroStart; i < pos; i++) {
                    result.push(data[i]);
                }
            } else {
                // 单个字节
                result.push(data[pos]);
                pos++;
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 重复字段优化压缩
     */
    private compressWithFieldRepeatOptimization(data: Uint8Array, _level: number, _options: CompressionOptions): Uint8Array {
        const result: number[] = [this.FIELD_REPEAT_PATTERN];
        
        // 检测字段模式
        const fieldPattern = this.detectFieldPattern(data);
        if (!fieldPattern) {
            return this.compressGeneric(data, _level, _options);
        }
        
        // 编码字段模式信息
        this.writeVarInt(result, fieldPattern.fieldSize);
        this.writeVarInt(result, fieldPattern.fieldCount);
        
        // 按字段分组并使用高效的压缩
        for (let fieldIndex = 0; fieldIndex < fieldPattern.fieldSize; fieldIndex++) {
            const fieldData: number[] = [];
            
            for (let recordIndex = 0; recordIndex < fieldPattern.fieldCount; recordIndex++) {
                const pos = recordIndex * fieldPattern.fieldSize + fieldIndex;
                if (pos < data.length) {
                    fieldData.push(data[pos]);
                }
            }
            
            // 对字段数据进行优化压缩
            const compressedField = this.compressFieldData(new Uint8Array(fieldData));
            this.writeVarInt(result, compressedField.length);
            for (const byte of compressedField) {
                result.push(byte);
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 通用压缩算法，使用RLE编码和模式检测
     */
    private compressGeneric(data: Uint8Array, _level: number, _options: CompressionOptions): Uint8Array {
        const result: number[] = [this.COMPONENT_DATA_PATTERN];
        
        if (data.length === 0) {
            return new Uint8Array(result);
        }
        
        let pos = 0;
        while (pos < data.length) {
            const currentByte = data[pos];
            
            let runLength = 1;
            while (pos + runLength < data.length && 
                   data[pos + runLength] === currentByte && 
                   runLength < this.MAX_RLE_LENGTH) {
                runLength++;
            }
            
            if (runLength >= 4) {
                result.push(0x81);
                result.push(runLength);
                result.push(currentByte);
                pos += runLength;
                continue;
            }
            
            const patternResult = this.detectCommonPatterns(data, pos);
            if (patternResult) {
                result.push(0x82);
                this.writeVarInt(result, patternResult.patternLength);
                result.push(patternResult.repeatCount);
                
                const patternData = data.slice(pos, pos + patternResult.patternLength);
                for (let i = 0; i < patternResult.patternLength; i++) {
                    result.push(patternData[i]);
                }
                
                pos += patternResult.patternLength * patternResult.repeatCount;
                continue;
            }
            
            this.encodeLiteral(result, currentByte);
            pos++;
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 实体ID解压
     */
    private decompressEntityIds(data: Uint8Array): Uint8Array {
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            if (data[pos] === 0x80) {
                // 实体ID序列
                pos++;
                if (pos + 4 >= data.length) break;
                const startId = this.readUint32LE(data, pos);
                pos += 4;
                const lengthInfo = this.readVarInt(data, pos);
                pos = lengthInfo.newPos;
                
                for (let i = 0; i < lengthInfo.value; i++) {
                    this.writeUint32LE(result, startId + i);
                }
            } else {
                result.push(data[pos]);
                pos++;
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 位图解压
     */
    private decompressBitmaps(data: Uint8Array): Uint8Array {
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            if (data[pos] === 0x81) {
                // 零字节序列
                pos++;
                if (pos >= data.length) break;
                const zeroCount = data[pos++];
                for (let i = 0; i < zeroCount; i++) {
                    result.push(0);
                }
            } else if (data[pos] === 0x82) {
                // 长非零序列
                pos++;
                const lengthInfo = this.readVarInt(data, pos);
                pos = lengthInfo.newPos;
                
                for (let i = 0; i < lengthInfo.value && pos < data.length; i++) {
                    result.push(data[pos++]);
                }
            } else if (data[pos] > 0 && data[pos] < 128) {
                // 短非零序列
                const length = data[pos++];
                for (let i = 0; i < length && pos < data.length; i++) {
                    result.push(data[pos++]);
                }
            } else {
                result.push(data[pos++]);
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 重复字段解压
     */
    private decompressFieldRepeats(data: Uint8Array): Uint8Array {
        let pos = 0;
        const fieldSizeInfo = this.readVarInt(data, pos);
        pos = fieldSizeInfo.newPos;
        
        const fieldCountInfo = this.readVarInt(data, pos);
        pos = fieldCountInfo.newPos;
        
        const fields: Uint8Array[] = [];
        
        // 读取每个字段的数据
        for (let fieldIndex = 0; fieldIndex < fieldSizeInfo.value; fieldIndex++) {
            const fieldDataLengthInfo = this.readVarInt(data, pos);
            pos = fieldDataLengthInfo.newPos;
            
            const compressedFieldData = data.slice(pos, pos + fieldDataLengthInfo.value);
            pos += fieldDataLengthInfo.value;
            
            fields.push(this.decompressFieldData(compressedFieldData));
        }
        
        // 重建原始数据
        const result: number[] = [];
        for (let recordIndex = 0; recordIndex < fieldCountInfo.value; recordIndex++) {
            for (let fieldIndex = 0; fieldIndex < fieldSizeInfo.value; fieldIndex++) {
                const fieldData = fields[fieldIndex];
                if (recordIndex < fieldData.length) {
                    result.push(fieldData[recordIndex]);
                }
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 通用解压算法，处理RLE和模式编码
     */
    private decompressGeneric(data: Uint8Array): Uint8Array {
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            const control = data[pos++];
            
            if (control === 0x81) {
                if (pos + 1 >= data.length) break;
                
                const runLength = data[pos++];
                const value = data[pos++];
                
                for (let i = 0; i < runLength; i++) {
                    result.push(value);
                }
            } else if (control === 0x82) {
                const patternLengthInfo = this.readVarInt(data, pos);
                pos = patternLengthInfo.newPos;
                
                if (pos >= data.length) break;
                const repeatCount = data[pos++];
                
                const patternLength = patternLengthInfo.value;
                if (pos + patternLength > data.length) break;
                
                const pattern = data.slice(pos, pos + patternLength);
                pos += patternLength;
                
                for (let repeat = 0; repeat < repeatCount; repeat++) {
                    for (let i = 0; i < patternLength; i++) {
                        result.push(pattern[i]);
                    }
                }
            } else {
                const literalInfo = this.decodeLiteral(data, pos, control);
                pos = literalInfo.newPos;
                
                for (const byte of literalInfo.data) {
                    result.push(byte);
                }
            }
        }
        
        return new Uint8Array(result);
    }
    
    // 工具方法
    private readUint32LE(data: Uint8Array, pos: number): number {
        return data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16) | (data[pos + 3] << 24);
    }
    
    private writeUint32LE(result: number[], value: number): void {
        result.push(value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF);
    }
    
    private writeVarInt(result: number[], value: number): void {
        while (value >= 0x80) {
            result.push((value & 0x7F) | 0x80);
            value >>= 7;
        }
        result.push(value & 0x7F);
    }
    
    private readVarInt(data: Uint8Array, pos: number): { value: number; newPos: number } {
        let result = 0;
        let shift = 0;
        let currentPos = pos;
        while (currentPos < data.length) {
            const byte = data[currentPos++];
            result |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
        }
        return { value: result, newPos: currentPos };
    }
    
    
    /**
     * 检测常见重复模式
     */
    private detectCommonPatterns(data: Uint8Array, startPos: number): 
        { patternLength: number; repeatCount: number } | null {
        
        const remainingLength = data.length - startPos;
        if (remainingLength < 4) return null;
        
        if (remainingLength >= 512) {
            const repeatCount = this.fastPatternCheck(data, startPos, 256);
            if (repeatCount >= 2) {
                return { patternLength: 256, repeatCount };
            }
        }
        
        const quickPatterns = [2, 4, 8, 16];
        for (const patternLength of quickPatterns) {
            if (remainingLength >= patternLength * 2) {
                const repeatCount = this.fastPatternCheck(data, startPos, patternLength);
                if (repeatCount >= 3) {
                    return { patternLength, repeatCount };
                }
            }
        }
        
        return null;
    }
    
    /**
     * 快速模式检查，使用采样优化
     */
    private fastPatternCheck(data: Uint8Array, startPos: number, patternLength: number): number {
        let repeatCount = 1;
        let checkPos = startPos + patternLength;
        const maxRepeats = Math.min(32, Math.floor((data.length - startPos) / patternLength));
        
        while (checkPos + patternLength <= data.length && repeatCount < maxRepeats) {
            if (data[startPos] !== data[checkPos] || 
                data[startPos + patternLength - 1] !== data[checkPos + patternLength - 1]) {
                break;
            }
            
            if (patternLength > 16) {
                const samplePoints = [patternLength >> 2, patternLength >> 1, (patternLength * 3) >> 2];
                let matches = true;
                for (const offset of samplePoints) {
                    if (data[startPos + offset] !== data[checkPos + offset]) {
                        matches = false;
                        break;
                    }
                }
                if (!matches) break;
            } else {
                let matches = true;
                for (let i = 1; i < patternLength - 1; i++) {
                    if (data[startPos + i] !== data[checkPos + i]) {
                        matches = false;
                        break;
                    }
                }
                if (!matches) break;
            }
            
            repeatCount++;
            checkPos += patternLength;
        }
        
        return repeatCount;
    }
    
    
    
    private detectFieldPattern(data: Uint8Array): { fieldSize: number; fieldCount: number } | null {
        // 尝试不同的字段大小
        const possibleSizes = [4, 8, 12, 16, 20, 24, 32, 48, 64];
        
        for (const fieldSize of possibleSizes) {
            if (data.length % fieldSize === 0) {
                const fieldCount = data.length / fieldSize;
                
                // 检查是否有重复的字段模式
                let patternScore = 0;
                for (let offset = 0; offset < fieldSize; offset++) {
                    const values = new Set<number>();
                    for (let record = 0; record < fieldCount; record++) {
                        values.add(data[record * fieldSize + offset]);
                    }
                    // 如果该字段位置的不同值少于记录数的50%，认为有模式
                    if (values.size < fieldCount * 0.5) {
                        patternScore++;
                    }
                }
                
                if (patternScore >= fieldSize * 0.3) {
                    return { fieldSize, fieldCount };
                }
            }
        }
        
        return null;
    }
    
    
    
    
    private encodeLiteral(result: number[], byte: number): void {
        if (byte >= 0x80) {
            // 转义避免与控制标记混淆
            result.push(0x7F);
            result.push(byte);
        } else {
            result.push(byte);
        }
    }
    
    
    private decodeLiteral(data: Uint8Array, pos: number, control: number): {
        data: number[];
        newPos: number;
    } {
        if (control === 0x7F) {
            // 转义字节，读取实际数据
            if (pos < data.length) {
                return {
                    data: [data[pos]],
                    newPos: pos + 1
                };
            } else {
                return { data: [], newPos: pos };
            }
        } else {
            return {
                data: [control],
                newPos: pos
            };
        }
    }
    
    
    /**
     * 字段数据压缩
     */
    private compressFieldData(data: Uint8Array): Uint8Array {
        if (data.length === 0) return new Uint8Array(0);
        
        // 检查是否全是相同的值
        const firstValue = data[0];
        let allSame = true;
        for (let i = 1; i < data.length; i++) {
            if (data[i] !== firstValue) {
                allSame = false;
                break;
            }
        }
        
        if (allSame) {
            // 全相同值：标记 + 长度 + 值
            const result = new Uint8Array(1 + 4 + 1);
            result[0] = 0xFF; // 全相同标记
            new DataView(result.buffer).setUint32(1, data.length, true);
            result[5] = firstValue;
            return result;
        }
        
        // 使用位编码RLE
        return RLEUtils.compressBitEncoded(data, {
            minRunLength: 3,
            maxRunLength: 127,
            controlBit: 0x80
        });
    }
    
    /**
     * 字段数据解压
     */
    private decompressFieldData(data: Uint8Array): Uint8Array {
        if (data.length === 0) return new Uint8Array(0);
        
        if (data[0] === 0xFF && data.length >= 6) {
            // 全相同值
            const length = new DataView(data.buffer, data.byteOffset).getUint32(1, true);
            const value = data[5];
            const result = new Uint8Array(length);
            result.fill(value);
            return result;
        }
        
        // 位编码RLE解压
        return RLEUtils.decompressBitEncoded(data, {
            controlBit: 0x80
        });
    }
    
}