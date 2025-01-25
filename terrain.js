let RENDER_DISTANCE = 12;

class Terrain {
    constructor() {
        noise.seed(Math.random());
        this.chunks = [];
        this.loadedAreas = [];
        this.generator = new Generator(0.017, 5);
    }
    getGenerator() {
        return this.generator;
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
    updateLoadingAreas(gl, blockTextureAtlas) {
        for (let area of this.loadedAreas)
            area.update(gl, blockTextureAtlas);
    }
    update(gl, level, blockTextureAtlas) {
        this.updateChunkEntities(level);
        this.moveLoadedAreas(level);
        this.updateLoadingAreas(gl, blockTextureAtlas)
        this.markOutOfSightChunks();
        this.deleteMarkedChunks();
        for (let chunk of this.chunks) {
            if (chunk.isToRefresh()) {
                chunk.acquireModel(gl, blockTextureAtlas);
                chunk.setToRefresh(false);
            }
            chunk.isHighlighted = false;

            if (!chunk.structuresLoaded && chunk.hasNeighbors()) {
                chunk.addStructures(this.generator);
                chunk.structuresLoaded = true;
            }
        }
    }
    markOutOfSightChunks() {
        for (let chunk of this.chunks) {
            let outs = [];
            for (let area of this.loadedAreas) {
                let cx = chunk.index.x;
                let cz = chunk.index.z;
                let fx = area.centralIndex.x;
                let fz = area.centralIndex.z;
                let out = Math.abs(cx - fx) + Math.abs(cz - fz) >= area.radius;
                outs.push(out);
            }
            if (outs.every((value) => value === true)) 
                chunk.toDelete = true;
        }
    }
    deleteMarkedChunks() {
        let refreshedChunks = [];
        for (let chunk of this.chunks) {
            if (!chunk.toDelete)
                refreshedChunks.push(chunk);
        }
        this.chunks = refreshedChunks;
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

class LoadedArea {
    constructor(terrain, index, radius, id) {
        this.id = id;
        this.terrain = terrain;
        this.radius = radius;
        this.centralIndex = { x : index.x, z : index.z };
        this.physicalSpreadSource = new LoadSpreadSource(terrain, this.centralIndex, 1);
        this.graphicalSpreadSource = new LoadSpreadSource(terrain, this.centralIndex, 4);
        this.distanceFromPreviousCenter = 0;
    }
    move(newCentralIndex) {
        let cx = this.centralIndex.x;
        let cz = this.centralIndex.z;
        let nx = newCentralIndex.x;
        let nz = newCentralIndex.z;
        if (cx != nx || cz != nz) {
            this.centralIndex = { x : nx, z : nz };
            console.log("loaded area moved");
            this.physicalSpreadSource.restart(this.centralIndex);
            this.distanceFromPreviousCenter++;
        }
        if (Input.forceReloading() || this.distanceFromPreviousCenter > this.radius / 2) {
            console.log("graphical loading restart");
            this.graphicalSpreadSource.restart(this.centralIndex);
            this.distanceFromPreviousCenter = 0;
        }
    }
    update(gl, blockTextureAtlas) {
        this.physicalSpreadSource.update((index, chunk) => {
            if (chunk === null) {
                chunk = new Chunk(this.terrain, index.x, index.z);
                this.terrain.chunks.push(chunk);
            }
        });
        this.graphicalSpreadSource.update((index, chunk) => {
            if (chunk !== null)
                chunk.acquireModel(gl, blockTextureAtlas);
        });
    }
}

class LoadSpreadSource {
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
        let chunk = this.terrain.getChunkByIndex(index);
        updateAction(index, chunk);
    }
} 