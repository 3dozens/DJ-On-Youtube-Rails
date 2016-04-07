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
function loadSounds(videoIds, $dfd) {
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
        success: function() { dfd.resolve(); }
    });
}

/**
 * soundInstanceからsoundIdを取得します
 * @param soundInstance
 * @returns soundId
 */
function getSoundId(soundInstance) {
    return soundInstance.src.match(/\/downloaded_files\/(.*)\.mp3/)[1];
}

/**
 * Youtubeの動画URLからビデオIDを取り出します
 * @param url Youtubeの動画URL
 * @returns {string} ビデオID
 */
function getVideoId(url) {
    return decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]);
}

/**
 * 波形を描画します
 * @param canvas canvas要素
 * @param data 音声データ
 * @param sampleRate audiobufferのサンプルレート
 */
function drawWaveform(canvas, data, sampleRate) {
    var canvasContext = canvas.getContext('2d');

    var width  = canvas.width;
    var height = canvas.height;

    var paddingTop    = 10;
    var paddingBottom = 10;
    var paddingLeft   = 20;
    var paddingRight  = 20;

    var innerWidth  = width  - paddingLeft - paddingRight;
    var innerHeight = height - paddingTop  - paddingBottom;
    var innerBottom = height - paddingBottom;

    var middle = (innerHeight / 2) + paddingTop;

    // Sampling period
    var period = 1 / sampleRate;

    // This value is the number of samples during 50 msec
    var n50msec = Math.floor(50 * Math.pow(10, -3) * sampleRate);

    // This value is the number of samples during 60 sec
    var n60sec = Math.floor(60 * sampleRate);

    // Clear previous data
    canvasContext.clearRect(0, 0, width, height);

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
            var sec  = i * period;  // index -> time
            var text = Math.floor(sec) + ' sec';

            // Draw grid (X)
            canvasContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
            canvasContext.fillRect(x, paddingTop, 1, innerHeight);

            // Draw text (X)
            canvasContext.fillStyle = 'rgba(255, 255, 255, 1.0)';
            canvasContext.font      = '16px "Times New Roman"';
            canvasContext.fillText(text, (x - (canvasContext.measureText(text).width / 2)), (height - 3));
        }
    }

    canvasContext.strokeStyle = 'rgba(0, 0, 255, 1.0)';
    canvasContext.lineWidth   = 0.5;
    canvasContext.lineCap     = 'round';
    canvasContext.lineJoin    = 'miter';
    canvasContext.stroke();

    // Draw grid (Y)
    canvasContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
    canvasContext.fillRect(paddingLeft, middle,      innerWidth, 1);
    canvasContext.fillRect(paddingLeft, paddingTop,  innerWidth, 1);
    canvasContext.fillRect(paddingLeft, innerBottom, innerWidth, 1);

}