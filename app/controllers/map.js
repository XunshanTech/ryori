var request = require('request');

var _citys = [{
  name: '北京', key: 2
}, {
  name: '上海', key: 1
}, {
  name: '广州', key: 4
}, {
  name: '深圳', key: 7
}, {
  name: '大连', key: 19
}, {
  name: '天津', key: 10
}, {
  name: '沈阳', key: 18
}, {
  name: '青岛', key: 21
}, {
  name: '杭州', key: 3
}, {
  name: '香港', key: 'hongkong'
}]

exports.citys = _citys;

var _getCityByName = function(cityName) {
  for(var i = 0; i < _citys.length; i++) {
    if(cityName.indexOf(_citys[i].name) > -1) {
      return _citys[i];
    }
  }
  return _citys[0]; // default is beijing
}

exports.getCityByName = _getCityByName;

exports.getCityKey = function(lat, lng, cb) {
  var ak = '3abb4a5178989acf6948d5d143fc89e8';
  request('http://api.map.baidu.com/geocoder/v2/?ak=' + ak +
    '&location=' + lat + ',' + lng + '&output=json&pois=1',
    function(error, response, body) {
      if(!error && response.statusCode == 200) {
        var ret = JSON.parse(body);
        var city = ret.result.addressComponent.city;
        var cityObj = _getCityByName(city);
        return cb(null, cityObj.key, cityObj.name);
      } else {
        return cb('Get city by baidu map api failure!');
      }
    }
  )
}