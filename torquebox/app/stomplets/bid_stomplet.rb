require 'torquebox-stomp'
require 'json'
require 'pp'

class BidStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @bids           = TorqueBox.fetch( '/topics/bids' )
    @bid_stats      = TorqueBox.fetch( '/topics/bid-stats' )
    @notifications  = TorqueBox.fetch( '/topics/user-notifications' )
    @all_bids       = TorqueBox.fetch( '/queues/all-bids' )
    @activity       = TorqueBox.fetch( '/topics/activity' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to(subscriber, @bids, nil, :encoding=>:json)
  end

  def on_message(message, session)
    data = JSON.parse( message.content_as_string )

    user = User.find_by_identifier( data['user_id'] )

    auction = Auction.find_by_id( data['auction_id'] )

    bid_amount = data['amount'].to_i

    if ( auction.completed? )
      reject( user, auction, bid_amount, "auction is over" )
      return
    end

    rejected = false
    if ( auction.high_bid && bid_amount <= auction.high_bid.amount ) 
      reject( user, auction, bid_amount, "bid not higher than current high bid" )
      rejected = true
    end
    if ( user.balance < bid_amount )
      reject( user, auction, bid_amount, "bid exceeds available balance" )
      rejected = true
    end
    if ( auction.high_bid && ( auction.high_bid.user == user ) )
      reject( user, auction, bid_amount, "already the high bidder" )
      rejected = true
    end
    if ( ((auction.high_bid && auction.high_bid.amount) || 0) + 25 < bid_amount )
      reject( user, auction, bid_amount, "bid more than $25 higher than current price" )
      rejected = true
    end
    
    bid = Bid.new
    bid.user = user
    bid.auction = auction
    bid.amount = bid_amount

    if rejected
      send_to( @all_bids, bid, {}, :encoding=>:json )
      return
    end

    bid.committed = true

    bid.save!
    user.notify_balance
    
    uncommitted_users = []
    auction.bids.reload.each do |each|
      if ( each.id != bid.id )
        if ( each.committed ) 
          uncommitted_users << each.user
          each.committed = false
          each.save
          reject( each.user, each.auction, each.amount, "You were out-bid" )
        end
      end
    end

    send_to( @all_bids, bid, {}, :encoding=>:json )
    send_to( @bids, bid, {}, :encoding=>:json )

    accept( user, bid )

    uncommit( uncommitted_users )
    User.connection_pool.checkin( User.connection )
    Auction.connection_pool.checkin( Auction.connection )

    @activity.publish( { :message=>"#{bid.user.name} bid $#{bid.amount} on #{bid.auction.title}" }, :encoding=>:json )
  end

  def reject(user, auction, amount, message)
    notification = {
      :user_id=>user.identifier,
      :type=>'reject',
      :auction_id=>auction.id,
      :current_high_bid=>( auction.high_bid ? auction.high_bid.amount : auction.starting_price ),
      :amount=>amount,
      :message=>message,
    }
    send_to( @notifications, notification, { :user_id=>user.identifier }, :encoding=>:json )
  end

  def accept(user, bid)
    notification = {
      :user_id=>user.identifier,
      :type=>'accept',
      :auction_id=>bid.auction.id,
      :amount=>bid.amount,
      :message=>"bid accepted",
    }
    send_to( @notifications, notification, { :user_id=>user.identifier }, :encoding=>:json )
  end

  def uncommit(users)
    users.uniq.each do |user|
      user.notify_balance
    end
  end

end
