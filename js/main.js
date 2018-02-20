//Declare global variables
var map;
var center;
var infoWindow;
var autoSearch;
var results = [];
var markers = [];
var currentMarker;
var markerFilter = document.getElementById('location-list-filter');
var placesList = ko.observableArray([]);
var place = function(data) {
	this.placeId = ko.observable(data.placeId);
	this.title = ko.observable(data.title);
	this.position = ko.observable(data.position);
	this.map = ko.observable(data.map);
	this.animation = ko.observable(data.animation);
}

//Function to initialize the map
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.570750, lng: -122.337088},
		zoom: 10
	});

	center = map.getCenter();

	infoWindow = new google.maps.InfoWindow({
		content: '<h4><a id="location-website" href=""></a></h4><img id="location-image"><br><br><span id="location-vicinity"></span><br><br>Powered by: <img src="static/images/foursquare.png" style="height: 20px;">'
	});

	google.maps.event.addListener(infoWindow, 'closeclick', function() {
	   if (currentMarker) {
			deselectMarker();
		}
	});

	//Add an event listener on the Filter Text Box
	markerFilter.addEventListener('keyup', function() {
		filterMarkers()
	})

	//Add an event listener on the "Auto Redo Search" checkbox, to show/hide the "Redo Search" button
	document.getElementById('auto-search').addEventListener('change', function() {
 		if (this.checked) {
 			document.getElementById('redo-search').hidden = true;
 		} else {
 			document.getElementById('redo-search').hidden = false;
 		}
 	})

 	//Add an event listener on the "Redo Search" button to search for places using the new center of the map
 	document.getElementById('redo-search').addEventListener('click', function() {
 		if (currentMarker) {
			deselectMarker();
		}
 		center = map.getCenter();
 		markerFilter.value = '';
 		getPlaces(center);
 	})

	google.maps.event.addListener(map, 'dragend', function() {
		if (currentMarker) {
			deselectMarker();
		}
	   	center = map.getCenter();
	   	autoSearch = document.getElementById('auto-search').checked;
	   	if (autoSearch) {
	   		markerFilter.value = '';
	   		getPlaces(center);
        }
    });
	getPlaces(center);
}

//Function to initialize the List
function initList(results) {
	var ViewModel = function() {
		var self = this;

		results.forEach(function(placeItem) {
			placesList.push(new place(placeItem));
		})
	}

	ko.applyBindings(new ViewModel());
}

//Initialize the List
initList(results);

//Function to update the List
function updateList() {
	placesList([]);
	markers.forEach(function(placeItem) {
		if (placeItem.map) {
			placesList.push(new place(placeItem));
		}
		else {

		}
	})
}

//Function to Filter Markers using Search Term
function filterMarkers() {
	var searchTerm = markerFilter.value.toLowerCase();
	for (i = 0; i < markers.length; i++) {
		if (!markers[i].title.toLowerCase().includes(searchTerm)) {
			if (currentMarker && currentMarker.placeId == markers[i].placeId) {
				infoWindow.close();
				deselectMarker();
			}
			markers[i].setMap(null);
		}
		else {
			if (!markers[i].map) {
				markers[i].setMap(map);
				markers[i].setAnimation(google.maps.Animation.DROP);
			}
		}
	}
	updateList();
}

function selectMarkerFromList(place) {
	placeId = place.placeId();
	for (i = 0; i < markers.length; i++) {
		if (markers[i].placeId == placeId) {
			selectMarker(markers[i]);
		}
	}
}

//Function to get places using Nearby Search from Google JavaScript API
function getPlaces(center) {

	var searchRequest = {
		ll: center.lat() + ',' + center.lng(),
		client_id: 'EN0J2UJWRF5IOMFDU2WGQNUZFL05ATTXEK3RNRWX3S4FRGFS',
		client_secret: 'DLHKVY21IFFTPTBJVOEXA1KPFVMDU4N1BBPLYLWZJSCDMFGZ',
		categoryId: '4bf58dd8d48988d142941735',
		v: '20180210'
	}

	$.ajax({
	    type: 'GET',
	    url: 'https://api.foursquare.com/v2/venues/search',
	    data: searchRequest,
	    success: function(data) {
	    	if (data['meta']['code'] != '200') {
			console.log("There is a problem.");
		}
		else {
			console.log(data['response']['venues']);
			if (data['response']['venues'][0]) {
				document.getElementById('no-places-found').hidden = true;
				placeMarkers(data['response']['venues']);
			}
			else {
				console.log("No places found.");
				deleteAllMarkers();
				updateList();
				document.getElementById('no-places-found').hidden = false;
			}
	    }
	}
	}).fail( function () {
		console.log("Something went Wrong.")
	});
}

//Function to place markers on the map
function placeMarkers(results) {
	deleteAllMarkers();
	for (i = 0; i < results.length; i++) {

		var marker = new google.maps.Marker({
			placeId: results[i].id,
			title: results[i].name,
			position: {'lat': results[i].location.lat, "lng": results[i].location.lng},
			map: map,
			animation: google.maps.Animation.DROP
		})

		markers.push(marker);

		marker.addListener('click', function() {
			selectMarker(this);
		})
	}
	updateList();
}

//Select the current marker
function selectMarker(marker) {
	if (!currentMarker) {
		currentMarker = marker;
		marker.setAnimation(google.maps.Animation.BOUNCE);
		getPlaceDetails(marker, marker.placeId);
	}
	else if (currentMarker && marker == currentMarker) {
	}
	else if (currentMarker && marker != currentMarker) {
		deselectMarker();
		currentMarker = marker;
		marker.setAnimation(google.maps.Animation.BOUNCE);
		getPlaceDetails(marker, marker.placeId);
	}
}

//Deselect the current marker
function deselectMarker() {
	currentMarker.setAnimation(null);
	currentMarker = undefined;
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

//Function to get place details from Google Place Details API
function getPlaceDetails(marker, placeId) {

	var searchRequest = {
		client_id: 'EN0J2UJWRF5IOMFDU2WGQNUZFL05ATTXEK3RNRWX3S4FRGFS',
		client_secret: 'DLHKVY21IFFTPTBJVOEXA1KPFVMDU4N1BBPLYLWZJSCDMFGZ',
		v: '20180210'
	}

	$.ajax({
	    type: 'GET',
	    url: 'https://api.foursquare.com/v2/venues/' + placeId,
	    data: searchRequest,
	    success: function(data) {
	    	if (data['meta']['code'] != '200') {
			console.log("There is a problem.");
		}
		else {
			console.log(data['response']['venue']);
			if (data['response']['venue']) {
				detailsCallback(data['response']['venue']);
			}
	    }
	}
	}).fail( function () {
		console.log("Something went Wrong.")
	});

	function detailsCallback(place) {
		infoWindow.open(map, marker);
	  	if (place.name) {
	  		document.getElementById('location-website').innerHTML = place.name;
	  	} else {
	  		document.getElementById('location-website').innerHTML = ''
	  	}
	  	if (place.url) {
	  		document.getElementById('location-website').href = place.url;
	  	} else {
	  		document.getElementById('location-website').href = '#'
	  	}
	  	if (place.location) {
	  		document.getElementById('location-vicinity').innerHTML = place.location.address + ' ' + place.location.city + ' ' + place.location.country;
	  	} else {
	  		document.getElementById('location-vicinity').innerHTML = ''
	  	}
	  	if (place.photos.groups[0]) {
			document.getElementById('location-image').src = place.photos.groups[0].items[0].prefix + '200x200' + place.photos.groups[0].items[0].suffix
		} else {
			document.getElementById('location-image').src = ''
		}
	}
}
