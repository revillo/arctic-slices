var GLOBAL_BRIGHTNESS = 0.05;
var GLOBAL_SATURATION = 1.0;

Color = function(v) {
    /*
    for (var i = 0, l = v.length; i < l; i++) {
        v[i] += Math.randomReal(-5/255, 5/255);
        var d = 1.0 - v[i];
        v[i] = 1.0 - Math.pow(d, GLOBAL_SATURATION + 1);
        v[i] = v[i] * (1.0 - GLOBAL_BRIGHTNESS) + GLOBAL_BRIGHTNESS;
    }*/
    return v;
}

Color255 = function(v) {
  return Math.scale(v, 1/255);
}

ColorFromHex = function(hex) {
  var components = [
    (hex & 0xff0000) >> 16, 
    (hex & 0x00ff00) >> 8, 
    (hex & 0x0000ff)
  ];
  
  return Vec.decPlaces(Vec.scale(components, 1/255), 3);
}

ColorHex = function(c) {
  var v = Vec.floor(Vec.scale(c,255));
  return (v[0] * 65536) + (v[1] * 256) + v[2];
}

_.bindFunctions = function(obj) {
    for (var key in obj) {
        if (_.isFunction(obj[key])) {
            _.bindAll(obj, key);
        }
    }
}

//Faster equals
_.isEqual2 = function(a, b) {
    if (a == b) return true;
    if (_.isArray(a) && _.isArray(b)) {
        if (a.length != b.length) return false;
        for (var i in a) {
            if(a[i] != b[i])return false;
        }
        return true;
    }
    return false;
}

Vec = {};

_.valueSelect = function(array, percent) {
    var index = Math.floor((percent * 0.999) * array.length);
    return array[index];
}

Math.clamp = function(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

Math.sign = function(num) {
    return num < 0 ? -1 : 1;
}

Math.absMin = function(a, b) {
    if (Math.abs(a) < Math.abs(b)) {
        return a;
    }
    return b;
}


Math.inOut = function(t, a) {
  if (t >= 1.0) return 1.0;
  return Math.pow(t, a) / (Math.pow(t, a) + Math.pow(1 - t, a));
}

Math.area = function(a, b, c) {
    var cross = Math.cross(Math.sub(b,a), Math.sub(c,a));
    return Math.length(cross) * 0.5;
}

Vec.area = Math.area;

Math.radians = function(number) {
    return number / 180.0 * Math.PI;
}

Math.degrees = function(number) {
    return number / Math.PI * 180;
}

Math.dot = function(v1, v2) {
    var result = 0.0;
    for (var i = 0, l = v1.length; i < l; i++) {
        result += v1[i] * v2[i];
    }
    return result;
}

Vec.dot = Math.dot;

Vec.scalarProject = function(v1, v2) {
  return Vec.dot(v1, Vec.normalize(v2));
}

Vec.project = function(v1, v2) {
  return Vec.setLength(v2, Vec.dot(v1, Vec.normalize(v2)));
}

Vec.projectPlane = function(v, n) {
  return Vec.sub(v, Vec.project(v,n));
}


Math.cross = function(v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1],
          -(v1[0] * v2[2] - v1[2] * v2[0]),
            v1[0] * v2[1] - v1[1] * v2[0]];
}
Vec.cross = Math.cross;

Math.setLength = function(v, s) {
    return Math.scale(Math.normalize(v), s);
}
Vec.setLength = Math.setLength;

Math.addLength = function(v, s) {
    return Math.add(v, Math.setLength(v, s));
}
Vec.addLength = Math.addLength;

Vec.isZero = function(v) {
  return (!v[1]) && (!v[2]) && (!v[0]);
}

Vec.floor = function(v) {
  var result = [];
  for (var i = 0; i < v.length; i++) {
    result[i] = Math.floor(v[i]);
  }
  return result;
}

