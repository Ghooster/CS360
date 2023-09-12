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

// New variables
var canvas;

var vMatrix = mat4.create();
var pMatrix = mat4.create();

var uPMatrixLocation;
var uVMatrixLocation;

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;

var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

//Eye position with positive y to view top initially
var eyePos = [0.0, 0.6, 2.5];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

//Initializing degrees to start vals
var sceneAdegree1 = 0.0;
var sceneAdegree0 = 30.0;
var sceneBdegree1 = 0.0;
var sceneBdegree0 = -15.0;
var sceneCdegree1 = 0.0;
var sceneCdegree0 = 30.0;
var sceneAprevMouseX = 0.0;
var sceneAprevMouseX = 0.0;
var sceneBprevMouseX = 0.0;
var sceneBprevMouseX = 0.0;
var sceneCprevMouseX = 0.0;
var sceneCprevMouseX = 0.0;

var lightPos = [-20, -20, -10];

function choose_view(v) {
  view = v;
  drawScene();
}

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

const sceneAVertexShaderCode = `#version 300 es
in vec3 aPosition;
out vec3 vPosition;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

void main() 
{
    mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
    gl_Position = projectionModelView*vec4(aPosition,1.0);
    gl_PointSize = 2.0;
    vPosition = vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0));
}`;

const sceneAFragmentShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;
in vec3 vPosition;
uniform vec3 lightPos;


void main() 
{
    vec3 Normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
    vec3 Light = normalize(-lightPos);
    vec3 Reflect = normalize(-reflect(Light,Normal));
    vec3 View = normalize(-vPosition);
    vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
    // Ambient = vec4(0.0,0.0,0.0,0.0);
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    // Diffuse = vec4(0.0,0.0,0.0,0.0);
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    // Specular = vec4(0.0,0.0,0.0,1.0);
    fragColor = vec4(Ambient+Diffuse+Specular);
    fragColor.a = color.a;
    
}`;

const sceneBVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
out vec4 vColor;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform vec3 lightPos;
uniform vec4 color;

void main() 
{
    mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
    gl_Position = projectionModelView*vec4(aPosition,1.0);
    gl_PointSize = 2.0;
    vec3 vPosition = vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0));
    vec3 Normal = normalize(mat3(transpose(inverse(uVMatrix*uMMatrix)))*aNormal);
    vec3 Light = normalize(-vec3(uVMatrix*vec4(lightPos,1.0)));
    vec3 Reflect = normalize(-reflect(Light,Normal));
    vec3 View = normalize(-vPosition);
    vec4 Ambient = 0.5*color;
    // Ambient = vec4(0.0,0.0,0.0,0.0);
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    // Diffuse = vec4(0.0,0.0,0.0,0.0);
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    // Specular = vec4(0.0,0.0,0.0,1.0);
    vColor = Ambient+Diffuse+Specular;
    vColor.a = color.a;
    
}`;

const sceneBFragmentShaderCode = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fragColor;

void main() 
{
    fragColor = vColor+0.1;
}`;

const sceneCVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
out vec3 vPosition;
out vec3 vNormal;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

void main() 
{
    mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
    gl_Position = projectionModelView*vec4(aPosition,1.0);
    gl_PointSize = 2.0;
    vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
    vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
}`;

const sceneCFragmentShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;
in vec3 vPosition;
in vec3 vNormal;
uniform vec3 lightPos;


