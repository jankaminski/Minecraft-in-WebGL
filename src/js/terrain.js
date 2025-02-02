import { noise } from './perlin-noise.js';
import { 
    areAll, 
    arrayWithRemoved, 
    Cooldown 
} from './misc-utils.js';
import { Chunk, ChunkIndex } from './chunk.js';
import { Input } from './input.js';
import { 
    HUGE_BOX, 
    OAK_TREE
} from './structure.js';
import { 
    BlockAccess, 
    CHUNK_WIDTH_IN_BLOCKS 
} from './block-access.js';

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
        this.structures = [];
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
            let chunkIndex = BlockAccess.getChunkIndexByWorldCoords(playerPosition.x, playerPosition.z);
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
        //console.log("structs: " + this.structures.length);
        
        this.structures = arrayWithRemoved(this.structures, (structure) => {
            if (structure.rootChunk.toDelete) {
                //console.log("struct removed");
                return true;
            }
            return false;
        });
        for (let s of this.structures)
            s.reload();
    }
    updateLoadingChunks() {
        for (let chunk of this.chunks) {
            chunk.isHighlighted = false;
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
    setBlockByWorldCoords(x, y, z, block) {
        let chunk = BlockAccess.getChunkByWorldCoords(this, x, z);
        if (chunk === null) 
            return false;
        let blockPosInChunk = BlockAccess.getInChunkBlockCoordsByWorldCoords(x, y, z);
        if (blockPosInChunk === null) 
            return false;
        chunk.setBlockByInChunkCoords(blockPosInChunk.x, blockPosInChunk.y, blockPosInChunk.z, block);
        return true;
    }
    setBlockByBlock(oldBlock, newBlockID) {
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
        this.centralIndex = index.clone();
        this.physicalSpreader = new Spreader(terrain, this.centralIndex, 1);
        this.graphicalSpreader = new Spreader(terrain, this.centralIndex, 2);
        this.refreshSpreader = new Spreader(terrain, this.centralIndex, 1);
        this.distanceFromPreviousCenter = 0;
        this.refreshCooldown = new Cooldown(300);
        this.refreshCooldown.setCurrentProgress(280);
    }
    move(newCentralIndex) {
        if (!this.centralIndex.equals(newCentralIndex)) {
            this.centralIndex = newCentralIndex.clone();
            console.log("loaded area moved");
            this.physicalSpreader.restart(this.centralIndex);
            this.distanceFromPreviousCenter++;
        }
        if (Input.forceReloading() || this.distanceFromPreviousCenter > this.radius / 4) {
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
                if (chunk.isToRefresh())
                    chunk.acquireModel();
            }
        });
    }
}

class Spreader {
    constructor(terrain, originIndex, updateRate) {
        this.terrain = terrain;
        this.updateCooldown = new Cooldown(updateRate);
        this.restart(originIndex);
    }
    restart(originIndex) {
        this.originIndex = originIndex.clone();
        this.currentLayerIndices = [originIndex.clone()];
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
            newIndices.push(new ChunkIndex(offsetX, offsetZ1));
            newIndices.push(new ChunkIndex(offsetX, offsetZ2));
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
        let chunk = BlockAccess.getChunkByIndex(this.terrain, index);
        updateAction(index, chunk);
    }
} 

export { Terrain };