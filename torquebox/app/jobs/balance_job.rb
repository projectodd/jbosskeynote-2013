
class BalanceJob 

  def initialize()
  end

  def run
    User.recently_logged_in.each do |u|
      u.notify_balance
    end
  end

  def roster
  end

end
