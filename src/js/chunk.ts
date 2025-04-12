import { 
    Block,
    BLOCK_SIZE, 
    getBlockProperties
} from "./block.js";
import { VoxelBox } from "./voxel-box.js";
import { 
    Hitbox, 
    collided,
    Collidable 
} from "./collision.js";
import { 
    VertexAttribute,
    makeOneFaceIndices,
    Mesh, 
    Model,
    VERTICES_PER_FACE
} from "./model.js";
import { 
    loadShaderProgramFromFiles
} from "./res-utils.js";
import { Vec3 } from "./math-utils.js";
import { Structure } from "./structure.js";
import { 
    BLOCK_TEX_ATLAS_COLUMNS, 
    BLOCK_TEX_ATLAS_ROWS, 
    BLOCK_TEXTURE_ATLAS 
} from "./textures.js";
import { 
    BlockAccess, 
    CHUNK_HEIGHT, 
    CHUNK_HEIGHT_IN_BLOCKS, 
    CHUNK_WIDTH, 
    CHUNK_WIDTH_IN_BLOCKS, 
    TOTAL_BLOCKS_PER_CHUNK 
} from "./block-access.js";
import { Generator, StructureGenerator, Terrain } from "./terrain.js";
import { Entity } from "./entity.js";
import { Level } from "./level.js";

const FACES_IN_CUBE = 6; // oh really? 

const INDICES_TEMPLATE = [
    3, 1, 0, 0, 2, 3
];

class ChunkIndex {
    x: number;
    z: number;
    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }
    equals(index: ChunkIndex) {
        return this.x === index.x && this.z === index.z;
    }
    clone() {
        return new ChunkIndex(this.x, this.z);
    }
    offset(x: number, z: number) {
        this.x += x;
        this.z += z;
        return this;
    }
}

class Chunk extends VoxelBox implements Collidable {
    terrain: Terrain;
    blocks: number[];
    modifiedBlocks: boolean[];
    index: ChunkIndex;
    toDelete: boolean;
    model: Model | null;
    toRefresh: boolean;
    terrainHeightMap: number[];
    entitiesForCollision: Entity[];
    isHighlighted: boolean;
    highlightedBlockIndex: number;
    blockBreakProgress: number;
    loadedStructures: Structure[];
    constructor(terrain: Terrain, index: ChunkIndex) {
        super(CHUNK_WIDTH_IN_BLOCKS, CHUNK_HEIGHT_IN_BLOCKS, CHUNK_WIDTH_IN_BLOCKS);
        this.terrain = terrain;
        this.blocks = [];
        this.modifiedBlocks = [];
        this.index = index.clone();
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
        this.loadedStructures = [];
        this.generateStructures(terrain.getStructureGenerators());
    }
    loadBlockUpdateData(index: number, breakProgress: number) {
        this.highlightedBlockIndex = index;
        this.isHighlighted = true;
        this.blockBreakProgress = breakProgress;
    }
    setToRefresh(toRefresh: boolean) {
        this.toRefresh = toRefresh;
    }
    isToRefresh() {
        return this.toRefresh;
    }
    getWorldMinPosition() {
        let wpArray = this.getWorldPositionArray();
        let min = new Vec3(wpArray[0], 0, wpArray[2]);
        return min;
    }
    getCenter(): Vec3 {
        return this.getWorldMinPosition().withAdded(this.getSize().dividedByScalar(2));
    }
    getSize(): Vec3 {
        return new Vec3(CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_WIDTH);
    }
    getMinX(): number {
        return this.getWorldMinPosition().x;
    }
    getMaxX(): number {
        return this.getWorldMinPosition().x + CHUNK_WIDTH;
    }
    getMinY(): number {
        return 0;
    }
    getMaxY(): number {
        return CHUNK_HEIGHT;
    }
    getMinZ(): number {
        return this.getWorldMinPosition().z;
    }
    getMaxZ(): number {
        return this.getWorldMinPosition().z + CHUNK_WIDTH;
    }
    shredEntities() {
        this.entitiesForCollision = [];
    }
    updateEntities(level: Level) {
        this.entitiesForCollision = [];
        for (let entity of level.entities) {
            if (collided(entity, this))
                this.entitiesForCollision.push(entity);
        }
    }
    getNearbyChunk(xOffset: number, zOffset: number): Chunk | null {
        let indexX = this.index.x + xOffset;
        let indexZ = this.index.z + zOffset;
        return BlockAccess.getChunkByIndex(this.terrain, new ChunkIndex(indexX, indexZ));
    }
    getNeighborChunks(xRadius: number, zRadius: number): Chunk[] {
        let fetchedChunks: Chunk[] = [];
        for (let x = -xRadius; x <= xRadius; x++)
            for (let z = -zRadius; z <= zRadius; z++) {
                let chunk = this.getNearbyChunk(x, z);
                if (chunk !== null)
                    fetchedChunks.push(chunk);
            }
        return fetchedChunks;
    }
    generateTerrain(generator: Generator) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            let height = 90 + generator.evalHeight(this.index, x, z);
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
    generateStructures(generators: StructureGenerator[]) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            for (let generator of generators) {
                let terrHeight = this.terrainHeightMap[i];
                let height = Math.trunc(generator.evalHeight(this.index, x, z));
                if (y === terrHeight && height > Math.trunc(generator.hillHeight) - 2) {
                    let xx = x + this.index.x * CHUNK_WIDTH_IN_BLOCKS;
                    let zz = z + this.index.z * CHUNK_WIDTH_IN_BLOCKS;
                    let position = new Vec3(xx, y, zz);
                    let structure = new Structure(generator.structureTemplate, position, this);
                    this.terrain.structures.push(structure);
                }
            }
        }
    }
    loadStructure(structure: Structure) {
        let template = structure.template;
        let min = structure.getMin(this);
        let size = template.size;
        for (let i = 0; i < template.noOfBlocks; i++) {
            let { x, y, z } = template.makeVoxelCoordsFromIndex(i);
            y = size.y - y;
            let blockX = min.x + x;
            let blockY = min.y + y;
            let blockZ = min.z + z;
            let block = template.blocks[i];
            if (BlockAccess.allCoordsInsideChunk(blockX, blockY, blockZ) && block !== 0) {
                let index = this.makeIndexFromVoxelCoords(blockX, blockY, blockZ);
                if (!this.modifiedBlocks[index])
                    this.blocks[index] = block;
            }
        }
        this.loadedStructures.push(structure);
    }
    getWorldPositionArray() { 
        let position = [
            this.index.x * CHUNK_WIDTH,
            0,
            this.index.z * CHUNK_WIDTH
        ];
        return new Float32Array(position);
    }
    acquireModel() {
        this.model = new Model(makeChunkMesh(this), BLOCK_TEXTURE_ATLAS);
    }
    getBlockByIndex(index: number) {
        return this.blocks[index];
    }
    setBlockByIndex(index: number, newBlockID: number) {
        this.blocks[index] = newBlockID;
    }
    setBlockByInChunkCoords(x: number, y: number, z: number, block: number) {
        let { chunk, chunkIndex, blockCoords, exceededY } = BlockAccess.getChunkAndInChunkBlockCoordsByBlockCoords(this, x, y, z);
        if (chunk === null)
            return;
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockCoords.x, blockCoords.y, blockCoords.z);
        chunk.blocks[blockIndex] = block;
        chunk.setToRefresh(true);
    }
}

