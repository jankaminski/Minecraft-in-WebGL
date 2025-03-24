#version 300 es

precision mediump float;

in vec2 fragTexCoord;
  
out vec4 color;

uniform sampler2D screenTexture;
uniform int menuHidden;
uniform int guiActive;

vec4 drawCrosshair(vec4 origColor) {
    vec4 pixelCoord = gl_FragCoord;
    vec4 color = vec4(origColor);
    if (pixelCoord.x > 490.0 && pixelCoord.x < 510.0 && pixelCoord.y > 290.0 && pixelCoord.y < 310.0) {
        if ((pixelCoord.x > 499.0 && pixelCoord.x < 501.0) || (pixelCoord.y > 299.0 && pixelCoord.y < 301.0)) {
            color.x = 1.0 - color.x;
            color.y = 1.0 - color.y;
            color.z = 1.0 - color.z;
        }
    }
    return color;
}

void main()
{ 
    color = texture(screenTexture, fragTexCoord);
    if (guiActive == 0) 
        color = drawCrosshair(color);
    if (menuHidden == 1) 
        color /= vec4(2.0, 2.0, 2.0, 1.0);
}