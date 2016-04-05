class TracksController < ApplicationController

  def music_request
    Youtube.download_videos(params[:video_ids])

    head :ok
  end

  def delete_music
    basePath = Rails.root.join("public").join("downloaded_files")
    params[:video_ids].each do |video_id|
      filename = video_id + ".mp3"
      File.delete(basePath + filename)
    end

    head :ok
  end

end
