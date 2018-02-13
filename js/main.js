var map;
var markers = [];
var placesService;
var infoWindow;
var center;

//Function to initialize the map
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.570750, lng: -122.337088},
		zoom: 15
	});

	center = map.getCenter();

	infoWindow = new google.maps.InfoWindow();

	//Add an event listener on the "Auto Redo Search" checkbox, to show/hide the "Redo Search" button
	document.getElementById('auto-redo-search').addEventListener('change', function() {
 		if (this.checked) {
 			document.getElementById('redo-search').hidden = true;
 		} else {
 			document.getElementById('redo-search').hidden = false;
 		}
 	})

 	//Add an event listener on the "Redo Search" button to search for places using the new center of the map
 	document.getElementById('redo-search').addEventListener('click', function() {
 		center = map.getCenter();
 		getPlaces(center);
 	})

	google.maps.event.addListener(map, 'dragend', function() {
         center = map.getCenter();
         autoSearch = document.getElementById('auto-redo-search').checked;
         if (autoSearch) {
         	getPlaces(center);
         }
     });

	placesService = new google.maps.places.PlacesService(map);

	getPlaces(center);
}

//Function to get places using Nearby Search from Google JavaScript API
function getPlaces(location) {

	var searchRequest = {
		location: location,
		radius: 2000,
		type: ['restaurant']
	}

	placesService.nearbySearch(searchRequest, searchCallback);

	function searchCallback(results, status) {
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			console.log("There is a problem.");
		}
		else {
			console.log(results);
			populateList(results);
			placeMarkers(results);
		}
	}

}

//Function to populate the list of places
function populateList(results) {
	document.getElementById('list-1').innerHTML = '';
	for (i = 0; i < results.length; i++) {
		var node = document.createElement("li");
    	var textnode = document.createTextNode(results[i].name);
    	node.appendChild(textnode);
		document.getElementById('list-1').appendChild(node);
	}
}

//Function to place markers on the map
function placeMarkers(results) {
	deleteAllMarkers();
	for (i = 0; i < results.length; i++) {

		var marker = new google.maps.Marker({
			position: results[i].geometry.location,
			map: map,
			animation: google.maps.Animation.DROP,
			title: results[i].name
		})

		markers.push(marker);

		marker.addListener('click', (function(result) {
			return function() {
				populateInfoWindow(this, infoWindow, result);
			}
		})(results[i]))
	}
}

//Function to set a map on all markers
function setMapOnAllMarkers(map) {
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	}
}

//Function to hide all the markers on the map
function hideAllMarkers() {
	setMapOnAllMarkers(null);
}

//Function to show all markers on the map
function showAllMarkers() {
	setMapOnAllMarkers(map);
}

//Function to delete all markers from the array
function deleteAllMarkers() {
	hideAllMarkers();
	markers = [];
}

//Function to populate the info window with information
function populateInfoWindow(marker, infoWindow, result) {

	getPlaceDetails(result.place_id);

	infoWindow.setContent('<h4><a id="location-website" href="' + '">' + marker.title + '</a></h4><img id="location-image"><br><br><span>' + result.vicinity + '</span>');
	//infoWindow.setContent('<h4>' + marker.title + '</h4><img id="location-image"><br><br><span>' + result.vicinity + '</span>');
	//infoWindow.setContent(result.vicinity);
	infoWindow.open(map, marker);
	if (result.photos) {
		//document.getElementById('location-image').innerHTML = result.photos[0].html_attributions[0]
		document.getElementById('location-image').src = result.photos[0].getUrl({'maxWidth': 140, 'maxHeight': 140})
	} else {
		document.getElementById('location-image').src = ''
	}
	
}

//Function to get place details from Google Place Details API
function getPlaceDetails(placeId) {

	detailsRequest = {
		  placeId: placeId
	};

	placesService.getDetails(detailsRequest, detailsCallback);

	function detailsCallback(place, status) {
	  if (status != google.maps.places.PlacesServiceStatus.OK) {
	  	console.log("There is a problem.");
	  } else {
	  	console.log(place);
	  	if (place.website) {
	  		document.getElementById('location-website').href = place.website;
	  	} else {
	  		document.getElementById('location-website').href = "#"
	  	}
	  }
	}

}



/*
$.ajax({
	url: "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.786882,-122.399972&radius=500&key=AIzaSyA7GgGZMQ7P1dbJqvQGARO3N8KpJdjTO1I",
	method: "GET",
	dataType: "json",
	success: function(data) {
		//$( ".result" ).html( data );
  if (data) {
  	console.log("Success");
  }
  else {
  	console.log("Fail");
  }
  //alert( "Load was performed." );
	},
	error: function() {
		console.log("Request Failed.")
	}
});
*/