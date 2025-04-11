import { makeEntityMesh } from "./entity.js";
import { makeAttrPtr, Mesh, Model } from "./model.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { ANIMATED_PARTICLE_TEXTURE_ATLAS, BLOCK_TEXTURE_ATLAS, CREEPER_TEXTURE, particleTexture } from "./textures.js";

const CREEPER_MESH_DATA = await loadMeshDataFromJSON("./res/models/creeper-vertices.json");
const CREEPER_MODEL = new Model(makeEntityMesh(CREEPER_MESH_DATA), CREEPER_TEXTURE);
const LEAF_MODEL = new Model(makeEntityMesh(CREEPER_MESH_DATA), particleTexture);

const particleVertices = [
    -1, -1, 0,
     1, -1, 0,
    -1,  1, 0,
     1,  1, 0
];
const particleIndices = [
    0, 1, 3, 3, 2, 0
];
const texturedParticleVertices = [
    -1, -1, 0, 0, 1,
     1, -1, 0, 1, 1,
    -1,  1, 0, 0, 0,
     1,  1, 0, 1, 0
];

const PARTICLE_MESH = new Mesh(particleVertices, particleIndices, makeAttrPtr(0, 3, 3, 0));
const TEXTURED_PARTICLE_MESH = new Mesh(texturedParticleVertices, particleIndices, makeAttrPtr(0, 3, 5, 0), makeAttrPtr(1, 2, 5, 3));
const BLOCK_BREAK_PARTICLE_MODEL = new Model(PARTICLE_MESH, BLOCK_TEXTURE_ATLAS);
const ANIMATED_PARTICLE_MODEL = new Model(TEXTURED_PARTICLE_MESH, ANIMATED_PARTICLE_TEXTURE_ATLAS);

export { 
    CREEPER_MODEL, 
    LEAF_MODEL, 
    ANIMATED_PARTICLE_MODEL,
    BLOCK_BREAK_PARTICLE_MODEL, 
    particleIndices 
};