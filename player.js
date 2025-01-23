class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        this.firstPerson = true;
        this.justSwitched = false;
        this.blockActionCooldown = 0;
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
        this.actOnBlock(level, blockToBreak, Block.AIR);
    }
    placeBlock(level, blockToPlace) {
        let chunk = blockToPlace.chunk;
        for (let entity of chunk.entitiesForCollision) {
            let myHitbox = new Hitbox(entity);
            let blockHitbox = new Hitbox(blockToPlace);
            if (collided(myHitbox, blockHitbox))
                return;
        }
        this.actOnBlock(level, blockToPlace, Block.COBBLESTONE);
    }
    castBlockInteractionRay(level) {
        let rotV = -this.getRotX();
        let rotH = this.getRotY() + Math.PI;
        let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 0.5);
        for (let i = 0; i < 10; i++) {
            tip = Vec3.add(tip, offset);
            let blockToBreak = level.terrain.getBlockByWorldCoords(tip.x, tip.y, tip.z, false);
            if (blockToBreak.isSolid()) {
                blockToBreak.chunk.highlightedBlockIndex = blockToBreak.index;
                if (this.blockActionCooldown > 0) {
                    this.blockActionCooldown--;
                    break;
                } else
                    this.blockActionCooldown = 4;
                if (Input.mouse.leftButton)
                    this.breakBlock(level, blockToBreak);
                if (Input.mouse.rightButton) {
                    tip = Vec3.sub(tip, offset);
                    let blockToPlace = level.terrain.getBlockByWorldCoords(tip.x, tip.y, tip.z, false);
                    this.placeBlock(level, blockToPlace);
                }
                break;
            }
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
        this.shoot(level);
    }
    shoot(level) {
        this.castBlockInteractionRay(level);
    }
}

/*
rotH = this.getRotY() + Math.PI;
        let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 1);
        let oneStepVec = Vec3.divS(offset, 6);
        for (let i = 0; i < 3; i += 0.1) {
*/