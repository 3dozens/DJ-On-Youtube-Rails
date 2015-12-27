class TracksController < ApplicationController

  def music_request

    download_video

    filename = get_filename
    filepath = Rails.root.join("public").join("downloaded_files") + filename

    send_data(File.read(filepath), filename: filename)

    File.delete filepath
  end

  private

  def download_video
    `youtube-dl -x -o "./public/downloaded_files/%(id)s.%(ext)s" #{params[:video_url]}`
  end

  def get_filename
    `youtube-dl --get-filename -x -o "%(id)s.%(ext)s" #{params[:video_url]}`.chomp
  end
end
