#version 300 es

layout (location = 0) in vec3 vertPosition;
layout (location = 1) in vec2 vertTexCoord;

out vec2 fragTexCoord;

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

void main()
{
    fragTexCoord = vertTexCoord;
    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0); 
}  