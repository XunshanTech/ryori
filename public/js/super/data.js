$(function () {
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
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
      valueSuffix: '人'
    },
    series: [{
      name: '用户',
      lineWidth: 0,
      color: '#94b758',
      data: [7, 9, 12, 14, 18, 21, 25]
    }]
  })

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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
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
      valueSuffix: ''
    },
    series: [{
      name: '播放',
      borderWidth: 0,
      color: '#fa7b58',
      data: [7, 9, 12, 14, 18, 21, 25]
    }]
  })
});