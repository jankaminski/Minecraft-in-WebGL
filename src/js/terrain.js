import { noise } from './perlin-noise.js';
import { areAll, arrayWithRemoved, Cooldown } from './misc-utils.js';
import { 
    Block, 
    BLOCK_SIZE 
} from './block.js';
import { 
    CHUNK_WIDTH, 
    CHUNK_WIDTH_IN_BLOCKS, 
    CHUNK_HEIGHT_IN_BLOCKS, 
    Chunk
} from './chunk.js';
import { Input } from './input.js';
import { Vec3 } from './math-utils.js';
import { 
    getCollidingChunkIndices, 
    //getCollidingChunks, 
    HUGE_BOX, 
    OAK_TREE, 
    StructureRoot 
} from './structure.js';

let RENDER_DISTANCE = 12;

class Terrain {
    constructor() {
        noise.seed(Math.random());
        this.chunks = [];
        this.loadedAreas = [];
        this.generator = new Generator(0.017, 2);
        this.structureGenerators = [];
        this.structureGenerators.push(new StructureGenerator(0.6, 20, OAK_TREE));
        this.structureGenerators.push(new StructureGenerator(0.3, 300, HUGE_BOX));

        //this.strucRoots = [];
    }
    getGenerator() {
        return this.generator;
    }
    getStructureGenerators() {
        return this.structureGenerators;
    }
    getLoadedAreaByID(id) {
        for (let area of this.loadedAreas)
            if (area.id === id)
                return area;
        return null;
    }
    updateChunkEntities(level) {
        for (let chunk of this.chunks)
            chunk.updateEntities(level);
    }
    moveLoadedAreas(level) {
        for (let player of level.players) {
            let playerPosition = player.getCenter();
            let chunkIndex = this.chunkIndexFromWorldCoords(playerPosition.x, playerPosition.z);
            let areaID = player.getLoadedAreaID();
            let area = this.getLoadedAreaByID(areaID);
            if (area === null) {
                area = new LoadedArea(this, chunkIndex, RENDER_DISTANCE, areaID);
                this.loadedAreas.push(area);
            }
            area.move(chunkIndex);
        }
    }
    updateLoadingAreas() {
        for (let area of this.loadedAreas)
            area.update();
    }
    update(level) {
        this.updateChunkEntities(level);
        this.moveLoadedAreas(level);
        this.updateLoadingAreas()
        this.markOutOfSightChunks();
        this.deleteMarkedChunks();
        this.updateLoadingChunks();

        //console.log("stored roots: " + this.strucRoots.length);
    }
    updateLoadingChunks() {

        for (let chunk of this.chunks) {
            chunk.isHighlighted = false;
            //chunk.keepLoadingStructureIfNeeded();
        }
    }
    markOutOfSightChunks() {
        for (let chunk of this.chunks) {
            if (areAll(this.loadedAreas, (area) => {
                let cx = chunk.index.x;
                let cz = chunk.index.z;
                let fx = area.centralIndex.x;
                let fz = area.centralIndex.z;
                return Math.abs(cx - fx) + Math.abs(cz - fz) >= area.radius;
            })) {
                chunk.toDelete = true;
            }
        }
    }
    deleteMarkedChunks() {
        this.chunks = arrayWithRemoved(this.chunks, (chunk) => chunk.toDelete);
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
    blockPosInChunkFromWorldCoords(x, y, z) {
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
        let blockPosInChunk = this.blockPosInChunkFromWorldCoords(x, y, z);
        if (blockPosInChunk === null) 
            return null;
        let blockID = chunk.getBlockByInChunkCoords(blockPosInChunk.x, blockPosInChunk.y, blockPosInChunk.z);
        let center = Vec3.make(
            (Math.trunc(x) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(x), 
            (Math.trunc(y) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(y), 
            (Math.trunc(z) / BLOCK_SIZE) + (BLOCK_SIZE / 2) * Math.sign(z));
        let blockIndex = chunk.makeIndexFromVoxelCoords(blockPosInChunk.x, blockPosInChunk.y, blockPosInChunk.z);
        return new Block(chunk, blockPosInChunk, blockIndex, center, blockID);
    }
    setBlockByWorldCoords(x, y, z, block) {
        let chunk = this.getChunkByWorldCoords(x, z);
        if (chunk === null) 
            return false;
        let blockPosInChunk = this.blockPosInChunkFromWorldCoords(x, y, z);
        if (blockPosInChunk === null) 
            return false;
        chunk.setBlockByInChunkCoords(blockPosInChunk.x, blockPosInChunk.y, blockPosInChunk.z, block);
        return true;
    }
    setBlock(oldBlock, newBlockID) {
        let chunk = oldBlock.getChunk();
        let index = oldBlock.getIndex();
        chunk.setBlockByIndex(index, newBlockID);
        chunk.setToRefresh(true);
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

class StructureGenerator extends Generator {
    constructor(hillWidth, hillHeight, structureTemplate) {
        super(hillWidth, hillHeight);
        this.structureTemplate = structureTemplate;
    }
}

class LoadedArea {
    constructor(terrain, index, radius, id) {
        this.id = id;
        this.terrain = terrain;
        this.radius = radius;
        this.centralIndex = { x : index.x, z : index.z };
        this.physicalSpreader = new Spreader(terrain, this.centralIndex, 1);
        this.graphicalSpreader = new Spreader(terrain, this.centralIndex, 4);
        this.refreshSpreader = new Spreader(terrain, this.centralIndex, 1);
        this.distanceFromPreviousCenter = 0;
        this.refreshCooldown = new Cooldown(500);
        this.refreshCooldown.setCurrentProgress(450);
        //this.structureSpreader = new Spreader(terrain, this.centralIndex, 1);
    }
    move(newCentralIndex) {
        let cx = this.centralIndex.x;
        let cz = this.centralIndex.z;
        let nx = newCentralIndex.x;
        let nz = newCentralIndex.z;
        if (cx != nx || cz != nz) {
            this.centralIndex = { x : nx, z : nz };
            console.log("loaded area moved");
            this.physicalSpreader.restart(this.centralIndex);
            this.distanceFromPreviousCenter++;
            //this.structureSpreader.restart(this.centralIndex);
        }
        if (Input.forceReloading() || this.distanceFromPreviousCenter > this.radius / 2) {
            console.log("graphical loading restart");
            this.graphicalSpreader.restart(this.centralIndex);
            this.distanceFromPreviousCenter = 0;
        }
        this.refreshCooldown.progress();
        if (this.refreshCooldown.reached()) {
            console.log("REFRESH START");
            this.refreshSpreader.restart(this.centralIndex);
        }
    }
    update() {
        this.physicalSpreader.update((index, chunk) => {
            if (chunk === null) {
                chunk = new Chunk(this.terrain, index.x, index.z);
                this.terrain.chunks.push(chunk);
            }
        });
        this.graphicalSpreader.update((index, chunk) => {
            if (chunk !== null)
                chunk.acquireModel();
        });
        this.refreshSpreader.update((index, chunk) => {
            if (chunk !== null) {
                //chunk.loadStructures();
                //chunk.acquireModel();
                chunk.generateStructures(this.terrain.generator, this.terrain.structureGenerators);
                chunk.acquireModel();
                if (chunk.isToRefresh()) {
                    chunk.setToRefresh(false);
                    chunk.acquireModel();
                }
            }
        });
        /*this.structureSpreader.update((index, chunk) => {
            for (let x = 0; x < CHUNK_WIDTH_IN_BLOCKS; x++) {
                for (let z = 0; z < CHUNK_WIDTH_IN_BLOCKS; z++) {
                    for (let generator of generators) {
                        let y = Math.trunc(generator.evalHeight(index, x, z));
                        if (y > Math.trunc(generator.hillHeight) - 2) {
                            //console.log("planted a struc: " + index.x + ", " + index.z);
                            //let xx = Math.trunc((x + index.x * CHUNK_WIDTH_IN_BLOCKS) * generator.hillWidth);
                            //let zz = Math.trunc((z + index.z * CHUNK_WIDTH_IN_BLOCKS * generator.hillWidth) * generator.hillHeight);
                            let xx = x + index.x * CHUNK_WIDTH_IN_BLOCKS;
                            let zz = z + index.z * CHUNK_WIDTH_IN_BLOCKS;
                            let root = new StructureRoot(generator.structureTemplate, Vec3.make(xx, 50, zz), index);
                            chunk.strucRoots.push(root);
                            let collIndices = getCollidingChunkIndices(root);
                            for (let collIndex of collIndices) {
                                //let xxx = Math.trunc((x + collIndex.x * CHUNK_WIDTH_IN_BLOCKS) * generator.hillWidth);
                                //let zzz = Math.trunc((z + collIndex.z * CHUNK_WIDTH_IN_BLOCKS * generator.hillWidth) * generator.hillHeight);
                                let c = this.terrain.getChunkByIndex(collIndex);
                                if (c !== null)
                                    c.strucRoots.push(new StructureRoot(generator.structureTemplate, Vec3.make(xx, 50, zz), collIndex));
                            }
                        }
                    }
                }
            }
        });*/
    }
}

class Spreader {
    constructor(terrain, originIndex, updateRate) {
        this.terrain = terrain;
        this.updateCooldown = new Cooldown(updateRate);
        this.restart(originIndex);
    }
    restart(originIndex) {
        this.originIndex = { x : originIndex.x, z : originIndex.z };
        this.currentLayerIndices = [{ x : this.originIndex.x, z : this.originIndex.z }];
        this.noOfAlreadyLoadedChunks = 0;
        this.noOfChunksToLoad = 0;
        this.currentLayer = 0;
    }
    beginNewLoadingLayer() {
        let newIndices = [];
        for (let i = -this.currentLayer; i <= this.currentLayer; i++) {
            let offsetX = this.originIndex.x + i;
            let offsetZ1 = this.originIndex.z;
            let offsetZ2 = this.originIndex.z;
            if (i != -this.currentLayer && i != this.currentLayer) {
                offsetZ1 += (-this.currentLayer + Math.abs(i));
                offsetZ2 += ( this.currentLayer - Math.abs(i));
            }
            newIndices.push({ x : offsetX, z : offsetZ1 });
            newIndices.push({ x : offsetX, z : offsetZ2 });
        }
        this.currentLayer++;
        this.currentLayerIndices = newIndices;
        this.noOfAlreadyLoadedChunks = 0;
        this.noOfChunksToLoad = this.currentLayerIndices.length;
    }
    update(updateAction) {
        this.updateCooldown.progress();
        if (!this.updateCooldown.reached())
            return;
        if (this.noOfAlreadyLoadedChunks >= this.noOfChunksToLoad)
            this.beginNewLoadingLayer();
        let index = this.currentLayerIndices[this.noOfAlreadyLoadedChunks];
        this.noOfAlreadyLoadedChunks++;
        /*if (!involvesLoading) {
            updateAction(index, null);
            return;
        }*/
        let chunk = this.terrain.getChunkByIndex(index);
        updateAction(index, chunk);
    }
} 

export { Terrain };