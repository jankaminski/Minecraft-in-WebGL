function initWebGL() {
    const canvas = document.getElementById("game-surface");
    if (canvas === null)
        throw new Error("Could not find game surface canvas in DOM");
    let gl = canvas.getContext("webgl2");
    if (gl === null)
        throw new Error("Your browser does not support WebGL");
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    let result;
    result = [canvas, gl];
    return result;
}
let [canvas, gl] = initWebGL();
export { gl, canvas };
