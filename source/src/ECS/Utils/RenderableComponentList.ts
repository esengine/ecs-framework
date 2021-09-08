module es {
    export class RenderableComponentList {
        // IRenderable 列表的全局 updateOrder 排序
        public static compareUpdatableOrder: IComparer<IRenderable> = new RenderableComparer();
        /** 添加到实体的组件列表 */
        private _components: IRenderable[] = [];
        /** 通过 renderLayer 跟踪组件以便于检索 */
        private _componentsByRenderLayer: Map<number, IRenderable[]> = new Map();
        private _unsortedRenderLayers: number[] = [];
        private _componentsNeedSort = true;

        public get count() {
            return this._components.length;
        }

        public get(index: number) {
            return this._components[index];
        }

        public add(component: IRenderable) {
            if (component.sprite && component.sprite.parent == null) {
                Core.stage.addChild(component.sprite);
            }
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        }

        public remove(component: IRenderable) {
            if (component.sprite && component.sprite.parent != null) {
                Core.stage.removeChild(component.sprite);
            }
            new List(this._components).remove(component);
            new List(this._componentsByRenderLayer.get(component.renderLayer)).remove(component);
        }

        public updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number) {
            // 如果在组件“活动”之前更改了 renderLayer，则需要小心
            // 当组件在创建后立即更改其 renderLayer 时，可能会发生这种情况
            if (this._componentsByRenderLayer.has(oldRenderLayer) && 
                this._componentsByRenderLayer.get(oldRenderLayer).indexOf(component) == -1) {
                new List(this._componentsByRenderLayer.get(oldRenderLayer)).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        }

        /**
         * 弄脏 RenderLayers 排序标志，这会导致所有组件重新排序
         * @param renderLayer 
         */
        public setRenderLayerNeedsComponentSort(renderLayer: number) {
            if (this._unsortedRenderLayers.indexOf(renderLayer) == -1)
                this._unsortedRenderLayers.push(renderLayer);
            this._componentsNeedSort = true;
        }

        public setNeedsComponentSort() {
            this._componentsNeedSort = true;
        }

        private addToRenderLayerList(component: IRenderable, renderLayer: number) {
            let list = this.componentsWithRenderLayer(renderLayer);
            es.Insist.isFalse(!!list.find(c => c == component), "组件renderLayer列表已包含此组件");

            list.push(component);
            if (this._unsortedRenderLayers.indexOf(renderLayer) == -1)
                this._unsortedRenderLayers.push(renderLayer);
            this._componentsNeedSort = true;
        }

        /**
         * 使用给定的 renderLayer 获取所有组件。 组件列表是预先排序的
         * @param renderLayer 
         * @returns 
         */
        public componentsWithRenderLayer(renderLayer: number) {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }

            return this._componentsByRenderLayer.get(renderLayer);
        }

        public updateLists() {
            if (this._componentsNeedSort) {
                this._components = this._components.sort(RenderableComponentList.compareUpdatableOrder.compare);
                this._componentsNeedSort = false;
            }

            if (this._unsortedRenderLayers.length > 0) {
                for (let i = 0, count = this._unsortedRenderLayers.length; i < count; i ++) {
                    let renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents = renderLayerComponents.sort(RenderableComponentList.compareUpdatableOrder.compare);
                        this._componentsByRenderLayer.set(this._unsortedRenderLayers[i], renderLayerComponents);
                    }

                    this._unsortedRenderLayers.length = 0;
                }
            }
        }
    }
}