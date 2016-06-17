var app = angular.module('nascar-app', []);
var markerDictionary = {};
var cityName = "";
var seriesDate;
var venueName;
app.factory('googleMap', function(ticketCall) {
  var seriesName = "";
  var sidebarData;
  var mapElement = document.getElementById('map');
  var map = new google.maps.Map(mapElement, {
    center: {lat: 39.99727, lng: -94.578567},
    zoom: 4
  });
  var infoWindow = new google.maps.InfoWindow();
  function openInfoWindow(nascarTrackResult) {

    var trackName = '';
    var trackId = nascarTrackResult.id;

    var raceObjectArray = seriesByVenueDictionary[trackId];
    var contentString;
    var headerString;
    if (raceObjectArray) {
      var series = raceObjectArray[0];
      seriesDate = series.start_date;
      seriesName = series.name;
      venueName = series.track.name;
      cityName = series.track.city;
      contentString ='<h6>' + seriesName + "<br>" + seriesDate + '</h6>';
      headerString = '<h4>' + venueName + " , " + cityName + '</h3>';
    } else {
      contentString ='<h6> Come back next year! </h6>';
      headerString= '<h6> No Races! </h6>';
    }

    // var newRacesData = seriesData.join('');
    var marker = markerDictionary[nascarTrackResult.id];
    infoWindow.setContent(headerString + contentString);
    infoWindow.open(map, marker);
  }
  function makeMarkers(seriesByVenueDictionary, nascarTrackResults, sidebarDataCallback) {
    var nascarTrackData = nascarTrackResults.map(function(nascarTrackResult) {
      var thePosition = {lat: nascarTrackResult.lat, lng: nascarTrackResult.lng};
      var marker = new google.maps.Marker({
        position: thePosition,
        map: map,
        title: 'NASCAR',
        animation: google.maps.Animation. DROP,
        icon: {
          url: 'images/nascar.png',
          size: new google.maps.Size(40, 41),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(50, 50)
        }
      });
      markerDictionary[nascarTrackResult.id] = marker;
      marker.addListener('click', function(){
        openInfoWindow(nascarTrackResult);
        ticketCall.getTicketInfo(seriesName, function(ticketData){
          sidebarDataCallback(ticketData);

        });
          return marker;
      });
    });
  }
  return {
    openInfoWindow: openInfoWindow,
    makeMarkers: makeMarkers,
    sidebarData: sidebarData
  };
});
// NASCAR AJAX service
app.factory('nascarCall', function($http) {
  return {
    getNascarSchedule: function(callback) {
      $http({
        method: 'GET',
        url: 'json/nascar-sc-schedule.json'

      }).success(function(nascarScheduleData) {
          console.log(nascarScheduleData);
          callback(nascarScheduleData);
        });
    }
  };
});
// NASCAR Stadium AJAX service
app.factory('nascarRaceCall', function($http) {
  return {
    getNascarTracks: function(callback) {
      $http({
        method: 'GET',
        url: 'json/nascartracks.json'

      }).success(function(nascarTrackData) {
          console.log(nascarTrackData);
          callback(nascarTrackData);
        });
    }
  };
});
// NASCAR controller
app.controller('NASCARController', function($http, $scope, nascarCall, nascarRaceCall, googleMap) {

  nascarCall.getNascarSchedule(function(nascarScheduleData) {
    var nascarScheduleResults = nascarScheduleData.events;
    $scope.results = nascarScheduleResults;
    nascarRaceCall.getNascarTracks(function(nascarTrackData){
      var nascarTrackResults = nascarTrackData.nascarTrack;
      googleMap.makeMarkers(nascarScheduleResults, nascarTrackResults, function(ticketData){
        $scope.ticketResults = ticketData._embedded.events;
        // $scope.$apply();
      });
      createSeriesDictionary(nascarScheduleResults);
    });



  });
});

var seriesByVenueDictionary = {};
function createSeriesDictionary (nascarScheduleResults){
  for (var i = 0; i < nascarScheduleResults.length; i++) {
    var data = nascarScheduleResults[i];
    var trackId = data.track.id;
    // for (var j = 0; j < data.length; j++) {
    //   var trackId = data[j].track.id;
      if (!(trackId in seriesByVenueDictionary)) {
        seriesByVenueDictionary[trackId] = [];
      }

      var seriesArray = seriesByVenueDictionary[trackId];
      seriesArray.push(data);
    // }
  }
}
// Ticketmaster controller and factory
// var sport = "nascar";
// var teamName = "Falcons";

app.factory('ticketCall', function($http) {
  return {
    getTicketInfo: function(seriesName, callback) {
      $http({
        method: 'GET',
        url:'https://app.ticketmaster.com/discovery/v2/events.json?',
        params: {
          apikey: 'E8VNq1LttN0VP5ql6bYc28kSUXfNpFjG',
          Keyword: "nascar",
          keyword: venueName,

        }
      }).success(function(ticketData) {
          console.log(ticketData);
          callback(ticketData);
      });
    }
  };
});
