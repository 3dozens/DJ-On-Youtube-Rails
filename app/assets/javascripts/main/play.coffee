$ ->

  # 音声ファイルの場所
  SOUND_URLS = ['http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Df0kXY7MQHLw%26',
               'http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D0H24mH17oJw'
  ]

  context = createContext();

  # 現在のノード
  currentNode1 = null;
  currentNode2 = null;

  # 選んだ動画のすべてのbufferSource
  soundList = [];

  # 音声ファイルのロード
  # click時に再生
  $('.start1').on 'click', ->
    play(soundList[0].source, soundList, context)

  $('.start2').on 'click', ->
    source2.start(0)

  $('.stop1').on 'click', ->
    soundList[0].source.stop();

  $('.stop2').on 'click', ->
    source2.stop()

  $('.load').on 'click', ->
    loadSoundsOnAudioElement(SOUND_URLS, context).done ->
      console.log(soundList)

