#version 300 es

precision mediump float;

in vec2 fragTexCoord;

out vec4 color;

uniform sampler2D sampler;

void main()
{
    vec2 texCoord = fragTexCoord;
    color = texture(sampler, texCoord);
}
