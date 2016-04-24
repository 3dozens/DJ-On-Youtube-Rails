//TODO: 音声処理とcanvasへの描画処理が混在しているので、分離する
var paddingTop    = 10;
var paddingBottom = 10;
var paddingLeft   = 20;
var paddingRight  = 20;

var canvasWidth;
var canvasheight;

var innerWidth;
var innerHeight;
var innerBottom;

$(function() {
    canvasWidth = $("canvas")[0].width; //TODO: document.querySelectorに書き換える
    canvasheight = $("canvas")[0].height;

    innerWidth = canvasWidth - paddingLeft - paddingRight;
    innerHeight = canvasheight - paddingTop - paddingBottom;
    innerBottom = canvasheight - paddingBottom;
});

/**
 * Web Audio APIが使えるか確認しつつ、contextをつくる
 * @returns AudioContext
 */
function createContext() {
    try {
        var SupportedAudioContext = window.AudioContext || window.webkitAudioContext;
    } catch (e) {
        throw new Error('Web Audio API is not supported.');
    }

    return new SupportedAudioContext();
}

/**
 * YoutubeのビデオIDの配列を受け取ってSoundJSに登録し、波形を描画します
 * @param videoIds
 * @param $dfd
 * @returns {*}
 */
function loadSounds(videoIds, $dfd) { //TODO: Promiseに書き換える
    var baseURL = "http://192.168.33.10:3000/music-request?"; // ajaxリクエストのベースURL

    // ajaxリクエストのためのURLを組み立てる
    var requestURL = baseURL;
    $.each(videoIds, function(i, id) {
        requestURL += "video_ids[]=" + id;
        if (id !== $(videoIds).last()[0]) requestURL += "&"; // 最後のパラメータじゃなかったら&を追記
    });

    $.ajax({
        url: requestURL
    }).then(registerSounds.bind(this, videoIds, $dfd));

    return $dfd.promise();
}

/**
 * videoIdから音源をSoundJSに登録する
 * 全音源を登録し終わると渡された$.Deferredをresolveします
 * @param videoIds サーバー上でダウンロード済みの音源のYoutube Video ID
 * @param dfd $.Deferredオブジェクト
 * @returns {*} $.Deferred.promise()
 */
function registerSounds(videoIds, dfd) {

    var basePath = "/downloaded_files/"; // サーバー上の音源フォルダまでのパス

    // PreloadJSの用意
    var queue = new createjs.LoadQueue(true, basePath);
    queue.installPlugin(createjs.Sound);
    createjs.Sound.alternateExtensions = ["mp3"];

    // manifestを作成する
    // idはYoutubeのVideoIdとする
    var manifest = [];
    $.each(videoIds, function(i, videoId) {
        var manifestElem = {src: videoId + ".mp3", id: videoId};
        manifest.push(manifestElem);
    });

    queue.loadManifest(manifest);

    // ロードが完了したら、サーバー上の音源を削除
    queue.addEventListener("complete", deleteSounds.bind(this, videoIds, dfd));

    return dfd.promise();
}

/**
 * サーバー上に残ったファイルを削除する
 * @param videoIds 削除するビデオIDの配列
 * @param dfd $.Deferredオブジェクト
 */
function deleteSounds(videoIds, dfd) {
    var requestURL = "http://192.168.33.10:3000/delete-music?";

    // ajaxリクエストのURLを組み立てる
    $.each(videoIds, function(i, videoId) {
        requestURL += "video_ids[]=" + videoId;
        if (videoId !== $(videoIds).last()[0]) requestURL += "&"; // 最後のパラメータじゃなかったら&を追記
    });

    $.ajax({
        url: requestURL,
        success: function () {
            dfd.resolve();
        }
    });
}

/**
 * soundInstanceからvideoIdを取得します deprecated
 * @param soundInstance
 * @returns videoId
 */
function getVideoId(soundInstance) {
    return soundInstance.src.match(/\/downloaded_files\/(.*)\.mp3/)[1];
}

/**
 * Youtubeの動画URLからビデオIDを取り出します
 * @param url Youtubeの動画URL
 * @returns {string} ビデオID
 */
