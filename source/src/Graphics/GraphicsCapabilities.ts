class GraphicsCapabilities {
    public supportsTextureFilterAnisotropic: boolean;
    public supportsNonPowerOfTwo: boolean;
    public supportsDepth24: boolean;
    public supportsPackedDepthStencil: boolean;
    public supportsDepthNonLinear: boolean;
    public supportsTextureMaxLevel: boolean;
    public supportsS3tc: boolean;
    public supportsDxt1: boolean;
    public supportsPvrtc: boolean;
    public supportsAtitc: boolean;
    public supportsFramebufferObjectARB: boolean;

    public initialize(device: GraphicsDevice){
        this.platformInitialize(device);
    }

    private platformInitialize(device: GraphicsDevice){
        let gl: WebGLRenderingContext = new egret.sys.RenderBuffer().context.getInstance();
        this.supportsNonPowerOfTwo = false;
        this.supportsTextureFilterAnisotropic = gl.getExtension("EXT_texture_filter_anisotropic") != null;
        this.supportsDepth24 = true;
        this.supportsPackedDepthStencil = true;
        this.supportsDepthNonLinear = false;
        this.supportsTextureMaxLevel = true;
        this.supportsS3tc = gl.getExtension("WEBGL_compressed_texture_s3tc") != null ||
            gl.getExtension("WEBGL_compressed_texture_s3tc_srgb") != null;
        this.supportsDxt1 = this.supportsS3tc;
        this.supportsPvrtc = false;
        this.supportsAtitc = gl.getExtension("WEBGL_compressed_texture_astc") != null;
        this.supportsFramebufferObjectARB = false;
    }
}