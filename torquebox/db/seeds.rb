# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

require 'yaml'
require 'pp'

auctions = YAML.load( File.read( File.join( File.dirname( __FILE__ ) , '../data/auctions.yml' ) ) )['auctions']

auctions.each do |e|
  Auction.create( e )
end



