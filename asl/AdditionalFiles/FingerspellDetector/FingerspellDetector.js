// @input Asset.ObjectPrefab handTrackingPrefab
const CENTER = vec2.zero();
// Hand Tracking 

//subset of points used to determine if hand is tracking or not
const MAIN_POINTS_IDs = ["Center", "Wrist"];

var HandTracking = function (prefab) {
	var so = prefab.instantiate(script.getSceneObject()).getChild(0);
	var f_id;
	var child_so;

	for (var i = 0; i < so.getChildrenCount(); i++) {
		child_so = so.getChild(i);
		f_id = child_so.name;
		this[f_id] = new HandPoint(f_id, child_so.getComponent("Component.ObjectTracking"));
	}

	this.isTracking = function () {
		for (var i = 0; i < MAIN_POINTS_IDs.length; i++) {
			if (!this[MAIN_POINTS_IDs[i]] || !this[MAIN_POINTS_IDs[i]].isTracking()) {
				return false;
			}
		}
		return true;
	};

	this.getHandSize = function () {
		return this.Center.getLocalPosition().distance(this.Wrist.getLocalPosition());
	};
};

//hand point class
function HandPoint(id, trackingPoint) {
	this.name = id;
	this.objectTracking = trackingPoint;
	this.screenTransform = trackingPoint.getSceneObject().getFirstComponent("ScreenTransform");
}

HandPoint.prototype.isTracking = function () {
	return this.objectTracking.isTracking();
};

HandPoint.prototype.getWorldPosition = function () {
	return this.screenTransform.localPointToWorldPoint(CENTER);
};

HandPoint.prototype.getScreenPosition = function () {
	return this.screenTransform.localPointToScreenPoint(CENTER);
};

HandPoint.prototype.getLocalPosition = function () {
	return this.screenTransform.anchors.getCenter();
};

// Util.js --> 
function Util_() {
	this.enumcnt = -1;
}

Util_.prototype =
{
	//static
	levenshteinDistance: function levenshteinDistance(s, t) {
		Util.assert(typeof s == "string");
		Util.assert(typeof t == "string");

		const m = s.length;
		const n = t.length;

		var Dist = new Array(m + 1);
		for (var i = 0; i < m + 1; ++i) // initialize with zeros
		{
			Dist[i] = new Array(n + 1);
			for (var j = 0; j < n + 1; ++j)
				Dist[i][j] = 0;
		}

		for (var i = 1; i < m + 1; ++i)
			Dist[i][0] = i;
		for (var j = 1; j < n + 1; ++j)
			Dist[0][j] = j;

		for (var j = 1; j < n + 1; ++j) {
			for (var i = 1; i < m + 1; ++i) {
				var sc = 0;
				if (s[i - 1] != t[j - 1])
					sc = 1;

				Dist[i][j] = Math.min(
					Dist[i - 1][j] + 1,
					Dist[i][j - 1] + 1,
					Dist[i - 1][j - 1] + sc
				);
			}
		}
		return Dist[m][n];
	},

	//static
	removePrefix: function removePrefix(s, p) {
		Util.assert(typeof s == "string", Util.myTypeOf(s));
		Util.assert(typeof p == "string");
		if (s.length >= p.length && s.substr(0, p.length) == p)
			return s.substr(p.length);
		else
			return s;
	},

	//static
	arrayToStr: function arrayToStr(array, w) {
		// Util.assert(tensor instanceof Float32Array);
		var render = "";
		for (var k in array) {
			if (w !== undefined && k >= w)
				break;
			var third = k % 3 == 2;
			render += " " + Util.pad(array[k].toPrecision(3), third ? 8 : 4, true);
		}
		return render;
	},

	//static
	accumulate: function accumulate(arr, s, pred) {
		Util.assert(arr instanceof Array || typeof (arr) == "string", Util.myTypeOf(arr));
		for (var k in arr)
			s = pred(s, arr[k]);
		return s;
	},

	//static
	count_if: function count_if(arr, pred) {
		Util.assert(arr instanceof Array, Util.myTypeOf(arr));
		var c = 0;
		for (var k in arr)
			if (pred(arr[k]))
				++c;
		return c;
	},

	//static
	count_if_circBuf: function count_if_circBuf(cb, pred) {
		Util.assert(cb instanceof CircularBuffer, Util.myTypeOf(cb));
		var c = 0;
		for (var i = 0; i < cb.size(); ++i)
			if (pred(cb.get(i)))
				++c;
		return c;
	},

	//static
	all_of: function all_of(array, pred) {
		var all = true;
		for (var k in array) {
			var v = array[k];
			if (!pred(v)) {
				all = false;
				break;
			}
		}
		return all;
	},

	// arraySlice: function arraySlice(arr, w)
	// {
	// 	Util.assert(Util.isType(arr, "array"));
	// 	Util.assert(Util.isType(w, "number"), Util.myTypeOf(w));

	// 	if (w == arr.length)
	// 		return arr;

	// 	var arr2 = new Array(w);
	// 	Util.assert(0 <= w && w <= arr.length, "0 <= w && w <= arr.length, w=" + w + ", arr.length=" + arr.length);
	// 	for (var k = 0; k < w; ++k)
	// 	{
	// 		arr2[k] = arr[k];
	// 	}
	// 	return arr2;
	// },

	//static
	pad: function pad(x, width, crop) {
		if (width === undefined)
			width = 8;
		var s = "" + x;
		var m = Math.max(0, width - s.length);
		var s2 = s;
		while (m--)
			s2 += " ";
		if (crop == true && s2.length > width)
			return s2.substr(0, width);
		return s2;
	},

	//static
	stackTrace: function stackTrace() {
		try {
			//console.trace();
			____surely_undefined______();
		}
		catch (e) {
			// Util.log(e.stack);
			var a = e.stack.split("\n");
			for (var k = Math.min(2, a.length); k < a.length; ++k)
				Util.log(a[k]);
		}
	},

	//static
	fatal: function fatal(s) {
		Util.log("FATAL: " + s);
		Util.stackTrace();
		if (typeof process != "undefined")
			process.exit(); // works in Node.js, causes Util.fatal Util.error in Lens Studio
		else
			___exit_ls_script__(); // undefined
	},

	//static
	error: function error(s) {
		Util.log("ERROR: " + s);
	},

	//static
	warning: function warning(s) {
		Util.log("WARNING: " + s);
	},

	//static
	log: function log(s, force) {
		if (script.printLog)
			print(s);
	},

	//static
	xor: function xor(a, b) {
		return a && !b || !a && b;
	},

	//static
	myTypeOf: function myTypeOf(x) {
		var t = typeof (x);
		if (t == "object")
			return x.class_name !== undefined ? x.class_name : x.constructor.name;
		return t;
	},

	//static
	isObject: function isObject(x) {
		return typeof x == "object";
	},

	//static
	isType: function isType(x, typeName) {
		Util.assert(typeName !== undefined, "typeName is not given");
		return Util.myTypeOf(x).toLowerCase() == typeName.toLowerCase();
	},

	//static
	isOptType: function isOptType(x, typeName) {
		Util.assert(typeName !== undefined, "typeName is not given");
		return x === undefined || Util.isType(x, typeName);
	},

	//static
	isHolderOf: function isHolderOf(h, typeName) {
		Util.assert(typeName !== undefined, "typeName is not given");
		return Util.isType(h, "holder") && h.typeName == typeName;
	},

	//static
	isArrayOf: function isArrayOf(x, typeName) {
		Util.assert(typeName !== undefined, "typeName is not given");
		return !(x instanceof Array) || x.length == 0 || Util.isType(x[0], typeName);
	},

	//static
	isArrayOfObject: function isArrayOfObject(x) {
		return !(x instanceof Array) || x.length == 0 || Util.isObject(x[0]);
	},

	//static
	arrayTypeOf: function arrayTypeOf(x) {
		return x instanceof Array ? (x.length > 0 ? Util.myTypeOf(x[0]) : "empty array") : "not array";
	},

	//static
	copyArray: function copyArray(a) {
		Util.assert(a instanceof Array, Util.myTypeOf(a));
		var b = new Array(a.length);
		for (var i = 0; i < a.length; ++i)
			b[i] = a[i];
		return b;
	},

	//static
	assert: function assert(condition, msg) {
		if (condition == false)
			Util.fatal(msg !== undefined ? "Util.assert: " + msg : "(Util.assert)");
	},

	//static
	dump: function dump(p, v) {
		for (var key in p) {
			//if (p.hasOwnProperty(key))
			{
				// Util.log(key + " -> " + p[key]);
				Util.log(key + " " + (v === true ? p[key] : ""));
			}
		}
	},

	//static
	filter: function filter(a, pred) {
		Util.assert(Util.isType(a, "array"));
		var b = [];
		for (var i in a) {
			if (pred(a[i]))
				b.push(a[i]);
		}
		return b;
	},

	//static
	find: function find(a, pred) {
		var i = Util.findIndex(a, pred);
		return i >= 0 ? a[i] : undefined;
	},

	//static
	findIndex: function findIndex(a, pred) {
		Util.assert(Util.isType(a, "array") || Util.isType(a, "string"), Util.myTypeOf(a));
		for (var i = 0; i < a.length; ++i) {
			if (pred(a[i]))
				return i;
		}
		return -1;
	},

	//static
	findIndex_circBuf: function findIndex_circBuf(cb, pred) {
		Util.assert(Util.isType(cb, "CircularBuffer"));
		for (var i = 0; i < cb.size(); ++i) {
			if (pred(cb.get(i)))
				return i;
		}
		return -1;
	},

	//static
	findLastIndex_circBuf: function findLastIndex_circBuf(cb, pred) {
		Util.assert(Util.isType(cb, "CircularBuffer"));
		for (var i = cb.size() - 1; i >= 0; --i) {
			if (pred(cb.get(i)))
				return i;
		}
		return -1;
	},

	//static
	dumpArr: function dumpArr(a, pred, label) {
		Util.assert(Util.isType(a, "array"));
		if (pred === undefined)
			pred = function (x) { return x; };
		var s = (label !== undefined ? label : "") + "|" + a.length + "|: ";
		for (var i = 0; i < a.length; ++i) {
			s += (i > 0 ? "," : "") + pred(a[i], i);
		}
		Util.log(s);
	},

	//static
	desc: function desc(s, that) {
		return s + " = " + eval(s);
	},


	// normalizeRadians: function normalizeRadians(angle)
	// {
	// 	return angle - 2 * M_PI * Math.floor((angle - (-M_PI)) / (2 * M_PI));
	// },

	//static
	flattenVec2Arr: function flattenVec2Arr(arr, data) {
		var num = arr.length;
		if (data === undefined)
			data = new Array(num * 2);
		else
			Util.assert(data.length == arr.length * 2);
		for (var i = 0; i < num; ++i) {
			data[2 * i] = arr[i].x;
			data[2 * i + 1] = arr[i].y;
		}
	},

	//static
	flattenVec2Arr_withOffset: function flattenVec2Arr_withOffset(arr, data, offset) {
		var num = arr.length;
		Util.assert(Util.isType(data, "array"));
		for (var i = 0; i < num; ++i) {
			data[offset + 2 * i] = arr[i].x;
			data[offset + 2 * i + 1] = arr[i].y;
		}
	},

	//static
	prec: function prec(x, p) {
		Util.assert(Util.isType(x, "number"));
		Util.assert(Util.isType(p, "number"));
		Util.assert(Util.isType(x, "number"));
		const factor = Math.pow(10, p);
		return Math.round(x * factor) / factor;
	},

	//static
	vec2set: function vec2set(v, a, b) {
		if (Util.isObject(a)/*vec2*/ && b === undefined) {
			v.x = 0 + a.x;
			v.y = 0 + a.y;
		}
		else if (Util.isType(a, "number") && Util.isType(b, "number")) {
			v.x = 0 + a;
			v.y = 0 + b;
		}
	},

	//static
	vec2clone: function vec2clone(v) {
		return new vec2(v.x, v.y);
	}
}

var Util = new Util_();
// <-- Util.js 
// Types.js --> 
// augmenting LensStudio's vec2 class -------

//vec2.prototype.class_name = "vec2";

// vec2.prototype.set = function set(a, b)
// {
// 	if (Util.isType(a, "vec2") && b === undefined)
// 	{
// 		this.x = 0 + a.x;
// 		this.y = 0 + a.y;
// 	}
// 	else if (Util.isType(a, "number") && Util.isType(b, "number"))
// 	{
// 		this.x = 0 + a;
// 		this.y = 0 + b;
// 	}
// };

// vec2.prototype.clone = function clone()
// {
// 	return new vec2(this.x, this.y);
// };

// ------------------------------------------

var M_PI = 3.1415926535;
const EPSILON = 1e-9;

const FingerspellRecognitionMode =
{
	DictionaryMatching: 0,
	Learn: 1
};

const HandSide =
{
	LEFT: 0,
	RIGHT: 1,
	NOT_DEFINED: 2
};

const HandLandmarkType =
{
	WRIST: 0,

	THUMB_0: 1,
	THUMB_1: 2,
	THUMB_2: 3,
	THUMB_3: 4,

	INDEX_0: 5,
	INDEX_1: 6,
	INDEX_2: 7,
	INDEX_3: 8,

	MIDDLE_0: 9,
	MIDDLE_1: 10,
	MIDDLE_2: 11,
	MIDDLE_3: 12,

	RING_0: 13,
	RING_1: 14,
	RING_2: 15,
	RING_3: 16,

	PINKY_0: 17,
	PINKY_1: 18,
	PINKY_2: 19,
	PINKY_3: 20,

	HandLandmark_COUNT: 21
};

function Pair(f, s) {
	this.first = f;
	this.second = s;
}

function Interval(b, e) {
	this.begin = b !== undefined ? b : -1;
	this.end = e !== undefined ? e : -1;
}

function Vec2Array(data) {
	this.vectors = [];

	this.init(data);
}


function CircularBuffer(maxSize, pred) {
	Util.assert(Util.isType(maxSize, "number"));

	this.elements = new Array(maxSize + 1);
	this.maxSize = maxSize + 1;

	this.first = 0;
	this.last = 0;

	if (pred !== undefined) {
		for (var i = 0; i < this.maxSize; ++i) {
			this.elements[i] = pred();
		}
	}
}

