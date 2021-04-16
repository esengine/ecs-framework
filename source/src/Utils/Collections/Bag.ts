module es {
    export class Bag<E> implements ImmutableBag<E> {
        public size_ = 0;
        public length = 0;
        private array: Array<E> = [];

        constructor(capacity = 64) {
            this.length = capacity;
        }

        removeAt(index: number): E {
            const e: E = this.array[index];
            this.array[index] = this.array[--this.size_];
            this.array[this.size_] = null;
            return e;
        }

        remove(e: E): boolean {
            let i: number;
            let e2: E;
            const size = this.size_;
    
            for (i = 0; i < size; i++) {
                e2 = this.array[i];
    
                if (e == e2) {
                    this.array[i] = this.array[--this.size_];
                    this.array[this.size_] = null;
                    return true;
                }
            }
    
            return false;
        }

        removeLast(): E {
            if (this.size_ > 0) {
                const e: E = this.array[--this.size_];
                this.array[this.size_] = null;
                return e;
            }
    
            return null;
        }

        contains(e: E): boolean {
            let i: number;
            let size: number;
    
            for (i = 0, size = this.size_; size > i; i++) {
                if (e === this.array[i]) {
                    return true;
                }
            }
            return false;
        }

        removeAll(bag: ImmutableBag<E>): boolean {
            let modified = false;
            let i: number;
            let j: number;
            let l: number;
            let e1: E;
            let e2: E;
    
            for (i = 0, l = bag.size(); i < l; i++) {
                e1 = bag[i];
    
                for (j = 0; j < this.size_; j++) {
                    e2 = this.array[j];
    
                    if (e1 === e2) {
                        this.removeAt(j);
                        j--;
                        modified = true;
                        break;
                    }
                }
            }
    
            return modified;
        }

        get(index: number): E {
            if (index >= this.length) {
                throw new Error("ArrayIndexOutOfBoundsException");
            }
            return this.array[index];
        }

        safeGet(index: number): E {
            if (index >= this.length) {
                this.grow((index * 7) / 4 + 1);
            }
            return this.array[index];
        }

        size(): number {
            return this.size_;
        }

        getCapacity(): number {
            return this.length;
        }

        isIndexWithinBounds(index: number): boolean {
            return index < this.getCapacity();
        }

        isEmpty(): boolean {
            return this.size_ == 0;
        }

        add(e: E): void {
            if (this.size_ === this.length) {
                this.grow();
            }
    
            this.array[this.size_++] = e;
        }

        set(index: number, e: E): void {
            if (index >= this.length) {
                this.grow(index * 2);
            }
            this.size_ = index + 1;
            this.array[index] = e;
        }
    
        grow(newCapacity: number = ~~((this.length * 3) / 2) + 1): void {
            this.length = ~~newCapacity;
        }
    
        ensureCapacity(index: number): void {
            if (index >= this.length) {
                this.grow(index * 2);
            }
        }

        clear(): void {
            let i: number;
            let size: number;
            for (i = 0, size = this.size_; i < size; i++) {
                this.array[i] = null;
            }
    
            this.size_ = 0;
        }

        addAll(items: ImmutableBag<E>): void {
            let i: number;
    
            for (i = 0; items.size() > i; i++) {
                this.add(items.get(i));
            }
        }
    }
}