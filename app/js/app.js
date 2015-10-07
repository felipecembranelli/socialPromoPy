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

});
