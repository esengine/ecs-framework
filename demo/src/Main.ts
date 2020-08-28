//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

import LoadingView = loading.LoadingView;

class Main extends es.Core {
    protected initialize() {
        try {
            es.Core.debugRenderEndabled = true;
            es.TimeRuler.Instance.showLog = true;
            this.runGame();
        } catch(err) {
            console.error(err);
        }
    }

    private runGame() {
        egret.ImageLoader.crossOrigin = "anonymous";
        this.initUIConfig();
        this.loadResource();
        this.initGameControl();
    }

    private initUIConfig(){
        LayerManager.getInstance().init(this.stage);
        FguiUtils.packageNamespace = FUI;
        fairygui.UIConfig.defaultFont = "黑体";
        fairygui.UIConfig.bringWindowToFrontOnClick = false;
        this.stage.addChild(fgui.GRoot.inst.displayListContainer);
    }

    private loadResource() {
        RES.loadConfig("resource/default.res.json", "resource/").then(()=>{
            EventManager.getInstance().dispatch(loading.LoadingEvents.OPENVIEW);
        }).catch(err =>{
            console.error(err);
        });
    }

    private initGameControl(){
        loading.LoadingControl.getInstance();
        sc.ScControl.getInstance();
    }
}
