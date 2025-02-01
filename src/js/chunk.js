import { 
    Block,
    BLOCK_SIZE, 
    getBlockProperties
} from "./block.js";
import { VoxelBox } from "./voxel-box.js";
import { 
    Hitbox, 
    collided 
} from "./collision.js";
import { 
    makeAttrPtr,
    Mesh, 
    Model
} from "./model.js";
import { 
    loadShaderProgramFromFiles, 
    makeOneFaceIndices, 
    VERTICES_PER_FACE 
} from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { 
    getCollidingChunkIndices,
    HUGE_BOX,
    OAK_TREE, 
    Structure
} from "./structure.js";
import { 
    BLOCK_TEX_ATLAS_COLUMNS, 
    BLOCK_TEX_ATLAS_ROWS, 
    BLOCK_TEXTURE_ATLAS 
} from "./textures.js";
import { areAll, arrayWithRemoved } from "./misc-utils.js";
import { BlockUtils, CHUNK_HEIGHT, CHUNK_HEIGHT_IN_BLOCKS, CHUNK_WIDTH, CHUNK_WIDTH_IN_BLOCKS, TOTAL_BLOCKS_PER_CHUNK } from "./block-access-utils.js";

const FACES_IN_CUBE = 6; // oh really? 

const INDICES_TEMPLATE = [
    3, 1, 0, 0, 2, 3
];

class ChunkIndex {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
    equals(index) {
        return this.x === index.x && this.z === index.z;
    }
    clone() {
        return new ChunkIndex(this.x, this.z);
    }
    offset(x, z) {
        this.x += x;
        this.z += z;
        return this;
    }
}

