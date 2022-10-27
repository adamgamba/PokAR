// PointToObject.js
// Version: 1.0.0
// Event: On Awake
// Description: A 2D screen arrow pointing to a 3d world object when it's out of scene

//@input Component.Camera cam
//@input float radius
//@input Component.Script accurateScaleItem


var allDefined = true;
["cam", "accurateScaleItem"].forEach(function(attr) {
    if (script[attr] === undefined) {
        print("ERROR: input variable " + attr + " is missing");
        allDefined = false;
    }
});

if (!allDefined) {
    return;
}

const sceneObject = script.getSceneObject();
const screenTransform = sceneObject.getComponent("Component.ScreenTransform");
const image = sceneObject.getComponent("Component.Image");

const trackedSceneObject = script.accurateScaleItem.getSceneObject();

const camT = script.cam.getTransform();
const itemT = trackedSceneObject.getTransform();
const initialRot = screenTransform.rotation;

script.createEvent("UpdateEvent").bind(function(eventData) {

    image.enabled = false;
    var isVisible = false;

    script.accurateScaleItem.api.getFillSpheres().centers.forEach(function(c) {
        const cT = itemT.getWorldTransform().multiplyPoint(c);
        const r = script.accurateScaleItem.api.getFillSpheres().radius;
        isVisible |= script.cam.isSphereVisible(cT, r);
    });

    const itemCenter = (itemT
        .getWorldTransform()
        .multiplyPoint(script.accurateScaleItem.api.getAabb().center));


    if (isVisible) {
        return;
    }

    if (!trackedSceneObject.enabled) {
        return;
    }

    const cUp = camT.up.normalize();
    const cRight = camT.right.normalize();
    const cam2obj = itemCenter.sub(camT.getWorldPosition());

    const projY = cUp.dot(cam2obj);
    const projX = cRight.dot(cam2obj);
    const proj = new vec2(projX, projY).normalize();
    const t = Math.atan2(projY, projX);

    image.enabled = true;
    screenTransform.anchors.setCenter(proj.uniformScale(script.radius));

    const rot = quat.angleAxis(t , new vec3(0, 0, 1));
    screenTransform.rotation = rot.multiply(initialRot);

});
