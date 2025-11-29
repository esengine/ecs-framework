/**
 * Blueprint Pin Types
 * 蓝图引脚类型
 */

/**
 * Pin data type for blueprint nodes
 * 蓝图节点的引脚数据类型
 */
export type BlueprintPinType =
    | 'exec'      // Execution flow (执行流)
    | 'bool'      // Boolean (布尔)
    | 'int'       // Integer (整数)
    | 'float'     // Float (浮点数)
    | 'string'    // String (字符串)
    | 'vector2'   // 2D Vector (二维向量)
    | 'vector3'   // 3D Vector (三维向量)
    | 'color'     // RGBA Color (颜色)
    | 'entity'    // Entity reference (实体引用)
    | 'component' // Component reference (组件引用)
    | 'object'    // Generic object (通用对象)
    | 'array'     // Array (数组)
    | 'any';      // Wildcard (通配符)

/**
 * Pin direction
 * 引脚方向
 */
export type BlueprintPinDirection = 'input' | 'output';

/**
 * Pin definition for node templates
 * 节点模板的引脚定义
 *
 * Note: direction is determined by whether the pin is in inputs[] or outputs[] array
 * 注意：方向由引脚在 inputs[] 还是 outputs[] 数组中决定
 */
export interface BlueprintPinDefinition {
    /** Unique name within node (节点内唯一名称) */
    name: string;

    /** Pin data type (引脚数据类型) */
    type: BlueprintPinType;

    /** Display name shown in the editor (编辑器中显示的名称) */
    displayName?: string;

    /** Default value when not connected (未连接时的默认值) */
    defaultValue?: unknown;

    /** Allow multiple connections (允许多个连接) */
    allowMultiple?: boolean;

    /** Array element type if type is 'array' (数组元素类型) */
    arrayType?: BlueprintPinType;

    /** Whether this pin is optional (是否可选) */
    optional?: boolean;

    /** Tooltip description (提示描述) */
    tooltip?: string;
}

/**
 * Runtime pin with direction - used when processing pins
 * 带方向的运行时引脚 - 处理引脚时使用
 */
export interface BlueprintRuntimePin extends BlueprintPinDefinition {
    /** Pin direction (引脚方向) */
    direction: BlueprintPinDirection;
}

/**
 * Pin instance in a node
 * 节点中的引脚实例
 */
export interface BlueprintPin {
    id: string;
    nodeId: string;
    definition: BlueprintPinDefinition;
    value?: unknown;
}

/**
 * Gets the color for a pin type
 * 获取引脚类型的颜色
 */
export function getPinTypeColor(type: BlueprintPinType): string {
    const colors: Record<BlueprintPinType, string> = {
        exec: '#ffffff',
        bool: '#cc0000',
        int: '#00d4aa',
        float: '#88cc00',
        string: '#ff88cc',
        vector2: '#d4aa00',
        vector3: '#ffcc00',
        color: '#ff8844',
        entity: '#0088ff',
        component: '#44aaff',
        object: '#4444aa',
        array: '#8844ff',
        any: '#888888'
    };
    return colors[type] ?? colors.any;
}

/**
 * Checks if two pin types are compatible for connection
 * 检查两个引脚类型是否兼容连接
 */
export function arePinTypesCompatible(from: BlueprintPinType, to: BlueprintPinType): boolean {
    // Same type always compatible
    // 相同类型始终兼容
    if (from === to) return true;

    // Any type is compatible with everything
    // any 类型与所有类型兼容
    if (from === 'any' || to === 'any') return true;

    // Exec can only connect to exec
    // exec 只能连接 exec
    if (from === 'exec' || to === 'exec') return false;

    // Numeric coercion
    // 数值类型转换
    const numericTypes: BlueprintPinType[] = ['int', 'float'];
    if (numericTypes.includes(from) && numericTypes.includes(to)) return true;

    // Vector coercion
    // 向量类型转换
    const vectorTypes: BlueprintPinType[] = ['vector2', 'vector3', 'color'];
    if (vectorTypes.includes(from) && vectorTypes.includes(to)) return true;

    return false;
}
