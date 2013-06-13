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

( function( window, $, AeroGear, undefined ) {

    AeroGear.Social = function( config ) {
        if( !( this instanceof AeroGear.Social ) ) {
            return new AeroGear.Social( config );
        }

        AeroGear.Core.call( this );

        this.lib = "Social";
        this.type = config ? config.type || "gplus" : "gplus";

        this.collectionName = "socials";

        this.add( config );
    };

    AeroGear.Social.prototype = AeroGear.Core;
    AeroGear.Social.constructor = AeroGear.Social;

    AeroGear.Social.adapters = {};

    AeroGear.Social.adapters.gplus = function( socialName, settings ) {
        if ( !( this instanceof AeroGear.Social.adapters.gplus ) ) {
            return new AeroGear.Social.adapters.gplus( socialName, settings );
        }

        settings = settings || {};

        var clientId = settings.clientId,
            scopes = settings.scopes,
            response,
            type = "gplus",
            def;

        this.getClientId = function() {
            return clientId;
        };

        this.getResponse = function() {
            return response;
        };

        this.getDef = function() {
            return def;
        };

        this.setDef = function( deferred ) {
            def = deferred;
        };

        this.getScopes = function() {
            return scopes;
        };

        this.getType = function() {
            return type;
        };

        window.gplusAsyncInit = function() {
            //gplus sdk is loaded and ready
            gapi.auth.authorize({
                client_id: clientId,
                immediate: true,
                scope: scopes
            }, function( authResult ){
                response = authResult;
                def.resolve( authResult );
            });
        };

        this.load = function() {
            ( function() {
                var po = document.createElement('script');
                po.type = 'text/javascript';
                po.async = true;
                po.src = 'https://apis.google.com/js/client:plus.js?onload=gplusAsyncInit';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(po, s);
            })();
        };
    };

    AeroGear.Social.adapters.gplus.prototype.loadsdk = function( settings ) {
        var def = new $.Deferred();
        this.setDef( def );
        settings = settings || {};
        def.done( settings.loaded );
        this.load();
        return def.promise();
    };

    AeroGear.Social.adapters.gplus.prototype.login = function( settings ) {
        settings = settings || {};
        if( this.getResponse() ) {
            settings.success.call( this, this.getResponse() );
        } else {
            gapi.auth.authorize({
                client_id: this.getClientId(),
                scope: this.getScopes(),
                immediate: false
            }, function( response ){
                if( response && !response.error ) {
                    settings.success.call( this, response );
                } else {
                    settings.error.call( this, response );
                }
            });
        }
    };

    AeroGear.Social.adapters.gplus.prototype.me = function( settings ) {
       //Me Method
        gapi.client.load('oauth2', 'v2', function() {
            var request = gapi.client.oauth2.userinfo.v2.me.get();
            request.execute( function( response ) {
                settings.me.call( this, response );
            } );
        });
    };

    AeroGear.Social.adapters.gplus.prototype.checkAuth = function( settings ) {
        settings = settings || {};
        gapi.auth.authorize({
            client_id: this.getClientId(),
            scope: this.getScopes(),
            immediate: true
        }, function( authResult ){
            if( authResult === null  ) {
                settings.error.call( this, authResult );
            }
        });
    };

    AeroGear.Social.adapters.gplus.prototype.logout = function( settings ) {
        //Log out method;
        var token;

        if( gapi.auth.getToken() ) {
            token = gapi.auth.getToken().access_token;
        }

        settings = settings || {};
        var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + token;
        $.ajax({
            type: 'GET',
            url: revokeUrl,
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            success: settings.success,
            error: settings.error
        });
    };

    AeroGear.Social.adapters.facebook = function( socialName, settings ) {
        if ( !( this instanceof AeroGear.Social.adapters.facebook ) ) {
            return new AeroGear.Social.adapters.facebook( socialName, settings );
        }

        settings = settings || {};

        var clientId = settings.clientId,
            channelFile = settings.channelFile,
            //authResponseChange = settings.authResponseChange,
            scopes = settings.scopes,
            type = "facebook",
            response,
            def;

        this.getResponse = function() {
            return response;
        };

        this.setResponse = function( authResult ) {
            response = authResult;
        };

        this.getDef = function() {
            return def;
        };

        this.setDef = function( deffered ) {
            def = deffered;
        };

        this.getScopes = function() {
            return scopes;
        };

        this.getType = function() {
            return type;
        };

        window.fbAsyncInit = function() {
            FB.init({
                appId      : clientId,  // App ID
                channelUrl : channelFile, // Channel File
                status     : false, // check login status
                cookie     : true // enable cookies to allow the server to access the session
            });

            // Additional init code here
            FB.getLoginStatus( function( authResult ) {
                response = authResult;
                /*FB.Event.subscribe( "auth.authResponseChange", function( response ){
                    console.log( "status change" );
                    authResponseChange.call( this, response );
                });*/

                /*FB.Event.subscribe( "auth.logout", function( response ){
                    console.log( response );
                    console.log( "logout" );
                });*/
                def.resolve( authResult );
            });
        };

        this.load = function() {
            (function(d){
                var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement('script');
                js.id = id;
                js.async = true;
                js.src = "//connect.facebook.net/en_US/all.js";
                ref.parentNode.insertBefore(js, ref);
            }(document));
        };
    };

    AeroGear.Social.adapters.facebook.prototype.loadsdk = function( settings ) {
        var def = new $.Deferred();
        this.setDef( def );
        settings = settings || {};
        def.done( settings.loaded );
        this.load();
        return def.promise();
    };

    AeroGear.Social.adapters.facebook.prototype.login = function( settings ) {
        settings = settings || {};
        if( this.getResponse().status === "connected" ) {
            settings.success.call( this, this.getResponse() );
        } else {
            FB.login( function( response ) {
                if( response.status === "connected" ) {
                    settings.success.call( this, response );
                } else {
                    settings.error.call( this, response );
                }
            }, { scope: this.getScopes() } );
        }
    };

    AeroGear.Social.adapters.facebook.prototype.me = function( settings ) {
        settings = settings || {};
        if( typeof FB !== "undefined" ) {
            FB.api( "/me", { fields: settings.fields }, settings.me  );
        }
    };

    AeroGear.Social.adapters.facebook.prototype.checkAuth = function( settings ) {
        var that = this;
        settings = settings || {};
        if( typeof FB !== "undefined" ) {

            FB.getLoginStatus( function( authResult ) {
                that.setResponse( authResult );
                console.log( authResult );
                if( authResult.status === "connected" ) {
                    //proceed
                } else {
                    //YOU SHALL NOT PASS
                    settings.error.call( this, authResult );
                }
            }, true );
        }
    };

    AeroGear.Social.adapters.facebook.prototype.logout = function( settings ) {
        //call FB logout method, then on return call the callback provided
        //maybe clean up the window namespace?
        settings = settings || {};
        if( typeof FB !== "undefined" ) {
            FB.logout( settings.logout );
            this.setResponse( {} );
        }
    };

    AeroGear.Social.adapters.CDVfacebook = function( socialName, settings ) {
        if ( !( this instanceof AeroGear.Social.adapters.CDVfacebook ) ) {
            return new AeroGear.Social.adapters.CDVfacebook( socialName, settings );
        }

        settings = settings || {};

        var clientId = settings.clientId,
            channelFile = settings.channelFile,
            //authResponseChange = settings.authResponseChange,
            scopes = settings.scopes,
            type = "CDVfacebook",
            response,
            def;

        this.getClientId = function() {
            return clientId;
        };

        this.getResponse = function() {
            return response;
        };

        this.setResponse = function( authResult ) {
            response = authResult;
        };

        this.getDef = function() {
            return def;
        };

        this.setDef = function( deffered ) {
            def = deffered;
        };

        this.getScopes = function() {
            return scopes;
        };

        this.getType = function() {
            return type;
        };

        /*window.fbAsyncInit = function() {
            FB.init({
                appId      : clientId,  // App ID
                channelUrl : channelFile, // Channel File
                status     : false, // check login status
                cookie     : true // enable cookies to allow the server to access the session
            });

            // Additional init code here
            FB.getLoginStatus( function( authResult ) {
                response = authResult;
                /*FB.Event.subscribe( "auth.authResponseChange", function( response ){
                    console.log( "status change" );
                    authResponseChange.call( this, response );
                });*/

                /*FB.Event.subscribe( "auth.logout", function( response ){
                    console.log( response );
                    console.log( "logout" );
                });
                def.resolve( authResult );
            });
        };*/
    };

    AeroGear.Social.adapters.CDVfacebook.prototype.loadsdk = function( settings ) {
                var def = new $.Deferred();
                this.setDef( def );
                settings = settings || {};
                def.done( settings.loaded );

                FB.init({ appId: this.getClientId(), nativeInterface: CDV.FB, useCachedDialogs: false });

                return def.resolve();
    };

    AeroGear.Social.adapters.CDVfacebook.prototype.login = function( settings ) {
        settings = settings || {};
        FB.login( function( response ) {
            if( response.status === "connected" ) {
                settings.success.call( this, response );
            } else {
                settings.error.call( this, response );
            }
        }, { scope: this.getScopes() } );
    };

    AeroGear.Social.adapters.CDVfacebook.prototype.me = function( settings ) {
        settings = settings || {};
        if( typeof FB !== "undefined" ) {
            FB.api( "/me", { fields: settings.fields }, settings.me  );
        }
    };

    AeroGear.Social.adapters.CDVfacebook.prototype.logout = function( settings ) {
        //call FB logout method, then on return call the callback provided
        //maybe clean up the window namespace?
        settings = settings || {};
        if( typeof FB !== "undefined" ) {
            FB.logout( settings.logout );
            this.setResponse( {} );
        }
    };

    AeroGear.Social.adapters.CDVfacebook.prototype.checkAuth = function( settings ) {
        var that = this;
        settings = settings || {};
        if( typeof FB !== "undefined" ) {

            FB.getLoginStatus( function( authResult ) {
                that.setResponse( authResult );
                console.log( authResult );
                if( authResult.status === "connected" ) {
                    //proceed
                } else {
                    //YOU SHALL NOT PASS
                    settings.error.call( this, authResult );
                }
            }, true );
        }
    };

    AeroGear.Social.adapters.CDVgplus = function( socialName, settings ) {
        if ( !( this instanceof AeroGear.Social.adapters.CDVgplus ) ) {
            return new AeroGear.Social.adapters.CDVgplus( socialName, settings );
        }

        settings = settings || {};

        var clientId = settings.clientId,
            scopes = settings.scopes,
            response,
            type = "CDVgplus",
            def,
            accessToken;

        this.setAccessToken = function( token ) {
            accessToken = token;
        };

        this.getAccessToken = function() {
            return accessToken;
        };

        this.getClientId = function() {
            return clientId;
        };

        this.getResponse = function() {
            return response;
        };

        this.getDef = function() {
            return def;
        };

        this.setDef = function( deferred ) {
            def = deferred;
        };

        this.getScopes = function() {
            return scopes;
        };

        this.getType = function() {
            return type;
        };

        this.parseQueryString = function( response ) {
            //taken from https://developers.google.com/accounts/docs/OAuth2Login
            // First, parse the query string
            var params = {}, queryString = response.substr( response.indexOf( "#" ) + 1 ),
            regex = /([^&=]+)=([^&]*)/g, m;
            while ( m = regex.exec(queryString) ) {
                params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }

            return params;
        };

        this.verfiyToken = function( accessToken ) {
            //TODO:
            //Need to verify the token to make sure it's all good in the hood
        };
    };

    AeroGear.Social.adapters.CDVgplus.prototype.loadsdk = function( settings ) {
        var def = new $.Deferred();
        this.setDef( def );
        settings = settings || {};
        def.done( settings.loaded );
        console.log( "resolved" );
        return def.resolve();
    };

    AeroGear.Social.adapters.CDVgplus.prototype.login = function( settings ) {
        settings = settings || {};
        var that = this,
            loginURL = "https://accounts.google.com/o/oauth2/auth",
            //TODO: make this more dynamic
            redirectURL = "http://blog.lholmquist.org",
            scopes = this.getScopes(),
            state = "stalker",
            clientId = this.getClientId(),
            responseType = "token",
            authURL,
            queryParams;

        authURL = loginURL + "?" +
                  "response_type=" + encodeURIComponent( responseType ) +
                  "&redirect_uri=" + encodeURIComponent( redirectURL ) +
                  "&scope=" + encodeURIComponent( scopes ) +
                  "&state=" + encodeURIComponent( state ) +
                  "&client_id=" + encodeURIComponent( clientId );

        window.plugins.childBrowser.showWebPage( authURL );
        window.plugins.childBrowser.onLocationChange = function( response ) {
            if( response.indexOf( "error=" ) > -1 ) {
                //error status,  probably access denied
                console.log( response );
                console.log( "error" );
                window.plugins.childBrowser.close();
            } else if( response.indexOf( "access_token=" ) > -1 ) {
                //success
                //TODO:  need to check the state
                console.log( response );
                console.log( "success" );
                queryParams = that.parseQueryString( response );
                window.plugins.childBrowser.close();

                var validationEndpoint = "https://www.googleapis.com/oauth2/v1/tokeninfo",
                validationURI = validationEndpoint + "?access_token=" + queryParams.access_token;
                //Need to validate the token
                $.ajax({
                    type: 'GET',
                    url: validationURI,
                    contentType: "application/json",
                    success: function( response ) {
                        //TODO:
                        //From https://developers.google.com/accounts/docs/OAuth2Login
                        //Important: When verifying a token, it is critical to ensure the audience field in the response exactly matches your client_id registered in the APIs Console. This is the mitigation for the confused deputy issue, and it is absolutely vital to perform this step.
                        if( that.getClientId() === response.audience ) {
                            //good
                            that.setAccessToken( queryParams );
                            gapi.auth.setToken( queryParams );
                            settings.success.call( this, response );
                        } else {
                            //bad
                            that.setAccessToken();
                            settings.error.call( this, response );
                        }
                    },
                    error: function( response ) {
                        console.log( "error validating token first one" + Object.keys( response ) );
                        settings.error.call( this, response );
                    }
                });
            } else {
                console.log( response );
                console.log( "something else" );
                //something else
            }
        };
    };

    AeroGear.Social.adapters.CDVgplus.prototype.me = function( settings ) {
       //Me Method
       //can use the gapi once the token has been set
        gapi.client.load('oauth2', 'v2', function() {
            var request = gapi.client.oauth2.userinfo.v2.me.get();
            request.execute( function( response ) {
                settings.me.call( this, response );
            } );
        });
    };

    AeroGear.Social.adapters.CDVgplus.prototype.checkAuth = function( settings ) {
        settings = settings || {};

        //https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={accessToken}
        var that = this,
            validationEndpoint = "https://www.googleapis.com/oauth2/v1/tokeninfo",
            validationURI = validationEndpoint + "?access_token=" + gapi.auth.getToken().access_token;
                //Need to validate the token

        //console.log( validationURI );
        $.ajax({
            type: 'GET',
            url: validationURI,
            contentType: "application/json",
            success: function( response ) {
                //TODO:
                //From https://developers.google.com/accounts/docs/OAuth2Login
                //Important: When verifying a token, it is critical to ensure the audience field in the response exactly matches your client_id registered in the APIs Console. This is the mitigation for the confused deputy issue, and it is absolutely vital to perform this step.
                if( that.getClientId() === response.audience ) {
                    //good
                    //that.setAccessToken( queryParams );
                    //gapi.auth.setToken( queryParams );
                    //settings.success.call( this, response );
                } else {
                    //bad
                    that.setAccessToken();
                    settings.error.call( this, response );
                }
            },
            error: function( response ) {
                console.log( response );
                console.log( "error validating token second one" + Object.keys( response ) );
                settings.error.call( this, response );
            }
        });
    };

    AeroGear.Social.adapters.CDVgplus.prototype.logout = function( settings ) {
        //Log out method;
        settings = settings || {};
        var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + gapi.auth.getToken().access_token;
        $.ajax({
            type: 'GET',
            url: revokeUrl,
            async: false,
            contentType: "application/json",
            dataType: 'jsonp',
            success: settings.success,
            error: settings.error
        });
    };
})( this, jQuery, AeroGear );
