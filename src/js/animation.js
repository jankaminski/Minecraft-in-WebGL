import { Mat4, Vec3 } from "./math-utils.js";
import { Cooldown } from "./misc-utils.js";

class AnimatedSkeleton {
    constructor(entity) {
        this.entity = entity;
        this.joints = new Map();
    }
    addJoint(index, joint) {
        this.joints.set(index, joint);
        return this;
    }
    interpolateCurrentRotations(animator) {
        for (let i = 0; i < animator.currentFrame.noOfJoints; i++) {
            let joint = this.joints.get(i);
            let rotation = animator.currentFrame.rotations[i];
            let duration = animator.animation.duration;
            let targetRot = Vec3.add(rotation, joint.actualRot);
            let originRot = joint.actualRot;
            let add = Vec3.divS(targetRot, duration);
            joint.actualRot = Vec3.sub(originRot, add);
        }
    }
    getJoint(index) {
        return this.joints.get(index);
    }
    getJointMatrix(index) {
        return this.joints.get(index).getMatrix(this.entity);
    }
}

class AnimatedSkeletonJoint {
    constructor(origRot) {
        this.origRot = origRot;
        this.actualRot = Vec3.makeS(0.0);
    }
    getMatrix(entity) {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, entity.getCenter());
        worldMat = Mat4.rotate(worldMat, entity.getRotY(), Vec3.make(0, 1, 0));
        worldMat = Mat4.translate(worldMat, this.origRot);
        worldMat = Mat4.rotate(worldMat, this.actualRot.x, Vec3.make(1, 0, 0));
        worldMat = Mat4.rotate(worldMat, this.actualRot.y, Vec3.make(0, 1, 0));
        worldMat = Mat4.rotate(worldMat, this.actualRot.z, Vec3.make(0, 0, 1));
        return worldMat;
    }
}

class KeyFrame {
    constructor(timeStamp, ...rotations) {
        this.rotations = rotations;
        this.timeStamp = timeStamp;
        this.noOfJoints = rotations.length;
    }
}

class Animation {
    static CREEPER_IDLE = new Animation(
        50,
        new KeyFrame(
            0.0, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0),
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0),
            Vec3.makeS(0.0)
        ),
        new KeyFrame(
            0.5, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0),
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0),
            Vec3.makeS(0.0)
        )
    );
    static CREEPER_WALK = new Animation(
        40,
        new KeyFrame(
            0.0, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0)
        ),
        new KeyFrame(
            0.5, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0)
        )
    );
    static CREEPER_SPRINT = new Animation(
        20,
        new KeyFrame(
            0.0, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0)
        ),
        new KeyFrame(
            0.5, 
            Vec3.makeS(0.0), 
            Vec3.makeS(0.0), 
            Vec3.make( 2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make(-2.5, 0.0, 0.0), 
            Vec3.make( 2.5, 0.0, 0.0)
        )
    );
    constructor(duration, ...keyFrames) {
        this.duration = duration;
        this.keyFrames = keyFrames;
        this.noOfJoints = keyFrames[0].noOfJoints;
        for (let keyFrame of keyFrames)
            if (keyFrame.noOfJoints !== this.noOfJoints)
                throw "ERROR: invalid animation";
    }
}

class Animator {
    constructor(animation) {
        this.changeAnimation(animation);
    }
    changeAnimation(animation) {
        if (animation == this.animation)
            return;
        this.animation = animation;
        this.progress = new Cooldown(animation.duration);
        this.currentFrame = animation.keyFrames[0];
    }
    update() {
        this.progress.progress();
        for (let keyFrame of this.animation.keyFrames) {
            let time = this.progress.getNormalizedProgress();
            if (time > keyFrame.timeStamp - 0.0005 && time < keyFrame.timeStamp + 0.0005) {
                //console.log("progress animation");
                this.currentFrame = keyFrame;
            }
        }
    }
}

export {
    Animation,
    AnimatedSkeleton,
    AnimatedSkeletonJoint,
    Animator
};