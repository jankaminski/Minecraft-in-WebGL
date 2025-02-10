#version 300 es

precision mediump float;
  
out vec4 color;

uniform sampler2D sampler;
uniform float texAtlasNoOfRows;
uniform float texAtlasNoOfColumns;
uniform float blockID;
uniform vec2 pixel;

void main()
{ 
    float x = (1.0 / texAtlasNoOfColumns) * (5.0 * pixel.x);
    float y = (1.0 / texAtlasNoOfRows) * (blockID + pixel.y);
    vec2 texCoord = vec2(x, y);
    color = texture(sampler, texCoord);
    if (color.w == 0.0)
        discard;
    if (blockID == 7.0) 
        color *= vec4(0.61f, 0.96f, 0.07f, 1.0f);
}