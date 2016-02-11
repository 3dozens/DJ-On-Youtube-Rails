
// Web Audio APIが使えるか確認しつつ、contextをつくる
function createContext() {
    try {
        var SupportedAudioContext = window.AudioContext || window.webkitAudioContext;
    } catch (e) {
        throw new Error('Web Audio API is not supported.');
    }

    return new SupportedAudioContext();
}

/**
 * 複数の音声を非同期でロードし、配列に詰め込みます
 * @param urlList ロードするURLの配列
 * @param soundList ロードした音源を詰め込む配列
 * @param context AudioContext
 * @returns dfd
 */
function loadSounds(urlList, soundList, context) {
    var dfd = new $.Deferred;

    $.each(urlList, function(i, url) {
        var videoId = decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]); // URLからvideo idを抜き出す
        var request = new XMLHttpRequest();

        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.send();
        request.onload = function() {
            // contextにArrayBufferを渡し、decodeさせる
            context.decodeAudioData(request.response, function (decoded_buf) {
                var source = context.createBufferSource();
                source.buffer = decoded_buf;
                source.connect(context.destination);

                var bufferObj = {videoId: videoId, source: source};
                soundList.push(bufferObj);

                if (url === $(urlList).last()[0]) dfd.resolve();
            });
        };
    });

    return dfd.promise();
}

function loadSoundsOnPreloadJS(urlList) {
    var dfd = new $.Deferred;

    // この関数のローカル変数としてqueueをnewしているが、
    // 他の関数でも使うかもしれない。修正する必要が出る可能性あり
    var queue = new createjs.LoadQueue();
    queue.installPlugin(createjs.Sound);
    createjs.Sound.alternateExtensions = ["mp3"];
    queue.addEventListener("complete", function() {
        dfd.resolve();
    });

    // manifestを作成する
    // idはYoutubeのVideoIdとする
    var manifest = [];
    $.each(urlList, function(i, url) {
        var videoId = decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]); // URLからvideo idを抜き出す
        var manifestElem = {"src":url, "id": videoId};
        manifest.push(manifestElem);
    });

    queue.loadManifest(manifest);

    return dfd.promise();
}

function loadSoundsOnSoundJS(urlList) {
    var dfd = new $.Deferred;

    var baseURL = "http://192.168.33.10:3000/music-request?"; // ajaxリクエストのベースURL

    // ajaxリクエストのためのURLを生成する
    var requestURL = baseURL;
    $.each(urlList, function(i, url) {
        requestURL += "video_urls[]=" + url;
        if (url !== $(urlList).last()[0]) requestURL += "&"; // 最後のパラメータじゃなかったら&を追記
    });

    // YoutubeのURLからビデオIDを取り出し配列に詰める
    var videoIds = [];
    $.each(urlList, function(i, url) {
        var videoId = decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]); // ビデオIDを取り出す
        videoIds.push(videoId);
    });

    $.ajax({
        url: requestURL,
        success: registerSounds.bind(this, videoIds, dfd)
    });

    return dfd.promise();
}

/**
 * videoIdから音源をSoundJSに登録する
 * 全音源を登録し終わると渡された$.Deferredをresolveします
 * @param videoIds サーバー上でダウンロード済みの音源のYoutube Video ID
 * @param dfd $.Deferredオブジェクト
 * @returns {*} $.Deferred.promise()
 */
function registerSounds(videoIds, dfd) {

    // manifestを作成する
    // idはYoutubeのVideoIdとする
    var manifest = [];
    $.each(videoIds, function(i, videoId) {
        var manifestElem = {"src": videoId + ".mp3", "id": videoId};
        manifest.push(manifestElem);
    });

    var basePath = "/downloaded_files/"; // サーバー上の音源フォルダまでのパス

    createjs.Sound.registerSounds(manifest, basePath);

    // SoundJSに音源を登録し終わったらサーバー上の音源を削除してresolve
    createjs.Sound.on("complete", function() {
        var requestURL = "http://192.168.33.10:3000/delete-music?";
        $.each(videoIds, function(i, videoId) {
            requestURL += "video_ids[]=" + videoId;
            if (videoId !== $(videoIds).last()[0]) requestURL += "&"; // 最後のパラメータじゃなかったら&を追記
        });

        $.ajax({
            url: requestURL,
            success: function() { dfd.resolve(); }
        });
    });

    return dfd.promise();
}

function play(playSource, soundList, context) {
    playSource.start();

    var newSource = context.createBufferSource();
    newSource.buffer = playSource.buffer;

    $.each(soundList, function(i, sound) {
       if (playSource === sound.source) {
           soundList[i].source = newSource;
           soundList[i].videoId = "test"; // debug
           //sound.source = newsSource;
           return false; // break
       }
    });

    //return newSource;
}

function playOnSoundJS(videoId) {
    createjs.Sound.play(videoId);
}

/**
 * Youtubeの動画URLからビデオIDを取り出します
 * @param url Youtubeの動画URL
 * @returns {string} ビデオID
 */
function getVideoId(url) {
    return decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]);
}