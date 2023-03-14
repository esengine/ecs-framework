module es {
    /**
     * 一个用于操作二进制标志（也称为位字段）
     */
    export class Flags {
        /**
         * 检查指定二进制数字中是否已设置了指定标志位
         * @param self 二进制数字
         * @param flag 标志位，应该为2的幂
         * @returns 如果设置了指定的标志位，则返回true，否则返回false
         */
        public static isFlagSet(self: number, flag: number): boolean {
            return (self & flag) !== 0;
        }

        /**
         * 检查指定二进制数字中是否已设置未移位的指定标志位
         * @param self 二进制数字
         * @param flag 标志位，不应移位（应为2的幂）
         * @returns 如果设置了指定的标志位，则返回true，否则返回false
         */
        public static isUnshiftedFlagSet(self: number, flag: number): boolean {
            flag = 1 << flag;
            return (self & flag) !== 0;
        }

        /**
         * 将指定的标志位设置为二进制数字的唯一标志
         * @param self 二进制数字
         * @param flag 标志位，应该为2的幂
         */
        public static setFlagExclusive(self: Ref<number>, flag: number) {
            self.value = 1 << flag;
        }

        /**
         * 将指定的标志位设置为二进制数字
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        public static setFlag(self: Ref<number>, flag: number) {
            self.value |= 1 << flag;
        }

        /**
         * 将指定的标志位从二进制数字中取消设置
         * @param self 二进制数字的引用
         * @param flag 标志位，应该为2的幂
         */
        public static unsetFlag(self: Ref<number>, flag: number) {
            flag = 1 << flag;
            self.value &= ~flag;
        }

        /**
         * 反转二进制数字中的所有位（将1变为0，将0变为1）
         * @param self 二进制数字的引用
         */
        public static invertFlags(self: Ref<number>) {
            self.value = ~self.value;
        }

        /**
         * 返回二进制数字的字符串表示形式（以二进制形式）
         * @param self 二进制数字
         * @param leftPadWidth 返回的字符串的最小宽度（在左侧填充0）
         * @returns 二进制数字的字符串表示形式
         */
        public static binaryStringRepresentation(
            self: number,
            leftPadWidth = 10
        ): string {
            let str = self.toString(2);
            while (str.length < (leftPadWidth || 2)) {
                str = "0" + str;
            }
            return str;
        }
    }
}
