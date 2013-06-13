require 'torquebox'

module MockclientHelper

  def endpoint() 
    TorqueBox::fetch( "stomp-endpoint" )
  end

end
