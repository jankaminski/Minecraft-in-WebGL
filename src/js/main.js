import { canvas, gl } from "./webgl-init.js";
import { Mat4, Vec2 } from "./math-utils.js";
import { Entity, makeEntityShaderProgram } from "./entity.js";
import { makeChunkShaderProgram } from "./chunk.js";
import { Creeper } from "./creeper.js";
import { Player } from "./player.js";
import { Level } from "./level.js";
import { CREEPER_MODEL, LEAF_MODEL } from "./models.js";
import { makeAttrPtr, Mesh } from "./model.js";
import { Framebuffer } from "./texture.js";
import { loadShaderProgramFromFiles } from "./res-utils.js";
import { Input } from "./input.js";
import { makeAnimatedParticleShaderProgram, makeBlockBreakParticleShaderProgram } from "./particle.js";
import { AnimatedParticleRenderer, BlockBreakParticleRenderer, EntityRenderer, GUIRenderer, ScreenBufferRenderer, TerrainRenderer } from "./renderer.js";
import { QUAD_INDICES, QUAD_VERTICES } from "./misc-utils.js";

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

function paintSky(red, green, blue) {
    gl.clearColor(red, green, blue, 1.0);
}

class ScreenBuffer {
    constructor(width, height) {
        this.mesh = new Mesh(QUAD_VERTICES, QUAD_INDICES, makeAttrPtr(0, 2, 4, 0), makeAttrPtr(1, 2, 4, 2));
        this.frameBuffer = new Framebuffer(width, height);
        this.unbind();
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
    let PARTICLE_PROGRAM = await makeBlockBreakParticleShaderProgram(PROJECTION_MATRIX);
    let animatedParticleProgram = await makeAnimatedParticleShaderProgram(PROJECTION_MATRIX);
    let SCREEN_BUFFER_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/frame-vert.glsl", "./src/shaders/frame-frag.glsl");
    //let GUI_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/gui-vert.glsl", "./src/shaders/gui-frag.glsl");
    
    let screenBuffer = new ScreenBuffer(1000, 600);
    
    let level = new Level();
    let player = new Player(2, 170, 2, CREEPER_MODEL);
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
    level.addEntity(new Entity(4, 186, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 185, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 184, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 183, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 182, 4, 1, 1, 1, LEAF_MODEL));
    level.addEntity(new Entity(4, 181, 4, 1, 1, 1, LEAF_MODEL));
    
    let screenBufferRenderer = new ScreenBufferRenderer(SCREEN_BUFFER_PROGRAM);
    let terrainRenderer = new TerrainRenderer(TERRAIN_PROGRAM);
    let entityRenderer = new EntityRenderer(ENTITY_PROGRAM);
    let blockBreakParticleRenderer = new BlockBreakParticleRenderer(PARTICLE_PROGRAM);
    let animatedParticleRenderer = new AnimatedParticleRenderer(animatedParticleProgram);
    let fpsCounter = new FPSCounter();

    let mainMenu = document.getElementById("main-menu");
    let pauseMenu = document.getElementById("pause-menu");

    let quitButton = document.getElementById("quit");
    let resumeButton = document.getElementById("resume");

    let quittingGame = false;

    let pause = () => {
        document.exitPointerLock();
        pauseMenu.style.display = "flex";
        pauseMenu.style.flexDirection = "column";
        pauseMenu.style.justifyContent = "center";
    };

    let resume = () => {
        canvas.requestPointerLock();
        pauseMenu.style.display = "none";
    };

    let quit = () => {
        pauseMenu.style.display = "none";
        canvas.style.display = "none";
        mainMenu.style.display = "flex";
        mainMenu.style.flexDirection = "column";
        quittingGame = true;
    };

    quitButton.addEventListener("click", quit);
    resumeButton.addEventListener("click", resume);

    let loop = () => {
        if (quittingGame)
            return;
        if (Input.pausing())
            pause();
        if (Input.resuming())
            resume();
        //console.log(Input.running);
        SCREEN_BUFFER_PROGRAM.turnOn();
        SCREEN_BUFFER_PROGRAM.loadInt("menuHidden", Input.cursorLocked ? 0 : 1);
        SCREEN_BUFFER_PROGRAM.turnOff();
        if (Input.cursorLocked)
            level.update();
        screenBuffer.bind();
        paintSky(0.0, 0.8, 0.8);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        terrainRenderer.renderPass(level);
        entityRenderer.renderPass(level);
        blockBreakParticleRenderer.renderPass(level);
        animatedParticleRenderer.renderPass(level);
        screenBuffer.unbind();
        screenBufferRenderer.renderPass(screenBuffer);
        //if (!running)
            //guiRenderer.renderPass(menu);
        fpsCounter.update();
        requestAnimationFrame(loop);
        Input.refresh();
    };
    setInterval(() => {
        console.log(fpsCounter.framesPassed());
        fpsCounter.reset();
    }, 1000);
    loop();
}

export { run };