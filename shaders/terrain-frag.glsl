#version 300 es

precision mediump float;

in vec2 fragTexCoord;

in float blockID;
in float faceID;

out vec4 color;

uniform sampler2D sampler;
uniform float texAtlasNoOfRows;
uniform float texAtlasNoOfColumns;

void main()
{
    float x = (1.0 / texAtlasNoOfColumns) * (faceID + fragTexCoord.x);
    float y = (1.0 / texAtlasNoOfRows) * (blockID + fragTexCoord.y);
    vec2 texCoord = vec2(x, y);
    color = texture(sampler, texCoord);
    if (blockID == 6.0 && faceID == 2.0) 
        color *= vec4(0.61f, 0.96f, 0.07f, 1.0f);
}
