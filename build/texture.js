import { canvas, gl } from "./webgl-init.js";
class Texture {
    constructor(target, wrap, filter, format, type) {
        this.target = target;
        this.wrap = wrap;
        this.filter = filter;
        this.format = format;
        this.type = type;
        this.id = gl.createTexture();
        gl.bindTexture(target, this.id);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter);
        gl.bindTexture(target, null);
    }
    bind() {
        gl.bindTexture(this.target, this.id);
        gl.activeTexture(gl.TEXTURE0);
    }
    unbind() {
        gl.bindTexture(this.target, null);
    }
}
class Texture2D extends Texture {
    constructor(wrap, filter, format, type, width, height) {
        super(gl.TEXTURE_2D, wrap, filter, format, type);
        this.width = width;
        this.height = height;
    }
}
class TextureAtlas extends Texture2D {
    constructor(wrap, filter, tileWidth, tileHeight, xTilesCapacity, yTilesCapacity) {
        super(wrap, filter, gl.RGBA, gl.UNSIGNED_BYTE, tileWidth * xTilesCapacity, tileHeight * yTilesCapacity);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.xTilesCapacity = xTilesCapacity;
        this.yTilesCapacity = yTilesCapacity;
        this.bind();
        gl.texImage2D(this.target, 0, this.format, this.width, this.height, 0, this.format, this.type, null);
        gl.generateMipmap(this.target);
        this.unbind();
    }
    addTile(image, xOffset, yOffset) {
        if (image.width > this.tileWidth ||
            image.height > this.tileHeight ||
            xOffset > this.xTilesCapacity ||
            yOffset > this.yTilesCapacity) {
            throw new Error("ERROR: Invalid dimensions of tile in a texture atlas!");
        }
        let xDiff = Math.trunc((this.tileWidth - image.width) / 2);
        let yDiff = Math.trunc((this.tileHeight - image.height) / 2);
        this.bind();
        gl.texSubImage2D(this.target, 0, xOffset * this.tileWidth + xDiff, yOffset * this.tileHeight + yDiff, image.width, image.height, this.format, this.type, image);
        this.unbind();
    }
}
function make2DTexFromImage(wrap, filter, image) {
    let tex = new Texture2D(wrap, filter, gl.RGBA, gl.UNSIGNED_BYTE, image.width, image.height);
    tex.bind();
    gl.texImage2D(tex.target, 0, tex.format, tex.format, tex.type, image);
    tex.unbind();
    return tex;
}
class Framebuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.buf = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buf);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        this.tex = this.makeTextureAttachment();
        let rbo = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, width, height);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo);
    }
    makeTextureAttachment() {
        let tex = new Texture2D(gl.CLAMP_TO_EDGE, gl.LINEAR, gl.RGBA, gl.UNSIGNED_BYTE, this.width, this.height);
        tex.bind();
        gl.texImage2D(tex.target, 0, tex.format, tex.width, tex.height, 0, tex.format, tex.type, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex.target, tex.id, 0);
        return tex;
    }
    bindBuffer() {
        gl.viewport(0, 0, this.width, this.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buf);
    }
    unbindBuffer() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight); // 1000 60000
    }
    bindTexture() {
        this.tex.bind();
    }
    unbindTexture() {
        this.tex.unbind();
    }
}
export { make2DTexFromImage, Texture, TextureAtlas, Framebuffer };
