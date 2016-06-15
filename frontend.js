// var app = angular.module('weather-map', []);
// app.controller('WeatherMapController', function($scope) {
//   var mapElement = document.getElementById('map');
//   var map = new google.maps.Map(mapElement, {
//     center: { lat: 39.099727, lng: -94.578567 },
//     zoom: 3
//   });
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.028926, lng: -84.198579},
    zoom: 5,
    draggingCursor:"sw-resize"
  });
}
