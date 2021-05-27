module es {
    export interface IBatcher {
        begin(cam: ICamera);
        end();
        drawPoints(points: Vector2[], color: Color, thickness?: number);
        drawPolygon(poisition: Vector2, points: Vector2[], color: Color, closePoly: boolean, thickness?: number);
        drawHollowRect(x: number, y: number, width: number, height: number, color: Color, thickness?: number);
        drawCircle(position: Vector2, raidus: number, color: Color, thickness?: number);
        drawCircleLow(position: es.Vector2, radius: number, color: Color, thickness?: number, resolution?: number);
        drawRect(x: number, y: number, width: number, height: number, color: Color);
        drawLine(start: Vector2, end: Vector2, color: Color, thickness: number);
        drawPixel(position: Vector2, color: Color, size?: number);
    }
}

