class Vec3 {
    static compare(v1, v2) {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }
    static isZero(vec) {
        return vec.x === 0 && vec.y === 0 && vec.z === 0;
    }
    static abs(vec) {
        return { x : Math.abs(vec.x), y : Math.abs(vec.y), z : Math.abs(vec.z) };
    }
    static make(x, y, z) {
        return { x, y, z };
    }
    static makeS(scalar) {
        return { x : scalar, y : scalar, z : scalar };
    }
    static copy(vec) {
        return { x : vec.x, y : vec.y, z : vec.z };
    }
    static negated(vec) {
        return { x : -vec.x, y : -vec.y, z : -vec.z };
    }
    static xyzScalarProduct(vec) {
        return vec.x * vec.y * vec.z;
    }
    static add(v1, v2) {
        return { x : v1.x + v2.x, y : v1.y + v2.y, z : v1.z + v2.z };
    }
    static addS(vec, scalar) {
        return { x : vec.x + scalar, y : vec.y + scalar, z : vec.z + scalar };
    }
    static mul(v1, v2) {
        return { x : v1.x * v2.x, y : v1.y * v2.y, z : v1.z * v2.z };
    }
    static mulS(vec, scalar) {
        return { x : vec.x * scalar, y : vec.y * scalar, z : vec.z * scalar };
    }
    static div(v1, v2) {
        return { x : v1.x / v2.x, y : v1.y / v2.y, z : v1.z / v2.z };
    }
    static divS(vec, scalar) {
        return { x : vec.x / scalar, y : vec.y / scalar, z : vec.z / scalar };
    }
    static sub(v1, v2) {
        return { x : v1.x - v2.x, y : v1.y - v2.y, z : v1.z - v2.z };
    }
    static subS(vec, scalar) {
        return { x : vec.x - scalar, y : vec.y - scalar, z : vec.z - scalar };
    }
    static normalize(vec) {
        let len = vec.x * vec.x + vec.y * vec.y + vec.z * vec.z;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
        }
        let result = {
            x : vec.x * len,
            y : vec.y * len,
            z : vec.z * len
        };
        return result;
    }
    static sign(vec) {
        return { x : Math.sign(vec.x), y : Math.sign(vec.y), z : Math.sign(vec.z) };
    }
}

class Vec2 {
    static normalize(vec) {
        var len = vec.x * vec.x + vec.y * vec.y;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
        }
        let result = {
            x : vec.x * len,
            y : vec.y * len
        }
        return result;
    }
}

