/**
 * WebGL UI 渲染器
 * WebGL UI Renderer - Low-level WebGL rendering for UI elements
 *
 * 支持批处理渲染以提高性能
 * Supports batch rendering for better performance
 */

/**
 * 顶点数据结构
 * Vertex data structure
 * position (2) + texcoord (2) + color (4)
 */
const VERTEX_SIZE = 8;
const VERTICES_PER_QUAD = 4;
const INDICES_PER_QUAD = 6;
const MAX_BATCH_QUADS = 2000;

/**
 * 着色器源码
 * Shader sources
 */
const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;
    attribute vec4 a_color;

    uniform mat4 u_projection;

    varying vec2 v_texcoord;
    varying vec4 v_color;

    void main() {
        gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
        v_texcoord = a_texcoord;
        v_color = a_color;
    }
`;

const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;

    varying vec2 v_texcoord;
    varying vec4 v_color;

    uniform sampler2D u_texture;
    uniform bool u_useTexture;

    void main() {
        if (u_useTexture) {
            gl_FragColor = texture2D(u_texture, v_texcoord) * v_color;
        } else {
            gl_FragColor = v_color;
        }
    }
`;

export class WebGLUIRenderer {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram | null = null;

    // Buffers
    private vertexBuffer: WebGLBuffer | null = null;
    private indexBuffer: WebGLBuffer | null = null;
    private vertexData: Float32Array;
    private indexData: Uint16Array;

    // Batch state
    private quadCount: number = 0;
    private currentTexture: WebGLTexture | null = null;

    // Uniform locations
    private projectionLocation: WebGLUniformLocation | null = null;
    private textureLocation: WebGLUniformLocation | null = null;
    private useTextureLocation: WebGLUniformLocation | null = null;

    // Attribute locations
    private positionLocation: number = -1;
    private texcoordLocation: number = -1;
    private colorLocation: number = -1;

    // Viewport
    private viewportWidth: number = 0;
    private viewportHeight: number = 0;

    // 白色纹理（用于纯色绘制）
    private whiteTexture: WebGLTexture | null = null;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        // 分配顶点和索引数据
        this.vertexData = new Float32Array(MAX_BATCH_QUADS * VERTICES_PER_QUAD * VERTEX_SIZE);
        this.indexData = new Uint16Array(MAX_BATCH_QUADS * INDICES_PER_QUAD);

        // 预填充索引数据
        for (let i = 0; i < MAX_BATCH_QUADS; i++) {
            const vi = i * 4;
            const ii = i * 6;
            this.indexData[ii + 0] = vi + 0;
            this.indexData[ii + 1] = vi + 1;
            this.indexData[ii + 2] = vi + 2;
            this.indexData[ii + 3] = vi + 2;
            this.indexData[ii + 4] = vi + 3;
            this.indexData[ii + 5] = vi + 0;
        }

