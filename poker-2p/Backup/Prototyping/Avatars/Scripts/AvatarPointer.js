//@input SceneObject target
//@input Component.Camera camera
var utils = global.utils;
var target = script.target;
var camera = script.camera;
var image = script.getSceneObject().getComponent('Image');

// Clone material
var clone = image.mainMaterial.clone();
image.clearMaterials();
image.addMaterial(clone);

script.api.setTarget = function (positionTarget) {
    target = positionTarget;
}

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function () {

    var targetOffet = script.camera.getSceneObject().getTransform().getInvertedWorldTransform().multiplyPoint(target.getTransform().getWorldPosition());
    var angleToTarget = targetOffet.angleTo(new vec3(0,0,-1))*57.2958;
    image.enabled = angleToTarget > 25;

    var flattendOffset = targetOffet.mult(new vec3(1,1,0));
    flattendOffset.y = flattendOffset.y * camera.aspect;
    var pointerAngle = flattendOffset.angleTo(new vec3(0,1,0));

    var radiansToTarget = targetOffet.x > 0 ? pointerAngle  : pointerAngle * -1;
    var degreesToTarget = radiansToTarget * 57.2958;
    image.mainPass['Degrees'] = degreesToTarget;

    var screenPosition = new vec2(0,0);
    var low = 0.05;
    var high = 0.95;

    if ( degreesToTarget >= -45 && degreesToTarget <= 45) {
        //top   
        screenPosition.y = low;
        screenPosition.x = utils.map(degreesToTarget, -45, 45, low, high, true);
    } else if ( degreesToTarget > 45 && degreesToTarget <= 135) {
        //left
        screenPosition.y = utils.map(degreesToTarget, 45, 135, low, high, true);
        screenPosition.x = high;
    } else if ( degreesToTarget < -45 && degreesToTarget >= -135) {
        // right   
        screenPosition.y = utils.map(degreesToTarget, -45, -135, low, high, true);
        screenPosition.x = low;
    } else if (degreesToTarget<-135) {
        // bottom
        screenPosition.y = high;
        screenPosition.x = utils.map(degreesToTarget, -135, -180, low, 0.5, true);
    } else {
        // bottom
        screenPosition.y = high;
        screenPosition.x = utils.map(degreesToTarget, 135, 180, 0.5, low, true);
    }
    
    var targetScreenPosition = script.camera.screenSpaceToWorldSpace(new vec2(screenPosition.x, screenPosition.y), 10);
    script.getSceneObject().getTransform().setWorldPosition(targetScreenPosition);
    script.getSceneObject().getTransform().setWorldRotation(script.camera.getSceneObject().getTransform().getWorldRotation());
});