void main() 
{
    vec3 Normal = normalize(vNormal);
    vec3 Light = normalize(-lightPos);
    vec3 Reflect = normalize(-reflect(Light,Normal));
    vec3 View = normalize(-vPosition);
    vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
    // // Ambient = vec4(0.0,0.0,0.0,0.0);
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    // // Diffuse = vec4(0.0,0.0,0.0,0.0);
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    // // Specular = vec4(0.0,0.0,0.0,1.0);
    fragColor = vec4(Ambient+Diffuse+Specular);
    fragColor.a = color.a;
    
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

function initShaders(vertexShaderCode, fragShaderCode) {
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


function initSphere(nslices, nstacks, radius) {
    var theta1, theta2;
  
    for (i = 0; i < nslices; i++) {
      spVerts.push(0);
      spVerts.push(-radius);
      spVerts.push(0);
  
      spNormals.push(0);
      spNormals.push(-1.0);
      spNormals.push(0);
    }
  
    for (j = 1; j < nstacks - 1; j++) {
      theta1 = (j * 2 * Math.PI) / nslices - Math.PI / 2;
      for (i = 0; i < nslices; i++) {
        theta2 = (i * 2 * Math.PI) / nslices;
        spVerts.push(radius * Math.cos(theta1) * Math.cos(theta2));
        spVerts.push(radius * Math.sin(theta1));
        spVerts.push(radius * Math.cos(theta1) * Math.sin(theta2));
  
        spNormals.push(Math.cos(theta1) * Math.cos(theta2));
        spNormals.push(Math.sin(theta1));
        spNormals.push(Math.cos(theta1) * Math.sin(theta2));
      }
    }
  
    for (i = 0; i < nslices; i++) {
      spVerts.push(0);
      spVerts.push(radius);
      spVerts.push(0);
  
      spNormals.push(0);
      spNormals.push(1.0);
      spNormals.push(0);
    }
  
    // setup the connectivity and indices
    for (j = 0; j < nstacks - 1; j++)
      for (i = 0; i <= nslices; i++) {
        var mi = i % nslices;
        var mi2 = (i + 1) % nslices;
        var idx = (j + 1) * nslices + mi;
        var idx2 = j * nslices + mi;
        var idx3 = j * nslices + mi2;
        var idx4 = (j + 1) * nslices + mi;
        var idx5 = j * nslices + mi2;
        var idx6 = (j + 1) * nslices + mi2;
  
        spIndicies.push(idx);
        spIndicies.push(idx2);
        spIndicies.push(idx3);
        spIndicies.push(idx4);
        spIndicies.push(idx5);
        spIndicies.push(idx6);
      }
}
  
function initSphereBuffer() {
  var nslices = 30; // use even number
  var nstacks = nslices / 2 + 1;
  var radius = 1.0;
  initSphere(nslices, nstacks, radius);
  
  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = nslices * nstacks;
  
  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = nslices * nstacks;
  
  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = (nstacks - 1) * 6 * (nslices + 1);
}
  
  
  
  
// Cube generation function with normals
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
    cubeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeBuf.itemSize = 3;
    cubeBuf.numItems = vertices.length / 3;
  
    var normals = [
      // Front face
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      // Back face
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
      // Top face
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
      // Bottom face
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
      // Right face
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      // Left face
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ];
    cubeNormalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    cubeNormalBuf.itemSize = 3;
    cubeNormalBuf.numItems = normals.length / 3;
  
  
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
    cubeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );
    cubeIndexBuf.itemSize = 1;
    cubeIndexBuf.numItems = indices.length;
}

