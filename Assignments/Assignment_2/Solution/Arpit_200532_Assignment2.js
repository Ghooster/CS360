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
var mode = 1;
var length;

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

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
    var radius = 1.0;
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
    gl.uniform4fv(uColorLoc, color);
    switch (mode)
    {
        case 0:
            gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            break;
        case 1:
            gl.drawElements(gl.LINE_LOOP, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            break;
        case 2:
            gl.drawElements(gl.POINTS, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
            break;
        default:
            console.log("invalid mode");
    }
}

function initCubeBuffer()
{
    var vertices = [
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
        0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
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
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    cubeIndexBuf.itemSize = 1;
    cubeIndexBuf.numItems = indices.length;
}

function drawCube(color, mMatrix)
{
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.vertexAttribPointer(aPositionLocation, cubeBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    switch (mode)
    {
        case 0:
            gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
            break;
        case 1:
            gl.drawElements(gl.LINE_LOOP, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
            break;
        case 2:
            gl.drawElements(gl.POINTS, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
            break;
        default:
            console.log("invalid mode");
    }
}

function drawSceneL()
{
    gl.clearColor(211/255, 211/255, 238/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.identity(mMatrix);

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
    mat4.identity(mMatrix);

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
    mat4.identity(mMatrix);

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

function drawScene()
{
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0*length, 0*length, 1*length, 1*length);
    gl.scissor(0*length, 0*length, 1*length, 1*length);
    drawSceneL();
    gl.viewport(1*length, 0*length, 1*length, 1*length);
    gl.scissor(1*length, 0*length, 1*length, 1*length);
    drawSceneM();
    gl.viewport(2*length, 0*length, 1*length, 1*length);
    gl.scissor(2*length, 0*length, 1*length, 1*length);
    drawSceneR();
}

function webGLStart()
{
    var canvas = document.getElementById("Assignment2");
    initGL(canvas);
    shaderProgram = initShaders();
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    length = canvas.width/3;
    initSphereBuffer();
    initCubeBuffer();
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}

function mode_fun(m)
{
    mode = m;
    drawScene();
}