import { Creeper } from "./creeper.js";
import { Cooldown } from "./misc-utils.js";
import { Input } from "./input.js";
import {
    Vec2,
    Vec3
} from "./math-utils.js";
import { Block } from "./block.js";
import { 
    collided,
    Hitbox 
} from "./collision.js";
import { castRay } from "./misc-utils.js";
import { BlockAccess } from "./block-access.js";

class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        this.firstPerson = true;
        this.justSwitched = false;
        this.blockBreakCooldown = new Cooldown(30);
        this.blockPlaceCooldown = new Cooldown(6);
        Player.loadedAreaIDCount++;
    }
    isToRender() {
        return !this.firstPerson;
    }
    applyControls() {
        let turnH = -Input.mouse.delta.x / 100;
        let turnV = -Input.mouse.delta.y / 100;
        let pushX = 0.0;
        let pushY = 0.0;
        let pushZ = 0.0;
        if (Input.jumping() && this.feetOnGround) 
            pushY = 0.1;
        let rotation = this.getRotation();
        if (Input.movingForward()) {
            pushZ +=  Math.sin(rotation.y + (Math.PI / 2));
            pushX += -Math.cos(rotation.y + (Math.PI / 2));
        }
        if (Input.movingBackwards()) {
            pushZ += -Math.sin(rotation.y + (Math.PI / 2));
            pushX +=  Math.cos(rotation.y + (Math.PI / 2));
        }
        if (Input.strafingLeft()) {
            pushZ += -Math.sin(rotation.y);
            pushX +=  Math.cos(rotation.y);
        }
        if (Input.strafingRight()) {
            pushZ +=  Math.sin(rotation.y);
            pushX += -Math.cos(rotation.y);
        }
        let normalizedXandZ = Vec2.normalize({ x : pushX, y : pushZ });
        let speed = Input.sprinting() ? 0.6 : 0.06;
        pushX = normalizedXandZ.x * speed;
        pushZ = normalizedXandZ.y * speed;
        this.rotate(turnH, turnV);
        this.setMomX(pushX);
        this.addMomY(pushY);
        this.setMomZ(pushZ);
    }
    onBeforeUpdate(level) {
        this.applyControls();
    }
    getLoadedAreaID() {
        return this.loadedAreaID;
    }
    castBlockInteractionRay(level) {
        if (!Input.mouse.leftButton)
            this.blockBreakCooldown.reset();
        if (!Input.mouse.rightButton)
            this.blockPlaceCooldown.setToReached();
        let rotV = -this.getRotX();
        let rotH = this.getRotY() + Math.PI;
        let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 0.01);
        for (let i = 0; i < 700; i++) {
            tip = Vec3.add(tip, offset);
            if (i >= 699)
                this.blockBreakCooldown.reset();
            if (this.breakOrPlaceABlock(level, tip, offset))
                return;
        }
    }
    breakOrPlaceABlock(level, breakCoord, raysOneStep) {
        let blockToBreak = BlockAccess.getBlockByWorldCoords(level.terrain, breakCoord.x, breakCoord.y, breakCoord.z);
        let placeCoord = Vec3.sub(breakCoord, raysOneStep);
        let blockToPlace = BlockAccess.getBlockByWorldCoords(level.terrain, placeCoord.x, placeCoord.y, placeCoord.z);
        if (blockToBreak === null || blockToPlace === null)
            return false;
        if (blockToBreak.getID() === Block.AIR || blockToPlace.getID() !== Block.AIR)
            return false;
        let chunkToUpdate = blockToBreak.getChunk();
        let blockToBreakIndex = blockToBreak.getIndex();
        if (blockToBreakIndex != chunkToUpdate.highlightedBlockIndex)
            this.blockBreakCooldown.reset();
        chunkToUpdate.loadBlockUpdateData(blockToBreakIndex, this.blockBreakCooldown.getNormalizedProgress());
        if (Input.mouse.leftButton)
            this.breakBlock(level, blockToBreak);
        if (Input.mouse.rightButton)
            this.placeBlock(level, blockToPlace);
        return true;
    }
    breakBlock(level, blockToBreak) {
        this.blockBreakCooldown.progress();
        if (!this.blockBreakCooldown.reached())
            return;
        this.changeBlock(level, blockToBreak, Block.AIR);
    }
    placeBlock(level, blockToPlace) {
        this.blockPlaceCooldown.progress();
        if (!this.blockPlaceCooldown.reached())
            return;
        let chunk = blockToPlace.chunk;
        for (let entity of chunk.entitiesForCollision) {
            let myHitbox = new Hitbox(entity);
            let blockHitbox = new Hitbox(blockToPlace);
            if (collided(myHitbox, blockHitbox))
                return;
        }
        this.changeBlock(level, blockToPlace, Block.COBBLESTONE);
    }
    changeBlock(level, block, newBlockID) {
        level.terrain.setBlockByBlock(block, newBlockID);
        let chunk = block.chunk;
        chunk.modifiedBlocks[block.getIndex()] = true;
        chunk.acquireModel();
        let neighbors = chunk.getNeighborChunks(1, 1);
        for (let neighbor of neighbors)
            neighbor.acquireModel();//setToRefresh(true);
    }
    checkForSwitch() {
        let switchPerspective = Input.switchingPerspective();
        if (switchPerspective && !this.justSwitched) {
            this.firstPerson = !this.firstPerson;
            this.justSwitched = true;
        }
        if (!switchPerspective)
            this.justSwitched = false;
    }
    onAfterUpdate(level) {
        this.checkForSwitch();
        this.castBlockInteractionRay(level);
    }
}

export { Player };