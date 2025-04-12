import { Entity } from "./entity.js";
import { Model } from "./model.js";

class Mob extends Entity {
    constructor(
        posX: number, 
        posY: number, 
        posZ: number, 
        sizeX: number, 
        sizeY: number, 
        sizeZ: number, 
        model: Model
    ) {
        super(posX, posY, posZ, sizeX, sizeY, sizeZ, model);
    }
}

export { Mob };