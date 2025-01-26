function initWebGL() {
    let canvas = document.getElementById("game-surface");
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log("WebGL 2 not supported, falling back on experimental");
        gl = canvas.getContext("experimental-webgl");
    }
    if (!gl)
        alert("Your browser does not support WebGL");
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    return { canvas, gl };
}

let { canvas, gl } = initWebGL();

export {
    gl,
    canvas
};