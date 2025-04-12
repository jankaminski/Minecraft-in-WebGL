import { Terrain } from "./terrain.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Explosion } from "./explosion.js";
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
        if (entity.getModel() !== this.model)
            throw new Error("ERROR: tried to push wrong entity into batch!");
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
            batch.entities = batch.entities.filter((entity) => !entity.toDelete);
        this.entities = this.entities.filter((entity) => !entity.toDelete);
    }
    update() {
        this.terrain.update(this);
        for (let entity of this.entities)
            entity.update(this);
        if (this.players.length !== 0) {
            //this.camera.followTarget(this.players[0].getCenter());
            if (this.players[0].firstPerson)
                this.camera.followInFirstPerson(this.players[0]);
            else
                this.camera.followInThirdPerson(this.players[0], 90, 0.2);
        }
        this.cleanDeadEntities();
        if (Input.sneaking())
            new Explosion(this.players[0].getCenter(), 4, this, 10, 2);
        for (let particle of this.blockBreakParticles)
            particle.update(this);
        this.blockBreakParticles = this.blockBreakParticles.filter((particle) => particle.remainingLife > 0);
        for (let particle of this.animatedParticles)
            particle.update(this);
        this.animatedParticles = this.animatedParticles.filter((particle) => particle.remainingLife > 0);
    }
    delete() {
        /*this.terrain.delete();
        this.entities = [];
        this.blockBreakParticles = [];
        this.animatedParticles = [];
        this.entityRenderBatches = [];
        this.players = [];*/
    }
}
export { Level, TERMINAL_VELOCITY, GRAVITY_CONSTANT };
