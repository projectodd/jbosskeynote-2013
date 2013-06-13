require 'torquebox-stomp'

class BidStatsStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @bid_stats = TorqueBox.fetch( '/topics/bid-stats' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to(subscriber, @bid_stats, nil, :encoding=>:json)
  end

end
