var gl;
var color;
var animation;
var canvas;
var matrixStack = [];
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var mMatrix = mat4.create();
var uMMatrixLocation;
var uVMatrixLocation;
var uPMatrixLocation;
var aPositionLocation;
var uColorLoc;
var circleBuf;
var circleIndexBuf;
var sqVertexPositionBuffer;
var sqVertexIndexBuffer;
var height;

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var spBuf;
var spIndexBuf;
var spNormalBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];

var eyePos = [0.0, 0.0, 2.5];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var degreeL1 = 0.0;
var degreeL0 = 0.0;
var degreeM1 = 0.0;
var degreeM0 = 0.0;
var degreeR1 = 0.0;
var degreeR0 = 0.0;
var prevMouseLX = 0.0;
var prevMouseLY = 0.0;
var prevMouseMX = 0.0;
var prevMouseMY = 0.0;
var prevMouseRX = 0.0;
var prevMouseRY = 0.0;

const vertexShaderCode = `#version 300 es
in vec3 aPosition;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

void main() 
{
    mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
    gl_Position = projectionModelView*vec4(aPosition,1.0);
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

function initGL()
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
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
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
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ];
    cubeNormalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    cubeNormalBuf.itemSize = 3;
    cubeNormalBuf.numItems = normals.length / 3;

    var indices = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
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
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function onMouseDown(event)
{
    document.addEventListener("mousemove", onMouseLMove, false);
    document.addEventListener("mousemove", onMouseMMove, false);
    document.addEventListener("mousemove", onMouseRMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mouseout", onMouseOut, false);
    if (event.layerX <= canvas.width && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0)
    {
        prevMouseX = event.clientX;
        prevMouseY = canvas.height - event.clientY;
    }
  }
  
function onMouseLMove(event)
{
    if (event.layerX <= canvas.width/3 && event.layerX >= 0 && event.layerY <= canvas.height && event.layerY >= 0)
    {
        var mouseX = event.clientX;
        var diffX1 = mouseX - prevMouseX;
        prevMouseX = mouseX;
        degreeL0 = degreeL0 + diffX1 / 2;
        var mouseY = canvas.height - event.clientY;
        var diffY2 = mouseY - prevMouseY;
        prevMouseY = mouseY;
        degreeL1 = degreeL1 - diffY2 / 2;
        drawScene();
    }
}

function onMouseMMove(event)
{
    if (event.layerX <= 2*canvas.width/3 && event.layerX >= canvas.width/3 && event.layerY <= canvas.height && event.layerY >= 0)
    {
        var mouseX = event.clientX;
        var diffX1 = mouseX - prevMouseX;
        prevMouseX = mouseX;
        degreeM0 = degreeM0 + diffX1 / 2;
        var mouseY = canvas.height - event.clientY;
        var diffY2 = mouseY - prevMouseY;
        prevMouseY = mouseY;
        degreeM1 = degreeM1 - diffY2 / 2;
        drawScene();
    }
}

function onMouseRMove(event)
{
    if (event.layerX <= canvas.width && event.layerX >= 2*canvas.width/3 && event.layerY <= canvas.height && event.layerY >= 0)
    {
        var mouseX = event.clientX;
        var diffX1 = mouseX - prevMouseX;
        prevMouseX = mouseX;
        degreeR0 = degreeR0 + diffX1 / 2;
        var mouseY = canvas.height - event.clientY;
        var diffY2 = mouseY - prevMouseY;
        prevMouseY = mouseY;
        degreeR1 = degreeR1 - diffY2 / 2;
        drawScene();
    }
}

function onMouseUp(event)
{
    document.removeEventListener("mousemove", onMouseLMove, false);
    document.removeEventListener("mousemove", onMouseMMove, false);
    document.removeEventListener("mousemove", onMouseRMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
}
  
function onMouseOut(event)
{
    document.removeEventListener("mousemove", onMouseLMove, false);
    document.removeEventListener("mousemove", onMouseMMove, false);
    document.removeEventListener("mousemove", onMouseRMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
}

function drawSceneL()
{
    gl.clearColor(211/255, 211/255, 238/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeL0), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeL1), [1, 0, 0]);

    pushMatrix(matrixStack, mMatrix);
    color = [0/255, 112/255, 163/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.3, 0.3, 0.3]);
    drawSphere(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [165/255, 166/255, 111/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.25, 0]);
    mMatrix = mat4.scale(mMatrix, [0.6, 1, 0.6]);
    drawCube(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawSceneM()
{
    gl.clearColor(238/255, 211/255, 210/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeM0), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeM1), [1, 0, 0]);

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
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeR0), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degreeR1), [1, 0, 0]);

    // Upper cube
    pushMatrix(matrixStack, mMatrix);
    color = [148/255, 50/255, 18/255, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 0.5]);
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
    mMatrix = mat4.scale(mMatrix, [1.5, 0.05, 0.5]);
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
    mat4.identity(vMatrix);
    vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);
    mat4.identity(pMatrix);
    mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);
    
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    gl.viewport(0*height, 0, height, height);
    gl.scissor(0*height, 0, height, height);
    drawSceneL();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    gl.viewport(1*height, 0, height, height);
    gl.scissor(1*height, 0, height, height);
    drawSceneM();
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    gl.viewport(2*height, 0, height, height);
    gl.scissor(2*height, 0, height, height);
    drawSceneR();
    mMatrix = popMatrix(matrixStack);
}

function webGLStart()
{
    canvas = document.getElementById("Assignment2");
    document.addEventListener("mousedown", onMouseDown, false);
    sliderL = document.getElementById("LightSliderId");
    sliderL.addEventListener("input", LightSliderChanged);
    sliderC = document.getElementById("CameraSliderId");
    sliderC.addEventListener("input", CameraSliderChanged);
    initGL();
    shaderProgram = initShaders();
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    height = canvas.width/3;
    initSphereBuffer();
    initCubeBuffer();
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}

function CameraSliderChanged()
{
    eyePos = [0.0, 0.0, parseFloat(sliderC.value)];
    drawScene();
}

function LightSliderChanged()
{
    console.log("Current Light slider value is", sliderL.value);
}