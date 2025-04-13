import { Mob } from "./mob.js";
import { 
    Mat4, 
    Vec3
} from "./math-utils.js";
import { AnimatedSkeleton, AnimatedSkeletonJoint, Animation, Animator } from "./animation.js";
import { Model } from "./model.js";
import { Level } from "./level.js";
import { Collision } from "./collision.js";
import { Entity } from "./entity.js";

const BODY            = 0;
const HEAD            = 1;
const FRONT_LEFT_LEG  = 2;
const FRONT_RIGHT_LEG = 3;
const BACK_LEFT_LEG   = 4;
const BACK_RIGHT_LEG  = 5;

class Creeper extends Mob {
    animatedSkeleton: AnimatedSkeleton;
    animator: Animator;
    target: Vec3;
    constructor(posX: number, posY: number, posZ: number, model: Model) {
        super(posX, posY, posZ, 0.5, 1.625, 0.5, model);
        this.animatedSkeleton = new AnimatedSkeleton(this)
            .addJoint(BODY,            new AnimatedSkeletonJoint(new Vec3( 0,      0,       0    )))
            .addJoint(HEAD,            new AnimatedSkeletonJoint(new Vec3( 0,      0.318,   0    )))
            .addJoint(FRONT_LEFT_LEG,  new AnimatedSkeletonJoint(new Vec3( 0.125, -0.4375,  0.125)))
            .addJoint(FRONT_RIGHT_LEG, new AnimatedSkeletonJoint(new Vec3(-0.125, -0.4375,  0.125)))
            .addJoint(BACK_LEFT_LEG,   new AnimatedSkeletonJoint(new Vec3( 0.125, -0.4375, -0.125)))
            .addJoint(BACK_RIGHT_LEG,  new AnimatedSkeletonJoint(new Vec3(-0.125, -0.4375, -0.125)));
        this.animator = new Animator(Animation.CREEPER_IDLE);
        this.target = new Vec3(0, 0, 0);
    }
    getEyePos() {
        return this.getCenter().withAdded(new Vec3(0, 0.0625 * 9, 0));
    }
    onCollision(collision: Collision, level: Level) {
        if (collision.happened() && collision.sank) {

            console.log("hugged a creeper");
            let obstacle = collision.obstacle;
            let entity = obstacle as Entity;

            let diffVec = entity.center.subtractedWith(this.center);
            diffVec.y = 0;
            diffVec = diffVec.normalized();
            diffVec = diffVec.dividedByScalar(30);
            entity.addMomentum(diffVec.x, diffVec.y, diffVec.z);
            
            let origMom = collision.originalMomentum;
            entity.addMomentum(origMom.x / 2, 0, origMom.z / 2);
            this.momentum.x /= 2;
            this.momentum.z /= 2;
        }
    }
    getAnimationExternalForces(level: Level) {
        this.target = level.camera.getPosition();
        let absMom = this.getMomentum().abs();
        if (absMom.x > 0.0001 || absMom.z > 0.0001)
            this.animator.changeAnimation(Animation.CREEPER_WALK);
        else
            this.animator.changeAnimation(Animation.CREEPER_IDLE);
        this.animator.update();
        this.animatedSkeleton.interpolateCurrentRotations(this.animator);
    }
    lookAt(target: Vec3) {
        let joint = this.animatedSkeleton.joints.get(1);
        if (joint === undefined)
            throw new Error("ERROR: could not access head joint of a mob");
        let eye = this.center.withAdded(joint.origRot);
        let lookMat = Mat4.targetTo(eye, target, new Vec3(0, 1, 0));
        return lookMat;
    }
    getRotatedLimbMatrix(joint: AnimatedSkeletonJoint, rotX: number, rotY: number) {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, this.getCenter());
        worldMat = Mat4.rotate(worldMat, rotY, new Vec3(0, 1, 0));
        worldMat = Mat4.translate(worldMat, joint.origRot);
        worldMat = Mat4.rotate(worldMat, rotX, new Vec3(1, 0, 0));
        return worldMat;
    }
    getLimbMatrices() {
        let headJoint = this.animatedSkeleton.getJoint(HEAD);
        if (headJoint === undefined)
            throw new Error("ERROR: could not access head joint of a mob");
        return [
            this.animatedSkeleton.getJointMatrix(BODY),
            this.getRotatedLimbMatrix(headJoint, -this.getRotX(), this.getRotY()),
            this.animatedSkeleton.getJointMatrix(FRONT_LEFT_LEG),
            this.animatedSkeleton.getJointMatrix(FRONT_RIGHT_LEG),
            this.animatedSkeleton.getJointMatrix(BACK_LEFT_LEG),
            this.animatedSkeleton.getJointMatrix(BACK_RIGHT_LEG)
        ];
    }
}

export { Creeper };