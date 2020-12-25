class StringUtils {
    /**
     * 特殊符号字符串
     */
    private static specialSigns: string[] = [
        '&', '&amp;',
        '<', '&lt;',
        '>', '&gt;',
        '"', '&quot;',
        "'", '&apos;',
        '®', '&reg;',
        '©', '&copy;',
        '™', '&trade;',
    ];

    /**
     * 匹配中文字符
     * @param str 需要匹配的字符串
     * @return
     */
    public static matchChineseWord(str: string): string[] {
        //中文字符的unicode值[\u4E00-\u9FA5]
        let patternA: RegExp = /[\u4E00-\u9FA5]+/gim;
        return str.match(patternA);
    }

    /**
     * 去除字符串左端的空白字符
     * @param target 目标字符串
     * @return
     */
    public static lTrim(target: string): string {
        let startIndex: number = 0;
        while (this.isWhiteSpace(target.charAt(startIndex))) {
            startIndex++;
        }
        return target.slice(startIndex, target.length);
    }

    /**
     * 去除字符串右端的空白字符
     * @param target 目标字符串
     * @return
     */
    public static rTrim(target: string): string {
        let endIndex: number = target.length - 1;
        while (this.isWhiteSpace(target.charAt(endIndex))) {
            endIndex--;
        }
        return target.slice(0, endIndex + 1);
    }

    /**
     * 返回一个去除2段空白字符的字符串
     * @param target
     * @return 返回一个去除2段空白字符的字符串
     */
    public static trim(target: string): string {
        if (target == null) {
            return null;
        }
        return this.rTrim(this.lTrim(target));
    }

    /**
     * 返回该字符是否为空白字符
     * @param    str
     * @return  返回该字符是否为空白字符
     */
    public static isWhiteSpace(str: string): boolean {
        if (str == " " || str == "\t" || str == "\r" || str == "\n")
            return true;
        return false;
    }

    /**
     * 返回执行替换后的字符串
     * @param mainStr 待查找字符串
     * @param targetStr 目标字符串
     * @param replaceStr 替换字符串
     * @param caseMark 是否忽略大小写
     * @return 返回执行替换后的字符串
     */
    public static replaceMatch(mainStr: string, targetStr: string,
        replaceStr: string, caseMark: boolean = false): string {
        let len: number = mainStr.length;
        let tempStr: string = "";
        let isMatch: boolean = false;
        let tempTarget: string = caseMark == true ? targetStr.toLowerCase() : targetStr;
        for (let i: number = 0; i < len; i++) {
            isMatch = false;
            if (mainStr.charAt(i) == tempTarget.charAt(0)) {
                if (mainStr.substr(i, tempTarget.length) == tempTarget) {
                    isMatch = true;
                }
            }
            if (isMatch) {
                tempStr += replaceStr;
                i = i + tempTarget.length - 1;
            } else {
                tempStr += mainStr.charAt(i);
            }
        }
        return tempStr;
    }

    /**
     * 用html实体换掉字符窜中的特殊字符
     * @param str 需要替换的字符串
     * @param reversion 是否翻转替换：将转义符号替换为正常的符号
     * @return 换掉特殊字符后的字符串
     */
    public static htmlSpecialChars(str: string, reversion: boolean = false): string {
        let len: number = this.specialSigns.length;
        for (let i: number = 0; i < len; i += 2) {
            let from: string;
            let to: string;
            from = this.specialSigns[i];
            to = this.specialSigns[i + 1];
            if (reversion) {
                let temp: string = from;
                from = to;
                to = temp;
            }
            str = this.replaceMatch(str, from, to);
        }
        return str;
    }


    /**
     * 给数字字符前面添 "0"
     *
     * @param str 要进行处理的字符串
     * @param width 处理后字符串的长度，
     *              如果str.length >= width，将不做任何处理直接返回原始的str。
     * @return
     *
     */
    public static zfill(str: string, width: number = 2): string {
        if (!str) {
            return str;
        }
        width = Math.floor(width);
        let slen: number = str.length;
        if (slen >= width) {
            return str;
        }

        let negative: boolean = false;
        if (str.substr(0, 1) == '-') {
            negative = true;
            str = str.substr(1);
        }

        let len: number = width - slen;
        for (let i: number = 0; i < len; i++) {
            str = '0' + str;
        }

        if (negative) {
            str = '-' + str;
        }

        return str;
    }


    /**
     * 翻转字符串
     * @param str 字符串
     * @return 翻转后的字符串
     */
    public static reverse(str: string): string {
        if (str.length > 1)
            return this.reverse(str.substring(1)) + str.substring(0, 1);
        else
            return str;
    }


    /**
     * 截断某段字符串
     * @param str 目标字符串
     * @param start 需要截断的起始索引
     * @param en 截断长度
     * @param order 顺序，true从字符串头部开始计算，false从字符串尾巴开始结算。
     * @return 截断后的字符串
     */
    public static cutOff(str: string, start: number,
        len: number, order: boolean = true): string {
        start = Math.floor(start);
        len = Math.floor(len);
        let length: number = str.length;
        if (start > length) start = length;
        let s: number = start;
        let e: number = start + len;
        let newStr: string;
        if (order) {
            newStr = str.substring(0, s) + str.substr(e, length);
        } else {
            s = length - 1 - start - len;
            e = s + len;
            newStr = str.substring(0, s + 1) + str.substr(e + 1, length);
        }
        return newStr;
    }

    /**
     * {0} 字符替换 
     */
    public static strReplace(str: string, rStr: string[]): string {
        let i: number = 0, len: number = rStr.length;
        for (; i < len; i++) {
            if (rStr[i] == null || rStr[i] == "") {
                rStr[i] = "无";
            }
            str = str.replace("{" + i + "}", rStr[i]);
        }
        return str
    }

    public static format(str: string, ...args: any[]) {
        for (let i = 0; i < args.length - 1; i++) {
            let reg = new RegExp("\\{" + i + "\\}", "gm");
            str = str.replace(reg, args[i + 1]);
        }

        return str;
    }
}