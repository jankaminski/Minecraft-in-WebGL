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
uniform vec3 chunkPosition;

// y z x
// x y z

vec3 fetchBlockPosition(int index) {
	int chunkSquared = CHUNK_HEIGHT_IN_BLOCKS * CHUNK_WIDTH_IN_BLOCKS;
	int x = index / chunkSquared;
	int yandz = index % chunkSquared; //index - (y * chunkSquared);
	int y = yandz / CHUNK_WIDTH_IN_BLOCKS;
	int z = yandz % CHUNK_WIDTH_IN_BLOCKS; // xandz - (z * chunkSize);
	return vec3(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
}

out float blockID;
out float faceID;
out float highlighted;

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
	//fragPos.y++;
	fragTexCoord = vertex.texCoords;
	if (blockIndex == highlightedBlockIndex)
		highlighted = 1.0;
	else
		highlighted = 0.0;
	gl_Position = mProj * mView * vec4(fragPos, 1.0); 
}