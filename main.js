import { canvas, gl } from "./webgl-init.js";
import { Mat4 } from "./math-utils.js";
import { makeEntityShaderProgram } from "./entity.js";
import { makeChunkShaderProgram } from "./chunk.js";
import { Creeper } from "./creeper.js";
import { Player } from "./player.js";
import { BLOCK_TEXTURE_ATLAS } from "./textures.js";
import { Level } from "./level.js";
import { CREEPER_MODEL } from "./models.js";

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

async function run() {
    const PROJECTION_MATRIX = Mat4.perspective(Math.PI / 6, canvas.clientWidth, canvas.clientHeight, 0.1, 1000.0);
    
    let terrainProgram = await makeChunkShaderProgram(gl, PROJECTION_MATRIX);
    let entityProgram = await makeEntityShaderProgram(gl, PROJECTION_MATRIX);

    let level = new Level(
        BLOCK_TEXTURE_ATLAS, 
        new Player(2, 70, 2, CREEPER_MODEL), 
        new Creeper(14, 90, -14, CREEPER_MODEL),
        new Creeper(9, 90, -12, CREEPER_MODEL),
        new Creeper(6, 90, -7, CREEPER_MODEL),
        new Creeper(12, 90, -3, CREEPER_MODEL),
        new Creeper(-26, 80, 20, CREEPER_MODEL),
        new Creeper(-17, 80, 28, CREEPER_MODEL),
        new Creeper(-22, 80, 30, CREEPER_MODEL),
        new Creeper(-20, 80, 24, CREEPER_MODEL)
    );

    let fpsCounter = new FPSCounter();

    let loop = () => {
        level.update(gl);
        level.render(gl, terrainProgram, entityProgram);
        requestAnimationFrame(loop);
        fpsCounter.update();
    };
    setInterval(() => {
        console.log(fpsCounter.framesPassed());
        fpsCounter.reset();
    }, 1000);
    loop();
}

export { run };