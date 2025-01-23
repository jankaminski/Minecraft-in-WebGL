class Hitbox {
    constructor(collidable) {
        this.center = collidable.getCenter();
        this.size = collidable.getSize();
    }
    getMinX() { return this.center.x - (this.size.x / 2); }
    getMinY() { return this.center.y - (this.size.y / 2); }
    getMinZ() { return this.center.z - (this.size.z / 2); }
    getMaxX() { return this.center.x + (this.size.x / 2); }
    getMaxY() { return this.center.y + (this.size.y / 2); }
    getMaxZ() { return this.center.z + (this.size.z / 2); }
    shiftPosition(shiftVec) {
        this.center = Vec3.add(this.center, shiftVec);
    }
}

function collided(thisOne, thatOne) {
    let collX = thisOne.getMinX() <= thatOne.getMaxX() && thisOne.getMaxX() >= thatOne.getMinX();
    let collY = thisOne.getMinY() <= thatOne.getMaxY() && thisOne.getMaxY() >= thatOne.getMinY();
    let collZ = thisOne.getMinZ() <= thatOne.getMaxZ() && thisOne.getMaxZ() >= thatOne.getMinZ();
    return collX && collY && collZ;
}

function hasInside(thisOne, vec) {
    let inX = vec.x > thisOne.getMinX() && vec.x < thisOne.getMaxX();
    let inY = vec.y > thisOne.getMinY() && vec.y < thisOne.getMaxY();
    let inZ = vec.z > thisOne.getMinZ() && vec.z < thisOne.getMaxZ();
    return inX && inY && inZ;
}

/**
 * Used to take a list of blocks from 3D area around an entity, defined by check range.
 * It allows to make sure that block collision is checked against all blocks in vicinity 
 * of an entity, which essentially prevents 'falling through the floor'.
 */
class TerrainCollisionCheckBox extends VoxelBox {
    constructor(entity, checkRange) {
        super(0, 0, 0);
        let entitySize = entity.getSize();
        let entityCenter = entity.getCenter();
        this.lowerBackLeft = Vec3.sub(entityCenter, Vec3.addS(entitySize, checkRange));
        this.upperFrontRight = Vec3.add(entityCenter, Vec3.addS(entitySize, checkRange));
        let boxSize = Vec3.abs(Vec3.sub(this.lowerBackLeft, this.upperFrontRight));
        this.sizeInVoxels = Vec3.divS(boxSize, BLOCK_SIZE);
        this.totalVoxelCount = Vec3.xyzScalarProduct(this.sizeInVoxels);
        this.voxelSize = BLOCK_SIZE;
    }
    makeWorldCoordsFromIndex(index) {
        let voxelCoords = this.makeVoxelCoordsFromIndex(index);
        let x = this.lowerBackLeft.x + voxelCoords.x * this.voxelSize;
        let y = this.lowerBackLeft.y + voxelCoords.y * this.voxelSize;
        let z = this.lowerBackLeft.z + voxelCoords.z * this.voxelSize;
        return { x, y, z };
    }
}

function detectCollisionWithTerrain(entity, terrain) {
    let checkBox = new TerrainCollisionCheckBox(entity, BLOCK_SIZE * 2);
    let blocksToCheck = [];
    for (let i = 0; i < checkBox.totalVoxelCount; i++) {
        let { x, y, z } = checkBox.makeWorldCoordsFromIndex(i);
        let block = terrain.getBlockByWorldCoords(x, y, z);
        if (block === null) 
            continue;
        if (!block.isSolid()) 
            continue;
        blocksToCheck.push(block);
    }
    let entityMomentumBuf = entity.getMomentum();
    let collision;
    for (let block of blocksToCheck) {
        collision = detectCollision(entity, block);
        if (collision.onX) 
            entityMomentumBuf.x = 0.0;
        if (collision.onY) 
            entityMomentumBuf.y = 0.0;
        if (collision.onZ) 
            entityMomentumBuf.z = 0.0;
        if (Vec3.isZero(entityMomentumBuf)) 
            break;
    }
    return { collision, entityMomentumBuf };
}

function detectCollision(entity, obstacle) {
    let entityHitbox = new Hitbox(entity);
    let obstacleHitbox = new Hitbox(obstacle);
    let sank = collided(entityHitbox, obstacleHitbox);
    let onX = detectCollisionIn1D(entity, obstacleHitbox, Vec3.make(1, 0, 0));
    let onY = detectCollisionIn1D(entity, obstacleHitbox, Vec3.make(0, 1, 0));
    let onZ = detectCollisionIn1D(entity, obstacleHitbox, Vec3.make(0, 0, 1));
    let collision = new Collision(entity, onX, onY, onZ, obstacle, sank);
    return collision;
}

class Collision {
    constructor(collider, onX, onY, onZ, obstacle, sank) {
        this.collider = collider;
        this.originalMomentum = collider.getMomentum();
        this.onX = onX;
        this.onY = onY;
        this.onZ = onZ;
        this.obstacle = (collider === obstacle) ? null : obstacle;
        this.sank = sank;
    }
    happened() {
        return this.obstacle != null || this.onX || this.onY || this.onZ;
    }
}

function detectCollisionIn1D(entity, obstacleHitbox, dir) {
    if (!detectCollisionIn1DAssert(dir)) 
        throw "BLEH";
    let entityHitbox = new Hitbox(entity);
    let mom1D = Vec3.mul(entity.getMomentum(), dir);
    let oneStepVec = Vec3.divS(mom1D, BLOCK_SIZE);
    let mom1DAbs = Vec3.abs(mom1D);
    let noOfSteps = Math.max(mom1DAbs.x, mom1DAbs.y, mom1DAbs.z) / BLOCK_SIZE;
    for (let i = 0; i < noOfSteps; i++) {
        entityHitbox.shiftPosition(oneStepVec);
        if (collided(entityHitbox, obstacleHitbox)) 
            return true;
    }
    return false;
}

function detectCollisionIn1DAssert(dir) {
    let option1 = dir.x === 0 && dir.y === 1 && dir.z === 0;
    let option2 = dir.x === 0 && dir.y === 0 && dir.z === 1;
    let option3 = dir.x === 1 && dir.y === 0 && dir.z === 0;
    return (option1 || option2 || option3) ? true : false;
}