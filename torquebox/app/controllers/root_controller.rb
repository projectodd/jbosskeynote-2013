require 'torquebox-core'

class RootController < ApplicationController

  def index
    redirect_to :login if ( ! session[:logged_in] )
  end

  def login
    if ( params[:password] == 'jboss42' )
      session[:logged_in] = true
      redirect_to root_path 
    end
  end

  def logout
    session[:logged_in] = false
    redirect_to :login
  end

  def reset
    User.all.each do |u|
      u.destroy
    end

    Bid.all.each do |b|
      b.destroy
    end

    Auction.all.each do |a|
      a.started_at = nil
      a.ended_at = nil
      a.completed = false
      a.save!
    end
    TorqueBox.fetch('/topics/control').publish({:action => :reset}, :encoding => :json)
    redirect_to :root
  end

  def shutdown
    TorqueBox.fetch('/topics/auctions').publish({:state =>:shutdown}, :encoding => :json)
    render :nothing=>true, :layout=>false
  end

end
