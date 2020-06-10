class WebGLUtils {
    public static getWebGL(): WebGLRenderingContext{
        return document.querySelector("canvas").getContext("webgl");
    }

    public static drawUserIndexPrimitives<T>(primitiveType: number, vertexData: T[], vertexOffset: number, numVertices: number, indexData: number[], indexOffset: number, primitiveCount: number){
        let GL = this.getWebGL();

        GL.bindBuffer(GL.ARRAY_BUFFER, 0);
        this.checkGLError();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, 0);
        this.checkGLError();

        GL.drawElements(primitiveType, 
            this.getElementCountArray(primitiveType, primitiveCount), 
            GL.UNSIGNED_SHORT, 
            indexOffset * 2);
        this.checkGLError();
    }

    private static getElementCountArray(primitiveType: number, primitiveCount: number){
        let GL = this.getWebGL();
        switch (primitiveType){
            case GL.LINES:
                return primitiveCount * 2;
            case GL.LINE_STRIP:
                return primitiveCount + 1;
            case GL.TRIANGLES:
                return primitiveCount * 3;
            case GL.TRIANGLE_STRIP:
                return primitiveCount + 2;
        }

        throw new Error("not support");
    }

    public static checkGLError(){
        let GL = this.getWebGL();
        let error = GL.getError();
        if (error != GL.NO_ERROR){
            throw new Error("GL.GetError() returned" + error);
        }
    }
}