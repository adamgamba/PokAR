var utils = {};

//-----------------------
// Math
//-----------------------

function map ( input, inputMin, inputMax, outputMin, outputMax, clamp, ease ) {
    input = ( input - inputMin ) / ( inputMax - inputMin );
    if ( ease ) {
        input = ease(input);
    } 
    var output = input * ( outputMax - outputMin ) + outputMin;
    if ( !!clamp ) {
        if ( outputMax < outputMin ) {
            if ( output < outputMax ) {
                output = outputMax;
            }
            else if ( output > outputMin ) {
                output = outputMin;
            }
        } else {
            if ( output > outputMax ) {
                output = outputMax;
            }
            else if ( output < outputMin ) {
                output = outputMin;
            }
        }
    }
    return output;
}

utils.map = map;

function mapVec3 (value, inputMin, inputMax, outputMin, outputMax, clamp, ease ) {
    return new vec3(
        map(value.x, inputMin.x, inputMax.x, outputMin.x, outputMax.x, clamp, ease),
        map(value.y, inputMin.y, inputMax.y, outputMin.y, outputMax.y, clamp, ease),
        map(value.z, inputMin.z, inputMax.z, outputMin.z, outputMax.z, clamp, ease)
    );
}

utils.mapVec3 = mapVec3;

//  Returns a random number between min (inclusive) and max (exclusive)
utils.randomBetween = function(min, max) {
    return Math.random() * (max - min) + min;
};

function clamp01 (v) {
    return Math.max(0, Math.min(1,v));
}

utils.clamp01 = clamp01;

function smoothstep (edge1, edge2, v) {
    v = clamp01((v - edge1) / (edge2 - edge1));
    return v * v * (3 - 2 * v);
}

utils.smoothstep = smoothstep;

//-----------------------
// Core
//-----------------------


utils.appendToArguments = function ( item, argumentsObj ) {
    return [].push.call(argumentsObj, item);
}

function Events () {};

Events.prototype = {
    on : function ( event,  callback ) {
        if ( typeof callback !== 'function' ) {
            throw "callback not function";
        }
        this.events()[ event ] = this.events()[ event ] || [];
        if ( this.events()[ event ] ) {
            this.events()[ event ].push( callback );
        }
        return this;
    },
    off : function ( event, callback ) {
        if ( !callback ) {
            delete this.events()[ event ];
        } else {
            if ( this.events()[ event ] ) {
                var listeners = this.events()[ event ];
                for ( var i = listeners.length-1; i>=0; --i ){
                    if ( listeners[ i ] === callback ) {
                        listeners.splice( i, 1 );
                    }
                }
            }
        }
        return this;
    },
    // Call the event with name, calling handlers with all other arguments
    // e.g. trigger( name, ... )
    trigger : function ( name, data ) {
        var args = Array.prototype.slice.call( arguments, 1 );
        var listeners;
        var length;
        // Find match listeners
        if ( name !== "*" && this.events()[ name ] ) {
            listeners = this.events()[ name ];
            length = listeners.length;
            while ( length-- ) {
                if ( typeof listeners[ length ] === 'function' ) {
                        listeners[ length ].apply( this, args );
                }
            }
        }
        // Send to any listeners bound to '*'
        if ( this.events()[ "*" ] ) {
            listeners = this.events()[ "*" ];
            length = listeners.length;
            // Add the event name to the first callback arg
            args.unshift( name );
            while ( length-- ) {
                if ( typeof listeners[ length ] === 'function' ) {
                    listeners[ length ].apply( this, args );
                }
            }
        }

        return this;
    },
    // Added function to avoid the use of a constuctor
    events : function () {
        this.eventsArray = this.eventsArray || [];
        return this.eventsArray;
    }
};

utils.Events = Events;

var noop = function () {}

//----------
//  Promise
//  Adapted from: https://github.com/taylorhakes/promise-polyfill
//----------

