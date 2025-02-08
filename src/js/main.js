import { canvas, gl } from "./webgl-init.js";
import { Mat4 } from "./math-utils.js";
import { Entity, makeEntityShaderProgram } from "./entity.js";
import { makeChunkShaderProgram } from "./chunk.js";
import { Creeper } from "./creeper.js";
import { Player } from "./player.js";
import { Level } from "./level.js";
import { CREEPER_MODEL, LEAF_MODEL } from "./models.js";
import { ShaderProgram } from "./shader-program.js";
import { makeAttrPtr, Mesh } from "./model.js";
import { Framebuffer } from "./texture.js";
import { loadShaderProgramFromFiles } from "./res-utils.js";
import { Input } from "./input.js";
import { makeParticleShaderProgram } from "./particle.js";
//import { ENTITY_PROGRAM, PARTICLE_PROGRAM, SCREEN_BUFFER_PROGRAM, TERRAIN_PROGRAM } from "./shader-programs.js";
import { BlockBreakParticleRenderer, EntityRenderer, ScreenBufferRenderer, TerrainRenderer } from "./renderer.js";

class FPSCounter {
    constructor() {
        this.msPrev = window.performance.now();
        this.fps = 60;
        this.msPerFrame = 1000 / this.fps;
        this.frames = 0;
    }
    reset() {
        this.frames = 0;
    }
    update() {
        const msNow = window.performance.now();
        const msPassed = msNow - this.msPrev;
        let limitPassed = false;
        if (msPassed < this.msPerFrame) 
            limitPassed = true;
        const excessTime = msPassed % this.msPerFrame;
        this.msPrev = msNow - excessTime;
        if (!limitPassed)
            this.frames++;
    }
    framesPassed() {
        return this.frames;
    }
}

function clear() {
    gl.clearColor(0.0, 0.1, 1.0, 0.2);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

class ScreenBuffer {
    constructor(width, height) {
        const screenBufferVertices = [
            -1, -1, 0, 0,
             1, -1, 1, 0,
            -1,  1, 0, 1,
             1,  1, 1, 1
        ];
        const screenBufferIndices = [
            0, 1, 3, 3, 2, 0
        ];
        this.mesh = new Mesh(screenBufferVertices, screenBufferIndices, makeAttrPtr(0, 2, 4, 0), makeAttrPtr(1, 2, 4, 2));
        this.frameBuffer = new Framebuffer(width, height);
    }
    bind() {
        this.frameBuffer.bindBuffer();
    }
    unbind() {
        this.frameBuffer.unbindBuffer();
    }
}

async function run() {

    const PROJECTION_MATRIX = Mat4.perspective(Math.PI / 6, canvas.clientWidth, canvas.clientHeight, 0.1, 1000.0);
    
    let TERRAIN_PROGRAM = await makeChunkShaderProgram(PROJECTION_MATRIX);
    let ENTITY_PROGRAM = await makeEntityShaderProgram(PROJECTION_MATRIX);
    let PARTICLE_PROGRAM = await makeParticleShaderProgram(PROJECTION_MATRIX);
    let SCREEN_BUFFER_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/frame-vert.glsl", "./src/shaders/frame-frag.glsl");
    
    let screenBuffer = new ScreenBuffer(1000, 600);
    
    let level = new Level();
    let player = new Player(2, 70, 2, CREEPER_MODEL);
    level.addEntity(player);
    level.addPlayer(player);
    level.addEntity(new Creeper(14, 90, -14, CREEPER_MODEL));
    level.addEntity(new Creeper(9, 90, -12, CREEPER_MODEL ));
    level.addEntity(new Creeper(6, 90, -7, CREEPER_MODEL  ));
    level.addEntity(new Creeper(12, 90, -3, CREEPER_MODEL ));
    level.addEntity(new Creeper(-26, 80, 20, CREEPER_MODEL));
    level.addEntity(new Creeper(-17, 80, 28, CREEPER_MODEL));
    level.addEntity(new Creeper(-22, 80, 30, CREEPER_MODEL));
    level.addEntity(new Creeper(-20, 80, 24, CREEPER_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 80, 4, 1, 1, 1, LEAF_MODEL));
    
    let screenBufferRenderer = new ScreenBufferRenderer(SCREEN_BUFFER_PROGRAM, screenBuffer);
    let terrainRenderer = new TerrainRenderer(TERRAIN_PROGRAM);
    let entityRenderer = new EntityRenderer(ENTITY_PROGRAM);
    let blockBreakParticleRenderer = new BlockBreakParticleRenderer(PARTICLE_PROGRAM);
    let fpsCounter = new FPSCounter();

    let loop = () => {
        level.update();
        screenBuffer.bind();
        gl.clearColor(0.0, 0.1, 1.0, 0.2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        terrainRenderer.renderPass(level);
        entityRenderer.renderPass(level);
        blockBreakParticleRenderer.renderPass(level);
        screenBuffer.unbind();
        screenBufferRenderer.renderPass(level);
        requestAnimationFrame(loop);
        fpsCounter.update();
        for (let i = 0; i < level.entityRenderBatches.length; i++) {
            console.log("batch " + i + ": " + level.entityRenderBatches[i].entities.length);

        }
    };
    setInterval(() => {
        console.log(fpsCounter.framesPassed());
        fpsCounter.reset();
    }, 1000);
    loop();
}

export { run };