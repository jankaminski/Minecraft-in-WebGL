import { makeEntityMesh } from "./entity.js";
import { Model } from "./model.js";
import { loadMeshDataFromJSON } from "./res-utils.js";
import { CREEPER_TEXTURE, particleTexture } from "./textures.js";

const CREEPER_MESH_DATA = await loadMeshDataFromJSON("./res/models/creeper-vertices.json");
const CREEPER_MODEL = new Model(makeEntityMesh(CREEPER_MESH_DATA), CREEPER_TEXTURE);
const LEAF_MODEL = new Model(makeEntityMesh(CREEPER_MESH_DATA), particleTexture);

export { CREEPER_MODEL, LEAF_MODEL };