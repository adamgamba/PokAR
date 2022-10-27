//@input SceneObject camera
//@input Asset.ObjectPrefab arrowPrefab
//@input float distanceThreshold = 70
//@input float rotationThreshold = 45
//@input SceneObject whenDirectingLocation
//@input SceneObject whenDirectingRotation
//@input SceneObject whenAtTarget
//@input SceneObject targetLocation

var connectedController = global.connectedController;
var utils = global.utils

var states = {
    NOT_SET: 'not set',
    DIRECT_LOCATION: 'direct location',
    DIRECT_ORIENTATION: 'direct orientation',
    AT_TARGET: 'at target'
}

var arrow;
var locationsOfInterest = [];
var lastMapBuildingProgress = 0;
var lastSampledLocationOfInterest = Number.MIN_VALUE;
var targetPosition;
var targetRotation;

connectedController.api.onStateChange(function (state) {
    if (state.flowState !== 'initiator waiting for tracking' && arrow) {
        arrow.enabled = false;
    }
    var mapBuildingProgress = state.mapBuildingProgress;
    if (mapBuildingProgress != lastMapBuildingProgress && global.getTime() - lastSampledLocationOfInterest > 3) {
        lastSampledLocationOfInterest = global.getTime();
        lastMapBuildingProgress = mapBuildingProgress;
        locationsOfInterest.push({
            position: script.camera.getTransform().getWorldPosition(),
            rotation: script.camera.getTransform().getWorldRotation()
        });
    }
});

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function () {

    if (connectedController.api.getState().flowState !== 'initiator waiting for tracking' ) {
        return;
    }

    if (!arrow) {
        arrow = createArrowRelativeToScreen(new vec2(0.5, 0.8), 30); // Screen position and distance from screen
    }

    var cameraTransform = script.camera.getTransform();
    var cameraPosition = cameraTransform.getWorldPosition()
    var cameraRotation = cameraTransform.getWorldRotation();
    var arrowAnimation = arrow.getComponent('AnimationMixer');
    var transform = arrow.getTransform();


    if (!targetPosition) {
        // We don't have a target to direct the user to, so lets choose one

        // Return if we don't have any locations of interest
        if (locationsOfInterest.length === 0) {
            return;
        }
        // If we've only one, let's use that
        else if (locationsOfInterest.length <= 2) {
            targetPosition = locationsOfInterest[0].position;
            targetRotation = locationsOfInterest[0].rotation;
        }
        // Else lets be some thing more fancy
        else  {
            var nearestLocationOfInterest = locationsOfInterest[0];
            var nearestLocationOfInterestDistance = locationsOfInterest[0].position.distance(cameraPosition);
            for (var i = 1; i < locationsOfInterest.length * 0.5; i++) {
                var distance = locationsOfInterest[i].position.distance(cameraPosition);
                if (distance < nearestLocationOfInterestDistance) {
                    nearestLocationOfInterest = locationsOfInterest[i];
                    nearestLocationOfInterestDistance = distance;
                }
            }
            targetPosition = nearestLocationOfInterest.position;
            targetRotation = nearestLocationOfInterest.rotation;
        }
    }

    var state = getState(cameraPosition, cameraRotation, targetPosition, targetRotation);

    arrowAnimation.enabled = state === states.DIRECT_LOCATION;
    arrow.enabled = state !== states.AT_TARGET;
    script.whenDirectingLocation.enabled = state === states.DIRECT_LOCATION;
    script.whenDirectingRotation.enabled = state === states.DIRECT_ORIENTATION;
    script.whenAtTarget.enabled = state === states.AT_TARGET;

    if (state === states.DIRECT_LOCATION || state === states.DIRECT_ORIENTATION) {
        var locationRotation = quat.lookAt( cameraPosition.sub(targetPosition), new vec3(0,1,0) );
        // Begin rotation the arrow to where we've to look when we get close to our location
        var distance = new vec3(cameraPosition.x, 0, cameraPosition.z).distance(new vec3(targetPosition.x, 0, targetPosition.z));
        var rotation = quat.slerp(locationRotation, targetRotation, utils.map(distance, script.distanceThreshold + 1, script.distanceThreshold, 0, 1, true ));
        transform.setWorldRotation(rotation);
    }   
});

function getState(cameraPosition, cameraRotation, targetPosition, targetRotation) {
    switch (true) {
        case new vec3(cameraPosition.x, 0, cameraPosition.z).distance(new vec3(targetPosition.x, 0, targetPosition.z)) > script.distanceThreshold: return states.DIRECT_LOCATION; 
        case quat.angleBetween(cameraRotation, targetRotation) * 57.2958 > script.rotationThreshold: return states.DIRECT_ORIENTATION;
        default: return states.AT_TARGET;
    }
}

function createArrowRelativeToScreen(screenLocation, distance) {
    var arrowPosition = script.camera.getComponent('Camera').screenSpaceToWorldSpace(screenLocation, distance);
    var arrowSceneObject = script.arrowPrefab.instantiate(script.camera);
    arrowSceneObject.getTransform().setWorldPosition(arrowPosition);
    return arrowSceneObject;
}