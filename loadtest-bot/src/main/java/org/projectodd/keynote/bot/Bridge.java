package org.projectodd.keynote.bot;

import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.*;

public interface Bridge {

    public void send(String address, JsonObject msg, Handler callback);

    public void publish(String address, JsonObject msg, Handler callback);

    public void register(String address);

    public void register(String address, String alias);

    public Bridge init(Handler callback);
    
    public void shutdown();
}
