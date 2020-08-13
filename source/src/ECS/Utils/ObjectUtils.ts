class ObjectUtils {
    /**
     * 对象深度拷贝
     * @param p any 源对象
     * @param c any 目标对象, 不传则返回新对象, 传则合并属性, 相同名字的属性则会覆盖
     */
    public static clone<T>(p: any, c: T = null): T {
        var c = c || <T>{};
        for (let i in p) {
            if (typeof p[i] === 'object') {
                c[i] = p[i] instanceof Array ? [] : {};
                this.clone(p[i], c[i]);
            } else {
                c[i] = p[i];
            }
        }
        return c;
    }

    public static elements(p: {}){
        let c = [];
        for (let i in p){
            c.push(p[i]);
        }

        return c;
    }
}