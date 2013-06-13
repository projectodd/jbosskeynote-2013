(defproject keynote "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/core.incubator "0.1.2"]
                 [metrics-clojure "1.0.1"]
                 [clj-time "0.5.0"]]
  :immutant {:nrepl-port 0}
  :profiles {:provided
             {:dependencies
              [[org.immutant/immutant-messaging "0.9.0"]]}})
