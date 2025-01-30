import { VoxelBox } from "./voxel-box.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { CHUNK_WIDTH_IN_BLOCKS } from "./chunk.js";

class StructureTemplate extends VoxelBox {
    constructor(jsonData) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z)
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
        this.noOfBlocks = Vec3.xyzScalarProduct(this.sizeInVoxels);
    }
}

class StructureRoot {
    constructor(template, position, chunkIndex) {
        this.template = template;
        this.position = position;
        this.chunkIndex = chunkIndex;
    }
}

/*class Structure {
    constructor(terrain, template, rootPosition, rootChunk) {
        this.terrain = terrain;
        this.template = template;
        this.rootPosition = rootPosition;
        this.finished = false;
        this.occupiedChunkIndices = this.getCollidedChunkIndices(rootChunk);
        this.occupiedChunks = [];
    }
    getCollidedChunkIndices(rootChunk) {
        let collidedChunkIndices = [rootChunk.index];
        let min = Vec3.sub(this.rootPosition, this.template.root);
        let max = Vec3.add(min, this.template.size);
        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                for (let z = min.z; z <= max.z; z++) {
                    let { 
                        chunkIndex, 
                        blockCoords, 
                        exceededY,
                        exceeded  
                    } = rootChunk.getChunkIndexAndBlockCoordsFromExceedingInChunkCoords(x, y, z);
                    if (exceeded) {
                        let checks = [];
                        for (let index of collidedChunkIndices) {
                            checks.push(index.x === chunkIndex.x && index.z === chunkIndex.z);
                        }
                        if (checks.every((value) => value === false)) 
                            collidedChunkIndices.push(chunkIndex);
                    }
                }
            }
        }
        return collidedChunkIndices;
    }
    update() {
        for (let index of this.occupiedChunkIndices) {
            let chunk = this.terrain.getChunkByIndex(index);
            if (chunk === null) {
                this.finished = false;
                return;
            }
        }
        this.finished = true;
    }
}*/

async function loadStructureFromFile(url) {
    const data = await loadMeshDataFromJSON(url);
    return new StructureTemplate(data);
}

function getChunkIndex(index, x, z) {
    let chunkXOffset = Math.trunc(x / CHUNK_WIDTH_IN_BLOCKS);
    let chunkZOffset = Math.trunc(z / CHUNK_WIDTH_IN_BLOCKS);
    if (x < 0) {
        chunkXOffset--;
    }
    if (z < 0) {
        chunkZOffset--;
    }
    return { x : index.x + chunkXOffset, z : index.z + chunkZOffset };
}

function getCollidingChunkIndices(root) {
    let collidedChunkIndices = [];
    let min = Vec3.sub(Vec3.sub(root.position, root.template.root), { x : root.chunkIndex.x * CHUNK_WIDTH_IN_BLOCKS, y : 0, z: root.chunkIndex.z * CHUNK_WIDTH_IN_BLOCKS });
    let max = Vec3.add(min, root.template.size);
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                let chunkIndex = getChunkIndex(root.chunkIndex, x, z);
                let checks = [];
                for (let index of collidedChunkIndices) {
                    checks.push(index.x === chunkIndex.x && index.z === chunkIndex.z);
                }
                if (checks.every((value) => value === false)) 
                    collidedChunkIndices.push(chunkIndex);
            }
        }
    }
    return collidedChunkIndices;
}
/*function getCollidingChunks(root, chunk) {
    let collidedChunkIndices = [];
    let min = Vec3.sub(root.position, root.template.root);
    let max = Vec3.add(min, this.template.size);
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                let chunkIndex = chunk.getChunkIndexByExceedingInChunkCoords(x, z);
                let checks = [];
                for (let index of collidedChunkIndices) {
                    checks.push(index.x === chunkIndex.x && index.z === chunkIndex.z);
                }
                if (checks.every((value) => value === false)) 
                    collidedChunkIndices.push(chunkIndex);
            }
        }
    }
    return collidedChunkIndices;
}*/

const OAK_TREE = await loadStructureFromFile("./res/structures/oak-tree.json");
const HUGE_BOX = await loadStructureFromFile("./res/structures/huge-box.json");

export {
    StructureTemplate,
    StructureRoot,
    //Structure,
    //getCollidingChunks,
    getCollidingChunkIndices,
    OAK_TREE,
    HUGE_BOX
};