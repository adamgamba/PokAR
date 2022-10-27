// ItemPlacement.js
// Version: 1.0.0
// Event: On Awake
// Description: Main logic of item placement interaction

// The item will go through barriers (such as walls) instead of getting stuck (default off)
//@input bool endlessSurfaces

// The item bounces back when dragged over the edge in a spring-like manner (default on).
//@input bool edgeSprings {"showIf":"endlessSurfaces", "showIfValue":"false"}

//@ui {"widget":"group_start", "label":"Advanced"}
//@input Component.Camera camera
//@input Component.Camera initialCamera
//@input SceneObject searchMessage
//@input Component.Script accurateScaleItem
//@input SceneObject worldMesh
//@input SceneObject shadowPlane
//@input SceneObject objectPointer
//@ui {"widget":"group_end"}




// Constants
const itemToPlace = script.accurateScaleItem.getSceneObject();
const itemT = itemToPlace.getTransform();
const camT = script.camera.getTransform();
const itemAnchor = itemToPlace.getParent();
const anchorT = itemAnchor.getTransform();

const liftHeight = 14;
const springK = 0.01; // higher is stronger
const maxItemDist = 1000; // Max item dist form camera is 10m do avoid clip plane issues

//------------------------------------

function getClosestHit(screenPos) {
    const hits = global.Tracking.hitTest(screenPos);
    const camPos = script.camera.getTransform().getWorldPosition();
    
    var closestHit = undefined;
    var closestDiff = Infinity;
    hits.forEach(function(hit) {
        const hitPos = hit.position;
        const diff = camPos.sub(hitPos).length;
        const distToCam =  hitPos.sub(camPos).length;
        if ((diff < closestDiff) && (distToCam < maxItemDist)) {
            closestHit = hitPos;
            closestDiff = diff;
        }
    });
    return closestHit;
}

function placeItem(pos) {
    if (camT.getWorldPosition().sub(pos).length < maxItemDist) {
        anchorT.setWorldPosition(pos);
    }
}
function itemPos() {
    return anchorT.getWorldPosition();
}

function lastSingleTouch() {
    if (global.TouchUI.state == "drag" || global.TouchUI.state == "start_drag") {
        return global.TouchUI.touches[0].curr;
    } else if (global.TouchUI.tapped) {
        return global.TouchUI.tapPos;
    }
    return undefined;
}


function setItemLift(lift) {
    var py = itemT.getLocalPosition().y;
    new TWEEN.Tween({y: py})
        .to({y:lift}, 300)
        .easing(TWEEN.Easing.Quartic.Out)
        .onUpdate(function(obj) {
            itemT.setLocalPosition(new vec3(0, obj.y, 0));
        })
        .start();
}

function searchHitGrid() {
    /*
     * The search grid is used to find a vacant place to put the item initially.
     *
     * The algorithm works as follows:
     *  1. Define a grid of 2D points filling the screen
     *  2. Shoot a ray out of each point in the grid and perform a hit test
     *     Against the mesh/plane
     *  3. Search if there is a group of hits that are adjacent in the grid and has a 
     *     small height difference (determined by the item size)
     *  4. If there are several potential positions, prefer the once closest to the center.
     */
    var foundHits = {};
    const width = 10;
    const height = 10;
    const hPortion = 0.8;
    const wPortion = 0.8;
    const kernel = 2;
    const itemAabb = script.accurateScaleItem.api.getAabb();
    const aabbLen = itemAabb.min.distance(itemAabb.max);

    const center = new vec2(width / 2, height / 2);

    var row; // Defining on top of function due to JS function scope
    var col; // Defining on top of function due to JS function scope

    for (row = 0; row < height; row++) {
        for (col = 0; col < width; col++) {
            const p2d = new vec2(
                0.5 * (1 - wPortion) + wPortion * (col / (width -1)),
                0.5 * (1 - hPortion) + hPortion * (row / (height - 1)));
            const hit = getClosestHit(p2d);
            if (hit) {
                foundHits[[row, col]] = hit;
            }
        }
    }


    var maxPer = 0;
    var shortestDist = Infinity;
    var bestHit = undefined;

    for (row = 0; row < height; row++) {
        for (col = 0; col < width; col++) {
            var totalNeighbors = 0;
            var existingNeightbors = 0;

            const hit = foundHits[[row, col]];

            if (hit) {
                for (var dr = -kernel; dr <= kernel; dr++) {
                    for (var dc = -kernel; dc <= kernel; dc++) {
                        if (!(dr == 0 && dc == 0)) {
                            totalNeighbors++;
                            const neighborHit = foundHits[[row + dr, col + dc]];
                            if (neighborHit) {
                                const yDist = Math.abs(neighborHit.y - hit.y);
                                if (yDist < aabbLen) {
                                    existingNeightbors++;
                                }
                            } 
                        }
                    }
                }
                const perExisting = existingNeightbors / totalNeighbors;

                if (perExisting > maxPer) {
                    maxPer = perExisting;
                    bestHit = hit;
                } else if (perExisting == maxPer) {
                    const distToCenter = center.distance(new vec2(col, row));
                    if (distToCenter < shortestDist) {
                        shortestDist = distToCenter;
                        bestHit = hit;
                    }
                }
            }
        }
    }
    if (bestHit) {
        return {density: maxPer, hit: bestHit};
    }
}
function itemReveal() {
    // calculate source and target rotation
    const camPos = script.camera.getTransform().getWorldPosition();
    const direction = camPos.sub(anchorT.getWorldPosition());
    var targetRot = quat.lookAt(new vec3(direction.x, 0, direction.z), new vec3(0, 1, 0));
    var sourceRot = targetRot.multiply(quat.angleAxis(-0.5*Math.PI, new vec3(0, 1, 0)));
    
    // animate scale and rotation
    anchorT.setLocalScale(new vec3(0,0,0));
    new TWEEN.Tween({s: 0, r: 0})
        .to({s: 1, r: 1}, 600)
        .easing(TWEEN.Easing.Quartic.Out)
        .onUpdate(function(obj) {
            anchorT.setLocalScale(new vec3(obj.s, obj.s, obj.s));
            anchorT.setWorldRotation(quat.lerp(sourceRot, targetRot, obj.r));
        })
        .start();
    
    setItemLift(liftHeight);
}

