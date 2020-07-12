/**
 * 支持标题安全区的布局类。
 */
class Layout {
    public clientArea: Rectangle;
    public safeArea: Rectangle;

    constructor(){
        this.clientArea = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        this.safeArea = this.clientArea;
    }

    public place(size: Vector2, horizontalMargin: number, verticalMargine: number, alignment: Alignment){
        let rc = new Rectangle(0, 0, size.x, size.y);
        if ((alignment & Alignment.left) != 0){
            rc.x = this.clientArea.x + (this.clientArea.width * horizontalMargin);
        }else if((alignment & Alignment.right) != 0){
            rc.x = this.clientArea.x + (this.clientArea.width * (1 - horizontalMargin)) - rc.width;
        } else if((alignment & Alignment.horizontalCenter) != 0){
            rc.x = this.clientArea.x + (this.clientArea.width - rc.width) / 2 + (horizontalMargin * this.clientArea.width);
        }else{

        }

        if ((alignment & Alignment.top) != 0){
            rc.y = this.clientArea.y + (this.clientArea.height * verticalMargine);
        }else if((alignment & Alignment.bottom) != 0){
            rc.y = this.clientArea.y + (this.clientArea.height * (1 - verticalMargine)) - rc.height;
        } else if((alignment & Alignment.verticalCenter) != 0){
            rc.y = this.clientArea.y + (this.clientArea.height - rc.height) / 2 + (verticalMargine * this.clientArea.height);
        }else{

        }

        // 确保布局区域在安全区域内。
        if (rc.left < this.safeArea.left)
            rc.x = this.safeArea.left;

        if (rc.right > this.safeArea.right)
            rc.x = this.safeArea.right - rc.width;

        if (rc.top < this.safeArea.top)
            rc.y = this.safeArea.top;

        if (rc.bottom > this.safeArea.bottom)
            rc.y = this.safeArea.bottom - rc.height;

        return rc;
    }
}

enum Alignment {
    none = 0,
    left = 1,
    right = 2,
    horizontalCenter = 4,
    top = 8,
    bottom = 16,
    verticalCenter = 32,
    topLeft = top | left,
    topRight = top | right,
    topCenter = top | horizontalCenter,
    bottomLeft = bottom | left,
    bottomRight = bottom | right,
    bottomCenter = bottom | horizontalCenter,
    centerLeft = verticalCenter | left,
    centerRight = verticalCenter | right,
    center = verticalCenter | horizontalCenter
}