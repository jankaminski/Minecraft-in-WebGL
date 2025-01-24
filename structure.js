class Structure extends VoxelBox {
    constructor(jsonData) {
        super(jsonData.size.x, jsonData.size.y, jsonData.size.z)
        this.blocks = jsonData.blocks;
        this.size = jsonData.size;
        this.root = jsonData.root;
    }
}

/*async function loadStructures(url) {
    const data = await loadMeshDataFromJSON(url);
    return new Structure(data);
}*/

let treeData = {
    blocks : [
        0, 0, 0, 0, 0, 0, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,

        0, 3, 3, 3, 3, 3, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,

        0, 3, 3, 3, 3, 3, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,

        0, 3, 3, 3, 3, 3, 0,
        3, 3, 3, 1, 3, 3, 3,
        3, 3, 3, 1, 3, 3, 3,
        0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 1, 0, 0, 0,

        0, 3, 3, 3, 3, 3, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,

        0, 3, 3, 3, 3, 3, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0,
        3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0

    ],
    size : { 
        x : 7,
        y : 6,
        z : 7
    },
    root : {
        x : 3,
        y : 0,
        z : 3
    }
};

let OAK_TREE = new Structure(treeData);//await loadStructures("./res/oak-tree.json");