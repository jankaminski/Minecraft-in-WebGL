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
        var f = 1.0 / Math.tan(fovy / 2);
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
            var nf = 1 / (near - far);
            out[10] = (far + near) * nf;
            out[14] = 2 * far * near * nf;
        } else {
            out[10] = -1;
            out[14] = -2 * near;
        }
        return out;
    }
    static translate(a, v) {
        var x = v.x,
            y = v.y,
            z = v.z;
        var a00, a01, a02, a03;
        var a10, a11, a12, a13;
        var a20, a21, a22, a23;
        let out = new Float32Array(16);
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            a00 = a[0];
            a01 = a[1];
            a02 = a[2];
            a03 = a[3];
            a10 = a[4];
            a11 = a[5];
            a12 = a[6];
            a13 = a[7];
            a20 = a[8];
            a21 = a[9];
            a22 = a[10];
            a23 = a[11];   
            out[0] = a00;
            out[1] = a01;
            out[2] = a02;
            out[3] = a03;
            out[4] = a10;
            out[5] = a11;
            out[6] = a12;
            out[7] = a13;
            out[8] = a20;
            out[9] = a21;
            out[10] = a22;
            out[11] = a23;
            out[12] = a00 * x + a10 * y + a20 * z + a[12];
            out[13] = a01 * x + a11 * y + a21 * z + a[13];
            out[14] = a02 * x + a12 * y + a22 * z + a[14];
            out[15] = a03 * x + a13 * y + a23 * z + a[15];
        }
        return out;
    }
    static EPSILON = 0.000001;
    static rotate(a, rad, axis) {
        var x = axis[0],
            y = axis[1],
            z = axis[2];
        var len = Math.hypot(x, y, z);
        var s, c, t;
        var a00, a01, a02, a03;
        var a10, a11, a12, a13;
        var a20, a21, a22, a23;
        var b00, b01, b02;
        var b10, b11, b12;
        var b20, b21, b22;
        if (len < Mat4.EPSILON) {
            return null;
        }
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11]; // Construct the elements of the rotation matrix
        b00 = x * x * t + c;
        b01 = y * x * t + z * s;
        b02 = z * x * t - y * s;
        b10 = x * y * t - z * s;
        b11 = y * y * t + c;
        b12 = z * y * t + x * s;
        b20 = x * z * t + y * s;
        b21 = y * z * t - x * s;
        b22 = z * z * t + c; // Perform rotation-specific matrix multiplication
        let out = new Float32Array(16);
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    static scale(a, v) {
        var x = v.x,
            y = v.y,
            z = v.z;
        let out = new Float32Array(16);
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    static multiply(a, b) {
        var a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        var a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        var a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];
        var a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15]; // Cache only the current line of the second matrix
        var b0 = b[0],
            b1 = b[1],
            b2 = b[2],
            b3 = b[3];
        let out = new Float32Array(16);
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    }
    static lookAt(eye, center, up) {
        var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        var eyex = eye.x;
        var eyey = eye.y;
        var eyez = eye.z;
        var upx = up[0];
        var upy = up[1];
        var upz = up[2];
        var centerx = center.x;
        var centery = center.y;
        var centerz = center.z;
        if (Math.abs(eyex - centerx) < Mat4.EPSILON && Math.abs(eyey - centery) < Mat4.EPSILON && Math.abs(eyez - centerz) < Mat4.EPSILON) {
            return Mat4.identity();
        }
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
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
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
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
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
        return out;
    }
    static targetTo(eye, target, up) {
        var eyex = eye.x,
            eyey = eye.y,
            eyez = eye.z,
            upx = up[0],
            upy = up[1],
            upz = up[2];
        var z0 = target.x - eyex,
            z1 = target.y - eyey,
            z2 = target.z - eyez;
        var len = z0 * z0 + z1 * z1 + z2 * z2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            z0 *= len;
            z1 *= len;
            z2 *= len;
        }
        var x0 = upy * z2 - upz * z1,
            x1 = upz * z0 - upx * z2,
            x2 = upx * z1 - upy * z0;
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
        out[12] = eyex;
        out[13] = eyey;
        out[14] = eyez;
        out[15] = 1;
        return out;
    }
}

export { 
    Mat4,
    Vec3,
    Vec2 
};