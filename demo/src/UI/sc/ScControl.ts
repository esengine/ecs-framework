module sc {
    export class ScControl {
        private _eventManager: EventManager;
        private _viewManager: ViewManager;
        private static single: ScControl;
        public static getInstance(){
            if (!this.single) this.single = new ScControl();
            
            return this.single;
        }
        
        constructor(){
            this.addEvents();
        }
        
        private addEvents(){
            this._eventManager = EventManager.getInstance();
            this._viewManager = ViewManager.getInstance();
            // 事件监听
            this._eventManager.addListener(ScEvents.OPENVIEW, this.openView, this);
        }
        
        private openView(){
            this._viewManager.openView(ScView);
        }
    }
}