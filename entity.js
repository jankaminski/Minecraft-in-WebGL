import { 
    Mat4, 
    Vec3
} from "./math-utils.js";
import { detectCollision, detectCollisionWithTerrain } from "./collision.js";
import { 
    makeAttrPtr, 
    Mesh
} from "./model.js";
import { loadShaderProgramFromFiles, makeMeshIndices } from "./res-utils.js";

const TERMINAL_VELOCITY = -0.4;
const GRAVITY_CONSTANT = 0.003;

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
        let chunk = level.terrain.getChunkByWorldCoords(this.center.x, this.center.z);
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
    }
    getWorldMatrix() {
        let posMat = Mat4.translate(Mat4.identity(), this.center);
        let xRotMat = Mat4.rotate(Mat4.identity(), this.rotation.x, [1, 0, 0]);
        let yRotMat = Mat4.rotate(Mat4.identity(), this.rotation.y, [0, 1, 0]);
        let zRotMat = Mat4.rotate(Mat4.identity(), this.rotation.z, [0, 0, 1]);
        let xyRotMat = Mat4.multiply(yRotMat, xRotMat);
        let xyzRotMat = Mat4.multiply(xyRotMat, zRotMat);
        let worldMat = Mat4.multiply(posMat, xyzRotMat);
        //matScale(worldMat, worldMat, this.size);
        return worldMat;
    }
}

function makeEntityMesh(gl, meshData) {
    let posAttrPtr = makeAttrPtr(0, 3, 6, 0);
    let texAttrPtr = makeAttrPtr(1, 2, 6, 3);
    let jointAttrPtr = makeAttrPtr(2, 1, 6, 5);
    let mesh = new Mesh(
        gl, 
        meshData.vertices, 
        makeMeshIndices(meshData.noOfFaces, meshData.indicesTemplate), 
        posAttrPtr, 
        texAttrPtr, 
        jointAttrPtr);
    return mesh;
}

async function makeEntityShaderProgram(gl, projectionMatrix) {
    let entityProgram = await loadShaderProgramFromFiles(gl, '/shaders/entity-vert.glsl', '/shaders/entity-frag.glsl');
    entityProgram.turnOn(gl);
    entityProgram.loadMatrix(gl, 'mProj', projectionMatrix);
    entityProgram.turnOff(gl);
    return entityProgram;
}

export { 
    Entity, 
    makeEntityMesh,
    makeEntityShaderProgram 
};