// TouchUI.js
// Version: 1.0.0
// Event: On Awake
// Description: Capture User touch interaction state for each frame

var screenTapped = false;

global.touchSystem.touchBlocking = true;
global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);

const touches = [];

var tapPos = undefined;
var cameraState;


script.createEvent("TouchStartEvent").bind(function(eventData) {
    tapPos = eventData.getTouchPosition();
    touches.push({
        id: eventData.getTouchId(),
        start: eventData.getTouchPosition(),
        curr: eventData.getTouchPosition()
    });
});

script.createEvent("TapEvent").bind(function(eventData) {
    screenTapped = true;
});

script.createEvent("TouchMoveEvent").bind(function(eventData) {
    touches.forEach(function(x) {
        if (x.id == eventData.getTouchId()) {
            x.curr = eventData.getTouchPosition();
        }
    });
});

script.createEvent("TouchEndEvent").bind(function(eventData) {
    var toRemove = -1;
    touches.forEach(function(x, i) {
        if (x.id == eventData.getTouchId()) {
            toRemove = i;
        }
    });
    if (toRemove != -1) {
        touches.splice(toRemove, 1);
    }
});

var state = "wait";
var dragTouchId = undefined;
const updateState = function(s) {
    if (s == "wait" || state == "button") {
        if (touches.length == 0) {
            return "wait";
        }
        if (touches.length == 1) {
            return "wait_drag";
        } else if (touches.length > 1) {
            return "double_drag";
        } 
    } else if (s == "wait_drag") {
        if (touches.length == 0) {
            return "wait";
        }
        if (touches.length == 1) {
            dragTouchId = touches[0].id;
            return "start_drag";
        } else if (touches.length > 1) {
            return "double_drag";
        }
    } else if (s == "start_drag") {
        if (touches.length == 0) {
            return "wait";
        }
        return "drag";
    } else if (s == "drag") {
        if (touches.length == 0) {
            return "wait";
        } else if (touches.length > 1) {
            return "double_drag";
        } else if (touches.length == 1) {
            dragTouchId = touches[0].id;
            return "drag";
        }
    } else if (s == "double_drag") {
        if (touches.length == 0) {
            return "wait";
        }
        if (touches.length == 1) {
            if (dragTouchId === touches[0].id) {
                return "drag";
            } else {
                return "wait_up";
            }
        } else if (touches.length > 1) {
            return "double_drag";
        }
    } else if (s == "wait_up") {
        if (touches.length == 0) {
            return "wait";
        }
        return "wait_up";
    }
    return s;
};

script.createEvent("CameraFrontEvent").bind(function(eventData) {
    cameraState = "front";
});

script.createEvent("CameraBackEvent").bind(function(eventData) {
    cameraState = "back";
});

script.createEvent("UpdateEvent").bind(function(eventData) {
    state = updateState(state);
   
    global.TouchUI = {
        tapped: screenTapped,
        tapPos: tapPos,
        state: state,
        touches: touches,
        cameraState: cameraState
    };
    
    screenTapped = false;
});