CircularBuffer.prototype =
{
	constructor: CircularBuffer.prototype.constructor,

	// add element to end
	push_back: function push_back(e) {
		this.elements[this.last] = e;
		this.last = (this.last + 1) % this.maxSize;
		if (this.last == this.first) {
			this.debug();
			Util.fatal("CircularBuffer overflow, last=" + this.last + ", first=" + this.first);
		}
	},

	// add element to end, and remove front if necessary (queue mode)
	push_back_auto: function push_back_auto(e) {
		if (this.full())
			this.remove_front();
		this.push_back(e);
	},

	// remove and return first element
	pop_front: function pop_front() {
		var e = this.elements[this.first];
		this.first = (this.first + 1) % this.maxSize;
		return e;
	},

	// add placeholder to end
	add_back: function add_back() {
		this.last = (this.last + 1) % this.maxSize;
		if (this.last == this.first) {
			this.debug();
			Util.fatal("CircularBuffer overflow, last=" + this.last + ", first=" + this.first);
		}
	},

	// add placeholder to end (by adjusting its index), and remove front if necessary (queue mode)
	add_back_auto: function add_back_auto() {
		if (this.full())
			this.remove_front();
		this.add_back();
	},

	// remove first element (by adjusting its index)
	remove_front: function remove_front() {
		this.first = (this.first + 1) % this.maxSize;
	},

	// remove (and get) last element
	pop_back: function pop_back() {
		this.last = this.last > 0 ? this.last - 1 : this.maxSize - 1;
		return this.elements[this.last];
	},

	empty: function empty() {
		return this.first == this.last;
	},

	full: function full() {
		return (this.last + 1) % this.maxSize == this.first;
	},

	front: function front() {
		return !this.empty() ? this.elements[this.first] : undefined;
	},

	getBackIdx: function getBackIdx() {
		return !this.empty() ? this.last > 0 ? this.last - 1 : this.maxSize - 1 : -1;
	},

	back: function back() {
		return !this.empty() ? this.elements[this.getBackIdx()] : undefined;
	},

	debug: function debug(verbose) {
		Util.log("first=" + this.first + ", last=" + this.last + ", maxSize=" + this.maxSize +
			", max_size()=" + this.max_size() + ", size()=" + this.size() +
			", empty()=" + this.empty() + ", full()=" + this.full()
		);
		if (verbose !== true) {
			for (var i = 0; i < this.maxSize; ++i)
				Util.log(this.elements[i] + " " + (i == this.first ? "F" : "") + (i == this.last ? "L" : ""));
			for (var i = 0; i < this.size(); ++i)
				Util.log("-> " + this.get(i));
		}
	},

	size: function size() {
		return this.first <= this.last ?
			this.last - this.first :
			this.last - this.first + this.maxSize;
	},

	max_size: function max_size() {
		return this.maxSize - 1;
	},

	clear: function clear() {
		this.first = this.last;
	},

	get: function get(i) {
		Util.assert(Util.isType(i, "number") && 0 <= i && i < this.size());
		return this.elements[(this.first + i) % this.maxSize];
	},

	set: function set(i, value) {
		Util.assert(Util.isType(i, "number") && 0 <= i && i < this.size());
		this.elements[(this.first + i) % this.maxSize] = value;
	},

	setBack: function setBack(value) {
		Util.assert(this.getBackIdx() != -1);
		this.elements[this.getBackIdx()] = value;
	}
};


function MovingAverage(window) {
	Util.assert(window === undefined || typeof window == "number");

	// this.queue = new Queue();
	this.queue = new CircularBuffer(window + 2); // because the size-reducing pop is executed after push
	this.sum = 0;
	this.window = window !== undefined ? window : 10;
}

MovingAverage.prototype =
{
	constructor: MovingAverage.prototype.constructor,

	add: function add(value) {
		Util.assert(typeof value == "number");

		if (this.queue.size() > this.window) {
			this.sum -= this.queue.front();
			this.queue.pop_front();
		}

		this.sum += value;
		this.queue.push_back(value);
	},

	get: function get() {
		return this.queue.empty() ? 0 : this.sum / this.queue.size();
	},

	getCount: function getCount() {
		return this.queue.size();
	},

	getSum: function getSum() {
		return this.sum;
	},
};


function Holder(typeName, value) {
	Util.assert(typeof typeName == "string", "typeName not given");
	Util.assert(Util.isType(value, typeName), Util.myTypeOf(value) + " != " + typeName);

	this.typeName = typeName;
	this.value = value;
}

Holder.prototype =
{
	constructor: Holder.prototype.constructor,

	set: function set(value) {
		Util.assert(Util.isType(value, this.typeName), Util.myTypeOf(value) + " != " + this.typeName);
		this.value = value;
	},

	get: function get() {
		return this.value;
	},
};
// <-- Types.js 
// profiler.js --> 
/*
 * Profiler Library v0.2-SNAPSHOT
 * http://github.com/jeremi/js-profiler
 *
 * Copyright 2010, Jeremi Joslin
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
/*jslint browser:true, evil:true, nomen:false */
/*global alert: false, confirm: false, console: true, prompt: false, window: true */
"use strict";

