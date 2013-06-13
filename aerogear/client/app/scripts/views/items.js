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

jbw.Application.Views.ItemsList = Backbone.View.extend({
    template: "./templates/itemsView.html",
    initialize: function() {
        this.itemCollection = new jbw.Application.Collections.Items( [] ),
        this.itemCollection.on( "reset", this.addItemsToList, this );
        this.childViews = [];
        this.render();
    },
    events: {
        "click .auctionitem": "navigateToAuction"
    },
    render: function( done ) {

        var view = this;
        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.html( tmpl( { notificationCount: jbw.notificationCount,
                cash: jbw.cash,
                points: jbw.points } ) );

            view.itemCollection.fetch();

            $( "#main" ).trigger( "pagecreate" );

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    },
    addItemsToList: function( collection ) {
        this.onClose();
        jbw.auctions = collection.models.reverse();
        this.listTemplate = new jbw.Application.Views.ItemListTemplate( { el: "#auctionsList", collection: collection } );
        this.childViews.push( this.listTemplate );
        return this;
    },
    navigateToAuction: function( event ) {
        var itemId = event.currentTarget.id;
        jbw.Router.navigate( "#item/" + itemId, { trigger: true } );
    },
    onClose: function() {
        _( this.childViews ).each( function( view ) {
            view.close();
        });

        return this;
    }
});

jbw.Application.Views.ItemListTemplate = Backbone.View.extend({
    template: "./templates/itemListTemplate.html",
    initialize: function() {
        this.render();
    },
    render: function( done ) {
        var view = this;
        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.html( tmpl( { models: view.collection.models }) );

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    },
    onClose: function() {
        _( this.childViews ).each( function( view ) {
            view.close();
        });

        return this;
    }
});

jbw.Application.Views.ItemBid = Backbone.View.extend({
    template: "./templates/itemBidView.html",
    initialize: function() {
        this.childViews = [];
        this.render();
    },
    render: function( done ) {

        var view = this;
        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.html( tmpl( { notificationCount: jbw.notificationCount,
                cash: jbw.cash,
                points: jbw.points
                } ) );

            $( "#main" ).trigger( "pagecreate" );

            view.updateDetail();

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    },
    updateDetail: function() {
        this.onClose();
        this.detailTemplate = new jbw.Application.Views.ItemBidDetail( { el: "#itemDetailContent", itemId: this.options.item } );
        this.childViews.push( this.detailTemplate );
    },
    onClose: function() {
        _( this.childViews ).each( function( view ) {
            view.close();
        });

        return this;
    }
});

jbw.Application.Views.ItemBidDetail = Backbone.View.extend({
    template: "./templates/itemDetailTemplate.html",
    highestBidder: false,
    initialize: function() {
        this.model = new jbw.Application.Models.Item( { itemId: this.options.itemId } );
        this.listenTo( jbw.Application, "bidAlert", this.addBidAlert );
        this.render();
    },
    events: {
        "submit #bidForm": "submitBid",
        "focus #bid": "bluring"
    },
    render: function() {

        var view = this;

        this.model.fetch({
            success: function() {
                view.updateDetail( true );
            }
        });

        return this;
    },
    updateDetail: function( showAlert ) {
        var view = this;
        $(".auctiontitle span").text( this.model.get( "title" ) );
        jbw.fetchTemplate( view.template, function( tmpl ) {

            console.log( view.model );

            var timeRemaining = view.model.timeRemaining(),
                ended = ( timeRemaining.over || timeRemaining.notstarted ) ? true : false;
            view.highestBidder = view.model.highestBidder( jbw.currentUser.id );

            _.each( jbw.countDown, function( value ) {
                clearTimeout( value );
                jbw.countDown.pop( value );
            });

            view.$el.html( tmpl( { item: view.model, timeRemaining: timeRemaining, "ended": ended ? "hidden" : "", currentBid: view.model.currentBid() }  ) );


            //Really only want to do this on the first load
            if( showAlert ) {
                if( view.highestBidder && ended ) {
                    view.updateAlertUI( "You Won!!!" );
                } else if( view.highestBidder ) {
                    view.updateAlertUI( "You are the highest bidder!!!" );
                }
            }

            $( "#main" ).trigger( "pagecreate" );
        } );
    },
    submitBid: function( event ) {
        event.preventDefault();

        var formData = $( event.target ).serializeObject(),
            cansubmit = false,
            message,
            data;

        $( "#bidwrapper" ).addClass( "hidden" );


        if( $.trim( formData.bid ).length > 0 ) {
            if( formData.bid > this.model.currentBid() ) {
                //still ok
                cansubmit = true;
            } else {
                message = "bid not higher than current high bid";
            }
        } else {
            message = "Bid cannot be empty";
        }
        //TODO: some client side validation first please
        if( cansubmit ) {

            data = {
                auction_id: this.model.get( "id" ),
                user_id: jbw.currentUser.id,
                amount: formData.bid
            };

            $( "#submitting" ).removeClass( "hidden" );

            $.ajax( {
                url: jbw.baseURL + "/bids",
                type: "POST",
                data: JSON.stringify( data ),
                success: function( response ) {
                    console.log( response );
                    $( "#submitting" ).addClass( "hidden" );
                },
                error: function( response ) {
                    console.log( "error" );
                    console.log( response );
                }
            });
        } else {
            //display an error message
            this.updateAlertUI( message );
        }

    },
    addBidAlert: function( message, auctionId, render, global ) {
        //Only render the view if this is the auction we are currently on
        if( render && ( auctionId == this.model.get( "id" ) ) ) {
            var view = this;
            this.model.fetch({
                success: function() {
                    view.updateDetail();
                    view.updateAlertUI( message );
                }
            });
        } else {
            if( global ) {
                this.updateAlertUI( message, auctionId );
            }
        }
    },
    updateAlertUI: function( message, auctionId ) {
        jbw.fetchTemplate( "./templates/bidAlert.html", function( tmpl ) {
                $( "#bidwrapper" ).removeClass( "hidden" ).html( tmpl( { "message": message, "auctionId": auctionId } ) );
                //TODO: fix error that is coming up.  no tolowercase
                if( message.toLowerCase().indexOf( "won" ) > -1 ) {
                    $( ".auction.ui-block-b span" ).text( "Winning Bid:" );
                }
            });
    },
    bluring: function( event ) {
        $( event.target ).val("");
    },
    onClose: function() {
        _( this.childViews ).each( function( view ) {
            view.close();
        });

        return this;
    }
});
