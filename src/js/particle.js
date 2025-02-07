import { Mat4, Vec3 } from "./math-utils.js";
import { makeAttrPtr, Mesh, Model } from "./model.js";
import { particleTexture } from "./textures.js";

class Particle {
    constructor(position) {
        this.position = Vec3.copy(position);
        this.remainingLife = 200;
        let momX = (Math.random() - 0.5) / 10;
        let momY = Math.random() / 10;
        let momZ = (Math.random() - 0.5) / 10;
        this.momentum = Vec3.make(momX, momY, momZ);
    }
    getWorldMatrix(camera) {
        let matrix = Mat4.identity();
        matrix = Mat4.translate(matrix, this.position);
        let viewMatrix = camera.getViewMatrix();
        matrix[0] = viewMatrix[0];
        matrix[1] = viewMatrix[4];
        matrix[2] = viewMatrix[8];
        matrix[4] = viewMatrix[1];
        matrix[5] = viewMatrix[5];
        matrix[6] = viewMatrix[9];
        matrix[8] = viewMatrix[2];
        matrix[9] = viewMatrix[6];
        matrix[10] = viewMatrix[10];
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