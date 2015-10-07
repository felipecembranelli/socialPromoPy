'use strict';

var App = angular.module('App', ['ngRoute']);

google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(function () {
    angular.bootstrap(document.body, ['myApp']);
});


App.factory('myHttpInterceptor', function($rootScope, $q) {
  return {
    'requestError': function(config) {
      $rootScope.status = 'HTTP REQUEST ERROR ' + config;
      return config || $q.when(config);
    },
    'responseError': function(rejection) {
      $rootScope.status = 'HTTP RESPONSE ERROR ' + rejection.status + '\n' +
                          rejection.data;
      return $q.reject(rejection);
    },
  };
});

App.factory('getAllCampaignsService', function($rootScope, $http, $q, $log) {
  $rootScope.status = 'Retrieving data...';
  var deferred = $q.defer();
  $http.get('/rest/campaignQueryHandler')
  .success(function(data, status, headers, config) {
    $rootScope.campaigns = data;
    deferred.resolve();
    $rootScope.status = '';
  });
  return deferred.promise;
});

App.factory('getCampaignDetailService', function($rootScope, $http, $q, $log) {
  $rootScope.status = 'Retrieving data...';
  var deferred = $q.defer();
  $http.get('/rest/campaignDetailQueryHandler' + '?campaignId=' + $rootScope.campaignId)
  .success(function(data, status, headers, config) {
    $rootScope.campaign = data;
    deferred.resolve();
    $rootScope.status = '';
  });

  $http.get('/rest/tweetsByCampaignIdHandler' + '?campaignId=' + $rootScope.campaignId)
    .success(function(data, status, headers, config) {
    $rootScope.tweets = data;
  });

  return deferred.promise;
});

App.factory('getTweetsByCampaignIdService', function($rootScope, $http, $q, $log) {
  $rootScope.status = 'Retrieving data...';
  var deferred = $q.defer();
  $http.get('/rest/tweetsByCampaignIdHandler' + '?campaignId=' + $rootScope.campaignId)
  .success(function(data, status, headers, config) {
    $rootScope.tweets = data;
    deferred.resolve();
    $rootScope.status = '';
  });
  return deferred.promise;
});

App.config(function($routeProvider) {
  $routeProvider.when('/', {
    controller : 'MainCtrl',
    templateUrl: '/partials/main.html',
    resolve    : { 'getAllCampaignsService': 'getAllCampaignsService' },
  });
  $routeProvider.when('/campaignDetail', {
    controller : 'MainCtrl',
    templateUrl: '/partials/campaign-detail.html',
    resolve    : { 'getCampaignDetailService': 'getCampaignDetailService' },
  });
  $routeProvider.otherwise({
    redirectTo : '/'
  });
});

App.config(function($httpProvider) {
  $httpProvider.interceptors.push('myHttpInterceptor');
});

