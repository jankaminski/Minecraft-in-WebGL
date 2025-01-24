const CHUNK_HEIGHT_IN_BLOCKS = 128;
const CHUNK_WIDTH_IN_BLOCKS = 16;

const CHUNK_HEIGHT = CHUNK_HEIGHT_IN_BLOCKS * BLOCK_SIZE;
const CHUNK_WIDTH = CHUNK_WIDTH_IN_BLOCKS * BLOCK_SIZE;
const TOTAL_BLOCKS_PER_CHUNK = CHUNK_WIDTH_IN_BLOCKS * CHUNK_HEIGHT_IN_BLOCKS * CHUNK_WIDTH_IN_BLOCKS;

const FACES_IN_CUBE = 6; // oh really? 

const INDICES_TEMPLATE = [
    3, 1, 0, 0, 2, 3
];

const BLOCK_TEX_ATLAS_ROWS = 100;
const BLOCK_TEX_ATLAS_COLUMNS = 6;
const BLOCK_PIXELS = 16;

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
        this.generate(terrain.getGenerator());
        this.entitiesForCollision = [];
        this.isHighlighted = false;
        this.highlightedBlockIndex = -1;
        this.blockBreakProgress = 0.0;
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
    getWorldBounds() {
        let wpArray = this.getWorldPosition();
        let min = { x : wpArray[0], y : 0, z : wpArray[2] };
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
    generate(generator) {
        for (let i = 0; i < TOTAL_BLOCKS_PER_CHUNK; i++) {
            let { x, y, z } = this.makeVoxelCoordsFromIndex(i);
            let height = 40 + generator.evalHeight(this.index, x, z);
            if (y < height) {
                this.setBlockByInChunkCoords(x, y, z, Block.DIRT);
                this.setBlockByInChunkCoords(x, y + 1, z, Block.GRASS);
            }
            if (x === 4 && z === 4 && y === 80)
                this.loadStructure(OAK_TREE, Vec3.make(x, y, z));
        }
    }
    getWorldPosition() { 
        let position = [
            this.index.x * CHUNK_WIDTH,
            0,
            this.index.z * CHUNK_WIDTH
        ];
        return position;
    }
    acquireModel(gl, blockTextureAtlas) {
        this.model = new Model(makeChunkMesh(gl, this), blockTextureAtlas);
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
    setBlockByInChunkCoords(x, y, z, block) {
        if (this.coordsInsideChunk(x, y, z)) {
            let index = this.makeIndexFromVoxelCoords(x, y, z);
            this.blocks[index] = block;
        }
        let { worldX, worldY, worldZ } = this.worldCoordsFromInChunkCoords(x, y, z);
        this.terrain.setBlockByWorldCoords(worldX, worldY, worldZ, block);
    }
    loadStructure(structure, rootPosition) {
        let min = Vec3.sub(rootPosition, structure.root);
        let size = structure.size;
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                for (let z = 0; z < size.z; z++) {
                    
                    let xx = min.x + x;
                    let yy = min.y + y;
                    let zz = min.z + z;
                    let i = structure.makeIndexFromVoxelCoords(x, size.y - y - 1, z);
                    let block = structure.blocks[i];
                    if (block != 0)
                        this.setBlockByInChunkCoords(xx, yy, zz, block);

                }
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
    let terrainProgram = await loadShaderProgramFromFiles(gl, './terrain-vert.glsl', './terrain-frag.glsl');
    terrainProgram.turnOn(gl);
    terrainProgram.loadMatrix(gl, 'mProj', projectionMatrix);
    terrainProgram.loadInt(gl, "BLOCK_SIZE", BLOCK_SIZE);
    terrainProgram.loadInt(gl, "CHUNK_HEIGHT_IN_BLOCKS", CHUNK_HEIGHT_IN_BLOCKS);
    terrainProgram.loadInt(gl, "CHUNK_WIDTH_IN_BLOCKS", CHUNK_WIDTH_IN_BLOCKS);
    terrainProgram.loadFloat(gl, "texAtlasNoOfRows", BLOCK_TEX_ATLAS_ROWS);
    terrainProgram.loadFloat(gl, "texAtlasNoOfColumns", BLOCK_TEX_ATLAS_COLUMNS);
    terrainProgram.turnOff(gl);
    return terrainProgram;
}