(ns keynote.core
  (:require [metrics.meters :as m]
            [immutant.messaging :as msg]
            [clj-time.core :as time]
            [clj-time.format :as time-format]
            [clojure.core.incubator :refer [dissoc-in]]
            [clojure.walk :refer [postwalk]]))

;; Auction:
;; {:duration 1, :state inprogress, :starting_price 15, :updated_at
;; 2013-04-03T17:33:42Z, :started_at 2013-04-03T17:33:42Z, :ended_at
;; nil, :title Paul McCartney's Death Certificate, :created_at
;; 2013-04-03T17:22:44Z, :id 2, :description Proof of the death of
;; Paul}

;; Bid:
;; {:auction_id 3, :auction {:duration 1, :starting_price 20,
;; :updated_at 2013-04-03T17:35:17Z, :started_at 2013-04-03T17:35:17Z,
;; :ended_at nil, :title Part of Bob Dylan's Talent, :created_at
;; 2013-04-03T17:22:44Z, :id 3, :description Bottle of Dylan's
;; talent}, :updated_at 2013-04-03T17:35:24Z, :user_id 1, :amount 12,
;; :created_at 2013-04-03T17:35:24Z, :user {:created_at
;; 2013-04-03T17:22:44Z, :id 1, :identifier bobmcwhirter, :updated_at
;; 2013-04-03T17:22:44Z}, :id 1, :committed true}


(comment
  ;; the structrure of state
  {:users
   {2
    {:invalid-bids 2,
     :identifier "kbird",
     :valid-bids 1,
     :auctions {10 3},
     :name nil,
     :updated_at "2013-04-29T14:24:53Z",
     :points 31,
     :last_bid_id 2,
     :created_at "2013-04-29T14:24:11Z",
     :profile_pic nil,
     :id 2,
     :platform nil},
    1
    {:invalid-bids 1,
     :identifier "tcrawley",
     :valid-bids 1,
     :auctions {10 2},
     :name nil,
     :updated_at "2013-04-29T14:24:51Z",
     :points 5,
     :last_bid_id 1,
     :created_at "2013-04-29T14:24:11Z",
     :profile_pic nil,
     :id 1,
     :platform nil}},
   :auctions
   {10
    {:duration 1,
     :state "completed",
     :image_key nil,
     :high_bid
     {:amount 12,
      :auction_id 10,
      :committed true,
      :created_at "2013-04-29T14:24:50Z",
      :id 2,
      :updated_at "2013-04-29T14:24:50Z",
      :user_id 2,
      :user
      {:created_at "2013-04-29T14:24:11Z",
       :id 2,
       :identifier "kbird",
       :name nil,
       :platform nil,
       :points 32,
       :profile_pic nil,
       :updated_at "2013-04-29T14:24:57Z"}},
     :starting_price 5,
     :updated_at "2013-04-29T14:25:39Z",
     :started_at "2013-04-29T14:24:37Z",
     :highest-bidder 2,
     :ended_at "2013-04-29T14:25:38Z",
     :title "Bono's Glasses",
     :created_at "2013-04-29T14:24:11Z",
     :highest-bid 12,
     :completed true,
     :id 10,
     :description nil}}} )

