/**
 * Pin direction - input or output
 * 引脚方向 - 输入或输出
 */
export type PinDirection = 'input' | 'output';

/**
 * Pin data type categories for visual programming
 * 可视化编程的引脚数据类型分类
 *
 * These types cover common use cases in:
 * 这些类型涵盖以下常见用例：
 * - Blueprint visual scripting (蓝图可视化脚本)
 * - Shader graph editors (着色器图编辑器)
 * - State machine editors (状态机编辑器)
 * - Animation graph editors (动画图编辑器)
 */
export type PinCategory =
    | 'exec'      // Execution flow pin (执行流引脚)
    | 'bool'      // Boolean value (布尔值)
    | 'int'       // Integer number (整数)
    | 'float'     // Floating point number (浮点数)
    | 'string'    // Text string (字符串)
    | 'vector2'   // 2D vector (二维向量)
    | 'vector3'   // 3D vector (三维向量)
    | 'vector4'   // 4D vector / Color (四维向量/颜色)
    | 'color'     // RGBA color (RGBA颜色)
    | 'object'    // Object reference (对象引用)
    | 'array'     // Array of values (数组)
    | 'map'       // Key-value map (键值映射)
    | 'struct'    // Custom struct (自定义结构体)
    | 'enum'      // Enumeration (枚举)
    | 'delegate'  // Event delegate (事件委托)
    | 'any';      // Wildcard type (通配符类型)

/**
 * Pin shape for rendering
 * 引脚渲染形状
 */
export type PinShape =
    | 'circle'    // Standard data pin (标准数据引脚)
    | 'triangle'  // Execution flow pin (执行流引脚)
    | 'diamond'   // Array/special pin (数组/特殊引脚)
    | 'square';   // Struct pin (结构体引脚)

/**
 * Gets the default shape for a pin category
 * 获取引脚类型的默认形状
 */
export function getDefaultPinShape(category: PinCategory): PinShape {
    switch (category) {
        case 'exec':
            return 'triangle';
        case 'array':
        case 'map':
            return 'diamond';
        case 'struct':
            return 'square';
        default:
            return 'circle';
    }
}

/**
 * Pin type value object with validation
 * 带验证的引脚类型值对象
 */
export class PinType {
    private readonly _category: PinCategory;
    private readonly _subType?: string;
    private readonly _isArray: boolean;

    constructor(category: PinCategory, subType?: string, isArray = false) {
        this._category = category;
        this._subType = subType;
        this._isArray = isArray;
    }

    get category(): PinCategory {
        return this._category;
    }

    /**
     * Subtype for complex types like struct or enum
     * 复杂类型（如结构体或枚举）的子类型
     */
    get subType(): string | undefined {
        return this._subType;
    }

    get isArray(): boolean {
        return this._isArray;
    }

    get shape(): PinShape {
        if (this._isArray) return 'diamond';
        return getDefaultPinShape(this._category);
    }

    /**
     * Checks if this type can connect to another type
     * 检查此类型是否可以连接到另一个类型
     */
    canConnectTo(other: PinType): boolean {
        // Any type can connect to anything
        // any 类型可以连接任何类型
        if (this._category === 'any' || other._category === 'any') {
            return true;
        }

        // Exec pins can only connect to exec pins
        // exec 引脚只能连接 exec 引脚
        if (this._category === 'exec' || other._category === 'exec') {
            return this._category === other._category;
        }

        // Same category can connect
        // 相同类型可以连接
        if (this._category === other._category) {
            // For struct/enum, subtype must match
            // 对于结构体/枚举，子类型必须匹配
            if (this._category === 'struct' || this._category === 'enum') {
                return this._subType === other._subType;
            }
            return true;
        }

        // Numeric type coercion (数值类型转换)
        const numericTypes: PinCategory[] = ['int', 'float'];
        if (numericTypes.includes(this._category) && numericTypes.includes(other._category)) {
            return true;
        }

        // Vector type coercion (向量类型转换)
        const vectorTypes: PinCategory[] = ['vector2', 'vector3', 'vector4', 'color'];
        if (vectorTypes.includes(this._category) && vectorTypes.includes(other._category)) {
            return true;
        }

        return false;
    }

    equals(other: PinType): boolean {
        return (
            this._category === other._category &&
            this._subType === other._subType &&
            this._isArray === other._isArray
        );
    }

    toJSON(): { category: PinCategory; subType?: string; isArray: boolean } {
        return {
            category: this._category,
            subType: this._subType,
            isArray: this._isArray
        };
    }

    static fromJSON(json: { category: PinCategory; subType?: string; isArray?: boolean }): PinType {
        return new PinType(json.category, json.subType, json.isArray ?? false);
    }

    // Common type constants (常用类型常量)
    static readonly EXEC = new PinType('exec');
    static readonly BOOL = new PinType('bool');
    static readonly INT = new PinType('int');
    static readonly FLOAT = new PinType('float');
    static readonly STRING = new PinType('string');
    static readonly VECTOR2 = new PinType('vector2');
    static readonly VECTOR3 = new PinType('vector3');
    static readonly VECTOR4 = new PinType('vector4');
    static readonly COLOR = new PinType('color');
    static readonly OBJECT = new PinType('object');
    static readonly ANY = new PinType('any');
}
