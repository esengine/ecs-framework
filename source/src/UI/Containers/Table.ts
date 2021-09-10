module es {
    /**
     * 使用表格约束来调整和定位子级的组。 
     * 默认情况下，{@link getTouchable()} 是 {@link Touchable.childrenOnly}。
     * 首选和最小大小是 chdebugn 在列和行中布局时的大小。
     */
    export class Table extends Group {
        public clip: boolean = false;

        _cellDefaults: Cell;

        constructor() {
            super();

            this._cellDefaults = this.obtainCell();

            this.transform = false;
            this.touchable = Touchable.childrenOnly;
        }

        obtainCell(): Cell {
            const cell = Pool.obtain(Cell);
            cell.setLayout(this);
            return cell;
        }
    }
}