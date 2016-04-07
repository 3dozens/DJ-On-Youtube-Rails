$(function() {
    var currentSoundInstance1;
    var currentSoundInstance2;

    //var ppc = new createjs.PlayPropsConfig().set({volume: 0.5});
    //createjs.Sound.setDefaultPlayProps = ppc;
    //TODO: それぞれのターンテーブルのデフォルト音量を設定する

    $('#q').focus();

    //左縦フェーダー
    $( "#vertical-slider1" ).slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.6, //音量の初期値
        slide: function( event, ui ) {
            var newVolume = ui.value;
            var holizontalValue = $('#holizontal-slider').slider("value");

            //横フェーダーが真ん中より右側だったら音量を減らす
            if (holizontalValue > 1) {
                newVolume = newVolume * (2 - holizontalValue);
            }
            currentSoundInstance1.volume = newVolume;
        }
    });

    //右縦フェーダー
    $( "#vertical-slider2" ).slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.6, //音量の初期値
        slide: function( event, ui ) {
            var newVolume = ui.value;
            var holizontalValue = $('#holizontal-slider').slider("value");

            //横フェーダーが真ん中より左側だったら音量を減らす
            if (holizontalValue < 1) {
                newVolume = newVolume * holizontalValue;
            }
            currentSoundInstance2.volume = newVolume;
        }
    });

    //横フェーダー
    $( "#holizontal-slider" ).slider({
        min: 0,
        max: 2,
        value: 1, //横フェーダーの初期値は真ん中
        step: 0.01,
        slide: function( event, ui ) {
            var player1Volume = $('#vertical-slider1').slider("value");
            var player2Volume = $('#vertical-slider2').slider("value");
            var newVolume;

            if (ui.value > 1) { //フェーダーが右側にある場合、左側の音量を下げる
                newVolume = player1Volume * (2 - ui.value);
                currentSoundInstance1.volume = newVolume;
            } else { //フェーダーが左側にある場合、右側の音量を下げる
                newVolume = player2Volume * ui.value;
                currentSoundInstance2.volume = newVolume;
            }
        }
    });

    $('#search').submit(curlYoutubeThumbnail);

    $(document).on('click', '#list .movie', cloneThumbnailToPlaylist);

    $(document).on('click', '#playlist .assign1-button', function(){
        var $dfd = new $.Deferred;
        var videoId = $($(this).parent()).data('video-id');
        loadSounds([videoId], $dfd).then(function() {
            currentSoundInstance1 = createjs.Sound.createInstance(videoId);
        });
    });

    $(document).on('click', '#playlist .assign2-button', function(){
        var $dfd = new $.Deferred;
        var videoId = $($(this).parent()).data('video-id');
        loadSounds([videoId], $dfd).then(function() {
            currentSoundInstance2 = createjs.Sound.createInstance(videoId)
        });
    });

    $(document).on('click', '#play1', function(){
        //そのインスタンスでの初回の再生の場合、play()する
        if (currentSoundInstance1.playState === null) {
            currentSoundInstance1.play();
        } else {
            currentSoundInstance1.paused = !currentSoundInstance1.paused;
        }
    });

    $(document).on('click', '#play2', function(){
        //そのインスタンスでの初回の再生の場合、play()する
        if (currentSoundInstance2.playState === null) {
            currentSoundInstance2.play();
        } else {
            currentSoundInstance2.paused = !currentSoundInstance2.paused;
        }
    });
});

function curlYoutubeThumbnail() {
    var url = "https://www.googleapis.com/youtube/v3/search";
    var options = {
        key: "AIzaSyDx3H3XYL6KiYgcKa5zIBf95OixQFpohkU",
        part: "snippet",
        q: $('#q').val(),
        type: "video",
        maxResults: 10
    };

    $.get(url, options, function(rs){
        console.log(rs);
        $('#list').empty();
        for (var i = 0; i < rs.items.length; i++) {
            var item = rs.items[i];
            $('#list').append(
                $('<li class="movie">').append(
                    $('<img>').attr({
                        'src': item['snippet']['thumbnails']['default']['url'],
                        'class': 'img-thumbnail'
                    })
                ).attr('data-video-id', item['id']['videoId']).append(
                    $('<li>').append(
                        $('<p class="title">').append(function(){
                            var txt = item['snippet']['title'];
                            if(txt.length > 41){
                                txt = txt.substr(0, 41);
                                $(this).text(txt + "…");
                            }
                            else return txt;
                        })
                    )
                )
            );
        }
    }, "json")
}

function cloneThumbnailToPlaylist() {
    var videoId = $(this).data('video-id');
    $(this).toggleClass('on');

    if ($(this).hasClass('on')) {
        $('#playlist').append(
            $(this).clone().append($('<button>').attr('class', 'btn btn-sm btn-default assign1-button').append(
                    '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <strong>1</strong>')
            ).append($('<button>').attr('class', 'btn btn-sm btn-default assign2-button').append(
                    '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <strong>2</strong>')
            )
        );
    } else {
        $('#playlist [data-video-id = '+videoId+']').remove();
    }
}