/*
Copyright (c) 2014 Taylor Hakes
Copyright (c) 2014 Forbes Lindesay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var Promise = (function () {

    function finallyConstructor(callback) {
        var constructor = this.constructor;
        return this.then(
            function (value) {
                // @ts-ignore
                return constructor.resolve(callback()).then(function () {
                    return value;
                });
            },
            function (reason) {
                // @ts-ignore
                return constructor.resolve(callback()).then(function () {
                    // @ts-ignore
                    return constructor.reject(reason);
                });
            }
        );
    }

    function allSettled(arr) {
        var P = this;
        return new P(function (resolve, reject) {
            if (!(arr && typeof arr.length !== 'undefined')) {
                return reject(
                    new TypeError(
                        typeof arr +
                        ' ' +
                        arr +
                        ' is not iterable(cannot read property Symbol(Symbol.iterator))'
                    )
                );
            }
            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                if (val && (typeof val === 'object' || typeof val === 'function')) {
                    var then = val.then;
                    if (typeof then === 'function') {
                        then.call(
                            val,
                            function (val) {
                                res(i, val);
                            },
                            function (e) {
                                args[i] = { status: 'rejected', reason: e };
                                if (--remaining === 0) {
                                    resolve(args);
                                }
                            }
                        );
                        return;
                    }
                }
                args[i] = { status: 'fulfilled', value: val };
                if (--remaining === 0) {
                    resolve(args);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    }

    function isArray(x) {
        return Boolean(x && typeof x.length !== 'undefined');
    }

    function noop() { }

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function () {
            fn.apply(thisArg, arguments);
        };
    }

    /**
     * @constructor
     * @param {Function} fn
     */
    function Promise(fn) {
        if (!(this instanceof Promise))
            throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        /** @type {!number} */
        this._state = 0;
        /** @type {!boolean} */
        this._handled = false;
        /** @type {Promise|undefined} */
        this._value = undefined;
        /** @type {!Array<!Function>} */
        this._deferreds = [];

        doResolve(fn, this);
    }

    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        self._handled = true;
        Promise._immediateFn(function () {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }

    function resolve(self, newValue) {
        try {
            // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self)
                throw new TypeError('A promise cannot be resolved with itself.');
            if (
                newValue &&
                (typeof newValue === 'object' || typeof newValue === 'function')
            ) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === 'function') {
                    doResolve(bind(then, newValue), self);
                    return;
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }

    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }

    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            Promise._immediateFn(function () {
                if (!self._handled) {
                    Promise._unhandledRejectionFn(self._value);
                }
            });
        }

        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }

    /**
     * @constructor
     */
    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }

    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
        var done = false;
        try {
            fn(
                function (value) {
                    if (done) return;
                    done = true;
                    resolve(self, value);
                },
                function (reason) {
                    if (done) return;
                    done = true;
                    reject(self, reason);
                }
            );
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }

    Promise.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    Promise.prototype.then = function (onFulfilled, onRejected) {
        // @ts-ignore
        var prom = new this.constructor(noop);

        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };

    Promise.prototype['finally'] = finallyConstructor;

    Promise.all = function (arr) {
        return new Promise(function (resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError('Promise.all accepts an array'));
            }

            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(
                                val,
                                function (val) {
                                    res(i, val);
                                },
                                reject
                            );
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    Promise.allSettled = allSettled;

    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }

        return new Promise(function (resolve) {
            resolve(value);
        });
    };

    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };

    Promise.race = function (arr) {
        return new Promise(function (resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError('Promise.race accepts an array'));
            }

            for (var i = 0, len = arr.length; i < len; i++) {
                Promise.resolve(arr[i]).then(resolve, reject);
            }
        });
    };

    // Use polyfill for setImmediate for performance gains
    Promise._immediateFn = delay0;

    Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== 'undefined' && console) {
            console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
        }
    };

    return Promise;

}());

utils.Promise = Promise;

function delay0 (fn) {
    const delayedEvent = script.createEvent("SceneEvent.DelayedCallbackEvent");
    const handler = function () {
        fn.apply(arguments);
        script.removeEvent(delayedEvent);
    }
    delayedEvent.bind(handler);
    delayedEvent.reset(0);
}

utils.delay0 = delay0;

