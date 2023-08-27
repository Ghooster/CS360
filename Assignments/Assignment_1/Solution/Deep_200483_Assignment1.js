////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes with animation.
//

var gl;
var color;
var animation;
var degree0 = 0;
var sunRot = 0;
var windRot = 0;
var boat = 0.5;
var side = 1;
var matrixStack = [];

// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;

var circleBuf;
var circleIndexBuf;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;

var view = 2;

function choose_view(v) {
  view = v;
  drawScene();
}

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 5.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;

function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
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
  // Error check whether the shader is compiled correctly
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
  // Error check whether the shader is compiled correctly
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

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if(view == 0)
  {
    gl.drawElements(
      gl.POINTS,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 1)
  {
    gl.drawElements(
      gl.LINE_LOOP,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 2)
  {
    gl.drawElements(
      gl.TRIANGLES,
      sqVertexIndexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else
  {
    console.log("Invalid view");
  }
}

function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    triangleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if(view == 0)
  {
    gl.drawElements(
      gl.POINTS,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 1)
  {
    gl.drawElements(
      gl.LINE_LOOP,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 2)
  {
    gl.drawElements(
      gl.TRIANGLES,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else
  {
    console.log("Invalid view");
  }
}

function initCircleBuffer(resolution) {
  // buffer for point locations
  var circleVertices = [];
  for (var i = 0; i < resolution; i++) {
    var theta = (i / resolution) * 2 * Math.PI;
    circleVertices.push(Math.cos(theta)/2, Math.sin(theta)/2);
  }
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = resolution;

  // buffer for point indices
  var circleIndices = [];
  for (var i = 0; i < resolution; i++) {
    circleIndices.push(0, i%resolution, (i+1)%resolution+1);
  }
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = resolution*3;
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    circleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  if(view == 0)
  {
    gl.drawElements(
      gl.POINTS,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 1)
  {
    gl.drawElements(
      gl.LINE_LOOP,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if(view == 2)
  {
    gl.drawElements(
      gl.TRIANGLES,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else
  {
    console.log("Invalid view");
  }
}


////////////////////////////////////////////////////////////////////////
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  if (animation) {
    window.cancelAnimationFrame(animation);
  }
  var animate = function () {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    paintSky();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintSun();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintCloud();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintCrow();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintHill();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintGrass();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintTrees();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintRoad();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintStream();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintBoat();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintMills();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    drawBushes();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    paintHouse();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    drawCar();
    mMatrix = popMatrix(matrixStack);
    animation = window.requestAnimationFrame(animate);
  };

  animate();
}

function paintSky() {
  var color = [90/255, 196/255, 254/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,0.5,0]); // Half of the height of the canvas
  mMatrix = mat4.scale(mMatrix, [2,1,1]); // Double the width of the canvas
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function paintSun() {
  mMatrix = mat4.translate(mMatrix, [-0.7,0.8,0]);
  sunRot += 0.8;
  mMatrix = mat4.rotate(mMatrix, degToRad(sunRot), [0, 0, 1]); // Global rotation around z-axis
  var color = [253/255, 224/255, 1/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.23,0.23,1]); //Scale the sun separately
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  // color = [0/255, 0/255, 0/255, 1];
  for (var i = 0; i < 8; i++) {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.rotate(mMatrix, degToRad(45*i), [0, 0, 1]);
      mMatrix = mat4.translate(mMatrix, [0,-0.075,0]);
      mMatrix = mat4.scale(mMatrix, [0.0075, 0.1625, 1]);
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
  mMatrix = popMatrix(matrixStack);
}

function paintHill() {

  var color = [139/255, 108/255, 72/255, 1];
  // Rightmost mountain
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.775,0,0]);
  mMatrix = mat4.scale(mMatrix, [1.25,0.3,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  color = [117/255, 80/255, 57/255, 1];
  // Leftmost mountain
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.75,0,0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [1.5,0.35,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [139/255, 108/255, 72/255, 1]
  mMatrix = mat4.translate(mMatrix, [0,0.5*0.35,0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  mMatrix = mat4.translate(mMatrix, [0,-0.5*0.35,0]);
  mMatrix = mat4.scale(mMatrix, [1.4,0.35,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  color = [117/255, 80/255, 57/255, 1];
  // Middle mountain
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.1,0,0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [1.8,0.55,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [139/255, 108/255, 72/255, 1]
  mMatrix = mat4.translate(mMatrix, [0,0.5*0.55,0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
  mMatrix = mat4.translate(mMatrix, [0,-0.5*0.55,0]);
  mMatrix = mat4.scale(mMatrix, [1.8,0.55,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
}


function paintBoat() {
  boat += 0.003*side;
  mMatrix = mat4.translate(mMatrix, [boat,-0.07,0]);
  mMatrix = mat4.scale(mMatrix, [0.25,0.25,1]);
  color = [0,0,0,1]
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.03,1.125,1])
  mMatrix = mat4.translate(mMatrix, [0, 0.25, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.23, 0.29, 0])
  mMatrix = mat4.rotate(mMatrix, degToRad(-25),[0,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.015,1,1])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [174/225,174/225,174/225,1]
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.8,0.2,1])
  mMatrix = mat4.translate(mMatrix, [0, -1, 1])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(180),[1,0,0]);
  mMatrix = mat4.scale(mMatrix, [0.165,0.2,0.2])
  mMatrix = mat4.translate(mMatrix, [-2.5, 1, 0])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(180),[1,0,0]);
  mMatrix = mat4.scale(mMatrix, [0.17,0.2,0.2])
  mMatrix = mat4.translate(mMatrix, [2.5, 1, 0])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [225/255,67/255,0/255,1]
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.19, 0.45, 0])
  mMatrix = mat4.rotate(mMatrix, degToRad(30),[0,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.8,0.7,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  if(boat > 0.8 || boat < -0.8) {
    side *= -1;
  }
}

function paintMills() {
    color = [75/255, 75/255, 75/255, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.625,-0.225,0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.025,0.5,1]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [152/255, 152/255, 47/255, 1];
    for (var i = 0; i < 4; i++)
    {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
      mMatrix = mat4.rotate(mMatrix, degToRad(90*i + windRot), [0, 0, 1]);
      mMatrix = mat4.translate(mMatrix, [0,-0.225,0]);
      mMatrix = mat4.translate(mMatrix, [0,0.125,0]);
      mMatrix = mat4.scale(mMatrix, [0.075,0.225,1]);
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    color = [0, 0, 0, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
    mMatrix = mat4.scale(mMatrix, [0.05,0.05,1]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
    color = [75/255, 75/255, 75/255, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.5,-0.22,0]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.025,0.5,1]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [152/255, 152/255, 47/255, 1];
    for (var i = 0; i < 4; i++)
    {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
      mMatrix = mat4.rotate(mMatrix, degToRad(90*i + windRot), [0, 0, 1]);
      mMatrix = mat4.translate(mMatrix, [0,-0.225,0]);
      mMatrix = mat4.translate(mMatrix, [0,0.125,0]);
      mMatrix = mat4.scale(mMatrix, [0.075,0.225,1]);
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
    
    color = [0, 0, 0, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
    mMatrix = mat4.scale(mMatrix, [0.05,0.05,1]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
  windRot += 1.5;
}

function paintGrass() {
  var color = [0/255, 224/255, 116/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.5,0]); //Again half of the height of the canvas
  mMatrix = mat4.scale(mMatrix, [2,1,1]); //Again half the width of the canvas
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function paintTrees() {
  var color = [116/255, 68/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.79,0.39,0]);
  mMatrix = mat4.scale(mMatrix, [1.142,1.142,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.04,0.24,1]);
  mMatrix = mat4.translate(mMatrix, [0,-0.95,0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [0/255, 141/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.31,0.26,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [66/255, 169/255, 66/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.34, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.1,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [90/255, 195/255, 67/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.37, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.2,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  color = [121/255, 79/255, 78/255, 1];
  color = [116/255, 68/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5,0.455,0]);
  mMatrix = mat4.scale(mMatrix, [1.333,1.333,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.04,0.24,1]);
  mMatrix = mat4.translate(mMatrix, [0,-0.95,0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [67/255, 151/255, 81/255, 1];
  color = [0/255, 141/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.31,0.26,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [105/255, 177/255, 90/255, 1];
  color = [66/255, 169/255, 66/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.34, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.1,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [128/255, 202/255, 95/255, 1];
  color = [90/255, 195/255, 67/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.37, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.2,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  color = [121/255, 79/255, 78/255, 1];
  color = [116/255, 68/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.2,0.34,0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.04,0.24,1]);
  mMatrix = mat4.translate(mMatrix, [0,-0.95,0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [67/255, 151/255, 81/255, 1];
  color = [0/255, 141/255, 68/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.31,0.26,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [105/255, 177/255, 90/255, 1];
  color = [66/255, 169/255, 66/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.34, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.1,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [128/255, 202/255, 95/255, 1];
  color = [90/255, 195/255, 67/255, 1];
  mMatrix = mat4.scale(mMatrix, [0.37, 0.26, 1]);
  mMatrix = mat4.translate(mMatrix, [0,0.2,0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
}

function paintCloud() {
  var color = [255/255, 255/255, 255/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.85,0.55,0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.4,-0.03,0]); //Rightmost cloud
  mMatrix = mat4.scale(mMatrix, [0.2,0.12,1]);
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.4,0.22,1]); //Leftmost cloud
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.2,-0.03,0]); //Middle cloud
  mMatrix = mat4.scale(mMatrix, [0.3,0.18,1]);
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
  mMatrix =  popMatrix(matrixStack);
}


function drawBushes()
{
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.12,-1,0]);
    mMatrix = mat4.scale(mMatrix, [1.1,0.7,1]);
    color = [42/255, 100/255, 25/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2,-0.035,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [80/255, 176/255, 51/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.2,-0.025,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [67/255, 151/255, 42/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.4,0.25,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    mMatrix =  popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.97,-0.47,0]);
    mMatrix = mat4.scale(mMatrix, [0.7,0.65,1]);
    color = [42/255, 100/255, 25/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2,-0.035,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [80/255, 176/255, 51/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.2,-0.025,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [67/255, 151/255, 42/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.4,0.25,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    mMatrix =  popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.92,-0.6,0]);
    mMatrix = mat4.scale(mMatrix, [0.4,0.4,1]);
    color = [42/255, 100/255, 25/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2,-0.035,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [80/255, 176/255, 51/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.2,-0.025,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [67/255, 151/255, 42/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.4,0.25,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    mMatrix =  popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.24,-0.6,0]);
    mMatrix = mat4.scale(mMatrix, [0.55,0.54,1]);
    color = [42/255, 100/255, 25/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2,-0.035,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [80/255, 176/255, 51/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.2,-0.025,0]);
    mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    color = [67/255, 151/255, 42/255,1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.4,0.25,1]);
    drawCircle(color, mMatrix);
    mMatrix =  popMatrix(matrixStack);
    mMatrix =  popMatrix(matrixStack);
}

function paintHouse()
{
  color = [237/255, 99/255, 39/255, 1];
  mMatrix = mat4.translate(mMatrix, [-6/10,-3/10,0]);
  mMatrix = mat4.scale(mMatrix, [45/100,45/100,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [10/10,5/10,10/10]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [5/10,0,10/10]);
  mMatrix = mat4.scale(mMatrix, [5/10,5/10,10/10]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-5/10,0/10,10/10]);
  mMatrix = mat4.scale(mMatrix, [5/10,5/10,10/10]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);


  color = [228/255, 228/255, 228/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-5/10,1]);
  mMatrix = mat4.scale(mMatrix, [12/10,5/10,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  color = [219/255, 183/255, 59/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-4/10,-4/10,1]);
  mMatrix = mat4.scale(mMatrix, [15/100,15/100,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [4/10,-4/10,1]);
  mMatrix = mat4.scale(mMatrix, [15/100,15/100,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.575,1]);
  mMatrix = mat4.scale(mMatrix, [15/100,35/100,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
}

function paintCrow() {
  var color = [0,0,0,1]

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.05,0.775,0]);
  mMatrix = mat4.scale(mMatrix, [0.075,0.075,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.075,0.1,1])
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.05,0.825,0]);
  mMatrix = mat4.scale(mMatrix, [0.045,0.045,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.075,0.1,1])
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.08,0.65,0]);
  mMatrix = mat4.scale(mMatrix, [0.18,0.18,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.075,0.1,1])
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.2,0.7,0]);
  mMatrix = mat4.scale(mMatrix, [0.125,0.125,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.075,0.1,1])
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.35,0.8,0]);
  mMatrix = mat4.scale(mMatrix, [0.125,0.125,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.075,0.1,1])
  mMatrix = mat4.translate(mMatrix, [0, -0.4, 0])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-10),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.25, 0.025, 0])
  mMatrix = mat4.scale(mMatrix, [0.5,0.05,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
}

function paintRoad() {
  color = [91/255, 168/255, 44/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(47.5),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.29, -0.85, 0])
  mMatrix = mat4.scale(mMatrix, [2,2,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function paintStream() {
  var color = [0/255, 90/255, 254/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.135,0]);
  mMatrix = mat4.scale(mMatrix, [2,0.2,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [136/255, 193/255, 249/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.7,-0.135,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.005,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.09,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.005,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.7,-0.2,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.005,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}



function drawCar()
{
  // top
  color = [192/255, 106/255, 84/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.53,-0.75,0]);
  mMatrix = mat4.scale(mMatrix, [0.224,0.174,1]);
  drawSquare(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.51,0,0]);
  drawTriangle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [1,0,0]);
  drawTriangle(color, mMatrix);
  // tyre outer
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.051,-0.71,0]);
  mMatrix = mat4.scale(mMatrix, [0.3889,0.5,1]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-3,0,0]);
  drawCircle(color, mMatrix);
// tyre inner
  color = [1/2, 1/2, 1/2, 1];
  mMatrix = mat4.scale(mMatrix, [8/10,8/10,1]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [375/100,0,0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  // core
  color = [56/255, 127/255, 224/255, 1];
  mMatrix = mat4.translate(mMatrix, [-0.53,-0.8,0]);
  mMatrix = mat4.scale(mMatrix, [45/100,10/100,100/100]);
  drawSquare(color, mMatrix);
  mMatrix = mat4.scale(mMatrix, [25/100,100/100,100/100]);
  mMatrix = mat4.translate(mMatrix, [-2,0,0]);
  drawTriangle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [4,0,0]);
  drawTriangle(color, mMatrix);
  
}

function webGLStart() {
  var canvas = document.getElementById("myCanvas");
  initGL(canvas);
  shaderProgram = initShaders();
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer(100);
  drawScene();
}