$(function() {
    var currentSound1;
    var currentSound2;

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
            currentSound1.volume = newVolume;
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
            currentSound2.volume = newVolume;
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
                currentSound1.volume = newVolume;
            } else { //フェーダーが左側にある場合、右側の音量を下げる
                newVolume = player2Volume * ui.value;
                currentSound2.volume = newVolume;
            }
        }
    });

    //左ピッチスライダー
    $( "#pitch-slider1" ).slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 2,
        step: 0.01,
        value: 1.0, //ピッチの初期値
        slide: function( event, ui ) {
            currentSound1.changePitch(ui.value);
        }
    });

    //右ピッチスライダー
    $( "#pitch-slider2" ).slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 2,
        step: 0.01,
        value: 1.0, //音量の初期値
        slide: function( event, ui ) {
            currentSound2.changePitch(ui.value);
        }
    });

    $('#search').submit(curlYoutubeThumbnail);

    $(document).on('click', '#list .movie', cloneThumbnailToPlaylist);

    //コールバックを関数に切り出したかったが、currentSoundがundefinedの場合参照渡しすることができず
    //currentSoundにnewしたSoundを代入しても反映されないため直に書いています
    $(document).on('click', '#playlist .assign1-button', function(){
        var $dfd = new $.Deferred;
        var movie = $(this).parent();
        var videoName = $(movie).find(".title").html();
        var videoId = $(movie).data('video-id');

        loadSounds([videoId], $dfd).then(function() {
            currentSound1 = new Sound(videoId, $("#pitch-slider1").slider("value"), $("#player1bpm"));
            $("#title1").html(videoName);
            drawWaveformToCanvas(currentSound1, $("#waveform1")[0]);
        });
    });

    $(document).on('click', '#playlist .assign2-button', function(){
        var $dfd = new $.Deferred;
        var movie = $(this).parent(); //TODO: 相対位置指定は拡張性を損なうので修正する
        var videoName = $(movie).find(".title").html();
        var videoId = $(movie).data('video-id');

        loadSounds([videoId], $dfd).then(function() {
            currentSound2 = new Sound(videoId, $("#pitch-slider2").slider("value"), $("#player2bpm"));
            $("#title2").html(videoName);
            drawWaveformToCanvas(currentSound2, $("#waveform2")[0]);
        });
    });

    //コールバックを関数に切り出したかったが、currentSoundがundefinedの場合参照渡しすることができず
    //currentSoundにnewしたSoundを代入しても反映されないため直に書いています
    $('#playButton1').on('click', function() {
        if (currentSound1 === undefined) { return; } //曲がロードされていない場合、なにもしない

        //再生が完了していた場合、インスタンスを作りなおす
        if (currentSound1.playState === createjs.Sound.PLAY_FINISHED) {
            currentSound1 = new Sound(currentSound1.videoId, $("#pitch-slider1").slider("value"), $("#player1bpm"));
        }

        currentSound1.togglePlay($("#vertical-slider1").slider("value"));
        togglePlayIcon(currentSound1, $("#playButton1"));
    });

    $('#playButton2').on('click', function() {
        if (currentSound2 === undefined) { return; } //曲がロードされていない場合、なにもしない

        //再生が完了していた場合、インスタンスを作りなおす
        if (currentSound2.playState === createjs.Sound.PLAY_FINISHED) {
            currentSound2 = new Sound(currentSound2.videoId, $("#pitch-slider2").slider("value"), $("#player2bpm"));
        }

        currentSound2.togglePlay($("#vertical-slider2").slider("value"));
        togglePlayIcon(currentSound2, $("#playButton2"));
    });

    $("#waveform1").on("click", function(event) {
        currentSound1.seekSound(getMouseXInElement(event));
    });

    $("#waveform2").on("click", function(event) {
        currentSound2.seekSound(getMouseXInElement(event));
    });

    //-----functions-----//

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
                $(this).clone().append($('<button>').attr('class', 'btn btn-sm btn-default assign1-button').append( //TODO: attrを使わない
                        '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <strong>1</strong>')
                ).append($('<button>').attr('class', 'btn btn-sm btn-default assign2-button').append(
                        '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <strong>2</strong>')
                )
            );
        } else {
            $('#playlist [data-video-id = '+videoId+']').remove();
        }
    }

    function getMouseXInElement(event) {
        if (!event) { event = window.event; }

        var elmX;

        if (event.targetTouches) { // for tablet
            elmX = event.targetTouches[0].pageX - event.target.offsetLeft;
        } else if (document.all || 'all' in document) {
            elmX = event.offsetX;
        } else {
            elmX = event.layerX;
        }

        return elmX;
    }

    function togglePlayIcon(sound, $playButton) {
        if (sound.paused === true) {
            $playButton.html('<span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
        } else {
            $playButton.html('<span class="glyphicon glyphicon-pause" aria-hidden="true"></span>');
        }
    }
});