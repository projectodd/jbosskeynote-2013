require 'torquebox-stomp'

class RegisteredUsersStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts)
    @registered_users = TorqueBox.fetch( '/topics/registered-users' )
    super
  end

  def on_subscribe(subscriber)
    subscribe_to(subscriber, @registered_users, nil, :encoding=>:json)
  end

end
