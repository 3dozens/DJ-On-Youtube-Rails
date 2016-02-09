class TracksController < ApplicationController

  def music_request

    binding.pry
    # TODO: download_videoは並列に処理できない！
    params[:video_urls].each do |video_url|
      download_video(video_url)
    end

    head :ok # TODO: レスポンス返すのをダウンロードが終わってからにする

  end

  private

  def download_video(video_url)
    `youtube-dl -x --audio-format "mp3" -o "./public/downloaded_files/%(id)s.%(ext)s" #{video_url}`
  end

  def fetch_filename
    filename = `youtube-dl --get-filename -x -o "%(id)s.%(ext)s" #{params[:video_url]}`.chomp
    Pathname(filename).sub_ext(".mp3").to_s # fetchした段階では拡張子がmp3になっていない場合があるので書き換える
  end

end