var profiler = profiler || (function () {
	var start_times = {},
		calls = {};

	function logCall(call_id, time) {
		if (typeof time !== "number" || isNaN(time)) {
			return;
		}
		if (!(call_id in calls)) {
			calls[call_id] = [time];
		} else {
			calls[call_id].push(time);
		}
	}

	function formatElem(elem) {
		var str = "";

		if (elem.tagName) {
			str = "&lt;" + elem.tagName.toLowerCase();

			if (elem.id) {
				str += "#" + elem.id;
			}
			if (elem.className) {
				str += "." + elem.className.replace(/ /g, ".");
			}
			str += "&gt;";
		} else {
			str = elem.nodeName;
		}

		return str;
	}

	function formatArgs(args) {
		var str = [], i, item;

		for (i = 0; i < args.length; i += 1) {
			item = args[i];

			if (item && item.constructor === Array) {
				str.push("Array(" + item.length + ")");
			} else if (item && item.nodeName) {
				str.push(formatElem(item));
			} else if (item && typeof item === "function") {
				str.push("function()");
			} else if (item && typeof item === "object") {
				str.push("{...}");
			} else if (typeof item === "string") {
				str.push('"' + item.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '"');
			} else {
				str.push(item + "");
			}
		}

		return str.join(", ");
	}

	function getFunction(name) {
		return eval(name);
	}

	function start_profiling(/* String */ call_id) {
		start_times[call_id] = (new Date()).getTime();
	}

	function stop_profiling(/* String */ call_id) {
		var diff = (new Date()).getTime() - start_times[call_id];
		logCall(call_id, diff);
		start_times[call_id] = undefined;
		return diff;
	}

	function instrument(name, max_depth) {
		//to avoid conflict of name, we should prefix our var
		var func, new_func, member;

		if (max_depth === undefined) {
			max_depth = 4;
		} else if (max_depth < 0) {
			return;
		}

		func = getFunction(name);

		if (!func || func._is_profiled || func.nodeName) {
			return;
		}

		if (typeof func === "object") {
			for (member in func) {
				if (member !== "prototype") {
					instrument(name + "[\"" + member + "\"]", max_depth - 1);
				}
			}
			return;
		}

		if (typeof func !== "function") {
			return;
		}
		new_func = function () {
			var res, call_id = name;// + "(" + formatArgs(arguments) + ")";
			start_profiling(call_id);
			try {
				res = func.apply(this, arguments);
			} finally {
				stop_profiling(call_id);
			}
			return res;
		};
		new_func._original = func;
		new_func._is_profiled = true;

		//we replace the old function by our modified one
		eval(name + "=new_func;");
	}

	function parseName(name) {
		var owner, func;
		if (name.indexOf("#") !== -1) {
			name = name.substring(0, name.indexOf("#"));
		}
		if (name.indexOf(".") === -1) {
			owner = null;
		} else {
			owner = eval(name.substring(0, name.lastIndexOf(".")));
		}
		func = eval(name);
		return [owner, func];
	}

	function process_stats(times) {
		var num = times.length, results = { runs: num }, i, log = 0;

		times = times.sort(function (a, b) {
			return a - b;
		});

		// Make Sum
		results.sum = 0;

		for (i = 0; i < num; i += 1) {
			results.sum += times[i];
		}

		// Make Min
		results.min = times[0];

		// Make Max
		results.max = times[num - 1];

		// Make Mean
		results.mean = results.sum / num;

		for (i = 0; i < num; i += 1) {
			log += Math.log(times[i]);
		}

		results.geometric_mean = Math.pow(Math.E, log / num);

		// Make Median
		results.median = num % 2 === 0 ?
			(times[Math.floor(num / 2)] + times[Math.ceil(num / 2)]) / 2 :
			times[Math.round(num / 2)];

		// Make Variance
		results.variance = 0;

		for (i = 0; i < num; i += 1) {
			results.variance += Math.pow(times[i] - results.mean, 2);
		}

		results.variance /= num - 1;

		// Make Standard Deviation
		results.deviation = Math.sqrt(results.variance);

		return results;
	}

	function getReports(/* String */ name) {
		var stats = [], report, call_id;
		if (name === undefined) {
			for (call_id in calls) {
				report = process_stats(calls[call_id]);
				report.name = call_id;
				stats.push(report);
			}
			return stats;
		}
		report = process_stats(calls[name]);
		report.name = name;
		return report;
	}

	function getValues(/* String */ name) {
		if (name === undefined) {
			return calls;
		}
		return calls[name];
	}

	function displayReport() {
		var reports = this.getReports(),
			report,
			report_id;

		//we sort by mean
		reports = reports.sort(function (a, b) {
			// return b.mean - a.mean;
			return b.sum - a.sum;
		});

		var maxLen = 0;
		for (report_id in reports) {
			report = reports[report_id];
			maxLen = Math.max(maxLen, report.name.length);
		}

		Util.log(Util.pad("Name", maxLen) + " | " + Util.pad("runs") + " | " + Util.pad("sum") + " | " + Util.pad("mean") + " | " + Util.pad("min") + " | " + Util.pad("max"));
		for (report_id in reports) {
			report = reports[report_id];
			if (typeof report === 'object') {
				Util.log(Util.pad(report.name, maxLen) + " | " + Util.pad(report.runs) + " | " + Util.pad(report.sum) + " | " + Util.pad(Math.round(report.mean * 100) / 100) + " | " + Util.pad(Math.round(report.min * 100) / 100) + " | " + Util.pad(Math.round(report.max * 100) / 100));
			}

		}
	}

	function getFunctionName(func) {
		var name = /\W*function\s+([\w\$]+)\(/.exec(func);
		if (!name) {
			return 'Anonymous Function';
		}
		return name[1];
	}

	function resetValues() {
		calls = [];
		return this;
	}

	return {
		start: start_profiling,
		stop: stop_profiling,

		profile: function (/* String */name, max_depth) {
			try {
				instrument(name, max_depth);
			} finally {
				/*if (window.console && console.log)*/ {
					/*console.log*/Util.log("Profiling of " + name + " ready");
				}
			}
			return this;
		},

		getReports: getReports,

		getValues: getValues,

		displayReport: displayReport,

		resetValues: resetValues,

		benchmark: {

			benchmark_fast_function: function (/* String */func_or_name, /* Function */callback, /* Function */next) {
				var res, owner, func, runs = [], r = 0, n;

				if (typeof func_or_name === "function") {
					owner = null;
					func = func_or_name;
					func_name = getFunctionName(func);
				} else {
					res = parseName(func_or_name);
					owner = res[0];
					func = res[1];
					func_name = func_or_name;
				}

				setTimeout(function () {
					var start = (new Date()).getTime(), diff = 0;

					for (n = 0; diff < 1000; n += 1) {
						func.apply(owner, []);
						diff = (new Date()).getTime() - start;
					}

					runs.push(n);

					if (r < 4) {
						r += 1;
						setTimeout(arguments.callee, 0);
					}
					else {
						callback(func_name, process_stats(runs));
						if (next) {
							setTimeout(next, 0);
						}
					}
				}, 0);
			},

			/*
			 * You should use this function if you want to benchmark a function that is slow
			 */
			benchmark_slow_function: function (/* Integer */repeat, /* String */func_or_name, /* Function */callback, /* Function */next) {
				var res, owner, func, i, func_name;

				if (typeof func_or_name === "function") {
					owner = null;
					func = func_or_name;
					func_name = getFunctionName(func);
				} else {
					res = parseName(func_or_name);
					owner = res[0];
					func = res[1];
					func_name = func_or_name;
				}


				setTimeout(function () {
					for (i = 0; i < repeat; i += 1) {
						start_profiling(func_name);
						func.apply(owner, []);
						stop_profiling(func_name);
					}
					callback(func_name, getReports(func_name));
					if (next) {
						setTimeout(next, 0);
					}
				}, 0);
			},

			resetValues: resetValues,

			getValues: getValues,

			displayReport: displayReport
		}
	};
}());// <-- profiler.js 
// HandLandmarkHelper.js --> 
function HandLandmarkHelper() {
}

//static
HandLandmarkHelper.tensorMaxValue = 224;

//static
HandLandmarkHelper.ShouldMirrorData = function ShouldMirrorData(hs/*, isMirroredFrame*/) {
	Util.assert(typeof (hs) == "number");
	// Util.assert(typeof(isMirroredFrame) == "boolean");

	return /*isMirroredFrame ? hs == HandSide.RIGHT :*/ hs == HandSide.LEFT;
}

// //static
// HandLandmarkHelper.transform = function transform(
// 	landmarkTensor, mirror, normalize_z, globalScaler,
// 	useNormalizer, normalizer1, normalizer2)
// {
// 	normalizer1 = normalizer1 !== undefined ? normalizer1 : HandLandmarkType.INDEX_0;
// 	normalizer2 = normalizer2 !== undefined ? normalizer2 : HandLandmarkType.PINKY_0;

// 	Util.assert(landmarkTensor instanceof Float32Array, "Float32Array expected, got " + Util.myTypeOf(landmarkTensor));

// 	Util.assert(landmarkTensor.length == HandLandmarkType.HandLandmark_COUNT * 3, "21 * 3 landmark is supported! got: " + landmarkTensor.length);

// 	var scale = globalScaler;
// 	var prevScaleZ = 1. / normalize_z;
// 	if (useNormalizer)
// 	{
// 		var normIx1 = normalizer1;
// 		var normIx2 = normalizer2;
// 		var normalizerPt1 = new vec3(landmarkTensor[normIx1 * 3 + 0], landmarkTensor[normIx1 * 3 + 1], landmarkTensor[normIx1 * 3 + 2] * prevScaleZ);
// 		var normalizerPt2 = new vec3(landmarkTensor[normIx2 * 3 + 0], landmarkTensor[normIx2 * 3 + 1], landmarkTensor[normIx2 * 3 + 2] * prevScaleZ);
// 		var normalizerValue = normalizerPt1.sub(normalizerPt2).length;
// 		scale /= normalizerValue;
// 	}
// 	var scaleZ = scale * prevScaleZ;

// 	for (var i = 0; i < landmarkTensor.length; i += 3) // implying 3D points
// 	{
// 		landmarkTensor[i + 0] = (mirror ? (HandLandmarkHelper.tensorMaxValue - landmarkTensor[i + 0]) : landmarkTensor[i + 0]) * scale;
// 		landmarkTensor[i + 1] = landmarkTensor[i + 1] * scale;
// 		landmarkTensor[i + 2] = landmarkTensor[i + 2] * scaleZ;
// 	}

// 	return landmarkTensor;
// };

// //static
// HandLandmarkHelper.computeRotation = function computeRotation(landmarks, image_size)
// {
//	 Util.assert(Util.myTypeOf(landmarks) == "Landmark3DList");
//	 const kWristJoint = HandLandmarkType.WRIST;
//	 const kMiddleFingerPIPJoint = HandLandmarkType.MIDDLE_0;
//	 const kIndexFingerPIPJoint = HandLandmarkType.INDEX_0;
//	 const kRingFingerPIPJoint = HandLandmarkType.RING_0;

//	 const x0 = landmarks.landmark(kWristJoint).x() * image_size.first;
//	 const y0 = landmarks.landmark(kWristJoint).y() * image_size.second;

//	 var x1 = (landmarks.landmark(kIndexFingerPIPJoint).x +
//				landmarks.landmark(kRingFingerPIPJoint).x) /
//			  2.;
//	 var y1 = (landmarks.landmark(kIndexFingerPIPJoint).y +
//				landmarks.landmark(kRingFingerPIPJoint).y) /
//			  2.;
//	 x1 = (x1 + landmarks.landmark(kMiddleFingerPIPJoint).x) / 2. *
//		  image_size.x;
//	 y1 = (y1 + landmarks.landmark(kMiddleFingerPIPJoint).y) / 2. *
//		  image_size.y;

//	 const rotation =
//		 normalizeRadians(kTargetAngle - Math.atan2(-(y1 - y0), x1 - x0));
//	 return rotation;
// };
// <-- HandLandmarkHelper.js 
// TensorsToClassification.js --> 
function Classification() {
	this.index = -1;
	this.score = 0;
	this.label = "";
}

//--------------

function TensorsToClassification() {
	this.label_map = [];
	this.min_score_threshold = 0.5;

	this.init();
}

TensorsToClassification.prototype =
{
	constructor: TensorsToClassification.prototype.constructor,

	init: function init() {
		this.label_map = [
			"ASL_0_NUM",
			"ASL_1_BENT",
			"ASL_25",
			"ASL_2_NUM",
			"ASL_3_CLOSED",
			"ASL_3_NUM",
			"ASL_4_MIR",
			"ASL_4_NUM",
			"ASL_5_CLAW",
			"ASL_5_CLAW_THUMB_OUT",
			"ASL_5_NUM",
			"ASL_6_NUM",
			"ASL_7_NUM",
			"ASL_8_NUM",
			"ASL_9_NUM",
			"ASL_A",
			"ASL_B",
			"ASL_B_BENT_THUMB_OUT",
			"ASL_B_THUMB_OUT",
			"ASL_C",
			"ASL_D",
			"ASL_E",
			"ASL_E_THUMB_OUT",
			"ASL_FK",
			"ASL_G",
			"ASL_G_CLOSED",
			"ASL_H",
			"ASL_HORNS",
			"ASL_I",
			"ASL_ILY",
			"ASL_J",
			"ASL_K",
			"ASL_L",
			"ASL_M",
			"ASL_N",
			"ASL_O_FLAT",
			"ASL_P",
			"ASL_Q",
			"ASL_R",
			"ASL_R_THUMB_OUT",
			"ASL_S",
			"ASL_T",
			"ASL_U",
			"ASL_U_THUMB_FORWARD",
			"ASL_U_THUMB_OUT",
			"ASL_V_CIRCLE",
			"ASL_X",
			"ASL_X_OVER_THUMB",
			"ASL_X_THUMB_OUT",
			"ASL_Y"
		];
	},

	process: function process(raw_scores) {
		Util.assert(raw_scores instanceof Float32Array);

		var num_classes = raw_scores.length;

		Util.assert(this.label_map.length == 0 || num_classes == this.label_map.length);

		var classification_list = [];
		for (var i = 0; i < num_classes; ++i) {
			if (raw_scores[i] < this.min_score_threshold)
				continue;

			var classification = new Classification();
			classification.index = i;
			classification.score = raw_scores[i];

			if (this.label_map.length != 0)
				classification.label = this.label_map[i];

			classification_list.push(classification);
		}

		return classification_list;
	}
};
// <-- TensorsToClassification.js 
// JointPretransform.js --> 
function JointPretransform() {
}

JointPretransform.prototype =
{
	constructor: JointPretransform.prototype.constructor,

	process: function process(handSide, joints_imageSpace, joints_transformed) {
		Util.assert(Util.isType(handSide, "number") && handSide !== HandSide.NOT_DEFINED);
		Util.assert(joints_imageSpace.length == joints_transformed.length, joints_imageSpace.length + "!=" + joints_transformed.length);
		Util.assert(joints_imageSpace.length > HandLandmarkType.RING_0);

		// centralize to top/center of palm
		var center = joints_imageSpace[HandLandmarkType.INDEX_0].add(joints_imageSpace[HandLandmarkType.RING_0]).uniformScale(0.5);
		for (var i = 0; i < joints_transformed.length; ++i) {
			Util.vec2set(joints_transformed[i], joints_imageSpace[i].sub(center));
		}

		// normalize with fist width
		var fistWidth = joints_transformed[HandLandmarkType.INDEX_0].distance(joints_transformed[HandLandmarkType.PINKY_0]);
		var invFistWidth = fistWidth < EPSILON ? 1 : 1 / fistWidth;
		if (fistWidth < EPSILON)
			Util.warning("fist width too small: " + fistWidth);
		for (var i = 0; i < joints_transformed.length; ++i) {
			// joints_transformed[i].set(joints_transformed[i].uniformScale(invFistWidth));
			joints_transformed[i].x *= invFistWidth;
			joints_transformed[i].y *= invFistWidth;
		}

		// mirror horizontally, if necessary
		var mirror = HandLandmarkHelper.ShouldMirrorData(handSide);
		if (mirror) {
			for (var i = 0; i < joints_transformed.length; ++i) {
				joints_transformed[i].x *= -1;
			}
		}

		return joints_transformed;
	}
};
// <-- JointPretransform.js 
// FingerspellCharacter.js --> 
const FingerspellCharacter =
{
	UNKNOWN: (Util.enumcnt = 0),
	ASL_A: ++Util.enumcnt,
	ASL_B: ++Util.enumcnt,
	ASL_C: ++Util.enumcnt,
	ASL_D: ++Util.enumcnt,
	ASL_E: ++Util.enumcnt,
	ASL_F: ++Util.enumcnt,
	ASL_G: ++Util.enumcnt,
	ASL_H: ++Util.enumcnt,
	ASL_I: ++Util.enumcnt,
	ASL_J: ++Util.enumcnt,
	ASL_K: ++Util.enumcnt,
	ASL_L: ++Util.enumcnt,
	ASL_M: ++Util.enumcnt,
	ASL_N: ++Util.enumcnt,
	ASL_O: ++Util.enumcnt,
	ASL_P: ++Util.enumcnt,
	ASL_Q: ++Util.enumcnt,
	ASL_R: ++Util.enumcnt,
	ASL_S: ++Util.enumcnt,
	ASL_T: ++Util.enumcnt,
	ASL_U: ++Util.enumcnt,
	ASL_V: ++Util.enumcnt,
	ASL_W: ++Util.enumcnt,
	ASL_X: ++Util.enumcnt,
	ASL_Y: ++Util.enumcnt,
	ASL_Z: ++Util.enumcnt,
	ASL_0: ++Util.enumcnt,
	ASL_1: ++Util.enumcnt,
	ASL_2: ++Util.enumcnt,
	ASL_3: ++Util.enumcnt,
	ASL_4: ++Util.enumcnt,
	ASL_5: ++Util.enumcnt,
	ASL_6: ++Util.enumcnt,
	ASL_7: ++Util.enumcnt,
	ASL_8: ++Util.enumcnt,
	ASL_9: ++Util.enumcnt,
	ASL_10: ++Util.enumcnt,
	ASL_1_BACK: ++Util.enumcnt,
	ASL_2_BACK: ++Util.enumcnt,
	ASL_3_BACK: ++Util.enumcnt,
	ASL_4_BACK: ++Util.enumcnt,
	ASL_5_BACK: ++Util.enumcnt,


	META_B_DOWN: (Util.enumcnt = 1000), // B palm facing down
	META_A_THUMBOUT: ++Util.enumcnt, // same as A but thumb is out
	META_B_BENT_IN: ++Util.enumcnt, // B bent palm facing inward (left for right hand)
	META_B_IN: ++Util.enumcnt, // B palm facing inward (left for right hand) and fingers directing forward
	META_B_IN_THUMBOUT: ++Util.enumcnt, // B palm facing inward (left for right hand) and fingers directing forward and thumb is out
	META_B_SIDE: ++Util.enumcnt, // B fingers directing inward (left for right hand) (palm facing stomach)
	META_B_SIDE_THUMBOUT: ++Util.enumcnt, // B fingers directing inward (left for right hand) (palm facing stomach) and thumb is out
	META_B_WAVE_IN: ++Util.enumcnt, // full waive from META_B_IN to META_B_SIDE
	META_B_WAVE_IN_THUMBOUT: ++Util.enumcnt, // full waive from META_B_IN_THUMBOUT to META_B_SIDE_THUMBOUT and thumb is out
	META_POINT_IN: ++Util.enumcnt // Pointing inward (left for right hand) similarly to "G" but thumb is not out
};

const sFc2Name =
{
	[FingerspellCharacter.UNKNOWN]: "UNKNOWN",
	[FingerspellCharacter.ASL_A]: "ASL_A",
	[FingerspellCharacter.ASL_B]: "ASL_B",
	[FingerspellCharacter.ASL_C]: "ASL_C",
	[FingerspellCharacter.ASL_D]: "ASL_D",
	[FingerspellCharacter.ASL_E]: "ASL_E",
	[FingerspellCharacter.ASL_F]: "ASL_F",
	[FingerspellCharacter.ASL_G]: "ASL_G",
	[FingerspellCharacter.ASL_H]: "ASL_H",
	[FingerspellCharacter.ASL_I]: "ASL_I",
	[FingerspellCharacter.ASL_J]: "ASL_J",
	[FingerspellCharacter.ASL_K]: "ASL_K",
	[FingerspellCharacter.ASL_L]: "ASL_L",
	[FingerspellCharacter.ASL_M]: "ASL_M",
	[FingerspellCharacter.ASL_N]: "ASL_N",
	[FingerspellCharacter.ASL_O]: "ASL_O",
	[FingerspellCharacter.ASL_P]: "ASL_P",
	[FingerspellCharacter.ASL_Q]: "ASL_Q",
	[FingerspellCharacter.ASL_R]: "ASL_R",
	[FingerspellCharacter.ASL_S]: "ASL_S",
	[FingerspellCharacter.ASL_T]: "ASL_T",
	[FingerspellCharacter.ASL_U]: "ASL_U",
	[FingerspellCharacter.ASL_V]: "ASL_V",
	[FingerspellCharacter.ASL_W]: "ASL_W",
	[FingerspellCharacter.ASL_X]: "ASL_X",
	[FingerspellCharacter.ASL_Y]: "ASL_Y",
	[FingerspellCharacter.ASL_Z]: "ASL_Z",
	[FingerspellCharacter.ASL_0]: "ASL_0",
	[FingerspellCharacter.ASL_1]: "ASL_1",
	[FingerspellCharacter.ASL_2]: "ASL_2",
	[FingerspellCharacter.ASL_3]: "ASL_3",
	[FingerspellCharacter.ASL_4]: "ASL_4",
	[FingerspellCharacter.ASL_5]: "ASL_5",
	[FingerspellCharacter.ASL_6]: "ASL_6",
	[FingerspellCharacter.ASL_7]: "ASL_7",
	[FingerspellCharacter.ASL_8]: "ASL_8",
	[FingerspellCharacter.ASL_9]: "ASL_9",
	[FingerspellCharacter.ASL_10]: "ASL_10",
	[FingerspellCharacter.ASL_1_BACK]: "ASL_1_BACK",
	[FingerspellCharacter.ASL_2_BACK]: "ASL_2_BACK",
	[FingerspellCharacter.ASL_3_BACK]: "ASL_3_BACK",
	[FingerspellCharacter.ASL_4_BACK]: "ASL_4_BACK",
	[FingerspellCharacter.ASL_5_BACK]: "ASL_5_BACK",

	[FingerspellCharacter.META_B_DOWN]: "META_B_DOWN",
	[FingerspellCharacter.META_A_THUMBOUT]: "META_A_THUMBOUT",
	[FingerspellCharacter.META_B_BENT_IN]: "META_B_BENT_IN",
	[FingerspellCharacter.META_B_IN]: "META_B_IN",
	[FingerspellCharacter.META_B_IN_THUMBOUT]: "META_B_IN_THUMBOUT",
	[FingerspellCharacter.META_B_SIDE]: "META_B_SIDE",
	[FingerspellCharacter.META_B_SIDE_THUMBOUT]: "META_B_SIDE_THUMBOUT",
	[FingerspellCharacter.META_B_WAVE_IN]: "META_B_WAVE_IN",
	[FingerspellCharacter.META_B_WAVE_IN_THUMBOUT]: "META_B_WAVE_IN_THUMBOUT",
	[FingerspellCharacter.META_POINT_IN]: "META_POINT_IN",
};

function isFingerspellCharacterNumber(x) {
	Util.assert(Util.isType(x, "number"));
	const numberFCs = [
		FingerspellCharacter.ASL_0,
		FingerspellCharacter.ASL_1,
		FingerspellCharacter.ASL_2,
		FingerspellCharacter.ASL_3,
		FingerspellCharacter.ASL_4,
		FingerspellCharacter.ASL_5,
		FingerspellCharacter.ASL_6,
		FingerspellCharacter.ASL_7,
		FingerspellCharacter.ASL_8,
		FingerspellCharacter.ASL_9,
		FingerspellCharacter.ASL_10,
		FingerspellCharacter.ASL_1_BACK,
		FingerspellCharacter.ASL_2_BACK,
		FingerspellCharacter.ASL_3_BACK,
		FingerspellCharacter.ASL_4_BACK,
		FingerspellCharacter.ASL_5_BACK,
	];
	return Util.findIndex(numberFCs, function (c) { return c == x; }) != -1;
}
// <-- FingerspellCharacter.js 
// FingerspellDetection.js --> 
function FingerspellDetection(character, confidence) {
	this.character = character !== undefined ? character : FingerspellCharacter.UNKNOWN;
	this.confidence = confidence !== undefined ? confidence : 0;
}

FingerspellDetection.prototype =
{
	constructor: FingerspellDetection.prototype.constructor,

	isValid: function isValid() {
		return this.character != FingerspellCharacter.UNKNOWN;
	}
};

//--------------

function FingerspellDetections() {
	this.all = [];
	this.best = new FingerspellDetection();
}
// <-- FingerspellDetection.js 
// TfHandShape.js --> 
const TfHandShape =
{
	//Extra
	UNINITIALIZED: -2,
	INVALID: -1,
	OTHER: 0,

	//sa::HandShape
	ASL_0_NUM: (Util.enumcnt = 1),
	ASL_1_NUM: ++Util.enumcnt,
	ASL_1_BENT: ++Util.enumcnt,
	ASL_1_BENT_THUMB_OUT: ++Util.enumcnt,
	ASL_2_NUM: ++Util.enumcnt,
	ASL_3_NUM: ++Util.enumcnt,
	ASL_3_CLOSED: ++Util.enumcnt,
	ASL_4_NUM: ++Util.enumcnt,
	ASL_5_NUM: ++Util.enumcnt,
	ASL_5_CLAW: ++Util.enumcnt,
	ASL_5_CLAW_THUMB_OUT: ++Util.enumcnt,
	ASL_6_NUM: ++Util.enumcnt,
	ASL_6_CLOSED: ++Util.enumcnt,
	ASL_7_NUM: ++Util.enumcnt,
	ASL_8_NUM: ++Util.enumcnt,
	ASL_9_FLAT: ++Util.enumcnt,
	ASL_9_NUM: ++Util.enumcnt,
	ASL_10: ++Util.enumcnt,
	ASL_25: ++Util.enumcnt,
	ASL_A: ++Util.enumcnt,
	ASL_B: ++Util.enumcnt,
	ASL_B_FLAT: ++Util.enumcnt,
	ASL_B_THUMB_OUT: ++Util.enumcnt,
	ASL_B_BENT: ++Util.enumcnt,
	ASL_B_BENT_THUMB_OUT: ++Util.enumcnt,
	ASL_C: ++Util.enumcnt,
	ASL_D: ++Util.enumcnt,
	ASL_E: ++Util.enumcnt,
	ASL_E_THUMB_OUT: ++Util.enumcnt,
	ASL_G: ++Util.enumcnt,
	ASL_G_CLOSED: ++Util.enumcnt,
	ASL_G_INDEX_CURVED: ++Util.enumcnt,
	ASL_G_OPEN: ++Util.enumcnt,
	ASL_I: ++Util.enumcnt,
	ASL_K: ++Util.enumcnt,
	ASL_L: ++Util.enumcnt,
	ASL_M: ++Util.enumcnt,
	ASL_M_OPEN: ++Util.enumcnt,
	ASL_N: ++Util.enumcnt,
	ASL_N_OPEN: ++Util.enumcnt,
	ASL_O_FLAT: ++Util.enumcnt,
	ASL_R: ++Util.enumcnt,
	ASL_R_THUMB_OUT: ++Util.enumcnt,
	ASL_S: ++Util.enumcnt,
	ASL_T: ++Util.enumcnt,
	ASL_U: ++Util.enumcnt,
	ASL_U_THUMB_FORWARD: ++Util.enumcnt,
	ASL_U_THUMB_OUT: ++Util.enumcnt,
	ASL_V_CIRCLE: ++Util.enumcnt,
	ASL_X: ++Util.enumcnt,
	ASL_X_OVER_THUMB: ++Util.enumcnt,
	ASL_X_THUMB_OUT: ++Util.enumcnt,
	ASL_Y: ++Util.enumcnt,
	ASL_Y_OPEN: ++Util.enumcnt,

	ASL_HORNS: ++Util.enumcnt,
	ASL_ILY: ++Util.enumcnt,

	ASL_E_OPEN: ++Util.enumcnt,

	//Extra for fingerspell characters
	ASL_H: ++Util.enumcnt,
	ASL_J: ++Util.enumcnt,
	ASL_P: ++Util.enumcnt,
	ASL_Q: ++Util.enumcnt,
	ASL_Z: ++Util.enumcnt,

	ASL_1_BACK: ++Util.enumcnt,
	ASL_2_BACK: ++Util.enumcnt,
	ASL_3_BACK: ++Util.enumcnt,
	ASL_4_BACK: ++Util.enumcnt,
	ASL_5_BACK: ++Util.enumcnt,

	META_B_DOWN: ++Util.enumcnt,
	META_A_THUMBOUT: ++Util.enumcnt,
	META_B_BENT_IN: ++Util.enumcnt,
	META_B_IN: ++Util.enumcnt,
	META_B_IN_THUMBOUT: ++Util.enumcnt,
	META_B_SIDE: ++Util.enumcnt,
	META_B_SIDE_THUMBOUT: ++Util.enumcnt,
	META_B_WAVE_IN: ++Util.enumcnt,
	META_B_WAVE_IN_THUMBOUT: ++Util.enumcnt,
	META_POINT_IN: ++Util.enumcnt,

	//Extra
	ASL_6_BACK: ++Util.enumcnt,
	ASL_7_BACK: ++Util.enumcnt,
	ASL_8_BACK: ++Util.enumcnt,
	ASL_9_BACK: ++Util.enumcnt,

	ASL_4_MIR: ++Util.enumcnt,
	ASL_4_MIR_BACK: ++Util.enumcnt,

	ASL_FK: ++Util.enumcnt,
	ASL_FK_BACK: ++Util.enumcnt,
};

const sTfH2Name =
{
	[TfHandShape.UNINITIALIZED]: "UNINITIALIZED",
	[TfHandShape.INVALID]: "INVALID",
	[TfHandShape.OTHER]: "OTHER",

	[TfHandShape.ASL_0_NUM]: "ASL_0_NUM",
	[TfHandShape.ASL_1_NUM]: "ASL_1_NUM",
	[TfHandShape.ASL_1_BENT]: "ASL_1_BENT",
	[TfHandShape.ASL_1_BENT_THUMB_OUT]: "ASL_1_BENT_THUMB_OUT",
	[TfHandShape.ASL_2_NUM]: "ASL_2_NUM",
	[TfHandShape.ASL_3_NUM]: "ASL_3_NUM",
	[TfHandShape.ASL_3_CLOSED]: "ASL_3_CLOSED",
	[TfHandShape.ASL_4_NUM]: "ASL_4_NUM",
	[TfHandShape.ASL_5_NUM]: "ASL_5_NUM",
	[TfHandShape.ASL_5_CLAW]: "ASL_5_CLAW",
	[TfHandShape.ASL_5_CLAW_THUMB_OUT]: "ASL_5_CLAW_THUMB_OUT",
	[TfHandShape.ASL_6_NUM]: "ASL_6_NUM",
	[TfHandShape.ASL_6_CLOSED]: "ASL_6_CLOSED",
	[TfHandShape.ASL_7_NUM]: "ASL_7_NUM",
	[TfHandShape.ASL_8_NUM]: "ASL_8_NUM",
	[TfHandShape.ASL_9_FLAT]: "ASL_9_FLAT",
	[TfHandShape.ASL_9_NUM]: "ASL_9_NUM",
	[TfHandShape.ASL_10]: "ASL_10",
	[TfHandShape.ASL_25]: "ASL_25",
	[TfHandShape.ASL_A]: "ASL_A",
	[TfHandShape.ASL_B]: "ASL_B",
	[TfHandShape.ASL_B_FLAT]: "ASL_B_FLAT",
	[TfHandShape.ASL_B_THUMB_OUT]: "ASL_B_THUMB_OUT",
	[TfHandShape.ASL_B_BENT]: "ASL_B_BENT",
	[TfHandShape.ASL_B_BENT_THUMB_OUT]: "ASL_B_BENT_THUMB_OUT",
	[TfHandShape.ASL_C]: "ASL_C",
	[TfHandShape.ASL_D]: "ASL_D",
	[TfHandShape.ASL_E]: "ASL_E",
	[TfHandShape.ASL_E_THUMB_OUT]: "ASL_E_THUMB_OUT",
	[TfHandShape.ASL_G]: "ASL_G",
	[TfHandShape.ASL_G_CLOSED]: "ASL_G_CLOSED",
	[TfHandShape.ASL_G_INDEX_CURVED]: "ASL_G_INDEX_CURVED",
	[TfHandShape.ASL_G_OPEN]: "ASL_G_OPEN",
	[TfHandShape.ASL_I]: "ASL_I",
	[TfHandShape.ASL_K]: "ASL_K",
	[TfHandShape.ASL_L]: "ASL_L",
	[TfHandShape.ASL_M]: "ASL_M",
	[TfHandShape.ASL_M_OPEN]: "ASL_M_OPEN",
	[TfHandShape.ASL_N]: "ASL_N",
	[TfHandShape.ASL_N_OPEN]: "ASL_N_OPEN",
	[TfHandShape.ASL_O_FLAT]: "ASL_O_FLAT",
	[TfHandShape.ASL_R]: "ASL_R",
	[TfHandShape.ASL_R_THUMB_OUT]: "ASL_R_THUMB_OUT",
	[TfHandShape.ASL_S]: "ASL_S",
	[TfHandShape.ASL_T]: "ASL_T",
	[TfHandShape.ASL_U]: "ASL_U",
	[TfHandShape.ASL_U_THUMB_FORWARD]: "ASL_U_THUMB_FORWARD",
	[TfHandShape.ASL_U_THUMB_OUT]: "ASL_U_THUMB_OUT",
	[TfHandShape.ASL_V_CIRCLE]: "ASL_V_CIRCLE",
	[TfHandShape.ASL_X]: "ASL_X",
	[TfHandShape.ASL_X_OVER_THUMB]: "ASL_X_OVER_THUMB",
	[TfHandShape.ASL_X_THUMB_OUT]: "ASL_X_THUMB_OUT",
	[TfHandShape.ASL_Y]: "ASL_Y",
	[TfHandShape.ASL_Y_OPEN]: "ASL_Y_OPEN",

	[TfHandShape.ASL_HORNS]: "ASL_HORNS",
	[TfHandShape.ASL_ILY]: "ASL_ILY",

	[TfHandShape.ASL_E_OPEN]: "ASL_E_OPEN",

	[TfHandShape.ASL_H]: "ASL_H",
	[TfHandShape.ASL_J]: "ASL_J",
	[TfHandShape.ASL_P]: "ASL_P",
	[TfHandShape.ASL_Q]: "ASL_Q",
	[TfHandShape.ASL_Z]: "ASL_Z",

	[TfHandShape.ASL_1_BACK]: "ASL_1_BACK",
	[TfHandShape.ASL_2_BACK]: "ASL_2_BACK",
	[TfHandShape.ASL_3_BACK]: "ASL_3_BACK",
	[TfHandShape.ASL_4_BACK]: "ASL_4_BACK",
	[TfHandShape.ASL_5_BACK]: "ASL_5_BACK",

	[TfHandShape.META_B_DOWN]: "META_B_DOWN",
	[TfHandShape.META_A_THUMBOUT]: "META_A_THUMBOUT",
	[TfHandShape.META_B_BENT_IN]: "META_B_BENT_IN",
	[TfHandShape.META_B_IN]: "META_B_IN",
	[TfHandShape.META_B_IN_THUMBOUT]: "META_B_IN_THUMBOUT",
	[TfHandShape.META_B_SIDE]: "META_B_SIDE",
	[TfHandShape.META_B_SIDE_THUMBOUT]: "META_B_SIDE_THUMBOUT",
	[TfHandShape.META_B_WAVE_IN]: "META_B_WAVE_IN",
	[TfHandShape.META_B_WAVE_IN_THUMBOUT]: "META_B_WAVE_IN_THUMBOUT",
	[TfHandShape.META_POINT_IN]: "META_POINT_IN",

	[TfHandShape.ASL_6_BACK]: "ASL_6_BACK",
	[TfHandShape.ASL_7_BACK]: "ASL_7_BACK",
	[TfHandShape.ASL_8_BACK]: "ASL_8_BACK",
	[TfHandShape.ASL_9_BACK]: "ASL_9_BACK",

	[TfHandShape.ASL_4_MIR]: "ASL_4_MIR",
	[TfHandShape.ASL_4_MIR_BACK]: "ASL_4_MIR_BACK",

	[TfHandShape.ASL_FK]: "ASL_FK",
	[TfHandShape.ASL_FK_BACK]: "ASL_FK_BACK",
};

const sName2TfH =
{
	"UNINITIALIZED": TfHandShape.UNINITIALIZED,
	"INVALID": TfHandShape.INVALID,
	"OTHER": TfHandShape.OTHER,

	"ASL_0_NUM": TfHandShape.ASL_0_NUM,
	"ASL_1_NUM": TfHandShape.ASL_1_NUM,
	"ASL_1_BENT": TfHandShape.ASL_1_BENT,
	"ASL_1_BENT_THUMB_OUT": TfHandShape.ASL_1_BENT_THUMB_OUT,
	"ASL_2_NUM": TfHandShape.ASL_2_NUM,
	"ASL_3_NUM": TfHandShape.ASL_3_NUM,
	"ASL_3_CLOSED": TfHandShape.ASL_3_CLOSED,
	"ASL_4_NUM": TfHandShape.ASL_4_NUM,
	"ASL_5_NUM": TfHandShape.ASL_5_NUM,
	"ASL_5_CLAW": TfHandShape.ASL_5_CLAW,
	"ASL_5_CLAW_THUMB_OUT": TfHandShape.ASL_5_CLAW_THUMB_OUT,
	"ASL_6_NUM": TfHandShape.ASL_6_NUM,
	"ASL_6_CLOSED": TfHandShape.ASL_6_CLOSED,
	"ASL_7_NUM": TfHandShape.ASL_7_NUM,
	"ASL_8_NUM": TfHandShape.ASL_8_NUM,
	"ASL_9_FLAT": TfHandShape.ASL_9_FLAT,
	"ASL_9_NUM": TfHandShape.ASL_9_NUM,
	"ASL_10": TfHandShape.ASL_10,
	"ASL_25": TfHandShape.ASL_25,
	"ASL_A": TfHandShape.ASL_A,
	"ASL_B": TfHandShape.ASL_B,
	"ASL_B_FLAT": TfHandShape.ASL_B_FLAT,
	"ASL_B_THUMB_OUT": TfHandShape.ASL_B_THUMB_OUT,
	"ASL_B_BENT": TfHandShape.ASL_B_BENT,
	"ASL_B_BENT_THUMB_OUT": TfHandShape.ASL_B_BENT_THUMB_OUT,
	"ASL_C": TfHandShape.ASL_C,
	"ASL_D": TfHandShape.ASL_D,
	"ASL_E": TfHandShape.ASL_E,
	"ASL_E_THUMB_OUT": TfHandShape.ASL_E_THUMB_OUT,
	"ASL_G": TfHandShape.ASL_G,
	"ASL_G_CLOSED": TfHandShape.ASL_G_CLOSED,
	"ASL_G_INDEX_CURVED": TfHandShape.ASL_G_INDEX_CURVED,
	"ASL_G_OPEN": TfHandShape.ASL_G_OPEN,
	"ASL_I": TfHandShape.ASL_I,
	"ASL_K": TfHandShape.ASL_K,
	"ASL_L": TfHandShape.ASL_L,
	"ASL_M": TfHandShape.ASL_M,
	"ASL_M_OPEN": TfHandShape.ASL_M_OPEN,
	"ASL_N": TfHandShape.ASL_N,
	"ASL_N_OPEN": TfHandShape.ASL_N_OPEN,
	"ASL_O_FLAT": TfHandShape.ASL_O_FLAT,
	"ASL_R": TfHandShape.ASL_R,
	"ASL_R_THUMB_OUT": TfHandShape.ASL_R_THUMB_OUT,
	"ASL_S": TfHandShape.ASL_S,
	"ASL_T": TfHandShape.ASL_T,
	"ASL_U": TfHandShape.ASL_U,
	"ASL_U_THUMB_FORWARD": TfHandShape.ASL_U_THUMB_FORWARD,
	"ASL_U_THUMB_OUT": TfHandShape.ASL_U_THUMB_OUT,
	"ASL_V_CIRCLE": TfHandShape.ASL_V_CIRCLE,
	"ASL_X": TfHandShape.ASL_X,
	"ASL_X_OVER_THUMB": TfHandShape.ASL_X_OVER_THUMB,
	"ASL_X_THUMB_OUT": TfHandShape.ASL_X_THUMB_OUT,
	"ASL_Y": TfHandShape.ASL_Y,
	"ASL_Y_OPEN": TfHandShape.ASL_Y_OPEN,

	"ASL_HORNS": TfHandShape.ASL_HORNS,
	"ASL_ILY": TfHandShape.ASL_ILY,

	"ASL_E_OPEN": TfHandShape.ASL_E_OPEN,

	"ASL_H": TfHandShape.ASL_H,
	"ASL_J": TfHandShape.ASL_J,
	"ASL_P": TfHandShape.ASL_P,
	"ASL_Q": TfHandShape.ASL_Q,
	"ASL_Z": TfHandShape.ASL_Z,

	"ASL_1_BACK": TfHandShape.ASL_1_BACK,
	"ASL_2_BACK": TfHandShape.ASL_2_BACK,
	"ASL_3_BACK": TfHandShape.ASL_3_BACK,
	"ASL_4_BACK": TfHandShape.ASL_4_BACK,
	"ASL_5_BACK": TfHandShape.ASL_5_BACK,

	"META_B_DOWN": TfHandShape.META_B_DOWN,
	"META_A_THUMBOUT": TfHandShape.META_A_THUMBOUT,
	"META_B_BENT_IN": TfHandShape.META_B_BENT_IN,
	"META_B_IN": TfHandShape.META_B_IN,
	"META_B_IN_THUMBOUT": TfHandShape.META_B_IN_THUMBOUT,
	"META_B_SIDE": TfHandShape.META_B_SIDE,
	"META_B_SIDE_THUMBOUT": TfHandShape.META_B_SIDE_THUMBOUT,
	"META_B_WAVE_IN": TfHandShape.META_B_WAVE_IN,
	"META_B_WAVE_IN_THUMBOUT": TfHandShape.META_B_WAVE_IN_THUMBOUT,
	"META_POINT_IN": TfHandShape.META_POINT_IN,

	"ASL_6_BACK": TfHandShape.ASL_6_BACK,
	"ASL_7_BACK": TfHandShape.ASL_7_BACK,
	"ASL_8_BACK": TfHandShape.ASL_8_BACK,
	"ASL_9_BACK": TfHandShape.ASL_9_BACK,

	"ASL_4_MIR": TfHandShape.ASL_4_MIR,
	"ASL_4_MIR_BACK": TfHandShape.ASL_4_MIR_BACK,

	"ASL_FK": TfHandShape.ASL_FK,
	"ASL_FK_BACK": TfHandShape.ASL_FK_BACK,
};

const sTfH2Fc =
{
	[TfHandShape.UNINITIALIZED]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.INVALID]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.OTHER]: [FingerspellCharacter.UNKNOWN],

	[TfHandShape.ASL_0_NUM]: [FingerspellCharacter.ASL_O, FingerspellCharacter.ASL_0],
	[TfHandShape.ASL_1_NUM]: [FingerspellCharacter.ASL_1],
	[TfHandShape.ASL_1_BENT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_1_BENT_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_2_NUM]: [FingerspellCharacter.ASL_V, FingerspellCharacter.ASL_2],
	[TfHandShape.ASL_3_NUM]: [FingerspellCharacter.ASL_3],
	[TfHandShape.ASL_3_CLOSED]: [FingerspellCharacter.ASL_H],
	[TfHandShape.ASL_4_NUM]: [FingerspellCharacter.ASL_4],
	[TfHandShape.ASL_5_NUM]: [FingerspellCharacter.ASL_5],
	[TfHandShape.ASL_5_CLAW]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_5_CLAW_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_6_NUM]: [FingerspellCharacter.ASL_W, FingerspellCharacter.ASL_6],
	[TfHandShape.ASL_6_CLOSED]: [FingerspellCharacter.ASL_W, FingerspellCharacter.ASL_6],
	[TfHandShape.ASL_7_NUM]: [FingerspellCharacter.ASL_7],
	[TfHandShape.ASL_8_NUM]: [FingerspellCharacter.ASL_8],
	[TfHandShape.ASL_9_FLAT]: [FingerspellCharacter.ASL_F, FingerspellCharacter.ASL_9],
	[TfHandShape.ASL_9_NUM]: [FingerspellCharacter.ASL_F, FingerspellCharacter.ASL_9],
	[TfHandShape.ASL_10]: [FingerspellCharacter.ASL_A, FingerspellCharacter.ASL_10],
	[TfHandShape.ASL_25]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_A]: [FingerspellCharacter.ASL_A],
	[TfHandShape.ASL_B]: [FingerspellCharacter.ASL_B],
	[TfHandShape.ASL_B_FLAT]: [FingerspellCharacter.ASL_B],
	[TfHandShape.ASL_B_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_B_BENT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_B_BENT_THUMB_OUT]: [FingerspellCharacter.ASL_G],
	[TfHandShape.ASL_C]: [FingerspellCharacter.ASL_C],
	[TfHandShape.ASL_D]: [FingerspellCharacter.ASL_D, FingerspellCharacter.ASL_1],
	[TfHandShape.ASL_E]: [FingerspellCharacter.ASL_E],
	[TfHandShape.ASL_E_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_G]: [FingerspellCharacter.ASL_G],
	[TfHandShape.ASL_G_CLOSED]: [FingerspellCharacter.ASL_O],
	[TfHandShape.ASL_G_INDEX_CURVED]: [FingerspellCharacter.ASL_G],
	[TfHandShape.ASL_G_OPEN]: [FingerspellCharacter.ASL_L],
	[TfHandShape.ASL_I]: [FingerspellCharacter.ASL_I],
	[TfHandShape.ASL_K]: [FingerspellCharacter.ASL_K],
	[TfHandShape.ASL_L]: [FingerspellCharacter.ASL_L],
	[TfHandShape.ASL_M]: [FingerspellCharacter.ASL_M],
	[TfHandShape.ASL_M_OPEN]: [FingerspellCharacter.ASL_M],
	[TfHandShape.ASL_N]: [FingerspellCharacter.ASL_N],
	[TfHandShape.ASL_N_OPEN]: [FingerspellCharacter.ASL_N],
	[TfHandShape.ASL_O_FLAT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_R]: [FingerspellCharacter.ASL_R],
	[TfHandShape.ASL_R_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_S]: [FingerspellCharacter.ASL_S],
	[TfHandShape.ASL_T]: [FingerspellCharacter.ASL_T],
	[TfHandShape.ASL_U]: [FingerspellCharacter.ASL_U],
	[TfHandShape.ASL_U_THUMB_FORWARD]: [FingerspellCharacter.ASL_U],
	[TfHandShape.ASL_U_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_V_CIRCLE]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_X]: [FingerspellCharacter.ASL_X],
	[TfHandShape.ASL_X_OVER_THUMB]: [FingerspellCharacter.ASL_T],
	[TfHandShape.ASL_X_THUMB_OUT]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_Y]: [FingerspellCharacter.ASL_Y],
	[TfHandShape.ASL_Y_OPEN]: [FingerspellCharacter.ASL_Y],

	[TfHandShape.ASL_HORNS]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_ILY]: [FingerspellCharacter.UNKNOWN],

	[TfHandShape.ASL_E_OPEN]: [FingerspellCharacter.ASL_E],

	[TfHandShape.ASL_H]: [FingerspellCharacter.ASL_H],
	[TfHandShape.ASL_J]: [FingerspellCharacter.ASL_J],
	[TfHandShape.ASL_P]: [FingerspellCharacter.ASL_P],
	[TfHandShape.ASL_Q]: [FingerspellCharacter.ASL_Q],
	[TfHandShape.ASL_Z]: [FingerspellCharacter.ASL_Z],

	[TfHandShape.ASL_1_BACK]: [FingerspellCharacter.ASL_1_BACK],
	[TfHandShape.ASL_2_BACK]: [FingerspellCharacter.ASL_2_BACK],
	[TfHandShape.ASL_3_BACK]: [FingerspellCharacter.ASL_3_BACK],
	[TfHandShape.ASL_4_BACK]: [FingerspellCharacter.ASL_4_BACK],
	[TfHandShape.ASL_5_BACK]: [FingerspellCharacter.ASL_5_BACK],

	[TfHandShape.META_B_DOWN]: [FingerspellCharacter.META_B_DOWN],
	[TfHandShape.META_A_THUMBOUT]: [FingerspellCharacter.META_A_THUMBOUT],
	[TfHandShape.META_B_BENT_IN]: [FingerspellCharacter.META_B_BENT_IN],
	[TfHandShape.META_B_IN]: [FingerspellCharacter.META_B_IN],
	[TfHandShape.META_B_IN_THUMBOUT]: [FingerspellCharacter.META_B_IN_THUMBOUT],
	[TfHandShape.META_B_SIDE]: [FingerspellCharacter.META_B_SIDE],
	[TfHandShape.META_B_SIDE_THUMBOUT]: [FingerspellCharacter.META_B_SIDE_THUMBOUT],
	[TfHandShape.META_B_WAVE_IN]: [FingerspellCharacter.META_B_WAVE_IN],
	[TfHandShape.META_B_WAVE_IN_THUMBOUT]: [FingerspellCharacter.META_B_WAVE_IN_THUMBOUT],
	[TfHandShape.META_POINT_IN]: [FingerspellCharacter.META_POINT_IN],

	[TfHandShape.ASL_6_BACK]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_7_BACK]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_8_BACK]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_9_BACK]: [FingerspellCharacter.UNKNOWN],

	[TfHandShape.ASL_4_MIR]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_4_MIR_BACK]: [FingerspellCharacter.UNKNOWN],

	[TfHandShape.ASL_FK]: [FingerspellCharacter.UNKNOWN],
	[TfHandShape.ASL_FK_BACK]: [FingerspellCharacter.UNKNOWN],
};
// <-- TfHandShape.js 
// FrameDetection.js --> 
function FrameDetection() {
	this.detection = null; // FingerspellCharacter
}

