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

var buf;
var indexBuf;
var normalBuf;

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

var aTexCoordLocation;
var uColorLoc;

function choose_view(v) {
  view = v;
  drawScene();
}

var cubeTexBuf;
var spTexBuf;
var objectPositionBuffer;
var objectNormalBuffer;
var objectTexCoordBuffer;
var objectIndexBuffer;
var sqBuf;
var sqIndexBuf;
var sqNormalBuf;
var sqTexBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var lightPos = [0, -500, -500];

var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];
var Anglee = 0.0;
var eyePos = [25 * Math.sin(Anglee), 10, 25 * Math.cos(Anglee)];

var wnMatrix = mat4.create();

var rcubeTex;
var wTex;
var negZTex;
var posZTex;
var negXTex;
var posXTex;
var posYTex;
var negYTex;

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

// Vertex shader code for face shading
const sceneAVertexShaderCode = `#version 300 es
in vec3 aPosition;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 vertexLoc;

void main(){
mat4 projectionModelView;

projectionModelView=uPMatrix*uVMatrix*uMMatrix;

gl_Position = projectionModelView*vec4(aPosition,1.0);

gl_PointSize = 5.0;

vertexLoc = vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0));
}`;

// Fragment shader code for face shading
const sceneAFragmentShaderCode = `#version 300 es
precision mediump float;
in vec3 vertexLoc;

uniform vec4 initialColor;
uniform vec3 lightPos;

out vec4 fragColor;

void main() {
vec4 col1 = 0.6*initialColor*vec4(1.0,1.0,1.0,1.0);
// col1 = vec4(0.0,0.0,0.0,0.0);

vec3 N = normalize(cross(dFdx(vertexLoc), dFdy(vertexLoc)));

vec3 L = normalize(-lightPos);


vec3 V = normalize(-vertexLoc);
vec4 col2 = max(dot(N,L),0.0)*initialColor;
// col2 = vec4(0.0,0.0,0.0,0.0);

vec3 R = normalize(-reflect(L,N));

vec4 col3 = 0.6*vec4(1.0,1.0,1.0,1.0)*pow(dot(R,V),7.0);
// col3 = vec4(0.0,0.0,0.0,1.0);

fragColor = vec4(col1+col2+col3);
fragColor[3] = initialColor[3];

}`;

// Vertex shader code for per-vertex shading
const sceneBVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform vec3 lightPos;
uniform vec4 initialColor;

out vec4 vColor;

void main() {

mat4 projectionModelView;
projectionModelView=uPMatrix*uVMatrix*uMMatrix;
gl_Position = projectionModelView*vec4(aPosition,1.0);

gl_PointSize = 5.0;

vec3 vertexLoc = vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0));

vec4 col1 = 0.4*initialColor;
// col1 = vec4(0.0,0.0,0.0,0.0);

vec3 N = normalize(mat3(transpose(inverse(uVMatrix*uMMatrix)))*aNormal);
vec3 L = normalize(-vec3(uVMatrix*vec4(lightPos,1.0)));

vec4 col2 = max(dot(N,L),0.0)*initialColor;
// col2 = vec4(0.0,0.0,0.0,0.0);

vec3 R = normalize(-reflect(L,N));
vec3 V = normalize(-vertexLoc);

vec4 col3 = 0.6*vec4(1.0,1.0,1.0,1.0)*pow(dot(R,V),7.0);
// col3 = vec4(0.0,0.0,0.0,1.0);


vColor = col1+col2+col3;
vColor.a = initialColor[3];

}`;

// Fragment shader code for per-vertex shading
const sceneBFragmentShaderCode = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fragColor;

void main() {
fragColor = vColor;
}`;

// Vertex shader code for per-fragment shading
const sceneCVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

out vec3 vertexLoc;
out vec3 vNormal;

void main() {

mat4 projectionModelView;
projectionModelView=uPMatrix*uVMatrix*uMMatrix;
gl_Position = projectionModelView*vec4(aPosition,1.0);


gl_PointSize = 5.0;

vertexLoc = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));

