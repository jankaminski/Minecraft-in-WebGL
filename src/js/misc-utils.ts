import { Vec3 } from "./math-utils.js";

class Cooldown {
    rate: number;
    currentProgress: number;
    constructor(rate: number) {
        this.rate = Math.round(rate);
        this.currentProgress = 0;
    }
    getRate() {
        return this.rate;
    }
    setCurrentProgress(currentProgress: number) {
        this.currentProgress = currentProgress;
    }
    getCurrentProgress() {
        return this.currentProgress;
    }
    getNormalizedProgress() {
        return this.currentProgress / this.rate;
    }
    progress() {
        if (this.currentProgress < this.rate) {
            this.currentProgress++;
            return;
        }
        this.currentProgress = 0;
    }
    reached() {
        return this.currentProgress === this.rate;
    }
    reset() {
        this.currentProgress = 0;
    }
    setToReached() {
        this.currentProgress = this.rate - 1;
    }
}

function castRay(origin: Vec3, rotV: number, rotH: number, range: number) {
    let sinV = Math.sin(rotV);
    let cosV = Math.cos(rotV);
    let distH = cosV * range;
    let sinH = Math.sin(rotH);
    let cosH = Math.cos(rotH);
    let offset = new Vec3(sinH * distH, sinV * range, cosH * distH).negated();
    let tip = origin.withAdded(offset);
    return { offset, tip };
}

function areAll(array: any[], condition: (item: any) => boolean) {
    let checks: boolean[] = [];
    for (let elem of array) {
        checks.push(condition(elem));
    }
    return (checks.every((value) => value === true)) ? true : false;
}

const QUAD_VERTICES = [
    -1, -1, 0, 0,
     1, -1, 1, 0,
    -1,  1, 0, 1,
     1,  1, 1, 1
];
const QUAD_INDICES = [
    0, 1, 3, 3, 2, 0
];

export {
    Cooldown,
    castRay,
    areAll,
    QUAD_VERTICES,
    QUAD_INDICES
};