;; TODO:
;; - report global stats (bps, # users, # new users/sec?)


(defonce state (atom {}))

(def global-bids-per-second (m/meter "bids" "bids"))

(def invalid-bid-points 1)
(def valid-bid-points   5)
(def lead-points        25)
(def win-points         100)

(defn log [msg & args]
  (when (System/getenv "STAT_DEBUG")
    (println
     (str "stat-server: "
          (apply format msg args)))))

(defn new-auction [id]
  {:id id
   :highest-bid 0})

(defn get-auction
  [m id]
  (or (get-in m [:auctions id])
      (new-auction id)))

(defn auctionname [m id]
  (:title (get-auction m id)))

(defn new-user
  [id]
  {:id id
   :auctions {}})

(defn get-user
  [m id]
  (or (get-in m [:users id])
      (new-user id)))

(defn username [m id]
  (:name (get-user m id)))

(defn update-user [m {:keys [user_id user id auction_id valid]} user-data]
  (assoc-in m [:users user_id]
            (cond-> user-data
                    true        (merge user)
                    valid       (assoc :last_bid_id id)
                    valid       (update-in [:valid-bids] (fnil inc 0))
                    (not valid) (update-in [:invalid-bids] (fnil inc 0))
                    true        (update-in [:auctions auction_id] (fnil inc 0)))))

(defn update-auction [m {user-id :user_id
                         auction-id :auction_id
                         amount :amount} auction]
  (if (> amount (:highest-bid auction))
    (assoc-in m [:auctions auction-id]
              (assoc auction
                :highest-bidder user-id
                :highest-bid amount))
    m))

(defn update
  [m {:keys [valid auction_id user_id] :as bid}]
  (let [auction (get-auction m auction_id)
        user (get-user m user_id)]
    (cond-> m
            true  (update-user bid user)
            valid (update-auction bid auction))))

(defn get-highest-bidder [m auction-id]
  (:highest-bidder (get-auction m auction-id)))

(defn calculate-score [m user-id]
  (let [{:keys [valid-bids invalid-bids]} (get-user m user-id)]
    (+ ((fnil * 0) valid-bids valid-bid-points)
       ((fnil * 0) invalid-bids invalid-bid-points)
       (reduce
        (fn [acc auction-id]
          (+ acc
             (if (= user-id (get-highest-bidder m auction-id))
               (if (= "completed" (get-in m [:auctions auction-id :state]))
                 win-points
                 lead-points)
               0)))
        0
        (->> user-id (get-user m) :auctions keys)))))

(defn calculate-leaderboard
  [m]
  (->> m
       :users
       vals
       (map (fn [{:keys [id] :as user}]
              {:user (dissoc user :auctions)
               :score (calculate-score m id)}))
       (sort-by :score)
       reverse
       (take 10)))

(defn events-per-second [c start end]
  (let [start (or (time-format/parse start) (time/now))
        end (or (time-format/parse end) (time/now))
        secs (time/in-secs (time/interval start end))
        secs (if (= 0 secs) 1 secs)]
    (double (/ c secs))))

(defn calculate-bid-stats [m auction-id]
  (let [bids (reduce (fn [sum u]
                       ((fnil + 0) (get-in u [:auctions auction-id]) sum))
                     0
                     (vals (:users m)))
        auction (get-in m [:auctions auction-id])
        user-count (count (:users m))
        user-count (if (> user-count 0) user-count 1)]
    {:auction_id auction-id
     :number_of_bids bids
     :bids_per_user (double (/ bids user-count))
     :bids_per_second (events-per-second bids
                                         (:started_at auction)
                                         (:ended_at auction))}))

(defn clear-auction [m id]
  (postwalk
   #(if (:auctions %)
      (clojure.core.incubator/dissoc-in % [:auctions id]) %)
   m))

(let [prior-leaderboard (atom nil)]
  (defn notify-leaderboard [m]
    (let [board (calculate-leaderboard m)]
      (when (and (not= board @prior-leaderboard)
                 (seq board))
        (log "notifying leader board - scores: %s"
             (mapv :score board))
        (msg/publish "/topics/leaderboard" board))
      (reset! prior-leaderboard board))))

(defn notify-score [m user-id]
  (let [m {:user_id user-id
           :score (calculate-score m user-id)}]
    #_(log "notifying score for %s (%s) score: %s"
           user-id
           (username @state user-id)
           (:score m))

    (msg/publish "/topics/scores" m)))

(defn notify-bid-stats [m auction-id]
  (let [stats (calculate-bid-stats m auction-id)]
    #_(log "notifying bid stats for %s (%s)"
           auction-id
           (auctionname m auction-id))

    (msg/publish "/topics/bid-stats" stats)))

(defn bid-listener
  [{:keys [id auction_id user_id amount valid] :as bid}]
  (log "processing bid %s - auction: %s (%s) user: %s (%s) amount: %s valid: %s"
       id
       auction_id
       (auctionname @state auction_id)
       user_id
       (-> bid :user :name)
       amount
       valid)

  (let [bid (if (string? amount)
              (update-in bid [:amount] read-string)
              bid)
        prior-bidder (get-highest-bidder @state auction_id)]
    (swap! state update bid)
    (m/mark! global-bids-per-second)
    (future (notify-score @state user_id))
    (if (and prior-bidder
             (not= prior-bidder (get-highest-bidder @state auction_id)))
      (future (notify-score @state prior-bidder)))
    (future (notify-bid-stats @state auction_id))))

(defn auction-listener
  [{:keys [id] :as auction}]
  (log "processing auction %s (%s) - state: %s high_bidder: %s (%s) bid_amount: %s"
       id
       (:title auction)
       (:state auction)
       (-> auction :high_bid :user_id)
       (username @state (-> auction :high_bid :user_id))
       (-> auction :high_bid :amount))

  (swap! state
         update-in [:auctions id]
         #(merge (or % (new-auction id)) auction))
  (condp = (:state auction)
    "pending" (do
                ;; reset bid stats for testing
                (swap! state clear-auction id)
                (notify-bid-stats @state id))
    "completed" (do
                  (notify-leaderboard @state)
                  (notify-score @state (-> auction :high_bid :user_id)))
    :ignore))

(defn control-listener [{:keys [action]}]
  (condp = action
    "reset" (do
              (println "RESET received")
              (reset! state {}))
    :do-nothing))
