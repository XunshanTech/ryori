var Chart = function() {

  var drawUser = function(datas) {
    $('#data-user').highcharts({
      chart: {
        height: 200,
        type: 'area',
        backgroundColor: '#ececec',
        spacing: [0, 0, 0, 0]
      },
      legend: {
        enabled: false
      },
      credits: false,
      title: {
        text: null
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false
          }
        }
      },
      xAxis: {
        type: 'datetime',
        labels: {
          enabled: false
        }
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          enabled: false
        },
        gridLineWidth: 0
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        valueSuffix: '人'
      },
      series: [{
        name: '用户',
        lineWidth: 0,
        color: '#94b758',
        data: datas
      }]
    })
  }

  var drawPlay = function(datas) {
    $('#data-play').highcharts({
      chart: {
        height: 200,
        type: 'column',
        backgroundColor: '#ececec',
        spacing: [0, 0, 0, 0]
      },
      legend: {
        enabled: false
      },
      credits: false,
      title: {
        text: null
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false
          }
        }
      },
      xAxis: {
        type: 'datetime',
        labels: {
          enabled: false
        }
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          enabled: false
        },
        gridLineWidth: 0
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        valueSuffix: ''
      },
      series: [{
        name: '播放',
        borderWidth: 0,
        color: '#fa7b58',
        data: datas
      }]
    })
  }

  return {
    drawUser: drawUser,
    drawPlay: drawPlay
  }
}();