Math.perpendicular = function(v1, v2) {
  if (Vec.isZero(v1) || Vec.isZero(v2)) {
    return [0,1,0];
  }
  
  var angle = Vec.angleBetween(v1, v2);
  if (angle < 0.001 || angle > Math.PI - 0.001) {
    if (v1[0] == 0 && v1[2] == 0) {
      return [1,0,0];
    } else {
      return Math.normalize(Vec.cross(Math.normalize(v1), [0,1,0]));
    }
  }
  
  return Math.normalize(Math.cross(Math.normalize(v1), Math.normalize(v2)));
}
Vec.perpendicular = Math.perpendicular;

Vec.copyInto = function(v1, v2) {
  for (var i = 0; i < v1.length; i++) {
    v1[i] = v2[i];
  }
  return v1;
}

Math.invert = function(v) {
    return Math.scale(v, -1);
}
Vec.invert = Math.invert;

Math.copy = function(v) {
    var result = [];
    for (var i = 0; i < v.length; i++) {
        result[i] = v[i];
    }
    return result;
}
Vec.copy = Math.copy;

Math.add = function(v1, v2) {
    var result = [];
    for (var i = 0; i < v1.length; i++) {
        result[i] = v1[i] + v2[i];
    }
    return result;
}
Vec.add = Math.add;

Math.sum = function(ss) {
    var result = 0;
    for (var i = 0; i < ss.length; i++) {
        result += ss[i];
    }
    return result;
}


Math.sum3 = function(vs) {
    return Math.add(Math.add(vs[0], vs[1]), vs[2]);
}

Vec.sum = function(vs) {
    var result = vs[0];
    for (var i = 1, l = vs.length; i<l;i++) {
        result = Vec.add(result, vs[i]);
    }
    return result;
}


Math.factorial = _.memoize(function(s) {
  if (s <= 1) return 1;
  else return s * Math.factorial(s-1);
});

Math.choose = function(p, k) {
  return Math.factorial(p) / (Math.factorial(k) * Math.factorial(p-k));
}

Math.average = function(vs) {
    var result = [0,0,0];

    for (var i = 0; i < vs.length; i++) {
        result = Math.add(result, vs[i]);
    }

    return Math.scale(result, 1/vs.length);
}

Vec.decPlaces = function(v, n) {
  var result = [];
  for (var i = 0; i < v.length; i++) {
    result[i] = Number(v[i].toFixed(n));
  }
  return result;
}

Vec.average = function(vs) {
    return Vec.scale(Vec.sum(vs), 1.0 / vs.length);
}

Math.linearTo = function(s1, s2, amt) {
   if (s2 > s1) {
     return Math.min(s1 + amt, s2);
   } else if (s1 > s2) {
     return Math.max(s1 - amt, s2);
   } else {
    return s1;
   }
}

Math.lerp = function(s1, s2, a) {
    a = Math.min(a, 1.0);
    return s1 *(1-a) + s2 * a;
}



Vec.lerp = function(v1, v2, a) {
   var result = [];
   for (var i = 0; i < v1.length; i++) {
       result.push(v1[i] + (v2[i]-v1[i]) * a);
   }
   return result;
}

//recursive definition
Vec.bezier2 = function(vs, a) {
    var n = vs.length;

  if (n == 1) {
    return vs[0];
  } else if (n == 2) {
    return Vec.lerp(vs[0], vs[1], a);
  } else {
    return Vec.bezier([Vec.bezier(vs.slice(0, n-1), a), Vec.bezier(vs.slice(1, n), a)], a);
  }
}

Vec.displace = function(v1, v2, amount) {
  return Vec.add(v1, Vec.setLength(v2, amount));
}

Vec.moveTo = function(v1, v2, rate) {
  var dir = Vec.sub(v2, v1);
  var dist = Vec.length(dir);
  
  
  return Vec.add(v1, Vec.setLength(dir, Math.min(rate, dist)));
}

Vec.bezier = function(vs, a) {
  var n = vs.length;
  var result = [0,0,0];
  
  for (var i = 0; i < n; i++) {
    result = Vec.add(result, Vec.scale(vs[i], Math.pow(1-a, n-1-i) * Math.pow(a, i) * Math.choose(n-1, i))); 
  }
  return result;
}


