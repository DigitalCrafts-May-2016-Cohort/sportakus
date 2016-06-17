var app = angular.module('sports-app', []);
var markerDictionary = {};
var homeTeam = "";
var soccerKeyword = venueName + " ,soccer";
var venueName = "";

app.factory('googleMap', function(ticketCall) {
  var sidebarData;
  var mapElement = document.getElementById('map');
  var map = new google.maps.Map(mapElement, {
    center: {lat: 39.99727, lng: -94.578567},
    zoom: 4
  });
  var infoWindow = new google.maps.InfoWindow();
  function openInfoWindow(mlsStadiumResult) {
     venueName = '';

    var venueId = mlsStadiumResult.id;
    var gameObjectArray = matchByVenueDictionary[venueId];
    var matchData = gameObjectArray.map(function(match){

      var awayTeam = match.away['-name'];
      homeTeam = match.home['-name'];
      if (match.venue ===undefined) {
        venueName = "unknown";
      }
      else {
        venueName = match.venue['-name'];
      }

      var contentString ='<h6>' + awayTeam + ' vs ' + homeTeam + '</h6>';
      return contentString;
    });
    var headerString = '<h4>' + venueName + '</h3>';
    var newGamesData = matchData.join('');
    var marker = markerDictionary[mlsStadiumResult.id];
    infoWindow.setContent(headerString + newGamesData);
    infoWindow.open(map, marker);
  }

  function makeMarkers(matchByVenueDictionary, mlsStadiumResults, sidebarDataCallback) {

    var mlsStadiumData = mlsStadiumResults.map(function(mlsStadiumResult) {
      var thePosition = {lat: mlsStadiumResult.lat, lng: mlsStadiumResult.lng};
      var marker = new google.maps.Marker({
        position: thePosition,
        map: map,
        title: 'MLS',
        animation: google.maps.Animation. DROP,
        icon: {
          url: 'images/mls logo.png',
          size: new google.maps.Size(50, 50),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(25, 25)
        }
      });
      markerDictionary[mlsStadiumResult.id] = marker;
      marker.addListener('click', function(){
        openInfoWindow(mlsStadiumResult);
        ticketCall.getTicketInfo(homeTeam, function(ticketData){
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
// MLS AJAX service
app.factory('mlsCall', function($http) {
  return {
    getMlsSchedule: function(callback) {
      $http({
        method: 'GET',
        url: 'json/mlsschedule.json'

      }).success(function(mlsScheduleData) {
          console.log(mlsScheduleData);
          callback(mlsScheduleData);
        });
    }
  };
});
// MLS Stadium AJAX service
app.factory('mlsStadiumCall', function($http) {
  return {
    getMlsStadium: function(callback) {
      $http({
        method: 'GET',
        url: 'json/mlsstadiumdata.json'

      }).success(function(mlsStadiumData) {
          console.log(mlsStadiumData);
          callback(mlsStadiumData);
        });
    }
  };
});
// MLS controller
app.controller('MlsController', function($http, $scope, mlsCall, mlsStadiumCall, googleMap) {

  mlsCall.getMlsSchedule(function(mlsScheduleData) {
    var mlsScheduleResults = mlsScheduleData.schedule.matches.match;
    $scope.results = mlsScheduleResults;
    mlsStadiumCall.getMlsStadium(function(mlsStadiumData){
      var mlsStadiumResults = mlsStadiumData.mlsStadiums;
      googleMap.makeMarkers(mlsScheduleResults, mlsStadiumResults, function(ticketData){
        $scope.ticketResults = ticketData._embedded.events;
        // $scope.$apply();
      });
      createGameDictionary(mlsScheduleResults);
    });



  });
});

var matchByVenueDictionary = {};
function createGameDictionary (mlsScheduleResults){

  for (var i = 0; i < mlsScheduleResults.length; i++) {
    var data = mlsScheduleResults[i];
    // console.log("venue id: ",data.venue["-id"]);
      // var venueId = data.venue["-"id];
      for (var key in data.venue) {
        if (key == "-id"){
          var venueId = data.venue[key];
        }
      }
      if (!(venueId in matchByVenueDictionary)) {
        matchByVenueDictionary[venueId] = [];
      }

      var matchArray = matchByVenueDictionary[venueId];
      matchArray.push(data);

  }
}
// Ticketmaster controller and factory
// var sport = "mls";
// var teamName = "Falcons";

app.factory('ticketCall', function($http) {
  return {
    getTicketInfo: function(homeTeam, callback) {
      $http({
        method: 'GET',
        url:'https://app.ticketmaster.com/discovery/v2/events.json?',
        params: {
          apikey: 'E8VNq1LttN0VP5ql6bYc28kSUXfNpFjG',
          keyword: "soccer",
          keyword: venueName,
          classificationName: "mls"
        }
      }).success(function(ticketData) {
          console.log(ticketData);
          callback(ticketData);
      });
    }
  };
});
