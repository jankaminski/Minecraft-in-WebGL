import { Block, getBlockProperties } from "./block.js";
import { BlockAccess } from "./block-access.js";
import { Vec3 } from "./math-utils.js";
import { castRay } from "./misc-utils.js";
import { ParticleAnimation } from "./particle-animation.js";
import { AnimatedParticle } from "./particle.js";
class Explosion {
    constructor(position, strength, level, rayWithParticlesFreq, particleOnRayFreq) {
        this.position = position.clone();
        this.strength = strength;
        this.level = level;
        this.rayWithParticlesFreq = rayWithParticlesFreq;
        this.particleOnRayFreq = particleOnRayFreq;
        this.affectedChunks = [];
        let multiplier;
        if (strength < 10)
            multiplier = 200 - (strength * 10);
        else
            multiplier = 20;
        for (let i = 0; i < strength * multiplier; i++)
            this.castExplosionRay(i);
        this.punchEntities();
        for (let chunk of this.affectedChunks)
            chunk.acquireModel();
    }
    castExplosionRay(rayIndex) {
        let rv = (Math.random() * 2 - 1) * (Math.PI * 4);
        let rh = (Math.random() * 2 - 1) * (Math.PI * 4);
        let rayTip = this.position.clone();
        for (let j = 0; j < this.strength; j++) {
            if (rayIndex % this.rayWithParticlesFreq === 0 && j % this.particleOnRayFreq === 0)
                this.spawnExplosionParticle(rayTip);
            rayTip = castRay(rayTip, rv, rh, 1).tip;
            let block = BlockAccess.getBlockByWorldCoords(this.level.terrain, rayTip.x, rayTip.y, rayTip.z);
            if (block === null)
                continue;
            let blastResistance = getBlockProperties(block.getID()).blastResistance;
            let chance = this.strength / 2 + Math.random() * (this.strength / 2);
            if (chance > blastResistance)
                this.level.terrain.setBlockByBlock(block, Block.AIR);
            else
                break;
            //strength -= blastResistance / 200;
            if (!this.affectedChunks.includes(block.chunk))
                this.affectedChunks.push(block.chunk);
        }
    }
    spawnExplosionParticle(rayTip) {
        let mx = (Math.random() - 0.5) / 10;
        let my = (Math.random() - 0.5) / 10;
        let mz = (Math.random() - 0.5) / 10;
        let particle = new AnimatedParticle(rayTip, new Vec3(mx, my, mz), 20, ParticleAnimation.EXPLOSION);
        particle.affectedByGravity = false;
        this.level.animatedParticles.push(particle);
    }
    punchEntities() {
        let punchedEntities = [];
        for (let chunk of this.affectedChunks) {
            //chunk.acquireModel();
            let entities = chunk.entitiesForCollision;
            for (let entity of entities) {
                if (entity === this.level.players[0])
                    continue;
                if (punchedEntities.includes(entity))
                    continue;
                let diff = entity.getCenter().subtractedWith(this.position);
                let length = diff.length();
                if (length < this.strength) {
                    let punch = 1 - (length / this.strength);
                    let { x, y, z } = diff.multipliedByScalar(punch);
                    entity.addMomentum(x, y, z);
                    punchedEntities.push(entity);
                }
            }
        }
    }
}
export { Explosion };
