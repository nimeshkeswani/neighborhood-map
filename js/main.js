//Declare global variables
var map;
var center;
var infoWindow;
var results = [];
var markers = [];
var currentMarker;
var markerFilter = document.getElementById("location-list-filter");
var place = function(data) {
    this.placeId = ko.observable(data.placeId);
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
    this.map = ko.observable(data.map);
    this.animation = ko.observable(data.animation);
};

//Function when map fails to load
function errorMap(e) {
    document.getElementById('map').innerHTML = "Couldn't loap the Map. Something went wrong.";
}

//Function to initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 37.570750, lng: -122.337088},
        zoom: 10
    });

    center = map.getCenter();

    infoWindow = new google.maps.InfoWindow();

    google.maps.event.addListener(infoWindow, "closeclick", function() {
       if (currentMarker) {
            deselectMarker();
        }
    });

    //Add an event listener on the Filter Text Box
    markerFilter.addEventListener("keyup", function() {
        filterMarkers();
    });

    google.maps.event.addListener(map, "dragend", function() {
        if (currentMarker) {
            deselectMarker();
        }
           center = map.getCenter();
           if (myViewModel.autoSearch()) {
               markerFilter.value = "";
               getPlaces(center);
        }
    });
    getPlaces(center);
}

//Knockout ViewModel
var ViewModel = function() {
    var self = this;

    this.autoSearch = ko.observable(true);

    this.redoSearch = ko.observable(false);

    this.placesList = ko.observableArray([]);

    this.redoMapSearch = function () {
        if (currentMarker) {
            deselectMarker();
        }
        center = map.getCenter();
        markerFilter.value = "";
        getPlaces(center);
    }

    this.changeAutoSearch = function() {
        this.redoSearch(!self.autoSearch());
        return true;
    }

    this.selectMarkerFromList = function (place) {
        placeId = place.placeId();
        markers.forEach( function (marker) {
            if (marker.placeId === placeId) {
                selectMarker(marker);
            }
        });
    }
};

myViewModel = new ViewModel();

ko.applyBindings(myViewModel);

//Function to update the List
function updateList() {
    myViewModel.placesList([]);
    markers.forEach(function(placeItem) {
        if (placeItem.map) {
            myViewModel.placesList.push(new place(placeItem));
        }
    });
}

//Function to Filter Markers using Search Term
function filterMarkers() {
    var searchTerm = markerFilter.value.toLowerCase();
    markers.forEach( function (marker) {
        if (!marker.title.toLowerCase().includes(searchTerm)) {
            if (currentMarker && currentMarker.placeId === marker.placeId) {
                infoWindow.close();
                deselectMarker();
            }
            marker.setMap(null);
        }
        else {
            if (!marker.map) {
                marker.setMap(map);
                marker.setAnimation(google.maps.Animation.DROP);
            }
        }
    });
    updateList();
}

//Function to get places using Nearby Search from Google JavaScript API
function getPlaces(center) {

    var searchRequest = {
        ll: center.lat() + "," + center.lng(),
        client_id: "EN0J2UJWRF5IOMFDU2WGQNUZFL05ATTXEK3RNRWX3S4FRGFS",
        client_secret: "DLHKVY21IFFTPTBJVOEXA1KPFVMDU4N1BBPLYLWZJSCDMFGZ",
        categoryId: "4bf58dd8d48988d142941735",
        v: "20180210"
    };

    $.ajax({
        type: "GET",
        url: "https://api.foursquare.com/v2/venues/search",
        data: searchRequest,
        success: function(data) {
            if (data.meta.code !== 200) {
            console.log("There is a problem.");
        }
        else {
            console.log(data.response.venues);
            if (data.response.venues[0]) {
                document.getElementById("no-places-found").hidden = true;
                placeMarkers(data.response.venues);
            }
            else {
                console.log("No places found.");
                deleteAllMarkers();
                updateList();
                document.getElementById("no-places-found").hidden = false;
            }
        }
    }
    }).fail( function (e) {
        document.getElementById('location-list-content').innerHTML = "Couldn't reach the Foursquare API. Something went wrong.";
    });
}

//Function to place markers on the map
function placeMarkers(results) {
    deleteAllMarkers();
    results.forEach( function(result) {
        var marker = new google.maps.Marker({
            placeId: result.id,
            title: result.name,
            position: {"lat": result.location.lat, "lng": result.location.lng},
            map: map,
            animation: google.maps.Animation.DROP
        });

        markers.push(marker);

        marker.addListener("click", function() {
            selectMarker(this);
        });
    });
    updateList();
}

//Select the current marker
function selectMarker(marker) {
    if (!currentMarker) {
        currentMarker = marker;
        marker.setAnimation(google.maps.Animation.BOUNCE);
        getPlaceDetails(marker, marker.placeId);
    }
    else if (currentMarker && marker !== currentMarker) {
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
    markers.forEach(function (marker) {
        marker.setMap(map);
    });
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
        client_id: "EN0J2UJWRF5IOMFDU2WGQNUZFL05ATTXEK3RNRWX3S4FRGFS",
        client_secret: "DLHKVY21IFFTPTBJVOEXA1KPFVMDU4N1BBPLYLWZJSCDMFGZ",
        v: "20180210"
    };

    $.ajax({
        type: "GET",
        url: "https://api.foursquare.com/v2/venues/" + placeId,
        data: searchRequest,
        success: function(data) {
            if (data.meta.code !== 200) {
            console.log("There is a problem.");
        }
        else {
            console.log(data.response.venue);
            if (data.response.venue) {
                detailsCallback(data.response.venue);
            }
        }
    }
    }).fail( function (e) {
        infoWindow.open(map, marker);
        content = "Couldn't get place details from the Foursquare API. Something went wrong.";
        infoWindow.setContent(content);
    });

    function detailsCallback(place) {
        if (place.name) {
            place_name = place.name;
        } else {
            place_name = "";
        }
        if (place.url) {
            place_url = place.url;
        } else {
            place_url = "#";
        }
        if (place.location) {
            place_location = place.location.address + " " + place.location.city + " " + place.location.country;
        } else {
            place_location = "";
        }
        if (place.photos.groups[0]) {
            place_photo_url = place.photos.groups[0].items[0].prefix + "200x200" + place.photos.groups[0].items[0].suffix;
        } else {
            place_photo_url = "";
        }
        infoWindow.open(map, marker);
        content = "<h4><a id='location-website' href='" + place_url + "'>" + place_name + "</a></h4><img id='location-image' src='" + place_photo_url + "'><br><br><span id='location-vicinity'>" + place_location + "</span><br><br>Powered by: <img src='static/images/foursquare.png' style='height: 20px;'>";
        infoWindow.setContent(content);
    }
}
