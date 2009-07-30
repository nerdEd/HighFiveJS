var api_key = 'b7bdcae62787537de768d0fd15b24085';
var moderator = 'youngamerican';

load_scoreboard = function( page ) {
	
	page = typeof( page ) != 'undefined' ? page : 1;
	
	// Build query string for photo search
	var photo_search = 'http://api.flickr.com/services/rest?';
	photo_search += "&method=flickr.photos.search";
	photo_search += "&tags=highfive09";
	photo_search += "&api_key=" + api_key;
	photo_search += "&page=" + page;
	photo_search += "&format=json";
	photo_search += "&jsoncallback=?"
	
	// Initial request to flickr to get all photos with tag
	jQuery.getJSON( photo_search, function( data ) {
		if( parseInt( data.photos.pages ) > page ) {
			page++;
			load_scoreboard( page );
		}
		$.each(data.photos.photo, function( i, photo ) {
			var safe_owner = photo.owner.replace( "@", "" );
			if( $( "li#contestant_" + safe_owner + " span.contestant_score" )[0] == undefined ) {
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
					var name_element = $( "li#contestant_" + safe_owner + " span.contestant_name" )[0]
					name_element.innerHTML = data.person.username._content;
				});							
				
				// Add moderation points to contestants score
				var comment_search = 'http://api.flickr.com/services/rest?';
				comment_search += '&method=flickr.photos.comments.getList';
				comment_search += '&api_key=' + api_key;
				comment_search += '&photo_id=' + photo.id;
				comment_search += '&format=json';
				comment_search += '&jsoncallback=?';
				
				$.getJSON( comment_search, function( data ) {
					$.each( data.comments.comment, function( i, comment ) {
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
		top_score = -1;
		starting_index = 0;
		contestant_list = $( "li.contestant" );
		current_top_element = null;
		while( starting_index < contestant_list.length ) {
			contestant_list = $( "li.contestant" );			
			for( i=0; i < contestant_list.length - starting_index; i++ ) {
				current_score = parseInt( contestant_list[i].childNodes[1].innerHTML );
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
}

bump_score = function( owner_id, mod ) {
	mod = typeof( mod ) != 'undefined' ? mod : 1;
	var score_element = $( "li#contestant_" + owner_id + " span.contestant_score" )[0];
	var new_score = parseInt( score_element.innerHTML );
	score_element.innerHTML = new_score + mod;
}

determine_mod_value = function( comment_text ) {
	result = comment_text.match( /\[[+-]\d*\]/ );
	mod = 0;
	while( result != null ) {
		mod = mod + parseInt( result[0].replace( /[\[\]]/g, "" ) );
		comment_text = comment_text.substring( result.index + result.length, comment_text.length );
		result = comment_text.match( /\[[+-]\d*\]/ );
	}
	return mod;
}