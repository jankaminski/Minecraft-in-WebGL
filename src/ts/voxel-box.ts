import { Vec3 } from "./math-utils.js";

class VoxelBox {
    sizeInVoxels: Vec3;
    constructor(xVoxels: number, yVoxels: number, zVoxels: number) {
        this.sizeInVoxels = new Vec3(xVoxels, yVoxels, zVoxels);
    }
    makeVoxelCoordsFromIndex(index: number) {
        let yTimesZ = index % (this.sizeInVoxels.y * this.sizeInVoxels.z);
        let x = (index - yTimesZ) / (this.sizeInVoxels.y * this.sizeInVoxels.z);
        let z = yTimesZ % this.sizeInVoxels.z;
        let y = (yTimesZ - z) / this.sizeInVoxels.z;
        return { x, y, z };
    }
    makeIndexFromVoxelCoords(x: number, y: number, z: number) {
        return z + (y * this.sizeInVoxels.z) + (x * (this.sizeInVoxels.y * this.sizeInVoxels.z));
    }
}

export { VoxelBox };