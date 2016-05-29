(function() {
  'use strict'

var ALIAS_SIZE = 1.0;
var SHADOWS = false;
var FPS_METER = false;
var BACKGROUND_COLOR = 0x000000;
//var BACKGROUND_COLOR = 0x34274e;

GAME.GFX = {};


THREE.Color.prototype.setColor = function(cArr) {
  this.setRGB(cArr[0], cArr[1], cArr[2]);
}

var blankFaceUvs = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()];
var tempVec3 = new THREE.Vector3();
var temp2Vec3 = new THREE.Vector3();
var temp3Vec3 = new THREE.Vector3();
var temp4Vec3 = new THREE.Vector3();

var tempQuat = new THREE.Quaternion();
var tempQuat2 = new THREE.Quaternion();
var tempQuat3 = new THREE.Quaternion();

var tempMat4 = new THREE.Matrix4();

var tempPlane = new THREE.Plane();

var tempTriangle = new THREE.Triangle();
var tempRay = new THREE.Ray();
GAME.GFX.tempRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3());

var zAxis = new THREE.Vector3(0, 0, 1);
var zeroVector = new THREE.Vector3(0, 0, 0);

var GFX = GAME.GFX;

GFX.ZERO = zeroVector;
GFX.UP = new THREE.Vector3(0,1,0);
GFX.xAxis = new THREE.Vector3(1, 0,0);
GFX.yAxis = new THREE.Vector3(0, 1,0);
GFX.zAxis = new THREE.Vector3(0, 0, 1);
GFX.TEMPVEC3 = new THREE.Vector3(0,0,0);
GFX.tempEuler = new THREE.Euler();
GFX.tempMat4 = new THREE.Matrix4();
GFX.IDENTITY = new THREE.Matrix4();
GFX.tempColor = new THREE.Color();
GFX.tempRay = tempRay;

GFX.tempVec3 = new THREE.Vector3();
GFX.temp2Vec3 = new THREE.Vector3();
GFX.temp3Vec3 = new THREE.Vector3();
GFX.temp4Vec3 = new THREE.Vector3();

GFX.TEMP_GEOMETRY = new THREE.PlaneGeometry(0.0001, 0.0001);


GFX.EmptyGeometry = new THREE.Geometry();
GFX.BlankMaterial = new THREE.Material();
GFX.DefaultMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
GFX.DefaultShinyMaterial = new THREE.MeshPhongMaterial({vertexColors: THREE.FaceColors, color: 0xffffff, shininess: 20, specular: 0xffffdd});

