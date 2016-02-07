class TracksController < ApplicationController

  def music_request

    download_video

    filename = fetch_filename
    filepath = Rails.root.join("public").join("downloaded_files") + filename

    send_data(File.read(filepath), filename: filename)

    File.delete filepath

  end

  private

  def download_video
    `youtube-dl -x --audio-format "mp3" -o "./public/downloaded_files/%(id)s.%(ext)s" #{params[:video_url]}`
  end

  def fetch_filename
    filename = `youtube-dl --get-filename -x -o "%(id)s.%(ext)s" #{params[:video_url]}`.chomp
    Pathname(filename).sub_ext(".mp3").to_s # fetchした段階では拡張子がmp3になっていない場合があるので書き換える
  end
end
