/**
 * 二进制IO读写器
 * 
 * 提供高性能、类型安全的二进制数据序列化/反序列化
 * 支持varint、zigzag、位打包等编码
 */

/**
 * 二进制写入器
 */
export class BinaryWriter {
    private buffer: ArrayBuffer;
    private view: DataView;
    private u8: Uint8Array;
    private offset = 0;
    private capacity: number;
    
    private static readonly textEncoder = new TextEncoder();
    private static readonly MAX_CAPACITY = 1 << 28;
    private static readonly MAX_STRING_LENGTH = 1 << 20;
    private static readonly MAX_ARRAY_LENGTH = 1 << 26;
    
    constructor(initialCapacity = 1 << 10) {
        this.capacity = initialCapacity > BinaryWriter.MAX_CAPACITY ? 1 << 20 : initialCapacity;
        this.buffer = new ArrayBuffer(this.capacity);
        this.view = new DataView(this.buffer);
        this.u8 = new Uint8Array(this.buffer);
    }
    
    
    /**
     * 确保有足够的缓冲区空间，必要时扩容
     */
    private ensure(bytes: number): void {
        const required = this.offset + bytes;
        if (required > this.capacity) {
            let newCapacity = Math.max(this.capacity * 2, required);
            newCapacity = Math.ceil(newCapacity / 4096) * 4096;
            if (newCapacity > BinaryWriter.MAX_CAPACITY) newCapacity = BinaryWriter.MAX_CAPACITY;
            
            const newBuffer = new ArrayBuffer(newCapacity);
            const newU8 = new Uint8Array(newBuffer);
            newU8.set(this.u8);
            
            this.buffer = newBuffer;
            this.view = new DataView(newBuffer);
            this.u8 = newU8;
            this.capacity = newCapacity;
        }
    }
    
    /**
     * 获取当前写入位置
     */
    get position(): number {
        return this.offset;
    }
    
    /**
     * 预留空间并返回位置（用于后续回填）
     */
    reserve(bytes: number): number {
        const pos = this.offset;
        this.ensure(bytes);
        this.offset += bytes;
        return pos;
    }
    
    /**
     * 在指定位置写入U32（用于回填长度等）
     */
    patchU32(position: number, value: number): void {
        if (position + 4 > this.offset) {
            throw new Error(`回填位置越界: ${position} + 4 > ${this.offset}`);
        }
        this.view.setUint32(position, value, true); // little-endian
    }
    
    // === 基础类型写入 ===
    
    writeU8(value: number): void {
        this.ensure(1);
        this.u8[this.offset++] = value & 0xFF;
    }
    
    writeU16(value: number): void {
        this.ensure(2);
        this.u8[this.offset++] = value & 0xFF;
        this.u8[this.offset++] = (value >>> 8) & 0xFF;
    }
    
    writeU32(value: number): void {
        this.ensure(4);
        this.u8[this.offset++] = value & 0xFF;
        this.u8[this.offset++] = (value >>> 8) & 0xFF;
        this.u8[this.offset++] = (value >>> 16) & 0xFF;
        this.u8[this.offset++] = (value >>> 24) & 0xFF;
    }
    
    writeI32(value: number): void {
        this.writeU32(value >>> 0);
    }
    
    writeF32(value: number): void {
        this.ensure(4);
        this.view.setFloat32(this.offset, value, true);
        this.offset += 4;
    }
    
    writeF64(value: number): void {
        this.ensure(8);
        this.view.setFloat64(this.offset, value, true);
        this.offset += 8;
    }
    
    
    // === 变长整数编码 ===
    
    /**
     * 写入VarInt（变长整数）
     */
    writeVarInt(value: number): void {
        // ZigZag编码：将有符号数映射为无符号数
        const zigzag = (value << 1) ^ (value >> 31);
        this.writeVarUInt(zigzag);
    }
    
    /**
     * 写入无符号VarInt
     */
    writeVarUInt(value: number): void {
        if (this.offset + 5 > this.capacity) {
            let newCapacity = this.capacity * 2;
            if (newCapacity < this.offset + 5) newCapacity = this.offset + 5;
            if (newCapacity > BinaryWriter.MAX_CAPACITY) newCapacity = BinaryWriter.MAX_CAPACITY;
            
            const newBuffer = new ArrayBuffer(newCapacity);
            const newU8 = new Uint8Array(newBuffer);
            newU8.set(this.u8);
            
            this.buffer = newBuffer;
            this.view = new DataView(newBuffer);
            this.u8 = newU8;
            this.capacity = newCapacity;
        }
        
        // 大部分数值都小于128，先处理快速路径
        if (value < 0x80) {
            this.u8[this.offset++] = value;
            return;
        }
        
        // 标准VarInt编码
        while (value >= 0x80) {
            this.u8[this.offset++] = (value & 0x7F) | 0x80;
            value >>>= 7;
        }
        this.u8[this.offset++] = value & 0x7F;
    }
    
