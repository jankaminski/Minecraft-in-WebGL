const BLOCK_BREAK_COOLDOWN = 60;

class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        this.firstPerson = true;
        this.justSwitched = false;
        this.blockBreakCooldown = new Cooldown(BLOCK_BREAK_COOLDOWN);
        this.blockPlaceCooldown = new Cooldown(30);
        //this.prevHighlightedBlockIndex = -1;
        Player.loadedAreaIDCount++;
    }
    isToRender() {
        return !this.firstPerson;
    }
    onBeforeUpdate(level) {
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
    getLoadedAreaID() {
        return this.loadedAreaID;
    }
    actOnBlock(level, block, newBlockID) {
        level.terrain.setBlock(block, newBlockID);
        let chunk = block.chunk;
        let neighbors = chunk.getNeighborChunks(1, 1);
        for (let neighbor of neighbors)
            neighbor.setToRefresh(true);
    }
    breakBlock(level, blockToBreak) {
        this.blockBreakCooldown.progress();
        if (!this.blockBreakCooldown.reached())
            return;
        this.actOnBlock(level, blockToBreak, Block.AIR);
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
        this.actOnBlock(level, blockToPlace, Block.COBBLESTONE);
    }
    calcBlockBreakProgress(cooldown) {
        return cooldown.getCurrentProgress() / cooldown.getRate();
    }
    performBlockInteractionOnTipOfTheRay(level, tip, offset) {
        let blockToBreak = level.terrain.getBlockByWorldCoords(tip.x, tip.y, tip.z, false);
        if (blockToBreak === null)
            return false;
        
        if (!blockToBreak.isSolid())
            return false;
        let chunk = blockToBreak.chunk;
        if (blockToBreak.index != chunk.highlightedBlockIndex)
            this.blockBreakCooldown.reset();
        chunk.highlightedBlockIndex = blockToBreak.index;
        chunk.isHighlighted = true;
        chunk.blockBreakProgress = this.calcBlockBreakProgress(this.blockBreakCooldown);
        if (Input.mouse.leftButton)
            this.breakBlock(level, blockToBreak);
        if (Input.mouse.rightButton) {
            tip = Vec3.sub(tip, offset);
            let blockToPlace = level.terrain.getBlockByWorldCoords(tip.x, tip.y, tip.z, false);
            if (blockToPlace !== null)
                this.placeBlock(level, blockToPlace);
        }
        return true;
    }
    castBlockInteractionRay(level) {
        if (!Input.mouse.leftButton)
            this.blockBreakCooldown.reset();
        if (!Input.mouse.rightButton)
            this.blockPlaceCooldown.setToReached();
        let rotV = -this.getRotX();
        let rotH = this.getRotY() + Math.PI;
        let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 0.5);
        for (let i = 0; i < 10; i++) {
            tip = Vec3.add(tip, offset);
            if (i >= 9) {
                this.blockBreakCooldown.reset();
                return;
            }
            if (this.performBlockInteractionOnTipOfTheRay(level, tip, offset))
                return;
        }
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
    beFollowedByCamera(level) {
        if (this.firstPerson)
            level.camera.followInFirstPerson(this);
        else
            level.camera.followInThirdPerson(this, 10, 0.2);
    }
    onAfterUpdate(level) {
        this.checkForSwitch();
        this.beFollowedByCamera(level);
        this.castBlockInteractionRay(level);
    }
}