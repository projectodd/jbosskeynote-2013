package org.projectodd.keynote.bot;

import java.util.Random;

import org.vertx.java.core.*;
import org.vertx.java.core.http.*;

public class Config {
    private static String _clientId = Integer.toHexString((new Random()).nextInt());

    public static String remoteHost() {
        String host = System.getProperty("remote.vertx.host");
        if (host != null) 
            return host;

        return "www.jbosskeynote.com";
    }

    public static int remotePort() {
        String port = System.getProperty("remote.vertx.port");
        if (port != null) 
            return Integer.parseInt(port);

        return 443;
    }

    public static HttpClient client(Vertx vertx) {
        HttpClient client = vertx.createHttpClient()
            .setHost(remoteHost())
            .setPort(remotePort())
	    //.setKeepAlive(false)
            .setConnectTimeout(10000);

        if (remotePort() == 443) {
            client.setSSL(true).setTrustAll(true).setVerifyHost(false);
        }

        client.exceptionHandler(new Handler<Exception>() {
                public void handle(Exception e) {
                    e.printStackTrace();
                }
            }); 
       
        return client;
    }

    public static String hostHeader() {
        return remoteHost();
    }

    public static int botCount() {
        String countProp = System.getProperty("bot.count");
        if (countProp != null) 
            return Integer.parseInt(countProp);

        return 100;
    }

    public static String clientId() {
        String id = System.getProperty("client.id");
        if (id != null) 
            return id;
        
        return _clientId;
    }

    public static int startInterval() {
        String ival = System.getProperty("start.interval");
        if (ival != null) 
            return Integer.parseInt(ival);

        return 20;
    }       
}