Math.multiply = function(v1, v2) {
    var result = [];
    for (var i = 0; i < v1.length; i++) {
        result[i] = v1[i] * v2[i];
    }
    return result;
}

Vec.multiply = Math.multiply;

Math.sub = function(v1, v2) {
     var result = [];
    for (var i = 0; i < v1.length; i++) {
        result[i] = v1[i] - v2[i];
    }
    return result;
}

Vec.sub = Math.sub;


Math.distancesq = function(v1, v2) {
    var result = 0.0;
    for (var i = 0, l = v1.length; i < l; i++) {
        result += (v1[i] - v2[i]) * (v1[i] - v2[i]);
    }
    return result;
}

Math.distance = function(v1, v2) {
  return Math.sqrt(Math.distancesq(v1, v2));
}

Vec.distance = Math.distance;
Vec.distancesq = Math.distancesq;

Math.length = function(v) {
    return Math.distance(v, [0,0,0,0]);
}

Vec.length = Math.length;
Vec.lengthsq = function(v) {
  return Math.distancesq(v, [0,0,0,0]);
}

Math.scale = function(v, s) {
  var result = [];
  for (var i = 0; i < v.length; i++) {
      result[i] = v[i] * s;
  }
  return result;
}
Vec.scale = Math.scale;

Vec.abs = function(v) {
  var result = [];
  for (var i = 0; i < v.length; i++) {
    result[i] = Math.abs(v[i]);
  }
  return result;
}

Vec.clone = _.clone;

Vec.toAxis = function(v) {
  var r = _.clone(v);
  var mx = -10000;
  var mxi;
  var n = r.length;
  for (var i = 0; i < n; i++) {
    if (Math.abs(r[i]) > mx) {
      mx = Math.abs(r[i]);
      mxi = i;
    }      
  }
  
  r[mxi] = Math.sign(r[mxi]);
  
  r[(mxi+1)%n] = 0;
  r[(mxi+2)%n] = 0;
  return r;
}

Vec.STRING_AXIS = {
  px: [1,0, 0],
  nx: [-1,0,0],
  nz: [0,0,-1],
  pz: [0,0, 1],
  ny: [0,-1,0],
  py: [0,1,0],
}

Vec.axisString = function(axis) {
  if (axis[0] > 0.1) {
    return 'px';
  }
  if (axis[0] < -0.1) {
    return 'nx';
  }
  if (axis[1] > 0.1) {
    return 'py';
  }
  if (axis[1] < -0.1) {
    return 'ny';
  }
  if (axis[2] > 0.1) {
    return 'pz';
  }
  if (axis[2] < -0.1) {
    return 'nz';
  }
}

Math.normalize = function(v) {
    var length = Math.distance(v, [0,0,0,0,0]);
    return Math.scale(v, 1/length);
}
Vec.normalize = Math.normalize;


Math.angleBetween = function(v1, v2) {
    return Math.acos(Math.dot(Vec.normalize(v1), Vec.normalize(v2))) || 0;
}
Vec.angleBetween = Math.angleBetween;

Vec.rotateAxisAngle = function(v, axis, angle) {
  var result = [];
  
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var t = 1-c;
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  
  result[0] = v[0] * (t*x*x + c)    + v[1] * (t*x*y - z*s)  + v[2] * (t*x*z + y*s);
  result[1] = v[0] * (t*x*y + z*s	) + v[1] * (t*y*y + c)    + v[2] * (t*y*z - x*s);
  result[2] = v[0] * (t*x*z - y*s	) + v[1] * (t*y*z + x*s	) + v[2] * (t*z*z + c);
  return result;
}

Vec.randomAngle = function() {
    var lat = Math.randomReal(-Math.PI * 0.5, Math.PI * 0.5);
    var lon = Math.randomReal(-Math.PI, Math.PI);

    var cosLat = Math.cos(lat);
    var sinLat = Math.sin(lat);
    var cosLon = Math.cos(lon);
    var sinLon = Math.sin(lon);
    var rad = 1.0;
    return [rad * cosLat * cosLon, rad * sinLat, -rad * sinLon * cosLat];
}

