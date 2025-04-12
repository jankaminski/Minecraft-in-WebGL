import { Vec2 } from "./math-utils.js";
class ParticleAnimation {
    constructor(id, noOfFrames) {
        this.id = id;
        this.noOfFrames = noOfFrames;
    }
}
ParticleAnimation.EXPLOSION = new ParticleAnimation(1, 4);
const PARTICLE_ANIMATION_MAX_SIZE = new Vec2(32, 32);
export { ParticleAnimation, PARTICLE_ANIMATION_MAX_SIZE };
