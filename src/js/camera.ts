import { Entity } from "./entity.js";
import { Mat4, Vec3 } from "./math-utils.js";
import { castRay } from "./misc-utils.js";

class Camera {
    pos: Vec3;
    rotV: number;
    rotH: number;
    constructor(posX: number, posY: number, posZ: number) {
        this.pos = new Vec3(posX, posY, posZ);
        this.rotV = 0.0;
        this.rotH = 0.0;
    }
    getPosition() { return this.pos.clone(); }
    getNegPosition() { return this.pos.negated(); }
    push(pushX: number, pushY: number, pushZ: number) {
        this.pos = this.pos.withAdded(new Vec3(pushX, pushY, pushZ));
    }
    turn(rotH: number, rotV: number) {
        this.rotV += rotV;
        this.rotH += rotH;
        if (this.rotV > Math.PI / 2)
            this.rotV = Math.PI / 2;
        if (this.rotV < (-Math.PI / 2))
            this.rotV = -Math.PI / 2;
    }
    followTarget(target: Vec3) {
        let origin = this.getPosition();
        let { x : xDist, y : yDist, z : zDist } = origin.subtractedWith(target);
        let rotH = -Math.atan(xDist / Math.abs(zDist));
        if (zDist < 0)
            rotH = Math.PI - rotH;
        let xzDist = Math.hypot(xDist, zDist);
        let rotV = Math.atan(yDist / xzDist);
        this.rotH = rotH;
        this.rotV = rotV;
    }
    followInThirdPerson(entity: Entity, dist: number, yOverhead: number) {
        let rotV = entity.getRotX();
        let rotH = entity.getRotY();
        let entPos = entity.getCenter();
        let ray = castRay(entPos, rotV, rotH, dist);
        this.pos = ray.tip;
        this.followTarget(entPos.withAdded(new Vec3(0, yOverhead, 0)));
    }
    followInFirstPerson(entity: Entity) {
        let rotV = -entity.getRotX();
        let rotH = entity.getRotY() + Math.PI;
        let dist = 0.1;
        this.pos = entity.getEyePos();
        let ray = castRay(this.pos, rotV, rotH, dist);
        let target = ray.tip;
        this.followTarget(target);
    }
    getViewMatrix() {
        let posMat = Mat4.translate(Mat4.identity(), this.getNegPosition());
        let xRotMat = Mat4.rotate(Mat4.identity(), this.rotV, new Vec3(1, 0, 0));
        let yRotMat = Mat4.rotate(Mat4.identity(), this.rotH, new Vec3(0, 1, 0));
        let xyRotMat = Mat4.multiply(xRotMat, yRotMat);
        let viewMatrix = Mat4.multiply(xyRotMat, posMat);
        return viewMatrix;
    }
}

export { Camera };