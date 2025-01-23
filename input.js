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
        actions : {
            moveForward : false,
            moveBackwards : false,
            strafeLeft : false,
            strafeRight : false,
            jump : false,
            sneak : false,
            sprint : false,
            switchPerspective : false,
            quit : false,
            forceReload : false
        },
        bindings : {
            MoveForward : 'w',
            MoveBackwards : 's',
            StrafeLeft : 'a',
            StrafeRight : 'd',
            Jump : ' ',
            Sneak : 'Shift',
            Sprint : 'Control',
            SwitchPerspective : 'e',
            Quit : 'b',
            ForceReload : 'n'
        }
    };
    static init() {
        document.addEventListener('mousedown', mouseDown, false);
        document.addEventListener('mouseup', mouseUp, false);
        document.addEventListener('mousemove', mouseMove, false);
        document.addEventListener("click", mouseClick, false);
        document.addEventListener('keydown', keyDown, false);
        document.addEventListener('keyup', keyUp, false);
    }
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

function mouseMove(event) {
    let canvas = document.getElementById("game-surface");
    if (document.pointerLockElement !== canvas && document.mozPointerLockElement !== canvas && document.webkitPointerLockElement !== canvas) {
        return;
    }
    Input.mouse.delta.x = event.movementX;
    Input.mouse.delta.y = event.movementY;
    Input.mouse.position.x  = event.pageX;
    Input.mouse.position.y  = event.pageY;
}

function mouseClick() {
    let canvas = document.getElementById("game-surface");
    canvas.requestPointerLock = 
        canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}

function keyDown(event) {
    let bindings = Input.keyboard.bindings;
    let actions = Input.keyboard.actions;
    switch (event.key) {
    case bindings.MoveForward:
        actions.moveForward = true;
        break;
    case bindings.MoveBackwards:
        actions.moveBackwards = true;
        break;
    case bindings.StrafeLeft:
        actions.strafeLeft = true;
        break;
    case bindings.StrafeRight:
        actions.strafeRight = true;
        break;
    case bindings.Jump:
        actions.jump = true;
        break;
    case bindings.Sneak:
        actions.sneak = true;
        break;
    case bindings.Sprint:
        actions.sprint = true;
        break;
    case bindings.SwitchPerspective:
        actions.switchPerspective = true;
        break;
    case bindings.Quit:
        actions.quit = true;
        break;
    case bindings.ForceReload:
        actions.forceReload = true;
        break;
    }
}

function keyUp(event) {
    let bindings = Input.keyboard.bindings;
    let actions = Input.keyboard.actions;
    switch (event.key) {
    case bindings.MoveForward:
        actions.moveForward = false;
        break;
    case bindings.MoveBackwards:
        actions.moveBackwards = false;
        break;
    case bindings.StrafeLeft:
        actions.strafeLeft = false;
        break;
    case bindings.StrafeRight:
        actions.strafeRight = false;
        break;
    case bindings.Jump:
        actions.jump = false;
        break;
    case bindings.Sneak:
        actions.sneak = false;
        break;
    case bindings.Sprint:
        actions.sprint = false;
        break;
    case bindings.SwitchPerspective:
        actions.switchPerspective = false;
        break;
    case bindings.Quit:
        actions.quit = false;
        break;
    case bindings.ForceReload:
        actions.forceReload = false;
        break;
    }
}