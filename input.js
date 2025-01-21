class Input {
    static mouse = {
        pressed : false,
        position : {
            x : 0.0,
            y : 0.0
        },
        delta : {
            x : 0.0,
            y : 0.0
        }
    };
    static keyboard = {
        forward : false,
        back : false,
        strafeLeft : false,
        strafeRight : false,
        jump : false,
        sneak : false,
        lookUp : false,
        lookDown : false,
        lookLeft : false,
        lookRight : false,
        sprint : false,
        quit : false,
        forceReload : false
    };
    static refresh() {
        Input.mouse.delta.x = 0;
        Input.mouse.delta.y = 0;
        Input.mouse.position.x = 0;
        Input.mouse.position.y = 0;
    }
}

function mouseDown(event) {
    Input.mouse.pressed = true;
}

function mouseUp(event) {
    Input.mouse.pressed = false;
}

let canvas = document.getElementById("game-surface");

function mouseMove(event) {
    if (document.pointerLockElement !== canvas && document.mozPointerLockElement !== canvas && document.webkitPointerLockElement !== canvas) {
        return;
    }
    Input.mouse.delta.x = event.movementX;
    Input.mouse.delta.y = event.movementY;
    Input.mouse.position.x  = event.pageX;
    Input.mouse.position.y  = event.pageY;
}

function mouseClick() {
    canvas.requestPointerLock = 
        canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}

function keyDown(event) {
    if (event.key === 'w') { Input.keyboard.forward = true; }
    if (event.key === 's') { Input.keyboard.back = true; }
    if (event.key === 'a') { Input.keyboard.strafeLeft = true; }
    if (event.key === 'd') { Input.keyboard.strafeRight = true; }
    if (event.key === ' ') { Input.keyboard.jump = true; }
    if (event.key === 'Control') { Input.keyboard.sneak = true; }
    if (event.key === 'ArrowUp') { Input.keyboard.lookUp = true; }
    if (event.key === 'ArrowDown') { Input.keyboard.lookDown = true; }
    if (event.key === 'ArrowLeft') { Input.keyboard.lookLeft = true; }
    if (event.key === 'ArrowRight') { Input.keyboard.lookRight = true; }
    if (event.shiftKey) { Input.keyboard.sprint = true; }
    if (event.key === 'b') { Input.keyboard.quit = true; }
    if (event.key === 'n') { Input.keyboard.forceReload = true; }
}

function keyUp(event) {
    if (event.key === 'w') { Input.keyboard.forward = false; }
    if (event.key === 's') { Input.keyboard.back = false; }
    if (event.key === 'a') { Input.keyboard.strafeLeft = false; }
    if (event.key === 'd') { Input.keyboard.strafeRight = false; }
    if (event.key === ' ') { Input.keyboard.jump = false; }
    if (event.key === 'Control') { Input.keyboard.sneak = false; }
    if (event.key === 'ArrowUp') { Input.keyboard.lookUp = false; }
    if (event.key === 'ArrowDown') { Input.keyboard.lookDown = false; }
    if (event.key === 'ArrowLeft') { Input.keyboard.lookLeft = false; }
    if (event.key === 'ArrowRight') { Input.keyboard.lookRight = false; }
    if (!event.shiftKey) { Input.keyboard.sprint = false; }
    if (event.key === 'b') { Input.keyboard.quit = false; }
    if (event.key === 'n') { Input.keyboard.forceReload = false; }
}

document.addEventListener('mousedown', mouseDown, false);
document.addEventListener('mouseup', mouseUp, false);
document.addEventListener('mousemove', mouseMove, false);
document.addEventListener("click", mouseClick, false);
document.addEventListener('keydown', keyDown, false);
document.addEventListener('keyup', keyUp, false);

export { Input };