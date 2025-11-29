import React, { useCallback, useMemo } from 'react';
import { Pin } from '../../domain/models/Pin';
import { PinCategory, PinShape } from '../../domain/value-objects/PinType';

/**
 * Pin color mapping by category
 * 引脚类型颜色映射
 */
const PIN_COLORS: Record<PinCategory, string> = {
    exec: 'var(--ne-pin-exec)',
    bool: 'var(--ne-pin-bool)',
    int: 'var(--ne-pin-int)',
    float: 'var(--ne-pin-float)',
    string: 'var(--ne-pin-string)',
    vector2: 'var(--ne-pin-vector2)',
    vector3: 'var(--ne-pin-vector3)',
    vector4: 'var(--ne-pin-vector4)',
    color: 'var(--ne-pin-color)',
    object: 'var(--ne-pin-object)',
    array: 'var(--ne-pin-array)',
    map: 'var(--ne-pin-map)',
    struct: 'var(--ne-pin-struct)',
    enum: 'var(--ne-pin-enum)',
    delegate: 'var(--ne-pin-delegate)',
    any: 'var(--ne-pin-any)'
};

export interface NodePinProps {
    /** Pin data (引脚数据) */
    pin: Pin;

    /** Whether the pin is connected (引脚是否已连接) */
    isConnected: boolean;

    /** Whether this pin is a valid drop target during drag (拖拽时此引脚是否是有效目标) */
    isCompatible?: boolean;

    /** Whether currently dragging from this pin (是否正在从此引脚拖拽) */
    isDraggingFrom?: boolean;

    /** Whether this pin is highlighted as drop target (此引脚是否高亮为放置目标) */
    isDropTarget?: boolean;

    /** Mouse down handler for starting connection (开始连接的鼠标按下处理) */
    onMouseDown?: (e: React.MouseEvent, pin: Pin) => void;

    /** Mouse up handler for completing connection (完成连接的鼠标释放处理) */
    onMouseUp?: (e: React.MouseEvent, pin: Pin) => void;

    /** Mouse enter handler (鼠标进入处理) */
    onMouseEnter?: (pin: Pin) => void;

    /** Mouse leave handler (鼠标离开处理) */
    onMouseLeave?: (pin: Pin) => void;
}

/**
 * Pin shape SVG component
 * 引脚形状 SVG 组件
 */
const PinShapeSVG: React.FC<{
    shape: PinShape;
    isConnected: boolean;
    color: string;
    isInput: boolean;
}> = ({ shape, isConnected, color, isInput }) => {
    const size = 12;
    const half = size / 2;
    const svgStyle: React.CSSProperties = { pointerEvents: 'none', display: 'block' };
    const fillColor = isConnected ? color : 'transparent';
    const strokeWidth = 2;

    switch (shape) {
        case 'triangle':
            // Execution pin - arrow shape
            const triPoints = isInput
                ? `1,1 ${size - 1},${half} 1,${size - 1}`
                : `1,1 ${size - 1},${half} 1,${size - 1}`;
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgStyle}>
                    <polygon
                        points={triPoints}
                        fill={fillColor}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                    />
                </svg>
            );

        case 'diamond':
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgStyle}>
                    <rect
                        x={half - 3}
                        y={half - 3}
                        width={6}
                        height={6}
                        fill={fillColor}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        transform={`rotate(45 ${half} ${half})`}
                    />
                </svg>
            );

        case 'square':
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgStyle}>
                    <rect
                        x={2}
                        y={2}
                        width={size - 4}
                        height={size - 4}
                        rx={1}
                        fill={fillColor}
                        stroke={color}
                        strokeWidth={strokeWidth}
                    />
                </svg>
            );

        case 'circle':
        default:
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={svgStyle}>
                    <circle
                        cx={half}
                        cy={half}
                        r={half - 2}
                        fill={fillColor}
                        stroke={color}
                        strokeWidth={strokeWidth}
                    />
                </svg>
            );
    }
};

/**
 * NodePin - Pin connection point component
 * NodePin - 引脚连接点组件
 */
