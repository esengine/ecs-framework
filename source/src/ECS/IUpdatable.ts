/** 当将该接口添加到组件时，只要启用了组件和实体，它就需要调用每帧的更新方法。 */
interface IUpdatable {
    enabled: boolean;
    updateOrder: number;
    update();
}