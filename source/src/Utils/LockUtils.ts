const THREAD_ID = `${Math.floor(Math.random() * 1000)}-${Date.now()}`;
const setItem = egret.localStorage.setItem.bind(localStorage);
const getItem = egret.localStorage.getItem.bind(localStorage);
const removeItem = egret.localStorage.removeItem.bind(localStorage);

const nextTick = fn => {
    setTimeout(fn, 0);
};

/**
 * 利用共享区域实现快速锁
 */
class LockUtils {
    private _keyX: string;
    private _keyY: string;
    constructor(key){
        this._keyX = `mutex_key_${key}_X`;
        this._keyY = `mutex_key_${key}_Y`;
    }

    public lock(){
        return new Promise((resolve, reject) => {
            const fn = () => {
                setItem(this._keyX, THREAD_ID);
                if (!getItem(this._keyY) === null){
                    // restart
                    nextTick(fn);
                }
                setItem(this._keyY, THREAD_ID);
                if (getItem(this._keyX) !== THREAD_ID){
                    // delay
                    setTimeout(()=>{
                        if (getItem(this._keyY) !== THREAD_ID){
                            // restart
                            nextTick(fn);
                            return;
                        }
                        // critical section
                        resolve();
                        removeItem(this._keyY);
                    }, 10);
                } else {
                    resolve();
                    removeItem(this._keyY);
                }
            };

            fn();
        });
    }
}