function drawCube(color, mMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.vertexAttribPointer(
      aPositionLocation,
      cubeBuf.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    // bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.vertexAttribPointer(
      aNormalLocation,
      cubeNormalBuf.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );
  
    // draw elementary arrays - triangle indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
  
    gl.uniform4fv(uColorLoc, color);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  
    gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
    //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

// Same as drawCube but with sphere buffers
function drawSphere(color, mMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
    gl.vertexAttribPointer(
      aPositionLocation,
      spBuf.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );
  
    //Addition for normals
    gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
    gl.vertexAttribPointer(
      aNormalLocation,
      spNormalBuf.itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    //Adding color vals
    gl.uniform4fv(uColorLoc, color);

    // draw elementary arrays - triangle indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  
    gl.uniform4fv(uColorLoc, color);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  
    gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
    //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
    //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}

////////////////////////////////////////////////////////////////////////
function drawScene() {
  // Enable Scissor test to clip the viewport
  gl.enable(gl.SCISSOR_TEST);
  
  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);
  
  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);
  

  // Testing
  // gl.viewport(0*height, 0, height, height);
  // gl.scissor(0*height, 0, height, height);
  // mat4.identity(mMatrix);
  // gl.clearColor(211/255, 211/255, 238/255, 1);
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // drawSphere([0.4, 0, 0.5, 1], mMatrix);
  
  


  
  // 1st viewport (A)
  shaderProgram = sceneAShaderProgram
  gl.useProgram(shaderProgram);
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
  gl.uniform3fv(uLightPosLoc, lightPos);

  gl.viewport(0, 0, canvas.width/3, canvas.height);
  gl.scissor(0, 0, canvas.width/3, canvas.height);

  gl.clearColor(0.85, 0.85, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneAdegree0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneAdegree1), [1, 0, 0]);

  // draw the sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0.5, 0.75, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, 0.55, 0]);
  mMatrix = mat4.scale(mMatrix, [0.3, 0.3, 0.3]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  // draw the cube
  pushMatrix(matrixStack, mMatrix);
  color = [0.7, 0.7, 0.5, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, -0.25, 0]);
  mMatrix = mat4.scale(mMatrix, [0.6, 1, 0.6]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  



  // 2nd viewport (B)
  shaderProgram = sceneBShaderProgram
  gl.useProgram(shaderProgram);
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
  gl.uniform3fv(uLightPosLoc, lightPos);
  gl.viewport(canvas.width/3, 0, canvas.width/3, canvas.height);
  gl.scissor(canvas.width/3, 0, canvas.width/3, canvas.height);
  
  gl.clearColor(1, 0.85, 0.85, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneBdegree0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneBdegree1), [1, 0, 0]);
  
  // draw the biggest sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0.5, 0.5, 0.5, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, -0.5, 0]);
  mMatrix = mat4.scale(mMatrix, [0.4, 0.4, 0.4]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
  // draw the cube-sphere combo 1, bigger
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.rotate(mMatrix, degToRad(-30), [0, 0, 1]);
  mMatrix = mat4.translate(mMatrix, [-0.4, -0.25, 0]);
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0.5, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [0.5, 0.5, 0.5, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
  
  // draw the cube-sphere combo 2, smaller
  mMatrix = mat4.translate(mMatrix, [-0.4, 0.25, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(20), [1, 2, 0]);
  mMatrix = mat4.translate(mMatrix, [0.4, -0.25, 0]);
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
  mMatrix = mat4.rotate(mMatrix, degToRad(30), [0, 0, 1]);
  mMatrix = mat4.translate(mMatrix, [0.785, 1, 0]);
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0.5, 0, 1];
  mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  pushMatrix(matrixStack, mMatrix);
  color = [0.5, 0.5, 0.5, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  mMatrix = popMatrix(matrixStack);
  
  


  
  // 3rd viewport (C)
  shaderProgram = sceneCShaderProgram
  gl.useProgram(shaderProgram);
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
  gl.uniform3fv(uLightPosLoc, lightPos);
  gl.viewport(2*canvas.width/3, 0, canvas.width/3, canvas.height);
  gl.scissor(2*canvas.width/3, 0, canvas.width/3, canvas.height);
  
  gl.clearColor(0.85, 1, 0.85, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneCdegree0), [0, 1, 0]);
  mMatrix = mat4.rotate(mMatrix, degToRad(sceneCdegree1), [1, 0, 0]);
  
  // top ball
  pushMatrix(matrixStack, mMatrix);
  color = [0.65, 0.65, 0.75, 1];
  mMatrix = mat4.translate(mMatrix, [0, 0.725, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
  // bottom ball
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0.8, 0.2, 1];
  mMatrix = mat4.translate(mMatrix, [0, -0.725, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.25, 0.25]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);


  // bottom left sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0.35, 0.35, 0.7, 1];
  mMatrix = mat4.translate(mMatrix, [-0.5, -0.225, 0]);
  mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
    
  // top left sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0.8, 0, 0.8, 1];
  mMatrix = mat4.translate(mMatrix, [-0.5, 0.225, 0]);
  mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);


  // bottom right sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0.2, 0.5, 0.5, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, -0.225, 0]);
  mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);


  // top right sphere
  pushMatrix(matrixStack, mMatrix);
  color = [0.75, 0.5, 0.2, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, 0.225, 0]);
  mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 0.2]);
  drawSphere(color, mMatrix);
  mMatrix = popMatrix(matrixStack);


  // right plank
  pushMatrix(matrixStack, mMatrix);
  color = [0.2, 0.65, 0.45, 1];
  mMatrix = mat4.translate(mMatrix, [0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.5, 0.05, 1]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  

  // left plank
  pushMatrix(matrixStack, mMatrix);
  color = [0.65, 0.65, 0, 1];
  mMatrix = mat4.translate(mMatrix, [-0.5, 0, 0]);
  mMatrix = mat4.scale(mMatrix, [0.5, 0.05, 1]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

    
  // bottom plank
  pushMatrix(matrixStack, mMatrix);
  color = [0.6, 0.2, 0, 1];
  mMatrix = mat4.translate(mMatrix, [0.0, -0.45, 0]);
  mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 0.5]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
  
  // top plank
  pushMatrix(matrixStack, mMatrix);
  // same color as bottom plank
  mMatrix = mat4.translate(mMatrix, [0.0, 0.45, 0]);
  mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 0.5]);
  drawCube(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
  
  
}

