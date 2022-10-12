// ----------------------------------------------------------------------------
function MathUtils(){
}

// ----------------------------------------------------------------------------
MathUtils.clamp = function( _value, _min, _max) {
    return _value < _min ? _min : _value > _max ? _max : _value;
}

// ----------------------------------------------------------------------------
//  Returns a random number between min (inclusive) and max (exclusive)
MathUtils.getRandom = function(min, max) {
    return Math.random() * (max - min) + min;
};

// ----------------------------------------------------------------------------
MathUtils.mapValue = function( _value, _inputMin, _inputMax, _outputMin, _outputMax, _clamp )  {
  if( _clamp === undefined ) { _clamp = false; }  
  if ( Math.abs(_inputMin - _inputMax) < 0.0000001 ) {
    return _outputMin;
  } else {   
    var outVal = ((_value - _inputMin) / (_inputMax - _inputMin) * (_outputMax - _outputMin) + _outputMin);
    if( _clamp ) {
      var minOut = Math.min( _outputMin, _outputMax );
      var maxOut = Math.max( _outputMin, _outputMax );          
      outVal = MathUtils.clamp( _value, minOut, maxOut );
    }
    return outVal;  
  }
};

// ----------------------------------------------------------------------------
MathUtils.linearStep = function(_edge0, _edge1, _t) {
    // Scale, and clamp x to 0..1 range
    return MathUtils.clamp((_t - _edge0)/(_edge1 - _edge0), 0.0, 1.0);
};

// ----------------------------------------------------------------------------
MathUtils.linearStepInOut = function(_low0, _high0, _high1, _low1, _t) {
    return MathUtils.linearStep(_low0, _high0, _t) * (1.0 - MathUtils.linearStep(_high1, _low1, _t));
};

// ----------------------------------------------------------------------------
MathUtils.smoothStep = function(_edge0, _edge1, _x) {
    // Scale, and clamp x to 0..1 range
    _x = MathUtils.clamp((_x - _edge0)/(_edge1 - _edge0), 0, 1);
    // Evaluate polynomial
    return _x * _x * _x * (_x * (_x * 6 - 15) + 10);
};

// ----------------------------------------------------------------------------
MathUtils.smoothStepInOut = function(_low0, _high0, _high1, _low1, _t) {
    return MathUtils.smoothStep(_low0, _high0, _t) * (1.0 - MathUtils.smoothStep(_high1, _low1, _t));
};

// ----------------------------------------------------------------------------
function SeededRandom( _seed ) {
  this.seed = _seed;
};

// ----------------------------------------------------------------------------
SeededRandom.prototype.next = function( _min, _max ) {
    _max = _max || 1;
    _min = _min || 0;
 
    this.seed = (this.seed * 9301 + 49297) % 233280;
    var rnd = this.seed / 233280;
 
    return _min + rnd * (_max - _min);
};

global.MathUtils = MathUtils;
global.SeededRandom = SeededRandom;