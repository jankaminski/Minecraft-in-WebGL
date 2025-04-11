import { gl } from "./webgl-init.ts";

class ShaderProgram {
    program: WebGLProgram;
    constructor(vertexSource: string, fragmentSource: string) {
        let vertexShader = this.makeShader(vertexSource, gl.VERTEX_SHADER);
        let fragmentShader = this.makeShader(fragmentSource, gl.FRAGMENT_SHADER);
        let program = this.makeProgram(vertexShader, fragmentShader);
        this.program = program;
    }
    makeShader(source: string, type: GLenum): WebGLShader {
        let shader = gl.createShader(type);
        if (shader === null)
            throw new Error("ERROR creating shader object");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error("ERROR compiling fragment shader" + gl.getShaderInfoLog(shader));
        return shader;
    }
    makeProgram(...shaders: WebGLShader[]): WebGLProgram {
        let program = gl.createProgram();
        for (let shader of shaders)
            gl.attachShader(program, shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error("ERROR linking program!" + gl.getProgramInfoLog(program));
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
            throw new Error("ERROR validating program!" + gl.getProgramInfoLog(program));
        return program;
    }
    turnOn() {
        gl.useProgram(this.program);
    }
    turnOff() {
        gl.useProgram(null);
    }
    loadInt(name: string, value: number) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform1i(loc, value);
    }
    loadFloat(name: string, value: number) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform1f(loc, value);
    }
    loadVec2(name: string, vec: Float32Array) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform2fv(loc, vec);
    }
    loadVec3(name: string, vec: Float32Array) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform3fv(loc, vec);
    }
    loadVec4(name: string, vec: Float32Array) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform4fv(loc, vec);
    }
    loadMatrix(name: string, matrix: Float32Array) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniformMatrix4fv(loc, false, matrix);
    }
}

export { ShaderProgram };