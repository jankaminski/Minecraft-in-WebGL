import { ShaderProgram } from "./shader-program.js";

function loadTextResource(url) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.addEventListener("load", () => {
            if (request.status < 200 || request.status > 299)
                reject("Error: HTTP Status " + request.status + " on resource " + url);
            else
                resolve(request.responseText);
        });
        request.send();
    });
}

function loadImage(url) {
    return new Promise((resolve) => {
        let im = new Image();
        im.addEventListener("load", () => resolve(im));
        im.src = url;
    });
}

async function loadShaderProgramFromFiles(gl, vertURL, fragURL) {
    let vertexShaderSource = await loadTextResource(vertURL);
    let fragmentShaderSource = await loadTextResource(fragURL);
    let shaderProgram = new ShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    return shaderProgram;
}

async function loadMeshDataFromJSON(url) {
    let src = await loadTextResource(url);
    let meshData;
    try {
        meshData = JSON.parse(src);
    } catch (e) {
        console.log("Error parsing JSON file into mesh data");
    }
    return meshData;
}

const VERTICES_PER_FACE = 4;
const INDICES_PER_FACE = 6;

function makeOneFaceIndices(currentLength, indicesTemplate) {
    let indices = [];
    for (let i = 0; i < INDICES_PER_FACE; i++) {
        let index = indicesTemplate[i] + (currentLength / INDICES_PER_FACE) * VERTICES_PER_FACE;
        indices.push(index);
    }
    return indices;
}

function makeMeshIndices(noOfFaces, indicesTemplate) {
    let indices = [];
    for (let i = 0; i < noOfFaces; i++)
        indices = indices.concat(makeOneFaceIndices(indices.length, indicesTemplate));
    return indices;
}

export {
    loadTextResource,
    loadShaderProgramFromFiles,
    loadMeshDataFromJSON,
    loadImage,
    VERTICES_PER_FACE,
    INDICES_PER_FACE,
    makeOneFaceIndices,
    makeMeshIndices
};