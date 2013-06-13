class MockclientController < ApplicationController

  def index
    @users = User.all
    @auctions = Auction.inprogress
  end

end
