function doLoginAndMe( currentSocial ) {
    currentSocial.login({
        success: function( response ) {
            //Now lets store the social we used back into sessionStorage
            jbw.AeroGear.DataManagers.stores.mySessionStore.save( { id: "jbwdemo", type: jbw.currentSocial } );
            //Now Call "me" to get the users profile
            //TODO: need success/error callbacks, figure out how to get params from google
            //TODO: need to abstract this away since we use it in applicaiton.js
            currentSocial.me({
                fields: "picture, id,name, email",
                me: function( response ) {
                    jbw.currentUser = response;
                    //register for push.
                    //TODO: abstract.  probably changing anyway
                    var userRegData = {
                        platform: jbw.currentSocial,
                        identifier: jbw.currentUser.id,
                        profile_pic_url: ( typeof jbw.currentUser.picture === "object" ) ? jbw.currentUser.picture.data.url : jbw.currentUser.picture,
                        name: jbw.currentUser.name,
                        email: jbw.currentUser.email
                    };

                    //Start Listening for the notification triggers
                    startListeners();

                    //setup the notifiers.
                    jbw.setupNotifiers( jbw.currentUser.id );
                    //register the user,  will get a 200 with no content for a success response
                    //server will fire off a balance update, which will be caught by the notifications
                    $.ajax( {
                        url: jbw.baseURL + "/users",
                        type: "POST",
                        data: JSON.stringify( userRegData ),
                        success: function( response ) {
                            console.log( response );
                        },
                        error: function( response ) {
                            console.log( "error" );
                            console.log( response );
                        }
                    });
                    //Navigate to the home screen after logging in
                    jbw.Router.navigate( "home", { trigger: true } );
                    if( !jbw.Application.nPanelView ) {
                        //IF they are coming in from not the index page,  this will put them where they were
                        jbw.Application.start();
                    }
                }
            });
        },
        error: function( error ) {
            console.log( error );//just for now
        }
    });
}