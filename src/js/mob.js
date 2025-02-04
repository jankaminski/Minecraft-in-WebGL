import { Entity } from "./entity.js";
import { 
    Vec3,
    Mat4 
} from "./math-utils.js";

class Mob extends Entity {
    constructor(posX, posY, posZ, sizeX, sizeY, sizeZ, model) {
        super(posX, posY, posZ, sizeX, sizeY, sizeZ, model);
        this.joints = [];
        this.joints[0] = Vec3.makeS(0.0);
    }
    addJoint(joint) {
        this.joints.push(joint);
    }
    getLimbMatrices() { 
        return [Mat4.identity()];
    }
}

export { Mob };