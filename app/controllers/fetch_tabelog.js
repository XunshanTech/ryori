
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var http = require("http");
var request = require('request');
var phantomCheerio = require('phantom-cheerio')();
var JapanRestaurant = mongoose.model('JapanRestaurant');
var JapanSight = mongoose.model('JapanSight');
var JapanHotel = mongoose.model('JapanHotel');

var loadRestaurantLocation = function() {
  var _fetchRestaurantLocation = function() {
    console.log(index);
    if(index < length) {
      var restaurant = japanRestaurants[index];
      index++;
      if(true) {
        var name = restaurant.name;
        var address = restaurant.city + ',' + encodeURI(name);
        var link = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + address + '&key=AIzaSyCeaYURPwcsppuil4ZGnO7g465wibL9mxo';
        console.log(link);
        phantomCheerio.open(link, function($) {
          var script = $('pre').text();
          eval('var scriptObj = ' + script);
          if(scriptObj && scriptObj.status === 'OK' && scriptObj.results.length > 0) {
            var location = scriptObj.results[0].geometry.location;
            console.log(location);
            restaurant.lng = location.lng;
            restaurant.lat = location.lat;
            restaurant.save(function(err, newObj) {
              console.log('save ' + restaurant.name + ' location success, lng: ' + location.lng + ' lat: ' + location.lat);
              _fetchRestaurantLocation();
            })
          } else {
            console.log(script);
            console.log('get google map result fault!');
            _fetchRestaurantLocation();
          }
        })
      } else {
        _fetchRestaurantLocation();
      }
    }
  }

  var index = 0, length = 0;
  var japanRestaurants = [];

  JapanRestaurant.find({
    source: 'tabelog'
  }, function(err, _japanRestaurants) {
    length = _japanRestaurants.length;
    japanRestaurants = _japanRestaurants;
    _fetchRestaurantLocation();
  })

}

var _saveToDb = function(param) {
  JapanRestaurant.findByLink(param.dp_link, function(err, japanRestaurant) {
    if(!japanRestaurant) {
      japanRestaurant = new JapanRestaurant(param);
      japanRestaurant.save(function(err) {
        console.log(err || 'Save ' + param.name + ' success!');
      })
    }
  })
}

var _loadShop = function(shop_link, city, isEnd) {
  isLoadingShop = true;
  city = city || 'tokyo';
  JapanRestaurant.findByLink(shop_link, function(err, japanRestaurant) {
    if(!japanRestaurant) {
      phantomCheerio.open(shop_link, function($) {
        var param = {
          dp_link: shop_link,
          city: city,
          source: 'tabelog'
        };
        var name = $('.rd-detail-info__rst-name-ja').text().trim();
        param.name = name;

        var en_name = $('.rd-detail-info__rst-name-main').text().trim();
        param.en_name = en_name;

        var address = $('.rd-detail-info__rst-address').first().text().trim();
        param.address = address;

        var tel = $('.rd-detail-info__rst-tel').text().trim();
        param.tel = tel;

        var tabelog_rate = $('.c-rating__val.c-rating__val--strong').first().text();
        param.tabelog_rate = tabelog_rate;

        $('th').filter(function() {
          var name = $(this).text().trim();
          if(name == '营业时间') {
            var open_time = $(this).parent().find('td .translate').text().trim();
            param.open_time = open_time;
          } else if(name == '定期休假日') {
            var day_off = $(this).parent().find('td .translate').text().trim();
            param.day_off = day_off;
          } else if(name.indexOf('预算') === 0 && name.indexOf('(从使用者)') > -1) {
            var lunch = $(this).parent().find('td .c-rating__val').first();
            if(lunch) {
              lunch = parseInt(lunch.text().trim().replace('￥', '').replace(',', ''));
              lunch = isNaN(lunch) ? 0 : lunch;
              param.lunch = lunch;
            }
            var price = $(this).parent().find('td .c-rating__val').last();
            if(price) {
              price = parseInt(price.text().trim().replace('￥', '').replace(',', ''));
              price = isNaN(price) ? 0 : price;
              param.price = price;
            }
          }
        })

        console.log(shop_no + ': ' + param.name);
        shop_no++;
        isLoadingShop = false;
        if(isEnd) {
          isLoadingPage = false;
          index_page++;
        }

        _saveToDb(param);
      })
    } else {
      console.log(shop_no + ': you have added this restaurant!');
      shop_no++;
      isLoadingShop = false;
      if(isEnd) {
        isLoadingPage = false;
        index_page++;
      }
    }
  });
}

var _loadPage = function(local) {
  isLoadingPage = true;

  var __eachLoad = function(shops, $) {
    shops.each(function(i) {
      var href = $(this).attr('href');
      var isEnd = i === (shops.length - 1);
      var _checkAndLoadShop = function() {
        setTimeout(function() {
          if(!isLoadingShop) {
            _loadShop(href, local, isEnd);
          } else {
            _checkAndLoadShop();
          }
        }, time_gap);
      }
      _checkAndLoadShop();
    })
  }

  var pageUrl = dp + local + '/rstLst/' + index_page + '/?SrtT=rt&Srt=D&LstCat=RC01&Cat=RC';
  phantomCheerio.open(pageUrl, function ($) {
    var shops = $('.list-rst__name .list-rst__name-main');
    __eachLoad(shops, $);
  })
}

var _load = function(local) {
  var t = setInterval(function() {
    if(!isLoadingPage) {
      if(index_page <= all_page) {
        _loadPage(local);
      } else {
        clearInterval(t);
      }
    }
  }, time_gap);
}

var dp = 'http://tabelog.com/cn/';
var isLoadingShop = false;
var isLoadingPage = false;
var shop_no = 1;
var time_gap = 3000;

var index_page = 29;
var all_page = 60;

exports.load = function(req, res) {
  //var city = 'osaka';

  //_load(city);

/*
  JapanRestaurant.find({
    city: 'tokyo',
    michelin_level: {
      $ne: 0
    }
  }, function(err, restaurants) {
    restaurants.forEach(function(restaurant, index) {
      JapanRestaurant.find({
        name: restaurant.name,
        michelin_level: 0
      }, function(err, restaurants) {
        if(!err && restaurant) {
          console.log(index + ': ' + restaurants.length);
        } else {
          console.log(index + ': no match');
        }
      })

    })
  })
*/

  res.send({
    success: true
  })
}

