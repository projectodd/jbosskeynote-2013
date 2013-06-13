# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130325191329) do

  create_table "auctions", :force => true do |t|
    t.string   "title"
    t.text     "description"
    t.string   "image_key"
    t.integer  "starting_price"
    t.integer  "duration"
    t.datetime "started_at"
    t.datetime "ended_at"
    t.boolean  "completed"
    t.datetime "created_at",     :null => false
    t.datetime "updated_at",     :null => false
  end

  create_table "bids", :force => true do |t|
    t.integer  "user_id"
    t.integer  "auction_id"
    t.integer  "amount"
    t.boolean  "committed"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "users", :force => true do |t|
    t.string   "identifier"
    t.string   "platform"
    t.string   "name"
    t.string   "profile_pic"
    t.integer  "points",        :default => 0
    t.datetime "last_login_at"
    t.datetime "created_at",                   :null => false
    t.datetime "updated_at",                   :null => false
  end

end