function getVideoIdFromURL(url) {
    return decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]);
}

function drawWaveformToCanvas(soundInstance, canvas) {
    var audioBuffer = soundInstance.playbackResource;
    var channelLAudioData = new Float32Array(audioBuffer.length);
    channelLAudioData.set(audioBuffer.getChannelData(0));

    drawWaveform(canvas, channelLAudioData, audioBuffer.sampleRate);
}

/**
 * 波形を描画します
 * @param canvas canvas要素
 * @param data 音声データ
 * @param sampleRate audiobufferのサンプルレート
 */
function drawWaveform(canvas, data, sampleRate) {
    var canvasContext = canvas.getContext('2d');

    var middle = (innerHeight / 2) + paddingTop;

    // Sampling period
    var period = 1 / sampleRate;

    // Number of samples during 50 msec
    var n50msec = Math.floor(50 * Math.pow(10, -3) * sampleRate);

    // Number of samples during 60 sec
    var n60sec = Math.floor(60 * sampleRate);

    // Clear previous data
    canvasContext.clearRect(0, 0, canvasWidth, canvasheight);

    // Draw audio wave
    canvasContext.beginPath();

    for (var i = 0, len = data.length; i < len; i++) {
        // 50 msec ?
        if ((i % n50msec) === 0) {
            var x = Math.floor((i / len) * innerWidth) + paddingLeft;
            var y = Math.floor(((1 - data[i]) / 2) * innerHeight) + paddingTop;

            if (i === 0) {
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }
        }

        // 60 sec ?
        if ((i % n60sec) === 0) {
            var sec = i * period;  // index -> time
            var text = Math.floor(sec) + ' sec';

            // Draw grid (X)
            canvasContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
            canvasContext.fillRect(x, paddingTop, 1, innerHeight);

            // Draw text (X)
            canvasContext.fillStyle = 'rgba(255, 255, 255, 1.0)';
            canvasContext.font      = '16px "Times New Roman"';
            canvasContext.fillText(text, (x - (canvasContext.measureText(text).width / 2)), (canvasheight - 3));
        }
    }

    canvasContext.strokeStyle = 'rgba(0, 0, 255, 1.0)';
    canvasContext.lineWidth   = 0.5;
    canvasContext.lineCap     = 'round';
    canvasContext.lineJoin    = 'miter';
    canvasContext.stroke();

    // Draw grid (Y)
    canvasContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
    canvasContext.fillRect(paddingLeft, middle, innerWidth, 1);
    canvasContext.fillRect(paddingLeft, paddingTop, innerWidth, 1);
    canvasContext.fillRect(paddingLeft, innerBottom, innerWidth, 1);

}

//-----bpm detection-----//

function getLowpassFilteredBuffer(buffer) {
    return new Promise(function(resolve) {

        var offlineContext = new (window.OfflineAudioContext
            || window.webkitOfflineAudioContext)(1, buffer.length, buffer.sampleRate);

        var source = offlineContext.createBufferSource();
        source.buffer = buffer;

        var filter = offlineContext.createBiquadFilter();
        filter.type = "lowpass";

        source.connect(filter);
        filter.connect(offlineContext.destination);

        source.start(0);

        offlineContext.startRendering();

        offlineContext.oncomplete = function(e) {
            resolve(e.renderedBuffer);
        };
    });
}

function getPeaksAtThreshold(buffer, threshold) {
    var peaksArray = [];
    var length = buffer.length;
    for(var i = 0; i < length;) {
        if (buffer[i] > threshold) {
            peaksArray.push(i);
            // Skip forward ~ 1/4s to get past this peak.
            i += 10000;
        }
        i++;
    }

    return peaksArray;
}

// Function used to return a histogram of peak intervals
function countIntervalsBetweenNearbyPeaks(peaks) {
    var intervalCounts = [];
    peaks.forEach(function(peak, index) {
        for(var i = 0; i < 10; i++) {
            var interval = peaks[index + i] - peak;
            var foundInterval = intervalCounts.some(function(intervalCount) {
                if (intervalCount.interval === interval)
                    return intervalCount.count++;
            });
            if (!foundInterval) {
                intervalCounts.push({
                    interval: interval,
                    count: 1
                });
            }
        }
    });
    return intervalCounts;
}

