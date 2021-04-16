module es {
    interface Map<K, V> {
        clear(): void;
        containsKey(key): boolean;
        containsValue(value): boolean;
        get(key): V;
        isEmpty(): boolean;
        put(key, value): void;
        remove(key): V;
        size(): number;
        values(): V[];
    }

    function decode(key): string {
        switch (typeof key) {
            case "boolean":
                return "" + key;
            case "number":
                return "" + key;
            case "string":
                return "" + key;
            case "function":
                return getClassName(key);
            default:
                key.uuid = key.uuid ? key.uuid : UUID.randomUUID();
                return key.uuid;
        }
    }

    export class HashMap<K, V> implements Map<K, V> {
        private map_;
        private keys_;
    
        constructor() {
            this.clear();
        }
    
        clear(): void {
            this.map_ = {};
            this.keys_ = {};
        }
    
        values(): V[] {
            const result = [];
            const map = this.map_;
    
            for (const key in map) {
                result.push(map[key]);
            }
            return result;
        }
    
        contains(value): boolean {
            const map = this.map_;
    
            for (const key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        }
    
        containsKey(key): boolean {
            return decode(key) in this.map_;
        }
    
        containsValue(value): boolean {
            const map = this.map_;
    
            for (const key in map) {
                if (value === map[key]) {
                    return true;
                }
            }
            return false;
        }
    
        get(key: K): V {
            return this.map_[decode(key)];
        }
    
        isEmpty(): boolean {
            return Object.keys(this.map_).length === 0;
        }
    
        keys(): K[] {
            const keys = this.map_;
    
            const result = [];
            for (const key in keys) {
                result.push(keys[key]);
            }
            return result;
        }
    
        /**
         * if key is a string, use as is, else use key.id_ or key.name
         */
        put(key, value): void {
            const k = decode(key);
            this.map_[k] = value;
            this.keys_[k] = key;
        }
    
        remove(key): V {
            const map = this.map_;
            const k = decode(key);
            const value = map[k];
            delete map[k];
            delete this.keys_[k];
            return value;
        }
    
        size(): number {
            return Object.keys(this.map_).length;
        }
    }
}