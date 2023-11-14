var gl;
var canvas;
var lightX = 0.0;
var nBounce= 0;
var shadowYes = 0;
var reflectionYes = 0;

const myVertexShaderCode = `#version 300 es
in vec3 aPosition;

void main() 
{
    gl_Position = vec4(aPosition,1.0);
}`;

const myFragmentShaderCode = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform int uShadowYes;
uniform int uReflectionYes;
uniform int uNBounce;
uniform float uLightX;
uniform int canvWidth;
uniform int canvHeight;

struct Sphere
{
    vec3 center;
    float radius;
    vec3 color;
    float shine;
};
struct Ray
{
    vec3 origin;
    vec3 direction;
};

void main() 
{
    fragColor = vec4(0.0,0.0,0.0,1.0);

    vec3 lightPos = vec3(uLightX,3.0,3.0);
    vec3 cameraPos = vec3(0.0,0.0,2.0);

    Sphere[4] spheres = Sphere[4](
        Sphere(vec3(0.0,-5.25,0.0), 5.0, vec3(0.75,0.75,0.75), 5.0),
        Sphere(vec3(0.0,0.4,0.5), 0.6, vec3(1.0,0.0,0.0), 10.0),
        Sphere(vec3(0.3,0.1,1.5), 0.2, vec3(0.0,0.0,1.0), 100.0),
        Sphere(vec3(-0.3,0.1,1.5), 0.2, vec3(0.0,1.0,0.0), 20.0)
    );

    Ray primaryRay;
    primaryRay.origin = cameraPos;
    vec2 screenPos = gl_FragCoord.xy/vec2(canvWidth, canvHeight);
    primaryRay.direction = normalize(vec3(screenPos * 2.0 - 1.0, -1.0));

    float minT = 1000000.0;
    int intersectedSphere = -1;
    for(int i=0; i<4; i++)
    {
        Sphere sphere = spheres[i];
        float a = dot(primaryRay.direction, primaryRay.direction);
        float b = 2.0 * dot(primaryRay.direction, primaryRay.origin - sphere.center);
        float c = dot(primaryRay.origin - sphere.center, primaryRay.origin - sphere.center) - sphere.radius * sphere.radius;
        float D = b * b - 4.0 * a * c;
        if(D > 0.0)
        {
            float t1 = (-b + sqrt(D)) / (2.0 * a);
            float t2 = (-b - sqrt(D)) / (2.0 * a);
            float t;
            if(t1 > 0.0 && t2 > 0.0)
            {
                t = min(t1, t2);
            }
            else if(t1 > 0.0)
            {
                t = t1;
            }
            else if(t2 > 0.0)
            {
                t = t2;
            }
            else
            {
                continue;
            }
            if(t < minT)
            {
                minT = t;
                intersectedSphere = i;
            }
        }
    }
    if(intersectedSphere != -1)
    {
        vec3 intersectionPoint = primaryRay.origin + minT * primaryRay.direction;
        vec3 normal = normalize(intersectionPoint - spheres[intersectedSphere].center);
        vec3 color = spheres[intersectedSphere].color;
        vec3 lightDir = normalize(lightPos - intersectionPoint);
        vec3 reflectedRay = reflect(primaryRay.direction, normal);
        vec3 viewDir = normalize(cameraPos - intersectionPoint);
        vec3 ambient = color;
        vec3 diffuse = color * max(dot(lightDir, normal), 0.0);
        vec3 specular = vec3(1.0,1.0,1.0) * pow(max(dot(reflectedRay, lightDir), 0.0), spheres[intersectedSphere].shine);
        Ray shadowRay;
        shadowRay.origin = intersectionPoint + 0.0001 * lightDir;
        shadowRay.direction = lightDir;
        bool shadowIntersect = false;
        for(int i=0; i<4; i++)
        {
            Sphere sphere = spheres[i];
            float a = dot(shadowRay.direction, shadowRay.direction);
            float b = 2.0 * dot(shadowRay.direction, shadowRay.origin - sphere.center);
            float c = dot(shadowRay.origin - sphere.center, shadowRay.origin - sphere.center) - sphere.radius * sphere.radius;
            float D = b * b - 4.0 * a * c;
            if(D > 0.0)
            {
                float t1 = (-b + sqrt(D)) / (2.0 * a);
                float t2 = (-b - sqrt(D)) / (2.0 * a);
                if(t1 > 0.0 || t2 > 0.0)
                {
                    shadowIntersect = true;
                    break;
                }
            }
        }
        if(shadowIntersect)
        {
            diffuse = vec3(0.0,0.0,0.0);
            specular = vec3(0.0,0.0,0.0);
        vec3 finalColor = 0.5*diffuse + 0.2*ambient + specular;
        fragColor = vec4(finalColor, 1.0);
    }
        vec3 finalColor = 0.5*diffuse + 0.2*ambient + 0.8*specular;
        fragColor = vec4(finalColor, 1.0);
    }
}`;

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
    }
    catch (e) { }
    if (!gl)
    {
        alert("WebGL initialization failed");
    }
}

function drawScene()
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(myTextureShaderProgram);
    setupShader(myTextureShaderProgram);

    const bufData = new Float32Array([-1, 1, 0, 1, 1, 0, -1, -1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0,]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, bufData, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(myTextureShaderProgram, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function webGLStart()
{
    canvas = document.getElementById("Assignment5");
    initGL();
    myTextureShaderProgram = initShaders(myVertexShaderCode, myFragmentShaderCode);
    gl.enable(gl.DEPTH_TEST);
    drawScene();
}

function setupShader(shaderProgram)
{
    const uShadowYes = gl.getUniformLocation(shaderProgram, "uShadowYes");
    gl.uniform1i(uShadowYes, shadowYes);
    const uReflectionYes = gl.getUniformLocation(shaderProgram, "uReflectionYes");
    gl.uniform1i(uReflectionYes, reflectionYes);
    const uNBounce = gl.getUniformLocation(shaderProgram, "uNBounce");
    gl.uniform1i(uNBounce, nBounce);
    const uLightX = gl.getUniformLocation(shaderProgram, "uLightX");
    gl.uniform1f(uLightX, lightX);
    const canvWidth = gl.getUniformLocation(shaderProgram, "canvWidth");
    gl.uniform1i(canvWidth, canvas.width);
    const canvHeight = gl.getUniformLocation(shaderProgram, "canvHeight");
    gl.uniform1i(canvHeight, canvas.height);
}

function changeLightPosition(x)
{
    lightX = x;
    drawScene();
}

function changeBounceLimit(x)
{
    nBounce = x;
    drawScene();
}

function changeShadingMode(x)
{
    if(x==0)
    {
        shadowYes = 0;
        reflectionYes = 0;
    }
    else if(x==1)
    {
        shadowYes = 1;
        reflectionYes = 0;
    }
    else if(x==2)
    {
        shadowYes = 0;
        reflectionYes = 1;
    }
    else if(x==3)
    {
        shadowYes = 1;
        reflectionYes = 1;
    }
    drawScene();
}