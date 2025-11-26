import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/StartupLogo.css';

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    alpha: number;
    color: string;
}

interface StartupLogoProps {
    onAnimationComplete: () => void;
}

// 在组件外部创建粒子数据，确保只初始化一次
let particlesCache: Particle[] | null = null;
let cacheKey: string | null = null;

function createParticles(width: number, height: number, text: string, fontSize: number): Particle[] {
    const key = `${width}-${height}-${fontSize}`;
    if (particlesCache && cacheKey === key) {
        // 重置粒子位置
        for (const p of particlesCache) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.max(width, height);
            p.x = width / 2 + Math.cos(angle) * distance;
            p.y = height / 2 + Math.sin(angle) * distance;
        }
        return particlesCache;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];

    tempCtx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    const textMetrics = tempCtx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    tempCanvas.width = textWidth + 40;
    tempCanvas.height = textHeight + 40;
    tempCtx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    const particles: Particle[] = [];
    const gap = 4;

    const offsetX = (width - tempCanvas.width) / 2;
    const offsetY = (height - tempCanvas.height) / 2;

    const colors = ['#569CD6', '#4EC9B0', '#9CDCFE', '#C586C0', '#DCDCAA'];

    for (let y = 0; y < tempCanvas.height; y += gap) {
        for (let x = 0; x < tempCanvas.width; x += gap) {
            const index = (y * tempCanvas.width + x) * 4;
            const alpha = pixels[index + 3] ?? 0;

            if (alpha > 128) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * Math.max(width, height);

                particles.push({
                    x: width / 2 + Math.cos(angle) * distance,
                    y: height / 2 + Math.sin(angle) * distance,
                    targetX: offsetX + x,
                    targetY: offsetY + y,
                    size: Math.random() * 2 + 1.5,
                    alpha: Math.random() * 0.5 + 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)] ?? '#569CD6'
                });
            }
        }
    }

    particlesCache = particles;
    cacheKey = key;
    return particles;
}

export function StartupLogo({ onAnimationComplete }: StartupLogoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fadeOut, setFadeOut] = useState(false);

    const onCompleteRef = useRef(onAnimationComplete);
    onCompleteRef.current = onAnimationComplete;

    const startAnimation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return () => {};

        const ctx = canvas.getContext('2d');
        if (!ctx) return () => {};

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const text = 'ESEngine';
        const fontSize = Math.min(width / 6, 120);
        const particles = createParticles(width, height, text, fontSize);

        const startTime = performance.now();
        const duration = 2000;
        const glowDuration = 500; // 发光过渡时长
        const holdDuration = 800;
        let animationId: number | null = null;
        let glowStartTime: number | null = null;
        let isCancelled = false;
        let timeoutId1: ReturnType<typeof setTimeout> | null = null;
        let timeoutId2: ReturnType<typeof setTimeout> | null = null;

        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = (currentTime: number) => {
            if (isCancelled) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);

            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, width, height);

            // 计算发光进度
            let glowProgress = 0;
            if (progress >= 1) {
                if (glowStartTime === null) {
                    glowStartTime = currentTime;
                }
                glowProgress = Math.min((currentTime - glowStartTime) / glowDuration, 1);
                glowProgress = easeOutCubic(glowProgress);
            }

            for (const particle of particles) {
                // 使用线性插值移动
                const moveProgress = Math.min(easedProgress * 1.2, 1);
                const currentX = particle.x + (particle.targetX - particle.x) * moveProgress;
                const currentY = particle.y + (particle.targetY - particle.y) * moveProgress;

                ctx.beginPath();
                ctx.arc(currentX, currentY, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.alpha * (1 - glowProgress * 0.3); // 粒子逐渐变淡
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            // 发光文字渐变显示
            if (glowProgress > 0) {
                ctx.save();
                ctx.shadowColor = '#4EC9B0';
                ctx.shadowBlur = 20 * glowProgress;
                ctx.fillStyle = `rgba(255, 255, 255, ${glowProgress})`;
                ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, width / 2, height / 2);
                ctx.restore();
            }

            // 发光完成后开始淡出
            if (glowProgress >= 1) {
                if (!timeoutId1) {
                    timeoutId1 = setTimeout(() => {
                        if (isCancelled) return;
                        setFadeOut(true);
                        timeoutId2 = setTimeout(() => {
                            if (isCancelled) return;
                            onCompleteRef.current();
                        }, 500);
                    }, holdDuration);
                }
            }

            if (!isCancelled && (!timeoutId1 || glowProgress < 1)) {
                animationId = requestAnimationFrame(animate);
            }
        };

        animationId = requestAnimationFrame(animate);

        // 返回 cleanup 函数
        return () => {
            isCancelled = true;
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
            }
            if (timeoutId1 !== null) {
                clearTimeout(timeoutId1);
            }
            if (timeoutId2 !== null) {
                clearTimeout(timeoutId2);
            }
        };
    }, []);

    useEffect(() => {
        const cleanup = startAnimation();
        return cleanup;
    }, [startAnimation]);

    return (
        <div className={`startup-logo-container ${fadeOut ? 'fade-out' : ''}`}>
            <canvas ref={canvasRef} className="startup-logo-canvas" />
        </div>
    );
}
