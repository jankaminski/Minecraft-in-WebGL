import { makeEntityMesh } from "./entity.js";
import { Model } from "./model.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { CREEPER_TEXTURE } from "./textures.js";
import { gl } from "./webgl-init.js";

const CREEPER_MESH_DATA = await loadMeshDataFromJSON("./res/models/creeper-vertices.json");
const CREEPER_MODEL = new Model(makeEntityMesh(gl, CREEPER_MESH_DATA), CREEPER_TEXTURE);

export { CREEPER_MODEL };