FrameDetection.prototype =
{
	constructor: FrameDetection.prototype.constructor,

	clear: function clear() {
		this.detection = null;
	},

	isEmpty: function isEmpty() {
		return this.detection === null;
	},

	equals: function equals(other) {
		Util.assert(Util.myTypeOf(other) == "FrameDetection");
		return !this.isEmpty() && this.detection === other.detection;
	},

	copy: function copy(other) {
		Util.assert(Util.myTypeOf(other) == "FrameDetection");
		return this.detection = other.detection;
	}
};
// <-- FrameDetection.js 
// Suggestion.js --> 
const sSuggestions =
	[
		"Alexander Skarsgard",
		"Ashley Judd",
		"Ryan Phillippe",
		"Blake Lively",
		"Brie Larson",
		"Britt Robertson",
		"Caity Lotz",
		"Carly Chaikin",
		"Caroline Dhavernas",
		"Carrie Coon",
		"Chad Michael Murray",
		"Charlie Cox",
		"Alicia Silverstone",
		"Chris Evans",
		"Chris Hemsworth",
		"Colin Farrell",
		"Danielle Panabaker",
		"David Boreanaz",
		"Deborah Ann Woll",
		"Desmond Harrington",
		"Diane Lane",
		"Drew Barrymore",
		"Elisha Cuthbert",
		"Alison Brie",
		"Elizabeth Hurley",
		"Emily Blunt",
		"Emma Stone",
		"Erica Durance",
		"Fran Drescher",
		"Garret Dillahunt",
		"Gerard Butler",
		"Gwyneth Paltrow",
		"Helen Hunt",
		"Holly Marie Combs",
		"Amanda Bynes",
		"Jake Gyllenhaal",
		"James Marsden",
		"Jane Levy",
		"Jason Ralph",
		"Jenna Fischer",
		"Jennifer Aniston",
		"Jennifer Carpenter",
		"Jennifer Connelly",
		"Jessica Biel",
		"Joe Anderson",
		"Amy Adams",
		"Joel Kinnaman",
		"Josh Hutcherson",
		"Jude Law",
		"Julianne Moore",
		"Justin Theroux",
		"Karl Urban",
		"Kate Beckinsale",
		"Keri Russell",
		"Mary Elizabeth Winstead",
		"Mary-Louise Parker",
		"Anna Faris",
		"Melissa George",
		"Michiel Huisman",
		"Mike Vogel",
		"Nicole Kidman",
		"Octavia Spencer",
		"Paul Rudd",
		"Rachael Taylor",
		"Rachel McAdams",
		"Radha Mitchell",
		"Reese Witherspoon",
		"Anna Paquin",
		"Rob Mayes",
		"Rose Byrne",
		"Sam Rockwell",
		"Sarah Michelle Gellar",
		"Scott Speedman",
		"Sebastian Stan",
		"Shane West",
		"Timothy Olyphant",
		"Tom Hardy",
		"Toni Collette",
		"Annalise Basso",
		"Tyler Hoechlin",
		"Vera Farmiga",
		"Vinessa Shaw",
		"Viola Davis",
		"Jennifer Garner",
		"James Ransone",
		"Jay Harrington",
		"Josh Duhamel",
		"Elizabeth Olsen",
		"James Lafferty",
		"Anne Hathaway",
		"Zachary Knighton",
		"Christian Cooke",
		"Jessica Chastain",
		"Brittany Murphy",
		"Leighton Meester",
		"Erin Karpluk",
		"Gillian Jacobs",
		"Alex Pettyfer",
		"Dylan Bruce",
		"Patrick Wilson",
	];

