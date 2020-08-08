///<reference path="../../Graphics/Renderers/IRenderable.ts" />
module es {
    export class RenderableComponentList {
        /**
         * IRenderable列表的全局updatePrder排序
         */
        public static compareUpdatableOrder = new RenderableComparer();
        /**
         * 添加到实体的组件列表
         */
        public _components: IRenderable[] = [];
        /**
         * 通过渲染层跟踪组件，便于检索
         */
        public _componentsByRenderLayer: Map<number, IRenderable[]> = new Map<number, IRenderable[]>();
        public _unsortedRenderLayers: number[] = [];
        public _componentsNeedSort: boolean = true;

        public get count() {
            return this._components.length;
        }

        public get buffer() {
            return this._components;
        }

        public add(component: IRenderable) {
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        }

        public remove(component: IRenderable) {
            this._components.remove(component);
            this._componentsByRenderLayer.get(component.renderLayer).remove(component);
        }

        public updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number) {
            // 需要注意的是，如果渲染层在组件update之前发生了改变
            if (this._componentsByRenderLayer.has(oldRenderLayer) && this._componentsByRenderLayer.get(oldRenderLayer).contains(component)) {
                this._componentsByRenderLayer.get(oldRenderLayer).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        }

        /**
         * 将渲染层排序标志弄脏，让所有组件重新排序
         * @param renderLayer
         */
        public setRenderLayerNeedsComponentSort(renderLayer: number) {
            if (!this._unsortedRenderLayers.contains(renderLayer))
                this._unsortedRenderLayers.push(renderLayer);
            this._componentsNeedSort = true;
        }

        public setNeedsComponentSort() {
            this._componentsNeedSort = true;
        }

        public addToRenderLayerList(component: IRenderable, renderLayer: number) {
            let list = this.componentsWithRenderLayer(renderLayer);
            if (!list.contains(component)) {
                console.warn("组件呈现层列表已经包含此组件");
                return;
            }

            list.push(component);
            if (!this._unsortedRenderLayers.contains(renderLayer))
                this._unsortedRenderLayers.push(renderLayer);
            this._componentsNeedSort = true;
        }

        /**
         * 使用给定的渲染层获取所有组件。组件列表是预先排序的
         * @param renderLayer
         */
        public componentsWithRenderLayer(renderLayer: number): IRenderable[] {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }
            return this._componentsByRenderLayer.get(renderLayer);
        }

        public updateList() {
            if (this._componentsNeedSort) {
                this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this._componentsNeedSort = false;
                this.updateEgretList();
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

        private updateEgretList(){
            let scene = Core._instance._scene;
            if (!scene)
                return;

            for (let i = 0 ; i < this._components.length; i ++){
                let component = this._components[i] as RenderableComponent;
                let egretDisplayObject = scene.$children.find(a => {return a.hashCode == component.displayObject.hashCode});
                let displayIndex = scene.getChildIndex(egretDisplayObject);
                if (displayIndex != i) scene.swapChildrenAt(displayIndex, i);
            }
        }
    }
}
