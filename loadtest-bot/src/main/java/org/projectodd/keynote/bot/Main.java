package org.projectodd.keynote.bot;

import org.vertx.java.core.*;
import java.util.*;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

public class Main {

    private static final Logger log = LoggerFactory.getLogger(Main.class);

    public static void main(String... args) throws InterruptedException {
        Main main = new Main();
    }

    public Main() {
        AuctionManager auctions = new AuctionManager();
        
        Vertx vertx = Vertx.newVertx();
        Stats.INSTANCE.init(vertx);

        List<Bidder> bidders = new ArrayList<Bidder>();
        for (int i = 0; i < Config.botCount(); ++i) {
            bidders.add(new Bidder(vertx, auctions,
                                   new PollingBridge(vertx,
                                                     Config.remoteHost(),
                                                     Config.remotePort(),
                                                     "/eventbus",
                                                     i)));
        }
        
        while(true) {
            try {
                Thread.sleep(1000);
            } catch (Exception ignored) {}
        }
    }

}
