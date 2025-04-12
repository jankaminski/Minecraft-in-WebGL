import { BlockAccess } from "./block-access.js";
import { BLOCK_SIZE } from "./block.js";
import { Chunk } from "./chunk.js";
import { 
    Collidable,
    Collision,
    detectCollision, 
    detectCollisionWithTerrain 
} from "./collision.js";
import { GRAVITY_CONSTANT, Level, TERMINAL_VELOCITY } from "./level.js";
import { 
    Mat4, 
    Vec3 
} from "./math-utils.js";
import { 
    VertexAttribute, 
    makeMeshIndices, 
    Mesh, 
    Model
} from "./model.js";
import { 
    loadShaderProgramFromFiles
} from "./res-utils.js";

class Entity implements Collidable {
    center: Vec3;
    size: Vec3;
    rotation: Vec3;
    momentum: Vec3;
    affectedByGravity: boolean;
    feetOnGround: boolean;
    toRender: boolean;
    model: Model;
    toDelete: boolean;
    constructor(
        posX: number, 
        posY: number, 
        posZ: number, 
        sizeX: number, 
        sizeY: number, 
        sizeZ: number, 
        model: Model
    ) {
        this.rotation = new Vec3(0.0, 0.0, 0.0);
        this.center = new Vec3(posX, posY, posZ);
        this.size = new Vec3(sizeX, sizeY, sizeZ);
        this.toRender = true;
        this.model = model;
        this.momentum = new Vec3(0.0, 0.0, 0.0);
        this.affectedByGravity = true;
        this.feetOnGround = false;
        this.toDelete = false;
    }
    getLimbMatrices() {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, this.getCenter());
        worldMat = Mat4.rotate(worldMat, this.rotation.x, new Vec3(1, 0, 0));
        worldMat = Mat4.rotate(worldMat, this.rotation.y, new Vec3(0, 1, 0));
        worldMat = Mat4.rotate(worldMat, this.rotation.z, new Vec3(0, 0, 1));
        return [worldMat];
    }
    getEyePos() {
        return this.center.clone();
    }
    getModel() {
        return this.model;
    }
    isToRender() { 
        return this.toRender; 
    }
    setToRender(toRender: boolean) {
        this.toRender = toRender;
    }
    getMomentum() {
        return this.momentum.clone();
    }
    setMomentum(momentum: Vec3) {
        this.momentum = momentum.clone();
    }
    setMomX(momX: number) {
        this.momentum.x = momX;
    }
    setMomY(momY: number) {
        this.momentum.y = momY;
    }
    setMomZ(momZ: number) {
        this.momentum.z = momZ;
    }
    addMomentumV(momentum: Vec3) {
        this.momentum = this.momentum.withAdded(momentum);
    }
    addMomentum(x: number, y: number, z: number) {
        this.momentum = this.momentum.withAdded(new Vec3(x, y, z));
    }
    addMomX(momX: number) {
        this.momentum.x += momX;
    }
    addMomY(momY: number) {
        this.momentum.y += momY;
    }
    addMomZ(momZ: number) {
        this.momentum.z += momZ;
    }
    getSize() {
        return this.size.clone();
    }
    getCenter() {
        return this.center.clone();
    }
    getMinX(): number {
        return this.center.x - this.size.x / 2;
    }
    getMaxX(): number {
        return this.center.x + this.size.x / 2;
    }
    getMinY(): number {
        return this.center.y - this.size.y / 2;
    }
    getMaxY(): number {
        return this.center.y + this.size.y / 2;
    }
    getMinZ(): number {
        return this.center.z - this.size.z / 2;
    }
    getMaxZ(): number {
        return this.center.z + this.size.z / 2;
    }
    setCenter(center: Vec3) {
        this.center = center.clone();
    }
    shiftPosition(x: number, y: number, z: number) {
        this.center = this.center.withAdded(new Vec3(x, y, z));
    }
    shiftPosX(shift: number) {
        this.center.x += shift;
    }
    shiftPosY(shift: number) {
        this.center.y += shift;
    }
    shiftPosZ(shift: number) {
        this.center.z += shift;
    }
    hasFeetOnGround() {
        return this.feetOnGround;
    }
    setFeetOnGround(feetOnGround: boolean) {
        this.feetOnGround = feetOnGround;
    }
    isAffectedByGravity() {
        return this.affectedByGravity;
    }
    setAffectedByGravity(affectedByGravity: boolean) {
        this.affectedByGravity = affectedByGravity;
    }
    getRotation() {
        return this.rotation.clone();
    }
    getRotX() {
        return this.rotation.x;
    }
    getRotY() {
        return this.rotation.y;
    }
    setRotX(rotX: number) {
        this.rotation.x = rotX;
    }
    setRotY(rotY: number) {
        this.rotation.y = rotY;
    }
    rotate(turnH: number, turnV: number) {
        this.rotation.x += turnV;
        this.rotation.y += turnH;
        if (this.rotation.x > Math.PI / 2 - 0.001) {
            this.rotation.x = Math.PI / 2 - 0.001;
        }
        if (this.rotation.x < (-Math.PI / 2) + 0.001) {
            this.rotation.x = (-Math.PI / 2) + 0.001;
        }
    }
    onCollision(collision: Collision, level: Level) {  }
    unsinkInBlock() {
        console.log("im inside");
        let momentum = this.getMomentum();
        if (momentum.x > 0) 
            this.shiftPosX(-0.01);
        if (momentum.x < 0) 
            this.shiftPosX( 0.01);
        if (momentum.y > 0) 
            this.shiftPosY(-0.01);
        if (momentum.y < 0) 
            this.shiftPosY( 0.01);
        if (momentum.z > 0) 
            this.shiftPosZ(-0.01);
        if (momentum.z < 0) 
            this.shiftPosZ( 0.01);
    }
    getExternalForces(level: Level) { 
        return { 
            turn: { horiz : 0, vert : 0 }, 
            push : new Vec3(0.0, 0.0, 0.0)
        }; 
    }
    receiveMomentum(level: Level) {
        let { turn, push } = this.getExternalForces(level);
        this.rotate(turn.horiz, turn.vert);
        if (this.isAffectedByGravity() && push.y > TERMINAL_VELOCITY) 
            push.y -= GRAVITY_CONSTANT;
        this.momentum = this.momentum.withAdded(push);
    }
    getChunksForEntityCollisionCheck(level: Level): Chunk[] {
        let chunk = BlockAccess.getChunkByWorldCoords(level.terrain, this.center.x, this.center.z);
        let chunks: Chunk[] = [];
        if (chunk === null)
            return chunks;
        let neighbors = chunk.getNeighborChunks(1, 1);
        chunks.push(chunk);
        chunks = chunks.concat(neighbors);
        return chunks;
    }
    manageCollisionsWithEntities(level: Level) {
        let chunksToCheck = this.getChunksForEntityCollisionCheck(level);
        for (let chunk of chunksToCheck) {
            if (chunk === null)
                continue;
            for (let entity of chunk.entitiesForCollision) {
                if (entity === this)
                    continue;
                let collision = detectCollision(this, entity);
                this.onCollision(collision, level);
            }
        }
    }
    manageCollisionsWithTerrain(level: Level) {
        let { collision, newMomentum } = detectCollisionWithTerrain(this, this.momentum, level.terrain);
        if (collision != null) {
            if (collision.sank) 
                this.unsinkInBlock();
            //this.onCollision(collision);
        }
        this.setFeetOnGround(this.momentum.y != newMomentum.y);
        this.momentum = newMomentum;
    }
    onBeforeMove(level: Level) {}
    onAfterMove(level: Level) {}
    applyFriction() {
        this.momentum.x *= 0.5;
        this.momentum.z *= 0.5;
    }
    move(level: Level) {
        this.onBeforeMove(level);
        if (this.feetOnGround) {
            this.applyFriction();
        }
        this.center = this.center.withAdded(this.momentum);
        this.onAfterMove(level);
    }
    onBeforeUpdate(level: Level) {}
    onAfterUpdate(level: Level) {}
    getAnimationExternalForces(level: Level) {  }
    update(level: Level) {
        this.onBeforeUpdate(level);
        // receive momentum
        this.receiveMomentum(level);
        // manage collisions 
        this.manageCollisionsWithTerrain(level);
        this.manageCollisionsWithEntities(level);
        // move
        this.move(level);
        this.onAfterUpdate(level);
        this.getAnimationExternalForces(level);
        if (this.center.y < -10 * BLOCK_SIZE)
            this.toDelete = true; 
    }
}

function makeEntityMesh(meshData: any) {
    let posAttrPtr = new VertexAttribute(0, 3, 6, 0);
    let texAttrPtr = new VertexAttribute(1, 2, 6, 3);
    let jointAttrPtr = new VertexAttribute(2, 1, 6, 5);
    let mesh = new Mesh(
        meshData.vertices, 
        makeMeshIndices(meshData.noOfFaces, meshData.indicesTemplate), 
        posAttrPtr, 
        texAttrPtr, 
        jointAttrPtr);
    return mesh;
}

async function makeEntityShaderProgram(projectionMatrix: Float32Array<ArrayBufferLike>) {
    let entityProgram = await loadShaderProgramFromFiles("./src/shaders/entity-vert.glsl", "./src/shaders/entity-frag.glsl");
    entityProgram.turnOn();
    entityProgram.loadMatrix("mProj", projectionMatrix);
    entityProgram.turnOff();
    return entityProgram;
}

export { 
    Entity, 
    makeEntityMesh,
    makeEntityShaderProgram
};