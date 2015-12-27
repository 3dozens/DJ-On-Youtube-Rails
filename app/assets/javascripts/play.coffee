$ ->

  # 音声ファイルの場所
  SOUND_URLS = ['http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Df0kXY7MQHLw%26',
               'http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D0H24mH17oJw'
  ]

  # Web Audio APIが使えるか確認しつつ、contextをつくる
  try
    SupportedAudioContext = window.AudioContext || window.webkitAudioContext
  catch e
    throw new Error('Web Audio API is not supported.')

  context = new SupportedAudioContext()

  # 現在のノード
  currentNode1 = null;
  currentNode2 = null;

  # 選んだ動画のすべてのbufferSource
  bufferSources = [];

  # 音声ファイルのロード
  # click時に再生
  $('.start1').on 'click', ->
    load(SOUND_URL1, source1, context).done ->
      source1.start(0)

  $('.start2').on 'click', ->
    load(SOUND_URL2, source2, context).done ->
      source2.start(0)

  $('.stop1').on 'click', ->
    source1.stop()

  $('.stop2').on 'click', ->
    source2.stop()

  $('.load').on 'click', ->
    loadSounds(SOUND_URLS, bufferSources, context).done ->
      console.log(bufferSources)


# 音声を非同期でロードします
loadSounds = (urlList, bufferSources, context) ->
  dfd = new $.Deferred

  $.each urlList, (i, url) ->
    videoId = decodeURIComponent(url.match(/.*v%3D(.*)$/)[1]) # URLからvideo idを抜き出します

    request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = 'arraybuffer' # ArrayBufferとしてロード
    request.send()
    request.onload = ->
      # contextにArrayBufferを渡し、decodeさせる
      context.decodeAudioData request.response, (decoded_buf) ->
        source = context.createBufferSource();
        source.buffer = decoded_buf
        source.connect(context.destination)

        bufferObj = {videoId : videoId, source : source}
        bufferSources.push bufferObj

        if url == $(urlList).last()[0]
          dfd.resolve()
  dfd.promise()