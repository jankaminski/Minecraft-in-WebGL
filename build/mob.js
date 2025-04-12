import { Entity } from "./entity.js";
class Mob extends Entity {
    constructor(posX, posY, posZ, sizeX, sizeY, sizeZ, model) {
        super(posX, posY, posZ, sizeX, sizeY, sizeZ, model);
    }
}
export { Mob };
