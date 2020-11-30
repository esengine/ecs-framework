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
        private _componentsNeedSort: boolean = true;
        public get componentsNeedSort(): boolean {
            return this._componentsNeedSort;
        }
        public set componentsNeedSort(value: boolean) {
            this._componentsNeedSort = value;
        }

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
            new linq.List(this._components).remove(component);
            new linq.List(this._componentsByRenderLayer.get(component.renderLayer)).remove(component);
        }

        public updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number) {
            // 需要注意的是，如果渲染层在组件update之前发生了改变
            let oldRenderLayers = new linq.List(this._componentsByRenderLayer.get(oldRenderLayer));
            if (this._componentsByRenderLayer.has(oldRenderLayer) && oldRenderLayers.contains(component)) {
                oldRenderLayers.remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        }

        /**
         * 将渲染层排序标志弄脏，让所有组件重新排序
         * @param renderLayer
         */
        public setRenderLayerNeedsComponentSort(renderLayer: number) {
            let unsortedRenderLayers = new linq.List(this._unsortedRenderLayers);
            if (!unsortedRenderLayers.contains(renderLayer))
                unsortedRenderLayers.add(renderLayer);
            this.componentsNeedSort = true;
        }

        public setNeedsComponentSort() {
            this.componentsNeedSort = true;
        }

        public addToRenderLayerList(component: IRenderable, renderLayer: number) {
            let list = new linq.List(this.componentsWithRenderLayer(renderLayer));
            if (list.contains(component)) {
                console.warn("组件呈现层列表已经包含此组件");
                return;
            }

            list.add(component);
            let unsortedRenderLayers = new linq.List(this._unsortedRenderLayers);
            if (!unsortedRenderLayers.contains(renderLayer))
                unsortedRenderLayers.add(renderLayer);
            this.componentsNeedSort = true;
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
            if (this.componentsNeedSort) {
                this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this.componentsNeedSort = false;
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
