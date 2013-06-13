class CreateAuctions < ActiveRecord::Migration
  def change
    create_table :auctions do |t|
      t.string     :title
      t.text       :description
      t.string     :image_key
      t.integer    :starting_price
      t.integer    :duration
      t.datetime   :started_at
      t.datetime   :ended_at
      t.boolean    :completed
      t.timestamps
    end
  end
end
