module es {
    export class TmxDocument {
        public tmxDirectory: string;
        constructor(){
            this.tmxDirectory = "";
        }
    }

    export interface ITmxElement {
        name: string;
    }

    // export class TmxList<T extends ITmxElement> extends Map<string, T>{
    //     public _nameCount: Map<string, number> = new Map<string, number>();
    //
    //     public add(t: T){
    //         let tName = t.name;
    //
    //         // 通过附加数字重命名重复的条目
    //         if (this.has(tName))
    //             this._nameCount.set(tName, this._nameCount.get(tName) + 1);
    //         else
    //             this._nameCount.set(tName, 0);
    //     }
    //
    //     protected getKeyForItem(item: T): string {
    //         let name = item.name;
    //         let count = this._nameCount.get(name);
    //
    //         let dupes = 0;
    //
    //         // 对于重复的键，附加一个计数器。对于病理情况，插入下划线以确保唯一性
    //         while (this.has(name)){
    //             name = name + Enumerable.repeat("_", dupes).toString() + count.toString();
    //             dupes ++;
    //         }
    //
    //         return name;
    //     }
    // }

    export class TmxImage {
        public bitmap: egret.Bitmap;
        public get texture(): egret.Texture{
            return this.bitmap.texture;
        }
        public source: string;
        public format: string;
        public data: any;
        public trans: number;
        public width: number;
        public height: number;

        public dispose(){
            if (this.bitmap){
                this.texture.dispose();
                this.bitmap = null;
            }
        }
    }
}