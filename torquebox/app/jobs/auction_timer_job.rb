
class AuctionTimerJob

  def run
    Auction.finishing.each do |auction|
      auction.completed = true
      auction.save
    end
    Auction.inprogress.each do |auction|
      if ( ( auction.started_at + auction.duration.minutes) <= Time.now ) 
        auction.ended_at = Time.now 
        auction.save
      end
    end
  end

end
