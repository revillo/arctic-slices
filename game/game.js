var GAME = {};


(function(){
    'use strict'
    
    GAME.now = function() {
      if (window.performance && window.performance.now) {
        return _.bind(window.performance.now, window.performance);
      } else {
        return _.bind(Date.now, Date);
      }
    }();
    
    //GAME.DEVICE_PIXEL_SCALE = Math.ceil((window.devicePixelRatio || 1.0) / 2.0);
    GAME.SECONDS = 1000;
    GAME.MINUTES = 60 * GAME.SECONDS;
    GAME.HOURS = 60 * GAME.MINUTES;
    
    GAME.SYSTEM = {
      Android: function() {
        return navigator.userAgent.match(/Android/i);
      }(),
      
      Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
      }(),
      
      iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      }()
    }
    
    if (GAME.SYSTEM.Android || GAME.SYSTEM.iOS || GAME.SYSTEM.Windows) {
      GAME.SYSTEM.MOBILE = 1;
    }
    
    GAME.lastTick = GAME.now();
    
    GAME.tick = function(name) {
        if (name != undefined) {
            console.log(name, GAME.now() - GAME.lastTick)
        }
        GAME.lastTick = GAME.now();
    }

    GAME.log = function(arg) {
      if(GAME.logging){
        console.log(arguments);
      }
    }

    GAME.elog = function(arg) {
      if(window.console) {
        console.log("<! GAME ERROR !>",arg);
      }
    }

    GAME.templates = {};
    var $templates = $('.hbs-template');
    _.map($templates, function(t) { GAME.templates[$(t).attr("name")] = Handlebars.compile(t.text) } );

    
    GAME.AudioEffect = function(options, ctx) {
      this.audioCtx = ctx;
      this.gain = ctx.createGain();
      this.gain.gain.value = 0;
      this.targetVolume = options.volume || 0.1;
      
      this.osc = ctx.createOscillator();
      
      
      var whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = options.noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.start(ctx.currentTime);

      
      this.noise = whiteNoise;
      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.value = 0.01;
      
      whiteNoise.connect(this.noiseGain);

      this.osc.type = "square";
      this.osc.frequency.value = 350;
      this.osc.start(ctx.currentTime);

      this.osc.connect(this.gain);
      this.masterVolume = 1.0;
      
      this.gain.connect(ctx.destination);
      this.noiseGain.connect(ctx.destination);
      this.synthTime = 0;
    }
    
    GAME.AudioEffect.prototype.update = function(elapsedTime) {
      if (this.finished) return;
      this.synthTime += elapsedTime;
      
      this.osc.detune.value = -this.synthTime * 100.0;
      var oscillation = Math.sin(Math.pow(this.synthTime + 1.0, -0.5) * 80.0);
      
      this.gain.gain.value = oscillation * Math.max(this.targetVolume - (this.synthTime * 0.01), 0.0) * this.masterVolume;
      this.noiseGain.gain.value = Math.max(this.targetVolume - (this.synthTime * 0.03), 0.0) * this.masterVolume;

      this.synthTime += elapsedTime;
    }
    
    GAME.AudioEffect.prototype.stop = function() {
      this.finished = true;
      var ctx = this.audioCtx;
      this.gain.gain.setValueAtTime(this.gain.gain.value, ctx.currentTime);
      this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, ctx.currentTime);
      var fadeOut = 0.2;
      this.gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + fadeOut);
      this.noiseGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + fadeOut);
     
      this.osc.stop(ctx.currentTime + fadeOut);
      this.noise.stop(ctx.currentTime + fadeOut);
    }
    
    GAME.Synth = function(options, ctx) {
      this.audioCtx = ctx;
      this.gain = ctx.createGain();
      this.gain2 = ctx.createGain();
      
      this.gain.gain.value = 0;
      this.gain2.gain.value = 0;
      
      //this.panner = ctx.createGain();
      //this.panner.gain.value = 1.0;
     
      this.targetVolume = options.volume || 1.0;
      this.fadeInDur = 1;
      this.osc = ctx.createOscillator();
      this.osc2 = ctx.createOscillator();
      
      this.osc.connect(this.gain);
      this.osc2.connect(this.gain2);

      //Doesn't work on firefox or IE
      delete options.position;
      
      if (options.pan) {
        this.panner = this.audioCtx.createPanner();
        this.panner.panningModel = "equalpower";
        
        this.panner.setPosition(options.pan, 0, 1-Math.abs(options.pan));

        this.gain.connect(this.panner);
        this.gain2.connect(this.panner);
        this.panner.connect(ctx.destination);
      } else if (options.position) {
        var panner = this.audioCtx.createPanner(); 
        panner.panningMode = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 3;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        var p = options.position;
        panner.setOrientation(-p[0], -p[1], -p[2]);
        panner.setPosition(p[0], p[1], p[2]);
        this.panner = panner;
        this.gain.connect(this.panner);
        this.gain2.connect(this.panner);
        this.panner.connect(ctx.destination);
      } else {
        this.gain.connect(this.audioCtx.destination);
        this.gain2.connect(this.audioCtx.destination);
      }
      this.osc.type = options.synthType1 || 'triangle';
      this.osc2.type = options.synthType2 || 'sine';
      
      this.osc.frequency.value = options.frequency;
      this.osc2.frequency.value = options.frequency;

      var delay = (options.delay) || 0.0;      
      this.duration = options.duration || this.targetVolume / 0.09;
      this.start = ctx.currentTime + delay;
      var start = this.start;
  
      try {
        this.osc.start(start);
        this.osc2.start(start);
      } catch(error) {
      
      }
      
      this.humpTime = 0.05;
      
      if (options.prepare) {
        options.prepare(this, this.start);
      }
      
      this.detune = options.detune || 5;
      
      this.gain.gain.setValueAtTime(0.001, start);
      this.gain2.gain.setValueAtTime(0.001, start);
      this.gain.gain.linearRampToValueAtTime(this.targetVolume, start + this.humpTime);
      this.gain2.gain.linearRampToValueAtTime(this.targetVolume * (options.synth2Gain || 0.5), start + this.humpTime);
      this.gain.gain.linearRampToValueAtTime(0.001, start + this.duration);
      this.gain2.gain.linearRampToValueAtTime(0.001, start + this.duration);
      
              
      this.synthTime = -delay;

      this.stop = _.bind(this.stop, this);
      
      if (options.duration) {
        this.stopTimeout = _.delay(this.stop, options.duration * 1000);
      } else {
        this.stopTimeout = _.delay(this.stop, (3+delay) * 1000);
      }
    }
    
    GAME.Synth.prototype.update = function(elapsedTime) {
      if (this.finished) return;
      this.synthTime += elapsedTime;
      
      if (this.synthTime > this.duration) {
        this.stop();
        return;
      }
      
      if (this.synthTime < 0.0) return;
      if (this.osc) {
        var amount = Math.max(this.synthTime * 30.0, 5.0);
        
        this.osc.detune.value  = this.detune + Math.sin(this.synthTime * 40.0) * amount; 
        this.osc2.detune.value = -this.detune + Math.sin(this.synthTime * 40.0) * amount; 
      }
    };

    GAME.Synth.prototype.stop = function() {
      var ctx = this.audioCtx;
      this.finished = true;
      
      clearTimeout(this.stopTimeout);
      if (this.osc) {
        this.gain.disconnect();
        this.gain2.disconnect();
        this.osc.disconnect();
        this.osc2.disconnect();
        
        try {
          this.osc.stop(ctx.currentTime);
          this.osc2.stop(ctx.currentTime);
        } catch (err) {
        
        }
        this.osc = undefined;
        this.osc2 = undefined;
      }
    };
    
      
    GAME.AudioManager = Backbone.Model.extend({
      initialize: function() {
        this.stopSynth = _.bind(this.stopSynth, this);
        this.synths = [];
        this.effects = [];
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          this.disableSounds();
          return;
        }
        this.audioCtx = this.audioCtx || new AudioContext();
        this.setupWhiteNoise();
      },
      
      setupWhiteNoise: function() {
        var ctx = this.audioCtx;
        
        var bufferSize = 2 * ctx.sampleRate,
            noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
            output = noiseBuffer.getChannelData(0);
            
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        this.noiseBuffer = noiseBuffer;
      },
      
      sounds: {},
      
      hasSound: function(soundName) {
        return this.sounds[soundName];
      },
      
      loadSounds : function(sounds) {
        if (!this.audioCtx) return;
                
        for (var s in sounds) {
          var volume = sounds[s].volume || 80;
          request = new XMLHttpRequest();
          request.open('GET', sounds[s].src + ".mp3", true);
          request.responseType = 'arraybuffer';
          this.sounds[s] = {volume: volume, callback: sounds[s].callback};
          
          request.onload = function(soundName, req, thiz) {
            return function() {
              var audioData = req.response;
              thiz.audioCtx.decodeAudioData(audioData, function(buffer){
                thiz.sounds[soundName].buffer = buffer;
                if(thiz.sounds[soundName].callback) thiz.sounds[soundName].callback();
              },
              function(e){"Error with decoding audio data " + soundName});
            }
          }(s, request, this);
          request.send();
        }
      },
      
      orientListener: function(pos, target, up) {
        if(this.disabled) return;
                
        /* Disabled for now
        var listener = this.audioCtx.listener;
        var fwd = Vec.sub(target, pos);
        listener.setOrientation(fwd[0], fwd[1], fwd[2], up[0], up[1], up[2]);
        listener.setPosition(pos[0], pos[1], pos[2]);
        */
      },
      
      disableSounds: function() {
        this.disabled = true;
        this.stopSynth();
      },
      
      enableSounds: function() {
        this.disabled = false;
      },
      
      stopSynth: function() {
        for (var s = 0; s < this.synths.length; s++) {
          this.synths[s].stop();
        }
        
        for (var s = 0; s < this.effects.length; s++) {
          this.effects[s].stop();
        }
        
        this.synths = [];
        this.effects = [];
        this.stopUpdating();
      },
      
      stopUpdating: function() {
        window.clearInterval(this.updateInterval);
        this.updateInterval = undefined;
      },
      
      startUpdating: function() {
        if (!this.updateInterval) {
          var thiz = this;
          this.lastUpdate = GAME.now();
          this.updateInterval = window.setInterval(function() {
            var n = GAME.now();
            thiz.updateSynth((n - thiz.lastUpdate) * 0.001);
            thiz.lastUpdate = n;
          }, 5);
        }
      },
      
      midiFreq: function(number) {
        var a = 440;
        return (a / 32) * Math.pow(2, ((number - 9) / 12));
      },
      
      updateSynth: function(elapsedTime) {
        var flag = false;
        if (!this.isPlayingSequence && this.effects.length == 0 && this.synths.length == 0) {
          this.stopUpdating();
        }
        
        if (this.isPlayingSequence) {
          var seqTime = (GAME.now() - this.sequenceStart) * 0.001;
          this.sequenceTime += elapsedTime;
          
          var tc = 0.075 / 12;

          if (this.sequenceIndex < this.activeSequence.notes.length) {
            var note = this.activeSequence.notes[this.sequenceIndex];            
            while (note.st * tc < seqTime + elapsedTime) {
              if(note.et * tc > seqTime + elapsedTime) { 
                var delay = note.st * tc - seqTime;              
                this.playSynth({
                  delay: delay,
                  frequency: this.midiFreq(note.n + 12),
                  duration: (note.et - note.st) * tc,
                  volume: this.sequenceVolume * this.sequenceMasterVolume
                });
              }
              
              this.sequenceIndex += 1;
              
              if (this.sequenceIndex >= this.activeSequence.notes.length) {
                break;
              }
              note = this.activeSequence.notes[this.sequenceIndex];
            }
          }
          
                    
          if (seqTime + elapsedTime > this.activeSequence.info.duration) {
            this.sequenceTime = this.sequenceTime - this.activeSequence.info.duration;
            this.sequenceStart = GAME.now() + (this.activeSequence.info.duration - seqTime) * 1000;
            
            this.sequenceIndex = 0;
          }
        }
        
        for (var s = 0; s < this.synths.length; s++) {
          this.synths[s].update(elapsedTime);
          if (this.synths[s].finished) {
            flag = true;
            this.synths[s] = undefined;
          }
        }
        
        if (flag) {
          this.synths = _.compact(this.synths);
        }
        
        var flag2;
        for (var s = 0; s < this.effects.length; s++) {
          this.effects[s].update(elapsedTime);
          if (this.effects[s].finished) {
            flag2 = true;
            this.effects[s] = undefined;
          }
        }
        
        if (flag2) {
          this.effects = _.compact(this.effects);
        }
      },
      
      playEffect: function(options) {
        if (this.disabled) return;
        this.startUpdating();
        options.noiseBuffer = this.noiseBuffer;
        var effect = new GAME.AudioEffect(options, this.audioCtx);
        this.effects.push(effect);
        return effect;
      },
      
      playSynth: function(options) {
        if (this.disabled) return;
        options.synthType1 = options.synthType1 || this.synthType1 || "triangle";
        options.synthType2 = options.synthType2 || this.synthType2 || "sine";
        options.detune = options.detune || this.detune || 5;
        options.synth2Gain = options.synth2Gain || this.synth2Gain || 0.5;
        var synth = new GAME.Synth(options, this.audioCtx);
        this.synths.push(synth);
        this.startUpdating();  
      },

      stopSequence: function() {
        this.isPlayingSequence = 0;
      },
       
      setSequenceVolume: function(volume) {
        this.sequenceMasterVolume = volume;
      },
      
      playSequence: function(sequence, options) {
        if (GAME.SYSTEM.MOBILE) {
          return;
        }
        
        this.sequenceMasterVolume = this.sequenceMasterVolume || 1.0;
        this.startUpdating();
        this.sequenceTime = 0;
        this.sequenceStart = GAME.now();
        
        if (options.delay) {
          this.sequenceTime = -options.delay;
          this.sequenceStart += options.delay * 1000.0;
        }
        
        this.activeSequence = sequence;
        this.sequenceIndex = 0;
        this.isPlayingSequence = 1;
        this.sequenceVolume = options.volume;
      },
      
      playSound: function(sound, options) {
        if (this.disabled) return;

        options = options || {}
        if (!this.sounds[sound] || !this.sounds[sound].buffer) {
          return;
        }
        
        var result = {};
        
        var source = this.audioCtx.createBufferSource();
        source.buffer = this.sounds[sound].buffer;
        //source.connect(this.audioCtx.destination);
        var gain = this.audioCtx.createGain();
        gain.gain.value = (options.volume || this.sounds[sound].volume);
        //gain.gain.value = 0.1;
        source.loop = options.loop || false;
        
        if(options.loop) {
          source.loop = true;
          this.sounds[sound].source = source;
        }
        
        source.playbackRate.value = options.speed || 1;
        
        if (options.position) {
          
          var panner = this.audioCtx.createPanner(); 
          panner.panningMode = 'HRTF';
          panner.distanceModel = 'inverse';
          panner.refDistance = 0.01;
          panner.maxDistance = 0.5;
          panner.rolloffFactor = 1;
          panner.coneInnerAngle = 360;
          panner.coneOuterAngle = 0;
          panner.coneOuterGain = 0;
          panner.setOrientation(1, 0, 0);
          var p = options.position;
          panner.setPosition(p[0], p[1], p[2]);
          gain.gain.value = gain.gain.value * 10;
          
          source.connect(panner);
          panner.connect(gain);
          result.panner = panner;
        } else {
          source.connect(gain);
        }
        
        gain.connect(this.audioCtx.destination);
        source.start(this.audioCtx.currentTime + (options.delay||0));        
        
        result.source = source;
        result.gain = gain;
        
        return result;
      },
      
      stopSound: function(sound) {
        if (this.sounds[sound] && this.sounds[sound].source) {
          this.sounds[sound].source.stop();
        }
      },
      
    });
    
       
    GAME.Models = {};
    
    GAME.Model = GAME.Models.Model = Backbone.Model.extend({
        initialize: function(options) {
          _.extend(this, options);
            if (_.isFunction(this.setup)) {
                this.setup();
            }
        },
        
        getAPI: function(url, data, callback, error) {
          this.ajax(url, data, 'GET', callback, error)
        },
        
        postAPI: function(url, data, callback, error) {
          this.ajax(url, data, 'POST', callback, error);
        },
        
        ajax: function(url, data, type, callback, error) {
          if (this.clientVersion) {
            data = data || {};
            data.client_version = this.clientVersion;
          }
                    
          $.ajax({
            url: url,
            data: data,
            type: type || "GET",
            success: callback,
            error: error || this.printError,
            dataType: 'json'
          });
        },
        
        printError: function(err, err1, err2) {
          this.trigger("api-error");
          this._htmlError = [err, err1, err2];
          console.log(err, err1, err2);
        },
        
        addPair: function(attr, key, val) {
          var obj = this.attributes[attr] || {};
          obj[key] = val;
          this.trigger('change:'+attr);
          this.trigger('all');
        },

        set: function(attr, val) {
          if (_.isObject(attr)){
             for (var at in attr) {
              this.set(at, attr[at]);
             }
             return;
          };

          if (_.isEqual2(this.attributes[attr], val)) {return;}
          this.attributes[attr] = val;

          this.trigger('change:'+attr);
          this.trigger('all');
        },

        get: function(attr) {
          return this.attributes[attr];
        },

        increase: function(attr, amount) {
          this.set(attr, this.get(attr) + amount);
        },
        
        onChange: function(attr, callback) {
          var thiz = this;
          this.on("change:"+attr, function(){
            callback(thiz.get(attr));
          });
        }
    });