//New addition for normals
vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
}`;

// Fragment shader code for per-fragment shading
const sceneCFragmentShaderCode = `#version 300 es
precision mediump float;

in vec3 vertexLoc;
in vec3 vNormal;

uniform vec4 initialColor;
uniform vec3 lightPos;

out vec4 fragColor;

void main() 
{

vec4 col1 = 0.4*initialColor*vec4(1.0,1.0,1.0,1.0);
// // col1 = vec4(0.0,0.0,0.0,0.0);

vec3 N = normalize(vNormal);
vec3 L = normalize(-lightPos);



vec4 col2 = max(dot(N,L),0.0)*initialColor;
// // col2 = vec4(0.0,0.0,0.0,0.0);

vec3 R = normalize(-reflect(L,N));
vec3 V = normalize(-vertexLoc);


vec4 col3 = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(R,V),7.0);
// // col3 = vec4(0.0,0.0,0.0,1.0);

fragColor = vec4(col1+col2+col3);
fragColor[3] = initialColor[3];

}`;


const ballsVShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() 
{
  mat4 projectionModelView;
  projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize = 2.0;
  vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
  vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
  v_worldPosition = mat3(uMMatrix) * aPosition;
  v_worldNormal = mat3(uWNMatrix) * aNormal;
  vTexCoord = aTexCoord;
}`;

const ballsFShader = `#version 300 es
precision highp float;
out vec4 fragColor;

in vec2 vTexCoord;
in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform samplerCube uCubeMap;
uniform vec3 eyePos;
uniform vec4 color;
uniform vec3 lightPos;

void main() 
{
  vec3 Normal = normalize(vNormal);
  vec3 Light = normalize(-lightPos);
  vec3 Reflect = normalize(-reflect(Light,Normal));
  vec3 View = normalize(-vPosition);
  vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
  vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
  vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
  
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
  vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
  vec4 cubeMapReflectCol = texture(uCubeMap, directionReflection);
  
  vec4 texColor = texture(uTexture, vTexCoord);

fragColor = vec4(0.25*Ambient+0.25*Diffuse+Specular) + 0.75*cubeMapReflectCol;
fragColor.a = color.a;
}`;

const glassVShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() 
{
mat4 projectionModelView;
projectionModelView=uPMatrix*uVMatrix*uMMatrix;
gl_Position = projectionModelView*vec4(aPosition,1.0);
gl_PointSize = 2.0;
v_worldPosition = mat3(uMMatrix) * aPosition;
v_worldNormal = mat3(uWNMatrix) * aNormal;
}`;

const glassFShader = `#version 300 es
precision highp float;
out vec4 fragColor;

in vec2 vTexCoord;
in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform samplerCube uCubeMap;
uniform vec3 eyePos;
uniform vec4 color;
uniform vec3 lightPos;

void main() 
{
  vec3 Normal = normalize(vNormal);
  vec3 Light = normalize(-lightPos);
  vec3 Reflect = normalize(-reflect(Light,Normal));
  vec3 View = normalize(-vPosition);
  vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
  vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
  vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
  
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
  vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
  vec4 cubeMapReflectCol = texture(uCubeMap, directionReflection);
  
  vec4 texColor = texture(uTexture, vTexCoord);

fragColor = cubeMapReflectCol;
}`;

const tableVShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() 
{
  mat4 projectionModelView;
  projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize = 2.0;
  vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
  vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
  v_worldPosition = mat3(uMMatrix) * aPosition;
  v_worldNormal = mat3(uWNMatrix) * aNormal;
  vTexCoord = aTexCoord;
}`;

const tableFShader = `#version 300 es
precision highp float;
out vec4 fragColor;

in vec2 vTexCoord;
in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform samplerCube uCubeMap;
uniform vec3 eyePos;
uniform vec4 color;
uniform vec3 lightPos;

void main() 
{
vec3 Normal = normalize(vNormal);
vec3 Light = normalize(-lightPos);
vec3 Reflect = normalize(-reflect(Light,Normal));
vec3 View = normalize(-vPosition);
vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);

vec3 worldNormal = normalize(v_worldNormal);
vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
vec4 cubeMapReflectCol = texture(uCubeMap, directionReflection);

vec4 texColor = texture(uTexture, vTexCoord);

fragColor = 0.5*cubeMapReflectCol + 0.5*texColor;
}`;

const teapotVShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() 
{
  mat4 projectionModelView;
  projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize = 2.0;
  vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
  vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
  v_worldPosition = mat3(uMMatrix) * aPosition;
  v_worldNormal = mat3(uWNMatrix) * aNormal;
  vTexCoord = aTexCoord;
}`;

const teapotFShader = `#version 300 es
precision highp float;
out vec4 fragColor;

in vec2 vTexCoord;
in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform samplerCube uCubeMap;
uniform vec3 eyePos;
uniform vec4 color;
uniform vec3 lightPos;

void main() 
{
  vec3 Normal = normalize(vNormal);
  vec3 Light = normalize(-lightPos);
  vec3 Reflect = normalize(-reflect(Light,Normal));
  vec3 View = normalize(-vPosition);
  vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
  vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
  vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
  
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
  vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
  vec4 cubeMapReflectCol = texture(uCubeMap, directionReflection);
  
  vec4 texColor = texture(uTexture, vTexCoord);

fragColor = cubeMapReflectCol;
}`;

const boundingboxVShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uWNMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() 
{
  mat4 projectionModelView;
  projectionModelView=uPMatrix*uVMatrix*uMMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize = 2.0;
  vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
  vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
  v_worldPosition = mat3(uMMatrix) * aPosition;
  v_worldNormal = mat3(uWNMatrix) * aNormal;
  vTexCoord = aTexCoord;
}`;

const boundingboxFShader = `#version 300 es
precision highp float;
out vec4 fragColor;

in vec2 vTexCoord;
in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform samplerCube uCubeMap;
uniform vec3 eyePos;
uniform vec4 color;
uniform vec3 lightPos;

void main() 
{   
vec3 Normal = normalize(vNormal);
vec3 Light = normalize(-lightPos);
vec3 Reflect = normalize(-reflect(Light,Normal));
vec3 View = normalize(-vPosition);
vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);

vec3 worldNormal = normalize(v_worldNormal);
vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePos);
vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);
vec4 cubeMapReflectCol = texture(uCubeMap, directionReflection);

vec4 texColor = texture(uTexture, vTexCoord);

fragColor= texColor;
}`;

function pushMatrix(stack, m) {
  var copy = mat4.create(m);
  stack.push(copy);
}

