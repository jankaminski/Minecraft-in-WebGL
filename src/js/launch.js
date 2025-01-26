import { Input } from "./input.js";
import { run } from "./main.js";

console.log("Launched");
let start = document.getElementById("start");
start.addEventListener("click", () => {
    let menu = document.getElementById("main-menu");
    menu.style.display = "none";
    let canvas = document.getElementById("game-surface");
    canvas.style.display = "block";
    Input.init();
    run();
});