Math.PI2 = Math.PI * 2;

Math.angleDifference = function(a1, a2) {
    var dif = Math.abs(a1 - a2) % Math.PI2;

    if (dif > Math.PI)
        dif = Math.PI2 - dif;
    return dif;
}

function RNG(seed) {
   this.m = 0x80000000;
   this.a = 1103515245;
   this.c = 12345;
   this.state = seed ? seed : Math.floor(Math.random() * (this.m-1));
}

RNG.prototype.nextInt = function() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
}

RNG.prototype.nextFloat = function() {
     return this.nextInt() / (this.m - 1);
}

Math.rng = new RNG(1);

Math.srand = function(seed) {
    Math.rng.state = seed;
}

_.randomKey = function(object) {
  var key;
  var count = 0;
  for (var o in object) {
    count++;
    if (Math.randomReal(0,1) < 1/count) {
      key = o;
    }
  }
  return key;
}

Math.randomInt = function(low, hi) {
  return Math.floor(low + (hi - low + 1) * Math.rng.nextFloat());
}

Math.randomReal = function(low, hi) {
    return low + (hi - low) * Math.rng.nextFloat();
}

Vec.randomSphere = function(r1, r2) {
  var radius = Math.randomReal(r1, r2);
  var theta = Math.randomReal(0, 2 * Math.PI);
  var u = Math.randomReal(-1, 1);
  return [Math.sqrt(1-(u*u)) * Math.cos(theta) * radius,
    Math.sqrt(1-(u*u)) * Math.sin(theta) * radius,
    u * radius];
}

_.randomShuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.randomReal(0,1) * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

Math.quantize = function(value, low, hi, divs) {
    value = Math.clamp(value, low, hi);
    var q = (hi - low) / divs;

    value = low + Math.floor((value - low) / q) * q;
    return value;
}

Math.gaussReal = function(low, hi, iter) {
  var total = 0;
  iter = iter || 2;
  for (var i = 0; i < iter; i++) {
    total += Math.randomReal(low, hi);
  }
  return total / iter;
}

Math.wrap = function(val, size) {
  return ((val % size) + size) % size;
}

Math.next = function(val) {
  return Math.floor(val) + 1;
}

Math.prev = function(val) {
  return Math.ceil(val) - 1;
}


Math.vary = function(baseVal, noise) {
    noise = noise || baseVal * 0.1;
    return baseVal + Math.gaussReal(-noise, noise);
}


Vec.vary = function(vec, noise) {
    var result = [];
    for (var v = 0, l = vec.length; v < l; v++) {
      result.push(Math.vary(vec[v], noise));
    }
    return result;
}

Vec.randomBox = function(c1, c2) {
  return [Math.randomReal(c1[0], c2[0]), Math.randomReal(c1[1], c2[1]), Math.randomReal(c1[2], c2[2])];
}

HTML = {};

HTML.tag = function(str, tag) {
  return "<" + tag + ">" + str + "</" + tag + ">";
}

Str = {};

Str.asPercent = function(n) {
    if (n == 0) {
        return "--";
    }
    return Math.floor(n * 100) + "%";
}

Enum = function(arr) {
  var result = {};
  for (var i = 0; i < arr.length; i++) {
    result[arr[i]] = i;
  }
  return result;
}

$.fn.toggleClick = function(){

    var functions = arguments ;

    return this.click(function(){
      var iteration = $(this).data('iteration') || 0;
      functions[iteration].apply(this, arguments);
      iteration = (iteration + 1) % functions.length ;
      $(this).data('iteration', iteration);
    });
};

Array2D = function(nx,ny) {
  var arr = [];
  
  for (var x = 0; x < nx; x++) {
    arr[x] = [];
    for (var y = 0; y < ny; y++) {
      arr[x][y] = 0;
    }
  }
  return arr;
}