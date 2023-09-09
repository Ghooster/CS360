////////////////////////////////////////////////////////////////////////
//  A simple WebGL program to draw a 3D cube wirh basic interaction.
//

var gl;
var canvas;

var buf;
var indexBuf;
var aPositionLocation;
var uColorLocation;
var uPMatrixLocation;
var uMMatrixLocation;
var uVMatrixLocation;

var degree1 = 0.0;
var degree0 = 0.0;
var prevMouseX = 0.0;
var prevMouseY = 0.0;

// initialize model, view, and projection matrices
var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix

// specify camera/eye coordinate system parameters
var eyePos = [0.0, 0.0, 2.0];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

// Vertex shader code
const vertexShaderCode = `#version 300 es
in vec3 aPosition;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

void main() {
  mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize=5.0;
}`;

// Fragment shader code
const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 objColor;

void main() {
  fragColor = objColor;
}`;

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

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function initCubeBuffer() {
  var vertices = [
    // Front face
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    // Top face
    -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Bottom face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // Right face
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    // Left face
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
  ];
  buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  buf.itemSize = 3;
  buf.numItems = vertices.length / 3;

  var indices = [
    0,
    1,
    2,
    0,
    2,
    3, // Front face
    4,
    5,
    6,
    4,
    6,
    7, // Back face
    8,
    9,
    10,
    8,
    10,
    11, // Top face
    12,
    13,
    14,
    12,
    14,
    15, // Bottom face
    16,
    17,
    18,
    16,
    18,
    19, // Right face
    20,
    21,
    22,
    20,
    22,
    23, // Left face
  ];
  indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  indexBuf.itemSize = 1;
  indexBuf.numItems = indices.length;
}

function drawCube(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

  gl.uniform4fv(uColorLocation, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}


function initSphere(nslices, nstacks, radius)
{
    for (var i = 0; i <= nslices; i++)
    {
        var angle = (i * Math.PI) / nslices;
        var comp1 = Math.sin(angle);
        var comp2 = Math.cos(angle);
        for (var j = 0; j <= nstacks; j++)
        {
            var phi = (j * 2 * Math.PI) / nstacks;
            var comp3 = Math.sin(phi);
            var comp4 = Math.cos(phi);
            var xcood = comp4 * comp1;
            var ycoord = comp2;
            var zcoord = comp3 * comp1;
            spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
            spNormals.push(xcood, ycoord, zcoord);
        }
    }
    for (var i = 0; i < nslices; i++)
    {
        for (var j = 0; j < nstacks; j++)
        {
            var id1 = i * (nstacks + 1) + j;
            var id2 = id1 + nstacks + 1;
            spIndicies.push(id1, id2, id1 + 1);
            spIndicies.push(id2, id2 + 1, id1 + 1);
        }
    }
}
  
function initSphereBuffer()
{
    var nslices = 20;
    var nstacks = 20;
    var radius = 1;
    initSphere(nslices, nstacks, radius);
    spBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
    spBuf.itemSize = 3;
    spBuf.numItems = spVerts.length / 3;
    spIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(spIndicies), gl.STATIC_DRAW);
    spIndexBuf.itemsize = 1;
    spIndexBuf.numItems = spIndicies.length;
    spNormalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
    spNormalBuf.itemSize = 3;
    spNormalBuf.numItems = spNormals.length / 3;
}

function drawSphere(color, mMatrix)
{
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
    gl.vertexAttribPointer(aPositionLocation, spBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
    gl.uniform4fv(uColorLocation, color);
    // switch (mode)
    // {
        // case 0:
            gl.uniform4fv(uColorLocation, color);
            gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
            gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
            gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
            gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            // break;
        // case 1:
            // gl.drawElements(gl.LINE_LOOP, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            // break;
        // case 2:
            // gl.drawElements(gl.POINTS, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            // break;
        // default:
            // console.log("invalid mode");
    // }
}

var matrixStack = [];

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

function drawSceneL()
{
    gl.clearColor(211/255, 211/255, 238/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // mat4.identity(mMatrix);

    pushMatrix(matrixStack, mMatrix);
    color = [0/255, 112/255, 163/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    drawSphere(color, mMatrix);

    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [165/255, 166/255, 111/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.25, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 1, 0.5]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawSceneM()
{
    gl.clearColor(238/255, 211/255, 210/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // mat4.identity(mMatrix);

    pushMatrix(matrixStack, mMatrix);
    color = [150/255, 150/255, 150/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(-30), [0, 0, 1]);
    mMatrix = mat4.translate(mMatrix, [-0.4, -0.25, 0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0/255, 120/255, 0/255, 1];
    mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [150/255, 150/255, 150/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
    mMatrix = mat4.rotate(mMatrix, degToRad(30), [0, 0, 1]);
    mMatrix = mat4.translate(mMatrix, [0.785, 1, 0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0/255, 120/255, 0/255, 1];
    mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [150/255, 150/255, 150/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);
}

function drawSceneR()
{
    gl.clearColor(211/255, 238/255, 212/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // mat4.identity(mMatrix);

    // Upper cube
    pushMatrix(matrixStack, mMatrix);
    color = [148/255, 50/255, 18/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 1]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Upper right sphere
    pushMatrix(matrixStack, mMatrix);
    color = [188/255, 130/255, 40/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.5, 0.225, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Upper left sphere
    pushMatrix(matrixStack, mMatrix);
    color = [201/255, 0/255, 201/255, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, 0.225, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Lower cube
    pushMatrix(matrixStack, mMatrix);
    color = [148/255, 50/255, 18/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 1]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Lower right sphere
    pushMatrix(matrixStack, mMatrix);
    color = [32/255, 106/255, 125/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.5, -0.225, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Lower left sphere
    pushMatrix(matrixStack, mMatrix);
    color = [86/255, 86/255, 185/255, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.225, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Middle left cube
    pushMatrix(matrixStack, mMatrix);
    color = [40/255, 148/255, 115/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.5, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.05, 1]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Middle left cube
    pushMatrix(matrixStack, mMatrix);
    color = [147/255, 146/255, 1/255, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.05, 1]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Top sphere
    pushMatrix(matrixStack, mMatrix);
    color = [155/255, 155/255, 200/255, 1];
    mMatrix = mat4.translate(mMatrix, [0, 0.725, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Bottom sphere
    pushMatrix(matrixStack, mMatrix);
    color = [1/255, 186/255, 32/255, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.725, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

}

//////////////////////////////////////////////////////////////////////
//Main drawing routine
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearColor(0.9, 0.9, 0.95, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(degree1), [1, 0, 0]);

  // Now draw the cube
  var color = [0.5, 0, 0, 1]; // specify color for the cube
  // drawCube(color);
  drawSceneM();
}

function onMouseDown(event) {
  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  document.addEventListener("mouseout", onMouseOut, false);

  if (
    event.layerX <= canvas.width &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    prevMouseX = event.clientX;
    prevMouseY = canvas.height - event.clientY;
  }
}

function onMouseMove(event) {
  // make mouse interaction only within canvas
  if (
    event.layerX <= canvas.width &&
    event.layerX >= 0 &&
    event.layerY <= canvas.height &&
    event.layerY >= 0
  ) {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    degree0 = degree0 + diffX1 / 5;

    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    degree1 = degree1 - diffY2 / 5;

    drawScene();
  }
}

function onMouseUp(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

function onMouseOut(event) {
  document.removeEventListener("mousemove", onMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("simple3DCubeRender");
  document.addEventListener("mousedown", onMouseDown, false);

  // initialize WebGL
  initGL(canvas);

  // initialize shader program
  shaderProgram = initShaders();

  //get locations of attributes and uniforms declared in the shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uColorLocation = gl.getUniformLocation(shaderProgram, "objColor");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  //initialize buffers for the square
  initCubeBuffer();
  initSphereBuffer();
  gl.enable(gl.DEPTH_TEST);
  drawScene();
}