function Suggestion() {
	this.wordToMatch = "";
	this.originalWordIdx = -1;
}

//static
Suggestion.createSuggestions = function createSuggestions(input) {
	var suggestions = new Array(input.length);
	for (var i = 0; i < input.length; ++i) {
		var word = input[i].toUpperCase();

		// remove spaces
		word = Util.accumulate(word, "", function (s, c) { return s + (c !== " " ? c : ""); });

		// remove duplicates
		word = Util.accumulate(word, "", function (s, c) { return s + (s.length = 0 || c !== s[s.length - 1] ? c : ""); });

		var s = new Suggestion();
		s.wordToMatch = word;
		s.originalWordIdx = i;
		suggestions[i] = s;
	}
	return suggestions;
};
// <-- Suggestion.js 
// ZCharacterDetector.js --> 
const CoolDownState =
{
	NONE: 0,
	IN_PROGRESS: 1,
	ELAPSED: 2
};

function PositionData(timestamp, position) {
	Util.assert(Util.isType(timestamp, "number"));
	Util.assert(Util.isObject(position)/*vec2*/);

	this.timestamp = timestamp !== undefined ? timestamp : 0;
	this.position = position !== undefined ? Util.vec2clone(position) : new vec2(0, 0);
}

//-------------------

function ZCharacterDetector(frontalSigning, detectionInterval, averageWindow, useOptimization) {
	this.useOptimization = useOptimization !== undefined ? useOptimization : false;

	this.currentTs = -1;
	this.currentScale = -1;
	this.lastDetectionTs = -1;

	this.indexFingertipMarkers = null; //CircularBuffer
	this.extractedData = null; //CircularBuffer
	this.segments = [];
	this.maxZigZagCount = 0;

	this.positions_for_extractData = null; // Array

	this.frontalSigning = frontalSigning;
	this.detectionInterval = detectionInterval !== undefined ? detectionInterval : 1000;
	this.averageWindow = averageWindow !== undefined ? averageWindow : 100;
	this.init();
}

//------------ subclasses begin ------------
ZCharacterDetector.Data = function Data(ts, m, isZCharacter, scale) {
	Util.assert(Util.isType(ts, "number"));
	Util.assert(Util.isObject(m)/*vec2*/);
	Util.assert(Util.isType(isZCharacter, "boolean"));
	Util.assert(Util.isType(scale, "number"));

	this.timestamp = ts !== undefined ? ts : 0;
	this.markerPosition = m !== undefined ? Util.vec2clone(m) : new vec2(0, 0);
	this.isZ = isZCharacter !== undefined ? isZCharacter : false;
	this.scale = scale;
}

