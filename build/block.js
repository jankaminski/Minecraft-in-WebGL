import { Vec3 } from "./math-utils.js";
const BLOCK_SIZE = 1.0;
class Block {
    constructor(chunk, posInChunk, index, pos, id) {
        this.chunk = chunk;
        this.posInChunk = posInChunk;
        this.index = index;
        this.center = pos.clone();
        this.id = id;
    }
    getID() {
        return this.id;
    }
    getChunk() {
        return this.chunk;
    }
    getPosInChunk() {
        return this.posInChunk;
    }
    getIndex() {
        return this.index;
    }
    getCenter() {
        return this.center.clone();
    }
    getSize() {
        return new Vec3(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    getMinX() { return this.center.x - (BLOCK_SIZE / 2); }
    getMinY() { return this.center.y - (BLOCK_SIZE / 2); }
    getMinZ() { return this.center.z - (BLOCK_SIZE / 2); }
    getMaxX() { return this.center.x + (BLOCK_SIZE / 2); }
    getMaxY() { return this.center.y + (BLOCK_SIZE / 2); }
    getMaxZ() { return this.center.z + (BLOCK_SIZE / 2); }
    isSolid() {
        return getBlockProperties(this.id).solid;
    }
    isTransparent() {
        return getBlockProperties(this.id).transparent;
    }
}
Block.AIR = 0;
Block.OAK_LOG = 1;
Block.COBBLESTONE = 2;
Block.MOSSY_COBBLE = 3;
Block.OAK_PLANKS = 4;
Block.DIRT = 5;
Block.GRASS = 6;
Block.OAK_LEAVES = 7;
class BlockProperties {
    constructor(id, solid, transparent, blastResistance) {
        this.id = id;
        this.solid = solid;
        this.transparent = transparent;
        this.blastResistance = blastResistance;
    }
}
let blockList = [];
function registerBlock(blockList, id, solid, transparent, blastResistance) {
    blockList[id] = new BlockProperties(id, solid, transparent, blastResistance);
}
registerBlock(blockList, Block.AIR, false, true, 0.0);
registerBlock(blockList, Block.OAK_LOG, true, false, 2.0);
registerBlock(blockList, Block.COBBLESTONE, true, false, 40.9);
registerBlock(blockList, Block.MOSSY_COBBLE, true, false, 3.9);
registerBlock(blockList, Block.OAK_PLANKS, true, false, 2.0);
registerBlock(blockList, Block.DIRT, true, false, 38);
registerBlock(blockList, Block.GRASS, true, false, 38);
registerBlock(blockList, Block.OAK_LEAVES, true, true, 0.1);
function getBlockProperties(id) {
    return blockList[id];
}
export { BLOCK_SIZE, Block, getBlockProperties };