// Function used to return a histogram of tempo candidates.
function groupNeighborsByTempo(intervalCounts) {
    var tempoCounts = [];
    intervalCounts.forEach(function(intervalCount, i) {
        if (intervalCount.interval === 0) { return; }

        // Convert an interval to tempo
        var theoreticalTempo = 60 / (intervalCount.interval / 44100);

        // Adjust the tempo to fit within the 90-180 BPM range
        while (theoreticalTempo < 90) theoreticalTempo *= 2;
        while (theoreticalTempo > 180) theoreticalTempo /= 2;

        var foundTempo = tempoCounts.some(function(tempoCount) {
            if (tempoCount.tempo === theoreticalTempo)
                return tempoCount.count += intervalCount.count;
        });
        if (!foundTempo) {
            tempoCounts.push({
                tempo: theoreticalTempo,
                count: intervalCount.count
            });
        }
    });
    tempoCounts.sort(function(a,b){ //countで降順ソート
        if(a.count > b.count) return -1;
        if(a.count < b.count) return 1;
        return 0;
    });

    return Math.round(tempoCounts[0].tempo); //第一候補をreturn
}

/**
 * soundjsのaudioInstanceに各種プロパティとメソッドを追加した
 * オブジェクトを返すコンストラクタ
 * @returns {AbstractSoundInstance}
 * @constructor
 */
function Sound(videoId, pitch, $bpmDiv) {
    var self = createjs.Sound.createInstance(videoId);

    //-----property-----//
    self.videoId = videoId;
    self.$bpmDiv = $bpmDiv; //bpmを書くdiv。苦肉の策。
    self.bpm     = null;
    self.pitch   = pitch;

    //-----method-----//

    //** volume optional
    self.togglePlay = function(volume) {
        if (volume !== undefined) { self.volume = volume }

        //そのインスタンスでの初回の再生の場合、play()する
        if (self.playState === null) {
            self.play();
        } else {
            self.paused = !self.paused;
        }

        //pauseする度にaudioBufferSourceNodeが作りなおされピッチが初期化されてしまうため、
        //再生するごとに毎回ピッチを設定する
        if (self.isPlaying()) {
            self.changePitch(self.pitch);
        }

    };

    self.changePitch = function(pitch) {
        self.pitch = pitch;
        if (self.isPlaying()) {
            self.sourceNode.playbackRate.value = pitch;
        }
    };

    self.seekSound = function(x) {
        x -= paddingLeft; //計算上padding分は邪魔なので除去
        if (x < 0 || innerWidth < x) { return; } // paddingの部分のクリックの場合、シークしない

        var normalizedX = x / canvasWidth; //正規化
        var seekPoint = self.duration * normalizedX;

        self.position = seekPoint;

        //シークする度にピッチが初期化されてしまうため、毎回ピッチを設定する
        if (self.isPlaying()) {
            self.changePitch(self.pitch);
        }

        //TODO: 再生位置を示す赤線の移動
    };

    //newすると同時にBPMを取得するため、即時関数になっています
    //コールバック関数から値を返却する方法がわからなかったため、この仕様になりました
    self.detectBpm = function() {
        getLowpassFilteredBuffer(self._playbackResource)
            .then(function(lowpassedAudio) {
                var peaks = [],
                initialThreshold = 0.9,
                threshold = initialThreshold,
                minThresold = 0.3,
                minPeaks = 30;

                //peakがminPeaks分取れるまで、Thresholdを落としていく
                while (peaks.length < minPeaks && threshold >= minThresold) {
                    peaks = getPeaksAtThreshold(lowpassedAudio.getChannelData(0), threshold);
                    threshold -= 0.05;
                }
                var intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
                self.bpm = groupNeighborsByTempo(intervalCounts);

                $bpmDiv.html("bpm: " + self.bpm);
            });
    }();

    self.isPlaying = function() {
        return self.playState === createjs.Sound.PLAY_SUCCEEDED && self.paused === false;
    };

    return self
}