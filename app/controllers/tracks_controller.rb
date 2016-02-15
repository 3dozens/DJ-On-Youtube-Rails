class TracksController < ApplicationController

  def music_request

    # TODO: download_videoは並列に処理できない！
    params[:video_urls].each do |video_url|
      download_video(video_url)
    end

    Process.waitall

    head :ok # TODO: レスポンス返すのをダウンロードが終わってからにする
    # TODO: 音源の削除をどうするか考える
  end

  def delete_music
    basePath = Rails.root.join("public").join("downloaded_files")
    params[:video_ids].each do |video_id|
      filename = video_id + ".mp3"
      File.delete(basePath + filename)
    end

    head :ok
  end

  private

  def download_video(video_url)
    cmd = %Q{youtube-dl -x --audio-format "mp3" -o "./public/downloaded_files/%(id)s.%(ext)s" #{video_url}}
    Process.fork do
      Process.exec cmd
      Process.wait
    end
  end

  # TODO: 必要なければ削除
  def fetch_filename
    filename = `youtube-dl --get-filename -x -o "%(id)s.%(ext)s" #{params[:video_url]}`.chomp
    Pathname(filename).sub_ext(".mp3").to_s # fetchした段階では拡張子がmp3になっていない場合があるので書き換える
  end

end
