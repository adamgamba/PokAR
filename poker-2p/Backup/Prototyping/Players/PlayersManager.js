//@input Component.Script packets
//@input Component.ScriptComponent connectedController
var connectedController = script.connectedController.api
var utils = global.utils;

var actions = (function () {
    var events = new utils.Events();
    var needsUpdate = false;
    var players = {}

    var updateEvent = script.createEvent('UpdateEvent');
    updateEvent.bind(function () {
        if (needsUpdate) {
            needsUpdate = false;
            events.trigger('players updated', Object.assign({}, players));
        }
    });

    var methods = {
        addPlayer: function (playerId) {
            if (typeof players[playerId] !== 'undefined') {
                return;
            }
            players[playerId] = {
                id: playerId,
                lastUpdated: global.getTime()
            };
            needsUpdate = true;
            print('Added player');
        },
        removePlayer: function (playerId) {
            delete players[playerId];
            needsUpdate = true;
        },
        setPlayerValueForKey: function (playerId, key, value) {
            if (typeof players[playerId] === 'undefined') {
                methods.addPlayer(playerId);
            }
            players[playerId][key] = value;
            players[playerId].lastUpdated = global.getTime()
            needsUpdate = true;
        },
        onPlayersUpdated: function (fn) {
            events.on('players updated', fn);
        },
        offPlayersUpdated: function (fn) {
            events.off('players updated', fn);
        },
        getPlayers: function () {
            return Object.assign({}, players);
        }
    }

    return methods;
}());

// Add actions' methods to api
Object.assign(script.api, actions);
global.playersManager = script.api;

connectedController.events.on(connectedController.EventType.USER_JOINED_SESSION, function (userInfo) {
    actions.addPlayer(userInfo.userId);
    actions.setPlayerValueForKey(userInfo.userId, 'displayName', userInfo.displayName);
});

connectedController.events.on(connectedController.EventType.USER_LEFT_SESSION, function (userInfo) {
    actions.removePlayer(userInfo.userId);
});