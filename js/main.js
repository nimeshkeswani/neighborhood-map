var map;
var markers = [];
var placesService;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.570750, lng: -122.337088},
		zoom: 15
	});

	google.maps.event.addListener(map, 'dragend', function() {
         console.log(map.getBounds());
      });

	var center = map.getCenter();

	placesService = new google.maps.places.PlacesService(map);

	//var location = {lat: 37.559525, lng: -122.318206}

	var searchRequest = {
		//bounds: bounds,
		location: center,
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
			placeMarkers(results);
		}
	}

	var infoWindow = new google.maps.InfoWindow();

	function placeMarkers(results) {
		for (i = 0; i < results.length; i++) {

			var marker = new google.maps.Marker({
				position: results[i].geometry.location,
				map: map,
				//icon: results[i].photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}),
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
	
}

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