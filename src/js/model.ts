import { Texture } from "./texture.js";
import { gl } from "./webgl-init.js";

function makeVBO(vertices: number[], attrPtrs: VertexAttribute[]) {
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (let i = 0; i < attrPtrs.length; i++) {
        let a = attrPtrs[i];
        gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, a.stride, a.offset);
        gl.enableVertexAttribArray(a.loc);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
}

function makeIBO(indices: number[]) {
    let indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuf;
}

class VertexAttribute {
    loc: number;
    size: number;
    stride: number;
    offset: number;
    constructor(loc: number, size: number, stride: number, offset: number) {
        this.loc = loc;
        this.size = size;
        this.stride = stride * Float32Array.BYTES_PER_ELEMENT;
        this.offset = offset * Float32Array.BYTES_PER_ELEMENT;
    }
}

class Mesh {
    attrPtrs: VertexAttribute[];
    vertexBuf: WebGLBuffer;
    indexBuf: WebGLBuffer;
    indicesCount: number;
    constructor(vertices: number[], indices: number[], ...attrPtrs: VertexAttribute[]) {
        this.attrPtrs = [];
        for (let i = 0; i < attrPtrs.length; i++)
            this.attrPtrs.push(attrPtrs[i]);
        this.vertexBuf = makeVBO(vertices, this.attrPtrs);
        this.indexBuf = makeIBO(indices);
        this.indicesCount = indices.length;
    }
    bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
        for (let i = 0; i < this.attrPtrs.length; i++) {
            let a = this.attrPtrs[i];
            gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, a.stride, a.offset);
            gl.enableVertexAttribArray(a.loc);
        }
    }
    unbind() {
        for (let i = 0; i < this.attrPtrs.length; i++)
            gl.disableVertexAttribArray(this.attrPtrs[i].loc);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

class Model {
    mesh: Mesh;
    texture: Texture;
    constructor(mesh: Mesh, texture: Texture) {
        this.mesh = mesh;
        this.texture = texture;
    }
    bind() {
        this.mesh.bind();
        this.texture.bind();
    }
    unbind() {
        this.texture.unbind();
        this.mesh.unbind();
    }
}

const VERTICES_PER_FACE = 4;
const INDICES_PER_FACE = 6;

function makeOneFaceIndices(currentLength: number, indicesTemplate: number[]) {
    let indices: number[] = [];
    for (let i = 0; i < INDICES_PER_FACE; i++) {
        let index = indicesTemplate[i] + (currentLength / INDICES_PER_FACE) * VERTICES_PER_FACE;
        indices.push(index);
    }
    return indices;
}

function makeMeshIndices(noOfFaces: number, indicesTemplate: number[]) {
    let indices: number[] = [];
    for (let i = 0; i < noOfFaces; i++)
        indices = indices.concat(makeOneFaceIndices(indices.length, indicesTemplate));
    return indices;
}

export {
    Mesh,
    Model,
    VertexAttribute,
    VERTICES_PER_FACE,
    INDICES_PER_FACE,
    makeOneFaceIndices,
    makeMeshIndices
};