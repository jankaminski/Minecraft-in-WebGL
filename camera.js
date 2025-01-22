class Camera {
    constructor(posX, posY, posZ) {
        this.pos = Vec3.make(posX, posY, posZ);
        this.rotV = 0.0;
        this.rotH = 0.0;
    }
    getPosition() { return Vec3.copy(this.pos); }
    getNegPosition() { return Vec3.negated(this.pos); }
    push(pushX, pushY, pushZ) {
        this.pos = Vec3.add(this.pos, { pushX, pushY, pushZ });
    }
    turn(rotH, rotV) {
        this.rotV += rotV;
        this.rotH += rotH;
        if (this.rotV > Math.PI / 2)
            this.rotV = Math.PI / 2;
        if (this.rotV < (-Math.PI / 2))
            this.rotV = -Math.PI / 2;
    }
    followTarget(target) {
        let origin = this.getPosition();
        let xDist = origin.x - target.x;
        let yDist = origin.y - target.y;
        let zDist = origin.z - target.z;
        let rotH = -Math.atan(xDist / Math.abs(zDist));
        if (zDist < 0)
            rotH = Math.PI - rotH;
        let xzDist = Math.hypot(xDist, zDist);
        let rotV = Math.atan(yDist / xzDist);
        this.rotH = rotH;
        this.rotV = rotV;
    }
    followInThirdPerson(entity, dist, yOverhead) {
        let rotV = entity.getRotX();
        let sinusV = Math.sin(rotV);
        let cosinusV = Math.cos(rotV);
        let distH = cosinusV * dist;
        let rotH = entity.getRotY() + Math.PI;
        let sinusH = Math.sin(rotH);
        let cosinusH = Math.cos(rotH);
        let shift = Vec3.make(sinusH * distH, sinusV * dist, cosinusH * distH);
        let camPos = Vec3.add(entity.getCenter(), shift);
        this.pos = camPos;
        let entPos = entity.getCenter();
        entPos.y += yOverhead;
        this.followTarget(entPos);
    }
    followInFirstPerson(entity) {
        let rotV = entity.getRotX();

        let sinusV = Math.sin(-rotV);
        let cosinusV = Math.cos(-rotV);

        let dist = 0.1;

        let distH = cosinusV * dist;
        let rotH = entity.getRotY() + Math.PI;
        let sinusH = Math.sin(rotH);
        let cosinusH = Math.cos(rotH);

       

        let shift = Vec3.negated(Vec3.make(sinusH * distH, sinusV * dist, cosinusH * distH));
        let eyePos = entity.getEyePos();//Vec3.add(entity.getCenter(), Vec3.make(0, 0.0625 * 7, 0));
        let target = Vec3.add(eyePos, shift);
        this.pos = eyePos;
        this.followTarget(target);
    }
    freecam(movement) {
        let turnV = 0.0;
        let turnH = 0.0;
        if (movement.lookUp) 
            turnV = -0.01;
        if (movement.lookDown) 
            turnV = 0.01;
        if (movement.lookLeft) 
            turnH = -0.01;
        if (movement.lookRight) 
            turnH = 0.01;
        this.turn(turnH, turnV);
        let pushX = 0.0;
        let pushY = 0.0;
        let pushZ = 0.0;
        if (movement.forw) {
            pushX += Math.sin(this.rotH) / 10;
            pushZ += -Math.cos(this.rotH) / 10;
        }
        if (movement.back) {
            pushX += -Math.sin(this.rotH) / 10;
            pushZ += Math.cos(this.rotH) / 10;
        }
        if (movement.strafeLeft) {
            pushX += -Math.sin(this.rotH + (Math.PI / 2)) / 1000;
            pushZ += Math.cos(this.rotH + (Math.PI / 2)) / 1000;
        }
        if (movement.strafeRight) {
            pushX += Math.sin(this.rotH + (Math.PI / 2)) / 1000;
            pushZ += -Math.cos(this.rotH + (Math.PI / 2)) / 1000;
        }
        if (movement.asc) 
            pushY += 0.05;
        if (movement.desc) 
            pushY += -0.05;
        this.push(pushX, pushY, pushZ);
    }
    getViewMatrix() {
        let posMat = Mat4.translate(Mat4.identity(), this.getNegPosition());
        let xRotMat = Mat4.rotate(Mat4.identity(), this.rotV, [1, 0, 0]);
        let yRotMat = Mat4.rotate(Mat4.identity(), this.rotH, [0, 1, 0]);
        let xyRotMat = Mat4.multiply(xRotMat, yRotMat);
        let viewMatrix = Mat4.multiply(xyRotMat, posMat);
        return viewMatrix;
    }
}