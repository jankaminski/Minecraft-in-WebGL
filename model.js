function makeVBO(gl, vertices, attrPtrs) {
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (let i = 0; i < attrPtrs.length; i++) {
        let a = attrPtrs[i];
        gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, gl.FALSE, a.stride, a.offset);
        gl.enableVertexAttribArray(a.loc);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
}

function makeIBO(gl, indices) {
    let indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuf;
}

function makeAttrPtr(loc, size, stride, offset) {
    return {
        loc : loc,
        size : size,
        stride : stride * Float32Array.BYTES_PER_ELEMENT,
        offset : offset * Float32Array.BYTES_PER_ELEMENT
    };
}

class Mesh {
    constructor(gl, vertices, indices, ...attrPtrs) {
        this.attrPtrs = [];
        for (let i = 0; i < attrPtrs.length; i++)
            this.attrPtrs.push(attrPtrs[i]);
        this.vertexBuf = makeVBO(gl, vertices, this.attrPtrs);
        this.indexBuf = makeIBO(gl, indices);
        this.indicesCount = indices.length;
    }
    bind(gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
        for (let i = 0; i < this.attrPtrs.length; i++) {
            let a = this.attrPtrs[i];
            gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, gl.FALSE, a.stride, a.offset);
            gl.enableVertexAttribArray(a.loc);
        }
    }
    unbind(gl) {
        for (let i = 0; i < this.attrPtrs.length; i++)
            gl.disableVertexAttribArray(this.attrPtrs[i].loc);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

class Model {
    constructor(mesh, texture) {
        this.mesh = mesh;
        this.texture = texture;
    }
    bind(gl) {
        this.mesh.bind(gl);
        this.texture.bind(gl);
    }
    unbind(gl) {
        this.texture.unbind(gl);
        this.mesh.unbind(gl);
    }
}

export { 
    Mesh, 
    makeAttrPtr, 
    Model 
};