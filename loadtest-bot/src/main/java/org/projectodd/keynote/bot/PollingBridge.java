package org.projectodd.keynote.bot;

import java.util.*;

import org.vertx.java.core.*;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.http.*;
import org.vertx.java.core.json.*;
import org.vertx.java.core.sockjs.impl.JsonCodec;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;

import com.codahale.metrics.Timer;

public class PollingBridge implements Bridge {

    static final String SESSIONID = "/042/botulism";
    private static final Logger log = LoggerFactory.getLogger(PollingBridge.class);
    private int connections = 0;
    
    public PollingBridge(Vertx vertx, String host, int port, String path) {
        this(vertx, host, port, path, -1);
    }

    public PollingBridge(Vertx vertx, String host, int port, String path, int sessionSuffix) {
        this.vertx = vertx;
        this.path = path;
        this.sessionId = SESSIONID + Config.clientId() + sessionSuffix;
        this.client = Config.client(vertx);
    }

    public Bridge init(final Handler callback) {
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("host", Config.hostHeader());
        final Timer.Context timer = Stats.INSTANCE.requestTimer();
        this.client.getNow(this.path + "/info", 
                           headers,
                           new Handler<HttpClientResponse>() {
                public void handle(HttpClientResponse r) {
                    timer.stop();
                    for (String c : r.cookies()) {
                        if (c.startsWith("GEAR=")) {
                            PollingBridge.this.gearCookie = c.substring(0, c.indexOf(';'));
                            log.debug("found gear cookie: " + PollingBridge.this.gearCookie);
                            break;
                        }
                        
                    }
                                        
                    r.endHandler(new SimpleHandler() {
                            public void handle() {
                                PollingBridge.this.connect(callback);
                            }
                        });
                }
            });

        return this;
    }

    public void shutdown() {
        this.active = false;
    }

    private void connect(final Handler callback) {
        if (!active) 
            return;

        log.trace("connecting");
        final int connectNum = this.connections++;
        final String path = this.path + this.sessionId + "/xhr";
        final Timer.Context timer = Stats.INSTANCE.requestTimer();
        HttpClientRequest r = this.client
            .post(path,
                  new Handler<HttpClientResponse>() {
                      public void handle(HttpClientResponse r) {
                          timer.stop();
                          log.debug("connect reponse (session " + sessionId + "): " + r.statusCode + " - " + r.statusMessage);
                          if (r.statusCode >= 400) {
                              log.error("connect failed (" + path + "): " + r.statusCode);
                          }
                          r.dataHandler(new Handler<Buffer>() {
                                  public void handle(Buffer data) {
                                      String dataString = data.toString();
                                      log.debug("xhr data: " + dataString.trim());
                                      if (dataString.startsWith("a[")) {
                                          try {
                                              String[] parts = (String[])JsonCodec.decodeValue(dataString.substring(1), String[].class);
                                              JsonObject wrapper = new JsonObject(parts[0]);
                                              publishToAddress(wrapper.getString("address"), wrapper.getObject("body"));
                                          } catch (Exception e) {
                                              e.printStackTrace();
                                          }
                                      }
                                  }
                              });

                          r.exceptionHandler(new Handler<Exception>() {
                                  public void handle(Exception e) {
                                      e.printStackTrace();
                                  }
                              });
                          r.endHandler(new Handler<Void>() {
                                  public void handle(Void v) {
                                      if (callback != null)
                                          callback.handle(PollingBridge.this);
                                      connect(null);
                                  }
                              });
                      }
                  })
            .putHeader("Content-Length", 0)
            .putHeader("Host", Config.hostHeader()); 
                        
        log.trace("Using cookie: " + this.gearCookie);
        if (this.gearCookie != null) {
            r.putHeader("Cookie", this.gearCookie);
        }
        r.end();
    }

    public void send(String address, JsonObject msg, Handler callback) {
        pubOrSend(address, msg, true, callback);
    }

    public void publish(String address, JsonObject msg, Handler callback) {
        pubOrSend(address, msg, false, callback);
    }

    private void pubOrSend(String address, JsonObject body, boolean send, 
                           Handler callback) {
        JsonObject msg = new JsonObject();
        msg.putString("type", send ? "send" : "publish");
        msg.putString("address", address);
        msg.putObject("body", body);
        xhrSend(msg, callback);
    }

    private void xhrSend(final JsonObject msg, final Handler callback) {
        log.trace("xhrSend: " + msg);
        JsonArray arr = new JsonArray();
        arr.addString(msg.encode());
        String msgStr = arr.encode();
        final String path = this.path + this.sessionId + "/xhr_send";
        final Timer.Context timer = Stats.INSTANCE.requestTimer();
        HttpClientRequest r = this.client
            .post(path,
                  new Handler<HttpClientResponse>() {
                      public void handle(HttpClientResponse r) {
                          timer.stop();
                          if (r.statusCode >= 400) 
                              log.error("xhrSend failed (" + path + "): " + r.statusCode);
                          
                          if (callback != null)
                              callback.handle(null);
                          log.trace("xhrSend reponse: " + r.statusCode + " - " + r.statusMessage);
                      }
                  })
            .putHeader("Content-Length", msgStr.length())
            .putHeader("Host", Config.hostHeader());

        log.trace("Using cookie: " + this.gearCookie);
        if (this.gearCookie != null) {
            r.putHeader("Cookie", this.gearCookie);
        }

        r.exceptionHandler(new Handler<Exception>() {
                public void handle(Exception e) {
                    log.error("xhrSend: failed to send " + msg, e);
                }
            });
        r.end(msgStr);
    }

    public void register(String address) {
        register(address, address);
    }

    public void register(String address, String alias) {
        registerAlias(address, alias);
        JsonObject msg = new JsonObject();
        msg.putString("type", "register");
        msg.putString("address", address);
        xhrSend(msg, null);
    }

    private void registerAlias(String address, String alias) {
        Set<String> aliases = addressAliases.get(address);
        if (aliases == null) {
            aliases = new HashSet<String>();
            addressAliases.put(address, aliases);
        }
        aliases.add(alias);
    }

    private void publishToAddress(String address, JsonObject body) {
        EventBus eb = this.vertx.eventBus();
        for (String alias: this.addressAliases.get(address)) {
            log.debug(String.format("Publishing to alias: %s/%s %s", address, alias, body));
            eb.publish(alias, body);
        }
    }

    private Vertx vertx;
    private HttpClient client;
    private String path;
    private String sessionId;
    private String gearCookie;
    private Map<String, Set<String>> addressAliases = new HashMap<String, Set<String>>();
    private boolean active = true;
}
