module es {
    export class RenderableComponentList {
        private _components: IRenderable[] = [];
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
            this._components.push(component);
            this.addToRenderLayerList(component, component.renderLayer);
        }

        public remove(component: IRenderable) {
            new List(this._components).remove(component);
            new List(this._componentsByRenderLayer.get(component.renderLayer)).remove(component);
        }

        public updateRenderableRenderLayer(component: IRenderable, oldRenderLayer: number, newRenderLayer: number) {
            if (this._componentsByRenderLayer.has(oldRenderLayer) && new List(this._componentsByRenderLayer.get(oldRenderLayer)).contains(component)) {
                new List(this._componentsByRenderLayer.get(oldRenderLayer)).remove(component);
                this.addToRenderLayerList(component, newRenderLayer);
            }
        }

        public setRenderLayerNeedsComponentSort(renderLayer: number) {
            const unsortedRenderLayersList = new List(this._unsortedRenderLayers);
            if (!unsortedRenderLayersList.contains(renderLayer))
                unsortedRenderLayersList.add(renderLayer);
            this._componentsNeedSort = true;
        }

        public setNeedsComponentSort() {
            this._componentsNeedSort = true;
        }

        private addToRenderLayerList(component: IRenderable, renderLayer: number) {
            let list = this.componentsWithRenderLayer(renderLayer);
            es.Insist.isFalse(!!list.find(c => c == component), "组件renderLayer列表已包含此组件");

            list.push(component);
            const unsortedRenderLayersList = new List(this._unsortedRenderLayers);
            if (!unsortedRenderLayersList.contains(renderLayer))
                unsortedRenderLayersList.add(renderLayer);
            this._componentsNeedSort = true;
        }

        public componentsWithRenderLayer(renderLayer: number) {
            if (!this._componentsByRenderLayer.get(renderLayer)) {
                this._componentsByRenderLayer.set(renderLayer, []);
            }

            return this._componentsByRenderLayer.get(renderLayer);
        }

        public updateLists() {
            if (this._componentsNeedSort) {
                this._components.sort((self, other) => other.renderLayer - self.renderLayer);
                this._componentsNeedSort = false;
            }

            if (this._unsortedRenderLayers.length > 0) {
                for (let i = 0, count = this._unsortedRenderLayers.length; i < count; i ++) {
                    const renderLayerComponents = this._componentsByRenderLayer.get(this._unsortedRenderLayers[i]);
                    if (renderLayerComponents) {
                        renderLayerComponents.sort((self, other) => other.renderLayer - self.renderLayer);
                    }

                    this._unsortedRenderLayers.length = 0;
                }
            }
        }
    }
}