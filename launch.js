let game = document.getElementById("game-surface");
let gameDesc = document.getElementById("game-desc");
let menu = document.getElementById("main-menu");
let start = document.getElementById("start");
start.addEventListener("click", () => {
    menu.style.display = "none";
    game.style.display = "block";
    document.addEventListener("click", mouseClick, false);
    run();
});