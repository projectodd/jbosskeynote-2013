require 'torquebox-stomp'

class UserRegistrationStomplet < TorqueBox::Stomp::JmsStomplet

  def configure(opts={})
    @registered_users = TorqueBox.fetch( '/topics/registered-users' )
    @activity = TorqueBox.fetch( '/topics/activity' )
  end

  def on_message(message, session)
    data = JSON.parse( message.content_as_string )
    user = User.find_by_identifier( data['identifier'] )

    if ( user.nil? )
      user = User.new
      user.identifier  = data['identifier']
      user.platform    = data['platform']
      user.name        = data['name']
      user.profile_pic = data['profile_pic_url']
      user.last_login_at = Time.now
      user.save!
    else
      user.last_login_at = Time.now
      user.save!
    end
    platform = ( user.platform == 'gplus' ? "Google+" : "Facebook" )
    @activity.publish( { :message=>"#{user.name} logged in via #{platform}" }, :encoding=>:json )

    user.notify_balance
    User.connection_pool.checkin( User.connection )
    @registered_users.publish( { :data=>User.count }, :encoding=>:json )
  end

end
