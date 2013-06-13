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

var notifier = AeroGear.Notifier({
    name: "stompClient",
    settings: {
        connectURL: window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + "/eventbus",
        onConnect: function() {
            console.log('Connected');
        },
        onDisconnect: function() {
            console.log('Disconnected');
        },
        onConnectError: function() {
            console.log('Connect Error');
        },
        channels:[
            {
                address: "org.aerogear.messaging.global.register",
                callback: function( msg ){
                    addPeopleToList( msg );
                }
            }
        ]
    }
});

var pipeline = AeroGear.Pipeline([
    {
        name: "peeps",
        settings: {
            baseURL: "http://localhost:8080/"
        }
    },
    {
        name: "auctions",
        settings: {
            baseURL: "http://localhost:8080/"
        }
    },
    {
        name: "notifications",
        settings: {
            baseURL: "http://localhost:8080/"
        }
    },
    {
        name: "points",
        settings: {
            baseURL: "http://localhost:8080/"
        }
    }
]);

var datamanager = AeroGear.DataManager([ "peeps" ]);

function channelCallback( msg ) {
    $("#listview").append("<li data-icon='delete' data-theme='" + msg.theme + "'><a href='#'>" + msg.text + "</a></li>").listview("refresh");
}

function loadRegisteredPeople() {
    pipeline.pipes.peeps.read({
        success: function( data ) {
            var tempListView = $( "#peopleList" );
            datamanager.stores.peeps.save( data.channels );
            $.each( data.channels, function( index ) {
                tempListView.append( "<li>" + this.id + "</li>" );
            } );

            tempListView.listview( "refresh" );
        },
        error: function( data ){
            console.log(data);
        }
    });
}

function addPeopleToList( user ) {
    datamanager.stores.peeps.save( user );
    $( "#peopleList" ).append( "<li>" + user.id + "</li>" ).listview( "refresh" );
}

$( function() {
    loadRegisteredPeople();
} );

$( "#peopleList" ).on( "click", "li", function( event ) {
    var $this = $( this ),
        values = datamanager.stores.peeps.read( $this.text() )[ 0 ];
        $("#listview").empty();
    $.each( values.channels, function() {
        $("#listview").append("<li data-icon='delete' id="+this+">" +  this + "</li>").listview("refresh");
    } );
});

$( "#globalsubmit" ).on( "click", function( event ) {
    //send a global notification
    var message = $( "#globalmessage" ).val();

    pipeline.pipes.auctions.read( { id: message } );

});

$( "#personalsubmit" ).on( "click", function( event ) {
    var message = $( "#personalmessage" ).val(),
        pin = $("li[id^='org.aerogear.messaging.personal']").text().replace( "org.aerogear.messaging.personal.", "" );

        pipeline.pipes.notifications.save( { id: pin , "message": message } );

});

$( "#personalpointssubmit" ).on( "click", function( event ) {
    var points = $( "#personalpoints" ).val(),
        money = $( "#personalmoney" ).val();
        pin = $("li[id^='org.aerogear.messaging.moneypoints']").text().replace( "org.aerogear.messaging.moneypoints.", "" );
    pipeline.pipes.points.save( { "points": points, "money": money, id: pin } );
});

// Subscribe to Channel
$( "#channel-list" ).on( "click", ".add", function( event ) {
    var $this = $( this ),
        addCount = $("#available-channels .ui-li-count"),
        subCount = $("#subscribed-channels .ui-li-count");

    notifier.clients.stompClient.subscribe({
        address: $.trim( $this.text() ),
        callback: channelCallback
    });
    $this
        .toggleClass("add remove")
        .buttonMarkup({ icon: "delete"})
        .insertBefore("#available-channels");
    addCount.text( +addCount.text() - 1 );
    subCount.text( +subCount.text() + 1 );
    $("#channel-list").listview("refresh");
});

// Unsubscribe from Channel
$( "#channel-list" ).on( "click", ".remove", function( event ) {
    var $this = $( this ),
        addCount = $("#available-channels .ui-li-count"),
        subCount = $("#subscribed-channels .ui-li-count");

    notifier.clients.stompClient.unsubscribe({
        address: $.trim( $this.text() ),
        callback: channelCallback
    });
    $this
        .toggleClass("add remove")
        .buttonMarkup({ icon: "plus"})
        .appendTo("#channel-list");
    addCount.text( +addCount.text() + 1 );
    subCount.text( +subCount.text() - 1 );
    $("#channel-list").listview("refresh");
});
