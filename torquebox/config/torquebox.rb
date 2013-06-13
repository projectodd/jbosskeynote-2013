TorqueBox.configure do
  web do
    context '/'
  end

  stomplet UserRegistrationStomplet do
    route '/user-registration'
  end

  stomplet AuctionsStomplet do
    route '/auctions'
  end

  stomplet BidStomplet do
    route '/bid'
  end

  stomplet BidStatsStomplet do
    route '/bid-stats'
  end

  stomplet UserNotificationsStomplet do
    route '/user-notifications'
  end

  stomplet LeaderboardStomplet do
    route '/leaderboard'
  end

  stomplet RegisteredUsersStomplet do
    route '/registered-users'
  end

  stomplet ActivityStomplet do
    route '/activity'
  end

  topic '/topics/auctions'
  topic '/topics/bids'
  topic '/topics/bid-stats'
  topic '/topics/user-notifications'
  topic '/topics/leaderboard'
  topic '/topics/control'
  topic '/topics/registered-users'
  topic '/topics/activity'
  
  queue '/queues/all-bids' do
    durable false
  end

  
  topic '/topics/scores' do 
    processor ScoreProcessor
  end
  
  job AuctionTimerJob do
    cron '* * * * * ?'
    description 'Stop auctions that have elapsed'
  end

  job BalanceJob do
    cron '*/5 * * * * ?'
    description 'Notify recent logins of their balance'
  end

  # job LeaderboardJob do
  #   cron '* * * * * ?'
  #   description 'Generate some leaderboard load'
  # end

  pool :messaging do
    type :bounded
    min 1
    max 7
    lazy false
  end

  pool :stomplets do
    type :shared
    lazy false
  end

end
