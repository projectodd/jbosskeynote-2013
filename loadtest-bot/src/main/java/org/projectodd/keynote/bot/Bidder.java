package org.projectodd.keynote.bot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;

import org.vertx.java.core.*;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpClient;
import org.vertx.java.core.http.HttpClientRequest;
import org.vertx.java.core.http.HttpClientResponse;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger; 
import org.vertx.java.core.logging.impl.LoggerFactory;
import com.codahale.metrics.Timer;

public class Bidder {
    private static final Logger log = LoggerFactory.getLogger(Bidder.class);

    private final class BidderHandler implements Handler<Long> {
        @Override
        public void handle(Long event) {
            placeBids();
        }
    }

    private static AtomicInteger counter = new AtomicInteger();

    private Vertx vertx;
    private String name;
    private String id;
    private int balance;
    private AuctionManager auctions;
    private BidderHandler bidderHandler = new BidderHandler();
    private Random random;
    private Bridge bridge;
    private boolean active = true;

    public Bidder(final Vertx vertx, AuctionManager auctions,
                  final Bridge bridge) {
        this.vertx = vertx;
        this.auctions = auctions;

        final int num = counter.incrementAndGet();
        this.name = Namer.INSTANCE.getName();
        this.id = "robot-" + Config.clientId() + "-" + num;

        this.bridge = bridge;

        this.random = new Random(System.currentTimeMillis() + this.hashCode());

        vertx.setTimer(this.random.nextInt(Config.startInterval()) * 1000,
                       new Handler<Long>() {
                           public void handle(Long l) {
                               
                               bridge.init(new Handler<Bridge>() {
                                       public void handle(Bridge bridge) {
                                           bridge.register("demo.user-notifications." + id);

                                           vertx.eventBus().registerHandler("demo.user-notifications." + id, new Handler<Message<?>>() {
                                                   public void handle(Message<?> message) {
                                                       onUserNotification(message);
                                                   }
                                               });

                                           String aliasedAuctions = "demo.auctions." + id;
                                           bridge.register("demo.auctions", aliasedAuctions);

                                           vertx.eventBus().registerHandler(aliasedAuctions, new Handler<Message<?>>() {
                                                   public void handle(Message<?> message) {
                                                       onAuctionNotification(message);
                                                   }
                                               });

                                           bridge.publish("demo.user-registration", createUserRegistrationMessage(), null);

                                           loadAuctions();
                                       }
                                   });
                           }
                       });
    }

    private void loadAuctions() {
        final HttpClient client = Config.client(this.vertx);
        
        final Timer.Context timer = Stats.INSTANCE.requestTimer();
        HttpClientRequest request = client.request("GET", "/auctions", new Handler<HttpClientResponse>() {
                public void handle(HttpClientResponse response) {
                    timer.stop();
                    onAuctions(response);
                }
            });
        request
            .putHeader("Host", Config.hostHeader())
            .end();
    }

    private void onAuctions(HttpClientResponse response) {
        response.bodyHandler(new Handler<Buffer>() {
                @Override
                public void handle(Buffer buffer) {
                    if (Bidder.this.id.equals("robot-" + Config.clientId() + "-1")) {
                        JsonArray auctions = new JsonArray(buffer.toString());
                        Iterator<Object> iter = auctions.iterator();
                        while (iter.hasNext()) {
                            JsonObject data = (JsonObject) iter.next();
                            Auction auction = new Auction(data.getInteger("id"), data.getString("title"));
                            int currentBid = 0;
                            JsonObject highBid = data.getObject("high_bid");
                            if (highBid != null) {
                                currentBid = highBid.getInteger("amount");
                            } else {
                                currentBid = data.getInteger("starting_price");
                            }
                            auction.setCurrentBid(currentBid);
                            auction.setState(data.getString("state"));
                            Bidder.this.auctions.add(auction);
                        }
                    }
                    log.info( Bidder.this.name + " (" + Bidder.this.id + ") is ready to bid" );
                    setupBidTimer();
                }
            });
    }

    private void setupBidTimer() {
        if (this.active) {
            int delay = 10000 + random.nextInt(10000);
            vertx.setTimer(delay, Bidder.this.bidderHandler);
        }
    }

    private JsonObject createUserRegistrationMessage() {
        JsonObject message = new JsonObject();
        message.putString("identifier", this.id);
        message.putString("name", this.name);
        message.putString( "profile_pic_url", "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/Bender_Rodriguez.png/220px-Bender_Rodriguez.png");
        return message;
    }

    public String getName() {
        return this.name;
    }

    private void onUserNotification(Message<?> message) {
        JsonObject body = (JsonObject) message.body;
        String type = body.getString("type");
        if (type.equals("balance")) {
            this.balance = body.getInteger("balance");
            log.debug(this.id + " - balance: " + this.balance + ", points: " + body.getInteger("points"));
        } else if (type.equals("reject")) {
            auctions.setCurrentBid(body.getInteger("auction_id"), body.getInteger("current_high_bid"));
            log.debug(this.id + " - reject: " + body.getInteger("auction_id"));
        }
    }

    private void onAuctionNotification(Message<?> message) {
        JsonObject data = (JsonObject) message.body;
        
        if ("shutdown".equals(data.getString("state"))) {
            log.info("bot " + this.id + " shutting down");
            this.active = false;
            this.bridge.shutdown();
        } else {
            this.auctions.setState(data.getInteger("id"), data.getString("state"));
            log.debug(this.id + " - auction: " + data.getInteger("id") + ", " + data.getString("state"));
            JsonObject highBid = data.getObject("high_bid");
            int currentBid = 0;
            if (highBid != null) {
                currentBid = highBid.getInteger("amount");
            } else {
                currentBid = data.getInteger("starting_price");
            }
            this.auctions.setCurrentBid(data.getInteger("id"), currentBid);
        }
    }

    private void placeBids() {
        Auction auction = this.auctions.getRandomInProgressAuction();
        if (auction != null && 
	   this.random.nextInt(10) < 5 &&
           auction.getCurrentBid() < this.balance) {
            log.debug(this.id + " bidding on " + auction.getId());
            placeBid(auction);
        } else {
            log.trace(this.id + " no active auctions");
	    setupBidTimer();
        } 
    }

    private void placeBid(Auction auction) {

        final HttpClient client = Config.client(this.vertx);
        final Timer.Context timer = Stats.INSTANCE.requestTimer();
        HttpClientRequest request = client.request("POST", "/bids", new Handler<HttpClientResponse>() {
                @Override
                public void handle(HttpClientResponse event) {
                    timer.stop();
	            setupBidTimer();	            
                }
            });

        String bid = createBidMessage(auction);
        log.debug(this.id + " - bid: " + bid);
        request
            .putHeader("Content-Length", bid.length())
            .putHeader("host", Config.hostHeader())
            .end(bid);
    }

    private String createBidMessage(Auction auction) {
        JsonObject bid = new JsonObject();

        bid.putNumber("auction_id", auction.getId());
        bid.putString("user_id", this.id);
        bid.putNumber("amount", auction.getCurrentBid() + random.nextInt(3));

        return bid.toString();
    }

}
