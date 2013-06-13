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

//Disable Web Sockets as a test
//window.WebSocket = undefined;

 // Use Backbone's routing instead of jQuery Mobile's
$.mobile.hashListeningEnabled = false;
$.mobile.pushStateEnabled = false;
$.mobile.linkBindingEnabled = false;

$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

var jbw = {
    baseURL: ( typeof cordova !== "undefined" ) ? "http://jbosskeynote.com" : document.location.protocol + "//" + document.location.host,
    //baseURL: "http://192.168.1.11:8000",
    fetchTemplate: function( path, done ) {
        var JST = window.JST = window.JST || {},
            def = new $.Deferred();

        // Should be an instant synchronous way of getting the template, if it
        // exists in the JST object.
        if ( JST[ path ] ) {
            if ( _.isFunction( done ) ) {
                done( JST[ path ] );
            }
            return def.resolve( JST[ path ] );
        }

        $.get( path, function( contents ) {
            JST[ path ] = _.template( contents );

            // Set the global JST cache and return the template
            if ( _.isFunction( done ) ) {
                done( JST[ path ] );
            }

            // Resolve the template deferred
            def.resolve( JST[ path ] );
        }, "text");

          // Ensure a normalized return value (Promise)
        return def.promise();
    },
    currentRoute: function() {
        return Backbone.history.fragment;
    },
    setupNotifiers: function( id ) {
        try{
            jbw.AeroGear.Notifiers.clients.notifications.subscribe([{
                address: "demo.user-notifications." + id,
                callback: personalListener
            },
            {
                address: "demo.auctions",
                callback: auctionListener
            }
            ]);
        } catch( e ) {
            //do nothing?
            console.log( e );
        }
    },
    removeNotifiers: function( id ) {
        try {
            jbw.AeroGear.Notifiers.clients.notifications.unsubscribe([
                {
                    address: "demo.user-notifications." + id,
                    callback: personalListener
                },
                {
                    address: "demo.auctions",
                    callback: auctionListener
                }
            ]);
        } catch( e ) {
            console.log( e );
        }
    },
    getNotiferStateDescription: function() {
        var state = jbw.AeroGear.Notifiers.clients.notifications.getState();
        if( state < 2 ) {
            return "Connected";
        } else {
            return "Disconnected";
        }
    },
    waitingNotification: false,
    currentSocial: "",
    notificationCount: 0,
    countDown: [],
    queuedNotifications: AeroGear.DataManager( "queuedNotifications" ).stores.queuedNotifications, //Queue notifications when the notification panel is open
    personalNotifications: AeroGear.DataManager( "notifications" ).stores.notifications, //A list of all the personal notifications
    points: "0",//should be loaded from the server? initially
    cash: "0", //should be loaded from the server? initially
    myScroll: undefined,
    pullDownEl: 0,
    pullDownOffset: 0
};

var personalListener = function( msg ){
    jbw.AeroGear.Notifiers.trigger( "notifications", { msg: msg } );
};

var auctionListener = function( msg ){
    jbw.AeroGear.Notifiers.trigger( "globalnotifications", { msg: msg } );
};

function init() {

    jbw.mydefereds = [];
    //Load the social sdk's,  This should probably be a promise
    _.each( Object.keys(jbw.AeroGear.Social.socials), function( social, index ) {
        jbw.mydefereds[ index ] = jbw.AeroGear.Social.socials[ social ].loadsdk();
    });

    //Wait until the social sdk's load.  Need to catch errors here too
    $.when.apply( null, jbw.mydefereds ).done(
        function(){

        //First check if they are coming in at specific location,  not the index
        if( window.location.hash.length ) {

            //Not coming in from the index
            //Now lets check to see if they already logged in.  check session storage
            var jbwdemoStore = jbw.AeroGear.DataManagers.stores.mySessionStore;

            if( !jbwdemoStore.read() ) {
                //not logged in and never logged in from here or deleted the entry in session storage
                //make sure we are just going to load the intro page
                window.location.hash = "";
                jbw.Application.start();

            } else {

                if( jbwdemoStore.read().length ) {
                    //They've been here before,  get the type of login they used,
                    jbw.currentSocial = jbwdemoStore.read()[ 0 ].type;

                    //Login with the social they previously used
                    doLoginAndMe( jbw.AeroGear.Social.socials[ jbw.currentSocial ] );
                }
            }
        } else {
            jbw.Application.start();
        }
    });

    //During each page creation,  do this stuff
    //TODO: make this check login status's
    $( "#main" ).on( "pagecreate", function( ) {
        //Do check for login here, no need to get all fancy for the demo.  Probably should check the login status and such
        if( jbw.currentRoute().length ) {
            //Not the intro page
            var jbwdemoStore = jbw.AeroGear.DataManagers.stores.mySessionStore.read("jbwdemo");
            if( !jbwdemoStore.length ) {
                //not logged in
                jbw.Router.navigate( "", { trigger: true, error: true } );
            } else {
                jbw.AeroGear.Social.socials[ jbwdemoStore[0].type ].checkAuth({
                    error: function( response ) {
                        jbw.Router.navigate( "", { trigger: true, error: true } );
                    }
                });
                if( jbw.waitingNotification ) {
                    jbw.AeroGear.Notifiers.trigger( "globalnotifications", { msg: jbw.waitingNotification } );
                    jbw.waitingNotification = false;
                }
            }
        }
    });
}
