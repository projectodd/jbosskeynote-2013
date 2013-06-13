# keynote-stats app

Generates stats for the keynote demo.

This app currently consumes bid messages from `/queues/all-bids` and
auction messages from `/topics/auctions`, and responds with the
following stats:

### user scores

Anytime a score for a user changes, the new score is sent to
`/topic/scores`. The message is of the form: 

    {:user_id => 1, :score => 42}

Each bid will result in at least one but possibly two score
messages. These messages are currently sent immediately when a score
changes.

The scores are currently calculated by giving 5 points for each valid
bid, 1 point for each invalid bid, 25 points for being the leader, and
100 points for winning an auction.  If you lose the lead, you lose the
25 points. If you win the auction, you keep the points and gain an
additional 75. These numbers are just placeholders, and can be easily
adjusted.

### leaderboard

The leaderboard is sent via `/topics/leaderboard`, and currently
contains the top 10 users by score. The message is of the form:

    [{:user
       {:identifier "jcrossley3",
        :name nil,
        :updated_at "2013-04-23T18:25:49Z",
        :points 0,
        :last_bid_id 4,
        :created_at "2013-04-23T18:25:49Z",
        :profile_pic nil,
        :id 4,
        :platform nil},
       :score 30}
     ....
     {:user
       {:identifier "bbrowning",
        :name nil,
        :updated_at "2013-04-23T18:25:49Z",
        :points 0,
        :last_bid_id 3,
        :created_at "2013-04-23T18:25:49Z",
        :profile_pic nil,
        :id 3,
        :platform nil},
       :score 5}]
     
The leaderboard is currently updated on every bid.

### per-auction stats

Per-auction stats are sent via `/topics/bid-stats`, and are of the
form:

    {:auction_id => 1,
     :number_of_bids => 32,
     :bids_per_user => 0.333,
     :binds_per_second => 1.23233}
     
A bid-stats message is currently sent in response to every bid,
containing stats for the related auction.

### global stats

We're currently tracking a global bid-per-second metric that is
tracked over the last 1, 5, and 15 minutes, but aren't yet publishing
it anywhere. There are probably other global stats we can track if
there is interest.

## Usage

This app needs to run in an Immutant. Since we already have TorqueBox,
the easiest way to get an Immutant is to overlay it onto the existing
TorqueBox. The `bin/` dir contains some scripts to handle the overlay
and ease application lifecycle management.

To overlay, set `$TORQUEBOX_HOME` and then run `bin/overlay`. Once
that completes you can deploy and undeploy the app with `bin/deploy`
and `bin/undeploy`, respectively.

### Debugging

Setting the env var STAT_DEBUG will cause the app to print debugging
messages for each bid & auction processed and each leaderboard
notification sent.

## License

Copyright © 2013 Red Hat, Inc.

What license?
