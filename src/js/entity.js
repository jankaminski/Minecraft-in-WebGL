import { BlockAccess } from "./block-access.js";
import { BLOCK_SIZE } from "./block.js";
import { 
    detectCollision, 
    detectCollisionWithTerrain 
} from "./collision.js";
import { GRAVITY_CONSTANT, TERMINAL_VELOCITY } from "./level.js";
import { 
    Mat4, 
    Vec3 
} from "./math-utils.js";
import { 
    makeAttrPtr, 
    makeMeshIndices, 
    Mesh 
} from "./model.js";
import { 
    loadShaderProgramFromFiles
} from "./res-utils.js";

class Entity {
    constructor(posX, posY, posZ, sizeX, sizeY, sizeZ, model) {
        this.rotation = Vec3.makeS(0.0);
        this.center = Vec3.make(posX, posY, posZ);
        this.size = Vec3.make(sizeX, sizeY, sizeZ);
        this.toRender = true;
        this.model = model;
        this.momentum = Vec3.makeS(0.0);
        this.affectedByGravity = true;
        this.feetOnGround = false;
        this.toDelete = false;
    }
    getLimbMatrices() {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, this.getCenter());
        worldMat = Mat4.rotate(worldMat, this.rotation.x, Vec3.make(1, 0, 0));
        worldMat = Mat4.rotate(worldMat, this.rotation.y, Vec3.make(0, 1, 0));
        worldMat = Mat4.rotate(worldMat, this.rotation.z, Vec3.make(0, 0, 1));
        return [worldMat];
    }
    getEyePos() {
        return Vec3.copy(this.center);
    }
    getModel() {
        return this.model;
    }
    isToRender() { 
        return this.toRender; 
    }
    setToRender(toRender) {
        this.toRender = toRender;
    }
    getMomentum() {
        return Vec3.copy(this.momentum);
    }
    setMomentum(momentum) {
        this.momentum = Vec3.copy(momentum);
    }
    setMomX(momX) {
        this.momentum.x = momX;
    }
    setMomY(momY) {
        this.momentum.y = momY;
    }
    setMomZ(momZ) {
        this.momentum.z = momZ;
    }
    addMomentumV(momentum) {
        this.momentum = Vec3.add(this.momentum, momentum);
    }
    addMomentum(x, y, z) {
        this.momentum = Vec3.add(this.momentum, { x, y, z });
    }
    addMomX(momX) {
        this.momentum.x += momX;
    }
    addMomY(momY) {
        this.momentum.y += momY;
    }
    addMomZ(momZ) {
        this.momentum.z += momZ;
    }
    getSize() {
        return Vec3.copy(this.size);
    }
    getCenter() {
        return Vec3.copy(this.center);
    }
    setCenter(center) {
        this.center = Vec3.copy(center);
    }
    shiftPosition(x, y, z) {
        this.center = Vec3.add(this.center, { x, y, z });
    }
    shiftPosX(shift) {
        this.center.x += shift;
    }
    shiftPosY(shift) {
        this.center.y += shift;
    }
    shiftPosZ(shift) {
        this.center.z += shift;
    }
    hasFeetOnGround() {
        return this.feetOnGround;
    }
    setFeetOnGround(feetOnGround) {
        this.feetOnGround = feetOnGround;
    }
    isAffectedByGravity() {
        return this.affectedByGravity;
    }
    setAffectedByGravity(affectedByGravity) {
        this.affectedByGravity = affectedByGravity;
    }
    getRotation() {
        return Vec3.copy(this.rotation);
    }
    getRotX() {
        return this.rotation.x;
    }
    getRotY() {
        return this.rotation.y;
    }
    setRotX(rotX) {
        this.rotation.x = rotX;
    }
    setRotY(rotY) {
        this.rotation.y = rotY;
    }
    rotate(turnH, turnV) {
        this.rotation.x += turnV;
        this.rotation.y += turnH;
        if (this.rotation.x > Math.PI / 2 - 0.001) {
            this.rotation.x = Math.PI / 2 - 0.001;
        }
        if (this.rotation.x < (-Math.PI / 2) + 0.001) {
            this.rotation.x = (-Math.PI / 2) + 0.001;
        }
    }
    onCollision(collision, level) {  }
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
    getExternalForces(level) { 
        return { 
            turn: { horiz : 0, vert : 0 }, 
            push : Vec3.makeS(0) 
        }; 
    }
    receiveMomentum(level) {
        let { turn, push } = this.getExternalForces(level);
        this.rotate(turn.horiz, turn.vert);
        if (this.isAffectedByGravity() && push.y > TERMINAL_VELOCITY) 
            push.y -= GRAVITY_CONSTANT;
        this.momentum = Vec3.add(this.momentum, push);
    }
    getChunksForEntityCollisionCheck(level) {
        let chunk = BlockAccess.getChunkByWorldCoords(level.terrain, this.center.x, this.center.z);
        if (chunk === null)
            return [null];
        let neighbors = chunk.getNeighborChunks();
        let chunks = [];
        chunks.push(chunk);
        chunks = chunks.concat(neighbors);
        return chunks;
    }
    manageCollisionsWithEntities(level) {
        let chunksToCheck = this.getChunksForEntityCollisionCheck(level);
        for (let chunk of chunksToCheck) {
            if (chunk === null)
                continue;
            for (let entity of chunk.entitiesForCollision) {
                if (entity === this)
                    continue;
                let collision = detectCollision(this, entity);
                this.onCollision(collision);
            }
        }
    }
    manageCollisionsWithTerrain(level) {
        let { collision, entityMomentumBuf } = detectCollisionWithTerrain(this, level.terrain);
        if (collision != null) {
            if (collision.sank) 
                this.unsinkInBlock();
            //this.onCollision(collision);
        }
        this.setFeetOnGround(this.momentum.y != entityMomentumBuf.y);
        this.momentum = entityMomentumBuf;
    }
    onBeforeMove(level) {}
    onAfterMove(level) {}
    applyFriction() {
        this.momentum.x *= 0.5;
        this.momentum.z *= 0.5;
    }
    move(level) {
        this.onBeforeMove(level);
        this.center = Vec3.add(this.center, this.momentum);
        if (this.feetOnGround) {
            this.applyFriction();
        }
        this.onAfterMove(level);
    }
    onBeforeUpdate(level) {}
    onAfterUpdate(level) {}
    getAnimationExternalForces(level) {  }
    update(level) {
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

function makeEntityMesh(meshData) {
    let posAttrPtr = makeAttrPtr(0, 3, 6, 0);
    let texAttrPtr = makeAttrPtr(1, 2, 6, 3);
    let jointAttrPtr = makeAttrPtr(2, 1, 6, 5);
    let mesh = new Mesh(
        meshData.vertices, 
        makeMeshIndices(meshData.noOfFaces, meshData.indicesTemplate), 
        posAttrPtr, 
        texAttrPtr, 
        jointAttrPtr);
    return mesh;
}

async function makeEntityShaderProgram(projectionMatrix) {
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