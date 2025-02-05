import { Entity } from "./entity.js";
import { 
    Vec3,
    Mat4 
} from "./math-utils.js";

class Mob extends Entity {
    constructor(posX, posY, posZ, sizeX, sizeY, sizeZ, model) {
        super(posX, posY, posZ, sizeX, sizeY, sizeZ, model);
    }
}

export { Mob };