import { canvas } from "./webgl-init.js";

class Input {
    static mouse = {
        leftButton : false,
        rightButton : false,
        position : {
            x : 0.0,
            y : 0.0
        },
        delta : {
            x : 0.0,
            y : 0.0
        }
    };
    static keyBindings = {
        MoveForward :       'w',
        MoveBackwards :     's',
        StrafeLeft :        'a',
        StrafeRight :       'd',
        Jump :              ' ',
        Sneak :             'Shift',
        Sprint :            'Control',
        SwitchPerspective : 'e',
        Pause :              'b',
        Resume :            'v',
        ForceReload :       'n',
        Inventory :         'r'
    };
    static cursorLocked = false;
    static actionMap: Map<string, boolean>;
    static movingForward() {
        return Input.actionMap.get(Input.keyBindings.MoveForward);
    }
    static movingBackwards() {
        return Input.actionMap.get(Input.keyBindings.MoveBackwards);
    }
    static strafingLeft() {
        return Input.actionMap.get(Input.keyBindings.StrafeLeft);
    }
    static strafingRight() {
        return Input.actionMap.get(Input.keyBindings.StrafeRight);
    }
    static moving() {
        let forwards = this.movingForward();
        let backwards = this.movingBackwards();
        let left = this.strafingLeft();
        let right = this.strafingRight();
        return forwards || backwards || left || right;
    }
    static jumping() {
        return Input.actionMap.get(Input.keyBindings.Jump);
    }
    static sneaking() {
        return Input.actionMap.get(Input.keyBindings.Sneak);
    }
    static sprinting() {
        return Input.actionMap.get(Input.keyBindings.Sprint);
    }
    static switchingPerspective() {
        return Input.actionMap.get(Input.keyBindings.SwitchPerspective);
    }
    static pausing() {
        return Input.actionMap.get(Input.keyBindings.Pause);
    }
    static resuming() {
        return Input.actionMap.get(Input.keyBindings.Resume);
    }
    static forceReloading() {
        return Input.actionMap.get(Input.keyBindings.ForceReload);
    }
    static gettingInventory() {
        return Input.actionMap.get(Input.keyBindings.Inventory);
    }
    static init() {
        Input.actionMap = new Map<string, boolean>();
        Input.actionMap.set(Input.keyBindings.MoveForward, false);
        Input.actionMap.set(Input.keyBindings.MoveBackwards, false);
        Input.actionMap.set(Input.keyBindings.StrafeLeft, false);
        Input.actionMap.set(Input.keyBindings.StrafeRight, false);
        Input.actionMap.set(Input.keyBindings.Jump, false);
        Input.actionMap.set(Input.keyBindings.Sneak, false);
        Input.actionMap.set(Input.keyBindings.Sprint, false);
        Input.actionMap.set(Input.keyBindings.SwitchPerspective, false);
        Input.actionMap.set(Input.keyBindings.Pause, false);
        Input.actionMap.set(Input.keyBindings.Resume, false);
        Input.actionMap.set(Input.keyBindings.ForceReload, false);
        Input.actionMap.set(Input.keyBindings.Inventory, false);
        document.addEventListener("mousedown", mouseDown, false);
        document.addEventListener("mouseup", mouseUp, false);
        document.addEventListener("mousemove", mouseMove, false);
        document.addEventListener("keydown", keyDown, false);
        document.addEventListener("keyup", keyUp, false);
        document.addEventListener("pointerlockchange", pointerLockChange, false);
    }
    static refresh() {
        Input.mouse.delta.x = 0;
        Input.mouse.delta.y = 0;
        Input.mouse.position.x = 0;
        Input.mouse.position.y = 0;
    }
}

function pointerLockChange(event: Event) {
    if (document.pointerLockElement) {
        Input.cursorLocked = true;
    } else {
        Input.cursorLocked = false;
    }
}

function mouseDown(event: MouseEvent) {
    if (event.button === 0)
        Input.mouse.leftButton = true;
    if (event.button === 2)
        Input.mouse.rightButton = true;
}

function mouseUp(event: MouseEvent) {
    if (event.button === 0)
        Input.mouse.leftButton = false;
    if (event.button === 2)
        Input.mouse.rightButton = false;
}

function mouseMove(event: MouseEvent) {
    if (document.pointerLockElement !== canvas)
        return;
    Input.mouse.delta.x = event.movementX;
    Input.mouse.delta.y = event.movementY;
    Input.mouse.position.x  = event.pageX;
    Input.mouse.position.y  = event.pageY;
}

function keyDown(event: KeyboardEvent) {
    Input.actionMap.set(event.key, true);
}

function keyUp(event: KeyboardEvent) {
    Input.actionMap.set(event.key, false);
}

export { Input };