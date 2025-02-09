#version 300 es

precision mediump float;

in vec2 fragTexCoord;

out vec4 color;

uniform sampler2D sampler;
uniform float texAtlasNoOfRows;
uniform float texAtlasNoOfColumns;
uniform float particleID;
uniform float remainingLife;
uniform float lifespan;
uniform float noOfFrames;

void main()
{
    float normalizedRemainingLife = remainingLife / lifespan;
    float currentFrame = trunc(normalizedRemainingLife * noOfFrames);
    float x = (1.0 / texAtlasNoOfColumns) * (currentFrame + fragTexCoord.x);
    float y = (1.0 / texAtlasNoOfRows) * (particleID + fragTexCoord.y);
    vec2 texCoord = vec2(x, y);
    color = texture(sampler, texCoord);
    if (color.w == 0.0)
        discard;
}