var gl;
var color;
var canvas;
var matrixStack = [];
var aPositionLocation;
var aBackgroundTexCoordLocation;
var aForegroundTexCoordLocation;
var sqBuf;
var sqIndexBuf;
var sqNormalBuf;
var sqTexBuf;

var BackgroundTextureFile;
var BackgroundTexture;
var ForegroundTextureFile;
var ForegroundTexture;

var imageMode = 0;
var colorMode = 0;
var contrastValue = 0.0;
var brightnessValue = 0.0;
var process = 0;
var pixelSize;

const myVertexShaderCode = `#version 300 es
in vec2 aPosition;

in vec2 aBackgroundTexCoord;
out vec2 vBackgroundTexCoord;
in vec2 aForegroundTexCoord;
out vec2 vForegroundTexCoord;

void main() 
{
    gl_Position = vec4(aPosition,0.0,1.0);
    gl_PointSize = 2.0;
    vBackgroundTexCoord = aBackgroundTexCoord;
    vForegroundTexCoord = aForegroundTexCoord;
}`;

const myFragmentShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

in vec2 vBackgroundTexCoord;
uniform sampler2D uBackgroundTexture;
in vec2 vForegroundTexCoord;
uniform sampler2D uForegroundTexture;

uniform int uImageMode;
uniform int uColorMode;
uniform float uContrastValue;
uniform float uBrightnessValue;
uniform int uProcess;
uniform float uPixelSize;

void main() 
{
    vec4 urBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(-1.0*uPixelSize, uPixelSize));
    vec4 uBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(0.0, uPixelSize));
    vec4 ulBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(uPixelSize, uPixelSize));
    vec4 rBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(-1.0*uPixelSize, 0.0));
    vec4 mBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(0.0, 0.0));
    vec4 lBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(uPixelSize, 0.0));
    vec4 drBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(-1.0*uPixelSize, -1.0*uPixelSize));
    vec4 dBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(0.0, -1.0*uPixelSize));
    vec4 dlBackgroundTexColor = texture(uBackgroundTexture, vBackgroundTexCoord + vec2(uPixelSize, -1.0*uPixelSize));

    vec4 backgroundTexColor = mBackgroundTexColor;
    if(uProcess == 1)
    {
        backgroundTexColor = (urBackgroundTexColor + uBackgroundTexColor + ulBackgroundTexColor + rBackgroundTexColor + mBackgroundTexColor + lBackgroundTexColor + drBackgroundTexColor + dBackgroundTexColor + dlBackgroundTexColor)/9.0;
    }
    else if(uProcess == 2)
    {
        backgroundTexColor = (-uBackgroundTexColor - rBackgroundTexColor - dBackgroundTexColor - lBackgroundTexColor + 5.0*mBackgroundTexColor);
    }
    else if(uProcess == 3)
    {
        vec4 dy = (uBackgroundTexColor - dBackgroundTexColor)*0.5;
        vec4 dx = (rBackgroundTexColor - lBackgroundTexColor)*0.5;
        backgroundTexColor = sqrt(dy*dy + dx*dx);
    }
    else if(uProcess == 4)
    {
        backgroundTexColor = (-uBackgroundTexColor - rBackgroundTexColor - dBackgroundTexColor - lBackgroundTexColor + 4.0*mBackgroundTexColor);
    }
    
    vec4 foregroundTexColor = texture(uForegroundTexture, vForegroundTexCoord);
    vec4 finalTexColor = vec4(foregroundTexColor.a*foregroundTexColor.rgb + (1.0-foregroundTexColor.a)*backgroundTexColor.rgb, 1.0);
    if(uImageMode == 0)
    {
        finalTexColor = backgroundTexColor;
    }
    if(uColorMode == 1)
    {
        float gray = dot(finalTexColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        finalTexColor = vec4(gray, gray, gray, 1.0);
    }
    else if(uColorMode == 2)
    {
        vec3 sepia = vec3(dot(finalTexColor.rgb, vec3(0.393, 0.769, 0.189)) ,dot(finalTexColor.rgb, vec3(0.349, 0.686, 0.168)) ,dot(finalTexColor.rgb, vec3(0.272, 0.534, 0.131)));
        finalTexColor = vec4(sepia, 1.0);
    }
    finalTexColor = vec4(0.5 + (uContrastValue + 1.0) * (finalTexColor.rgb - 0.5), 1.0);
    finalTexColor = vec4(finalTexColor.rgb + uBrightnessValue, 1.0);
    fragColor = finalTexColor;
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
        gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        pixelSize = 2.0 / gl.viewportWidth;
    }
    catch (e) { }
    if (!gl)
    {
        alert("WebGL initialization failed");
    }
}

function initSquareBuffer()
{
    var vertices = [
        -1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0, -1, 1, 0.0,
    ];
    sqBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    sqBuf.itemSize = 3;
    sqBuf.numItems = vertices.length / 3;

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
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    sqIndexBuf.itemSize = 1;
    sqIndexBuf.numItems = indices.length;
}

