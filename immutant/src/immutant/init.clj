(ns immutant.init
  (:require [immutant.messaging :as msg]
            [immutant.jobs :as job]
            [keynote.core :as core]))

(msg/start "/queues/all-bids" :durable false)
(msg/start "/topics/auctions")
(msg/start "/topics/bid-stats")
(msg/start "/topics/scores")
(msg/start "/topics/leaderboard")
(msg/start "/topics/control")

(msg/listen "/queues/all-bids" #'keynote.core/bid-listener :concurrency 16)
(msg/listen "/topics/auctions" #'keynote.core/auction-listener)
(msg/listen "/topics/control"  #'keynote.core/control-listener)

(job/schedule :leaderboard #(core/notify-leaderboard @core/state) :every 1000)
(job/schedule :bid-stats
              (fn []
                (doseq [auction-id (-> @core/state :auctions keys)]
                  (core/notify-bid-stats @core/state auction-id)))
              :every 5000)

 ;; (msg/listen "/topics/leaderboard" (fn [m]
 ;;                                     (println "LEADERBOARD")
 ;;                                     (clojure.pprint/pprint m)))

