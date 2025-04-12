import { canvas, gl } from "./webgl-init.js";
import { Mat4 } from "./math-utils.js";
import { Entity, makeEntityShaderProgram } from "./entity.js";
import { makeChunkShaderProgram } from "./chunk.js";
import { Creeper } from "./creeper.js";
import { Player } from "./player.js";
import { Level } from "./level.js";
import { CREEPER_MODEL, LEAF_MODEL } from "./models.js";
import { loadShaderProgramFromFiles } from "./res-utils.js";
import { Input } from "./input.js";
import { makeAnimatedParticleShaderProgram, makeBlockBreakParticleShaderProgram } from "./particle.js";
import { AnimatedParticleRenderer, BlockBreakParticleRenderer, EntityRenderer /*, GUIRenderer*/, ScreenBuffer, ScreenBufferRenderer, TerrainRenderer } from "./renderer.js";
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
async function run() {
    const PROJECTION_MATRIX = Mat4.perspective(Math.PI / 6, canvas.clientWidth, canvas.clientHeight, 0.1, 1000.0);
    let TERRAIN_PROGRAM = await makeChunkShaderProgram(PROJECTION_MATRIX);
    let ENTITY_PROGRAM = await makeEntityShaderProgram(PROJECTION_MATRIX);
    let PARTICLE_PROGRAM = await makeBlockBreakParticleShaderProgram(PROJECTION_MATRIX);
    let animatedParticleProgram = await makeAnimatedParticleShaderProgram(PROJECTION_MATRIX);
    let SCREEN_BUFFER_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/frame-vert.glsl", "./src/shaders/frame-frag.glsl");
    //let GUI_PROGRAM = await loadShaderProgramFromFiles("./src/shaders/gui-vert.glsl", "./src/shaders/gui-frag.glsl");
    let screenBuffer = new ScreenBuffer(1000, 600);
    //let inventory = new GUI(Vec2.make(-0.5, -0.5), Vec2.make(0.5, 0.5));
    //let hotbar = new GUI(Vec2.make(-0.7, -0.95), Vec2.make(0.7, -0.8));
    //hotbar.active = true;
    let level = new Level();
    let player = new Player(2, 170, 2, CREEPER_MODEL);
    level.addEntity(player);
    level.addPlayer(player);
    level.addEntity(new Creeper(14, 190, -14, CREEPER_MODEL));
    level.addEntity(new Creeper(9, 190, -12, CREEPER_MODEL));
    level.addEntity(new Creeper(6, 190, -7, CREEPER_MODEL));
    level.addEntity(new Creeper(12, 190, -3, CREEPER_MODEL));
    level.addEntity(new Creeper(-26, 180, 20, CREEPER_MODEL));
    level.addEntity(new Creeper(-17, 180, 28, CREEPER_MODEL));
    level.addEntity(new Creeper(-22, 180, 30, CREEPER_MODEL));
    level.addEntity(new Creeper(-20, 180, 24, CREEPER_MODEL));
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
    //    let guiRenderer = new GUIRenderer(GUI_PROGRAM);
    let fpsCounter = new FPSCounter();
    let tab = false;
    let loop = () => {
        if (quittingGame) {
            return;
        }
        //console.log("es: " + level.entities.length);
        if (Input.pausing())
            pause();
        if (Input.resuming())
            resume();
        let oldTab = tab;
        tab = Input.gettingInventory();
        if (tab && !oldTab) {
            //inventory.active = !inventory.active;
        }
        SCREEN_BUFFER_PROGRAM.turnOn();
        SCREEN_BUFFER_PROGRAM.loadInt("menuHidden", Input.cursorLocked ? 0 : 1);
        //SCREEN_BUFFER_PROGRAM.loadInt("guiActive", inventory.active ? 1 : 0);
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
        //guiRenderer.renderPass([inventory, hotbar]);
        screenBuffer.unbind();
        screenBufferRenderer.renderPass(screenBuffer);
        fpsCounter.update();
        requestAnimationFrame(loop);
        Input.refresh();
    };
    setInterval(() => {
        console.log(fpsCounter.framesPassed());
        fpsCounter.reset();
    }, 1000);
    requestAnimationFrame(loop); //loop();
    console.log("Quit");
    //level.delete();  
}
let startButton = document.getElementById("start");
let hotbar = document.getElementById("hotbar");
let mainMenu = document.getElementById("main-menu");
let pauseMenu = document.getElementById("pause-menu");
let quitButton = document.getElementById("quit");
let resumeButton = document.getElementById("resume");
let quittingGame = false;
let start = () => {
    if (mainMenu === null)
        throw new Error("ERROR: could not access main menu in DOM");
    if (pauseMenu === null)
        throw new Error("ERROR: could not access pause menu in DOM");
    if (hotbar === null)
        throw new Error("ERROR: could not access hotbar in DOM");
    mainMenu.classList.add("hide");
    canvas.classList.add("show");
    Input.init();
    canvas.requestPointerLock();
    quittingGame = false;
    pauseMenu.classList.remove("pause");
    hotbar.classList.remove("hide");
    hotbar.classList.remove("pause");
    run();
};
let pause = () => {
    if (pauseMenu === null)
        throw new Error("ERROR: could not access pause menu in DOM");
    if (hotbar === null)
        throw new Error("ERROR: could not access hotbar in DOM");
    document.exitPointerLock();
    pauseMenu.classList.add("pause");
    hotbar.classList.add("pause");
};
let resume = () => {
    if (pauseMenu === null)
        throw new Error("ERROR: could not access pause menu in DOM");
    if (hotbar === null)
        throw new Error("ERROR: could not access hotbar in DOM");
    canvas.requestPointerLock();
    pauseMenu.classList.remove("pause");
    hotbar.classList.remove("pause");
};
let quit = () => {
    if (mainMenu === null)
        throw new Error("ERROR: could not access main menu in DOM");
    if (pauseMenu === null)
        throw new Error("ERROR: could not access pause menu in DOM");
    if (hotbar === null)
        throw new Error("ERROR: could not access hotbar in DOM");
    pauseMenu.classList.remove("pause");
    canvas.classList.remove("show");
    mainMenu.classList.remove("hide");
    hotbar.classList.add("hide");
    quittingGame = true;
};
if (startButton === null)
    throw new Error("ERROR: could not access start button in DOM");
if (resumeButton === null)
    throw new Error("ERROR: could not access resume button in DOM");
if (quitButton === null)
    throw new Error("ERROR: could not access quit button in DOM");
console.log("Launched");
startButton.addEventListener("click", start);
resumeButton.addEventListener("click", resume);
quitButton.addEventListener("click", quit);
