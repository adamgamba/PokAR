//@input Component.Script packets
//@input Component.Script blockDrawing
//@input Asset.ObjectPrefab cursorPrefab
var utils = global.utils;
var packets = script.packets.api;
var log = utils.makeLogger('Remote cursors');

// Broadcasting cursor position
var myId = Math.floor(Math.random()*1000000000);
var myLastPosition;
var broadcastMyPosition = utils.throttle(function () {
    var currentPosition = script.blockDrawing.api.getCursorWorldPositionQuantized()
    if (!currentPosition) {
        return;
    }
    if (myLastPosition !== currentPosition) {
        myLastPosition = currentPosition;
        packets.sendObject('/blocks/cursor/' + myId + '/', [currentPosition.x, currentPosition.y, currentPosition.z]);
    }
}, 200);

// Receiving position
var remoteCursors = {};

packets.on('/blocks/cursor/:id/', function (body, params, userId) {
    var remoteCursor = remoteCursors[params.id];
    var positionArray = JSON.parse(body);
    var position = new vec3(positionArray[0], positionArray[1], positionArray[2]);
    if (!remoteCursor) {
        log('Creating remote cursor for', params.id, userId);
        remoteCursor = createRemoteCursor(position);
        remoteCursors[params.id] = remoteCursor;
    } else {
        remoteCursors[params.id].targetPosition = position;
    }
});

function createRemoteCursor (position) {
    var sceneObject = script.cursorPrefab.instantiate(script.getSceneObject());
    var transform = sceneObject.getTransform();
    var gridSize = script.blockDrawing.api.getGridSize();
    transform.setWorldPosition(position);
    transform.setLocalScale(new vec3(gridSize * 0.98, gridSize * 0.98, gridSize * 0.98));
    return {
        targetPosition: position,
        transform: transform
    }
}

function updateRemoteCursors () {
    Object.keys(remoteCursors).forEach(function (id) {
        var interpolatedP = vec3.lerp( remoteCursors[id].transform.getWorldPosition(), remoteCursors[id].targetPosition, 0.35 );
        remoteCursors[id].transform.setWorldPosition(interpolatedP);
    });
}

// Update loop
var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function () {
    // Send out position (this is throttled)
    broadcastMyPosition();
    // Update remote cursors
    updateRemoteCursors();
});