module es {
    export class GaussianBlur {
        /**
         * 创建一个新的纹理，它是原始纹理的高斯模糊版本
         * @param image 
         * @param deviation 偏差
         * @returns 模糊的纹理
         */
        public static createBlurredTexture(image: egret.Texture, deviation: number = 1) {
            let pixelData = image.getPixels(0, 0, image.textureWidth, image.textureHeight);
            let srcData: Color[] = new Array(image.textureWidth * image.textureHeight);
            for (let i = 0; i < image.textureWidth; i++) {
                for (let j = 0; j < image.textureHeight; j++) {
                    let width = image.textureWidth;
                    let r = pixelData[i * 4 + j * width];
                    let g = pixelData[i * 4 + j * width + 1];
                    let b = pixelData[i * 4 + j * width + 2];
                    let a = pixelData[i * 4 + j * width + 3];
                    srcData[i + j * width] = new Color(r, g, b, a);
                }
            }

            // TODO: 计算方式有问题 后面再研究研究
            let destData = this.createBlurredTextureData(srcData, image.textureWidth, image.textureHeight, deviation);
            let arrayBuffer = new ArrayBuffer(destData.length);
            destData.forEach((value, index) => {
                arrayBuffer[index] = value.packedValue;
            });
            egret.BitmapData.create("arraybuffer", arrayBuffer, (bitmapData) => {
                // TODO: 生成bitmapdata
            });
        }

        public static createBlurredTextureData(srcData: Color[], width: number, height: number, deviation: number = 1) {
            let matrixR = new FasterDictionary<{ x: number, y: number }, number>();
            let matrixG = new FasterDictionary<{ x: number, y: number }, number>();
            let matrixB = new FasterDictionary<{ x: number, y: number }, number>();
            let matrixA = new FasterDictionary<{ x: number, y: number }, number>();

            let destData: Color[] = new Array(width * height);

            // 首先，我们计算出灰度，并将其存储在矩阵中
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    matrixR.add({ x: i, y: j }, srcData[i + j * width].r);
                    matrixG.add({ x: i, y: j }, srcData[i + j * width].g);
                    matrixB.add({ x: i, y: j }, srcData[i + j * width].b);
                    matrixA.add({ x: i, y: j }, srcData[i + j * width].a);
                }
            }

            matrixR = this.gaussianConvolution(matrixR, deviation);
            matrixG = this.gaussianConvolution(matrixG, deviation);
            matrixB = this.gaussianConvolution(matrixB, deviation);
            matrixA = this.gaussianConvolution(matrixA, deviation);

            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    let r = Math.min(255, matrixR.tryGetValue({x: i, y: j}));
                    let g = Math.min(255, matrixG.tryGetValue({x: i, y: j}));
                    let b = Math.min(255, matrixB.tryGetValue({x: i, y: j}));
                    let a = Math.min(255, matrixA.tryGetValue({x: i, y: j}));
                    destData[i + j * width] = new Color(r, g, b, a);
                }
            }

            return destData;
        }

        public static gaussianConvolution(matrix: FasterDictionary<{ x: number, y: number }, number>, deviation: number) {
            let kernel = this.calculateNormalized1DSampleKernel(deviation);
            let res1 = new FasterDictionary<{ x: number, y: number }, number>();
            let res2 = new FasterDictionary<{ x: number, y: number }, number>();

            for (let i = 0; i < matrix._valuesInfo.length; i++) {
                for (let j = 0; j < matrix.valuesArray.length; j++)
                    res1.add({ x: i, y: j }, this.processPoint(matrix, i, j, kernel, 0));
            }

            for (let i = 0; i < matrix._valuesInfo.length; i++) {
                for (let j = 0; j < matrix.valuesArray.length; j++)
                    res2.add({ x: i, y: j }, this.processPoint(res1, i, j, kernel, 1));
            }

            return res2;
        }

        public static processPoint(matrix: FasterDictionary<{ x: number, y: number }, number>,
            x: number,
            y: number,
            kernel: FasterDictionary<{ x: number, y: number }, number>,
            direction: number) {
            let res = 0;
            let half = kernel._valuesInfo.length / 2;
            for (let i = 0; i < kernel._valuesInfo.length; i++) {
                let cox = direction == 0 ? x + i - half : x;
                let coy = direction == 1 ? y + i - half : y;
                if (cox >= 0 && cox < matrix._valuesInfo.length && coy >= 0 && coy < matrix.valuesArray.length)
                    res += matrix.tryGetValue({ x: cox, y: coy }) * kernel.tryGetValue({x: i, y: 0});
            }

            return res;
        }

        public static calculate1DSampleKernel(deviation: number) {
            let size = Math.ceil(deviation * 3) * 3 + 1;
            return this.calculate1DSampleKernelOfSize(deviation, size);
        }

        public static calculate1DSampleKernelOfSize(deviation: number, size: number) {
            let ret = new FasterDictionary<{ x: number, y: number }, number>();
            // let sum = 0;

            let half = (size - 1) / 2;
            for (let i = 0; i < size; i++) {
                ret.add({x: i, y: 0}, 1 / (Math.sqrt(2 * Math.PI) * deviation) * Math.exp(-(i - half) * (i - half) / (2 * deviation * deviation)));
                // sum += ret.tryGetValue({x: i, y: 0});
            }

            return ret;
        }

        public static calculateNormalized1DSampleKernel(deviation: number) {
            return this.normalizeMatrix(this.calculate1DSampleKernel(deviation));
        }

        public static normalizeMatrix(matrix: FasterDictionary<{ x: number, y: number }, number>) {
            let ret = new FasterDictionary<{ x: number, y: number }, number>();
            let sum = 0;
            for (let i = 0; i < ret._valuesInfo.length; i++) {
                for (let j = 0; j < ret.valuesArray.length; j++) {
                    sum += matrix.tryGetValue({x: i, y: j});
                }
            }

            if (sum != 0) {
                for (let i = 0; i < ret._valuesInfo.length; i++) {
                    for (let j = 0; j < ret.valuesArray.length; j++) {
                        ret.add({x: i, y: j}, matrix.tryGetValue({x: i, y: j}) / sum);
                    }
                }
            }

            return ret;
        }
    }
}