        this.initShaders();
        this.initBuffers();
        this.createWhiteTexture();
    }

    private initShaders(): void {
        const gl = this.gl;

        // 编译着色器
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to compile shaders');
        }

        // 链接程序
        this.program = gl.createProgram();
        if (!this.program) {
            throw new Error('Failed to create shader program');
        }

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Failed to link shader program: ' + gl.getProgramInfoLog(this.program));
        }

        // 获取 attribute 位置
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'a_texcoord');
        this.colorLocation = gl.getAttribLocation(this.program, 'a_color');

        // 获取 uniform 位置
        this.projectionLocation = gl.getUniformLocation(this.program, 'u_projection');
        this.textureLocation = gl.getUniformLocation(this.program, 'u_texture');
        this.useTextureLocation = gl.getUniformLocation(this.program, 'u_useTexture');
    }

    private compileShader(type: number, source: string): WebGLShader | null {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    private initBuffers(): void {
        const gl = this.gl;

        // 创建顶点缓冲
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);

        // 创建索引缓冲
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
    }

    private createWhiteTexture(): void {
        const gl = this.gl;

        this.whiteTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);

        // 1x1 白色像素
        const pixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    /**
     * 设置视口尺寸
     * Set viewport size
     */
    public setViewport(width: number, height: number): void {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /**
     * 开始渲染批次
     * Begin render batch
     */
    public begin(): void {
        const gl = this.gl;

        gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);

        // 启用混合
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 禁用深度测试
        gl.disable(gl.DEPTH_TEST);

        // 使用程序
        gl.useProgram(this.program);

        // 设置投影矩阵（正交投影）
        const projection = this.createOrthographicMatrix(0, this.viewportWidth, this.viewportHeight, 0, -1, 1);
        gl.uniformMatrix4fv(this.projectionLocation, false, projection);

        // 绑定纹理单元
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.textureLocation, 0);

        // 绑定缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // 设置顶点属性
        const stride = VERTEX_SIZE * 4;
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(this.texcoordLocation);
        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, stride, 8);

        gl.enableVertexAttribArray(this.colorLocation);
        gl.vertexAttribPointer(this.colorLocation, 4, gl.FLOAT, false, stride, 16);

        this.quadCount = 0;
        this.currentTexture = null;
    }

    /**
     * 结束渲染批次
     * End render batch
     */
    public end(): void {
        this.flush();
    }

    /**
     * 刷新当前批次
     * Flush current batch
     */
    public flush(): void {
        if (this.quadCount === 0) return;

        const gl = this.gl;

        // 上传顶点数据
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData.subarray(0, this.quadCount * VERTICES_PER_QUAD * VERTEX_SIZE));

        // 绑定纹理
        if (this.currentTexture) {
            gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
            gl.uniform1i(this.useTextureLocation, 1);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
            gl.uniform1i(this.useTextureLocation, 0);
        }

        // 绘制
        gl.drawElements(gl.TRIANGLES, this.quadCount * INDICES_PER_QUAD, gl.UNSIGNED_SHORT, 0);

        this.quadCount = 0;
    }

    /**
     * 绘制矩形
     * Draw rectangle
     */
    public drawRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: number,
        alpha: number = 1
    ): void {
        this.drawQuad(x, y, width, height, 0, 0, 1, 1, color, alpha, null);
    }

    /**
     * 绘制纹理
     * Draw texture
     */
    public drawTexture(
        texture: WebGLTexture,
        x: number,
        y: number,
        width: number,
        height: number,
        u0: number = 0,
        v0: number = 0,
        u1: number = 1,
        v1: number = 1,
        tint: number = 0xFFFFFF,
        alpha: number = 1
    ): void {
        this.drawQuad(x, y, width, height, u0, v0, u1, v1, tint, alpha, texture);
    }

    /**
     * 绘制四边形
     * Draw quad
     */
    private drawQuad(
        x: number,
        y: number,
        width: number,
        height: number,
        u0: number,
        v0: number,
        u1: number,
        v1: number,
        color: number,
        alpha: number,
        texture: WebGLTexture | null
    ): void {
        // 检查是否需要刷新
        if (this.quadCount >= MAX_BATCH_QUADS) {
            this.flush();
        }

        if (texture !== this.currentTexture) {
            this.flush();
            this.currentTexture = texture;
        }

        // 颜色分解
        const r = ((color >> 16) & 0xFF) / 255;
        const g = ((color >> 8) & 0xFF) / 255;
        const b = (color & 0xFF) / 255;
        const a = alpha;

        // 计算顶点
        const x2 = x + width;
        const y2 = y + height;

        // 填充顶点数据
        const offset = this.quadCount * VERTICES_PER_QUAD * VERTEX_SIZE;

        // 左上
        this.vertexData[offset + 0] = x;
        this.vertexData[offset + 1] = y;
        this.vertexData[offset + 2] = u0;
        this.vertexData[offset + 3] = v0;
        this.vertexData[offset + 4] = r;
        this.vertexData[offset + 5] = g;
        this.vertexData[offset + 6] = b;
        this.vertexData[offset + 7] = a;

        // 右上
        this.vertexData[offset + 8] = x2;
        this.vertexData[offset + 9] = y;
        this.vertexData[offset + 10] = u1;
        this.vertexData[offset + 11] = v0;
        this.vertexData[offset + 12] = r;
        this.vertexData[offset + 13] = g;
        this.vertexData[offset + 14] = b;
        this.vertexData[offset + 15] = a;

        // 右下
        this.vertexData[offset + 16] = x2;
        this.vertexData[offset + 17] = y2;
        this.vertexData[offset + 18] = u1;
        this.vertexData[offset + 19] = v1;
        this.vertexData[offset + 20] = r;
        this.vertexData[offset + 21] = g;
        this.vertexData[offset + 22] = b;
        this.vertexData[offset + 23] = a;

        // 左下
        this.vertexData[offset + 24] = x;
        this.vertexData[offset + 25] = y2;
        this.vertexData[offset + 26] = u0;
        this.vertexData[offset + 27] = v1;
        this.vertexData[offset + 28] = r;
        this.vertexData[offset + 29] = g;
        this.vertexData[offset + 30] = b;
        this.vertexData[offset + 31] = a;

        this.quadCount++;
    }

    /**
     * 创建正交投影矩阵
     * Create orthographic projection matrix
     */
    private createOrthographicMatrix(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ): Float32Array {
        const matrix = new Float32Array(16);

        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        matrix[0] = -2 * lr;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = -2 * bt;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = 2 * nf;
        matrix[11] = 0;

        matrix[12] = (left + right) * lr;
        matrix[13] = (top + bottom) * bt;
        matrix[14] = (far + near) * nf;
        matrix[15] = 1;

        return matrix;
    }

    /**
     * 销毁渲染器
     * Dispose renderer
     */
    public dispose(): void {
        const gl = this.gl;

        if (this.program) {
            gl.deleteProgram(this.program);
            this.program = null;
        }

        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }

        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }

        if (this.whiteTexture) {
            gl.deleteTexture(this.whiteTexture);
            this.whiteTexture = null;
        }
    }
}
