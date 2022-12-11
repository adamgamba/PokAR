//@input SceneObject camera
//@input Component.Text displayName
//@input Component.Text displayNameBack
//@input SceneObject phonePoseTarget
//@input SceneObject phoneLocationTarget
//@input SceneObject headPoseTarget
//@input SceneObject headLookAtTarget
//@input vec3 headOffset
//@input Asset.ObjectPrefab avatarPointerPrefab
//@input float minDistance = 70

var utils = global.utils;
var playersManager = global.playersManager;
var log = utils.makeLogger('ExampleAvatarController');


// Avatar pointer
// -------------
var avatarPointerSceneObject = script.avatarPointerPrefab.instantiate(script.getSceneObject());
avatarPointerSceneObject.enabled = true;
var avatarPointer = avatarPointerSceneObject.getComponent('ScriptComponent');
avatarPointer.api.setTarget(script.phonePoseTarget);

// Player update handling
// ----------------------
var phonePoseTransform = script.phonePoseTarget.getTransform();
var phoneLocationTransform = script.phoneLocationTarget.getTransform();
var headPoseTransfrom = script.headPoseTarget.getTransform();
var headLookAtTarget = script.headLookAtTarget.getTransform();
var cameraTransform = script.camera.getTransform();
var hasRecievedUpdate = false;

var stateAtUpdate = {
    position: {
        target: phonePoseTransform.getWorldPosition(),
        current: phonePoseTransform.getWorldPosition(),
    },
    orientation: {
        target: phonePoseTransform.getWorldPosition(),
        current: phonePoseTransform.getWorldPosition(),
    },
    time: global.getTime()
}

update(playersManager.getPlayers());
playersManager.onPlayersUpdated(update);

function update (players) {

    // Get out player
    var player = players[script.getSceneObject().name];

    // If we don't exist, remove ourselves
    // from the scene and free resouces
    if (typeof player === 'undefined') {
        playersManager.offPlayersUpdated(update);
        if (!isNull(avatarPointerSceneObject)) {
            avatarPointerSceneObject.destroy();
        }
        return;
    }


    if (script.displayName && player.displayName) {
        script.displayName.text = player.displayName;
    }
    if (script.displayNameBack && player.displayName) {
        script.displayNameBack.text = player.displayName;
    }
    
    // Sat the incoming values
    stateAtUpdate.position.current = hasRecievedUpdate ? phonePoseTransform.getWorldPosition() : player.avatarPosition;
    stateAtUpdate.position.target = player.avatarPosition;
    stateAtUpdate.orientation.current = phonePoseTransform.getWorldRotation();
    stateAtUpdate.orientation.target = player.avatarOrientation;
    stateAtUpdate.time = global.getTime();
    hasRecievedUpdate = true;
}

// Frame updates
// -------------

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function (event) {

    // Phone pose
    var delta = utils.map(global.getTime(), stateAtUpdate.time, stateAtUpdate.time + 0.55, 0, 1, true);
    phonePoseTransform.setWorldPosition(vec3.lerp(stateAtUpdate.position.current, stateAtUpdate.position.target, delta));
    phonePoseTransform.setWorldRotation(quat.slerp(stateAtUpdate.orientation.current, stateAtUpdate.orientation.target, delta));

    phoneLocationTransform.setWorldPosition(phonePoseTransform.getWorldPosition());

    // Head position
    var targetPosition = phonePoseTransform.getWorldTransform().multiplyPoint(script.headOffset);
    var lerpedPosition;
    if (hasRecievedUpdate) {
        lerpedPosition = vec3.lerp(headPoseTransfrom.getWorldPosition(), targetPosition, utils.clamp01(8 * event.getDeltaTime()));
    } else {
        lerpedPosition = phonePoseTransform.getWorldTransform();
    }
    headPoseTransfrom.setWorldPosition(lerpedPosition);

    // Head rotation
    var lookAtPhone = quat.lookAt(headLookAtTarget.getWorldPosition().sub(lerpedPosition).normalize(), vec3.lerp(new vec3(0, 1, 0), phonePoseTransform.up, 0.4));
    var lookAtPlayer = quat.lookAt(cameraTransform.getWorldPosition().sub(lerpedPosition).normalize(), vec3.lerp(new vec3(0, 1, 0), cameraTransform.up, 0.4));
    var angleToHead = cameraTransform.forward.angleTo(cameraTransform.getWorldPosition().sub(lerpedPosition)) * 57.2958;
    var lookDiff = cameraTransform.forward.angleTo(lookAtPhone.multiplyVec3(new vec3(0, 0, 1))) * 57.2958;
    var lookAtPosition = angleToHead < 30 && lookDiff < 60 ? lookAtPlayer : lookAtPhone;
    headPoseTransfrom.setLocalRotation(quat.slerp(headPoseTransfrom.getWorldRotation(), lookAtPosition, utils.clamp01(10 * event.getDeltaTime())));

    // Enable or disable based on distance
    script.headPoseTarget.enabled = headPoseTransfrom.getWorldPosition().distance(cameraTransform.getWorldPosition()) > script.minDistance;
    script.phoneLocationTarget.enabled = phoneLocationTransform.getWorldPosition().distance(cameraTransform.getWorldPosition()) > script.minDistance;
    script.phonePoseTarget.enabled = phonePoseTransform.getWorldPosition().distance(cameraTransform.getWorldPosition()) > script.minDistance;

});