function drawSquare(backgroundTexture)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, sqBuf);
    gl.vertexAttribPointer(aPositionLocation, sqBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqIndexBuf);
    gl.bindBuffer(gl.ARRAY_BUFFER, sqTexBuf);
    gl.vertexAttribPointer(aBackgroundTexCoordLocation, sqTexBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.uniform1i(uBackgroundTextureLocation, 0);
    gl.vertexAttribPointer(aForegroundTexCoordLocation, sqTexBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ForegroundTexture);
    gl.uniform1i(uForegroundTextureLocation, 1);
    gl.drawElements(gl.TRIANGLES, sqIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

function initTextures(textureFile, RGBorRGBAmode)
{
    var tex = gl.createTexture();
    tex.image = new Image();
    tex.image.src = textureFile;
    tex.image.onload = function ()
    {
        handleTextureLoaded(tex, RGBorRGBAmode);
    };
    return tex;
}
  
function handleTextureLoaded(texture, RGBorRGBAmode)
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if(RGBorRGBAmode == 0)
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    }
    else
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,  gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

function drawScene()
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(myTextureShaderProgram);
    setupShader(myTextureShaderProgram);

    drawSquare(BackgroundTexture);
}

function webGLStart()
{
    canvas = document.getElementById("Assignment4");
    initGL();
    myTextureShaderProgram = initShaders(myVertexShaderCode, myFragmentShaderCode);
    initSquareBuffer();
    BackgroundTexture = initTextures(BackgroundTextureFile, 0);
    ForegroundTexture = initTextures(ForegroundTextureFile, 1);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}

function setupShader(shaderProgram)
{
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    aBackgroundTexCoordLocation = gl.getAttribLocation(shaderProgram, "aBackgroundTexCoord");
    aForegroundTexCoordLocation = gl.getAttribLocation(shaderProgram, "aForegroundTexCoord");
    gl.enableVertexAttribArray(aPositionLocation);
    if (aBackgroundTexCoordLocation != -1)
        gl.enableVertexAttribArray(aBackgroundTexCoordLocation);
    if (aForegroundTexCoordLocation != -1)
        gl.enableVertexAttribArray(aForegroundTexCoordLocation);
    uBackgroundTextureLocation = gl.getUniformLocation(shaderProgram, "uBackgroundTexture");
    uForegroundTextureLocation = gl.getUniformLocation(shaderProgram, "uForegroundTexture");
    uImageModeLocation = gl.getUniformLocation(shaderProgram, "uImageMode");
    gl.uniform1i(uImageModeLocation, imageMode);
    uColorModeLocation = gl.getUniformLocation(shaderProgram, "uColorMode");
    gl.uniform1i(uColorModeLocation, colorMode);
    uContrastValueLocation = gl.getUniformLocation(shaderProgram, "uContrastValue");
    gl.uniform1f(uContrastValueLocation, contrastValue);
    uBrightnessValueLocation = gl.getUniformLocation(shaderProgram, "uBrightnessValue");
    gl.uniform1f(uBrightnessValueLocation, brightnessValue);
    uProcessLocation = gl.getUniformLocation(shaderProgram, "uProcess");
    gl.uniform1i(uProcessLocation, process);
    uPixelSizeLocation = gl.getUniformLocation(shaderProgram, "uPixelSize");
    gl.uniform1f(uPixelSizeLocation, pixelSize);
}

function loadBackgroundImage()
{
    var image = document.getElementById('backgroundImage');
    BackgroundTextureFile = URL.createObjectURL(image.files[0]);
    BackgroundTexture = initTextures(BackgroundTextureFile, 0);
}

function loadForegroundImage()
{
    var image = document.getElementById('foregroundImage');
    ForegroundTextureFile = URL.createObjectURL(image.files[0]);
    ForegroundTexture = initTextures(ForegroundTextureFile, 1);
}

function changeImageMode(backgroundOnlyOrAlphaBlended)
{
    imageMode = backgroundOnlyOrAlphaBlended;
    drawScene();
}

function changeColorMode(colorOrgrayScaleOrSepia)
{
    colorMode = colorOrgrayScaleOrSepia;
    drawScene();
}

function changeContrastValue(value)
{
    contrastValue = value;
    drawScene();
}

function changeBrightnessValue(value)
{
    brightnessValue = value;
    drawScene();
}

function resetScene()
{
    imageMode = 0;
    colorMode = 0;
    contrastValue = 0.0;
    brightnessValue = 0.0;
    process = 0;
    document.getElementById("contrast").value = 0;
    document.getElementById("brightness").value = 0;
    var radios = document.getElementsByName('mode');
    radios[0].checked = true;
    radios[1].checked = false;
    radios = document.getElementsByName('color');
    radios[0].checked = false;
    radios[1].checked = false;
    radios = document.getElementsByName('filter');
    radios[0].checked = false;
    radios[1].checked = false;
    radios[2].checked = false;
    radios[3].checked = false;
    drawScene();
}

function saveScreenshot()
{
    var img = canvas.toDataURL("image/png");
    var link = document.createElement('a');
    link.download = "processed_output.png";
    link.href = img;
    link.click();
}

function processBackgroundImage(value)
{
    process = value;
    drawScene();
}