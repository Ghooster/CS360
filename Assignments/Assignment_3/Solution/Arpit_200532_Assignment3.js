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
var aNormalLocation;
var aTexCoordLocation;
var uColorLoc;

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var cubeTexBuf;
var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;
var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexTexCoordBuffer;
var objVertexIndexBuffer;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var eyePos = [0.0, 0.5, 2.5];
var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

var degrees = [0.0, 30.0, 0, -10, 0.0, 30.0];

var lightPos = [-100, -100, -50];

var rubicksTextureFile = "texture_and_other_files/rcube.png";
var rubicksTexture;
var woodTextureFile = "texture_and_other_files/wood_texture.jpg";
var woodTexture;
var teapotJSON = "texture_and_other_files/teapot.json";

const faceVertexShaderCode = `#version 300 es
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

const faceFragShaderCode = `#version 300 es
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
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    fragColor = vec4(Ambient+Diffuse+Specular);
    fragColor.a = color.a;
    
}`;

const vertexVertexShaderCode = `#version 300 es
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
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    vColor = Ambient+Diffuse+Specular;
    vColor.a = color.a;
    
}`;

const vertexFragShaderCode = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fragColor;

void main() 
{
    fragColor = vColor;
}`;

const fragmentVertexShaderCode = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
out vec3 vPosition;
out vec3 vNormal;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

in vec2 aTexCoord;
out vec2 vTexCoord;

