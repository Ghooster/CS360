var gl;
var color;
var animation;
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
var degree1 = 0;
var degree2 = 0;
var boatx = 0.5;
var boatdir = 1;

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() 
{
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 2.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() 
{
  fragColor = color;
}`;

function pushMatrix(stack, m)
{
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack)
{
  if (stack.length > 0) 
    return stack.pop();
  else
    console.log("stack has no matrix to pop!");
}

function degToRad(degrees)
{
  return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode)
{
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode)
{
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders()
{
  shaderProgram = gl.createProgram();
  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
  {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }
  gl.useProgram(shaderProgram);
  return shaderProgram;
}

function initGL(canvas)
{
  try
  {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch (e) { }
  if (!gl)
  {
    alert("WebGL initialization failed");
  }
}

function initSquareBuffer()
{
  const sqVertices = new Float32Array([0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,]);
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

function drawSquare(color, mMatrix)
{
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.uniform4fv(uColorLoc, color);
  switch (mode)
  {
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

function initCircleBuffer(numPoints)
{
  var circleVertices = [0, 0];
  for (var i = 0; i < numPoints; i++)
  {
    var angle = (i / numPoints) * 2 * Math.PI;
    circleVertices.push(Math.cos(angle)/2, Math.sin(angle)/2);
  }
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = numPoints+1;
  var circleIndices = [];
  for (var i = 0; i < numPoints; i++)
  {
    circleIndices.push(0, (i)%numPoints+1, (i+1)%numPoints+1);
  }
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = numPoints*3;
}

function drawCircle(color, mMatrix)
{
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.uniform4fv(uColorLoc, color);
  switch (mode)
  {
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

function initTriangleBuffer()
{
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

function drawTriangle(color, mMatrix)
{
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.uniform4fv(uColorLoc, color);
  switch (mode)
  {
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

function drawScene()
{
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  if (animation)
  {
    window.cancelAnimationFrame(animation);
  }
  var animate = function ()
  {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.identity(mMatrix);
    var funcs = [drawSky, drawSun, drawClouds, drawBirds, drawMountains, drawGround, drawTrees, drawRoad, drawRiver, drawBoat, drawWindmills, drawBushes, drawHouse, drawCar];
    for (var i = 0; i < funcs.length; i++)
    {
      pushMatrix(matrixStack, mMatrix);
      funcs[i]();
      mMatrix = popMatrix(matrixStack);
    }
    animation = window.requestAnimationFrame(animate);
  };

  animate();
}

function drawSky()
{
  color = [128/255, 202/255, 250/255, 1];
  mMatrix = mat4.translate(mMatrix, [0,0.5,0]);
  mMatrix = mat4.scale(mMatrix, [2,1,1]);
  drawSquare(color, mMatrix);
}

function drawSun()
{
  degree1 += 0.2;
  mMatrix = mat4.translate(mMatrix, [-0.7,0.8,0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [0, 0, 1]);
  color = [251/255, 230/255, 77/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.225,0.225,1]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  for (var i = 0; i < 8; i++)
    {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.rotate(mMatrix, degToRad(45*i + degree1), [0, 0, 1]);
      mMatrix = mat4.translate(mMatrix, [0,-0.08,0]);
      mMatrix = mat4.scale(mMatrix, [0.0075, 0.16, 1]);
      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
    }
  mMatrix = popMatrix(matrixStack);
}

function drawClouds()
{
  color = [1, 1, 1, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.85,0.55,0]);
  mMatrix = mat4.scale(mMatrix, [0.4,0.22,1]);
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.65,0.52,0]);
  mMatrix = mat4.scale(mMatrix, [0.3,0.18,1]);
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.45,0.52,0]);
  mMatrix = mat4.scale(mMatrix, [0.2,0.12,1]);
  drawCircle(color, mMatrix);
  mMatrix =  popMatrix(matrixStack);
}

function drawBirds()
{
  color = [0,0,0,1]
  var locs = [[0.08,0.65,0], [0.3,0.8,0], [-0.2,0.7,0], [-0.05,0.775,0], [0.05,0.825,0]];
  var scales = [[0.15,0.2,1], [0.1,0.15,1], [0.1,0.15,1], [0.08,0.11,1], [0.06,0.09,1]];
  var scales = [[0.175,0.175,1], [0.1,0.1,1], [0.1,0.1,1], [0.075,0.075,1], [0.05,0.05,1]];
  for (var i = 0; i < 5; i++)
  {
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, locs[i]);
    mMatrix = mat4.scale(mMatrix, scales[i]);
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

  
}

function drawMountains()
{
  var locs = [[-0.75,0,0], [-0.06,0,0]];
  var scales = [[1.4,0.35,1], [1.8,0.55,1]];
  for (var i = 0; i < 2; i++) {
    color = [123/255, 94/255, 70/255, 1]
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, locs[i]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, scales[i]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [145/255, 121/255, 87/255, 1]
    mMatrix = mat4.translate(mMatrix, [0,0.5*scales[i][1],0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(10), [0, 0, 1]);
    mMatrix = mat4.translate(mMatrix, [0,-0.5*scales[i][1],0]);
    mMatrix = mat4.scale(mMatrix, scales[i]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
  }

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.8,0,0]);
  mMatrix = mat4.scale(mMatrix, [1.2,0.3,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawGround()
{
  color = [104/255, 226/255, 138/255, 1];
  mMatrix = mat4.translate(mMatrix, [0,-0.5,0]);
  mMatrix = mat4.scale(mMatrix, [2,1,1]);
  drawSquare(color, mMatrix);
}

function drawTrees()
{
  var sizes = [[0.79,0.39,0], [0.5,0.455,0], [0.2,0.34,0]];
  var locs = [[1.142,1.142,1], [1.333,1.333,1], [1,1,1]];
  for (var i = 0; i < 3; i++) {
    color = [121/255, 79/255, 78/255, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, sizes[i]);
    mMatrix = mat4.scale(mMatrix, locs[i]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.04,0.24,1]);
    mMatrix = mat4.translate(mMatrix, [0,-0.95,0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [67/255, 151/255, 81/255, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.31,0.26,1]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [105/255, 177/255, 90/255, 1];
    mMatrix = mat4.scale(mMatrix, [0.34, 0.26, 1]);
    mMatrix = mat4.translate(mMatrix, [0,0.125,0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [128/255, 202/255, 95/255, 1];
    mMatrix = mat4.scale(mMatrix, [0.37, 0.26, 1]);
    mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
  }
}

function drawRoad()
{
  color = [120/255, 177/255, 72/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(50),[0,0,1]);
  mMatrix = mat4.translate(mMatrix, [-0.3, -0.9, 0])
  mMatrix = mat4.scale(mMatrix, [2,2,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawRiver()
{
  color = [42/255, 100/255, 246/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.135,0]);
  mMatrix = mat4.scale(mMatrix, [2,0.2,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [119/255, 160/255, 237/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.7,-0.135,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.007,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.0875,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.007,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.7,-0.2,0]);
  mMatrix = mat4.scale(mMatrix, [0.35,0.007,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawBoat()
{
  if(boatx > 0.8 || boatx < -0.8)
    boatdir *= -1;
  boatx += 0.002*boatdir;
  mMatrix = mat4.translate(mMatrix, [boatx,-0.075,0]);
  mMatrix = mat4.scale(mMatrix, [0.25,0.25,1]);
  color = [212/255,88/255,37/255,1]
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.165, 0.45, 0])
  mMatrix = mat4.rotate(mMatrix, degToRad(30),[0,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.8,0.7,1])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

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

  color = [204/225,204/225,204/225,1]
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.8,0.2,1])
  mMatrix = mat4.translate(mMatrix, [0, -1, 1])
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(180),[1,0,0]);
  mMatrix = mat4.scale(mMatrix, [0.165,0.2,0.2])
  mMatrix = mat4.translate(mMatrix, [2.5, 1, 0])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(180),[1,0,0]);
  mMatrix = mat4.scale(mMatrix, [0.165,0.2,0.2])
  mMatrix = mat4.translate(mMatrix, [-2.5, 1, 0])
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawWindmills()
{
  degree2 += 2;
  var locs = [[0.6,-0.22,0], [-0.5,-0.22,0]];
  for (var j = 0; j < 2; j++)
  {
    color = [51/255, 51/255, 51/255, 1];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, locs[j]);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.025,0.5,1]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [179/255, 179/255, 57/255, 1];
    for (var i = 0; i < 4; i++)
    {
      pushMatrix(matrixStack, mMatrix);
      mMatrix = mat4.translate(mMatrix, [0,0.25,0]);
      mMatrix = mat4.rotate(mMatrix, degToRad(90*i + degree2), [0, 0, 1]);
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
  }
}

function drawBushes()
{
}

function drawHouse()
{
  color = [236/255, 91/255, 41/255, 1];
  mMatrix = mat4.translate(mMatrix, [-0.6,-0.3,0]);
  mMatrix = mat4.scale(mMatrix, [0.45,0.45,1]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [1,0.5,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.5,0.5,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.5,0.5,1]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  color = [229/255, 229/255, 229/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.5,1]);
  mMatrix = mat4.scale(mMatrix, [1.2,0.5,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  color = [221/255, 181/255, 61/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0,-0.575,1]);
  mMatrix = mat4.scale(mMatrix, [0.15,0.35,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.4,-0.4,1]);
  mMatrix = mat4.scale(mMatrix, [0.15,0.15,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.4,-0.4,1]);
  mMatrix = mat4.scale(mMatrix, [0.15,0.15,1]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawCar()
{
  color = [191/255, 107/255, 83/255, 1];
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.52,-0.74,0]);
  mMatrix = mat4.scale(mMatrix, [0.225,0.175,1]);
  drawSquare(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.5,0,0]);
  drawTriangle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [1,0,0]);
  drawTriangle(color, mMatrix);
  color = [0, 0, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.05,-0.7,0]);
  mMatrix = mat4.scale(mMatrix, [0.5*0.175/0.225,0.5*0.175/0.175,1]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-3,0,0]);
  drawCircle(color, mMatrix);
  color = [0.5, 0.5, 0.5, 1];
  mMatrix = mat4.scale(mMatrix, [0.8,0.8,1]);
  drawCircle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [3.75,0,0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  color = [55/255, 126/255, 222/255, 1];
  mMatrix = mat4.translate(mMatrix, [-0.52,-0.8,0]);
  mMatrix = mat4.scale(mMatrix, [0.45,0.1,1]);
  drawSquare(color, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.25,1,1]);
  mMatrix = mat4.translate(mMatrix, [2,0,0]);
  drawTriangle(color, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-4,0,0]);
  drawTriangle(color, mMatrix);
}

function webGLStart()
{
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

function mode_fun(m)
{
  mode = m;
  drawScene();
}