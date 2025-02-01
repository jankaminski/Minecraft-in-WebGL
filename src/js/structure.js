import { VoxelBox } from "./voxel-box.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { Chunk, CHUNK_WIDTH_IN_BLOCKS } from "./chunk.js";
import { BlockUtils } from "./block-access-utils.js";

class StructureTemplate extends VoxelBox {
    constructor(jsonData) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z)
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
        this.noOfBlocks = Vec3.xyzScalarProduct(this.sizeInVoxels);
    }
}

class Structure {
    constructor(template, position, rootChunk) {
        this.template = template;
        this.position = position;
        this.rootChunk = rootChunk;
        this.min = Vec3.sub(Vec3.sub(position, template.root), 
            { x : rootChunk.index.x * CHUNK_WIDTH_IN_BLOCKS, y : 0, z: rootChunk.index.z * CHUNK_WIDTH_IN_BLOCKS });
        this.max = Vec3.add(this.min, template.size);
        this.collidingChunkIndices = [];
        this.collidingChunks = [];
        //this.chunksLoaded = [];
        this.acquireCollidingChunkIndices();
        for (let i = 0; i < this.collidingChunkIndices.length; i++) {
            let collIndex = this.collidingChunkIndices[i];
            let collChunk = BlockUtils.getChunkByIndex(rootChunk.terrain, collIndex);
            this.collidingChunks.push(collChunk);
            if (collChunk !== null) {
                collChunk.loadStructure(this);
                collChunk.setToRefresh(true);
            }
        }
    }
    equals(structure) {
        let posEq = Vec3.compare(structure.position, this.position);
        let temEq = structure.template == this.template;
        let chuEq = structure.rootChunk == this.rootChunk;
        return posEq && temEq && chuEq;
    }
    acquireCollidingChunkIndices() {
        for (let x = this.min.x; x <= this.max.x; x++) {
            for (let y = this.min.y; y <= this.max.y; y++) {
                for (let z = this.min.z; z <= this.max.z; z++) {
                    let chunkIndex = BlockUtils.getChunkIndexByBlockCoords(this.rootChunk, x, z);
                    let checks = [];
                    for (let index of this.collidingChunkIndices) {
                        checks.push(index.equals(chunkIndex));
                    }
                    if (checks.every((value) => value === false)) {
                        this.collidingChunkIndices.push(chunkIndex);
                        //this.chunksLoaded.push(false);
                    }
                }
            }
        }
    }
    reload() {
        for (let i = 0; i < this.collidingChunkIndices.length; i++) {
            //if (this.chunksLoaded[i])
            //    continue;
            let chunk = this.collidingChunks[i];
            let index = this.collidingChunkIndices[i];
            if (chunk === null)
                chunk = BlockUtils.getChunkByIndex(this.rootChunk.terrain, index);
            if (chunk === null) {
                //this.chunksLoaded[i] = false;
                continue;
            }
            chunk.loadStructure(this);
            chunk.setToRefresh(true);
            //this.chunksLoaded[i] = true;
        }
    }
}

async function loadStructureFromFile(url) {
    const data = await loadMeshDataFromJSON(url);
    return new StructureTemplate(data);
}

/*function getChunkIndex(index, x, z) {
    let chunkXOffset = Math.trunc(x / CHUNK_WIDTH_IN_BLOCKS);
    let chunkZOffset = Math.trunc(z / CHUNK_WIDTH_IN_BLOCKS);
    if (x < 0) {
        chunkXOffset--;
    }
    if (z < 0) {
        chunkZOffset--;
    }
    return { x : index.x + chunkXOffset, z : index.z + chunkZOffset };
}*/

function getCollidingChunkIndices(structure, checkingChunkIndex) {
    let collidedChunkIndices = [];
    let min = Vec3.sub(Vec3.sub(structure.position, structure.template.root), { x : checkingChunkIndex.x * CHUNK_WIDTH_IN_BLOCKS, y : 0, z: checkingChunkIndex.z * CHUNK_WIDTH_IN_BLOCKS });
    let max = Vec3.add(min, structure.template.size);
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                let chunkIndex = BlockUtils.getChunkIndexByBlockCoords(checkingChunkIndex, x, z);
                let checks = [];
                for (let index of collidedChunkIndices) {
                    checks.push(index.equals(chunkIndex));
                }
                if (checks.every((value) => value === false)) 
                    collidedChunkIndices.push(chunkIndex);
            }
        }
    }
    return collidedChunkIndices;
}

const OAK_TREE = await loadStructureFromFile("./res/structures/oak-tree.json");
const HUGE_BOX = await loadStructureFromFile("./res/structures/huge-box.json");

export {
    StructureTemplate,
    Structure,
    getCollidingChunkIndices,
    OAK_TREE,
    HUGE_BOX
};