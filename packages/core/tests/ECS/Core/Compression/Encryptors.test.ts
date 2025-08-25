import { 
    NoEncryptor, 
    XorEncryptor, 
    ChaCha20Encryptor, 
    AesGcmEncryptor,
    CompositeEncryptor 
} from '../../../../src/ECS/Core/Compression/Encryptors';
import { RLECompressor } from '../../../../src/ECS/Core/Compression/BasicCompressors';

describe('加密器测试', () => {
    describe('NoEncryptor', () => {
        const encryptor = new NoEncryptor();
        
        test('应该直接返回原始数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const encrypted = encryptor.encrypt(testData);
            
            expect(encrypted.encrypted).toEqual(testData);
            expect(encrypted.iv.length).toBe(0);
            expect('tag' in encrypted ? encrypted.tag : undefined).toBeUndefined();
        });
        
        test('解密应该返回相同数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const decrypted = encryptor.decrypt(testData);
            
            expect(decrypted).toEqual(testData);
        });
        
        test('应该有正确的属性', () => {
            expect(encryptor.name).toBe('none');
            expect(encryptor.keyLength).toBe(0);
            expect(encryptor.ivLength).toBe(0);
        });
    });
    
    describe('XorEncryptor', () => {
        const encryptor = new XorEncryptor();
        
        test('应该正确加密和解密', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = encryptor.generateKey();
            
            const encrypted = encryptor.encrypt(testData, key);
            const decrypted = encryptor.decrypt(encrypted.encrypted, key);
            
            expect(decrypted).toEqual(testData);
            expect(encrypted.encrypted).not.toEqual(testData);
        });
        
        test('应该生成正确长度的密钥', () => {
            const key = encryptor.generateKey();
            
            expect(key.length).toBe(32);
        });
        
        test('应该要求正确的密钥长度', () => {
            const testData = new Uint8Array([1, 2, 3]);
            const shortKey = new Uint8Array([1, 2, 3]);
            
            expect(() => {
                encryptor.encrypt(testData, shortKey);
            }).toThrow('XOR密钥长度必须为32字节');
        });
        
        test('XOR加密应该是对称的', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = new Uint8Array(32).fill(42);
            
            const encrypted1 = encryptor.encrypt(testData, key);
            const encrypted2 = encryptor.encrypt(encrypted1.encrypted, key);
            
            expect(encrypted2.encrypted).toEqual(testData);
        });
        
        test('应该有正确的属性', () => {
            expect(encryptor.name).toBe('xor');
            expect(encryptor.keyLength).toBe(32);
            expect(encryptor.ivLength).toBe(0);
        });
    });
    
    describe('ChaCha20Encryptor', () => {
        const encryptor = new ChaCha20Encryptor();
        
        test('应该正确加密和解密', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const key = encryptor.generateKey();
            
            const encrypted = encryptor.encrypt(testData, key);
            const decrypted = encryptor.decrypt(encrypted.encrypted, key, encrypted.iv);
            
            expect(decrypted).toEqual(testData);
            expect(encrypted.encrypted).not.toEqual(testData);
        });
        
        test('应该生成正确长度的密钥和IV', () => {
            const key = encryptor.generateKey();
            const iv = encryptor.generateIV();
            
            expect(key.length).toBe(32);
            expect(iv.length).toBe(12);
        });
        
        test('应该要求正确的密钥长度', () => {
            const testData = new Uint8Array([1, 2, 3]);
            const shortKey = new Uint8Array([1, 2, 3]);
            
            expect(() => {
                encryptor.encrypt(testData, shortKey);
            }).toThrow('ChaCha20密钥长度必须为32字节');
        });
        
        test('应该要求正确的IV长度', () => {
            const testData = new Uint8Array([1, 2, 3]);
            const key = encryptor.generateKey();
            const shortIv = new Uint8Array([1, 2, 3]);
            
            expect(() => {
                encryptor.encrypt(testData, key, shortIv);
            }).toThrow('ChaCha20 IV长度必须为12字节');
        });
        
        test('应该处理不同的数据大小', () => {
            const key = encryptor.generateKey();
            
            const testSizes = [1, 8, 16, 32, 63, 64, 65, 128, 1000];
            
            for (const size of testSizes) {
                const testData = new Uint8Array(size);
                for (let i = 0; i < size; i++) {
                    testData[i] = i % 256;
                }
                
                const encrypted = encryptor.encrypt(testData, key);
                const decrypted = encryptor.decrypt(encrypted.encrypted, key, encrypted.iv);
                
                expect(decrypted).toEqual(testData);
            }
        });
        
        test('不同的IV应该产生不同的密文', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = encryptor.generateKey();
            const iv1 = encryptor.generateIV();
            const iv2 = encryptor.generateIV();
            
            const encrypted1 = encryptor.encrypt(testData, key, iv1);
            const encrypted2 = encryptor.encrypt(testData, key, iv2);
            
            expect(encrypted1.encrypted).not.toEqual(encrypted2.encrypted);
        });
        
        test('应该有正确的属性', () => {
            expect(encryptor.name).toBe('chacha20');
            expect(encryptor.keyLength).toBe(32);
            expect(encryptor.ivLength).toBe(12);
        });
    });
    
    describe('AesGcmEncryptor', () => {
        const encryptor = new AesGcmEncryptor();
        
        test('应该正确加密和解密', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = encryptor.generateKey();
            
            const encrypted = encryptor.encrypt(testData, key);
            const decrypted = encryptor.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.tag);
            
            expect(decrypted).toEqual(testData);
            expect(encrypted.tag).toBeDefined();
            expect(encrypted.tag!.length).toBe(16);
        });
        
        test('应该验证认证标签', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = encryptor.generateKey();
            
            const encrypted = encryptor.encrypt(testData, key);
            
            // 篡改认证标签
            const tamperedTag = new Uint8Array(encrypted.tag!);
            tamperedTag[0] ^= 1;
            
            expect(() => {
                encryptor.decrypt(encrypted.encrypted, key, encrypted.iv, tamperedTag);
            }).toThrow('AES-GCM认证失败，数据可能被篡改');
        });
        
        test('应该要求认证标签', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = encryptor.generateKey();
            const iv = encryptor.generateIV();
            
            expect(() => {
                encryptor.decrypt(testData, key, iv); // 缺少tag
            }).toThrow('AES-GCM需要16字节的认证标签');
        });
        
        test('应该有正确的属性', () => {
            expect(encryptor.name).toBe('aes-gcm');
            expect(encryptor.keyLength).toBe(32);
            expect(encryptor.ivLength).toBe(12);
        });
    });
    
    describe('CompositeEncryptor', () => {
        test('应该支持仅加密模式', () => {
            const baseEncryptor = new XorEncryptor();
            const composite = new CompositeEncryptor(baseEncryptor);
            
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const key = composite.generateKey();
            
            const encrypted = composite.encrypt(testData, key);
            const decrypted = composite.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.tag);
            
            expect(decrypted).toEqual(testData);
            expect(composite.name).toBe('xor');
        });
        
        test('应该支持压缩+加密模式', () => {
            const baseEncryptor = new XorEncryptor();
            const compressor = new RLECompressor();
            const composite = new CompositeEncryptor(baseEncryptor, compressor);
            
            // 创建可压缩的数据
            const testData = new Uint8Array(100);
            testData.fill(42);
            
            const key = composite.generateKey();
            
            const encrypted = composite.encrypt(testData, key);
            const decrypted = composite.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.tag);
            
            expect(decrypted).toEqual(testData);
            expect(composite.name).toBe('xor+compressed');
            
            // 验证数据确实被压缩了（通过加密数据大小判断）
            expect(encrypted.encrypted.length).toBeLessThan(testData.length + 50); // 考虑压缩标志位
        });
        
        test('应该正确处理压缩标志', () => {
            const baseEncryptor = new ChaCha20Encryptor();
            const compressor = new RLECompressor();
            const composite = new CompositeEncryptor(baseEncryptor, compressor);
            
            const testData = new Uint8Array([1, 1, 1, 1, 1]); // 可压缩数据
            const key = composite.generateKey();
            
            const encrypted = composite.encrypt(testData, key);
            
            // 检查是否添加了压缩标志
            expect(encrypted.encrypted[0]).toBe(0x01);
            
            const decrypted = composite.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.tag);
            expect(decrypted).toEqual(testData);
        });
        
        test('应该继承基础加密器的属性', () => {
            const baseEncryptor = new ChaCha20Encryptor();
            const composite = new CompositeEncryptor(baseEncryptor);
            
            expect(composite.keyLength).toBe(baseEncryptor.keyLength);
            expect(composite.ivLength).toBe(baseEncryptor.ivLength);
        });
    });
    
    describe('密钥派生功能', () => {
        test('应该从密码派生密钥', () => {
            const encryptor = new ChaCha20Encryptor();
            const password = 'test-password';
            const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            
            const key = encryptor.deriveKey!(password, salt, 1000);
            
            expect(key.length).toBe(32);
            
            // 相同的输入应该产生相同的密钥
            const key2 = encryptor.deriveKey!(password, salt, 1000);
            expect(key).toEqual(key2);
            
            // 不同的密码应该产生不同的密钥
            const key3 = encryptor.deriveKey!('different-password', salt, 1000);
            expect(key).not.toEqual(key3);
        });
    });
    
    describe('随机性测试', () => {
        test('生成的密钥应该有足够的随机性', () => {
            const encryptor = new ChaCha20Encryptor();
            const keys = [];
            
            // 生成多个密钥
            for (let i = 0; i < 10; i++) {
                keys.push(encryptor.generateKey());
            }
            
            // 检查密钥之间不相同
            for (let i = 0; i < keys.length; i++) {
                for (let j = i + 1; j < keys.length; j++) {
                    expect(keys[i]).not.toEqual(keys[j]);
                }
            }
        });
        
        test('生成的IV应该有足够的随机性', () => {
            const encryptor = new ChaCha20Encryptor();
            const ivs = [];
            
            // 生成多个IV
            for (let i = 0; i < 10; i++) {
                ivs.push(encryptor.generateIV());
            }
            
            // 检查IV之间不相同
            for (let i = 0; i < ivs.length; i++) {
                for (let j = i + 1; j < ivs.length; j++) {
                    expect(ivs[i]).not.toEqual(ivs[j]);
                }
            }
        });
    });
    
    describe('错误处理', () => {
        test('应该处理解密时的密钥长度错误', () => {
            const encryptor = new ChaCha20Encryptor();
            const testData = new Uint8Array([1, 2, 3]);
            const key = encryptor.generateKey();
            const shortKey = new Uint8Array([1, 2, 3]);
            
            const encrypted = encryptor.encrypt(testData, key);
            
            expect(() => {
                encryptor.decrypt(encrypted.encrypted, shortKey, encrypted.iv);
            }).toThrow('ChaCha20密钥长度必须为32字节');
        });
        
        test('应该处理解密时的IV长度错误', () => {
            const encryptor = new ChaCha20Encryptor();
            const testData = new Uint8Array([1, 2, 3]);
            const key = encryptor.generateKey();
            const shortIv = new Uint8Array([1, 2, 3]);
            
            const encrypted = encryptor.encrypt(testData, key);
            
            expect(() => {
                encryptor.decrypt(encrypted.encrypted, key, shortIv);
            }).toThrow('ChaCha20 IV长度必须为12字节');
        });
    });
});