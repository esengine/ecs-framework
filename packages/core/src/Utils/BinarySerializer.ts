/**
 * 二进制序列化器
 * 将对象转换为UTF8字节数组
 */
export class BinarySerializer {
    /**
     * 将字符串编码为UTF8字节数组
     */
    private static stringToUtf8(str: string): Uint8Array {
        const len = str.length;
        let pos = 0;
        const bytes: number[] = [];

        for (let i = 0; i < len; i++) {
            let code = str.charCodeAt(i);

            if (code >= 0xD800 && code <= 0xDBFF && i + 1 < len) {
                const high = code;
                const low = str.charCodeAt(i + 1);
                if (low >= 0xDC00 && low <= 0xDFFF) {
                    code = 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00);
                    i++;
                }
            }

            if (code < 0x80) {
                bytes[pos++] = code;
            } else if (code < 0x800) {
                bytes[pos++] = 0xC0 | (code >> 6);
                bytes[pos++] = 0x80 | (code & 0x3F);
            } else if (code < 0x10000) {
                bytes[pos++] = 0xE0 | (code >> 12);
                bytes[pos++] = 0x80 | ((code >> 6) & 0x3F);
                bytes[pos++] = 0x80 | (code & 0x3F);
            } else {
                bytes[pos++] = 0xF0 | (code >> 18);
                bytes[pos++] = 0x80 | ((code >> 12) & 0x3F);
                bytes[pos++] = 0x80 | ((code >> 6) & 0x3F);
                bytes[pos++] = 0x80 | (code & 0x3F);
            }
        }

        return new Uint8Array(bytes);
    }

    /**
     * 将UTF8字节数组解码为字符串
     */
    private static utf8ToString(bytes: Uint8Array): string {
        const len = bytes.length;
        let str = '';
        let i = 0;

        while (i < len) {
            const byte1 = bytes[i++];
            if (byte1 === undefined) break;

            if (byte1 < 0x80) {
                str += String.fromCharCode(byte1);
            } else if ((byte1 & 0xE0) === 0xC0) {
                const byte2 = bytes[i++];
                if (byte2 === undefined) break;
                str += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
            } else if ((byte1 & 0xF0) === 0xE0) {
                const byte2 = bytes[i++];
                const byte3 = bytes[i++];
                if (byte2 === undefined || byte3 === undefined) break;
                str += String.fromCharCode(
                    ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F)
                );
            } else if ((byte1 & 0xF8) === 0xF0) {
                const byte2 = bytes[i++];
                const byte3 = bytes[i++];
                const byte4 = bytes[i++];
                if (byte2 === undefined || byte3 === undefined || byte4 === undefined) break;
                let code = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) |
                          ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
                code -= 0x10000;
                str += String.fromCharCode(
                    0xD800 + (code >> 10),
                    0xDC00 + (code & 0x3FF)
                );
            }
        }

        return str;
    }

    /**
     * 将对象编码为二进制数据
     */
    public static encode(value: any): Uint8Array {
        const jsonString = JSON.stringify(value);
        return this.stringToUtf8(jsonString);
    }

    /**
     * 将二进制数据解码为对象
     */
    public static decode(bytes: Uint8Array): any {
        const jsonString = this.utf8ToString(bytes);
        return JSON.parse(jsonString);
    }
}
