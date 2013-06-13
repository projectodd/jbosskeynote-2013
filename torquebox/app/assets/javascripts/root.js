
$(function() {
  client = new Stomp.Client();

  client.connect( function() {
    client.subscribe( '/activity', function(message) {
      var payload = JSON.parse( message.body );
      updateLatestActivity( payload.message );
    } );
    client.subscribe( '/bid', function(message) {
      var bid = JSON.parse( message.body );
      updateBidInfo( bid );
      //updateLatestActivity( '$' + bid.amount + " bid by " + bid.user.name + " on " + bid.auction.title );
    } );
    client.subscribe( '/bid-stats', function(message) {
      var stats = JSON.parse( message.body );
      updateBidStats( stats );
    } );
    client.subscribe( '/auctions', function(message) {
      var auction = JSON.parse( message.body );
      if ( auction.state == 'shutdown' ) {
        $('#auctions').fadeOut( 'slow' );
        $('#activity').fadeOut( 'slow' );
        $('#registered-users' ).fadeOut( 'slow' );
        $('a#shutdown').fadeOut( 'slow', function() {
          var margin = ( document.width / 2 ) - ( $('#leaderboard').width() / 2);
          $('#leaderboard').animate( { 'margin-right': margin } );
        } );
        return;
      }
      updateAuction( auction );
    } );
    client.subscribe( '/leaderboard', function(message) {
      var leaderboard = JSON.parse( message.body );
      updateLeaderboard( leaderboard );
    } );
    client.subscribe( '/registered-users', function(message) {
      var payload = JSON.parse( message.body );
      var num = payload.data;
      $('#registered-users .data').html( num );
    } );
  });

  updateLeaderboard = function(leaderboard) {
    console.debug( leaderboard );
    var members = $('#leaderboard .members');

    var source   = $("#member-template").html();
    var template = Handlebars.compile(source);

    members.html('');
    $(leaderboard).each( function(i,m) {
      if ( i < 5 ) {
        m.place = i+1;
        members.append( template( m ) );
      }
    } );
  };

  updateLatestActivity = function(info) {
    $( "#latest-activity" ).prepend( $('<div>').append( info ) );
  };

  updateAuction = function(auction) {
    var div = $('#auction_' + auction.id );
    var auction_state = auctionState( auction );
    if ( div.size() == 0 ) {
      div = $('<div id="auction_' + auction.id + '" class="auction">');
      $('#auctions').prepend( div );

      div.data( "duration", auction.duration * 60 * 1000 );
      
      var source   = $("#auction-template").html();
      var template = Handlebars.compile(source);
  
      div.html( template( auction ) );
  
      updateImage(auction);
      updateBidInfo(auction.high_bid);
    }

    div.find( '.panel' ).hide();
    div.find( '.' + auction_state ).show();

    if ( auction_state == 'pending' ) {
      div.data( 'high_bid', 0 );
    }
    if ( auction_state == 'inprogress' ) {
      startTimer( auction );
    }
  };

  updateImage = function(auction) {
    var div = $('#auction_' + auction.id );
    div.find('.container').css( 'background-image', 'url(/assets/items/' + auction.image_key + ')' );
  }

  startTimer = function(auction) {
    var div = $('#auction_' + auction.id );
    div.data( "started", true );
    div.data( "started_at", Date.now() );//auction.started_at );
    var timer = div.find( '.timer' );
    timer.progressbar({
      value: 0,
    });
  };

  updateTimers = function() {
    $( '.auction' ).each( function(i, each) {
      if ( $(each).data( 'started' ) ) {
        var started_at = $(each).data( "started_at" );//Date.parse( $(each).data( "started_at" ) );
        var now = Date.now();
        var diff = now - started_at
        var percent = ( diff / $(each).data( 'duration' ) ) * 100;
        if ( percent > 100 ) {
          $(each).data( 'started', false );
        }
        var timer = $(each).find( '.timer' );
        timer.progressbar({
          value: percent,
        });
      }
    } );
    setTimeout( updateTimers, 1000 );
  };

  updateBidInfo = function(bid) {
    if ( bid ) {
      var auction = $('#auction_' + bid.auction_id );
      var high_bid_amount = auction.data( 'high_bid' );
      if ( ( high_bid_amount == undefined ) || ( bid.amount > high_bid_amount ) ) {
        auction.data( 'high_bid', bid.amount );
        auction.find( '.high-bid .data').html( 
          '$' + bid.amount
        );
        var winner = auction.find( '.winner' );
        winner.find( '.user .data').html( 
          bid.user.name
        );
        winner.find( '.amount .data').html( 
          '$' + bid.amount
        );
      }
    }
  };

  updateBidStats = function(stats) {
    var auction = $('#auction_'+ stats.auction_id );
    auction.find( '.number-of-bids  .data' ).html( stats['number_of_bids'] );
    auction.find( '.bids-per-user   .data' ).html( stats['bids_per_user'].toFixed(2) );
    auction.find( '.bids-per-second .data' ).html( stats['bids_per_second'].toFixed(2) );
  }

  auctionState = function(auction) {
    if ( auction.completed ) {
      return 'completed';
    }
    if ( auction.started_at && auction.ended_at ) {
      return 'finishing';
    }
    if ( ! auction.started_at && ! auction.ended_at ) {
      return 'pending';
    }
    return 'inprogress';
    
  };

  $( document ).on( 'click', '.auction a', function(link) {
    $.ajax( this.href, { dataType: 'json' } ).done(
      function(data) {
        updateAuction(data);
      }
    )
    return false;
  } );

  $( document ).on( 'click', '.auction .start', function(link) {
    $.ajax( $(this).attr( 'href' ), { dataType: 'json' } ).done(
      function(data) {
        updateAuction(data);
      }
    )
    return false;
  } );

  $.ajax( "/auctions.json", { dataType: 'json' } ).done( 
    function(data) {
      for ( id in data ) {
        updateAuction( data[id] );
      }
    } 
  );

  $('a#shutdown').click( function() { 
    $.ajax( $(this).attr( 'href' ) ).done( function() {
    } );
    return false;
  } );

  $( '.timer' ).progressbar();

  updateTimers();

});
