import { Creeper } from "./creeper.js";
import { Input } from "./input.js";
import { Vec2, Vec3 } from "./math-utils.js";

class Player extends Creeper {
    static loadedAreaIDCount = 0;
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, model);
        this.loadedAreaID = Player.loadedAreaIDCount;
        //this.toRender = false;
        Player.loadedAreaIDCount++;
    }
    onBeforeUpdate(level) {
        let movement = Input.keyboard;
        let turnH = 0.0;
        let turnV = 0.0;
        if (movement.lookUp) 
            turnV = 0.02;
        if (movement.lookDown) 
            turnV = -0.02;
        if (movement.lookLeft) 
            turnH = 0.04;
        if (movement.lookRight) 
            turnH = -0.04;
        let pushX = 0.0;
        let pushY = 0.0;
        let pushZ = 0.0;
        if (movement.jump && this.feetOnGround) 
            pushY = 0.1;
        let rotation = this.getRotation();
        if (movement.forward) {
            pushZ +=  Math.sin(rotation.y + (Math.PI / 2));
            pushX += -Math.cos(rotation.y + (Math.PI / 2));
        }
        if (movement.back) {
            pushZ += -Math.sin(rotation.y + (Math.PI / 2));
            pushX +=  Math.cos(rotation.y + (Math.PI / 2));
        }
        if (movement.strafeLeft) {
            pushZ += -Math.sin(rotation.y);
            pushX +=  Math.cos(rotation.y);
        }
        if (movement.strafeRight) {
            pushZ +=  Math.sin(rotation.y);
            pushX += -Math.cos(rotation.y);
        }
        let normalizedXandZ = Vec2.normalize({ x : pushX, y : pushZ });
        let speed = movement.sprint ? 0.24 : 0.06;
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
        if (Input.keyboard.sneak && !this.alreadyShot) {


            let rotV = this.getRotX();
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
        if (!Input.keyboard.sneak)
            this.alreadyShot = false;
    }
}

export { Player };