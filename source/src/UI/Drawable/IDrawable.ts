module es {
    export interface IDrawable {
        leftWidth: number;
        rightWidth: number;
        topHeight: number;
        bottomHeight: number;
        minWidth: number;
        minHeight: number;

        setPadding(top: number, bottom: number, left: number, right: number): void;
        draw(batcher: Batcher, x: number, y: number, width: number, height: number, color: Color): void;
    }
}