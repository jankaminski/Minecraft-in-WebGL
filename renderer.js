class Renderer {
    renderPass(gl, level, shaderProgram) {  }
}

class TerrainRenderer extends Renderer {
    constructor() { super(); }
    renderPass(gl, level, shaderProgram) {
        shaderProgram.turnOn(gl);
        shaderProgram.loadMatrix(gl, 'mView', level.camera.getViewMatrix());
        for (let chunk of level.terrain.chunks) {
            if (chunk === null)
                continue;
            let model = chunk.model;
            if (model === null)
                continue;
            model.bind(gl);
            shaderProgram.loadInt(gl, "highlightedBlockIndex", chunk.highlightedBlockIndex);
            shaderProgram.loadFloat(gl, "blockBreakProgress", chunk.blockBreakProgress);
            shaderProgram.loadVec3(gl, "chunkPosition", chunk.getWorldPosition());
            gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            model.unbind(gl);
        }
        shaderProgram.turnOff(gl);
    }
}

class EntityRenderer extends Renderer {
    constructor(level) {
        super();
        this.models = [];
        for (let entity of level.entities) {
            let model = entity.getModel();
            if (!this.models.includes(model))
                this.models.push(model);
        }      
        this.entityRenderBatches = [];
        for (let model of this.models) {
            this.entityRenderBatches.push(new EntityRenderBatch(model, level.entities));
        }
    }
    addEntity(entity) {
        let model = entity.getModel();
        if (!this.models.includes(model)) {
            this.entityRenderBatches.push(new EntityRenderBatch(model, [entity]));
            return;
        }
        for (let batch of this.entityRenderBatches) {
            if (batch.model === model) {
                batch.add(entity);
            }
        }
    }
    renderPass(gl, level, shaderProgram) {
        shaderProgram.turnOn(gl);
        shaderProgram.loadMatrix(gl, 'mView', level.camera.getViewMatrix());
        for (let batch of this.entityRenderBatches) {
            let model = batch.model;
            let entities = batch.entities;
            model.bind(gl);
            for (let entity of entities) {
                if (!entity.isToRender()) 
                    continue;
                let limbMatrices = entity.getLimbMatrices();
                for (let i = 0; i < limbMatrices.length; i++)
                    shaderProgram.loadMatrix(gl, "limbMatrices[" + i + "]", limbMatrices[i]);
                gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            }
            model.unbind(gl);
        }
        shaderProgram.turnOff(gl);
    }
}

class EntityRenderBatch {
    constructor(model, entities) {
        let batchEntities = [];
        for (let entity of entities) {
            if (entity.getModel() === model)
                batchEntities.push(entity);
        }
        this.model = model;
        this.entities = batchEntities;
    }
    add(entity) {
        if (entity.getModel() != this.model) {
            console.log("tried to push wrong entity into batch!");
            return;
        }
        this.entities.push(entity);
    }
}