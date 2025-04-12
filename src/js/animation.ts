import { Mat4, Vec3 } from "./math-utils.js";
import { Cooldown } from "./misc-utils.js";
import { Entity } from "./entity.js";

class AnimatedSkeleton {
    entity: Entity;
    joints: Map<number, AnimatedSkeletonJoint>;
    constructor(entity: Entity) {
        this.entity = entity;
        this.joints = new Map();
    }
    addJoint(index: number, joint: AnimatedSkeletonJoint) {
        this.joints.set(index, joint);
        return this;
    }
    interpolateCurrentRotations(animator: Animator) {
        for (let i = 0; i < animator.currentFrame.noOfJoints; i++) {
            let joint = this.joints.get(i);
            if (joint === undefined)
                throw new Error("ERROR: missing joint in animated skeleton");
            let rotation = animator.currentFrame.rotations[i];
            let duration = animator.animation.duration;
            let targetRot = rotation.withAdded(joint.actualRot);
            let originRot = joint.actualRot;
            let add = targetRot.dividedByScalar(duration);
            joint.actualRot = originRot.subtractedWith(add);
        }
    }
    getJoint(index: number): AnimatedSkeletonJoint | undefined {
        return this.joints.get(index);
    }
    getJointMatrix(index: number): Float32Array<ArrayBufferLike> {
        let joint = this.joints.get(index);
        if (joint === undefined)
            throw new Error("ERROR: missing joint in animated skeleton");
        return joint.getMatrix(this.entity);
    }
}

class AnimatedSkeletonJoint {
    origRot: Vec3;
    actualRot: Vec3;
    constructor(origRot: Vec3) {
        this.origRot = origRot;
        this.actualRot = new Vec3(0.0, 0.0, 0.0);
    }
    getMatrix(entity: Entity): Float32Array<ArrayBufferLike> {
        let worldMat = Mat4.identity();
        worldMat = Mat4.translate(worldMat, entity.getCenter());
        worldMat = Mat4.rotate(worldMat, entity.getRotY(), new Vec3(0, 1, 0));
        worldMat = Mat4.translate(worldMat, this.origRot);
        worldMat = Mat4.rotate(worldMat, this.actualRot.x, new Vec3(1, 0, 0));
        worldMat = Mat4.rotate(worldMat, this.actualRot.y, new Vec3(0, 1, 0));
        worldMat = Mat4.rotate(worldMat, this.actualRot.z, new Vec3(0, 0, 1));
        return worldMat;
    }
}

class KeyFrame {
    rotations: Vec3[];
    timeStamp: number;
    noOfJoints: number;
    constructor(timeStamp: number, ...rotations: Vec3[]) {
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
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3(0.0, 0.0, 0.0)
        ),
        new KeyFrame(
            0.5, 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3(0.0, 0.0, 0.0)
        )
    );
    static CREEPER_WALK = new Animation(
        40,
        new KeyFrame(
            0.0, 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0)
        ),
        new KeyFrame(
            0.5, 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0),
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0)
        )
    );
    static CREEPER_SPRINT = new Animation(
        20,
        new KeyFrame(
            0.0, 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0)
        ),
        new KeyFrame(
            0.5, 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3(0.0, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3(-2.5, 0.0, 0.0), 
            new Vec3( 2.5, 0.0, 0.0)
        )
    );
    duration: number;
    keyFrames: KeyFrame[];
    noOfJoints: number;
    constructor(duration: number, ...keyFrames: KeyFrame[]) {
        this.duration = duration;
        this.keyFrames = keyFrames;
        this.noOfJoints = keyFrames[0].noOfJoints;
        for (let keyFrame of keyFrames)
            if (keyFrame.noOfJoints !== this.noOfJoints)
                throw new Error("ERROR: invalid animation");
    }
}

class Animator {
    animation: Animation;
    progress: Cooldown;
    currentFrame: KeyFrame;
    constructor(animation: Animation) {
        //this.changeAnimation(animation);
        this.animation = animation;
        this.progress = new Cooldown(animation.duration);
        this.currentFrame = animation.keyFrames[0];
    }
    changeAnimation(animation: Animation) {
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