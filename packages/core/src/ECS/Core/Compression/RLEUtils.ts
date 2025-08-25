/**
 * 通用RLE压缩工具类
 * 
 * 提供高效的行程长度编码实现，支持不同的编码格式和配置
 */
export class RLEUtils {
    
    /**
     * 标准RLE压缩
     * 格式: [标记字节][长度][值] 或 [原始字节]
     */
    static compressStandard(
        data: Uint8Array, 
        options: RLEOptions = {}
    ): Uint8Array {
        const {
            minRunLength = 3,
            maxRunLength = 255,
            escapeMarker = 0xFF,
            escapeValue = 0x00
        } = options;
        
        if (data.length === 0) return new Uint8Array(0);
        
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            const currentByte = data[pos];
            let runLength = 1;
            
            // 查找连续相同字节
            while (pos + runLength < data.length && 
                   data[pos + runLength] === currentByte && 
                   runLength < maxRunLength) {
                runLength++;
            }
            
            // 决定是否使用RLE编码
            if (runLength >= minRunLength) {
                // RLE编码: 标记 + 长度 + 值
                result.push(escapeMarker, runLength, currentByte);
            } else {
                // 直接存储，处理转义
                for (let i = 0; i < runLength; i++) {
                    if (currentByte === escapeMarker) {
                        result.push(escapeMarker, escapeValue);
                    } else {
                        result.push(currentByte);
                    }
                }
            }
            
            pos += runLength;
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 标准RLE解压
     */
    static decompressStandard(
        data: Uint8Array, 
        options: RLEOptions = {}
    ): Uint8Array {
        const {
            escapeMarker = 0xFF,
            escapeValue = 0x00
        } = options;
        
        if (data.length === 0) return new Uint8Array(0);
        
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            if (data[pos] === escapeMarker && pos + 1 < data.length) {
                if (data[pos + 1] === escapeValue) {
                    // 转义的标记字节
                    result.push(escapeMarker);
                    pos += 2;
                } else if (pos + 2 < data.length) {
                    // RLE序列: 标记 + 长度 + 值
                    const runLength = data[pos + 1];
                    const value = data[pos + 2];
                    for (let i = 0; i < runLength; i++) {
                        result.push(value);
                    }
                    pos += 3;
                } else {
                    // 数据不完整，直接存储
                    result.push(data[pos]);
                    pos++;
                }
            } else {
                result.push(data[pos]);
                pos++;
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 位编码RLE压缩
     * 格式: [控制位 | 长度][值?]
     */
    static compressBitEncoded(
        data: Uint8Array,
        options: RLEBitOptions = {}
    ): Uint8Array {
        const {
            minRunLength = 3,
            maxRunLength = 127,
            controlBit = 0x80
        } = options;
        
        if (data.length === 0) return new Uint8Array(0);
        
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            const currentByte = data[pos];
            let runLength = 1;
            
            while (pos + runLength < data.length && 
                   data[pos + runLength] === currentByte && 
                   runLength < maxRunLength) {
                runLength++;
            }
            
            if (runLength >= minRunLength) {
                // RLE编码: 控制位 | 长度, 值
                result.push(controlBit | runLength, currentByte);
            } else {
                // 直接存储
                for (let i = 0; i < runLength; i++) {
                    if ((currentByte & controlBit) !== 0) {
                        // 需要转义
                        result.push(0x7F, currentByte);
                    } else {
                        result.push(currentByte);
                    }
                }
            }
            
            pos += runLength;
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 位编码RLE解压
     */
    static decompressBitEncoded(
        data: Uint8Array,
        options: RLEBitOptions = {}
    ): Uint8Array {
        const {
            controlBit = 0x80
        } = options;
        
        if (data.length === 0) return new Uint8Array(0);
        
        const result: number[] = [];
        let pos = 0;
        
        while (pos < data.length) {
            const controlByte = data[pos];
            
            if ((controlByte & controlBit) !== 0) {
                // RLE序列
                const runLength = controlByte & (~controlBit);
                if (pos + 1 < data.length) {
                    const value = data[pos + 1];
                    for (let i = 0; i < runLength; i++) {
                        result.push(value);
                    }
                    pos += 2;
                } else {
                    result.push(controlByte);
                    pos++;
                }
            } else if (controlByte === 0x7F && pos + 1 < data.length) {
                // 转义字节
                result.push(data[pos + 1]);
                pos += 2;
            } else {
                // 直接字节
                result.push(controlByte);
                pos++;
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 流式RLE压缩状态
     */
    static createStreamState(options: RLEOptions = {}): RLEStreamState {
        return {
            buffer: [],
            currentByte: -1,
            runLength: 0,
            options: {
                minRunLength: options.minRunLength || 3,
                maxRunLength: options.maxRunLength || 255,
                escapeMarker: options.escapeMarker || 0xFF,
                escapeValue: options.escapeValue || 0x00
            }
        };
    }
    
    /**
     * 流式RLE压缩处理
     */
    static compressStream(
        state: RLEStreamState,
        chunk: Uint8Array,
        isLast = false
    ): Uint8Array {
        const { buffer, options } = state;
        
        for (let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];
            
            if (state.currentByte === byte && state.runLength < options.maxRunLength!) {
                state.runLength++;
            } else {
                // 刷新之前的序列
                if (state.currentByte !== -1) {
                    this.flushRun(buffer, state.currentByte, state.runLength, options);
                }
                
                state.currentByte = byte;
                state.runLength = 1;
            }
        }
        
        // 如果是最后一块，刷新剩余数据
        if (isLast && state.currentByte !== -1) {
            this.flushRun(buffer, state.currentByte, state.runLength, options);
            state.currentByte = -1;
            state.runLength = 0;
        }
        
        const result = new Uint8Array(buffer);
        buffer.length = 0;
        return result;
    }
    
    /**
     * 刷新RLE序列到缓冲区
     */
    private static flushRun(
        buffer: number[],
        byteValue: number,
        runLength: number,
        options: Required<RLEOptions>
    ): void {
        if (runLength >= options.minRunLength) {
            // RLE编码
            buffer.push(options.escapeMarker, runLength, byteValue);
        } else {
            // 直接存储
            for (let i = 0; i < runLength; i++) {
                if (byteValue === options.escapeMarker) {
                    buffer.push(options.escapeMarker, options.escapeValue);
                } else {
                    buffer.push(byteValue);
                }
            }
        }
    }
    
}

/**
 * RLE压缩选项
 */
export interface RLEOptions {
    minRunLength?: number;     // 最小RLE长度，默认3
    maxRunLength?: number;     // 最大RLE长度，默认255
    escapeMarker?: number;     // 转义标记字节，默认0xFF
    escapeValue?: number;      // 转义值字节，默认0x00
}

/**
 * 位编码RLE选项
 */
export interface RLEBitOptions {
    minRunLength?: number;     // 最小RLE长度，默认3
    maxRunLength?: number;     // 最大RLE长度，默认127
    controlBit?: number;       // 控制位，默认0x80
}

/**
 * 流式RLE状态
 */
export interface RLEStreamState {
    buffer: number[];
    currentByte: number;
    runLength: number;
    options: Required<RLEOptions>;
}

