//@input Component.ScriptComponent scriptComponent {"label":"Target ScriptComponent"}
//@ui {"widget":"separator"}
//@ui { "widget":"group_start", "label": "API function names" }
//@input string onExperienceShouldStart { "label": "onExperienceShouldStart" }
//@ui {"widget":"separator"}
//@input string onMessageReceived { "label": "onMessageReceived"}
//@ui {"widget":"separator"}
//@input string onMessageReceivedBytes { "label": "onMessageReceivedBytes"}
//@ui {"widget":"separator"}
//@input string onUserJoinedSession { "label": "onUserJoinedSession"}
//@ui {"widget":"separator"}
//@input string onUserLeftSession { "label": "onUserLeftSession"}
//@ui {"widget":"separator"}
//@input string onDisconnected { "label": "onDisconnected"}
//@ui {"widget":"separator"}
//@ui { "widget":"group_start", "label": "Advanced (for custom UIs)" }
//@input string onShouldDismissSplashScreen { "label": "onShouldDismissSplashScreen" }
//@input string onShouldDisplayConnectedOptions { "label": "onShouldDisplayConnectedOptions" }
//@ui { "widget":"group_end" }
//@ui { "widget":"group_end" }

var connectedController = global.connectedController.api;
var FlowState = connectedController.FlowState;
var EventType = connectedController.EventType;

// ---------------------------------------------------------------------------------------------------------
// onExperienceStarted(multiplayerSession:MultiplayerSession, hasJoined:boolean, sessionType:string, snapcode:Texture)

var handleOnExperienceShouldStart = function (connectedState) {
    if (connectedState.flowState === FlowState.DONE) {
        connectedController.offStateChange(handleOnExperienceShouldStart);
        ifIsApiFunction(script.scriptComponent, script.onExperienceShouldStart)
            .involkeWith(
                connectedState.multiplayerSession, 
                connectedState.hasJoined,
                connectedState.sessionType, 
                connectedState.snapCode
            );
    }
};

connectedController.onStateChange(handleOnExperienceShouldStart);

// ------------------------------------------------
// onMessageReceived(userId:string, message:string)

connectedController.events.on(EventType.MESSAGE_RECEIVED, function (userId, message) {
    ifIsApiFunction(script.scriptComponent, script.onMessageReceived)
        .involkeWith(userId, message);
});

// -------------------------------------------------------------------------
// onMessageReceivedBytes(userId:string, message:Number[])

connectedController.events.on(EventType.MESSAGE_RECEIVED_BYTES, function (userId, message) {
    ifIsApiFunction(script.scriptComponent, script.onMessageReceivedBytes)
        .involkeWith(userId, message);
});

// --------------------------------------
// onUserJoinedSession(userInfo:UserInfo)

connectedController.events.on(EventType.USER_JOINED_SESSION, function (userInfo) {
    ifIsApiFunction(script.scriptComponent, script.onUserJoinedSession)
        .involkeWith(userInfo);
});

// --------------------------------------
// onUserLeftSession(userInfo:UserInfo)

connectedController.events.on(EventType.USER_LEFT_SESSION, function (userInfo) {
    ifIsApiFunction(script.scriptComponent, script.onUserLeftSession)
        .involkeWith(userInfo);
});

// --------------
// onDisconnected(disconnectInfo:string)

connectedController.events.on(EventType.DISCONNECTED, function (disconnectInfo) {
    ifIsApiFunction(script.scriptComponent, script.onDisconnected)
        .involkeWith(disconnectInfo);
});


// ---------------------------
// onShouldDismissSplashScreen()
// - Called when connectedController has either created a session, joined a session, or errored

var handleShouldDismissSplashScreen = function (connectedState) {
    if (connectedState.flowState === FlowState.SESSION_TYPE_SELECT ||
        connectedState.flowState === FlowState.JOINER_WAITING_FOR_TRACKING ||
        connectedState.flowState === FlowState.ERRORED ||
        connectedState.flowState === FlowState.DONE ) {
            connectedController.offStateChange(handleShouldDismissSplashScreen);
            ifIsApiFunction(script.scriptComponent, script.onShouldDismissSplashScreen)
                .involkeWith();
    }
}

connectedController.onStateChange(handleShouldDismissSplashScreen);

// ---------------------------
// onShouldDisplayConnectedOptions()
// - Called when connectedController has created a session and not errored.

var handleShouldDisplayConnectedOptions = function (connectedState) {
    if (connectedState.flowState === FlowState.SESSION_TYPE_SELECT) {
        connectedController.offStateChange(handleShouldDisplayConnectedOptions);
        ifIsApiFunction(script.scriptComponent, script.onShouldDisplayConnectedOptions)
                .involkeWith();
    }
}


connectedController.onStateChange(handleShouldDisplayConnectedOptions);

// --------------------------
// Utils

function ifIsApiFunction( scriptComponent, functionName ) {
    var isApiFunction = scriptComponent && scriptComponent.api && typeof scriptComponent.api[functionName] === 'function';
    return {
        involkeWith: function () {
            if (isApiFunction) {
                scriptComponent.api[functionName].apply(null, arguments);
            }
        }
    }
    return;
}