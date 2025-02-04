import { Vec3 } from "./math-utils.js";

class Cooldown {
    constructor(rate) {
        this.rate = Math.round(rate);
        this.currentProgress = 0;
    }
    getRate() {
        return this.rate;
    }
    setCurrentProgress(currentProgress) {
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

function castRay(origin, rotV, rotH, range) {
    let sinV = Math.sin(rotV);
    let cosV = Math.cos(rotV);
    let distH = cosV * range;
    let sinH = Math.sin(rotH);
    let cosH = Math.cos(rotH);
    let offset = Vec3.negated(Vec3.make(sinH * distH, sinV * range, cosH * distH));
    let tip = Vec3.add(origin, offset);
    return { offset, tip };
}

function areAll(array, condition) {
    let checks = [];
    for (let elem of array) {
        checks.push(condition(elem));
    }
    return (checks.every((value) => value === true)) ? true : false;
}

function arrayWithRemoved(array, condition) {
    let newArray = [];
    for (let elem of array) {
        if (!condition(elem))
            newArray.push(elem);
    }
    return newArray;
}

export {
    Cooldown,
    castRay,
    areAll,
    arrayWithRemoved
};