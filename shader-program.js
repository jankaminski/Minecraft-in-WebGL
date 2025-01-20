class ShaderProgram {
    constructor(gl, vertexSource, fragmentSource) {
        let vertexShader = this.makeShader(gl, vertexSource, gl.VERTEX_SHADER);
        let fragmentShader = this.makeShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        let program = this.makeProgram(gl, vertexShader, fragmentShader);
        if (!program)
            throw "BLEH";
        this.program = program;
    }
    makeShader(gl, source, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('ERROR compiling fragment shader', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    makeProgram(gl, ...shaders) {
        for (let shader of shaders) {
            if (!shader)
                return null;
        }
        let program = gl.createProgram();
        for (let shader of shaders) {
            gl.attachShader(program, shader);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('ERROR linking program!', gl.getProgramInfoLog(program));
            return null;
        }
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error('ERROR validating program!', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
    turnOn(gl) {
        gl.useProgram(this.program);
    }
    turnOff(gl) {
        gl.useProgram(null);
    }
    loadInt(gl, name, value) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform1i(loc, value);
    }
    loadFloat(gl, name, value) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform1f(loc, value);
    }
    loadVec2(gl, name, vec) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform2fv(loc, vec);
    }
    loadVec3(gl, name, vec) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform3fv(loc, vec);
    }
    loadVec4(gl, name, vec) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniform4fv(loc, vec);
    }
    loadMatrix(gl, name, matrix) {
        let loc = gl.getUniformLocation(this.program, name);
        gl.uniformMatrix4fv(loc, gl.GL_FALSE, matrix);
    }
}

export { ShaderProgram };