class Chunk extends VoxelBox {
    constructor(terrain, indexX, indexZ) {
        super(CHUNK_WIDTH_IN_BLOCKS, CHUNK_HEIGHT_IN_BLOCKS, CHUNK_WIDTH_IN_BLOCKS);
        this.terrain = terrain;
        this.blocks = [];
        this.modifiedBlocks = [];
        this.index = new ChunkIndex(indexX, indexZ);
        this.toDelete = false;
        this.model = null;
        this.toRefresh = false;
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            this.blocks.push(Block.AIR);
            this.modifiedBlocks.push(false);
        }
        this.terrainHeightMap = [];
        this.generateTerrain(terrain.getGenerator());
        this.entitiesForCollision = [];
        this.isHighlighted = false;
        this.highlightedBlockIndex = -1;
        this.blockBreakProgress = 0.0;
        //this.structures = [];
        this.generateStructures(terrain.getStructureGenerators());
    }
    isOnEdge() {
        let neighbors = this.getNeighborChunks(1, 1);
        return !areAll(neighbors, (neighbor) => neighbor !== null);
    }
    loadBlockUpdateData(index, breakProgress) {
        this.highlightedBlockIndex = index;
        this.isHighlighted = true;
        this.blockBreakProgress = breakProgress;
    }
    setToRefresh(toRefresh) {
        this.toRefresh = toRefresh;
    }
    isToRefresh() {
        return this.toRefresh;
    }
    getWorldMinPosition() {
        let wpArray = this.getWorldPositionArray();
        let min = { x : wpArray[0], y : 0, z : wpArray[2] };
        return min;
    }
    getWorldBounds() {
        let min = this.getWorldMinPosition();
        let max = { x : min.x + CHUNK_WIDTH, y : CHUNK_HEIGHT, z : min.z + CHUNK_WIDTH };
        return { 
            min, 
            max,
            getMinX : () => min.x,
            getMinY : () => min.y,
            getMinZ : () => min.z,
            getMaxX : () => max.x,
            getMaxY : () => max.y,
            getMaxZ : () => max.z
        };
    }
    updateEntities(level) {
        this.entitiesForCollision = [];
        for (let entity of level.entities) {
            let entityHitbox = new Hitbox(entity);
            if (collided(entityHitbox, this.getWorldBounds()))
                this.entitiesForCollision.push(entity);
        }
    }
    getNearbyChunk(xOffset, zOffset) {
        let indexX = this.index.x + xOffset;
        let indexZ = this.index.z + zOffset;
        return BlockUtils.getChunkByIndex(this.terrain, new ChunkIndex(indexX, indexZ));
    }
    getNeighborChunks(xRadius, zRadius) {
        let fetchedChunks = [];
        for (let x = -xRadius; x <= xRadius; x++)
            for (let z = -zRadius; z <= zRadius; z++)
                fetchedChunks.push(this.getNearbyChunk(x, z));
        return fetchedChunks;
    }
    hasNeighbors() {
        let fetchedChunks = [];
        for (let x = -1; x <= 1; x++)
            for (let z = -1; z <= 1; z++)
                fetchedChunks.push(this.getNearbyChunk(x, z) !== null);
        if (fetchedChunks.every((value) => value === true)) 
            return true;
        return false;
    }
    generateTerrain(generator) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            let height = 40 + generator.evalHeight(this.index, x, z);
            height = Math.trunc(height);
            this.terrainHeightMap[i] = height;
            if (y < height) {
                this.setBlockByInChunkCoords(x, y, z, Block.DIRT);
            }
            if (y === height) {
                this.setBlockByInChunkCoords(x, y, z, Block.GRASS);
            }
        }
    }
    generateStructures(generators) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            for (let generator of generators) {
                let terrHeight = this.terrainHeightMap[i];
                let height = Math.trunc(generator.evalHeight(this.index, x, z));
                if (y === terrHeight && height > Math.trunc(generator.hillHeight) - 2) {
                    let xx = x + this.index.x * CHUNK_WIDTH_IN_BLOCKS;
                    let zz = z + this.index.z * CHUNK_WIDTH_IN_BLOCKS;
                    let position = Vec3.make(xx, y, zz);

                    /*for (let s of this.terrain.structures) {
                        let posEq = Vec3.compare(position, s.position);
                        let temEq = generator.structureTemplate == s.template;
                        let chuEq = this == s.rootChunk;

                        if (posEq && temEq && chuEq)
                            continue;
                        else {
                            console.log("New structure rooted in chunk " + this.index.x + " " + this.index.z);
                            let structure = new Structure(generator.structureTemplate, position, this);
                            this.terrain.structures.push(structure);
                            break;
                        }
                    }*/

                    let structure = new Structure(generator.structureTemplate, position, this);
                    this.terrain.structures.push(structure);
                }
            }
        }
        /*for (let structure of this.structures) {
            this.loadStructure(structure);
        }*/
    }
    reloadStructures() {
        
    }
    getWorldPositionArray() { 
        let position = [
            this.index.x * CHUNK_WIDTH,
            0,
            this.index.z * CHUNK_WIDTH
        ];
        return position;
    }
    acquireModel() {
        this.model = new Model(makeChunkMesh(this), BLOCK_TEXTURE_ATLAS);
    }
    getBlockByIndex(index) {
        return this.blocks[index];
    }
    setBlockByIndex(index, newBlockID) {
        this.blocks[index] = newBlockID;
    }
    setBlockByInChunkCoords(x, y, z, block) {
        let { chunk, chunkIndex, blockCoords, exceededY } = BlockUtils.getChunkAndInChunkBlockCoordsByBlockCoords(this, x, y, z);
        if (chunk === null)
            return;
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        chunk.blocks[blockIndex] = block;
        chunk.setToRefresh(true);
    }
    getBlockByInChunkCoords(x, y, z) {
        let { chunk, chunkIndex, blockCoords, exceededY } = BlockUtils.getChunkAndInChunkBlockCoordsByBlockCoords(this, x, y, z);
        if (exceededY)
            return 0;
        if (chunk === null) {
            return 1;
        }
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        return chunk.blocks[blockIndex];
    }
    loadStructure(structure) {
        let template = structure.template;
        let min = Vec3.sub(Vec3.sub(structure.position, template.root), 
            { x : this.index.x * CHUNK_WIDTH_IN_BLOCKS, y : 0, z: this.index.z * CHUNK_WIDTH_IN_BLOCKS });
        let size = template.size;
        for (let i = 0; i < template.noOfBlocks; i++) {
            let { x, y, z } = template.makeVoxelCoordsFromIndex(i);
            y = size.y - y;
            let blockX = min.x + x;
            let blockY = min.y + y;
            let blockZ = min.z + z;
            let block = template.blocks[i];
            if (BlockUtils.allCoordsInsideChunk(blockX, blockY, blockZ) && block !== 0) {
                let index = this.makeIndexFromVoxelCoords(blockX, blockY, blockZ);
                if (!this.modifiedBlocks[index])
                    this.blocks[index] = block;
            }
        }
    }
}

