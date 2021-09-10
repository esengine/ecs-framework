///<reference path="../Containers/Table.ts" />
module es {
    /**
     * 可以拖动和调整大小的表格。 顶部填充用作窗口的标题高度。
     * 窗口的首选大小是标题文本和表格中布置的子项的首选大小。 
     * 将子窗口添加到窗口后，可以方便地调用 {@link pack()} 将窗口大小调整为子窗口的大小。
     */
    export class Window extends Table {
        constructor(title: string, style: WindowStyle) {
            super();

            Insist.isNotNull(title, "title不能为Null");

            this.touchable = Touchable.enabled;
            this.clip = true;

            this.width = 150;
            this.height = 150;
        }
    }

    export class WindowStyle {

    }
}