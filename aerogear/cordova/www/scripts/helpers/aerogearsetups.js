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

jbw.AeroGear = {
    Notifiers: _.extend( {}, Backbone.Events ),
    DataManagers: _.extend( {}, Backbone.Events ),
    Social: _.extend( {}, Backbone.Events )
};

//Create the Social Login stuff
jbw.AeroGear.Social = AeroGear.Social();

jbw.AeroGear.Social.add([
    {
        name: "facebook",
        type: ( typeof cordova !== "undefined" ) ? "CDVfacebook" : "facebook",
        settings: {
            clientId: "153946471432035",
            //clientId: "370463866405285",
            scopes: "email",
            channelFile: jbw.baseURL + "/channel.html"
        }
    },
    {
        name: "gplus",
        type: ( typeof cordova !== "undefined" ) ? "CDVgplus" : "gplus",
        settings: {
            clientId: "506431496057.apps.googleusercontent.com",
            scopes: "https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.profile"
        }
    }
]);

jbw.AeroGear.DataManagers = AeroGear.DataManager([{
        name: "mySessionStore",
        type: "SessionLocal"
    }]);

function notifierConnect() {
    console.log( "connected" );
    //remove spinner icon
    $( "#connectionState" ).attr( { "data-icon": "green-circle" } );
    $( "#connectionState .ui-icon" ).removeClass( "ui-icon-red-circle" ).removeClass( "ui-icon-spinner" ).addClass( "ui-icon-green-circle" );
    $( "#connectionState a span" ).text( "Connected" );
}

function notifierDisconnect() {
    console.log( "disconnected" );
    setTimeout(reconnect( jbw.AeroGear.Notifiers.clients.notifications ), 2000);
    //remove spinner icon
    $( "#connectionState" ).attr( { "data-icon": "red-circle" } );
    $( "#connectionState .ui-icon" ).removeClass( "ui-icon-green-circle" ).removeClass( "ui-icon-spinner" ).addClass( "ui-icon-red-circle" );
    $( "#connectionState a span" ).text( "Disconnected" );
}

function notifierConnectError() {
    console.log( "Connect Error" );
    setTimeout(reconnect( jbw.AeroGear.Notifiers.clients.notifications ), 2000);
    //remove spinner icon
    $( "#connectionState a span" ).text( "Error" );
}

function reconnect( notifier ) {
    //add a spinner to the icon
    $( "#connectionState .ui-icon" ).removeClass( "ui-icon-red-circle" ).removeClass( "ui-icon-green-circle" ).addClass( "ui-icon-spinner" );
    notifier.connect({
        onConnect: notifierConnect,
        onDisconnect: notifierDisconnect,
        onConnectError: notifierConnectError
    });
}

//Create the Notifier, and subscribe to the channels, How to do personal notifications?  Server side?
jbw.AeroGear.Notifiers = _.extend( AeroGear.Notifier({
    name: "notifications",
    settings: {
        connectURL:  jbw.baseURL + "/eventbus",
        autoConnect: true,
        onConnect: notifierConnect,
        onDisconnect: notifierDisconnect,
        onConnectError: notifierConnectError
    }
}), Backbone.Events);
