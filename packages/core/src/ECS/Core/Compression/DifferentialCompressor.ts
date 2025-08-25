import { DifferentialCompressor, CompressionOptions, CompressionStats } from './CompressionTypes';
import { murmur3_32 } from '../../../Utils/Hash32';
import { createLogger } from '../../../Utils/Logger';

/**
 * 差分压缩器
 * 
 * 用于增量数据压缩，通过与基线数据对比只保存变化部分
 */
export class EcsDifferentialCompressor implements DifferentialCompressor {
    readonly name = 'ecs-diff';
    readonly supportedLevels: readonly [number, number] = [1, 9];
    readonly supportsDictionary = false;
    readonly supportsStreaming = false;
    
    private static readonly logger = createLogger('DifferentialCompressor');
    
    private readonly MAGIC_DIFF = 0x44494646; // 'DIFF'
    private readonly VERSION = 1;
    private readonly MIN_BLOCK_SIZE = 2;
    private readonly MAX_BLOCK_SIZE = 4096;
    private readonly ROLLING_HASH_WINDOW = 16;
    
    // 操作码
    private readonly OP_COPY = 0x01;
    private readonly OP_INSERT = 0x02;
    private readonly OP_DELETE = 0x03;
    private readonly OP_REPLACE = 0x04;
    
