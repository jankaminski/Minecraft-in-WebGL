import { gl } from "./webgl-init.js";

class Renderer {
    renderPass(level, shaderProgram) {  }
}

class TerrainRenderer extends Renderer {
    constructor() { super(); }
    renderPass(level, shaderProgram) {
        shaderProgram.turnOn();
        shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
        for (let chunk of level.terrain.chunks) {
            if (chunk === null)
                continue;
            let model = chunk.model;
            if (model === null)
                continue;
            model.bind();
            let highlightedBlockIndex = -1;
            if (chunk.isHighlighted)
                highlightedBlockIndex = chunk.highlightedBlockIndex;
            shaderProgram.loadInt("highlightedBlockIndex", highlightedBlockIndex);
            shaderProgram.loadFloat("blockBreakProgress", chunk.blockBreakProgress);
            shaderProgram.loadVec3("chunkPosition", chunk.getWorldPositionArray());
            gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            model.unbind();
        }
        shaderProgram.turnOff();
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
    renderPass(level, shaderProgram) {
        shaderProgram.turnOn();
        shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
        for (let batch of this.entityRenderBatches) {
            let model = batch.model;
            let entities = batch.entities;
            model.bind();
            for (let entity of entities) {
                if (!entity.isToRender()) 
                    continue;
                let limbMatrices = entity.getLimbMatrices();
                for (let i = 0; i < limbMatrices.length; i++)
                    shaderProgram.loadMatrix("limbMatrices[" + i + "]", limbMatrices[i]);
                gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            }
            model.unbind();
        }
        shaderProgram.turnOff();
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

class ScreenBufferRenderer extends Renderer {
    constructor() {
        super();
    }
    renderPass(level, shaderProgram) {

    }
}

export {
    EntityRenderer,
    TerrainRenderer,
    ScreenBufferRenderer
};