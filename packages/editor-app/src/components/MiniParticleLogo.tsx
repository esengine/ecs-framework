import { useEffect, useRef, useCallback } from 'react';

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    alpha: number;
    color: string;
}

interface MiniParticleLogoProps {
    /** Logo text to display / 要显示的Logo文字 */
    text?: string;
    /** Canvas width / 画布宽度 */
    width?: number;
    /** Canvas height / 画布高度 */
    height?: number;
    /** Font size / 字体大小 */
    fontSize?: number;
}

/**
 * Mini Particle Logo Component
 * 小型粒子Logo组件 - 用于About对话框等小空间显示
 */
export function MiniParticleLogo({
    text = 'ECS',
    width = 80,
    height = 80,
    fontSize = 28
}: MiniParticleLogoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const createParticles = useCallback((
        canvasWidth: number,
        canvasHeight: number,
        displayText: string,
        textSize: number
    ): Particle[] => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return [];

        tempCtx.font = `bold ${textSize}px "Segoe UI", Arial, sans-serif`;
        const textMetrics = tempCtx.measureText(displayText);
        const textWidth = textMetrics.width;
        const textHeight = textSize;

        tempCanvas.width = textWidth + 10;
        tempCanvas.height = textHeight + 10;
        tempCtx.font = `bold ${textSize}px "Segoe UI", Arial, sans-serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillText(displayText, tempCanvas.width / 2, tempCanvas.height / 2);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        const particles: Particle[] = [];
        const gap = 2; // 小间隔以增加粒子密度 / Small gap for higher particle density

        const offsetX = (canvasWidth - tempCanvas.width) / 2;
        const offsetY = (canvasHeight - tempCanvas.height) / 2;

        const colors = ['#569CD6', '#4EC9B0', '#9CDCFE', '#C586C0', '#DCDCAA'];

        for (let y = 0; y < tempCanvas.height; y += gap) {
            for (let x = 0; x < tempCanvas.width; x += gap) {
                const index = (y * tempCanvas.width + x) * 4;
                const alpha = pixels[index + 3] ?? 0;

                if (alpha > 128) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * Math.max(canvasWidth, canvasHeight) * 0.8;

                    particles.push({
                        x: canvasWidth / 2 + Math.cos(angle) * distance,
                        y: canvasHeight / 2 + Math.sin(angle) * distance,
                        targetX: offsetX + x,
                        targetY: offsetY + y,
                        size: Math.random() * 1 + 0.8,
                        alpha: Math.random() * 0.5 + 0.5,
                        color: colors[Math.floor(Math.random() * colors.length)] ?? '#569CD6'
                    });
                }
            }
        }

        return particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        particlesRef.current = createParticles(width, height, text, fontSize);

        const startTime = performance.now();
        const duration = 1500; // 动画持续时间 / Animation duration
        let isCancelled = false;

        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

        const animate = (currentTime: number) => {
            if (isCancelled) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);

            // 透明背景 / Transparent background
            ctx.clearRect(0, 0, width, height);

            for (const particle of particlesRef.current) {
                const moveProgress = Math.min(easedProgress * 1.2, 1);
                const currentX = particle.x + (particle.targetX - particle.x) * moveProgress;
                const currentY = particle.y + (particle.targetY - particle.y) * moveProgress;

                ctx.beginPath();
                ctx.arc(currentX, currentY, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.alpha;
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            // 动画完成后添加微光效果 / Add subtle glow after animation completes
            if (progress >= 1) {
                const glowAlpha = 0.3 + Math.sin(currentTime / 500) * 0.1;
                ctx.save();
                ctx.shadowColor = '#4EC9B0';
                ctx.shadowBlur = 8;
                ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
                ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, width / 2, height / 2);
                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            isCancelled = true;
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [width, height, text, fontSize, createParticles]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                borderRadius: '16px'
            }}
        />
    );
}
