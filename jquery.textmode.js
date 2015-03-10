/*!
 * jQuery Textmode
 *
 * @author alu, http://byteberry.net
 * @version 0.0.5
 * @license MIT
 * @link https://github.com/alu-/jQuery-Textmode
 */
;
(function( $, window, document, undefined ) {
	"use strict";

	var textmode = function( elem, options ) {
		this.elem = elem;
		this.$elem = $( elem );
		this.options = options;
		this.metadata = this.$elem.data( "textmode-options" );
		this.context2d = this.elem[ 0 ].getContext( "2d" );
		if ( !this.context2d ) {
			alert( "Fatal Error: Couldn't get 2D context on canvas" );
			return;
		}
	};

	textmode.prototype = {
	    defaults : {
	        "x" : 80,
	        "y" : 25,
	        "font" : "msdos",
	        "fontDirectory" : "fonts",
	        "width" : screen.width,
	        "height" : screen.height
	    },
	    // Default EGA 16-color palette
	    colorTable : [ '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF' ],
	    bdfData : {},
	    coloredFonts : [ ],
	    init : function( ) {
		    this.config = $.extend( {}, this.defaults, this.options, this.metadata );

		    this.loadFont( this.config.fontDirectory, this.config.font );
		    return this;
	    },
	    loadFont : function( directory, filename ) {
		    // Load BDF font via AJAX
		    var bdfString;

		    // Remove trailing slash if needed
		    if ( directory.substring( directory.length - 1, directory.length ) == "/" ) {
			    directory = directory.substring( 0, directory.length - 1 );
		    }

		    $.ajax( {
		        cache : false, // Just for now, change to true later
		        dataType : "text",
		        global : false,
		        url : directory + "/" + filename + ".bdf",

		        error : function( jqXHR, textStatus, errorThrown ) {
			        if ( jqXHR.status != 404 ) {
				        alert( textStatus.charAt( 0 ).toUpperCase( ) + textStatus.slice( 1 ) + ": " + errorThrown );
			        }
		        },
		        statusCode : {
			        404 : function( ) {
				        alert( "Fatal Error: " + "Could not find the font file at:\n" + directory + "/" + filename + ".bdf" );
			        }
		        },
		        success : this.parseFont
		    } );
	    },
	    parseFont : function( rawBdfData ) {
		    // We use BDF fonts as they are easy to parse
		    // http://en.wikipedia.org/wiki/Glyph_Bitmap_Distribution_Format
		    // http://www.x.org/releases/X11R7.5/doc/fonts/fonts.html

		    var lines = rawBdfData.split( "\n" );
		    var parsingChar = false, parsingBitmap = false;
		    var currentChar;
		    var tmpGlyph = [ ];
		    var tmpGlyphs = {};
		    $.each( lines, function( lineNo, line ) {

			    if ( line.substring( 0, 9 ) == "STARTCHAR" ) {
				    parsingChar = true;
				    tmpGlyph = [ ];
			    } else if ( line.substring( 0, 7 ) == "ENDCHAR" ) {
				    // Only add character if it's not empty
				    if ( tmpGlyph.length > 0 ) {

					    if ( currentChar < 64 || currentChar > 120 ) {
						    // Limit chars, simplify testing
						    return;
					    }

					    var bbx = tmpGlyph.bbx.split( " " ).map( function( num ) {
						    return parseInt( num, 10 );
					    } );

					    var canvasChar = document.createElement( 'canvas' );

					    // TODO width and height needs to be automagic
					    canvasChar.width = 16;
					    canvasChar.height = 16;

					    // Styles for testing purposes
					    canvasChar.style.border = "1px solid #dedede";
					    canvasChar.style.margin = "1px";
					    canvasChar.style.height = "16px";
					    canvasChar.style.width = "16px";

					    var attrEncoding = document.createAttribute( "data-encoding" );
					    attrEncoding.value = currentChar;
					    canvasChar.setAttributeNode( attrEncoding );

					    // TODO should default to global bounding box
					    var adjX = 0, adjY = 0;

					    var charContext = canvasChar.getContext( "2d" );
					    for ( var y = 0, len = tmpGlyph.length; y < len; y++ ) {
						    var l = tmpGlyph[ y ];
						    for ( var i = tmpGlyph.bits, x = 0; i >= 0; i--, x++ ) {
							    // Check if bit is toggled
							    if ( l >> i & 0x01 == 1 ) {
								    // TODO respect global and local character
								    // bounding box
								    charContext.fillRect( x + adjX, y + adjY, 1, 1 );
							    }
						    }
					    }

					    document.body.appendChild( canvasChar );
					    // tmpGlyphs[ currentChar ] = tmpGlyph;
				    }

				    parsingChar = false;
				    parsingBitmap = false;
				    currentChar = null;
			    }

			    if ( parsingChar ) {
				    if ( line.substring( 0, 8 ) == "ENCODING" ) {
					    currentChar = line.substring( 9 );
				    } else if ( line.substring( 0, 3 ) == "BBX" ) {
					    tmpGlyph.bbx = line.substring( 4 );
				    } else if ( line.substring( 0, 6 ) == "BITMAP" ) {
					    parsingBitmap = true;
				    } else if ( parsingBitmap ) {
					    tmpGlyph.push( parseInt( line, 16 ) );
					    tmpGlyph.bits = line.length * 4;
				    }
			    }

		    } );
		    this.bdfData = tmpGlyphs;
	    },

	    write : function( message ) {
		    // TODO write text to canvas
		    console.log( this.context2d );
		    alert( message );

	    },
	    writeChar : function( character ) {
		    // TODO
	    },
	    draw : function( ) {
		    // TODO Draws the screen
	    }
	};

	textmode.defaults = textmode.prototype.defaults;
	$.fn.textmode = function( options ) {
		if ( this.length != 1 || this.prop( "tagName" ).toLowerCase( ) != "canvas" ) {
			$.error( "Textmode can only be run on a single canvas element" );
		}
		return new textmode( this, options ).init( );
	};

})( jQuery, window, document );
