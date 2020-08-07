const THREAD_ID = `${Math.floor(Math.random() * 1000)}-${Date.now()}`;

const nextTick = fn => {
    setTimeout(fn, 0);
};

/**
 * 利用共享区域实现快速锁
 */
class LockUtils {
    private _keyX: string;
    private _keyY: string;
    private setItem;
    private getItem;
    private removeItem;

    constructor(key) {
        this._keyX = `mutex_key_${key}_X`;
        this._keyY = `mutex_key_${key}_Y`;
        this.setItem = egret.localStorage.setItem.bind(localStorage);
        this.getItem = egret.localStorage.getItem.bind(localStorage);
        this.removeItem = egret.localStorage.removeItem.bind(localStorage);
    }

    public lock() {
        return new Promise((resolve, reject) => {
            const fn = () => {
                this.setItem(this._keyX, THREAD_ID);
                if (!this.getItem(this._keyY) === null) {
                    // restart
                    nextTick(fn);
                }
                this.setItem(this._keyY, THREAD_ID);
                if (this.getItem(this._keyX) !== THREAD_ID) {
                    // delay
                    setTimeout(() => {
                        if (this.getItem(this._keyY) !== THREAD_ID) {
                            // restart
                            nextTick(fn);
                            return;
                        }
                        // critical section
                        resolve();
                        this.removeItem(this._keyY);
                    }, 10);
                } else {
                    resolve();
                    this.removeItem(this._keyY);
                }
            };

            fn();
        });
    }
}