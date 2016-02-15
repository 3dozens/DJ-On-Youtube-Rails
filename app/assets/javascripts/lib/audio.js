
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
 * Youtubeのurlの配列を受け取ってSoundJSに登録します
 * @param urlList
 * @returns {*}
 */
function loadSounds(urlList) {
    var dfd = new $.Deferred;

    var baseURL = "http://192.168.33.10:3000/music-request?"; // ajaxリクエストのベースURL

    // ajaxリクエストのためのURLを組み立てる
    var requestURL = baseURL;
    $.each(urlList, function(i, url) {
        requestURL += "video_urls[]=" + url; // TODO: パラメータをvideo_ids[]に統一する
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

function play(videoId) {
    createjs.Sound.play(videoId);
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
 * Youtubeの動画URLからビデオIDを取り出します
 * @param url Youtubeの動画URL
 * @returns {string} ビデオID
 */
function getVideoId(url) {
    return decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]);
}