GAME.State = GAME.Models.Model.extend({
  setup: function() {
    this.focusList = this.focusList || [];
    this.startTime = GAME.now();
  },
  
  pushFocus: function(fcs) {
    this.focusList.push(fcs);
    this.set('focus', fcs);
  },
  
  popFocus: function() {
    if (this.focusList.length == 0) {
      return;
    }
    this.focusList.pop();
    this.set('focus', _.last(this.focusList));
  },
  
  setFocus: function(fcs) {
    this.focusList = [fcs];
    this.set('focus', fcs);
  }
});
    
GAME.User = GAME.Models.Model.extend({
  
  setup: function() {
    _.bindAll(this, 'updateFacebookStatus');
  },
  
  network : 0,
  
  connectGoogle: function(appID, callback) {
    var thiz = this;
    
    window.gapi_onload = function() {
      gapi.client.setApiKey(appID);
      callback();
    }
    
    $.getScript("https://apis.google.com/js/client:platform.js", function() {
    });
  },
  
  socketSend: function(data) {
    if(this.websocket) {
      this.websocket.send(JSON.stringify(data));
    }
  },
  
  connectWebSocket: function(options) {
    var websocket = new WebSocket(options.url);
    var thiz = this;
    websocket.onopen = function() {
      thiz.websocket = websocket;
      options.readyHandler(websocket);
      
      thiz.websocket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        options.messageHandler(data);
      }
    }
  },
  
  connectFacebook: function(appID, callback) {
    var thiz = this;
    
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      if (typeof(FB) == "undefined") {
        callback('error');
        return;
      }
      FB.init({
        appId: appID,
        cookie: true,
        xfbml: true,
        version: 'v2.4'
      });     
      callback();
      //thiz.getFacebookStatus(callback);      
    });
  },
  
  loginToFacebook: function() {
    FB.login(this.updateFacebookStatus);
  },
  
  loginToGoogle: function(googleClientID) {
    scopes = [];
    gapi.auth.authorize({client_id: googleClientID, scope: 'https://www.googleapis.com/auth/plus.me', immediate: false}, _.bind(this.updateGoogleStatus, this));
    return false;
  },
  
  getFacebookStatus: function(callback) {
    var thiz = this;
    if (FB) {
      FB.getLoginStatus(function(response) {
        thiz.updateFacebookStatus(response);
        if(callback) callback();
      });
    }
  },
  
  getCredentials: function() {
    if (this.network) {
      return {
        network: this.network,
        network_data: this.networkData
      }
    } else {
      return null;
    }
  },
  
  updateGoogleStatus: function(response) {    
    if (response.access_token) {
      this.network = 'google';
      this.networkData = {accessToken: response.access_token};
    }
    
    this.trigger('status-change');
  },
  
  updateFacebookStatus: function(response) { 
    if (response.status == "connected") {
      this.network = 'facebook';
      this.networkData = response.authResponse;
      //this.facebookTokenExpire = GAME.now() + (response.authResponse.expiresIn * 1000);
    } else {
      if (this.network == 'facebook') {
        this.signedIn = false;
        delete this.networkData;
      }
    }     
    this.trigger('status-change');
  },
  
  
});


    GAME.KEY_CODES = {
        8  : 'backspace',
        9  : 'tab',
        16 : 'shift',
        17 : 'ctrl',
        
        32 : 'space',
        37 : 'left',
        38 : 'up',
        39 : 'right',
        40 : 'down',
        
        65 : 'a',
        66 : 'b',
        67 : 'c',
        68 : 'd',
        69 : 'e',
        70 : 'f',
        73 : 'i',
        74 : 'j',
        77 : 'm',
        80 : 'p',
        81 : 'q',
        82 : 'r',
        83 : 's',
        84 : 't',
        86 : 'v',
        87 : 'w',
        88 : 'x',
        89 : 'y',
        90 : 'z'
    }

    GAME.KeyPressed = {};

    $(document).keydown(function(e) {
        if(GAME.KEY_CODES[e.which]) {
          GAME.KeyPressed[GAME.KEY_CODES[e.which]] = true;
        }
    });

    $(document).keyup(function(e) {
        if(GAME.KEY_CODES[e.which]) {
            GAME.KeyPressed[GAME.KEY_CODES[e.which]] = false;
        }
    });

    GAME.Views = {};
    GAME.Views.View = Backbone.View.extend({
        initialize: function(options) {
            _.extend(this, options);
            _.bindFunctions(this);
            if (this.template !== undefined) {
                this.renderTemplate = GAME.templates[this.template];
            }

            if (_.isFunction(this.setup)) {
                this.setup();
            }

            if (_.isFunction(this.resize)) {
                $(window).resize(this.resize);
                this.resize();
            }
            
            var thiz = this;
        },
        
        _handlePopHistory: function(event) {
          this.handlePopHistory(event.originalEvent);
        },
        
        handlePopHistory: function() {
          
        },
        
        historyBack: function() {
          var history = history || window.history;
          if (history && history.back)
            history.back();
        },
        
        pushHistory: function(state, title, url) {
          var thiz = this;
          var history = history || window.history;
          if (history && history.pushState) {
            history.pushState(state, title, url);
            
            window.onpopstate = function(e) {
              thiz._handlePopHistory(e);
            }
          }
        },
        
        getAPI: GAME.Models.Model.prototype.getAPI,
        ajax: GAME.Models.Model.prototype.ajax,
        postAPI: GAME.Models.Model.prototype.postAPI,
        printError: GAME.Models.Model.prototype.printError,

        renderFromTemplate: function(data) {
            data = data || {};
            this.$el.html(this.renderTemplate(data));
        }
    });

    GAME.Views.UI = GAME.Views.View.extend({

        events: {
            "mousemove"  : "_handleMouseMove",
            "mouseleave" : "_handleMouseLeave",
            "mousedown"  : "_handleMouseDown",
            "mouseup"    : "_handleMouseUp",
            "mousewheel" : "_handleMouseWheel",
            "click"      : "_handleClick",
            "keydown"    : "_handleKeypress",
            "keyup"      : "_handleKeyup"
        },

        initialize: function(options) {
            this.mouseIsOver = false;
            this.mouseOffset = [0,0];
            GAME.Views.View.prototype.initialize.call(this, options);
             $(document).keydown(this._handleKeypress);
             $(document).keyup(this._handleKeyup);
            // this.$el.keydown(this._handleKeypress);
            
            this.$el.on('touchstart', this.handleTouchStart);
            this.$el.on('touchmove', this.handleTouchMove);
            this.$el.on('touchend', this.handleTouchStop);
        },
        
        exitFullScreen: function() {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        },
        
        goFullScreen: function() {
            function requestFullScreen(element) {

            /*
            FSerrorhandler = function(error) {
                //console.log(error.toString());
                //alert(document.msFullscreenEnabled)
            }

            document.addEventListener("fullscreenerror", FSerrorhandler);
            document.addEventListener("webkitfullscreenerror", FSerrorhandler);
            document.addEventListener("mozfullscreenerror", FSerrorhandler);
            document.addEventListener("MSFullscreenError", FSerrorhandler);
            */
                if (element.webkitRequestFullScreen) {
                    element.webkitRequestFullScreen(element.ALLOW_KEYBOARD_INPUT);
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                } else {
                    var requestMethod = element.requestFullscreen || element.requestFullscreen || element.mozRequestFullScreen;

                    if (requestMethod) {
                        requestMethod.call(element);
                    }
                }
            }

            var elem = this.$el[0];
            requestFullScreen($('body')[0]);
        },

        allowPointerLocking: function() {
            document.addEventListener('pointerlockchange', this.pointerLocked, false);
            document.addEventListener('mozpointerlockchange', this.pointerLocked, false);
            document.addEventListener('webkitpointerlockchange', this.pointerLocked, false);
            this.pointerLock = false;
        },

        unlockPointer: function() {
            if (!this.pointerLock) return;

            document.exitPointerLock = document.exitPointerLock ||
           document.mozExitPointerLock ||
           document.webkitExitPointerLock;
            document.exitPointerLock();
            //console.log("unlocking ptr");
        },

        lockPointer: function() {
            if (this.pointerLock) return;
            var element = this.$el[0];
            element.requestPointerLock = element.requestPointerLock ||
            element.mozRequestPointerLock ||
            element.webkitRequestPointerLock;
            element.requestPointerLock();
            //console.log("locking ptr");
        },
        
        handlePointerLockEvent: function() {
        
        },

        pointerLocked: function() {
            var requestedElement = this.$el[0];
            if (document.pointerLockElement === requestedElement ||
              document.mozPointerLockElement === requestedElement ||
              document.webkitPointerLockElement === requestedElement) {
              // Pointer was just locked
              // Enable the mousemove listener
              this.pointerLock = true;
             // this.mouseOffset = [this.$el.width() * 0.5, this.$el.height() * 0.5];
              //document.addEventListener("mousemove", this.moveCallback, false);
            } else {
              // Pointer was just unlocked
              // Disable the mousemove listener
              //document.removeEventListener("mousemove", this.moveCallback, false);
              //this.unlockHook(this.element);
              this.pointerLock = false;
            }
            this.handlePointerLockEvent();

        },

        _handleClick: function(e) {
          this.handleClick(e);
        },

        _handleMouseMove: function(e) {
            //console.log('fired');
            this.mouseIsOver = true;

            var event = e.originalEvent;

            if (this.pointerLock) {
              this.mouseDx = (event.movementX || event.mozMovementX || event.webkitMovementX || 0) / this.$el.width();
              this.mouseDy = (event.movementY || event.mozMovementY || event.webkitMovementY || 0) / this.$el.height();
              
              this.handleMouseDelta(this.mouseDx, this.mouseDy);

              //this.mouseOffset[0] += this.mouseDx;
              //this.mouseOffset[1] += this.mouseDy;
              //this.mouseOffset[1] = Math.clamp(this.mouseOffset[1], 0, this.$el.height());
            } else {
                this.mouseOffset = [
                  e.pageX - this.$el.offset().left,
                  e.pageY - this.$el.offset().top
                ];

                if (this.mouseOffset[0] > this.$el.width() ||
                    this.mouseOffset[0] < 0 ||
                    this.mouseOffset[1] > this.$el.height() ||
                    this.mouseOffset[1] < 0) {

                    this.mouseIsOver = false;
                }
            }

            this.mouseX = this.mouseOffset[0] / this.$el.width() - 0.5;
            this.mouseY = this.mouseOffset[1] / this.$el.height() - 0.5;

            this.mouseX *= 2;
            this.mouseY *= -2;
            this.handleMouseMove();
        },

        handleClick : function() {

        },

        handleMouseMove: function() {
          this.trigger('mouse_moved');
        },

        _handleMouseLeave: function(e) {
            this.mouseIsOver = false;
            this.handleMouseLeave();
        },

        handleMouseLeave: function() {
          this.trigger('mouse_out');
        },
        
        handleMouseDown: function() {
          return true;
        },

        _handleMouseDown: function(e) {
           switch(e.which) {
            case 1:
              return this.handleMouseDown(1);
              break;
            case 3:
              return this.handleMouseDown(2);
              break;
           }
        },

        _handleMouseUp: function(e) {
            this.handleMouseUp();
        },

        handleMouseUp: function() {

        },

        _handleMouseWheel: function(e, d, dx, dy) {
            this.handleMouseWheel(dx, dy);
        },

        handleMouseWheel: function(dx, dy) {

        },

        handleKeypress: function(key) {
          return true;
        },

        _handleKeypress : function(e) {
          return this.handleKeypress(GAME.KEY_CODES[e.which]);
        },

        _handleKeyup : function(e) {
          return this.handleKeyup(GAME.KEY_CODES[e.which]);
        },

        handleKeyup : function(key) {
          return true;
        },

        handleRightClick: function() {

        }

    });

    GAME.Format = {
      timeFromMS: function(time, fixed) {
        time = time / 1000;
        var ms = Math.floor(time / 60);
        var s = Math.floor(time % 60);
        ss = s.toFixed(fixed != undefined ? fixed : 2);
        
        if (s < 9.5) {
          ss = "0" + ss;
        }
        return ms + ":" + ss; 
      }
    }
    
    GAME.HTMLAnim = {};

    GAME.HTMLAnim.fadeOut = function($el, duration, stop) {
        if(stop) {
          $el.stop();
        }
        
        $el.animate({
           opacity: 0
        }, duration, 'easeInOutCubic', function() {
          $(this).hide();
        });
    }

    GAME.HTMLAnim.fadeIn = function($el, duration, stop) {
        if (stop) {
         $el.stop();
        }
        $el.show();
        $el.css({
          opacity: 0.0
        })
 
        $el.animate({
          opacity: 1
        }, duration, 'easeInOutCubic');
    }
    
    GAME.HTMLAnim.NumberScroller = Backbone.View.extend({
      initialize: function(options) {
        _.bindFunctions(this);
        _.extend(this, options);
        this.places = this.places || 0;
        this.prefix = this.prefix || "";
      },
      
      animateNumber: function(start, end, duration) {
        this.startValue = start;
        this.endValue = end;
        this.startTime = GAME.now();
        this.duration = duration || 1000;
        this.animation = setInterval(this.animateStep, 50);
      },
      
      animateStep: function() {
        var t = (GAME.now() - this.startTime) / this.duration;
        if (t > 1.0) {
          clearInterval(this.animation);
          t = 1.0;
        }
        var number = Math.lerp(this.startValue, this.endValue, t);
        
        if (this.places == 0)
          this.$el.html(this.prefix + Math.floor(number));
        else 
          this.$el.html(this.prefix + number.toFixed(this.places));
      }
        
      
    });
    
    // el, text, duration (millis), mode ("untype", "type")
    GAME.HTMLAnim.TypeAnimator = Backbone.View.extend({
        initialize: function(options) {
          _.bindFunctions(this);
          _.extend(this, options);
        },
        
        prepareText: function(text) {
          var result = [];
          var remaining = text;
          var pos = remaining.indexOf("<span");
          while (pos > -1) {
            result.push({begin: "", text: remaining.substr(0, pos), end: ""});
            remaining = remaining.slice(pos);
            var beginEndPos = remaining.indexOf(">")+1;
            var begin = remaining.substr(0, beginEndPos);
            remaining = remaining.slice(beginEndPos);
            
            var endBeginPos = remaining.indexOf("</span>");
            var link = remaining.substr(0, endBeginPos);
            
            remaining = remaining.slice(endBeginPos + 7);
            
            result.push({begin: begin, text: link, 
              end: "</span>"});
            
            pos = remaining.indexOf("<span");
          }
          
          if (remaining.length > 0) {
            result.push({begin: "", text: remaining, end: ""}); 
          }
          
          return result;
        },

        
        animateText: function(text, mode, duration) {
          this.$el.html('');
          window.clearTimeout(this.clearTextTimeout);
          window.clearInterval(this.interval);
          this.text = text;
          this.texts = this.prepareText(text);
          this.textLength = 0;
          for (var t = 0; t < this.texts.length; t++) {
            this.textLength += this.texts[t].text.length;
          }
          this.mode = mode || "type";
          this.duration = duration || this.textLength * 50;
          this.startTime = GAME.now();
          this.percentageComplete = 0;
          this.interval = setInterval(this.step, 50);
        },

        getTimeRemaining: function() {
          return (1.0 - this.percentageComplete) * this.duration;
        },

        finish: function(doCallback) {
          clearInterval(this.interval);
          if (doCallback && _.isFunction(this.callback)) {
              this.callback();
          }
        },

        clearText: function() {
            this.$el.html('');
            console.log('clearin');
        },

        step: function() {
            this.percentageComplete = (GAME.now() - this.startTime) / this.duration;
            this.percentageComplete = Math.min(this.percentageComplete, 1.0);
            switch (this.mode) {
                case "untype":
                    var newLength = Math.floor((1.0 - this.percentageComplete) * this.text.length);
                    var newText = this.text.substr(0, newLength);
                    this.$el.html(newText);
                break;
                case "type":
                    var newLength = Math.floor(this.percentageComplete * this.textLength);
                    var newText = "";
                    for (var t = 0; t < this.texts.length; t++) {
                      var section = this.texts[t];
                      var len = section.text.length;
                      newText = [newText, section.begin, section.text.substr(0, newLength), section.end].join('');
                      newLength -= len;
                      if(newLength <= 0) {
                        break;
                      }
                    }
                    this.$el.html(newText);
                break;
            }

            if (this.percentageComplete >= 1.0) {
              this.finish();
              return;
            }
        }
    });

    // Experimental/buggy
    GAME.Views.Draggable = GAME.Views.UI.extend({

      initialize: function(options) {
        GAME.Views.UI.prototype.initialize.call(this, options);
        this.active = this.active || true;
        if (this.domain == undefined) {
          GAME.elog("Draggable lacks domain");
        }
      },

      handleMouseDown: function() {
        if(this.active) {
          this.handleSelected(true);
        }
      },

      handleMouseUp: function() {
        if(this.selected) {
          this.unfollowMouse();
        }
      },

      handleSelected: function(selected) {
        this.selected = selected;
        if(selected) {
          this.domain.on('mouse_moved', this.followMouse, this);
          this.domain.on('mouse_up', this.unfollowMouse, this);
          this.domain.on('mouse_out', this.unfollowMouse, this);
        } else {
          this.domain.off('mouse_moved', this.followMouse, this);
          this.domain.off('mouse_up', this.unfollowMouse, this);
          this.domain.off('mouse_out', this.unfollowMouse, this);
        }
      },

      unfollowMouse: function() {
        this.handleSelected(false);
      },

      followMouse: function() {
        this.centerAt(this.domain.mouseOffset);
      },

      centerAt: function(pt) {
        this.$el.css({
          top: Math.clamp(pt[1] - this.$el.height() * 0.5, 0, this.domain.$el.height() - this.$el.height()),
          left: Math.clamp(pt[0] - this.$el.width() * 0.5, 0, this.domain.$el.width() - this.$el.width())
        });

      },

    });

}());
