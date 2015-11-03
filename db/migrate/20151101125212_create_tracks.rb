class CreateTracks < ActiveRecord::Migration
  def change
    create_table :tracks do |t|
      t.references :playlist, index: true, foreign_key: true
      t.integer :video_id, null: false
      t.string :title, null: false
      t.time :length, null: false
      t.integer :bpm, null: false

      t.timestamps null: false
    end
  end
end
