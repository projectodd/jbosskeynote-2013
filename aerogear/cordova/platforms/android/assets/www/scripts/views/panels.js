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

jbw.Application.Views.NavigationPanel = Backbone.View.extend({
    template: "./templates/navPanel.html",
    listoptions: this.listoptions || {},
    initialize: function() {
        this.render();
        this.auctions = new jbw.Application.Collections.Items();
        this.auctions.on( "reset", this.addAuctions, this );
    },
    render: function( done ) {

        var view = this;
        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.append( tmpl() );
            var leftPanel = $("#left-panel");
            leftPanel.find( "ul" ).listview( view.options.listoptions );
            leftPanel.panel();
            view.auctions.fetch();

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    },
    addAuctions: function() {
        //add the auctions to the side bar
        jbw.auctions = this.auctions.models; //just saving for later lookup
        var leftPanel = $("#left-panel").find( "ul" );
        _.each( this.auctions.models, function( model ) {
            model.attributes.message = model.get( "title" );
            var thing = new jbw.Application.Views.Notification( { model: model } );
            leftPanel.append( thing.render().el );
        } );
        leftPanel.listview( "refresh" );
    }
});

jbw.Application.Views.NotificationPanel = Backbone.View.extend({
    template: "./templates/notificationPanel.html",
    initialize: function() {
        this.render();
    },
    render: function( done ) {

        var view = this;
        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.append( tmpl() ).find("#right-panel").panel();
            view.notificationsView = new jbw.Application.Views.Notifications( { el: "#right-panel" } );

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    }
});


jbw.Application.Views.Notifications = Backbone.View.extend({
    template: "./templates/notifications.html",
    listoptions: this.listoptions || {},
    notifications: new jbw.Application.Collections.PersonalNotifications(),
    queuedNotifications: new jbw.Application.Collections.PersonalNotifications(),
    initialize: function() {
        this.render();
        this.notifications.on( "add", this.addOneNotification, this );
        this.queuedNotifications.on( "add", this.updateQueue, this );
    },
    events: {
        "click #alertQueuedwrapper": "flushQueue"
    },
    render: function( done ) {
        var view = this;

        jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.html( tmpl( { name: "NOTIFICATIONS" } ) );
            view.$el.find( "ul" ).listview( view.options.listoptions );

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        return this;
    },
    addOneNotification: function( notification, collection, options ) {
        if( this.$el.data( "role" ) === "panel" && this.$el.hasClass( "ui-panel-open" ) ) {
            this.queuedNotifications.add( notification );
        } else {
            var notificationView = new jbw.Application.Views.Notification( { model: notification } );
            this.$el.find( ".scroller ul" ).prepend( notificationView.render().el );
            if( options.refresh ) {
                this.rerenderListView();
            }
            this.notifications.reset();
            return this;
        }
    },
    /*removeOneNotification: function( notification ) {
        this.$el.find( "#" + notification.id ).closest( "li" ).remove();
    },*/
    updateQueue: function() {
        var view = this;
        if( view.el.id.indexOf( "panel" ) > -1 ) {
            jbw.fetchTemplate(  "./templates/queuedTemplate.html", function( tmpl ) {
                view.$el.find( "#alertQueuedwrapper" ).html( tmpl() );
            });
        }
    },
    flushQueue: function() {
        var view = this;
        _.each( this.queuedNotifications.models, function( notification ) {
            var notificationView = new jbw.Application.Views.Notification( { model: notification } );
            view.$el.find( ".scroller ul" ).prepend( notificationView.render().el );
        });
        this.queuedNotifications.reset();
        this.$el.find( "#alertQueuedwrapper" ).empty();
        this.rerenderListView();
    },
    rerenderListView: function( ) {
        var localEl = this.$el.find( ".scroller ul" );
        if( localEl.length ) {
            localEl.listview( "refresh" );
        }
    }
});

jbw.Application.Views.Notification = Backbone.View.extend({
    tagName: "li",
    template: "<a id=<%=id%> href='#item/<%=id%>'><%=message%></a>",
    initialize: function() {
    },
    render: function() {
        this.$el.attr( { "data-icon": "navleft" } );
        this.$el.append( _.template( this.template, { id: this.model.id, message: this.model.get( "message" )   } ) );
        return this;
    },

});
