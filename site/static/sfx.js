function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}


var Sfx = {};

Sfx.ready = false;

Sfx.audioInit = function()
{
    try {
        Sfx.ac = new webkitAudioContext();
    }
    catch(e) {
        console.log("Sorry, no Web Audio API in this browser.");
    }

    urls = [
        "Blip_Select19.wav",
        "Explosion14.wav",
        "Explosion38.wav",
        "Hit_Hurt10.wav",
        "Hit_Hurt16.wav",
        "Hit_Hurt6.wav",
        "Laser_Shoot4.wav",
        "Hit_Hurt20.wav",
        ];
    function finishedLoading(res)
    {
        // bleh
        Sfx.SELECT = res[0];
        Sfx.EXPLODE = res[1];
        Sfx.EXPLODE_DIE = res[2];
        Sfx.HIT1 = res[3];
        Sfx.HIT2 = res[4];
        Sfx.HIT3 = res[5];
        Sfx.SHOOT = res[6];
        Sfx.HIT4 = res[7];
        Sfx.ready = true;
    }
    var bufferLoader = new BufferLoader(Sfx.ac, urls, finishedLoading);
    bufferLoader.load();
};

Sfx.play = function(buffer) {
    if (!Sfx.ready) return;
    if (mode == 'TITLE') return;
    var source = Sfx.ac.createBufferSource();
    source.buffer = buffer;
    source.connect(Sfx.ac.destination);
    source.noteOn(0);
};

window.addEventListener('load', Sfx.audioInit, false);
