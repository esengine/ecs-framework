interface IRenderable {
    bounds: Rectangle;
    enabled: boolean;
    isVisible: boolean;
    isVisibleFromCamera(camera: Camera);
    render(camera: Camera);
}