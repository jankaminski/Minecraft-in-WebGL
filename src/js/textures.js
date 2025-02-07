import { make2DTexFromImage, TextureAtlas } from "./texture.js";
import { gl } from "./webgl-init.js";
import { loadImage } from "./res-utils.js";
import { Block } from "./block.js";

const BLOCK_TEX_ATLAS_ROWS = 100;
const BLOCK_TEX_ATLAS_COLUMNS = 6;
const BLOCK_PIXELS = 16;

class BlockTextureAtlas extends TextureAtlas {
    constructor() {
        super(
            gl.CLAMP_TO_EDGE, 
            gl.NEAREST, 
            BLOCK_PIXELS, 
            BLOCK_PIXELS, 
            BLOCK_TEX_ATLAS_COLUMNS, 
            BLOCK_TEX_ATLAS_ROWS);
    }
    addBlock(blockID, ...images) {
        if (images.length != 6 && images.length != 1) 
            throw "BLEH";
        for (let i = 0; i < 6; i++) {
            let image;
            if (images.length === 1)
                image = images[0];
            else
                image = images[i];
            this.addTile(image, i, blockID);
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
const oakLeavesTexImage = await loadImage("./res/textures/oak_leaves.png");

const BLOCK_TEXTURE_ATLAS = new BlockTextureAtlas()
.addBlock(
    Block.OAK_LOG, 
    oakLogTexImage, 
    oakLogTexImage, 
    oakLogTopTexImage, 
    oakLogTopTexImage, 
    oakLogTexImage, 
    oakLogTexImage)
.addBlock(
    Block.COBBLESTONE, 
    cobbleTexImage)
.addBlock(
    Block.MOSSY_COBBLE, 
    mossyCobbleTexImage)   
.addBlock(
    Block.OAK_PLANKS, 
    oakPlanksTexImage)
.addBlock(
    Block.DIRT, 
    dirtTexImage)
.addBlock(
    Block.GRASS, 
    grassSideTexImage, 
    grassSideTexImage, 
    grassTopTexImage, 
    dirtTexImage, 
    grassSideTexImage, 
    grassSideTexImage)
.addBlock(
    Block.OAK_LEAVES,
    oakLeavesTexImage
);

const creeperTexImage = await loadImage("./res/textures/creeper.png");
const CREEPER_TEXTURE = make2DTexFromImage(gl.CLAMP_TO_EDGE, gl.NEAREST, creeperTexImage);

const particleImage = await loadImage("./res/textures/default.png");
const particleTexture = make2DTexFromImage(gl.CLAMP_TO_EDGE, gl.NEAREST, particleImage);

export {
    BLOCK_TEX_ATLAS_ROWS,
    BLOCK_TEX_ATLAS_COLUMNS,
    BLOCK_PIXELS,
    BLOCK_TEXTURE_ATLAS,
    CREEPER_TEXTURE,
    particleTexture
};