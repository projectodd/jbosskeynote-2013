/**
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.vertx.core.camel;

import org.apache.camel.Endpoint;
import org.apache.camel.impl.DefaultComponent;
import org.vertx.java.core.Vertx;

import java.util.Map;

/**
 * A Camel Component for <a href="http://vertx.io/">vert.x</a>
 */
public class VertxComponent extends DefaultComponent {
    private Vertx vertx;
    private String host = "127.0.0.1";
    private int port = 5701;

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public Vertx getVertx() {
        if (vertx == null) {
            // lets using a host / port if a host name is specified
            if (host != null && host.length() > 0) {
                vertx = Vertx.newVertx(port, host);
            } else {
                vertx = Vertx.newVertx();
            }
        }
        return vertx;
    }

    public void setVertx(Vertx vertx) {
        this.vertx = vertx;
    }

    protected Endpoint createEndpoint(String uri, String remaining, Map<String, Object> parameters) throws Exception {
        // lazily create vertx
        getVertx();
        return new VertxEndpoint(uri, this, remaining);
    }
}
