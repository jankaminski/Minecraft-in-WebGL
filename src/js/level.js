import { Terrain } from "./terrain.js";
import {
    TerrainRenderer,
    EntityRenderer,
    BlockBreakParticleRenderer
} from "./renderer.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { gl } from "./webgl-init.js";
import { arrayWithRemoved, castRay, Cooldown } from "./misc-utils.js";
import { AnimatedParticle, Particle } from "./particle.js";
import { Vec3 } from "./math-utils.js";
import { ParticleAnimation } from "./particle-animation.js";
import { BlockAccess } from "./block-access.js";
import { Block, getBlockProperties } from "./block.js";

const TERMINAL_VELOCITY = -0.4;
const GRAVITY_CONSTANT = 0.003;

class EntityRenderBatch {
    constructor(model, entities) {
        let batchEntities = [];
        for (let entity of entities) {
            if (entity.getModel() === model)
                batchEntities.push(entity);
        }
        this.model = model;
        this.entities = batchEntities;
    }
    add(entity) {
        if (entity.getModel() !== this.model) {
            console.log("tried to push wrong entity into batch!");
            return;
        }
        this.entities.push(entity);
    }
}

class Level {
    constructor() {
        this.entities = [];
        this.terrain = new Terrain();
        this.camera = new Camera(5, 500, 2);
        this.blockBreakParticles = [];
        this.animatedParticles = [];
        this.entityRenderBatches = [];
        this.players = [];
    }
    addPlayer(player) {
        this.players.push(player);
    }
    addEntity(entity) {
        this.entities.push(entity);
        let model = entity.getModel();
        for (let batch of this.entityRenderBatches) {
            if (batch.model === model) {
                batch.add(entity);
                return;
            }
        }
        this.entityRenderBatches.push(new EntityRenderBatch(model, [entity]));
    }
    cleanDeadEntities() {
        for (let batch of this.entityRenderBatches)
            batch.entities = arrayWithRemoved(batch.entities, (entity) => entity.toDelete);
        this.entities = arrayWithRemoved(this.entities, (entity) => entity.toDelete);
    }
    spawnExplosionParticle(rayTip) {
        let mx = (Math.random() - 0.5) / 10;
        let my = (Math.random() - 0.5) / 10;
        let mz = (Math.random() - 0.5) / 10;
        let p = new AnimatedParticle(
            rayTip, 
            Vec3.make(mx, my, mz), 
            20, 
            ParticleAnimation.EXPLOSION
        );
        p.affectedByGravity = false;
        this.animatedParticles.push(p);
    }
    explosion(position, strength) {
        let affectedChunks = [];
        let multiplier;
        if (strength < 10)
            multiplier = 200 - (strength * 10);
        else
            multiplier = 20;
        for (let i = 0; i < strength * multiplier; i++) {
            let rv = (Math.random() * 2 - 1) * (Math.PI * 4);
            let rh = (Math.random() * 2 - 1) * (Math.PI * 4);
            let rayTip = Vec3.copy(position);
            for (let j = 0; j < strength; j++) {
                if (i % 10 === 0 && j % 2 === 0)
                    this.spawnExplosionParticle(rayTip);
                rayTip = castRay(rayTip, rv, rh, 1).tip;
                let block = BlockAccess.getBlockByWorldCoords(this.terrain, rayTip.x, rayTip.y, rayTip.z);
                if (block === null)
                    continue;
                let blastResistance = getBlockProperties(block.getID()).blastResistance;
                let chance = strength / 2 + Math.random() * (strength / 2);
                if (chance > blastResistance)
                    this.terrain.setBlockByBlock(block, Block.AIR);
                else break;
                //strength -= blastResistance / 200;
                if (!affectedChunks.includes(block.chunk))
                    affectedChunks.push(block.chunk);
            }
        }
        for (let chunk of affectedChunks)
            chunk.acquireModel();
    }
    update() {
        this.terrain.update(this);
        for (let entity of this.entities)
            entity.update(this);
        //this.camera.followTarget(this.players[0].getCenter());
        if (this.players[0].firstPerson)
            this.camera.followInFirstPerson(this.players[0]);
        else
            this.camera.followInThirdPerson(this.players[0], 90, 0.2);
        this.cleanDeadEntities();

        if (Input.sneaking())
            this.explosion(this.players[0].getCenter(), 4);
        for (let particle of this.blockBreakParticles)
            particle.update(this);
        this.blockBreakParticles = arrayWithRemoved(this.blockBreakParticles, (particle) => particle.remainingLife <= 0);
        for (let particle of this.animatedParticles)
            particle.update(this);
        this.animatedParticles = arrayWithRemoved(this.animatedParticles, (particle) => particle.remainingLife <= 0);
    }
}

export { Level, TERMINAL_VELOCITY, GRAVITY_CONSTANT };