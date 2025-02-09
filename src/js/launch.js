import { Input } from "./input.js";
import { run } from "./main.js";

console.log("Launched");
let start = document.getElementById("start");
start.addEventListener("click", () => {
    let mainMenu = document.getElementById("main-menu");
    //let pauseMenu = document.getElementById("pause-menu");
    let canvas = document.getElementById("game-surface");
    mainMenu.style.display = "none";
    canvas.style.display = "block";
    Input.init();
    canvas.requestPointerLock();
    run();
});