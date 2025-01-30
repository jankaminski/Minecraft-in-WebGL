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
    HUGE_BOX,
    OAK_TREE, 
    //Structure, 
    StructureRoot
} from "./structure.js";
import { 
    BLOCK_TEX_ATLAS_COLUMNS, 
    BLOCK_TEX_ATLAS_ROWS, 
    BLOCK_TEXTURE_ATLAS 
} from "./textures.js";
import { areAll, arrayWithRemoved } from "./misc-utils.js";

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
        this.strucRoots = [];
        this.terrain.strucRoots = arrayWithRemoved(this.terrain.strucRoots, (root) => {
            if (root.chunkIndex.x === indexX && root.chunkIndex.z === indexZ) {
                //console.log("struc chop loaded");
                this.strucRoots.push(root);
                return true;
            }
            return false;
        });
        /*for (let root of this.terrain.strucRoots) {
            if (root.chunkIndex.x === indexX && root.chunkIndex.z === indexZ) {
                console.log("struc chop loaded");
                this.strucRoots.push(root);
            }
        }*/
        for (let root of this.strucRoots) {
            this.loadStructureRoot(root);
        }
        //this.generateStructures(terrain.getGenerator(), terrain.getStructureGenerators());
    }
    isOnEdge() {
        let neighbors = this.getNeighborChunks(1, 1);
        return !areAll(neighbors, (neighbor) => neighbor !== null);
    }
    /*keepLoadingStructureIfNeeded() {

        for (let root of this.strucRoots) {

        }

        for (let structure of this.structures) {
            if (structure.finished)
                continue;
            this.distributeStructure(structure);
        }
        if (this.isOnEdge())
            for (let s of this.structures)
                s.finished = false;
    }*/
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
            height = Math.trunc(height);
            if (y < height) {
                this.setBlockByInChunkCoords(x, y, z, Block.DIRT);
            }
            if (y === height - 1) {
                this.setBlockByInChunkCoords(x, y + 1, z, Block.GRASS);
            }
        }
    }
    /*generateStructures(terrainGenerator, generators) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            for (let generator of generators) {

                let terrHeight = Math.trunc(40 + terrainGenerator.evalHeight(this.index, x, z));

                let height = Math.trunc(generator.evalHeight(this.index, x, z));

                if (y === terrHeight && height > Math.trunc(generator.hillHeight) - 2) {

                    let strucRoot = new StructureRoot(generator.structureTemplate, Vec3.make(x, y, z), this);
                    this.strucRoots.push(strucRoot);
                    this.loadStructureRoot(strucRoot);

                    //let struc = new Structure(generator.structureTemplate, Vec3.make(x, y, z), this);
                    //this.terrain.structures.push(struc);
                    //this.loadStructure(struc, Vec3.make(x, y, z));
                }
            }
        }
    }*/
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
    worldCoordsFromInChunkCoords(x, y, z) {
        let worldX = this.index.x * CHUNK_WIDTH + x * BLOCK_SIZE + (BLOCK_SIZE / 2);
        let worldY = y * BLOCK_SIZE;
        let worldZ = this.index.z * CHUNK_WIDTH + z * BLOCK_SIZE + (BLOCK_SIZE / 2);
        return { worldX, worldY, worldZ };
    }
    coordsNotOutsideChunk(x, y, z) {
        let notExceededX = x < CHUNK_WIDTH_IN_BLOCKS && x >= 0;
        let notExceededY = y < CHUNK_HEIGHT_IN_BLOCKS && y >= 0;
        let notExceededZ = z < CHUNK_WIDTH_IN_BLOCKS && z >= 0;
        return { notExceededX, notExceededY, notExceededZ };
    }
    allCoordsInsideChunk(x, y, z) {
        let { notExceededX, notExceededY, notExceededZ } = this.coordsNotOutsideChunk(x, y, z);
        return notExceededX && notExceededY && notExceededZ;
    }
    getBlockByInChunkCoords(x, y, z, forceLoad) {
        let { chunk, chunkIndex, blockCoords, exceededY } = this.getChunkAndBlockCoordsByInChunkBlockCoords(x, y, z);
        if (exceededY)
            return 0;
        if (chunk === null) {
            if (!forceLoad)
                return 1;
            chunk = new Chunk(this.terrain, chunkIndex.x, chunkIndex.z);
            this.terrain.chunks.push(chunk);
        }
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        return chunk.blocks[blockIndex];
    }
    setBlockByIndex(index, newBlockID) {
        this.blocks[index] = newBlockID;
    }
    getChunkIndexByExceedingInChunkCoords(x, z) {
        let chunkXOffset = Math.trunc(x / CHUNK_WIDTH_IN_BLOCKS);
        let chunkZOffset = Math.trunc(z / CHUNK_WIDTH_IN_BLOCKS);
        if (x < 0) {
            chunkXOffset--;
        }
        if (z < 0) {
            chunkZOffset--;
        }
        return { x : this.index.x + chunkXOffset, z : this.index.z + chunkZOffset };
    }
    getChunkIndexAndBlockCoordsFromExceedingInChunkCoords(x, y, z) {
        let { notExceededX, notExceededY, notExceededZ } = this.coordsNotOutsideChunk(x, y, z);
        if (notExceededX && notExceededY && notExceededZ) {
            return {
                blockCoords : { x, y, z },
                chunkIndex : { x : this.index.x, z : this.index.z },
                exceededY : false, 
                exceeded : false
            };
        }
        let bx = (x % CHUNK_WIDTH_IN_BLOCKS);
        let bz = (z % CHUNK_WIDTH_IN_BLOCKS);
        let chunkXOffset = Math.trunc(x / CHUNK_WIDTH_IN_BLOCKS);
        let chunkZOffset = Math.trunc(z / CHUNK_WIDTH_IN_BLOCKS);
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
            exceededY : !notExceededY,
            exceeded : true
        };
    }
    getChunkAndBlockCoordsByInChunkBlockCoords(x, y, z) {
        let { blockCoords, chunkIndex, exceededY, exceeded } = this.getChunkIndexAndBlockCoordsFromExceedingInChunkCoords(x, y, z);
        let chunk = null;
        /*if (excceededY) {
            return { chunk, chunkIndex, blockCoords, excceededY };
        }*/
        if (chunkIndex.x === this.index.x && chunkIndex.z === this.index.z)
            chunk = this;
        else 
            chunk = this.terrain.getChunkByIndex(chunkIndex);
        return { chunk, chunkIndex, blockCoords, exceededY };
    }
    setBlockByInChunkCoords(x, y, z, block) {
        let { chunk, chunkIndex, blockCoords, exceededY } = this.getChunkAndBlockCoordsByInChunkBlockCoords(x, y, z);
        if (chunk === null)
            return;
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        chunk.blocks[blockIndex] = block;
        chunk.setToRefresh(true);
    }
    /*loadStructures() {
        for (let root of this.terrain.strucRoots) {
            if (root.chunkIndex.x === this.index.x && root.chunkIndex.z === this.index.z) {
                this.strucRoots.push(root);
            }
        }
        for (let root of this.strucRoots) {
            this.loadStructureRoot(root);
        }
    }*/
    loadStructureRoot(root) {
        let template = root.template;
        let min = Vec3.sub(root.position, template.root);
        let size = template.size;
        for (let i = 0; i < template.noOfBlocks; i++) {
            let { x, y, z } = template.makeVoxelCoordsFromIndex(i);
            y = size.y - y;
            let blockX = min.x + x;
            let blockY = min.y + y;
            let blockZ = min.z + z;
            let block = template.blocks[i];
            if (this.allCoordsInsideChunk(blockX, blockY, blockZ) && block !== 0) {
                let index = this.makeIndexFromVoxelCoords(blockX, blockY, blockZ);
                this.blocks[index] = block;
            }
        }
        //console.log("struc chop loaded");
    }
    /*loadStructure(structure, relativeRoot) {
        let template = structure.template;
        let min = Vec3.sub(relativeRoot, template.root);
        let size = template.size;

        for (let i = 0; i < template.noOfBlocks; i++) {
            let { x, y, z } = template.makeVoxelCoordsFromIndex(i);
            y = size.y - y;
            let blockX = min.x + x;
            let blockY = min.y + y;
            let blockZ = min.z + z;
            let block = template.blocks[i];
            if (this.allCoordsInsideChunk(blockX, blockY, blockZ) && block !== 0) {
                let index = this.makeIndexFromVoxelCoords(blockX, blockY, blockZ);
                this.blocks[index] = block;
            }
        }
    }
    distributeStructure(structure) {

        if (areAll(structure.occupiedChunkIndices, (chunkIndex) => {
            let chunk = this.terrain.getChunkByIndex(chunkIndex);
            if (chunk === null)
                return false;
            let rootOffsetX = (this.index.x - chunkIndex.x) * CHUNK_WIDTH_IN_BLOCKS;
            let rootOffsetZ = (this.index.z - chunkIndex.z) * CHUNK_WIDTH_IN_BLOCKS;
            let relativeRoot = Vec3.add(structure.rootPosition, Vec3.make(rootOffsetX, 0, rootOffsetZ));
            chunk.loadStructure(structure, relativeRoot);
            chunk.setToRefresh(true);
            return true;
        }))
            structure.finished = true;
    }*/
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
    makeChunkShaderProgram 
};