import { VoxelBox } from "./voxel-box.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { CHUNK_WIDTH_IN_BLOCKS } from "./chunk.js";
import { BlockAccess } from "./block-access.js";
import { areAll } from "./misc-utils.js";
class StructureTemplate extends VoxelBox {
    constructor(jsonData) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z);
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
        this.noOfBlocks = this.sizeInVoxels.xyzScalarProduct();
    }
}
class Structure {
    constructor(template, position, rootChunk) {
        this.template = template;
        this.position = position;
        this.rootChunk = rootChunk;
        this.min = this.getMin(rootChunk);
        this.max = this.min.withAdded(template.size);
        this.collidingChunkIndices = [];
        this.acquireCollidingChunkIndices();
        this.reload();
    }
    getMin(chunk) {
        let chunkMinInBlocks = new Vec3(chunk.index.x * CHUNK_WIDTH_IN_BLOCKS, 0, chunk.index.z * CHUNK_WIDTH_IN_BLOCKS);
        return this.position.subtractedWith(this.template.root).subtractedWith(chunkMinInBlocks);
    }
    equals(structure) {
        let posEq = structure.position.equals(this.position);
        let temEq = structure.template == this.template;
        let chuEq = structure.rootChunk == this.rootChunk;
        return posEq && temEq && chuEq;
    }
    acquireCollidingChunkIndices() {
        for (let i = 0; i < this.template.noOfBlocks; i++) {
            let coords = this.template.makeVoxelCoordsFromIndex(i);
            coords.x += this.min.x;
            coords.z += this.min.z;
            let chunkIndex = BlockAccess.getChunkIndexByBlockCoords(this.rootChunk, coords.x, coords.z);
            if (areAll(this.collidingChunkIndices, (index) => !index.equals(chunkIndex)))
                this.collidingChunkIndices.push(chunkIndex);
        }
    }
    reload() {
        for (let i = 0; i < this.collidingChunkIndices.length; i++) {
            let index = this.collidingChunkIndices[i];
            let chunk = BlockAccess.getChunkByIndex(this.rootChunk.terrain, index);
            if (chunk === null)
                continue;
            if (chunk.loadedStructures.includes(this))
                continue;
            chunk.loadStructure(this);
            chunk.acquireModel();
        }
    }
}
async function loadStructureFromFile(url) {
    const data = await loadMeshDataFromJSON(url);
    return new StructureTemplate(data);
}
const OAK_TREE = await loadStructureFromFile("./res/structures/oak-tree.json");
const HUGE_BOX = await loadStructureFromFile("./res/structures/huge-box.json");
export { StructureTemplate, Structure, OAK_TREE, HUGE_BOX };
