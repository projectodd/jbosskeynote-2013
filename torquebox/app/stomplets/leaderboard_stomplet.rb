
require 'torquebox-stomp'

class LeaderboardStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @leaderboard = TorqueBox.fetch( '/topics/leaderboard' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to(subscriber, @leaderboard, nil, :encoding=>:json)
  end

end
