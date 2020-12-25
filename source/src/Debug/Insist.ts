module es {
    export class Insist {
        public static fail(message: string = null, ...args: any[]) {
            if (message == null) {
                console.assert(false);
            } else {
                console.assert(false, StringUtils.format(message, args));
            }

        }

        public static isTrue(condition: boolean, message: string = null, ...args: any[]) {
            if (!condition) {
                if (message == null) {
                    this.fail();
                } else {
                    this.fail(message, args);
                }
            }
        }

        public static isFalse(condition: boolean, message: string = null, ...args: any[]) {
            if (message == null) {
                this.isTrue(!condition);
            } else {
                this.isTrue(!condition, message, args);
            }
        }

        public static isNull(obj, message: string = null, ...args: any[]) {
            if (message == null) {
                this.isTrue(obj == null);
            } else {
                this.isTrue(obj == null, message, args);
            }
        }

        public static isNotNull(obj, message: string = null, ...args: any[]) {
            if (message == null) {
                this.isTrue(obj != null);
            } else {
                this.isTrue(obj != null, message, args);
            }
        }

        public static areEqual(first, second, message: string, ...args: any[]) {
            if (first != second)
                this.fail(message, args);
        }

        public static areNotEqual(first, second, message: string, ...args: any[]) {
            if (first == second)
                this.fail(message, args);
        }
    }
}