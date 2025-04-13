import { noiseSeed, noiseSimplex2 } from './perlin-noise.js';
import { 
    areAll, 
    Cooldown 
} from './misc-utils.js';
import { Chunk, ChunkIndex } from './chunk.js';
import { Input } from './input.js';
import { 
    HUGE_BOX, 
    OAK_TREE,
    Structure,
    StructureTemplate
} from './structure.js';
import { 
    BlockAccess, 
    CHUNK_WIDTH_IN_BLOCKS 
} from './block-access.js';
import { Block } from './block.js';
import { Level } from './level.js';

let RENDER_DISTANCE = 12;

class Terrain {
    chunks: Chunk[];
    loadedAreas: LoadedArea[];
    generator: Generator;
    structureGenerators: StructureGenerator[];
    structures: Structure[];
    constructor() {
        noiseSeed(Math.random());
        this.chunks = [];
        this.loadedAreas = [];
        this.generator = new Generator(0.017, 2);
        this.structureGenerators = [];
        this.structureGenerators.push(new StructureGenerator(0.95, 20, OAK_TREE));
        this.structures = [];
    }
    getGenerator() {
        return this.generator;
    }
    getStructureGenerators() {
        return this.structureGenerators;
    }
    getLoadedAreaByID(id: number) {
        for (let area of this.loadedAreas)
            if (area.id === id)
                return area;
        return null;
    }
    updateChunkEntities(level: Level) {
        for (let chunk of this.chunks)
            chunk.updateEntities(level);
    }
    updateLoadedAreas(level: Level) {
        if (level.players.length === 0)
            return;
        for (let player of level.players) {
            let playerPosition = player.getCenter();
            let playerChunkIndex = BlockAccess.getChunkIndexByWorldCoords(playerPosition.x, playerPosition.z);
            let areaID = player.getLoadedAreaID();
            let area = this.getLoadedAreaByID(areaID);
            if (area === null) {
                area = new LoadedArea(this, playerChunkIndex, RENDER_DISTANCE, areaID);
                this.loadedAreas.push(area);
            }
            area.update(playerChunkIndex);
        }
    }
    update(level: Level) {
        this.updateChunkEntities(level);
        this.updateLoadedAreas(level);
        this.deleteOutOfSightChunks();
        this.updateLoadingChunks();
        this.updateStructures();
    }
    updateStructures() {
        //console.log("structs: " + this.structures.length);
        //console.log("chunks: " + this.chunks.length);
        this.structures = this.structures.filter((structure) => !structure.rootChunk.toDelete);
        for (let s of this.structures)
            s.reload();
    }
    updateLoadingChunks() {
        for (let chunk of this.chunks) {
            chunk.isHighlighted = false;
        }
    }
    deleteOutOfSightChunks() {
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
        this.chunks = this.chunks.filter((chunk) => !chunk.toDelete);
    }
    delete() {
        for (let chunk of this.chunks) {
            chunk.shredEntities();
        }
        this.chunks = [];
    }
    setBlockByWorldCoords(x: number, y: number, z: number, block: number) {
        let chunk = BlockAccess.getChunkByWorldCoords(this, x, z);
        if (chunk === null) 
            return false;
        let blockPosInChunk = BlockAccess.getInChunkBlockCoordsByWorldCoords(x, y, z);
        if (blockPosInChunk === null) 
            return false;
        chunk.setBlockByInChunkCoords(blockPosInChunk.x, blockPosInChunk.y, blockPosInChunk.z, block);
        return true;
    }
    setBlockByBlock(oldBlock: Block, newBlockID: number) {
        let chunk = oldBlock.getChunk();
        let index = oldBlock.getIndex();
        chunk.setBlockByIndex(index, newBlockID);
        chunk.setToRefresh(true);
    }
}

class Generator {
    hillWidth: number;
    hillHeight: number;
    constructor(hillWidth: number, hillHeight: number) {
        this.hillWidth = hillWidth;
        this.hillHeight = hillHeight;
    }
    evalHeight(chunkIndex: ChunkIndex, x: number, z: number) {
        return noiseSimplex2(
            (chunkIndex.x * CHUNK_WIDTH_IN_BLOCKS + x) * this.hillWidth, 
            (chunkIndex.z * CHUNK_WIDTH_IN_BLOCKS + z) * this.hillWidth) * this.hillHeight;
    }
}