void main() 
{
    mat4 projectionModelView;
	projectionModelView=uPMatrix*uVMatrix*uMMatrix;
    gl_Position = projectionModelView*vec4(aPosition,1.0);
    gl_PointSize = 2.0;
    vPosition = normalize(vec3(uVMatrix*uMMatrix*vec4(aPosition,1.0)));
    vNormal = normalize(vec3(transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0)));
    vTexCoord = aTexCoord;
}`;

const fragmentFragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;
in vec3 vPosition;
in vec3 vNormal;
uniform vec3 lightPos;

in vec2 vTexCoord;
uniform sampler2D uTexture;

void main() 
{
    vec3 Normal = normalize(vNormal);
    vec3 Light = normalize(-lightPos);
    vec3 Reflect = normalize(-reflect(Light,Normal));
    vec3 View = normalize(-vPosition);
    vec4 Ambient = 0.5*color*vec4(1.0,1.0,1.0,1.0);
    vec4 Diffuse = max(dot(Normal,Light),0.0)*color;
    vec4 Specular = 0.5*vec4(1.0,1.0,1.0,1.0)*pow(dot(Reflect,View),5.0);
    fragColor = vec4(Ambient+Diffuse+Specular);
    fragColor.a = color.a;
    
    vec4 texColor = texture(uTexture, vTexCoord);
    fragColor.rbg += 0.25*texColor.rbg;
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

function initShaders(vertexShaderCode, fragShaderCode)
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
            var utex = 1 - j / nstacks;
            var vtex = 1 - i / nslices;
            spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
            spNormals.push(xcood, ycoord, zcoord);
            spTexCoords.push(utex, vtex);
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
    var nslices = 30;
    var nstacks = 30;
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
    spTexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
    spTexBuf.itemSize = 2;
    spTexBuf.numItems = spTexCoords.length / 2;
}

function drawSphere(color, mMatrix)
{
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
  gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
  gl.bindTexture(gl.TEXTURE_2D, rubicksTexture); // bind the texture object to the texture unit
  gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader
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
    cubeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    cubeIndexBuf.itemSize = 1;
    cubeIndexBuf.numItems = indices.length;
}

function drawCube(color, mMatrix)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.vertexAttribPointer(aPositionLocation, cubeBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuf);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
    if (aNormalLocation != -1)
        gl.vertexAttribPointer(aNormalLocation, cubeNormalBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTexBuf);
    if (aTexCoordLocation != -1)
        gl.vertexAttribPointer(aTexCoordLocation, cubeTexBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rubicksTexture);
    gl.uniform1i(uTextureLocation, 0);
    gl.uniform4fv(uColorLoc, color);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.drawElements(gl.TRIANGLES, cubeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function initTeapot()
{
    var request = new XMLHttpRequest();
    request.open("GET", teapotJSON);
    request.overrideMimeType("application/json");
    request.onreadystatechange = function ()
    {
        if (request.readyState == 4)
        {
            processTeapot(JSON.parse(request.responseText));
        }
    };
    request.send();
}
  
function processTeapot(objData)
{
    objVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexPositions), gl.STATIC_DRAW);
    objVertexPositionBuffer.itemSize = 3;
    objVertexPositionBuffer.numItems = objData.vertexPositions.length / 3;
    objVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexNormals), gl.STATIC_DRAW);
    objVertexNormalBuffer.itemSize = 3;
    objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;
    objVertexTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertexTextureCoords), gl.STATIC_DRAW);
    objVertexTexCoordBuffer.itemSize = 2;
    objVertexTexCoordBuffer.numItems = objData.vertexTextureCoords.length / 2;
    objVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(objData.indices), gl.STATIC_DRAW);
    objVertexIndexBuffer.itemSize = 1;
    objVertexIndexBuffer.numItems = objData.indices.length;
}

function drawTeapot(color)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
    gl.vertexAttribPointer(aPositionLocation, objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
    if (aNormalLocation != -1)
        gl.vertexAttribPointer(aNormalLocation, objVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTexCoordBuffer);
    if (aTexCoordLocation != -1)
        gl.vertexAttribPointer(aTexCoordLocation, objVertexTexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniform1i(uTextureLocation, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);

    gl.uniform4fv(uColorLoc, color);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
    gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
    gl.drawElements(gl.TRIANGLES, objVertexIndexBuffer.numItems, gl.UNSIGNED_INT, 0);
}

function initTextures(textureFile)
{
    var tex = gl.createTexture();
    tex.image = new Image();
    tex.image.src = textureFile;
    tex.image.onload = function ()
    {
      handleTextureLoaded(tex);
    };
    return tex;
  }
  
  function handleTextureLoaded(texture)
  {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    drawScene();
  }

function draw()
{
    gl.clearColor(211/255, 211/255, 238/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(degrees[1]), [0, 1, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(degrees[0]), [1, 0, 0]);
    
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 0.0, 0.0, 1];
    mMatrix = mat4.scale(mMatrix, [0.05, 0.05, 0.05]);
    drawTeapot(color);
    mMatrix = popMatrix(matrixStack);

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

function drawScene()
{
    mat4.identity(vMatrix);
    vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);
    mat4.identity(pMatrix);
    mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    // gl.useProgram(faceShaderProgram);
    // setupShader(faceShaderProgram);
    // gl.useProgram(vertexShaderProgram);
    // setupShader(vertexShaderProgram);
    gl.useProgram(fragmentShaderProgram);
    setupShader(fragmentShaderProgram);
    draw();
    mMatrix = popMatrix(matrixStack);
}

function webGLStart()
{
    canvas = document.getElementById("Assignment3");
    initGL();
    faceShaderProgram = initShaders(faceVertexShaderCode, faceFragShaderCode);
    vertexShaderProgram = initShaders(vertexVertexShaderCode, vertexFragShaderCode);
    fragmentShaderProgram = initShaders(fragmentVertexShaderCode, fragmentFragShaderCode);
    initTeapot();
    initSphereBuffer();
    initCubeBuffer();
    rubicksTexture = initTextures(rubicksTextureFile);
    woodTexture = initTextures(woodTextureFile);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}

function setupShader(shaderProgram)
{
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
    aTexCoordLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.enableVertexAttribArray(aPositionLocation);
    if (aNormalLocation != -1)
        gl.enableVertexAttribArray(aNormalLocation);
    if (aTexCoordLocation != -1)
        gl.enableVertexAttribArray(aTexCoordLocation);
    uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uLightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    gl.uniform3fv(uLightPosLoc, lightPos);
}