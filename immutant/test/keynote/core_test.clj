(ns keynote.core-test
  (:use keynote.core
        clojure.test)
  (:require [metrics.meters :as m]
            [clj-time.core :as time]))

(deftest valid-bid-should-create-user
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})]
    (is (= 1 (count (:users state))))
    (is (= 1 (get-in state [:users "jim" :auctions 42])))
    (is (= 1 (get-in state [:users "jim" :valid-bids])))
    (is (nil? (get-in state [:users "jim" :invalid-bids])))))

(deftest invalid-bid-should-create-user
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid false})]
    (is (= 1 (count (:users state))))
    (is (= 1 (get-in state [:users "jim" :auctions 42])))
    (is (= 1 (get-in state [:users "jim" :invalid-bids])))
    (is (nil? (get-in state [:users "jim" :valid-bids])))))

(deftest valid-bid-should-create-an-auction
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})]
    (is (= 1 (count (:auctions state))))
    (is (= "jim" (get-in state [:auctions 42 :highest-bidder])))
    (is (= 100 (get-in state [:auctions 42 :highest-bid])))))

(deftest invalid-bid-should-not-create-an-auction
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid false})]
    (is (= 0 (count (:auctions state))))))

(deftest low-bid-should-not-displace-high-bid
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "toby" :auction_id 42 :amount 10 :valid true})]
    (is (= 2 (count (:users state))))
    (is (= 1 (count (:auctions state))))
    (is (= "jim" (get-in state [:auctions 42 :highest-bidder])))
    (is (= 100 (get-in state [:auctions 42 :highest-bid])))))

(deftest invalid-bid-should-not-displace-high-bid
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "toby" :auction_id 42 :amount 110 :valid false})]
    (is (= 2 (count (:users state))))
    (is (= 1 (count (:auctions state))))
    (is (= "jim" (get-in state [:auctions 42 :highest-bidder])))
    (is (= 100 (get-in state [:auctions 42 :highest-bid])))))

(deftest calculate-score-with-one-bidder
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})]
    (is (= (+ valid-bid-points lead-points)
           (calculate-score state "jim")))))

(deftest calculate-score-with-one-bidder-including-invalid-bids
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "jim" :auction_id 42 :amount 100 :valid false})]
    (is (= (+ valid-bid-points lead-points invalid-bid-points)
           (calculate-score state "jim")))))

(deftest calculate-score-with-two-bidders-on-same-auction
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "toby" :auction_id 42 :amount 101 :valid true})]
    (is (= valid-bid-points (calculate-score state "jim")))
    (is (= (+ valid-bid-points lead-points)
           (calculate-score state "toby")))))

(deftest calculate-score-with-two-auctions
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "toby" :auction_id 43 :amount 101 :valid true})]
    (is (= (+ valid-bid-points lead-points)
           (calculate-score state "jim")))
    (is (= (+ valid-bid-points lead-points)
           (calculate-score state "toby")))))

(deftest calculate-score-should-include-winners-bonus
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (assoc-in state [:auctions 42 :state] "completed")]
    (is (= (+ valid-bid-points win-points)
           (calculate-score state "jim")))))

(deftest calculate-leaderboard-should-work-with-one-user
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :id 1 :valid true})]
    (is (= [{:user {:id "jim" :last_bid_id 1 :valid-bids 1} :score (+ valid-bid-points lead-points)}]
           (calculate-leaderboard state)))))

(deftest calculate-leaderboard-should-include-invalid-bids
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :id 1 :valid true})
        state (update state {:user_id "jim" :auction_id 42 :amount 100 :id 2 :valid false})]
    (is (= [{:user {:id "jim" :last_bid_id 1 :valid-bids 1 :invalid-bids 1} :score
             (+ invalid-bid-points valid-bid-points lead-points)}]
           (calculate-leaderboard state)))))

(deftest calculate-leaderboard-should-work-with-two-users
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :id 1 :valid true})
        state (update state {:user_id "jim" :auction_id 43 :amount 100 :id 2 :valid true})
        state (update state {:user_id "toby" :auction_id 43 :amount 200 :id 3 :valid true})]
    (is (= [{:user {:id "jim" :last_bid_id 2 :valid-bids 2}
             :score (+ valid-bid-points valid-bid-points lead-points)}
            {:user {:id "toby" :last_bid_id 3 :valid-bids 1}
             :score (+ valid-bid-points lead-points)}]
           (calculate-leaderboard state)))))

(deftest calculate-bid-stats-should-work 
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        stats (calculate-bid-stats state 42)]
    (is (= 42 (:auction_id stats)))
    (is (= 1 (:number_of_bids stats)))
    (is (= 1.0 (:bids_per_second stats)))
    (is (= 1.0 (:bids_per_user stats)))))

(deftest calculate-bid-stats-should-include-invalid-bids
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100 :valid true})
        state (update state {:user_id "jim" :auction_id 42 :amount 100 :valid false})
        stats (calculate-bid-stats state 42)]
    (is (= 42 (:auction_id stats)))
    (is (= 2 (:number_of_bids stats)))
    (is (= 2.0 (:bids_per_second stats)))
    (is (= 2.0 (:bids_per_user stats)))))

(deftest calculate-bid-stats-should-be-limited-to-the-requested-auction 
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100})
        state (update state {:user_id "jim" :auction_id 43 :amount 100})
        stats (calculate-bid-stats state 42)]
    (is (= 42 (:auction_id stats)))
    (is (= 1 (:number_of_bids stats)))
    (is (= 1.0 (:bids_per_second stats)))
    (is (= 1.0 (:bids_per_user stats)))))

(deftest calculate-bid-stats-should-include-other-users
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100})
        state (update state {:user_id "toby" :auction_id 42 :amount 100})
        state (update state {:user_id "toby" :auction_id 42 :amount 101})
        stats (calculate-bid-stats state 42)]
    (is (= 42 (:auction_id stats)))
    (is (= 3 (:number_of_bids stats)))
    (is (= 3.0 (:bids_per_second stats)))
    (is (= 1.5 (:bids_per_user stats)))))

(deftest bids-per-second-should-be-property-calculated-with-a-start-time
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100})
        state (assoc-in state [:auctions 42 :started_at] (str (time/now)))
        stats (calculate-bid-stats state 42)]
    (is (= 1.0 (:bids_per_second stats)))))

(deftest bids-per-second-should-be-property-calculated-with-a-start-time-and-end-time
  (let [state (update {} {:user_id "jim" :auction_id 42 :amount 100})
        state (assoc-in state [:auctions 42 :started_at] (str (time/now)))
        state (assoc-in state [:auctions 42 :ended_at] (str (time/plus (time/now) (time/secs 2))))
        stats (calculate-bid-stats state 42)]
    (is (= 0.5 (:bids_per_second stats)))))

(deftest clear-auction-should-remove-auction-from-user-stats
  (let [m {:users {1 {:auctions {1 1 2 2}}}}]
    (is (= {:users {1 {:auctions {2 2}}}}
           (clear-auction m 1)))))

(deftest clear-auction-should-remove-auction-from-all-user-stats
  (let [m {:users
           {1 {:auctions {1 1 2 2}}
            2 {:auctions {1 1 3 3}}}}]
    (is (= {:users {1 {:auctions {2 2}}
                    2 {:auctions {3 3}}}}
           (clear-auction m 1)))))
