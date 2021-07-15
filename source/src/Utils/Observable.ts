module es {
    export interface IListener {
        caller: object;
        callback: Function;
    }

    export interface IObservable {
        addListener(caller: object, callback: Function);
        removeListener(caller: object, callback: Function);
        clearListener();
        clearListenerWithCaller(caller: object);
    }

    export class Observable implements IObservable {
        public constructor() {
            this._listeners = [];
        }

        public addListener(caller: object, callback: Function) {
            if (
                this._listeners.findIndex(
                    listener =>
                        listener.callback === callback && listener.caller === caller
                ) === -1
            ) {
                this._listeners.push({ caller, callback });
            }
        }

        public removeListener(caller: object, callback: Function) {
            const index = this._listeners.findIndex(
                listener => listener.callback === callback && listener.caller === caller
            );
            if (index >= 0) {
                this._listeners.splice(index, 1);
            }
        }

        public clearListener() {
            this._listeners = [];
        }

        public clearListenerWithCaller(caller: object) {
            for (let i = this._listeners.length - 1; i >= 0; i--) {
                const listener = this._listeners[i];
                if (listener.caller === caller) {
                    this._listeners.splice(i, 1);
                }
            }
        }

        public notify(...args) {
            for (let i = this._listeners.length - 1; i >= 0; i--) {
                const listener = this._listeners[i];
                if (listener.caller) {
                    listener.callback.call(listener.caller, ...args);
                } else {
                    listener.callback(...args);
                }
            }
        }

        private _listeners: IListener[];
    }

    export class ObservableT<T> extends Observable {
        public addListener(caller: object, callback: (arg: T) => void) {
            super.addListener(caller, callback);
        }

        public removeListener(caller: object, callback: (arg: T) => void) {
            super.removeListener(caller, callback);
        }

        public notify(arg: T) {
            super.notify(arg);
        }
    }

    export class ObservableTT<T, R> extends Observable {
        public addListener(caller: object, callback: (arg1: T, arg2: R) => void) {
            super.addListener(caller, callback);
        }

        public removeListener(caller: object, callback: (arg: T, arg2: R) => void) {
            super.removeListener(caller, callback);
        }

        public notify(arg1: T, arg2: R) {
            super.notify(arg1, arg2);
        }
    }

    export class Command implements IObservable {
        public constructor(caller: object, action: Function) {
            this.bindAction(caller, action);
            this._onExec = new Observable();
        }

        public bindAction(caller: object, action: Function) {
            this._caller = caller;
            this._action = action;
        }

        public dispatch(...args: any[]) {
            if (this._action) {
                if (this._caller) {
                    this._action.call(this._caller, ...args);
                } else {
                    this._action(...args);
                }
                this._onExec.notify();
            } else {
                console.warn('command not bind with an action');
            }
        }

        public addListener(caller: object, callback: Function) {
            this._onExec.addListener(caller, callback);
        }

        public removeListener(caller: object, callback: Function) {
            this._onExec.removeListener(caller, callback);
        }

        public clearListener() {
            this._onExec.clearListener();
        }

        public clearListenerWithCaller(caller: object) {
            this._onExec.clearListenerWithCaller(caller);
        }

        private _onExec: Observable;
        private _caller: object;
        private _action: Function;
    }

    export class ValueChangeCommand<T> implements IObservable {
        public constructor(value: T) {
            this._onValueChange = new Observable();
            this._value = value;
        }

        public get onValueChange() {
            return this._onValueChange;
        }

        public get value() {
            return this._value;
        }

        public set value(newValue: T) {
            this._value = newValue;
        }

        public dispatch(value: T) {
            if (value !== this._value) {
                const oldValue = this._value;
                this._value = value;
                this._onValueChange.notify(this._value, oldValue);
            }
        }

        public addListener(caller: object, callback: Function) {
            this._onValueChange.addListener(caller, callback);
        }

        public removeListener(caller: object, callback: Function) {
            this._onValueChange.removeListener(caller, callback);
        }

        public clearListener() {
            this._onValueChange.clearListener();
        }

        public clearListenerWithCaller(caller: object) {
            this._onValueChange.clearListenerWithCaller(caller);
        }

        private _onValueChange: Observable;
        private _value: T;
    }
}