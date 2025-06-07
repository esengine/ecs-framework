import { Edge } from '../../Math/Edge';

/**
 * 边缘扩展工具类
 * 提供边缘相关的实用方法
 */
export class EdgeExt {
    /**
     * 获取相对的边缘
     * @param self 当前边缘
     * @returns 相对的边缘
     */
    public static oppositeEdge(self: Edge): Edge {
        switch (self) {
            case Edge.bottom:
                return Edge.top;
            case Edge.top:
                return Edge.bottom;
            case Edge.left:
                return Edge.right;
            case Edge.right:
                return Edge.left;
        }
    }

    /**
     * 检查边缘是否为水平方向（左或右）
     * @param self 边缘
     * @returns 如果是水平方向返回true，否则返回false
     */
    public static isHorizontal(self: Edge): boolean {
        return self == Edge.right || self == Edge.left;
    }

    /**
     * 检查边缘是否为垂直方向（上或下）
     * @param self 边缘
     * @returns 如果是垂直方向返回true，否则返回false
     */
    public static isVertical(self: Edge): boolean {
        return self == Edge.top || self == Edge.bottom;
    }
}