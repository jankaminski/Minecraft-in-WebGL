import { canvas, gl } from "./webgl-init.js";
import { Mat4, Vec2 } from "./math-utils.js";
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
import { BlockBreakParticleRenderer, EntityRenderer, GUIRenderer, ScreenBufferRenderer, TerrainRenderer } from "./renderer.js";
import { QUAD_INDICES, QUAD_VERTICES } from "./misc-utils.js";
import { GUI } from "./gui.js";

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
    let PARTICLE_PROGRAM = await makeParticleShaderProgram(PROJECTION_MATRIX);
    let SCREEN_BUFFER_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/frame-vert.glsl", "./src/shaders/frame-frag.glsl");
    //let GUI_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/gui-vert.glsl", "./src/shaders/gui-frag.glsl");
    
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
    
    let screenBufferRenderer = new ScreenBufferRenderer(SCREEN_BUFFER_PROGRAM);
    let terrainRenderer = new TerrainRenderer(TERRAIN_PROGRAM);
    let entityRenderer = new EntityRenderer(ENTITY_PROGRAM);
    let blockBreakParticleRenderer = new BlockBreakParticleRenderer(PARTICLE_PROGRAM);
    //let guiRenderer = new GUIRenderer(GUI_PROGRAM);
    let fpsCounter = new FPSCounter();

    //let running = true;
    //let menu = new GUI(Vec2.make(-0.7, -0.7), Vec2.make(0.7, 0.7));
    let mainMenu = document.getElementById("main-menu");
    let pauseMenu = document.getElementById("pause-menu");

    let quitButton = document.getElementById("quit");
    let resumeButton = document.getElementById("resume");

    let quittingGame = false;

    quitButton.addEventListener("click", () => {
        pauseMenu.style.display = "none";
        canvas.style.display = "none";
        mainMenu.style.display = "flex";
        mainMenu.style.flexDirection = "column";
        quittingGame = true;
    });
    resumeButton.addEventListener("click", () => {
        canvas.requestPointerLock();
        pauseMenu.style.display = "none";
    });

    let loop = () => {
        if (quittingGame)
            return;

        if (Input.quitting()) {
            document.exitPointerLock();
            pauseMenu.style.display = "flex";
            pauseMenu.style.flexDirection = "column";
            pauseMenu.style.justifyContent = "center";
            //pauseMenu.style.alignItems = "center";
        }
        if (Input.resuming()) {
            canvas.requestPointerLock();
            pauseMenu.style.display = "none";
        }
        //console.log(Input.running);
        SCREEN_BUFFER_PROGRAM.turnOn();
        SCREEN_BUFFER_PROGRAM.loadInt("menuHidden", Input.running ? 0 : 1);
        SCREEN_BUFFER_PROGRAM.turnOff();
        
        if (Input.running) {
            
            level.update();
        } else {
            
        }
        screenBuffer.bind();
        paintSky(0.0, 0.8, 0.8);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        terrainRenderer.renderPass(level);
        entityRenderer.renderPass(level);
        blockBreakParticleRenderer.renderPass(level);
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