const frameData = {angle: 0};

function placeForCam(camera) {
    const placeT = camera.getTransform();
    anchorT.setWorldTransform(placeT.getWorldTransform());
    const itemAabb = script.accurateScaleItem.api.getAabb();
    const width = itemAabb.max.x - itemAabb.min.x;
    const height = itemAabb.max.y - itemAabb.min.y;
    const depth = itemAabb.max.z - itemAabb.min.z;

    const screenPoints = {
        "left": new vec2(0.1, 0.5),
        "up": new vec2(0.5, 0.15),
        "middle": new vec2(0.5, 0.5)
    };

    const rays = {};
    for (var pName in screenPoints) {
        const p = screenPoints[pName];
        const p3d = camera.screenSpaceToWorldSpace(p, 1);
        const ray = p3d.sub(placeT.getWorldPosition());
        rays[pName] = ray.normalize();
    }

    const alpha_w = Math.acos(rays["left"].dot(rays["middle"]));
    const alpha_h = Math.acos(rays["up"].dot(rays["middle"]));

    const dist_w = width * 0.5 / Math.tan(alpha_w) + depth * 0.5;
    const dist_h = height / Math.tan(alpha_h) + depth * 0.5;
    const dist = Math.max(dist_w, dist_h);


    anchorT.setWorldPosition(placeT.getWorldPosition().add(placeT.forward.uniformScale(-dist)));


    const baseRotDir = placeT.getWorldPosition().sub(anchorT.getWorldPosition());
    const baseRot = quat.lookAt(baseRotDir, placeT.up);
    const xRot = quat.angleAxis(0.15 * Math.PI, placeT.right);
    anchorT.setLocalRotation(xRot.multiply(baseRot));
}