ZCharacterDetector.FilteredData = function FilteredData() {
	this.timestamp = 0;
	this.position = new vec2(0, 0);
	this.velocity = new vec2(0, 0);
	this.isZ = false;
}

ZCharacterDetector.Segment = function Segment(i, start, end) {
	Util.assert(Util.isType(i, "Interval"));
	Util.assert(Util.isObject(start)/*vec2*/);
	Util.assert(Util.isObject(end)/*vec2*/);

	this.interval = i !== undefined ? i : new Interval(0, 0);
	this.startPosition = start !== undefined ? Util.vec2clone(start) : new vec2(0, 0);
	this.endPosition = end !== undefined ? Util.vec2clone(end) : new vec2(0, 0);

	//dummy version
	this.dir = new vec2(0, 0);
	this.isValidX = false;
	this.isValidY = false;
	this.validCharacterRatio = 0;
	this.tmpRatio = 0;
	this.isValidCharacterRatio = false;

	//debug
	this.isChecked = false;
	this.usedForCharacter = false;
	this.zigZagIndex = -1;
}
//------------ subclasses end ------------

ZCharacterDetector.prototype =
{
	constructor: ZCharacterDetector.prototype.constructor,

	init: function init() {
		var bufferSize = Math.ceil(1.1 * this.detectionInterval / 16.); // allocating size for 60 FPS

		this.indexFingertipMarkers = new CircularBuffer(bufferSize);
		this.extractedData = new CircularBuffer(bufferSize);

		this.positions_for_extractData = new Array(this.indexFingertipMarkers.maxSize);
	},

	setFrontalSigning: function setFrontalSigning(f) {
		this.frontalSigning = f;
	},

	resetLastDetectionTime: function resetLastDetectionTime() {
		this.lastDetectionTs = -1;
	},

	setLastDetectionTime: function setLastDetectionTime(timestamp) {
		Util.assert(Util.isType(timestamp, "number"));
		this.lastDetectionTs = timestamp;
	},

	processCoolDown: function processCoolDown(timestamp, isDetected) {
		Util.assert(Util.isType(timestamp, "number"));
		Util.assert(Util.isHolderOf(isDetected, "boolean"));

		var coolDownState = this.checkCoolDown(timestamp);
		if (isDetected.get()) {
			if (coolDownState == CoolDownState.NONE)
				this.setLastDetectionTime(timestamp);
			else if (coolDownState == CoolDownState.IN_PROGRESS)
				isDetected.set(false);
		}

		if (coolDownState == CoolDownState.ELAPSED) {
			this.resetLastDetectionTime();
			this.reset();
			isDetected.set(false);
		}
	},

	checkCoolDown: function checkCoolDown(timestamp) {
		Util.assert(Util.isType(timestamp, "number"));

		const interval = 500;
		if (this.lastDetectionTs < 0)
			return CoolDownState.NONE;

		var diff = timestamp - this.lastDetectionTs;
		return diff > interval ? CoolDownState.ELAPSED : CoolDownState.IN_PROGRESS;
	},

	calculateMotionData: function calculateMotionData(hist, histSize, position, velocity, timestamp2SecFactor) {
		Util.assert(Util.isArrayOf(hist, "PositionData"), Util.myTypeOf(hist) + " " + Util.arrayTypeOf(hist));
		Util.assert(Util.isObject(position)/*vec2*/);
		Util.assert(Util.isObject(velocity)/*vec2*/);
		Util.assert(Util.isType(timestamp2SecFactor, "number"));

		// const histSize = hist.length;
		Util.assert(Util.isType(histSize, "number"));
		Util.assert(histSize <= hist.length);

		const minDataCount = 3;
		if (histSize < minDataCount) {
			Util.vec2set(position, 0, 0);
			Util.vec2set(velocity, 0, 0);
			return false;
		}
		//Util.log("*");

		// var sum = new vec2(0, 0);
		// for (var i = 0; i < histSize; ++i)
		// 	sum = sum.add(hist[i].position);

		var sum_x = 0, sum_y = 0;
		for (var i = 0; i < histSize; ++i) {
			sum_x += hist[i].position.x;
			sum_y += hist[i].position.y;
		}
		Util.vec2set(position, sum_x / histSize, sum_y / histSize);

		const start = hist[0];
		const end = hist[histSize - 1];

		var dT = (end.timestamp - start.timestamp) * timestamp2SecFactor;
		// const s = end.position.sub(start.position);
		//Util.log("f="+timestamp2SecFactor);
		Util.vec2set(velocity, (end.position.x - start.position.x) / dT, (end.position.y - start.position.y) / dT);
		//Util.log("v = " + velocity);
		//Util.log("end.position = " + end.position + ", end.timestamp = " + end.timestamp + ", v = " + velocity);

		return true;
	},


	reset: function reset() {
		this.resetLastDetectionTime();
		this.indexFingertipMarkers.clear();
		// this.extractedData = [];
		this.extractedData.clear();
	},

	isPossible: function isPossible() {
		return this.maxZigZagCount > 0;
	},

	isDetected: function isDetected(
		timestampMilliseconds, detections, marker, handSide, scale) {
		Util.assert(Util.isType(timestampMilliseconds, "number"));
		Util.assert(Util.isType(detections, "FingerspellDetections"));
		Util.assert(Util.isObject(marker)/*vec2*/);
		Util.assert(Util.isType(scale, "number"));

		this.currentTs = timestampMilliseconds;
		this.currentScale = scale;

		// // adapt slow-scale if necessary
		// var scaleChangeRatioThreshold = 0.1;
		// var scaleChangeRatio = Math.abs(this.currentScale - this.slowScale) / this.slowScale;
		// if (scaleChangeRatio > scaleChangeRatioThreshold)
		// {
		// 	this.slowScale = this.currentScale;
		// 	this.slowScaleChanged = true;
		// }

		var i = Util.findIndex(detections.all, function (fd) {
			return fd.character == FingerspellCharacter.ASL_Z;
		});

		var zFound = i != -1;
		this.addData(timestampMilliseconds, marker, zFound, scale);

		return this.detect(timestampMilliseconds, handSide);
	},


	addData: function addData(timestamp, marker, isZ, scale) {
		Util.assert(Util.isType(timestamp, "number"));
		Util.assert(Util.isObject(marker)/*vec2*/);
		Util.assert(Util.isType(isZ, "boolean"), Util.myTypeOf(isZ));

		this.indexFingertipMarkers.push_back_auto(new ZCharacterDetector.Data(timestamp, marker, isZ, scale));
	},

	detect: function detect(timestamp, handSide) {
		Util.assert(Util.isType(timestamp, "number"));

		this.updateWindow(timestamp);
		this.extractData();
		this.detectSegments();

		var isDetected = new Holder("boolean", false);
		isDetected.set(
			this.evaluateSegments(handSide)
		);
		this.processCoolDown(timestamp, isDetected)

		return isDetected.get();
	},

	updateWindow: function updateWindow(timestamp) {
		Util.assert(Util.isType(timestamp, "number"));

		var firstTs = timestamp - this.detectionInterval;

		var forgetOldElements = function (buffer, firstTs) {
			Util.assert(Util.isType(buffer, "CircularBuffer"));

			//assumes the element type has a 'timestamp' variable
			var numToForget = Util.findIndex_circBuf(buffer, function (data) { return data.timestamp >= firstTs; });
			while (numToForget-- > 0)
				buffer.pop_front();
		}

		// var numToPop = Util.findIndex(this.indexFingertipMarkers.elements, function(data) { return data.timestamp >= firstTs; });
		// while (numToPop-- > 0)
		// 	this.indexFingertipMarkers.pop();
		forgetOldElements(this.indexFingertipMarkers, firstTs);

		forgetOldElements(this.extractedData, firstTs);

		// if (this.indexFingertipMarkers.size() >= 2)
		// 	Util.log(
		// 		"indexFingertipMarkers length: " + this.indexFingertipMarkers.size() + ", span: " + 
		// 		(this.indexFingertipMarkers.back().timestamp - this.indexFingertipMarkers.front().timestamp) +
		// 		", delta: " + 
		// 		(this.indexFingertipMarkers.get(1).timestamp - this.indexFingertipMarkers.get(0).timestamp)
		// 	);

		// Util.dumpArr(this.indexFingertipMarkers.elements, function(d,i) { return i + " ts=" + d.timestamp + " " + d.markerPosition + "\n"; }, "tips")
	},

	extractData: function extractData() {
		const halfAvgWindow = this.averageWindow / 2;
		const timestamp2SecFactor = 0.001;

		// Util.dump(this.indexFingertipMarkers, true);
		// if (this.positions_for_extractData === null)
		// 	this.positions_for_extractData = new Array(this.indexFingertipMarkers.maxSize);

		var performFullScan = !this.useOptimization;

		if (performFullScan) {
			Util.log("performing FULL scan, buffer length=" + this.indexFingertipMarkers.size());

			this.extractedData.clear();

			for (var i = 0; i < this.indexFingertipMarkers.size(); ++i) {
				var numPositions = 0;

				const p1 = this.indexFingertipMarkers.get(i);

				var p1Ts = p1.timestamp;
				var minTs = p1Ts - halfAvgWindow;
				var maxTs = p1Ts + halfAvgWindow;
				for (var j = 0; j < this.indexFingertipMarkers.size(); ++j) {
					const p2 = this.indexFingertipMarkers.get(j);
					var p2Ts = p2.timestamp;
					if (p2Ts < minTs)
						continue;

					if (p2Ts > maxTs)
						break;

					//positions.push(new PositionData(p2Ts, p2.markerPosition.uniformScale(this.scale)));
					this.positions_for_extractData[numPositions++] = new PositionData(p2Ts, p2.markerPosition.uniformScale(this.currentScale));
					//Util.assert(numPositions <= this.indexFingertipMarkers.size(), numPositions + " > " + this.indexFingertipMarkers.size());
				}

				var filteredData = new ZCharacterDetector.FilteredData();
				var isValidData = this.calculateMotionData(
					this.positions_for_extractData, numPositions/*necessary*/, filteredData.position, filteredData.velocity, timestamp2SecFactor);
				if (isValidData) {
					filteredData.timestamp = p1Ts;
					filteredData.isZ = p1.isZ;
					this.extractedData.push_back_auto(filteredData);
				}
			}
		}
		else {
			// Util.log("performing OPTIMIZED scan, buffer length=" + this.indexFingertipMarkers.size());

			var ts_minus_halfwin = this.currentTs - halfAvgWindow;
			var ts_minus_win = this.currentTs - this.averageWindow;

			//           35
			// 10  20  30  40  50
			// 0   1   2   3   4
			var lastColdEDIndex = Util.findLastIndex_circBuf(this.extractedData, function (data) { return data.timestamp < ts_minus_halfwin; });
			var numHot = this.extractedData.size() - lastColdEDIndex - 1;
			while (numHot-- > 0)
				this.extractedData.pop_back();

			var earliestRelevantP1Index = Util.findLastIndex_circBuf(this.indexFingertipMarkers, function (data) { return data.timestamp < ts_minus_halfwin; });
			earliestRelevantP1Index = earliestRelevantP1Index != -1 ? Math.min(this.indexFingertipMarkers.size() - 1, earliestRelevantP1Index + 1) : 0;

			var earliestRelevantP2Index = Util.findLastIndex_circBuf(this.indexFingertipMarkers, function (data) { return data.timestamp < ts_minus_win; });
			earliestRelevantP2Index = earliestRelevantP2Index != -1 ? Math.min(this.indexFingertipMarkers.size() - 1, earliestRelevantP2Index + 1) : 0;

			// Util.log("performing PARTIAL scan " + (this.indexFingertipMarkers.size() - earliestRelevantP1Index) * (this.indexFingertipMarkers.size() - earliestRelevantP2Index) + " (" + earliestRelevantP1Index + "|" + earliestRelevantP2Index + ")");

			for (var i = earliestRelevantP1Index; i < this.indexFingertipMarkers.size(); ++i) {
				var numPositions = 0;

				const p1 = this.indexFingertipMarkers.get(i);

				var p1Ts = p1.timestamp;
				var minTs = p1Ts - halfAvgWindow;
				var maxTs = p1Ts + halfAvgWindow;
				for (var j = earliestRelevantP2Index; j < this.indexFingertipMarkers.size(); ++j) {
					const p2 = this.indexFingertipMarkers.get(j);
					var p2Ts = p2.timestamp;
					if (p2Ts < minTs)
						continue;

					if (p2Ts > maxTs)
						break;

					//positions.push(new PositionData(p2Ts, p2.markerPosition.uniformScale(this.scale)));
					this.positions_for_extractData[numPositions++] = new PositionData(p2Ts, p2.markerPosition.uniformScale(p2.scale));
					//Util.assert(numPositions <= this.indexFingertipMarkers.size(), numPositions + " > " + this.indexFingertipMarkers.size());
				}

				var filteredData = new ZCharacterDetector.FilteredData();
				var isValidData = this.calculateMotionData(
					this.positions_for_extractData, numPositions/*necessary*/, filteredData.position, filteredData.velocity, timestamp2SecFactor);
				if (isValidData) {
					filteredData.timestamp = p1Ts;
					filteredData.isZ = p1.isZ;
					this.extractedData.push_back_auto(filteredData);
				}
			}
		}

		//Util.dumpArr(this.extractedData, function(d,i) { return i + " ts=" + d.timestamp + " " + d.position + " v=" + d.velocity + "\n"; })
	},

	detectSegments: function detectSegments() {
		const minVelocity = 0.1;
		var dir = 0;
		this.segments = [];

		var start = function (that, d) {
			Util.assert(Util.isType(that, "ZCharacterDetector"));
			Util.assert(Util.isType(d, "FilteredData"));
			that.segments.push(
				new ZCharacterDetector.Segment(new Interval(d.timestamp, 0), d.position, new vec2(0, 0))
			);
		};

		var allCount = 0;
		var zCount = 0;
		const zCharRatio = 0.3;
		var end_ = function (that, d) {
			Util.assert(Util.isType(that, "ZCharacterDetector"));
			Util.assert(Util.isType(d, "FilteredData"));
			var last = that.segments[that.segments.length - 1];
			last.interval.end = d.timestamp;
			last.endPosition = d.position;

			var ratio = zCount / allCount;
			last.validCharacterRatio = ratio;
			last.tmpRatio = ratio;
			last.isValidCharacterRatio = ratio >= zCharRatio;
			zCount = allCount = 0;
		};

		for (var i = 0; i < this.extractedData.size(); ++i) {
			var d = this.extractedData.get(i);
			const vx = d.velocity.x;

			if (Math.abs(vx) < minVelocity) {
				if (dir != 0) // just stopped
				{
					end_(this, d);
					dir = 0;
				}
				continue;
			}

			if (dir == 0) // just started
			{
				//Util.log("+++");
				start(this, d);
			}

			var actDir = vx > 0 ? 1 : -1;
			if (dir != 0 && dir != actDir) // changed direction
			{
				//Util.log("-------2");
				end_(this, d);
				start(this, d);
			}

			++allCount;
			if (d.isZ)
				++zCount;

			dir = actDir;
		}
		if (this.segments.length > 0 && this.segments[this.segments.length - 1].interval.end == 0) {
			this.segments.pop();
		}
	},

	evaluateSegments: function evaluateSegments(handSide) {
		const forceAllowAnyDir = false;
		const xMinThreshold = 0.01;
		const yMinThresholdInward_worldSpace = -0.02; //"Should be negative - just downward"
		const yMinThresholdOutward_worldSpace = 0.02; //"Should be positive - not much upward"

		const maxGap = 1;

		var zigZagCount = 0;
		var gapCount = 0;
		var dir = 0;
		this.maxZigZagCount = 0;

		var ratioSum = 0;
		var isDetected = false;
		var segmentsForCharacter = [];

		// NOTE: Image coordinates correspond to straight (un-mirrored) camera image.

		// Reference X-direction of first segment is laid down for the case of right hand and frontal signing.
		//  So we should mirror it if exactly one of these is false.
		var mirrorRefDir = (handSide != HandSide.RIGHT) != !this.frontalSigning; // XOR

		for (var i = this.segments.length - 1; i >= 0; --i) {
			var segm = this.segments[i];

			//TODO maybe normalize or use velocity instead of position
			var diff = segm.endPosition.sub(segm.startPosition);
			var actDir = diff.x > 0 ? 1 : -1;

			segm.dir = diff.normalize();
			segm.isValidX = Math.abs(diff.x) > xMinThreshold; // any direction
			// var isInward = handSide == HandSide.RIGHT && actDir == 1 || handSide == HandSide.LEFT && actDir == -1; // yep, it could be more simple
			var isInward = actDir == (mirrorRefDir ? -1 : 1);
			segm.isValidY = forceAllowAnyDir || (-diff.y < (isInward ? yMinThresholdInward_worldSpace : yMinThresholdOutward_worldSpace)); // "downward-like", diff.y is in image-space, so we negate it
			segm.isChecked = true;

			if (!segm.isValidX || !segm.isValidY) {
				++gapCount;
				continue;
			}

			if (dir == actDir) // give a chance for uncertainty
			{
				++gapCount;
				continue;
			}

			if (dir == 0) // first direction
			{
				// var firstDirCheck = forceAllowAnyDir || (handSide == HandSide.RIGHT && actDir == -1 || handSide == HandSide.LEFT && actDir == 1);
				var firstDirCheck = forceAllowAnyDir || actDir == (mirrorRefDir ? 1 : -1);
				if (!firstDirCheck) {
					// Util.log(i + " firstDirCheck failed");
					continue;
				}
				// Util.log('valid first direction: start=[' + segm.startPosition.x + ',' + segm.startPosition.y + '], end=[' + segm.endPosition.x + ',' + segm.endPosition.y + ']');

				segmentsForCharacter = [i];
				zigZagCount = 1;
				ratioSum = segm.validCharacterRatio;
			}
			else {
				if (gapCount > maxGap) // too late
				{
					segmentsForCharacter = [i];
					zigZagCount = 1;
					ratioSum = segm.validCharacterRatio;
				}
				else {
					++zigZagCount;
					ratioSum += segm.validCharacterRatio;
					segmentsForCharacter.push(i);
				}

				if (zigZagCount == 3 && (ratioSum / zigZagCount) > 0.1) {
					isDetected = true;
				}
			}

			this.maxZigZagCount = Math.max(zigZagCount, this.maxZigZagCount);
			segm.zigZagIndex = zigZagCount;

			if (isDetected)
				break;

			dir = actDir;
			gapCount = 0;
		}

		if (segmentsForCharacter.length == 3) {
			for (var k = 0; k < segmentsForCharacter.length; ++k) {
				var i = segmentsForCharacter[k];
				this.segments[i].usedForCharacter = true;
			}
		}

		return isDetected;
	},
};
// <-- ZCharacterDetector.js 
// FingerspellLogic.js --> 
function FingerspellCharacterHelper() {
}

