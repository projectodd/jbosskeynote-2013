require 'pp'

class BidsController < ApplicationController

  def create
    @bid = Bid.new
    @bid.user = User.find( params[:bid][:user_id] )
    auction = Auction.find( params[:bid][:auction_id] )
    @bid.auction = auction
    @bid.amount = params[:bid][:amount]
    @bid.save
    redirect_to auction
  end

end
