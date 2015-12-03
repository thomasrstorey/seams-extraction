/*
thomasrstorey
seams.js
disaster seminar

use webgl to render seam carving in realtime
*/


var nodejs = true;

var fs = require('fs');
var mat4 = require('./gl-matrix/dist/gl-matrix.js').mat4;
var cluster = require('cluster');
// eval(fs.readFileSync(__dirname+'/gl-matrix/dist/gl-matrix.js', 'utf8'));

var se = require('./extraction.js')(getFrames, true);

var WebGL = require('node-webgl'),
   Image = WebGL.Image,
   document = WebGL.document(),
   alert = console.error;

document.on("resize", function(e){
  gl.viewportWidth = e.width;
  gl.viewportHeight = e.height;
});

requestAnimationFrame = document.requestAnimationFrame;

var shaders = {
  "shaderf" : fs.readFileSync(__dirname+"/shader.frag", "utf8"),
  "shaderv" : fs.readFileSync(__dirname+"/shader.vert", "utf8")
};

var gl,
   shaderProgram,
   seamsTexture,
   extractTexture,
   seamsVertexPosBuffer,
   seamsVertexTexCoordBuffer,
   seamsVertexIndexBuffer,
   extractVertexPosBuffer,
   extractVertexTexCoordBuffer,
   extractVertexIndexBuffer;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function initGL (canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {

  } if (!gl) {
    alert("Could not initialise WebGL.");
  }
}

function getShader (gl, id) {
  var shader;
  if(nodejs) {
    if(!shaders.hasOwnProperty(id)) return null;
    var str = shaders[id];
    if(id.match(/f/)) {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (id.match(/v/)) {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else { return null; }
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders () {
  var fragShader = getShader(gl, "shaderf"),
     vertShader = getShader(gl, "shaderv");
  alert("84");
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders.");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute=
  gl.getAttribLocation(shaderProgram,"aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute=
  gl.getAttribLocation(shaderProgram,"aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform=
  gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform=
  gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform=
  gl.getUniformLocation(shaderProgram, "uSampler");
}

function initBuffers () {

  // SEAMS BUFFERS ////////////////////////////////////////////////////////////

  seamsVertexPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seamsVertexPosBuffer);
  var verts = [
     1.0,  1.0, 0.0,
     -1.0,  1.0, 0.0,
     0.0, -1.0, 1.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  seamsVertexPosBuffer.itemSize = 3;
  seamsVertexPosBuffer.numItems = 4;

  seamsVertexTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seamsVertexTexCoordBuffer);
  var texCoords = [
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  seamsVertexTexCoordBuffer.itemSize = 2;
  seamsVertexTexCoordBuffer.numItems = 4;

  seamsVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, seamsVertexIndexBuffer);
  var seamsVertexIndices = [
    0, 1, 2,
    0, 2, 3
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(seamsVertexIndices),
  gl.STATIC_DRAW);
  seamsVertexIndexBuffer.itemSize = 1;
  seamsVertexIndexBuffer.numItems = 6;

  // EXTRACT BUFFERS ///////////////////////////////////////////////////////

  extractVertexPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, extractVertexPosBuffer);
  verts = [
     1.0,  1.0, 0.0,
     -1.0,  1.0, 0.0,
     0.0, -1.0, 1.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  extractVertexPosBuffer.itemSize = 3;
  extractVertexPosBuffer.numItems = 4;

  extractVertexTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, extractVertexTexCoordBuffer);
  texCoords = [
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  extractVertexTexCoordBuffer.itemSize = 2;
  extractVertexTexCoordBuffer.numItems = 4;

  extractVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, extractVertexIndexBuffer);
  var extractVertexIndices = [
    0, 1, 2,
    0, 2, 3
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(extractVertexIndices),
  gl.STATIC_DRAW);
  extractVertexIndexBuffer.itemSize = 1;
  extractVertexIndexBuffer.numItems = 6;
}

function getFrames (seamsFrame, extractFrame){
  updateTexture(seamsTexture, seamsFrame);
  updateTexture(extractTexture, extractFrame);
}

function updateTexture (tex, frame) {
  alert("193");
  ui8frame = Uint8Array.from(frame);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA,
  gl.UNSIGNED_BYTE, ui8frame);
}

function initTextures () {
  seamsTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, seamsTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  extractTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, extractTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function drawScene () {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(pMatrix, 45, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0);
  mat4.identity(mvMatrix);

  // DRAW SEAMS ///////////////////////////////////////////////////////////////

  mat4.translate(mvMatrix, mvMatrix, [2.0, 0.0, -7.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, seamsVertexPosBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
  seamsVertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, seamsVertexTexCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
  seamsVertexTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, seamsTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, seamsVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, seamsVertexIndexBuffer.numItems);

  // DRAW EXTRACT /////////////////////////////////////////////////////////////

  mat4.translate(mvMatrix, mvMatrix, [-3.0, 0.0, 0.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, extractVertexPosBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
  extractVertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, extractVertexTexCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
  extractVertexTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, extractTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, extractVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, extractVertexIndexBuffer.numItems);

}

function tick () {
  drawScene();
  requestAnimationFrame(tick);
}

function webGLStart () {
  var canvas = document.createElement("seams-extraction-canvas");
  if(cluster.isMaster) {
    cluster.fork();
  } else {
    se.extractVerticalSeams( process.argv[2], process.argv[3],
    process.argv[4], process.argv[5], process.argv[6], process.argv[7],
    function(){
      console.log('wow, you\'re still here?');
    });
  }

  initGL(canvas);
  initShaders();
  initBuffers();
  initTextures();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

webGLStart();
