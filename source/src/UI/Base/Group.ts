///<reference path="Element.ts" />
module es {
    export class Group extends Element {
        public children: Element[] = [];
        protected transform = true;
        _previousBatcherTransform: Matrix2D;
        /**
         * 如果组在配置后添加到舞台，则在所有子级上设置舞台
         * @param stage 
         */
        public setStage(stage: Stage) {
            this._stage = stage;
            for (let i = 0; i < this.children.length; i ++)
                this.children[i].setStage(stage);
        }

        public draw(batcher: Batcher, parentAlpha: number) {
            if (!this.isVisible())
                return;

            this.validate();

            if (this.transform)
                this.applyTransform(batcher, this.computeTransform());
        }

        protected computeTransform(): Matrix2D {
            let mat = Matrix2D.identity;
            let tempMatrix = Matrix2D.identity;

            if (this.originX != 0 || this.originY != 0) {
                Matrix2D.createTranslation(-this.originX, -this.originY, tempMatrix);
                Matrix2D.multiply(mat, tempMatrix, mat);
            }

            if (this.rotation != 0) {
                Matrix2D.createRotation(MathHelper.toRadians(this.rotation), tempMatrix);
                Matrix2D.multiply(mat, tempMatrix, mat);
            }

            if (this.scaleX != 1 || this.scaleY != 1) {
                Matrix2D.createScale(this.scaleX, this.scaleY, tempMatrix);
                Matrix2D.multiply(mat, tempMatrix, mat);
            }

            let parentGroup = this.parent;
            while (parentGroup != null) {
                if (parentGroup.transform)
                    break;

                parentGroup = parentGroup.parent;
            }

            if (parentGroup != null)
                Matrix2D.multiply(mat, parentGroup.computeTransform(), mat);

            return mat;
        }

        /**
         * 设置批处理的转换矩阵，通常使用 {@link computeTransform()} 的结果。 
         * 请注意，这会导致批次被刷新。 {@link resetTransform(Batch)} 会将转换恢复到此调用之前的状态。
         * @param batcher 
         * @param transform 
         */
        protected applyTransform(batcher: Batcher, transform: Matrix2D) {
            this._previousBatcherTransform = batcher.transformMatrix;
        }

        /**
         * 将批量转换恢复到 {@link #applyTransform(Batch, Matrix2D)} 之前的状态。 请注意，这会导致批处理被刷新
         * @param batcher 
         */
        protected resetTransform(batcher: Batcher) {

        }
    }
}