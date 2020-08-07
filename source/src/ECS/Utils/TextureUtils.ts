module es {
    /**
     * 纹理帮助类
     */
    export class TextureUtils {
        public static sharedCanvas: HTMLCanvasElement;
        public static sharedContext: CanvasRenderingContext2D;

        public static convertImageToCanvas(texture: egret.Texture, rect?: egret.Rectangle): HTMLCanvasElement {
            if (!this.sharedCanvas) {
                this.sharedCanvas = egret.sys.createCanvas();
                this.sharedContext = this.sharedCanvas.getContext("2d");
            }

            let w = texture.$getTextureWidth();
            let h = texture.$getTextureHeight();
            if (!rect) {
                rect = egret.$TempRectangle;
                rect.x = 0;
                rect.y = 0;
                rect.width = w;
                rect.height = h;
            }

            rect.x = Math.min(rect.x, w - 1);
            rect.y = Math.min(rect.y, h - 1);
            rect.width = Math.min(rect.width, w - rect.x);
            rect.height = Math.min(rect.height, h - rect.y);

            let iWidth = Math.floor(rect.width);
            let iHeight = Math.floor(rect.height);
            let surface = this.sharedCanvas;
            surface["style"]["width"] = iWidth + "px";
            surface["style"]["height"] = iHeight + "px";
            this.sharedCanvas.width = iWidth;
            this.sharedCanvas.height = iHeight;

            if (egret.Capabilities.renderMode == "webgl") {
                let renderTexture: egret.RenderTexture;
                //webgl下非RenderTexture纹理先画到RenderTexture
                if (!(<egret.RenderTexture>texture).$renderBuffer) {
                    if (egret.sys.systemRenderer["renderClear"]) {
                        egret.sys.systemRenderer["renderClear"]();
                    }
                    renderTexture = new egret.RenderTexture();
                    renderTexture.drawToTexture(new egret.Bitmap(texture));
                } else {
                    renderTexture = <egret.RenderTexture>texture;
                }
                //从RenderTexture中读取像素数据，填入canvas
                let pixels = renderTexture.$renderBuffer.getPixels(rect.x, rect.y, iWidth, iHeight);
                let x = 0;
                let y = 0;
                for (let i = 0; i < pixels.length; i += 4) {
                    this.sharedContext.fillStyle =
                        'rgba(' + pixels[i]
                        + ',' + pixels[i + 1]
                        + ',' + pixels[i + 2]
                        + ',' + (pixels[i + 3] / 255) + ')';
                    this.sharedContext.fillRect(x, y, 1, 1);
                    x++;
                    if (x == iWidth) {
                        x = 0;
                        y++;
                    }
                }

                if (!(<egret.RenderTexture>texture).$renderBuffer) {
                    renderTexture.dispose();
                }

                return surface;
            } else {
                let bitmapData = texture;
                let offsetX: number = Math.round(bitmapData.$offsetX);
                let offsetY: number = Math.round(bitmapData.$offsetY);
                let bitmapWidth: number = bitmapData.$bitmapWidth;
                let bitmapHeight: number = bitmapData.$bitmapHeight;
                let $TextureScaleFactor = Core._instance.stage.textureScaleFactor;
                this.sharedContext.drawImage(bitmapData.$bitmapData.source, bitmapData.$bitmapX + rect.x / $TextureScaleFactor, bitmapData.$bitmapY + rect.y / $TextureScaleFactor,
                    bitmapWidth * rect.width / w, bitmapHeight * rect.height / h, offsetX, offsetY, rect.width, rect.height);
                return surface;
            }
        }

        public static toDataURL(type: string, texture: egret.Texture, rect?: egret.Rectangle, encoderOptions?): string {
            try {
                let surface = this.convertImageToCanvas(texture, rect);
                let result = surface.toDataURL(type, encoderOptions);
                return result;
            } catch (e) {
                egret.$error(1033);
            }
            return null;
        }

        /**
         * 有些杀毒软件认为 saveToFile 可能是一个病毒文件
         * @param type
         * @param texture
         * @param filePath
         * @param rect
         * @param encoderOptions
         */
        public static eliFoTevas(type: string, texture: egret.Texture, filePath: string, rect?: egret.Rectangle, encoderOptions?): void {
            let surface = this.convertImageToCanvas(texture, rect);
            let result = (surface as any).toTempFilePathSync({
                fileType: type.indexOf("png") >= 0 ? "png" : "jpg"
            });

            wx.getFileSystemManager().saveFile({
                tempFilePath: result,
                filePath: `${wx.env.USER_DATA_PATH}/${filePath}`,
                success: function (res) {
                    //todo
                }
            });

            return result;
        }

        public static getPixel32(texture: egret.Texture, x: number, y: number): number[] {
            egret.$warn(1041, "getPixel32", "getPixels");
            return texture.getPixels(x, y);
        }

        public static getPixels(texture: egret.Texture, x: number, y: number, width: number = 1, height: number = 1): number[] {
            //webgl环境下不需要转换成canvas获取像素信息
            if (egret.Capabilities.renderMode == "webgl") {
                let renderTexture: egret.RenderTexture;
                //webgl下非RenderTexture纹理先画到RenderTexture
                if (!(<egret.RenderTexture>texture).$renderBuffer) {
                    renderTexture = new egret.RenderTexture();
                    renderTexture.drawToTexture(new egret.Bitmap(texture));
                } else {
                    renderTexture = <egret.RenderTexture>texture;
                }
                //从RenderTexture中读取像素数据
                let pixels = renderTexture.$renderBuffer.getPixels(x, y, width, height);
                return pixels;
            }
            try {
                let surface = this.convertImageToCanvas(texture);
                let result = this.sharedContext.getImageData(x, y, width, height).data;
                return <number[]><any>result;
            } catch (e) {
                egret.$error(1039);
            }
        }
    }
}
