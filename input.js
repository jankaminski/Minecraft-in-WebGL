class Input {
    static mouse = {
        pressed : false,
        position : {
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
}

function mouseDown(event) {
    Input.mouse.pressed = true;
}

function mouseUp(event) {
    Input.mouse.pressed = false;
}

function mouseMove(event) {
    Input.mouse.position.x = event.clientX;
    Input.mouse.position.y = event.clientY;
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
    if (event.key === 'Shift') { Input.keyboard.sprint = true; }
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
    if (event.key === 'Shift') { Input.keyboard.sprint = false; }
    if (event.key === 'b') { Input.keyboard.quit = false; }
    if (event.key === 'n') { Input.keyboard.forceReload = false; }
}

let body = document.querySelector('body');
body.addEventListener('mousedown', mouseDown, false);
body.addEventListener('mouseup', mouseUp, false);
body.addEventListener('mousemove', mouseMove, false);
body.addEventListener('keydown', keyDown, false);
body.addEventListener('keyup', keyUp, false);

export { Input };