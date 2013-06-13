class AuctionsController < ApplicationController

  respond_to :json

  def index
    @auctions = Auction.all( :order=>'id ASC' )
    respond_with @auctions
  end

  def start
    @auction = Auction.find_by_id( params[:id] ) 
    respond_with {} and return unless @auction
    @auction.started_at = Time.now
    @auction.save 
    respond_with @auction
  end

  def withdraw
    @auction = Auction.find_by_id( params[:id] ) 
    respond_with {} and return unless @auction
    @auction.started_at = nil
    @auction.ended_at = nil
    @auction.completed = false
    @auction.bids.each do |bid|
      bid.destroy
    end
    @auction.save 
    respond_with @auction
  end

  def complete
    @auction = Auction.find_by_id( params[:id] )
    respond_with {} and return unless @auction
    @auction.ended_at = Time.now
    @auction.save
    respond_with @auction
  end

  def show
    @auction = Auction.find_by_id( params[:id] ) 
    respond_with {} and return unless @auction
    respond_with @auction
  end

  def bids
    @auction = Auction.find_by_id( params[:id] ) 
    respond_with {} and return unless @auction
    respond_with @auction.bids
  end

end
