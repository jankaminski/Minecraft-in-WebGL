class BlockTextureAtlas extends TextureAtlas {
    constructor(gl) {
        super(gl, 
            gl.CLAMP_TO_EDGE, 
            gl.NEAREST, 
            BLOCK_PIXELS, 
            BLOCK_PIXELS, 
            BLOCK_TEX_ATLAS_COLUMNS, 
            BLOCK_TEX_ATLAS_ROWS);
    }
    addBlock(gl, blockID, ...images) {
        if (images.length != 6 && images.length != 1) 
            throw "BLEH";
        for (let i = 0; i < 6; i++) {
            let image;
            if (images.length === 1)
                image = images[0];
            else
                image = images[i];
            this.addTile(gl, image, i, blockID);
        }
        return this;
    }
}

class FPSCounter {
    constructor() {
        this.msPrev = window.performance.now();
        this.fps = 60;
        this.msPerFrame = 1000 / this.fps;
        this.frames = 0;
    }
    reset() {
        this.frames = 0;
    }
    update() {
        const msNow = window.performance.now();
        const msPassed = msNow - this.msPrev;
        let limitPassed = false;
        if (msPassed < this.msPerFrame) 
            limitPassed = true;
        const excessTime = msPassed % this.msPerFrame;
        this.msPrev = msNow - excessTime;
        if (!limitPassed)
            this.frames++;
    }
    framesPassed() {
        return this.frames;
    }
}

function initWebGL() {
    let canvas = document.getElementById('game-surface');
    let gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 not supported, falling back on experimental");
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl)
        alert('Your browser does not support WebGL');
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    return { canvas, gl };
}

async function run() {
    let { canvas, gl } = initWebGL();

    const PROJECTION_MATRIX = Mat4.perspective(Math.PI / 6, canvas.clientWidth, canvas.clientHeight, 0.1, 1000.0);
    
    let terrainProgram;// = await makeChunkShaderProgram(gl, PROJECTION_MATRIX);
    let entityProgram;// = await makeEntityShaderProgram(gl, PROJECTION_MATRIX);

    terrainProgram = new ShaderProgram(
        gl,
        `#version 300 es

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
	gl_Position = mProj * mView * vec4(fragPos, 1.0); 
}`,
`#version 300 es

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
`
    );
    entityProgram = new ShaderProgram(
        gl,
        `#version 300 es

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
}`,
        `#version 300 es

precision mediump float;

in vec2 fragTexCoord;

out vec4 color;

uniform sampler2D sampler;

void main()
{
    vec2 texCoord = fragTexCoord;
    color = texture(sampler, texCoord);
}
`
    );
    
    const oakLogTopTexImage = await loadImage('/res/oak_log_top.png');
    const oakLogTexImage = await loadImage('/res/oak_log.png');
    const cobbleTexImage = await loadImage('/res/cobblestone.png');
    const mossyCobbleTexImage = await loadImage('/res/mossy_cobblestone.png');
    const oakPlanksTexImage = await loadImage('/res/oak_planks.png');
    const dirtTexImage = await loadImage('/res/dirt.png');
    const grassSideTexImage = await loadImage('/res/grass_block_side.png');
    const grassTopTexImage = await loadImage('/res/grass_block_top.png');
    
    const BLOCK_TEXTURE_ATLAS = new BlockTextureAtlas(gl)
    .addBlock(
        gl, 
        Block.OAK_LOG, 
        oakLogTexImage, 
        oakLogTexImage, 
        oakLogTopTexImage, 
        oakLogTopTexImage, 
        oakLogTexImage, 
        oakLogTexImage)
    .addBlock(
        gl, 
        Block.COBBLESTONE, 
        cobbleTexImage)
    .addBlock(
        gl, 
        Block.MOSSY_COBBLE, 
        mossyCobbleTexImage)   
    .addBlock(
        gl, 
        Block.OAK_PLANKS, 
        oakPlanksTexImage)
    .addBlock(
        gl, 
        Block.DIRT, 
        dirtTexImage)
    .addBlock(
        gl, 
        Block.GRASS, 
        grassSideTexImage, 
        grassSideTexImage, 
        grassTopTexImage, 
        dirtTexImage, 
        grassSideTexImage, 
        grassSideTexImage);

    const creeperTexImage = await loadImage('/res/creeper.png');    
    const CREEPER_MESH_DATA = await loadMeshDataFromJSON("/res/creeper-vertices.json");
    const CREEPER_TEXTURE = make2DTexFromImage(gl, gl.CLAMP_TO_EDGE, gl.NEAREST, creeperTexImage);
    const CREEPER_MODEL = new Model(makeEntityMesh(gl, CREEPER_MESH_DATA), CREEPER_TEXTURE);

    let level = new Level(
        BLOCK_TEXTURE_ATLAS, 
        new Player(2, 70, 2, CREEPER_MODEL), 
        new Creeper(14, 90, -14, CREEPER_MODEL),
        new Creeper(9, 90, -12, CREEPER_MODEL),
        new Creeper(6, 90, -7, CREEPER_MODEL),
        new Creeper(12, 90, -3, CREEPER_MODEL),
        new Creeper(-26, 80, 20, CREEPER_MODEL),
        new Creeper(-17, 80, 28, CREEPER_MODEL),
        new Creeper(-22, 80, 30, CREEPER_MODEL),
        new Creeper(-20, 80, 24, CREEPER_MODEL)
    );

    let fpsCounter = new FPSCounter();

    let loop = () => {
        level.update(gl);
        level.render(gl, terrainProgram, entityProgram);
        requestAnimationFrame(loop);
        fpsCounter.update();
    };
    setInterval(() => {
        console.log(fpsCounter.framesPassed());
        fpsCounter.reset();
    }, 1000);
    loop();
}

run();