function partial( fn, arg1, arg2, etc ) {
    var rest = Array.prototype.slice.call( arguments, 1 );
    return function () {
        return fn.apply( this, toArray( rest ).concat( toArray( arguments ) ) );
    };
}

utils.partial = partial;

// Can be used to turn arguments in to an array
// For example: var args = toArray( arguments );
function toArray ( obj ) {
    return Array.prototype.slice.call( obj );
}

utils.toArray = toArray;

function timeout (fn, duration) {
    const delayedEvent = script.createEvent("SceneEvent.DelayedCallbackEvent");
    const handler = function () {
        fn.apply(arguments);
        script.removeEvent(delayedEvent);
    }
    delayedEvent.bind(handler);
    delayedEvent.reset(duration);
    return {
        cancel: function () {
            script.removeEvent(delayedEvent);
        }
    }
}

function areEqualShallow(a, b) {
    for(var key in a) {
        if(!(key in b) || a[key] !== b[key]) {
            return false;
        }
    }
    for(var key in b) {
        if(!(key in a) || a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

utils.areEqualShallow = areEqualShallow;

function log () {
    print(toArray(arguments)
        .map(function (arg) {
            return (typeof arg === 'object') ? JSON.stringify(arg) : arg
        })
        .join(' '));
}

utils.log = log;

function makeLogger (prependText) {
    return function () {
        var args = utils.toArray(arguments);
        args.unshift(prependText);
        utils.log.apply(this, args);
    }
}

utils.makeLogger = makeLogger;

function makeRange(Size) {
    return Array(Size + 1).join(1).split('').map(function (x, i) { return i; })
}

utils.makeRange = makeRange;

function once(fn) {
    var hasInvoked = false;
    return function () {
        if (!hasInvoked) {
            hasInvoked = true;
            return fn.apply(null, arguments);
        }
    }
}

utils.once = once;

utils.isDesktopOS = function () {
    return global.deviceInfoSystem.getTargetOS() === 'macos' || global.deviceInfoSystem.getTargetOS() === 'win';
}

function getFirstLine (text) {
    var index = text.indexOf("\n");
    if (index === -1) index = undefined;
    return text.substring(0, index);
}

utils.getFirstLine = getFirstLine;

function getAfterFirstLine (text) {
    var index = text.indexOf("\n");
    return index === -1 ? undefined : text.substring(index + 1);
}

utils.getAfterFirstLine = getAfterFirstLine;

function throttle (fn, millseconds) {
    var lastTriggered = Number.MIN_VALUE;
    return function () {
        if (global.getTime() - lastTriggered > (millseconds*0.001)) {
            lastTriggered = global.getTime();
            fn.apply(null, arguments);
        }
    }
}

utils.throttle = throttle;

//------------------------------------------
// Utility to track when an tranform has
// moved (location or rotation) significanly
// and recieve a callback of the rotation

var makeRollingPoseWindow = function () {

    var lastPose;
    var distanceThresholdCms = 30;
    var rotationThresholdDegrees = 75;
    var onThresholdExceeded;

    return {
        setRotationThreshold: function (degress) {
            rotationThresholdDegrees = degress;
        },
        setDistanceThreshold: function (centimeters) {
            distanceThresholdCms = centimeters;
        },
        setOnThresholdExceeded: function (fn) {
            onThresholdExceeded = fn;
        },
        updatePose: function (transform) {
            var thresholdExceeded = false
            var currentPose = {
                position: transform.getWorldPosition(),
                orientation: transform.getWorldRotation()
            };

            if (!lastPose) {
                lastPose = currentPose;
            } else {
                thresholdExceeded = currentPose.position.distance(lastPose.position) > distanceThresholdCms ||
                    quat.angleBetween(currentPose.orientation, lastPose.orientation) > rotationThresholdDegrees;
            }
        
            if (thresholdExceeded && typeof onThresholdExceeded === 'function') {
                lastPose = currentPose;
                onThresholdExceeded(currentPose.position, currentPose.orientation);
            }

        }
    }
};

utils.makeRollingPoseWindow = makeRollingPoseWindow;

//-----------------------
// Export to global
//-----------------------

global.utils = utils;