import { Vec3 } from "./math-utils.js";
import { Cooldown } from "./misc-utils.js";

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
        this.animation = animation;
        this.progress = new Cooldown(animation.duration);
        this.currentRotations = [];
        for (let i = 0; i < animation.keyFrames[0].noOfJoints; i++)
            this.currentRotations.push(Vec3.makeS(0.0));
        this.currentFrame = animation.keyFrames[0];
        this.cooldown = new Cooldown(1);
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
        this.interpolateCurrentRotations();
    }
    interpolateCurrentRotations() {
        this.cooldown.progress();
        if (this.cooldown.reached())
        for (let i = 0; i < this.currentFrame.noOfJoints; i++) {
            let targetRot = Vec3.add(this.currentFrame.rotations[i], this.currentRotations[i]);
            let originRot = this.currentRotations[i];
            let add = Vec3.divS(targetRot, this.animation.duration);
            this.currentRotations[i] = Vec3.sub(originRot, add);
        }
    }
}

export {
    Animation,
    Animator
};