class StructureGenerator extends Generator {
    structureTemplate: StructureTemplate;
    constructor(hillWidth: number, hillHeight: number, structureTemplate: StructureTemplate) {
        super(hillWidth, hillHeight);
        this.structureTemplate = structureTemplate;
    }
}

class LoadedArea {
    id: number;
    terrain: Terrain;
    radius: number;
    centralIndex: ChunkIndex;
    physicalSpreader: LoadSpreader;
    graphicalSpreader: LoadSpreader;
    refreshSpreader: LoadSpreader;
    distanceFromPreviousCenter: number;
    refreshCooldown: Cooldown;
    constructor(terrain: Terrain, index: ChunkIndex, radius: number, id: number) {
        this.id = id;
        this.terrain = terrain;
        this.radius = radius;
        this.centralIndex = index.clone();
        this.physicalSpreader = new PhysicalLoadSpreader(terrain, this.centralIndex, 1);
        this.graphicalSpreader = new GraphicalLoadSpreader(terrain, this.centralIndex, 2);
        this.refreshSpreader = new RefreshSpreader(terrain, this.centralIndex, 1);
        this.distanceFromPreviousCenter = 0;
        this.refreshCooldown = new Cooldown(300);
        this.refreshCooldown.setCurrentProgress(280);
    }
    update(newCentralIndex: ChunkIndex) {
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
        this.physicalSpreader.update();
        this.graphicalSpreader.update();
        this.refreshSpreader.update();
    }
}

class LoadSpreader {
    terrain: Terrain;
    updateCooldown: Cooldown;
    originIndex: ChunkIndex;
    currentLayerIndices: ChunkIndex[];
    noOfAlreadyLoadedChunks: number;
    noOfChunksToLoad: number;
    currentLayer: number;
    constructor(terrain: Terrain, originIndex: ChunkIndex, updateRate: number) {
        this.terrain = terrain;
        this.updateCooldown = new Cooldown(updateRate);
        //this.restart(originIndex);
        this.originIndex = originIndex.clone();
        this.currentLayerIndices = [originIndex.clone()];
        this.noOfAlreadyLoadedChunks = 0;
        this.noOfChunksToLoad = 0;
        this.currentLayer = 0;
    }
    restart(originIndex: ChunkIndex) {
        this.originIndex = originIndex.clone();
        this.currentLayerIndices = [originIndex.clone()];
        this.noOfAlreadyLoadedChunks = 0;
        this.noOfChunksToLoad = 0;
        this.currentLayer = 0;
    }
    beginNewLoadingLayer() {
        let newIndices: ChunkIndex[] = [];
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
    update() {
        this.updateCooldown.progress();
        if (!this.updateCooldown.reached())
            return;
        if (this.noOfAlreadyLoadedChunks >= this.noOfChunksToLoad)
            this.beginNewLoadingLayer();
        this.onUpdate();
        this.noOfAlreadyLoadedChunks++;
    }
    onUpdate() {  }
} 

class PhysicalLoadSpreader extends LoadSpreader {
    constructor(terrain: Terrain, originIndex: ChunkIndex, updateRate: number) {
        super(terrain, originIndex, updateRate);
    }
    onUpdate() {
        let index = this.currentLayerIndices[this.noOfAlreadyLoadedChunks];
        let chunk = BlockAccess.getChunkByIndex(this.terrain, index);
        if (chunk === null) {
            chunk = new Chunk(this.terrain, index);
            this.terrain.chunks.push(chunk);
        }
    }
}

class GraphicalLoadSpreader extends LoadSpreader {
    constructor(terrain: Terrain, originIndex: ChunkIndex, updateRate: number) {
        super(terrain, originIndex, updateRate);
    }
    onUpdate() {
        let index = this.currentLayerIndices[this.noOfAlreadyLoadedChunks];
        let chunk = BlockAccess.getChunkByIndex(this.terrain, index);
        if (chunk !== null)
            chunk.acquireModel();
    }
}

class RefreshSpreader extends LoadSpreader {
    constructor(terrain: Terrain, originIndex: ChunkIndex, updateRate: number) {
        super(terrain, originIndex, updateRate);
    }
    onUpdate() {
        let index = this.currentLayerIndices[this.noOfAlreadyLoadedChunks];
        let chunk = BlockAccess.getChunkByIndex(this.terrain, index);
        if (chunk !== null)
            if (chunk.isToRefresh())
                chunk.acquireModel();
    }
}

export { Terrain, Generator, StructureGenerator };