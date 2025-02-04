import { Vec3 } from "./math-utils.js";
import { Cooldown } from "./misc-utils.js";

class KeyFrame {
    constructor(noOfJoints, rotations, timeStamp) {
        if (rotations.length !== noOfJoints)
            throw "Invalid key frame!!!";
        this.noOfJoints = noOfJoints;
        this.rotations = rotations;
        this.timeStamp = timeStamp;
    }
}

class Animation {
    static CREEPER_IDLE = new Animation(
        new KeyFrame(
            6, 
            [
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0),
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0),
                Vec3.makeS(0.0)
            ],
            1.0
        )
    );
    static CREEPER_WALK = new Animation(
        new KeyFrame(
            6, 
            [
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0), 
                Vec3.make(-0.25, 0.0, 0.0), 
                Vec3.make( 0.25, 0.0, 0.0), 
                Vec3.make( 0.25, 0.0, 0.0), 
                Vec3.make(-0.25, 0.0, 0.0)
            ],
            0.0
        ),
        new KeyFrame(
            6, 
            [
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0), 
                Vec3.make( 0.25, 0.0, 0.0), 
                Vec3.make(-0.25, 0.0, 0.0), 
                Vec3.make(-0.25, 0.0, 0.0), 
                Vec3.make( 0.25, 0.0, 0.0)
            ],
            0.5
        ),
        new KeyFrame(
            6, 
            [
                Vec3.makeS(0.0), 
                Vec3.makeS(0.0), 
                Vec3.make(-0.25, 0.0, 0.0), 
                Vec3.make( 0.25, 0.0, 0.0), 
                Vec3.make( 0.25, 0.0, 0.0), 
                Vec3.make(-0.25, 0.0, 0.0)
            ],
            1.0
        )
    );
    constructor(...keyFrames) {
        this.keyFrames = keyFrames;
    }
}

class Animator {
    constructor(animation, duration) {
        this.animation = animation;
        this.progress = new Cooldown(duration);
        this.currentRotations = [];
        for (let i = 0; i < animation.keyFrames[0].noOfJoints; i++)
            this.currentRotations.push(Vec3.makeS(1.0));
        this.currentFrame = animation.keyFrames[0];
        this.cooldown = new Cooldown(1);
    }
    changeAnimation(animation) {
        if (animation == this.animation)
            return;
        this.animation = animation;
        this.progress.reset();
        this.currentFrame = animation.keyFrames[0];
    }
    update() {
        this.progress.progress();
        //if (this.progress.reached())

        for (let keyFrame of this.animation.keyFrames) {
            let time = this.progress.getNormalizedProgress();
            if (time > keyFrame.timeStamp - 0.005 && time < keyFrame.timeStamp + 0.005) {
                console.log("progress animation");
                this.currentFrame = keyFrame;
            }
        }
        this.interpolateCurrentRotations();
    }
    interpolateCurrentRotations() {
        this.cooldown.progress();
        if (this.cooldown.reached())
        for (let i = 0; i < this.currentFrame.noOfJoints; i++) {
            let targetRot = this.currentFrame.rotations[i];
            let originRot = this.currentRotations[i];
            let diff = Vec3.sub(originRot, targetRot);
            diff = Vec3.divS(diff, 1000);
            this.currentRotations[i] = Vec3.add(originRot, diff);
        }
    }
}

export {
    Animation,
    Animator
};