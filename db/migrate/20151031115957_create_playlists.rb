class CreatePlaylists < ActiveRecord::Migration
  def change
    create_table :playlists do |t|
      t.references :user, index: true

      # t.integer :user_id, null: false
      t.string :name, null: false
      t.integer :track_number, null: false

      t.timestamps null: false

    end
    add_foreign_key :playlists, :users
  end
end
