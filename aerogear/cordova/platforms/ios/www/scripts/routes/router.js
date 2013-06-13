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

jbw.Router = new ( Backbone.Router.extend({
    routes: {
        "": "index",
        "home": "home",
        "logout": "logout",
        "items": "items",
        "item/:itemID": "item",
        "*a": "notfound" //should go to a 404
    },

    index: function() {
        if( jbw.currentUser ) {
            jbw.Application.logout();
            jbw.Router.navigate( "", { trigger: true } );
        }
        jbw.Application.onClose().childViews.push( new jbw.Application.Views.Intro( { el: "#page-content"} ) );
    },
    home: function() {
        jbw.Application.onClose().childViews.push( new jbw.Application.Views.Home( { el: "#page-content" } ) );
    },
    items: function() {
        jbw.Application.onClose().childViews.push( new jbw.Application.Views.ItemsList( { el: "#page-content" } ) );
    },
    item: function( itemId ) {
        jbw.Application.onClose().childViews.push( new jbw.Application.Views.ItemBid( { el: "#page-content", item: itemId } ) );
    },
    logout: function() {
        jbw.Application.logout();
        jbw.Router.navigate( "", { trigger: true } );
    },
    notfound: function() {
        jbw.Application.onClose().childViews.push( new jbw.Application.Views.NotFound( { el: "#page-content" } ) );
    }
}))();
