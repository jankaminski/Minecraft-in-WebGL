import { Mat4, Vec3 } from "./math-utils.js";
import { makeAttrPtr, Mesh, Model } from "./model.js";
import { particleTexture } from "./textures.js";

class Particle {
    constructor(position) {
        this.position = Vec3.copy(position);
        this.remainingLife = 200;
        let momX = Math.random() / 10;
        let momY = Math.random() / 10;
        let momZ = Math.random() / 10;
        this.momentum = Vec3.make(momX, momY, momZ);
    }
    getWorldMatrix(camera) {
        let matrix = Mat4.identity();
        matrix = Mat4.translate(matrix, this.position);
        matrix = Mat4.rotate(matrix,  camera.rotV, Vec3.make(1, 0, 0));
        matrix = Mat4.rotate(matrix, -camera.rotH, Vec3.make(0, 1, 0));
        return matrix;
    }
    update(level) {
        if (this.remainingLife > 0)
            this.remainingLife--;
        this.position = Vec3.add(this.position, this.momentum);
    }
}

const particleVertices = [
    -0.1, -0.1, 0, 0, 0,
     0.1, -0.1, 0, 1, 0,
    -0.1,  0.1, 0, 0, 1,
     0.1,  0.1, 0, 1, 1
];
const particleIndices = [
    0, 1, 3, 3, 2, 0
];
let particleMesh = new Mesh(particleVertices, particleIndices, makeAttrPtr(0, 3, 5, 0), makeAttrPtr(1, 2, 5, 3));
let particleModel = new Model(particleMesh, particleTexture);

export { Particle, particleModel };