    // === 字符串和字节数组 ===
    
    /**
     * 写入UTF-8字符串
     * 
     * @param str 要写入的字符串
     */
    writeString(str: string): void {
        const utf8 = BinaryWriter.textEncoder.encode(str);
        this.writeVarUInt(utf8.length);
        this.writeBytes(utf8);
    }
    
    /**
     * 写入字节数组
     * 
     * @param bytes 要写入的字节数组
     */
    writeBytes(bytes: Uint8Array): void {
        const required = this.offset + bytes.length;
        if (required > this.capacity) {
            let newCapacity = this.capacity * 2;
            if (newCapacity < required) newCapacity = required;
            if (newCapacity > BinaryWriter.MAX_CAPACITY) newCapacity = BinaryWriter.MAX_CAPACITY;
            
            const newBuffer = new ArrayBuffer(newCapacity);
            const newU8 = new Uint8Array(newBuffer);
            newU8.set(this.u8);
            
            this.buffer = newBuffer;
            this.view = new DataView(newBuffer);
            this.u8 = newU8;
            this.capacity = newCapacity;
        }
        
        this.u8.set(bytes, this.offset);
        this.offset += bytes.length;
    }
    
    // === 数组编码 ===
    
    /**
     * 写入布尔数组（位打包）
     */
    writeBoolArray(bools: boolean[]): void {
        const bitCount = bools.length;
        const byteCount = (bitCount + 7) >> 3; // Math.ceil(bitCount / 8)
        
        this.writeVarUInt(bitCount);
        this.ensure(byteCount);
        
        // 位打包
        for (let i = 0; i < bitCount; i++) {
            if (bools[i]) {
                const byteIndex = i >> 3; // Math.floor(i / 8)
                const bitIndex = i & 7;   // i % 8
                this.u8[this.offset + byteIndex] |= (1 << bitIndex);
            }
        }
        
        this.offset += byteCount;
    }
    
    /**
     * 写入Float32数组
     */
    writeF32Array(values: number[]): void {
        if (values.length > BinaryWriter.MAX_ARRAY_LENGTH) {
            throw new Error(`数组长度超限: ${values.length}`);
        }
        
        this.writeVarUInt(values.length);
        this.ensure(values.length * 4);
        
        for (const value of values) {
            this.writeF32(value);
        }
    }
    
    /**
     * 写入Int32数组
     */
    writeI32Array(values: number[]): void {
        if (values.length > BinaryWriter.MAX_ARRAY_LENGTH) {
            throw new Error(`数组长度超限: ${values.length}`);
        }
        
        this.writeVarUInt(values.length);
        this.ensure(values.length * 4);
        
        for (const value of values) {
            this.writeI32(value);
        }
    }
    
    /**
     * 写入存在性位图
     */
    writePresenceBitmap(present: boolean[]): void {
        this.writeBoolArray(present);
    }
    
    // === 输出和重置 ===
    
    /**
     * 获取写入的数据
     */
    toArrayBuffer(): ArrayBuffer {
        if (this.offset === 0) {
            return new ArrayBuffer(0);
        }
        
        if (this.offset === this.capacity) {
            return this.buffer;
        }
        
        return this.buffer.slice(0, this.offset);
    }
    
    /**
     * 重置写入器以供重用
     */
    reset(): void {
        this.offset = 0;
    }
    
    /**
     * 批量写入U32数组
     */
    writeU32Array(values: number[]): void {
        this.writeVarUInt(values.length);
        this.ensure(values.length * 4);
        
        for (const value of values) {
            this.u8[this.offset++] = value & 0xFF;
            this.u8[this.offset++] = (value >>> 8) & 0xFF;
            this.u8[this.offset++] = (value >>> 16) & 0xFF;
            this.u8[this.offset++] = (value >>> 24) & 0xFF;
        }
    }
    
    /**
     * 获取写入的字节数组
     */
    toUint8Array(): Uint8Array {
        if (this.offset === 0) {
            return new Uint8Array(0);
        }
        
        // 尽量避免slice操作
        if (this.offset === this.capacity) {
            return this.u8;
        }
        
        return this.u8.subarray(0, this.offset);
    }
    
    
    /**
     * 获取已写入的字节数
     */
    get size(): number {
        return this.offset;
    }
    
}

/**
 * 二进制读取器
 */
export class BinaryReader {
    private view: DataView;
    private u8: Uint8Array;
    private offset = 0;
    private readonly length: number;
    
    // 安全性限制
    private static readonly MAX_STRING_LENGTH = 64 * 1024; // 64KB
    private static readonly MAX_ARRAY_LENGTH = 1 << 24; // 16M元素
    
