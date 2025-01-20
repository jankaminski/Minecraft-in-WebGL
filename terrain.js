import { Vec3 } from "./math-utils.js";
import { noise } from "./perlin-noise.js";
import { 
    Chunk, 
    CHUNK_WIDTH 
} from "./chunk.js";
import { 
    Block, 
    BLOCK_SIZE 
} from "./block.js";
import { Input } from "./input.js";
import { 
    CHUNK_HEIGHT_IN_BLOCKS, 
    CHUNK_WIDTH_IN_BLOCKS 
} from "./chunk.js";

let RENDER_DISTANCE = 12;

class Terrain {
    constructor() {
        noise.seed(Math.random());
        this.chunks = [];
        this.loadFoci = [];
        this.generator = new Generator(0.017, 0);
    }
    getGenerator() {
        return this.generator;
    }
    getFocusByID(id) {
        for (let focus of this.loadFoci)
            if (focus.id === id)
                return focus;
        return null;
    }
    updateLoading(gl, level, blockTextureAtlas) {
        for (let chunk of this.chunks)
            chunk.updateEntities(level);

        /*for (let chunk of this.chunks) {
            if (chunk.entitiesForCollision.length > 0)
                console.log("{ " + chunk.index.x + ", " + chunk.index.z + " }: " + chunk.entitiesForCollision.length + " entities");
        }*/

        for (let player of level.players) {
            let focusID = player.getFocusID();
            let playerPosition = player.getCenter();
            let chunkIndex = this.chunkIndexFromWorldCoords(playerPosition.x, playerPosition.z);
            let focus = this.getFocusByID(focusID);
            if (focus === null) {
                focus = new TerrainLoadFocus(this, chunkIndex, RENDER_DISTANCE, focusID);
                this.loadFoci.push(focus);
            }
            focus.moveLoadedArea(chunkIndex);
        }
        for (let loadFocus of this.loadFoci){
            loadFocus.updatePhysicalLoading();
            loadFocus.updateLoadingGraphics(gl, blockTextureAtlas);
        }
        this.markOutOfSightChunks();
        this.deleteMarkedChunks();
    }
    markOutOfSightChunks() {
        for (let chunk of this.chunks) {
            let outs = [];
            for (let loadFocus of this.loadFoci) {
                let cx = chunk.index.x;
                let cz = chunk.index.z;
                let fx = loadFocus.centralIndex.x;
                let fz = loadFocus.centralIndex.z;
                let out = Math.abs(cx - fx) + Math.abs(cz - fz) >= loadFocus.radius;
                outs.push(out);
            }
            if (outs.every((value) => value === true)) 
                chunk.toDelete = true;
        }
    }
    deleteMarkedChunks() {
        let refereshedChunks = [];
        for (let chunk of this.chunks) {
            if (!chunk.toDelete)
                refereshedChunks.push(chunk);
        }
        this.chunks = refereshedChunks;
    }
    chunkIndexFromWorldCoords(x, z) {
        let x1 = x % CHUNK_WIDTH;
        let z1 = z % CHUNK_WIDTH;
        let x2 = x - x1;
        let z2 = z - z1;
        let indexX = x2 / CHUNK_WIDTH;
        let indexZ = z2 / CHUNK_WIDTH;
        if (x < 0) 
            indexX--;
        if (z < 0) 
            indexZ--;
        return { x : indexX, z : indexZ };
    }
    blockIndexFromWorldCoords(x, y, z) {
        let blockY = Math.trunc(y) / BLOCK_SIZE;
        if (blockY < 0 || blockY >= CHUNK_HEIGHT_IN_BLOCKS) 
            return null;
        let x1 = x % CHUNK_WIDTH;
        let z1 = z % CHUNK_WIDTH;
        if (x < 0)
            x1 += CHUNK_WIDTH;
        if (z < 0) 
            z1 += CHUNK_WIDTH;
        let blockX = Math.trunc(x1);
        if (blockX < 0 || blockX >= CHUNK_WIDTH) 
            return null;
        let blockZ = Math.trunc(z1);
        if (blockZ < 0 || blockZ >= CHUNK_WIDTH_IN_BLOCKS) 
            return null;
        return { x : blockX, y : blockY, z : blockZ };
    }
    getChunkByIndex(index) {
        for (let chunk of this.chunks) {
            if (index.x === chunk.index.x && index.z === chunk.index.z)
                return chunk;
        }
        return null;
    }
    getChunkByWorldCoords(x, z, forceLoad) {
        let index = this.chunkIndexFromWorldCoords(x, z);
        let chunk = this.getChunkByIndex(index);
        if (!forceLoad)
            return chunk;
        if (chunk === null) {
            chunk = new Chunk(this, index.x, index.z);
            this.chunks.push(chunk);
        }
        return chunk;
    }
    getBlockByWorldCoords(x, y, z, forceLoad) {
        let chunk = this.getChunkByWorldCoords(x, z, forceLoad);
        if (chunk === null) 
            return null;
        let blockIndex = this.blockIndexFromWorldCoords(x, y, z);
        if (blockIndex === null) 
            return null;
        let blockID = chunk.getBlockByInChunkCoords(blockIndex.x, blockIndex.y, blockIndex.z);
        let center = Vec3.make(
            (Math.trunc(x) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(x), 
            (Math.trunc(y) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(y), 
            (Math.trunc(z) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(z));
        return new Block(center, blockID);
    }
    setBlockByWorldCoords(x, y, z, block) {
        let chunk = this.getChunkByWorldCoords(x, z);
        if (chunk === null) 
            return false;
        let blockIndex = this.blockIndexFromWorldCoords(x, y, z);
        if (blockIndex === null) 
            return false;
        chunk.setBlockByInChunkCoords(blockIndex.x, blockIndex.y, blockIndex.z, block);
        return true;
    }
}

class Generator {
    constructor(hillWidth, hillHeight) {
        this.hillWidth = hillWidth;
        this.hillHeight = hillHeight;
    }
    evalHeight(chunkIndex, x, z) {
        return noise.simplex2(
            (chunkIndex.x * CHUNK_WIDTH_IN_BLOCKS + x) * this.hillWidth, 
            (chunkIndex.z * CHUNK_WIDTH_IN_BLOCKS + z) * this.hillWidth) * this.hillHeight;
    }
}

class TerrainLoadFocus {
    constructor(terrain, index, radius, id) {
        this.id = id;
        this.terrain = terrain;
        this.radius = radius;
        this.centralIndex = { x : index.x, z : index.z };
        this.physicalLoader = new TerrainLoader(this.centralIndex);
        this.graphicalLoader = new TerrainLoader(this.centralIndex);
        this.physicalLoader.restart(this.centralIndex);
        this.graphicalUpdateCooldown = 0;
        this.physicalUpdateCooldown = 0;
        this.graphicalLoadCooldown = 0;
    }
    moveLoadedArea(newCentralIndex) {
        let cx = this.centralIndex.x;
        let cz = this.centralIndex.z;
        let nx = newCentralIndex.x;
        let nz = newCentralIndex.z;
        if (cx != nx || cz != nz) {
            this.centralIndex = { x : nx, z : nz };
            console.log("loaded area moved");
            this.physicalLoader.restart(this.centralIndex);
            this.graphicalLoadCooldown++;
        }
        if (Input.keyboard.forceReload || this.graphicalLoadCooldown > this.radius / 2) {
            console.log("graphical loading restart");
            this.graphicalLoader.restart(this.centralIndex);
            this.graphicalLoadCooldown = 0;
        }
    }
    updatePhysicalLoading() {
        if (this.physicalUpdateCooldown < 1) {
            this.physicalUpdateCooldown++; 
            return;
        }
        this.physicalUpdateCooldown = 0;
        if (this.physicalLoader.layer > this.radius) 
            return;
        let index = this.physicalLoader.nextIndex();
        let chunk = this.terrain.getChunkByIndex(index);
        if (chunk === null) {
            chunk = new Chunk(this.terrain, index.x, index.z);
            this.terrain.chunks.push(chunk);
        }
    }
    updateLoadingGraphics(gl, blockTextureAtlas) {
        if (this.graphicalUpdateCooldown < 4) {
            this.graphicalUpdateCooldown++; 
            return;
        }
        this.graphicalUpdateCooldown = 0;
        if (this.graphicalLoader.layer > this.radius) 
            return;
        let index = this.graphicalLoader.nextIndex();
        let chunk = this.terrain.getChunkByIndex(index);
        if (chunk != null) 
            chunk.acquireModel(gl, blockTextureAtlas);
    }
}

class TerrainLoader {
    constructor(originIndex) {
        this.restart(originIndex);
    }
    restart(originIndex) {
        this.originIndex = { x : originIndex.x, z : originIndex.z };
        this.currentLayerIndices = [{ x : this.originIndex.x, z : this.originIndex.z }];
        this.alreadyLoadedChunksCount = 0;
        this.noOfChunksYetToLoad = 0;
        this.layer = 0;
    }
    beginNewLoadingLayer() {
        let newIndices = [];
        for (let i = -this.layer; i <= this.layer; i++) {
            let offsetX = this.originIndex.x + i;
            let offsetZ1 = this.originIndex.z;
            let offsetZ2 = this.originIndex.z;
            if (i != -this.layer && i != this.layer) {
                offsetZ1 += (-this.layer + Math.abs(i));
                offsetZ2 += ( this.layer - Math.abs(i));
            }
            newIndices.push({ x : offsetX, z : offsetZ1 });
            newIndices.push({ x : offsetX, z : offsetZ2 });
        }
        this.layer++;
        this.currentLayerIndices = newIndices;
        this.alreadyLoadedChunksCount = 0;
        this.noOfChunksYetToLoad = this.currentLayerIndices.length;
    }
    nextIndex() {
        if (this.alreadyLoadedChunksCount >= this.noOfChunksYetToLoad)
            this.beginNewLoadingLayer();
        this.alreadyLoadedChunksCount++;
        return this.currentLayerIndices[this.alreadyLoadedChunksCount - 1];
    }
} 

export { Terrain };