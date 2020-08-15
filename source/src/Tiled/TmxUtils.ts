module es {
    export class TmxUtils {
        /**
         * 解码
         * @param data 数据
         * @param encoding 编码方式 目前暂时只支持XML、base64(无压缩)、csv解析
         * @param compression 压缩方式
         * @returns 返回解析后的数据列表
         *
         * @version Egret 3.0.3
         */
        static decode(data: any, encoding: any, compression: string): Array<number> {
            compression = compression || "none";
            encoding = encoding || "none";
            switch (encoding) {
                case "base64":
                    var decoded = Base64Utils.decodeBase64AsArray(data, 4);
                    return (compression === "none") ? decoded : Base64Utils.decompress(data, decoded, compression);

                case "csv":
                    return Base64Utils.decodeCSV(data);

                case "none":
                    var datas: Array<number> = [];
                    for (var i: number = 0; i < data.length; i++) {
                        datas[i] = +data[i].gid;
                    }
                    return datas;

                default:
                    throw new Error("未定义的编码:" + encoding);
            }
        }


        /**
         * 将带"#"号的颜色字符串转换为16进制的颜色,例如：可将"#ff0000"转换为"0xff0000"
         * @param $color 要转换的颜色字符串
         * @returns 返回16进制的颜色值
         * @version Egret 3.0.3
         */
        static color16ToUnit($color:string): number {
            if (!$color)
                return 0xFFFFFF;
            var colorStr: string = "0x" + $color.slice(1);
            return parseInt(colorStr, 16);
        }
    }
}