// -----JS CODE-----
// @input Component.ScriptComponent connectedController
// @input Component.ScriptComponent packets
var packets = script.packets.api;
var utils = global.utils;
var log = utils.makeLogger('BlockSync');

// Create event system
var events = new utils.Events();
script.api.events = events;

// State cache
var cache = (function () {
    var storage = {};
    var count = 0;
    function arrayToString (arr) {
        return arr.join(' ');
    }
    function stringToArray (str) {
        return str.split(' ').map(function (v) { return parseFloat(v); });
    }
    function hasKey (key) {
        return storage.hasOwnProperty(key);
    }
    return {
        set: function (positionArray, colorArray) {
            storage[arrayToString(positionArray)] = colorArray;
            count++;
        },
        remove: function (positionArray) {
            var key = stringToArray(positionArray);
            if (hasKey(key)) {
                delete storage[key];
                --count;
            }
        },
        getCache: function () {
            return Object.keys(storage).map(function (key) {
                return {
                    p: stringToArray(key),
                    c: storage[key]
                }
            });
        },
        getCount: function () {
            return count;
        }
    }
}())

// Expose actions
script.api.create = function (positionArray, colorArray) {
    cache.set(positionArray, colorArray);
    packets.sendObject('/blocks/create/', {
        p: positionArray,
        c: colorArray
    });
}

// Handle incoming messages
packets.on('/blocks/create/', function (body, params, userId) {
    log('recieved create', body);
    var message = JSON.parse(body);
    events.trigger('create', message.p, message.c);
});

packets.on('/blocks/state/request/', function (body, params, userId) {
    // If we don't have a cache, disregard
    // This needs to be update to not allow
    // people who has not created the 
    if (cache.getCount() < 1) {
        return;
    }

    var requestId = body;
    var offerId = ''+Math.floor(Math.random()*100000);

    packets.on('/blocks/state/offer/accept/' + offerId + '/', function  () {
        // send the cache
        var blocks = cache.getCache();
        blocks.forEach(function (message) {
            packets.sendObject('/blocks/state/create/' + offerId + '/', message);
        })
    });

    log('Responding to request for state with offer', offerId);
    packets.send('/blocks/state/offer/'+ requestId + '/', offerId);

});

events.on('create', function (positionArray, colorArray) {
    cache.set(positionArray, colorArray);
});


function requestPlayersCache () {
    var requestId = ''+Math.floor(Math.random()*100000);

    // Listen for people offering to share their state
    packets.on('/blocks/state/offer/'+ requestId + '/', handleStateShareOffer);

    function handleStateShareOffer (offerToken) {
        log('Handling offer', offerToken);
        // Stop listening after someone responds
        packets.off('/blocks/state/offer/'+ requestId + '/', handleStateShareOffer);
        // Handle incoming create message than will come after accepting offer
        packets.on('/blocks/state/create/' + offerToken + '/', function (body, params, userId) {
            var message = JSON.parse(body);
            log('Createing block from players state');
            events.trigger('create', message.p, message.c);
        });

        // Accept offer
        log('Accepting offer', offerToken);
        packets.send('/blocks/state/offer/accept/' + offerToken + '/', '');
    }

    // Ask for a player to share there state
    log('Asking for state', requestId);
    packets.send('/blocks/state/request/', requestId);
}

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function () {
    if (connectedController.api.hasConnected()) {
        script.removeEvent(updateEvent);
        requestPlayersCache();
    }
});