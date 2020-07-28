module es {
    /**
     * 帮助处理位掩码的实用程序类
     * 除了isFlagSet之外，所有方法都期望flag参数是一个非移位的标志
     * 允许您使用普通的(0、1、2、3等)来设置/取消您的标记
     */
    export class Flags {
        /**
         * 检查位标志是否已在数值中设置
         * 检查期望标志是否已经移位
         * @param self
         * @param flag
         */
        public static isFlagSet(self: number, flag: number): boolean {
            return (self & flag) != 0;
        }

        /**
         * 检查位标志是否在数值中设置
         * @param self
         * @param flag
         */
        public static isUnshiftedFlagSet(self: number, flag: number): boolean {
            flag = 1 << flag;
            return (self & flag) != 0;
        }

        /**
         *  设置数值标志位，移除所有已经设置的标志
         * @param self
         * @param flag
         */
        public static setFlagExclusive(self: number, flag: number) {
            return 1 << flag;
        }

        /**
         * 设置标志位
         * @param self
         * @param flag
         */
        public static setFlag(self: number, flag: number) {
            return (self | 1 << flag);
        }

        /**
         * 取消标志位
         * @param self
         * @param flag
         */
        public static unsetFlag(self: number, flag: number) {
            flag = 1 << flag;
            return (self & (~flag));
        }

        /**
         * 反转数值集合位
         * @param self
         */
        public static invertFlags(self: number) {
            return ~self;
        }
    }
}
