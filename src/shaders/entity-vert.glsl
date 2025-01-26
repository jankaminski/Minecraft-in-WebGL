#version 300 es

layout (location = 0) in vec3 vertPosition;
layout (location = 1) in vec2 vertTexCoord;
layout (location = 2) in float vertJointIndex;

out vec2 fragTexCoord;

const int MAX_LIMBS = 30;

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 limbMatrices[MAX_LIMBS];

void main()
{
    fragTexCoord = vertTexCoord;
    mat4 world = limbMatrices[int(vertJointIndex)];
    gl_Position = mProj * mView * world * vec4(vertPosition, 1.0);
}