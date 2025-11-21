import { createLogger } from '../../Utils/Logger';

/**
 * SoA 序列化器
 * 负责复杂类型的序列化/反序列化和深拷贝
 */
export class SoASerializer {
    private static readonly _logger = createLogger('SoASerializer');

    /**
     * 序列化值为 JSON 字符串
     */
    public static serialize(
        value: unknown,
        fieldName: string,
        options: {
            isMap?: boolean;
            isSet?: boolean;
            isArray?: boolean;
        } = {}
    ): string {
        try {
            if (options.isMap && value instanceof Map) {
                return JSON.stringify(Array.from(value.entries()));
            }
            if (options.isSet && value instanceof Set) {
                return JSON.stringify(Array.from(value));
            }
            if (options.isArray && Array.isArray(value)) {
                return JSON.stringify(value);
            }
            return JSON.stringify(value);
        } catch (error) {
            this._logger.warn(`SoA序列化字段 ${fieldName} 失败:`, error);
            return '{}';
        }
    }

    /**
     * 反序列化 JSON 字符串为值
     */
    public static deserialize(
        serialized: string,
        fieldName: string,
        options: {
            isMap?: boolean;
            isSet?: boolean;
            isArray?: boolean;
        } = {}
    ): unknown {
        try {
            const parsed = JSON.parse(serialized);

            if (options.isMap) {
                return new Map(parsed);
            }
            if (options.isSet) {
                return new Set(parsed);
            }
            return parsed;
        } catch (error) {
            this._logger.warn(`SoA反序列化字段 ${fieldName} 失败:`, error);
            return null;
        }
    }

    /**
     * 深拷贝对象
     */
    public static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as T;
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.deepClone(item)) as T;
        }

        if (obj instanceof Map) {
            const cloned = new Map();
            for (const [key, value] of obj.entries()) {
                cloned.set(key, this.deepClone(value));
            }
            return cloned as T;
        }

        if (obj instanceof Set) {
            const cloned = new Set();
            for (const value of obj.values()) {
                cloned.add(this.deepClone(value));
            }
            return cloned as T;
        }

        // 普通对象
        const cloned = {} as Record<string, unknown>;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone((obj as Record<string, unknown>)[key]);
            }
        }
        return cloned as T;
    }
}
