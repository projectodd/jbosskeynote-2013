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

jbw.Application.Views.Home = Backbone.View.extend({
    template: "./templates/home.html",
    initialize: function() {
        this.childViews = [];
        this.render();
    },
    render: function( done ) {

        var view = this;
        var home = jbw.fetchTemplate( view.template, function( tmpl ) {
            view.$el.html( tmpl( { notificationCount: jbw.notificationCount,
                cash: jbw.cash,
                points: jbw.points,
                name: jbw.currentUser.name,
                profileImage: ( typeof jbw.currentUser.picture === "object" ) ? jbw.currentUser.picture.data.url : jbw.currentUser.picture,
                email: jbw.currentUser.email
            } ) );

            if (_.isFunction(done)) {
                done( view.el );
            }
        });

        $.when( home ).then( function(  ) {
            view.$el.closest( "#main" ).trigger( "pagecreate" );
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
