class Level {
    constructor(blockTextureAtlas, ...entities) {
        this.blockTextureAtlas = blockTextureAtlas;
        this.entities = entities;
        this.terrain = new Terrain();
        this.terrainRenderer = new TerrainRenderer();
        this.entityRenderer = new EntityRenderer(this);
        this.players = [entities[0]];
        this.camera = new Camera(5, 900, 2);
    }
    addEntity(entity) {
        this.entities.push(entity);
        this.entityRenderer.addEntity(entity);
    }
    cleanDeadEntities() {
        for (let batch of this.entityRenderer.entityRenderBatches) {
            let refreshedBatchEntities = [];
            for (let entity of batch.entities)
                if (!entity.toDelete)
                    refreshedBatchEntities.push(entity);
            batch.entities = refreshedBatchEntities;
        }


        let refreshedEntities = [];
        for (let entity of this.entities) {
            if (!entity.toDelete)
                refreshedEntities.push(entity);
        }
        this.entities = refreshedEntities;
    }
    update(gl) {
        if (Input.quitting())
            throw "QUIT";
        this.terrain.update(gl, this, this.blockTextureAtlas);
        for (let entity of this.entities)
            entity.update(this);

        /*for (let chunk of this.terrain.chunks) {
            chunk.highlightedBlockIndex = -1;
        }*/

        this.cleanDeadEntities();
        Input.refresh();
    }
    render(gl, terrainProgram, entityProgram) {
        gl.clearColor(0.0, 0.1, 1.0, 0.2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.terrainRenderer.renderPass(gl, this, terrainProgram);
        this.entityRenderer.renderPass(gl, this, entityProgram);
    }
}