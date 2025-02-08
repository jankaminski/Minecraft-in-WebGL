import { arrayWithRemoved } from "./misc-utils.js";
import { BLOCK_BREAK_PARTICLE_MODEL } from "./particle.js";
import { gl } from "./webgl-init.js";

class Renderer {
    constructor(shaderProgram) {
        this.shaderProgram = shaderProgram;
    }
    renderPass(level, shaderProgram) {  }
    setShaderProgram(shaderProgram) {
        this.shaderProgram = shaderProgram;
    }
}

class TerrainRenderer extends Renderer {
    constructor(shaderProgram) { 
        super(shaderProgram); 
    }
    renderPass(level) {
        this.shaderProgram.turnOn();
        this.shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
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
            this.shaderProgram.loadInt("highlightedBlockIndex", highlightedBlockIndex);
            this.shaderProgram.loadFloat("blockBreakProgress", chunk.blockBreakProgress);
            this.shaderProgram.loadVec3("chunkPosition", chunk.getWorldPositionArray());
            gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            model.unbind();
        }
        this.shaderProgram.turnOff();
    }
}

class EntityRenderer extends Renderer {
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(level) {
        this.shaderProgram.turnOn();
        this.shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
        for (let batch of level.entityRenderBatches) {
            let model = batch.model;
            let entities = batch.entities;
            model.bind();
            for (let entity of entities) {
                if (!entity.isToRender()) 
                    continue;
                let limbMatrices = entity.getLimbMatrices();
                for (let i = 0; i < limbMatrices.length; i++)
                    this.shaderProgram.loadMatrix("limbMatrices[" + i + "]", limbMatrices[i]);
                gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            }
            model.unbind();
        }
        this.shaderProgram.turnOff();
    }
}

class ScreenBufferRenderer extends Renderer {
    constructor(shaderProgram, screenBuffer) {
        super(shaderProgram);
        this.screenBuffer = screenBuffer;
    }
    renderPass(level) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.shaderProgram.turnOn();
        this.screenBuffer.mesh.bind();
        this.screenBuffer.frameBuffer.bindTexture();
        gl.drawElements(gl.TRIANGLES, this.screenBuffer.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
        this.screenBuffer.mesh.unbind();
        this.shaderProgram.turnOff();
        this.screenBuffer.frameBuffer.unbindTexture();
    }
}

class BlockBreakParticleRenderer extends Renderer {
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(level) {
        let particles = level.particles;
        let model = BLOCK_BREAK_PARTICLE_MODEL;
        this.shaderProgram.turnOn();
        this.shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
        model.bind();
        for (let particle of particles) {
            this.shaderProgram.loadFloat("blockID", particle.blockID);
            this.shaderProgram.loadVec2("pixel", [particle.pixel.x, particle.pixel.y]);
            this.shaderProgram.loadMatrix("mWorld", particle.getWorldMatrix(level.camera));
            gl.drawElements(gl.TRIANGLES, model.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
        }
        model.unbind();
        this.shaderProgram.turnOff();
    }
}

export {
    EntityRenderer,
    TerrainRenderer,
    ScreenBufferRenderer,
    BlockBreakParticleRenderer
};