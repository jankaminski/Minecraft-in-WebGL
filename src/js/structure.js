import { VoxelBox } from "./voxel-box.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { Vec3 } from "./math-utils.js";

class StructureTemplate extends VoxelBox {
    constructor(jsonData) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z)
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
    }
}

class Structure {
    constructor(template, rootPosition, rootChunk) {
        this.template = template;
        this.rootPosition = rootPosition;
        this.finished = false;
        this.occupiedChunkIndices = this.getCollidedChunkIndices(rootChunk);
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
}

async function loadStructureFromFile(url) {
    const data = await loadMeshDataFromJSON(url);
    return new StructureTemplate(data);
}

const OAK_TREE = await loadStructureFromFile("../res/structures/oak-tree.json");
const HUGE_BOX = await loadStructureFromFile("../res/structures/huge-box.json");

export {
    StructureTemplate,
    Structure,
    OAK_TREE,
    HUGE_BOX
};