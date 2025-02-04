import { Mob } from "./mob.js";
import { 
    Mat4, 
    Vec3
} from "./math-utils.js";
import { Animation, Animator } from "./animation.js";
import { Input } from "./input.js";

class Creeper extends Mob {
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, 0.5, 1.625, 0.5, model);
        this.addJoint(Vec3.make( 0,      0.318,  0));
        this.addJoint(Vec3.make( 0.125, -0.4375,  0.125));
        this.addJoint(Vec3.make(-0.125, -0.4375,  0.125));
        this.addJoint(Vec3.make( 0.125, -0.4375, -0.125));
        this.addJoint(Vec3.make(-0.125, -0.4375, -0.125));
        this.animator = new Animator(Animation.CREEPER_WALK, 200);
    }
    getEyePos() {
        return Vec3.add(this.getCenter(), Vec3.make(0, 0.0625 * 9, 0));
    }
    onCollision(collision, level) {
        if (collision.happened() && collision.sank) {

            console.log("hugged a creeper");
            let obstacle = collision.obstacle;
            let diffVec = Vec3.sub(obstacle.center, this.center);
            diffVec.y = 0;
            diffVec = Vec3.normalize(diffVec);
            diffVec = Vec3.divS(diffVec, 30);
            obstacle.addMomentum(diffVec.x, diffVec.y, diffVec.z);
            
            let origMom = collision.originalMomentum;
            obstacle.addMomentum(origMom.x / 2, 0, origMom.z / 2);
            this.momentum.x /= 2;
            this.momentum.z /= 2;
        }
    }
    getAnimationExternalForces(level) {
        this.target = level.camera.getPosition();
        //let mom = this.getMomentum();
//        if (Input.moving()/*mom.x !== 0 || mom.z !== 0*/)
//            this.animator.changeAnimation(Animation.CREEPER_WALK);
//        else
//            this.animator.changeAnimation(Animation.CREEPER_IDLE);
        this.animator.update();
    }
    lookAt(target) {
        let eye = Vec3.add(this.center, this.joints[1]);
        let lookMat = Mat4.targetTo(eye, target, Vec3.make(0, 1, 0));
        return lookMat;
    }
    getAnimatedLimbMatrix(joint, jointIndex) {
        let posMat = Mat4.translate(Mat4.identity(), this.getCenter());
        let yRotMat = Mat4.rotate(Mat4.identity(), this.getRotY(), Vec3.make(0, 1, 0));
        let worldMat = Mat4.multiply(posMat, yRotMat);
        worldMat = Mat4.translate(worldMat, joint);
        worldMat = Mat4.rotate(worldMat, this.animator.currentRotations[jointIndex].x, Vec3.make(1, 0, 0));
        return worldMat;
    }
    getLimbMatrix(joint, rotX, rotY) {
        let posMat = Mat4.translate(Mat4.identity(), this.getCenter());
        let yRotMat = Mat4.rotate(Mat4.identity(), rotY, Vec3.make(0, 1, 0));
        let worldMat = Mat4.multiply(posMat, yRotMat);
        worldMat = Mat4.translate(worldMat, joint);
        worldMat = Mat4.rotate(worldMat, rotX, Vec3.make(1, 0, 0));
        return worldMat;
    }
    getLimbMatrices() {
        return [
            this.getAnimatedLimbMatrix(this.joints[0], 0),//this.getLimbMatrix(this.joints[0],  0,              this.getRotY()),
            this.getLimbMatrix(this.joints[1], -this.getRotX(), this.getRotY()),//this.lookAt(Vec3.makeS(0.0)),
            this.getAnimatedLimbMatrix(this.joints[2], 2),//this.getLimbMatrix(this.joints[2], -this.getRotX(), this.getRotY()),
            this.getAnimatedLimbMatrix(this.joints[3], 3),//this.getLimbMatrix(this.joints[3],  this.getRotX(), this.getRotY()),
            this.getAnimatedLimbMatrix(this.joints[4], 4),//this.getLimbMatrix(this.joints[4],  this.getRotX(), this.getRotY()),
            this.getAnimatedLimbMatrix(this.joints[5], 5)//this.getLimbMatrix(this.joints[5], -this.getRotX(), this.getRotY())
        ];
    }
}

export { Creeper };