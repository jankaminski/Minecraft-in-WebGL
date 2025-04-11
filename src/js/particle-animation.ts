import { Vec2 } from "./math-utils.js";

class ParticleAnimation {
    static EXPLOSION = new ParticleAnimation(1, 4);
    constructor(id, noOfFrames) {
        this.id = id;
        this.noOfFrames = noOfFrames;
    }
}

const PARTICLE_ANIMATION_MAX_SIZE = Vec2.make(32, 32);

export {
    ParticleAnimation,
    PARTICLE_ANIMATION_MAX_SIZE
};