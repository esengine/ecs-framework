module es {
    export class Cell implements IPoolable {
        private static defaults: Cell;

        private table: Table;

        constructor() {
            this.reset();
        }

        public setLayout(table: Table) {
            this.table = table;
        }

        /**
         * 返回用于所有单元格的默认值。 这可用于避免需要为每个表格设置相同的默认值（例如，间距）
         * @returns 
         */
        public static getDefaults(): Cell {
            return this.defaults;
        }

        /**
         * 重置状态以便可以重用单元格，将所有约束设置为其 {@link defaults()} 值。
         */
        public reset() {
            
        }
    }
}