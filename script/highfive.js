load_scoreboard = function( api_key, moderator, tag, page ) {
	
	page = typeof( page ) != 'undefined' ? page : 1;
	
	// Build query string for photo search
	var photo_search = 'http://api.flickr.com/services/rest?';
	photo_search += "&method=flickr.photos.search";
	photo_search += "&tags=" + tag;
	photo_search += "&api_key=" + api_key;
	photo_search += "&page=" + page;
	photo_search += "&format=json";
	photo_search += "&jsoncallback=?";
	
	// Initial request to flickr to get all photos with tag
	jQuery.getJSON( photo_search, function( data ) {
		if( parseInt( data.photos.pages, 10 ) > page ) {
			page++;
			load_scoreboard( api_key, moderator, tag, page );
		}
		$.each(data.photos.photo, function( i, photo ) {
			var safe_owner = photo.owner.replace( "@", "" );
			if( $( "li#contestant_" + safe_owner + " span.contestant_score" )[0] === undefined ) {
				$( "#contestant_list" ).append( "<li id='contestant_" + safe_owner + "' class='contestant'>" + 
													"<span class='contestant_name'><img src='images/indicator.gif'/></span>" +
													"<span class='contestant_score'>1</span>" +
												"</li>" );
				
				// Populate contestant username
				var owner_search = 'http://api.flickr.com/services/rest?';
				owner_search += '&method=flickr.people.getInfo';
				owner_search += '&api_key=' + api_key;
				owner_search += '&user_id=' + photo.owner;
				owner_search += '&format=json';
				owner_search += '&jsoncallback=?';

				$.getJSON( owner_search , function( data ) { 
					var name_element = $( "li#contestant_" + safe_owner + " span.contestant_name" )[0];
					name_element.innerHTML = "<a href='#' onclick='toggle_slideshow(\"" + photo.owner + "\", \"" + tag + "\"); return false;'>" + data.person.username._content + " +</a>";
				});							
				
				// Add moderation points to contestants score
				var comment_search = 'http://api.flickr.com/services/rest?';
				comment_search += '&method=flickr.photos.comments.getList';
				comment_search += '&api_key=' + api_key;
				comment_search += '&photo_id=' + photo.id;
				comment_search += '&format=json';
				comment_search += '&jsoncallback=?';
				
				$.getJSON( comment_search, function( data ) {
					$.each( data.comments, function( i, comment ) {
						if( comment.authorname == moderator ) {
							bump_score( owner.id, determine_mod_value( comment._content ) );
						}
					});				
				});
			}
			else {
				bump_score( safe_owner );
			}
		});
		
		// Sort the contestants based on score
		var top_score = -1;
		var starting_index = 0;
		var contestant_list = $( "li.contestant" );
		var current_top_element = null;
		while( starting_index < contestant_list.length ) {
			contestant_list = $( "li.contestant" );			
			for( i=0; i < contestant_list.length - starting_index; i++ ) {
				current_score = parseInt( contestant_list[i].childNodes[1].innerHTML, 10 );
				if( current_score >= top_score ) {
					top_score = current_score;
					current_top_element = contestant_list[i];
				}
			}
			$( "#contestant_list" ).append( current_top_element );
			starting_index++;
			top_score = -1;
		}
	});	
};

bump_score = function( owner_id, mod ) {
	mod = typeof( mod ) != 'undefined' ? mod : 1;
	var score_element = $( "li#contestant_" + owner_id + " span.contestant_score" )[0];
	var new_score = parseInt( score_element.innerHTML, 10 );
	score_element.innerHTML = new_score + mod;
};

determine_mod_value = function( comment_text ) {
	var result = comment_text.match( /\[[+-]\d*\]/ );
	var mod = 0;
	while( result !== null ) {
		mod = mod + parseInt( result[0].replace( /[\[\]]/g, "" ), 10 );
		comment_text = comment_text.substring( result.index + result.length, comment_text.length );
		result = comment_text.match( /\[[+-]\d*\]/ );
	}
	return mod;
};

toggle_slideshow = function( flickr_id, tag ) {
	var safe_owner = flickr_id.replace( "@", "" );
	var picture_row =  $( "li#contestant_picture_row" + safe_owner )[0];	
	var name_element = $( "li#contestant_" + safe_owner + " span.contestant_name a" )[0];
	if( picture_row === undefined ) {
		var contestant_row = $( "li#contestant_" + safe_owner );
		var slideshow = "<li id='contestant_picture_row" + safe_owner + "' class='contestant_pictures'><iframe align='center' src='http://www.flickr.com/slideShow/index.gne?user_id=" + flickr_id + "&tags=" + tag + "' frameBorder='0' width='400' scrolling='no' height='400'/></li>";
		contestant_row.after( slideshow );
		name_element.innerHTML = name_element.innerHTML.replace( "+", "-" );
	}
	else {
		$( "li#contestant_picture_row" + safe_owner ).remove();
		name_element.innerHTML = name_element.innerHTML.replace( "-", "+" );
	}
};

toggle_about = function() {
	if( $( "#about_content" ).css( "display" ) == "none" ) {
		$( "#contestant_list" ).css( "display", "none" );
		$( "#about_content" ).css( "display", "" );
		$( "#show_about" )[0].innerHTML = "Close";
	}
	else {
		$( "#about_content" ).css( "display", "none" );
		$( "#contestant_list" ).css( "display", "" );
		$( "#show_about" )[0].innerHTML = "About";		
	}
};