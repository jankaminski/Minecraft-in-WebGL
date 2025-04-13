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
import { BlockBreakParticle, Particle } from "./particle.js";
import { Model } from "./model.js";
import { Level } from "./level.js";

class Player extends Creeper {
    static loadedAreaIDCount = 0;
    loadedAreaID: number;
    firstPerson: boolean;
    justSwitched: boolean;
    blockBreakCooldown: Cooldown;
    blockPlaceCooldown: Cooldown;
    constructor(posX: number, posY: number, posZ: number, model: Model) {
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
        let normalizedXandZ = new Vec2(pushX, pushZ).normalized();
        let speed = Input.sprinting() ? 0.6 : 0.06;
        pushX = normalizedXandZ.x * speed;
        pushZ = normalizedXandZ.y * speed;
        this.rotate(turnH, turnV);
        this.setMomX(pushX);
        this.addMomY(pushY);
        this.setMomZ(pushZ);
    }
    onBeforeUpdate(level: Level) {
        this.applyControls();
    }
    getLoadedAreaID() {
        return this.loadedAreaID;
    }
    castBlockInteractionRay(level: Level) {
        if (!Input.mouse.leftButton)
            this.blockBreakCooldown.reset();
        if (!Input.mouse.rightButton)
            this.blockPlaceCooldown.setToReached();
        let rotV = -this.getRotX();
        let rotH = this.getRotY() + Math.PI;
        let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 0.01);
        for (let i = 0; i < 700; i++) {
            tip = tip.withAdded(offset);
            if (i >= 699)
                this.blockBreakCooldown.reset();
            if (this.breakOrPlaceABlock(level, tip, offset))
                return;
        }
    }
    breakOrPlaceABlock(level: Level, breakCoord: Vec3, raysOneStep: Vec3) {
        let blockToBreak = BlockAccess.getBlockByWorldCoords(level.terrain, breakCoord.x, breakCoord.y, breakCoord.z);
        let placeCoord = breakCoord.subtractedWith(raysOneStep);
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
    breakBlock(level: Level, blockToBreak: Block) {
        this.blockBreakCooldown.progress();
        if (!this.blockBreakCooldown.reached())
            return;
        for (let i = 0; i < 50; i++) {
            let momX = (Math.random() - 0.5) / 15;
            let momY = Math.random() / 15;
            let momZ = (Math.random() - 0.5) / 15;
            level.blockBreakParticles.push(new BlockBreakParticle(blockToBreak.getCenter(), new Vec3(momX, momY, momZ), 50, blockToBreak.getID(), new Vec2(Math.random(), Math.random())));
        }
        this.changeBlock(level, blockToBreak, Block.AIR);
    }
    placeBlock(level: Level, blockToPlace: Block) {
        this.blockPlaceCooldown.progress();
        if (!this.blockPlaceCooldown.reached())
            return;
        let chunk = blockToPlace.chunk;
        for (let entity of chunk.entitiesForCollision) {
            if (collided(entity, blockToPlace))
                return;
        }
        this.changeBlock(level, blockToPlace, Block.COBBLESTONE);
    }
    changeBlock(level: Level, block: Block, newBlockID: number) {
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
    onAfterUpdate(level: Level) {
        this.checkForSwitch();
        this.castBlockInteractionRay(level);
    }
}

export { Player };