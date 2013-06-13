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

function startListeners() {
    //Start listening to the notifiers for UI update
    jbw.Application.listenTo( jbw.AeroGear.Notifiers, "notifications", function( event ) {
        var msg = event.msg,
            addNotif = false,
            addCount = false,
            addGlobal = false,
            auctionName;
        console.log( msg );
        switch( msg.type ) {
        case "balance":
            jbw.cash = msg.balance;
            jbw.points = msg.points === null ? 0 : msg.points;
            $( ".cash span" ).text( jbw.cash );
            $( ".points span" ).text( jbw.points );
            break;
        case "reject":
            addNotif = true;
            addCount = true;
            //TODO: better message
            auctionName = getAuctionName( jbw.auctions, msg );
            if( msg.message.indexOf( "out-bid" ) > -1 ) {
                //this means that we were just out bid
                msg.message = "You have been out bid on " + auctionName.get( "title" );
                addGlobal = true;
            }
            break;
        case "accept":
            addNotif = true;
            addCount = true;
            //TODO: better checking
            auctionName = getAuctionName( jbw.auctions, msg );
            msg.message = "Your bid on '" + auctionName.get( "title" ) + "' has been accepted";
            break;
        default:
        }

        msg.id = msg.auction_id;

        shouldSend( addCount, addNotif, jbw.Application.nPanelView.notificationsView.notifications, msg, addGlobal );
    });


    //TODO: need to rework this and clean it up
    //Global Notifications,  Auction start/ended/reset
    //Reset === "pending"
    //Start === "inprogress"
    //Ended === "completed"
    jbw.Application.listenTo( jbw.AeroGear.Notifiers, "globalnotifications", function( event ) {
        console.log( event.msg );
        var msg = event.msg,
            addNotif = false,
            addCount = false;

        switch( msg.state ) {
        case "pending":
            //a reset has happened
            //probably also want to remove any alerts that are still there?
            jbw.Application.trigger( "bidAlert", msg.message, msg.id, true );
            break;
        case "completed":
            //The Auction has completed, there will be a "high_bid" object if someone bid on it,
            //contains a "user" object,  the user who won.
            //Tell people that they won,  or that it's over and they lost?
            if( highBidder( msg, jbw.currentUser ? jbw.currentUser.id : -1  ) ) {
                msg.message =  "You have won " + msg.title + "!";
                jbw.points += msg.high_bid.user.points === null ? 0 : msg.high_bid.user.points;
            } else {
                msg.message =  msg.title + " has sold!";
            }
            addCount = true;
            addNotif = true;
            break;
        case "inprogress":
            //The Auction has started, lets tell the people about it
            msg.message = "A new auction has started for '" + msg.title + "'";
            addNotif = true;
            addCount = true;
            break;
        case "shutdown":
            //logout
            jbw.Application.logout();
            //then GTFO
            window.location.replace( "http://www.redhat.com/summit/" );
            break;
        default:
        }

        shouldSend( addCount, addNotif, jbw.Application.nPanelView.notificationsView.notifications, msg, true );
        updateListUI( msg );
    });


    function shouldSend( addCount, addNotif, personNotificationList, msg, global ) {
        if ( addCount ) { $( ".bubble" ).text( ++jbw.notificationCount ); }
        if( addNotif ) {
            personNotificationList.add( new jbw.Application.Models.Notification( msg ), { "refresh": true } );
            if( global && $("#itemDetailContent").length === 0 ) {
                jbw.fetchTemplate( "./templates/newAuction.html", function( tmpl ) {
                    $( "#alertwrapper" ).removeClass( "hidden" ).html( tmpl( { "message": msg } ) );
                    scrollUp();
                });
            } else {
                jbw.Application.trigger( "bidAlert", msg.message, msg.id, true, global );
                scrollUp();
            }
        }

    }

    function scrollUp() {
        //scroll to the top on the current view
        $( "body" ).animate(
            {
                scrollTop: 0
            }, "slow" );
    }

    function updateListUI( msg ) {
        var item = $(".auctionitem#"+msg.id);

        switch( msg.state ) {
        case "pending":
            item.addClass( "notstarted" );
            item.siblings().removeClass("hidden");
            item.find( ".flag" ).removeClass( "flaghigh flagsold hidden" );
            break;
        case "completed":
            if( highBidder( msg, jbw.currentUser ? jbw.currentUser.id : -1  ) ) {
                item.find( ".flag" ).addClass( "flaghigh" ).removeClass( "flagsold hidden" );
            } else {
                item.find( ".flag" ).addClass( "flagsold" ).removeClass( "flaghigh hidden" );
            }

            item.removeClass( "notstarted" );
            item.siblings().addClass("hidden");
            break;
        case "inprogress":
            item.removeClass( "notstarted" );
            item.siblings().addClass("hidden");
            break;
        default:
        }
    }

    function highBidder( msg, currentUserId ) {
        if( msg.high_bid && msg.high_bid.user.identifier == currentUserId) {
            return true;
        } else {
            return false;
        }
    }

    function getAuctionName( auctions, msg ) {
        return _.find( jbw.auctions, function( auction ) {
            return auction.get( "id" ) === msg.auction_id;
        } );
    }
}
