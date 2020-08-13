module es{
    export class Base64Utils {
        private static _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        /**
         * 判断是否原生支持Base64位解析
         */
        static get nativeBase64() {
            return (typeof (window.atob) === "function");
        }


        /**
         * 解码
         * @param input
         */
        static decode(input:string): string {
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            if (this.nativeBase64) {
                return window.atob(input);
            } else {
                var output: any = [], chr1: number, chr2: number, chr3: number, enc1: number, enc2: number, enc3: number, enc4: number, i: number = 0;

                while (i < input.length) {
                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output.push(String.fromCharCode(chr1));

                    if (enc3 !== 64) {
                        output.push(String.fromCharCode(chr2));
                    }
                    if (enc4 !== 64) {
                        output.push(String.fromCharCode(chr3));
                    }
                }

                output = output.join("");
                return output;
            }
        }


        /**
         * 编码
         * @param input
         */
        static encode(input:string): string {
            input = input.replace(/\r\n/g, "\n");
            if (this.nativeBase64) {
                window.btoa(input);
            } else {
                var output: any = [], chr1: number, chr2: number, chr3: number, enc1: number, enc2: number, enc3: number, enc4: number, i: number = 0;
                while (i < input.length) {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output.push(this._keyStr.charAt(enc1));
                    output.push(this._keyStr.charAt(enc2));
                    output.push(this._keyStr.charAt(enc3));
                    output.push(this._keyStr.charAt(enc4));
                }

                output = output.join("");
                return output;
            }
        }


        /**
         * 解析Base64格式数据
         * @param input
         * @param bytes
         */
        static decodeBase64AsArray(input: string, bytes: number): Uint32Array {
            bytes = bytes || 1;

            var dec = Base64Utils.decode(input), i, j, len;
            var ar: Uint32Array = new Uint32Array(dec.length / bytes);

            for (i = 0, len = dec.length / bytes; i < len; i++) {
                ar[i] = 0;
                for (j = bytes - 1; j >= 0; --j) {
                    ar[i] += dec.charCodeAt((i * bytes) + j) << (j << 3);
                }
            }
            return ar;
        }

        /**
         * 暂时不支持
         * @param data
         * @param decoded
         * @param compression
         * @private
         */
        static decompress(data: string, decoded: any, compression: string): any {
            throw new Error("GZIP/ZLIB compressed TMX Tile Map not supported!");
        }

        /**
         * 解析csv数据
         * @param input
         */
        static decodeCSV(input: string): Array<number> {
            var entries: Array<any> = input.replace("\n", "").trim().split(",");

            var result:Array<number> = [];
            for (var i:number = 0; i < entries.length; i++) {
                result.push(+entries[i]);
            }
            return result;
        }
    }
}