export const NodePin: React.FC<NodePinProps> = ({
    pin,
    isConnected,
    isCompatible,
    isDraggingFrom,
    isDropTarget,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseLeave
}) => {
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onMouseDown?.(e, pin);
    }, [onMouseDown, pin]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onMouseUp?.(e, pin);
    }, [onMouseUp, pin]);

    const handleMouseEnter = useCallback(() => {
        onMouseEnter?.(pin);
    }, [onMouseEnter, pin]);

    const handleMouseLeave = useCallback(() => {
        onMouseLeave?.(pin);
    }, [onMouseLeave, pin]);

    const color = pin.color || PIN_COLORS[pin.category];
    const shape = pin.type.shape;

    const classNames = useMemo(() => {
        const classes = ['ne-pin', pin.category];
        if (isConnected) classes.push('connected');
        if (isCompatible) classes.push('compatible');
        if (isDraggingFrom) classes.push('dragging-from');
        if (isDropTarget) classes.push('drop-target');
        if (pin.isInput) classes.push('input');
        if (pin.isOutput) classes.push('output');
        return classes.join(' ');
    }, [pin.category, pin.isInput, pin.isOutput, isConnected, isCompatible, isDraggingFrom, isDropTarget]);

    return (
        <div
            className={classNames}
            data-pin-id={pin.id}
            data-pin-direction={pin.direction}
            data-pin-category={pin.category}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ color }}
        >
            <PinShapeSVG
                shape={shape}
                isConnected={isConnected}
                color={color}
                isInput={pin.isInput}
            />
        </div>
    );
};

/**
 * PinRow - A row containing a pin and its label
 * PinRow - 包含引脚及其标签的行
 */
export interface PinRowProps extends NodePinProps {
    /** Whether to show the label (是否显示标签) */
    showLabel?: boolean;

    /** Whether to show default value input (是否显示默认值输入) */
    showValue?: boolean;

    /** Current value for the pin (引脚当前值) */
    value?: unknown;

    /** Value change handler (值变更处理) */
    onValueChange?: (pinId: string, value: unknown) => void;
}

export const PinRow: React.FC<PinRowProps> = ({
    pin,
    showLabel = true,
    showValue = false,
    value,
    onValueChange,
    ...pinProps
}) => {
    const isInput = pin.isInput;
    const showValueInput = showValue && isInput && !pinProps.isConnected;

    const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = pin.category === 'bool'
            ? e.target.checked
            : pin.category === 'int'
                ? parseInt(e.target.value, 10)
                : pin.category === 'float'
                    ? parseFloat(e.target.value)
                    : e.target.value;
        onValueChange?.(pin.id, newValue);
    }, [pin.id, pin.category, onValueChange]);

    const renderValueInput = () => {
        if (!showValueInput) return null;

        const displayValue = value ?? pin.defaultValue;

        switch (pin.category) {
            case 'bool':
                return (
                    <input
                        type="checkbox"
                        className="ne-pin-value-checkbox"
                        checked={Boolean(displayValue)}
                        onChange={handleValueChange}
                    />
                );
            case 'color':
                return (
                    <input
                        type="color"
                        className="ne-pin-value-color"
                        value={String(displayValue || '#ffffff')}
                        onChange={handleValueChange}
                    />
                );
            case 'int':
            case 'float':
                return (
                    <input
                        type="number"
                        className="ne-pin-value-input"
                        value={displayValue as number ?? 0}
                        step={pin.category === 'float' ? 0.1 : 1}
                        onChange={handleValueChange}
                    />
                );
            case 'string':
                return (
                    <input
                        type="text"
                        className="ne-pin-value-input"
                        value={String(displayValue ?? '')}
                        onChange={handleValueChange}
                        placeholder="..."
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`ne-pin-row ${isInput ? 'input' : 'output'}`}>
            <NodePin pin={pin} {...pinProps} />
            {showLabel && pin.displayName && (
                <span className="ne-pin-label">{pin.displayName}</span>
            )}
            {renderValueInput()}
        </div>
    );
};

export default NodePin;
