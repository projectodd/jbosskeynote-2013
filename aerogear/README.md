The client is broken into 2 parts:

### client/

This is the webapp.

Only need to build when going into production or keeping cordova insync

To build, have yeoman and grunt installed,( and node )

    npm install -g yo grunt-cli bower //to install yeoman and such

    npm install //to install the dependecies of the app

    grunt //builds

Since Vert.x is serving the client

    var filename = './../aerogear/client/app/' + basename;

should change to

    var filename = './../aerogear/client/dist/' + basename;

when deployed into production

### cordova/

This is the "native" version

The grunt build on the webapp side executes a copy command to keep everything 'nsync.

we use the cordova-cli to the platforms insync here

    cordova prepare ios android

To setup the cluster that is Facebook,  check this tutorial

https://github.com/phonegap/phonegap-facebook-plugin#add-the-facebook-ios-and-javascript-sdk

specifically the part about adding the Facebook iOS and JavaScript SDK,  the other parts,  adding the cordova plugin should be done already