class ChunkVertexBuffer {
    vertices: number[];
    indices: number[];
    constructor(chunk: Chunk) {
        let verticesAndIndices = this.makeVerticesAndIndices(chunk);
        this.vertices = verticesAndIndices.vertices;
        this.indices = verticesAndIndices.indices;
    }
    makeOneFaceVertices(faceIndex: number, blockIndex: number, thisBlockID: number) {
        let vertices: number[] = [];
        for (let i = 0; i < VERTICES_PER_FACE; i++) {
            let vertexIndex = faceIndex * VERTICES_PER_FACE + i;
            vertices.push(vertexIndex, blockIndex, thisBlockID);
        }
        return vertices;
    }
    makeVerticesAndIndices(chunk: Chunk) {
        let vertices: number[] = [];
        let indices: number[] = [];
        for (let blockIndex = 0; blockIndex < TOTAL_BLOCKS_PER_CHUNK; blockIndex++) {
            let thisBlockID = chunk.getBlockByIndex(blockIndex);
            let neighbors: number[] = [];
            let { x, y, z } = chunk.makeVoxelCoordsFromIndex(blockIndex);
            neighbors[0] = BlockAccess.getBlockByInChunkCoords(chunk, x + 1, y, z);
            neighbors[1] = BlockAccess.getBlockByInChunkCoords(chunk, x - 1, y, z);
            neighbors[2] = BlockAccess.getBlockByInChunkCoords(chunk, x, y + 1, z);
            neighbors[3] = BlockAccess.getBlockByInChunkCoords(chunk, x, y - 1, z);
            neighbors[4] = BlockAccess.getBlockByInChunkCoords(chunk, x, y, z + 1);
            neighbors[5] = BlockAccess.getBlockByInChunkCoords(chunk, x, y, z - 1);
            for (let faceIndex = 0; faceIndex < FACES_IN_CUBE; faceIndex++) { 
                let thisBlockProperties = getBlockProperties(thisBlockID);
                let neighborProperties = getBlockProperties(neighbors[faceIndex]);
                if (thisBlockProperties.id === Block.AIR || !neighborProperties.transparent) 
                    continue;
                vertices = vertices.concat(this.makeOneFaceVertices(faceIndex, blockIndex, thisBlockID));
                indices = indices.concat(makeOneFaceIndices(indices.length, INDICES_TEMPLATE));
            }
        }
        return { vertices, indices };
    }
}

function makeChunkMesh(chunk: Chunk): Mesh {
    let chunkVertexBuffer = new ChunkVertexBuffer(chunk);
    let vertices = chunkVertexBuffer.vertices;
    let indices = chunkVertexBuffer.indices;
    let attr = new VertexAttribute(0, 3, 3, 0);
    let mesh = new Mesh(vertices, indices, attr);
    return mesh;
}

async function makeChunkShaderProgram(projectionMatrix: Float32Array<ArrayBufferLike>) {
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
    BLOCK_TEX_ATLAS_ROWS,
    BLOCK_TEX_ATLAS_COLUMNS,
    Chunk,
    ChunkIndex,
    makeChunkShaderProgram 
};