// Tracking.js
// Version: 1.0.0
// Event: On Awake
// Description: Setup the tracking mode the lens uses

// This script contains intialization 
// For different platforms and levels of world tracking support

//@input bool forceTrackingMode {"label": "Force Tracking Quality"}
//@input string forcedTrackingMode {"showIf":"forceTrackingMode", "showIfValue":"true", "label": "Tracking Quality",  "widget":"combobox", "values":[{"label":"plane", "value":"plane"}, {"label":"surface", "value":"surface"}]}

const sceneObject = script.getSceneObject();
const tracking = sceneObject.getComponent("Component.DeviceTracking");
const camera = sceneObject.getComponent("Component.Camera");

const EPS = 0.0001;

const Tracking = {};

const camT = camera.getTransform();

Tracking.isThereWorldTracking = function() {
    if (script.forceTrackingMode && script.forcedTrackingMode == "surface") {
        return false;
    }
    return tracking.isDeviceTrackingModeSupported(DeviceTrackingMode.World);
};

Tracking.isThereWorldReconstruction = function() {
    if (script.forceTrackingMode && (script.forcedTrackingMode !== "")) {
        return false;
    }
    return tracking.worldTrackingCapabilities.sceneReconstructionSupported;
};

Tracking.hitTestPlane = function(screenPos, planePoint, planeNormal) {
    const rayOrigin = camT.getWorldPosition();
    const rayTarget = camera.screenSpaceToWorldSpace(screenPos, 10);
    const rayVec = rayTarget.sub(rayOrigin).normalize();
    const denom = planeNormal.dot(rayVec);
    if (Math.abs(denom) > EPS) {
        const difference = planePoint.sub(rayOrigin);
        const t = difference.dot(planeNormal) / denom;
        if (t > EPS) {
            const hit = rayOrigin.add(rayVec.uniformScale(t));
            return [{position: hit, normal: planeNormal}];
        }
    }
    return [];
};

function worldMeshHorizontalHittest(screenPos) {
    const allHits = tracking.hitTestWorldMesh(screenPos);
    return allHits.filter(function(hit) {
        // We are pretty liberal with closeness to `up` vec
        // To support non flat surfaces
        return vec3.up().dot(hit.normal) > 0.2;
    });
}

// We need to wrap in a function since native funciton can't be saved in a var
function planeTrackHittest(screenPos) {
    return tracking.hitTest(screenPos);
}

function surfaceTrackHittest(screenPos) {
    return Tracking.hitTestPlane(screenPos, new vec3(0,0,0), new vec3(0,1,0));
}

function initDeviceTracking() {
    if (!Tracking.isThereWorldTracking()) {
        tracking.requestDeviceTrackingMode(DeviceTrackingMode.Surface);
        Tracking.hitTest = surfaceTrackHittest;
    } else if (Tracking.isThereWorldReconstruction()) {
        Tracking.hitTest = worldMeshHorizontalHittest;
    } else {
        tracking.worldOptions.nativePlaneTrackingType = NativePlaneTrackingType.Horizontal;
        Tracking.hitTest = planeTrackHittest;
    }
    global.Tracking = Tracking;
}

initDeviceTracking();
