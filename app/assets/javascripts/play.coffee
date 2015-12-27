$ ->

  # 音声ファイルの場所
  SOUND_URL1 = 'http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Df0kXY7MQHLw%26'
  SOUND_URL2 = 'http://192.168.33.10:3000/music-request?video_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D0H24mH17oJw'

  # Web Audio APIが使えるか確認しつつ、contextをつくる
  try
    SupportedAudioContext = window.AudioContext || window.webkitAudioContext
  catch e
    throw new Error('Web Audio API is not supported.')

  context = new SupportedAudioContext()

  # bufferの初期化
  source1 = context.createBufferSource()
  source2 = context.createBufferSource()

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

# 音声を非同期でロードします
load = (url, source, context) ->
  dfd = new $.Deferred

  request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer' # ArrayBufferとしてロード
  request.send()
  request.onload = ->
    # contextにArrayBufferを渡し、decodeさせる
    context.decodeAudioData request.response, (response_buf) ->
      source.buffer = response_buf
      source.connect(context.destination)
      dfd.resolve()
  dfd.promise()