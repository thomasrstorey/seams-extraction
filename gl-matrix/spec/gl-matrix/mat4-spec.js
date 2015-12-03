/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

var glMatrix = require("../../src/gl-matrix/common.js");
var mat4 = require("../../src/gl-matrix/mat4.js");
var vec3 = require("../../src/gl-matrix/vec3.js");

// Inject the polyfill for testing
if (!glMatrix.SIMD_AVAILABLE) {
  require("simd").shim();
}

function buildMat4Tests(useSIMD) {
    mat4.TEST_PATH = useSIMD ? mat4.SIMD : mat4.scalar;

    return function() {
        var out, matA, matB, identity, result;

        beforeEach(function() {
            // Attempting to portray a semi-realistic transform matrix
            matA = new Float32Array([1, 0, 0, 0,
                                     0, 1, 0, 0,
                                     0, 0, 1, 0,
                                     1, 2, 3, 1]);

            matB = new Float32Array([1, 0, 0, 0,
                                     0, 1, 0, 0,
                                     0, 0, 1, 0,
                                     4, 5, 6, 1]);

            out = new Float32Array([0, 0, 0, 0,
                                    0, 0, 0, 0,
                                    0, 0, 0, 0,
                                    0, 0, 0, 0]);

            identity = new Float32Array([1, 0, 0, 0,
                                         0, 1, 0, 0,
                                         0, 0, 1, 0,
                                         0, 0, 0, 1]);
        });

        describe("create", function() {
            beforeEach(function() { result = mat4.create(); });
            it("should return a 16 element array initialized to a 4x4 identity matrix", function() { expect(result).toBeEqualish(identity); });
        });

        describe("clone", function() {
            beforeEach(function() { result = mat4.clone(matA); });
            it("should return a 16 element array initialized to the values in matA", function() { expect(result).toBeEqualish(matA); });
        });

        describe("copy", function() {
            beforeEach(function() { result = mat4.copy(out, matA); });
            it("should place values into out", function() { expect(out).toBeEqualish(matA); });
            it("should return out", function() { expect(result).toBe(out); });
        });

        describe("identity", function() {
            beforeEach(function() { result = mat4.identity(out); });
            it("should place values into out", function() { expect(result).toBeEqualish(identity); });
            it("should return out", function() { expect(result).toBe(out); });
        });

        describe("transpose", function() {
            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.transpose(out, matA); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 1,
                        0, 1, 0, 2,
                        0, 0, 1, 3,
                        0, 0, 0, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.transpose(matA, matA); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 1,
                        0, 1, 0, 2,
                        0, 0, 1, 3,
                        0, 0, 0, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("invert", function() {
            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.invert(out, matA); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        -1, -2, -3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.invert(matA, matA); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        -1, -2, -3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("adjoint", function() {
            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.adjoint(out, matA); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        -1, -2, -3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.adjoint(matA, matA); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        -1, -2, -3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("determinant", function() {
            beforeEach(function() { result = mat4.determinant(matA); });

            it("should return the determinant", function() { expect(result).toEqual(1); });
        });

        describe("multiply", function() {
            it("should have an alias called 'mul'", function() { expect(mat4.mul).toEqual(mat4.multiply); });

            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.multiply(out, matA, matB); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        5, 7, 9, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should not modify matB", function() {
                    expect(matB).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        4, 5, 6, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.multiply(matA, matA, matB); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        5, 7, 9, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
                it("should not modify matB", function() {
                    expect(matB).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        4, 5, 6, 1
                    ]);
                });
            });

            describe("when matB is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.multiply(matB, matA, matB); });

                it("should place values into matB", function() {
                    expect(matB).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        5, 7, 9, 1
                    ]);
                });
                it("should return matB", function() { expect(result).toBe(matB); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });
        });

        describe("translate", function() {
            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.translate(out, matA, [4, 5, 6]); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        5, 7, 9, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.translate(matA, matA, [4, 5, 6]); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        5, 7, 9, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("scale", function() {
            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.scale(out, matA, [4, 5, 6]); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        4, 0, 0, 0,
                        0, 5, 0, 0,
                        0, 0, 6, 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.scale(matA, matA, [4, 5, 6]); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        4, 0, 0, 0,
                        0, 5, 0, 0,
                        0, 0, 6, 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("rotate", function() {
            var rad = Math.PI * 0.5;
            var axis = [1, 0, 0];

            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.rotate(out, matA, rad, axis); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, Math.cos(rad), Math.sin(rad), 0,
                        0, -Math.sin(rad), Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.rotate(matA, matA, rad, axis); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, Math.cos(rad), Math.sin(rad), 0,
                        0, -Math.sin(rad), Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("rotateX", function() {
            var rad = Math.PI * 0.5;

            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateX(out, matA, rad); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        1, 0, 0, 0,
                        0, Math.cos(rad), Math.sin(rad), 0,
                        0, -Math.sin(rad), Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateX(matA, matA, rad); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, Math.cos(rad), Math.sin(rad), 0,
                        0, -Math.sin(rad), Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("rotateY", function() {
            var rad = Math.PI * 0.5;

            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateY(out, matA, rad); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        Math.cos(rad), 0, -Math.sin(rad), 0,
                        0, 1, 0, 0,
                        Math.sin(rad), 0, Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateY(matA, matA, rad); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        Math.cos(rad), 0, -Math.sin(rad), 0,
                        0, 1, 0, 0,
                        Math.sin(rad), 0, Math.cos(rad), 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        describe("rotateZ", function() {
            var rad = Math.PI * 0.5;

            describe("with a separate output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateZ(out, matA, rad); });

                it("should place values into out", function() {
                    expect(out).toBeEqualish([
                        Math.cos(rad), Math.sin(rad), 0, 0,
                        -Math.sin(rad), Math.cos(rad), 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return out", function() { expect(result).toBe(out); });
                it("should not modify matA", function() {
                    expect(matA).toBeEqualish([
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
            });

            describe("when matA is the output matrix", function() {
                beforeEach(function() { result = mat4.TEST_PATH.rotateZ(matA, matA, rad); });

                it("should place values into matA", function() {
                    expect(matA).toBeEqualish([
                        Math.cos(rad), Math.sin(rad), 0, 0,
                        -Math.sin(rad), Math.cos(rad), 0, 0,
                        0, 0, 1, 0,
                        1, 2, 3, 1
                    ]);
                });
                it("should return matA", function() { expect(result).toBe(matA); });
            });
        });

        // TODO: fromRotationTranslation

        describe("frustum", function() {
            beforeEach(function() { result = mat4.frustum(out, -1, 1, -1, 1, -1, 1); });
            it("should place values into out", function() { expect(result).toBeEqualish([
                    -1, 0, 0, 0,
                    0, -1, 0, 0,
                    0, 0, 0, -1,
                    0, 0, 1, 0
                ]);
            });
            it("should return out", function() { expect(result).toBe(out); });
        });

        describe("perspective", function() {
            var fovy = Math.PI * 0.5;
            beforeEach(function() { result = mat4.perspective(out, fovy, 1, 0, 1); });
            it("should place values into out", function() { expect(result).toBeEqualish([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, -1, -1,
                    0, 0, 0, 0
                ]);
            });
            it("should return out", function() { expect(result).toBe(out); });

            describe("with nonzero near, 45deg fovy, and realistic aspect ratio", function() {
                beforeEach(function() { result = mat4.perspective(out, 45 * Math.PI / 180.0, 640/480, 0.1, 200); });
                it("should calculate correct matrix", function() { expect(result).toBeEqualish([
                    1.81066, 0, 0, 0,
                    0, 2.414213, 0, 0,
                    0, 0, -1.001, -1,
                    0, 0, -0.2001, 0
                ]); });
            });
        });

        describe("ortho", function() {
            beforeEach(function() { result = mat4.ortho(out, -1, 1, -1, 1, -1, 1); });
            it("should place values into out", function() { expect(result).toBeEqualish([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, -1, 0,
                    0, 0, 0, 1
                ]);
            });
            it("should return out", function() { expect(result).toBe(out); });
        });

        describe("lookAt", function() {
            var eye    = new Float32Array([0, 0, 1]);
            var center = new Float32Array([0, 0, -1]);
            var up     = new Float32Array([0, 1, 0]);
            var view, up, right;

            describe("looking down", function() {
                beforeEach(function() {
                    view = new Float32Array([0, -1,  0]);
                    up   = new Float32Array([0,  0, -1]);
                    right= new Float32Array([1,  0,  0]);
                    result = mat4.lookAt(out, [0, 0, 0], view, up);
                });

                it("should transform view into local -Z", function() {
                    result = vec3.transformMat4(new Float32Array(3), view, out);
                    expect(result).toBeEqualish([0, 0, -1]);
                });

                it("should transform up into local +Y", function() {
                    result = vec3.transformMat4(new Float32Array(3), up, out);
                    expect(result).toBeEqualish([0, 1, 0]);
                });

                it("should transform right into local +X", function() {
                    result = vec3.transformMat4(new Float32Array(3), right, out);
                    expect(result).toBeEqualish([1, 0, 0]);
                });

                it("should return out", function() { expect(result).toBe(out); });
            });

            describe("#74", function() {
                beforeEach(function() {
                    mat4.lookAt(out,
                        new Float32Array([0,2,0]),
                        new Float32Array([0,0.6,0]),
                        new Float32Array([0,0,-1]));
                });

                it("should transform a point 'above' into local +Y", function() {
                    result = vec3.transformMat4(new Float32Array(3), [0, 2, -1], out);
                    expect(result).toBeEqualish([0, 1, 0]);
                });

                it("should transform a point 'right of' into local +X", function() {
                    result = vec3.transformMat4(new Float32Array(3), [1, 2, 0], out);
                    expect(result).toBeEqualish([1, 0, 0]);
                });

                it("should transform a point 'in front of' into local -Z", function() {
                    result = vec3.transformMat4(new Float32Array(3), [0, 1, 0], out);
                    expect(result).toBeEqualish([0, 0, -1]);
                });
            });

            beforeEach(function() {
                eye    = new Float32Array([0, 0, 1]);
                center = new Float32Array([0, 0, -1]);
                up     = new Float32Array([0, 1, 0]);
                result = mat4.lookAt(out, eye, center, up);
            });
            it("should place values into out", function() { expect(result).toBeEqualish([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, -1, 1
                ]);
            });
            it("should return out", function() { expect(result).toBe(out); });
        });

        describe("str", function() {
            beforeEach(function() { result = mat4.str(matA); });

            it("should return a string representation of the matrix", function() { expect(result).toEqual("mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1)"); });
        });

       describe("frob", function() {
            beforeEach(function() { result = mat4.frob(matA); });
            it("should return the Frobenius Norm of the matrix", function() { expect(result).toEqual( Math.sqrt(Math.pow(1, 2) + Math.pow(1, 2) + Math.pow(1, 2) + Math.pow(1, 2) + Math.pow(1, 2) + Math.pow(2, 2) + Math.pow(3, 2) )); });
       });
    };

    describe("add", function() {
        beforeEach(function() {
            matA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            matB = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
        });
        describe("with a separate output matrix", function() {
            beforeEach(function() {
                result = mat3.add(out, matA, matB);
            });

            it("should place values into out", function() { expect(out).toBeEqualish([18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48]); });
            it("should return out", function() { expect(result).toBe(out); });
            it("should not modify matA", function() { expect(matA).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); });
            it("should not modify matB", function() { expect(matB).toBeEqualish([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]); });
        });

        describe("when matA is the output matrix", function() {
            beforeEach(function() { result = mat3.add(matA, matA, matB); });

            it("should place values into matA", function() { expect(matA).toBeEqualish([18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48]); });
            it("should return matA", function() { expect(result).toBe(matA); });
            it("should not modify matB", function() { expect(matB).toBeEqualish([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]); });
        });

        describe("when matB is the output matrix", function() {
            beforeEach(function() { result = mat3.add(matB, matA, matB); });

            it("should place values into matB", function() { expect(matB).toBeEqualish([18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48]); });
            it("should return matB", function() { expect(result).toBe(matB); });
            it("should not modify matA", function() { expect(matA).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); });
        });
    });

    describe("subtract", function() {
        beforeEach(function() {
            matA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            matB = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
        });
        it("should have an alias called 'sub'", function() { expect(mat3.sub).toEqual(mat3.subtract); });

        describe("with a separate output matrix", function() {
            beforeEach(function() { result = mat3.subtract(out, matA, matB); });

            it("should place values into out", function() { expect(out).toBeEqualish([-16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16, -16]); });
            it("should return out", function() { expect(result).toBe(out); });
            it("should not modify matA", function() { expect(matA).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); });
            it("should not modify matB", function() { expect(matB).toBeEqualish([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]); });
        });

        describe("when matA is the output matrix", function() {
            beforeEach(function() { result = mat3.subtract(matA, matA, matB); });

            it("should place values into matA", function() { expect(matA).toBeEqualish([-16, -16, -16, -16, -16, -16, -16, -16, ]); });
            it("should return matA", function() { expect(result).toBe(matA); });
            it("should not modify matB", function() { expect(matB).toBeEqualish([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]); });
        });

        describe("when matB is the output matrix", function() {
            beforeEach(function() { result = mat3.subtract(matB, matA, matB); });

            it("should place values into matB", function() { expect(matB).toBeEqualish([-16, -16, -16, -16, -16, -16, -16, -16, ]); });
            it("should return matB", function() { expect(result).toBe(matB); });
            it("should not modify matA", function() { expect(matA).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); });
        });
    });

    describe("fromValues", function() {
        beforeEach(function() { result = mat4.fromValues(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15); });
        it("should return a 16 element array initialized to the values passed", function() { expect(result).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); });
    });

    describe("set", function() {
        beforeEach(function() { result = mat4.set(out, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15); });
        it("should place values into out", function() { expect(out).toBeEqualish([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); });
        it("should return out", function() { expect(result).toBe(out); });
    });
}

describe("mat4 (SISD)", buildMat4Tests(false));
describe("mat4 (SIMD)", buildMat4Tests(true));
