#version 300 es

layout (location = 0) in vec2 vertPosition;
//layout (location = 1) in vec2 vertTexCoord;

//out vec2 fragTexCoord;

void main()
{
    //fragTexCoord = vertTexCoord;
    gl_Position = vec4(vertPosition.x, vertPosition.y, 0.0, 1.0); 
}  