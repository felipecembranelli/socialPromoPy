'use strict';
var data;
var chart;

// Load the Visualization API and the piechart package.
google.load('visualization', '1', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
      data = google.visualization.arrayToDataTable([
        ['Month/Year', 'Camaradagem', 'Imparcialidade', 'Respeito'],
        ['01/2014',  1000,      400,  500],
        ['02/2014',  1170,      460,  300],
        ['03/2014',  660,       1120, 400],
        ['04/2014',  1030,      540,  530]
      ]);

      var options = {
        title: 'GPTW Dimensions Trending',
        hAxis: {title: 'Date',  titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0}
      };

      chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
      google.visualization.events.addListener(chart, 'select', getValueAt);
      chart.draw(data, options);
}

function getValueAt() {
    var selection = chart.getSelection();

     for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        var refDate = data.getFormattedValue(item.row, 0);

        $.post('/rest/query', JSON.stringify({ "refDate": refDate }))
            .success(function(data, status, headers, config) {
                $rootScope.activities = data;
                deferred.resolve();
                $rootScope.status = '';
        });
     }
}