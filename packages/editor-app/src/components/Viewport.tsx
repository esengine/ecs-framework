import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity } from 'lucide-react';
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
  const animationFrameRef = useRef<number>();
  const glRef = useRef<WebGLRenderingContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    initWebGL(gl);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startRenderLoop();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  const initWebGL = (gl: WebGLRenderingContext) => {
    gl.clearColor(0.1, 0.1, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    renderFrame(gl, 0);
  };

  const startRenderLoop = () => {
    let startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;

      if (glRef.current) {
        renderFrame(glRef.current, elapsed);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
  };

  const renderFrame = (gl: WebGLRenderingContext, time: number) => {
    gl.clearColor(0.1, 0.1, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (showGrid) {
      drawGrid(gl);
    }
  };

  const drawGrid = (gl: WebGLRenderingContext) => {
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

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const gridSize = 10;
    const gridStep = 1;
    const vertices: number[] = [];

    for (let i = -gridSize; i <= gridSize; i += gridStep) {
      vertices.push(i, 0, -gridSize, i, 0, gridSize);
      vertices.push(-gridSize, 0, i, gridSize, 0, i);
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(program, 'color');
    gl.uniform4f(colorLocation, 0.3, 0.3, 0.35, 1.0);

    gl.drawArrays(gl.LINES, 0, vertices.length / 3);
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
            <span className="viewport-stat-value">60</span>
          </div>
          <div className="viewport-stat">
            <span className="viewport-stat-label">Draw Calls:</span>
            <span className="viewport-stat-value">0</span>
          </div>
        </div>
      )}
    </div>
  );
}