    compress(data: Uint8Array, options: CompressionOptions = {}): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        throw new Error('差分压缩器需要使用createDiff方法，不支持普通压缩');
    }
    
    decompress(data: Uint8Array, options: CompressionOptions = {}): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        throw new Error('差分压缩器需要使用applyDiff方法，不支持普通解压');
    }
    
    /**
     * 创建差分数据
     */
    createDiff(
        baseData: Uint8Array,
        newData: Uint8Array,
        options: CompressionOptions = {}
    ): {
        diff: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        EcsDifferentialCompressor.logger.debug(
            `创建差分: ${baseData.length} -> ${newData.length} 字节`
        );
        
        // 计算diff操作序列
        const diffOps = this.computeDiffOperations(baseData, newData);
        
        // 编码diff操作
        const diffData = this.encodeDiffOperations(diffOps, baseData, newData);
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: newData.length,
            compressedSize: diffData.length,
            compressionRatio: diffData.length / Math.max(newData.length, 1),
            compressionTime: endTime - startTime
        };
        
        EcsDifferentialCompressor.logger.debug(
            `差分创建完成: ${newData.length} -> ${diffData.length} 字节 ` +
            `(压缩比: ${(stats.compressionRatio * 100).toFixed(1)}%)`
        );
        
        return { diff: diffData, stats };
    }
    
    /**
     * 应用差分数据
     */
    applyDiff(
        baseData: Uint8Array,
        diff: Uint8Array,
        options: CompressionOptions = {}
    ): {
        data: Uint8Array;
        stats: CompressionStats;
    } {
        const startTime = performance.now();
        
        if (diff.length < 9) {
            throw new Error('差分数据头部不完整');
        }
        
        // 验证差分头部
        const header = this.parseDiffHeader(diff);
        if (header.magic !== this.MAGIC_DIFF) {
            throw new Error(`无效的差分魔数: 0x${header.magic.toString(16)}`);
        }
        
        if (header.version !== this.VERSION) {
            throw new Error(`不支持的差分版本: ${header.version}`);
        }
        
        // 验证基线数据校验和
        const baseChecksum = murmur3_32(baseData);
        if (header.baseChecksum !== baseChecksum) {
            throw new Error('基线数据校验失败，可能已被修改');
        }
        
        // 解码并应用diff操作
        const diffOps = this.decodeDiffOperations(diff, header.headerSize);
        const result = this.applyDiffOperations(baseData, diffOps);
        
        // 验证结果校验和
        if (options.verifyIntegrity !== false) {
            const resultChecksum = murmur3_32(result);
            if (header.newChecksum !== resultChecksum) {
                throw new Error('应用差分后的数据校验失败');
            }
        }
        
        const endTime = performance.now();
        const stats: CompressionStats = {
            originalSize: result.length,
            compressedSize: diff.length,
            compressionRatio: diff.length / result.length,
            compressionTime: 0,
            decompressionTime: endTime - startTime
        };
        
        EcsDifferentialCompressor.logger.debug(
            `差分应用完成: ${baseData.length} + ${diff.length} -> ${result.length} 字节`
        );
        
        return { data: result, stats };
    }
    
    
    /**
     * 计算差分操作序列
     */
    private computeDiffOperations(baseData: Uint8Array, newData: Uint8Array): DiffOperation[] {
        // 特殊情况处理
        if (baseData.length === 0) {
            return [{
                type: this.OP_INSERT,
                newOffset: 0,
                length: newData.length,
                data: new Uint8Array(newData)
            }];
        }
        
        if (newData.length === 0) {
            return [];
        }
        
        if (this.arraysEqual(baseData, newData)) {
            return [{
                type: this.OP_COPY,
                baseOffset: 0,
                newOffset: 0,
                length: baseData.length
            }];
        }
        
        const operations: DiffOperation[] = [];
        let newPos = 0;
        
        while (newPos < newData.length) {
            let bestMatch = this.findLongestMatch(baseData, newData, newPos);
            
            if (bestMatch && bestMatch.length >= this.MIN_BLOCK_SIZE) {
                operations.push({
                    type: this.OP_COPY,
                    baseOffset: bestMatch.basePos,
                    newOffset: newPos,
                    length: bestMatch.length
                });
                newPos += bestMatch.length;
            } else {
                // 批量插入不匹配字节
                const insertStart = newPos;
                let insertLength = 1;
                newPos++;
                
                while (newPos < newData.length) {
                    const nextMatch = this.findLongestMatch(baseData, newData, newPos);
                    if (nextMatch && nextMatch.length >= this.MIN_BLOCK_SIZE) {
                        break;
                    }
                    insertLength++;
                    newPos++;
                }
                
                operations.push({
                    type: this.OP_INSERT,
                    newOffset: insertStart,
                    length: insertLength,
                    data: newData.slice(insertStart, insertStart + insertLength)
                });
            }
        }
        
        return this.optimizeOperations(operations);
    }
    
    
    
    /**
     * 比较两个数组是否相等
     */
    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    /**
     * 查找最长匹配
     */
    private findLongestMatch(baseData: Uint8Array, newData: Uint8Array, newPos: number): {
        basePos: number;
        length: number;
    } | null {
        let bestMatch: { basePos: number; length: number } | null = null;
        
        const searchEnd = Math.min(baseData.length, baseData.length);
        const maxLength = Math.min(newData.length - newPos, this.MAX_BLOCK_SIZE);
        
        for (let basePos = 0; basePos <= searchEnd - 1; basePos++) {
            const matchLength = this.calculateMatchLength(baseData, newData, basePos, newPos);
            if (matchLength > 0 && (!bestMatch || matchLength > bestMatch.length)) {
                bestMatch = { basePos, length: matchLength };
                
                // 早期退出优化
                if (matchLength >= maxLength) {
                    break;
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * 计算匹配长度
     */
    private calculateMatchLength(
        baseData: Uint8Array,
        newData: Uint8Array,
        baseOffset: number,
        newOffset: number
    ): number {
        let length = 0;
        const maxLength = Math.min(
            baseData.length - baseOffset,
            newData.length - newOffset,
            this.MAX_BLOCK_SIZE
        );
        
        // 优化：每次4字节对比一次
        const maxAligned = Math.floor(maxLength / 4) * 4;
        
        try {
            const baseView = new DataView(baseData.buffer, baseData.byteOffset + baseOffset);
            const newView = new DataView(newData.buffer, newData.byteOffset + newOffset);
            
            // 4字节对比
            while (length < maxAligned) {
                if (baseView.getUint32(length, true) !== newView.getUint32(length, true)) {
                    break;
                }
                length += 4;
            }
        } catch {
            // 回退到逐字节对比
        }
        
        // 剩余字节逐个对比
        while (length < maxLength && baseData[baseOffset + length] === newData[newOffset + length]) {
            length++;
        }
        
        return length;
    }
    
    
    /**
     * 优化操作序列
     */
    private optimizeOperations(operations: DiffOperation[]): DiffOperation[] {
        if (operations.length <= 1) return operations;
        
        const optimized: DiffOperation[] = [];
        
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            
            // 合并连续的INSERT操作
            if (optimized.length > 0) {
                const lastOp = optimized[optimized.length - 1];
                
                if (this.canMergeOperations(lastOp, op)) {
                    optimized[optimized.length - 1] = this.mergeOperations(lastOp, op);
                    continue;
                }
            }
            
            optimized.push(op);
        }
        
        // 优化小块复制操作
        return this.optimizeSmallCopies(optimized);
    }
    
    /**
     * 优化小的复制操作
     */
    private optimizeSmallCopies(operations: DiffOperation[]): DiffOperation[] {
        const result: DiffOperation[] = [];
        
        for (const op of operations) {
            if (op.type === this.OP_COPY && op.length < this.MIN_BLOCK_SIZE) {
                // 转换小块复制为插入
                result.push({
                    type: this.OP_INSERT,
                    newOffset: op.newOffset,
                    length: op.length,
                    data: new Uint8Array(op.length)
                });
            } else {
                result.push(op);
            }
        }
        
        return result;
    }
    
    /**
     * 检查操作是否可合并
     */
    private canMergeOperations(op1: DiffOperation, op2: DiffOperation): boolean {
        if (op1.type !== op2.type) return false;
        
        switch (op1.type) {
            case this.OP_INSERT:
                return op1.newOffset! + op1.length === op2.newOffset!;
            case this.OP_DELETE:
                return op1.baseOffset! + op1.length === op2.baseOffset!;
            default:
                return false;
        }
    }
    
    /**
     * 合并操作
     */
    private mergeOperations(op1: DiffOperation, op2: DiffOperation): DiffOperation {
        switch (op1.type) {
            case this.OP_INSERT:
                return {
                    type: this.OP_INSERT,
                    newOffset: op1.newOffset!,
                    length: op1.length + op2.length,
                    data: new Uint8Array([...op1.data!, ...op2.data!])
                };
            case this.OP_DELETE:
                return {
                    type: this.OP_DELETE,
                    baseOffset: op1.baseOffset!,
                    length: op1.length + op2.length
                };
            default:
                return op1;
        }
    }
    
    /**
     * 编码差分操作
     */
    private encodeDiffOperations(
        operations: DiffOperation[],
        baseData: Uint8Array,
        newData: Uint8Array
    ): Uint8Array {
        const result: number[] = [];
        
        // 写入头部
        this.writeDiffHeader(result, baseData, newData, operations.length);
        
        // 编码操作
        for (const op of operations) {
            this.encodeOperation(result, op);
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 写入差分头部
     */
    private writeDiffHeader(
        result: number[],
        baseData: Uint8Array,
        newData: Uint8Array,
        operationCount: number
    ): void {
        // 根据操作数量选择头部格式
        if (operationCount === 1) {
            // 紧凑格式
            result.push(0xFF);
            this.writeUint32LE(result, murmur3_32(baseData));
            this.writeUint32LE(result, murmur3_32(newData));
        } else {
            // 标准格式
            result.push(0xFE);
            this.writeUint32LE(result, murmur3_32(baseData));
            this.writeUint32LE(result, murmur3_32(newData));
            this.writeVarInt(result, operationCount);
        }
    }
    
    /**
     * 解析差分头部
     */
    private parseDiffHeader(diff: Uint8Array): {
        magic: number;
        version: number;
        operationCount: number;
        baseChecksum: number;
        newChecksum: number;
        headerSize: number;
    } {
        if (diff.length < 9) {
            throw new Error('差分数据头部不完整');
        }
        
        const marker = diff[0];
        
        if (marker === 0xFF) {
            // 紧凑格式
            const view = new DataView(diff.buffer, diff.byteOffset);
            return {
                magic: this.MAGIC_DIFF, // 假设有效
                version: this.VERSION,
                operationCount: 1,
                baseChecksum: view.getUint32(1, true),
                newChecksum: view.getUint32(5, true),
                headerSize: 9
            };
        } else if (marker === 0xFE) {
            // 标准格式
            if (diff.length < 10) {
                throw new Error('差分数据头部不完整');
            }
            
            const view = new DataView(diff.buffer, diff.byteOffset);
            const baseChecksum = view.getUint32(1, true);
            const newChecksum = view.getUint32(5, true);
            
            // 读取操作数量
            const operationCountInfo = this.readVarInt(diff, 9);
            
            return {
                magic: this.MAGIC_DIFF,
                version: this.VERSION,
                operationCount: operationCountInfo,
                baseChecksum,
                newChecksum,
                headerSize: 9 + this.getVarIntSize(operationCountInfo)
            };
        } else {
            throw new Error(`无效的差分标记: 0x${marker.toString(16)}`);
        }
    }
    
    /**
     * 编码单个操作
     */
    private encodeOperation(result: number[], op: DiffOperation): void {
        result.push(op.type);
        
        switch (op.type) {
            case this.OP_COPY:
                this.writeVarInt(result, op.baseOffset!);
                this.writeVarInt(result, op.length);
                break;
                
            case this.OP_INSERT:
                this.writeVarInt(result, op.length);
                for (const byte of op.data!) {
                    result.push(byte);
                }
                break;
                
            case this.OP_DELETE:
                this.writeVarInt(result, op.baseOffset!);
                this.writeVarInt(result, op.length);
                break;
                
            case this.OP_REPLACE:
                this.writeVarInt(result, op.baseOffset!);
                this.writeVarInt(result, op.baseLength!);
                this.writeVarInt(result, op.newLength!);
                for (const byte of op.data!) {
                    result.push(byte);
                }
                break;
        }
    }
    
    /**
     * 解码差分操作
     */
    private decodeDiffOperations(diff: Uint8Array, offset: number): DiffOperation[] {
        const operations: DiffOperation[] = [];
        let pos = offset;
        
        while (pos < diff.length) {
            const opType = diff[pos++];
            const op: DiffOperation = { type: opType, length: 0 };
            
            switch (opType) {
                case this.OP_COPY:
                    op.baseOffset = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.baseOffset);
                    op.length = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.length);
                    break;
                    
                case this.OP_INSERT:
                    op.length = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.length);
                    op.data = diff.slice(pos, pos + op.length);
                    pos += op.length;
                    break;
                    
                case this.OP_DELETE:
                    op.baseOffset = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.baseOffset);
                    op.length = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.length);
                    break;
                    
                case this.OP_REPLACE:
                    op.baseOffset = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.baseOffset);
                    op.baseLength = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.baseLength);
                    op.newLength = this.readVarInt(diff, pos);
                    pos += this.getVarIntSize(op.newLength);
                    op.data = diff.slice(pos, pos + op.newLength);
                    pos += op.newLength;
                    op.length = op.newLength;
                    break;
                    
                default:
                    throw new Error(`未知的差分操作类型: ${opType}`);
            }
            
            operations.push(op);
        }
        
        return operations;
    }
    
    /**
     * 应用差分操作
     */
    private applyDiffOperations(baseData: Uint8Array, operations: DiffOperation[]): Uint8Array {
        const result: number[] = [];
        
        for (const op of operations) {
            switch (op.type) {
                case this.OP_COPY:
                    // 复制基线数据中的一段
                    for (let i = 0; i < op.length; i++) {
                        result.push(baseData[op.baseOffset! + i]);
                    }
                    break;
                    
                case this.OP_INSERT:
                    // 插入新数据
                    for (const byte of op.data!) {
                        result.push(byte);
                    }
                    break;
                    
                case this.OP_DELETE:
                    // 删除操作：什么都不做，跳过基线数据
                    break;
                    
                case this.OP_REPLACE:
                    // 替换：用新数据替换基线数据中的一段
                    for (const byte of op.data!) {
                        result.push(byte);
                    }
                    break;
            }
        }
        
        return new Uint8Array(result);
    }
    
    // 工具方法
    
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
    
    private readVarInt(data: Uint8Array, offset: number): number {
        let result = 0;
        let shift = 0;
        let pos = offset;
        
        while (pos < data.length) {
            const byte = data[pos++];
            result |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
        }
        
        return result;
    }
    
    private getVarIntSize(value: number): number {
        let size = 0;
        while (value >= 0x80) {
            value >>= 7;
            size++;
        }
        return size + 1;
    }
}

/**
 * 差分操作接口
 */
interface DiffOperation {
    type: number;
    baseOffset?: number;
    newOffset?: number;
    length: number;
    baseLength?: number;
    newLength?: number;
    data?: Uint8Array;
}