//static
FingerspellCharacterHelper.toFingerspellCharacter = function toFingerspellCharacter(
	tfhs, mapping, numericMode) {
	var fcs = mapping[tfhs];
	Util.assert(fcs !== undefined, sTfH2Name[tfhs] + " (" + tfhs + ") not found in mapping!");
	Util.assert(fcs instanceof Array);
	Util.assert(fcs.length > 0, "FingerspellCharacter vector for TfHandshape " + sTfH2Name[tfhs] + " is empty in mapping!");
	var fcs2 = Util.filter(fcs,
		numericMode ?
			function (c) { return isFingerspellCharacterNumber(c); } :
			function (c) { return !isFingerspellCharacterNumber(c); }
	);
	Util.assert(fcs2.length <= 1);
	if (fcs2.length == 0)
		return FingerspellCharacter.UNKNOWN;
	return fcs2[0];
}

//-----------------

function FingerspellLogic(minOccurrence, repeatAfter, frontalSigning, zDetectionInterval, zAverageWindow, zUseOptimization) {
	this.minHandshapeScore = 0.6;

	this.mode = FingerspellRecognitionMode.DictionaryMatching;

	this.characterSequence = []; // Array of FrameDetection's
	this.prevCharacter = new FrameDetection();

	this.minOccurrence = minOccurrence !== undefined ? minOccurrence : 4;
	this.repeatAfter = repeatAfter === undefined ? 0 : (repeatAfter === 0 ? 0 : Math.max(repeatAfter, this.minOccurrence));

	this.occurrenceCounter = 0;
	this.continuationCounter = 0;
	this.minUnknown = 2;

	this.suggestions = Suggestion.createSuggestions(sSuggestions);
	this.lastMatchedWord = null;

	this.avgPalmWidth = new MovingAverage(100);
	this.palmWidthInM = 0.065;

	this.possibleZHandshapes = [
		TfHandShape.ASL_1_NUM,
		TfHandShape.ASL_D,
		TfHandShape.ASL_K, // ASL_K workaround because of model failure
		TfHandShape.ASL_1_BENT,
		TfHandShape.ASL_Z,
		TfHandShape.ASL_X,
		TfHandShape.ASL_X_OVER_THUMB,
		TfHandShape.ASL_R,
		TfHandShape.ASL_P,
	];

	this.zCharacterDetector = new ZCharacterDetector(frontalSigning, zDetectionInterval, zAverageWindow, zUseOptimization);
	this.zCount = 0;
}

FingerspellLogic.prototype =
{
	constructor: FingerspellLogic.prototype.constructor,

	setFrontalSigning: function setFrontalSigning(f) {
		this.zCharacterDetector.setFrontalSigning(f);
	},

	getSortedScores: function getSortedScores(scores) {
		Util.assert(Util.isArrayOf(scores, "Pair"));
		return scores.sort(function (a, b) { return Math.sign(a.score - b.score); });
	},

	selectHandShape: function selectHandShape(unsortedOriScores, numericMode) {
		Util.assert(Util.isArrayOf(unsortedOriScores, "Pair"));

		var func = function (that, scores) {
			Util.assert(Util.isType(that, "FingerspellLogic"));
			Util.assert(Util.isArrayOf(scores, "Pair"));

			var acceptedTfhs = TfHandShape.UNINITIALIZED;
			if (unsortedOriScores.length > 0) {
				const sortedScores = that.getSortedScores(unsortedOriScores);
				var bestScore = sortedScores[0].second;
				acceptedTfhs = bestScore >= that.minHandshapeScore ? sortedScores[0].first : TfHandShape.UNINITIALIZED;
			}
			return acceptedTfhs;
		}

		var tfhsOri = func(this, unsortedOriScores);
		var tfHandshapeForJZDetection = tfhsOri;

		var c = FingerspellCharacterHelper.toFingerspellCharacter(tfhsOri, sTfH2Fc, numericMode);
		fpDetections = new FingerspellDetections();
		if (c != FingerspellCharacter.UNKNOWN) {
			fpDetections.best = new FingerspellDetection(c, 1);
			fpDetections.all.push(fpDetections.best);
		}

		return new Pair(tfHandshapeForJZDetection, fpDetections);
	},

	createInputForMovingCharacterDetections: function createInputForMovingCharacterDetections(
		joints_imageSpace) {
		Util.assert(Util.isArrayOfObject(joints_imageSpace)/*vec2*/);

		var normIx1 = HandLandmarkType.INDEX_0;
		var normIx2 = HandLandmarkType.PINKY_0;

		var p1 = joints_imageSpace[normIx1];
		var p2 = joints_imageSpace[normIx2];
		var palmWidth = p1.distance(p2);
		// Util.log("pw=" + palmWidth + " p1=" + p1 + " p2="  + p2);

		this.avgPalmWidth.add(palmWidth);

		var scale = this.palmWidthInM / this.avgPalmWidth.get();

		//Util.dumpArr(this.avgPalmWidth.queue.elements);
		return scale;
	},

	checkZDetection: function checkZDetection(
		timestampMilliseconds, joints_imageSpace, scale, handSide, tfhs, fpDetections_output) {
		Util.assert(Util.isType(timestampMilliseconds, "number"));
		Util.assert(Util.isArrayOfObject(joints_imageSpace)/*vec2*/);
		Util.assert(Util.isType(scale, "number"));
		Util.assert(Util.isType(fpDetections_output, "FingerspellDetections"));

		var fpDetections_input = new FingerspellDetections();
		if (this.possibleZHandshapes.length == 0 ||
			Util.find(this.possibleZHandshapes, function (x) { return x == tfhs; }) !== undefined) {
			fpDetections_input.all.push(new FingerspellDetection(FingerspellCharacter.ASL_Z, 1));
		}
		//Util.dumpArr(fpDetections_input.all, function(fd) { return sFc2Name[fd.character]; });

		var indexTip = joints_imageSpace[HandLandmarkType.INDEX_3];
		var isZ = this.zCharacterDetector.isDetected(timestampMilliseconds, fpDetections_input, indexTip, handSide, scale);

		if (isZ) {
			// Util.log("ZZZZZZZ - " + this.zCount++);
			fpDetections_output.all = [];
			fpDetections_output.best = new FingerspellDetection(FingerspellCharacter.ASL_Z, 1);
			fpDetections_output.all.push(fpDetections_output.best);
		}

		return isZ;
	},

	bufferFrameDetection: function bufferFrameDetection(fpDetections) {
		Util.assert(Util.myTypeOf(fpDetections) == "FingerspellDetections");
		Util.assert(this.characterSequence instanceof Array);

		var character = new FrameDetection();
		var movingHit = false;

		if (fpDetections.best.isValid()) {
			if (fpDetections.best.character == FingerspellCharacter.ASL_Z)
				movingHit = true;

			character.detection = fpDetections.best.character;
		}

		var singleStaticHit = false, repeatedStaticHit = false;
		if (!character.isEmpty()) {
			this.unknownCounter = 0;

			if (!movingHit) {
				if (!(this.characterSequence.length > 0 && this.characterSequence[this.characterSequence.length - 1].equals(character))) {
					if (this.minOccurrence > 0) {
						if (this.prevCharacter.equals(character)) {
							if ((this.occurrenceCounter + 1) < this.minOccurrence) {
								++this.occurrenceCounter;
							}
							else {
								singleStaticHit = true;
							}
						}
						else {
							this.occurrenceCounter = 1;
							this.prevCharacter.copy(character);
						}
					}
					else
						singleStaticHit = true;
				}
				else {
					if (this.repeatAfter > 0) {
						if ((this.continuationCounter + 1) < this.repeatAfter) {
							++this.continuationCounter;
						}
						else {
							repeatedStaticHit = true;
						}
					}
				}
			}
		}
		else {
			++this.unknownCounter;
			if (this.unknownCounter >= this.minUnknown) {
				this.occurrenceCounter = 0;
				// this.continuationCounter = 0; -- NOTE: commented out because of the indended use case (lenses with known acceptable next character)
			}
		}

		if (singleStaticHit || repeatedStaticHit || movingHit) {
			this.occurrenceCounter = 0;
			this.continuationCounter = 0;

			this.prevCharacter.clear();

			this.characterSequence.push(character);
			//print("character " + character)
			Util.log("|" + this.characterSequence.length + "|: " + this.getDetectionBufferAsWord());

			// const debugBuffer = false;
			// if (debugBuffer) {
			// 	var zd = this.zCharacterDetector;
			// 	if (zd.indexFingertipMarkers.size() >= 2)
			// 		Util.log(
			// 			"indexFingertipMarkers length: " + zd.indexFingertipMarkers.size() + ", span: " +
			// 			(zd.indexFingertipMarkers.back().timestamp - zd.indexFingertipMarkers.front().timestamp) +
			// 			", delta: " +
			// 			(zd.indexFingertipMarkers.get(1).timestamp - zd.indexFingertipMarkers.get(0).timestamp)
			// 		);
			// }
		}
	},

	getDetectionBufferAsWord: function getDetectionBufferAsWord() {
		return Util.accumulate(this.characterSequence, "", function (s, x) { return s + Util.removePrefix(sFc2Name[x.detection], "ASL_"); });
	},	

	matchDetectedWord: function matchDetectedWord() {
		var detectedWord = this.getDetectionBufferAsWord();
		Util.log("matching \"" + detectedWord + "\"");
		this.lastMatchedWord = null;

		var matches = [];
		for (var k in this.suggestions) {
			var suggestion = this.suggestions[k];

			var suggestionWord = suggestion.wordToMatch;
			var dist = Util.levenshteinDistance(detectedWord, suggestionWord);
			matches.push(new Pair(dist, suggestion));
		}
		matches.sort(function (a, b) { return a.first - b.first; });
		for (var i = 0; i < Math.min(5, matches.length); ++i) {
			var m = matches[i];
			Util.log(" " + m.second.wordToMatch + ": " + m.first);
		}

		if (matches.length > 0 && matches[0].first < 4) {
			var s = matches[0].second;
			this.lastMatchedWord = sSuggestions[s.originalWordIdx];
			Util.log("Best suggestion: " + this.lastMatchedWord);
		}

		var selectedMatches = [];
		for (var i = 0; i < Math.min(3, matches.length); ++i) {
			var pair = matches[i];
			if (pair.first >= 5)
				break;
			selectedMatches.push(pair.second);
		}

		Util.log("Matches: " +
			(selectedMatches.length > 0 ? Util.accumulate(selectedMatches, "", function (s, x) { return s + (s.length > 0 ? "|" : "") + x.wordToMatch; }) : "-")
		);
	},

	handNotPresent: function handNotPresent(useProfiler) {
		Util.assert(Util.isOptType(useProfiler, "boolean"));

		//this.matchDetectedWord();

		this.characterSequence = [];
		this.prevCharacter.clear();
		this.occurrenceCounter = 0;
		this.continuationCounter = 0;
		this.unknownCounter = 0;

		this.zCharacterDetector.reset();

		if (useProfiler) {
			profiler.displayReport();
			// profiler.resetValues(); -- called in FingerspellDetector.run()
		}
	},

	process: function process(handSide, joints_imageSpace, timestampMS, oriTfHandShapes, numericMode, enableZ) {
		Util.assert(Util.isType(handSide, "number") && handSide !== HandSide.NOT_DEFINED);
		Util.assert(Util.isArrayOfObject(joints_imageSpace)/*vec2*/);
		Util.assert(Util.isArrayOf(oriTfHandShapes, "Classification"));
		Util.assert(Util.isType(numericMode, "Boolean"));
		Util.assert(Util.isType(enableZ, "Boolean"));

		var unsortedOriScores = [];
		for (var i = 0; i < oriTfHandShapes.length; i++) {
			unsortedOriScores.push(new Pair(sName2TfH[oriTfHandShapes[i].label], oriTfHandShapes[i].score));
		}

		var pair = this.selectHandShape(unsortedOriScores, numericMode);
		Util.assert(Util.isType(pair, "Pair"));
		var tfHandshapeForJZDetection = pair.first;
		var fpDetections = pair.second;

		if (enableZ) {
			var scale = this.createInputForMovingCharacterDetections(joints_imageSpace);
			this.checkZDetection(timestampMS, joints_imageSpace, scale, handSide, tfHandshapeForJZDetection, fpDetections);
		}

		this.bufferFrameDetection(fpDetections);
	},
};
// <-- FingerspellLogic.js 
// FingerspellDetectorMain.js --> 
// @input Asset.MLAsset model
// @input Asset.Texture deviceCameraTexture
// @input int numericMode = 1 {"label": "Mode", "widget" : "combobox", "values" : [{"label" : "0..9", "value" : "0"}, {"label" : "A..Z", "value" : "1"}]}
// @input bool printLog = true

