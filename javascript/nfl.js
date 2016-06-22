var app = angular.module('sports-app', []);
var markerDictionary = {};
// Try to break up this controller function into small pieces
// 20 lines per function.

function getHomeTeam(stadium) {
  var games = gamesByVenueDictionary[stadium.id];
  var firstGame = games[0];
  return {
    name: firstGame.home.name,
    venue: firstGame.venue.name,
    cityName: firstGame.venue.city
  };
}

app.factory('googleMap', function(ticketCall) {

  var sidebarData;
  var mapElement = document.getElementById('map');
  var map = new google.maps.Map(mapElement, {
    center: {lat: 33.7577, lng: -84.4008},
    zoom: 4
  });
  var infoWindow = new google.maps.InfoWindow();
  function openInfoWindow(nflStadiumResult) {
    var homeTeam = getHomeTeam(nflStadiumResult);
    var gameObjectArray = gamesByVenueDictionary[nflStadiumResult.id];
    var gamesData = gameObjectArray.map(function(games){
      return '<h6>' + games.away.name + ' vs ' + homeTeam.name + '</h6>';
    });
    var headerString = '<h4>' + homeTeam.venue + '</h3>';
    var newGamesData = gamesData.join('');
    var marker = markerDictionary[nflStadiumResult.id];
    infoWindow.setContent(headerString + newGamesData);
    infoWindow.open(map, marker);
  }
  function makeMarkers(gamesByVenueDictionary, nflStadiumResults, sidebarDataCallback) {
    var nflStadiumData = nflStadiumResults.map(function(nflStadiumResult) {
      var thePosition = {
        lat: nflStadiumResult.lat,
        lng: nflStadiumResult.lng
      };
      var marker = new google.maps.Marker({
        position: thePosition,
        map: map,
        title: 'NFL',
        animation: google.maps.Animation. DROP,
        icon: {
          url: 'images/nfl logo.png',
          size: new google.maps.Size(25, 33),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(25, 10)
        }
      });
      markerDictionary[nflStadiumResult.id] = marker;
      marker.addListener('click', function(){
        openInfoWindow(nflStadiumResult);
        var homeTeam = getHomeTeam(nflStadiumResult);
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
// NFL AJAX service
app.factory('nflCall', function($http) {
  return {
    getNflSchedule: function(callback) {
      $http({
        method: 'GET',
        url: 'json/nflschedule.json'

      }).success(function(nflScheduleData) {
        console.log(nflScheduleData);
        callback(nflScheduleData);
      });
    },
    getNflStadium: function(callback) {
      $http({
        method: 'GET',
        url: 'json/nflstadiumdata.json'

      }).success(function(nflStadiumData) {
        console.log(nflStadiumData);
        callback(nflStadiumData);
      });
    }
  };
});

// NFL controller
app.controller('NflController', function($http, $scope, nflCall, googleMap) {
  nflCall.getNflSchedule(function(nflScheduleData) {
    var nflScheduleResults = nflScheduleData.weeks;
    nflCall.getNflStadium(function(nflStadiumData){
      var nflStadiumResults = nflStadiumData.nflStadium;
      googleMap.makeMarkers(nflScheduleResults, nflStadiumResults, function(ticketData){
        $scope.ticketResults = ticketData._embedded.events;
      });
      createGameDictionary(nflScheduleResults);
    });
  });
});

// This function reorganizes the nfl schedule from weeks to venue.
var gamesByVenueDictionary = {};
function createGameDictionary (nflScheduleResults){
  for (var i = 0; i < nflScheduleResults.length; i++) {
    var data = nflScheduleResults[i];
    for (var j = 0; j < data.games.length; j++) {
      var venueId = data.games[j].venue.id;
      if (!(venueId in gamesByVenueDictionary)) {
        gamesByVenueDictionary[venueId] = [];
      }
      var gamesArray = gamesByVenueDictionary[venueId];
      gamesArray.push(data.games[j]);
    }
  }
}

// Ticketmaster API call
app.factory('ticketCall', function($http) {
  return {
    getTicketInfo: function(homeTeam, callback) {
      $http({
        method: 'GET',
        url:'https://app.ticketmaster.com/discovery/v2/events.json?',
        params: {
          apikey: 'E8VNq1LttN0VP5ql6bYc28kSUXfNpFjG',
          keyword: homeTeam.name,
          classificationName: "NFL",
          city: homeTeam.cityName
        }
      }).success(function(ticketData) {
          console.log(ticketData);
          callback(ticketData);
      });
    }
  };
});
