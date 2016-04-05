class Youtube < ActiveRecord::Base

  def self.download_videos(video_ids)
    video_ids.each do |video_id|
      download_video(video_id)
    end

    Process.waitall # download_video内でProcess.waitしているが、なぜかこちらでもwait(all?)しないと処理が勝手に進んでしまう
  end

  def self.fetch_filename
    filename = `youtube-dl --get-filename -x -o "%(id)s.%(ext)s" #{params[:video_id]}`.chomp
    Pathname(filename).sub_ext(".mp3").to_s # fetchした段階では拡張子がmp3になっていない場合があるので書き換える
  end

  private

  def self.download_video(video_id)
    cmd = %Q{youtube-dl -x --audio-format "mp3" -o "./public/downloaded_files/%(id)s.%(ext)s" #{video_id}}

    Process.fork do
      Process.exec cmd
      Process.wait
    end
  end

end
