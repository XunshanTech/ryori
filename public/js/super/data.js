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
        area: {
          dataLabels: {
            enabled: true
          }
        },
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
        name: '累计用户',
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
        column: {
          dataLabels: {
            enabled: true
          }
        },
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
        name: '累计收听',
        borderWidth: 0,
        color: '#fa7b58',
        data: datas
      }]
    })
  }

  var drawGift = function(datas) {
    $('#gift-data').highcharts({
      chart: {
        height: 200,
        type: 'line',
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
        line: {
          dataLabels: {
            enabled: true
          }
        },
        series: {
          marker: {
            enabled: true
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
        valueSuffix: '份'
      },
      series: [{
        name: '发放礼品',
        lineWidth: 1,
        color: '#5aaee9',
        data: datas
      }]
    })
  }

  var drawUserDetail = function(datas) {
    $('#data-user-detail').highcharts({
      chart: {
        height: 400,
        type: 'column',
        backgroundColor: '#ececec'
      },
      credits: false,
      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%m-%d',
          week: '%m-%d'
        }
      },
      yAxis: {
        allowDecimals: false,
        title: {
          text: '新增用户'
        }
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        valueSuffix: '人'
      },
      series: [{
        name: '新增用户',
        borderWidth: 0,
        color: '#94b758',
        data: datas
      }]
    })
  }

  var drawPlayDetail = function(datas) {
    $('#data-play-detail').highcharts({
      chart: {
        height: 400,
        type: 'column',
        backgroundColor: '#ececec'
      },
      credits: false,
      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%m-%d',
          week: '%m-%d'
        }
      },
      yAxis: {
        allowDecimals: false,
        title: {
          text: '新增收听'
        }
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        valueSuffix: ''
      },
      series: [{
        name: '新增收听',
        borderWidth: 0,
        color: '#fa7b58',
        data: datas
      }]
    })
  }

  var drawGiftDetail = function(datas) {
    $('#data-gift-detail').highcharts({
      chart: {
        height: 400,
        type: 'column',
        backgroundColor: '#ececec'
      },
      credits: false,
      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%m-%d',
          week: '%m-%d'
        }
      },
      yAxis: {
        allowDecimals: false,
        title: {
          text: '发放礼品'
        }
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        valueSuffix: '份'
      },
      series: [{
        name: '发放礼品',
        borderWidth: 0,
        color: '#5aaee9',
        data: datas
      }]
    })
  }

  return {
    drawUser: drawUser,
    drawUserDetail: drawUserDetail,
    drawPlay: drawPlay,
    drawPlayDetail: drawPlayDetail,
    drawGift: drawGift,
    drawGiftDetail: drawGiftDetail
  }
}();