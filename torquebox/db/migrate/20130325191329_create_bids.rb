class CreateBids < ActiveRecord::Migration
  def change
    create_table :bids do |t|
      t.belongs_to :user
      t.belongs_to :auction
      t.integer :amount
      t.boolean :committed
      t.timestamps
    end
  end
end