function webGLStart() {
  // Making canvas global to be used in other functions
  canvas = document.getElementById("myCanvas");

  // Slider for camera position
  ZoomCameraVal = document.getElementById("CZoomId");
  ZoomCameraVal.addEventListener("input", changeCameraPos);
  // Slider for light position
  LightVal = document.getElementById("LPosId");
  LightVal.addEventListener("input", changeLightPos);

  // Mouse event listener
  document.addEventListener("mousedown", onMouseDown, false);

  initGL(canvas);

  //Initialize the shaders (new ones)
  ShaderProgram = initShaders(vertexShaderCode, fragShaderCode);
  sceneAShaderProgram = initShaders(sceneAVertexShaderCode, sceneAFragmentShaderCode);
  sceneBShaderProgram = initShaders(sceneBVertexShaderCode, sceneBFragmentShaderCode);
  sceneCShaderProgram = initShaders(sceneCVertexShaderCode, sceneCFragmentShaderCode);

  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer(100);
  initCubeBuffer();
  initSphereBuffer();

  // Enable depth test to make sure objects in front are always in front no matter the order
  gl.enable(gl.DEPTH_TEST);
  drawScene();
}

function changeCameraPos() {
  eyePos = [0.0, 0.0, parseFloat(CZoomId.value)];
  drawScene();
}

function changeLightPos() {
  lightPos = [parseFloat(LPosId.value), -20, -10];
  drawScene();
}


function onMouseDown(event) {
  document.addEventListener("mousemove", sceneAonMouseMove, false);
  document.addEventListener("mousemove", sceneBonMouseMove, false);
  document.addEventListener("mousemove", sceneConMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  document.addEventListener("mouseout", onMouseOut, false);

  if (event.layerX <= canvas.width && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0)
  {
    prevMouseX = event.clientX;
    prevMouseY = canvas.height - event.clientY;
  }
}
  
function sceneAonMouseMove(event) {
  if (event.layerX <= canvas.width/3 && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0)
  {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    sceneAdegree0 = sceneAdegree0 + diffX1 / 5;
    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    sceneAdegree1 = sceneAdegree1 - diffY2 / 5;
    drawScene();
  }
}

function sceneBonMouseMove(event) {
  if (event.layerX <= 2*canvas.width/3 && event.layerX >= canvas.width/3 && event.layerY <= canvas.height && event.layerY >= 0)
  {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    sceneBdegree0 = sceneBdegree0 + diffX1 / 5;
    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    sceneBdegree1 = sceneBdegree1 - diffY2 / 5;
    drawScene();
  }
}

function sceneConMouseMove(event) {
  if (event.layerX <= canvas.width && event.layerX >= 2*canvas.width/3 && event.layerY <= canvas.height && event.layerY >= 0)
  {
    var mouseX = event.clientX;
    var diffX1 = mouseX - prevMouseX;
    prevMouseX = mouseX;
    sceneCdegree0 = sceneCdegree0 + diffX1 / 5;
    var mouseY = canvas.height - event.clientY;
    var diffY2 = mouseY - prevMouseY;
    prevMouseY = mouseY;
    sceneCdegree1 = sceneCdegree1 - diffY2 / 5;
    drawScene();
  }
}

function onMouseUp(event) {
  document.removeEventListener("mousemove", sceneAonMouseMove, false);
  document.removeEventListener("mousemove", sceneBonMouseMove, false);
  document.removeEventListener("mousemove", sceneConMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}
  
function onMouseOut(event) {
  document.removeEventListener("mousemove", sceneAonMouseMove, false);
  document.removeEventListener("mousemove", sceneBonMouseMove, false);
  document.removeEventListener("mousemove", sceneConMouseMove, false);
  document.removeEventListener("mouseup", onMouseUp, false);
  document.removeEventListener("mouseout", onMouseOut, false);
}
