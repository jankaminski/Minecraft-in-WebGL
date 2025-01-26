import { Vec3 } from "./math-utils.js";

class VoxelBox {
    constructor(xVoxels, yVoxels, zVoxels) {
        this.sizeInVoxels = Vec3.make(xVoxels, yVoxels, zVoxels);
    }
    makeVoxelCoordsFromIndex(index) {
        let yTimesZ = index % (this.sizeInVoxels.y * this.sizeInVoxels.z);
        let x = (index - yTimesZ) / (this.sizeInVoxels.y * this.sizeInVoxels.z);
        let z = yTimesZ % this.sizeInVoxels.z;
        let y = (yTimesZ - z) / this.sizeInVoxels.z;
        return { x, y, z };
    }
    makeIndexFromVoxelCoords(x, y, z) {
        return z + (y * this.sizeInVoxels.z) + (x * (this.sizeInVoxels.y * this.sizeInVoxels.z));
    }
}

export { VoxelBox };