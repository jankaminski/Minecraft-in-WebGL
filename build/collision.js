import { BlockAccess } from "./block-access.js";
import { BLOCK_SIZE } from "./block.js";
import { Vec3 } from "./math-utils.js";
import { VoxelBox } from "./voxel-box.js";
class Hitbox {
    constructor(center, size) {
        this.center = center;
        this.size = size;
    }
    getCenter() {
        return this.center;
    }
    getSize() {
        return this.size;
    }
    getMinX() { return this.center.x - (this.size.x / 2); }
    getMinY() { return this.center.y - (this.size.y / 2); }
    getMinZ() { return this.center.z - (this.size.z / 2); }
    getMaxX() { return this.center.x + (this.size.x / 2); }
    getMaxY() { return this.center.y + (this.size.y / 2); }
    getMaxZ() { return this.center.z + (this.size.z / 2); }
    shiftPosition(shiftVec) {
        this.center = this.center.withAdded(shiftVec);
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
        this.lowerBackLeft = entityCenter.subtractedWith(entitySize.withAddedScalar(checkRange));
        this.upperFrontRight = entityCenter.withAdded(entitySize.withAddedScalar(checkRange));
        let boxSize = (this.lowerBackLeft.subtractedWith(this.upperFrontRight)).abs();
        this.sizeInVoxels = boxSize.dividedByScalar(BLOCK_SIZE);
        this.totalVoxelCount = this.sizeInVoxels.xyzScalarProduct();
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
function detectCollisionWithTerrain(entity, currentMomentum, terrain) {
    let checkBox = new TerrainCollisionCheckBox(entity, BLOCK_SIZE * 2);
    let blocksToCheck = [];
    for (let i = 0; i < checkBox.totalVoxelCount; i++) {
        let { x, y, z } = checkBox.makeWorldCoordsFromIndex(i);
        let block = BlockAccess.getBlockByWorldCoords(terrain, x, y, z);
        if (block === null)
            continue;
        if (!block.isSolid())
            continue;
        blocksToCheck.push(block);
    }
    let newMomentum = currentMomentum.clone();
    let collision = null;
    for (let block of blocksToCheck) {
        collision = detectCollision(entity, block);
        if (collision.onX)
            newMomentum.x = 0.0;
        if (collision.onY)
            newMomentum.y = 0.0;
        if (collision.onZ)
            newMomentum.z = 0.0;
        if (newMomentum.isZero())
            break;
    }
    return { collision, newMomentum };
}
function detectCollision(entity, obstacle) {
    let entityHitbox = new Hitbox(entity.getCenter(), entity.getSize());
    let sank = collided(entityHitbox, obstacle);
    let onX = detectCollisionIn1D(entity, obstacle, new Vec3(1, 0, 0));
    let onY = detectCollisionIn1D(entity, obstacle, new Vec3(0, 1, 0));
    let onZ = detectCollisionIn1D(entity, obstacle, new Vec3(0, 0, 1));
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
function detectCollisionIn1D(entity, obstacle, dir) {
    if (!detectCollisionIn1DAssert(dir))
        throw new Error("ERROR: non-cardinal direction unit vector in collision detection");
    let entityHitbox = new Hitbox(entity.getCenter(), entity.getSize());
    let mom1D = entity.getMomentum().multipliedBy(dir);
    let oneStepVec = mom1D.dividedByScalar(BLOCK_SIZE);
    let mom1DAbs = mom1D.abs();
    let noOfSteps = Math.max(mom1DAbs.x, mom1DAbs.y, mom1DAbs.z) / BLOCK_SIZE;
    for (let i = 0; i < noOfSteps; i++) {
        entityHitbox.shiftPosition(oneStepVec);
        if (collided(entityHitbox, obstacle))
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
export { Hitbox, Collision, collided, detectCollision, detectCollisionWithTerrain };
