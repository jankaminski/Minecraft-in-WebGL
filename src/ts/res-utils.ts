import { ShaderProgram } from "./shader-program.js";

function loadTextResource(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
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

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        let im = new Image();
        im.addEventListener("load", () => resolve(im));
        im.src = url;
    });
}

async function loadShaderProgramFromFiles(vertURL: string, fragURL: string): Promise<ShaderProgram> {
    let vertexShaderSource = await loadTextResource(vertURL);
    let fragmentShaderSource = await loadTextResource(fragURL);
    let shaderProgram = new ShaderProgram(vertexShaderSource, fragmentShaderSource);
    return shaderProgram;
}

async function loadMeshDataFromJSON(url: string): Promise<any> {
    let src = await loadTextResource(url);
    let meshData = null;
    try {
        meshData = JSON.parse(src);
    } catch (e) {
        console.log("Error parsing JSON file into mesh data");
    }
    return meshData;
}

export {
    loadTextResource,
    loadShaderProgramFromFiles,
    loadMeshDataFromJSON,
    loadImage
};