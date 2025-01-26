import { make2DTexFromImage, TextureAtlas } from "./texture.js";
import { gl } from "./webgl-init.js";
import { 
    BLOCK_PIXELS, 
    BLOCK_TEX_ATLAS_COLUMNS, 
    BLOCK_TEX_ATLAS_ROWS
} from "./chunk.js";
import { loadImage } from "./res-utils.js";
import { Block } from "./block.js";

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

const oakLogTopTexImage = await loadImage("./res/oak_log_top.png");
const oakLogTexImage = await loadImage("./res/oak_log.png");
const cobbleTexImage = await loadImage("./res/cobblestone.png");
const mossyCobbleTexImage = await loadImage("./res/mossy_cobblestone.png");
const oakPlanksTexImage = await loadImage("./res/oak_planks.png");
const dirtTexImage = await loadImage("./res/dirt.png");
const grassSideTexImage = await loadImage("./res/grass_block_side.png");
const grassTopTexImage = await loadImage("./res/grass_block_top.png");

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

const creeperTexImage = await loadImage("./res/creeper.png");
const CREEPER_TEXTURE = make2DTexFromImage(gl, gl.CLAMP_TO_EDGE, gl.NEAREST, creeperTexImage);

export {
    BLOCK_TEXTURE_ATLAS,
    CREEPER_TEXTURE
};