import { Terrain } from "./terrain.js";
import {
    TerrainRenderer,
    EntityRenderer,
    BlockBreakParticleRenderer
} from "./renderer.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { gl } from "./webgl-init.js";
import { arrayWithRemoved, Cooldown } from "./misc-utils.js";
import { Particle } from "./particle.js";
import { Vec3 } from "./math-utils.js";

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
        if (entity.getModel() != this.model) {
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
        this.particles = [];
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
    update() {
        if (Input.quitting())
            throw "QUIT";
        this.terrain.update(this);
        for (let entity of this.entities)
            entity.update(this);
        //this.camera.followTarget(this.players[0].getCenter());
        if (this.players[0].firstPerson)
            this.camera.followInFirstPerson(this.players[0]);
        else
            this.camera.followInThirdPerson(this.players[0], 10, 0.2);
        this.cleanDeadEntities();

        for (let particle of this.particles)
            particle.update(this);
        this.particles = arrayWithRemoved(this.particles, (particle) => particle.remainingLife <= 0);

        Input.refresh();
    }
}

export { Level, TERMINAL_VELOCITY, GRAVITY_CONSTANT };