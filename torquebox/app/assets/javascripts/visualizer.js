
var gearStatus = {};

function haproxyStatus(data) {
  $( '#visualizer .gear' ).remove();
  var numGears = 0;
  var gearBars = [];
  for ( gearName in data ) {
    if ( gearName == 'local-gear' ) {
      continue;
    }
    ++numGears;
    var gear = data[ gearName ];
    var size = Math.ceil( ( gear.load_pct / 2 ) + 0.1 );

    if ( size > 50 ) {
      size = 50;
    }

    //size = size * 12;

    var gearBar =  $( '<div class="gear">' );
    gearBar.size = size;

    var segments = $( '<div class="segments">' );
    var meter    = $( '<div class="meter">' );
    gearBar.append( segments );
    gearBar.append( meter );
    

    for ( var i = 0 ; i < 50 ; ++i ) {
      var segment = $( '<div class="segment">' ).css( 'width', '1%' ).html( '<div style="clear:both;"></div>' );
      if ( i <= size ) {
        if ( i < 25 ) {
          segment.css( "background-color", "#009900" ).css( "border-color", '#006600' );
        } else if ( i <  45 ) {
          segment.css( "background-color", "#FFFF00" ).css( 'border-color', '#cccc00' );
        } else {
          segment.css( "background-color", "#CC0000" ).css( 'border-color', '#99000' );
        }
        if ( i > gearStatus[ gearName ] ) {
          segment.css( "display", "none" ).fadeIn( 'fast' );
        }
      } else {
        segment.css( "background-color", "#666" );
        if ( i - 1 < gearStatus[ gearName ] ) {
          segment.css( "display", "none" ).fadeIn( 'fast' );
        }
      }
      segments.append( segment );
      var meterChunk = $( '<div class="meterChunk">' ).css( 'width', '1%' ).html( '<div style="clear:both;"></div>' );
      if ( ( i % 10 ) == 0 ) {
        meterChunk.html( i * 2 );
      }
      meter.append( meterChunk );
    }

    gearStatus[ gearName ] = size;
    gearBars.push( gearBar );
  }
  
  $( '#visualizer' ).append( gearBars );

  var height = 20/numGears;
  if ( height > 15 ) {
    height = 1;
  }
  
  $( '#visualizer .gear' ).css( 'height',  height + '%' );
  $( '#visualizer .segment' ).css( 'height',  '100%' );
};

function pollGears() {
  $.getJSON( 'http://www.jbosskeynote.com/haproxystatus?jsoncallback=?' );
};

$( function() {
  pollGears();
  setInterval( pollGears, 500 );
} );
