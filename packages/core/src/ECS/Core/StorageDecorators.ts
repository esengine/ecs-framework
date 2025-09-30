/**
 * 统一的存储装饰器导出文件
 *
 * 用户可以从这里导入所有的SoA存储装饰器，而不需要知道内部实现细节
 *
 * @example
 * ```typescript
 * import { EnableSoA, Float32, Int16, Uint8 } from './ECS/Core/StorageDecorators';
 *
 * @EnableSoA
 * class TransformComponent extends Component {
 *     @Float32 x: number = 0;
 *     @Float32 y: number = 0;
 *     @Int16 layer: number = 0;
 *     @Uint8 visible: boolean = true;
 * }
 * ```
 */

// 从SoAStorage导入所有装饰器和类型
export {
    // 启用装饰器
    EnableSoA,

    // 数值类型装饰器
    HighPrecision,
    Float64,
    Float32,
    Int32,
    Uint32,
    Int16,
    Uint16,
    Int8,
    Uint8,
    Uint8Clamped,

    // 自动类型推断
    AutoTyped,
    TypeInference,

    // 序列化装饰器
    SerializeMap,
    SerializeSet,
    SerializeArray,
    DeepCopy,

    // 类型定义
    SupportedTypedArray
} from './SoAStorage';