// @ui {"widget": "separator"}
//@input bool hiddenInputs = false {"showIf": "hiddenInputs"}
//@input bool enable {"showIf" : "false"}
//@input bool enableFSProcessing {"label": "Enable FS Processing"}
//@input Component.Text fsInput


// @input bool settings {"label": "Edit settings"}
// @ui {"widget":"group_start", "label" : "Settings:", "showIf": "settings"}
// @input float threshold = 0.5 {"widget":"slider", "min":0, "max":1, "step":0.01}
// @input int minOccurrence = 4 {"widget":"slider", "min":4, "max":15, "step":1}
// @input int repeatAfter = 10 {"widget":"slider", "min":0, "max":90, "step":5}
// @input bool advanced = advanced {"showIf" : "advanced"}
// @input bool enableZDetection {"label": "Enable Z Detection", "showIf" : "advanced"}
// @input int zDetectionInterval = 400 {"widget":"slider", "min":1000, "max":10000, "step":500, "showIf" : "advanced"}
// @input int zAverageWindow = 200 {"widget":"slider", "min":100, "max":200, "step":10,"showIf" : "advanced"}
// @ui {"widget":"group_end"}

function FingerspellDetector() {
	this.version = [0, 9, 0]; // can contain strings, e.g. "1a"

	this.useProfiler = false;

	this.zUseOptimization = true;

	// this.cameraShowsMirroredImage = script.mirroredImage;
	// this.frontalSigning = script.frontalSigning;
	this.cameraShowsMirroredImage = false;
	this.frontalSigning = false;

	this.aspectRatio = -1;

	this.mlComponent = null;
	this.modelInputName = "x";
	this.modelOutputName = "sequential/dense_6/Softmax";

	this.deltatimeAvg = null;
	this.deltatime2_arr = null;
	this.deltatime2_cnt = 0;
	this.deltatime2_avg = 0;
	this.jointPretransform = null;
	this.tensorsToClassification = null;
	this.fingerspellLogic = null;

	this.stored_fps = "";
	this.handSide = HandSide.NOT_DEFINED; // updated on-the-fly
	this.handSide_toString = ["L", "R", "U"];
	this.frontalSigning_toString = { false: "Bk", true: "Fr" };

	this.numericMode = false;

	this.numJoints = 21;

	this.joints_imageSpace = [];
	//this.joints_pretransformed = [];
	this.joints_pretransformed_cb = null;
	this.jointsFlattened = null;

	this.lastHandPresent = false;

	this.init();
}

FingerspellDetector.prototype =
{
	constructor: FingerspellDetector.prototype.constructor,

	init: function init() {

		var sceneObject = script.sceneObject;
		var objName = sceneObject.name;

		this.numericMode = script.numericMode == 0;
       
		if (script.minOccurrence === undefined || script.minOccurrence === 0) {
			Util.fatal("set minOccurrence in " + objName);
		}
		if (script.zDetectionInterval === undefined || script.zDetectionInterval === 0) {
			Util.fatal("set zDetectionInterval in " + objName);
		}
		if (script.zAverageWindow === undefined || script.zAverageWindow === 0) {
			Util.fatal("set zAverageWindow in " + objName);
		}

		this.joints_imageSpace = new Array(this.numJoints);
		//this.joints_pretransformed = new Array(this.numJoints);

		var framebufferSize = 3;
		this.joints_pretransformed_cb = new CircularBuffer(framebufferSize/*, function() {
			var e = new Array(this.numJoints);
			for (var j = 0; j < this.numJoints; ++j)
				e[j] = new vec2(0, 0);
			return e;
		}*/); // NOTE pre-fill predicate doesn't work yet
		{
			for (var i = 0; i < this.joints_pretransformed_cb.maxSize; ++i) {
				this.joints_pretransformed_cb.elements[i] = new Array(this.numJoints);
				for (var j = 0; j < this.numJoints; ++j) {
					this.joints_pretransformed_cb.elements[i][j] = new vec2(0, 0);
				}
			}
		}

		// Util.log("L="+this.joints_imageSpace.length);
		for (var i = 0; i < this.numJoints; ++i) {
			this.joints_imageSpace[i] = new vec2(0, 0);
			// this.joints_pretransformed[i] = new vec2(0, 0);
		}
		this.jointsFlattened = new Array(this.numJoints * 2 * framebufferSize);


		setFSText("");
		setFPSText("");

		//this.deltatimeAvg = new MovingAverage(15);
		this.deltatime2_arr = new Array(15);
		this.jointPretransform = new JointPretransform();
		this.tensorsToClassification = new TensorsToClassification();
		this.fingerspellLogic = new FingerspellLogic(script.minOccurrence, script.repeatAfter, this.frontalSigning, script.zDetectionInterval, script.zAverageWindow, this.zUseOptimization);

		if (this.useProfiler) {
			// profiler.profile("FingerspellDetector.prototype.run");
			profiler.profile("FingerspellDetector.prototype.validRun");
			profiler.profile("FingerspellDetector.prototype.onRunningFinished");

			profiler.profile("FingerspellLogic.prototype.process");
			profiler.profile("FingerspellLogic.prototype.selectHandShape");
			profiler.profile("FingerspellLogic.prototype.bufferFrameDetection");
			profiler.profile("FingerspellLogic.prototype.checkZDetection");
			profiler.profile("MovingAverage.prototype.add");
			profiler.profile("CircularBuffer.prototype.push");
			profiler.profile("CircularBuffer.prototype.pop");
			profiler.profile("Util.findIndex");
			profiler.profile("Util.findIndex_circBuf");
			profiler.profile("Util.findLastIndex_circBuf");
			profiler.profile("Util.count_if");
			profiler.profile("Util.count_if_circBuf");

			profiler.profile("ZCharacterDetector.prototype.calculateMotionData");
			profiler.profile("ZCharacterDetector.prototype.processCoolDown");
			profiler.profile("ZCharacterDetector.prototype.checkCoolDown");
			profiler.profile("ZCharacterDetector.prototype.isDetected");
			profiler.profile("ZCharacterDetector.prototype.addData");
			profiler.profile("ZCharacterDetector.prototype.detect");
			profiler.profile("ZCharacterDetector.prototype.evaluateSegments");
			profiler.profile("ZCharacterDetector.prototype.updateWindow");
			profiler.profile("ZCharacterDetector.prototype.extractData");
			profiler.profile("ZCharacterDetector.prototype.detectSegments");
		}

		this.buildModel();
	},

	setFrontalSigning: function setFrontalSigning(f) {
		this.frontalSigning = f;
		this.fingerspellLogic.setFrontalSigning(f)
	},

	getVersionText: function getVersionText() {
		const v = this.version;

		return "v" + v[0] + "." + v[1] + (v[2] != 0 ? "." + v[2] : "");
	},

	buildModel: function buildModel() {
		this.mlComponent = script.sceneObject.createComponent('MLComponent');
		this.mlComponent.model = script.model

		this.mlComponent.onLoadingFinished = onLoadingFinished;
		this.mlComponent.onRunningFinished = onRunningFinished;

		var inputBuilder = MachineLearning.createInputBuilder();
		inputBuilder.setName(this.modelInputName);
		inputBuilder.setShape(new vec3(42, 3, 1));
		var inputPlaceholder = inputBuilder.build();

		var outputBuilder = MachineLearning.createOutputBuilder();
		outputBuilder.setName(this.modelOutputName);
		outputBuilder.setShape(new vec3(1, 1, 50));
		outputBuilder.setOutputMode(MachineLearning.OutputMode.Data);
		var outputPlaceholder = outputBuilder.build();

		this.mlComponent.build([inputPlaceholder, outputPlaceholder]);
	},

	onLoadingFinished: function onLoadingFinished() {
		script.createEvent("UpdateEvent").bind(function () {
			fingerspellDetector.run();
		});
	},

	run: function run() {
		this.deltatime2_arr[this.deltatime2_cnt++] = getDeltaTime();
		if (this.deltatime2_cnt >= this.deltatime2_arr.length) {
			this.deltatime2_cnt = 0;
			var sum = Util.accumulate(this.deltatime2_arr, 0, function (a, v) { return a + v; });
			var fps = "" + Util.prec(this.deltatime2_arr.length / sum, 1);
			if (Util.findIndex(fps, function (c) { return c == '.'; }) == -1)
				fps += ".0";
			this.stored_fps = fps;
		}
		setFPSText(this.getVersionText() + ", " + this.frontalSigning_toString[this.frontalSigning] + ", " + this.handSide_toString[this.handSide] + ", " + this.stored_fps);
		if (!global.HandTracking) {
			Util.log("ERROR: Please make sure that HandTrackingController script exists and is higher in hierarchy");
			return;
		}

		var handPresent = global.HandTracking.isTracking();
		if (handPresent) {
			this.validRun();
		}
		else {
			if (this.lastHandPresent) {
				this.fingerspellLogic.handNotPresent(this.useProfiler);
				setFSText(this.fingerspellLogic.lastMatchedWord !== null ? this.fingerspellLogic.lastMatchedWord : "");
			}

			profiler.resetValues();
		}

		this.lastHandPresent = handPresent;
	},

	getHandSide: function getHandSide(HT) {
		Util.assert(typeof HT == "object", typeof HT);

		var names = [
			"Wrist",
			"Thumb3", "Thumb2", "Thumb1", "Thumb0",
			"Index3", "Index2", "Index1", "Index0",
			"Middle", "Middle", "Middle", "Middle",
			"Ring3", "Ring2", "Ring1", "Ring0",
			"Pinky3", "Pinky2", "Pinky1", "Pinky0"
		];

		var isLeftHand_raw = null;
		for (var i in names) {
			var name = names[i];
			if (HT[name] !== undefined && HT[name].objectTracking !== undefined && HT[name].objectTracking.objectSpecificData !== undefined) {
				isLeftHand_raw = HT[name].objectTracking.objectSpecificData.isLeft;
				break;
			}
		}
		if (isLeftHand_raw === null)
			return HandSide.NOT_DEFINED;

		var isLeftHand = this.cameraShowsMirroredImage ? !isLeftHand_raw : isLeftHand_raw;
		return isLeftHand ? HandSide.LEFT : HandSide.RIGHT;
	},

	validRun: function validRun() {
		var HT = global.HandTracking;

		this.handSide = this.getHandSide(HT);

		Util.vec2set(this.joints_imageSpace[0], HT.Wrist.getScreenPosition());

		Util.vec2set(this.joints_imageSpace[1], HT.Thumb3.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[2], HT.Thumb2.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[3], HT.Thumb1.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[4], HT.Thumb0.getScreenPosition());

		Util.vec2set(this.joints_imageSpace[5], HT.Index3.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[6], HT.Index2.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[7], HT.Index1.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[8], HT.Index0.getScreenPosition());

		Util.vec2set(this.joints_imageSpace[9], HT.Middle3.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[10], HT.Middle2.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[11], HT.Middle1.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[12], HT.Middle0.getScreenPosition());

		Util.vec2set(this.joints_imageSpace[13], HT.Ring3.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[14], HT.Ring2.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[15], HT.Ring1.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[16], HT.Ring0.getScreenPosition());

		Util.vec2set(this.joints_imageSpace[17], HT.Pinky3.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[18], HT.Pinky2.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[19], HT.Pinky1.getScreenPosition());
		Util.vec2set(this.joints_imageSpace[20], HT.Pinky0.getScreenPosition());

		
		// make joints_imageSpace's coordinates proportionate with reality (NOT normalized to {-1..1,-1..1}),
		// and mirror X if necessary
		for (var i = 0; i < this.joints_imageSpace.length; ++i) {
			this.joints_imageSpace[i].x *= this.cameraShowsMirroredImage ? -this.aspectRatio : this.aspectRatio;
		}

		//this.jointPretransform.process(this.handSide, this.joints_imageSpace, this.joints_pretransformed);
		this.joints_pretransformed_cb.add_back_auto();
		this.jointPretransform.process(this.handSide, this.joints_imageSpace, this.joints_pretransformed_cb.back());

		if (this.joints_pretransformed_cb.full()) {
			// update the model's input
			//Util.flattenVec2Arr(this.joints_pretransformed, this.jointsFlattened);
			for (var i = 0; i < this.joints_pretransformed_cb.size(); ++i) {
				Util.flattenVec2Arr_withOffset(
					this.joints_pretransformed_cb.get(i),
					this.jointsFlattened,
					2 * i * this.numJoints
				);
			}
			Object.assign(this.mlComponent.getInput(this.modelInputName).data, this.jointsFlattened);

			profiler.start("ML");
			this.mlComponent.runImmediate(true);
		}
	},

	onRunningFinished: function onRunningFinished() {
		profiler.stop("ML");

		var raw_scores = this.mlComponent.getOutput(this.modelOutputName).data;

		var classifications = this.tensorsToClassification.process(raw_scores);

		if (!script.enableFSProcessing)
			return;

		var timestampMS = getTime() * 1000;
		this.fingerspellLogic.process(this.handSide, this.joints_imageSpace, timestampMS, classifications, this.numericMode, script.enableZDetection);

		setFSText(this.fingerspellLogic.getDetectionBufferAsWord());
	},
}


var fingerspellDetector = null;

function onLoadingFinished() {
	fingerspellDetector.onLoadingFinished();
}

function onRunningFinished() {
	fingerspellDetector.onRunningFinished();
}

function setFSText(t) {
	//script.fsText.text = t;
}

function setFPSText(t) {
	//script.fpsText.text = t;
}

function initialize() {
	global.HandTracking = new HandTracking(script.handTrackingPrefab);
	fingerspellDetector = new FingerspellDetector();

	script.createEvent("CameraFrontEvent").bind(function (eventData) {
		fingerspellDetector.cameraShowsMirroredImage = true;
		fingerspellDetector.setFrontalSigning(true);
	});

	script.createEvent("CameraBackEvent").bind(function (eventData) {
		fingerspellDetector.cameraShowsMirroredImage = false;
		fingerspellDetector.setFrontalSigning(false);
	});
}
// <-- FingerspellDetectorMain.js 

initialize();

// set api function
// script.api.onNewChar = myFunction;

//script.api.onSequenceUpdated = myFunction
