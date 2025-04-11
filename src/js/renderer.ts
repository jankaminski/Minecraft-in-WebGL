import { BLOCK_BREAK_PARTICLE_MODEL, ANIMATED_PARTICLE_MODEL } from "./models.js";
import { gl } from "./webgl-init.js";

class Renderer {
    constructor(shaderProgram) {
        this.shaderProgram = shaderProgram;
    }
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
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(screenBuffer) {
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.shaderProgram.turnOn();
        screenBuffer.mesh.bind();
        screenBuffer.frameBuffer.bindTexture();
        gl.drawElements(gl.TRIANGLES, screenBuffer.mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
        screenBuffer.mesh.unbind();
        screenBuffer.frameBuffer.unbindTexture();
        this.shaderProgram.turnOff();
    }
}

class BlockBreakParticleRenderer extends Renderer {
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(level) {
        let particles = level.blockBreakParticles;
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

/*class GUIRenderer extends Renderer {
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(guis) {
        this.shaderProgram.turnOn();
        for (let gui of guis) {
            if (!gui.active)
                continue;
            let mesh = gui.mesh;
            mesh.bind();
            gl.drawElements(gl.TRIANGLES, mesh.indicesCount, gl.UNSIGNED_SHORT, 0);
            mesh.unbind();
        }
        this.shaderProgram.turnOff();
    }
}*/

class AnimatedParticleRenderer extends Renderer {
    constructor(shaderProgram) {
        super(shaderProgram);
    }
    renderPass(level) {
        let particles = level.animatedParticles;
        let model = ANIMATED_PARTICLE_MODEL;
        this.shaderProgram.turnOn();
        this.shaderProgram.loadMatrix("mView", level.camera.getViewMatrix());
        model.bind();
        for (let particle of particles) {
            let animation = particle.animation;
            this.shaderProgram.loadFloat("particleID", animation.id);
            this.shaderProgram.loadFloat("remainingLife", particle.remainingLife);
            this.shaderProgram.loadFloat("lifespan", particle.lifespan);
            this.shaderProgram.loadFloat("noOfFrames", animation.noOfFrames);
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
    BlockBreakParticleRenderer,
    AnimatedParticleRenderer//,
    //GUIRenderer
};