function popMatrix(stack) {
  if (stack.length > 0)
    return stack.pop();
  else
    console.log("stack has no matrix to pop!");
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

function initShaders(vertexShaderCode, fragShaderCode) {
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

function initGL() {
  try {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch (e) { }
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

// New sphere initialization function
function initSphere(nslices, nstacks, radius) {
  for (var i = 0; i <= nslices; i++) {
    var angle = (i * Math.PI) / nslices;
    var comp1 = Math.sin(angle);
    var comp2 = Math.cos(angle);

    for (var j = 0; j <= nstacks; j++) {
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

  // now compute the indices here
  for (var i = 0; i < nslices; i++) {
    for (var j = 0; j < nstacks; j++) {
      var id1 = i * (nstacks + 1) + j;
      var id2 = id1 + nstacks + 1;

      spIndicies.push(id1, id2, id1 + 1);
      spIndicies.push(id2, id2 + 1, id1 + 1);
    }
  }
}


function initSphereBuffer() {
  var nslices = 50;
  var nstacks = 50;
  var radius = 1.0;

  initSphere(nslices, nstacks, radius);

  // buffer for vertices
  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = spVerts.length / 3;

  // buffer for indices
  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = spIndicies.length;

  // buffer for normals
  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = spNormals.length / 3;

  // buffer for texture coordinates
  spTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
  spTexBuf.itemSize = 2;
  spTexBuf.numItems = spTexCoords.length / 2;
}

function drawSphere(color, mMatrix) {
  

  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(aPositionLocation, spBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  if (aNormalLocation != -1)
    gl.vertexAttribPointer(aNormalLocation, spNormalBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  if (aTexCoordLocation != -1)
    gl.vertexAttribPointer(aTexCoordLocation, spTexBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(uColorLoc, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  // for texture binding

  pushMatrix(matrixStack, mMatrix);
  wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  mMatrix = popMatrix(matrixStack);

  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, wTex); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader
  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function initCubeBuffer() {
  var vertices = [
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
  ];
  buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  buf.itemSize = 3;
  buf.numItems = vertices.length / 3;

  var normals = [
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  normalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  normalBuf.itemSize = 3;
  normalBuf.numItems = normals.length / 3;

  var texCoords = [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
  cubeTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  cubeTexBuf.itemSize = 2;
  cubeTexBuf.numItems = texCoords.length / 2;

  var indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ];
  indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  indexBuf.itemSize = 1;
  indexBuf.numItems = indices.length;
}

function drawCube(color, mMatrix, texture) {

  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(aPositionLocation, buf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
    gl.vertexAttribPointer(aNormalLocation, normalBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
    gl.vertexAttribPointer(aTexCoordLocation, cubeTexBuf.itemSize, gl.FLOAT, false, 0, 0);

    pushMatrix(matrixStack, mMatrix);
  wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  mMatrix = popMatrix(matrixStack);


  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTextureLocation, 0);
  gl.uniform4fv(uColorLoc, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function initSquareBuffer() {
  var vertices = [
    -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0,
  ];
  sqBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  sqBuf.itemSize = 3;
  sqBuf.numItems = vertices.length / 3;

  var normals = [
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  ];
  sqNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  sqNormalBuf.itemSize = 3;
  sqNormalBuf.numItems = normals.length / 3;

  var texCoords = [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
  sqTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  sqTexBuf.itemSize = 2;
  sqTexBuf.numItems = texCoords.length / 2;

  var indices = [
    0, 1, 2, 0, 2, 3,
  ];
  sqIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  sqIndexBuf.itemSize = 1;
  sqIndexBuf.numItems = indices.length;
}

function drawSquare(mMatrix, texture) {
  gl.bindBuffer(gl.ARRAY_BUFFER, sqBuf);
  gl.vertexAttribPointer(aPositionLocation, sqBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqIndexBuf);
  gl.bindBuffer(gl.ARRAY_BUFFER, sqTexBuf);
  gl.vertexAttribPointer(aTexCoordLocation, sqTexBuf.itemSize, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTextureLocation, 0);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.drawElements(gl.TRIANGLES, sqIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function initObject() {
  // XMLHttpRequest objects are used to interact with servers
  // It can be used to retrieve any type of data, not just XML.
  var request = new XMLHttpRequest();
  request.open("GET", "texture_and_other_files/teapot.json");
  // request.open("GET", input_JSON);
  // MIME: Multipurpose Internet Mail Extensions
  // It lets users exchange different kinds of data files
  request.overrideMimeType("application/json");
  request.onreadystatechange = function () {
    //request.readyState == 4 means operation is done
    if (request.readyState == 4) {
      processObject(JSON.parse(request.responseText));
    }
  };
  request.send();
}

function processObject(objData) {
  objectPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexPositions), gl.STATIC_DRAW);
  objectPositionBuffer.itemSize = 3;
  objectPositionBuffer.numItems = objData.vertexPositions.length / 3;
  objectNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexNormals), gl.STATIC_DRAW);
  objectNormalBuffer.itemSize = 3;
  objectNormalBuffer.numItems = objData.vertexNormals.length / 3;
  objectTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexTextureCoords), gl.STATIC_DRAW);
  objectTexCoordBuffer.itemSize = 2;
  objectTexCoordBuffer.numItems = objData.vertexTextureCoords.length / 2;
  objectIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(objData.indices), gl.STATIC_DRAW);
  objectIndexBuffer.itemSize = 1;
  objectIndexBuffer.numItems = objData.indices.length;

  drawScene();
}

function drawObject(color) {
  pushMatrix(matrixStack, mMatrix);
  wnMatrix = mat4.transpose(mat4.inverse(mMatrix));
  mMatrix = popMatrix(matrixStack);

  gl.bindBuffer(gl.ARRAY_BUFFER, objectPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    objectPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectIndexBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, objectNormalBuffer);
  if (aNormalLocation != -1)
    gl.vertexAttribPointer(aNormalLocation, objectNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, objectTexCoordBuffer);
  //   gl.uniform4fv(uDiffuseTermLocation, color);

  if (aTexCoordLocation != -1)
    gl.vertexAttribPointer(aTexCoordLocation, objectTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.uniform1i(uTextureLocation, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, wTex);

  gl.uniform4fv(uColorLoc, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.drawElements(gl.TRIANGLES, objectIndexBuffer.numItems, gl.UNSIGNED_INT, 0);
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
  if (view == 0) {
    gl.drawElements(
      gl.POINTS,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if (view == 1) {
    gl.drawElements(
      gl.LINE_LOOP,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if (view == 2) {
    gl.drawElements(
      gl.TRIANGLES,
      triangleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else {
    console.log("Invalid view");
  }
}

function initCircleBuffer(resolution) {
  // buffer for point locations
  var circleVertices = [];
  for (var i = 0; i < resolution; i++) {
    var theta = (i / resolution) * 2 * Math.PI;
    circleVertices.push(Math.cos(theta) / 2, Math.sin(theta) / 2);
  }
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = resolution;

  // buffer for point indices
  var circleIndices = [];
  for (var i = 0; i < resolution; i++) {
    circleIndices.push(0, i % resolution, (i + 1) % resolution + 1);
  }
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleIndices), gl.STATIC_DRAW);
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = resolution * 3;
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
  if (view == 0) {
    gl.drawElements(
      gl.POINTS,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if (view == 1) {
    gl.drawElements(
      gl.LINE_LOOP,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else if (view == 2) {
    gl.drawElements(
      gl.TRIANGLES,
      circleIndexBuf.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
  else {
    console.log("Invalid view");
  }
}

function initTextures(textureFile) {
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.src = textureFile;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  return tex;
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  drawScene();
}

function initCubeMap() {
  const faceIndos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: "texture_and_other_files/Nvidia_cubemap/" + "posx.jpg",
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: "texture_and_other_files/Nvidia_cubemap/" + "negx.jpg",
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: "texture_and_other_files/Nvidia_cubemap/" + "posy.jpg",
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: "texture_and_other_files/Nvidia_cubemap/" + "negy.jpg",
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: "texture_and_other_files/Nvidia_cubemap/" + "posz.jpg",
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: "texture_and_other_files/Nvidia_cubemap/" + "negz.jpg",
    },
  ];
  cubeMapTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);

  faceIndos.forEach((faceInfo) => {
    const { target, url } = faceInfo;
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      drawScene();
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

function drawScene() {
  Anglee = 0;
  if (animation) {
    window.cancelAnimationFrame(animation);
  }

  var animate = function () {

    // Enable Scissor test to clip the viewport
    gl.enable(gl.SCISSOR_TEST);

    Anglee -= 0.01;

    eyePos = [25 * Math.sin(Anglee), 10, 25 * Math.cos(Anglee)];

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


    mat4.identity(mMatrix);

    gl.useProgram(onlyTextureShaderProgram);
    shaderProgram = onlyTextureShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTexCoordLocation);
  uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
  gl.uniform1i(uCubeMapLocation, 1);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
  gl.uniform3fv(uLightPosLoc, lightPos);
  uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
  gl.uniform3fv(uEyePosLoc, eyePos);
  uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
  gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mat4.scale(mMatrix, [550, 550, 550]);
    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [0, 0, -0.5]);
    mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
    drawSquare(mMatrix, negZTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [0, 0, 0.5]);
    mat4.rotate(mMatrix, degToRad(180), [1, 0, 0]);
    drawSquare(mMatrix, posZTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [0, 0.5, 0]);
    mat4.rotate(mMatrix, degToRad(90), [1, 0, 0]);
    drawSquare(mMatrix, posYTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [0, -0.5, 0]);
    mat4.rotate(mMatrix, degToRad(90), [1, 0, 0]);
    drawSquare(mMatrix, negYTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [0.5, 0, 0]);
    mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
    mat4.rotate(mMatrix, degToRad(90), [0, 1, 0]);
    drawSquare(mMatrix, posXTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mat4.translate(mMatrix, [-0.5, 0, 0]);
    mat4.rotate(mMatrix, degToRad(90), [0, 1, 0]);
    mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
    drawSquare(mMatrix, negXTex);
    mMatrix = popMatrix(matrixStack);

    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    mMatrix = mat4.scale(mMatrix, [5, 5, 5]);

    gl.useProgram(onlyTextureShaderProgram);

    shaderProgram = onlyTextureShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTexCoordLocation);
  uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
  gl.uniform1i(uCubeMapLocation, 1);
  uColorLoc = gl.getUniformLocation(shaderProgram, "color");
  uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
  gl.uniform3fv(uLightPosLoc, lightPos);
  uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
  gl.uniform3fv(uEyePosLoc, eyePos);
  uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
  gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [1, -0.5, 1]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
    drawCube([1, 1, 1, 1], mMatrix, rcubeTex);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    gl.useProgram(reflectionAndTextureShaderProgram);

    shaderProgram = reflectionAndTextureShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);
    gl.enableVertexAttribArray(aTexCoordLocation);
    uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
    uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
    gl.uniform1i(uCubeMapLocation, 1);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    gl.uniform3fv(uLightPosLoc, lightPos);
    uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
    gl.uniform3fv(uEyePosLoc, eyePos);
    uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
    gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -1, 0]);
    mMatrix = mat4.scale(mMatrix, [3, 0.2, 2]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [-2, -2.4, 0.8]);
    mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
    drawCube(color, mMatrix, wTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [2, -2.4, 0.8]);
    mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
    drawCube(color, mMatrix, wTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [-2, -2.4, -0.8]);
    mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
    drawCube(color, mMatrix, wTex);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [2, -2.4, -0.8]);
    mMatrix = mat4.scale(mMatrix, [0.2, 3, 0.2]);
    drawCube(color, mMatrix, wTex);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    gl.useProgram(onlyRefractionShaderProgram);

    shaderProgram = onlyRefractionShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);
    gl.enableVertexAttribArray(aTexCoordLocation);
    uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
    uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
    gl.uniform1i(uCubeMapLocation, 1);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    gl.uniform3fv(uLightPosLoc, lightPos);
    uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
    gl.uniform3fv(uEyePosLoc, eyePos);
    uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
    gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [-1.5, -0.3, 1]);
    mMatrix = mat4.scale(mMatrix, [0.5, 1, 0.5]);
    mMatrix = mat4.rotate(mMatrix, degToRad(45), [0, 1, 0]);
    drawCube(color, mMatrix, rcubeTex);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    gl.useProgram(onlyReflectionShaderProgram);

    shaderProgram = onlyReflectionShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);
    gl.enableVertexAttribArray(aTexCoordLocation);
    uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
    uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
    gl.uniform1i(uCubeMapLocation, 1);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    gl.uniform3fv(uLightPosLoc, lightPos);
    uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
    gl.uniform3fv(uEyePosLoc, eyePos);
    uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
    gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0 / 255, 112 / 255, 163 / 255, 1];
    mMatrix = mat4.translate(mMatrix, [0, 0, -0.5]);
    var scale = 0.1;
    mMatrix = mat4.scale(mMatrix, [scale, scale, scale]);
    drawObject(color);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    gl.useProgram(reflectionAndPhongShaderProgram);

    shaderProgram = reflectionAndPhongShaderProgram;

    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);
    gl.enableVertexAttribArray(aTexCoordLocation);
    uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
    uCubeMapLocation = gl.getUniformLocation(shaderProgram, "uCubeMap");
    gl.uniform1i(uCubeMapLocation, 1);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    gl.uniform3fv(uLightPosLoc, lightPos);
    uEyePosLoc = gl.getUniformLocation(shaderProgram, "eyePos");
    gl.uniform3fv(uEyePosLoc, eyePos);
    uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
    gl.uniformMatrix4fv(uWNMatrixLocation, false, wnMatrix);

    pushMatrix(matrixStack, mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 1, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.5, 1.25]);
    var scale = 0.4;
    mMatrix = mat4.scale(mMatrix, [scale, scale, scale]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 1, 1];
    mMatrix = mat4.translate(mMatrix, [1.5, -0.55, 0]);
    var scale = 0.3;
    mMatrix = mat4.scale(mMatrix, [scale, scale, scale]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    mMatrix = popMatrix(matrixStack);

    Anglee -= 0.01;
    animation = window.requestAnimationFrame(animate);
  };
  animate();
}

function webGLStart() {
  // Making canvas global to be used in other functions
  canvas = document.getElementById("myCanvas");

  // // Slider for camera position
  // ZoomCameraVal = document.getElementById("CZoomId");
  // ZoomCameraVal.addEventListener("input", changeCameraPos);
  // // Slider for light position
  // LightVal = document.getElementById("LPosId");
  // LightVal.addEventListener("input", changeLightPos);

  // // Mouse event listener
  // document.addEventListener("mousedown", onMouseDown, false);

  initGL(canvas);
  //Initialize the shaders (new ones)
  ShaderProgram = initShaders(vertexShaderCode, fragShaderCode);
  sceneAShaderProgram = initShaders(sceneAVertexShaderCode, sceneAFragmentShaderCode);
  sceneBShaderProgram = initShaders(sceneBVertexShaderCode, sceneBFragmentShaderCode);
  sceneCShaderProgram = initShaders(sceneCVertexShaderCode, sceneCFragmentShaderCode);

  onlyTextureShaderProgram = initShaders(boundingboxVShader, boundingboxFShader);
  onlyRefractionShaderProgram = initShaders(glassVShader, glassFShader);
  onlyReflectionShaderProgram = initShaders(teapotVShader, teapotFShader);
  reflectionAndTextureShaderProgram = initShaders(tableVShader, tableFShader);
  reflectionAndPhongShaderProgram = initShaders(ballsVShader, ballsFShader);

  //Initialize the buffers
  initObject();
  initSphereBuffer();
  initCubeBuffer();
  initSquareBuffer();

  // Load texture files
  rcubeTex = initTextures("texture_and_other_files/rcube.png");
  wTex = initTextures("texture_and_other_files/wood_texture.jpg");
  posXTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "posx.jpg");
  negXTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "negx.jpg");
  posYTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "posy.jpg");
  negYTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "negy.jpg");
  posZTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "posz.jpg");
  negZTex = initTextures("texture_and_other_files/Nvidia_cubemap/" + "negz.jpg");
  initCubeMap();

  // Enable depth test to make sure objects in front are always in front no matter the order
  gl.enable(gl.DEPTH_TEST);
  drawScene();
}

function changeCameraPos() {
  eyePos = [0.0, 0.0, CZoomId.value];
  drawScene();
}

function changeLightPos() {
  lightPos = [LPosId.value, -20, -10];
  drawScene();
}


function onMouseDown(event) {
  document.addEventListener("mousemove", sceneAonMouseMove, false);
  document.addEventListener("mousemove", sceneBonMouseMove, false);
  document.addEventListener("mousemove", sceneConMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  document.addEventListener("mouseout", onMouseOut, false);

  if (event.layerX <= canvas.width && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0) {
    prevMouseX = event.clientX;
    prevMouseY = canvas.height - event.clientY;
  }
}

function sceneAonMouseMove(event) {
  if (event.layerX <= canvas.width / 3 && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0) {
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
  if (event.layerX <= 2 * canvas.width / 3 && event.layerX >= canvas.width / 3 && event.layerY <= canvas.height && event.layerY >= 0) {
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
  if (event.layerX <= canvas.width && event.layerX >= 2 * canvas.width / 3 && event.layerY <= canvas.height && event.layerY >= 0) {
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
