import { Vec2 } from "./math-utils.js";

class ParticleAnimation {
    id: number;
    noOfFrames: number;
    static EXPLOSION = new ParticleAnimation(1, 4);
    constructor(id: number, noOfFrames: number) {
        this.id = id;
        this.noOfFrames = noOfFrames;
    }
}

const PARTICLE_ANIMATION_MAX_SIZE = new Vec2(32, 32);

export {
    ParticleAnimation,
    PARTICLE_ANIMATION_MAX_SIZE
};