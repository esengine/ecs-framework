module es {
    export class TimeUtils {
        /**
         * 获取日期对应的年份和月份的数字组合
         * @param d 要获取月份的日期对象，不传则默认为当前时间
         * @returns 返回数字组合的年份和月份
         */
        public static monthId(d: Date = null): number {
            // 如果传入了时间，则使用传入的时间，否则使用当前时间
            d = d ? d : new Date();

            // 获取当前年份
            let y = d.getFullYear();

            // 获取当前月份，并将月份转化为两位数的字符串格式
            let m = d.getMonth() + 1;
            let g = m < 10 ? "0" : "";

            // 返回年份和月份的数字组合
            return parseInt(y + g + m);
        }

        /**
         * 获取日期的数字组合
         * @param t - 可选参数，传入时间，若不传入则使用当前时间
         * @returns 数字组合
         */
        public static dateId(t: Date = null): number {
            // 如果传入了时间，则使用传入的时间，否则使用当前时间
            t = t ? t : new Date();

            // 获取当前月份，并将月份转化为两位数的字符串格式
            let m: number = t.getMonth() + 1;
            let a = m < 10 ? "0" : "";

            // 获取当前日期，并将日期转化为两位数的字符串格式
            let d: number = t.getDate();
            let b = d < 10 ? "0" : "";

            // 返回年份、月份和日期的数字组合
            return parseInt(t.getFullYear() + a + m + b + d);
        }

        /**
         * 获取当前日期所在周的数字组合
         * @param d - 可选参数，传入日期，若不传入则使用当前日期
         * @param first - 是否将当前周视为本年度的第1周，默认为true
         * @returns 数字组合
         */
        public static weekId(d: Date = null, first: boolean = true): number {
            d = d ? d : new Date();
            const c: Date = new Date(d.getTime()); // 复制一个新的日期对象，以免改变原始日期对象
            c.setDate(1);
            c.setMonth(0); // 将日期设置为当年的第一天

            const year: number = c.getFullYear();
            let firstDay: number = c.getDay();
            if (firstDay == 0) {
                firstDay = 7;
            }

            let max: boolean = false;
            if (firstDay <= 4) {
                max = firstDay > 1;
                c.setDate(c.getDate() - (firstDay - 1));
            } else {
                c.setDate(c.getDate() + 7 - firstDay + 1);
            }

            let num: number = this.diffDay(d, c, false); // 计算当前日期与本年度的第一个星期一之间的天数
            if (num < 0) {
                // 当前日期在本年度第一个星期一之前，则返回上一年度的最后一个星期
                c.setDate(1);
                c.setMonth(0);
                c.setDate(c.getDate() - 1);
                return this.weekId(c, false);
            }

            // 计算当前日期在本年度中是第几个星期
            const week: number = Math.floor(num / 7);
            const weekIdx: number = Math.floor(week) + 1;
            if (weekIdx == 53) {
                c.setTime(d.getTime());
                c.setDate(c.getDate() - 1);
                let endDay: number = c.getDay();
                if (endDay == 0) {
                    endDay = 7;
                }
                if (first && (!max || endDay < 4)) {
                    // 如果当前日期在本年度的最后一个星期并且当前年度的星期数不足53或当前日期在本年度第53周的星期4或更早，则返回下一年度的第1周
                    c.setFullYear(c.getFullYear() + 1);
                    c.setDate(1);
                    c.setMonth(0);
                    return this.weekId(c, false);
                }
            }
            const g: string = weekIdx > 9 ? "" : "0";
            const s: string = year + "00" + g + weekIdx; // 加上00防止和月份ID冲突
            return parseInt(s);
        }

        /**
         * 计算两个日期之间相差的天数
         * @param a 第一个日期
         * @param b 第二个日期
         * @param fixOne 是否将相差天数四舍五入到整数
         * @returns 两个日期之间相差的天数
         */
        public static diffDay(a: Date, b: Date, fixOne: boolean = false): number {
            let x = (a.getTime() - b.getTime()) / 86400000; // 计算两个日期相差的毫秒数，然后除以一天的毫秒数，得到相差的天数
            return fixOne ? Math.ceil(x) : Math.floor(x); // 如果 fixOne 参数为 true，则将相差天数四舍五入到整数，否则向下取整
        }

        /**
         * 获取指定日期所在周的第一天
         * @param d 指定日期，默认值为今天
         * @returns 指定日期所在周的第一天
         */
        public static getFirstDayOfWeek(d: Date = new Date()): Date {
            // 获取当前日期是星期几，如果是0，则设置为7
            let dayOfWeek = d.getDay() || 7;
            // 计算出指定日期所在周的第一天，即将指定日期减去星期几再加1
            // 这里用1减去dayOfWeek是为了保证星期一为一周的第一天
            return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1 - dayOfWeek, 0, 0, 0, 0);
        }

        /**
         * 获取当日凌晨时间
         */
        public static getFirstOfDay(d?: Date): Date {
            d = d ? d : new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        /**
         * 获取次日凌晨时间
         */
        public static getNextFirstOfDay(d?: Date): Date {
            return new Date(this.getFirstOfDay(d).getTime() + 86400000);
        }

        /**
         * 格式化日期为 "YYYY-MM-DD" 的字符串形式
         * @param date 要格式化的日期
         * @returns 格式化后的日期字符串
         */
        public static formatDate(date: Date): string {
            let y = date.getFullYear();
            let m: any = date.getMonth() + 1;
            m = m < 10 ? '0' + m : m;
            let d: any = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            return y + '-' + m + '-' + d;
        }


        /**
         * 将日期对象格式化为 "YYYY-MM-DD HH:mm:ss" 的字符串
         * @param date 日期对象
         * @returns 格式化后的字符串
         */
        public static formatDateTime(date: Date): string {
            let y = date.getFullYear();
            let m: any = date.getMonth() + 1;
            m = m < 10 ? ('0' + m) : m;
            let d: any = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            let h = date.getHours();
            let i: any = date.getMinutes();
            i = i < 10 ? ('0' + i) : i;
            let s: any = date.getSeconds();
            s = s < 10 ? ('0' + s) : s;
            return y + '-' + m + '-' + d + ' ' + h + ':' + i + ":" + s;
        }

        /**
         * 将字符串解析为Date对象
         * @param s 要解析的日期字符串，例如：2022-01-01
         * @returns 返回解析后的Date对象，如果解析失败，则返回当前时间的Date对象
         */
        public static parseDate(s: string): Date {
            let t = Date.parse(s);
            if (!isNaN(t)) {
                // 如果日期字符串中的分隔符为“-”，则需要先将其转换为“/”，否则解析会失败
                return new Date(Date.parse(s.replace(/-/g, "/")));
            } else {
                return new Date();
            }
        }

        /**
         * 将秒数转换为时分秒的格式
         * @param time 秒数
         * @param partition 分隔符
         * @param showHour 是否显示小时位
         * @returns 转换后的时间字符串
         */
        public static secondToTime(time: number = 0, partition: string = ":", showHour: boolean = true): string {
            let hours: number = Math.floor(time / 3600);
            let minutes: number = Math.floor(time % 3600 / 60);
            let seconds: number = Math.floor(time % 3600 % 60);

            let h: string = hours.toString();
            let m: string = minutes.toString();
            let s: string = seconds.toString();

            if (hours < 10) h = "0" + h;
            if (minutes < 10) m = "0" + m;
            if (seconds < 10) s = "0" + s;

            let timeStr: string;
            if (showHour)
                timeStr = h + partition + m + partition + s;
            else
                timeStr = m + partition + s;

            return timeStr;
        }

        /**
         * 将时间字符串转换为毫秒数
         * @param time 时间字符串，如 "01:30:15" 表示 1小时30分钟15秒
         * @param partition 分隔符，默认为 ":"
         * @returns 转换后的毫秒数字符串
         */
        public static timeToMillisecond(time: string, partition: string = ":"): string {
            let _ary: any[] = time.split(partition);
            let timeNum: number = 0;
            let len: number = _ary.length;

            // 将时间转换成毫秒数
            for (let i: number = 0; i < len; i++) {
                let n: number = <number>_ary[i];
                timeNum += n * Math.pow(60, (len - 1 - i));
            }
            timeNum *= 1000;

            return timeNum.toString();
        }
    }
}