var Vector3 = function(arr) {
    return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

GFX.ArraytoV3 = Vector3;

GFX.V3toArray = function(vector3) {
    return [vector3.x, vector3.y, vector3.z];
}

GFX.WEBGL = (function () {
		try {
			var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch ( e ) {
			return false;
		}
	})();
  
GFX.CANVAS = !! window.CanvasRenderingContext2D;

if (THREE.ColladaLoader) {

  GFX.colladaLoader = new THREE.ColladaLoader();
  GFX.refreshColladaLoader = function() {
    GFX.colladaLoader = new THREE.ColladaLoader();
  }

}
GFX.ShadowMaterial = new THREE.ShaderMaterial({
  vertexShader: $('#shadowVertexShader').text(),
  fragmentShader: $('#shadowFragmentShader').text(),
});

GFX.textureLoader = new THREE.TextureLoader();

//GFX.colladaLoader.convertUpAxis = true;
//THREE.ImageUtils.crossOrigin = "";

/*
var PARTICLE_TEXTURE = THREE.ImageUtils.loadTexture(
    "/assets/graphics/particle.png"
);*/

/*
var STAR_TEXTURE = THREE.ImageUtils.loadTexture(
    "/assets/graphics/star.png"
);
*/

GFX.easeUp = function(s) {
    return (1.0 - (1.0 - s) * (1.0 - s));
}

GFX.easeDown = function(s) {
    return s * s;
}

GFX.lerp = function(v1, v2, a) {
    var result = [];
    for (var i = 0; i < v1.length; i++) {
        result.push(v1[i] + (v2[i]-v1[i]) * a);
    }
    return result;
}

GFX.rotateV3AxisAngle = function(v, axis, angle) {
  
  /*
  tempVec3.set(v[0], v[1], v[2]);
  temp2Vec3.set(axis[0], axis[1], axis[2]);
  
  tempVec3.applyAxisAngle(temp2Vec3, angle);
  return GFX.V3toArray(tempVec3);
  */
  
  var result = Vec.rotateAxisAngle(v, Vec.normalize(axis), angle);
  return result;
}

//Rotates v along the same rotation that would move v1 to v2
GFX.slerpVec2 = function(v, v1, v2, alpha, tieBreaker) {
  var angle = Vec.angleBetween(v1, v2);
  var theta = angle * alpha;
  if (theta < 0.001) return v;
  var cross;
  
  if (angle > Math.PI - 0.01 && tieBreaker) {
     cross = Vec.perpendicular(v1, tieBreaker);
     cross = Vec.perpendicular(cross, v1);
  } else {
    cross = Vec.perpendicular(v1, v2);
  }
  var result = GFX.rotateV3AxisAngle(v, cross, theta);
  return result;
}

GFX.slerpVec = function(v1, v2, alpha, minTheta, maxTheta, tieBreaker) {
  var l1 = Vec.length(v1);
  var l2 = Vec.length(v2);
  var l3 = Math.lerp(l1, l2, alpha);
  
  if (l3 > 4.0) {
    //console.log(v1, v2);
  }
  
  var angle = Vec.angleBetween(v1, v2);
  var theta = angle * alpha;
  
  
  if (minTheta !== undefined) {
    if (theta < minTheta) {
      theta = Math.min(minTheta, angle);
    }
  }
  
  if (maxTheta != undefined) {
    if (theta > maxTheta) {
      theta = Math.min(maxTheta, angle);
    }
  }
 
  if (theta < 0.001) {
    return Vec.setLength(v1, l3);
  }

  var cross = Vec.perpendicular(v1, v2);
  
  if (angle >= Math.PI - 0.01 && tieBreaker) {
     cross = Vec.perpendicular(v1, tieBreaker);
     cross = Vec.perpendicular(cross, v1);
  }
  
  
  if (isNaN(cross[0])) {
    console.log("crossnan", v1, v2);
  }
  var result = Vec.setLength(GFX.rotateV3AxisAngle(v1, cross, theta), l3);
  
  if (Vec.length(result) < 0.0001 || isNaN(result[0])) {
     console.log("Math death", v1, v2, alpha);
    return [0, 1, 0];
  }
  return result;
}

GFX.slerpEuler = function(v1, v2, alpha) {
    var tempEuler = GFX.tempEuler;
    tempEuler.set(v1[0], v1[1], v1[2], 'XYZ');
    tempQuat.setFromEuler(tempEuler);

    tempEuler.set(v2[0], v2[1], v2[2], 'XYZ');
    tempQuat2.setFromEuler(tempEuler);

    tempQuat.slerp(tempQuat2, alpha);
    tempEuler.setFromQuaternion(tempQuat, 'XYZ');

    return [tempEuler.x, tempEuler.y, tempEuler.z];
}


GFX.gpsToVec3 = function(latitude, longitude, radius) {
    var lat = latitude * Math.PI / 180.0;
    var lon = longitude * Math.PI / 180.0 - Math.PI * 0.5;

    var cosLat = Math.cos(lat);
    var sinLat = Math.sin(lat);
    var cosLon = Math.cos(lon);
    var sinLon = Math.sin(lon);
    var rad = radius;

    return [rad * cosLat * cosLon, rad * sinLat, -rad * sinLon * cosLat];
}

GFX.dispose = function(glObject, scene) {

    scene._scene.remove(glObject);

    if (glObject.geometry) {
        glObject.geometry.dispose();
    }

    if (glObject.material) {
        if (glObject.material.map) {
            //glObject.material.map.dispose();
        }
        //glObject.material.dispose();
    }
}

GFX.sampleTriangle = function(c1, c2, c3) {

    /*var bcoords = [Math.random(), Math.random(), Math.random()];
    bcoords = Vec.scale(bcoords, 1/Math.sum(bcoords));


    return Vec.sum([Vec.scale(v1, bcoords[0]),
                   Vec.scale(v2, bcoords[1]),
                   Vec.scale(v3, bcoords[2])]);*/

    var v2 = Vec.sub(c2, c1);
    var v3 = Vec.sub(c3, c1);
    var coeffs = [Math.random(), Math.random()];
    var origin = c1;

    if (Math.sum(coeffs) > 1) {
        var c4 = Vec.sum(c1, v2, v3);
        v2 = Vec.sub(c3, c4);
        v3 = Vec.sub(c2, c4);
        origin = c4;
    }

    return Vec.add(origin, Vec.add(Vec.scale(v2, coeffs[0]), Vec.scale(v3, coeffs[1])));
}

GFX.sampleFace = function(geo, faceIndex) {
    return GFX.sampleTriangle(vs[face.a].toArray(),
                              vs[face.b].toArray(),
                              vs[face.c].toArray());
}

GFX.remakeGeometry = function(geo) {
  var dg = geo.__directGeometry;
  var faces = geo.faces;
  var vertices = geo.vertices;
  var uvs = geo.faceVertexUvs[0];
  
  if(dg) {
    for (var i = 0, l = faces.length; i < l; i++) {
      var face = faces[i];
      var i0 = i * 3;
      var i1 = i0 + 1;
      var i2 = i0 + 2;
      
      dg.vertices[i0] = vertices[face.a];
      dg.vertices[i1] = vertices[face.b];
      dg.vertices[i2] = vertices[face.c];
      
      dg.normals[i0] = face.normal;
      dg.normals[i1] = face.normal;
      dg.normals[i2] = face.normal;
      
      dg.colors[i0] = face.color;
      dg.colors[i1] = face.color;
      dg.colors[i2] = face.color;
      
      dg.uvs[i0] = uvs[i][0];
      dg.uvs[i1] = uvs[i][1];
      dg.uvs[i2] = uvs[i][2];
    }

    var bg = geo._bufferGeometry;
    bg.attributes.position.copyVector3sArray(dg.vertices);
    bg.attributes.color.copyColorsArray(dg.colors);
    bg.attributes.uv.copyVector2sArray(dg.uvs);
    bg.attributes.normal.copyVector3sArray(dg.normals);

    bg.attributes.position.needsUpdate = true;
    bg.attributes.color.needsUpdate = true;
    bg.attributes.normal.needsUpdate = true;
    bg.attributes.uv.needsUpdate = true;
  }
}

GFX.Group = GAME.Models.Model.extend({
    initialize: function(options) {
        _.bindFunctions(this);
        
        this.castShadow = false;
        _.extend(this, options);
        this.euler = new THREE.Vector3();
        this.children = [];

        if (_.isFunction(this.setup)) {
            this.setup();
        }

        if (this.glObject === undefined) {
          this.glObject = new THREE.Object3D();
        }

        this.rotationalDrag = 0.0;
    },

    sortChildren: function(viewerPosition) {
      GFX.tempVec3.fromArray(viewerPosition);
      var tv3 = GFX.tempVec3;
      
      var children = this.glObject.children;
      for (var c = 0; c < children.length; c++) {
        children[c]._9 = children[c].position.distanceToSquared(tv3); 
      }
      
      children.sort(function(a, b) {
        if (a._9 < b._9) {
            return 1;
          }
          if (a._9 > b._9) {
            return -1;
          }
          return 0;
      });
    },  
    
    distanceTo: function(group) {
      if (_.isArray(group)) {
        return Vec.distance(this.getPosition(), group);
      }
      return Vec.distance(this.getPosition(), group.getPosition());
    },

    setScale: function(number) {
        if (_.isArray(number)) {
            this.glObject.scale.set(number[0], number[1], number[2]);
            return;
        }
        this.scale = number;

        this.glObject.scale.set(number, number, number);
    },

    getScale: function() {
       return this.glObject.scale.x;
    },
    
    faceDirection: function(dir, up) {
      up = up || [0, 1, 0];
      this.glObject.up.set(up[0], up[1], up[2]);
      var pos = this.getPosition();
      this.glObject.lookAt(GFX.ArraytoV3(Vec.add(dir, pos)));
    },

    lookAt: function(target, up) {
      up = up || [0, 1, 0];
      if (this.debugging) console.log("LookAt", target, up);
      this.glObject.up.set(up[0], up[1], up[2]);
      this.glObject.lookAt(new THREE.Vector3(target[0], target[1], target[2]));
    },

    rotateAxisAngle: function(axis, angle) {
      tempVec3.fromArray(axis);
      this.glObject.quaternion.setFromAxisAngle(tempVec3, angle);
    },
    
    setEuler: function(euler) {
        this.euler.set(euler[0], euler[1], euler[2]);
        this.glObject.quaternion.setFromEuler(
            new THREE.Euler(euler[0], euler[1], euler[2], 'XYZ')
        );
    },
    
    getEuler: function() {
      return [this.euler.x, this.euler.y, this.euler.z];
    },

    getVectorToCamera: function() {
        this.glObject.updateMatrixWorld();
        tempVec3.set(0.0, 0.0, 1.0);
        this.glObject.worldToLocal(tempVec3);
        tempVec3.normalize();
        return [tempVec3.x, tempVec3.y, tempVec3.z];
    },

    setRotationalDrag: function(number) {
        this.rotationalDrag = number;
    },

    setRotationalVelocity: function(v) {
       if(this.rotationVel === undefined) {
           this.rotationVel = new THREE.Vector3(v[0], v[1], v[2]);
       } else {
           this.rotationVel.set(v[0], v[1], v[2]);
       }
    },

    lerpRotationalVelocity: function(v, a) {
      a = Math.clamp(a, 0.0, 1.0);
      tempVec3.set(v[0], v[1], v[2]);
      this.rotationVel = this.rotationVel || new THREE.Vector3();
      this.rotationVel.lerp(tempVec3, a);
    },

    add: function(object) {

        if (_.isArray(object)) {
            for (var o = 0; o < object.length; o++) {
                this.add(object[o]);
            }
            return;
        }

        this.children.push(object);
        
        if (object.parent) {
          object.parent.remove(object);
        }
        
        object.parentID = this.children.length-1;
        this.glObject.add(object.glObject);
        object.parent = this;
    },

    remove: function(object) {
      if(!object || !object.glObject) return;
      this.glObject.remove(object.glObject);
      this.children[object.parentID] = undefined;
      this.flagRemoval = true;
    },
    
    clear: function(destroy) {
      for (var c = 0; c < this.children.length; c++) {
        if (this.children[c]) {
          this.children[c].clear(destroy);
          if (destroy) this.children[c].destroy();
          this.remove(this.children[c]);
        }
      }
      
    },
    
    transferTo: function(newParent) {
      var pos = this.getWorldPosition();
      this.parent.remove(this);
      newParent.add(this);
      var newPos = newParent.getLocalPosition(pos);
      this.setPosition(newPos);
    },

    setPosition: function(pos) {
      if(this.debugging) console.log("setPos", pos);
      this.glObject.position.set(pos[0], pos[1], pos[2]);
    },

    setPositionFromGPS: function(gps, radius) {
        var pos = GFX.gpsToVec3(gps[0], gps[1], radius);
        this.glObject.position.set(pos[0], pos[1], pos[2]);
        var target = this.glObject.position.clone().multiplyScalar(1.2);
        this.glObject.lookAt(target);
    },

    getPosition : function(pos) {
        return [this.glObject.position.x, this.glObject.position.y, this.glObject.position.z];
    },

    getWorldPosition : function(pos) {
        var result = zeroVector.clone();
        if (pos) {
          result.set(pos[0], pos[1], pos[2]);
        }
        this.glObject.updateMatrixWorld();
        this.glObject.localToWorld(result);
        return [result.x, result.y, result.z];
    },
    
    getLocalPosition: function(worldPos) {
      var result = tempVec3;
      result.set(worldPos[0], worldPos[1], worldPos[2]);
      this.glObject.updateMatrixWorld();
      this.glObject.worldToLocal(result);
      return [result.x, result.y, result.z];
    },
    
    _setShadowMode: function(enabled) {
      for (var i = 0, l = this.children.length; i < l; i++) {
        if(this.children[i]) {
          this.children[i]._setShadowMode(enabled);
        }
      }
      
      if (!this.glObject.material || !this.glObject.geometry) {
        return;
      }
      
      if(enabled) {
        this._shadowSaveMat = this.glObject.material;
        this._shadowSaveVis = this.glObject.visible;
        this.glObject.material = this.shadowMaterial || GFX.ShadowMaterial;
        this.glObject.visible = this.castShadow;
        if (this.glObject.visible && this.shadowScale)
          this.glObject.scale.multiplyScalar(this.shadowScale);
      } else if (this._shadowSaveVis != undefined) {
        if (this.glObject.visible && this.shadowScale) {
          this.glObject.scale.multiplyScalar(1/this.shadowScale);
        }
        this.glObject.visible = this._shadowSaveVis;
        this.glObject.material = this._shadowSaveMat;
      }
    },
    
    _update: function(state) {
        for (var i = 0, l = this.children.length; i < l; i++) {
          if (!this.children[i]) continue;
          this.children[i]._update(state);
        }

        if (this.flagRemoval) {
          this.children = _.compact(this.children);

          for (var i = 0, l = this.children.length; i < l; i++) {
              this.children[i].parentID = i;
          }
          this.flagRemoval = false;
        }

        if (_.isFunction(this.update)) {
            this.update(state);
        }

    },

    /*
    slerpTo: function(x, y, z, alpha) {
        tempVec3.set(x, y, z);
        tempQuat.setFromEuler(tempVec3);
        this.glObject.quaternion.slerp(tempQuat, alpha);
        this.euler.setEulerFromQuaternion(this.glObject.quaternion);
    },*/

    handleMouseDown: function() {
        if (this.hover) {
            this.active = true;
        }
    },

    handleMouseUp: function() {
        this.active = false;
    },
    
    intersectRay: function(origin, direction) {
      GFX.tempRaycaster.ray.origin.fromArray(origin);
      GFX.tempRaycaster.ray.direction.fromArray(direction);
      var result = GFX.tempRaycaster.intersectObject(this.glObject, true);
      return result[0];
    },
    
    castShadows: function(toggle) {
      this.castShadow = toggle;
      //this.glObject.castShadow = true;
    },

    setVisibility: function(visible) {
      this.glObject.visible = visible;
      for (var i = 0; i < this.children.length; i++) {
        if (!this.children[i]) continue;
        this.children[i].setVisibility(visible);
      }
    },
    
    setChildrenMaterial: function(material) {
      if (!this.glObject || !this.glObject.children) return;
      for (var i = 0; i < this.glObject.children.length; i++) {
          this.glObject.children[i].material = material;
      }
    },

    //dir = [0,1] to move forward, dir = [-1,0] to move left, etc.
    moveInOrbit : function(dir, forward, radius) {
        var dirToCenter = this.glObject.position.clone().negate().normalize();
        var rotationMatrix = (new THREE.Matrix4()).copy(this.glObject.matrix);
        rotationMatrix.setPosition(zeroVector);
        var dirLooking = zAxis.clone().applyMatrix4(rotationMatrix).normalize();
        dirLooking = Vector3(forward);

        var dirLeft = new THREE.Vector3().crossVectors(dirLooking, dirToCenter).normalize();
        dirLooking.crossVectors(dirToCenter, dirLeft).normalize();

        rotationMatrix.makeRotationAxis(dirLooking, dir[0] / radius);
        this.glObject.position.applyMatrix4(rotationMatrix);
        dirLooking.applyMatrix4(rotationMatrix);

        rotationMatrix.makeRotationAxis(dirLeft, dir[1] / radius);
        this.glObject.position.applyMatrix4(rotationMatrix);
        dirLooking.applyMatrix4(rotationMatrix);

        this.glObject.position.setLength(radius);
        return [dirLooking.x, dirLooking.y, dirLooking.z];
    }
});

GFX.StarField = GFX.Group.extend({
    setup: function() {
       var geometry = new THREE.Geometry();
       geometry.dynamic = false;
       this.opacity = this.opacity || 1.0;
       
       this.size = (this.size || 8);
       this.targetSize = this.size;
       
       var mat = new THREE.PointsMaterial({
         size: this.size,
         //map: this.particleTexture,
         color: this.color || 0xffffff,
         transparent: this.opacity < 1.0,
         opacity: this.opacity,
         depthTest: false
       });
       
      this.material = mat;
      this.glObject = new THREE.Points(geometry, mat);
      this.glObject.sortParticles = false;
      this.numParticles = this.numParticles || 1200;
      var distance = this.distance || 100;
        
        
        for (var i = 0; i < this.numParticles; i++) {
          /*
          var lat = Math.randomReal(-90, 90);
          var lng = Math.randomReal(-180, 180);
          
          var radius = Math.randomReal(4.0, 10.0) * distance;
          
          if (this.milkyway && i % 2 == 0) {
            lat = Math.gaussReal(-10, 10,6 );
          }

          this.glObject.geometry.vertices.push(Vector3(GFX.gpsToVec3(lat, lng, radius)));
          */
          
          var radius = Math.randomReal(1.0, 2.0) * distance;
          var theta = Math.randomReal(0, 2 * Math.PI);
          var u = Math.randomReal(-1, 1);

          this.glObject.geometry.vertices.push(new THREE.Vector3(
            Math.sqrt(1-(u*u)) * Math.cos(theta) * radius,
            Math.sqrt(1-(u*u)) * Math.sin(theta) * radius,
            u * radius));
          

       }
     },
     
     burst: function() {
      this.size = this.targetSize * 1.7;
     },
     
     update: function(state) {
       if (this.twinkle){
        this.time = this.time || 0;
        this.time += state.dt;
        this.material.size = this.size * ALIAS_SIZE * (1.0 + Math.sin(this.time * this.twinkle * Math.PI) * 0.1);
       } else {
        this.material.size = this.size * ALIAS_SIZE;
       }
       
       this.size = Math.lerp(this.size, this.targetSize, state.dt * 3.0);
     }
});


//numParticles, color
GFX.ParticleSystem = GFX.Group.extend({
    setup: function() {
        var geometry = new THREE.Geometry();
        geometry.dynamic = true;
        if (this.dynamic != undefined) {
          geometry.dynamic = this.dynamic;
        }
        this.particleSize = this.particleSize || 1;
        
        if (!this.material) {
          this.material = new THREE.PointsMaterial({
              size: this.particleSize,
              //map: this.particleTexture,
              color: this.particleColor || 0xffffff,
              transparent: true,
              opacity: this.particleOpacity || 0.5,
          });
          this.defaultMaterial = 1;
        }
        this.glObject = new THREE.Points(geometry, this.material);
        //this.glObject.sortParticles = true;
        this.glObject.frustumCulled = false;

        this.initParticles();
    },
      
    destroy: function() {
      this.glObject.geometry.dispose();
      if (!this.material.sharedAsset)
        this.material.dispose();
    },
    
    initParticles: function() {

    },
    
    update: function(state) {
      if(this.defaultMaterial) {
        this.material.size = this.particleSize * ALIAS_SIZE;
      } else {
        if (this.material && this.material.uniforms && this.material.uniforms.scale) {
            this.material.uniforms.scale.value = this.particleSize * ALIAS_SIZE;
        }
      }
    }
});

var ico = new THREE.IcosahedronGeometry(1.0, 0);

GFX.makeSeedGeometry = function(radius, height) {

    var geo = ico.clone();
    for (var v in geo.vertices) {
        var vertex = geo.vertices[v];
        vertex.x *= radius;
        vertex.y *= radius;

        vertex.z += 0.5;
        vertex.z *= height;
    }
    return geo;
}

var boxGeometry = new THREE.BoxGeometry(2, 2, 2);

GFX.makeBodyGeometry = function(pt2, w1, h1, w2, h2) {
    var geo = boxGeometry.clone();

    for (var vi in geo.vertices) {
        var v = geo.vertices[vi];
        if (v.z < 0) {
            v.z = 0;
            v.x *= w1;
            v.y *= h1;
        } else {
            v.z = pt2[2];
            v.x = pt2[0] + (v.x * w2);
            v.y = pt2[1] + (v.y * h2);
        }
    }
    return geo;
};

var uv00 = new THREE.Vector2(0, 0);
var uv01 = new THREE.Vector2(0, 1);

var uvwidth = 0.9;

var uva = new THREE.Vector2(0, 0);
var uvaa = new THREE.Vector2(uvwidth, 0);
var uvb = new THREE.Vector2(uvwidth * 0.33, 0);
var uvc = new THREE.Vector2(uvwidth * 0.66, 0);

var uvd = new THREE.Vector2(0, 1.0);
var uvdd = new THREE.Vector2(uvwidth, 1.0);
var uve = new THREE.Vector2(uvwidth * 0.33, 1.0);
var uvf = new THREE.Vector2(uvwidth * 0.66, 1.0);


var storeHash = function(dict, a, b) {  
  dict[a + '+' + b] = dict[a + '+' + b] || 0;
  dict[a + '+' + b] += 1;

  dict[b + '+' + a] = dict[b + '+' + a] || 0;
  dict[b + '+' + a] += 1;
}

GFX.flipNormals = function(geo) {
  var fs = geo.faces;
  
  for (var f = 0; f < fs.length; f++) {
    var face = geo.faces[f];
    if (face.normal) {
      face.normal.multiplyScalar(-1);
    }
    if (face.vertexNormals) {
      face.vertexNormals[0].multiplyScalar(-1);
      face.vertexNormals[1].multiplyScalar(-1);
      face.vertexNormals[2].multiplyScalar(-1);
    }
  }
}

GFX.extrudeQuads = function(geo, ts, distance) {
  var seenVerts = {};
  var fs = [];
  
  for (var t = 0; t < ts.length; t++) {
    fs.push(ts[t] * 2, ts[t] * 2 + 1);
  }
  
  for (var f = 0; f < fs.length; f+=2) {
    storeHash(seenVerts, geo.faces[fs[f]].a, geo.faces[fs[f]].b);
    storeHash(seenVerts, geo.faces[fs[f]].a, geo.faces[fs[f]].c);
    storeHash(seenVerts, geo.faces[fs[f+1]].a, geo.faces[fs[f+1]].b);
    storeHash(seenVerts, geo.faces[fs[f+1]].b, geo.faces[fs[f+1]].c);
  }
  
  for (f = 0; f < fs.length; f+=2) {
    GFX.extrudeQuad(geo, fs[f], fs[f+1], distance, seenVerts)
  }
  
  geo.mergeVertices();
}

GFX.extrudeQuad = function(geo, faceIndex1, faceIndex2, distance, seenVerts) {
  var f1 = geo.faces[faceIndex1];
  var f2 = geo.faces[faceIndex2];
  
  seenVerts = seenVerts || {};
  
  var normal = new THREE.Vector3();

  normal.copy(f1.normal);
  normal.setLength(distance);
  var vs = geo.vertices;
  
  var h1 = f1.a;
  var h2 = f1.b;
  var h3 = f1.c;
  var h4 = f2.b;
  
  var v1,v2,v3,v4;
  
  //f1a
  var v = new THREE.Vector3();
  v.addVectors(vs[h1], normal);
  v1 = vs.length;
  vs.push(v);
  
  //f1b
  v = new THREE.Vector3();
  v.addVectors(vs[h2], normal);
  v2 = vs.length;
  vs.push(v);
  
  //f1c
  v = new THREE.Vector3();
  v.addVectors(vs[h3], normal);
  v3 = vs.length;
  vs.push(v);

  //f2b
  v = new THREE.Vector3();
  v.addVectors(vs[h4], normal);
  v4 = vs.length;
  vs.push(v);
  
  var fs = geo.faces;

  if ((seenVerts[f1.a + '+' + f1.b] || 0) < 2) {
    fs.push(new THREE.Face3(h1, h2, v1));
    fs.push(new THREE.Face3(h2, v2, v1));
  }

  if ((seenVerts[f1.b + '+' + f2.b] || 0) < 2) {
    fs.push(new THREE.Face3(h2, h4, v2));
    fs.push(new THREE.Face3(h4, v4, v2));
  }
  
  if ((seenVerts[f1.c + '+' + f2.b] || 0) < 2) {
    fs.push(new THREE.Face3(h4, h3, v4));
    fs.push(new THREE.Face3(h3, v3, v4));
  }
  
  if ((seenVerts[f1.c + '+' + f1.a] || 0) < 2) {
    fs.push(new THREE.Face3(h3, h1, v3));
    fs.push(new THREE.Face3(h1, v1, v3));
  }
  
  f1.a = v1;
  f1.b = v2;
  f1.c = v3;
  
  f2.a = v2;
  f2.b = v4;
  f2.c = v3;
  
  geo.computeFaceNormals();
}

//Epigon
GFX.removeJoinedTiles = function(geometry) {
  tileCenters = {};
  //Removes faces that have met
  var vs = geometry.vertices;
    for (var f = 0; f < geometry.faces.length; f+=2) {
      var center = new THREE.Vector3();
      var facea = geometry.faces[f];
      var faceb = geometry.faces[f+1];
      
      center.add(vs[facea.b]);
      center.add(vs[facea.c]);
      center.multiplyScalar(0.5);
      var sideLength = vs[facea.a].distanceTo(vs[facea.b]) / 2.0;
      var centerHash = Math.round(center.x/sideLength) + "," + Math.round(center.y/sideLength) + "," + Math.round(center.z/sideLength);
      if (tileCenters[centerHash] != undefined) {
        geometry.faces.splice(f, 2);
        geometry.faces.splice(tileCenters[centerHash], 2);
        f-=4;
      }
      
      tileCenters[centerHash] = f;
    }
}

GFX.extrudeFace = function(geo, faceIndex, length, taper) {
    var face = geo.faces[faceIndex];
    var normal = face.normal.clone().setLength(length);
    GFX.perturb(normal, length * 0.5);
    var vs = geo.vertices;
    taper = taper || 0;

    var center = new THREE.Vector3();
    center.addVectors(vs[face.a], vs[face.b]);
    center.add(vs[face.c]);
    center.multiplyScalar(1/3);
    center.add(normal);

    vs.push((new THREE.Vector3()).addVectors(vs[face.a], normal));
    var d = vs.length-1; var a = face.a;
    vs.push((new THREE.Vector3()).addVectors(vs[face.b], normal));
    var e = vs.length-1; var b = face.b;
    vs.push((new THREE.Vector3()).addVectors(vs[face.c], normal));
    var f = vs.length-1; var c = face.c;

    vs[d].lerp(center, 1-taper);
    vs[e].lerp(center, 1-taper);
    vs[f].lerp(center, 1-taper);

    geo.faces.push(new THREE.Face3(a, b, d));
    geo.faces.push(new THREE.Face3(b, e, d));

    geo.faces.push(new THREE.Face3(b, c, e));
    geo.faces.push(new THREE.Face3(c, f, e));

    geo.faces.push(new THREE.Face3(c, a, f));
    geo.faces.push(new THREE.Face3(a, d, f));
    
    var lastFace = geo.faces.length;

    face.a = d;
    face.b = e;
    face.c = f;
    
    geo.faceVertexUvs[0][lastFace-6] = [uva, uvb, uvd];
    geo.faceVertexUvs[0][lastFace-5] = [uvb, uve, uvd];
    
    geo.faceVertexUvs[0][lastFace-4] = [uvb, uvc, uve];
    geo.faceVertexUvs[0][lastFace-3] = [uvc, uvf, uve];
    
    geo.faceVertexUvs[0][lastFace-2] = [uvc, uvaa, uvf];
    geo.faceVertexUvs[0][lastFace-1] = [uvaa, uvdd, uvf];
    
    /*
    geo.faceVertexUvs[0][lastFace-6] = [uv00, uv00, uv01];
    geo.faceVertexUvs[0][lastFace-5] = [uv00, uv01, uv01];
    
    geo.faceVertexUvs[0][lastFace-4] = [uv00, uv00, uv01];
    geo.faceVertexUvs[0][lastFace-3] = [uv00, uv01, uv01];
    
    geo.faceVertexUvs[0][lastFace-2] = [uv00, uv00, uv01];
    geo.faceVertexUvs[0][lastFace-1] = [uv00, uv01, uv01];
    */
    geo.computeFaceNormals();
    return [faceIndex];
};

GFX.perturb = function(v3, amount) {
  amount *= 0.5;
  v3.x += Math.randomReal(-amount, amount);
  v3.y += Math.randomReal(-amount, amount);
  v3.z += Math.randomReal(-amount, amount);
};

GFX.extrudeFaceToPoint = function(geo, faceIndex, length) {
    var face = geo.faces[faceIndex];

    var vs = geo.vertices;
    length = length || vs[face.a].distanceTo(vs[face.b]);
    var normal = face.normal.clone().setLength(length);

    var center = new THREE.Vector3();
    center.addVectors(vs[face.a], vs[face.b]);
    center.add(vs[face.c]);
    center.multiplyScalar(1/3);
    center.add(normal);

    geo.vertices.push(center);
    var e = geo.vertices.length-1;

    //geo.faces.push(new THREE.Face3(face.a, face.b, e));
    var c = face.c;
    face.c = e;
    geo.faces.push(new THREE.Face3(face.b, c, e));
    geo.faces.push(new THREE.Face3(c, face.a, e));

    return [geo.faces.length-1, geo.faces.length-2, faceIndex];
};

GFX.makeSphereGeometry = function(radius, subdivisions, scale) {
  radius = radius || 1;
  if (subdivisions == undefined) subdivisions = 1;
  scale = scale || [1, 1, 1];
  var result = new THREE.IcosahedronGeometry(radius, subdivisions);
  tempMat4.makeScale(scale[0], scale[1], scale[2]);
  result.applyMatrix(tempMat4);
  return result;
}

GFX.transformGeometry = function(options) {
  var scale = new THREE.Vector3(1.0, 1.0, 1.0);
  
  if (_.isNumber(options.scale)) {
    scale.multiplyScalar(options.scale);
  } else if (_.isArray(options.scale)) {
    scale.fromArray(options.scale);
  }
  
  var e = options.euler || [0,0,0];
  var rotate = new THREE.Euler(e[0], e[1], e[2], 'XYZ');
  var translate = GFX.ArraytoV3(options.translate || [0, 0, 0]);
  tempMat4.compose(translate, (new THREE.Quaternion()).setFromEuler(rotate), scale);
  options.geometry.applyMatrix(tempMat4);
  return options.geometry;
}

GFX.makePrismGeometry = function(radius, baseCount, height, taper, cap1, cap2, pt, scale) {
    scale = scale || [1, 1];
    pt = pt || [0, 0, height];
    var geometry = new THREE.Geometry();
    taper = taper || 1;

    for (var i = 0; i < baseCount; i++) {
        var theta = i * (Math.PI * 2 / baseCount) + Math.PI * 0.5;
        geometry.vertices.push( new THREE.Vector3(Math.cos(theta) * radius * scale[0],  Math.sin(theta) * radius * scale[1], 0) );
        geometry.vertices.push( new THREE.Vector3(Math.cos(theta) * radius * taper * scale[0] + pt[0],  Math.sin(theta) * radius * taper * scale[1] + pt[1], pt[2]) );

        var me = i*2;
        var nextHere = ( (i+1) % baseCount ) * 2;
        var across = me + 1;
        var nextAcross = nextHere + 1;
        var centerHere = baseCount * 2;
        var centerAcross = cap1 ? baseCount * 2 + 1 : baseCount * 2;

        //bases
        if (cap1) {
            geometry.faces.push( new THREE.Face3( me, centerHere, nextHere) );
        }
        if (cap2) {
            geometry.faces.push( new THREE.Face3( nextAcross, centerAcross, across) );
        }


        //sides
        geometry.faces.push( new THREE.Face3( me, nextHere, across) );
        geometry.faces.push( new THREE.Face3( nextHere, nextAcross, across ));
        
        //geometry.faceVertexUvs[0].push([new THREE.Vector2(i/baseCount, 0), new THREE.Vector2((i+1)/baseCount, 0), new THREE.Vector2(i/baseCount, 1)]);
        //geometry.faceVertexUvs[0].push([new THREE.Vector2((i+1)/baseCount, 0.0), new THREE.Vector2((i+1)/baseCount, 1.0), new THREE.Vector2(i/baseCount, 1)]);
    }

    if (cap1)
      geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
    if (cap2)
      geometry.vertices.push( GFX.ArraytoV3(pt));
    
    geometry.computeFaceNormals();
    return geometry;
}

GFX.makePyramidGeometry = function(radius, baseCount, height) {
    var geometry = new THREE.Geometry();
    geometry.faceVertexUvs = [];

    var flip = false;
    
    
    if (height < 0) {
      flip = true;
      height *= -1;
    }
    
    for (var i = 0; i < baseCount; i++) {
        var theta = i * (Math.PI * 2 / baseCount) - Math.PI * 0.5;
        geometry.vertices.push( new THREE.Vector3(Math.cos(theta) * radius,  Math.sin(theta) * radius, 0) );
        geometry.faces.push( new THREE.Face3( baseCount, (i+1)%baseCount, i) );
        geometry.faces.push( new THREE.Face3( i, (i+1)%baseCount, baseCount+1) );
    }

    geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
    geometry.vertices.push( new THREE.Vector3(0, 0, height) );

    if (flip) {
      tempMat4.makeRotationX(Math.PI);
      geometry.applyMatrix(tempMat4);
    }
    
    geometry.computeFaceNormals();

    return geometry;
}

GFX.scaleGeometry = function(geometry, scale) {
  tempMat4.makeScale(scale, scale, scale);
  geometry.applyMatrix(tempMat4);
}

GFX.distortGeometry = function(geometry, s) {
    var s = s || 0.005;
    var d = 0.0;
    var scale = Math.vary(1.0);

    var dir = [Math.gaussReal(-d, d), Math.gaussReal(-d, d)];
    var vs = geometry.vertices;
    for (var i = 0, l = vs.length; i < l; i++) {
        var vertex = vs[i];
        tempVec3.set(Math.gaussReal(-s, s) + dir[0], Math.gaussReal(-s, s) + dir[1], Math.gaussReal(-s, s));

        if (vertex.z < 0.001) {
            tempVec3.z = 0;
        }

        vertex.add(tempVec3);
        vertex.multiplyScalar(scale);
    };
}

GFX.setFaceColors = function(geometry, color, distort) {
    var s = 15/255;
    var faces = geometry.faces;
    var altColor;
    if(distort && distort.color) {
      altColor = new THREE.Color();
      altColor.setRGB(distort.color[0], distort.color[1], distort.color[2]);
    } else if(_.isNumber(distort)) {
      s = distort;
    }
    
    

    for (var i = 0, l = faces.length; i < l; i++) {
        var face = faces[i];
        if (_.isArray(color)) face.color.setRGB(color[0], color[1], color[2]);
        else face.color.set(color);
        if(distort) {
          if (altColor) {
            face.color.lerp(altColor, Math.gaussReal(0, distort.amount));
          } else {
            face.color.r += Math.gaussReal(-s, s);
            face.color.g += Math.gaussReal(-s, s);
            face.color.b += Math.gaussReal(-s, s);
          }
        }
    };
}

var OBJSEEDS = Math.floor(Math.random() * 1000);

GFX.Object3D = GFX.Group.extend({
    getGeometry: function() {
      if (this.loaded === false) {
        return {
          waitingObject: this,
        }
      }
      return this.glObject.geometry;
    },

    getSeed: function() {
      if (!this.OBJSEED) {
          this.OBJSEED = OBJSEEDS++;
      }
      return this.OBJSEED;
    },

    getMaterial: function() {
        return this.glObject.material;
    },

    useFaceColors: function() {
        this.glObject.material.vertexColors = THREE.FaceColors;
    },

    useVertexColors: function() {
        this.glObject.material.vertexColors = THREE.VertexColors;
    },
    
    prepareColladaMaterial: function(glObject, material) {
      var oldMaterial = glObject.material;
      
      if (glObject.geometry.faceVertexUvs[0].length == 0) {
        for (var f = 0; f < glObject.geometry.faces.length; f++) {
          glObject.geometry.faceVertexUvs[0][f] = blankFaceUvs;
        }
      }
      
      if (material) {
        glObject.material = material.clone();
        for (var unif in glObject.material.uniforms) {
          glObject.material.uniforms[unif] = material.uniforms[unif];
        }
        if(oldMaterial.map)
          glObject.material.uniforms.tex = {type: 't', value: oldMaterial.map}
        glObject.material.map = oldMaterial.map;
      }
    },

    finishLoadingCollada: function(collada) {
      
      if (true) {
        this.glObject = collada.scene.children[0];
        this.glObject.material = this.material;
        if (this.glObject.geometry) {
          this.glObject.geometry.sharedAsset = true;
        }
      }

      /* else {
        var oldObject = this.glObject;
        this.glObject = collada.scene.children[0].children[0];

        this.prepareColladaMaterial(this.glObject, this.material);
        
        var children = collada.scene.children[0].children;
        
        for (var i = 1; i < children.length; i++) {
          children[i].children[0].position = children[i].position;
          this.prepareColladaMaterial(children[i].children[0], this.material); 
          var child = new GFX.Object3D({glObject: children[i].children[0]});
          child.name = children[i].name;
          this.add(child);
        }
      }*/

      this.setScale(this.scale || 1);
      this.loaded = true;
      this.trigger("loaded");
    },
    
    replaceMesh: function(geometry, material) {
      var oldObject = this.glObject;
      oldObject.visible = false;
      
      this.glObject = new THREE.Mesh(geometry, material);
      this.geometry = geometry;
      this.material = material;
      
      if (oldObject.parent) {
        //oldObject.parent.remove(this) <-- slow?
        oldObject.parent.add(this.glObject);
        this.glObject.position.copy(oldObject.position);
        this.glObject.quaternion.copy(oldObject.quaternion);
        this.glObject.scale.copy(oldObject.scale.clone);
        console.log(oldObject.position, oldObject.quaternion);
      }
      
      return oldObject;
    },

    setup: function() {
        if (this.glObject) return;
          
        var geometry;
        var material;

        switch(this.type) {
            case "collada":
                //If no geo is specified, try to load collada from source.
                if (!this.geometry) {
                  this.loaded = false;
                  GFX.colladaLoader.load(this.src, this.finishLoadingCollada);
                  return;
                } else { //if geo is specified, see if it's waiting on another object to load
                  if (this.geometry.waitingObject) {
                    var thiz = this;
                    this.waitingObject = this.geometry.waitingObject;
                    
                    //If that object's already loaded.
                    if (this.waitingObject.loaded) {
                      geometry = this.waitingObject.geometries[this.geometry.name];
                    } else { //If we're still waiting on that load.
                    
                      this.listenTo(this.waitingObject, 'loaded', function() {
                        thiz.glObject.geometry = thiz.waitingObject.geometries[thiz.geometry.name];
                        thiz.stopListening();
                      });
                      geometry = GFX.TEMP_GEOMETRY;
                    }
                      
                  } else { //else geo is probably already specified 
                    geometry = this.geometry;
                  }
                }
            break;
            case "icosahedron" :
                geometry = new THREE.IcosahedronGeometry(this.shapeRadius || 1, this.shapeSubdivisions || 0);
            break;
            case "box" :
               geometry = new THREE.BoxGeometry(this.shapeDimensions[0], this.shapeDimensions[1], this.shapeDimensions[2]);
            break;
            case "plane" :
              geometry = new THREE.PlaneGeomtry(this.shapeDimensions[0], this.shapeDimensions[1]);
            break;
            case "triangle" :
                geometry = new THREE.Geometry();
                geometry.vertices = [new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
                geometry.faces= [new THREE.Face3(0,1,2)];
            break;
            case "pyramid" :
                geometry = GFX.makePyramidGeometry(this.shapeDimensions[0] || 1, this.shapeDimensions[1] || 3, this.shapeDimensions[2] || 1);
            break;
            default:
                geometry = this.geometry || new THREE.Geometry();
        }

        if(this.materialSpecular) {
          material = new THREE.MeshPhongMaterial({color: this.materialColor || 0xffffff, specular: this.materialSpecular || 0x555544, shininess: this.materialShininess || 5})
        } else if (this.materialColor) {
          material = new THREE.MeshLambertMaterial({color: this.materialColor || 0xffffff})
        } else {
          material = this.material || GFX.DefaultMaterial;
        }

        if (this.materialOpacity != undefined) {
            material.opacity = this.materialOpacity;
            material.transparent = true;
        }

        this.glObject = new THREE.Mesh(geometry, material);
    },

    duplicate: function() {
        var newObj = new GFX.Object3D({
          type:"none",
          geometry: this.glObject.geometry,
          material: this.glObject.material,
        });
        
        newObj.type = this.type;

        for (var ci in this.glObject.children) {
            var child = this.glObject.children[ci];
            var newChild = new THREE.Mesh(child.geometry, child.material);
            newChild.scale.copy(child.scale);
            newChild.quaternion.copy(child.quaternion);
            newChild.position.copy(child.position);
            newObj.glObject.add(newChild);
        }
        
        newObj.setScale(this.scale || 1);

        return newObj;
    },

    facePlaneIntersectRay: function(faceIndex, rayDirection, rayOrigin) {
        var face = this.glObject.geometry.faces[faceIndex];
        var vs = this.glObject.geometry.vertices;

        var tRay = new THREE.Ray();

        tRay.direction.set(rayDirection[0], rayDirection[1], rayDirection[2]);
        tRay.origin.set(rayOrigin[0], rayOrigin[1], rayOrigin[2]);

        if (face.a2 != undefined) {
            tempPlane.setFromCoplanarPoints(vs[face.a2], vs[face.b2], vs[face.c2]);
        } else {
            tempPlane.setFromCoplanarPoints(vs[face.a], vs[face.b], vs[face.c]);
        }
        var intersection = tRay.intersectPlane(tempPlane, false, null);

        if (intersection) {
            return GFX.V3toArray(intersection);
        } else {
            return rayDirection;
        }
    },

    faceIntersectsRay: function(fi, rd, ro) {

        var face = this.glObject.geometry.faces[fi];
        var vs = this.glObject.geometry.vertices;
        tempRay.direction.set(rd[0], rd[1], rd[2]);
        tempRay.origin.set(ro[0], ro[1], ro[2]);
        var intersection;

        if (face.a2 != undefined) {
            intersection = tempRay.intersectTriangle(vs[face.a2], vs[face.b2], vs[face.c2], false, tempVec3);
        } else {
            intersection = tempRay.intersectTriangle(vs[face.a], vs[face.b], vs[face.c], false, tempVec3);
        }

        if (intersection != null) {
            return true;
        }
    },
    
    destroy: function() {
      this.stopListening();
      
      if (!this.glObject) {
        return;
      }
      
      if (this.glObject.geometry && !this.glObject.geometry.sharedAsset) {
        this.glObject.geometry.dispose();
      } 
      
      if (this.glObject.material && !this.glObject.material.sharedAsset) {
        if (this.glObject instanceof THREE.ShaderMaterial) {
        
        } else {
          this.glObject.material.dispose();
        }
      } 
    },

    mergeInGeometry: function(geometry, matrix) {
      this.glObject.geometry.merge(geometry, matrix || GFX.IDENTITY, 0);
      this.glObject.geometry.verticesNeedUpdate = true;

      //Move these out
    }
});


GFX.GeometryLoader = GFX.Object3D.extend({
  type: 'collada',
  
  finishLoadingCollada: function(collada) {
    this.geometries = {};
    var geos = collada.scene.children;
    for (var g = 0; g < geos.length; g++) {
      if (!geos[g].geometry) continue;
      if (this.geoRotate) {
        GFX.transformGeometry({
          geometry: geos[g].geometry,
          euler: this.geoRotate
        });
      }
      geos[g].geometry.sharedAsset = true;
      this.geometries[geos[g].name] = geos[g].geometry;
    }
    this.trigger('loaded');
    this.loaded = true;
  },
  
  getGeometry: function(name) {
    return {
      name: name,
      waitingObject: this,
    }
  }
  
});

GFX.getRenderer = function() {
   if(GFX.WEBGL) {
     return new THREE.WebGLRenderer({
         antialias: false,
     });
   } else {
     
   }
}

 GFX.HumanoidParts = [
    'head', 'body', 
    'rightUpperLeg', 'rightLowerLeg', 
    'rightUpperArm', 'rightLowerArm',
    'leftUpperLeg', 'leftLowerLeg',
    'leftUpperArm', 'leftLowerArm',
  ];

GFX.Humanoid = GFX.Group.extend({
      
      resetBodyPoints: function() {
        this.bodyPoints = {
          leftFoot : [-this.hipWidth, 0, 0],
          rightFoot : [this.hipWidth, 0, 0],
          leftHip : [-this.hipWidth, 0, this.legLength],
          rightHip : [this.hipWidth, 0, this.legLength],
          leftKnee : [-this.hipWidth, 0, this.legLength * 0.5],
          rightKnee : [this.hipWidth, 0, this.legLength * 0.5],
          leftShoulder : [-this.shoulderWidth, 0, this.legLength + this.torsoLength],
          rightShoulder : [this.shoulderWidth, 0, this.legLength + this.torsoLength],
          leftHand : [-this.shoulderWidth, 0, this.legLength + this.torsoLength - this.armLength],
          rightHand : [this.shoulderWidth, 0, this.legLength + this.torsoLength - this.armLength],
          leftElbow: [-this.shoulderWidth, 0, this.legLength + this.torsoLength - (0.5 * this.armLength)],
          rightElbow: [this.shoulderWidth, 0, this.legLength + this.torsoLength - (0.5 * this.armLength)],
          head : [0, 0.0, this.legLength + this.torsoLength + this.neckLength],
          butt : [0, 0, this.legLength],
        }
      },
      
      setup : function () {
        this.glObject = new THREE.Object3D();

        this.bodyMeshes = {};
        this.lastWalkT = 0;

        if (this.src) {
          this.loaded = false;
          GFX.colladaLoader.load(this.src, this.finishLoadingCollada);
          return;
        } else {
          this.loaded = true;
        }
        
        this.computeProportions();
        this.resetBodyPoints();
        this.incrementLoaded();
      },

      duplicate : function () {
        var original = this;
  
        var result = new TW.Humanoid({
          computeProportions :this.computeProportions,
          loadMeshes : function () {},
          createBodyMeshes: function() {},
          bodyScale: this.bodyScale
        });
        
        //this.computeProportions.call(result);
  
        result.loaded = -1;
        result.unloaded = 0;
        for (var i in GFX.HumanoidParts) {
          var part = GFX.HumanoidParts[i];
          result.bodyMeshes[part] = original.bodyMeshes[part].duplicate();
        }
        result.incrementLoaded();
        result = _.extend(result, this.originalDefinition);
        return result;
      },
      
      holdEntity: function(entity) {
        this.add(entity);
        this.heldEntity = entity;
      },

      computeProportions : function () {
        this.height = 0.36;
        this.shoulderWidth = this.height * (16 / 68) * 0.5;
        this.hipWidth = this.height * (16 / 68) * 0.3;
        //this.legLength = this.height * (35 / 68);
        this.legLength = this.height * (35 / 68);
        //this.armLength = this.height * (23 / 68);
        this.armLength = this.height * (23 / 68);
        this.limbRadius = 0.022 * this.height;
        this.torsoLength = this.height * (22 / 68);
        this.neckLength = this.height * (6.5 / 68);
        this.kneeDirection = 1;
      },

      stareAtPoint : function (pos) {
        pos = this.getLocalPosition(pos);

        if (this.bodyMeshes.head) {
          var up = Vec.normalize(Vec.sub(pos, this.bodyPoints.head));          
          if (Vec.dot(this.forwardDir, up) > 0.2) { 
            var frwd = Vec.add([0, 0, 1], Vec.scale(up, this.headIncline * 0.1));
            var quat1 = this.bodyMeshes.head.glObject.quaternion.clone();
            this.bodyMeshes.head.lookAt(frwd, up);
            quat1.slerp(this.bodyMeshes.head.glObject.quaternion, 0.1);
            this.bodyMeshes.head.glObject.quaternion.copy(quat1);
          }
        }
      },
            
      finishLoadingCollada: function(collada) {
        var objects = collada.scene.children;
        var pos = {};

        for (var i = 0; i < objects.length; i++) {
          var name = objects[i].name;
          pos[name] = objects[i].position;
          this.bodyMeshes[name] = new GFX.Object3D({glObject: objects[i]});
          objects[i].material = this.material;
          this.bodyMeshes[name].setChildrenMaterial(this.material);
          
          this.bodyMeshes[name].setScale(this.bodyScale || 1.0);
        }
        
        if (this.noArms) {
          pos.rightUpperArm = {z: (pos.head.z - pos.body.z) * 0.7 + pos.body.z}
          pos.rightLowerArm = {z: (pos.rightUpperArm.z + pos.body.z) * 0.5}
        }
        
        if (!pos.leftUpperArm) {
          this.noLeftArm = true;
        }
                       
        
        this.computeProportions = function() {
          this.shoulderWidth = this.bodyScale * Math.abs((pos.rightUpperArm.x - pos.body.x));
          this.hipWidth = this.bodyScale * Math.abs((pos.rightUpperLeg.x - pos.body.x));
          this.legLength = this.bodyScale * (pos.rightUpperLeg.z - pos.rightLowerLeg.z) * 2.0
          this.armLength = this.bodyScale * (pos.rightUpperArm.z - pos.rightLowerArm.z) * 2.0;
          this.torsoLength = this.bodyScale * (pos.rightUpperArm.z - pos.body.z);
          this.neckLength = this.bodyScale * (pos.head.z - pos.rightUpperArm.z);
          this.kneeDirection = 1;
          this.height = this.legLength + this.torsoLength + this.neckLength;
        }
        
        this.computeProportions();
        this.resetBodyPoints();
        this.incrementLoaded();
      },
      
      getBoundingBox: function() {
        var width = this.shoulderWidth || this.hipWidth || this.height * (8/70);
        return new THREE.Box3(new THREE.Vector3(-width, -width, 0), new THREE.Vector3(width, width, this.height));
      },

      incrementLoaded : function () {
        //this.loadedCount++;
        //console.log(this.loadedCount, this.unloaded);
        if (true) {
          this.createBodyMeshes();

          for (var mesh in this.bodyMeshes) {
            this.add(this.bodyMeshes[mesh]);
          }

          //this.createFaceSections(this);
          this.updateBody();
          this.trigger('loaded');
          this.loaded = true;
        }
      },
      
      faceDirection: function(dir) {
        var p = this.getPosition();
        
        this.setPosition([0,0,0]);
        this.lookAt([0, 1, 0], dir);
        this.setPosition(p);
      },

      createBodyMeshes : function () {
        for (var i in GFX.HumanoidParts) {
          var part = GFX.HumanoidParts[i];
          if (!this.bodyMeshes[part]) {
            switch (part) {
            case 'leftUpperLeg':
              if (this.bodyMeshes.rightUpperLeg) {
                this.bodyMeshes.leftUpperLeg = this.bodyMeshes.rightUpperLeg.duplicate();
                break;
              }
            case 'leftLowerLeg':
              if (this.bodyMeshes.rightLowerLeg) {
                this.bodyMeshes.leftLowerLeg = this.bodyMeshes.rightLowerLeg.duplicate();
                break;
              }
            case 'rightUpperLeg':
            case 'rightLowerLeg':
              this.bodyMeshes[part] = new GAME.GFX.Object3D();
              //this.bodyMeshes[part].glObject.geometry = GFX.makePyramidGeometry(this.limbRadius, 6, -this.legLength * 0.5);
              this.bodyMeshes[part].glObject.geometry = GFX.makePrismGeometry(this.limbRadius, 4, -this.legLength * 0.5,  1.0, true, true);

              
              break;
            case 'leftUpperArm':
              if (this.noArms || this.noLeftArm) return;
              if (this.bodyMeshes.rightUpperArm) {
                //TODO:
                
                
                this.bodyMeshes.leftUpperArm = this.bodyMeshes.rightUpperArm.duplicate();
                /*
                this.bodyMeshes.leftUpperArm = new GFX.Object3D({
                  geometry: this.bodyMeshes.rightUpperArm.glObject.geometry.clone(),
                  material: this.material,
                });
                this.bodyMeshes.leftUpperArm.geometry.scale(-1,1,1);
                this.bodyMeshes.leftUpperArm.geometry.normalizeNormals();
                
                this.bodyMeshes.leftUpperArm.setScale(this.bodyScale);
                break;
                */
              }
            case 'leftLowerArm':
              if (this.noArms || this.noLeftArm) return;

              if (this.bodyMeshes.rightLowerArm) {
                this.bodyMeshes.leftLowerArm = this.bodyMeshes.rightLowerArm.duplicate();
                break;
              }
            case 'rightUpperArm':
            case 'rightLowerArm':
              if (this.noArms) return;
              this.bodyMeshes[part] = new GAME.GFX.Object3D();
              //this.bodyMeshes[part].glObject.geometry = GFX.makePyramidGeometry(this.limbRadius, 6, -this.armLength * 0.5);
              this.bodyMeshes[part].glObject.geometry = GFX.makePrismGeometry(this.limbRadius, 4, -this.armLength * 0.5, 1.0, true, true);

              break;
            case 'body':
              this.bodyMeshes[part] = new GAME.GFX.Object3D();
              this.bodyMeshes.body.glObject.geometry = GFX.makePrismGeometry(this.hipWidth * 1.2, 6, this.torsoLength, this.shoulderWidth * 1.0 / this.hipWidth, true, true, 0, [1, 0.4]);
              break;
            case 'head':
              this.bodyMeshes[part] = new GAME.GFX.Object3D();
              //this.bodyMeshes.head.glObject.geometry = GFX.makeSphereGeometry(this.neckLength * 0.65, 1, [0.7, 0.7, 1.0]);
              this.bodyMeshes.head.glObject.geometry = GFX.makeSphereGeometry(this.neckLength * 0.8, 1, [0.7, 0.7, 1.0]);
              //var size = this.neckLength * 0.5;
              //this.bodyMeshes.head.glObject.geometry = new THREE.BoxGeometry(size, size, size);
              break;
            }
            this.bodyMeshes[part].glObject.material = this.material || GFX.DefaultMaterial;
          }
        }
      },
      
      orientPart: function(mesh, bodyPointOrigin, bodyPointDestination) {
        
        if (!this.bodyMeshes[mesh]) return;
        
        var orig = this.bodyPoints[bodyPointOrigin];
        var dest = this.bodyPoints[bodyPointDestination];
        
        this.bodyMeshes[mesh].setPosition(orig);
        var dir = Vec.sub(orig, dest);
        var up = [0,1,0];
        
        
        if (mesh == 'rightLowerArm' || mesh == 'leftLowerArm') {
          up = [0, 1, 1];
        }
        
        if (this.armsUp > 0.5) {
          if (mesh == 'rightLowerArm' || mesh == 'leftLowerArm') {
            up = [0, -1, 0.5];
          }
          if (mesh == 'rightUpperArm' || mesh == 'leftUpperArm') {
            up = [0, -1, 0.5];
          }
        }
        
        this.bodyMeshes[mesh].lookAt(Vec.add(dir, orig), up); 
        //this.bodyMeshes[mesh].lookAt(dest, [0, 0, 1]); 
      },
      
      setStanding: function() {
        this.resetBodyPoints();
        this.flagUpdateBody = true;
      },
      
      setArmsOut: function() {
        this.setStanding();
        /*
        var height = this.legLength + this.torsoLength;
        
        this.bodyPoints.leftHand = [-this.shoulderWidth - this.armLength, 0, height];
        this.bodyPoints.leftElbow = [-this.shoulderWidth - this.armLength * 0.5, 0, height];
        this.bodyPoints.rightHand = [this.shoulderWidth + this.armLength, 0, height];
        this.bodyPoints.rightElbow = [this.shoulderWidth + this.armLength * 0.5, 0, height];
        
        
        console.log('arms out');*/
      },

      updateBody : function () {
        var up = [0, 0, 1];
           
        this.orientPart('leftUpperLeg', 'leftHip', 'leftKnee');
        this.orientPart('rightUpperLeg', 'rightHip', 'rightKnee');
        this.orientPart('rightLowerLeg', 'rightKnee', 'rightFoot');
        this.orientPart('leftLowerLeg', 'leftKnee', 'leftFoot');
       
        this.orientPart('leftUpperArm', 'leftShoulder', 'leftElbow');
        this.orientPart('rightUpperArm', 'rightShoulder', 'rightElbow');
        this.orientPart('leftLowerArm', 'leftElbow', 'leftHand');
        this.orientPart('rightLowerArm', 'rightElbow', 'rightHand');
        
        if (this.heldEntity) {
          this.heldEntity.setPosition(this.bodyPoints.rightHand);
          var dir = Vec.sub(this.bodyPoints.rightHand, this.bodyPoints.rightElbow)
          this.heldEntity.lookAt(Vec.normalize(dir), [0, 0, 1]);
        }
        
        this.bodyMeshes.body.setPosition(this.bodyPoints.butt);
        this.bodyMeshes.head.setPosition(this.bodyPoints.head);
      },
      
      
      setAxeCycle: function(t) {
        //return;
        //t = 1;
        
        if (t < 0.6) {
          t = Math.min(1.0, t * 2);
        } else {
          t -= 0.6;
          t *= 1/0.4;
          t = (1.0 - t);
          //t = 1 - ((1-t) * (1-t)); 
        }
        var handStart = [this.shoulderWidth + (this.armLength * 0.9), -this.armLength * 0.2, this.bodyPoints.butt[2] + this.torsoLength * 1.2];
        var handMid = [this.shoulderWidth + (this.armLength * 0.7), this.armLength * 0.7, this.bodyPoints.butt[2] + this.torsoLength * 1.0];
        var handEnd = [this.shoulderWidth, this.armLength * 0.9, this.bodyPoints.butt[2] + this.torsoLength * 0.8];
        this.placeBodyPoint('rightHand', Vec.bezier([handStart, handMid, handEnd], t), Vec.bezier([[0, 1, 0], [-1, 0, 0]], t));
      },
      
      update : function (state) {
        //this.placeBodyPoint('leftFoot', TW.state.get('playerCharacter').tongue.positions[3], true);
        if (!this.loaded) {
          return;
        }
        
        if (this.flagUpdateBody) {
          this.flagUpdateBody = false;
          this.updateBody();
        }

        if (this.jumpStart && this.jumpT) {
          this.placeBodyPoint('leftFoot', [-this.hipWidth, 0, 0]);
          this.placeBodyPoint('rightFoot', [this.hipWidth, 0, 0]);
          return;
        }

        if (this.squat > 0) {
          this.placeBodyPoint('leftFoot', [-this.hipWidth, 0, this.legLength * this.squat]);
          this.placeBodyPoint('rightFoot', [this.hipWidth, 0, this.legLength * this.squat]);
        }
        
        
        //this.speed = 0.2;
        if (this.speed > 0.0001) {

          this.walkRate = this.walkRate || 1.0;
          var walkRate = (1.0 / (this.speed * this.walkRate)) * 0.1;
          
          
          
          //this.setWalkCycle((TW.scheduler.clock % walkRate) / walkRate);
          this.setWalkCycle((this.lastWalkT + (state.dt / walkRate) % 1.0));
          
          var repeat = walkRate;          
          if (this.timeToLastStepSound > repeat) {
            this.timeToLastStepSound = 0;
            this.playSound("step2");
            this.stepIndex = (this.stepIndex + 1) % 4;
          } else {
            this.timeToLastStepSound = (this.timeToLastStepSound || 0) + state.dt;
          }
        }
        
        
        if (this.armsUp) {
          this.placeBodyPoint('leftHand',[-this.shoulderWidth * 1.5, this.shoulderWidth * 0.5, this.height * 1.25 * this.armsUp]);
          this.placeBodyPoint('rightHand',[this.shoulderWidth * 1.5, this.shoulderWidth * 0.5, this.height * 1.25 * this.armsUp]);
        }

      },
      
      playSound: function() {
      
      },

      setWalkCycle : function (t) {        
        this.lastWalkT = t;

        var speed = 1.0 - ((0.5 - this.speed) * 0.5);
        
        speed *= this.walkIntensity || 1.0;

        var hRadius = this.legLength * 0.25 * speed * 2;
        var vRadius = this.legLength * 0.1 * speed * 2;
        
        
        
        var buttBounceFactor = 0.05;

        var theta = t * Math.PI * 2;
        var buttHeight = this.legLength * (1.0 + (Math.cos((2 * theta) + (Math.PI)) * speed * buttBounceFactor));

        this.placeBodyPoint('butt', [0, 0, buttHeight]);        
        this.placeBodyPoint('head', [0, 0, buttHeight + this.torsoLength + this.neckLength]);
        
        var leftFootY = Math.sin(theta) * hRadius;
        var rightFootY = Math.sin(theta + Math.PI) * hRadius;

        if (this.kneeDirection > 0) {
          if (leftFootY < 0)
            leftFootY *= 1.5;
          if (rightFootY < 0)
            rightFootY *= 1.5;
        } else {
          if (leftFootY > 0)
            leftFootY *= 1.5;
          if (rightFootY > 0)
            rightFootY *= 1.5;
        }
        
        var turnOut = this.legTurnOut || 0.0;

        

        this.placeBodyPoint('leftFoot', [-this.hipWidth, leftFootY, buttHeight - this.legLength + (Math.cos(theta) + 1.0) * vRadius], [-1.0, -turnOut, 0.0]);
        this.placeBodyPoint('rightFoot', [this.hipWidth, rightFootY, buttHeight - this.legLength + (Math.cos(theta + Math.PI) + 1.0) * vRadius], [-1.0, turnOut, 0.0]);
        
        turnOut = this.armTurnOut || 0.0;

        
        var handDistance = this.handDistance || 1.0;
        
        if (!this.armsUp) {
        
          /*
          this.placeBodyPoint('leftHand', [-this.shoulderWidth * handDistance, 
            Math.sin(theta + Math.PI) * hRadius * 0.7, 
            buttHeight + (1-Math.abs(Math.cos(theta + Math.PI))) * vRadius * 1.1],  [-1.0, turnOut, 0.0]);
          */
          
          hRadius = this.armLength * 0.25 * speed * 2.0;          
          vRadius = this.armLength * 0.5 * speed * 1.5;

          var armMin = this.legLength + this.torsoLength - (this.armLength); 
          
          var leftHandY = Math.sin(theta + Math.PI) * hRadius;
          var rightHandY =  Math.sin(theta) * hRadius;
          var leftHandZ = 1.0;
          var rightHandZ = 1.0;
          
          
          if (leftHandY < 0) leftHandZ *= 0.5;
          if (leftHandY > 0) leftHandY *= 1.5;
          if (rightHandY < 0) rightHandZ *= 0.5;
          if (rightHandY > 0) rightHandY *= 1.5;
          
          this.placeBodyPoint('leftHand', [-this.shoulderWidth * handDistance, 
            leftHandY, 
            armMin + (1-Math.abs(Math.cos(theta + Math.PI))) * vRadius * leftHandZ],  
            [-1.0, turnOut, 0.0]);
          
          
          
          this.placeBodyPoint('rightHand', [this.shoulderWidth * handDistance,rightHandY, armMin + (1-Math.abs(Math.cos(theta))) * vRadius * rightHandZ], [-1.0, -turnOut, 0.0]);
        } 
      },
      
      pointPlaceHelper : function(pos, point, originPoint, middlePoint, length, direction) {
        var leftHip = this.bodyPoints[originPoint];
        var toFoot = Vec.sub(pos, leftHip);
        var footDistance = Vec.length(toFoot);
        if (Vec.length(toFoot) > length) {
          var fpos = Vec.add(Vec.setLength(toFoot, length), leftHip);
          this.bodyPoints[point] = fpos;
        } else {
          Vec.copyInto(this.bodyPoints[point], pos);
        }

        var footPos = this.bodyPoints[point];
        toFoot = Vec.sub(footPos, leftHip);
        footDistance = Vec.length(toFoot);
        var midPoint = Vec.add(leftHip, Vec.scale(toFoot, 0.5));
        var toKnee = Vec.setLength(Vec.perpendicular(toFoot, this.pointPlacePerp), direction * Math.sqrt(length * length / 4 - footDistance * footDistance / 4) || 0);
        this.bodyPoints[middlePoint] = Vec.add(midPoint, toKnee);
      },
      

      placeBodyPoint : function (point, pos, perpendicular, world) {
        this.flagUpdateBody = true;
        if (world) {
          var worldTarget = TW.state.get('planet').getWorldPosition(pos);
          pos = this.getLocalPosition(worldTarget);
        }
        if (pos[2] < 0)
          pos[2] = 0;
        
        this.pointPlacePerp = perpendicular || [-1, 0, 0];
        
        switch (point) {
          
        case "head":
          Vec.copyInto(this.bodyPoints.head, pos);
          this.bodyPoints.leftShoulder = Vec.add([-this.shoulderWidth, 0, -this.neckLength], this.bodyPoints.head);
          this.bodyPoints.rightShoulder = Vec.add([this.shoulderWidth, 0, -this.neckLength], this.bodyPoints.head);
          this.placeBodyPoint("rightHand", this.bodyPoints.rightHand);
          this.placeBodyPoint("leftHand", this.bodyPoints.leftHand);
        break;
        case "butt":
          Vec.copyInto(this.bodyPoints.butt, pos);
          //this.bodyPoints.head[2] = pos[2] + this.torsoLength + this.neckLength;
          this.bodyPoints.leftHip = Vec.add([-this.hipWidth, 0, 0], this.bodyPoints.butt);
          this.bodyPoints.rightHip = Vec.add([this.hipWidth, 0,0 ], this.bodyPoints.butt);
        break;
        
        case "leftFoot":
          this.pointPlaceHelper(pos, "leftFoot", "leftHip", "leftKnee", this.legLength, this.kneeDirection);
        break;
        
        case "rightFoot":
          this.pointPlaceHelper(pos, "rightFoot", "rightHip", "rightKnee", this.legLength, this.kneeDirection);
        break;
          
        case "rightHand":
          this.pointPlaceHelper(pos, "rightHand", "rightShoulder", "rightElbow", this.armLength, -1);
        break;
        
        case "leftHand":
          this.pointPlaceHelper(pos, "leftHand", "leftShoulder", "leftElbow", this.armLength, -1);
        break;
          
        default:
          Vec.copyInto(this.bodyPoints[point], pos);
        }
      },

    });

GFX.Scene3D = GAME.Views.View.extend({
    setup: function() {
        this._scene = new THREE.Scene();
        this._renderer = GFX.getRenderer();
        this._renderer.sortObjects = false;
        this.width = this.$el.width();
        this.height = this.$el.height();

        this._camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.001, 2000);
        this._camera.position.set(0, 0, 5);
        this._camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

        this._ambient = new THREE.AmbientLight(0xffffff);
        this._ambient.intensity = 1.0;

        this._scene.add(this._camera);
        //this._scene.add(this._headLight);

        this._cameraLight = new THREE.SpotLight(0x999999, 1, 0, Math.PI / 3.0, 50);
        this._cameraLight.position.set(0, 0, 0);
        this._cameraLight.target.position.set(0, 0, 0);

        //this._camera.add(this._cameraLight);

        this._scene.add(this._ambient);
        this.children = [];

        if (this.backgroundColor) 
          this.setBackgroundColor(this.backgroundColor);
        else 
          this._renderer.setClearColor(BACKGROUND_COLOR, 1);//0x7d4b81, 1);
        
        this._renderer.setSize(this.width, this.height);

        this._renderer.shadowMap.enabled = SHADOWS;

        this.$el.append(this._renderer.domElement);
        
        this._renderer.domElement.className = "viewport";

        //this._projector = new THREE.Projector();
        this._rayCaster = new THREE.Raycaster();
        this.zoom = 1.0;

        var f = 1/60;
        this.elapsedTimes = [f,f,f,f,f,f,f,f,f];

        if (FPS_METER) {
          this.showStats();
        }
    },
    
    setBackgroundColor: function(color) {
      var bgColor = new THREE.Color();
      if (_.isNumber(color)) {
        bgColor.setHex(color);
      } else {
        bgColor.setColor(color);
      }
      this._renderer.setClearColor(bgColor, 1);
      this.backgroundColor = bgColor.getHex();
    },

    pause: function() {
      this.paused = true;
      cancelAnimationFrame(this.frameRequest);
    },

    unpause: function() {
      if (this.paused || this.paused == undefined) {
        this.paused = false;
        this.startAnimating();
      }
    },

    setCamera: function(pos, lookat, up) {
      this._camera.position.fromArray(pos);
      this._camera.up.fromArray(up);
      tempVec3.fromArray(lookat);
      this._camera.lookAt(tempVec3);
    },

    setCanvasScale: function(scale) {
      ALIAS_SIZE = scale;
      this.canvasScale = scale;
      this.resize();
      this.renderScene();
    },
    
    hide: function() {
      if (this.canvasSwap) {
        $(this.$swapCanvas).hide();
      } else {
        $(this._renderer.domElement).hide();
      }
    },
    
    show: function() {
      if (this.canvasSwap) {
        $(this.$swapCanvas).show();
      } else {
        $(this._renderer.domElement).show();
      }
    },
    
    resize: function() {
      this.width = this.$el.width();
      this.height = this.$el.height();

      this._renderer.setSize(this.width * ALIAS_SIZE, this.height * ALIAS_SIZE);
      this._camera.aspect = this.width / this.height;
      $(this._renderer.domElement).css({width: '100%', height : '100%', position: 'fixed', top: 0});
      
      if (!this.canvasSwap && ALIAS_SIZE < 1.0) {
        $(this._renderer.domElement).hide();
        this.canvasSwap = 1;
        this.$swapCanvas = this.$swapCanvas || $("<canvas class='viewport'>");
        this.$el.append(this.$swapCanvas);
        this.$swapCanvas.attr('width', this.width);
        this.$swapCanvas.attr('height', this.height);
        this.$swapCanvas.css({
          position: "absolute",
          top: 0,
          left: 0,
        });
      } else if (this.canvasSwap) {
        if (ALIAS_SIZE >= 1.0) {
          this.$swapCanvas.remove();
          $(this._renderer.domElement).show();
          this.canvasSwap = 0;
        } else {
          this.$swapCanvas.attr('width', this.width);
          this.$swapCanvas.attr('height', this.height);
        }
      
      }
      
      this._camera.updateProjectionMatrix();
      this.renderScene();
    },

    togglePause: function() {
      if (this.paused) {
          this.unpause();
          return false;
      } else {
          this.pause();
          return true;
      }
    },

    startAnimating: function() {
      this.state = this.state || new GAME.State();
      this.lastTick = GAME.now();
      this.animate();
    },
    
    getCameraRay: function(mouseX, mouseY) {
      tempVec3.set(mouseX || 0, mouseY || 0, 1);

      tempVec3.unproject(this._camera);
      
      
      return {
        origin: GFX.V3toArray(this._camera.position),
        direction: GFX.V3toArray(tempVec3.sub(this._camera.position).normalize())
      }
    },
    
    updateMouseCaster: function(mouseX, mouseY) {
      tempVec3.set(mouseX || 0, mouseY || 0, 1);
      //this._projector.unprojectVector(tempVec3, this._camera);
      tempVec3.unproject(this._camera);
        
      this._rayCaster.set(this._camera.position,
        tempVec3.sub(this._camera.position).normalize());
    },
    
    mousePick: function(mouseX, mouseY, group) {
      this.updateMouseCaster(mouseX, mouseY);
      return this._rayCaster.intersectObject(group.glObject, true);
    },
    
    renderShadows: function(shadowCam, texture) {
      var thiz = this;
      this._shadowCam = this._shadowCam || function() {
        var cam = new THREE.OrthographicCamera();
        thiz._scene.add(cam);
        return cam;
      }()
      
      this._shadowCam.left = -shadowCam.width * 0.5;
      this._shadowCam.right = shadowCam.width * 0.5;
      this._shadowCam.top = shadowCam.width * 0.5;
      this._shadowCam.bottom = -shadowCam.width * 0.5;
      this._shadowCam.near = 0;
      this._shadowCam.far = shadowCam.distance;
      
      this._shadowCam.position.fromArray(shadowCam.pos);
      this._shadowCam.up.fromArray(shadowCam.up);
      tempVec3.fromArray(shadowCam.target);
      this._shadowCam.lookAt(tempVec3);
      this._shadowCam.updateProjectionMatrix();

      this._setShadowMode(true);
      
      var backupCC = this._renderer.getClearColor().clone();
      var backupA = this._renderer.getClearAlpha();
      
      this._renderer.setClearColor(0xffffff, 1);
      this._renderer.render(this._scene, this._shadowCam, texture);
      this._renderer.setClearColor(backupCC, backupA);
      this._setShadowMode(false);
    },
    
    _setShadowMode: function(enabled) {
      for (var i = 0, l = this.children.length; i < l; i++) {
        this.children[i]._setShadowMode(enabled);
      }
    },

    renderScene: function() {
      this._renderer.render(this._scene, this._camera);
      
      if (this.canvasSwap) {
        var ctx = this.$swapCanvas[0].getContext('2d');
        ctx.drawImage(this._renderer.domElement, 0, 0, this.width, this.height);
      }
    },
    
    preUpdate: function() {},
    postUpdate: function() {},
    
    animate: function() {
      if (this.paused) {
        return;
      }
      var now = GAME.now();
      var interval = (now - this.lastTick) * 0.001;
      
      interval = Math.clamp(interval, 1/140, 1/10);
      this.lastTick = now;

      this.elapsedTimes.shift();
      this.elapsedTimes.push(interval);

      var elapsedTime = Math.sum(this.elapsedTimes) / this.elapsedTimes.length;

      if (this.stats) {
        this.stats.begin();
      }
      
      this.state.dt = elapsedTime;      
       
      this.preUpdate(this.state);
      
     
      for (var i = 0, l = this.children.length; i < l; i++) {
          this.children[i]._update(this.state);
      }

      this.postUpdate(this.state);
      
      
      this.renderScene();

      if (!this.paused) {
        this.frameRequest = requestAnimationFrame(this.animate);
      }

      if (this.stats) {
          this.stats.end();
      }
    },

    add: function(object3D) {
      if (!object3D) return;
      this._scene.add(object3D.glObject);
      this.children.push(object3D);
    },

    removeObject3D: function(object3D) {
      this._scene.remove(object3D.glObject);

       //Wrong
      this.children = _.reject(this.children, function(child) {
          return child.glObject.id == object3D.glObject.id;
      });
    },

    showStats: function(){
      this.stats = new Stats();
      this.stats.setMode(0);

      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.right = '0px';
      this.stats.domElement.style.top = '0px';
      document.body.appendChild( this.stats.domElement );
    },

    setFOV: function(fov) {
      this._camera.fov = fov;
      this._camera.updateProjectionMatrix();
    },

    zoomBy: function(delta) {
      this.zoom = Math.clamp(this.zoom + (delta * 0.01), 0.7, 2.0);
      this._camera.position.z = 141.42 / this.zoom;
      this._headLight.position.z = 200 / this.zoom;
      var halfAngle = Math.asin(141.42 * Math.sin(Math.radians(25)) / this._camera.position.z);
      this._camera.fov = Math.degrees(2 * halfAngle);
      this._camera.updateProjectionMatrix();
    }
});

GFX.createCanvasLabel = function(text, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffcc";
    context.textAlign = 'center';
    context.shadowColor = "black";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 10;
    context.font = "bold 20px Trebuchet MS";
    context.fillText(text, width * 0.5, height * 0.5);
    return canvas.toDataURL("image/png");
}

}());