class ChunkVertexBuffer {
    constructor(chunk) {
        let verticesAndIndices = this.makeVerticesAndIndices(chunk);
        this.vertices = verticesAndIndices.vertices;
        this.indices = verticesAndIndices.indices;
    }
    makeOneFaceVertices(faceIndex, blockIndex, thisBlockID) {
        let vertices = [];
        for (let i = 0; i < VERTICES_PER_FACE; i++) {
            let vertexIndex = faceIndex * VERTICES_PER_FACE + i;
            vertices.push(vertexIndex, blockIndex, thisBlockID);
        }
        return vertices;
    }
    makeVerticesAndIndices(chunk) {
        let vertices = [];
        let indices = [];
        for (let blockIndex = 0; blockIndex < TOTAL_BLOCKS_PER_CHUNK; blockIndex++) {
            let thisBlockID = chunk.getBlockByIndex(blockIndex);
            let neighbors = [];
            let { x, y, z } = chunk.makeVoxelCoordsFromIndex(blockIndex);
            neighbors[0] = chunk.getBlockByInChunkCoords(x + 1, y, z);
            neighbors[1] = chunk.getBlockByInChunkCoords(x - 1, y, z);
            neighbors[2] = chunk.getBlockByInChunkCoords(x, y + 1, z);
            neighbors[3] = chunk.getBlockByInChunkCoords(x, y - 1, z);
            neighbors[4] = chunk.getBlockByInChunkCoords(x, y, z + 1);
            neighbors[5] = chunk.getBlockByInChunkCoords(x, y, z - 1);
            for (let faceIndex = 0; faceIndex < FACES_IN_CUBE; faceIndex++) { 
                let thisBlockProperties = getBlockProperties(thisBlockID);
                let neighborProperties = getBlockProperties(neighbors[faceIndex]);
                if (thisBlockProperties.transparent || !neighborProperties.transparent) 
                    continue;
                vertices = vertices.concat(this.makeOneFaceVertices(faceIndex, blockIndex, thisBlockID));
                indices = indices.concat(makeOneFaceIndices(indices.length, INDICES_TEMPLATE));
            }
        }
        return { vertices, indices };
    }
}

function makeChunkMesh(chunk) {
    let chunkVertexBuffer = new ChunkVertexBuffer(chunk);
    let vertices = chunkVertexBuffer.vertices;
    let indices = chunkVertexBuffer.indices;
    let attr = makeAttrPtr(0, 3, 3, 0);
    let mesh = new Mesh(vertices, indices, attr);
    return mesh;
}

async function makeChunkShaderProgram(projectionMatrix) {
    let terrainProgram = await loadShaderProgramFromFiles("./src/shaders/terrain-vert.glsl", "./src/shaders/terrain-frag.glsl");
    terrainProgram.turnOn();
    terrainProgram.loadMatrix("mProj", projectionMatrix);
    terrainProgram.loadInt("BLOCK_SIZE", BLOCK_SIZE);
    terrainProgram.loadInt("CHUNK_HEIGHT_IN_BLOCKS", CHUNK_HEIGHT_IN_BLOCKS);
    terrainProgram.loadInt("CHUNK_WIDTH_IN_BLOCKS", CHUNK_WIDTH_IN_BLOCKS);
    terrainProgram.loadFloat("texAtlasNoOfRows", BLOCK_TEX_ATLAS_ROWS);
    terrainProgram.loadFloat("texAtlasNoOfColumns", BLOCK_TEX_ATLAS_COLUMNS);
    terrainProgram.turnOff();
    return terrainProgram;
}

export { 
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    CHUNK_WIDTH_IN_BLOCKS,
    CHUNK_HEIGHT_IN_BLOCKS,
    Chunk,
    ChunkIndex,
    makeChunkShaderProgram 
};