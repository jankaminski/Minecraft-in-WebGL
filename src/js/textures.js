import { make2DTexFromImage, TextureAtlas } from "../js/texture.js";
import { gl } from "../js/webgl-init.js";
import { loadImage } from "../js/res-utils.js";
import { Block } from "../js/block.js";

const BLOCK_TEX_ATLAS_ROWS = 100;
const BLOCK_TEX_ATLAS_COLUMNS = 6;
const BLOCK_PIXELS = 16;

class BlockTextureAtlas extends TextureAtlas {
    constructor(gl) {
        super(gl, 
            gl.CLAMP_TO_EDGE, 
            gl.NEAREST, 
            BLOCK_PIXELS, 
            BLOCK_PIXELS, 
            BLOCK_TEX_ATLAS_COLUMNS, 
            BLOCK_TEX_ATLAS_ROWS);
    }
    addBlock(gl, blockID, ...images) {
        if (images.length != 6 && images.length != 1) 
            throw "BLEH";
        for (let i = 0; i < 6; i++) {
            let image;
            if (images.length === 1)
                image = images[0];
            else
                image = images[i];
            this.addTile(gl, image, i, blockID);
        }
        return this;
    }
}

const oakLogTopTexImage = await loadImage("./res/textures/oak_log_top.png");
const oakLogTexImage = await loadImage("./res/textures/oak_log.png");
const cobbleTexImage = await loadImage("./res/textures/cobblestone.png");
const mossyCobbleTexImage = await loadImage("./res/textures/mossy_cobblestone.png");
const oakPlanksTexImage = await loadImage("./res/textures/oak_planks.png");
const dirtTexImage = await loadImage("./res/textures/dirt.png");
const grassSideTexImage = await loadImage("./res/textures/grass_block_side.png");
const grassTopTexImage = await loadImage("./res/textures/grass_block_top.png");

const BLOCK_TEXTURE_ATLAS = new BlockTextureAtlas(gl)
.addBlock(
    gl, 
    Block.OAK_LOG, 
    oakLogTexImage, 
    oakLogTexImage, 
    oakLogTopTexImage, 
    oakLogTopTexImage, 
    oakLogTexImage, 
    oakLogTexImage)
.addBlock(
    gl, 
    Block.COBBLESTONE, 
    cobbleTexImage)
.addBlock(
    gl, 
    Block.MOSSY_COBBLE, 
    mossyCobbleTexImage)   
.addBlock(
    gl, 
    Block.OAK_PLANKS, 
    oakPlanksTexImage)
.addBlock(
    gl, 
    Block.DIRT, 
    dirtTexImage)
.addBlock(
    gl, 
    Block.GRASS, 
    grassSideTexImage, 
    grassSideTexImage, 
    grassTopTexImage, 
    dirtTexImage, 
    grassSideTexImage, 
    grassSideTexImage);

const creeperTexImage = await loadImage("./res/textures/creeper.png");
const CREEPER_TEXTURE = make2DTexFromImage(gl, gl.CLAMP_TO_EDGE, gl.NEAREST, creeperTexImage);

export {
    BLOCK_TEX_ATLAS_ROWS,
    BLOCK_TEX_ATLAS_COLUMNS,
    BLOCK_PIXELS,
    BLOCK_TEXTURE_ATLAS,
    CREEPER_TEXTURE
};