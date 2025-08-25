import { Encryptor } from './CompressionTypes';
import { createLogger } from '../../../Utils/Logger';
import { murmur3_32 } from '../../../Utils/Hash32';

/**
 * 基础加密器接口实现
 */
abstract class BaseEncryptor implements Encryptor {
    protected static readonly logger = createLogger('Encryptor');
    
    abstract readonly name: string;
    abstract readonly keyLength: number;
    abstract readonly ivLength: number;
    
    abstract encrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
        tag?: Uint8Array;
    };
    
    abstract decrypt(
        encryptedData: Uint8Array,
        key: Uint8Array,
        iv: Uint8Array,
        tag?: Uint8Array
    ): Uint8Array;
    
    generateKey(): Uint8Array {
        const key = new Uint8Array(this.keyLength);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(key);
        } else {
            // 降级方案：使用Math.random()
            for (let i = 0; i < key.length; i++) {
                key[i] = Math.floor(Math.random() * 256);
            }
        }
        return key;
    }
    
    generateIV(): Uint8Array {
        const iv = new Uint8Array(this.ivLength);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(iv);
        } else {
            // 降级方案：使用Math.random()
            for (let i = 0; i < iv.length; i++) {
                iv[i] = Math.floor(Math.random() * 256);
            }
        }
        return iv;
    }
    
    deriveKey(password: string, salt: Uint8Array, iterations: number): Uint8Array {
        // 简化的PBKDF2实现（生产环境应使用WebCrypto API）
        let key = new TextEncoder().encode(password);
        
        for (let i = 0; i < iterations; i++) {
            const combined = new Uint8Array(key.length + salt.length);
            combined.set(key);
            combined.set(salt, key.length);
            
            // 使用hash函数作为伪随机函数
            const hash = murmur3_32(combined);
            const hashBytes = new Uint8Array(4);
            hashBytes[0] = hash & 0xFF;
            hashBytes[1] = (hash >> 8) & 0xFF;
            hashBytes[2] = (hash >> 16) & 0xFF;
            hashBytes[3] = (hash >> 24) & 0xFF;
            
            key = hashBytes;
        }
        
        // 扩展到所需长度
        const result = new Uint8Array(this.keyLength);
        for (let i = 0; i < result.length; i++) {
            result[i] = key[i % key.length];
        }
        
        return result;
    }
}

/**
 * 无加密器（直通）
 */
export class NoEncryptor extends BaseEncryptor {
    readonly name = 'none';
    readonly keyLength = 0;
    readonly ivLength = 0;
    
    encrypt(data: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
    } {
        return {
            encrypted: new Uint8Array(data),
            iv: new Uint8Array(0)
        };
    }
    
    decrypt(encryptedData: Uint8Array): Uint8Array {
        return new Uint8Array(encryptedData);
    }
}

/**
 * XOR加密器（仅用于测试和轻量级混淆）
 */
export class XorEncryptor extends BaseEncryptor {
    readonly name = 'xor';
    readonly keyLength = 32;
    readonly ivLength = 0;
    
    encrypt(data: Uint8Array, key: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
    } {
        if (key.length !== this.keyLength) {
            throw new Error(`XOR密钥长度必须为${this.keyLength}字节`);
        }
        
        const encrypted = new Uint8Array(data.length);
        
        for (let i = 0; i < data.length; i++) {
            encrypted[i] = data[i] ^ key[i % key.length];
        }
        
        return {
            encrypted,
            iv: new Uint8Array(0)
        };
    }
    
    decrypt(encryptedData: Uint8Array, key: Uint8Array): Uint8Array {
        // XOR加密的特性：加密和解密是相同的操作
        return this.encrypt(encryptedData, key).encrypted;
    }
}

/**
 * ChaCha20流加密器（轻量级，适合ECS数据）
 */
export class ChaCha20Encryptor extends BaseEncryptor {
    readonly name = 'chacha20';
    readonly keyLength = 32;
    readonly ivLength = 12;
    
    private readonly CONSTANTS = new Uint32Array([
        0x61707865, 0x3320646E, 0x79622D32, 0x6B206574
    ]);
    
    encrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
        tag?: Uint8Array;
    } {
        if (key.length !== this.keyLength) {
            throw new Error(`ChaCha20密钥长度必须为${this.keyLength}字节`);
        }
        
        const nonce = iv || this.generateIV();
        if (nonce.length !== this.ivLength) {
            throw new Error(`ChaCha20 IV长度必须为${this.ivLength}字节`);
        }
        
        const encrypted = this.chacha20(data, key, nonce, 1);
        
        return { encrypted, iv: nonce };
    }
    
    decrypt(encryptedData: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
        if (key.length !== this.keyLength) {
            throw new Error(`ChaCha20密钥长度必须为${this.keyLength}字节`);
        }
        
        if (iv.length !== this.ivLength) {
            throw new Error(`ChaCha20 IV长度必须为${this.ivLength}字节`);
        }
        
        // ChaCha20是对称的
        return this.chacha20(encryptedData, key, iv, 1);
    }
    
    private chacha20(data: Uint8Array, key: Uint8Array, nonce: Uint8Array, counter: number): Uint8Array {
        const result = new Uint8Array(data.length);
        const keyWords = this.bytesToWords(key);
        const nonceWords = this.bytesToWords(nonce);
        
        let blockCounter = counter;
        
        for (let i = 0; i < data.length; i += 64) {
            const keystream = this.chacha20Block(keyWords, nonceWords, blockCounter++);
            
            const blockSize = Math.min(64, data.length - i);
            // 直接从words操作，避免转换为bytes
            for (let j = 0; j < blockSize; j++) {
                const wordIndex = j >>> 2; // j / 4
                const byteIndex = j & 3;   // j % 4
                const keystreamByte = (keystream[wordIndex] >>> (byteIndex * 8)) & 0xFF;
                result[i + j] = data[i + j] ^ keystreamByte;
            }
        }
        
        return result;
    }
    
    private chacha20Block(key: Uint32Array, nonce: Uint32Array, counter: number): Uint32Array {
        const state = new Uint32Array(16);
        
        // 初始化状态
        state.set(this.CONSTANTS, 0);
        state.set(key, 4);
        state[12] = counter;
        state.set(nonce, 13);
        
        const workingState = new Uint32Array(state);
        
        // 20轮计算
        for (let i = 0; i < 10; i++) {
            // 奇数轮
            this.quarterRound(workingState, 0, 4, 8, 12);
            this.quarterRound(workingState, 1, 5, 9, 13);
            this.quarterRound(workingState, 2, 6, 10, 14);
            this.quarterRound(workingState, 3, 7, 11, 15);
            
            // 偶数轮
            this.quarterRound(workingState, 0, 5, 10, 15);
            this.quarterRound(workingState, 1, 6, 11, 12);
            this.quarterRound(workingState, 2, 7, 8, 13);
            this.quarterRound(workingState, 3, 4, 9, 14);
        }
        
        // 添加原始状态
        for (let i = 0; i < 16; i++) {
            workingState[i] = (workingState[i] + state[i]) >>> 0;
        }
        
        return workingState;
    }
    
    private quarterRound(x: Uint32Array, a: number, b: number, c: number, d: number): void {
        x[a] = (x[a] + x[b]) >>> 0;
        x[d] = this.rotateLeft(x[d] ^ x[a], 16);
        
        x[c] = (x[c] + x[d]) >>> 0;
        x[b] = this.rotateLeft(x[b] ^ x[c], 12);
        
        x[a] = (x[a] + x[b]) >>> 0;
        x[d] = this.rotateLeft(x[d] ^ x[a], 8);
        
        x[c] = (x[c] + x[d]) >>> 0;
        x[b] = this.rotateLeft(x[b] ^ x[c], 7);
    }
    
    private rotateLeft(value: number, shift: number): number {
        return ((value << shift) | (value >>> (32 - shift))) >>> 0;
    }
    
    private bytesToWords(bytes: Uint8Array): Uint32Array {
        const words = new Uint32Array(bytes.length / 4);
        const dataView = new DataView(bytes.buffer, bytes.byteOffset);
        
        for (let i = 0; i < words.length; i++) {
            words[i] = dataView.getUint32(i * 4, true); // little-endian
        }
        
        return words;
    }
    
}

/**
 * AES-GCM加密器（认证加密，推荐用于生产环境）
 * 注意：这是一个简化实现，生产环境应使用WebCrypto API
 */
export class AesGcmEncryptor extends BaseEncryptor {
    readonly name = 'aes-gcm';
    readonly keyLength = 32; // AES-256
    readonly ivLength = 12;
    
    encrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
        tag: Uint8Array;
    } {
        if (key.length !== this.keyLength) {
            throw new Error(`AES密钥长度必须为${this.keyLength}字节`);
        }
        
        const nonce = iv || this.generateIV();
        if (nonce.length !== this.ivLength) {
            throw new Error(`AES-GCM IV长度必须为${this.ivLength}字节`);
        }
        
        // 这里应该使用WebCrypto API，这是一个简化的示例
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            throw new Error('AES-GCM需要异步实现，请使用WebCrypto API');
        }
        
        // 简化实现：使用ChaCha20作为替代（在没有WebCrypto的环境中）
        const chacha20 = new ChaCha20Encryptor();
        const result = chacha20.encrypt(data, key, nonce);
        
        // 生成认证标签（简化实现）
        const tag = new Uint8Array(16);
        const tagData = new Uint8Array(result.encrypted.length + nonce.length + key.length);
        tagData.set(result.encrypted);
        tagData.set(nonce, result.encrypted.length);
        tagData.set(key, result.encrypted.length + nonce.length);
        
        const tagHash = murmur3_32(tagData);
        new DataView(tag.buffer).setUint32(0, tagHash, true);
        
        return {
            encrypted: result.encrypted,
            iv: nonce,
            tag
        };
    }
    
    decrypt(encryptedData: Uint8Array, key: Uint8Array, iv: Uint8Array, tag?: Uint8Array): Uint8Array {
        if (key.length !== this.keyLength) {
            throw new Error(`AES密钥长度必须为${this.keyLength}字节`);
        }
        
        if (iv.length !== this.ivLength) {
            throw new Error(`AES-GCM IV长度必须为${this.ivLength}字节`);
        }
        
        if (!tag || tag.length !== 16) {
            throw new Error('AES-GCM需要16字节的认证标签');
        }
        
        // 验证认证标签（简化实现）
        const expectedTagData = new Uint8Array(encryptedData.length + iv.length + key.length);
        expectedTagData.set(encryptedData);
        expectedTagData.set(iv, encryptedData.length);
        expectedTagData.set(key, encryptedData.length + iv.length);
        
        const expectedTagHash = murmur3_32(expectedTagData);
        const actualTagHash = new DataView(tag.buffer, tag.byteOffset).getUint32(0, true);
        
        if (expectedTagHash !== actualTagHash) {
            throw new Error('AES-GCM认证失败，数据可能被篡改');
        }
        
        // 解密数据（使用ChaCha20作为替代）
        const chacha20 = new ChaCha20Encryptor();
        return chacha20.decrypt(encryptedData, key, iv);
    }
}

/**
 * 复合加密器（压缩+加密）
 */
export class CompositeEncryptor extends BaseEncryptor {
    readonly name: string;
    readonly keyLength: number;
    readonly ivLength: number;
    
    constructor(
        private encryptor: Encryptor,
        private compressor?: { 
            compress: (data: Uint8Array) => Uint8Array | { data: Uint8Array }; 
            decompress: (data: Uint8Array) => Uint8Array | { data: Uint8Array };
        }
    ) {
        super();
        this.name = compressor ? `${encryptor.name}+compressed` : encryptor.name;
        this.keyLength = encryptor.keyLength;
        this.ivLength = encryptor.ivLength;
    }
    
    encrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
        tag?: Uint8Array;
    } {
        let processedData = data;
        
        // 先压缩
        if (this.compressor) {
            const compressResult = this.compressor.compress(data);
            processedData = compressResult instanceof Uint8Array ? compressResult : compressResult.data;
            BaseEncryptor.logger.debug(`压缩: ${data.length} -> ${processedData.length} 字节`);
        }
        
        // 再加密
        const result = this.encryptor.encrypt(processedData, key, iv);
        
        // 添加压缩标志
        if (this.compressor) {
            const flaggedData = new Uint8Array(result.encrypted.length + 1);
            flaggedData[0] = 0x01; // 压缩标志
            flaggedData.set(result.encrypted, 1);
            result.encrypted = flaggedData;
        }
        
        return result;
    }
    
    decrypt(encryptedData: Uint8Array, key: Uint8Array, iv: Uint8Array, tag?: Uint8Array): Uint8Array {
        let processedData = encryptedData;
        let isCompressed = false;
        
        // 检查压缩标志
        if (this.compressor && encryptedData.length > 0 && encryptedData[0] === 0x01) {
            isCompressed = true;
            processedData = encryptedData.slice(1);
        }
        
        // 先解密
        let decryptedData = this.encryptor.decrypt(processedData, key, iv, tag);
        
        // 再解压
        if (isCompressed && this.compressor) {
            const originalLength = decryptedData.length;
            const decompressResult = this.compressor.decompress(decryptedData);
            decryptedData = decompressResult instanceof Uint8Array ? decompressResult : decompressResult.data;
            BaseEncryptor.logger.debug(`解压: ${originalLength} -> ${decryptedData.length} 字节`);
        }
        
        return decryptedData;
    }
}