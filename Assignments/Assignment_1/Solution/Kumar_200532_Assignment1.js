var gl;
var color;
var animation;
var degree0 = 0;
var degree1 = 0;
var matrixStack = [];
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;
var circleBuf;
var circleIndexBuf;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;

var mode = 0;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 2.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;

function pushMatrix(stack, m) {
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();
  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }
  gl.useProgram(shaderProgram);
  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) { }
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer() {
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.uniform4fv(uColorLoc, color);
  switch (mode) {
    case 0:
      gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 1:
      gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 2:
      gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    default:
      console.log("invalid mode");
  }
}

function initCircleBuffer(numPoints) {
  var circleVertices = [0, 0];
  for (var i = 0; i < numPoints; i++) {
    var angle = (i / numPoints) * 2 * Math.PI;
    circleVertices.push(Math.cos(angle)/2, Math.sin(angle)/2);
  }
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = numPoints+1;
  var circleIndices = [];
  for (var i = 0; i < numPoints; i++) {
    circleIndices.push(0, (i)%numPoints+1, (i+1)%numPoints+1);
  }
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = numPoints*3;
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.uniform4fv(uColorLoc, color);
  switch (mode) {
    case 0:
      gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 1:
      gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 2:
      gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    default:
      console.log("invalid mode");
  }
}

function initTriangleBuffer() {
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.uniform4fv(uColorLoc, color);
  switch (mode) {
    case 0:
      gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 1:
      gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    case 2:
      gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
      break;
    default:
      console.log("invalid mode");
  }
}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  if (animation) {
    window.cancelAnimationFrame(animation);
  }
  var animate = function () {
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.identity(mMatrix);
    // degree0 += 3;
    // degree1 -= 3;
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    color = [0.0, 0.0, 0.0, 1];
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.3, 0.75, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0.0, 0.0, 1.0]);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.0, 0.0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.0, 0.0]);
    mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 1.0]);
    color = [0.4, 0.9, 0, 1];
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
    animation = window.requestAnimationFrame(animate);
  };

  animate();
}

function webGLStart() {
  var canvas = document.getElementById("Assignment1");
  initGL(canvas);
  shaderProgram = initShaders();
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer(50);
  drawScene();
}

function mode_fun(m) {
  mode = m;
  drawScene();
}