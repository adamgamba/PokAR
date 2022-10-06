// AccurateSizeItem.js
// Version: 1.0.0
// Event: On Awake
// Description: Add mesh properties to a scene object such as the aabb and filling spheres


const sceneObject = script.getSceneObject();
sceneObject.touchedItem = false;
const interaction = sceneObject.getComponent("Component.InteractionComponent");

const meshes = [];
var aabb = undefined;
var fillSpheres =  undefined;
var touchedItem = false;

function collectMeshes() {
    var nextRoots = [sceneObject];
    while (nextRoots.length > 0) {
        const root = nextRoots.pop();
        const count = root.getChildrenCount();
        for (var i = 0; i < count; ++i) {
            const child = root.getChild(i);
            if (child.enabled) {
                const currMeshes = child.getComponents("Component.RenderMeshVisual");
                currMeshes.forEach(function(mesh) {
                    meshes.push(mesh);
                });
                nextRoots.push(child);
            }
        }
    }
}

function defineMeshProps() {
    meshes.forEach(function(mesh) {
        // Make the Item cast shadows
        mesh.meshShadowMode = 1;
        
        // We make alpha of mesh rendered.
        // This is used to display item with half transparancy
        // While scan message is dispalyed.
        const newMask = mesh.mainPass.colorMask;
        newMask.w = true;
        mesh.mainPass.colorMask = newMask;

        // Make mesh detect touches.
        // Used for dragging the item.
        interaction.addMeshVisual(mesh);
    });
}

function calcAabb() {

    var aabbMin = new vec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    var aabbMax = new vec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    meshes.forEach(function(mesh) {
        const wAabbMin = mesh.worldAabbMin();
        const wAabbMax = mesh.worldAabbMax();
        aabbMin = new vec3(
            Math.min(wAabbMin.x, aabbMin.x),
            Math.min(wAabbMin.y, aabbMin.y),
            Math.min(wAabbMin.z, aabbMin.z)
        );
        aabbMax = new vec3(
            Math.max(wAabbMax.x, aabbMax.x),
            Math.max(wAabbMax.y, aabbMax.y),
            Math.max(wAabbMax.z, aabbMax.z)
        );
    });

    // Calculate the lines of the bbox (Can be used to draw it)
    const xs = [aabbMin.x, aabbMax.x];
    const ys = [aabbMin.y, aabbMax.y];
    const zs = [aabbMin.z, aabbMax.z];

    const linesIndices = [
        [[0,0,0], [0,0,1]],
        [[0,0,0], [0,1,0]],
        [[0,0,0], [1,0,0]],
        [[0,0,1], [0,1,1]],
        [[0,0,1], [1,0,1]],
        [[0,1,0], [0,1,1]],
        [[0,1,0], [1,1,0]],
        [[0,1,1], [1,1,1]],
        [[1,0,0], [1,0,1]],
        [[1,0,0], [1,1,0]],
        [[1,0,1], [1,1,1]],
        [[1,1,0], [1,1,1]]];

    const lines = [];
    linesIndices.forEach(function(row) {
        lines.push([
            new vec3(xs[row[0][0]], ys[row[0][1]], zs[row[0][2]]),
            new vec3(xs[row[1][0]], ys[row[1][1]], zs[row[1][2]]),
        ]);

    });

    aabb = {
        "min": aabbMin,
        "max": aabbMax,
        "lines": lines,
        "center": aabbMin.add(aabbMax).uniformScale(0.5)
    };
}

function calcFillSpheres() {
    const diff = aabb.max.sub(aabb.min);
    const radius = Math.min(diff.x, diff.y, diff.z) * 0.5;

    const centers = [];
    for (var cX = radius; cX < diff.x; cX += 2 * radius) {
        for (var cY = radius; cY < diff.y; cY += 2 * radius) {
            for (var cZ = radius; cZ < diff.z; cZ += 2 * radius) {
                centers.push(
                    aabb.min.add(new vec3(cX, cY, cZ)));
            }
        }
    }
    fillSpheres = {
        radius: radius,
        centers: centers
    };
}

collectMeshes();
defineMeshProps();
calcAabb();
calcFillSpheres();

script.api.getAabb = function() {
    return aabb;
};

script.api.getFillSpheres = function() {
    return fillSpheres;
};

script.api.isItemTouched = function() {
    return touchedItem;
};


script.createEvent("TouchStartEvent").bind(function(eventData) {
    touchedItem = true;
});

script.createEvent("TouchEndEvent").bind(function(eventData) {
    touchedItem = false;
});
