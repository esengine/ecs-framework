/**
 * 帮助处理位掩码的实用程序类
 */
class Flags {
    /**
     * 检查位标志是否已在整型中设置
     * @param self 
     * @param flag 
     */
    public static isFlagSet(self: number, flag: number){
        return (self & flag) != 0;
    }

    /**
     * 检查位标志是否在整型中设置
     * @param self 
     * @param flag 
     */
    public static isUnshiftedFlagSet(self: number, flag: number){
        flag = 1 << flag;
        return (self & flag) != 0;
    }

    /**
     *  设置标志位，移除所有已经设置的标志
     * @param self 
     * @param flag 
     */
    public static setFlagExclusive(self: number, flag: number){
        self = 1 << flag;
    }

    /**
     * 设置标志位
     * @param self 
     * @param flag 
     */
    public static setFlag(self: number, flag: number){
        self = (self | 1 << flag);
    }

    /**
     * 取消标志位
     * @param self 
     * @param flag 
     */
    public static unsetFlag(self: number, flag: number){
        flag = 1 << flag;
        self = (self & (~flag));
    }

    /**
     * 反转集合位
     * @param self 
     */
    public static invertFlags(self: number){
        self = ~self;
    }
}