require 'torquebox-core'
require 'torquebox-messaging'
require 'net/http'

class Auction < ActiveRecord::Base
  include TorqueBox::Messaging::Backgroundable
  
  attr_accessible :title, :description, :starting_price, :duration, :image_key

  scope :pending, where( "started_at IS NULL" )
  scope :inprogress, where( "ended_at IS NULL AND started_at IS NOT NULL" ).order( 'started_at DESC' )
  scope :finishing,  where( "ended_at IS NOT NULL AND ( completed IS NULL OR completed IS FALSE )" ).order( 'started_at DESC' )
  scope :completed,  where( "completed IS TRUE" ).order( 'started_at DESC' )

  after_save :notify

  always_background :native_notif
  
  has_many :bids, :order=>'bids.amount DESC'

  has_one :high_bid, :class_name=>'Bid', :order=>'amount DESC'

  def pending?
    self.started_at == nil 
  end

  def started?
    self.started_at != nil
  end

  def inprogress?
    self.started_at != nil && self.ended_at == nil
  end

  def finishing?
    ( self.completed.nil? || self.completed == false ) && self.ended_at != nil
  end

  def to_s
    self.title
  end

  def notify
    topic = TorqueBox.fetch('/topics/auctions')
    if ( finishing? ) 
      return
    end
    if( inprogress? )
      native_notif
    end
    topic.publish( self, :encoding=>:json ) if topic
  end

  def as_json(opts={})
    hash = super( opts.merge( :include=>{:high_bid=>{:include=>:user} } ) )
    hash = hash.merge( 'state'=>state )
    if ( inprogress? )
      hash = hash.merge( 'time_remaining'=>( ( self.started_at + (self.duration * 60).seconds ) - Time.now ).to_i )
    end
    hash
  end

  def state 
    return "completed" if ( completed? ) 
    return "inprogress" if ( inprogress? ) 
    return "pending" if ( pending? ) 
  end

  def native_notif
    #The URL to the push server
    #the long number here is the broadcast id,  this should have mobile variants assigned to it on the push server
    # this could possibly change,  but maybe no
    url = "http://keynotepushserver-lholmqui.rhcloud.com/ag-push/rest/sender/broadcast/8a5659fc3f12b7aa013f14c184810000"
    #url = "http://keynotepushserver-lholmqui.rhcloud.com/ag-push/rest/sender/broadcast/4028818b3e7af658013e7af88fd90000/"
    uri = URI.parse(url)

    #alert will be what the user will see in the notifcation center
    #title is the auction title - used in the app
    #id is the auction id - used in the app
    data = { "alert"=>"A new auction has started", "title"=>self.title, "id"=>self.id }
    headers = {"content-type" => "application/json", "Accept" => "application/json"}

    http = Net::HTTP::new(uri.host,uri.port)
    response = http.post(uri.path,data.to_json,headers)
    puts "push server response: #{response.code}"
  end


end
