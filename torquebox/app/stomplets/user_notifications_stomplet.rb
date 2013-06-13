require 'torquebox-stomp'

class UserNotificationsStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @notifications = TorqueBox.fetch( '/topics/user-notifications' )
    super
  end

  def on_subscribe(subscriber)
    puts "subscribed to user-notifications #{subscriber}"
    subscribe_to(subscriber, @notifications, nil, :encoding=>:json)
  end

end
