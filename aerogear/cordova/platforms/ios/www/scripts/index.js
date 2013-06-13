document.addEventListener('deviceready', function() {
    init();
    initAeroGearPush();
});

// handle APNS notifications for iOS
function onNotificationAPN(e) {
    var alert = e.alert,
        title = e.title,
        id = e.id;

    jbw.waitingNotification = { "title": title, "id": id, "state": "inprogress"  };

    if( jbw.currentRoute().length ) {
        jbw.AeroGear.Notifiers.trigger( "globalnotifications", { msg: jbw.waitingNotification } );
        jbw.waitingNotification = false;
    }
}
function tokenHandler (result) {
    // log the device token
    console.log(result);
}
function errorHandler (error) {
    // error handler....
    console.log("\n\n" + error);
}
function initAeroGearPush() {
    var pushNotification = window.plugins.pushNotification;
    // NOTE....... hard-coded iOS:
    pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
}
