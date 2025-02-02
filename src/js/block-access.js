import { Block, BLOCK_SIZE } from "./block.js";
import { ChunkIndex } from "./chunk.js";
import { Vec3 } from "./math-utils.js";

const CHUNK_HEIGHT_IN_BLOCKS = 128;
const CHUNK_WIDTH_IN_BLOCKS = 16;

const CHUNK_WIDTH = CHUNK_WIDTH_IN_BLOCKS * BLOCK_SIZE;
const CHUNK_HEIGHT = CHUNK_HEIGHT_IN_BLOCKS * BLOCK_SIZE;
const TOTAL_BLOCKS_PER_CHUNK = CHUNK_WIDTH_IN_BLOCKS * CHUNK_HEIGHT_IN_BLOCKS * CHUNK_WIDTH_IN_BLOCKS;

class BlockAccess {
    static getChunkIndexByWorldCoords(x, z) {
        let x1 = x % CHUNK_WIDTH;
        let z1 = z % CHUNK_WIDTH;
        let x2 = x - x1;
        let z2 = z - z1;
        let indexX = x2 / CHUNK_WIDTH;
        let indexZ = z2 / CHUNK_WIDTH;
        if (x < 0) 
            indexX--;
        if (z < 0) 
            indexZ--;
        return new ChunkIndex(indexX, indexZ);
    }
    static getInChunkBlockCoordsByWorldCoords(x, y, z) {
        let blockY = Math.trunc(y) / BLOCK_SIZE;
        if (blockY < 0 || blockY >= CHUNK_HEIGHT_IN_BLOCKS) 
            return null;
        let x1 = x % CHUNK_WIDTH;
        let z1 = z % CHUNK_WIDTH;
        if (x < 0)
            x1 += CHUNK_WIDTH;
        if (z < 0) 
            z1 += CHUNK_WIDTH;
        let blockX = Math.trunc(x1);
        if (blockX < 0 || blockX >= CHUNK_WIDTH) 
            return null;
        let blockZ = Math.trunc(z1);
        if (blockZ < 0 || blockZ >= CHUNK_WIDTH_IN_BLOCKS) 
            return null;
        return { x : blockX, y : blockY, z : blockZ };
    }
    static getChunkByIndex(terrain, index) {
        for (let chunk of terrain.chunks)
            if (index.equals(chunk.index))
                return chunk;
        return null;
    }
    static getChunkByWorldCoords(terrain, x, z) {
        let index = this.getChunkIndexByWorldCoords(x, z);
        let chunk = this.getChunkByIndex(terrain, index);
        return chunk;
    }
    static getBlockCenterByWorldCoords(x, y, z) {
        let center = Vec3.make(
            (Math.trunc(x) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(x), 
            (Math.trunc(y) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(y), 
            (Math.trunc(z) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(z));
        return center;
    }
    static getBlockByWorldCoords(terrain, x, y, z) {
        let chunk = this.getChunkByWorldCoords(terrain, x, z);
        if (chunk === null) 
            return null;
        let blockPosInChunk = this.getInChunkBlockCoordsByWorldCoords(x, y, z);
        if (blockPosInChunk === null) 
            return null;
        let { x : blockX, y : blockY, z : blockZ } = blockPosInChunk;
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockX, blockY, blockZ);
        let center = this.getBlockCenterByWorldCoords(x, y, z);
        let blockID = this.getBlockByInChunkCoords(chunk, blockX, blockY, blockZ);
        return new Block(chunk, blockPosInChunk, blockIndex, center, blockID);
    }
    static getWorldCoordsByInChunkBlockCoords(chunk, x, y, z) {
        let worldX = chunk.index.x * CHUNK_WIDTH + x * BLOCK_SIZE + (BLOCK_SIZE / 2);
        let worldY = y * BLOCK_SIZE;
        let worldZ = chunk.index.z * CHUNK_WIDTH + z * BLOCK_SIZE + (BLOCK_SIZE / 2);
        return { worldX, worldY, worldZ };
    }
    static coordsNotOutsideChunk(x, y, z) {
        let notExceededX = x < CHUNK_WIDTH_IN_BLOCKS && x >= 0;
        let notExceededY = y < CHUNK_HEIGHT_IN_BLOCKS && y >= 0;
        let notExceededZ = z < CHUNK_WIDTH_IN_BLOCKS && z >= 0;
        return { notExceededX, notExceededY, notExceededZ };
    }
    static allCoordsInsideChunk(x, y, z) {
        let { notExceededX, notExceededY, notExceededZ } = this.coordsNotOutsideChunk(x, y, z);
        return notExceededX && notExceededY && notExceededZ;
    }
    static getChunkIndexByBlockCoords(origChunk, x, z) {
        let chunkXOffset = Math.trunc(x / CHUNK_WIDTH_IN_BLOCKS);
        let chunkZOffset = Math.trunc(z / CHUNK_WIDTH_IN_BLOCKS);
        if (x < 0)
            chunkXOffset--;
        if (z < 0)
            chunkZOffset--;
        return origChunk.index.clone().offset(chunkXOffset, chunkZOffset);
    }
    static getChunkIndexAndInChunkBlockCoordsByBlockCoords(origChunk, x, y, z) {
        let { notExceededX, notExceededY, notExceededZ } = this.coordsNotOutsideChunk(x, y, z);
        if (notExceededX && notExceededY && notExceededZ) {
            return {
                blockCoords : { x, y, z },
                chunkIndex : origChunk.index.clone(),
                exceededY : false
            };
        }
        let bx = (x % CHUNK_WIDTH_IN_BLOCKS);
        let bz = (z % CHUNK_WIDTH_IN_BLOCKS);
        if (x < 0) 
            bx = CHUNK_WIDTH_IN_BLOCKS + bx;
        if (z < 0)
            bz = CHUNK_WIDTH_IN_BLOCKS + bz;
        let chunkIndex = this.getChunkIndexByBlockCoords(origChunk, x, z);
        return {
            blockCoords : { x : bx, y, z : bz },
            chunkIndex,
            exceededY : !notExceededY
        };
    }
    static getChunkAndInChunkBlockCoordsByBlockCoords(origChunk, x, y, z) {
        let { blockCoords, chunkIndex, exceededY } = this.getChunkIndexAndInChunkBlockCoordsByBlockCoords(origChunk, x, y, z);
        let chunk = null;
        if (exceededY)
            return { chunk, chunkIndex, blockCoords, exceededY };
        if (origChunk.index.equals(chunkIndex))
            chunk = origChunk;
        else 
            chunk = this.getChunkByIndex(origChunk.terrain, chunkIndex);
        return { chunk, chunkIndex, blockCoords, exceededY };
    }
    static getBlockByInChunkCoords(origChunk, x, y, z) {
        let { chunk, chunkIndex, blockCoords, exceededY } = this.getChunkAndInChunkBlockCoordsByBlockCoords(origChunk, x, y, z);
        if (exceededY)
            return 0;
        if (chunk === null)
            return 1;
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        return chunk.blocks[blockIndex];
    }
}

export { 
    CHUNK_WIDTH_IN_BLOCKS,
    CHUNK_HEIGHT_IN_BLOCKS,
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    TOTAL_BLOCKS_PER_CHUNK,
    BlockAccess 
};