require 'torquebox-stomp'

class ActivityStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @activity = TorqueBox.fetch( '/topics/activity' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to(subscriber, @activity, nil, :encoding=>:json)
  end

end
