import { useState, useRef } from 'react';

export interface ImagePreviewProps {
    src: string;
    alt: string;
}

export function ImagePreview({ src, alt }: ImagePreviewProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 10));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    if (imageError) {
        return (
            <div
                style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#f87171',
                    fontSize: '12px'
                }}
            >
                图片加载失败
            </div>
        );
    }

    return (
        <div>
            <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    minHeight: '200px',
                    maxHeight: '400px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundImage: `
                        linear-gradient(45deg, #404040 25%, transparent 25%),
                        linear-gradient(-45deg, #404040 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #404040 75%),
                        linear-gradient(-45deg, transparent 75%, #404040 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#2a2a2a'
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        userSelect: 'none'
                    }}
                    onError={() => setImageError(true)}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '6px',
                    fontSize: '10px',
                    color: '#888'
                }}
            >
                <span>缩放: {(scale * 100).toFixed(0)}%</span>
                <button
                    onClick={handleReset}
                    style={{
                        background: '#3a3a3a',
                        border: 'none',
                        color: '#ccc',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}
                >
                    重置
                </button>
            </div>
        </div>
    );
}
