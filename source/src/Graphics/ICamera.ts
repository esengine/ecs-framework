module es {
    export interface ICamera extends Component {
        position: Vector2;
        rotation: number;
        rawZoom: number;
        zoom: number;
        minimumZoom: number;
        maximumZoom: number;
        bounds: Rectangle;
        transformMatrix: Matrix2D;
        inverseTransformMatrix: Matrix2D;
        projectionMatrix: Matrix;
        viewprojectionMatrix: Matrix;
        origin: Vector2;
        setInset(left: number, right: number, top: number, bottom: number): ICamera;
        setPosition(position: Vector2): ICamera;
        setRotation(rotation: number): ICamera;
        setZoom(zoom: number): ICamera;
        setMinimumZoom(minZoom: number): ICamera;
        setMaximumZoom(maxZoom: number): ICamera;
        forceMatrixUpdate();
        onEntityTransformChanged(comp: transform.Component);
        zoomIn(deltaZoom: number);
        zoomOut(deltaZoom: number);
        worldToScreenPoint(worldPosition: Vector2): Vector2;
        screenToWorldPoint(screenPosition: Vector2): Vector2;
        onSceneRenderTargetSizeChanged(newWidth: number, newHeight: number);
    }
}