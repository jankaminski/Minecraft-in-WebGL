import { Terrain } from "./terrain.js";
import {
    TerrainRenderer,
    EntityRenderer
} from "./renderer.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { gl } from "./webgl-init.js";
import { arrayWithRemoved } from "./misc-utils.js";

class Level {
    constructor(...entities) {
        this.entities = entities;
        this.terrain = new Terrain();
        this.terrainRenderer = new TerrainRenderer();
        this.entityRenderer = new EntityRenderer(this);
        this.players = [entities[0]];
        this.camera = new Camera(5, 1000, 2);
    }
    addEntity(entity) {
        this.entities.push(entity);
        this.entityRenderer.addEntity(entity);
    }
    cleanDeadEntities() {
        for (let batch of this.entityRenderer.entityRenderBatches)
            batch.entities = arrayWithRemoved(batch.entities, (entity) => entity.toDelete);
        this.entities = arrayWithRemoved(this.entities, (entity) => entity.toDelete);
    }
    update() {
        if (Input.quitting())
            throw "QUIT";
        this.terrain.update(this);
        for (let entity of this.entities)
            entity.update(this);
        //this.camera.followTarget(this.entities[0].getCenter());
        if (this.entities[0].firstPerson)
            this.camera.followInFirstPerson(this.entities[0]);
        else
            this.camera.followInThirdPerson(this.entities[0], 10, 0.2);
        this.cleanDeadEntities();
        Input.refresh();
    }
    render(terrainProgram, entityProgram) {
        gl.clearColor(0.0, 0.1, 1.0, 0.2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.terrainRenderer.renderPass(this, terrainProgram);
        this.entityRenderer.renderPass(this, entityProgram);
    }
}

export { Level };