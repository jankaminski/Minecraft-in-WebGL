import { Mob } from "./mob.js";
import { 
    Mat4, 
    Vec3
} from "./math-utils.js";
import { AnimatedSkeleton, AnimatedSkeletonJoint, Animation, Animator } from "./animation.js";

const BODY            = 0;
const HEAD            = 1;
const FRONT_LEFT_LEG  = 2;
const FRONT_RIGHT_LEG = 3;
const BACK_LEFT_LEG   = 4;
const BACK_RIGHT_LEG  = 5;

class Creeper extends Mob {
    constructor(posX, posY, posZ, model) {
        super(posX, posY, posZ, 0.5, 1.625, 0.5, model);
        this.animatedSkeleton = new AnimatedSkeleton(this)
            .addJoint(BODY,            new AnimatedSkeletonJoint(Vec3.make( 0,      0,       0    )))
            .addJoint(HEAD,            new AnimatedSkeletonJoint(Vec3.make( 0,      0.318,   0    )))
            .addJoint(FRONT_LEFT_LEG,  new AnimatedSkeletonJoint(Vec3.make( 0.125, -0.4375,  0.125)))
            .addJoint(FRONT_RIGHT_LEG, new AnimatedSkeletonJoint(Vec3.make(-0.125, -0.4375,  0.125)))
            .addJoint(BACK_LEFT_LEG,   new AnimatedSkeletonJoint(Vec3.make( 0.125, -0.4375, -0.125)))
            .addJoint(BACK_RIGHT_LEG,  new AnimatedSkeletonJoint(Vec3.make(-0.125, -0.4375, -0.125)));
        this.animator = new Animator(Animation.CREEPER_IDLE);
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
        let absMom = Vec3.abs(this.getMomentum());
        if (absMom.x > 0.0001 || absMom.z > 0.0001)
            this.animator.changeAnimation(Animation.CREEPER_WALK);
        else
            this.animator.changeAnimation(Animation.CREEPER_IDLE);
        this.animator.update();
        this.animatedSkeleton.interpolateCurrentRotations(this.animator);
    }
    lookAt(target) {
        let eye = Vec3.add(this.center, this.animatedSkeleton.joints[1].origRot);
        let lookMat = Mat4.targetTo(eye, target, Vec3.make(0, 1, 0));
        return lookMat;
    }
    getRotatedLimbMatrix(joint, rotX, rotY) {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, this.getCenter());
        worldMat = Mat4.rotate(worldMat, rotY, Vec3.make(0, 1, 0));
        worldMat = Mat4.translate(worldMat, joint.origRot);
        worldMat = Mat4.rotate(worldMat, rotX, Vec3.make(1, 0, 0));
        return worldMat;
    }
    getLimbMatrices() {
        return [
            this.animatedSkeleton.getJointMatrix(BODY),
            this.getRotatedLimbMatrix(this.animatedSkeleton.getJoint(HEAD), -this.getRotX(), this.getRotY()),
            this.animatedSkeleton.getJointMatrix(FRONT_LEFT_LEG),
            this.animatedSkeleton.getJointMatrix(FRONT_RIGHT_LEG),
            this.animatedSkeleton.getJointMatrix(BACK_LEFT_LEG),
            this.animatedSkeleton.getJointMatrix(BACK_RIGHT_LEG)
        ];
    }
}

export { Creeper };