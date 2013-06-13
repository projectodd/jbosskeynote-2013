/**
 * JBoss, Home of Professional Open Source
 * Copyright Red Hat, Inc., and individual contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
load('vertx.js');

var server = vertx.createHttpServer();

// global ev...
var eb = vertx.eventBus;
var i = 0;

var channels = [];


// Inspired from Sinatra / Express
var rm = new vertx.RouteMatcher();
// Extract the params from the uri
rm.get('/auctions/:id', function(req) {
  req.response.end("User: " + req.params().user + " ID: " + req.params().id);

  // Publish to the Event bus....
  var json = {"message": req.params().id };
  console.log("Queued message...");
  eb.publish("org.aerogear.messaging.global", json);

});


rm.get('/notifications/:id', function( req ) {
  req.response.end("Test");
  // Publish to the Event bus....
  var json = {name: req.query.replace( "message=", "" ), id: i };
  i++;
  console.log("org.aerogear.messaging.personal." + req.params().id);
  eb.publish("org.aerogear.messaging.personal." + req.params().id, json);

});

rm.put('/notifications/:id', function( req ) {
  req.response.end("Test");
  // Publish to the Event bus....
  req.bodyHandler( function( body ) {
    var json = JSON.parse( body );
    json.id = i++;
    eb.publish("org.aerogear.messaging.personal." + req.params().id, json );
  });
});


rm.put('/points/:id', function(req) {
  req.response.end("Test");

  req.bodyHandler( function( body ) {
    eb.publish("org.aerogear.messaging.moneypoints." + req.params().id, JSON.parse( body ) );
  });
});

rm.get( '/categories', function( req ) {
  console.log( "categories" );
    req.response.sendFile( "./client/app/tempdata/categories.json" );
});

rm.get( "/register/:id", function( req ) {
  console.log( "register time" );
  var user = {
    id: req.params().id,
    channels: [
    "org.aerogear.messaging.moneypoints." + req.params().id,
    "org.aerogear.messaging.global",
    "org.aerogear.messaging.personal." + req.params().id
    ]
  };

  channels.push( user );

  req.response.end( req.params().callback + "(" + JSON.stringify( user ) + ")" );

  eb.publish("org.aerogear.messaging.global.register", user );
} );


rm.get( "/peeps", function( req ) {
  var returnVal = {
    channels: channels
  };
  req.response.end( JSON.stringify( returnVal ) );
} );

// Catch all - serve the index page
rm.getWithRegEx('.*', function(req) {
  //if (req.uri == "/rest") req.response.sendFile("route_match/index.html")
  if (req.uri.indexOf( "testclient" ) > -1 ) {
    console.log( req.path.toString().replace( "/","") );
    req.response.sendFile( req.path.toString().replace( "/","") );
}
  else {
  // meh...
  console.log( req.path );
    req.response.sendFile('client/app/' + req.path);
  }
});

// 'deploy:
server.requestHandler(rm);


// Create a SockJS bridge which lets everything through (be careful!)
vertx.createSockJSServer(server).bridge({prefix: "/eventbus"}, [{}], [{}]);

server.listen(8000, '0.0.0.0');