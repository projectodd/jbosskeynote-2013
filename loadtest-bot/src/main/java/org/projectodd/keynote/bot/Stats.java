package org.projectodd.keynote.bot;

import com.codahale.metrics.*;
import org.vertx.java.core.*;
import org.vertx.java.core.http.*;
import org.vertx.java.core.logging.Logger; 
import org.vertx.java.core.logging.impl.LoggerFactory;

public class Stats {

    public static final Stats INSTANCE = new Stats();
    
    public void init(Vertx vertx) {
        this.vertx = vertx;
        vertx.setPeriodic(5000, new Handler<Long>() {
                public void handle(Long l) {
                    log.info(String.format("%f/%f/%f", meter().getFiveMinuteRate(), 
                                           timer().getMeanRate(), 
                                           timer().getOneMinuteRate()));
                }
            });
    }

    public Timer.Context requestTimer() {
        meter().mark();
        return timer().time();
    }

    public void markRequest() {
        meter().mark();
    }

    private Timer timer() {
        return metrics.timer("requests");
    }

    private Meter meter() {
        return metrics.meter("requests-per-sec");
    }

    private MetricRegistry metrics = new MetricRegistry();
    private Vertx vertx;
    private static final Logger log = LoggerFactory.getLogger(Bidder.class);
}
