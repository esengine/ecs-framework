module manager {
    export class AlterManager {
        public static alter_tips(txt: string){
            let item_tip = FUI.common.UI_com_tips.createInstance();
            if (!item_tip)
                return;
            item_tip.m_content.text = txt;
            item_tip.ensureBoundsCorrect();
            item_tip.x = es.Core.Instance.stage.stageWidth / 2 - item_tip.width / 2;
            item_tip.y = es.Core.Instance.stage.stageHeight / 2 - item_tip.height / 2;
            LayerManager.getInstance().tipsLayer.addChild(item_tip.displayObject);

            item_tip.alpha = 0;
            let originY = item_tip.y;
            egret.Tween.get(item_tip).to({alpha: 1, y: originY - 100}, 700, egret.Ease.cubicInOut).wait(1000)
                .to({alpha: 0, y: originY - 200}, 700, egret.Ease.cubicInOut).call(()=>{
                    egret.Tween.removeTweens(item_tip.displayObject);
                    if (item_tip.displayObject && item_tip.displayObject.parent)
                        item_tip.displayObject.parent.removeChild(item_tip.displayObject);
                    item_tip.dispose();
                    item_tip = null;
                });
        }
    }
}