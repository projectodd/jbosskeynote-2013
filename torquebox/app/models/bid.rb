class Bid < ActiveRecord::Base
  belongs_to :user
  belongs_to :auction

  def as_json(opts={})
    h = super( opts.merge( { :include=>[:user, :auction] } ) )
    if ( self.persisted? )
      h['valid'] = true
    else
      h['valid'] = false
    end
    h
  end
end
