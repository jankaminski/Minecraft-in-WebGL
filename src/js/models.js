import { makeEntityMesh } from "../js/entity.js";
import { Model } from "../js/model.js";
import { loadMeshDataFromJSON } from "../js/res-utils.js";
import { CREEPER_TEXTURE } from "../js/textures.js";
import { gl } from "../js/webgl-init.js";

const CREEPER_MESH_DATA = await loadMeshDataFromJSON("./res/models/creeper-vertices.json");
const CREEPER_MODEL = new Model(makeEntityMesh(gl, CREEPER_MESH_DATA), CREEPER_TEXTURE);

export { CREEPER_MODEL };