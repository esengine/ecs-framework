module es {
    export class GraphicsCapabilities extends egret.Capabilities {

        public initialize(device: GraphicsDevice){
            this.platformInitialize(device);
        }

        private platformInitialize(device: GraphicsDevice){
            if (GraphicsCapabilities.runtimeType != egret.RuntimeType.WXGAME)
                return;
            let capabilities = this;
            capabilities["isMobile"] = true;

            let systemInfo = wx.getSystemInfoSync();
            let systemStr = systemInfo.system.toLowerCase();
            if (systemStr.indexOf("ios") > -1){
                capabilities["os"] = "iOS";
            } else if(systemStr.indexOf("android") > -1){
                capabilities["os"] = "Android";
            }

            let language = systemInfo.language;
            if (language.indexOf('zh') > -1){
                language = "zh-CN";
            } else {
                language = "en-US";
            }
            capabilities["language"] = language;
        }
    }
}
