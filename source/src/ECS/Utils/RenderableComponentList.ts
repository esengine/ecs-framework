module es {
    export class RenderableComponentList {
        // IRenderable列表的全局updateOrder排序
        public static compareUpdatableOrder: IComparer<IRenderable> = new RenderableComparer();

        /**
         * 添加到实体的组件列表
         */
        private _components: IRenderable[] = [];
        /**
         * 通过renderLayer跟踪组件，便于检索
         */
        private _componentsByRenderLayer: Map<number, IRenderable[]> = new Map();

        private _unsortedRenderLayers: number[] = [];
        private _componentsNeedSort: boolean = true;

        public get count() {
            return this._components.length;
        }

        public get buffer(){
            return this._components;
        }

        public get(index: number): IRenderable {
            return this._components[index];
        }

        public add(component: IRenderable) {
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        }

        public remove(component: IRenderable) {
            new linq.List(this._components).remove(component);
            new linq.List(this._componentsByRenderLayer.get(component.renderLayer)).remove(component);
        }

        public updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number) {
            // 需要注意的是，在组件 "上线 "之前，renderLayer可能会发生变化
            if (this._componentsByRenderLayer.has(oldRenderLayer) &&
                new linq.List(this._componentsByRenderLayer.get(oldRenderLayer)).contains(component)) {
                new linq.List(this._componentsByRenderLayer.get(oldRenderLayer)).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        }

        /**
         * 弄脏RenderLayers排序标志，导致所有组件的重新排序
         * @param renderLayer 
         */
        public setRenderLayerNeedsComponentSort(renderLayer: number) {
            if (!new linq.List(this._unsortedRenderLayers).contains(renderLayer))
                this._unsortedRenderLayers.push(renderLayer);
            this._componentsNeedSort = true;
        }

        private addToRenderLayerList(component: IRenderable, renderLayer: number) {
            let list = this.componentsWithRenderLayer(renderLayer);
            Insist.isFalse(new linq.List(list).contains(component), "组件renderLayer列表已经包含这个组件");
        }

        /**
         * 获取所有给定renderLayer的组件。组件列表是预先排序的。
         * @param renderLayer 
         */
        public componentsWithRenderLayer(renderLayer: number) {
            if (!this._componentsByRenderLayer.has(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }

            return this._componentsByRenderLayer.get(renderLayer);
        }

        public updateList() {
            if (this._componentsNeedSort) {
                this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this._componentsNeedSort = false;
            }

            if (this._unsortedRenderLayers.length > 0) {
                for (let i = 0, count = this._unsortedRenderLayers.length; i < count; i++) {
                    let renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents.sort(RenderableComponentList.compareUpdatableOrder.compare);
                    }
                }

                this._unsortedRenderLayers.length = 0;
            }
        }
    }
}