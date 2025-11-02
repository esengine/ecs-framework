import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity, Box, Square } from 'lucide-react';
import '../styles/Viewport.css';

interface ViewportProps {
  locale?: string;
}

export function Viewport({ locale = 'en' }: ViewportProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [showGizmos, setShowGizmos] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [is3D, setIs3D] = useState(true);
    const animationFrameRef = useRef<number>();
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const gridProgramRef = useRef<WebGLProgram | null>(null);
    const gridBufferRef = useRef<WebGLBuffer | null>(null);
    const dynamicGridBufferRef = useRef<WebGLBuffer | null>(null);
    const axisBufferRef = useRef<WebGLBuffer | null>(null);
    const [cameraRotation, setCameraRotation] = useState({ yaw: -Math.PI / 4, pitch: Math.PI / 6 });
    const [cameraDistance, setCameraDistance] = useState(20);
    const [camera2DOffset, setCamera2DOffset] = useState({ x: 0, y: 0 });
    const [camera2DZoom, setCamera2DZoom] = useState(20);
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [fps, setFps] = useState(0);
    const [drawCalls, setDrawCalls] = useState(0);
    const fpsFrameCountRef = useRef(0);
    const fpsLastTimeRef = useRef(performance.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set initial cursor style
        canvas.style.cursor = 'grab';

        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        glRef.current = gl;

        const resizeCanvas = () => {
            if (!canvas || !containerRef.current) return;
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        initWebGL(gl);

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) {
                isDraggingRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - lastMousePosRef.current.x;
            const deltaY = e.clientY - lastMousePosRef.current.y;

            if (is3D) {
                setCameraRotation((prev) => ({
                    yaw: prev.yaw - deltaX * 0.005,
                    pitch: Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, prev.pitch + deltaY * 0.005))
                }));
            } else {
                setCamera2DOffset((prev) => ({
                    x: prev.x - deltaX * 0.05,
                    y: prev.y - deltaY * 0.05
                }));
            }

            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                canvas.style.cursor = 'grab';
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (is3D) {
                setCameraDistance((prev) => Math.max(5, Math.min(50, prev + e.deltaY * 0.01)));
            } else {
                setCamera2DZoom((prev) => Math.max(5, Math.min(100, prev + e.deltaY * 0.01)));
            }
        };

        // Register mousedown and wheel on canvas
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // Register mousemove and mouseup globally to handle dragging outside canvas
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('wheel', handleWheel);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [is3D]);

    useEffect(() => {
        startRenderLoop();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, showGrid, cameraRotation, cameraDistance, camera2DOffset, camera2DZoom, is3D]);

    const initWebGL = (gl: WebGLRenderingContext) => {
        gl.clearColor(0.1, 0.1, 0.12, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        initGridProgram(gl);
        renderFrame(gl, 0);
    };

    const initGridProgram = (gl: WebGLRenderingContext) => {
        const vertexShaderSource = `
      attribute vec3 position;
      uniform mat4 projection;
      uniform mat4 view;
      void main() {
        gl_Position = projection * view * vec4(position, 1.0);
      }
    `;

        const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
            return;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
            return;
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            return;
        }

        gridProgramRef.current = program;

        const gridSize = 100;
        const gridStep = 1;
        const vertices: number[] = [];

        for (let i = -gridSize; i <= gridSize; i += gridStep) {
            vertices.push(i, 0, -gridSize, i, 0, gridSize);
            vertices.push(-gridSize, 0, i, gridSize, 0, i);
        }

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gridBufferRef.current = buffer;

        const axisLength = 5;
        const axisVertices = [
            0, 0, 0, axisLength, 0, 0,
            0, 0, 0, 0, axisLength, 0,
            0, 0, 0, 0, 0, axisLength
        ];

        const axisBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisVertices), gl.STATIC_DRAW);

        axisBufferRef.current = axisBuffer;
    };

    const startRenderLoop = () => {
        const startTime = performance.now();

        const render = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000;

            if (glRef.current) {
                renderFrame(glRef.current, elapsed);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
    };

    const renderFrame = (gl: WebGLRenderingContext, _time: number) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let currentDrawCalls = 0;

        if (showGrid && gridProgramRef.current && gridBufferRef.current) {
            drawGrid(gl);
            currentDrawCalls += is3D ? 1 : 2;
        }

        gl.disable(gl.DEPTH_TEST);
        if (gridProgramRef.current && axisBufferRef.current) {
            drawAxis(gl);
            currentDrawCalls += is3D ? 3 : 2;
        }
        gl.enable(gl.DEPTH_TEST);

        setDrawCalls(currentDrawCalls);

        fpsFrameCountRef.current++;
        const currentTime = performance.now();
        const deltaTime = currentTime - fpsLastTimeRef.current;

        if (deltaTime >= 1000) {
            const currentFps = Math.round((fpsFrameCountRef.current * 1000) / deltaTime);
            setFps(currentFps);
            fpsFrameCountRef.current = 0;
            fpsLastTimeRef.current = currentTime;
        }
    };

    const createPerspectiveMatrix = (fov: number, aspect: number, near: number, far: number): Float32Array => {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1.0 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    };

    const createOrthographicMatrix = (left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array => {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        return new Float32Array([
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (near + far) * nf, 1
        ]);
    };

    const createLookAtMatrix = (
        eyeX: number, eyeY: number, eyeZ: number,
        centerX: number, centerY: number, centerZ: number,
        upX: number, upY: number, upZ: number
    ): Float32Array => {
        let zx = eyeX - centerX;
        let zy = eyeY - centerY;
        let zz = eyeZ - centerZ;
        const zlen = Math.sqrt(zx * zx + zy * zy + zz * zz);
        zx /= zlen;
        zy /= zlen;
        zz /= zlen;

        let xx = upY * zz - upZ * zy;
        let xy = upZ * zx - upX * zz;
        let xz = upX * zy - upY * zx;
        const xlen = Math.sqrt(xx * xx + xy * xy + xz * xz);
        xx /= xlen;
        xy /= xlen;
        xz /= xlen;

        const yx = zy * xz - zz * xy;
        const yy = zz * xx - zx * xz;
        const yz = zx * xy - zy * xx;

        return new Float32Array([
            xx, yx, zx, 0,
            xy, yy, zy, 0,
            xz, yz, zz, 0,
            -(xx * eyeX + xy * eyeY + xz * eyeZ),
            -(yx * eyeX + yy * eyeY + yz * eyeZ),
            -(zx * eyeX + zy * eyeY + zz * eyeZ),
            1
        ]);
    };

    const updateDynamicGrid = (gl: WebGLRenderingContext, zoom: number, aspect: number) => {
        const viewWidth = zoom * aspect * 2;
        const viewHeight = zoom * 2;
        const maxViewSize = Math.max(viewWidth, viewHeight);

        let baseGridStep = 1;
        if (maxViewSize > 200) {
            baseGridStep = 100;
        } else if (maxViewSize > 100) {
            baseGridStep = 10;
        } else if (maxViewSize > 50) {
            baseGridStep = 10;
        } else if (maxViewSize > 20) {
            baseGridStep = 1;
        } else if (maxViewSize > 10) {
            baseGridStep = 1;
        } else if (maxViewSize > 5) {
            baseGridStep = 0.1;
        } else {
            baseGridStep = 0.01;
        }

        const fineGridStep = baseGridStep;
        const coarseGridStep = baseGridStep * 10;

        const gridRange = Math.ceil(maxViewSize * 0.75);
        const vertices: number[] = [];
        const coarseVertices: number[] = [];

        const startX = Math.floor((-viewWidth / 2 - gridRange) / fineGridStep) * fineGridStep;
        const endX = Math.ceil((viewWidth / 2 + gridRange) / fineGridStep) * fineGridStep;
        const startZ = Math.floor((-viewHeight / 2 - gridRange) / fineGridStep) * fineGridStep;
        const endZ = Math.ceil((viewHeight / 2 + gridRange) / fineGridStep) * fineGridStep;

        for (let x = startX; x <= endX; x += fineGridStep) {
            const roundedX = Math.round(x / fineGridStep) * fineGridStep;
            if (Math.abs(roundedX % coarseGridStep) < 0.001) {
                coarseVertices.push(roundedX, 0, startZ, roundedX, 0, endZ);
            } else {
                vertices.push(roundedX, 0, startZ, roundedX, 0, endZ);
            }
        }

        for (let z = startZ; z <= endZ; z += fineGridStep) {
            const roundedZ = Math.round(z / fineGridStep) * fineGridStep;
            if (Math.abs(roundedZ % coarseGridStep) < 0.001) {
                coarseVertices.push(startX, 0, roundedZ, endX, 0, roundedZ);
            } else {
                vertices.push(startX, 0, roundedZ, endX, 0, roundedZ);
            }
        }

        if (!dynamicGridBufferRef.current) {
            dynamicGridBufferRef.current = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, dynamicGridBufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...vertices, ...coarseVertices]), gl.DYNAMIC_DRAW);

        return {
            fineLineCount: vertices.length / 6,
            coarseLineCount: coarseVertices.length / 6,
            totalLineCount: (vertices.length + coarseVertices.length) / 6
        };
    };

    const drawGrid = (gl: WebGLRenderingContext) => {
        const program = gridProgramRef.current;
        if (!program) return;

        gl.useProgram(program);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const aspect = canvas.width / canvas.height;
        let projectionMatrix: Float32Array;
        let viewMatrix: Float32Array;

        const projectionLocation = gl.getUniformLocation(program, 'projection');
        const viewLocation = gl.getUniformLocation(program, 'view');
        const colorLocation = gl.getUniformLocation(program, 'color');
        const positionLocation = gl.getAttribLocation(program, 'position');

        if (is3D) {
            const buffer = gridBufferRef.current;
            if (!buffer) return;

            projectionMatrix = createPerspectiveMatrix(Math.PI / 4, aspect, 0.1, 100);

            const eyeX = Math.cos(cameraRotation.pitch) * Math.sin(cameraRotation.yaw) * cameraDistance;
            const eyeY = Math.sin(cameraRotation.pitch) * cameraDistance;
            const eyeZ = Math.cos(cameraRotation.pitch) * Math.cos(cameraRotation.yaw) * cameraDistance;

            viewMatrix = createLookAtMatrix(
                eyeX, eyeY, eyeZ,
                0, 0, 0,
                0, 1, 0
            );

            gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

            gl.uniform4f(colorLocation, 0.3, 0.3, 0.35, 1.0);

            const gridSize = 100;
            const gridStep = 1;
            const lineCount = ((gridSize * 2) / gridStep + 1) * 2;
            gl.drawArrays(gl.LINES, 0, lineCount * 2);
        } else {
            const zoom = camera2DZoom;
            const gridInfo = updateDynamicGrid(gl, zoom, aspect);
            const buffer = dynamicGridBufferRef.current;
            if (!buffer) return;

            const halfWidth = zoom * aspect;
            const halfHeight = zoom;

            projectionMatrix = createOrthographicMatrix(
                -halfWidth, halfWidth,
                -halfHeight, halfHeight,
                -100, 100
            );

            viewMatrix = createLookAtMatrix(
                camera2DOffset.x, 50, camera2DOffset.y,
                camera2DOffset.x, 0, camera2DOffset.y,
                0, 0, -1
            );

            gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

            gl.uniform4f(colorLocation, 0.25, 0.25, 0.28, 1.0);
            gl.drawArrays(gl.LINES, 0, gridInfo.fineLineCount * 2);

            gl.uniform4f(colorLocation, 0.35, 0.35, 0.4, 1.0);
            gl.drawArrays(gl.LINES, gridInfo.fineLineCount * 2, gridInfo.coarseLineCount * 2);
        }
    };

    const drawAxis = (gl: WebGLRenderingContext) => {
        const program = gridProgramRef.current;
        const buffer = axisBufferRef.current;
        if (!program || !buffer) return;

        gl.useProgram(program);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const aspect = canvas.width / canvas.height;
        let projectionMatrix: Float32Array;
        let viewMatrix: Float32Array;

        if (is3D) {
            projectionMatrix = createPerspectiveMatrix(Math.PI / 4, aspect, 0.1, 100);

            const eyeX = Math.cos(cameraRotation.pitch) * Math.sin(cameraRotation.yaw) * cameraDistance;
            const eyeY = Math.sin(cameraRotation.pitch) * cameraDistance;
            const eyeZ = Math.cos(cameraRotation.pitch) * Math.cos(cameraRotation.yaw) * cameraDistance;

            viewMatrix = createLookAtMatrix(
                eyeX, eyeY, eyeZ,
                0, 0, 0,
                0, 1, 0
            );
        } else {
            const zoom = camera2DZoom;
            const halfWidth = zoom * aspect;
            const halfHeight = zoom;

            projectionMatrix = createOrthographicMatrix(
                -halfWidth, halfWidth,
                -halfHeight, halfHeight,
                -100, 100
            );

            viewMatrix = createLookAtMatrix(
                camera2DOffset.x, 50, camera2DOffset.y,
                camera2DOffset.x, 0, camera2DOffset.y,
                0, 0, -1
            );
        }

        const projectionLocation = gl.getUniformLocation(program, 'projection');
        const viewLocation = gl.getUniformLocation(program, 'view');
        const colorLocation = gl.getUniformLocation(program, 'color');

        gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.lineWidth(3);

        if (is3D) {
            gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0);
            gl.drawArrays(gl.LINES, 0, 2);

            gl.uniform4f(colorLocation, 0.0, 1.0, 0.0, 1.0);
            gl.drawArrays(gl.LINES, 2, 2);

            gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);
            gl.drawArrays(gl.LINES, 4, 2);
        } else {
            gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0);
            gl.drawArrays(gl.LINES, 0, 2);

            gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);
            gl.drawArrays(gl.LINES, 4, 2);
        }

        gl.lineWidth(1);
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        if (glRef.current) {
            renderFrame(glRef.current, 0);
        }
    };

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    return (
        <div className="viewport" ref={containerRef}>
            <div className="viewport-toolbar">
                <div className="viewport-toolbar-left">
                    <button
                        className={`viewport-btn ${isPlaying ? 'active' : ''}`}
                        onClick={handlePlayPause}
                        title={isPlaying ? (locale === 'zh' ? '暂停' : 'Pause') : (locale === 'zh' ? '播放' : 'Play')}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        className="viewport-btn"
                        onClick={handleReset}
                        title={locale === 'zh' ? '重置' : 'Reset'}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="viewport-divider" />
                    <button
                        className={`viewport-btn ${showGrid ? 'active' : ''}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title={locale === 'zh' ? '显示网格' : 'Show Grid'}
                    >
                        <Grid3x3 size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${showGizmos ? 'active' : ''}`}
                        onClick={() => setShowGizmos(!showGizmos)}
                        title={locale === 'zh' ? '显示辅助工具' : 'Show Gizmos'}
                    >
                        {showGizmos ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <div className="viewport-divider" />
                    <button
                        className={`viewport-btn ${is3D ? 'active' : ''}`}
                        onClick={() => setIs3D(!is3D)}
                        title={is3D ? (locale === 'zh' ? '切换到2D' : 'Switch to 2D') : (locale === 'zh' ? '切换到3D' : 'Switch to 3D')}
                    >
                        {is3D ? <Box size={16} /> : <Square size={16} />}
                    </button>
                </div>
                <div className="viewport-toolbar-right">
                    <button
                        className={`viewport-btn ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title={locale === 'zh' ? '显示统计信息' : 'Show Stats'}
                    >
                        <Activity size={16} />
                    </button>
                    <button
                        className="viewport-btn"
                        onClick={handleFullscreen}
                        title={locale === 'zh' ? '全屏' : 'Fullscreen'}
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>
            <canvas ref={canvasRef} className="viewport-canvas" />
            {showStats && (
                <div className="viewport-stats">
                    <div className="viewport-stat">
                        <span className="viewport-stat-label">FPS:</span>
                        <span className="viewport-stat-value">{fps}</span>
                    </div>
                    <div className="viewport-stat">
                        <span className="viewport-stat-label">Draw Calls:</span>
                        <span className="viewport-stat-value">{drawCalls}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