App.controller('MainCtrl', function($scope, $rootScope, $log, $http, $routeParams, $location, $route) {

  $scope.viewDetail = function(id) {
    //alert(id);
    $rootScope.campaignId = id;
    $location.path('/campaignDetail');

    $http.get('/rest/campaignDetailQueryHandler' + '?campaignId=' + $rootScope.campaignId)
    .success(function(data, status, headers, config) {
      $rootScope.campaign = data;
      //deferred.resolve();
      $rootScope.status = '';
    });

    $http.get('/rest/tweetsByCampaignIdHandler' + '?campaignId=' + $rootScope.campaignId)
      .success(function(data, status, headers, config) {
      $rootScope.tweets = data;
    });
  };

  $scope.loadTweetsByCampaign = function(){
    $http.get('/rest/tweetsByCampaignIdHandler' + '?campaignId=' + $rootScope.campaignId)
        .success(function(data, status, headers, config) {
        $rootScope.tweets = data;
      });
  }

  $scope.invite = function() {
    $location.path('/invite');
  };

  $scope.update = function(guest) {
    $location.path('/update/' + guest.id);
  };

  $scope.ChartForward = function(){
    var refDate = JSON.stringify({ "refDate": '' + $scope.currentChartMaxDate + ''});

    //alert(refDate);

    LoadChartDataByRefDate('/rest/chartMoveFw', refDate);
  }

  $scope.ChartBack = function(){

    //var refDate = JSON.stringify({ "refDate": '2014-05-01'});
    var refDate = JSON.stringify({ "refDate": '' + $scope.currentChartMinDate + ''});

    //alert(refDate);

    LoadChartDataByRefDate('/rest/chartMoveBk', refDate);

  }

  $scope.delete = function(guest) {
    $rootScope.status = 'Deleting guest ' + guest.id + '...';
    $http.post('/rest/delete', {'id': guest.id})
    .success(function(data, status, headers, config) {
      for (var i=0; i<$rootScope.guests.length; i++) {
        if ($rootScope.guests[i].id == guest.id) {
          $rootScope.guests.splice(i, 1);
          break;
        }
      }
      $rootScope.status = '';
    });
  };

  //LoadChartData('/rest/gptwTrending');

  function LoadChartData(restUri) {
    $http.get(restUri).success(ProcessReturn);
  }

  function LoadChartDataByRefDate(restUri, data) {
    $http.post(restUri, data).success(ProcessReturn);
  }

  function ProcessReturn(data) {

      /*var data = google.visualization.arrayToDataTable([
        ['Month/Year', 'Camaradagem', 'Imparcialidade', 'Respeito'],
        ['01/2014',  1000,      400,  500],
        ['02/2014',  1170,      460,  300],
        ['03/2014',  660,       1120, 400],
        ['04/2014',  1030,      540,  530]
      ]);*/

      var Combined = new Array();
      Combined[0] = ['Day_Month_Year', 'Credibilidade', 'Respeito', 'Imparcialidade', 'Orgulho', 'Camaradagem'];
      for (var i = 0; i < data.length; i++){
        var obj = data[i];
        Combined[i + 1] = [ obj["Day_Month_Year"],
                            parseInt(obj["Credibilidade"]),
                            parseInt(obj["Respeito"]),
                            parseInt(obj["Imparcialidade"]),
                            parseInt(obj["Orgulho"]),
                            parseInt(obj["Camaradagem"])
                            ];
      }

      // get the current chart max date
      var objValueMax = data[data.length-1];
      var objValueMin = data[0];
      $scope.currentChartMaxDate =  objValueMax["Day_Month_Year"];
      $scope.currentChartMinDate =  objValueMin["Day_Month_Year"];

      //second parameter is false because first row is headers, not data.
      $scope.chartData = google.visualization.arrayToDataTable(Combined, false);

      var options = {
        title: 'GPTW Dimensions Trending',
        hAxis: {title: 'Date',  titleTextStyle: {color: '#333'}},
        isStacked: 'true',
        fill: 20,
        vAxis: {minValue: 0}
      };

      $scope.chart = new google.visualization.AreaChart(document.getElementById('chartdiv'));
      google.visualization.events.addListener($scope.chart, 'select', getValueAt);
      $scope.chart.draw($scope.chartData, options);
  }

  function getValueAt() {
    var selection = $scope.chart.getSelection();

     for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        var refDate = $scope.chartData.getFormattedValue(item.row, 0);

        $http.post('/rest/query', JSON.stringify({ "refDate": refDate }))
            .success(function(data, status, headers, config) {
                $rootScope.activities = data;
                $rootScope.status = '';
        });
     }
  }
});

App.controller('InsertCtrl', function($scope, $rootScope, $log, $http, $routeParams, $location, $route) {

  $scope.submitInsert = function() {
    var guest = {
      first : $scope.first,
      last : $scope.last, 
    };
    $rootScope.status = 'Creating...';
    $http.post('/rest/insert', guest)
    .success(function(data, status, headers, config) {
      $rootScope.guests.push(data);
      $rootScope.status = '';
    });
    $location.path('/');
  }
});

App.controller('UpdateCtrl', function($routeParams, $rootScope, $scope, $log, $http, $location) {

  for (var i=0; i<$rootScope.guests.length; i++) {
    if ($rootScope.guests[i].id == $routeParams.id) {
      $scope.guest = angular.copy($rootScope.guests[i]);
    }
  }

  $scope.submitUpdate = function() {
    $rootScope.status = 'Updating...';
    $http.post('/rest/update', $scope.guest)
    .success(function(data, status, headers, config) {
      for (var i=0; i<$rootScope.guests.length; i++) {
        if ($rootScope.guests[i].id == $scope.guest.id) {
          $rootScope.guests.splice(i,1);
          break;
        }
      }
      $rootScope.guests.push(data);
      $rootScope.status = '';
    });
    $location.path('/');
  };

});

