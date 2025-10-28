import { strToU8, strFromU8, zlibSync, unzlibSync } from 'fflate';

/**
 * 二进制序列化器
 * 使用zlib压缩JSON数据
 */
export class BinarySerializer {
    /**
     * 将对象编码为压缩的二进制数据
     */
    public static encode(value: any): Uint8Array {
        const jsonString = JSON.stringify(value);
        const utf8Bytes = strToU8(jsonString);
        return zlibSync(utf8Bytes);
    }

    /**
     * 将压缩的二进制数据解码为对象
     */
    public static decode(bytes: Uint8Array): any {
        const decompressed = unzlibSync(bytes);
        const jsonString = strFromU8(decompressed);
        return JSON.parse(jsonString);
    }
}
