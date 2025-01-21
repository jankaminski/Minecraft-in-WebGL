import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { 
    EntityRenderer, 
    TerrainRenderer 
} from "./renderer.js";
import { Terrain } from "./terrain.js";

class Level {
    constructor(blockTextureAtlas, ...entities) {
        this.blockTextureAtlas = blockTextureAtlas;
        this.entities = entities;
        this.terrain = new Terrain();
        this.terrainRenderer = new TerrainRenderer();
        this.entityRenderer = new EntityRenderer(this);
        this.players = [entities[0]];
        this.camera = new Camera(5, 900, 2);
    }
    addEntity(entity) {
        this.entities.push(entity);
        this.entityRenderer.addEntity(entity);
    }
    cleanDeadEntities() {
        for (let batch of this.entityRenderer.entityRenderBatches) {
            let refreshedBatchEntities = [];
            for (let entity of batch.entities)
                if (!entity.toDelete)
                    refreshedBatchEntities.push(entity);
            batch.entities = refreshedBatchEntities;
        }
    }
    update(gl) {
        if (Input.keyboard.quit)
            throw "QUIT";
        if (Input.keyboard.lookUp)
            this.entities[0].setFirstPerson(true);
        if (Input.keyboard.lookDown)
            this.entities[0].setFirstPerson(false);

        this.terrain.update(gl, this, this.blockTextureAtlas);
        if (this.entities[0].firstPerson)
            this.camera.followInFirstPerson(this.entities[0]);
        else
            this.camera.followInThirdPerson(this.entities[0], 10, 0.2);

        for (let entity of this.entities)
            entity.update(this);

        this.cleanDeadEntities();

        console.log("Entity count: " + this.entities.length);

        Input.refresh();
    }
    render(gl, terrainProgram, entityProgram) {
        gl.clearColor(0.0, 0.1, 1.0, 0.2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.terrainRenderer.renderPass(gl, this, terrainProgram);
        this.entityRenderer.renderPass(gl, this, entityProgram);
    }
}

export { Level };