class Mat4 {
    static identity() {
        let out = new Float32Array(16);
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    static perspective(fovy, width, height, near, far) {
        let out = new Float32Array(16);
        let f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / (width / height);
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[15] = 0;
        if (far != null && far !== Infinity) {
            let nf = 1 / (near - far);
            out[10] = (far + near) * nf;
            out[14] = 2 * far * near * nf;
        } else {
            out[10] = -1;
            out[14] = -2 * near;
        }
        return out;
    }
    static translate(a, v) {
        let x = v.x,
            y = v.y,
            z = v.z;
        let out = new Float32Array(16);  
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[0] * x + a[4] * y + a[8]  * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9]  * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        return out;
    }
    static EPSILON = 0.000001;
    static rotate(a, rad, axis) {
        let x = axis.x,
            y = axis.y,
            z = axis.z;
        let len = Math.hypot(x, y, z);
        if (len < Mat4.EPSILON)
            return null;
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        let t = 1 - c;
        let rotComponent = new Float32Array(9);
        rotComponent[0] = x * x * t + c;
        rotComponent[1] = y * x * t + z * s;
        rotComponent[2] = z * x * t - y * s;
        rotComponent[3] = x * y * t - z * s;
        rotComponent[4] = y * y * t + c;
        rotComponent[5] = z * y * t + x * s;
        rotComponent[6] = x * z * t + y * s;
        rotComponent[7] = y * z * t - x * s;
        rotComponent[8] = z * z * t + c; 
        let out = new Float32Array(16);
        out[0] =  a[0] * rotComponent[0] + a[4] * rotComponent[1] + a[8]  * rotComponent[2];
        out[1] =  a[1] * rotComponent[0] + a[5] * rotComponent[1] + a[9]  * rotComponent[2];
        out[2] =  a[2] * rotComponent[0] + a[6] * rotComponent[1] + a[10] * rotComponent[2];
        out[3] =  a[3] * rotComponent[0] + a[7] * rotComponent[1] + a[11] * rotComponent[2];
        out[4] =  a[0] * rotComponent[3] + a[4] * rotComponent[4] + a[8]  * rotComponent[5];
        out[5] =  a[1] * rotComponent[3] + a[5] * rotComponent[4] + a[9]  * rotComponent[5];
        out[6] =  a[2] * rotComponent[3] + a[6] * rotComponent[4] + a[10] * rotComponent[5];
        out[7] =  a[3] * rotComponent[3] + a[7] * rotComponent[4] + a[11] * rotComponent[5];
        out[8] =  a[0] * rotComponent[6] + a[4] * rotComponent[7] + a[8]  * rotComponent[8];
        out[9] =  a[1] * rotComponent[6] + a[5] * rotComponent[7] + a[9]  * rotComponent[8];
        out[10] = a[2] * rotComponent[6] + a[6] * rotComponent[7] + a[10] * rotComponent[8];
        out[11] = a[3] * rotComponent[6] + a[7] * rotComponent[7] + a[11] * rotComponent[8];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    static scale(a, v) {
        let x = v.x,
            y = v.y,
            z = v.z;
        let out = new Float32Array(16);
        out[0] =  a[0]  * x;
        out[1] =  a[1]  * x;
        out[2] =  a[2]  * x;
        out[3] =  a[3]  * x;
        out[4] =  a[4]  * y;
        out[5] =  a[5]  * y;
        out[6] =  a[6]  * y;
        out[7] =  a[7]  * y;
        out[8] =  a[8]  * z;
        out[9] =  a[9]  * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    static multiply(a, b) {
        let out = new Float32Array(16);
        out[0] =  b[0]  * a[0] + b[1]  * a[4] + b[2]  * a[8]  + b[3]  * a[12];
        out[1] =  b[0]  * a[1] + b[1]  * a[5] + b[2]  * a[9]  + b[3]  * a[13];
        out[2] =  b[0]  * a[2] + b[1]  * a[6] + b[2]  * a[10] + b[3]  * a[14];
        out[3] =  b[0]  * a[3] + b[1]  * a[7] + b[2]  * a[11] + b[3]  * a[15];
        out[4] =  b[4]  * a[0] + b[5]  * a[4] + b[6]  * a[8]  + b[7]  * a[12];
        out[5] =  b[4]  * a[1] + b[5]  * a[5] + b[6]  * a[9]  + b[7]  * a[13];
        out[6] =  b[4]  * a[2] + b[5]  * a[6] + b[6]  * a[10] + b[7]  * a[14];
        out[7] =  b[4]  * a[3] + b[5]  * a[7] + b[6]  * a[11] + b[7]  * a[15];
        out[8] =  b[8]  * a[0] + b[9]  * a[4] + b[10] * a[8]  + b[11] * a[12];
        out[9] =  b[8]  * a[1] + b[9]  * a[5] + b[10] * a[9]  + b[11] * a[13];
        out[10] = b[8]  * a[2] + b[9]  * a[6] + b[10] * a[10] + b[11] * a[14];
        out[11] = b[8]  * a[3] + b[9]  * a[7] + b[10] * a[11] + b[11] * a[15];
        out[12] = b[12] * a[0] + b[13] * a[4] + b[14] * a[8]  + b[15] * a[12];
        out[13] = b[12] * a[1] + b[13] * a[5] + b[14] * a[9]  + b[15] * a[13];
        out[14] = b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14];
        out[15] = b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15];
        return out;
    }
    static lookAt(eye, center, up) {
        if (Math.abs(eye.x - center.x) < Mat4.EPSILON && 
            Math.abs(eye.y - center.y) < Mat4.EPSILON && 
            Math.abs(eye.z - center.z) < Mat4.EPSILON) {
            return Mat4.identity();
        }
        let z0 = eye.x - center.x;
        let z1 = eye.y - center.y;
        let z2 = eye.z - center.z;
        let len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        let x0 = up.y * z2 - up.z * z1;
        let x1 = up.z * z0 - up.x * z2;
        let x2 = up.x * z1 - up.y * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        let y0 = z1 * x2 - z2 * x1;
        let y1 = z2 * x0 - z0 * x2;
        let y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }
        let out = new Float32Array(16);
        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eye.x + x1 * eye.y + x2 * eye.z);
        out[13] = -(y0 * eye.x + y1 * eye.y + y2 * eye.z);
        out[14] = -(z0 * eye.x + z1 * eye.y + z2 * eye.z);
        out[15] = 1;
        return out;
    }
    static targetTo(eye, target, up) {
        let z0 = target.x - eye.x,
            z1 = target.y - eye.y,
            z2 = target.z - eye.z;
        let len = z0 * z0 + z1 * z1 + z2 * z2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            z0 *= len;
            z1 *= len;
            z2 *= len;
        }
        let x0 = up.y * z2 - up.z * z1,
            x1 = up.z * z0 - up.x * z2,
            x2 = up.x * z1 - up.y * z0;
        len = x0 * x0 + x1 * x1 + x2 * x2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        let out = new Float32Array(16);
        out[0] = x0;
        out[1] = x1;
        out[2] = x2;
        out[3] = 0;
        out[4] = z1 * x2 - z2 * x1;
        out[5] = z2 * x0 - z0 * x2;
        out[6] = z0 * x1 - z1 * x0;
        out[7] = 0;
        out[8] = z0;
        out[9] = z1;
        out[10] = z2;
        out[11] = 0;
        out[12] = eye.x;
        out[13] = eye.y;
        out[14] = eye.z;
        out[15] = 1;
        return out;
    }
}

export {
    Vec2,
    Vec3,
    Mat4
};