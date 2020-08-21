module loading {
    export class LoadingControl {
        private _eventManager: EventManager;
        private _viewManager: ViewManager;
        private static single: LoadingControl;
        public static getInstance(){
            if (!this.single) this.single = new LoadingControl();
            
            return this.single;
        }
        
        constructor(){
            this.addEvents();
        }
        
        private addEvents(){
            this._eventManager = EventManager.getInstance();
            this._viewManager = ViewManager.getInstance();
            // 事件监听
            this._eventManager.addListener(LoadingEvents.OPENVIEW, this.openView, this);
        }
        
        private openView(){
            this._viewManager.openView(LoadingView);
        }
    }
}