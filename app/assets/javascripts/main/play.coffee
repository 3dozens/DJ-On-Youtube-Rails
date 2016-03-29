$ ->

  # 音声ファイルの場所
#  videoId	f0kXY7MQHLw&
  YOUTUBE_URLS = ['https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Df0kXY7MQHLw',
               'https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D0H24mH17oJw'
  ];
  VIDEO_IDS = ['f0kXY7MQHLw%26', '0H24mH17oJw'];

  $('.start1').on 'click', ->
#    play(soundList[0].source, soundList, context)
    play("f0kXY7MQHLw");

  $('.start2').on 'click', ->
    source2.start(0)

  $('.stop1').on 'click', ->
    createjs.SoundJS.stop();

  $('.stop2').on 'click', ->
    source2.stop()

  $('.load').on 'click', ->
    loadSounds(YOUTUBE_URLS).done ->
      console.log("done")