    constructor(buffer: ArrayBuffer | Uint8Array) {
        if (buffer instanceof ArrayBuffer) {
            this.view = new DataView(buffer);
            this.u8 = new Uint8Array(buffer);
            this.length = buffer.byteLength;
        } else {
            this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
            this.u8 = buffer;
            this.length = buffer.byteLength;
        }
    }
    
    /**
     * 检查边界
     */
    private checkBounds(bytes: number): void {
        if (this.offset + bytes > this.length) {
            throw new Error(`读取越界: offset=${this.offset}, need=${bytes}, length=${this.length}`);
        }
    }
    
    /**
     * 获取当前读取位置
     */
    get position(): number {
        return this.offset;
    }
    
    /**
     * 设置读取位置
     */
    seekTo(position: number): void {
        if (position < 0 || position > this.length) {
            throw new Error(`位置越界: ${position}, length=${this.length}`);
        }
        this.offset = position;
    }
    
    /**
     * 跳过指定字节数
     */
    skip(bytes: number): void {
        this.checkBounds(bytes);
        this.offset += bytes;
    }
    
    /**
     * 获取剩余字节数
     */
    remaining(): number {
        return this.length - this.offset;
    }
    
    // === 基础类型读取 ===
    
    readU8(): number {
        this.checkBounds(1);
        return this.u8[this.offset++];
    }
    
    readU16(): number {
        this.checkBounds(2);
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }
    
    readU32(): number {
        this.checkBounds(4);
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }
    
    readI32(): number {
        this.checkBounds(4);
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }
    
    readF32(): number {
        this.checkBounds(4);
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }
    
    readF64(): number {
        this.checkBounds(8);
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }
    
    // === 变长整数解码 ===
    
    /**
     * 读取VarInt
     */
    readVarInt(): number {
        const unsigned = this.readVarUInt();
        // ZigZag解码
        return (unsigned >>> 1) ^ (-(unsigned & 1));
    }
    
    /**
     * 读取无符号VarInt
     */
    readVarUInt(): number {
        let result = 0;
        let shift = 0;
        let byte: number;
        
        do {
            this.checkBounds(1);
            byte = this.u8[this.offset++];
            result |= (byte & 0x7F) << shift;
            shift += 7;
            
            if (shift > 35) {
                throw new Error('VarInt过长');
            }
        } while (byte & 0x80);
        
        return result >>> 0; // 确保无符号
    }
    
    // === 字符串和字节数组 ===
    
    /**
     * 读取UTF-8字符串
     */
    readString(): string {
        const length = this.readVarUInt();
        
        if (length > BinaryReader.MAX_STRING_LENGTH) {
            throw new Error(`字符串长度超限: ${length} > ${BinaryReader.MAX_STRING_LENGTH}`);
        }
        
        this.checkBounds(length);
        const bytes = this.u8.slice(this.offset, this.offset + length);
        this.offset += length;
        
        return new TextDecoder().decode(bytes);
    }
    
    /**
     * 读取字节数组
     */
    readBytes(length: number): Uint8Array {
        this.checkBounds(length);
        const result = this.u8.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
    }
    
    // === 数组解码 ===
    
    /**
     * 读取布尔数组（位解包）
     */
    readBoolArray(): boolean[] {
        const bitCount = this.readVarUInt();
        
        if (bitCount > BinaryReader.MAX_ARRAY_LENGTH) {
            throw new Error(`数组长度超限: ${bitCount} > ${BinaryReader.MAX_ARRAY_LENGTH}`);
        }
        
        const byteCount = (bitCount + 7) >> 3;
        this.checkBounds(byteCount);
        
        const result = new Array<boolean>(bitCount);
        
        for (let i = 0; i < bitCount; i++) {
            const byteIndex = i >> 3;
            const bitIndex = i & 7;
            const byte = this.u8[this.offset + byteIndex];
            result[i] = !!(byte & (1 << bitIndex));
        }
        
        this.offset += byteCount;
        return result;
    }
    
    /**
     * 读取Float32数组
     */
    readF32Array(): number[] {
        const length = this.readVarUInt();
        
        if (length > BinaryReader.MAX_ARRAY_LENGTH) {
            throw new Error(`数组长度超限: ${length}`);
        }
        
        const result = new Array<number>(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readF32();
        }
        
        return result;
    }
    
    /**
     * 读取Int32数组
     */
    readI32Array(): number[] {
        const length = this.readVarUInt();
        
        if (length > BinaryReader.MAX_ARRAY_LENGTH) {
            throw new Error(`数组长度超限: ${length}`);
        }
        
        const result = new Array<number>(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readI32();
        }
        
        return result;
    }
    
    /**
     * 读取存在性位图
     */
    readPresenceBitmap(): boolean[] {
        return this.readBoolArray();
    }
}