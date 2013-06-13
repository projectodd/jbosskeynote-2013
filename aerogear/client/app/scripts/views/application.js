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

jbw.Application = new ( Backbone.View.extend({
    Views: {},
    Collections: {},
    Models: {},
    events: {
        "click .panel": "headerClickPanel",
        "click #left-panel a": "navClickLeft",
        "click #right-panel a": "navClickRight",
        "click #login": "login",
        "click .alert": "alertClicked",
        "panelopen": "panelOpen",
        "panelclose": "panelClose",
        "swipeleft": "swipePanel",
        "swiperight": "swipePanel" //this can probably be done in one,
    },
    initialize: function() {
        this.childViews = [];
    },
    start: function() {
        Backbone.history.start();

        //lets make these global
        this.navPanelView = new jbw.Application.Views.NavigationPanel( { el: "#panel-left-content" } );
        this.nPanelView = new jbw.Application.Views.NotificationPanel( { el: "#panel-right-content" } );
    },
    headerClickPanel: function( event ) {
        var target = event.currentTarget,
            id = target.id;
        if( id.indexOf( "left" ) > -1 ) {
            $("#left-panel").panel( "toggle" );
        } else {
            $("#right-panel").panel( "toggle" );
        }
    },
    panelOpen: function( event ) { //TODO: can get id of this?
        var target = event.target,
            id = target.id;
        if( id === "left-panel" ) {
            //load the current notification state
        }
    },
    panelClose: function( event ) { //TODO: can get id of this?
        var target = event.target,
            id = target.id;
        if( id === "right-panel" ) {
            //turn queuing of notifications off
        }
    },
    swipePanel: function( event ) {
        // We check if there is no open panel on the page because otherwise
        // a swipe to close the left panel would also open the right panel (and v.v.).
        // We do this by checking the data that the framework stores on the page element (panel: open).
        if ( $.mobile.activePage.jqmData( "panel" ) !== "open" && jbw.currentRoute() !== "") {
            if ( event.type === "swipeleft"  ) {
                $( "#right-panel" ).panel( "open" );
            } else if ( event.type === "swiperight" ) {
                $( "#left-panel" ).panel( "open" );
            }
        }
    },
    alertClicked: function( event ) {
        var target = $( event.target ),
        span = target.find( "span" );

        if( span.length ) {
            jbw.Router.navigate( "#" + span[0].id, { trigger: true } );
        }

        console.log( $( span ).id );
    },
    login: function( event ) {
        var target = event.target,
            id = target.id;
        jbw.currentSocial = id;
        doLoginAndMe( jbw.AeroGear.Social.socials[ id ] );
    },
    logout: function() {
        jbw.AeroGear.DataManagers.stores.mySessionStore.remove( "jbwdemo" );
        jbw.removeNotifiers( jbw.currentUser.id );
        this.stopListening( jbw.AeroGear.Notifiers, "notifications" );
        this.stopListening( jbw.AeroGear.Notifiers, "globalnotifications" );
        //Need to empty out notification array
        jbw.points = 0;
        jbw.cash = 0;
        jbw.AeroGear.Social.socials[ jbw.currentSocial ].logout();
        this.onClose();
    },
    navClickLeft: function( event ) {
        /*var target = $(event.target).closest( "li" ),
            id = target[ 0 ].id;
        if( id === "connectionState" ) {
            //lets check if we should reconnect or not
            if( $("#connectionState").attr("data-icon") === "red-circle" ) {
                //try reconnecting
                reconnect( jbw.AeroGear.Notifiers.clients.notifications );
            } else {
                $( "#left-panel" ).panel( "close" );
            }
        } else {*/
        $( "#left-panel" ).panel( "close" );
        /*}*/
    },
    navClickRight: function() {
        $( "#right-panel" ).panel( "close" );
    },
    onClose: function() {
        _( this.childViews ).each( function( view ) {
            view.close();
        });

        return this;
    }
}))( { el: "#main" } );

//TODO: move this to a more central helper location
//helps with the closing and stopping of listening child views
Backbone.View.prototype.close = function() {
    $(this.el).empty();
    this.undelegateEvents();
    this.unbind();
    this.off();
    this.stopListening();

    //stop timeouts
    _.each( jbw.countDown, function( value ) {
        clearTimeout( value );
    });
    if (this.onClose) {
        this.onClose();
    }

    if( this.notifications && this.notifications._events ) {
        var addEvents = this.notifications._events.add;
        var view = this,
            yup = [];

        _.each( addEvents, function( value ) {
            if( value.context.cid !== view.cid ) {
                yup.push( value );
            }
        } );

        this.notifications._events.add = yup;
    }
};

