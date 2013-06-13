class User < ActiveRecord::Base
  attr_accessible :identifier

  has_many :bids, :order=>'bids.auction_id DESC'
  has_many :committed_bids, :class_name=>'Bid', :conditions=>{ :committed=>true }, :order=>'bids.auction_id DESC'

  scope :recently_logged_in, lambda{ where( 'last_login_at > ?', Time.now - 30.seconds ) }
  STARTING_BALANCE = 500

  def to_s
    self.identifier
  end

  def balance
    STARTING_BALANCE - self.committed_bids.sum(:amount)
  end

  def notify_balance
    topic = TorqueBox.fetch('/topics/user-notifications')
    topic.publish( {
                     :user_id=>identifier,
                     :type=>'balance',
                     :balance=>balance,
                     :points=>points,
                     :message=>"new balance: #{balance}",
                   },
                   :properties=>{ :user_id=>identifier },
                   :encoding=>:json ) if topic
  end
  
  def as_json(opts={})
    hash = super(opts)
    hash['balance'] = self.balance
    hash
  end

end

