#version 300 es

struct Vertex {
	vec3 position;
	vec2 texCoords;
};

const Vertex VERTICES_TEMPLATE[24] = Vertex[24](
	Vertex(vec3( 0.5,  0.5,  0.5), vec2(0.0, 0.0)),
	Vertex(vec3( 0.5,  0.5, -0.5), vec2(1.0, 0.0)),
	Vertex(vec3( 0.5, -0.5,  0.5), vec2(0.0, 1.0)),
	Vertex(vec3( 0.5, -0.5, -0.5), vec2(1.0, 1.0)),

	Vertex(vec3(-0.5,  0.5, -0.5), vec2(0.0, 0.0)),
	Vertex(vec3(-0.5,  0.5,  0.5), vec2(1.0, 0.0)),
	Vertex(vec3(-0.5, -0.5, -0.5), vec2(0.0, 1.0)),
	Vertex(vec3(-0.5, -0.5,  0.5), vec2(1.0, 1.0)),

	Vertex(vec3(-0.5,  0.5, -0.5), vec2(0.0, 0.0)),
	Vertex(vec3( 0.5,  0.5, -0.5), vec2(1.0, 0.0)),
	Vertex(vec3(-0.5,  0.5,  0.5), vec2(0.0, 1.0)),
	Vertex(vec3( 0.5,  0.5,  0.5), vec2(1.0, 1.0)),

	Vertex(vec3( 0.5, -0.5, -0.5), vec2(0.0, 0.0)),
	Vertex(vec3(-0.5, -0.5, -0.5), vec2(1.0, 0.0)),
	Vertex(vec3( 0.5, -0.5,  0.5), vec2(0.0, 1.0)),
	Vertex(vec3(-0.5, -0.5,  0.5), vec2(1.0, 1.0)),

	Vertex(vec3(-0.5,  0.5,  0.5), vec2(0.0, 0.0)),
	Vertex(vec3( 0.5,  0.5,  0.5), vec2(1.0, 0.0)),
	Vertex(vec3(-0.5, -0.5,  0.5), vec2(0.0, 1.0)),
	Vertex(vec3( 0.5, -0.5,  0.5), vec2(1.0, 1.0)),

	Vertex(vec3( 0.5,  0.5, -0.5), vec2(0.0, 0.0)),
	Vertex(vec3(-0.5,  0.5, -0.5), vec2(1.0, 0.0)),
	Vertex(vec3( 0.5, -0.5, -0.5), vec2(0.0, 1.0)),
	Vertex(vec3(-0.5, -0.5, -0.5), vec2(1.0, 1.0))
);

layout (location = 0) in vec3 data;

out vec2 fragTexCoord;

uniform mat4 mProj;
uniform mat4 mView;

uniform int CHUNK_WIDTH_IN_BLOCKS;
uniform int CHUNK_HEIGHT_IN_BLOCKS;
uniform int BLOCK_SIZE;

uniform int highlightedBlockIndex;
uniform float blockBreakProgress;
uniform vec3 chunkPosition;

vec3 fetchBlockPosition(int index) {
	int chunkSquared = CHUNK_HEIGHT_IN_BLOCKS * CHUNK_WIDTH_IN_BLOCKS;
	int x = index / chunkSquared;
	int yandz = index % chunkSquared;
	int y = yandz / CHUNK_WIDTH_IN_BLOCKS;
	int z = yandz % CHUNK_WIDTH_IN_BLOCKS;
	return vec3(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
}

out float blockID;
out float faceID;
out float highlight;

void main()
{
	int vertexIndex = int(data.x);
	int blockIndex = int(data.y);
	blockID = data.z;
	int id = vertexIndex / 4;
	faceID = float(id);
	vec3 blockPosition = fetchBlockPosition(blockIndex);
	Vertex vertex = VERTICES_TEMPLATE[vertexIndex];
	vec3 fragPos = vertex.position + blockPosition + chunkPosition + (0.5 * float(BLOCK_SIZE));
	fragTexCoord = vertex.texCoords;
	if (blockIndex == highlightedBlockIndex)
		highlight = 0.2 + blockBreakProgress * 0.2;
	else
		highlight = 0.0;
	gl_Position = mProj * mView * vec4(fragPos, 1.0); 
}