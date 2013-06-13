# Camel Bridge

This web application uses [Apache Camel](http://camel.apache.org/) to bridge from queues in the [vertx](http://vertx.io/) message bus (using the underlying [hazelcast queue](http://camel.apache.org/hazelcast-component.html)) to the [Apache ActiveMQ](http://activemq.apache.org/) message queue (the [JBoss A-MQ](http://www.jboss.org/jbossamq) distribution).

Then the camel route bridges from ActiveMQ queues to [TorqueBox]() own STOMP server.

Finally the web application includes the [hawtio](http://hawt.io/) console so that you can easily visualise the camel routes and their behaviour, browse the queues, send messsages, view the logs and see the metrics.

## Running the code

Try the following

    cd fuse/camel-bridge
    mvn jetty:run

Then open [http://localhost:8080/hawtio/](http://localhost:8080/hawtio/) to see how things are performing.

For example:

* [see the vertx-to-ActiveMQ bridge](http://localhost:8080/hawtio/#/fuse/routes?tab=integration&nid=root-org.apache.camel-localhost%2Fcamel-1-routes-%22vertx-to-AMQ%22) statistics
* [browse the audit message queue](http://localhost:8080/fuse/#/activemq/browseQueue?tab=messaging&nid=root-org.apache.activemq-Broker-broker1-Queue-audit.bids)
* [logs](http://localhost:8080/fuse/#/logs)

## Other options for running things

    cd fuse/camel-bridge
    mvn install

Now copy the WAR into EWS or EAP.


## How to switch out ActiveMQ stomp server and switch in TorqueBox

Either change the host/port [here](https://github.com/projectodd/keynote-demo-2013/blob/master/fuse/camel-bridge/src/main/webapp/WEB-INF/applicationContext.xml#L43) or we could [disable the ActiveMQ stomp connector](https://github.com/projectodd/keynote-demo-2013/blob/master/fuse/camel-bridge/src/main/webapp/WEB-INF/applicationContext.xml#L63) by commenting out this line

    <transportConnector uri="stomp://localhost:31316"/>

then running the TorqueBox stomp server on the same host & port.

## How to switch out the vertx simulator

Comment out / delete the [simulateBids camel route](https://github.com/projectodd/keynote-demo-2013/blob/master/fuse/camel-bridge/src/main/webapp/WEB-INF/applicationContext.xml#L26) then run vertx to connect to the same hazelcast.

(We may need to tinker a little with the hazelcast configs to make sure they connect to the same hazelcast cluster etc?)

Worst case we may have to create a camel component for vertx if native hazelcast doesn't work to connect vertx <-> camel.