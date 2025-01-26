import { Input } from "../js/input.js";
import { run } from "../js/main.js";

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