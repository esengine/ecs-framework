module es {
    /**
     * 检查系统的核心。 Inspector 的子类负责设置和管理 UI。 目前，尚未实现自定义类型处理。
     */
    export abstract class Inspector {
        protected _target: any;
        protected _name: string;
        protected _valueType: any;
        protected _getter: Function;
        protected _setter: Function;

        public static getInspectableProperties(target: any) {
            const props: Inspector[] = [];

            for (let field in target) {
                console.log(field, typeof(target[field]));
                if (field == "enabled")
                    continue;
            }
        }

        protected static getInspectorForType(valueType: any, target: any){
            if (valueType instanceof Number) {
                return new NumberInspector();
            }
        }
    }
}