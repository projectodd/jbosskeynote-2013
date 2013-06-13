document.addEventListener('deviceready', function() {
    init();
    initAeroGearPush();
});

 // handle APNS notifications for Android
function onNotificationGCM(e) {
    switch( e.event ) {
        case 'registered':
        if ( e.regid.length > 0 )
        {
            console.log('REGISTERED -> REGID:' + e.regid + "");
            // Your GCM push server needs to know the regID before it can push to this device
            // here is where you might want to send it the regID for later use.
            console.log("regID = " + e.regid);
        }
        break;
        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground)
            {
                console.log('<li>--INLINE NOTIFICATION--' + '</li>');
                // if the notification contains a soundname, play it.
            }
            else
            {   // otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart)
                    console.log('<li>--COLDSTART NOTIFICATION--' + '</li>');
                else
                console.log('<li>--BACKGROUND NOTIFICATION--' + '</li>');
            }
            var alert = e.payload.text,
                title = e.payload.title,
                id = e.payload.id;

            jbw.waitingNotification = { "title": title, "id": id, "state": "inprogress"  };

            if( jbw.currentRoute().length ) {
                jbw.AeroGear.Notifiers.trigger( "globalnotifications", { msg: jbw.waitingNotification } );
                jbw.waitingNotification = false;
            }
            console.log('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
        break;
        case 'error':
            console.log('<li>ERROR -> MSG:' + e.msg + '</li>');
        break;
        default:
            console.log('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
        break;
    }
}
function errorHandler (error) {
    // error handler....
    console.log("\n\n" + error);
}
// result contains any message sent from the plugin call
function successHandler (result) {
    console.log('result = '+result);
}
function initAeroGearPush() {
    var pushNotification = window.plugins.pushNotification;
    //could probably try to do both in one
    pushNotification.register(successHandler, errorHandler,{"senderID":"155171712935","ecb":"onNotificationGCM"});
}
