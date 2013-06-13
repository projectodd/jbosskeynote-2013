
class ScoreProcessor < TorqueBox::Messaging::MessageProcessor 

  def on_message(body)
    user = User.find_by_id( body[:user_id] )
    if ( user )
      user.points = body[:score]
      user.save!
      user.notify_balance
      User.connection_pool.checkin( User.connection )
    end
  end

end
