import { Vec3 } from "./math-utils.ts";

const BLOCK_SIZE = 1.0;

class Block {
    static AIR = 0;
    static OAK_LOG = 1;
    static COBBLESTONE = 2;
    static MOSSY_COBBLE = 3;
    static OAK_PLANKS = 4;
    static DIRT = 5;
    static GRASS = 6;
    static OAK_LEAVES = 7;
    chunk: Chunk;
    posInChunk: Vec3;
    index: number;
    center: Vec3;
    id: number;
    constructor(chunk: Chunk, posInChunk: Vec3, index: number, pos: Vec3, id: number) {
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
    isSolid() {
        return getBlockProperties(this.id).solid;
    }
    isTransparent() {
        return getBlockProperties(this.id).transparent;
    }
}

class BlockProperties {
    id: number;
    solid: boolean;
    transparent: boolean;
    blastResistance: number;
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

registerBlock(blockList, Block.AIR,          false, true, 0.0);
registerBlock(blockList, Block.OAK_LOG,      true,  false, 2.0);
registerBlock(blockList, Block.COBBLESTONE,  true,  false, 40.9);
registerBlock(blockList, Block.MOSSY_COBBLE, true,  false, 3.9);
registerBlock(blockList, Block.OAK_PLANKS,   true,  false, 2.0);
registerBlock(blockList, Block.DIRT,         true,  false, 38);
registerBlock(blockList, Block.GRASS,        true,  false, 38);
registerBlock(blockList, Block.OAK_LEAVES,   true,  true, 0.1);

function getBlockProperties(id) {
    return blockList[id];
}

export {
    BLOCK_SIZE,
    Block,
    getBlockProperties
};