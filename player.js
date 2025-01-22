class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        this.firstPerson = true;
        this.alreadyShot = false;
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
        if (Input.keyboard.jump && this.feetOnGround) 
            pushY = 0.1;
        let rotation = this.getRotation();
        if (Input.keyboard.forward) {
            pushZ +=  Math.sin(rotation.y + (Math.PI / 2));
            pushX += -Math.cos(rotation.y + (Math.PI / 2));
        }
        if (Input.keyboard.back) {
            pushZ += -Math.sin(rotation.y + (Math.PI / 2));
            pushX +=  Math.cos(rotation.y + (Math.PI / 2));
        }
        if (Input.keyboard.strafeLeft) {
            pushZ += -Math.sin(rotation.y);
            pushX +=  Math.cos(rotation.y);
        }
        if (Input.keyboard.strafeRight) {
            pushZ +=  Math.sin(rotation.y);
            pushX += -Math.cos(rotation.y);
        }
        let normalizedXandZ = Vec2.normalize({ x : pushX, y : pushZ });
        let speed = Input.keyboard.sprint ? 0.6 : 0.06;
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
    onAfterUpdate(level) {
        if (Input.keyboard.lookUp)
            this.firstPerson = true;
        if (Input.keyboard.lookDown)
            this.firstPerson = false;

        if (this.firstPerson)
            level.camera.followInFirstPerson(this);
        else
            level.camera.followInThirdPerson(this, 10, 0.2);

        this.shoot(level);
    }
    shoot(level) {
        if (Input.mouse.pressed && !this.alreadyShot) {
            this.alreadyShot = true;
            let rotV = -this.getRotX();
            let rotH = this.getRotY() + Math.PI;
            let { offset, tip } = castRay(this.getEyePos(), rotV, rotH, 1);
            let proj = new Creeper(tip.x, tip.y, tip.z, this.model);
            proj.setRotX(this.getRotX());
            proj.setRotY(this.getRotY());
            proj.addMomentumV(this.getMomentum());
            proj.addMomentum(offset.x / 5, offset.y / 5 + 0.05, offset.z / 5);
            level.addEntity(proj);
        }
        if (!Input.mouse.pressed)
            this.alreadyShot = false;
    }
}