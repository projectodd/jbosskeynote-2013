require 'torquebox-stomp'
require 'json'
require 'pp'

class AuctionsStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts) 
    @destination = TorqueBox::fetch( '/topics/auctions' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to( subscriber, @destination, nil, :encoding=>:json )
  end

end
