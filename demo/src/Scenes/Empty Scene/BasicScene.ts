module samples {
    export class BasicScene extends SampleScene {
        public async onStart() {
            super.onStart();
            manager.AlterManager.alter_tips("空白场景加载成功");
        }
    }
}