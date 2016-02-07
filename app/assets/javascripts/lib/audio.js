
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
        var videoId = decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]); // URLからvideo idを抜き出します
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