import { BlockAccess } from "./block-access.js";
import { GRAVITY_CONSTANT, TERMINAL_VELOCITY } from "./level.js";
import { Mat4, Vec2, Vec3 } from "./math-utils.js";
import { PARTICLE_ANIMATION_MAX_SIZE } from "./particle-animation.js";
import { loadShaderProgramFromFiles } from "./res-utils.js";
import { BLOCK_PIXELS, BLOCK_TEX_ATLAS_COLUMNS, BLOCK_TEX_ATLAS_ROWS, PARTICLE_TEX_ATLAS_COLUMNS, PARTICLE_TEX_ATLAS_ROWS } from "./textures.js";
class Particle {
    constructor(position, size, momentum, remainingLife) {
        this.position = position.clone();
        this.size = size.clone();
        this.momentum = momentum.clone();
        this.remainingLife = remainingLife;
        this.affectedByGravity = true;
    }
    getWorldMatrix(camera) {
        let matrix = Mat4.identity();
        matrix = Mat4.translate(matrix, this.position);
        let viewMatrix = camera.getViewMatrix();
        matrix[0] = viewMatrix[0];
        matrix[1] = viewMatrix[4];
        matrix[2] = viewMatrix[8];
        matrix[4] = viewMatrix[1];
        matrix[5] = viewMatrix[5];
        matrix[6] = viewMatrix[9];
        matrix[8] = viewMatrix[2];
        matrix[9] = viewMatrix[6];
        matrix[10] = viewMatrix[10];
        matrix = Mat4.scale(matrix, new Vec3(this.size.x, this.size.y, 1));
        return matrix;
    }
    update(level) {
        if (this.remainingLife > 0)
            this.remainingLife--;
        if (this.affectedByGravity && this.momentum.y > TERMINAL_VELOCITY)
            this.momentum.y -= GRAVITY_CONSTANT;
        let block = BlockAccess.getBlockByWorldCoords(level.terrain, this.position.x, this.position.y, this.position.z);
        if (block !== null)
            if (block.isSolid())
                this.momentum = new Vec3(0.0, 0.0, 0.0);
        this.position = this.position.withAdded(this.momentum);
    }
}
class BlockBreakParticle extends Particle {
    constructor(position, momentum, remainingLife, blockID, pixel) {
        super(position, new Vec2(0.08, 0.08), momentum, remainingLife);
        this.blockID = blockID;
        this.pixel = pixel.clone();
    }
}
class AnimatedParticle extends Particle {
    constructor(position, momentum, remainingLife, animation) {
        super(position, PARTICLE_ANIMATION_MAX_SIZE.dividedByScalar(2 * BLOCK_PIXELS), momentum, remainingLife);
        this.lifespan = remainingLife;
        this.animation = animation;
    }
}
async function makeBlockBreakParticleShaderProgram(projectionMatrix) {
    let particleProgram = await loadShaderProgramFromFiles("./src/shaders/block-break-particle-vert.glsl", "./src/shaders/block-break-particle-frag.glsl");
    particleProgram.turnOn();
    particleProgram.loadMatrix("mProj", projectionMatrix);
    particleProgram.loadFloat("texAtlasNoOfRows", BLOCK_TEX_ATLAS_ROWS);
    particleProgram.loadFloat("texAtlasNoOfColumns", BLOCK_TEX_ATLAS_COLUMNS);
    particleProgram.turnOff();
    return particleProgram;
}
async function makeAnimatedParticleShaderProgram(projectionMatrix) {
    let particleProgram = await loadShaderProgramFromFiles("./src/shaders/animated-particle-vert.glsl", "./src/shaders/animated-particle-frag.glsl");
    particleProgram.turnOn();
    particleProgram.loadMatrix("mProj", projectionMatrix);
    particleProgram.loadFloat("texAtlasNoOfRows", PARTICLE_TEX_ATLAS_ROWS);
    particleProgram.loadFloat("texAtlasNoOfColumns", PARTICLE_TEX_ATLAS_COLUMNS);
    particleProgram.turnOff();
    return particleProgram;
}
export { Particle, BlockBreakParticle, AnimatedParticle, makeBlockBreakParticleShaderProgram, makeAnimatedParticleShaderProgram };
