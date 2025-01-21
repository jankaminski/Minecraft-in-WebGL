class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        this.setFirstPerson(true);
        Player.loadedAreaIDCount++;
    }
    setFirstPerson(first) {
        if (first) {
            this.firstPerson = true;
            this.toRender = false;
        } else {
            this.firstPerson = false;
            this.toRender = true;
        }
    }
    onBeforeUpdate(level) {
        let turnH = Input.mouse.delta.x / 100;
        let turnV = Input.mouse.delta.y / 100;
        turnH *= -1;
        if (this.firstPerson) {
            turnV *= -1;
        }
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
        if (Input.mouse.pressed && !this.alreadyShot) {


            let rotV = this.getRotX();
            if (this.firstPerson)
                rotV *= -1;
            let sinusV = Math.sin(rotV);
            let cosinusV = Math.cos(rotV);
            let dist = 1;
            let distH = cosinusV * dist;
            let rotH = this.getRotY() + Math.PI;
            let sinusH = Math.sin(rotH);
            let cosinusH = Math.cos(rotH);
            let shift = Vec3.negated(Vec3.make(sinusH * distH, sinusV * dist, cosinusH * distH));


            this.alreadyShot = true;
            let barrel = Vec3.add(this.getEyePos(), shift);
            let proj = new Creeper(barrel.x, barrel.y, barrel.z, this.model);
            proj.setRotX(rotV);
            proj.setRotY(this.getRotY());
            proj.addMomentumV(this.getMomentum());
            proj.addMomentum(shift.x / 5, shift.y / 5 + 0.05, shift.z / 5);
            level.addEntity(proj);
        }
        if (!Input.mouse.pressed)
            this.alreadyShot = false;
    }
}