import { gl } from "./webgl-init.js";

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
    unbind() { gl.bindTexture(this.target, null); }
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
        if (image.width != this.tileWidth || 
            image.height != this.tileHeight || 
            xOffset > this.xTilesCapacity || 
            yOffset > this.yTilesCapacity) { 
            throw "BLEH";
        }
        this.bind();
        gl.texSubImage2D(this.target, 0, xOffset * this.tileWidth, yOffset * this.tileHeight, 
            this.tileWidth, this.tileHeight, this.format, this.type, image);
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

export {
    make2DTexFromImage,
    TextureAtlas
};