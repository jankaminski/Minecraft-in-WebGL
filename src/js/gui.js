import { Vec2 } from "./math-utils.js";
import { QUAD_INDICES, QUAD_VERTICES } from "./misc-utils.js";
import { makeAttrPtr, Mesh } from "./model.js";

class GUI {
    constructor(min, max) {
        this.min = Vec2.copy(min);
        this.max = Vec2.copy(max);
        let vertices = [
            min.x,  min.y, 
            max.x,  min.y, 
            min.x,  max.y, 
            max.x,  max.y
        ];
        this.mesh = new Mesh(vertices, QUAD_INDICES, makeAttrPtr(0, 2, 4, 0));
    }
}

export { GUI };