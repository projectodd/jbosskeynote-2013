
$(function() {
  auctions = [];
  client = new Stomp.Client();
  client.connect( function() {
    client.subscribe( "/auctions", function(msg) {
      data = JSON.parse( msg.body );
      if ( data.state == 'completed' ) {
        if ( data.winner ) {
          $('#notices').append( $('<div>').append( data.title + " won by " + data.winner + " for $" + data.amount ) );
        }
      }
      if ( data.state != 'inprogress' ) {
        console.log( "remove: " + data.id );
        $( "#auction_" + data.id ).remove();
      } else {
        $('#auction_id').append( $('<option id="auction_' + data.id + '" value="' + data.id + '">' ).append( data.title ) );
      }
    } );
    client.subscribe( '/user-notifications', function(msg) {
      var data = JSON.parse( msg.body )
      console.debug( data );
      $('#notices').append( $('<div>').append( data.user_id + ": " + data.type + ": " + data.message ) );
    } );
  });





  $('#bid-form').submit( function() {
    bid = { 
      auction_id: $("#auction_id").val(),
      user_id: $("#user_id").val(),
      amount: $("#bid_amount").val(),
    };
    if ( ! bid.auction_id || ! bid.user_id || ! bid.amount ) {
      return false;
    }
    console.debug( bid );
    client.send( '/bid', {}, JSON.stringify( bid ) );
    return false;
  } );

});
