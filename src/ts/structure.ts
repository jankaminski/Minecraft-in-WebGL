import { VoxelBox } from "./voxel-box.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { Chunk, CHUNK_WIDTH_IN_BLOCKS, ChunkIndex } from "./chunk.js";
import { BlockAccess } from "./block-access.js";
import { areAll } from "./misc-utils.js";

class StructureTemplate extends VoxelBox {
    blocks: number[];
    size: Vec3;
    root: Vec3;
    noOfBlocks: number;
    constructor(jsonData: any) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z)
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
        this.noOfBlocks = this.sizeInVoxels.xyzScalarProduct();
    }
}

class Structure {
    template: StructureTemplate;
    position: Vec3;
    rootChunk: Chunk;
    min: Vec3;
    max: Vec3;
    collidingChunkIndices: ChunkIndex[];
    constructor(template: StructureTemplate, position: Vec3, rootChunk: Chunk) {
        this.template = template;
        this.position = position;
        this.rootChunk = rootChunk;
        this.min = this.getMin(rootChunk);
        this.max = this.min.withAdded(template.size);
        this.collidingChunkIndices = [];
        this.acquireCollidingChunkIndices();
        this.reload();
    }
    getMin(chunk: Chunk) {
        let chunkMinInBlocks = new Vec3( 
            chunk.index.x * CHUNK_WIDTH_IN_BLOCKS, 
            0, 
            chunk.index.z * CHUNK_WIDTH_IN_BLOCKS
        );
        return this.position.subtractedWith(this.template.root).subtractedWith(chunkMinInBlocks);
    }
    equals(structure: Structure) {
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

async function loadStructureFromFile(url: string) {
    const data = await loadMeshDataFromJSON(url);
    return new StructureTemplate(data);
}

const OAK_TREE = await loadStructureFromFile("./res/structures/oak-tree.json");
const HUGE_BOX = await loadStructureFromFile("./res/structures/huge-box.json");

export {
    StructureTemplate,
    Structure,
    OAK_TREE,
    HUGE_BOX
};