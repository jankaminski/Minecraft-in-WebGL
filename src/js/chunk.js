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
    OAK_TREE, 
    Structure 
} from "./structure.js";
import { 
    BLOCK_TEX_ATLAS_COLUMNS, 
    BLOCK_TEX_ATLAS_ROWS, 
    BLOCK_TEXTURE_ATLAS 
} from "./textures.js";

const CHUNK_HEIGHT_IN_BLOCKS = 128;
const CHUNK_WIDTH_IN_BLOCKS = 16;

const CHUNK_HEIGHT = CHUNK_HEIGHT_IN_BLOCKS * BLOCK_SIZE;
const CHUNK_WIDTH = CHUNK_WIDTH_IN_BLOCKS * BLOCK_SIZE;
const TOTAL_BLOCKS_PER_CHUNK = CHUNK_WIDTH_IN_BLOCKS * CHUNK_HEIGHT_IN_BLOCKS * CHUNK_WIDTH_IN_BLOCKS;

const FACES_IN_CUBE = 6; // oh really? 

const INDICES_TEMPLATE = [
    3, 1, 0, 0, 2, 3
];

class Chunk extends VoxelBox {
    constructor(terrain, indexX, indexZ) {
        super(CHUNK_WIDTH_IN_BLOCKS, CHUNK_HEIGHT_IN_BLOCKS, CHUNK_WIDTH_IN_BLOCKS);
        this.terrain = terrain;
        this.blocks = [];
        this.index = { x: indexX, z : indexZ };
        this.toDelete = false;
        this.model = null;
        this.toRefresh = false;
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++)
            this.blocks.push(Block.AIR);
        this.generateTerrain(terrain.getGenerator());
        this.entitiesForCollision = [];
        this.isHighlighted = false;
        this.highlightedBlockIndex = -1;
        this.blockBreakProgress = 0.0;
        this.structures = [];
        this.generateStructures(terrain.getGenerator());
    }
    keepLoadingStructureIfNeeded() {
        for (let structure of this.structures) {
            if (structure.finished)
                continue;
            this.distributeStructure(structure);
        }
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
        let ix = this.index.x + xOffset;
        let iz = this.index.z + zOffset;
        return this.terrain.getChunkByIndex({x : ix, z : iz});
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
            if (y < height) {
                this.setBlockByInChunkCoords(x, y, z, Block.DIRT);
                this.setBlockByInChunkCoords(x, y + 1, z, Block.GRASS);
            }
        }
    }
    generateStructures(generator) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            let height = 40 + generator.evalHeight(this.index, x, z);
            if ((x === 0) && (z === 0) && y > height + 1 && y < height + 2) {
                let oak = new Structure(OAK_TREE, Vec3.make(x, y, z), this);
                this.structures.push(oak);
                this.loadStructure(oak, Vec3.make(x, y, z));
            }
        }
    }
    getWorldPositionArray() { 
        let position = [
            this.index.x * CHUNK_WIDTH,
            0,
            this.index.z * CHUNK_WIDTH
        ];
        return position;
    }
    acquireModel(gl) {
        this.model = new Model(makeChunkMesh(gl, this), BLOCK_TEXTURE_ATLAS);
    }
    getBlockByIndex(index) {
        return this.blocks[index];
    }
    worldCoordsFromInChunkCoords(x, y, z) {
        let worldX = this.index.x * CHUNK_WIDTH + x * BLOCK_SIZE + (BLOCK_SIZE / 2);
        let worldY = y * BLOCK_SIZE;
        let worldZ = this.index.z * CHUNK_WIDTH + z * BLOCK_SIZE + (BLOCK_SIZE / 2);
        return { worldX, worldY, worldZ };
    }
    coordsInsideChunk(x, y, z) {
        if (x < CHUNK_WIDTH_IN_BLOCKS && 
                y < CHUNK_HEIGHT_IN_BLOCKS && 
                z < CHUNK_WIDTH_IN_BLOCKS && 
                x >= 0 && 
                y >= 0 && 
                z >= 0)
            return true;
        else
            return false;
    }
    getBlockByInChunkCoords(x, y, z, forceLoad) {
        if (this.coordsInsideChunk(x, y, z)) {
            let index = this.makeIndexFromVoxelCoords(x, y, z);
            return this.blocks[index];
        }
        if (!forceLoad) 
            return 1;
        let { worldX, worldY, worldZ } = this.worldCoordsFromInChunkCoords(x, y, z);
        let block = this.terrain.getBlockByWorldCoords(worldX, worldY, worldZ, forceLoad);
        if (block === null)
            return 1;
        return block.id;
    }
    setBlockByIndex(index, newBlockID) {
        this.blocks[index] = newBlockID;
    }
    getChunkIndexAndBlockCoordsFromExceedingInChunkCoords(x, y, z) {
        if (this.coordsInsideChunk(x, y, z)) {
            return {
                blockCoords : { x, y, z },
                chunkIndex : { x : this.index.x, z : this.index.z },
                exceeded : false
            };
        }
        let bx = (x % CHUNK_WIDTH_IN_BLOCKS);
        let bz = (z % CHUNK_WIDTH_IN_BLOCKS);
        let chunkXOffset = (x - bx) / CHUNK_WIDTH_IN_BLOCKS;
        let chunkZOffset = (z - bz) / CHUNK_WIDTH_IN_BLOCKS;
        if (x < 0) {
            chunkXOffset--;
            bx = CHUNK_WIDTH_IN_BLOCKS + bx;
        }
        if (z < 0) {
            chunkZOffset--;
            bz = CHUNK_WIDTH_IN_BLOCKS + bz;
        }
        return {
            blockCoords : { x : bx, y, z : bz },
            chunkIndex : { x : this.index.x + chunkXOffset, z : this.index.z + chunkZOffset },
            exceeded : true
        };
    }
    setBlockByInChunkCoords(x, y, z, block) {
        if (this.coordsInsideChunk(x, y, z)) {
            let index = this.makeIndexFromVoxelCoords(x, y, z);
            this.blocks[index] = block;
        }
        let { blockCoords, chunkIndex } = this.getChunkIndexAndBlockCoordsFromExceedingInChunkCoords(x, y, z);
        let otherChunk = this.terrain.getChunkByIndex(chunkIndex);
        if (otherChunk === null)
            return;
        let blockIndex = otherChunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        otherChunk.blocks[blockIndex] = block;
        otherChunk.setToRefresh(true);
    }
    loadStructure(structure, relativeRoot) {
        let template = structure.template;
        let min = Vec3.sub(relativeRoot, template.root);
        let size = template.size;
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                for (let z = 0; z < size.z; z++) {
                    let xx = min.x + x;
                    let yy = min.y + y;
                    let zz = min.z + z;
                    let i = template.makeIndexFromVoxelCoords(x, size.y - y - 1, z);
                    let block = template.blocks[i];
                    if (this.coordsInsideChunk(xx, yy, zz) && block !== 0) {
                        let index = this.makeIndexFromVoxelCoords(xx, yy, zz);
                        this.blocks[index] = block;
                    }
                }
            }
        }
    }
    distributeStructure(structure) {
        let checks = [];
        for (let chunkIndex of structure.occupiedChunkIndices) {
            let chunk = this.terrain.getChunkByIndex(chunkIndex);
            if (chunk === null) {
                checks.push(false);
                continue;
            }
            let rootOffsetX = (this.index.x - chunkIndex.x) * CHUNK_WIDTH_IN_BLOCKS;
            let rootOffsetZ = (this.index.z - chunkIndex.z) * CHUNK_WIDTH_IN_BLOCKS;
            let relativeRoot = Vec3.add(structure.rootPosition, Vec3.make(rootOffsetX, 0, rootOffsetZ));
            chunk.loadStructure(structure, relativeRoot);
            chunk.setToRefresh(true);
            checks.push(true);
        }
        if (checks.every((value) => value === true)) 
            structure.finished = true;
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
            neighbors[0] = chunk.getBlockByInChunkCoords(x + 1, y, z, true);
            neighbors[1] = chunk.getBlockByInChunkCoords(x - 1, y, z, true);
            neighbors[2] = chunk.getBlockByInChunkCoords(x, y + 1, z, true);
            neighbors[3] = chunk.getBlockByInChunkCoords(x, y - 1, z, true);
            neighbors[4] = chunk.getBlockByInChunkCoords(x, y, z + 1, true);
            neighbors[5] = chunk.getBlockByInChunkCoords(x, y, z - 1, true);
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

function makeChunkMesh(gl, chunk) {
    let chunkVertexBuffer = new ChunkVertexBuffer(chunk);
    let vertices = chunkVertexBuffer.vertices;
    let indices = chunkVertexBuffer.indices;
    let attr = makeAttrPtr(0, 3, 3, 0);
    let mesh = new Mesh(gl, vertices, indices, attr);
    return mesh;
}

async function makeChunkShaderProgram(gl, projectionMatrix) {
    let terrainProgram = await loadShaderProgramFromFiles(gl, "./src/shaders/terrain-vert.glsl", "./src/shaders/terrain-frag.glsl");
    terrainProgram.turnOn(gl);
    terrainProgram.loadMatrix(gl, "mProj", projectionMatrix);
    terrainProgram.loadInt(gl, "BLOCK_SIZE", BLOCK_SIZE);
    terrainProgram.loadInt(gl, "CHUNK_HEIGHT_IN_BLOCKS", CHUNK_HEIGHT_IN_BLOCKS);
    terrainProgram.loadInt(gl, "CHUNK_WIDTH_IN_BLOCKS", CHUNK_WIDTH_IN_BLOCKS);
    terrainProgram.loadFloat(gl, "texAtlasNoOfRows", BLOCK_TEX_ATLAS_ROWS);
    terrainProgram.loadFloat(gl, "texAtlasNoOfColumns", BLOCK_TEX_ATLAS_COLUMNS);
    terrainProgram.turnOff(gl);
    return terrainProgram;
}

export { 
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    CHUNK_WIDTH_IN_BLOCKS,
    CHUNK_HEIGHT_IN_BLOCKS,
    Chunk,
    makeChunkShaderProgram 
};