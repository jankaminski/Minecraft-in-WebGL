const BLOCK_SIZE = 1.0;

class Block {
    static AIR = 0;
    static OAK_LOG = 1;
    static COBBLESTONE = 2;
    static MOSSY_COBBLE = 3;
    static OAK_PLANKS = 4;
    static DIRT = 5;
    static GRASS = 6;
    constructor(chunk, posInChunk, index, pos, id) {
        this.chunk = chunk;
        this.posInChunk = posInChunk;
        this.index = index;
        this.center = Vec3.copy(pos);
        this.id = id;
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
        return Vec3.copy(this.center);
    }
    getSize() {
        return Vec3.makeS(BLOCK_SIZE);
    }
    isSolid() {
        return getBlockProperties(this.id).solid;
    }
    isTransparent() {
        return getBlockProperties(this.id).transparent;
    }
}

class BlockProperties {
    constructor(id, solid, transparent) {
        this.id = id;
        this.solid = solid;
        this.transparent = transparent;
    }
}

let blockList = [];

function registerBlock(blockList, id, solid, transparent) {
    blockList[id] = new BlockProperties(id, solid, transparent);
}

registerBlock(blockList, Block.AIR,          false, true);
registerBlock(blockList, Block.OAK_LOG,      true,  false);
registerBlock(blockList, Block.COBBLESTONE,  true,  false);
registerBlock(blockList, Block.MOSSY_COBBLE, true,  false);
registerBlock(blockList, Block.OAK_PLANKS,   true,  false);
registerBlock(blockList, Block.DIRT,         true,  false);
registerBlock(blockList, Block.GRASS,        true,  false);

function getBlockProperties(id) {
    return blockList[id];
}