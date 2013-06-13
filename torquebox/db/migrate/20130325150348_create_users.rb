class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string      :identifier
      t.string      :platform
      t.string      :name
      t.string      :profile_pic
      t.integer     :points,  :default=>0
      t.datetime    :last_login_at
      t.timestamps
    end
  end
end