const states = {
    "camera_front": function() {
        if (global.TouchUI.cameraState == "back") {
            return "init_search";
        }
        itemAnchor.enabled = false;
        itemToPlace.enabled = false;
        script.searchMessage.enabled = false;
        return "camera_front";
    },
    "init_search": function() {
        if (global.Tracking.isThereWorldReconstruction()) {
            script.worldMesh.enabled = true;
        } else {
            script.worldMesh.enabled = false;
        }
        itemAnchor.enabled = true;
        itemToPlace.enabled = true;
        script.searchMessage.enabled = true;
        return "search";
    },
    "search": function() {
        script.shadowPlane.enabled = false;
        script.objectPointer.enabled = false;

        const searchResult = searchHitGrid();
        placeForCam(script.initialCamera);
        if (searchResult && searchResult.density > 0.9) {
            
            script.initialCamera.getSceneObject().enabled = false;
            
            script.searchMessage.enabled = false;
            itemAnchor.enabled = true;

            frameData.lastHit = searchResult.hit;
            placeForCam(script.camera);

            const itemP = anchorT.getWorldPosition();
            const camP = camT.getWorldPosition();
            const lookDir = camP.sub(itemP).mult(new vec3(1, 0, 1));
            anchorT.setWorldRotation(quat.lookAt(lookDir, vec3.up()));

            script.objectPointer.enabled = true;
            script.shadowPlane.enabled = true;
            return "item_placement";
        } 

        return "search";
    },
    "item_placement": function() {
        if (frameData.lastHit) {
            const itemP = anchorT.getWorldPosition();

            anchorT.setWorldPosition(
                itemP.add(
                    frameData.lastHit.sub(itemP).uniformScale(0.25)
                ));
        }
        if (global.TouchUI.state == "start_drag") {
            // drag
            const lastTouch = lastSingleTouch();
            if (script.accurateScaleItem.api.isItemTouched()) {
                const itemPosS = script.camera.worldSpaceToScreenSpace(itemPos());
                frameData.dragDiff = itemPosS.sub(lastTouch);                
                setItemLift(liftHeight);
                return "dragging";
            } else {
                frameData.lastHit = getClosestHit(lastTouch);
                if (frameData.lastHit) {
                    placeItem(frameData.lastHit);
                    frameData.dragDiff = new vec2(0, 0);                
                    itemReveal();
                    return "dragging";
                }
            }
        } else if (global.TouchUI.state == "double_drag") {
            // rotate
            frameData.itemRot = anchorT.getWorldRotation();
            setItemLift(liftHeight);
            frameData.t0Start = global.TouchUI.touches[0].curr;
            return "rotating";
        }

        return "item_placement";
    },
    "dragging": function() {
        if (global.TouchUI.state == "double_drag") {
            // rotate
            frameData.itemRot = anchorT.getWorldRotation();
            // This is needed since t0.start of dragging is different
            frameData.t0Start = global.TouchUI.touches[0].curr;
            return "rotating";
        }
        if (global.TouchUI.state == "drag" || global.TouchUI.state == "start_drag" || global.TouchUI.tapped) {
            const screenPos = lastSingleTouch().add(frameData.dragDiff);
            const closestHit = getClosestHit(screenPos);
            if (closestHit) {
                // We need to save last closest hit
                // So the item will lerp to it if there
                // isn't a hit in current frame
                frameData.lastHit = closestHit;
                frameData.lastScreenPos = screenPos;
            } else if ((script.endlessSurfaces || script.edgeSprings) && frameData.lastHit) {
                const virtualHit = global.Tracking.hitTestPlane(screenPos, frameData.lastHit, new vec3(0, 1, 0));
                if (virtualHit.length>0) {
                    if (script.endlessSurfaces) {
                        placeItem(virtualHit[0].position);
                    } else if (script.edgeSprings) {
                        // Spring behavior when no hit, hit test with a virtual plane
                        const vec = virtualHit[0].position.sub(frameData.lastHit);
                        const force = screenPos.sub(frameData.lastScreenPos).length;
                        const length = force / springK;
                        placeItem(frameData.lastHit.add(vec.normalize().uniformScale(length)));
                    }
                }
                return "dragging";
            }

            if (frameData.lastHit) {
                const itemP = anchorT.getWorldPosition();
                const diff = frameData.lastHit.sub(itemP);
                const newPos = itemP.add(diff.uniformScale(0.5));
                placeItem(newPos);
            }
            return "dragging";
        } else {
            // touch up
            setItemLift(0);
            return "item_placement";
        }
    },
    "rotating": function() {
        if (global.TouchUI.state == "drag" || global.TouchUI.state == "start_drag")  {
            const itemPosS = script.camera.worldSpaceToScreenSpace(itemPos());
            frameData.dragDiff = itemPosS.sub(lastSingleTouch());                
            return "dragging";
        }
        if (global.TouchUI.state == "double_drag") {
            const t0 = global.TouchUI.touches[0];
            const t1 = global.TouchUI.touches[1];

            const vStart = t1.start.sub(frameData.t0Start);
            const vCurr = t1.curr.sub(t0.curr);

            const currRot = quat.rotationFromTo(new vec3(vStart.x, 0, vStart.y), new vec3(vCurr.x, 0, vCurr.y));
            anchorT.setWorldRotation(
                currRot.multiply(frameData.itemRot));
            return "rotating";
        } else {
            setItemLift(0);
            return "item_placement";
        }
    }
};

var state = "init_search";

script.createEvent("UpdateEvent").bind(function(eventData) {
    if (global.TouchUI.cameraState == "front") {
        state = "camera_front";
    }
    const nextState = states[state]();
    frameData.prevState = state;
    state = nextState;
});
